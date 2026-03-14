import React from 'react';
import { Link } from 'react-router-dom';

const StarRating = ({ rating }) => (
    <div className="stars">
        {[1, 2, 3, 4, 5].map(s => (
            <span key={s} style={{ color: s <= Math.round(rating) ? '#F59E0B' : '#3A3A55' }}>★</span>
        ))}
        <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 4 }}>{Number(rating || 0).toFixed(1)}</span>
    </div>
);

export default function ShopCard({ shop }) {
    const bannerUrl = shop.banner
        ? shop.banner
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=5429c4&color=fff&size=400&length=2`;

    const logoUrl = shop.logo
        ? shop.logo
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=6C3DE1&color=fff&size=80`;

    return (
        <Link to={`/shop/${shop._id}`} className="card" style={{ display: 'block' }}>
            {/* Banner */}
            <div style={{ position: 'relative', paddingBottom: '50%', background: 'var(--bg-card2)', overflow: 'hidden' }}>
                <img
                    src={bannerUrl}
                    alt={shop.name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=5429c4&color=fff&size=400&length=2`; }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,15,19,0.85), transparent)' }} />
                {/* Logo */}
                <img
                    src={logoUrl}
                    alt="logo"
                    style={{ position: 'absolute', bottom: 16, left: 16, width: 52, height: 52, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }}
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=6C3DE1&color=fff&size=80`; }}
                />
            </div>
            <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{shop.name}</h3>
                        <span className="badge badge-primary" style={{ fontSize: 11, marginBottom: 8, display: 'inline-block' }}>{shop.category}</span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <StarRating rating={shop.rating} />
                        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{shop.totalReviews || 0} reviews</p>
                    </div>
                </div>
                {shop.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {shop.description}
                    </p>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {shop.location && shop.location.lat && shop.location.lng ? (
                        <a
                            href={`https://www.openstreetmap.org/directions?from=&to=${shop.location.lat},${shop.location.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: 12, color: 'var(--primary-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                        >
                            📍 Directions
                        </a>
                    ) : shop.city && (
                        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>📍 {shop.city}</span>
                    )}
                    {shop.deliveryAvailable && <span className="badge badge-success" style={{ fontSize: 11 }}>🚚 Delivery</span>}
                    {shop.pickupAvailable && <span className="badge badge-warning" style={{ fontSize: 11 }}>📦 Pickup</span>}
                </div>
            </div>
        </Link>
    );
}
