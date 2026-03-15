import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';

const API = 'http://localhost:5000/api';

export default function CheckoutPage() {
    const { user, cart, clearCart, showToast } = useApp();
    const navigate = useNavigate();
    const [deliveryType, setDeliveryType] = useState('delivery');
    const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: '', city: '', pincode: '' });
    const [loading, setLoading] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(null);

    const total = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) { openAuth('login'); showToast('You must sign in to continue.', 'warning'); return; }
        if (user.role === 'seller') { showToast('Sellers cannot purchase products using seller accounts.', 'error'); return; }
        if (cart.items.length === 0) { showToast('Cart is empty', 'error'); return; }

        // Resolve shopId: prefer cart.shopId, fall back to product.shop on first item
        let resolvedShopId = cart.shopId;
        if (!resolvedShopId && cart.items.length > 0) {
            const firstItem = cart.items[0];
            resolvedShopId = typeof firstItem.shop === 'object' ? firstItem.shop?._id : firstItem.shop;
        }

        setLoading(true);
        try {
            const orderData = {
                shop_id: resolvedShopId || undefined,  // let backend resolve if still null
                items: cart.items.map(i => ({
                    product_id: i._id,
                    variant_id: i.variant_id,
                    color: i.color,
                    name: i.name,
                    price: i.price,
                    quantity: i.qty,
                    image: i.image || i.images?.[0] || ''
                })),
                deliveryType,
                totalAmount: total,
                ...(deliveryType === 'delivery' ? {
                    delivery_name: form.name,
                    delivery_phone: form.phone,
                    delivery_address: form.address,
                    delivery_city: form.city,
                    delivery_pincode: form.pincode
                } : {})
            };
            const res = await fetch(`${API}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
                body: JSON.stringify(orderData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            clearCart();
            setOrderPlaced(data);
            showToast('Order placed successfully! 🎉');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: 40, maxWidth: 560 }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 48, textAlign: 'center' }}>
                        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
                        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Order Placed!</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Your order has been placed successfully.</p>

                        {orderPlaced.deliveryType === 'pickup' && (
                            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>Your Pickup Code</p>
                                <p style={{ fontSize: 36, fontWeight: 900, letterSpacing: '0.2em', color: 'var(--success)' }}>{orderPlaced.pickupCode}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>Show this code at the shop when picking up your order.</p>
                            </div>
                        )}

                        <div style={{ background: 'var(--bg-card2)', borderRadius: 12, padding: 20, marginBottom: 28, textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Status</span>
                                <span className="badge badge-warning">Pending</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹{orderPlaced.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Delivery</span>
                                <span style={{ fontSize: 14, fontWeight: 600 }}>{orderPlaced.deliveryType === 'delivery' ? '🚚 Home Delivery' : '📦 Shop Pickup'}</span>
                            </div>
                        </div>

                        <button onClick={() => navigate('/home')} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: 16 }}>
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page" style={{ paddingBottom: 60 }}>
            <div className="container" style={{ paddingTop: 36, maxWidth: 900 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Checkout</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 36 }}>{cart.items.length} items from {cart.shopName}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
                    <form onSubmit={handleSubmit}>
                        {/* Delivery Type */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, marginBottom: 24 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Delivery Method</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {[
                                    { value: 'delivery', label: 'Home Delivery', icon: '🚚', desc: 'Delivered to your door' },
                                    { value: 'pickup', label: 'Shop Pickup', icon: '📦', desc: 'Pick up in store' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setDeliveryType(opt.value)}
                                        style={{
                                            padding: 20,
                                            borderRadius: 14,
                                            border: `2px solid ${deliveryType === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                                            background: deliveryType === opt.value ? 'rgba(108,61,225,0.1)' : 'var(--bg-card2)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s ease'
                                        }}>
                                        <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.icon}</div>
                                        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{opt.label}</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Form */}
                        {deliveryType === 'delivery' && (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, marginBottom: 24 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Delivery Details</h2>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street address, building, apt..." />
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>City</label>
                                        <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" />
                                    </div>
                                    <div className="form-group">
                                        <label>Pincode</label>
                                        <input required value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} placeholder="Pincode" maxLength={6} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {deliveryType === 'pickup' && (
                            <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: 28, marginBottom: 24 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>📦 Shop Pickup</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                                    A unique pickup code will be generated after your order is placed. Show it at the shop counter.
                                </p>
                            </div>
                        )}

                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: 16 }}>
                            {loading ? 'Placing order...' : `🚀 Place Order · ₹${total.toLocaleString('en-IN')}`}
                        </button>
                    </form>

                    {/* Summary */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, position: 'sticky', top: 90 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Order Summary</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                            {cart.items.map(item => {
                                let img = item.image || item.images?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=6C3DE1&color=fff&size=44`;
                                if (img && img.startsWith('/uploads/')) img = `http://localhost:5000${img}`;
                                return (
                                    <div key={item.cartItemId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ background: 'var(--bg-card2)', borderRadius: 8, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <img src={img} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=6C3DE1&color=fff&size=44`; }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</p>
                                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{item.color}</p>
                                            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>× {item.qty}</p>
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 700 }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--primary-light)' }}>₹{total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
