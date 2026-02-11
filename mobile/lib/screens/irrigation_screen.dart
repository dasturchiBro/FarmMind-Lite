import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/crop_type.dart';
import '../models/irrigation.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class IrrigationScreen extends StatefulWidget {
  const IrrigationScreen({super.key});

  @override
  State<IrrigationScreen> createState() => _IrrigationScreenState();
}

class _IrrigationScreenState extends State<IrrigationScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<CropType> _crops = [];
  IrrigationSchedule? _schedule;
  List<SavedIrrigationSchedule> _saved = [];
  bool _loading = false;
  String? _error;
  String _selectedCrop = 'Wheat';
  DateTime _plantingDate = DateTime.now();
  String _region = 'Tashkent';

  static const _regions = [
    'Tashkent',
    'Fergana',
    'Samarkand',
    'Karakalpakstan',
    'Khorezm',
    'Mountainous',
    'Bukhara',
    'Andijan',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 1) _loadSaved();
    });
    _loadCrops();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadCrops() async {
    try {
      final list = await ApiService.getCropTypes();
      if (mounted) {
        setState(() {
          _crops = list;
          if (_crops.isNotEmpty &&
              !_crops.any((c) => c.name == _selectedCrop)) {
            _selectedCrop = _crops.first.name;
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _loadSaved() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;
    try {
      final list = await ApiService.getSavedSchedules(user.id);
      if (mounted) setState(() => _saved = list);
    } catch (_) {}
  }

  Future<void> _generate() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final s = await ApiService.getIrrigationSchedule(
        crop: _selectedCrop,
        plantingDate: _plantingDate.toIso8601String().split('T')[0],
        region: _region,
      );
      if (mounted) setState(() => _schedule = s);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveSchedule() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Please login to save')));
      return;
    }
    if (_schedule == null || _schedule!.reminders.isEmpty) return;
    setState(() => _loading = true);
    try {
      await ApiService.saveIrrigationSchedule(
        userId: user.id,
        cropName: _schedule!.cropName,
        region: _region,
        plantingDate: _plantingDate.toIso8601String().split('T')[0],
        reminders: _schedule!.reminders.map((r) => r.toJson()).toList(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Schedule saved!')));
        _loadSaved();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Irrigation Planner'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'New Schedule'),
            Tab(text: 'Saved'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildNewSchedule(context),
          _buildSavedTab(context),
        ],
      ),
    );
  }

  Widget _buildNewSchedule(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DropdownButtonFormField<String>(
            value: _crops.any((c) => c.name == _selectedCrop)
                ? _selectedCrop
                : (_crops.isNotEmpty ? _crops.first.name : null),
            decoration: const InputDecoration(labelText: 'Crop'),
            items: _crops
                .map(
                    (c) => DropdownMenuItem(value: c.name, child: Text(c.name)))
                .toList(),
            onChanged: (v) =>
                setState(() => _selectedCrop = v ?? _selectedCrop),
          ),
          const SizedBox(height: 16),
          ListTile(
            title: const Text('Planting Date'),
            subtitle: Text(_plantingDate.toIso8601String().split('T')[0]),
            onTap: () async {
              final d = await showDatePicker(
                context: context,
                initialDate: _plantingDate,
                firstDate: DateTime(2020),
                lastDate: DateTime(2030),
              );
              if (d != null) setState(() => _plantingDate = d);
            },
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _region,
            decoration: const InputDecoration(labelText: 'Region'),
            items: _regions
                .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                .toList(),
            onChanged: (v) => setState(() => _region = v ?? _region),
          ),
          const SizedBox(height: 24),
          if (_error != null) ...[
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
          ],
          FilledButton(
            onPressed: _loading ? null : _generate,
            child: _loading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Generate Schedule'),
          ),
          if (_schedule != null) ...[
            const SizedBox(height: 24),
            ..._schedule!.reminders.map((r) => Card(
                  child: ListTile(
                    title: Text(r.stage),
                    subtitle: Text('${r.date}\n${r.action}'),
                  ),
                )),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _loading ? null : _saveSchedule,
              child: const Text('Save Schedule'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSavedTab(BuildContext context) {
    if (_saved.isEmpty) {
      return const Center(child: Text('No saved schedules'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _saved.length,
      itemBuilder: (_, i) {
        final s = _saved[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ExpansionTile(
            title: Text('${s.cropName} - ${s.region}'),
            subtitle: Text('Planting: ${s.plantingDate}'),
            children: s.steps
                .map((st) => ListTile(
                      leading: Icon(
                        st.completedAt != null
                            ? Icons.check_circle
                            : Icons.radio_button_unchecked,
                        color: st.completedAt != null
                            ? AppTheme.primaryGreen
                            : null,
                      ),
                      title: Text(st.stage),
                      subtitle: Text('${st.date}: ${st.action}'),
                    ))
                .toList(),
          ),
        );
      },
    );
  }
}
