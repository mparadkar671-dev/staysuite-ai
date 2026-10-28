import 'package:drift/drift.dart' as d;
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../../core/database/app_database.dart';

class QuickWalkInDialog extends StatefulWidget {
  final RoomEntry room;
  final String propertyId;
  final Function(BookingsCompanion, BookingRoomAllocationsCompanion, FoliosCompanion) onConfirm;

  const QuickWalkInDialog({
    super.key,
    required this.room,
    required this.propertyId,
    required this.onConfirm,
  });

  @override
  State<QuickWalkInDialog> createState() => _QuickWalkInDialogState();
}

class _QuickWalkInDialogState extends State<QuickWalkInDialog> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _acOpted = true;
  int _extraMattressCount = 0;
  int _driverBedCount = 0;
  int _nights = 1;

  double get _currentRoomRate => _acOpted ? widget.room.baseTariffAc : widget.room.baseTariffNonAc;
  double get _extraPersonTotal =>
      (_extraMattressCount * widget.room.extraMattressCharge + _driverBedCount * widget.room.driverBedCharge) * _nights;
  double get _totalEstimate => (_currentRoomRate * _nights) + _extraPersonTotal;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Quick Walk-In: Room ${widget.room.roomNumber}'),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 420,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Guest Full Name *',
                  prefixIcon: Icon(Icons.person),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'WhatsApp Phone Number *',
                  prefixIcon: Icon(Icons.phone),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              // Dynamic AC vs. Non-AC Tariff Toggle
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _acOpted ? Colors.blue.shade50 : Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: _acOpted ? Colors.blue.shade200 : Colors.amber.shade300),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _acOpted ? '❄️ AC Tariff Selected' : '🌿 Non-AC Tariff Selected',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          '₹${_currentRoomRate.toInt()} / night',
                          style: TextStyle(color: Colors.grey.shade800, fontSize: 13),
                        ),
                      ],
                    ),
                    Switch.adaptive(
                      value: _acOpted,
                      activeColor: Colors.blue,
                      onChanged: (val) {
                        setState(() => _acOpted = val);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              // Extra Mattress & Driver Bed Selectors
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      value: _extraMattressCount,
                      decoration: const InputDecoration(labelText: 'Extra Mattress', border: OutlineInputBorder()),
                      items: List.generate(4, (i) => DropdownMenuItem(value: i, child: Text('$i'))),
                      onChanged: (val) => setState(() => _extraMattressCount = val ?? 0),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      value: _driverBedCount,
                      decoration: const InputDecoration(labelText: 'Driver Bed', border: OutlineInputBorder()),
                      items: List.generate(4, (i) => DropdownMenuItem(value: i, child: Text('$i'))),
                      onChanged: (val) => setState(() => _driverBedCount = val ?? 0),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Estimated Folio:', style: TextStyle(fontWeight: FontWeight.w600)),
                    Text(
                      '₹${_totalEstimate.toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.indigo),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo, foregroundColor: Colors.white),
          onPressed: () {
            if (_nameController.text.trim().isEmpty || _phoneController.text.trim().isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
              return;
            }

            final now = DateTime.now().toUtc();
            final bookingId = const Uuid().v4();
            final allocId = const Uuid().v4();
            final folioId = const Uuid().v4();

            final booking = BookingsCompanion(
              id: d.Value(bookingId),
              propertyId: d.Value(widget.propertyId),
              guestName: d.Value(_nameController.text.trim()),
              guestPhone: d.Value(_phoneController.text.trim()),
              checkIn: d.Value(now),
              checkOut: d.Value(now.add(Duration(days: _nights))),
              status: const d.Value('CHECKED_IN'),
              source: const d.Value('WALK_IN'),
              totalAmount: d.Value(_totalEstimate),
              advancePaid: const d.Value(0.0),
              updatedAt: d.Value(now),
            );

            final alloc = BookingRoomAllocationsCompanion(
              id: d.Value(allocId),
              bookingId: d.Value(bookingId),
              roomId: d.Value(widget.room.id),
              propertyId: d.Value(widget.propertyId),
              roomNumber: d.Value(widget.room.roomNumber),
              acOpted: d.Value(_acOpted),
              extraMattressCount: d.Value(_extraMattressCount),
              driverBedCount: d.Value(_driverBedCount),
              status: const d.Value('CHECKED_IN'),
              checkIn: d.Value(now),
              checkOut: d.Value(now.add(Duration(days: _nights))),
              updatedAt: d.Value(now),
            );

            final folio = FoliosCompanion(
              id: d.Value(folioId),
              allocationId: d.Value(allocId),
              propertyId: d.Value(widget.propertyId),
              totalRoomCharge: d.Value(_currentRoomRate * _nights),
              totalFoodCharge: const d.Value(0.0),
              extraPersonCharge: d.Value(_extraPersonTotal),
              waiveExtraPerson: const d.Value(false),
              discountAmount: const d.Value(0.0),
              amountPaid: const d.Value(0.0),
              balanceDue: d.Value(_totalEstimate),
              status: const d.Value('OPEN'),
              lineItems: const d.Value('[]'),
              updatedAt: d.Value(now),
            );

            widget.onConfirm(booking, alloc, folio);
            Navigator.pop(context);
          },
          child: const Text('Check In (<5ms)'),
        ),
      ],
    );
  }
}
