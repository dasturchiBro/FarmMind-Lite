import 'package:flutter/material.dart';

import '../config/api_config.dart';
import '../models/marketplace_listing.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  List<MarketplaceListing> _listings = [];
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
      final list = await ApiService.getMarketplaceListings();
      if (mounted) setState(() => _listings = list);
    } catch (e) {
      if (mounted)
        setState(() {
          _error = e.toString();
          _listings = [];
        });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Farmers Marketplace'),
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
                  child: _listings.isEmpty
                      ? const Center(child: Text('No listings yet'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _listings.length,
                          itemBuilder: (_, i) {
                            final l = _listings[i];
                            return _ListingCard(listing: l);
                          },
                        ),
                ),
    );
  }
}

class _ListingCard extends StatelessWidget {
  final MarketplaceListing listing;

  const _ListingCard({required this.listing});

  @override
  Widget build(BuildContext context) {
    final imgUrl = listing.images.isNotEmpty
        ? '${ApiConfig.baseUrl}${listing.images.first}'
        : null;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _showDetails(context),
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (imgUrl != null)
              ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(12)),
                child: Image.network(
                  imgUrl,
                  height: 160,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    height: 160,
                    color: Colors.grey[200],
                    child: const Icon(Icons.image_not_supported, size: 48),
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    listing.cropName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${listing.quantityKg.toStringAsFixed(0)} kg • \$${listing.pricePerKg.toStringAsFixed(2)}/kg',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                  ),
                  Text(
                    '${listing.region} • ${listing.farmerName}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                  ),
                  if (listing.averageRating > 0)
                    Row(
                      children: [
                        Icon(Icons.star, size: 16, color: AppTheme.accentGold),
                        const SizedBox(width: 4),
                        Text(
                          '${listing.averageRating.toStringAsFixed(1)} (${listing.reviewCount})',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        expand: false,
        builder: (_, ctrl) => SingleChildScrollView(
          controller: ctrl,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                listing.cropName,
                style: Theme.of(ctx).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text('Quantity: ${listing.quantityKg.toStringAsFixed(0)} kg'),
              Text('Price: \$${listing.pricePerKg.toStringAsFixed(2)}/kg'),
              Text('Region: ${listing.region}'),
              Text('Harvest: ${listing.harvestReadyDate}'),
              if (listing.description.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  listing.description,
                  style: Theme.of(ctx).textTheme.bodyMedium,
                ),
              ],
              const SizedBox(height: 16),
              Text('Seller: ${listing.farmerName}'),
              Text('Phone: ${listing.farmerPhone}'),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () {
                    // Could launch tel: or copy phone
                    Navigator.pop(ctx);
                  },
                  icon: const Icon(Icons.phone),
                  label: const Text('Contact Farmer'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
