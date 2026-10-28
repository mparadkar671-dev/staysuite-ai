import 'package:flutter/material.dart';

class RoleMemberItem {
  final String id;
  final String name;
  final String role;
  final String roleTitle;

  const RoleMemberItem({
    required this.id,
    required this.name,
    required this.role,
    required this.roleTitle,
  });
}

class RoleLoginDialog extends StatefulWidget {
  final String currentBusinessCode;
  final Function(String role, String staffName, String businessCode, List<String> enabledFeatures, String token) onLoginSuccess;

  const RoleLoginDialog({
    super.key,
    required this.currentBusinessCode,
    required this.onLoginSuccess,
  });

  @override
  State<RoleLoginDialog> createState() => _RoleLoginDialogState();
}

class _RoleLoginDialogState extends State<RoleLoginDialog> {
  int _step = 1;
  late TextEditingController _businessCodeCtrl;
  late TextEditingController _passwordCtrl;

  String _selectedRole = 'OWNER';
  RoleMemberItem? _selectedMember;
  String? _errorMessage;
  bool _isSuspended = false;
  bool _isLoading = false;

  final Map<String, List<RoleMemberItem>> _sampleStaffDirectory = {
    'OWNER': [
      const RoleMemberItem(id: 'own_1', name: 'Abhijeet Patil', role: 'OWNER', roleTitle: 'Owner / Administrator'),
    ],
    'MANAGER': [
      const RoleMemberItem(id: 'mgr_1', name: 'Santosh Naik', role: 'MANAGER', roleTitle: 'Property & Front Desk Manager'),
    ],
    'COOK': [
      const RoleMemberItem(id: 'ck_1', name: 'Vedika Patil', role: 'COOK', roleTitle: 'Head Seafood Chef (Surmai Thali)'),
      const RoleMemberItem(id: 'ck_2', name: 'Suresh Gawde', role: 'COOK', roleTitle: 'Breakfast & Prep Cook'),
    ],
    'STAFF_HOUSEKEEPING': [
      const RoleMemberItem(id: 'hk_1', name: 'Deepak Kadam', role: 'STAFF_HOUSEKEEPING', roleTitle: 'Room Floor Supervisor'),
      const RoleMemberItem(id: 'hk_2', name: 'Anita Mane', role: 'STAFF_HOUSEKEEPING', roleTitle: 'Linen & Cleaning Attendant'),
    ],
    'WAITER': [
      const RoleMemberItem(id: 'wt_1', name: 'Ganesh Rane', role: 'WAITER', roleTitle: 'Dining Table & Room Service Waiter'),
    ],
    'HELPER': [
      const RoleMemberItem(id: 'hl_1', name: 'Pravin Parab', role: 'HELPER', roleTitle: 'General Maintenance & Market Runner'),
    ],
    'ACCOUNTANT': [
      const RoleMemberItem(id: 'ac_1', name: 'Ketan Shirke', role: 'ACCOUNTANT', roleTitle: 'Cashier & Upaad Ledger Lead'),
    ],
  };

  @override
  void initState() {
    super.initState();
    _businessCodeCtrl = TextEditingController(text: widget.currentBusinessCode);
    _passwordCtrl = TextEditingController(text: 'demo1234');
  }

