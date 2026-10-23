import 'dart:io';
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:flutter_pos_printer_platform_image_3/flutter_pos_printer_platform_image_3.dart';

enum PaperSize { mm58, mm80 }

class ThermalPrinterService {
  static final ThermalPrinterService _instance = ThermalPrinterService._internal();
  factory ThermalPrinterService() => _instance;
  ThermalPrinterService._internal();

  /// Formats and generates ESC/POS bytes for a Kitchen Order Ticket (KOT)
  Future<List<int>> generateKotBytes({
    required String propertyName,
    required String roomNumber,
    required String orderId,
    required List<Map<String, dynamic>> items,
    PaperSize paperSize = PaperSize.mm80,
  }) async {
    final profile = await CapabilityProfile.load();
    final generator = Generator(
      paperSize == PaperSize.mm58 ? esc_pos_utils_plus.PaperSize.mm58 : esc_pos_utils_plus.PaperSize.mm80,
      profile,
    );

    List<int> bytes = [];
    bytes += generator.reset();
    bytes += generator.text(
      'KITCHEN ORDER TICKET (KOT)',
      styles: const PosStyles(align: PosAlign.center, bold: true, height: PosTextSize.size2, width: PosTextSize.size2),
    );
    bytes += generator.text(
      propertyName,
      styles: const PosStyles(align: PosAlign.center, fontType: PosFontType.fontA),
    );
    bytes += generator.hr();
    bytes += generator.text('Room No: $roomNumber', styles: const PosStyles(bold: true, height: PosTextSize.size2));
    bytes += generator.text('Order #: ${orderId.substring(0, 8).toUpperCase()}');
    bytes += generator.text('Time: ${DateTime.now().toLocal().toString().substring(0, 19)}');
    bytes += generator.hr();

    bytes += generator.row([
      PosColumn(text: 'Item', width: 8, styles: const PosStyles(bold: true)),
      PosColumn(text: 'Qty', width: 4, styles: const PosStyles(align: PosAlign.right, bold: true)),
    ]);
    bytes += generator.hr(ch: '-');

    for (final it in items) {
      bytes += generator.row([
        PosColumn(text: it['name'] ?? '', width: 8),
        PosColumn(text: '${it['qty']}', width: 4, styles: const PosStyles(align: PosAlign.right, bold: true)),
      ]);
      if (it['notes'] != null && (it['notes'] as String).isNotEmpty) {
        bytes += generator.text('  * Note: ${it['notes']}', styles: const PosStyles(fontType: PosFontType.fontB));
      }
    }

    bytes += generator.hr();
    bytes += generator.feed(2);
    bytes += generator.cut();
    return bytes;
  }

