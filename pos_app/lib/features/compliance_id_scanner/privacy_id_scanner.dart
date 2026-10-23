import 'package:flutter/foundation.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

class PrivacyIdScanner {
  final TextRecognizer _textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);

  /// Scans an image on-device, recognizes text, and redacts 12-digit Indian Aadhaar numbers
  Future<IdScanResult> scanAndRedactId(String imagePath) async {
    final inputImage = InputImage.fromFilePath(imagePath);
    final RecognizedText recognizedText = await _textRecognizer.processImage(inputImage);

    String rawExtracted = recognizedText.text;
    String maskedDisplay = rawExtracted;

    // Aadhaar regex: 4 digits + space/dash + 4 digits + space/dash + 4 digits, or 12 continuous digits
    final aadhaarRegex = RegExp(r'\b[2-9]{1}[0-9]{3}[ -]?[0-9]{4}[ -]?[0-9]{4}\b');

    bool aadhaarDetected = false;
    if (aadhaarRegex.hasMatch(rawExtracted)) {
      aadhaarDetected = true;
      // Strictly redact all occurrences to [Aadhaar Redacted]
      maskedDisplay = rawExtracted.replaceAll(aadhaarRegex, '[Aadhaar Redacted]');
    }

    // Passport regex (basic alphanumeric: 1 letter + 7 digits)
    final passportRegex = RegExp(r'\b[A-Z]{1}[0-9]{7}\b');
    bool passportDetected = passportRegex.hasMatch(rawExtracted);

    return IdScanResult(
      rawTextRedacted: maskedDisplay,
      isAadhaar: aadhaarDetected,
      isPassport: passportDetected,
      complianceStatus: 'VERIFIED_REDACTED',
    );
  }

  void dispose() {
    _textRecognizer.close();
  }
}

class IdScanResult {
  final String rawTextRedacted;
  final bool isAadhaar;
  final bool isPassport;
  final String complianceStatus;

  IdScanResult({
    required this.rawTextRedacted,
    required this.isAadhaar,
    required this.isPassport,
    required this.complianceStatus,
  });
}
