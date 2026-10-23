import 'package:flutter/material.dart';
import '../../core/database/app_database.dart';
import '../dashboard_calendar/room_calendar_view.dart';

class RoleOperationalView extends StatelessWidget {
  final String activeRole;
  final String propertyId;
  final List<RoomEntry> rooms;
  final bool isBookingFrozen;
  final Function(bool) onToggleFreeze;
  final Function(RoomEntry) onSelectRoom;

  const RoleOperationalView({
    super.key,
    required this.activeRole,
    required this.propertyId,
    required this.rooms,
    required this.isBookingFrozen,
    required this.onToggleFreeze,
    required this.onSelectRoom,
  });

  @override
  Widget build(BuildContext context) {
    if (activeRole == 'COOK') {
      return _buildCookKitchenView(context);
    } else if (activeRole == 'STAFF_HOUSEKEEPING') {
      return _buildHousekeepingView(context);
    } else if (activeRole == 'WAITER') {
      return _buildWaiterView(context);
    }

    // Default: OWNER / MANAGER / ACCOUNTANT
    return RoomCalendarView(
      rooms: rooms,
      isBookingFrozen: isBookingFrozen,
      onToggleFreeze: onToggleFreeze,
      onSelectRoom: onSelectRoom,
    );
  }

  Widget _buildCookKitchenView(BuildContext context) {
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
                  Text('🧑‍🍳 Live Kitchen KOT Queue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  Text('Homestay 24h & 4h fresh market cut-off orders', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ],
              ),
              ElevatedButton.icon(
                icon: const Icon(Icons.shopping_bag_outlined, size: 16),
                label: const Text('7 AM Market Shopping List'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.amber.shade800,
                  foregroundColor: Colors.white,
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Morning BOM: 4.5kg Surmai, 3kg Pomfret, 5kg Rice Flour (Bhakri)')),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView(
              children: [
                _buildKotTicket(
                  room: 'Room 101',
                  items: '2x Surmai Thali (Extra Solkadhi), 1x Prawns Masala',
                  timer: 'Prep Time: 25 mins',
                  status: 'IN_PREP',
                  statusColor: Colors.amber.shade800,
                ),
                _buildKotTicket(
                  room: 'Room 102',
                  items: '3x Traditional Veg Pithla Bhakri with Thecha',
                  timer: 'Prep Time: 15 mins',
                  status: 'READY_TO_SERVE',
                  statusColor: Colors.green,
                ),
                _buildKotTicket(
                  room: 'Table 4 (Deck)',
                  items: '1x Pomfret Fry, 2x Kothimbir Vadi, 2x Ukadiche Modak',
                  timer: 'Pre-ordered for 8:30 PM',
                  status: 'SCHEDULED',
                  statusColor: Colors.blue,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKotTicket({
    required String room,
    required String items,
    required String timer,
    required String status,
    required Color statusColor,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(room, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                const SizedBox(height: 4),
                Text(items, style: const TextStyle(fontSize: 13, color: Colors.black87)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.timer_outlined, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(timer, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Text(
                status.replaceAll('_', ' '),
                style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 11),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHousekeepingView(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('🧹 Assigned Room Cleaning Queue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const Text('Scan Door QR or tap below to toggle [🟢 खोली साफ झाली]', style: TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: rooms.length,
              itemBuilder: (ctx, i) {
                final r = rooms[i];
                final isClean = r.housekeepingStatus == 'CLEAN';
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: isClean ? Colors.green.shade100 : Colors.red.shade100,
                      child: Icon(
                        isClean ? Icons.check : Icons.cleaning_services_outlined,
                        color: isClean ? Colors.green : Colors.red,
                      ),
                    ),
                    title: Text('Room ${r.roomNumber} (${r.roomType})', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Status: ${r.housekeepingStatus} • Door QR: ${r.doorQrToken}'),
                    trailing: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isClean ? Colors.grey.shade200 : Colors.green,
                        foregroundColor: isClean ? Colors.black87 : Colors.white,
                      ),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Room ${r.roomNumber} toggled to ${isClean ? "DIRTY" : "CLEAN"}!')),
                        );
                      },
                      child: Text(isClean ? 'Mark Dirty' : 'Tap Cleaned'),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWaiterView(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('🍽️ Waiter Table & Room Service KOT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const Text('Direct order taking with instant kitchen routing', style: TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 16),
          Expanded(
            child: GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              children: [
                _buildTableCard('Deck Table 1', 'Occupied • 4 Guests', Colors.indigo),
                _buildTableCard('Deck Table 2', 'Vacant • Ready', Colors.green),
                _buildTableCard('Garden Table 3', 'Order in Prep (10m)', Colors.amber.shade800),
                _buildTableCard('Room 101 Service', 'Food Delivered', Colors.blue),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTableCard(String title, String status, Color color) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            Text(status, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.bold)),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Icon(Icons.add_shopping_cart, color: color, size: 20),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
