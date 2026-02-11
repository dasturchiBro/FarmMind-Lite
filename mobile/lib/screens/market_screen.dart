import 'package:flutter/material.dart';

import '../models/market_price.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class MarketScreen extends StatefulWidget {
  const MarketScreen({super.key});

  @override
  State<MarketScreen> createState() => _MarketScreenState();
}

class _MarketScreenState extends State<MarketScreen> {
  List<MarketPrice> _prices = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await ApiService.getLatestPrices();
      if (mounted) setState(() => _prices = list);
    } catch (e) {
      if (mounted)
        setState(() {
          _error = e.toString();
          _prices = [];
        });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Market Trends'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        FilledButton(
                            onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: _prices.isEmpty
                      ? const Center(child: Text('No price data yet'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _prices.length,
                          itemBuilder: (_, i) {
                            final p = _prices[i];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                title: Text('${p.crop} - ${p.region}'),
                                subtitle: Text(
                                  'Retail: \$${p.retailPrice.toStringAsFixed(2)}/kg • Wholesale: \$${p.wholesalePrice.toStringAsFixed(2)}/kg',
                                ),
                                trailing: p.distFarmers > 0
                                    ? Chip(
                                        label: Text('${p.distFarmers} farmers'),
                                        backgroundColor: AppTheme.primaryGreen
                                            .withValues(alpha: 0.2),
                                      )
                                    : null,
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
