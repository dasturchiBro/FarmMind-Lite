'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, BarChart3, Info, Wallet, Droplets, AlertTriangle, GitCompare, Flame, CloudRain } from 'lucide-react';

export default function EstimatorPage() {
    const [crop, setCrop] = useState('');
    const [compareCrop, setCompareCrop] = useState('');
    const [crops, setCrops] = useState([]);
    const [area, setArea] = useState('');
    const [results, setResults] = useState(null);
    const [compareResults, setCompareResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [unit, setUnit] = useState('sotyk'); // 'hectare' or 'sotyk'

    // Cost deductions
    const [deductSeeds, setDeductSeeds] = useState(false);
    const [deductFertilizer, setDeductFertilizer] = useState(false);
    const [deductLabor, setDeductLabor] = useState(false);

    // Risk slider
    const [riskLevel, setRiskLevel] = useState(0); // 0-100

    // Regional cost averages (per hectare)
    const COST_PER_HA = {
        seeds: 50,
        fertilizer: 120,
        labor: 200
    };

    const fetchCrops = async () => {
        try {
            const res = await fetch('/api/crops', { cache: 'no-store' });
            const data = await res.json();
            setCrops(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch crops", err);
            setCrops([]);
        }
    };

    useEffect(() => {
        fetchCrops();
    }, []);

    const calculateWaterRequirement = (cropName, areaHa) => {
        // Rough water requirements in cubic meters per hectare
        const waterNeeds = {
            'Rice': 8000,
            'Wheat': 4000,
            'Maize': 5000,
            'Cotton': 6000,
            'Potato': 4500,
            'Tomato': 5500,
            'Carrot': 3500,
            'Onion': 4000
        };
        return (waterNeeds[cropName] || 5000) * areaHa;
    };

    const handleEstimate = async (e, isComparison = false) => {
        e.preventDefault();
        setLoading(true);
        const selectedCrop = isComparison ? compareCrop : crop;

        const areaInHectares = unit === 'sotyk' ? parseFloat(area) / 100 : parseFloat(area);

        try {
            const res = await fetch(`/api/estimate?crop=${selectedCrop}&area=${areaInHectares}`, { cache: 'no-store' });

            if (res.ok) {
                const data = await res.json();
                const waterReq = calculateWaterRequirement(selectedCrop, areaInHectares);
                const enhancedData = { ...data, waterRequirement: waterReq, usedArea: areaInHectares };

                if (isComparison) {
                    setCompareResults(enhancedData);
                } else {
                    setResults(enhancedData);
                }
            } else {
                const text = await res.text();
                let errorMessage = "Failed to calculate estimate";
                try {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    console.error('Non-JSON error response:', text);
                    errorMessage = `Server Error (Status ${res.status}). See console for details.`;
                }
                alert(errorMessage);
                if (isComparison) setCompareResults(null);
                else setResults(null);
            }
        } catch (err) {
            console.error(err);
            alert("Connection error");
            if (isComparison) setCompareResults(null);
            else setResults(null);
        } finally {
            setLoading(false);
        }
    };

    const calculateNetIncome = (grossMin, grossMax) => {
        let totalCosts = 0;
        const areaNum = unit === 'sotyk' ? parseFloat(area) / 100 : parseFloat(area) || 1;

        if (deductSeeds) totalCosts += COST_PER_HA.seeds * areaNum;
        if (deductFertilizer) totalCosts += COST_PER_HA.fertilizer * areaNum;
        if (deductLabor) totalCosts += COST_PER_HA.labor * areaNum;

        return {
            netMin: Math.max(0, grossMin - totalCosts),
            netMax: Math.max(0, grossMax - totalCosts),
            totalCosts
        };
    };

    const applyRiskReduction = (value) => {
        return value * (1 - riskLevel / 100);
    };

    const ResultCard = ({ data, isComparison = false }) => {
        if (!data) return null;

        const net = calculateNetIncome(data.min_income_usd, data.max_income_usd);
        const riskAdjustedYieldMin = applyRiskReduction(data.min_yield_kg);
        const riskAdjustedYieldMax = applyRiskReduction(data.max_yield_kg);
        const riskAdjustedIncomeMin = applyRiskReduction(net.netMin || data.min_income_usd);
        const riskAdjustedIncomeMax = applyRiskReduction(net.netMax || data.max_income_usd);

        // Visual "Wow" Factors based on risk
        const isScorched = riskLevel > 40;
        const isWilting = riskLevel > 70;

        const cardStyle = {
            filter: `
                sepia(${riskLevel * 0.6}%) 
                saturate(${100 - riskLevel * 0.5}%) 
                brightness(${100 - riskLevel * 0.2}%)
            `,
            transition: 'filter 0.5s ease-out'
        };

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 relative"
            >
                {/* Heatwave Overlay */}
                {isWilting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.15 }}
                        className="absolute inset-x-0 -top-10 h-64 bg-orange-500 blur-[100px] pointer-events-none z-0"
                    />
                )}

                {/* Crop Name Header */}
                {isComparison && (
                    <div className="px-4 py-2 bg-purple-100 rounded-lg border border-purple-200">
                        <h3 className="font-bold text-purple-900 flex items-center gap-2">
                            <GitCompare className="w-4 h-4" />
                            Comparing: {data.crop_name}
                        </h3>
                    </div>
                )}

                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Yield Card */}
                    <div
                        style={cardStyle}
                        className={`glass-card p-6 relative overflow-hidden transition-all duration-500 ${isScorched ? 'border-orange-400 bg-orange-50/30' : ''}`}
                    >
                        {riskLevel > 30 && (
                            <div className="absolute top-2 right-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500 animate-pulse" />
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-brand-gold font-bold mb-4 text-sm">
                            <BarChart3 className="w-4 h-4" />
                            Estimated Harvest
                        </div>
                        <motion.div
                            animate={isWilting ? { y: [0, 2, 0], opacity: [1, 0.7, 1] } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`text-3xl font-black mb-1 ${riskLevel > 50 ? 'text-red-600' : 'text-brand-dark'}`}
                        >
                            {riskAdjustedYieldMin.toLocaleString(undefined, { maximumFractionDigits: 0 })} - {riskAdjustedYieldMax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </motion.div>
                        <div className="text-xs text-subtle">Kilograms</div>

                        {riskLevel > 0 && (
                            <div className="mt-3 p-2 bg-orange-100/50 rounded text-xs text-orange-800 font-bold flex items-center gap-1 border border-orange-200">
                                <Flame className="w-3 h-3 text-orange-600" />
                                {riskLevel}% yield loss applied
                            </div>
                        )}
                    </div>

                    {/* Income Card */}
                    <div
                        style={cardStyle}
                        className={`glass-card p-6 relative overflow-hidden transition-all duration-500 ${isScorched ? 'border-orange-400 bg-orange-50/30' : 'border-brand-green/20'}`}
                    >
                        {riskLevel > 30 && (
                            <div className="absolute top-2 right-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500 animate-pulse" />
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-brand-green font-bold mb-4 text-sm">
                            <Wallet className="w-4 h-4" />
                            {deductSeeds || deductFertilizer || deductLabor ? 'Net Profit' : 'Gross Income'}
                        </div>
                        <motion.div
                            animate={isWilting ? { scale: [1, 0.98, 1], filter: ['brightness(1)', 'brightness(0.8)', 'brightness(1)'] } : {}}
                            transition={{ duration: 3, repeat: Infinity }}
                            className={`text-3xl font-black mb-1 ${riskLevel > 50 ? 'text-red-600 font-serif italic' : 'text-brand-green'}`}
                        >
                            ${riskAdjustedIncomeMin.toLocaleString(undefined, { maximumFractionDigits: 0 })} - ${riskAdjustedIncomeMax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </motion.div>
                        <div className="text-xs text-subtle">USD (at ${data.avg_price_per_kg}/kg)</div>

                        {net.totalCosts > 0 && (
                            <div className="mt-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded inline-block">
                                − ${net.totalCosts.toLocaleString()} costs deducted
                            </div>
                        )}
                    </div>
                </div>

                {/* Water Requirement */}
                <div className="glass-panel p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
                                <Droplets className="w-5 h-5" />
                                Water-to-Wallet Ratio
                            </div>
                            <div className="text-2xl font-black text-blue-900">
                                {data.waterRequirement?.toLocaleString()} m³
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                                ≈ ${(riskAdjustedIncomeMax / (data.waterRequirement || 1)).toFixed(2)} per cubic meter
                            </div>
                        </div>
                        <CloudRain className="w-16 h-16 text-blue-300 opacity-50" />
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 pt-32">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="heading-xl text-4xl md:text-5xl mb-3 flex items-center gap-3">
                    <Calculator className="w-10 h-10 text-brand-green" /> Profit Estimator
                </h1>
                <p className="text-subtle text-lg max-w-2xl">Plan your season with confidence. Get realistic yield and income projections with risk analysis.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <form onSubmit={(e) => handleEstimate(e, false)} className="glass-panel p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-brand-dark">Crop Type</label>
                            <select
                                value={crop}
                                onChange={(e) => setCrop(e.target.value)}
                                className="input-modern w-full"
                                required
                            >
                                <option value="">Select...</option>
                                {crops.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-brand-dark">Unit</label>
                                <div className="flex bg-surface-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setUnit('sotyk')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${unit === 'sotyk' ? 'bg-white text-brand-green shadow-sm' : 'text-subtle'}`}
                                    >
                                        100 m²
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUnit('hectare')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${unit === 'hectare' ? 'bg-white text-brand-green shadow-sm' : 'text-subtle'}`}
                                    >
                                        Hectare
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-brand-dark">Land Size ({unit === 'sotyk' ? '100 m² units' : 'Hectares'})</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder={unit === 'sotyk' ? "e.g. 1" : "e.g. 2.5"}
                                    value={area}
                                    onChange={(e) => setArea(e.target.value)}
                                    className="input-modern w-full"
                                    required
                                />
                            </div>
                        </div>

                        {/* Input Cost Toggles */}
                        <div className="border-t border-surface-200 pt-4">
                            <label className="block text-sm font-bold mb-3 text-brand-dark">Deduct Input Costs</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={deductSeeds} onChange={(e) => setDeductSeeds(e.target.checked)} className="w-4 h-4 text-brand-green rounded" />
                                    <span className="text-sm">Seeds (${COST_PER_HA.seeds}/ha)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={deductFertilizer} onChange={(e) => setDeductFertilizer(e.target.checked)} className="w-4 h-4 text-brand-green rounded" />
                                    <span className="text-sm">Fertilizer (${COST_PER_HA.fertilizer}/ha)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={deductLabor} onChange={(e) => setDeductLabor(e.target.checked)} className="w-4 h-4 text-brand-green rounded" />
                                    <span className="text-sm">Labor (${COST_PER_HA.labor}/ha)</span>
                                </label>
                            </div>
                        </div>

                        {/* Risk Slider */}
                        <div className="border-t border-surface-200 pt-4">
                            <label className="block text-sm font-bold mb-2 text-brand-dark flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Yield-at-Risk: {riskLevel}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={riskLevel}
                                onChange={(e) => setRiskLevel(parseInt(e.target.value))}
                                className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                            <div className="flex justify-between text-xs text-subtle mt-1">
                                <span>Ideal Conditions</span>
                                <span className="text-red-600">High Risk</span>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="btn-primary w-full shadow-lg"
                        >
                            {loading ? 'Analyzing...' : 'Calculate Estimate'}
                        </button>
                    </form>

                    {/* Comparison Button */}
                    {results && (
                        <button
                            onClick={() => setShowComparison(!showComparison)}
                            className="w-full btn-secondary flex items-center justify-center gap-2"
                        >
                            <GitCompare className="w-5 h-5" />
                            {showComparison ? 'Hide' : 'Compare with another crop'}
                        </button>
                    )}

                    <AnimatePresence>
                        {showComparison && results && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={(e) => handleEstimate(e, true)}
                                className="glass-panel p-6 space-y-4 bg-purple-50 border-purple-200"
                            >
                                <label className="block text-sm font-bold text-purple-900">Compare With</label>
                                <select
                                    value={compareCrop}
                                    onChange={(e) => setCompareCrop(e.target.value)}
                                    className="input-modern w-full"
                                    required
                                >
                                    <option value="">Select...</option>
                                    {crops.filter(c => c.name !== crop).map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                                <button className="btn-primary w-full bg-purple-600 hover:bg-purple-700">
                                    Compare
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3 text-sm">
                        <Info className="w-5 h-5 text-blue-600 shrink-0" />
                        <p className="text-blue-800">Estimates are based on average data. Use the risk slider to account for challenges like drought or pests.</p>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 space-y-8">
                    {results ? (
                        <div className="space-y-8">
                            <ResultCard data={results} />

                            {compareResults && (
                                <div className="border-t-4 border-dashed border-purple-300 pt-8">
                                    <ResultCard data={compareResults} isComparison />
                                </div>
                            )}

                            <div className="glass-panel p-6">
                                <h3 className="font-bold mb-3 flex items-center gap-2 text-brand-dark">
                                    <Info className="w-5 h-5 text-brand-gold" />
                                    Farmer's Advisory
                                </h3>
                                <p className="text-subtle leading-relaxed text-sm">
                                    To achieve maximum yield, follow the irrigation schedule for <strong>{results.crop_name}</strong>.
                                    {results.waterRequirement > 6000 && (
                                        <span className="text-orange-600"> ⚠️ This crop requires significant water ({results.waterRequirement.toLocaleString()} m³). Ensure adequate access.</span>
                                    )}
                                    {riskLevel > 50 && (
                                        <span className="text-red-600"> ⚠️ High risk scenario active. Consider contingency plans or insurance.</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center glass-panel border-dashed border-2 border-surface-200">
                            <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mb-6 text-subtle">
                                <Calculator className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-brand-dark">Enter Land Details</h3>
                            <p className="text-subtle max-w-sm mx-auto mt-2">We'll calculate your projected harvest, costs, and water needs automatically.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
