'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, Phone, MapPin, X, Plus, Heart, Star, Tag as TagIcon, Eye, Package, TrendingUp, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ExportShare from '../../components/ExportShare';
import { parseJsonResponse } from '../../lib/api';
import { getTranslatedCropName } from '../../lib/crops';

const Map = dynamic(() => import('../../components/Map'), { ssr: false });

export default function MarketplacePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [listings, setListings] = useState([]);
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [user, setUser] = useState(null);
    const [selectedListing, setSelectedListing] = useState(null);
    const [showFilterOptions, setShowFilterOptions] = useState(false);
    const [savedListings, setSavedListings] = useState(new Set());
    const [mode, setMode] = useState('marketplace');
    const [watchlistData, setWatchlistData] = useState([]);
    const [demandRequests, setDemandRequests] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewFormData, setReviewFormData] = useState({ rating: 5, comment: '' });
    const [demandFormData, setDemandFormData] = useState({
        crop_type_id: '',
        quantity_kg: '',
        max_price_per_kg: '',
        needed_by: '',
        region: '',
        description: ''
    });
    const [showDemandForm, setShowDemandForm] = useState(false);

    const [filters, setFilters] = useState({
        crop_type_id: 'All',
        region: '',
        min_price: '',
        max_price: ''
    });

    const [formData, setFormData] = useState({
        crop_type_id: '',
        quantity_kg: '',
        price_per_kg: '',
        harvest_ready_date: '',
        description: '',
        image: null,
        images: [],
        tags: '',
        latitude: null,
        longitude: null
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [previewImages, setPreviewImages] = useState([]);
    const [locationInput, setLocationInput] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('farm_user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            fetchSavedListings(userData.id);
            if (userData.role === 'farmer') {
                fetchAnalytics(userData.id);
            }
        }
        fetchListings();
        fetchCrops();
        fetchDemands();
        setSelectedListing(null);
    }, [filters]);

    useEffect(() => {
        if (mode === 'watchlist' && user) {
            fetchWatchlistData(user.id);
        } else if (mode === 'demands') {
            fetchDemands();
        } else if (mode === 'analytics' && user) {
            fetchAnalytics(user.id);
        }
    }, [mode]);

    const fetchCrops = async () => {
        try {
            const res = await fetch('/api/crops');
            const data = await parseJsonResponse(res);
            const cropsData = Array.isArray(data) ? data : [];
            setCrops(cropsData);
            if (cropsData.length > 0) {
                setFormData(prev => ({ ...prev, crop_type_id: cropsData[0].id.toString() }));
            }
        } catch (err) {
            console.error("Failed to fetch crops", err);
            setCrops([]);
        }
    };

    const fetchListings = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.crop_type_id !== 'All') params.append('crop_type_id', filters.crop_type_id);
            if (filters.region) params.append('region', filters.region);
            if (filters.min_price) params.append('min_price', filters.min_price);
            if (filters.max_price) params.append('max_price', filters.max_price);

            const res = await fetch(`/api/marketplace?${params.toString()}`);
            const data = await parseJsonResponse(res);
            setListings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setListings([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedListings = async (userId) => {
        try {
            const res = await fetch(`/api/watchlist?user_id=${userId}`, { cache: 'no-store' });
            const data = await parseJsonResponse(res);
            const ids = new Set(Array.isArray(data) ? data.map(l => l.id) : []);
            setSavedListings(ids);
        } catch (err) {
            console.error(err);
            setSavedListings(new Set());
        }
    };

    const fetchWatchlistData = async (userId) => {
        try {
            const res = await fetch(`/api/watchlist?user_id=${userId}`, { cache: 'no-store' });
            const data = await parseJsonResponse(res);
            setWatchlistData(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setWatchlistData([]);
        }
    };

    const fetchDemands = async () => {
        try {
            const res = await fetch('/api/demands');
            const data = await parseJsonResponse(res);
            setDemandRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setDemandRequests([]);
        }
    };

    const fetchAnalytics = async (farmerId) => {
        try {
            const res = await fetch(`/api/farmers/${farmerId}/analytics`, { cache: 'no-store' });
            const data = await parseJsonResponse(res);
            setAnalytics(data);
        } catch (err) {
            console.error(err);
            setAnalytics(null);
        }
    };

    const fetchReviews = async (farmerId) => {
        try {
            const res = await fetch(`/api/farmers/${farmerId}/reviews`, { cache: 'no-store' });
            const data = await parseJsonResponse(res);
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setReviews([]);
        }
    };

    const toggleSave = async (listingId) => {
        if (!user) return alert(t('common.loginFirst'));
        const isSaved = savedListings.has(listingId);

        try {
            if (isSaved) {
                await fetch(`/api/saved/${listingId}?user_id=${user.id}`, { method: 'DELETE' });
                setSavedListings(prev => {
                    const updated = new Set(prev);
                    updated.delete(listingId);
                    return updated;
                });
            } else {
                await fetch('/api/saved', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id, listing_id: listingId })
                });
                setSavedListings(prev => new Set([...prev, listingId]));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateListing = async (e) => {
        e.preventDefault();
        if (!user) return alert(t('common.loginFirst'));

        try {
            const data = new FormData();
            data.append('farmer_id', user.id);
            data.append('crop_type_id', formData.crop_type_id);
            data.append('quantity_kg', formData.quantity_kg);
            data.append('price_per_kg', formData.price_per_kg);
            data.append('harvest_ready_date', formData.harvest_ready_date);
            data.append('description', formData.description);
            data.append('tags', formData.tags);
            if (formData.image) data.append('image', formData.image);
            formData.images.forEach((img) => data.append('images', img));
            if (locationInput) {
                data.append('latitude', locationInput.lat);
                data.append('longitude', locationInput.lng);
            }

            const res = await fetch('/api/marketplace', {
                method: 'POST',
                body: data
            });

            if (res.ok) {
                setShowForm(false);
                fetchListings();
                setFormData({
                    crop_type_id: crops[0]?.id || '', quantity_kg: '', price_per_kg: '', harvest_ready_date: '', description: '', image: null, images: [], tags: '', latitude: null, longitude: null
                });
                setPreviewImage(null);
                setPreviewImages([]);
                setLocationInput(null);
                alert(t('marketplace.listingCreated'));
            } else {
                const errorData = await parseJsonResponse(res);
                alert(t('errors.somethingWrong') + ": " + (errorData.error || ""));
            }
        } catch (err) {
            console.error(err);
            alert(t('errors.networkError'));
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (confirm(t('common.confirmDelete'))) {
            try {
                await fetch(`/api/marketplace/${id}`, { method: 'DELETE' });
                fetchListings();
                if (selectedListing?.id === id) setSelectedListing(null);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user || !selectedListing) return;

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    farmer_id: selectedListing.farmer_id,
                    buyer_id: user.id,
                    rating: reviewFormData.rating,
                    comment: reviewFormData.comment
                })
            });

            if (res.ok) {
                alert(t('marketplace.reviewSubmitted'));
                setShowReviewForm(false);
                setReviewFormData({ rating: 5, comment: '' });
                fetchReviews(selectedListing.farmer_id);
                fetchListings(); // Refresh to update ratings
            } else {
                alert(t('errors.somethingWrong'));
            }
        } catch (err) {
            console.error(err);
            alert(t('errors.networkError'));
        }
    };

    const handleCreateDemand = async (e) => {
        e.preventDefault();
        if (!user) return alert(t('common.loginFirst'));

        try {
            const res = await fetch('/api/demands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buyer_id: user.id,
                    crop_type_id: parseInt(demandFormData.crop_type_id),
                    quantity_kg: parseFloat(demandFormData.quantity_kg),
                    max_price_per_kg: demandFormData.max_price_per_kg ? parseFloat(demandFormData.max_price_per_kg) : 0,
                    needed_by: demandFormData.needed_by,
                    region: demandFormData.region,
                    description: demandFormData.description
                })
            });

            if (res.ok) {
                alert(t('marketplace.demandPosted'));
                setShowDemandForm(false);
                setDemandFormData({
                    crop_type_id: crops[0]?.id || '',
                    quantity_kg: '',
                    max_price_per_kg: '',
                    needed_by: '',
                    region: '',
                    description: ''
                });
                fetchDemands();
            } else {
                const errorData = await parseJsonResponse(res);
                alert(t('errors.somethingWrong') + ": " + (errorData.error || ""));
            }
        } catch (err) {
            console.error(err);
            alert(t('errors.networkError'));
        }
    };

    const handleDeleteDemand = async (demandId) => {
        if (!user) return alert(t('common.loginFirst'));
        if (!demandId) return alert(t('errors.somethingWrong'));

        if (confirm(t('common.confirmDelete'))) {
            try {
                const res = await fetch(`/api/demands/${demandId}?buyer_id=${user.id}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    alert(t('marketplace.requestDeleted'));
                    fetchDemands();
                } else {
                    alert(t('errors.somethingWrong'));
                }
            } catch (err) {
                console.error(err);
                alert(t('errors.networkError'));
            }
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleMultipleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData({ ...formData, images: files });
        setPreviewImages(files.map(f => URL.createObjectURL(f)));
    };

    const openListingDetail = async (listing) => {
        setSelectedListing(listing);
        // Increment view count
        if (listing.id) {
            await fetch(`/api/marketplace/${listing.id}/view`, { method: 'POST' });
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 0; i < 5; i++) {
            stars.push(
                <Star key={i} className={`w-3 h-3 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            );
        }
        return stars;
    };

    return (
        <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8 pt-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="heading-xl text-4xl md:text-5xl mb-2 flex items-center gap-3">
                        <Store className="w-10 h-10 text-brand-green" /> {t('marketplace.title')}
                    </h1>
                    <p className="text-subtle text-lg">{t('marketplace.subtitle')}</p>
                </div>
                {user?.role === 'farmer' && (
                    <button
                        onClick={() => {
                            setShowForm(!showForm);
                            if (mode !== 'marketplace') setMode('marketplace');
                        }}
                        className="btn-primary shadow-lg shadow-brand-green/30"
                    >
                        {showForm && mode === 'marketplace' ? <><X className="w-5 h-5" /> {t('common.cancel')}</> : <><Plus className="w-5 h-5" /> {t('marketplace.newListing')}</>}
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="glass-panel p-2 flex gap-2 overflow-x-auto scrollbar-hide">
                <button onClick={() => setMode('marketplace')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${mode === 'marketplace' ? 'bg-brand-dark text-white shadow-md' : 'bg-surface-100 text-subtle hover:bg-surface-200'}`}>
                    <Store className="w-4 h-4 inline mr-2" />{t('common.marketplace')}
                </button>
                <button onClick={() => setMode('watchlist')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${mode === 'watchlist' ? 'bg-brand-dark text-white shadow-md' : 'bg-surface-100 text-subtle hover:bg-surface-200'}`}>
                    <Heart className="w-4 h-4 inline mr-2" />{t('marketplace.watchlist')}
                </button>
                <button onClick={() => setMode('demands')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${mode === 'demands' ? 'bg-brand-dark text-white shadow-md' : 'bg-surface-100 text-subtle hover:bg-surface-200'}`}>
                    <Package className="w-4 h-4 inline mr-2" />{t('marketplace.buyerRequests')}
                </button>
                {user?.role === 'farmer' && (
                    <button onClick={() => setMode('analytics')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${mode === 'analytics' ? 'bg-brand-dark text-white shadow-md' : 'bg-surface-100 text-subtle hover:bg-surface-200'}`}>
                        <TrendingUp className="w-4 h-4 inline mr-2" />{t('common.analytics')}
                    </button>
                )}
            </div>

            {/* Filters */}
            {mode === 'marketplace' && (
                <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        <button onClick={() => setFilters({ ...filters, crop_type_id: 'All' })} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filters.crop_type_id === 'All' ? 'bg-brand-dark text-white shadow-md' : 'bg-surface-100 text-subtle hover:bg-surface-200'}`}>
                            {t('common.all')}
                        </button>
                        {crops.map((c) => (
                            <button key={c.id} onClick={() => setFilters({ ...filters, crop_type_id: c.id.toString() })} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filters.crop_type_id === c.id.toString() ? 'bg-brand-dark text-white shadow-md' : 'bg-surface-100 text-subtle hover:bg-surface-200'}`}>
                                {getTranslatedCropName(t, c.name)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Listing Form */}
            <AnimatePresence>
                {showForm && mode === 'marketplace' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="glass-panel p-8 mb-8 border-2 border-brand-green/20">
                            <h2 className="text-2xl font-bold mb-6 text-brand-dark flex items-center gap-2">
                                <Plus className="w-6 h-6 text-brand-green" /> {t('marketplace.createNewListing')}
                            </h2>
                            <form onSubmit={handleCreateListing} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-brand-dark mb-2">{t('market.crop')}</label>
                                            <select value={formData.crop_type_id} onChange={e => setFormData({ ...formData, crop_type_id: e.target.value })} className="input-modern w-full">
{crops.map(c => (
                                                <option key={c.id} value={c.id}>{getTranslatedCropName(t, c.name)}</option>
                                            ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-brand-dark mb-2">{t('marketplace.quantity')} (kg)</label>
                                            <input type="number" placeholder="500" value={formData.quantity_kg} onChange={e => setFormData({ ...formData, quantity_kg: e.target.value })} className="input-modern w-full" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-brand-dark mb-2">{t('marketplace.pricePerKg')} ($)</label>
                                            <input type="number" placeholder="0.50" step="0.01" value={formData.price_per_kg} onChange={e => setFormData({ ...formData, price_per_kg: e.target.value })} className="input-modern w-full" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-brand-dark mb-2">{t('marketplace.harvestDate')}</label>
                                            <input type="date" value={formData.harvest_ready_date} onChange={e => setFormData({ ...formData, harvest_ready_date: e.target.value })} className="input-modern w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">{t('marketplace.tags')}</label>
                                        <input type="text" placeholder="Organic, Premium, Fresh" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="input-modern w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">{t('common.description')}</label>
                                        <textarea placeholder={t('marketplace.descriptionPlaceholder')} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-modern w-full h-32 resize-none" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">{t('marketplace.mainImage')}</label>
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-surface-200 rounded-2xl cursor-pointer hover:bg-surface-50 transition-colors overflow-hidden relative">
                                                {previewImage ? (
                                                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Plus className="w-8 h-8 text-subtle mb-2" />
                                                        <p className="text-xs text-subtle">{t('common.upload')}</p>
                                                    </div>
                                                )}
                                                <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">{t('marketplace.additionalImages')}</label>
                                        <input type="file" multiple accept="image/*" onChange={handleMultipleImageChange} className="input-modern w-full text-sm" />
                                        {previewImages.length > 0 && (
                                            <div className="grid grid-cols-5 gap-2 mt-2">
                                                {previewImages.map((img, i) => (
                                                    <img key={i} src={img} alt={`Preview ${i + 1}`} className="w-full h-16 object-cover rounded-lg border border-surface-200" />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">{t('marketplace.pickupLocation')}</label>
                                        <div className="h-32 w-full rounded-2xl overflow-hidden border border-surface-200 relative z-0">
                                            <Map position={locationInput} setPosition={setLocationInput} />
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-primary w-full py-4 text-lg shadow-xl shadow-brand-green/20">
                                        {t('marketplace.publishListing')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Listings Grid */}
            {mode === 'marketplace' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {listings.length === 0 && !loading ? (
                        <div className="col-span-full py-20 text-center glass-panel border-dashed">
                            <div className="w-24 h-24 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Store className="w-12 h-12 text-subtle" />
                            </div>
                            <h3 className="text-xl font-bold text-brand-dark">{t('common.noData')}</h3>
                            <p className="text-subtle mt-2">{t('marketplace.noListingsFound')}</p>
                        </div>
                    ) : (
                        listings.map((listing, i) => (
                            <motion.div
                                key={listing.id}
                                id={`listing-card-${i}`}
                                onClick={() => openListingDetail(listing)}
                                className="glass-panel overflow-hidden group hover:shadow-2xl hover:shadow-brand-dark/5 transition-all duration-300 cursor-pointer relative"
                                whileHover={{ y: -5 }}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleSave(listing.id); }}
                                    className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md p-2 rounded-full hover:bg-white transition-all"
                                >
                                    <Heart className={`w-5 h-5 ${savedListings.has(listing.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                                </button>

                                <div className="h-48 w-full bg-surface-100 relative overflow-hidden">
                                    {(listing.images && listing.images[0]) || listing.image_url ? (
                                        <img
                                            src={listing.images?.[0] || listing.image_url}
                                            alt={getTranslatedCropName(t, listing.crop_name)}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-subtle bg-surface-200">
                                            <Store className="w-10 h-10 opacity-30" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-brand-dark shadow-sm">
                                        {listing.region}
                                    </div>
                                    {listing.view_count > 0 && (
                                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                                            <Eye className="w-3 h-3" /> {listing.view_count}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-brand-dark">{getTranslatedCropName(t, listing.crop_name)}</h3>
                                            <div className="text-sm text-subtle flex items-center gap-1 mt-1">
                                                <span className="font-medium text-brand-green">{listing.farmer_name}</span>
                                            </div>
                                            {listing.review_count > 0 && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    {renderStars(listing.average_rating)}
                                                    <span className="text-xs text-subtle ml-1">({listing.review_count})</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <ExportShare targetId={`listing-card-${i}`} title={`${getTranslatedCropName(t, listing.crop_name)} - ${listing.farmer_name}`} data={listing} />
                                            <div className="text-2xl font-black text-brand-dark">
                                                ${listing.price_per_kg}
                                            </div>
                                            <div className="text-xs text-subtle font-medium">{t('marketplace.perKg')}</div>
                                        </div>
                                    </div>

                                    {listing.tags && listing.tags.length > 0 && (
                                        <div className="flex gap-1 flex-wrap mb-3">
                                            {listing.tags.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="px-2 py-1 bg-brand-green/10 text-brand-green text-xs rounded-full font-semibold">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-surface-50 p-2 rounded-lg text-center border border-surface-100">
                                            <div className="text-xs text-subtle font-bold uppercase">{t('marketplace.harvestDate')}</div>
                                            <div className="text-sm font-semibold text-brand-dark truncate">{listing.harvest_ready_date || t('marketplace.readyNow')}</div>
                                        </div>
                                        <div className="bg-surface-50 p-2 rounded-lg text-center border border-surface-100">
                                            <div className="text-xs text-subtle font-bold uppercase">{t('marketplace.stock')}</div>
                                            <div className="text-sm font-semibold text-brand-dark">{listing.quantity_kg} kg</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Sub-views */}
            {mode === 'watchlist' && (
                <div>
                    {watchlistData.length === 0 ? (
                        <div className="glass-panel p-12 text-center">
                            <Heart className="w-16 h-16 text-brand-green mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-brand-dark mb-2">{t('marketplace.watchlistEmpty')}</h3>
                            <p className="text-subtle">{t('marketplace.watchlistSubtitle')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {watchlistData.map(listing => (
                                <motion.div
                                    key={listing.id}
                                    onClick={() => openListingDetail(listing)}
                                    className="glass-panel overflow-hidden group hover:shadow-2xl hover:shadow-brand-dark/5 transition-all duration-300 cursor-pointer relative"
                                    whileHover={{ y: -5 }}
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleSave(listing.id); }}
                                        className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md p-2 rounded-full hover:bg-white transition-all"
                                    >
                                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                                    </button>

                                    <div className="h-48 w-full bg-surface-100 relative overflow-hidden">
                                        {listing.image_url ? (
                                            <img src={listing.image_url} alt={getTranslatedCropName(t, listing.crop_name)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-subtle bg-surface-200">
                                                <Store className="w-10 h-10 opacity-30" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-brand-dark shadow-sm">
                                            {listing.region}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-brand-dark">{getTranslatedCropName(t, listing.crop_name)}</h3>
                                                <div className="text-sm text-subtle flex items-center gap-1 mt-1">
                                                    <span className="font-medium text-brand-green">{listing.farmer_name}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-brand-dark">${listing.price_per_kg}</div>
                                                <div className="text-xs text-subtle font-medium">per kg</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-surface-50 p-2 rounded-lg text-center border border-surface-100">
                                                <div className="text-xs text-subtle font-bold uppercase">Harvest</div>
                                                <div className="text-sm font-semibold text-brand-dark truncate">{listing.harvest_ready_date || 'Ready Now'}</div>
                                            </div>
                                            <div className="bg-surface-50 p-2 rounded-lg text-center border border-surface-100">
                                                <div className="text-xs text-subtle font-bold uppercase">Stock</div>
                                                <div className="text-sm font-semibold text-brand-dark">{listing.quantity_kg} kg</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )
            }

            {/* Buyer Demands View */}
            {
                mode === 'demands' && (
                    <div className="space-y-8">
                        {/* Create Demand Button for Buyers */}
                        {user?.role !== 'farmer' && (
                            <div className="flex justify-end">
                                <button onClick={() => setShowDemandForm(!showDemandForm)} className="btn-primary shadow-lg shadow-brand-green/30">
                                    {showDemandForm ? <><X className="w-5 h-5" /> {t('common.cancel')}</> : <><Plus className="w-5 h-5" /> {t('marketplace.postRequest')}</>}
                                </button>
                            </div>
                        )}

                        {/* Demand Form */}
                        <AnimatePresence>
                            {showDemandForm && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className="glass-panel p-8 border-2 border-brand-green/20">
                                        <h2 className="text-2xl font-bold mb-6 text-brand-dark flex items-center gap-2">
                                            <Package className="w-6 h-6 text-brand-green" /> {t('marketplace.postBuyerRequest')}
                                        </h2>
                                        <form onSubmit={handleCreateDemand} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-brand-dark mb-2">{t('market.crop')}</label>
                                                <select value={demandFormData.crop_type_id} onChange={e => setDemandFormData({ ...demandFormData, crop_type_id: e.target.value })} className="input-modern w-full" required>
                                                    <option value="">{t('marketplace.selectCrop')}</option>
{crops.map(c => (
                                                <option key={c.id} value={c.id}>{getTranslatedCropName(t, c.name)}</option>
                                            ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-brand-dark mb-2">{t('marketplace.quantity')} (kg)</label>
                                                <input type="number" placeholder="500" value={demandFormData.quantity_kg} onChange={e => setDemandFormData({ ...demandFormData, quantity_kg: e.target.value })} className="input-modern w-full" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-brand-dark mb-2">{t('marketplace.maxPricePerKg')} ($)</label>
                                                <input type="number" placeholder="0.50" step="0.01" value={demandFormData.max_price_per_kg} onChange={e => setDemandFormData({ ...demandFormData, max_price_per_kg: e.target.value })} className="input-modern w-full" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-brand-dark mb-2">{t('marketplace.neededBy')}</label>
                                                <input type="date" value={demandFormData.needed_by} onChange={e => setDemandFormData({ ...demandFormData, needed_by: e.target.value })} className="input-modern w-full" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-brand-dark mb-2">{t('common.region')}</label>
                                                <input type="text" placeholder="Tashkent" value={demandFormData.region} onChange={e => setDemandFormData({ ...demandFormData, region: e.target.value })} className="input-modern w-full" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-bold text-brand-dark mb-2">{t('common.description')}</label>
                                                <textarea placeholder={t('marketplace.descriptionPlaceholder')} value={demandFormData.description} onChange={e => setDemandFormData({ ...demandFormData, description: e.target.value })} className="input-modern w-full h-24 resize-none" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <button type="submit" className="btn-primary w-full py-3">{t('marketplace.postRequest')}</button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Demands List */}
                        {demandRequests.length === 0 ? (
                            <div className="glass-panel p-12 text-center">
                                <Package className="w-16 h-16 text-brand-green mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-brand-dark mb-2">{t('marketplace.noDemandsYet')}</h3>
                                <p className="text-subtle">{t('marketplace.demandsSubtitle')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {demandRequests.map(demand => (
                                    <div key={demand.id} className="glass-panel p-6 hover:shadow-lg transition-shadow relative">


                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-brand-dark">{getTranslatedCropName(t, demand.crop_name)}</h3>
                                                <p className="text-sm text-subtle">{demand.buyer_name} • {demand.region}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-brand-green">{demand.quantity_kg} kg</div>
                                                {demand.max_price_per_kg && (
                                                    <div className="text-xs text-subtle">Max ${demand.max_price_per_kg}/kg</div>
                                                )}
                                            </div>
                                        </div>
                                        {demand.description && (
                                            <p className="text-sm text-subtle mb-4">{demand.description}</p>
                                        )}
                                        <div className="flex items-center justify-between pt-3 border-t border-surface-200">
                                            <div className="text-xs text-subtle">
                                                {demand.needed_by ? `${t('marketplace.neededBy')} ${demand.needed_by}` : t('marketplace.asSoonAsPossible')}
                                            </div>
                                            {user?.role === 'farmer' && (
                                                <a href={`tel:${demand.buyer_phone}`} className="text-sm font-bold text-brand-green hover:text-brand-dark flex items-center gap-1">
                                                    <Phone className="w-4 h-4" /> {t('common.contact')}
                                                </a>
                                            )}
                                            {/* Delete button for own requests */}
                                            {user && user.id === demand.buyer_id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteDemand(demand.id); }}
                                                    className="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                                                >
                                                    <Trash2 className="w-4 h-4" /> {t('marketplace.deleteRequest')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }

            {/* Analytics View */}
            {
                mode === 'analytics' && (
                    <div className="space-y-6">
                        {analytics ? (
                            <>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="glass-panel p-6 border-l-4 border-brand-green">
                                        <div className="flex items-center justify-between mb-2">
                                            <Eye className="w-8 h-8 text-brand-green" />
                                            <span className="text-3xl font-black text-brand-dark">{analytics.total_views || 0}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-subtle uppercase">{t('marketplace.totalViews')}</h4>
                                        <p className="text-xs text-subtle mt-1">{t('marketplace.viewsSubtitle')}</p>
                                    </div>
                                    <div className="glass-panel p-6 border-l-4 border-blue-500">
                                        <div className="flex items-center justify-between mb-2">
                                            <Phone className="w-8 h-8 text-blue-500" />
                                            <span className="text-3xl font-black text-brand-dark">{analytics.total_contacts || 0}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-subtle uppercase">{t('marketplace.contactClicks')}</h4>
                                        <p className="text-xs text-subtle mt-1">{t('marketplace.contactsSubtitle')}</p>
                                    </div>
                                    <div className="glass-panel p-6 border-l-4 border-purple-500">
                                        <div className="flex items-center justify-between mb-2">
                                            <Store className="w-8 h-8 text-purple-500" />
                                            <span className="text-3xl font-black text-brand-dark">{analytics.listing_count || 0}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-subtle uppercase">{t('marketplace.activeListings')}</h4>
                                        <p className="text-xs text-subtle mt-1">{t('marketplace.activeListingsSubtitle')}</p>
                                    </div>
                                </div>

                                {/* Performance Insights */}
                                <div className="glass-panel p-8">
                                    <h3 className="text-2xl font-bold text-brand-dark mb-6 flex items-center gap-2">
                                        <TrendingUp className="w-6 h-6 text-brand-green" /> {t('marketplace.performanceInsights')}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-3 border-b border-surface-200">
                                            <div>
                                                <p className="font-bold text-brand-dark">{t('marketplace.conversionRate')}</p>
                                                <p className="text-sm text-subtle">{t('marketplace.conversionSubtitle')}</p>
                                            </div>
                                            <div className="text-2xl font-black text-brand-green">
                                                {analytics.total_views > 0 ? ((analytics.total_contacts / analytics.total_views) * 100).toFixed(1) : 0}%
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-surface-200">
                                            <div>
                                                <p className="font-bold text-brand-dark">{t('marketplace.avgViewsPerListing')}</p>
                                                <p className="text-sm text-subtle">{t('marketplace.avgViewsSubtitle')}</p>
                                            </div>
                                            <div className="text-2xl font-black text-brand-dark">
                                                {analytics.listing_count > 0 ? (analytics.total_views / analytics.listing_count).toFixed(1) : 0}
                                            </div>
                                        </div>
                                        <div className="bg-brand-green/10 rounded-2xl p-6 mt-6">
                                            <h4 className="font-bold text-brand-dark mb-2 flex items-center gap-2">
                                                💡 {t('marketplace.proTip')}
                                            </h4>
                                            <p className="text-sm text-subtle">
                                                {analytics.total_contacts === 0
                                                    ? t('marketplace.proTipNoContacts')
                                                    : analytics.total_views / analytics.listing_count < 5
                                                        ? t('marketplace.proTipLowViews')
                                                        : t('marketplace.proTipSuccess')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="glass-panel p-12 text-center">
                                <TrendingUp className="w-16 h-16 text-brand-green mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-brand-dark mb-2">{t('marketplace.loadingAnalytics')}</h3>
                                <p className="text-subtle">{t('marketplace.fetchingPerformance')}</p>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Detail Modal (keeping the existing structure) */}
            <AnimatePresence>
                {selectedListing && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedListing(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-[#fafaf9] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl pointer-events-auto border border-white/50"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] h-full">
                                    {/* Left: Image */}
                                    <div className="h-64 lg:h-full min-h-[300px] relative bg-surface-200">
                                        {(selectedListing.images && selectedListing.images[0]) || selectedListing.image_url ? (
                                            <img
                                                src={selectedListing.images?.[0] || selectedListing.image_url}
                                                alt={getTranslatedCropName(t, selectedListing.crop_name)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-subtle">
                                                <Store className="w-16 h-16 opacity-30" />
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedListing(null); }}
                                            className="absolute top-4 left-4 bg-white/50 backdrop-blur-md p-2 rounded-full hover:bg-white text-brand-dark transition-all md:hidden"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    {/* Right: Details */}
                                    <div className="p-8 space-y-6 relative">
                                        <button
                                            onClick={() => setSelectedListing(null)}
                                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-100 text-subtle transition-colors hidden md:block"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>

                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold uppercase tracking-wide">
                                                    {t('marketplace.forSale')}
                                                </span>
                                                <span className="px-3 py-1 rounded-full bg-surface-100 text-subtle text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {selectedListing.region}
                                                </span>
                                            </div>
                                            <h2 className="text-3xl font-black text-brand-dark mb-1">{getTranslatedCropName(t, selectedListing.crop_name)}</h2>
                                            <div className="text-base text-subtle font-medium">
                                                {t('marketplace.soldBy')} <span className="text-brand-dark">{selectedListing.farmer_name}</span>
                                            </div>
                                            {selectedListing.review_count > 0 && (
                                                <div className="flex items-center gap-1 mt-2">
                                                    {renderStars(selectedListing.average_rating)}
                                                    <span className="text-sm text-subtle ml-2">
                                                        {selectedListing.average_rating.toFixed(1)} ({selectedListing.review_count} {t('marketplace.reviews')})
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-end gap-2 border-b border-surface-100 pb-6">
                                            <div className="text-4xl font-black text-brand-green">${selectedListing.price_per_kg}</div>
                                            <div className="text-base text-subtle font-medium mb-1">/ kg</div>
                                        </div>

                                        {selectedListing.tags && selectedListing.tags.length > 0 && (
                                            <div className="flex gap-2 flex-wrap">
                                                {selectedListing.tags.map((tag, i) => (
                                                    <span key={i} className="px-3 py-1 bg-brand-dark/5 text-brand-dark text-sm rounded-full font-semibold flex items-center gap-1">
                                                        <TagIcon className="w-3 h-3" /> {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
                                                <div className="flex items-center gap-2 text-brand-dark font-bold mb-1">
                                                    <Package className="w-4 h-4 text-brand-green" /> {t('marketplace.stock')}
                                                </div>
                                                <div className="text-lg text-subtle">{selectedListing.quantity_kg} kg</div>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
                                                <div className="flex items-center gap-2 text-brand-dark font-bold mb-1">
                                                    <Package className="w-4 h-4 text-brand-green" /> {t('marketplace.harvest')}
                                                </div>
                                                <div className="text-lg text-subtle">{selectedListing.harvest_ready_date || t('marketplace.readyNow')}</div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-brand-dark mb-1 text-sm uppercase tracking-wider opacity-60">{t('marketplace.description')}</h3>
                                            <p className="text-sm text-subtle leading-relaxed">
                                                {selectedListing.description || t('marketplace.noDescription')}
                                            </p>
                                        </div>

                                        {selectedListing.latitude && selectedListing.longitude && selectedListing.latitude !== 0 && (
                                            <div className="h-48 rounded-2xl overflow-hidden border border-surface-200 relative shadow-inner">
                                                <Map
                                                    position={{ lat: selectedListing.latitude, lng: selectedListing.longitude }}
                                                    readonly={true}
                                                />
                                            </div>
                                        )}

                                        <div className="pt-2 flex gap-3">
                                            {user && selectedListing.farmer_id === user.id ? (
                                                <button
                                                    onClick={(e) => handleDelete(e, selectedListing.id)}
                                                    className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    {t('marketplace.deleteListing')}
                                                </button>
                                            ) : (
                                                <a
                                                    href={`tel:${selectedListing.farmer_phone}`}
                                                    onClick={() => handleContactClick(selectedListing.id)}
                                                    className="flex-1 py-3 bg-brand-dark text-white hover:bg-black rounded-2xl font-bold transition-all shadow-xl shadow-brand-dark/20 flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <Phone className="w-4 h-4" /> {t('marketplace.contactFarmer')}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
