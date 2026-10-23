import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/database/app_database.dart';
import 'core/hardware/thermal_printer_service.dart';
import 'features/ai_action_bar/ai_command_bar.dart';
import 'features/bookings_walkin/quick_walkin_dialog.dart';
import 'features/dashboard_calendar/room_calendar_view.dart';
import 'features/pos_split_billing/partial_checkout_dialog.dart';

// Riverpod Provider for local Drift database
final databaseProvider = Provider<AppDatabase>((ref) {
  return AppDatabase(NativeDatabase.memory());
});

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: StaySuitePosApp()));
}

class StaySuitePosApp extends StatelessWidget {
  const StaySuitePosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'StaySuite AI POS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const PosDashboardPage(),
    );
  }
}

class PosDashboardPage extends ConsumerStatefulWidget {
  const PosDashboardPage({super.key});

  @override
  ConsumerState<PosDashboardPage> createState() => _PosDashboardPageState();
}

class _PosDashboardPageState extends ConsumerState<PosDashboardPage> {
  final String _propertyId = 'prop_konkan_01';
  final String _propertyName = 'Konkan Kinara Beach Resort';
  final String _propertyUpiVpa = 'resort@okhdfcbank';
  final String _baseUrl = 'http://localhost:8000';
  final String _authToken = 'mock_jwt_token';

  bool _isBookingFrozen = false;
  RoomEntry? _selectedRoom;

  @override
  void initState() {
    super.initState();
    _seedSampleRooms();
  }

  void _seedSampleRooms() async {
    final db = ref.read(databaseProvider);
    final now = DateTime.now().toUtc();
    final sampleRooms = [
      RoomsCompanion.insert(
        id: 'room_101',
        propertyId: _propertyId,
        roomNumber: '101',
        roomType: 'Deluxe Sea-Facing AC',
        baseTariffAc: 3500.0,
        baseTariffNonAc: 2500.0,
        extraMattressCharge: const Value(500.0),
        driverBedCharge: const Value(300.0),
        housekeepingStatus: const Value('CLEAN'),
        doorQrToken: 'qr_tok_101',
        updatedAt: now,
      ),
      RoomsCompanion.insert(
        id: 'room_102',
        propertyId: _propertyId,
        roomNumber: '102',
        roomType: 'Family Suite AC',
        baseTariffAc: 5000.0,
        baseTariffNonAc: 3800.0,
        extraMattressCharge: const Value(500.0),
        driverBedCharge: const Value(300.0),
        housekeepingStatus: const Value('DIRTY'),
        doorQrToken: 'qr_tok_102',
        updatedAt: now,
      ),
      RoomsCompanion.insert(
        id: 'room_103',
        propertyId: _propertyId,
        roomNumber: '103',
        roomType: 'Standard Coconut Grove Non-AC',
        baseTariffAc: 2200.0,
        baseTariffNonAc: 1800.0,
        extraMattressCharge: const Value(400.0),
        driverBedCharge: const Value(250.0),
        housekeepingStatus: const Value('INSPECTION'),
        doorQrToken: 'qr_tok_103',
        updatedAt: now,
      ),
    ];

    for (final r in sampleRooms) {
      await db.upsertRoom(r, queueOutbox: false);
    }
  }

  void _handleShortcut(String action) {
    if (action == 'QUICK_WALKIN' && _selectedRoom != null) {
      _openWalkInDialog(_selectedRoom!);
    } else if (action == 'F4' || action == 'PARTIAL_CHECKOUT') {
      _openMockPartialCheckout();
    }
  }