  /// Formats and generates ESC/POS bytes for a Final Split-Checkout Bill with Dynamic UPI QR
  Future<List<int>> generateBillBytes({
    required String propertyName,
    required String roomNumber,
    required String guestName,
    required double roomCharges,
    required double foodCharges,
    required double extraCharges,
    required double discount,
    required double totalAmount,
    required double balanceDue,
    required String upiQrString,
    PaperSize paperSize = PaperSize.mm80,
  }) async {
    final profile = await CapabilityProfile.load();
    final generator = Generator(
      paperSize == PaperSize.mm58 ? esc_pos_utils_plus.PaperSize.mm58 : esc_pos_utils_plus.PaperSize.mm80,
      profile,
    );

    List<int> bytes = [];
    bytes += generator.reset();
    bytes += generator.text(
      propertyName,
      styles: const PosStyles(align: PosAlign.center, bold: true, height: PosTextSize.size2, width: PosTextSize.size2),
    );
    bytes += generator.text('FINAL CHECKOUT BILL', styles: const PosStyles(align: PosAlign.center, bold: true));
    bytes += generator.hr();
    bytes += generator.text('Room No: $roomNumber | Guest: $guestName');
    bytes += generator.text('Date: ${DateTime.now().toLocal().toString().substring(0, 19)}');
    bytes += generator.hr();

    bytes += generator.row([
      PosColumn(text: 'Room Charges', width: 8),
      PosColumn(text: 'Rs ${roomCharges.toStringAsFixed(2)}', width: 4, styles: const PosStyles(align: PosAlign.right)),
    ]);
    bytes += generator.row([
      PosColumn(text: 'Food / Dining', width: 8),
      PosColumn(text: 'Rs ${foodCharges.toStringAsFixed(2)}', width: 4, styles: const PosStyles(align: PosAlign.right)),
    ]);
    if (extraCharges > 0) {
      bytes += generator.row([
        PosColumn(text: 'Extra Mattress/Driver', width: 8),
        PosColumn(text: 'Rs ${extraCharges.toStringAsFixed(2)}', width: 4, styles: const PosStyles(align: PosAlign.right)),
      ]);
    }
    if (discount > 0) {
      bytes += generator.row([
        PosColumn(text: 'Waived / Discount', width: 8),
        PosColumn(text: '-Rs ${discount.toStringAsFixed(2)}', width: 4, styles: const PosStyles(align: PosAlign.right)),
      ]);
    }
    bytes += generator.hr(ch: '=');
    bytes += generator.row([
      PosColumn(text: 'TOTAL AMOUNT', width: 7, styles: const PosStyles(bold: true)),
      PosColumn(text: 'Rs ${totalAmount.toStringAsFixed(2)}', width: 5, styles: const PosStyles(align: PosAlign.right, bold: true)),
    ]);
    bytes += generator.row([
      PosColumn(text: 'BALANCE DUE', width: 7, styles: const PosStyles(bold: true, height: PosTextSize.size2)),
      PosColumn(text: 'Rs ${balanceDue.toStringAsFixed(2)}', width: 5, styles: const PosStyles(align: PosAlign.right, bold: true, height: PosTextSize.size2)),
    ]);
    bytes += generator.hr();

    if (balanceDue > 0 && upiQrString.isNotEmpty) {
      bytes += generator.text('Scan & Pay with UPI (0% Fee):', styles: const PosStyles(align: PosAlign.center, bold: true));
      bytes += generator.feed(1);
      // Native ESC/POS QR code command (GS ( k)
      bytes += generator.qrcode(upiQrString, size: QRSize.size6);
      bytes += generator.feed(1);
    }

    bytes += generator.text('Thank You! Visit Again.', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.feed(2);
    bytes += generator.cut();
    return bytes;
  }

  /// Platform Hardware Router: sends bytes to Bluetooth on Mobile and USB/Spooler on Desktop
  Future<bool> printBytes(List<int> bytes, {String? macAddress, String? usbPrinterName}) async {
    try {
      if (Platform.isAndroid || Platform.isIOS) {
        // Mobile Bluetooth Route
        final isConnected = await PrintBluetoothThermal.connectionStatus;
        if (!isConnected && macAddress != null) {
          await PrintBluetoothThermal.connect(macPrinterAddress: macAddress);
        }
        final result = await PrintBluetoothThermal.writeBytes(bytes);
        return result;
      } else if (Platform.isWindows || Platform.isMacOS) {
        // Desktop USB / Network / Spooler Route
        final printerManager = PrinterManager.instance;
        if (usbPrinterName != null) {
          await printerManager.connect(
            type: PrinterType.usb,
            model: UsbPrinterInput(name: usbPrinterName),
          );
          printerManager.send(type: PrinterType.usb, bytes: bytes);
        }
        return true;
      }
    } catch (e) {
      debugPrint('Print error: $e');
    }
    return false;
  }
}

/// Desktop Keyboard Shortcuts Definition
class PosShortcutsIntent extends Intent {
  final String action;
  const PosShortcutsIntent(this.action);
}

Map<ShortcutActivator, Intent> get posDefaultShortcuts => {
  const SingleActivator(LogicalKeyboardKey.f1): const PosShortcutsIntent('QUICK_WALKIN'),
  const SingleActivator(LogicalKeyboardKey.f2): const PosShortcutsIntent('PRINT_KOT'),
  const SingleActivator(LogicalKeyboardKey.f4): const PosShortcutsIntent('PARTIAL_CHECKOUT'),
  const SingleActivator(LogicalKeyboardKey.keyK, control: true): const PosShortcutsIntent('AI_SEARCH'),
};
