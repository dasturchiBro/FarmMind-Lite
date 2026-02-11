'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, CloudSnow, AlertTriangle, Clock, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { parseJsonResponse } from '../lib/api';

export default function WeatherDashboard({ location = 'Tashkent' }) {
    const { t, i18n } = useTranslation();
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWeather();
    }, [location]);

    const fetchWeather = async () => {
        try {
            setLoading(true);
            // Fetch current weather
            const currentRes = await fetch(`/api/weather/current?location=${location}`);
            const currentData = await parseJsonResponse(currentRes);

            // Fetch 7-day forecast
            const forecastRes = await fetch(`/api/weather/forecast?location=${location}`);
            const forecastData = await parseJsonResponse(forecastRes);

            setWeather(currentData);
            setForecast(forecastData.daily || []);
            setError(null);
        } catch (err) {
            setError('Failed to load weather data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getWeatherIcon = (condition) => {
        const lower = condition?.toLowerCase() || '';
        if (lower.includes('rain')) return <CloudRain className="w-12 h-12" />;
        if (lower.includes('cloud')) return <Cloud className="w-12 h-12" />;
        if (lower.includes('snow')) return <CloudSnow className="w-12 h-12" />;
        return <Sun className="w-12 h-12" />;
    };

    const getFarmingTips = (weather) => {
        if (!weather) return [];
        const tips = [];

        if (weather.humidity > 70 && weather.temp > 25) {
            tips.push({ icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, text: t('weather.warmAndHumid') });
        }
        if (weather.condition?.includes('Rain')) {
            tips.push({ icon: <CloudRain className="w-5 h-5 text-blue-500" />, text: t('weather.rainExpected') });
        }
        if (weather.temp < 5) {
            tips.push({ icon: <CloudSnow className="w-5 h-5 text-cyan-500" />, text: t('weather.frostRisk') });
        }
        if (weather.humidity < 40) {
            tips.push({ icon: <Droplets className="w-5 h-5 text-red-500" />, text: t('weather.dryWeekAhead') });
        }

        return tips;
    };

    if (loading) {
        return (
            <div className="glass-panel p-8 rounded-2xl text-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <Cloud className="w-16 h-16 text-brand-gold opacity-50" />
                    <p className="text-subtle">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-panel p-8 rounded-2xl text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    const tips = getFarmingTips(weather);

    return (
        <div className="space-y-8">
            {/* Current Weather Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/20 p-8">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Cloud className="w-64 h-64 -mr-16 -mt-16" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 opacity-80 text-sm font-bold uppercase tracking-widest mb-2">
                            <MapPin className="w-4 h-4" /> {location}
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-white/90">
                                {getWeatherIcon(weather?.condition)}
                            </div>
                            <div>
                                <h2 className="text-7xl font-black tracking-tighter">{Math.round(weather?.temp || 0)}°</h2>
                                <p className="text-lg font-medium opacity-90 capitalize">{weather?.condition}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full md:w-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <div className="text-center">
                                <p className="text-xs opacity-70 mb-1 uppercase tracking-wider">{t('weather.humidity')}</p>
                                <p className="text-lg font-bold">{weather?.humidity || 0}%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs opacity-70 mb-1 uppercase tracking-wider">{t('weather.wind')}</p>
                                <p className="text-lg font-bold">{weather?.wind_speed || 0} <span className="text-[10px]">km/h</span></p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs opacity-70 mb-1 uppercase tracking-wider">{t('weather.pressure')}</p>
                                <p className="text-lg font-bold">{weather?.pressure || 0} <span className="text-[10px]">hPa</span></p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs opacity-70 mb-1 uppercase tracking-wider">{t('weather.sunrise')}</p>
                                <p className="text-lg font-bold">{weather?.sunrise || '--:--'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                {tips.length > 0 && (
                    <div className="relative z-10 mt-6 flex flex-wrap gap-2">
                        {tips.map((tip, idx) => (
                            <div key={idx} className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border border-white/10">
                                {tip.icon}
                                {tip.text}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 7-Day Forecast */}
            <div>
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xl font-black text-brand-dark">{t('weather.sevenDayForecast')}</h3>
                    <button onClick={fetchWeather} className="text-brand-green text-sm font-bold hover:underline">
                        {t('weather.refresh')}
                    </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                    {forecast.length > 0 ? (
                        forecast.map((day, idx) => (
                            <div key={idx} className="min-w-[140px] snap-center bg-white p-5 rounded-3xl border border-surface-200 shadow-sm flex flex-col items-center justify-between gap-4 hover:border-blue-400 hover:shadow-md transition-all group">
                                <p className="text-sm font-bold text-subtle uppercase tracking-wider group-hover:text-brand-dark transition-colors">
                                    {new Date(day.date).toLocaleDateString(i18n.language, { weekday: 'short' })}
                                </p>
                                <div className="text-brand-gold scale-110 group-hover:scale-125 transition-transform duration-300">
                                    {getWeatherIcon(day.condition)}
                                </div>
                                <div className="w-full">
                                    <div className="flex justify-between items-center text-lg font-black text-brand-dark">
                                        <span>{Math.round(day.temp_max)}°</span>
                                        <span className="text-subtle text-sm font-bold opacity-60">{Math.round(day.temp_min)}°</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="w-full py-12 text-center bg-surface-50 rounded-3xl border-2 border-dashed border-surface-200">
                            <Cloud className="w-12 h-12 text-subtle mx-auto mb-3 opacity-30" />
                            <p className="text-subtle font-medium">{t('weather.noForecastData')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
