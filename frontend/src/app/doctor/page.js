'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Upload, Scan, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import ExportShare from '../../components/ExportShare';
import { parseJsonResponse } from '../../lib/api';

export default function DoctorPage() {
    const { t } = useTranslation();
    const [image, setImage] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImage(e.target.result);
            reader.readAsDataURL(file);
            setResult(null);
        }
    };

    const analyzeCrop = async () => {
        if (!image) return;
        setAnalyzing(true);
        setResult(null);

        try {
            // Convert dataURL to Blob for upload
            const fetchRes = await fetch(image);
            const blob = await fetchRes.blob();
            const formData = new FormData();
            formData.append('image', blob, 'crop_image.jpg');

            const res = await fetch('/api/doctor/analyze', {
                method: 'POST',
                body: formData
            });

            const data = await parseJsonResponse(res);

            if (res.ok) {
                setResult(data);
            } else {
                alert(t('errors.somethingWrong') + ': ' + (data.error || t('errors.serverError')));
            }
        } catch (err) {
            console.error(err);
            alert(t('errors.networkError'));
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen p-6 pt-32 max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-3 bg-brand-green/10 rounded-2xl mb-2">
                    <Activity className="w-8 h-8 text-brand-green" />
                </div>
                <h1 className="text-4xl heading-xl text-brand-dark">{t('doctor.title')}</h1>
                <p className="text-subtle text-lg max-w-2xl mx-auto">
                    {t('doctor.subtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <motion.div
                    className="glass-panel p-8 flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-200 hover:border-brand-green transition-colors relative overflow-hidden"
                    whileHover={{ scale: 1.01 }}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />

                    {image ? (
                        <div className="relative w-full h-full flex flex-col items-center">
                            <img src={image} alt="Crop" className="w-full h-64 object-cover rounded-xl shadow-md mb-6" />
                            {analyzing && (
                                <motion.div
                                    className="absolute inset-0 bg-brand-green/10 rounded-xl border-b-4 border-brand-green"
                                    initial={{ top: 0, height: '0%' }}
                                    animate={{ height: '100%', top: '100%' }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    style={{ top: 'auto', bottom: 'auto' }}
                                />
                            )}
                            {!analyzing && !result && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); analyzeCrop(); }}
                                    className="btn-primary flex items-center gap-2 z-20"
                                >
                                    <Scan className="w-4 h-4" /> {t('doctor.analyzeNow')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto">
                                <Upload className="w-8 h-8 text-subtle" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-brand-dark">{t('doctor.clickToUpload')}</h3>
                                <p className="text-sm text-subtle mt-1">{t('doctor.uploadSub')}</p>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Results Section */}
                <div className="space-y-6">
                    {analyzing && (
                        <div className="glass-panel p-8 h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
                            <h3 className="text-xl font-bold text-brand-dark">{t('doctor.analyzing')}</h3>
                            <p className="text-subtle">{t('doctor.analyzingSub')}</p>
                        </div>
                    )}

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`glass-panel p-8 h-full space-y-6 border ${result.disease.toLowerCase() === 'healthy' || result.severity.toLowerCase() === 'none' ? 'border-brand-green/30' : 'border-red-200'}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl ${result.disease.toLowerCase() === 'healthy' || result.severity.toLowerCase() === 'none' ? 'bg-brand-green/10' : 'bg-red-100'}`}>
                                        {result.disease.toLowerCase() === 'healthy' || result.severity.toLowerCase() === 'none' ? (
                                            <CheckCircle className="w-6 h-6 text-brand-green" />
                                        ) : (
                                            <AlertTriangle className="w-6 h-6 text-red-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-brand-dark">
                                            {(result.disease.toLowerCase() === 'healthy' || result.severity.toLowerCase() === 'none') ? t('doctor.healthy') : t('doctor.issueDetected')}
                                        </h2>
                                        <p className={`font-medium ${result.disease.toLowerCase() === 'healthy' || result.severity.toLowerCase() === 'none' ? 'text-brand-green' : 'text-red-600'}`}>
                                            {result.disease}
                                        </p>
                                    </div>
                                </div>
                                <ExportShare targetId="diagnosis-result" title={`${result.disease} Diagnosis`} data={result} />
                            </div>

                            <div id="diagnosis-result" className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-surface-100 p-4 rounded-xl">
                                        <div className="text-xs text-subtle uppercase font-bold">{t('doctor.confidence')}</div>
                                        <div className="text-2xl font-black text-brand-dark">{result.confidence}</div>
                                    </div>
                                    <div className="bg-surface-100 p-4 rounded-xl">
                                        <div className="text-xs text-subtle uppercase font-bold">{t('doctor.severity')}</div>
                                        <div className={`text-2xl font-black ${result.severity.toLowerCase() === 'none' ? 'text-brand-green' : 'text-brand-gold'}`}>{result.severity}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-brand-dark mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-brand-green" /> {t('doctor.treatment')}
                                    </h3>
                                    <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
                                        <ul className="space-y-3">
                                            {result.treatment.map((step, i) => (
                                                <li key={i} className="flex gap-3 text-sm text-brand-dark">
                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-green/10 text-brand-green font-bold flex items-center justify-center text-xs">
                                                        {i + 1}
                                                    </span>
                                                    {step}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {!analyzing && !result && (
                        <div className="glass-panel p-8 h-full flex flex-col items-center justify-center text-center opacity-50">
                            <Scan className="w-16 h-16 text-subtle mb-4" />
                            <p className="text-subtle">{t('doctor.waiting')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
