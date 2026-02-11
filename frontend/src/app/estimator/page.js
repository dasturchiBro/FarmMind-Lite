'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Calculator, BarChart3, Info, Wallet, Droplets, AlertTriangle, GitCompare, Flame, CloudRain } from 'lucide-react';
import ExportShare from '../../components/ExportShare';
import { getTranslatedCropName } from '../../lib/crops';
import { parseJsonResponse } from '../../lib/api';

export default function EstimatorPage() {
    const { t } = useTranslation();
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

    // Regional cost averages (per hectare) - Research updated
    const COST_PER_HA = {
        seeds: 70,       // Uzbek average 2024
        fertilizer: 110, // Uzbek average 2024
        labor: 250,      // Uzbek average 2024
        water: 80        // Uzbek average 2024
    };

    const fetchCrops = async () => {
        try {
            const res = await fetch('/api/crops', { cache: 'no-store' });
            const data = await parseJsonResponse(res);
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
                const data = await parseJsonResponse(res);
                const waterReq = calculateWaterRequirement(selectedCrop, areaInHectares);
                const enhancedData = { ...data, waterRequirement: waterReq, usedArea: areaInHectares };

                if (isComparison) {
                    setCompareResults(enhancedData);
                } else {
                    setResults(enhancedData);
                }
            } else {
                alert(t('errors.somethingWrong'));
                if (isComparison) setCompareResults(null);
                else setResults(null);
            }
        } catch (err) {
            console.error(err);
            alert(t('errors.networkError'));
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

    const applyRiskReduction = (value) => value * (1 - riskLevel / 100);

    const ResultCard = ({ data, isComparison = false }) => {
        if (!data) return null;

        const net = calculateNetIncome(data.min_income_usd, data.max_income_usd);
        const riskAdjustedYieldMin = applyRiskReduction(data.min_yield_kg);
        const riskAdjustedYieldMax = applyRiskReduction(data.max_yield_kg);
        const riskAdjustedIncomeMin = applyRiskReduction(net.netMin);
        const riskAdjustedIncomeMax = applyRiskReduction(net.netMax);

        const cardStyle = {
            filter: `sepia(${riskLevel * 0.6}%) saturate(${100 - riskLevel * 0.5}%) brightness(${100 - riskLevel * 0.2}%)`,
            transition: 'filter 0.5s ease-out'
        };

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                id={isComparison ? 'compare-result' : 'main-result'}
                className="space-y-6 relative"
            >
                {riskLevel > 70 && (
                    <div className="absolute inset-x-0 -top-10 h-64 bg-orange-500 blur-[100px] pointer-events-none z-0 opacity-15" />
                )}

                <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-surface-200">
                    <h3 className="font-bold text-brand-dark flex items-center gap-2">
                        {isComparison ? <GitCompare className="w-5 h-5 text-purple-500" /> : <Calculator className="w-5 h-5 text-brand-green" />}
                        {getTranslatedCropName(t, data.crop_name)}
                    </h3>
                    <ExportShare
                        targetId={isComparison ? 'compare-result' : 'main-result'}
                        title={`${getTranslatedCropName(t, data.crop_name)} Estimate`}
                        data={{ yield: [riskAdjustedYieldMin, riskAdjustedYieldMax], profit: [riskAdjustedIncomeMin, riskAdjustedIncomeMax] }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div style={cardStyle} className="glass-panel p-6 relative overflow-hidden">
                        <div className="flex items-center gap-2 text-brand-gold font-bold mb-4 text-sm">
                            <BarChart3 className="w-4 h-4" />
                            {t('estimator.estimatedHarvest')}
                        </div>
                        <div className={`text-3xl font-black mb-1 ${riskLevel > 50 ? 'text-red-600' : 'text-brand-dark'}`}>
                            {riskAdjustedYieldMin.toLocaleString()} - {riskAdjustedYieldMax.toLocaleString()}
                        </div>
                        <div className="text-xs text-subtle">{t('estimator.kilograms')}</div>
                        {riskLevel > 0 && (
                            <div className="mt-3 p-2 bg-orange-50 rounded text-xs text-orange-800 font-bold flex items-center gap-1 border border-orange-100">
                                <Flame className="w-3 h-3 text-orange-600" />
                                {riskLevel}% {t('estimator.yieldLoss')}
                            </div>
                        )}
                    </div>

                    <div style={cardStyle} className="glass-panel p-6 relative overflow-hidden">
                        <div className="flex items-center gap-2 text-brand-green font-bold mb-4 text-sm">
                            <Wallet className="w-4 h-4" />
                            {net.totalCosts > 0 ? t('estimator.netProfit') : t('estimator.grossIncome')}
                        </div>
                        <div className={`text-3xl font-black mb-1 ${riskLevel > 50 ? 'text-red-600' : 'text-brand-green'}`}>
                            ${riskAdjustedIncomeMin.toLocaleString()} - ${riskAdjustedIncomeMax.toLocaleString()}
                        </div>
                        <div className="text-xs text-subtle">USD (at ${data.avg_price_per_kg}/kg)</div>
                        {net.totalCosts > 0 && (
                            <div className="mt-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded inline-block">
                                − ${net.totalCosts.toLocaleString()} {t('estimator.costsDeducted')}
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-panel p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
                                <Droplets className="w-5 h-5" />
                                {t('estimator.waterToWallet')}
                            </div>
                            <div className="text-2xl font-black text-blue-900">
                                {data.waterRequirement?.toLocaleString()} m³
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                                ≈ ${(riskAdjustedIncomeMax / (data.waterRequirement || 1)).toFixed(2)} {t('estimator.perCubicMeter')}
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold font-display text-brand-dark mb-3">
                    {t('estimator.title')}
                </h1>
                <p className="text-subtle text-lg max-w-2xl">{t('estimator.subtitle')}</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <form onSubmit={(e) => handleEstimate(e, false)} className="glass-panel p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-brand-dark">{t('estimator.cropType')}</label>
                            <select value={crop} onChange={(e) => setCrop(e.target.value)} className="input-modern w-full" required>
                                <option value="">{t('estimator.selectCrop')}</option>
                                {crops.map(c => <option key={c.id} value={c.name}>{getTranslatedCropName(t, c.name)}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-brand-dark">{t('estimator.unit')}</label>
                                <div className="flex bg-surface-100 p-1 rounded-xl">
                                    <button type="button" onClick={() => setUnit('sotyk')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${unit === 'sotyk' ? 'bg-white text-brand-green shadow-sm' : 'text-subtle'}`}>100 m²</button>
                                    <button type="button" onClick={() => setUnit('hectare')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${unit === 'hectare' ? 'bg-white text-brand-green shadow-sm' : 'text-subtle'}`}>{t('estimator.hectares')}</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-brand-dark">{t('estimator.landSize')}</label>
                                <input type="number" step="0.1" value={area} onChange={(e) => setArea(e.target.value)} className="input-modern w-full" required />
                            </div>
                        </div>

                        <div className="border-t border-surface-200 pt-4">
                            <label className="block text-sm font-bold mb-3 text-brand-dark">{t('estimator.deductCosts')}</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={deductSeeds} onChange={(e) => setDeductSeeds(e.target.checked)} className="w-4 h-4 text-brand-green rounded" />
                                    <span className="text-sm">{t('estimator.seeds')} (${COST_PER_HA.seeds}/ha)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={deductFertilizer} onChange={(e) => setDeductFertilizer(e.target.checked)} className="w-4 h-4 text-brand-green rounded" />
                                    <span className="text-sm">{t('estimator.fertilizer')} (${COST_PER_HA.fertilizer}/ha)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={deductLabor} onChange={(e) => setDeductLabor(e.target.checked)} className="w-4 h-4 text-brand-green rounded" />
                                    <span className="text-sm">{t('estimator.labor')} (${COST_PER_HA.labor}/ha)</span>
                                </label>
                            </div>
                        </div>

                        <div className="border-t border-surface-200 pt-4">
                            <label className="block text-sm font-bold mb-2 text-brand-dark flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                {t('estimator.yieldAtRisk')}: {riskLevel}%
                            </label>
                            <input type="range" min="0" max="100" value={riskLevel} onChange={(e) => setRiskLevel(parseInt(e.target.value))} className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                            <div className="flex justify-between text-xs text-subtle mt-1">
                                <span>{t('estimator.idealConditions')}</span>
                                <span className="text-red-600">{t('estimator.highRisk')}</span>
                            </div>
                        </div>

                        <button disabled={loading} className="btn-primary w-full shadow-lg">
                            {loading ? t('estimator.analyzing') : t('estimator.calculate')}
                        </button>
                    </form>

                    {results && (
                        <button onClick={() => setShowComparison(!showComparison)} className="w-full btn-secondary flex items-center justify-center gap-2">
                            <GitCompare className="w-5 h-5" />
                            {showComparison ? t('estimator.hide') : t('estimator.compareWith')}
                        </button>
                    )}

                    <AnimatePresence>
                        {showComparison && results && (
                            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={(e) => handleEstimate(e, true)} className="glass-panel p-6 space-y-4 bg-purple-50 border-purple-200">
                                <label className="block text-sm font-bold text-purple-900">{t('estimator.compareWith')}</label>
                                <select value={compareCrop} onChange={(e) => setCompareCrop(e.target.value)} className="input-modern w-full" required>
                                    <option value="">{t('estimator.selectCrop')}</option>
                                    {crops.filter(c => c.name !== crop).map(c => <option key={c.id} value={c.name}>{getTranslatedCropName(t, c.name)}</option>)}
                                </select>
                                <button className="btn-primary w-full bg-purple-600 hover:bg-purple-700">{t('estimator.calculate')}</button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    {results ? (
                        <div className="space-y-8">
                            <ResultCard data={results} />
                            {compareResults && <div className="border-t-4 border-dashed border-purple-200 pt-8"><ResultCard data={compareResults} isComparison /></div>}
                            <div className="glass-panel p-6 border-brand-gold/20">
                                <h3 className="font-bold mb-3 flex items-center gap-2 text-brand-dark">
                                    <Info className="w-5 h-5 text-brand-gold" />
                                    {t('estimator.farmersAdvisory')}
                                </h3>
                                <p className="text-subtle leading-relaxed text-sm">
                                    {results.waterRequirement > 6000 && <span className="text-orange-600"> ⚠️ {t('estimator.significantWater')}</span>}
                                    {riskLevel > 50 && <span className="text-red-600"> ⚠️ {t('estimator.highRiskScenario')}</span>}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center glass-panel border-dashed border-2 border-surface-200">
                            <Calculator className="w-12 h-12 text-subtle mb-4" />
                            <h3 className="text-xl font-bold text-brand-dark">{t('estimator.enterLandDetails')}</h3>
                            <p className="text-subtle max-w-sm mx-auto mt-2">{t('estimator.projectionMessage')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

