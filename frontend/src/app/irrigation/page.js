'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Droplets, Leaf, CheckCircle2, Circle, Save, Trash2, Sprout } from 'lucide-react';

export default function IrrigationPage() {
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'saved'
    const [crop, setCrop] = useState('');
    const [crops, setCrops] = useState([]);
    const [date, setDate] = useState('');
    const [region, setRegion] = useState(''); // New state
    const [schedule, setSchedule] = useState(null);
    const [savedSchedules, setSavedSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

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
        fetchSavedSchedules();
        fetchCrops();
    }, []);

    const fetchSavedSchedules = async () => {
        let storedUser;
        try {
            storedUser = JSON.parse(localStorage.getItem('farm_user'));
        } catch (e) {
            console.error("Invalid user session data");
            return;
        }

        if (!storedUser || !storedUser.id) return;

        try {
            const res = await fetch(`/api/irrigation/saved?user_id=${storedUser.id}`, { cache: 'no-store' });
            const data = await res.json();
            setSavedSchedules(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch saved schedules:", err);
        }
    };

    const fetchSchedule = async (e) => {
        e.preventDefault();
        setLoading(true);
        console.log(`Fetching schedule for ${crop} in ${region} from ${date}`);
        try {
            const res = await fetch(`/api/irrigation?crop=${crop}&planting_date=${date}&region=${region}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setSchedule(data);
                console.log("Schedule generated:", data);
            } else {
                const errorData = await res.json();
                alert('Generation failed: ' + (errorData.error || 'Server error'));
                setSchedule(null);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            alert('Failed to connect to server.');
        }
        setLoading(false);
    };

    const saveSchedule = async () => {
        const storedUser = JSON.parse(localStorage.getItem('farm_user'));
        if (!storedUser) {
            alert('Please Log In to save schedules to your farm.');
            return;
        }
        if (!schedule) return;

        const payload = {
            user_id: storedUser.id,
            crop_name: schedule.crop_name,
            region: region,
            planting_date: date,
            reminders: schedule.reminders
        };

        console.log('Attempting to save schedule:', payload);

        setSaving(true);
        try {
            const res = await fetch('/api/irrigation/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                console.log('Save successful, received ID:', data.id);
                await fetchSavedSchedules();
                setActiveTab('saved');
                setSchedule(null);
                alert('Schedule saved to My Farm!');
            } else {
                const data = await res.json();
                alert('Save failed: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Save failed. Please check your connection.');
        }
        setSaving(false);
    };

    const toggleStep = async (stepId) => {
        try {
            const res = await fetch(`/api/irrigation/steps/${stepId}/toggle`, {
                method: 'POST'
            });
            if (res.ok) {
                fetchSavedSchedules();
            } else {
                alert('Failed to update step.');
            }
        } catch (err) {
            console.error('Toggle error:', err);
        }
    };

    const deleteSchedule = async (id) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;
        try {
            const res = await fetch(`/api/irrigation/saved/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchSavedSchedules();
                alert('Schedule deleted.');
            } else {
                alert('Failed to delete schedule.');
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 pt-32">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
                <div>
                    <h1 className="text-4xl heading-xl mb-4 text-brand-dark">Irrigation & Care Reminders</h1>
                    <p className="text-subtle max-w-2xl text-lg">Manage your field schedules with tailoring for your specific region.</p>
                </div>

                <div className="flex bg-surface-100 p-1.5 rounded-2xl border border-surface-200">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-white text-brand-green shadow-sm' : 'text-subtle hover:text-brand-dark'}`}
                    >
                        Schedule Builder
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'saved' ? 'bg-white text-brand-green shadow-sm' : 'text-subtle hover:text-brand-dark'}`}
                    >
                        My Farm
                        {savedSchedules.length > 0 && (
                            <span className="bg-brand-green/10 text-brand-green text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                                {savedSchedules.length}
                            </span>
                        )}
                    </button>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {activeTab === 'new' ? (
                    <motion.div
                        key="new-tab"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-12"
                    >
                        {/* Input Form */}
                        <div className="lg:col-span-1">
                            <form onSubmit={fetchSchedule} className="glass-panel p-8 space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-brand-dark">Select Crop</label>
                                    <select
                                        value={crop}
                                        onChange={(e) => setCrop(e.target.value)}
                                        className="input-modern w-full"
                                        required
                                    >
                                        <option value="">Choose a crop...</option>
                                        {crops.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-brand-dark">Region</label>
                                    <select
                                        value={region}
                                        onChange={(e) => setRegion(e.target.value)}
                                        className="input-modern w-full"
                                        required
                                    >
                                        <option value="">Select your region...</option>
                                        <option value="Tashkent">Tashkent Region</option>
                                        <option value="Fergana">Fergana Valley</option>
                                        <option value="Karakalpakstan">Karakalpakstan (Hot/Arid)</option>
                                        <option value="Samarkand">Samarkand/Bukhara</option>
                                        <option value="Mountainous">Mountainous Areas</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-brand-dark">Planting Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="input-modern w-full"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full shadow-lg"
                                >
                                    {loading ? 'Calculating...' : 'Generate Schedule'}
                                </button>
                            </form>
                        </div>

                        {/* Results */}
                        <div className="lg:col-span-2">
                            {schedule ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-brand-green rounded-2xl flex items-center justify-center shadow-lg shadow-brand-green/20">
                                                <Leaf className="text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-brand-dark">{schedule.crop_name} Cycle</h2>
                                                <p className="text-sm text-subtle">Tailored for {region || 'General Region'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={saveSchedule}
                                            disabled={saving}
                                            className="btn-primary bg-brand-gold hover:bg-brand-gold/90 py-2.5 px-6 gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            {saving ? 'Saving...' : 'Save to My Farm'}
                                        </button>
                                    </div>

                                    <div className="grid gap-4">
                                        {schedule.reminders.map((item, i) => (
                                            <div key={i} className="glass-panel p-6 flex items-center gap-6 opacity-80">
                                                <div className="flex items-center gap-4 md:w-32">
                                                    <Calendar className="text-brand-gold w-5 h-5" />
                                                    <span className="font-mono font-bold text-sm">{item.date}</span>
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="text-brand-gold font-bold text-[10px] uppercase tracking-wider">{item.stage}</div>
                                                    <div className="text-brand-dark font-medium">{item.action}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center glass-panel border-dashed border-2 border-surface-200">
                                    <Sprout className="text-brand-green/20 w-16 h-16 mb-4" />
                                    <h3 className="text-xl font-bold text-brand-dark">Start a New Cycle</h3>
                                    <p className="text-subtle max-w-xs mx-auto mt-2">Enter your crop and region to generate a scientific care timeline.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="saved-tab"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-12"
                    >
                        {savedSchedules.length > 0 ? (
                            savedSchedules.map((s) => {
                                const completedCount = s.steps.filter(st => st.completed_at).length;
                                const progress = Math.round((completedCount / s.steps.length) * 100);

                                return (
                                    <div key={s.id} className="space-y-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-brand-green/10 rounded-2xl">
                                                    <Sprout className="text-brand-green w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-brand-dark font-display">{s.crop_name} - {s.region}</h2>
                                                    <p className="text-sm text-subtle">Planted on {new Date(s.planting_date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-brand-dark uppercase tracking-widest mb-1">{progress}% Complete</div>
                                                    <div className="w-32 h-2 bg-surface-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-brand-green transition-all duration-500"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteSchedule(s.id)}
                                                    className="p-2 text-subtle hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid gap-4">
                                            {s.steps.map((step) => {
                                                const isToday = new Date(step.date).toDateString() === new Date().toDateString();
                                                const isCompleted = step.completed_at !== null;

                                                return (
                                                    <div
                                                        key={step.id}
                                                        className={`glass-panel p-6 flex flex-col md:flex-row md:items-center gap-6 transition-all border-l-4 ${isCompleted ? 'opacity-60 border-l-slate-200' :
                                                            isToday ? 'border-l-brand-green bg-brand-green/[0.02] ring-1 ring-brand-green/10' : 'border-l-transparent'
                                                            }`}
                                                    >
                                                        <button
                                                            onClick={() => toggleStep(step.id)}
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-brand-green text-white' : 'border-2 border-surface-300 text-surface-300 hover:border-brand-green hover:text-brand-green'
                                                                }`}
                                                        >
                                                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                        </button>

                                                        <div className="flex items-center gap-4 md:w-32">
                                                            <span className={`font-mono font-bold ${isToday ? 'text-brand-green' : 'text-brand-dark'}`}>
                                                                {step.date}
                                                            </span>
                                                        </div>

                                                        <div className="flex-grow">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="text-brand-gold font-bold text-xs uppercase tracking-wider">{step.stage}</div>
                                                                {isToday && !isCompleted && (
                                                                    <span className="bg-brand-green text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase ring-2 ring-brand-green/20">
                                                                        Current Stage
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className={`text-brand-dark font-bold text-lg ${isCompleted ? 'line-through' : ''}`}>
                                                                {step.action}
                                                            </div>
                                                            {step.notes && <p className="text-sm text-subtle leading-relaxed italic">{step.notes}</p>}
                                                        </div>

                                                        <div className={`text-xs font-bold uppercase transition-all px-3 py-1.5 rounded-lg ${isCompleted ? 'bg-surface-200 text-subtle' :
                                                            isToday ? 'bg-brand-green text-white shadow-md' : 'bg-brand-green/5 text-brand-green'
                                                            }`}>
                                                            {isCompleted ? 'Done' : isToday ? 'Action Today' : 'Pending'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="h-px bg-slate-200 mt-8" />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center glass-panel border-dashed border-2 border-surface-200">
                                <div className="w-20 h-20 bg-brand-green/5 rounded-full flex items-center justify-center mb-6">
                                    <Sprout className="text-brand-green/20 w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-brand-dark">No Active Cycles</h3>
                                <p className="text-subtle max-w-xs mx-auto mt-2">Save a generated schedule to start tracking your farm's irrigation progress.</p>
                                <button
                                    onClick={() => setActiveTab('new')}
                                    className="mt-6 text-brand-green font-bold text-sm hover:underline"
                                >
                                    Build your first schedule &rarr;
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Disclaimer */}
            <div className="mt-20 p-8 bg-surface-100 rounded-3xl border border-surface-200 max-w-4xl mx-auto">
                <div className="flex items-start gap-5 text-subtle italic text-sm">
                    <Leaf className="w-6 h-6 flex-shrink-0 mt-1 text-brand-green/60" />
                    <div>
                        <p className="leading-relaxed">
                            <strong>Disclaimer:</strong> These schedules are based on general FAO (Food and Agriculture Organization)
                            guidelines for Uzbekistan's climate. Local soil conditions, specific varieties, and actual weather
                            may require adjustments. Always consult with a local agronomist for critical field decisions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
