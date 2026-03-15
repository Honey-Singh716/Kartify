import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../App';

export default function CartPage() {
    const { user, cart, removeFromCart, updateQty, clearCart, openAuth, showToast } = useApp();
    const navigate = useNavigate();

    const total = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);

    if (cart.items.length === 0) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: 40 }}>
                    <div className="empty-state">
                        <div className="icon">🛒</div>
                        <h3>Your cart is empty</h3>
                        <p>Looks like you haven't added anything yet.</p>
                        <Link to="/home" className="btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>Start Shopping</Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleCheckout = () => {
        if (!user) { openAuth('login'); showToast('You must sign in to continue.', 'warning'); return; }
        if (user.role === 'seller') { showToast('Sellers cannot purchase products using seller accounts.', 'error'); return; }

        // Auto-recovery attempt: if shopId is missing but items exist, try to recover it from first item
        if (!cart.shopId && cart.items.length > 0) {
            const firstItem = cart.items[0];
            const recoveredShopId = typeof firstItem.shop === 'object' ? firstItem.shop._id : firstItem.shop;
            if (recoveredShopId) {
                console.log("[Cart Recovery] Recovered missing shopId:", recoveredShopId);
                // We don't update state here to avoid side effects during navigation,
                // but we check if we CAN recover it. If so, we proceed.
                cart.shopId = recoveredShopId;
            }
        }

        if (!cart.items.length) { showToast('Cart is empty', 'error'); return; }
        if (!cart.shopId) {
            showToast('Invalid cart data. Please clear cart and try again.', 'error');
            console.error("[Cart Error] Items present but shopId missing.");
            return;
        }
        navigate('/checkout');
    };

    return (
        <div className="page" style={{ paddingBottom: 60 }}>
            <div className="container" style={{ paddingTop: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Your Cart</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                            {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} from <strong style={{ color: 'var(--primary-light)' }}>{cart.shopName}</strong>
                        </p>
                    </div>
                    <button className="btn-danger" onClick={clearCart}>🗑️ Clear Cart</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
                    {/* Cart Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {cart.items.map(item => {
                            let img = item.image || (item.images && item.images[0])
                                || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=6C3DE1&color=fff&size=100`;
                            if (img && img.startsWith('/uploads/')) img = `http://localhost:5000${img}`;
                            return (
                                <div key={item.cartItemId || item._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                                    <img src={img} alt={item.name} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=6C3DE1&color=fff&size=100`; }} />
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{item.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.category}</span>
                                            {item.color && (
                                                <>
                                                    <span style={{ color: 'var(--text-dim)' }}>•</span>
                                                    <span className="badge badge-primary" style={{ fontSize: 11, padding: '2px 8px' }}>🎨 {item.color}</span>
                                                </>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            {/* Quantity */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card2)', borderRadius: 8, padding: '4px 8px' }}>
                                                <button onClick={() => item.qty <= 1 ? removeFromCart(item.cartItemId) : updateQty(item.cartItemId, item.qty - 1)}
                                                    style={{ background: 'none', color: 'var(--text)', fontSize: 18, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>−</button>
                                                <span style={{ fontSize: 15, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                                                <button onClick={() => updateQty(item.cartItemId, item.qty + 1)}
                                                    style={{ background: 'none', color: 'var(--text)', fontSize: 18, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-light)', marginBottom: 8 }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>₹{item.price.toLocaleString('en-IN')} each</p>
                                        <button onClick={() => removeFromCart(item.cartItemId)} style={{ background: 'none', color: 'var(--danger)', fontSize: 12, marginTop: 8, fontWeight: 600 }}>Remove</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order Summary */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, position: 'sticky', top: 90 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Order Summary</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                            {cart.items.map(item => (
                                <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{item.name} {item.color ? `(${item.color})` : ''} × {item.qty}</span>
                                    <span style={{ fontWeight: 600 }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--primary-light)' }}>₹{total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <button onClick={handleCheckout} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '15px' }}>
                            🚀 Proceed to Checkout
                        </button>

                        <Link to="/home" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-muted)' }}>
                            ← Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
