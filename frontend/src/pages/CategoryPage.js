import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ShopCard from '../components/ShopCard';
import ProductCard from '../components/ProductCard';
import ShopMap from '../components/ShopMap';
import { useApp } from '../App';
import { getUserLocation, calculateDistance } from '../utils/geo';

import { API_URL } from '../config';

const API = API_URL;

const CAT_ICONS = {
    'Electronics': '📱', 'Fashion & Clothing': '👗', 'Home & Kitchen': '🏠',
    'Beauty & Personal Care': '💄', 'Groceries & Food': '🛒', 'Sports & Fitness': '⚽',
    'Books & Stationery': '📚', 'Toys & Baby Products': '🧸', 'Medicine': '💊'
};

export default function CategoryPage() {
    const { cat } = useParams();
    const category = decodeURIComponent(cat);
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('shops');
    const [userLocation, setUserLocation] = useState(null);
    const { showToast } = useApp();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [sRes, pRes] = await Promise.all([
                    fetch(`${API}/shops?category=${encodeURIComponent(category)}`),
                    fetch(`${API}/products/category/${encodeURIComponent(category)}`)
                ]);
                const [sData, pData] = await Promise.all([sRes.json(), pRes.json()]);
                setShops(Array.isArray(sData) ? sData : []);
                setProducts(Array.isArray(pData) ? pData : []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();

        // Get user location for map and sorting
        getUserLocation()
            .then(pos => setUserLocation(pos))
            .catch(() => console.log('Location access denied for sorting'));
    }, [category]);

    const sortedShops = [...shops].sort((a, b) => {
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
            <div className="container" style={{ paddingTop: 36 }}>
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, fontSize: 14, color: 'var(--text-muted)' }}>
                    <Link to="/home" style={{ color: 'var(--text-muted)' }}>Home</Link>
                    <span>›</span>
                    <span style={{ color: 'var(--text)' }}>{category}</span>
                </div>

                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 20, padding: '28px 32px'
                }}>
                    <div style={{ fontSize: 52 }}>{CAT_ICONS[category] || '🛍️'}</div>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{category}</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                            {shops.length} shops · {products.length} products
                        </p>
                    </div>
                </div>

                {/* Toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
                    <button
                        onClick={() => setView('shops')}
                        style={{ padding: '10px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14, border: 'none', background: view === 'shops' ? 'linear-gradient(135deg,#6C3DE1,#8B5CF6)' : 'var(--bg-card)', color: view === 'shops' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}>
                        🏪 Shops ({shops.length})
                    </button>
                    <button
                        onClick={() => setView('products')}
                        style={{ padding: '10px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14, border: 'none', background: view === 'products' ? 'linear-gradient(135deg,#6C3DE1,#8B5CF6)' : 'var(--bg-card)', color: view === 'products' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}>
                        📦 Products ({products.length})
                    </button>
                </div>

                {/* Map View for Category */}
                {view === 'shops' && shops.length > 0 && (
                    <div style={{ marginBottom: 40 }}>
                        <ShopMap shops={shops.filter(s => s.category === category)} userLocation={userLocation} height="350px" />
                    </div>
                )}

                {view === 'shops' ? (
                    shops.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">🏪</div>
                            <h3>No shops in this category</h3>
                            <p>Be the first to open a {category} shop!</p>
                        </div>
                    ) : (
                        <div className="grid-3">
                            {sortedShops.map(s => <ShopCard key={s._id} shop={s} userLocation={userLocation} />)}
                        </div>
                    )
                ) : (
                    products.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📦</div>
                            <h3>No products in this category</h3>
                            <p>Check back later!</p>
                        </div>
                    ) : (
                        <div className="grid-4">
                            {sortedProducts.map(p => <ProductCard key={p._id} product={p} userLocation={userLocation} />)}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
