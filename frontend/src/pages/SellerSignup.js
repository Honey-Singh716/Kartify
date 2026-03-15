import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';

const API = 'http://localhost:5000/api';

const CATEGORIES = [
    'Electronics', 'Fashion & Clothing', 'Home & Kitchen',
    'Beauty & Personal Care', 'Groceries & Food', 'Sports & Fitness',
    'Books & Stationery', 'Toys & Baby Products', 'Medicine'
];

import MapPicker from '../components/MapPicker';

export default function SellerSignup() {
    const { user, login, showToast } = useApp();
    const navigate = useNavigate();
    const [step, setStep] = useState(user && user.role === 'seller' ? 2 : 1);
    const [loading, setLoading] = useState(false);
    const [authMode, setAuthMode] = useState('register');
    const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [shopForm, setShopForm] = useState({
        name: '', category: '', description: '', address: '', city: '', pincode: '',
        phone: '', logo: '', banner: '', openingHours: '9:00 AM - 9:00 PM',
        deliveryAvailable: true, pickupAvailable: true,
        location: { lat: 20.5937, lng: 78.9629 }
    });

    useEffect(() => {
        const checkExistingShop = async () => {
            if (user && user.role === 'seller') {
                try {
                    const res = await fetch(`${API}/shops/my-shop`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data._id) {
                            navigate('/seller/dashboard');
                        }
                    }
                } catch (err) { console.error('Shop check error:', err); }
            }
        };
        checkExistingShop();
    }, [user, navigate]);

    // If already have a seller account and shop, redirect
    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login';
            const body = authMode === 'register'
                ? { ...authForm, role: 'seller' }
                : { email: authForm.email, password: authForm.password };
            const res = await fetch(API + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            login(data);
            showToast(`Welcome, ${data.name}! 🎉`);
            setStep(2);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleShopSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/shops`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
                body: JSON.stringify(shopForm)
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.shop) { navigate('/seller/dashboard'); return; }
                throw new Error(data.message);
            }
            showToast('Shop created! Welcome to Kartify Seller Platform 🏪');
            navigate('/seller/dashboard');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: 680 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#6C3DE1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff' }}>K</div>
                        <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em' }}>KARTIFY</span>
                    </Link>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Seller Platform</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Start selling to customers near you</p>
                </div>

                {/* Steps */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36, justifyContent: 'center' }}>
                    {['Create Account', 'Create Shop'].map((label, i) => (
                        <React.Fragment key={label}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--primary)' : 'var(--bg-card2)',
                                    border: `2px solid ${step >= i + 1 ? 'transparent' : 'var(--border)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 700, color: step >= i + 1 ? 'white' : 'var(--text-dim)'
                                }}>
                                    {step > i + 1 ? '✓' : i + 1}
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 600, color: step === i + 1 ? 'var(--text)' : 'var(--text-dim)' }}>{label}</span>
                            </div>
                            {i < 1 && <div style={{ flex: 1, height: 2, background: step > 1 ? 'var(--primary)' : 'var(--border)', maxWidth: 60 }} />}
                        </React.Fragment>
                    ))}
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 40 }}>
                    {step === 1 ? (
                        <>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                                {['register', 'login'].map(m => (
                                    <button key={m} onClick={() => setAuthMode(m)}
                                        style={{ flex: 1, padding: '10px', borderRadius: 10, fontWeight: 600, fontSize: 14, border: 'none', background: authMode === m ? 'linear-gradient(135deg,#6C3DE1,#8B5CF6)' : 'var(--bg-card2)', color: authMode === m ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}>
                                        {m === 'register' ? 'New Seller' : 'Existing Seller'}
                                    </button>
                                ))}
                            </div>
                            <form onSubmit={handleAuthSubmit}>
                                {authMode === 'register' && (
                                    <>
                                        <div className="form-group">
                                            <label>Full Name</label>
                                            <input required value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Your name" />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <input required value={authForm.phone} onChange={e => setAuthForm({ ...authForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                                        </div>
                                    </>
                                )}
                                <div className="form-group">
                                    <label>Email</label>
                                    <input required type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="seller@example.com" />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input required type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="••••••••" />
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: 15, marginTop: 8 }}>
                                    {loading ? 'Please wait...' : authMode === 'register' ? '→ Create Seller Account' : '→ Sign In'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <form onSubmit={handleShopSubmit}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Create Your Shop</h2>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Shop Name</label>
                                    <input required value={shopForm.name} onChange={e => setShopForm({ ...shopForm, name: e.target.value })} placeholder="Your shop name" />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select required value={shopForm.category} onChange={e => setShopForm({ ...shopForm, category: e.target.value })}>
                                        <option value="">Select category</option>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows={2} value={shopForm.description} onChange={e => setShopForm({ ...shopForm, description: e.target.value })} placeholder="Tell customers about your shop..." />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <input value={shopForm.address} onChange={e => setShopForm({ ...shopForm, address: e.target.value })} placeholder="Street address" />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>City</label>
                                    <input required value={shopForm.city} onChange={e => setShopForm({ ...shopForm, city: e.target.value })} placeholder="City" />
                                </div>
                                <div className="form-group">
                                    <label>Pincode</label>
                                    <input value={shopForm.pincode} onChange={e => setShopForm({ ...shopForm, pincode: e.target.value })} placeholder="Pincode" maxLength={6} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input value={shopForm.phone} onChange={e => setShopForm({ ...shopForm, phone: e.target.value })} placeholder="Shop phone" />
                                </div>
                                <div className="form-group">
                                    <label>Opening Hours</label>
                                    <input value={shopForm.openingHours} onChange={e => setShopForm({ ...shopForm, openingHours: e.target.value })} placeholder="9:00 AM - 9:00 PM" />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Logo URL (optional)</label>
                                    <input value={shopForm.logo} onChange={e => setShopForm({ ...shopForm, logo: e.target.value })} placeholder="https://..." />
                                </div>
                                <div className="form-group">
                                    <label>Banner URL (optional)</label>
                                    <input value={shopForm.banner} onChange={e => setShopForm({ ...shopForm, banner: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Shop Location (Click on map to select)</label>
                                <MapPicker
                                    location={shopForm.location}
                                    onChange={(loc) => setShopForm({ ...shopForm, location: loc })}
                                />
                                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                                    <span>Lat: {shopForm.location.lat.toFixed(4)}</span>
                                    <span>Lng: {shopForm.location.lng.toFixed(4)}</span>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: 15 }}>
                                {loading ? 'Creating shop...' : '🏪 Create Shop & Go to Dashboard'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
