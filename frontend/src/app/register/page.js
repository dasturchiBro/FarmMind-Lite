'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sprout, MapPin, Phone, User, Mail, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        region: 'Tashkent',
        role: 'farmer', // 'farmer' or 'buyer'
        password: ''
    });

    // Removed auto-redirect to allow users to reach this page and fix stale sessions
    // after a database reset/wipe.

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const endpoint = isLogin ? '/api/login' : '/api/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                cache: 'no-store'
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('farm_user', JSON.stringify(data.user));
                // Force Layout to update immediately
                window.dispatchEvent(new Event('auth-change'));

                // Delay redirect slightly to allow Layout to process the auth change
                setTimeout(() => {
                    router.push(data.user.role === 'buyer' ? '/marketplace' : '/irrigation');
                }, 100);
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Connection failed. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Soft Ambient Background Blobs */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl" />
            <div className="absolute top-40 -left-20 w-72 h-72 bg-brand-gold/10 rounded-full blur-3xl" />

            {/* Back Button */}
            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-subtle hover:text-brand-green transition-colors font-medium z-10">
                <ArrowLeft className="w-5 h-5" /> Back to Home
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-brand-green to-emerald-400 rounded-2xl mb-6 shadow-xl shadow-brand-green/20">
                        <Sprout className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl heading-xl mb-3">{isLogin ? 'Welcome Back' : 'Join the Future'}</h1>
                    <p className="text-subtle text-lg">{isLogin ? 'Log in to manage your smart farm.' : 'Start your journey with FarmMind Lite.'}</p>
                </div>

                <form onSubmit={handleSubmit} className="glass-panel p-8 space-y-5 bg-white/80">

                    {/* Toggle Tabs */}
                    <div className="flex bg-surface-100 p-1.5 rounded-xl mb-6">
                        <button
                            type="button"
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-brand-dark shadow-sm' : 'text-subtle hover:text-brand-dark'}`}
                        >
                            Sign Up
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-brand-dark shadow-sm' : 'text-subtle hover:text-brand-dark'}`}
                        >
                            Log In
                        </button>
                    </div>

                    {!isLogin && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-dark ml-1">Full Name</label>
                            <input
                                type="text"
                                placeholder="Alisher Navoiy"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="input-modern w-full"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-brand-dark ml-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="input-modern w-full"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-brand-dark ml-1">Phone</label>
                                    <input
                                        type="tel"
                                        placeholder="+998..."
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        className="input-modern w-full"
                                        required={!isLogin}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-brand-dark ml-1">Region</label>
                                    <select
                                        value={formData.region}
                                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        className="input-modern w-full"
                                    >
                                        <option value="Tashkent">Tashkent</option>
                                        <option value="Samarkand">Samarkand</option>
                                        <option value="Bukhara">Bukhara</option>
                                        <option value="Fergana">Fergana</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-brand-dark ml-1">I am a...</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'farmer' })}
                                        className={`py-3 rounded-xl border-2 font-medium transition-all ${formData.role === 'farmer' ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-slate-100 bg-white text-subtle hover:border-slate-200'}`}
                                    >
                                        Farmer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'buyer' })}
                                        className={`py-3 rounded-xl border-2 font-medium transition-all ${formData.role === 'buyer' ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-slate-100 bg-white text-subtle hover:border-slate-200'}`}
                                    >
                                        Buyer
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-brand-dark ml-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="input-modern w-full"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full mt-4 text-lg"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
