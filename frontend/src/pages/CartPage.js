import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { IMAGE_URL } from '../config';

export default function CartPage() {
    const { user, cart, removeFromCart, updateQty, clearCart, openAuth, showToast } = useApp();
    const navigate = useNavigate();

    const groups = Object.entries(cart.groups || {});
    const allItems = groups.flatMap(([, g]) => g.items);
    const grandTotal = allItems.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);

    if (groups.length === 0) {
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
        if (groups.length === 0) { showToast('Cart is empty', 'error'); return; }
        navigate('/checkout');
    };

    return (
        <div className="page" style={{ paddingBottom: 60 }}>
            <div className="container" style={{ paddingTop: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Your Cart</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                            {allItems.length} item{allItems.length !== 1 ? 's' : ''} from{' '}
                            <strong style={{ color: 'var(--primary-light)' }}>{groups.length} shop{groups.length !== 1 ? 's' : ''}</strong>
                        </p>
                    </div>
                    <button className="btn-danger" onClick={clearCart}>🗑️ Clear Cart</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
                    {/* Cart Items — grouped by shop */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                        {groups.map(([shopId, group]) => (
                            <div key={shopId}>
                                {/* Shop header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                    <span style={{ fontSize: 20 }}>🏪</span>
                                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--primary-light)' }}>
                                        {group.shopName || 'Shop'}
                                    </h2>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-card2)', borderRadius: 6, padding: '2px 8px' }}>
                                        {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {group.items.map(item => {
                                        let img = item.image || (item.images && item.images[0])
                                            || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=6C3DE1&color=fff&size=100`;
                                        if (img && img.startsWith('/uploads/')) img = `${IMAGE_URL}${img}`;
                                        return (
                                            <div key={item.cartItemId || item._id}
                                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                                                <img src={img} alt={item.name}
                                                    style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
                                                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=6C3DE1&color=fff&size=100`; }} />
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
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card2)', borderRadius: 8, padding: '4px 8px' }}>
                                                            <button
                                                                onClick={() => item.qty <= 1 ? removeFromCart(item.cartItemId, shopId) : updateQty(item.cartItemId, item.qty - 1, shopId)}
                                                                style={{ background: 'none', color: 'var(--text)', fontSize: 18, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>−</button>
                                                            <span style={{ fontSize: 15, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                                                            <button
                                                                onClick={() => updateQty(item.cartItemId, item.qty + 1, shopId)}
                                                                style={{ background: 'none', color: 'var(--text)', fontSize: 18, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>+</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-light)', marginBottom: 8 }}>
                                                        ₹{((item.price || 0) * item.qty).toLocaleString('en-IN')}
                                                    </p>
                                                    <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>₹{(item.price || 0).toLocaleString('en-IN')} each</p>
                                                    <button onClick={() => removeFromCart(item.cartItemId, shopId)}
                                                        style={{ background: 'none', color: 'var(--danger)', fontSize: 12, marginTop: 8, fontWeight: 600 }}>Remove</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, position: 'sticky', top: 90 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Order Summary</h2>

                        {/* Per-shop subtotals */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                            {groups.map(([shopId, group]) => {
                                const subtotal = group.items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
                                return (
                                    <div key={shopId}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-light)', marginBottom: 6 }}>
                                            🏪 {group.shopName || 'Shop'}
                                        </p>
                                        {group.items.map(item => (
                                            <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{item.name} {item.color ? `(${item.color})` : ''} × {item.qty}</span>
                                                <span style={{ fontWeight: 600 }}>₹{((item.price || 0) * item.qty).toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                                            <span style={{ fontWeight: 700 }}>₹{subtotal.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ borderTop: '2px solid var(--border)', paddingTop: 16, marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}>
                                <span>Grand Total</span>
                                <span style={{ color: 'var(--primary-light)' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                                {groups.length} separate order{groups.length !== 1 ? 's' : ''} will be placed
                            </p>
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
