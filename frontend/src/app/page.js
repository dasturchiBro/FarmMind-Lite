'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react';
import WeatherDashboard from '../components/WeatherDashboard';
import LocationSelector from '../components/LocationSelector';
import { parseJsonResponse } from '../lib/api';

export default function Home() {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [user, setUser] = useState(null);
    const [location, setLocation] = useState('Tashkent');

    useEffect(() => {
        const storedUser = localStorage.getItem('farm_user');
        if (storedUser) setUser(JSON.parse(storedUser));

        fetch('/api/analytics')
            .then(res => parseJsonResponse(res))
            .then(data => setStats(data))
            .catch(err => console.error('Error fetching stats:', err));
    }, []);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-sm font-bold mb-6">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold"></span>
                                </span>
                                {t('home.betaAccess')}
                            </div>
                            <h1 className="text-6xl md:text-7xl font-bold font-display leading-[1.1] text-brand-dark mb-8">
                                {t('home.title')} <br />
                                <span className="text-brand-green">{t('home.uzbekFarming')}</span>
                            </h1>
                            <p className="text-xl text-subtle leading-relaxed mb-10 max-w-lg">
                                {t('home.subtitle')}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/marketplace">
                                    <button className="btn-primary py-4 px-8 text-lg flex items-center gap-2">
                                        {t('home.startGrowing')}
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </Link>
                                <button className="btn-secondary py-4 px-8 text-lg">
                                    {t('home.viewDemo')}
                                </button>
                            </div>

                            <div className="mt-12 flex items-center gap-8 text-subtle">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-6 h-6 text-brand-green" />
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-bold text-brand-dark">100%</span>
                                        <span className="text-xs font-bold uppercase tracking-wider">{t('home.faoCompliant')}</span>
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-slate-200"></div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-6 h-6 text-brand-green" />
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-bold text-brand-dark">Live</span>
                                        <span className="text-xs font-bold uppercase tracking-wider">{t('home.realTimeData')}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative"
                        >
                            {user && user.role === 'farmer' ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <h2 className="text-2xl font-bold font-display text-brand-dark">{t('weather.title')}</h2>
                                        <LocationSelector selected={location} onChange={setLocation} />
                                    </div>
                                    <WeatherDashboard location={location} />

                                    <Link href="/calendar" className="block glass-panel p-6 rounded-2xl hover:bg-surface-100 transition-all border border-brand-green/10 group">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-bold text-brand-dark group-hover:text-brand-green transition-colors">{t('calendar.title')}</h3>
                                                <p className="text-sm text-subtle">{t('calendar.subtitle')}</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                </svg>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ) : (
                                <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-green/20 transition-all duration-500"></div>
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-2xl font-bold text-brand-dark font-display">{t('home.marketPulse')}</h3>
                                            <p className="text-subtle text-sm">{t('home.tashkentRegion')} • {t('home.today')}</p>
                                        </div>
                                        <div className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-sm font-bold">
                                            {stats?.average_price_change > 0 ? '+' : ''}{stats?.average_price_change?.toFixed(1) || '0.0'}%
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <MarketItem name={t('home.premiumWheat')} price="$0.42" trend="+5%" />
                                        <MarketItem name={t('home.organicCotton')} price="$0.58" trend="+2.1%" />
                                        <MarketItem name={t('home.earlyPotatoes')} price="$0.35" trend="0%" />
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-surface-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs text-subtle font-medium">{t('home.avgMarketPrice')}</span>
                                            <span className="text-xs text-brand-gold font-bold uppercase tracking-wider">
                                                {t('home.updatedMinsAgo', { minutes: 12 })}
                                            </span>
                                        </div>
                                        <Link href="/market" className="flex items-center justify-center w-full py-4 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors text-brand-dark font-bold gap-2 group">
                                            {t('home.viewFullAnalytics')}
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function MarketItem({ name, price, trend }) {
    const { t } = useTranslation();
    const isUp = trend?.startsWith('+') || false;
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-surface-200 hover:border-brand-green/30 transition-colors shadow-sm cursor-pointer group">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-100 group-hover:bg-brand-green/10 flex items-center justify-center text-brand-dark group-hover:text-brand-green font-bold transition-colors">
                    {name.charAt(0)}
                </div>
                <div>
                    <div className="font-bold text-brand-dark">{name}</div>
                    <div className="text-xs text-subtle mt-0.5">{t('home.avgMarketPrice')}</div>
                </div>
            </div>
            <div className="text-right">
                <div className="font-black text-brand-dark">{price}</div>
                <div className={`text-xs font-bold ${isUp ? 'text-brand-green' : 'text-slate-400'}`}>
                    {trend}
                </div>
            </div>
        </div>
    );
}

