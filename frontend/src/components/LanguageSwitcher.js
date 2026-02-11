'use client';

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const switchLanguage = (newLocale) => {
        i18n.changeLanguage(newLocale);
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', newLocale);
        }
        setIsOpen(false);
    };

    if (!mounted) return null;

    const currentLang = i18n.language || 'uz';

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors text-brand-dark font-medium"
            >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{currentLang === 'uz' ? "O'zbekcha" : 'English'}</span>
                <span className="sm:hidden uppercase">{currentLang}</span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 glass-panel rounded-xl shadow-xl border border-surface-200 z-50 overflow-hidden">
                        <button
                            onClick={() => switchLanguage('uz')}
                            className={`w-full px-4 py-3 text-left hover:bg-surface-100 transition-colors flex items-center justify-between ${currentLang === 'uz' ? 'bg-brand-green/10 text-brand-green font-bold' : 'text-brand-dark'
                                }`}
                        >
                            <span>O'zbekcha</span>
                            {currentLang === 'uz' && <span className="text-brand-green">✓</span>}
                        </button>
                        <button
                            onClick={() => switchLanguage('en')}
                            className={`w-full px-4 py-3 text-left hover:bg-surface-100 transition-colors flex items-center justify-between ${currentLang === 'en' ? 'bg-brand-green/10 text-brand-green font-bold' : 'text-brand-dark'
                                }`}
                        >
                            <span>English</span>
                            {currentLang === 'en' && <span className="text-brand-green">✓</span>}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
