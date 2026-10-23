import 'package:flutter/material.dart';
import '../../core/database/app_database.dart';

class RoomCalendarView extends StatefulWidget {
  final List<RoomEntry> rooms;
  final bool isBookingFrozen;
  final Function(bool) onToggleFreeze;
  final Function(RoomEntry) onSelectRoom;

  const RoomCalendarView({
    super.key,
    required this.rooms,
    required this.isBookingFrozen,
    required this.onToggleFreeze,
    required this.onSelectRoom,
  });

  @override
  State<RoomCalendarView> createState() => _RoomCalendarViewState();
}

class _RoomCalendarViewState extends State<RoomCalendarView> {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Top Action Bar with 1-Click Emergency Room Freeze Toggle
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: widget.isBookingFrozen ? Colors.red.shade50 : Colors.white,
            border: Border(bottom: BorderSide(color: Colors.grey.shade300)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Storefront & OTA Availability Status',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: widget.isBookingFrozen ? Colors.red.shade900 : Colors.black87,
                      ),
                    ),
                    Text(
                      widget.isBookingFrozen
                          ? 'EMERGENCY FREEZE ACTIVE: Zero rooms open on Direct Storefront & OTAs'
                          : 'LIVE: Direct storefront & connected OTAs accepting guest reservations',
                      style: TextStyle(
                        fontSize: 12,
                        color: widget.isBookingFrozen ? Colors.red.shade700 : Colors.green.shade800,
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  Icon(
                    widget.isBookingFrozen ? Icons.ac_unit : Icons.check_circle,
                    color: widget.isBookingFrozen ? Colors.red : Colors.green,
                  ),
                  const SizedBox(width: 8),
                  Switch.adaptive(
                    value: widget.isBookingFrozen,
                    activeColor: Colors.red,
                    onChanged: (val) {
                      widget.onToggleFreeze(val);
                    },
                  ),
                  Text(
                    widget.isBookingFrozen ? 'FROZEN' : 'ACTIVE',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: widget.isBookingFrozen ? Colors.red : Colors.green,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Grid of Room Cards with Live Housekeeping & AC/Non-AC status
        Expanded(
          child: widget.rooms.isEmpty
              ? const Center(child: Text('No rooms configured yet.'))
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 280,
                    childAspectRatio: 1.15,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: widget.rooms.length,
                  itemBuilder: (context, index) {
                    final room = widget.rooms[index];
                    final isDirty = room.housekeepingStatus == 'DIRTY';
                    final isCleaning = room.housekeepingStatus == 'INSPECTION';

                    Color statusColor = Colors.green;
                    if (isDirty) statusColor = Colors.red;
                    if (isCleaning) statusColor = Colors.orange;

                    return Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: statusColor.withOpacity(0.4), width: 1.5),
                      ),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () => widget.onSelectRoom(room),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Room ${room.roomNumber}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: statusColor.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      room.housekeepingStatus,
                                      style: TextStyle(
                                        color: statusColor,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                room.roomType,
                                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                              ),
                              const Spacer(),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'AC: ₹${room.baseTariffAc.toInt()}',
                                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                                      ),
                                      Text(
                                        'Non-AC: ₹${room.baseTariffNonAc.toInt()}',
                                        style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.indigo.shade50,
                                      foregroundColor: Colors.indigo.shade800,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      minimumSize: Size.zero,
                                    ),
                                    onPressed: () => widget.onSelectRoom(room),
                                    child: const Text('Manage', style: TextStyle(fontSize: 12)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
