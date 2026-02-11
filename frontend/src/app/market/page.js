'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TrendingUp, MapPin, Plus, DollarSign, Trash2, Star } from 'lucide-react';
import ExportShare from '../../components/ExportShare';
import { parseJsonResponse } from '../../lib/api';
import { getTranslatedCropName } from '../../lib/crops';

// Helper to categorize crops
const getCategory = (cropName) => {
    const categories = {
        'Wheat': 'Grains', 'Rice': 'Grains', 'Maize': 'Grains', 'Barley': 'Grains',
        'Tomato': 'Vegetables', 'Potato': 'Vegetables', 'Carrot': 'Vegetables', 'Onion': 'Vegetables', 'Cucumber': 'Vegetables',
        'Cotton': 'Commercial', 'Tobacco': 'Commercial',
        'Apple': 'Fruits', 'Grape': 'Fruits', 'Melon': 'Fruits', 'Watermelon': 'Fruits'
    };
    return categories[cropName] || 'Others';
};

// Simple Sparkline Component
const Sparkline = ({ data, color = "#10B981" }) => {
    const { t } = useTranslation();
    if (!data || data.length < 2) return null;

    // Ensure data is sorted by date for accurate trend
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

    const height = 40;
    const width = 120;
    const prices = sortedData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    // Calculate points
    const points = prices.map((p, i) => {
        const x = (i / (prices.length - 1)) * width;
        const y = height - ((p - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const latestPrice = prices[prices.length - 1];
    const initialPrice = prices[0];
    const trend = latestPrice >= initialPrice ? 'up' : 'down';
    const trendColor = trend === 'up' ? '#10B981' : '#EF4444';
    const percentageChange = ((latestPrice - initialPrice) / (initialPrice || 1) * 100).toFixed(1);

    return (
        <div className="flex flex-col items-end">
            <svg width={width} height={height} className="overflow-visible">
                <polyline
                    points={points}
                    fill="none"
                    stroke={trendColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <circle
                    cx={width}
                    cy={height - ((latestPrice - min) / range) * height}
                    r="3"
                    fill={trendColor}
                />
            </svg>
            <div className={`text-xs font-bold mt-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trend === 'up' ? '↗' : '↘'} {percentageChange}% (30d)
            </div>
        </div>
    );
};

export default function MarketPage() {
    const { t } = useTranslation();
    const [prices, setPrices] = useState([]);
    const [filteredPrices, setFilteredPrices] = useState([]);
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSubmit, setShowSubmit] = useState(false);
    const [user, setUser] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Form state
    const [cropId, setCropId] = useState('');
    const [region, setRegion] = useState('');
    const [price, setPrice] = useState('');
    const [volumeTier, setVolumeTier] = useState('retail');

    const categories = ['All', 'Grains', 'Vegetables', 'Fruits', 'Commercial', 'Others'];

    const fetchPrices = async () => {
        try {
            const res = await fetch('/api/prices');
            const data = await parseJsonResponse(res);
            const priceData = Array.isArray(data) ? data : [];

            // Parse history if it's a string
            const processedData = priceData.map(item => ({
                ...item,
                category: getCategory(item.crop),
                history: typeof item.history === 'string' ? JSON.parse(item.history) : (item.history || []),
                dist_farmers: item.dist_farmers || 0,
                anon_reports: item.anon_reports || 0
            }));

            setPrices(processedData);
            setFilteredPrices(processedData);
        } catch (err) {
            console.error(err);
            setPrices([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCrops = async () => {
        try {
            const res = await fetch('/api/crops', { cache: 'no-store' });
            const data = await parseJsonResponse(res);
            const cropsData = Array.isArray(data) ? data : [];
            setCrops(cropsData);
            if (cropsData.length > 0) {
                setCropId(cropsData[0].id.toString());
            }
        } catch (err) {
            console.error("Failed to fetch crops", err);
            setCrops([]);
        }
    };

    useEffect(() => {
        fetchPrices();
        fetchCrops();

        const storedUser = localStorage.getItem('farm_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = prices;

        if (selectedCategory !== 'All') {
            result = result.filter(p => p.category === selectedCategory);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.crop.toLowerCase().includes(query) ||
                p.region.toLowerCase().includes(query)
            );
        }

        setFilteredPrices(result);
    }, [prices, selectedCategory, searchQuery]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crop_type_id: parseInt(cropId),
                region: region,
                price_per_kg: parseFloat(price),
                volume_tier: volumeTier,
                user_id: user?.id || null
            })
        });
        if (res.ok) {
            setShowSubmit(false);
            fetchPrices();
            setRegion('');
            setPrice('');
            setVolumeTier('retail');
            alert(t('market.priceSubmitted'));
        }
    };

    const handleDeletePrice = async (priceId) => {
        if (!user) return;
        if (!confirm(t('market.deleteConfirm'))) return;

        try {
            const res = await fetch(`/api/prices/${priceId}?user_id=${user.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchPrices();
            } else {
                const data = await parseJsonResponse(res);
                alert(data.error || t('errors.somethingWrong'));
            }
        } catch (err) {
            console.error(err);
            alert(t('errors.networkError'));
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 pt-32">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="heading-xl text-4xl md:text-5xl mb-3 flex items-center gap-3">
                        <TrendingUp className="w-10 h-10 text-brand-green" /> {t('market.title')}
                    </h1>
                    <p className="text-subtle text-lg">{t('market.subtitle')}</p>
                </motion.div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setShowSubmit(!showSubmit)}
                        className="btn-primary shadow-lg shadow-brand-green/30"
                    >
                        <Plus className="w-5 h-5" />
                        {t('market.sharePrice')}
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="glass-panel p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-24 z-10 backdrop-blur-xl bg-white/80">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-brand-dark text-white shadow-md' : 'bg-surface-100 text-subtle hover:bg-surface-200'}`}
                        >
                            {cat === 'All' ? t('common.all') : t(`categories.${cat.toLowerCase()}`, cat)}
                        </button>
                    ))}
                </div>
                <div className="w-full md:w-64 relative">
                    <input
                        type="text"
                        placeholder={t('market.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-modern w-full pl-10"
                    />
                    <TrendingUp className="w-4 h-4 text-subtle absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
            </div>

            {showSubmit && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-8 mb-12 border-2 border-brand-green/20"
                >
                    <h3 className="text-xl font-bold text-brand-dark mb-4">{t('market.contributeData')}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold mb-2 text-brand-dark">{t('market.crop')}</label>
                            <select
                                value={cropId}
                                onChange={(e) => setCropId(e.target.value)}
                                className="input-modern w-full"
                            >
                                {crops.map(c => (
                                    <option key={c.id} value={c.id}>{getTranslatedCropName(t, c.name)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold mb-2 text-brand-dark">{t('market.region')}</label>
                            <input
                                placeholder="e.g. Tashkent"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="input-modern w-full"
                                required
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold mb-2 text-brand-dark">{t('market.volumeTier')}</label>
                            <select
                                value={volumeTier}
                                onChange={(e) => setVolumeTier(e.target.value)}
                                className="input-modern w-full"
                            >
                                <option value="retail">{t('market.retail')}</option>
                                <option value="wholesale">{t('market.wholesale')}</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold mb-2 text-brand-dark">{t('market.pricePerKg')}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.25"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="input-modern w-full pl-8"
                                    required
                                />
                            </div>
                        </div>
                        <button className="btn-primary w-full h-[52px] flex items-center justify-center shadow-lg">{t('common.submit')}</button>
                    </form>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-subtle animate-pulse">{t('common.loading')}</div>
                ) : filteredPrices.length > 0 ? (
                    filteredPrices.map((item, i) => (
                        <motion.div
                            key={i}
                            id={`market-card-${i}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card p-6 glass-card-hover group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center text-xl font-bold text-brand-dark border border-surface-200">
                                        {getTranslatedCropName(t, item.crop)[0] || item.crop[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-brand-dark">{getTranslatedCropName(t, item.crop)}</h3>
                                        </div>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-100 text-subtle uppercase tracking-wider">
                                            {t(`categories.${item.category.toLowerCase()}`, item.category)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right space-y-2">
                                    <ExportShare targetId={`market-card-${i}`} title={`${getTranslatedCropName(t, item.crop)} Market Data`} data={item} />
                                    {item.retail_price > 0 && (
                                        <div>
                                            <div className="text-xs text-subtle uppercase tracking-wider">{t('market.retail')}</div>
                                            <span className="text-xl font-black text-brand-green">${item.retail_price.toFixed(2)}</span>
                                            <span className="text-xs text-subtle">/kg</span>
                                        </div>
                                    )}
                                    {item.wholesale_price > 0 && (
                                        <div>
                                            <div className="text-xs text-subtle uppercase tracking-wider">{t('market.wholesale')}</div>
                                            <span className="text-xl font-black text-blue-600">${item.wholesale_price.toFixed(2)}</span>
                                            <span className="text-xs text-subtle">/kg</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-surface-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-subtle text-sm">
                                        <MapPin className="w-4 h-4 text-brand-green" />
                                        {item.region}
                                    </div>

                                    {/* Verification Badges */}
                                    <div className="flex flex-wrap gap-2">
                                        {item.dist_farmers > 0 && (
                                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full transition-all ${item.dist_farmers >= 3 ? 'bg-brand-gold/20 text-brand-dark border border-brand-gold' : 'bg-green-100 text-green-700'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.dist_farmers >= 3 ? 'bg-brand-gold animate-bounce' : 'bg-green-500 animate-pulse'}`} />
                                                {item.dist_farmers >= 3 && <Star className="w-3 h-3 fill-brand-gold text-brand-gold" />}
                                                {item.dist_farmers >= 3 ? t('market.highConfidence') : t('market.verifiedBy', { count: item.dist_farmers })}
                                            </div>
                                        )}
                                        {item.anon_reports > 0 && item.dist_farmers === 0 && (
                                            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-surface-100 text-subtle border border-surface-200">
                                                <div className="w-1.5 h-1.5 rounded-full bg-subtle" />
                                                {item.anon_reports} {t('market.communityReports')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Your Active Reports */}
                                {user && item.history && item.history.some(h => h.user_id === user.id) && (
                                    <div className="mt-3 overflow-hidden rounded-xl border border-blue-100 bg-blue-50/30">
                                        <div className="bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 flex justify-between items-center">
                                            <span>{t('market.yourReports')}</span>
                                            <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-md text-[9px]">
                                                {item.history.filter(h => h.user_id === user.id).length}
                                            </span>
                                        </div>
                                        <div className="p-2 space-y-1.5 max-h-32 overflow-y-auto">
                                            {[...item.history]
                                                .reverse()
                                                .filter(h => h.user_id === user.id)
                                                .map((report) => (
                                                    <div key={report.id} className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-blue-100/50 shadow-sm transition-all hover:border-blue-200">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${report.tier === 'wholesale' ? 'bg-blue-500' : 'bg-brand-green'}`} />
                                                            <span className="text-xs font-bold text-brand-dark">${report.price.toFixed(2)}</span>
                                                            <span className="text-[10px] text-subtle capitalize">({t(`market.${report.tier}`)})</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] text-subtle">{new Date(report.date).toLocaleDateString()}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeletePrice(report.id);
                                                                }}
                                                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sparkline Graph */}
                                {item.history && item.history.length > 1 ? (
                                    <Sparkline data={item.history} />
                                ) : (
                                    <div className="text-xs text-subtle italic">{t('market.collectingTrends')}</div>
                                )}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-24 text-center glass-panel border-dashed">
                        <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4 text-subtle">
                            <DollarSign className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-brand-dark">{t('common.noData')}</h3>
                        <p className="text-subtle">{t('market.noDataMessage')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

