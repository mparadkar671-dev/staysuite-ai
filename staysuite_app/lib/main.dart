import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/database/app_database.dart';
import 'core/hardware/thermal_printer_service.dart';
import 'features/ai_action_bar/ai_command_bar.dart';
import 'features/auth_role_login/role_login_dialog.dart';
import 'features/bookings_walkin/quick_walkin_dialog.dart';
import 'features/dashboard_calendar/room_calendar_view.dart';
import 'features/employee_self_service/employee_self_service_dialog.dart';
import 'features/pos_split_billing/partial_checkout_dialog.dart';
import 'features/role_dashboards/role_operational_view.dart';
import 'features/rooms_setup/room_setup_wizard_dialog.dart';

// Riverpod Provider for local Drift database (<5ms optimistic reads/writes)
final databaseProvider = Provider<AppDatabase>((ref) {
  return AppDatabase(NativeDatabase.memory());
});

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: StaySuiteBusinessOSApp()));
}

class StaySuiteBusinessOSApp extends StatelessWidget {
  const StaySuiteBusinessOSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'StaySuite AI Business OS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F46E5),
          brightness: Brightness.light,
          primary: const Color(0xFF4F46E5),
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        useMaterial3: true,
        fontFamily: 'Roboto',
      ),
      home: const BusinessOSMasterPage(),
    );
  }
}

class BusinessOSMasterPage extends ConsumerStatefulWidget {
  const BusinessOSMasterPage({super.key});

  @override
  ConsumerState<BusinessOSMasterPage> createState() => _BusinessOSMasterPageState();
}

class _BusinessOSMasterPageState extends ConsumerState<BusinessOSMasterPage> {
  final String _propertyId = 'prop_konkan_01';
  final String _propertyName = 'Saguntara Beach Homestay';
  final String _propertyUpiVpa = 'saguntara@icici';
  final String _businessCode = 'SS-HM-1001';

  String _currentRole = 'OWNER';
  String _currentStaffName = 'Mahesh Paradkar';
  bool _isBookingFrozen = false;
  RoomEntry? _selectedRoom;
  int _activeNavIndex = 0; // 0: Pulse/Dashboard, 1: Calendar, 2: Kitchen, 3: Billing, 4: My Workspace

