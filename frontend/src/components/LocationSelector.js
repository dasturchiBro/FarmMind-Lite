'use client';

import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UZBEKISTAN_REGIONS = [
    'Tashkent',
    'Samarkand',
    'Bukhara',
    'Fergana',
    'Andijan',
    'Namangan',
    'Kashkadarya',
    'Surkhandarya',
    'Jizzakh',
    'Syrdarya',
    'Navoiy',
    'Khorezm',
    'Karakalpakstan'
];

export default function LocationSelector({ selected, onChange }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (region) => {
        onChange(region);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors text-brand-dark font-medium w-full md:w-auto"
            >
                <MapPin className="w-5 h-5 text-brand-green" />
                <span>{selected || t('regions.tashkent')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto glass-panel rounded-xl shadow-xl border border-surface-200 z-50">
                        {UZBEKISTAN_REGIONS.map((region) => (
                            <button
                                key={region}
                                onClick={() => handleSelect(region)}
                                className={`w-full px-4 py-3 text-left hover:bg-surface-100 transition-colors flex items-center gap-3 ${selected === region ? 'bg-brand-green/10 text-brand-green font-bold' : 'text-brand-dark'
                                    }`}
                            >
                                <MapPin className="w-4 h-4" />
                                <span>{t(`regions.${region.toLowerCase()}`) || region}</span>
                                {selected === region && <span className="ml-auto text-brand-green">✓</span>}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