  void _openWalkInDialog(RoomEntry room) {
    showDialog(
      context: context,
      builder: (ctx) => QuickWalkInDialog(
        room: room,
        propertyId: _propertyId,
        onConfirm: (booking, alloc, folio) async {
          final db = ref.read(databaseProvider);
          await db.insertLocalWalkInBooking(
            booking: booking,
            allocations: [alloc],
            foliosList: [folio],
          );
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Room ${room.roomNumber} Checked-In (<5ms Drift Write)!')),
            );
          }
        },
      ),
    );
  }

  void _openMockPartialCheckout() {
    final now = DateTime.now().toUtc();
    final mockAlloc = AllocationEntry(
      id: 'alloc_mock_1',
      bookingId: 'book_mock_1',
      roomId: 'room_101',
      propertyId: _propertyId,
      roomNumber: '101',
      acOpted: true,
      extraMattressCount: 1,
      driverBedCount: 0,
      status: 'CHECKED_IN',
      checkIn: now.subtract(const Duration(days: 2)),
      checkOut: now,
      updatedAt: now,
      isDeleted: false,
    );
    final mockFolio = FolioEntry(
      id: 'folio_mock_1',
      allocationId: 'alloc_mock_1',
      propertyId: _propertyId,
      totalRoomCharge: 7000.0,
      totalFoodCharge: 1250.0,
      extraPersonCharge: 1000.0,
      waiveExtraPerson: false,
      discountAmount: 0.0,
      amountPaid: 0.0,
      balanceDue: 9250.0,
      status: 'OPEN',
      lineItems: '[]',
      updatedAt: now,
      isDeleted: false,
    );

    showDialog(
      context: context,
      builder: (ctx) => PartialCheckoutDialog(
        allocation: mockAlloc,
        folio: mockFolio,
        propertyName: _propertyName,
        propertyUpiVpa: _propertyUpiVpa,
        onCheckoutConfirmed: ({required amountPaid, required waiveExtraPerson, required settlementStatus}) async {
          final db = ref.read(databaseProvider);
          await db.executeLocalPartialCheckout(
            allocationId: mockAlloc.id,
            propertyId: _propertyId,
            amountPaid: amountPaid,
            waiveExtraPerson: waiveExtraPerson,
            settlementStatus: settlementStatus,
          );
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Room 101 Partial Checkout Complete ($settlementStatus)!')),
            );
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final db = ref.watch(databaseProvider);

    return Shortcuts(
      shortcuts: posDefaultShortcuts,
      child: Actions(
        actions: {
          PosShortcutsIntent: CallbackAction<PosShortcutsIntent>(
            onInvoke: (intent) => _handleShortcut(intent.action),
          ),
        },
        child: Focus(
          autofocus: true,
          child: Scaffold(
            appBar: AppBar(
              title: Row(
                children: [
                  const Icon(Icons.beach_access, color: Colors.indigo),
                  const SizedBox(width: 8),
                  Text(_propertyName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: Colors.green.shade100, borderRadius: BorderRadius.circular(12)),
                    child: const Text('Offline Drift Active (<5ms)', style: TextStyle(fontSize: 11, color: Colors.green)),
                  ),
                ],
              ),
              actions: [
                TextButton.icon(
                  icon: const Icon(Icons.flash_on, size: 16),
                  label: const Text('F1 Walk-In'),
                  onPressed: () {
                    if (_selectedRoom != null) {
                      _openWalkInDialog(_selectedRoom!);
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select a room first')));
                    }
                  },
                ),
                TextButton.icon(
                  icon: const Icon(Icons.receipt_long, size: 16),
                  label: const Text('F4 Split Checkout'),
                  onPressed: _openMockPartialCheckout,
                ),
                const SizedBox(width: 16),
              ],
            ),
            body: Column(
              children: [
                // Global AI Settings Search & Action Bar
                AiCommandBar(
                  baseUrl: _baseUrl,
                  propertyId: _propertyId,
                  authToken: _authToken,
                  onExecuteAction: (action) {
                    if (action['intent_type'] == 'FREEZE_AVAILABILITY') {
                      setState(() => _isBookingFrozen = true);
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Action Executed: ${action['action_summary']}')),
                    );
                  },
                ),

                // Main Master-Detail Room Calendar View
                Expanded(
                  child: StreamBuilder<List<RoomEntry>>(
                    stream: db.watchActiveRooms(_propertyId),
                    builder: (context, snapshot) {
                      final rooms = snapshot.data ?? [];
                      return RoomCalendarView(
                        rooms: rooms,
                        isBookingFrozen: _isBookingFrozen,
                        onToggleFreeze: (frozen) => setState(() => _isBookingFrozen = frozen),
                        onSelectRoom: (room) {
                          setState(() => _selectedRoom = room);
                          _openWalkInDialog(room);
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