  // UTR pending verification alert state
  bool _utrPending = true;
  final String _pendingUtr = '482910482910';
  final double _pendingAdvance = 3500.0;

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
        roomType: 'Family Suite AC Cottage',
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
        roomType: 'Garden View Standard',
        baseTariffAc: 2800.0,
        baseTariffNonAc: 2000.0,
        extraMattressCharge: const Value(400.0),
        driverBedCharge: const Value(200.0),
        housekeepingStatus: const Value('CLEAN'),
        doorQrToken: 'qr_tok_103',
        updatedAt: now,
      ),
    ];

    for (final room in sampleRooms) {
      await db.into(db.rooms).insertOnConflictUpdate(room);
    }
  }

  // Keyboard shortcut listener (Desktop/Web)
  KeyEventResult _handleKeyEvent(FocusNode node, KeyEvent event) {
    if (event is KeyDownEvent) {
      if (event.logicalKey == LogicalKeyboardKey.f1) {
        _openQuickWalkIn();
        return KeyEventResult.handled;
      } else if (event.logicalKey == LogicalKeyboardKey.f2) {
        setState(() => _activeNavIndex = 2);
        return KeyEventResult.handled;
      } else if (event.logicalKey == LogicalKeyboardKey.f4) {
        _openPartialCheckoutDialog();
        return KeyEventResult.handled;
      }
    }
    return KeyEventResult.ignored;
  }

  void _openQuickWalkIn() {
    showDialog(
      context: context,
      builder: (_) => QuickWalkInDialog(
        propertyId: _propertyId,
        availableRooms: [
          {'id': 'room_101', 'number': '101', 'type': 'Deluxe AC', 'rateAc': 3500.0, 'rateNonAc': 2500.0},
          {'id': 'room_103', 'number': '103', 'type': 'Garden View', 'rateAc': 2800.0, 'rateNonAc': 2000.0},
        ],
        onBookingCreated: () {
          setState(() {});
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Walk-in booking confirmed & synchronized to cloud!')),
          );
        },
      ),
    );
  }

  void _openPartialCheckoutDialog() {
    showDialog(
      context: context,
      builder: (_) => PartialCheckoutDialog(
        bookingId: 'sample-bkg-8821',
        allocationId: 'alloc-rm-101',
        roomNumber: _selectedRoom?.roomNumber ?? '101',
        guestName: 'Rahul Verma (Group Booking)',
        roomCharges: 7000.0,
        foodCharges: 1450.0,
        advancePaid: 3500.0,
        upiVpa: _propertyUpiVpa,
        onCheckoutCompleted: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Partial Checkout completed: Room 101 marked DIRTY and Folio settled.')),
          );
        },
      ),
    );
  }

  void _open7AmMarketCalculator() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.shopping_basket_outlined, color: Color(0xFFD97706)),
            SizedBox(width: 8),
            Text('7 AM Fish & Veg Market BOM', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Calculated deterministically from yesterday\'s 24h & 4h guest meal pre-orders:',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: const Column(
                children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('🐟 Fresh Surmai (Kingfish):', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    Text('4.5 kg (Market Cut)', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF92400E))),
                  ]),
                  SizedBox(height: 6),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('🐟 Silver Pomfret:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    Text('8 medium pieces', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF92400E))),
                  ]),
                  SizedBox(height: 6),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('🌾 Rice Flour (Bhakri):', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    Text('5.0 kg', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF92400E))),
                  ]),
                  SizedBox(height: 6),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('🥥 Fresh Coconut (Nariyal):', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    Text('6 whole coconuts', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF92400E))),
                  ]),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
          ElevatedButton.icon(
            icon: const Icon(Icons.share, size: 16),
            label: const Text('Share to WhatsApp Buyer'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Market list copied & shared to WhatsApp Fish Buyer!')),
              );
            },
          ),
        ],
      ),
    );
  }

  void _openExpenseKiranaDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('10-Category Expense & Auto-Kirana', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: SizedBox(
          width: 400,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                dense: true,
                leading: const Icon(Icons.local_grocery_store_outlined, color: Colors.indigo),
                title: const Text('Auto-Kirana Low Stock Purchase List'),
                subtitle: const Text('Cooking Oil (2L left), Turmeric (100g), Rice'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {},
              ),
              ListTile(
                dense: true,
                leading: const Icon(Icons.payments_outlined, color: Colors.emerald),
                title: const Text('Record Operating Expense'),
                subtitle: const Text('Gas cylinder, staff wage, fish purchase, electricity'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {},
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Done')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final db = ref.watch(databaseProvider);
    final isDesktop = MediaQuery.of(context).size.width >= 900;

    return Focus(
      autofocus: true,
      onKeyEvent: _handleKeyEvent,
      child: StreamBuilder<List<RoomEntry>>(
        stream: db.select(db.rooms).watch(),
        builder: (context, snapshot) {
          final rooms = snapshot.data ?? [];

          return Scaffold(
            appBar: AppBar(
              backgroundColor: const Color(0xFF0F172A),
              foregroundColor: Colors.white,
              elevation: 0,
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4F46E5),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text('STAYSUITE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.2)),
                  ),
                  const SizedBox(width: 10),
                  Text(_propertyName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(_businessCode, style: const TextStyle(fontSize: 10, fontFamily: 'monospace')),
                  ),
                ],
              ),
              actions: [
                // 1-Tap Master Room Freeze Switch (Hick's Law / Fitts's Law)
                Row(
                  children: [
                    Text(
                      _isBookingFrozen ? 'FROZEN' : 'ACTIVE',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: _isBookingFrozen ? Colors.redAccent : Colors.greenAccent,
                      ),
                    ),
                    Switch(
                      value: !_isBookingFrozen,
                      activeColor: Colors.greenAccent,
                      activeTrackColor: Colors.green.shade900,
                      inactiveThumbColor: Colors.redAccent,
                      inactiveTrackColor: Colors.red.shade900,
                      onChanged: (val) {
                        setState(() => _isBookingFrozen = !val);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              _isBookingFrozen
                                  ? '⚠️ Master Freeze Engaged: Online OTA & Direct bookings locked!'
                                  : '✅ Master Freeze Lifted: Booking engine live!',
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(width: 8),

                // AI Action Bar Trigger (Ctrl+K)
                IconButton(
                  tooltip: 'AI Copilot Action Bar (Ctrl+K)',
                  icon: const Icon(Icons.auto_awesome, color: Color(0xFFA5B4FC)),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (_) => AiCommandBar(
                        propertyId: _propertyId,
                        rooms: rooms,
                        onFreezeToggled: (v) => setState(() => _isBookingFrozen = v),
                        onRoomUpdated: () => setState(() {}),
                      ),
                    );
                  },
                ),

                // 4-Step Role Login Switcher
                Padding(
                  padding: const EdgeInsets.only(right: 12.0),
                  child: InkWell(
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (_) => RoleLoginDialog(
                          initialBusinessCode: _businessCode,
                          onLoginSuccess: (token, role, staffName, businessCode, features) {
                            setState(() {
                              _currentRole = role;
                              _currentStaffName = staffName;
                            });
                          },
                        ),
                      );
                    },
                    child: Chip(
                      avatar: CircleAvatar(
                        backgroundColor: const Color(0xFF4F46E5),
                        child: Text(_currentRole[0], style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                      label: Text('$_currentRole: $_currentStaffName', style: const TextStyle(fontSize: 11, color: Colors.white)),
                      backgroundColor: const Color(0xFF1E293B),
                    ),
                  ),
                ),
              ],
            ),
            body: Row(
              children: [
                // DESKTOP / WEB COLLAPSIBLE SIDEBAR (width >= 900)
                if (isDesktop)
                  NavigationRail(
                    selectedIndex: _activeNavIndex,
                    onDestinationSelected: (idx) => setState(() => _activeNavIndex = idx),
                    labelType: NavigationRailLabelType.all,
                    backgroundColor: Colors.white,
                    selectedIconTheme: const IconThemeData(color: Color(0xFF4F46E5)),
                    unselectedIconTheme: const IconThemeData(color: Color(0xFF64748B)),
                    selectedLabelTextStyle: const TextStyle(color: Color(0xFF4F46E5), fontWeight: FontWeight.bold, fontSize: 11),
                    unselectedLabelTextStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                    destinations: const [
                      NavigationRailDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: Text('Pulse')),
                      NavigationRailDestination(icon: Icon(Icons.calendar_month_outlined), selectedIcon: Icon(Icons.calendar_month), label: Text('Tape Chart [F1]')),
                      NavigationRailDestination(icon: Icon(Icons.soup_kitchen_outlined), selectedIcon: Icon(Icons.soup_kitchen), label: Text('Kitchen [F2]')),
                      NavigationRailDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: Text('Khata & POS [F4]')),
                      NavigationRailDestination(icon: Icon(Icons.badge_outlined), selectedIcon: Icon(Icons.badge), label: Text('My Workspace')),
                    ],
                  ),

                // MAIN CONTENT VIEW
                Expanded(
                  child: Column(
                    children: [
                      // MOBILE PULSE TOP ALERT CARDS (UTR Payment Verification & Cut-off alerts)
                      if (_utrPending)
                        Container(
                          margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.security, color: Color(0xFF2563EB), size: 22),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Direct Booking Advance Awaiting Verification', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E3A8A))),
                                    Text('Rahul Verma paid ₹$_pendingAdvance via UPI (UTR: $_pendingUtr)', style: const TextStyle(fontSize: 12, color: Color(0xFF3B82F6))),
                                  ],
                                ),
                              ),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF10B981),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                ),
                                onPressed: () {
                                  setState(() => _utrPending = false);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Payment Approved! Booking BK-KK-8921 confirmed.')),
                                  );
                                },
                                child: const Text('1-Tap Approve', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        ),

                      Expanded(
                        child: _buildCurrentView(rooms),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // MOBILE PULSE BOTTOM NAVIGATION BAR (width < 900)
            bottomNavigationBar: isDesktop
                ? null
                : NavigationBar(
                    selectedIndex: _activeNavIndex,
                    onDestinationSelected: (idx) => setState(() => _activeNavIndex = idx),
                    destinations: const [
                      NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Pulse'),
                      NavigationDestination(icon: Icon(Icons.calendar_month_outlined), selectedIcon: Icon(Icons.calendar_month), label: 'Rooms'),
                      NavigationDestination(icon: Icon(Icons.soup_kitchen_outlined), selectedIcon: Icon(Icons.soup_kitchen), label: 'KOT'),
                      NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Khata'),
                      NavigationDestination(icon: Icon(Icons.badge_outlined), selectedIcon: Icon(Icons.badge), label: 'Workspace'),
                    ],
                  ),
          );
        },
      ),
    );
  }

  Widget _buildCurrentView(List<RoomEntry> rooms) {
    switch (_activeNavIndex) {
      case 0:
        return _buildPulseOverview(rooms);
      case 1:
        return RoomCalendarView(
          rooms: rooms,
          isBookingFrozen: _isBookingFrozen,
          onToggleFreeze: (v) => setState(() => _isBookingFrozen = v),
          onSelectRoom: (r) => setState(() => _selectedRoom = r),
        );
      case 2:
        return RoleOperationalView(
          activeRole: 'COOK',
          propertyId: _propertyId,
          rooms: rooms,
          isBookingFrozen: _isBookingFrozen,
          onToggleFreeze: (v) => setState(() => _isBookingFrozen = v),
          onSelectRoom: (r) => setState(() => _selectedRoom = r),
        );
      case 3:
        return _buildKhataBillingTab();
      case 4:
        return EmployeeSelfServiceDialog(
          propertyId: _propertyId,
          currentStaffName: _currentStaffName,
          currentRole: _currentRole,
        );
      default:
        return _buildPulseOverview(rooms);
    }
  }

  Widget _buildPulseOverview(List<RoomEntry> rooms) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Quick Action Pill Bar
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ActionChip(
                avatar: const Icon(Icons.person_add, size: 16, color: Color(0xFF4F46E5)),
                label: const Text('F1 Walk-in Check-in'),
                onPressed: _openQuickWalkIn,
              ),
              ActionChip(
                avatar: const Icon(Icons.shopping_basket, size: 16, color: Color(0xFFD97706)),
                label: const Text('7 AM Market Calculator'),
                onPressed: _open7AmMarketCalculator,
              ),
              ActionChip(
                avatar: const Icon(Icons.call_split, size: 16, color: Color(0xFF059669)),
                label: const Text('F4 Split Checkout'),
                onPressed: _openPartialCheckoutDialog,
              ),
              ActionChip(
                avatar: const Icon(Icons.receipt_long, size: 16, color: Color(0xFF64748B)),
                label: const Text('Expenses & Kirana'),
                onPressed: _openExpenseKiranaDialog,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Operational Status Grid
          GridView.count(
            crossAxisCount: MediaQuery.of(context).size.width < 600 ? 2 : 4,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              _buildPulseCard('Today\'s Check-Ins', '3 Parties', '1 Awaiting UTR Verification', Colors.indigo, Icons.login),
              _buildPulseCard('Occupancy', '66.7%', '2 of 3 Rooms Occupied', Colors.emerald, Icons.hotel),
              _buildPulseCard('Live KOTs in Kitchen', '4 Orders', 'Dinner cutoff: 42m', Colors.amber.shade800, Icons.restaurant),
              _buildPulseCard('Unsettled Khata', '₹14,200', '3 WhatsApp reminders sent', Colors.blueGrey, Icons.menu_book),
            ],
          ),

          const SizedBox(height: 20),
          const Text('Active Rooms Quick Pulse', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A))),
          const SizedBox(height: 8),

          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: rooms.length,
            itemBuilder: (ctx, i) {
              final r = rooms[i];
              final isClean = r.housekeepingStatus == 'CLEAN';
              return Card(
                elevation: 0,
                color: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: isClean ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
                    child: Text(r.roomNumber, style: TextStyle(fontWeight: FontWeight.bold, color: isClean ? const Color(0xFF059669) : const Color(0xFFDC2626))),
                  ),
                  title: Text('Room ${r.roomNumber} • ${r.roomType}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: Text('AC: ₹${r.baseTariffAc.toInt()} • Non-AC: ₹${r.baseTariffNonAc.toInt()} • Housekeeping: ${r.housekeepingStatus}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.print_outlined, size: 20),
                        tooltip: 'Print Thermal KOT / Receipt',
                        onPressed: () {
                          ThermalPrinterService().printCustomerReceipt(
                            propertyName: _propertyName,
                            roomNumber: r.roomNumber,
                            guestName: 'Rahul Verma',
                            lineItems: [
                              {'description': 'AC Stay (2 Nights)', 'amount': 7000.0},
                              {'description': 'Surmai Thali Dining', 'amount': 1450.0},
                            ],
                            total: 8450.0,
                            advancePaid: 3500.0,
                            balanceDue: 4950.0,
                          );
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Sent ESC/POS byte stream to Bluetooth/USB Thermal Printer!')),
                          );
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.call_split, color: Color(0xFF4F46E5), size: 20),
                        tooltip: 'Partial Split Checkout',
                        onPressed: () {
                          setState(() => _selectedRoom = r);
                          _openPartialCheckoutDialog();
                        },
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPulseCard(String title, String val, String subtitle, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey.shade600)),
              Icon(icon, size: 16, color: color),
            ],
          ),
          Text(val, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Color(0xFF0F172A))),
          Text(subtitle, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildKhataBillingTab() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Customer Khata & Split Folios', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  Text('Vyapar++ credit ledgers with 1-tap WhatsApp payment reminders', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ],
              ),
              ElevatedButton.icon(
                icon: const Icon(Icons.message, size: 16),
                label: const Text('Send All WhatsApp Reminders'),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.white),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('WhatsApp reminders dispatched to 3 pending Khata accounts!')),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView(
              children: [
                _buildKhataCard('Anand Sawant (Local Regular)', '+91 98230 44551', 4200.0, 5000.0, '2 Pending dinners'),
                _buildKhataCard('Mangesh Kadam (Tour Operator)', '+91 94220 11992', 10000.0, 20000.0, 'Group stay advance due'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKhataCard(String name, String phone, double balance, double limit, String note) {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: Color(0xFFEFF6FF),
          child: Icon(Icons.account_balance_wallet, color: Color(0xFF2563EB)),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text('$phone • $note\nLimit: ₹${limit.toInt()}'),
        isThreeLine: true,
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('₹${balance.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFFDC2626))),
            const Text('Outstanding Balance', style: TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
