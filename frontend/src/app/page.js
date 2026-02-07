'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Sprout, ShieldCheck } from 'lucide-react';

export default function Home() {
    return (
        <div className="relative overflow-hidden min-h-[calc(100vh-80px)] flex items-center">
            {/* Background Decor - Subtle & Premium */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-brand-green/5 blur-3xl rounded-full opacity-50" />
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[600px] h-[600px] bg-brand-gold/5 blur-3xl rounded-full opacity-50" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full py-12 lg:py-0">
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20 text-xs font-bold uppercase tracking-wider mb-8">
                        <span className="w-2 h-2 bg-brand-gold rounded-full animate-pulse" />
                        Beta Access Live
                    </div>

                    <h1 className="heading-xl text-5xl lg:text-7xl mb-6">
                        The Future of <br />
                        <span className="text-brand-green">Uzbek Farming</span>
                    </h1>

                    <p className="text-lg lg:text-xl text-subtle mb-10 max-w-lg leading-relaxed font-medium">
                        Maximize yields with AI-driven irrigation schedules and connect directly to fair markets. Built for the modern farmer.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/register">
                            <button className="btn-primary text-lg w-full sm:w-auto h-14">
                                Start Growing Smarter
                                <ArrowRight className="w-5 h-5 ml-1" />
                            </button>
                        </Link>
                        <button className="btn-secondary text-lg w-full sm:w-auto h-14 bg-white/50 backdrop-blur-sm">
                            View Live Demo
                        </button>
                    </div>

                    <div className="mt-12 flex items-center gap-8 text-subtle text-sm font-semibold">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-brand-green" />
                            <span>FAO Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-brand-green" />
                            <span>Real-time Data</span>
                        </div>
                    </div>
                </motion.div>

                {/* Right Visual - Interactive Dashboard Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="hidden lg:block relative"
                >
                    <div className="absolute inset-0 bg-brand-green/20 blur-2xl -z-10 transform rotate-6 scale-95 opacity-40 ml-12 mt-12 rounded-[32px]" />

                    <div className="glass-card p-8 border-white/60 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sprout className="w-32 h-32 text-brand-green" />
                        </div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-brand-dark">Market Pulse</h3>
                                <p className="text-subtle text-sm">Tashkent Region • Today</p>
                            </div>
                            <div className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                +12.4%
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {[
                                { crop: 'Premium Wheat', price: '2,800 UZS', trend: 'up', change: '+5%' },
                                { crop: 'Organic Cotton', price: '12,500 UZS', trend: 'up', change: '+2.1%' },
                                { crop: 'Early Potatoes', price: '4,200 UZS', trend: 'stable', change: '0%' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-surface-200 hover:border-brand-green/30 transition-colors shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-brand-dark font-bold">
                                        {item.crop[0]}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="font-bold text-brand-dark">{item.crop}</div>
                                        <div className="text-xs text-subtle">Avg. Market Price</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-brand-dark">{item.price}</div>
                                        <div className={`text-xs font-bold ${item.trend === 'up' ? 'text-brand-green' : 'text-slate-400'}`}>
                                            {item.change}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-surface-200 flex justify-between items-center relative z-10">
                            <div className="text-xs text-subtle">
                                Updated 15 mins ago
                            </div>
                            <div className="text-sm font-bold text-brand-green cursor-pointer hover:underline">
                                View Full Analytics
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
