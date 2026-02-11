'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalIcon, Plus, ChevronLeft, ChevronRight, Droplet, ShoppingBag, DollarSign, Users, X, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { parseJsonResponse } from '../lib/api';

export default function SeasonalCalendar() {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        type: 'other',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [filter, setFilter] = useState('all');
    const [selectedDayEvents, setSelectedDayEvents] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('farm_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchEvents();
        }
    }, [currentDate, user]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;

            const res = await fetch(`/api/calendar/events?year=${year}&month=${month}&user_id=${user?.id}`);
            const data = await parseJsonResponse(res);

            setEvents(data.events || []);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!user) return alert(t('common.loginFirst'));

        setSaving(true);
        try {
            const res = await fetch('/api/calendar/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newEvent,
                    user_id: user.id
                })
            });

            if (res.ok) {
                setShowModal(false);
                fetchEvents();
                setNewEvent({
                    title: '',
                    type: 'other',
                    date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
                    notes: ''
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        const startPadding = firstDay.getDay();

        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const getEventsForDate = (date) => {
        if (!date) return [];
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return events.filter(e => {
            if (filter !== 'all' && e.type !== filter) return false;
            return e.date === dateStr;
        });
    };

    const getEventIcon = (type) => {
        switch (type) {
            case 'irrigation': return <Droplet className="w-3 h-3" />;
            case 'harvest': return <ShoppingBag className="w-3 h-3" />;
            case 'marketplace': return <DollarSign className="w-3 h-3" />;
            case 'buyer_request': return <Users className="w-3 h-3" />;
            case 'trend': return <TrendingUp className="w-3 h-3" />;
            default: return <CalIcon className="w-3 h-3" />;
        }
    };

    // User Requested Colors:
    // Green dots/events → Irrigation
    // Orange dots → Harvest
    // Blue dots → Marketplace Listings
    // Purple dots → Buyer Requests
    // Yellow dots → High-price trends
    const getEventColor = (type) => {
        switch (type) {
            case 'irrigation': return 'bg-brand-green text-white';
            case 'harvest': return 'bg-orange-500 text-white';
            case 'marketplace': return 'bg-blue-500 text-white';
            case 'buyer_request': return 'bg-purple-500 text-white';
            case 'trend': return 'bg-yellow-400 text-brand-dark';
            default: return 'bg-gray-500 text-white';
        }
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const monthName = currentDate.toLocaleDateString(t('locale') === 'uz' ? 'uz-UZ' : 'en-US', { month: 'long', year: 'numeric' });
    const days = getDaysInMonth(currentDate);

    // Calculate Monthly Stats
    const stats = {
        irrigation: events.filter(e => e.type === 'irrigation').length,
        harvest: events.filter(e => e.type === 'harvest').length,
        listings: events.filter(e => e.type === 'marketplace').length,
        income: events.filter(e => e.type === 'harvest').length * 2500000 // Mock estimated income per harvest
    };

    return (
        <div className="space-y-6 pt-32 max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Calendar Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="heading-xl text-4xl text-brand-dark">{t('calendar.title')}</h1>
                            <p className="text-subtle text-lg mt-1">{t('calendar.subtitle')}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(true)}
                                className="btn-primary shadow-lg shadow-brand-green/30"
                            >
                                <Plus className="w-5 h-5" />
                                {t('calendar.addEvent')}
                            </button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['all', 'irrigation', 'harvest', 'marketplace', 'buyer_request'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all capitalize whitespace-nowrap ${filter === f ? 'bg-brand-dark text-white shadow-md' : 'bg-surface-100 text-subtle hover:bg-surface-200'}`}
                            >
                                {t(`calendar.${f}`) || f}
                            </button>
                        ))}
                    </div>

                    {/* Calendar Controls */}
                    <div className="glass-panel p-4 flex items-center justify-between sticky top-24 z-10">
                        <button onClick={previousMonth} className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-black text-brand-dark capitalize">{monthName}</h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="glass-panel p-6 rounded-3xl overflow-hidden shadow-2xl shadow-brand-dark/5">
                        <div className="grid grid-cols-7 gap-3 mb-6">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-xs font-black text-subtle uppercase tracking-widest">{day}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-3">
                            {days.map((date, idx) => {
                                const dayEvents = getEventsForDate(date);
                                const isToday = date && date.toDateString() === new Date().toDateString();
                                const hasMultipleEvents = dayEvents.length > 2;
                                // Critical week logic: if multiple operational events overlap
                                const isCritical = hasMultipleEvents && dayEvents.some(e => e.type === 'irrigation') && dayEvents.some(e => e.type === 'harvest');

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => date && dayEvents.length > 0 && setSelectedDayEvents({ date, events: dayEvents })}
                                        className={`min-h-[120px] p-2 rounded-2xl border-2 transition-all relative cursor-pointer ${date ? (isToday ? 'border-brand-green bg-brand-green/[0.03]' : 'border-surface-100 hover:border-brand-gold/30 hover:bg-surface-50') : 'border-transparent opacity-20 bg-surface-100/50'} ${isCritical ? 'border-red-400 bg-red-50' : ''}`}
                                    >
                                        {date && (
                                            <>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className={`text-sm font-black ${isToday ? 'text-brand-green' : 'text-brand-dark opacity-40'}`}>
                                                        {date.getDate()}
                                                    </div>
                                                    {dayEvents.length > 0 && (
                                                        <div className="flex -space-x-1">
                                                            {dayEvents.slice(0, 3).map((e, i) => (
                                                                <div key={i} className={`w-2 h-2 rounded-full ring-1 ring-white ${getEventColor(e.type).split(' ')[0]}`} />
                                                            ))}
                                                            {dayEvents.length > 3 && <div className="w-2 h-2 rounded-full bg-gray-300 ring-1 ring-white" />}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    {dayEvents.slice(0, 3).map((event, i) => (
                                                        <div key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm truncate ${getEventColor(event.type)}`}>
                                                            {getEventIcon(event.type)}
                                                            <span className="truncate">{event.title}</span>
                                                        </div>
                                                    ))}
                                                    {dayEvents.length > 3 && (
                                                        <div className="text-[9px] text-center text-subtle font-bold">
                                                            +{dayEvents.length - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Monthly Summary Sidebar */}
                <div className="lg:col-span-1 space-y-6 pt-20">
                    <div className="glass-panel p-6 rounded-3xl sticky top-24">
                        <h3 className="text-xl font-black text-brand-dark mb-6">{t('calendar.monthlySummary')}</h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white"><Droplet className="w-4 h-4" /></div>
                                    <span className="text-sm font-bold text-brand-dark">{t('common.irrigation')}</span>
                                </div>
                                <span className="text-xl font-black text-blue-600">{stats.irrigation}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white"><ShoppingBag className="w-4 h-4" /></div>
                                    <span className="text-sm font-bold text-brand-dark">{t('calendar.harvests')}</span>
                                </div>
                                <span className="text-xl font-black text-orange-600">{stats.harvest}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><DollarSign className="w-4 h-4" /></div>
                                    <span className="text-sm font-bold text-brand-dark">{t('calendar.activeListings')}</span>
                                </div>
                                <span className="text-xl font-black text-blue-600">{stats.listings}</span>
                            </div>

                            <div className="mt-6 pt-6 border-t border-surface-200">
                                <p className="text-xs text-subtle font-bold uppercase tracking-wider mb-1">{t('calendar.expectedIncome')}</p>
                                <p className="text-2xl font-black text-brand-green">~{stats.income.toLocaleString()} UZS</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Details Popover */}
            <AnimatePresence>
                {selectedDayEvents && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDayEvents(null)} className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md glass-panel p-0 shadow-2xl border-2 border-brand-green/20 overflow-hidden">
                            <div className="bg-surface-100 p-4 flex justify-between items-center border-b border-surface-200">
                                <h3 className="text-lg font-black text-brand-dark flex items-center gap-2">
                                    <CalIcon className="w-5 h-5 text-brand-green" />
                                    {selectedDayEvents.date.toLocaleDateString()}
                                </h3>
                                <button onClick={() => setSelectedDayEvents(null)} className="p-1 hover:bg-surface-200 rounded-lg"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                                {selectedDayEvents.events.map((event, i) => (
                                    <div key={i} className="p-3 bg-surface-50 rounded-xl border border-surface-200 hover:border-brand-green/30 transition-colors">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${getEventColor(event.type)}`}>
                                                {t(`calendar.${event.type}`) || event.type}
                                            </span>
                                            <span className="text-xs text-subtle font-mono">09:00 AM</span>
                                        </div>
                                        <h4 className="font-bold text-brand-dark">{event.title}</h4>
                                        {event.notes && <p className="text-sm text-subtle mt-1">{event.notes}</p>}
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-surface-50 border-t border-surface-200">
                                <button onClick={() => { setShowModal(true); setNewEvent(prev => ({ ...prev, date: selectedDayEvents.date.toLocaleDateString('en-CA') })); setSelectedDayEvents(null); }} className="btn-secondary w-full text-sm py-2">
                                    + {t('calendar.addEvent')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Event Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg glass-panel p-8 shadow-2xl border-2 border-brand-green/20">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-brand-dark">{t('calendar.addEvent')}</h3>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-surface-100 rounded-xl"><X className="w-6 h-6" /></button>
                            </div>

                            <form onSubmit={handleAddEvent} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-brand-dark mb-2">{t('calendar.eventTitle')}</label>
                                    <input required value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="input-modern w-full" placeholder="e.g. Fertilizer Application" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">{t('calendar.eventDate')}</label>
                                        <input type="date" required value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="input-modern w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">{t('calendar.eventType')}</label>
                                        <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })} className="input-modern w-full">
                                            <option value="other">{t('calendar.other')}</option>
                                            <option value="irrigation">{t('common.irrigation')}</option>
                                            <option value="harvest">{t('calendar.harvests')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-brand-dark mb-2">{t('calendar.eventNotes')}</label>
                                    <textarea rows={3} value={newEvent.notes} onChange={e => setNewEvent({ ...newEvent, notes: e.target.value })} className="input-modern w-full" />
                                </div>
                                <button disabled={saving} className="btn-primary w-full shadow-xl">
                                    {saving ? t('common.saving') : t('calendar.saveEvent')}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
