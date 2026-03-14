import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';

const API = 'http://localhost:5000/api';

export default function PickupVerification() {
    const { user, showToast } = useApp();
    const navigate = useNavigate();
    const [pickupCode, setPickupCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [orderPreview, setOrderPreview] = useState(null);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!user || user.role !== 'seller') return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/orders/verify-pickup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ pickupCode })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setOrderPreview(data.order);
            showToast('Order found! Please verify details.', 'primary');
        } catch (err) {
            showToast(err.message, 'error');
            setOrderPreview(null);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/orders/verify-pickup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ pickupCode, confirm: true })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            showToast('✅ Pickup verified successfully!', 'success');
            setOrderPreview(null);
            setPickupCode('');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 40, maxWidth: 600 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 12 }}>
                        <div style={{ fontSize: 32 }}>📦</div>
                        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Verify Pickup</h1>
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Scan or enter the customer's unique pickup code.</p>

                    {!orderPreview ? (
                        <form onSubmit={handleVerify}>
                            <div className="form-group">
                                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pickup Code</label>
                                <input
                                    required
                                    value={pickupCode}
                                    onChange={e => setPickupCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. 123456"
                                    style={{ fontSize: 24, padding: '16px 20px', textAlign: 'center', letterSpacing: '0.2em', fontWeight: 800, borderRadius: 16 }}
                                    maxLength={8}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                                style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '16px', marginTop: 12, borderRadius: 14 }}
                            >
                                {loading ? 'Checking...' : 'Check Code →'}
                            </button>
                        </form>
                    ) : (
                        <div style={{ animation: 'slideUp 0.3s ease' }}>
                            <div style={{ background: 'rgba(108, 61, 225, 0.05)', border: '1px solid var(--primary)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Order Details</h3>

                                <div style={{ marginBottom: 16 }}>
                                    <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>Customer</p>
                                    <p style={{ fontSize: 18, fontWeight: 700 }}>{orderPreview.buyerName}</p>
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Items</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {orderPreview.items.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, background: 'var(--bg-card)', padding: '8px 12px', borderRadius: 8 }}>
                                                <span>{item.name} <span style={{ color: 'var(--text-dim)' }}>× {item.quantity}</span></span>
                                                <span style={{ fontWeight: 700 }}>₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                                    <p style={{ fontWeight: 700 }}>Total Amount</p>
                                    <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary-light)' }}>₹{orderPreview.total_price}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn-secondary" onClick={() => setOrderPreview(null)} style={{ flex: 1, padding: '16px' }}>Cancel</button>
                                <button
                                    className="btn-primary"
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    style={{ flex: 2, padding: '16px', background: 'var(--success)', border: 'none' }}
                                >
                                    {loading ? 'Confirming...' : '✅ Confirm Pickup'}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/seller/dashboard')}
                        style={{ width: '100%', marginTop: 24, background: 'none', color: 'var(--text-dim)', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

