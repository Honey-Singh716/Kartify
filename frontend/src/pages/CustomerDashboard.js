import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import {
    ORDER_TYPES,
    ORDER_STATES,
    OrderUIHelpers
} from '../utils/orderStateManagement';

import { API_URL, IMAGE_URL } from '../config';

const API = API_URL;

// Summary Stats Component
const SummaryStats = ({ orders }) => {
    const stats = {
        total: orders.length,
        inTransit: orders.filter(o => [ORDER_STATES.OUT_FOR_DELIVERY, ORDER_STATES.READY_FOR_PICKUP].includes(o.orderStatus)).length,
        completed: orders.filter(o => o.orderStatus === ORDER_STATES.COMPLETED).length,
        pending: orders.filter(o => [ORDER_STATES.CONFIRMED].includes(o.orderStatus)).length
    };

    const statCards = [
        {
            label: 'Total Orders',
            value: stats.total,
            icon: '📦',
            color: 'var(--primary-light)',
            bgColor: 'rgba(108, 61, 225, 0.1)'
        },
        {
            label: 'In Transit',
            value: stats.inTransit,
            icon: '🚚',
            color: '#F59E0B',
            bgColor: 'rgba(245, 158, 11, 0.1)'
        },
        {
            label: 'Completed',
            value: stats.completed,
            icon: '✅',
            color: '#10B981',
            bgColor: 'rgba(16, 185, 129, 0.1)'
        },
        {
            label: 'Pending',
            value: stats.pending,
            icon: '⏳',
            color: '#6B7280',
            bgColor: 'rgba(107, 114, 128, 0.1)'
        }
    ];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32
        }}>
            {statCards.map(stat => (
                <div key={stat.label} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 20,
                    transition: 'all 0.2s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: stat.bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <div style={{
                                fontSize: 24,
                                fontWeight: 800,
                                color: stat.color,
                                lineHeight: 1
                            }}>
                                {stat.value}
                            </div>
                            <div style={{
                                fontSize: 12,
                                color: 'var(--text-dim)',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                {stat.label}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Minimal Progress Bar Component
const MinimalProgressBar = ({ progress, color }) => (
    <div style={{
        width: '100%',
        height: 6,
        background: 'var(--border)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 12
    }}>
        <div style={{
            width: `${progress}%`,
            height: '100%',
            background: color,
            borderRadius: 3,
            transition: 'width 0.3s ease'
        }} />
    </div>
);

// Delivery Order Card Component
// Unified Order Card Component - Compact + Expandable
const OrderCard = ({ order }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const stateMetadata = OrderUIHelpers.getStateMetadata(order.orderStatus);
    const nextAction = OrderUIHelpers.getNextActionForCustomer(order.deliveryType, order.orderStatus);
    const lastUpdated = OrderUIHelpers.formatTimestamp(order.updatedAt || order.createdAt);
    const isPickup = order.deliveryType === 'pickup';
    const deliveryIcon = isPickup ? '🏪' : '🚚';

    const toggleExpanded = () => setIsExpanded(!isExpanded);

    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            marginBottom: 12,
            transition: 'all 0.2s ease',
            cursor: 'pointer'
        }}>
            {/* Compact Header - Always Visible */}
            <div onClick={toggleExpanded} style={{
                padding: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <div style={{ fontSize: 18 }}>{deliveryIcon}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: 13,
                            color: 'var(--text-dim)',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            marginBottom: 2
                        }}>
                            #{order._id.slice(-8).toUpperCase()}
                        </div>
                        <div style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: stateMetadata.color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                        }}>
                            <span>{stateMetadata.icon}</span>
                            {stateMetadata.label}
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div>
                        <div style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: 'var(--primary-light)'
                        }}>
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <div style={{
                            fontSize: 11,
                            color: 'var(--text-dim)'
                        }}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short'
                            })}
                        </div>
                    </div>
                    <div style={{
                        fontSize: 12,
                        color: 'var(--text-dim)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                    }}>
                        ▼
                    </div>
                </div>
            </div>

            {/* Minimal Progress Bar */}
            <div style={{
                height: 3,
                background: 'var(--bg)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${stateMetadata.progress}%`,
                    background: stateMetadata.color,
                    transition: 'width 0.3s ease'
                }} />
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div style={{
                    padding: 16,
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg)'
                }}>
                    {/* Order Items */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{
                            fontSize: 12,
                            color: 'var(--text-dim)',
                            marginBottom: 8,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Order Items ({order.items?.length || 0})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {order.items?.slice(0, 3).map((item, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: 13,
                                    color: 'var(--text)'
                                }}>
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                            {order.items?.length > 3 && (
                                <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
                                    +{order.items.length - 3} more items
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Location/Pickup Info */}
                    {isPickup ? (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{
                                fontSize: 12,
                                color: 'var(--text-dim)',
                                marginBottom: 8,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Pickup Location
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text)' }}>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                    {order.shop?.name}
                                </div>
                                <div>{order.shop?.city}</div>
                                {order.pickupCode && (
                                    <div style={{
                                        background: 'var(--primary-light)',
                                        color: 'white',
                                        padding: '8px 12px',
                                        borderRadius: 8,
                                        fontSize: 14,
                                        fontWeight: 700,
                                        textAlign: 'center',
                                        marginTop: 8,
                                        fontFamily: 'monospace'
                                    }}>
                                        Pickup Code: {order.pickupCode}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{
                                fontSize: 12,
                                color: 'var(--text-dim)',
                                marginBottom: 8,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Delivery Address
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text)' }}>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.delivery_name}</div>
                                <div>{order.delivery_address}</div>
                                {order.delivery_city && <div>{order.delivery_city}, {order.delivery_pincode}</div>}
                            </div>
                        </div>
                    )}

                    {/* ETA & Seller Note — shown for all order types when set */}
                    {(order.estimatedDelivery || order.statusNote) && (
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.08)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: 8,
                            padding: '10px 14px',
                            marginBottom: 16
                        }}>
                            {order.estimatedDelivery && (
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#3B82F6', marginBottom: order.statusNote ? 4 : 0 }}>
                                    🕐 ETA: {new Date(order.estimatedDelivery).toLocaleString('en-IN', {
                                        weekday: 'short', day: 'numeric', month: 'short',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            )}
                            {order.statusNote && (
                                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                                    📝 {order.statusNote}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Next Action */}
                    {nextAction && (
                        <div style={{
                            background: stateMetadata.bgColor,
                            borderRadius: 8,
                            padding: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}>
                            <div style={{
                                fontSize: 16,
                                flexShrink: 0
                            }}>
                                {isPickup ? '🏪' : '📦'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: stateMetadata.color,
                                    marginBottom: 2
                                }}>
                                    NEXT STEP
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text)' }}>
                                    {nextAction}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 16,
                        paddingTop: 12,
                        borderTop: '1px solid var(--border)'
                    }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            Last updated: {lastUpdated}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            {isPickup ? 'Pickup Order' : 'Home Delivery'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function CustomerDashboard() {
    const { user, showToast } = useApp();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    const headers = useCallback(() => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.token}`
    }), [user]);

    const fetchOrders = useCallback(async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API}/orders/my-orders`, { headers: headers() });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch orders');
            }

            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, navigate, headers, showToast]);

    useEffect(() => {
        if (!user || user.role !== 'customer') {
            navigate('/');
            return;
        }
        fetchOrders();
    }, [user, navigate, fetchOrders]);

    // Real-time polling for order updates (10s)
    useEffect(() => {
        if (!user || user.role !== 'customer') return;

        const pollInterval = setInterval(() => {
            fetchOrders();
        }, 10000);

        return () => clearInterval(pollInterval);
    }, [user, fetchOrders]);

    // Refetch immediately when the tab becomes visible (instant sync)
    useEffect(() => {
        if (!user || user.role !== 'customer') return;

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchOrders();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [user, fetchOrders]);

    // Filter orders
    const filteredOrders = activeFilter === 'all' ? orders :
        activeFilter === 'pickup' ? orders.filter(o => o.deliveryType === ORDER_TYPES.PICKUP) :
            orders.filter(o => o.deliveryType === ORDER_TYPES.DELIVERY);

    // Sort orders by date (newest first)
    const sortedOrders = [...filteredOrders].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (!user) return null;
    if (loading) return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)'
        }}>
            <div className="spinner" />
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                padding: '40px 20px 60px',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: 'white',
                    marginBottom: 8
                }}>
                    My Orders
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Track your orders in real-time
                </p>
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: 900, margin: '-40px auto 0', padding: '0 20px 40px' }}>

                {/* Summary Stats */}
                <SummaryStats orders={orders} />

                {/* Filter Tabs */}
                <div style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 24,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 4
                }}>
                    {[
                        { id: 'all', label: 'All Orders', count: orders.length },
                        { id: 'pickup', label: 'Pickup', count: orders.filter(o => o.deliveryType === ORDER_TYPES.PICKUP).length },
                        { id: 'delivery', label: 'Delivery', count: orders.filter(o => o.deliveryType === ORDER_TYPES.DELIVERY).length }
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 600,
                                background: activeFilter === filter.id ? '#10B981' : 'transparent',
                                color: activeFilter === filter.id ? 'white' : 'var(--text)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8
                            }}
                        >
                            {filter.label}
                            <span style={{
                                background: activeFilter === filter.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-card2)',
                                color: activeFilter === filter.id ? 'white' : 'var(--text-dim)',
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 600,
                                minWidth: 24,
                                textAlign: 'center'
                            }}>
                                {filter.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                {sortedOrders.length === 0 ? (
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: 60,
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📦</div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
                            No orders found
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                            {activeFilter === 'all' ? 'You haven\'t placed any orders yet.' :
                                activeFilter === 'pickup' ? 'No pickup orders found.' :
                                    'No delivery orders found.'}
                        </p>
                        {activeFilter !== 'all' && (
                            <button
                                onClick={() => setActiveFilter('all')}
                                style={{
                                    background: '#10B981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                View All Orders
                            </button>
                        )}
                    </div>
                ) : (
                    <div>
                        {sortedOrders.map(order => (
                            <OrderCard key={order._id} order={order} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
