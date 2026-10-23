import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/database/app_database.dart';
import '../../core/hardware/thermal_printer_service.dart';

class PartialCheckoutDialog extends StatefulWidget {
  final AllocationEntry allocation;
  final FolioEntry folio;
  final String propertyName;
  final String propertyUpiVpa;
  final Function({
    required double amountPaid,
    required bool waiveExtraPerson,
    required String settlementStatus,
  }) onCheckoutConfirmed;

  const PartialCheckoutDialog({
    super.key,
    required this.allocation,
    required this.folio,
    required this.propertyName,
    required this.propertyUpiVpa,
    required this.onCheckoutConfirmed,
  });

  @override
  State<PartialCheckoutDialog> createState() => _PartialCheckoutDialogState();
}

class _PartialCheckoutDialogState extends State<PartialCheckoutDialog> {
  bool _waiveExtraPerson = false;
  late TextEditingController _paidController;

  double get _discount => _waiveExtraPerson ? widget.folio.extraPersonCharge : 0.0;
  double get _grossTotal => widget.folio.totalRoomCharge + widget.folio.totalFoodCharge + widget.folio.extraPersonCharge;
  double get _netPayable => _grossTotal - _discount;
  double get _paidAmount => double.tryParse(_paidController.text.trim()) ?? _netPayable;
  double get _balanceDue => (_netPayable - _paidAmount) <= 0 ? 0.0 : (_netPayable - _paidAmount);

  String get _upiQrString =>
      'upi://pay?pa=${widget.propertyUpiVpa}&pn=${Uri.encodeComponent(widget.propertyName)}&am=${_balanceDue > 0 ? _balanceDue.toStringAsFixed(2) : _netPayable.toStringAsFixed(2)}&cu=INR';

  @override
  void initState() {
    super.initState();
    _paidController = TextEditingController(text: _netPayable.toStringAsFixed(2));
  }

  void _printReceipt() async {
    final bytes = await ThermalPrinterService().generateBillBytes(
      propertyName: widget.propertyName,
      roomNumber: widget.allocation.roomNumber,
      guestName: 'Valued Guest',
      roomCharges: widget.folio.totalRoomCharge,
      foodCharges: widget.folio.totalFoodCharge,
      extraCharges: widget.folio.extraPersonCharge,
      discount: _discount,
      totalAmount: _netPayable,
      balanceDue: _balanceDue,
      upiQrString: _balanceDue > 0 ? _upiQrString : '',
    );
    await ThermalPrinterService().printBytes(bytes);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('ESC/POS Bill printed successfully')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('Partial Checkout: Room ${widget.allocation.roomNumber}'),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(6)),
            child: const Text('Split Billing Active', style: TextStyle(fontSize: 12, color: Colors.blue)),
          ),
        ],
      ),
      content: SizedBox(
        width: 520,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Sibling rooms in this group will remain ACTIVE after this checkout.',
                  style: TextStyle(fontSize: 12, color: Colors.grey)),
              const Divider(height: 24),

              // Charges Breakdown
              _buildRow('Room Tariff (AC/Non-AC prorated)', widget.folio.totalRoomCharge),
              _buildRow('Dining / KOT Food Orders', widget.folio.totalFoodCharge),
              if (widget.folio.extraPersonCharge > 0)
                _buildRow('Extra Mattress / Driver Bed', widget.folio.extraPersonCharge),

              // 1-Click Waive Extra Mattress / Driver Bed Fee Toggle
              if (widget.folio.extraPersonCharge > 0) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: _waiveExtraPerson ? Colors.green.shade50 : Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: _waiveExtraPerson ? Colors.green.shade300 : Colors.grey.shade300),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('1-Click Waive Mattress/Driver Charge',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          Text('Discounts ₹${widget.folio.extraPersonCharge.toStringAsFixed(2)} from final bill',
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade700)),
                        ],
                      ),
                      Switch.adaptive(
                        value: _waiveExtraPerson,
                        activeColor: Colors.green,
                        onChanged: (val) {
                          setState(() {
                            _waiveExtraPerson = val;
                            _paidController.text = _netPayable.toStringAsFixed(2);
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ],

              const Divider(height: 24),
              _buildRow('Net Payable Amount', _netPayable, isBold: true, fontSize: 16),
              const SizedBox(height: 12),

              TextField(
                controller: _paidController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Amount Paid (₹)',
                  prefixIcon: Icon(Icons.currency_rupee),
                  border: OutlineInputBorder(),
                ),
                onChanged: (_) => setState(() {}),
              ),

              const SizedBox(height: 16),
              if (_balanceDue > 0) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(8)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Unpaid Balance Remaining',
                              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.brown)),
                          Text('₹${_balanceDue.toStringAsFixed(2)} can be moved to Customer Khata',
                              style: const TextStyle(fontSize: 12)),
                        ],
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.brown.shade700, foregroundColor: Colors.white),
                        onPressed: () {
                          widget.onCheckoutConfirmed(
                            amountPaid: _paidAmount,
                            waiveExtraPerson: _waiveExtraPerson,
                            settlementStatus: 'MOVED_TO_KHATA',
                          );
                          Navigator.pop(context);
                        },
                        child: const Text('Move to Khata'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Dynamic UPI QR Code Display (0% MDR)
              Center(
                child: Column(
                  children: [
                    const Text('Scan with GPay / PhonePe / Paytm (0% MDR)',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 8),
                    QrImageView(
                      data: _upiQrString,
                      version: QrVersions.auto,
                      size: 160.0,
                    ),
                    const SizedBox(height: 4),
                    Text(widget.propertyUpiVpa, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        OutlinedButton.icon(
          icon: const Icon(Icons.print),
          label: const Text('Print KOT/Bill (F4)'),
          onPressed: _printReceipt,
        ),
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.green.shade800, foregroundColor: Colors.white),
          onPressed: () {
            widget.onCheckoutConfirmed(
              amountPaid: _paidAmount,
              waiveExtraPerson: _waiveExtraPerson,
              settlementStatus: _balanceDue <= 0 ? 'SETTLED' : 'PARTIALLY_PAID',
            );
            Navigator.pop(context);
          },
          child: const Text('Checkout & Settle'),
        ),
      ],
    );
  }

  Widget _buildRow(String title, double amount, {bool isBold = false, double fontSize = 14}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title,
              style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text('₹${amount.toStringAsFixed(2)}',
              style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
        ],
      ),
    );
  }
}
