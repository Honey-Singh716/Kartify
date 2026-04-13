import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReviewCard from '../components/ReviewCard';
import { useApp } from '../App';

import { API_URL, IMAGE_URL } from '../config';

const API = API_URL;

export default function ProductPage() {
    const { id } = useParams();
    const { user, cart, addToCart, openAuth, showToast } = useApp();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImg, setSelectedImg] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState(null);

    // Normalize specifications to always be a plain object
    const normalizeSpecs = (specs) => {
        if (!specs) return {};
        if (typeof specs === 'object' && !Array.isArray(specs)) return specs;
        if (typeof specs === 'string') {
            // Try JSON parse first
            try { const parsed = JSON.parse(specs); if (typeof parsed === 'object') return parsed; } catch (e) { }
            // Try "Key: Value, Key2: Value2" format or newline-separated
            const result = {};
            specs.split(/[,\n]+/).forEach(part => {
                const idx = part.indexOf(':');
                if (idx > 0) {
                    const k = part.slice(0, idx).trim();
                    const v = part.slice(idx + 1).trim();
                    if (k) result[k] = v;
                }
            });
            return Object.keys(result).length > 0 ? result : {};
        }
        return {};
    };

    const fetchProduct = async () => {
        try {
            const [pRes, rRes] = await Promise.all([
                fetch(`${API}/products/${id}`),
                fetch(`${API}/reviews/${id}`)
            ]);
            const [pData, rData] = await Promise.all([pRes.json(), rRes.json()]);
            // Normalize so specifications is always an object, never a string
            if (pData && typeof pData === 'object') {
                pData.specifications = normalizeSpecs(pData.specifications);
            }
            setProduct(pData);
            setReviews(Array.isArray(rData) ? rData : []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchProduct(); }, [id]);

    const handleAddToCart = (redirect = false) => {
        if (!user) { openAuth('login'); showToast('You must sign in to continue.', 'warning'); return; }
        if (user.role === 'seller') { showToast('Sellers cannot purchase products using seller accounts.', 'error'); return; }
        const shopId = typeof product.shop === 'object' ? product.shop._id : product.shop;
        const shopName = typeof product.shop === 'object' ? product.shop.name : '';
        if (cart.shopId && cart.shopId !== shopId) {
            showToast('Your cart contains items from another shop. Clear cart to add this item.', 'warning');
            return;
        }
        addToCart(product, shopId, shopName, selectedVariant);
        if (redirect) {
            navigate('/checkout');
        } else {
            showToast(`${product.name}${selectedVariant ? ` (${selectedVariant.color})` : ''} added to cart! 🛒`);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (!user) { openAuth('login'); showToast('You must sign in to continue.', 'warning'); return; }
        if (user.role === 'seller') { showToast('Sellers cannot write reviews using seller accounts.', 'error'); return; }
        setSubmittingReview(true);
        try {
            const res = await fetch(`${API}/reviews/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
                body: JSON.stringify(reviewForm)
            });
            if (!res.ok) throw new Error('Failed to submit review');
            showToast('Review submitted! ⭐');
            setShowReviewForm(false);
            setReviewForm({ rating: 5, comment: '' });
            fetchProduct();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSubmittingReview(false); }
    };

    if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>;
    if (!product) return <div className="page"><div className="container" style={{ paddingTop: 40 }}><p>Product not found</p></div></div>;

    const imgs = product.images && product.images.length > 0 ? product.images
        : [`https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=6C3DE1&color=fff&size=400`];
    const shop = product.shop;

    const getDisplayImg = () => {
        if (selectedVariant && selectedVariant.image) return selectedVariant.image;
        return imgs[selectedImg];
    };

    const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;
    const isOutOfStock = effectiveStock === 0;

    return (
        <div className="page" style={{ paddingBottom: 60 }}>
            <div className="container" style={{ paddingTop: 36 }}>
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, fontSize: 14, color: 'var(--text-muted)' }}>
                    <Link to="/home" style={{ color: 'var(--text-muted)' }}>Home</Link>
                    <span>›</span>
                    {shop && <><Link to={`/shop/${shop._id}`} style={{ color: 'var(--text-muted)' }}>{shop.name}</Link><span>›</span></>}
                    <span style={{ color: 'var(--text)' }}>{product.name}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start', marginBottom: 52 }}>
                    {/* Images */}
                    <div>
                        <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 12, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                                src={getDisplayImg()?.startsWith('/uploads/') ? `${IMAGE_URL}${getDisplayImg()}` : getDisplayImg()}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=6C3DE1&color=fff&size=400`; }}
                            />
                        </div>
                        {imgs.length > 1 && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                {imgs.map((img, i) => (
                                    <button key={i} onClick={() => setSelectedImg(i)} style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: `2px solid ${i === selectedImg ? 'var(--primary)' : 'var(--border)'}`, padding: 0, background: 'none', cursor: 'pointer' }}>
                                        <img src={img?.startsWith('/uploads/') ? `${IMAGE_URL}${img}` : img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        <span className="badge badge-primary" style={{ marginBottom: 12 }}>{product.category}</span>
                        <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>{product.name}</h1>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div className="stars">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ fontSize: 18, color: s <= Math.round(product.rating) ? '#F59E0B' : '#3A3A55' }}>★</span>)}
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{Number(product.rating || 0).toFixed(1)} ({product.totalReviews || 0} reviews)</span>
                        </div>

                        <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--primary-light)', marginBottom: 20 }}>
                            ₹{product.price.toLocaleString('en-IN')}
                        </div>

                        {/* Color Variants */}
                        {product.variants && product.variants.length > 0 && (
                            <div style={{ marginBottom: 28 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Select Color: {selectedVariant?.color || 'Please select'}
                                </p>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {product.variants.map(v => (
                                        <button
                                            key={v._id}
                                            onClick={() => setSelectedVariant(v === selectedVariant ? null : v)}
                                            style={{
                                                padding: '8px 20px',
                                                borderRadius: 12,
                                                border: `2px solid ${v === selectedVariant ? 'var(--primary)' : 'var(--border)'}`,
                                                background: v === selectedVariant ? 'var(--primary-light-alpha)' : 'var(--bg-card)',
                                                color: v === selectedVariant ? 'var(--primary-light)' : 'var(--text)',
                                                fontSize: 14,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8
                                            }}>
                                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary-light)' }} />
                                            {v.color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stock */}
                        <div style={{ marginBottom: 24 }}>
                            {isOutOfStock ? (
                                <span className="badge badge-danger" style={{ fontSize: 13, padding: '6px 16px' }}>❌ Out of Stock</span>
                            ) : effectiveStock <= 10 ? (
                                <span className="badge badge-warning" style={{ fontSize: 13, padding: '6px 16px' }}>⚡ Only {effectiveStock} left in stock!</span>
                            ) : (
                                <span className="badge badge-success" style={{ fontSize: 13, padding: '6px 16px' }}>✅ In Stock ({effectiveStock} available)</span>
                            )}
                        </div>

                        {/* Shop info */}
                        {shop && (
                            <Link to={`/shop/${shop._id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textDecoration: 'none' }}>
                                <span style={{ fontSize: 24 }}>🏪</span>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: 14 }}>{shop.name}</p>
                                    {shop.city && <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{shop.city}</p>}
                                </div>
                                <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 12 }}>View Shop →</span>
                            </Link>
                        )}

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className="btn-secondary"
                                style={{ flex: 1, justifyContent: 'center', fontSize: 16, padding: '16px', opacity: isOutOfStock ? 0.5 : 1 }}>
                                🛒 Add to Cart
                            </button>
                            <button
                                onClick={() => handleAddToCart(true)}
                                disabled={isOutOfStock}
                                className="btn-primary"
                                style={{ flex: 1, justifyContent: 'center', fontSize: 16, padding: '16px', opacity: isOutOfStock ? 0.5 : 1 }}>
                                ⚡ Buy Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* Structured Product Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40, marginBottom: 52 }}>
                    <div>
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, marginBottom: 32 }}>
                            {product.category === 'Medicine' && product.medicalInfo && (
                                <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 32 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--primary-light)' }}>
                                        💊 Medicine Details
                                    </h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                                        {[
                                            { label: 'Type', value: product.medicalInfo.type, icon: '🧪' },
                                            { label: 'Strength', value: product.medicalInfo.strength, icon: '⚡' },
                                            { label: 'Pack Size', value: product.medicalInfo.packSize, icon: '📦' },
                                            { label: 'Prescription', value: product.medicalInfo.prescriptionRequired === 'Yes' ? 'Required 📋' : 'Not Required', color: product.medicalInfo.prescriptionRequired === 'Yes' ? 'var(--danger)' : 'var(--success)' },
                                            { label: 'Expiry Date', value: product.medicalInfo.expiryDate, icon: '📅' },
                                            { label: 'Storage', value: product.medicalInfo.storage, icon: '🌡️' }
                                        ].filter(i => i.value).map(item => (
                                            <div key={item.label}>
                                                <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</p>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: item.color || 'var(--text)' }}>
                                                    {item.icon && <span style={{ marginRight: 6 }}>{item.icon}</span>}
                                                    {item.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                📝 <span style={{ borderBottom: '2px solid var(--primary)', paddingBottom: 4 }}>Description</span>
                            </h2>
                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: 16 }}>
                                {product.description || 'No description available for this product.'}
                            </p>

                            {product.features && product.features.length > 0 && (
                                <div style={{ marginTop: 40 }}>
                                    <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        ✨ <span style={{ borderBottom: '2px solid var(--success)', paddingBottom: 4 }}>Key Features</span>
                                    </h2>
                                    <ul style={{ paddingLeft: 20, color: 'var(--text-muted)', listStyleType: 'disc' }}>
                                        {product.features.map((feature, i) => (
                                            <li key={i} style={{ marginBottom: 12, lineHeight: 1.6, fontSize: 15 }}>
                                                <span style={{ color: 'var(--text)' }}>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(() => {
                                // Safely normalize specs to a plain {key: value} object at render time
                                let specs = product.specifications;
                                if (!specs) return null;
                                // If it's a string, convert it (handles old DB data)
                                if (typeof specs === 'string') {
                                    const result = {};
                                    specs.split(/[,\n]+/).forEach(part => {
                                        const idx = part.indexOf(':');
                                        if (idx > 0) {
                                            result[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
                                        }
                                    });
                                    specs = Object.keys(result).length > 0 ? result : null;
                                }
                                // Must be a non-array object with at least one key
                                if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return null;
                                const entries = Object.entries(specs).filter(([k]) => isNaN(Number(k)));
                                if (entries.length === 0) return null;
                                return (
                                    <div style={{ marginTop: 40 }}>
                                        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                            📊 <span style={{ borderBottom: '2px solid var(--warning)', paddingBottom: 4 }}>Specifications</span>
                                        </h2>
                                        <div style={{ background: 'var(--bg-card2)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                                            {entries.map(([key, val], i) => (
                                                <div key={key} style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'minmax(140px, 1fr) 2fr',
                                                    padding: '12px 20px',
                                                    borderBottom: i === entries.length - 1 ? 'none' : '1px solid var(--border)',
                                                    fontSize: 14
                                                }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--text-dim)' }}>{key}</span>
                                                    <span style={{ color: 'var(--text)' }}>{String(val)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                        </div>
                    </div>

                    <aside>
                        {/* Any additional sidebar info could go here */}
                    </aside>
                </div>

                {/* Reviews */}
                <section>
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Customer Reviews</h2>
                            <p className="section-subtitle">{reviews.length} reviews</p>
                        </div>
                        <button className="btn-secondary" onClick={() => {
                            if (!user) { openAuth('login'); showToast('You must sign in to continue.', 'warning'); return; }
                            if (user.role === 'seller') { showToast('Sellers cannot write reviews.', 'error'); return; }
                            setShowReviewForm(v => !v);
                        }}>✍️ Write Review</button>
                    </div>

                    {showReviewForm && (
                        <form onSubmit={submitReview} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                            <div className="form-group">
                                <label>Rating</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button key={s} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                                            style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: s <= reviewForm.rating ? '#F59E0B' : '#3A3A55' }}>★</button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Comment</label>
                                <textarea rows={3} required value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} placeholder="Share your experience..." />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="submit" className="btn-primary" disabled={submittingReview}>{submittingReview ? 'Submitting...' : 'Submit'}</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowReviewForm(false)}>Cancel</button>
                            </div>
                        </form>
                    )}

                    {reviews.length === 0 ? (
                        <div className="empty-state"><div className="icon">⭐</div><h3>No reviews yet</h3><p>Be the first to review this product!</p></div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                            {reviews.map(r => <ReviewCard key={r._id} review={r} />)}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
