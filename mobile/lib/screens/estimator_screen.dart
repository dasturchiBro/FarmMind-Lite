import 'package:flutter/material.dart';

import '../models/crop_type.dart';
import '../models/estimation.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class EstimatorScreen extends StatefulWidget {
  const EstimatorScreen({super.key});

  @override
  State<EstimatorScreen> createState() => _EstimatorScreenState();
}

class _EstimatorScreenState extends State<EstimatorScreen> {
  List<CropType> _crops = [];
  CropEstimation? _result;
  double _lastArea = 1;
  bool _loading = false;
  String? _error;
  String _selectedCrop = 'Wheat';
  final _areaController = TextEditingController(text: '1');

  @override
  void initState() {
    super.initState();
    _loadCrops();
  }

  @override
  void dispose() {
    _areaController.dispose();
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

  Future<void> _calculate() async {
    final area = double.tryParse(_areaController.text);
    if (area == null || area <= 0) {
      setState(() => _error = 'Enter a valid area in hectares');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _result = null;
      _lastArea = area;
    });
    try {
      final est = await ApiService.getEstimation(
        crop: _selectedCrop,
        area: area,
      );
      if (mounted) setState(() => _result = est);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profit Estimator'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DropdownButtonFormField<String>(
              value: _crops.any((c) => c.name == _selectedCrop)
                  ? _selectedCrop
                  : (_crops.isNotEmpty ? _crops.first.name : null),
              decoration: const InputDecoration(labelText: 'Crop Type'),
              items: _crops
                  .map((c) =>
                      DropdownMenuItem(value: c.name, child: Text(c.name)))
                  .toList(),
              onChanged: (v) =>
                  setState(() => _selectedCrop = v ?? _selectedCrop),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _areaController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Area (hectares)',
                suffixText: 'ha',
              ),
            ),
            const SizedBox(height: 24),
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
            ],
            FilledButton(
              onPressed: _loading ? null : _calculate,
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Calculate'),
            ),
            if (_result != null) ...[
              const SizedBox(height: 24),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_result!.cropName} - $_lastArea ha',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const Divider(),
                      _row('Yield Range',
                          '${_result!.minYieldKg.toStringAsFixed(0)} - ${_result!.maxYieldKg.toStringAsFixed(0)} kg'),
                      _row('Income Range',
                          '\$${_result!.minIncomeUsd.toStringAsFixed(0)} - \$${_result!.maxIncomeUsd.toStringAsFixed(0)}'),
                      _row('Avg Price',
                          '\$${_result!.avgPricePerKg.toStringAsFixed(2)}/kg'),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.textSecondary)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