  @override
  void dispose() {
    _businessCodeCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _nextStep() async {
    setState(() {
      _errorMessage = null;
      _isSuspended = false;
    });

    if (_step == 1) {
      final code = _businessCodeCtrl.text.trim();
      if (code.isEmpty) {
        setState(() => _errorMessage = 'Please enter a valid Business ID');
        return;
      }
      setState(() => _step = 2);
    } else if (_step == 2) {
      setState(() => _step = 3);
    } else if (_step == 3) {
      if (_selectedMember == null) {
        setState(() => _errorMessage = 'Please select your name');
        return;
      }
      setState(() => _step = 4);
    } else if (_step == 4) {
      if (_passwordCtrl.text.isEmpty) {
        setState(() => _errorMessage = 'Please enter password');
        return;
      }

      setState(() => _isLoading = true);

      // Verify with Super Admin Kill-Switch & Auth Rule
      // If business code contains SUSPEND or property is marked suspended in DB, show 403 dialog
      final codeUpper = _businessCodeCtrl.text.trim().toUpperCase();
      if (codeUpper.contains("SUSPEND") || codeUpper == "SS-SUSPENDED") {
        setState(() {
          _isSuspended = true;
          _isLoading = false;
          _errorMessage = "Property suspended by Super Admin HQ for non-compliance or billing hold.";
        });
        return;
      }

      // Default baseline feature modules for Homestay / Resort
      final defaultFeatures = [
        'MOD_ROOMS_AC_TOGGLE',
        'MOD_FOOD_CUTOFF_BOM',
        'MOD_POS_SPLIT_BILLING',
        'MOD_HOUSEKEEPING_QR',
        'MOD_EXPENSE_KIRANA',
        'MOD_STAFF_UPAAD_LEAVE',
        'MOD_AI_COPILOT',
        'MOD_360_PANORAMA',
      ];

      widget.onLoginSuccess(
        _selectedRole,
        _selectedMember?.name ?? 'Staff Member',
        _businessCodeCtrl.text.trim(),
        defaultFeatures,
        'jwt_token_${DateTime.now().millisecondsSinceEpoch}',
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 460),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header & Step Indicator
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.indigo.shade50,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.shield_outlined, color: Colors.indigo, size: 20),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'StaySuite 4-Step Login',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.indigo.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Step $_step of 4',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.indigo),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              if (_isSuspended)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.red.shade900,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade400, width: 1.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.gavel_rounded, color: Colors.white, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'ACCOUNT SUSPENDED BY SUPER ADMIN',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _errorMessage ?? 'Property has been suspended for non-compliance or unpaid SaaS subscription.',
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.red.shade900,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            ),
                            icon: const Icon(Icons.phone, size: 14),
                            label: const Text('Call HQ Support', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            onPressed: () {},
                          ),
                        ],
                      ),
                    ],
                  ),
                )
              else if (_errorMessage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: Colors.red.shade800, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),

              // STEP 1: Business Code
              if (_step == 1) ...[
                const Text('Enter Business Code', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                const Text('Issued to property owner (e.g., SS-HM-1001)', style: TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 12),
                TextField(
                  controller: _businessCodeCtrl,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.store),
                    hintText: 'SS-HM-1001',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],

              // STEP 2: Role Selection
              if (_step == 2) ...[
                const Text('Select Your Role', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text('Active operational roles for ${_businessCodeCtrl.text}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _sampleStaffDirectory.keys.map((role) {
                    final isSelected = _selectedRole == role;
                    return ChoiceChip(
                      label: Text(role.replaceAll('_', ' ')),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _selectedRole = role;
                            _selectedMember = null;
                          });
                        }
                      },
                    );
                  }).toList(),
                ),
              ],

              // STEP 3: Individual Person Selection
              if (_step == 3) ...[
                Text('Select Exact Identity (${_selectedRole.replaceAll('_', ' ')})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                const Text('Multiple employees can hold this role', style: TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 12),
                Column(
                  children: (_sampleStaffDirectory[_selectedRole] ?? []).map((m) {
                    final isSelected = _selectedMember?.id == m.id;
                    return Card(
                      elevation: isSelected ? 2 : 0,
                      color: isSelected ? Colors.indigo.shade50 : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: isSelected ? Colors.indigo : Colors.grey.shade300),
                      ),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isSelected ? Colors.indigo : Colors.grey.shade200,
                          child: Text(
                            m.name.substring(0, 1),
                            style: TextStyle(color: isSelected ? Colors.white : Colors.black87, fontWeight: FontWeight.bold),
                          ),
                        ),
                        title: Text(m.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        subtitle: Text(m.roleTitle, style: const TextStyle(fontSize: 11)),
                        trailing: isSelected ? const Icon(Icons.check_circle, color: Colors.indigo) : null,
                        onTap: () {
                          setState(() => _selectedMember = m);
                        },
                      ),
                    );
                  }).toList(),
                ),
              ],

              // STEP 4: Password Verification
              if (_step == 4) ...[
                Text('Authenticate (${_selectedMember?.name})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text('${_selectedRole.replaceAll('_', ' ')} • ${_businessCodeCtrl.text}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 12),
                TextField(
                  controller: _passwordCtrl,
                  obscureText: true,
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.lock_outline),
                    hintText: 'Enter Password',
                    helperText: 'Default demo password: demo1234',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],

              const SizedBox(height: 20),

              // Action Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_step > 1)
                    TextButton(
                      onPressed: () => setState(() => _step--),
                      child: const Text('Back'),
                    )
                  else
                    const SizedBox.shrink(),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.indigo,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: Icon(_step == 4 ? Icons.login : Icons.arrow_forward, size: 16),
                    label: Text(_step == 4 ? 'Login & Open App' : 'Next Step'),
                    onPressed: _nextStep,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
