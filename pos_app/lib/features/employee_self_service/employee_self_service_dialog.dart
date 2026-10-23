import 'package:flutter/material.dart';

class EmployeeSelfServiceDialog extends StatefulWidget {
  final String staffName;
  final String role;
  final String propertyName;

  const EmployeeSelfServiceDialog({
    super.key,
    required this.staffName,
    required this.role,
    required this.propertyName,
  });

  @override
  State<EmployeeSelfServiceDialog> createState() => _EmployeeSelfServiceDialogState();
}

class _EmployeeSelfServiceDialogState extends State<EmployeeSelfServiceDialog> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Sample tasks
  final List<Map<String, dynamic>> _myTasks = [
    {
      'id': 't1',
      'title': 'Prep 8 Dinner Surmai Fish Thalis',
      'desc': 'Marinate with coastal spices from harbor delivery',
      'isDone': false,
      'priority': 'URGENT',
    },
    {
      'id': 't2',
      'title': 'Dry Store Coconut & Spice Check',
      'desc': 'Prepare 7 AM morning fish & veg market shopping list',
      'isDone': true,
      'priority': 'NORMAL',
    },
    {
      'id': 't3',
      'title': 'Clean Kitchen Workstation & Sanitize Counters',
      'desc': 'Daily hygiene protocol for dinner shift',
      'isDone': false,
      'priority': 'NORMAL',
    },
  ];

  // Sample Upaad ledger
  final double _baseSalary = 16000.0;
  final List<Map<String, dynamic>> _upaadEntries = [
    {'date': '12 Oct 2026', 'note': 'Festival Family Advance', 'amount': 3000.0},
    {'date': '18 Oct 2026', 'note': 'Medical Prescription', 'amount': 1500.0},
  ];

  // Sample Leaves
  final List<Map<String, dynamic>> _leaves = [
    {'dates': '02 Nov - 04 Nov', 'reason': 'Family wedding in Kankavli', 'status': 'APPROVED'},
    {'dates': '18 Nov - 19 Nov', 'reason': 'Village Jatra celebration', 'status': 'PENDING'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final double totalAdvance = _upaadEntries.fold(0.0, (sum, item) => sum + (item['amount'] as double));
    final double netPending = _baseSalary - totalAdvance;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 540, maxHeight: 600),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.person_pin_outlined, color: Colors.indigo, size: 22),
                          const SizedBox(width: 8),
                          Text(widget.staffName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        ],
                      ),
                      Text('${widget.role.replaceAll('_', ' ')} • ${widget.propertyName}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Tab Bar
              TabBar(
                controller: _tabController,
                labelColor: Colors.indigo,
                unselectedLabelColor: Colors.grey,
                indicatorColor: Colors.indigo,
                tabs: const [
                  Tab(icon: Icon(Icons.check_box_outlined, size: 18), text: 'My Tasks'),
                  Tab(icon: Icon(Icons.account_balance_wallet_outlined, size: 18), text: 'Salary & Upaad'),
                  Tab(icon: Icon(Icons.calendar_month_outlined, size: 18), text: 'Leaves'),
                ],
              ),
              const SizedBox(height: 12),

              // Tab Views
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    // TAB 1: Tasks
                    ListView.builder(
                      itemCount: _myTasks.length,
                      itemBuilder: (ctx, i) {
                        final t = _myTasks[i];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: CheckboxListTile(
                            value: t['isDone'] as bool,
                            activeColor: Colors.green,
                            onChanged: (val) {
                              setState(() => t['isDone'] = val ?? false);
                            },
                            title: Text(
                              t['title'] as String,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                decoration: (t['isDone'] as bool) ? TextDecoration.lineThrough : null,
                              ),
                            ),
                            subtitle: Text(t['desc'] as String, style: const TextStyle(fontSize: 11)),
                            secondary: (t['priority'] == 'URGENT')
                                ? Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(color: Colors.red.shade100, borderRadius: BorderRadius.circular(6)),
                                    child: const Text('URGENT', style: TextStyle(color: Colors.red, fontSize: 9, fontWeight: FontWeight.bold)),
                                  )
                                : null,
                          ),
                        );
                      },
                    ),

                    // TAB 2: Salary & Upaad
                    Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
                                child: Column(
                                  children: [
                                    const Text('Base Monthly', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                    Text('₹${_baseSalary.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12)),
                                child: Column(
                                  children: [
                                    const Text('Advances (Upaad)', style: TextStyle(fontSize: 10, color: Colors.red)),
                                    Text('-₹${totalAdvance.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.red)),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12)),
                                child: Column(
                                  children: [
                                    const Text('Net Pending', style: TextStyle(fontSize: 10, color: Colors.green)),
                                    Text('₹${netPending.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.green)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text('Upaad Cash Advance Entries:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                        const SizedBox(height: 6),
                        Expanded(
                          child: ListView.builder(
                            itemCount: _upaadEntries.length,
                            itemBuilder: (ctx, i) {
                              final u = _upaadEntries[i];
                              return ListTile(
                                dense: true,
                                leading: const Icon(Icons.arrow_downward, color: Colors.red, size: 16),
                                title: Text(u['note'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                                subtitle: Text(u['date'] as String, style: const TextStyle(fontSize: 10)),
                                trailing: Text('-₹${(u['amount'] as double).toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                              );
                            },
                          ),
                        ),
                      ],
                    ),

                    // TAB 3: Leaves
                    Column(
                      children: [
                        Expanded(
                          child: ListView.builder(
                            itemCount: _leaves.length,
                            itemBuilder: (ctx, i) {
                              final l = _leaves[i];
                              final isApproved = l['status'] == 'APPROVED';
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                child: ListTile(
                                  leading: Icon(
                                    isApproved ? Icons.check_circle : Icons.hourglass_top,
                                    color: isApproved ? Colors.green : Colors.amber.shade800,
                                  ),
                                  title: Text(l['reason'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                  subtitle: Text(l['dates'] as String, style: const TextStyle(fontSize: 11)),
                                  trailing: Chip(
                                    label: Text(l['status'] as String, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                    backgroundColor: isApproved ? Colors.green.shade50 : Colors.amber.shade50,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.indigo,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('Request New Leave'),
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Leave Request Sent to Owner/Manager for Approval!')),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
