import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import ShopMap from '../components/ShopMap';
import { useApp } from '../App';
import { getUserLocation, calculateDistance } from '../utils/geo';

import { API_URL } from '../config';

const API = API_URL;

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
    const [showMapOverride, setShowMapOverride] = useState(false);
    const { showToast } = useApp();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const q = searchParams.get('q') || '';
                const isSearch = q.trim() && q.trim() !== '.';
                const productsUrl = isSearch
                    ? `${API}/products?search=${encodeURIComponent(q.trim())}`
                    : `${API}/products`;

                const [pRes, sRes] = await Promise.all([
                    fetch(productsUrl),
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

    // Reset override when query changes
    useEffect(() => {
        setShowMapOverride(false);
    }, [searchQuery]);

    const isProductCategory = CATEGORIES.some(cat =>
        searchQuery.toLowerCase() === cat.name.toLowerCase() ||
        searchQuery.toLowerCase().includes(cat.name.toLowerCase().split(' ')[0])
    );

    const isShopIntent = searchQuery && !isProductCategory && (
        ['shop', 'store', 'market', 'near', 'place', 'mall', 'center'].some(k => searchQuery.toLowerCase().includes(k)) ||
        shops.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        shops.some(s => s.category?.toLowerCase() === searchQuery.toLowerCase())
    );

    const matchingShops = shops.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const hasMapMarkers = matchingShops.some(s => s.location?.lat && s.location?.lng);
    const shouldShowMap = searchQuery && (isShopIntent || showMapOverride) && hasMapMarkers;

    const sortedShops = [...(searchQuery ? matchingShops : shops)].sort((a, b) => {
        if (!userLocation || !a.location?.lat || !b.location?.lat) return 0;
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng);
        return distA - distB;
    });

    const sortedProducts = [...products].sort((a, b) => {
        if (!userLocation || !a.shop?.location?.lat || !b.shop?.location?.lat) return 0;
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.shop.location.lat, a.shop.location.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.shop.location.lat, b.shop.location.lng);
        return distA - distB;
    });

    if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>;

    return (
        <div className="page" style={{ paddingBottom: 60 }}>
            {/* Full Width Hero Banner */}
            {!searchQuery && (
                <div style={{
                    background: 'linear-gradient(135deg, #0F0921 0%, #1A0F3C 100%)',
                    marginBottom: 52,
                    borderBottom: '1px solid rgba(108,61,225,0.1)',
                    position: 'relative', overflow: 'hidden', minHeight: '340px',
                    width: '100%', display: 'flex', alignItems: 'center'
                }}>
                    <div style={{
                        position: 'absolute', right: '-5%', top: '-10%', bottom: '-10%', width: '50%',
                        background: 'radial-gradient(circle at 60% 50%, rgba(139,92,246,0.2) 0%, transparent 75%)',
                        filter: 'blur(60px)', zIndex: 0
                    }} />

                    <div className="container" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: 40, width: '100%', position: 'relative', zIndex: 1, padding: '40px 24px'
                    }}>
                        {/* Left Content */}
                        <div style={{ flex: '55 1 300px' }}>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Your Local Marketplace</p>
                            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.04em' }}>
                                Shop Local.<br />
                                <span style={{ color: 'var(--primary-light)' }}>Deliver Fast.</span>
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, maxWidth: 440, marginBottom: 32, lineHeight: 1.6 }}>
                                Browse hundreds of products from local shops. Order for delivery or pick up in store with ease.
                            </p>
                            <button onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary" style={{ fontSize: 16, padding: '16px 36px', borderRadius: 12, boxShadow: '0 8px 30px rgba(108,61,225,0.3)' }}>
                                🛍️ Start Shopping
                            </button>
                        </div>

                        {/* Right Content - Illustration (Anti-gravity + Seamless Blending) */}
                        <div style={{
                            flex: '45 1 280px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                            position: 'relative'
                        }}>
                            {/* Blending Background */}
                            <div style={{
                                position: 'absolute', width: '100%', height: '100%',
                                background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
                                zIndex: -1
                            }} />
                            <img
                                src="/hero-illustration.png"
                                alt=""
                                style={{
                                    width: '100%', maxWidth: 420, height: 'auto',
                                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))',
                                    animation: 'float 6s ease-in-out infinite',
                                    mixBlendMode: 'screen', // This removes the black background perfectly
                                    WebkitMaskImage: 'radial-gradient(circle, black 60%, transparent 95%)', // This shades the borders
                                    maskImage: 'radial-gradient(circle, black 60%, transparent 95%)',
                                    userSelect: 'none', pointerEvents: 'none'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="container" style={{ paddingTop: searchQuery ? 40 : 0 }}>
                {/* Search header */}
                {searchQuery && (
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
                            <div>
                                <h2 style={{ fontSize: 22, fontWeight: 700 }}>Search results for "{searchQuery}"</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                                    {products.length} products · {matchingShops.length} shops found
                                </p>
                            </div>
                            {searchQuery && !isShopIntent && !showMapOverride && matchingShops.length > 0 && (
                                <button
                                    onClick={() => setShowMapOverride(true)}
                                    className="btn-secondary"
                                    style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8 }}>
                                    📍 View {matchingShops.length} shops on map
                                </button>
                            )}
                        </div>

                        {/* Map for Search Results - Conditional */}
                        {shouldShowMap && (
                            <div style={{ marginTop: 24 }}>
                                <ShopMap
                                    shops={matchingShops.filter(s => s.location?.lat)}
                                    userLocation={userLocation}
                                    height="350px"
                                />
                                {showMapOverride && (
                                    <button
                                        onClick={() => setShowMapOverride(false)}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: 12, marginTop: 12, cursor: 'pointer', fontWeight: 600 }}>
                                        ✕ Hide map
                                    </button>
                                )}
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

                {/* Products Section */}
                {(!searchQuery || !isShopIntent) && (
                    <section id="products-section" style={{ marginBottom: 52 }}>
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
                                {sortedProducts.slice(0, searchQuery ? 20 : 8).map(p => <ProductCard key={p._id} product={p} userLocation={userLocation} />)}
                            </div>
                        )}
                    </section>
                )}

                {/* Shops Section */}
                {(!searchQuery || isShopIntent) && (
                    <section>
                        <div className="section-header">
                            <div>
                                <h2 className="section-title">Local Shops</h2>
                                <p className="section-subtitle">{searchQuery ? `Found ${matchingShops.length} shops` : 'Explore shops near you'}</p>
                            </div>
                        </div>
                        {sortedShops.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon">🏪</div>
                                <h3>No shops found</h3>
                                <p>{searchQuery ? `No shops match "${searchQuery}"` : 'Be the first to open a shop on Kartify!'}</p>
                            </div>
                        ) : (
                            <div className="grid-3">
                                {sortedShops.slice(0, searchQuery ? 12 : 6).map(s => <ShopCard key={s._id} shop={s} userLocation={userLocation} />)}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
