import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import { calculateDistance } from '../utils/geo';

const StarRating = ({ rating }) => {
    return (
        <div className="stars">
            {[1, 2, 3, 4, 5].map(s => (
                <span key={s} style={{ color: s <= Math.round(rating) ? '#F59E0B' : '#3A3A55' }}>★</span>
            ))}
            <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 4 }}>{Number(rating || 0).toFixed(1)}</span>
        </div>
    );
};

export default function ProductCard({ product, userLocation }) {
    const { cart, addToCart, openAuth, user, showToast } = useApp();

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) { openAuth('login'); showToast('You must sign in to continue.', 'warning'); return; }
        if (user.role === 'seller') { showToast('Sellers cannot purchase products using seller accounts.', 'error'); return; }
        if (!product.shop_id) return;
        const shopId = typeof product.shop_id === 'object' ? product.shop_id._id : product.shop_id;
        const shopName = typeof product.shop_id === 'object' ? product.shop_id.name : '';
        if (cart.shopId && cart.shopId !== shopId) {
            showToast('Your cart contains items from another shop. Clear cart to add this item.', 'warning');
            return;
        }
        addToCart(product, shopId, shopName);
        showToast(`${product.name} added to cart! 🛒`);
    };

    let imgUrl = product.images && product.images[0]
        ? product.images[0]
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=6C3DE1&color=fff&size=200`;
    if (imgUrl && imgUrl.startsWith('/uploads/')) imgUrl = `http://localhost:5000${imgUrl}`;

    return (
        <Link to={`/product/${product._id}`} className="card" style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{ position: 'relative', paddingBottom: '65%', background: 'var(--bg-card2)', overflow: 'hidden' }}>
                <img
                    src={imgUrl}
                    alt={product.name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=6C3DE1&color=fff&size=200`; }}
                />
                {product.stock === 0 && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="badge badge-danger" style={{ fontSize: 13 }}>Out of Stock</span>
                    </div>
                )}
            </div>
            <div style={{ padding: '16px' }}>
                <div className="badge badge-primary" style={{ marginBottom: 8, fontSize: 11 }}>{product.category}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {product.name}
                </h3>
                {typeof product.shop_id === 'object' && product.shop_id?.name && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>🏪 {product.shop_id.name}</p>
                        {userLocation && product.shop_id.location?.lat && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary-light)' }}>
                                📍 {calculateDistance(userLocation.lat, userLocation.lng, product.shop_id.location.lat, product.shop_id.location.lng).toFixed(1)} km
                            </span>
                        )}
                    </div>
                )}
                <StarRating rating={product.rating} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary-light)' }}>₹{product.price.toLocaleString('en-IN')}</span>
                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        style={{
                            background: product.stock === 0 ? 'var(--border)' : 'linear-gradient(135deg,#6C3DE1,#8B5CF6)',
                            color: 'white', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
                        }}>
                        {product.stock === 0 ? 'Sold Out' : '+ Cart'}
                    </button>
                </div>
                {product.stock > 0 && product.stock <= 10 && (
                    <p style={{ fontSize: 11, color: 'var(--warning)', marginTop: 6 }}>⚡ Only {product.stock} left!</p>
                )}
            </div>
        </Link>
    );
}
