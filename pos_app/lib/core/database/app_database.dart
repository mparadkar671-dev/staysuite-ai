import 'dart:convert';
import 'package:drift/drift.dart';

part 'app_database.g.dart';

// --- TABLE DEFINITIONS ---

@DataClassName('RoomEntry')
class Rooms extends Table {
  TextColumn get id => text()();
  TextColumn get propertyId => text()();
  TextColumn get roomNumber => text()();
  TextColumn get roomType => text()();
  RealColumn get baseTariffAc => real()();
  RealColumn get baseTariffNonAc => real()();
  RealColumn get extraMattressCharge => real().withDefault(const Constant(0.0))();
  RealColumn get driverBedCharge => real().withDefault(const Constant(0.0))();
  TextColumn get housekeepingStatus => text().withDefault(const Constant('CLEAN'))();
  TextColumn get doorQrToken => text()();
  TextColumn get mediaConfig => text().withDefault(const Constant('{}'))();
  DateTimeColumn get updatedAt => dateTime()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('BookingEntry')
class Bookings extends Table {
  TextColumn get id => text()();
  TextColumn get propertyId => text()();
  TextColumn get guestName => text()();
  TextColumn get guestPhone => text()();
  DateTimeColumn get checkIn => dateTime()();
  DateTimeColumn get checkOut => dateTime()();
  TextColumn get status => text().withDefault(const Constant('CONFIRMED'))();
  TextColumn get source => text().withDefault(const Constant('WALK_IN'))();
  RealColumn get totalAmount => real().withDefault(const Constant(0.0))();
  RealColumn get advancePaid => real().withDefault(const Constant(0.0))();
  DateTimeColumn get updatedAt => dateTime()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('AllocationEntry')
class BookingRoomAllocations extends Table {
  TextColumn get id => text()();
  TextColumn get bookingId => text()();
  TextColumn get roomId => text()();
  TextColumn get propertyId => text()();
  TextColumn get roomNumber => text()();
  BoolColumn get acOpted => boolean().withDefault(const Constant(true))();
  IntColumn get extraMattressCount => integer().withDefault(const Constant(0))();
  IntColumn get driverBedCount => integer().withDefault(const Constant(0))();
  TextColumn get status => text().withDefault(const Constant('ALLOCATED'))();
  DateTimeColumn get checkIn => dateTime()();
  DateTimeColumn get checkOut => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('FolioEntry')
class Folios extends Table {
  TextColumn get id => text()();
  TextColumn get allocationId => text()();
  TextColumn get propertyId => text()();
  RealColumn get totalRoomCharge => real().withDefault(const Constant(0.0))();
  RealColumn get totalFoodCharge => real().withDefault(const Constant(0.0))();
  RealColumn get extraPersonCharge => real().withDefault(const Constant(0.0))();
  BoolColumn get waiveExtraPerson => boolean().withDefault(const Constant(false))();
  RealColumn get discountAmount => real().withDefault(const Constant(0.0))();
  RealColumn get amountPaid => real().withDefault(const Constant(0.0))();
  RealColumn get balanceDue => real().withDefault(const Constant(0.0))();
  TextColumn get status => text().withDefault(const Constant('OPEN'))();
  TextColumn get lineItems => text().withDefault(const Constant('[]'))();
  DateTimeColumn get updatedAt => dateTime()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('MenuItemEntry')
class MenuItems extends Table {
  TextColumn get id => text()();
  TextColumn get propertyId => text()();
  TextColumn get name => text()();
  TextColumn get nameLocal => text()();
  TextColumn get category => text()();
  RealColumn get price => real()();
  BoolColumn get isFreshPrep => boolean().withDefault(const Constant(true))();
  BoolColumn get isInstantSnack => boolean().withDefault(const Constant(false))();
  BoolColumn get isAvailable => boolean().withDefault(const Constant(true))();
  DateTimeColumn get updatedAt => dateTime()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('StaffUpaadEntry')
class StaffUpaadLedger extends Table {
  TextColumn get id => text()();
  TextColumn get propertyId => text()();
  TextColumn get staffId => text()();
  TextColumn get staffName => text()();
  RealColumn get amount => real()();
  DateTimeColumn get advanceDate => dateTime()();
  TextColumn get reason => text()();
  TextColumn get status => text().withDefault(const Constant('PENDING_DEDUCTION'))();
  DateTimeColumn get updatedAt => dateTime()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('SyncOutboxEntry')
class SyncOutbox extends Table {
  TextColumn get id => text()();
  TextColumn get propertyId => text()();
  TextColumn get tableName => text()();
  TextColumn get recordId => text()();
  TextColumn get operation => text()(); // INSERT, UPDATE, DELETE
  TextColumn get payload => text()();
  DateTimeColumn get clientTs => dateTime()();
  TextColumn get syncStatus => text().withDefault(const Constant('PENDING_PUSH'))(); // PENDING_PUSH, SYNCED, FAILED
  IntColumn get attempts => integer().withDefault(const Constant(0))();
  TextColumn get lastError => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

// --- DATABASE CLASS & DAO METHODS ---

@DriftDatabase(tables: [
  Rooms,
  Bookings,
  BookingRoomAllocations,
  Folios,
  MenuItems,
  StaffUpaadLedger,
  SyncOutbox,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase(QueryExecutor e) : super(e);

  @override
  int get schemaVersion => 1;

  // --- ROOM DAOs (<5ms write + Outbox Event) ---
  Future<List<RoomEntry>> getAllActiveRooms(String propertyId) =>
      (select(rooms)..where((tbl) => tbl.propertyId.equals(propertyId) & tbl.isDeleted.equals(false))).get();

  Stream<List<RoomEntry>> watchActiveRooms(String propertyId) =>
      (select(rooms)..where((tbl) => tbl.propertyId.equals(propertyId) & tbl.isDeleted.equals(false))).watch();

  Future<void> upsertRoom(RoomsCompanion entry, {bool queueOutbox = true}) async {
    await transaction(() async {
      await into(rooms).insertOnConflictUpdate(entry);
      if (queueOutbox) {
        final id = entry.id.value;
        final propId = entry.propertyId.value;
        await _queueMutation(
          propertyId: propId,
          tableName: 'rooms',
          recordId: id,
          operation: 'UPSERT',
          payload: {
            'id': id,
            'property_id': propId,
            'room_number': entry.roomNumber.value,
            'room_type': entry.roomType.value,
            'base_tariff_ac': entry.baseTariffAc.value,
            'base_tariff_non_ac': entry.baseTariffNonAc.value,
            'extra_mattress_charge': entry.extraMattressCharge.value,
            'driver_bed_charge': entry.driverBedCharge.value,
            'housekeeping_status': entry.housekeepingStatus.value,
            'door_qr_token': entry.doorQrToken.value,
            'media_config': entry.mediaConfig.value,
            'updated_at': entry.updatedAt.value.toIso8601String(),
            'is_deleted': entry.isDeleted.value,
          },
        );
      }
    });
  }

  Future<void> updateRoomHousekeeping(String roomId, String status) async {
    final now = DateTime.now().toUtc();
    await (update(rooms)..where((t) => t.id.equals(roomId))).write(
      RoomsCompanion(
        housekeepingStatus: Value(status),
        updatedAt: Value(now),
      ),
    );
  }

  // --- BOOKING & SPLIT BILLING DAOs ---
  Stream<List<BookingEntry>> watchActiveBookings(String propertyId) =>
      (select(bookings)..where((tbl) => tbl.propertyId.equals(propertyId) & tbl.isDeleted.equals(false))).watch();

  Future<void> insertLocalWalkInBooking({
    required BookingsCompanion booking,
    required List<BookingRoomAllocationsCompanion> allocations,
    required List<FoliosCompanion> foliosList,
  }) async {
    await transaction(() async {
      // 1. Insert booking
      await into(bookings).insert(booking);
      await _queueMutation(
        propertyId: booking.propertyId.value,
        tableName: 'bookings',
        recordId: booking.id.value,
        operation: 'INSERT',
        payload: {
          'id': booking.id.value,
          'property_id': booking.propertyId.value,
          'guest_name': booking.guestName.value,
          'guest_phone': booking.guestPhone.value,
          'check_in': booking.checkIn.value.toIso8601String(),
          'check_out': booking.checkOut.value.toIso8601String(),
          'status': booking.status.value,
          'source': booking.source.value,
          'total_amount': booking.totalAmount.value,
          'advance_paid': booking.advancePaid.value,
          'updated_at': booking.updatedAt.value.toIso8601String(),
        },
      );

      // 2. Insert room allocations
      for (final alloc in allocations) {
        await into(bookingRoomAllocations).insert(alloc);
        await _queueMutation(
          propertyId: alloc.propertyId.value,
          tableName: 'booking_room_allocations',
          recordId: alloc.id.value,
          operation: 'INSERT',
          payload: {
            'id': alloc.id.value,
            'booking_id': alloc.bookingId.value,
            'room_id': alloc.roomId.value,
            'property_id': alloc.propertyId.value,
            'room_number': alloc.roomNumber.value,
            'ac_opted': alloc.acOpted.value,
            'extra_mattress_count': alloc.extraMattressCount.value,
            'driver_bed_count': alloc.driverBedCount.value,
            'status': alloc.status.value,
            'check_in': alloc.checkIn.value.toIso8601String(),
            'check_out': alloc.checkOut.value.toIso8601String(),
            'updated_at': alloc.updatedAt.value.toIso8601String(),
          },
        );
      }

      // 3. Insert folios
      for (final folio in foliosList) {
        await into(folios).insert(folio);
        await _queueMutation(
          propertyId: folio.propertyId.value,
          tableName: 'folios',
          recordId: folio.id.value,
          operation: 'INSERT',
          payload: {
            'id': folio.id.value,
            'allocation_id': folio.allocationId.value,
            'property_id': folio.propertyId.value,
            'total_room_charge': folio.totalRoomCharge.value,
            'total_food_charge': folio.totalFoodCharge.value,
            'extra_person_charge': folio.extraPersonCharge.value,
            'waive_extra_person': folio.waiveExtraPerson.value,
            'discount_amount': folio.discountAmount.value,
            'amount_paid': folio.amountPaid.value,
            'balance_due': folio.balanceDue.value,
            'status': folio.status.value,
            'line_items': folio.lineItems.value,
            'updated_at': folio.updatedAt.value.toIso8601String(),
          },
        );
      }
    });
  }

  // --- PARTIAL CHECKOUT DAO (Vyapar++ Split Billing) ---
  Future<void> executeLocalPartialCheckout({
    required String allocationId,
    required String propertyId,
    required double amountPaid,
    required bool waiveExtraPerson,
    required String settlementStatus, // SETTLED or MOVED_TO_KHATA
  }) async {
    final now = DateTime.now().toUtc();
    await transaction(() async {
      // 1. Update allocation status
      await (update(bookingRoomAllocations)..where((t) => t.id.equals(allocationId))).write(
        BookingRoomAllocationsCompanion(
          status: const Value('CHECKED_OUT'),
          checkOut: Value(now),
          updatedAt: Value(now),
        ),
      );

      // 2. Fetch folio
      final folio = await (select(folios)..where((t) => t.allocationId.equals(allocationId))).getSingle();
      final double discount = waiveExtraPerson ? folio.extraPersonCharge : 0.0;
      final double finalBalance = (folio.totalRoomCharge + folio.totalFoodCharge + folio.extraPersonCharge - discount - amountPaid);

      await (update(folios)..where((t) => t.id.equals(folio.id))).write(
        FoliosCompanion(
          waiveExtraPerson: Value(waiveExtraPerson),
          discountAmount: Value(discount),
          amountPaid: Value(amountPaid),
          balanceDue: Value(finalBalance <= 0 ? 0.0 : finalBalance),
          status: Value(settlementStatus),
          updatedAt: Value(now),
        ),
      );

      // 3. Mark room as DIRTY
      final alloc = await (select(bookingRoomAllocations)..where((t) => t.id.equals(allocationId))).getSingle();
      await (update(rooms)..where((t) => t.id.equals(alloc.roomId))).write(
        RoomsCompanion(
          housekeepingStatus: const Value('DIRTY'),
          updatedAt: Value(now),
        ),
      );

      // 4. Queue atomic outbox mutation
      await _queueMutation(
        propertyId: propertyId,
        tableName: 'folios',
        recordId: folio.id,
        operation: 'PARTIAL_CHECKOUT',
        payload: {
          'allocation_id': allocationId,
          'property_id': propertyId,
          'amount_paid': amountPaid,
          'waive_extra_person': waiveExtraPerson,
          'settlement_status': settlementStatus,
          'checkout_time': now.toIso8601String(),
        },
      );
    });
  }

  // --- SYNC ENGINE DAOs ---
  Future<List<SyncOutboxEntry>> getPendingMutations(String propertyId, {int limit = 50}) =>
      (select(syncOutbox)
            ..where((tbl) => tbl.propertyId.equals(propertyId) & tbl.syncStatus.equals('PENDING_PUSH'))
            ..orderBy([(tbl) => OrderingTerm(expression: tbl.clientTs)])
            ..limit(limit))
          .get();

  Future<void> markMutationSynced(String outboxId) =>
      (update(syncOutbox)..where((tbl) => tbl.id.equals(outboxId))).write(
        const SyncOutboxCompanion(syncStatus: Value('SYNCED')),
      );

  Future<void> recordMutationFailure(String outboxId, String error) async {
    final entry = await (select(syncOutbox)..where((tbl) => tbl.id.equals(outboxId))).getSingle();
    await (update(syncOutbox)..where((tbl) => tbl.id.equals(outboxId))).write(
      SyncOutboxCompanion(
        attempts: Value(entry.attempts + 1),
        syncStatus: const Value('PENDING_PUSH'),
        lastError: Value(error),
      ),
    );
  }

  Future<void> _queueMutation({
    required String propertyId,
    required String tableName,
    required String recordId,
    required String operation,
    required Map<String, dynamic> payload,
  }) async {
    final now = DateTime.now().toUtc();
    await into(syncOutbox).insert(
      SyncOutboxCompanion(
        id: Value('${tableName}_${recordId}_${now.millisecondsSinceEpoch}'),
        propertyId: Value(propertyId),
        tableName: Value(tableName),
        recordId: Value(recordId),
        operation: Value(operation),
        payload: Value(jsonEncode(payload)),
        clientTs: Value(now),
        syncStatus: const Value('PENDING_PUSH'),
        attempts: const Value(0),
      ),
    );
  }
}
