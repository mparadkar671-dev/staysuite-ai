import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum RoomWizardStep {
  templateAndNumbers,
  smartPricing,
  amenities,
  photosAndTour,
  advancedSettings,
}

class RoomSetupWizardDialog extends ConsumerStatefulWidget {
  final String propertyId;
  final String baseUrl;
  final String authToken;
  final VoidCallback? onSetupCompleted;

  const RoomSetupWizardDialog({
    super.key,
    required this.propertyId,
    required this.baseUrl,
    required this.authToken,
    this.onSetupCompleted,
  });

  static Future<void> show(
    BuildContext context, {
    required String propertyId,
    required String baseUrl,
    required String authToken,
    VoidCallback? onSetupCompleted,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => RoomSetupWizardDialog(
        propertyId: propertyId,
        baseUrl: baseUrl,
        authToken: authToken,
        onSetupCompleted: onSetupCompleted,
      ),
    );
  }

  @override
  ConsumerState<RoomSetupWizardDialog> createState() => _RoomSetupWizardDialogState();
}

class _RoomSetupWizardDialogState extends ConsumerState<RoomSetupWizardDialog>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Wizard state
  int _currentStepIndex = 0;
  String _selectedTemplate = 'DELUXE_AC';
  final TextEditingController _categoryNameController =
      TextEditingController(text: 'Sea-Facing Deluxe AC Cottage');
  final TextEditingController _roomNumberInputController = TextEditingController();
  final List<String> _roomNumbers = ['101', '102', '103'];

  // Pricing State
  bool _hasAc = true;
  double _baseTariffAc = 3200;
  bool _allowGuestNonAcToggle = true;
  double _baseTariffNonAc = 2400;
  double _extraMattressCharge = 500;
  bool _driverStayFree = true;

  // Amenities State
  String _bathroomLocation = 'ATTACHED_INSIDE';
  String _toiletType = 'WESTERN';
  String _hotWaterType = 'GEYSER_24X7';
  bool _wifiFree = true;
  bool _powerBackupInverter = true;
  bool _parkingCar = true;
  bool _parkingBus = false;
  bool _tvSmart = true;
  bool _privateBalcony = true;
  bool _miniFridge = false;
  bool _petFriendly = false;
  String _roomView = 'SEA_VIEW';
  final List<String> _freePerks = [
    'Free Driver Dormitory Stay',
    'Complimentary Welcome Solkadhi',
    '30s Walk to Tarkarli Beach',
  ];

  // Photos & 360 Tour
  final TextEditingController _bedPhotoUrlController = TextEditingController(
    text: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  );
  final TextEditingController _bathPhotoUrlController = TextEditingController(
    text: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
  );
  final TextEditingController _balconyPhotoUrlController = TextEditingController(
    text: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  );
  final TextEditingController _panorama360UrlController = TextEditingController(
    text: 'https://pannellum.org/images/alma.jpg',
  );

  // Advanced settings
  double _weekendSurgePercent = 15;
  int _minNights = 1;
  bool _managerCanEditRates = true;
  bool _childPolicyFreeUnder6 = true;

  // Mock list of created categories with units
  final List<Map<String, dynamic>> _mockCategories = [
    {
      'id': 'cat_sea_view',
      'category_name': 'Sea-Facing Deluxe AC Cottage',
      'template': 'DELUXE_AC',
      'base_tariff_ac': 3200.0,
      'base_tariff_non_ac': 2400.0,
      'room_units': ['101', '102', '103'],
      'has_seasonal_offer': true,
      'offer_badge': '🌧️ 20% OFF MONSOON',
      'offer_discount': 20.0,
    },
    {
      'id': 'cat_coconut_suite',
      'category_name': 'Coconut Grove Family Villa',
      'template': 'FAMILY_COTTAGE',
      'base_tariff_ac': 4500.0,
      'base_tariff_non_ac': 3600.0,
      'room_units': ['201', '202'],
      'has_seasonal_offer': false,
      'offer_badge': '',
      'offer_discount': 0.0,
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _categoryNameController.dispose();
    _roomNumberInputController.dispose();
    _bedPhotoUrlController.dispose();
    _bathPhotoUrlController.dispose();
    _balconyPhotoUrlController.dispose();
    _panorama360UrlController.dispose();
    super.dispose();
  }

  void _addRoomNumberTag(String val) {
    final trimmed = val.trim();
    if (trimmed.isNotEmpty && !_roomNumbers.contains(trimmed)) {
      setState(() {
        _roomNumbers.add(trimmed);
        _roomNumberInputController.clear();
      });
    }
  }

  void _removeRoomNumberTag(String tag) {
    setState(() {
      _roomNumbers.remove(tag);
    });
  }

  void _cloneRoomUnit(Map<String, dynamic> category) {
    final existingUnits = (category['room_units'] as List<dynamic>).cast<String>();
    int nextNum = 101;
    if (existingUnits.isNotEmpty) {
      final last = int.tryParse(existingUnits.last.replaceAll(RegExp(r'\D'), ''));
      if (last != null) nextNum = last + 1;
    }
    final newRoomNo = nextNum.toString();

    setState(() {
      existingUnits.add(newRoomNo);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: Colors.emerald.shade700,
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text('Room Unit $newRoomNo cloned instantly under ${category['category_name']}!'),
          ],
        ),
      ),
    );
  }

  void _quickEditTariff(Map<String, dynamic> category) {
    final acCtrl = TextEditingController(text: category['base_tariff_ac'].toString());
    final nonAcCtrl = TextEditingController(text: category['base_tariff_non_ac'].toString());

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.currency_rupee, color: Colors.indigo),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Quick Tariff Update: ${category['category_name']}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: acCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Base AC Tariff (₹/night)',
                prefixText: '₹ ',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: nonAcCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Base Non-AC Tariff (₹/night)',
                prefixText: '₹ ',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo),
            onPressed: () {
              setState(() {
                category['base_tariff_ac'] = double.tryParse(acCtrl.text) ?? category['base_tariff_ac'];
                category['base_tariff_non_ac'] = double.tryParse(nonAcCtrl.text) ?? category['base_tariff_non_ac'];
              });
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  backgroundColor: Colors.indigo,
                  content: Text('Tariff updated across POS and Booking Storefront instantly!'),
                ),
              );
            },
            child: const Text('Save Tariff', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _toggleSeasonalOffer(Map<String, dynamic> category) {
    setState(() {
      final current = category['has_seasonal_offer'] as bool;
      category['has_seasonal_offer'] = !current;
      if (!current) {
        category['offer_badge'] = '🌧️ 15% OFF SPECIAL';
        category['offer_discount'] = 15.0;
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: category['has_seasonal_offer'] ? Colors.pink.shade700 : Colors.slate.shade700,
        content: Text(
          category['has_seasonal_offer']
              ? 'Seasonal Offer activated live on Guest Booking Site!'
              : 'Seasonal Offer deactivated.',
        ),
      ),
    );
  }

  void _submitCategoryBulkCreate() {
    if (_roomNumbers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.red,
          content: Text('Please add at least one room number (e.g., 101).'),
        ),
      );
      return;
    }

    final newCat = {
      'id': 'cat_${DateTime.now().millisecondsSinceEpoch}',
      'category_name': _categoryNameController.text.trim(),
      'template': _selectedTemplate,
      'base_tariff_ac': _baseTariffAc,
      'base_tariff_non_ac': _baseTariffNonAc,
      'room_units': List<String>.from(_roomNumbers),
      'has_seasonal_offer': false,
      'offer_badge': '',
      'offer_discount': 0.0,
    };

    setState(() {
      _mockCategories.add(newCat);
      _tabController.animateTo(0);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: Colors.emerald.shade800,
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Category "${_categoryNameController.text}" created with ${_roomNumbers.length} cloned units!',
              ),
            ),
          ],
        ),
      ),
    );

    widget.onSetupCompleted?.call();
  }

  @override
  Widget build(BuildContext context) {
    final guestSavings = _baseTariffAc - _baseTariffNonAc;

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 820, maxHeight: 760),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Scaffold(
            appBar: AppBar(
              backgroundColor: Colors.indigo.shade900,
              foregroundColor: Colors.white,
              title: const Row(
                children: [
                  Icon(Icons.hotel_class_rounded, color: Colors.amber, size: 24),
                  SizedBox(width: 10),
                  Text(
                    'Sequential Room Setup & Offer Engine',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
              bottom: TabBar(
                controller: _tabController,
                indicatorColor: Colors.amber,
                indicatorWeight: 3,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white70,
                tabs: const [
                  Tab(icon: Icon(Icons.view_list_rounded, size: 20), text: 'Existing Rooms & Units'),
                  Tab(icon: Icon(Icons.add_circle_outline_rounded, size: 20), text: '5-Step Room Creator'),
                ],
              ),
            ),
            body: TabBarView(
              controller: _tabController,
              children: [
                _buildExistingCategoriesTab(),
                _build5StepWizardTab(guestSavings),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // TAB 1: Existing Room Categories & Quick Cloner
  Widget _buildExistingCategoriesTab() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Active Room Categories & Physical Units',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'Clone units in 1 tap without typing amenities or tariffs again.',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add Category'),
                onPressed: () => _tabController.animateTo(1),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.separated(
              itemCount: _mockCategories.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final cat = _mockCategories[index];
                final units = (cat['room_units'] as List<dynamic>).cast<String>();
                final hasOffer = cat['has_seasonal_offer'] as bool;

                return Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: Colors.grey.shade300),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.indigo.shade50,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.meeting_room_rounded, color: Colors.indigo),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        cat['category_name'],
                                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.grey.shade100,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          cat['template'],
                                          style: TextStyle(fontSize: 10, color: Colors.grey.shade700),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'AC: ₹${cat['base_tariff_ac'].toInt()} / night  •  Non-AC: ₹${cat['base_tariff_non_ac'].toInt()} / night',
                                    style: TextStyle(fontSize: 13, color: Colors.grey.shade800),
                                  ),
                                ],
                              ),
                            ),
                            OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              ),
                              icon: const Icon(Icons.edit, size: 14),
                              label: const Text('Edit Tariff', style: TextStyle(fontSize: 12)),
                              onPressed: () => _quickEditTariff(cat),
                            ),
                          ],
                        ),
                        const Divider(height: 24),
                        // Cloned room units chips
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            const Text(
                              'Room Units:',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                            ...units.map(
                              (u) => Chip(
                                label: Text(u, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                avatar: const Icon(Icons.door_front_door_rounded, size: 16),
                                backgroundColor: Colors.indigo.shade50,
                                visualDensity: VisualDensity.compact,
                              ),
                            ),
                            // 1-Click "Add Similar Room No." button
                            ActionChip(
                              avatar: const Icon(Icons.add, size: 16, color: Colors.emerald),
                              label: const Text(
                                '+ Add Similar Room No.',
                                style: TextStyle(color: Colors.emerald, fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                              backgroundColor: Colors.emerald.shade50,
                              side: BorderSide(color: Colors.emerald.shade200),
                              onPressed: () => _cloneRoomUnit(cat),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Seasonal offer bar
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: hasOffer ? Colors.pink.shade50 : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(10),
                            border: BorderSide(
                              color: hasOffer ? Colors.pink.shade200 : Colors.grey.shade200,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                hasOffer ? Icons.local_fire_department_rounded : Icons.discount_outlined,
                                size: 18,
                                color: hasOffer ? Colors.pink.shade700 : Colors.grey.shade600,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  hasOffer
                                      ? 'Active Offer: ${cat['offer_badge']} (${cat['offer_discount'].toInt()}% Off)'
                                      : 'No active seasonal offer for this category',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: hasOffer ? FontWeight.bold : FontWeight.normal,
                                    color: hasOffer ? Colors.pink.shade900 : Colors.grey.shade700,
                                  ),
                                ),
                              ),
                              Switch(
                                value: hasOffer,
                                activeColor: Colors.pink.shade700,
                                onChanged: (_) => _toggleSeasonalOffer(cat),
                              ),
                            ],
                          ),
                        ),
                      ],
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

  // TAB 2: 5-STEP LOW-IRRITATION VISUAL WIZARD
  Widget _build5StepWizardTab(double guestSavings) {
    return Column(
      children: [
        // Stepper Progress Header
        Container(
          color: Colors.grey.shade50,
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
          child: Row(
            children: [
              _buildStepIndicator(0, '1. Template & Numbers'),
              const Expanded(child: Divider(thickness: 2)),
              _buildStepIndicator(1, '2. Smart Pricing'),
              const Expanded(child: Divider(thickness: 2)),
              _buildStepIndicator(2, '3. Amenities'),
              const Expanded(child: Divider(thickness: 2)),
              _buildStepIndicator(3, '4. Photos & 360°'),
              const Expanded(child: Divider(thickness: 2)),
              _buildStepIndicator(4, '5. Advanced'),
            ],
          ),
        ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: _buildCurrentStepContent(guestSavings),
          ),
        ),
        // Step Navigation Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Colors.grey.shade200)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (_currentStepIndex > 0)
                OutlinedButton.icon(
                  onPressed: () => setState(() => _currentStepIndex--),
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Previous'),
                )
              else
                const SizedBox.shrink(),
              if (_currentStepIndex < 4)
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                  onPressed: () => setState(() => _currentStepIndex++),
                  icon: const Icon(Icons.arrow_forward),
                  label: const Text('Next Step'),
                )
              else
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.emerald.shade700,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                  onPressed: _submitCategoryBulkCreate,
                  icon: const Icon(Icons.check_circle),
                  label: const Text('Create Category & Cloned Units'),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStepIndicator(int index, String label) {
    final isActive = _currentStepIndex == index;
    final isDone = _currentStepIndex > index;

    return InkWell(
      onTap: () => setState(() => _currentStepIndex = index),
      child: Column(
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: isDone
                ? Colors.emerald
                : isActive
                    ? Colors.indigo
                    : Colors.grey.shade300,
            child: isDone
                ? const Icon(Icons.check, size: 14, color: Colors.white)
                : Text(
                    '${index + 1}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isActive ? Colors.white : Colors.grey.shade700,
                    ),
                  ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              color: isActive ? Colors.indigo : Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentStepContent(double guestSavings) {
    switch (_currentStepIndex) {
      case 0:
        return _buildStep1TemplateAndNumbers();
      case 1:
        return _buildStep2SmartPricing(guestSavings);
      case 2:
        return _buildStep3Amenities();
      case 3:
        return _buildStep4PhotosAndTour();
      case 4:
        return _buildStep5AdvancedSettings();
      default:
        return const SizedBox.shrink();
    }
  }

  // STEP 1: Template & Room Numbers Tag Input
  Widget _buildStep1TemplateAndNumbers() {
    final templates = [
      {'code': 'STANDARD_ROOM', 'label': 'Standard Room', 'icon': Icons.bed},
      {'code': 'DELUXE_AC', 'label': 'Deluxe AC Cottage', 'icon': Icons.ac_unit},
      {'code': 'FAMILY_COTTAGE', 'label': 'Family Cottage', 'icon': Icons.family_restroom},
      {'code': 'DORM_BED', 'label': 'Dorm Bed / Hostels', 'icon': Icons.hotel},
      {'code': 'LUXURY_TENT', 'label': 'Glamping Tent', 'icon': Icons.nature_people},
      {'code': 'VILLA', 'label': 'Private Villa', 'icon': Icons.villa},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Step 1: Choose Category Template',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Text(
          'Select a pre-configured stay archetype to populate default amenities instantly.',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        const SizedBox(height: 14),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: templates.map((t) {
            final isSelected = _selectedTemplate == t['code'];
            return ChoiceChip(
              avatar: Icon(t['icon'] as IconData, size: 18, color: isSelected ? Colors.white : Colors.indigo),
              label: Text(t['label'] as String),
              selected: isSelected,
              selectedColor: Colors.indigo,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : Colors.black87,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              onSelected: (selected) {
                if (selected) {
                  setState(() {
                    _selectedTemplate = t['code'] as String;
                    _categoryNameController.text = t['label'] as String;
                  });
                }
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 20),
        TextField(
          controller: _categoryNameController,
          decoration: const InputDecoration(
            labelText: 'Custom Category Name',
            hintText: 'e.g., Sea-Facing Deluxe AC Cottage',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.label_outline),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Physical Room Numbers (Bulk Units Creation)',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Text(
          'Enter room numbers for this category (e.g. 101, 102, 103). Unique QR codes will be generated automatically.',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _roomNumberInputController,
                decoration: const InputDecoration(
                  hintText: 'Type room number (e.g., 104) and tap Add',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.door_front_door_outlined),
                ),
                onSubmitted: _addRoomNumberTag,
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
              ),
              onPressed: () => _addRoomNumberTag(_roomNumberInputController.text),
              icon: const Icon(Icons.add),
              label: const Text('Add Room'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _roomNumbers.map((r) {
            return Chip(
              label: Text('Room $r', style: const TextStyle(fontWeight: FontWeight.bold)),
              avatar: const Icon(Icons.qr_code, size: 16),
              deleteIcon: const Icon(Icons.cancel, size: 16),
              onDeleted: () => _removeRoomNumberTag(r),
              backgroundColor: Colors.indigo.shade50,
            );
          }).toList(),
        ),
      ],
    );
  }

  // STEP 2: AC / Non-AC Smart Pricing Cards
  Widget _buildStep2SmartPricing(double guestSavings) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Step 2: AC / Non-AC Smart Pricing',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Text(
          'Allow guests to switch off AC on the booking site to book an affordable homestay rate while preserving your margin.',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            // AC Tariff Card
            Expanded(
              child: Card(
                color: Colors.blue.shade50,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.blue.shade200),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.ac_unit, color: Colors.blue),
                          SizedBox(width: 6),
                          Text('❄️ Base AC Tariff', style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          prefixText: '₹ ',
                          suffixText: '/ night',
                          border: OutlineInputBorder(),
                          filled: true,
                          fillColor: Colors.white,
                        ),
                        controller: TextEditingController(text: _baseTariffAc.toInt().toString()),
                        onChanged: (val) {
                          setState(() {
                            _baseTariffAc = double.tryParse(val) ?? _baseTariffAc;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            // Non-AC Tariff Card
            Expanded(
              child: Card(
                color: Colors.emerald.shade50,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.emerald.shade200),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.between,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.eco, color: Colors.emerald),
                              SizedBox(width: 6),
                              Text('🌿 Non-AC Tariff', style: TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                          Switch(
                            value: _allowGuestNonAcToggle,
                            activeColor: Colors.emerald,
                            onChanged: (val) => setState(() => _allowGuestNonAcToggle = val),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        enabled: _allowGuestNonAcToggle,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          prefixText: '₹ ',
                          suffixText: '/ night',
                          border: OutlineInputBorder(),
                          filled: true,
                          fillColor: Colors.white,
                        ),
                        controller: TextEditingController(text: _baseTariffNonAc.toInt().toString()),
                        onChanged: (val) {
                          setState(() {
                            _baseTariffNonAc = double.tryParse(val) ?? _baseTariffNonAc;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        // Live Guest Savings Callout
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.amber.shade50,
            borderRadius: BorderRadius.circular(12),
            border: BorderSide(color: Colors.amber.shade300),
          ),
          child: Row(
            children: [
              const Icon(Icons.savings_outlined, color: Colors.amber, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Psychological Savings Preview: Guest Saves ₹${guestSavings.toInt()} / night!',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const Text(
                      'This highlights instant value on the booking card, increasing booking conversion by up to 34%.',
                      style: TextStyle(fontSize: 11, color: Colors.black87),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: TextField(
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Extra Mattress Charge',
                  prefixText: '₹ ',
                  border: OutlineInputBorder(),
                ),
                controller: TextEditingController(text: _extraMattressCharge.toInt().toString()),
                onChanged: (v) => _extraMattressCharge = double.tryParse(v) ?? _extraMattressCharge,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: CheckboxListTile(
                title: const Text('Free Driver Stay Included', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                subtitle: const Text('Complimentary driver dormitory', style: TextStyle(fontSize: 11)),
                value: _driverStayFree,
                onChanged: (v) => setState(() => _driverStayFree = v ?? true),
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ],
        ),
      ],
    );
  }

  // STEP 3: 1-Tap Yes/No Amenities & Bathroom Specs
  Widget _buildStep3Amenities() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Step 3: 1-Tap Amenities & Bathroom Specs',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Text(
          'Guests care about bathrooms and hot water most. Set specs with 1 tap.',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        const SizedBox(height: 16),
        const Text('Bathroom Location:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          children: [
            ChoiceChip(
              label: const Text('Attached Inside'),
              selected: _bathroomLocation == 'ATTACHED_INSIDE',
              onSelected: (_) => setState(() => _bathroomLocation = 'ATTACHED_INSIDE'),
            ),
            ChoiceChip(
              label: const Text('Private Outside'),
              selected: _bathroomLocation == 'PRIVATE_OUTSIDE',
              onSelected: (_) => setState(() => _bathroomLocation = 'PRIVATE_OUTSIDE'),
            ),
            ChoiceChip(
              label: const Text('Shared Common'),
              selected: _bathroomLocation == 'SHARED_COMMON',
              onSelected: (_) => setState(() => _bathroomLocation = 'SHARED_COMMON'),
            ),
          ],
        ),
        const SizedBox(height: 14),
        const Text('Toilet Type:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          children: [
            ChoiceChip(
              label: const Text('Western Commode'),
              selected: _toiletType == 'WESTERN',
              onSelected: (_) => setState(() => _toiletType = 'WESTERN'),
            ),
            ChoiceChip(
              label: const Text('Indian Squat'),
              selected: _toiletType == 'INDIAN',
              onSelected: (_) => setState(() => _toiletType = 'INDIAN'),
            ),
            ChoiceChip(
              label: const Text('Both Available'),
              selected: _toiletType == 'BOTH',
              onSelected: (_) => setState(() => _toiletType = 'BOTH'),
            ),
          ],
        ),
        const SizedBox(height: 14),
        const Text('Hot Water System:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          children: [
            ChoiceChip(
              label: const Text('24x7 Electric Geyser'),
              selected: _hotWaterType == 'GEYSER_24X7',
              onSelected: (_) => setState(() => _hotWaterType = 'GEYSER_24X7'),
            ),
            ChoiceChip(
              label: const Text('Solar (Morning Only)'),
              selected: _hotWaterType == 'SOLAR_MORNING',
              onSelected: (_) => setState(() => _hotWaterType = 'SOLAR_MORNING'),
            ),
            ChoiceChip(
              label: const Text('Bucket Hot Water on Demand'),
              selected: _hotWaterType == 'BUCKET_HOT_WATER',
              onSelected: (_) => setState(() => _hotWaterType = 'BUCKET_HOT_WATER'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        const Text('Key Comfort Toggles:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            FilterChip(
              avatar: const Icon(Icons.wifi, size: 16),
              label: const Text('Free High-Speed Wi-Fi'),
              selected: _wifiFree,
              onSelected: (v) => setState(() => _wifiFree = v),
            ),
            FilterChip(
              avatar: const Icon(Icons.electric_bolt, size: 16),
              label: const Text('Inverter Power Backup'),
              selected: _powerBackupInverter,
              onSelected: (v) => setState(() => _powerBackupInverter = v),
            ),
            FilterChip(
              avatar: const Icon(Icons.directions_car, size: 16),
              label: const Text('Car Parking'),
              selected: _parkingCar,
              onSelected: (v) => setState(() => _parkingCar = v),
            ),
            FilterChip(
              avatar: const Icon(Icons.directions_bus, size: 16),
              label: const Text('Bus / Traveler Parking'),
              selected: _parkingBus,
              onSelected: (v) => setState(() => _parkingBus = v),
            ),
            FilterChip(
              avatar: const Icon(Icons.tv, size: 16),
              label: const Text('Smart TV'),
              selected: _tvSmart,
              onSelected: (v) => setState(() => _tvSmart = v),
            ),
            FilterChip(
              avatar: const Icon(Icons.balcony, size: 16),
              label: const Text('Private Balcony'),
              selected: _privateBalcony,
              onSelected: (v) => setState(() => _privateBalcony = v),
            ),
            FilterChip(
              avatar: const Icon(Icons.pets, size: 16),
              label: const Text('Pet Friendly'),
              selected: _petFriendly,
              onSelected: (v) => setState(() => _petFriendly = v),
            ),
          ],
        ),
      ],
    );
  }

  // STEP 4: Guided 3-Slot Photo Uploader + 360 Panorama Slot
  Widget _buildStep4PhotosAndTour() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Step 4: Guided 3-Slot Photos & 360° Virtual Tour',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Text(
          'Photos of bed, bathroom, and balcony answer 90% of guest inquiries instantly.',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildPhotoSlot(
                title: '1. Bed & Room',
                controller: _bedPhotoUrlController,
                icon: Icons.bed_rounded,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildPhotoSlot(
                title: '2. Bathroom',
                controller: _bathPhotoUrlController,
                icon: Icons.bathtub_rounded,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildPhotoSlot(
                title: '3. Balcony / View',
                controller: _balconyPhotoUrlController,
                icon: Icons.balcony_rounded,
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        const Text(
          '360° Panorama Tour URL (Plan-Gated Feature):',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _panorama360UrlController,
          decoration: const InputDecoration(
            hintText: 'https://pannellum.org/images/alma.jpg',
            prefixIcon: Icon(Icons.threesixty_rounded, color: Colors.amber),
            border: OutlineInputBorder(),
          ),
        ),
      ],
    );
  }

  Widget _buildPhotoSlot({
    required String title,
    required TextEditingController controller,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: Colors.indigo),
              const SizedBox(width: 6),
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            height: 90,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(8),
              image: controller.text.isNotEmpty
                  ? DecorationImage(
                      image: NetworkImage(controller.text),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: controller.text.isEmpty
                ? const Center(child: Icon(Icons.add_a_photo_outlined, color: Colors.grey))
                : null,
          ),
          const SizedBox(height: 8),
          TextField(
            controller: controller,
            style: const TextStyle(fontSize: 11),
            decoration: const InputDecoration(
              isDense: true,
              hintText: 'Paste Image URL',
              border: OutlineInputBorder(),
            ),
            onChanged: (_) => setState(() {}),
          ),
        ],
      ),
    );
  }

  // STEP 5: Collapsible Advanced Settings
  Widget _buildStep5AdvancedSettings() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Step 5: Review & Advanced Settings',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Text(
          'Advanced rules are pre-configured. Open the panel only if you want custom surge or policies.',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        const SizedBox(height: 16),
        // Summary Card
        Card(
          color: Colors.indigo.shade50,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _categoryNameController.text,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.indigo),
                ),
                const SizedBox(height: 6),
                Text('• Units to create: ${_roomNumbers.join(", ")} (${_roomNumbers.length} total)'),
                Text('• AC Tariff: ₹${_baseTariffAc.toInt()} / night (Non-AC: ₹${_baseTariffNonAc.toInt()})'),
                Text('• Bathroom: $_bathroomLocation with $_toiletType commode'),
                Text('• Hot water: $_hotWaterType'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Collapsible Advanced Settings ExpansionTile
        Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.grey.shade300),
          ),
          child: ExpansionTile(
            leading: const Icon(Icons.settings_outlined, color: Colors.indigo),
            title: const Text(
              '⚙️ Advanced Settings (Weekend Surge, Policies, Permissions)',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            childrenPadding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Weekend Surge %',
                        suffixText: '%',
                        border: OutlineInputBorder(),
                      ),
                      controller: TextEditingController(text: _weekendSurgePercent.toInt().toString()),
                      onChanged: (v) => _weekendSurgePercent = double.tryParse(v) ?? _weekendSurgePercent,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextField(
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Minimum Stay Nights',
                        border: OutlineInputBorder(),
                      ),
                      controller: TextEditingController(text: _minNights.toString()),
                      onChanged: (v) => _minNights = int.tryParse(v) ?? _minNights,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                title: const Text('Child Policy: Under 6 years stay free', style: TextStyle(fontSize: 13)),
                value: _childPolicyFreeUnder6,
                onChanged: (v) => setState(() => _childPolicyFreeUnder6 = v),
              ),
              SwitchListTile(
                title: const Text('Allow Manager to Override/Edit Tariff at POS', style: TextStyle(fontSize: 13)),
                value: _managerCanEditRates,
                onChanged: (v) => setState(() => _managerCanEditRates = v),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
