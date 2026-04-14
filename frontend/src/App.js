import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import SellerSignup from './pages/SellerSignup';
import SellerDashboard from './pages/SellerDashboard';
import PickupVerification from './pages/PickupVerification';
import CustomerDashboard from './pages/CustomerDashboard';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/Navbar';
import 'leaflet/dist/leaflet.css';
import { API_URL } from './config';

// Protected Route Components
const SellerRoute = ({ children }) => {
    const { user } = useApp();
    if (!user) return <Navigate to="/login" />;
    if (user.role !== 'seller') return <Navigate to="/" />;
    return children;
};

const CustomerRoute = ({ children }) => {
    const { user } = useApp();
    if (!user) return <Navigate to="/login" />;
    if (user.role !== 'customer') return <Navigate to="/" />;
    return children;
};

const API = API_URL;

// =================== CONTEXT ===================
export const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

const AppProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('kartify_user')); } catch { return null; }
    });
    const [cart, setCart] = useState(() => {
        try { return JSON.parse(localStorage.getItem('kartify_cart')) || { shopId: null, shopName: '', items: [] }; } catch { return { shopId: null, shopName: '', items: [] }; }
    });
    const [toast, setToast] = useState(null);
    const [showAuth, setShowAuth] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [userProfileLocation, setUserProfileLocation] = useState(null); // { lat, lng } from saved profile

    // Global Error Handling
    useEffect(() => {
        const handleUnhandledRejection = (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            setToast({
                message: 'Something went wrong. Please check your connection or try again.',
                type: 'error'
            });
            setTimeout(() => setToast(null), 3000);
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }, []);

    // Fetch customer's saved home location from profile
    useEffect(() => {
        if (!user || user.role !== 'customer') { setUserProfileLocation(null); return; }
        fetch(`${API}/users/profile`, { headers: { Authorization: `Bearer ${user.token}` } })
            .then(r => r.json())
            .then(data => { if (data?.location?.lat) setUserProfileLocation(data.location); })
            .catch(() => { });
    }, [user]);

    useEffect(() => {
        localStorage.setItem('kartify_cart', JSON.stringify(cart));
    }, [cart]);

    // Fetch persistent cart on login
    useEffect(() => {
        const fetchCart = async () => {
            if (user && user.role === 'customer') {
                try {
                    const res = await fetch(`${API}/cart`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.items) {
                            setCart({
                                shopId: data.shop?._id || data.shop || null,
                                shopName: data.shop?.name || '',
                                items: data.items.map(i => ({
                                    ...(i.product || {}),
                                    cartItemId: (i.product && i.variant_id) ? `${i.product._id}-${i.variant_id}` : (i.product?._id || ''),
                                    variant_id: i.variant_id,
                                    color: i.color,
                                    qty: i.quantity,
                                    image: i.image || i.product?.images?.[0] || ''
                                })).filter(i => i._id) // Remove any null products
                            });
                        }
                    }
                } catch (err) { console.error('Cart sync error:', err); }
            }
        };
        fetchCart();
    }, [user]);

    const syncCartWithServer = async (updatedCart) => {
        if (!user || user.role !== 'customer') return;
        try {
            await fetch(`${API}/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
                body: JSON.stringify({
                    shop: updatedCart.shopId,
                    items: updatedCart.items.map(i => ({
                        product: i._id,
                        variant_id: i.variant_id,
                        color: i.color,
                        quantity: i.qty,
                        price: i.price,
                        image: i.image
                    }))
                })
            });
        } catch (err) { console.error('Failed to sync cart:', err); }
    };

    const login = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem('kartify_user', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setUserProfileLocation(null);
        setCart({ shopId: null, shopName: '', items: [] });
        localStorage.removeItem('kartify_user');
        localStorage.removeItem('kartify_cart');
    }, []);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const addToCart = useCallback((product, shopId, shopName, variant = null) => {
        if (!shopId) {
            // Defensive recovery
            shopId = typeof product.shop === 'object' ? product.shop._id : product.shop;
            shopName = product.shop?.name || '';
        }
        if (!shopId) return; // Critical failure if still missing

        setCart(prev => {
            if (prev.shopId && prev.shopId !== shopId) {
                return prev; // signal error outside
            }
            const itemId = variant ? `${product._id}-${variant._id}` : product._id;
            const existing = prev.items.find(i => i.cartItemId === itemId);
            let nextItems;
            if (existing) {
                nextItems = prev.items.map(i => i.cartItemId === itemId ? { ...i, qty: i.qty + 1 } : i);
            } else {
                const newItem = {
                    ...product,
                    cartItemId: itemId,
                    variant_id: variant?._id,
                    color: variant?.color,
                    qty: 1
                };
                if (variant && variant.image) newItem.image = variant.image;
                nextItems = [...prev.items, newItem];
            }
            const nextCart = { shopId, shopName, items: nextItems };
            syncCartWithServer(nextCart);
            return nextCart;
        });
    }, [user]);

    const removeFromCart = useCallback((cartItemId) => {
        setCart(prev => {
            const items = prev.items.filter(i => i.cartItemId !== cartItemId);
            const nextCart = items.length === 0 ? { shopId: null, shopName: '', items: [] } : { ...prev, items };
            syncCartWithServer(nextCart);
            return nextCart;
        });
    }, [user]);

    const updateQty = useCallback((cartItemId, qty) => {
        setCart(prev => {
            const nextCart = {
                ...prev,
                items: prev.items.map(i => i.cartItemId === cartItemId ? { ...i, qty } : i)
            };
            syncCartWithServer(nextCart);
            return nextCart;
        });
    }, [user]);

    const clearCart = useCallback(() => {
        const nextCart = { shopId: null, shopName: '', items: [] };
        setCart(nextCart);
        if (user && user.role === 'customer') {
            fetch(`${API}/cart`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            }).catch(e => console.error('Failed to clear server cart:', e));
        }
    }, [user]);

    const openAuth = useCallback((mode = 'login') => {
        setAuthMode(mode);
        setShowAuth(true);
    }, []);

    return (
        <AppContext.Provider value={{
            user, login, logout,
            cart, addToCart, removeFromCart, updateQty, clearCart,
            toast, showToast,
            showAuth, setShowAuth, authMode, setAuthMode, openAuth
        }}>
            {children}
        </AppContext.Provider>
    );
};

// =================== AUTH MODAL ===================

const AuthModal = () => {
    const { showAuth, setShowAuth, authMode, setAuthMode, login, showToast, openAuth } = useApp();
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [role, setRole] = useState('customer');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    if (!showAuth) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading || cooldown > 0) return; // Prevent duplicate or cooldown clicks
        setLoading(true);
        try {
            const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
            const body = authMode === 'login'
                ? { email: form.email, password: form.password }
                : { name: form.name, email: form.email, password: form.password, phone: form.phone, role };
            const res = await fetch(API + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.status === 429) {
                const data = await res.json();
                // If backend provides retryAfter in minutes, convert to seconds
                const seconds = (data.retryAfter || 1) * 60;
                setCooldown(seconds);
                showToast(data.message || 'Too many attempts. Please wait.', 'error');
                return;
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            login(data);
            setShowAuth(false);
            showToast(`Welcome, ${data.name}! 🎉`);
            if (data.role === 'seller') {
                window.location.href = '/seller/dashboard';
            } else if (data.role === 'customer') {
                window.location.href = '/customer/dashboard';
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
            <div className="modal auth-modal" onClick={e => e.stopPropagation()}>
                <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                <p>{authMode === 'login' ? 'Sign in to continue shopping' : 'Join Kartify today'}</p>
                <form onSubmit={handleSubmit}>
                    {authMode === 'register' && (
                        <>
                            <div className="form-group">
                                <label>Sign up as</label>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                    <button
                                        type="button"
                                        onClick={() => setRole('customer')}
                                        style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', background: role === 'customer' ? 'var(--primary)' : 'var(--bg-card2)', color: role === 'customer' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}>
                                        👤 Customer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('seller')}
                                        style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', background: role === 'seller' ? 'var(--primary)' : 'var(--bg-card2)', color: role === 'seller' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}>
                                        🏪 Seller
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Name</label>
                                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
                            </div>
                        </>
                    ) || (
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Please sign in to continue.</p>
                        )}
                    <div className="form-group">
                        <label>Email</label>
                        <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
                    </div>
                    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading || cooldown > 0}>
                        {loading ? 'Please wait...' : cooldown > 0 ? `Wait ${cooldown}s` : authMode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>
                <div className="switch-link">
                    {authMode === 'login' ? (
                        <>Don't have an account? <span onClick={() => setAuthMode('register')}>Register</span></>
                    ) : (
                        <>Already have an account? <span onClick={() => setAuthMode('login')}>Sign In</span></>
                    )}
                </div>
            </div>
        </div>
    );
};

// =================== TOAST ===================
const Toast = () => {
    const { toast } = useApp();
    if (!toast) return null;
    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    return (
        <div className={`toast ${toast.type}`}>
            <span>{icons[toast.type] || '✅'}</span>
            <span>{toast.message}</span>
        </div>
    );
};

// =================== APP ===================
export default function App() {
    return (
        <AppProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/*" element={
                        <>
                            <Navbar />
                            <Routes>
                                <Route path="/home" element={<HomePage />} />
                                <Route path="/category/:cat" element={<CategoryPage />} />
                                <Route path="/shop/:id" element={<ShopPage />} />
                                <Route path="/product/:id" element={<ProductPage />} />
                                <Route path="/cart" element={<CartPage />} />
                                <Route path="/checkout" element={<CheckoutPage />} />
                                <Route path="/seller/signup" element={<SellerSignup />} />
                                <Route path="/seller/dashboard" element={
                                    <SellerRoute>
                                        <SellerDashboard />
                                    </SellerRoute>
                                } />
                                <Route path="/seller/pickup-verification" element={
                                    <SellerRoute>
                                        <PickupVerification />
                                    </SellerRoute>
                                } />
                                <Route path="/customer/dashboard" element={
                                    <CustomerRoute>
                                        <CustomerDashboard />
                                    </CustomerRoute>
                                } />
                                <Route path="/customer/profile" element={
                                    <CustomerRoute>
                                        <ProfilePage />
                                    </CustomerRoute>
                                } />
                            </Routes>
                        </>
                    } />
                </Routes>
                <AuthModal />
                <Toast />
            </Router>
        </AppProvider>
    );
}
