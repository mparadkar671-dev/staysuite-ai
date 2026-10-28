import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

class AiCommandBar extends StatefulWidget {
  final String baseUrl;
  final String propertyId;
  final String authToken;
  final Function(Map<String, dynamic> actionPayload) onExecuteAction;

  const AiCommandBar({
    super.key,
    required this.baseUrl,
    required this.propertyId,
    required this.authToken,
    required this.onExecuteAction,
  });

  @override
  State<AiCommandBar> createState() => _AiCommandBarState();
}

class _AiCommandBarState extends State<AiCommandBar> {
  final _inputController = TextEditingController();
  bool _isLoading = false;
  Map<String, dynamic>? _parsedActionCard;

  void _submitNaturalLanguageCommand() async {
    final query = _inputController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _isLoading = true;
      _parsedActionCard = null;
    });

    try {
      final dio = Dio();
      final res = await dio.post(
        '${widget.baseUrl}/api/v1/copilot/parse-command',
        data: {
          'property_id': widget.propertyId,
          'user_command': query,
        },
        options: Options(headers: {'Authorization': 'Bearer ${widget.authToken}'}),
      );

      if (res.statusCode == 200) {
        setState(() {
          _parsedActionCard = res.data as Map<String, dynamic>;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('AI Copilot error: ${e.toString()}')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome, color: Colors.deepPurple),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _inputController,
                  decoration: const InputDecoration(
                    hintText: 'AI Copilot (Ctrl+K): "Freeze rooms for Dec 24", "Sea-facing price ₹4000", "उद्या किती सुरमई लागेल?"...',
                    border: InputBorder.none,
                    isDense: true,
                  ),
                  onSubmitted: (_) => _submitNaturalLanguageCommand(),
                ),
              ),
              if (_isLoading)
                const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              else
                IconButton(
                  icon: const Icon(Icons.arrow_forward_rounded, color: Colors.deepPurple),
                  onPressed: _submitNaturalLanguageCommand,
                ),
            ],
          ),

          // 1-Click Confirmation Action Card surfaced by Gemini AI Copilot
          if (_parsedActionCard != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.deepPurple.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.deepPurple.shade200),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_outline, color: Colors.deepPurple),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _parsedActionCard!['action_summary'] ?? 'Action Detected',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple),
                        ),
                        Text(
                          'Intent: ${_parsedActionCard!['intent_type']} | Target: ${_parsedActionCard!['target_resource']}',
                          style: TextStyle(fontSize: 12, color: Colors.deepPurple.shade700),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.deepPurple,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () {
                      widget.onExecuteAction(_parsedActionCard!);
                      setState(() {
                        _parsedActionCard = null;
                        _inputController.clear();
                      });
                    },
                    child: const Text('Confirm & Apply'),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
