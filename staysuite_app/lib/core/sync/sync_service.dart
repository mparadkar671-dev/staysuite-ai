import 'dart:async';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:drift/drift.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../database/app_database.dart';

class SyncService {
  final AppDatabase db;
  final Dio dio;
  final String baseUrl;
  final String propertyId;
  final String authToken;

  DateTime? _lastPulledAt;
  Timer? _periodicSyncTimer;
  WebSocketChannel? _wsChannel;
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;
  bool _isSyncing = false;

  SyncService({
    required this.db,
    required this.dio,
    required this.baseUrl,
    required this.propertyId,
    required this.authToken,
  });

  void startSyncWorker() {
    // 1. Listen for network connectivity changes
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen((result) {
      if (result != ConnectivityResult.none) {
        triggerSyncCycle();
      }
    });

    // 2. Periodic sync every 30 seconds
    _periodicSyncTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      triggerSyncCycle();
    });

    // 3. Connect real-time WebSocket listener
    _connectWebSocket();

    // 4. Initial pull and push
    triggerSyncCycle();
  }

  void _connectWebSocket() {
    try {
      final wsUrl = baseUrl.replaceFirst('http', 'ws');
      final uri = Uri.parse('$wsUrl/api/v1/ws/$propertyId?token=$authToken');
      _wsChannel = WebSocketChannel.connect(uri);

      _wsChannel?.stream.listen(
        (message) {
          // Received real-time broadcast (e.g. Door QR scan, OTA booking ingest)
          triggerSyncCycle();
        },
        onError: (err) {
          // Reconnect on error after delay
          Future.delayed(const Duration(seconds: 10), _connectWebSocket);
        },
        onDone: () {
          Future.delayed(const Duration(seconds: 5), _connectWebSocket);
        },
      );
    } catch (_) {
      // Offline or network error, will retry
    }
  }

  Future<void> triggerSyncCycle() async {
    if (_isSyncing) return;
    _isSyncing = true;
    try {
      // Step A: Push local mutations to Cloud PostgreSQL
      await pushOutbox();

      // Step B: Pull delta changes from Cloud to local SQLite
      await pullDeltas();
    } finally {
      _isSyncing = false;
    }
  }

  Future<void> pushOutbox() async {
    final pending = await db.getPendingMutations(propertyId, limit: 50);
    if (pending.isEmpty) return;

    final mutationsList = pending.map((item) {
      return {
        'id': item.id,
        'table_name': item.tableName,
        'record_id': item.recordId,
        'operation': item.operation,
        'payload': jsonDecode(item.payload),
        'client_ts': item.clientTs.toIso8601String(),
      };
    }).toList();

    try {
      final response = await dio.post(
        '$baseUrl/api/v1/sync/push',
        data: {
          'property_id': propertyId,
          'mutations': mutationsList,
        },
        options: Options(headers: {'Authorization': 'Bearer $authToken'}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        for (final item in pending) {
          await db.markMutationSynced(item.id);
        }
      }
    } catch (e) {
      for (final item in pending) {
        await db.recordMutationFailure(item.id, e.toString());
      }
    }
  }

  Future<void> pullDeltas() async {
    try {
      final sinceIso = _lastPulledAt?.toIso8601String() ?? '1970-01-01T00:00:00Z';
      final response = await dio.get(
        '$baseUrl/api/v1/sync/pull',
        queryParameters: {
          'property_id': propertyId,
          'since': sinceIso,
        },
        options: Options(headers: {'Authorization': 'Bearer $authToken'}),
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final serverTs = DateTime.tryParse(data['server_ts'] ?? '') ?? DateTime.now().toUtc();
        final changes = data['changes'] as Map<String, dynamic>? ?? {};

        await db.transaction(() async {
          // Upsert rooms
          if (changes['rooms'] != null) {
            for (final r in changes['rooms']) {
              await db.upsertRoom(
                RoomsCompanion(
                  id: Value(r['id']),
                  propertyId: Value(r['property_id']),
                  roomNumber: Value(r['room_number']),
                  roomType: Value(r['room_type']),
                  baseTariffAc: Value((r['base_tariff_ac'] as num).toDouble()),
                  baseTariffNonAc: Value((r['base_tariff_non_ac'] as num).toDouble()),
                  extraMattressCharge: Value(((r['extra_mattress_charge'] ?? 0) as num).toDouble()),
                  driverBedCharge: Value(((r['driver_bed_charge'] ?? 0) as num).toDouble()),
                  housekeepingStatus: Value(r['housekeeping_status'] ?? 'CLEAN'),
                  doorQrToken: Value(r['door_qr_token'] ?? ''),
                  mediaConfig: Value(jsonEncode(r['media_config'] ?? {})),
                  updatedAt: Value(DateTime.parse(r['updated_at'])),
                  isDeleted: Value(r['is_deleted'] ?? false),
                ),
                queueOutbox: false,
              );
            }
          }
        });

        _lastPulledAt = serverTs;
      }
    } catch (_) {
      // Offline fallback: continue smoothly without throwing UI disruptions
    }
  }

  void dispose() {
    _periodicSyncTimer?.cancel();
    _connectivitySubscription?.cancel();
    _wsChannel?.sink.close();
  }
}
