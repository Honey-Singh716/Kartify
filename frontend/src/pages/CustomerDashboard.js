import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ShopMap from '../components/ShopMap';
import { useApp } from '../App';

const API = 'http://localhost:5000/api';

export default function CustomerDashboard() {
    const { user, showToast } = useApp();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMapFor, setShowMapFor] = useState(null); // orderId

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        if (user.role !== 'customer') {
            navigate('/home');
            return;
        }

        const fetchOrders = async () => {
            try {
                const res = await fetch(`${API}/orders/my-orders`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const data = await res.json();
                // Ensure unique objects with location data if available (populated by backend update)
                setOrders(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, navigate]);

    if (!user) return null;
    if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>;

    const stats = {
        total: orders.length,
        pending: orders.filter(o => !['delivered', 'picked_up'].includes(o.status)).length,
        completed: orders.filter(o => ['delivered', 'picked_up'].includes(o.status)).length,
        spending: orders.reduce((sum, o) => sum + o.totalAmount, 0)
    };

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 40 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>My Dashboard</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Welcome back, {user?.name}</p>

                {/* Stats Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
                    {[
                        { label: 'Total Orders', value: stats.total, icon: '🛍️', color: 'var(--primary-light)' },
                        { label: 'Pending', value: stats.pending, icon: '⏳', color: 'var(--warning)' },
                        { label: 'Completed', value: stats.completed, icon: '✅', color: 'var(--success)' },
                        { label: 'Total Spending', value: `₹${stats.spending.toLocaleString('en-IN')}`, icon: '💰', color: 'var(--primary-light)' }
                    ].map(s => (
                        <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                            <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
                            <p style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                    <section>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Your Orders</h2>
                        {orders.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon">🛍️</div>
                                <h3>No orders yet</h3>
                                <p>You haven't placed any orders yet.</p>
                                <Link to="/home" className="btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>Browse Products</Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {orders.map(order => (
                                    <div key={order._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div>
                                                <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>Order #{order._id.slice(-8).toUpperCase()}</p>
                                                <p style={{ fontWeight: 600 }}>{order.shop?.name || 'Local Shop'}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontWeight: 800, color: 'var(--primary-light)' }}>₹{order.totalAmount.toLocaleString('en-IN')}</p>
                                                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>{new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span className={`badge badge-${(order.orderStatus === 'delivered' || order.orderStatus === 'picked_up') ? 'success' : 'warning'}`} style={{ textTransform: 'capitalize' }}>
                                                {order.orderStatus.replace(/_/g, ' ')}
                                            </span>
                                            {order.deliveryType === 'pickup' && order.orderStatus !== 'picked_up' && (
                                                <div style={{ marginTop: 12 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                                        <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid var(--success)', borderRadius: 12, padding: '12px 16px' }}>
                                                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Pickup Code: <span style={{ color: 'var(--success)', fontSize: 18, letterSpacing: '0.05em' }}>{order.pickupCode}</span></p>
                                                            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Show this code to the shop owner.</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setShowMapFor(showMapFor === order._id ? null : order._id)}
                                                            className="btn-secondary"
                                                            style={{ padding: '8px 16px', fontSize: 12, border: 'none' }}
                                                        >
                                                            {showMapFor === order._id ? 'Hide Map' : '📍 View Shop Location'}
                                                        </button>
                                                    </div>
                                                    {showMapFor === order._id && order.shop?.location && (
                                                        <div style={{ animation: 'slideDown 0.3s ease' }}>
                                                            <ShopMap location={order.shop.location} shopName={order.shop.name} height="250px" />
                                                            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8, textAlign: 'center' }}>
                                                                Address: {order.shop.address || 'Check shop page for details'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
