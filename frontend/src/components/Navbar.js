import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../App';

const CATEGORIES = [
    'Electronics', 'Fashion & Clothing', 'Home & Kitchen',
    'Beauty & Personal Care', 'Groceries & Food', 'Sports & Fitness',
    'Books & Stationery', 'Toys & Baby Products', 'Medicine'
];

export default function Navbar() {
    const { user, logout, cart, openAuth } = useApp();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [showCats, setShowCats] = useState(false);
    const [showUser, setShowUser] = useState(false);

    const cartCount = cart.items.reduce((sum, i) => sum + i.qty, 0);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const query = search.trim();
        if (!query || query === '.') return;
        navigate(`/home?q=${encodeURIComponent(query)}`);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        if (!value.trim()) {
            navigate('/home');
        }
    };

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
            background: 'rgba(15,15,19,0.95)', backdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border)', height: 70
        }}>
            <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', gap: 24 }}>
                {/* Logo */}
                <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #6C3DE1, #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 900, color: '#fff'
                    }}>K</div>
                    <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em' }}>KARTIFY</span>
                </Link>

                {/* Categories */}
                <div style={{ position: 'relative' }} onMouseLeave={() => setShowCats(false)}>
                    <button
                        onMouseEnter={() => setShowCats(true)}
                        style={{ background: 'none', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500, padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        Categories ▾
                    </button>
                    {showCats && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0,
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 12, padding: '8px 0', minWidth: 220, zIndex: 100,
                            boxShadow: '0 8px 40px rgba(0,0,0,0.4)'
                        }}>
                            {CATEGORIES.map(cat => (
                                <Link key={cat} to={`/category/${encodeURIComponent(cat)}`}
                                    onClick={() => setShowCats(false)}
                                    style={{ display: 'block', padding: '10px 20px', fontSize: 14, color: 'var(--text-muted)', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.target.style.background = 'rgba(108,61,225,0.1)'; e.target.style.color = 'var(--text)'; }}
                                    onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = 'var(--text-muted)'; }}>
                                    {cat}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 480 }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Search products, shops..."
                            style={{ paddingLeft: 44, borderRadius: 10, height: 42 }}
                        />
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: 16 }}>🔍</span>
                    </div>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                    {/* Role-based Links */}
                    {(!user || user.role === 'customer') && (
                        <Link to="/cart" style={{ position: 'relative', padding: '8px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500 }}>
                            🛒 Cart
                            {cartCount > 0 && (
                                <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    )}

                    {user?.role === 'customer' && (
                        <Link to="/customer/dashboard" style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>
                            🛍️ Orders
                        </Link>
                    )}

                    {user?.role === 'seller' && (
                        <>
                            <Link to="/seller/dashboard" style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>
                                📊 Dashboard
                            </Link>
                            {/* Products and Shop settings are manageable from dashboard, but can add direct links if needed. 
                                Based on instructions: Seller Dashboard | Products | Orders | Shop Settings */}
                        </>
                    )}

                    {!user && (
                        <Link to="/seller/signup" style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(108,61,225,0.15)', border: '1px solid var(--primary)', color: 'var(--primary-light)', fontSize: 14, fontWeight: 600 }}>
                            Become a Seller
                        </Link>
                    )}

                    {/* Account */}
                    {user ? (
                        <div style={{ position: 'relative' }} onMouseLeave={() => setShowUser(false)}>
                            <button
                                onMouseEnter={() => setShowUser(true)}
                                style={{ background: 'linear-gradient(135deg,#6C3DE1,#8B5CF6)', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                👤 {user.name.split(' ')[0]}
                            </button>
                            {showUser && (
                                <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 0', minWidth: 180, zIndex: 100, boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
                                    {user.role === 'seller' ? (
                                        <Link to="/seller/dashboard" style={{ display: 'block', padding: '10px 20px', fontSize: 14, color: 'var(--text-muted)' }}>📊 Dashboard</Link>
                                    ) : (
                                        <Link to="/customer/profile" style={{ display: 'block', padding: '10px 20px', fontSize: 14, color: 'var(--text-muted)' }}>👤 Profile</Link>
                                    )}
                                    <button onClick={logout} style={{ width: '100%', textAlign: 'left', padding: '10px 20px', fontSize: 14, color: 'var(--danger)', background: 'none' }}>
                                        🚪 Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={() => openAuth('login')} className="btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>
                            Account
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
