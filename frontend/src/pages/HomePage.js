import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import ShopMap from '../components/ShopMap';
import { useApp } from '../App';
import { getUserLocation, calculateDistance } from '../utils/geo';

const API = 'http://localhost:5000/api';

const CATEGORIES = [
    { name: 'Electronics', icon: '📱' },
    { name: 'Fashion & Clothing', icon: '👗' },
    { name: 'Home & Kitchen', icon: '🏠' },
    { name: 'Beauty & Personal Care', icon: '💄' },
    { name: 'Groceries & Food', icon: '🛒' },
    { name: 'Sports & Fitness', icon: '⚽' },
    { name: 'Books & Stationery', icon: '📚' },
    { name: 'Toys & Baby Products', icon: '🧸' },
    { name: 'Medicine', icon: '💊' }
];

export default function HomePage() {
    const [products, setProducts] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const rawQuery = searchParams.get('q') || '';
    const searchQuery = (rawQuery.trim() === '' || rawQuery.trim() === '.') ? '' : rawQuery.trim();
    const [userLocation, setUserLocation] = useState(null);
    const { showToast } = useApp();

    useEffect(() => {
        const fetchData = async () => {
            // Strict validation: Clear results and stop if query is empty or invalid
            const q = searchParams.get('q') || '';
            if (!q.trim() || q.trim() === '.') {
                setLoading(true);
                try {
                    const sRes = await fetch(`${API}/shops`);
                    const sData = await sRes.json();
                    setShops(Array.isArray(sData) ? sData : []);
                    setProducts([]); // Clear any previous products if query is invalid
                } catch (err) { console.error(err); }
                finally { setLoading(false); }
                return;
            }

            setLoading(true);
            try {
                const [pRes, sRes] = await Promise.all([
                    fetch(`${API}/products?search=${encodeURIComponent(q.trim())}`),
                    fetch(`${API}/shops`)
                ]);
                const [pData, sData] = await Promise.all([pRes.json(), sRes.json()]);
                setProducts(Array.isArray(pData) ? pData : []);
                setShops(Array.isArray(sData) ? sData : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Get user location
        getUserLocation()
            .then(pos => setUserLocation(pos))
            .catch(() => console.log('Location access denied'));
    }, [searchQuery]);

    const sortedShops = [...shops].sort((a, b) => {
        if (!userLocation || !a.location?.lat || !b.location?.lat) return 0;
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng);
        return distA - distB;
    });

    const sortedProducts = [...products].sort((a, b) => {
        if (!userLocation || !a.shop_id?.location?.lat || !b.shop_id?.location?.lat) return 0;
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.shop_id.location.lat, a.shop_id.location.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.shop_id.location.lat, b.shop_id.location.lng);
        return distA - distB;
    });

    if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>;

    return (
        <div className="page" style={{ paddingBottom: 60 }}>
            <div className="container" style={{ paddingTop: 40 }}>

                {/* Hero Banner (shown when no search) */}
                {!searchQuery && (
                    <div style={{
                        background: 'linear-gradient(135deg, #1A0F3C 0%, #2D1B69 100%)',
                        borderRadius: 24, padding: '48px 56px', marginBottom: 52,
                        border: '1px solid rgba(108,61,225,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', background: 'radial-gradient(circle at 70% 50%, rgba(139,92,246,0.2) 0%, transparent 70%)' }} />
                        <div>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Your Local Marketplace</p>
                            <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.03em' }}>
                                Shop Local.<br />
                                <span style={{ color: 'var(--primary-light)' }}>Deliver Fast.</span>
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 400, marginBottom: 28 }}>
                                Browse hundreds of products from local shops. Order for delivery or pick up in store.
                            </p>
                            <button onClick={() => navigate('/category/Electronics')} className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
                                🛍️ Start Shopping
                            </button>
                        </div>
                    </div>
                )}

                {/* Search header */}
                {searchQuery && (
                    <div style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Search results for "{searchQuery}"</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{products.length} products found</p>

                        {/* Map for Search Results */}
                        {products.length > 0 && (
                            <div style={{ marginTop: 24 }}>
                                <ShopMap
                                    shops={Array.from(new Set(products.filter(p => p.shop_id).map(p => p.shop_id._id)))
                                        .map(id => products.find(p => p.shop_id._id === id).shop_id)}
                                    userLocation={userLocation}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Categories */}
                {!searchQuery && (
                    <section style={{ marginBottom: 52 }}>
                        <div className="section-header">
                            <div>
                                <h2 className="section-title">Browse Categories</h2>
                                <p className="section-subtitle">Find exactly what you need</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.name}
                                    onClick={() => navigate(`/category/${encodeURIComponent(cat.name)}`)}
                                    style={{
                                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                                        borderRadius: 14, padding: '20px 12px',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                        cursor: 'pointer', transition: 'all 0.2s ease', color: 'var(--text)'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(108,61,225,0.25)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                                    <span style={{ fontSize: 28 }}>{cat.icon}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: 'var(--text-muted)' }}>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Products */}
                <section style={{ marginBottom: 52 }}>
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">{searchQuery ? 'Products' : 'Featured Products'}</h2>
                            <p className="section-subtitle">{searchQuery ? `${products.length} results` : 'Discover items from local shops'}</p>
                        </div>
                    </div>
                    {products.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📦</div>
                            <h3>No products found</h3>
                            <p>{searchQuery ? `No results for "${searchQuery}"` : 'No products available yet'}</p>
                        </div>
                    ) : (
                        <div className="grid-4">
                            {sortedProducts.slice(0, 12).map(p => <ProductCard key={p._id} product={p} userLocation={userLocation} />)}
                        </div>
                    )}
                </section>

                {/* Shops */}
                {!searchQuery && (
                    <section>
                        <div className="section-header">
                            <div>
                                <h2 className="section-title">Local Shops</h2>
                                <p className="section-subtitle">Explore shops near you</p>
                            </div>
                        </div>
                        {shops.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon">🏪</div>
                                <h3>No shops yet</h3>
                                <p>Be the first to open a shop on Kartify!</p>
                            </div>
                        ) : (
                            <div className="grid-3">
                                {sortedShops.slice(0, 6).map(s => <ShopCard key={s._id} shop={s} userLocation={userLocation} />)}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
