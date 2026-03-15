import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ReviewCard from '../components/ReviewCard';
import ShopMap from '../components/ShopMap';
import { useApp } from '../App';
import { openDirections } from '../utils/geo';

const API = 'http://localhost:5000/api';

export default function ShopPage() {
    const { id } = useParams();
    const { user, openAuth, showToast } = useApp();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    const fetchShop = async () => {
        try {
            const res = await fetch(`${API}/shops/${id}`);
            const data = await res.json();
            setShop(data);
        } catch (err) { console.error(err); }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API}/products/shop/${id}`);
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
    };

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${API}/shops/${id}/reviews`);
            const data = await res.json();
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchShop(), fetchProducts(), fetchReviews()])
            .finally(() => setLoading(false));
    }, [id]);

    const submitReview = async (e) => {
        e.preventDefault();
        if (!user) { openAuth('login'); return; }
        setSubmittingReview(true);
        try {
            const res = await fetch(`${API}/shops/${id}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
                body: JSON.stringify(reviewForm)
            });
            if (!res.ok) throw new Error('Failed to submit review');
            showToast('Review submitted! ⭐');
            setShowReviewForm(false);
            setReviewForm({ rating: 5, comment: '' });
            fetchShop();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSubmittingReview(false); }
    };

    if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>;
    if (!shop) return <div className="page"><div className="container" style={{ paddingTop: 40 }}><p>Shop not found</p></div></div>;

    const bannerUrl = shop.banner || `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=5429c4&color=fff&size=1200&length=2`;

    // Extract unique categories from shop's products
    const categories = ['All', ...new Set(products.map(p => p.category))];
    const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory);

    return (
        <div className="page" style={{ paddingBottom: 60 }}>
            {/* Banner */}
            <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
                <img src={bannerUrl} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=5429c4&color=fff&size=800&length=2`; }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,15,19,0.95) 0%, rgba(15,15,19,0.3) 100%)' }} />
            </div>

            <div className="container">
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, color: 'var(--text-muted)', marginTop: 20 }}>
                    <Link to="/home" style={{ color: 'var(--text-muted)' }}>Home</Link>
                    <span>›</span>
                    <Link to={`/category/${encodeURIComponent(shop.category)}`} style={{ color: 'var(--text-muted)' }}>{shop.category}</Link>
                    <span>›</span>
                    <span style={{ color: 'var(--text)' }}>{shop.name}</span>
                </div>

                {/* Shop info */}
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 48, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32 }}>
                    {shop.logo && (
                        <img src={shop.logo} alt="logo" style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                    )}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <span className="badge badge-primary" style={{ marginBottom: 8 }}>{shop.category}</span>
                                <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 4 }}>{shop.name}</h1>
                                {shop.description && <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 12 }}>{shop.description}</p>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginBottom: 4 }}>
                                    {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ fontSize: 18, color: s <= Math.round(shop.rating) ? '#F59E0B' : '#3A3A55' }}>★</span>)}
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{Number(shop.rating || 0).toFixed(1)} · {shop.totalReviews || 0} reviews</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: 'var(--text-muted)' }}>
                            {shop.address && <span>📍 {shop.address}{shop.city ? `, ${shop.city}` : ''}{shop.pincode ? ` - ${shop.pincode}` : ''}</span>}
                            {shop.phone && <span>📞 {shop.phone}</span>}
                            {shop.openingHours && <span>🕐 {shop.openingHours}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            {shop.deliveryAvailable && <span className="badge badge-success">🚚 Home Delivery</span>}
                            {shop.pickupAvailable && <span className="badge badge-warning">📦 Shop Pickup</span>}
                        </div>
                    </div>
                </div>

                {/* Map Section */}
                {shop.location && shop.location.lat && shop.location.lng && (
                    <div style={{ marginBottom: 48 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Shop Location</h2>
                            <button
                                onClick={() => openDirections(shop.location, showToast)}
                                className="btn-secondary"
                                style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer' }}
                            >
                                🗺️ Get Directions
                            </button>
                        </div>
                        <ShopMap location={shop.location} shopName={shop.name} />
                    </div>
                )}

                {/* Products */}
                <section style={{ marginBottom: 52 }}>
                    <div className="section-header" style={{ marginBottom: 24 }}>
                        <div>
                            <h2 className="section-title">Products</h2>
                            <p className="section-subtitle">{filteredProducts.length} products available</p>
                        </div>
                        {categories.length > 2 && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        style={{
                                            padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: '1px solid var(--border)',
                                            background: selectedCategory === cat ? 'var(--primary)' : 'var(--bg-card2)',
                                            color: selectedCategory === cat ? 'white' : 'var(--text-muted)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📦</div>
                            <h3>{selectedCategory === 'All' ? 'No products yet' : `No products in ${selectedCategory}`}</h3>
                            <p>This shop hasn't added any products in this section yet.</p>
                        </div>
                    ) : (
                        <div className="grid-4">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Reviews */}
                <section>
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Reviews</h2>
                            <p className="section-subtitle">{reviews.length} customer reviews</p>
                        </div>
                        <button className="btn-secondary" onClick={() => { if (!user) { openAuth('login'); return; } setShowReviewForm(v => !v); }}>
                            ✍️ Write Review
                        </button>
                    </div>

                    {showReviewForm && (
                        <form onSubmit={submitReview} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                            <div className="form-group">
                                <label>Rating</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button key={s} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                                            style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: s <= reviewForm.rating ? '#F59E0B' : '#3A3A55' }}>
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Comment</label>
                                <textarea rows={3} required value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} placeholder="Share your experience..." />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="submit" className="btn-primary" disabled={submittingReview}>{submittingReview ? 'Submitting...' : 'Submit Review'}</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowReviewForm(false)}>Cancel</button>
                            </div>
                        </form>
                    )}

                    {reviews.length === 0 ? (
                        <div className="empty-state"><div className="icon">⭐</div><h3>No reviews yet</h3><p>Be the first to review this shop!</p></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {reviews.map(r => <ReviewCard key={r._id} review={r} />)}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
