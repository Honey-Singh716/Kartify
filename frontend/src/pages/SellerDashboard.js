import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import ReviewCard from '../components/ReviewCard';
import MapPicker from '../components/MapPicker';
import { 
    ORDER_TYPES, 
    ORDER_STATES, 
    STATE_ACTIONS, 
    OrderStateValidator, 
    OrderStateManager,
    OrderUIHelpers 
} from '../utils/orderStateManagement';

const API = 'http://localhost:5000/api';

const CATEGORIES = [
    'Electronics', 'Fashion & Clothing', 'Home & Kitchen',
    'Beauty & Personal Care', 'Groceries & Food', 'Sports & Fitness',
    'Books & Stationery', 'Toys & Baby Products', 'Medicine'
];

const CATEGORY_ATTRIBUTES = {
    'Electronics': ['Brand', 'Model', 'Battery', 'Display'],
    'Groceries & Food': ['Weight', 'Price per kg', 'Organic', 'Harvest Date'],
    'Fashion & Clothing': ['Size', 'Color', 'Fabric']
};

const DELIVERY_WORKFLOW = ['confirmed', 'out_for_delivery', 'delivered', 'completed'];
const PICKUP_WORKFLOW = ['confirmed', 'ready_for_pickup', 'picked_up', 'completed'];

const statusBadge = (status) => {
    const stateMetadata = OrderUIHelpers.getStateMetadata(status);
    return (
        <span 
            style={{
                background: stateMetadata.bgColor,
                color: stateMetadata.color,
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'capitalize',
                border: `1px solid ${stateMetadata.color}20`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
            }}
        >
            <span>{stateMetadata.icon}</span>
            {stateMetadata.label}
        </span>
    );
};

// Progress tracker component with new state management
const ProgressTracker = ({ order }) => {
    if (!order) return null;
    const isPickup = order.deliveryType === 'pickup';
    const orderType = isPickup ? ORDER_TYPES.PICKUP : ORDER_TYPES.DELIVERY;
    const currentStatus = order.orderStatus;
    
    // Get the workflow based on order type
    const getWorkflow = (type) => {
        if (type === ORDER_TYPES.PICKUP) {
            return [
                ORDER_STATES.CONFIRMED,
                ORDER_STATES.READY_FOR_PICKUP,
                ORDER_STATES.PICKED_UP,
                ORDER_STATES.COMPLETED
            ];
        } else {
            return [
                ORDER_STATES.CONFIRMED,
                ORDER_STATES.OUT_FOR_DELIVERY,
                ORDER_STATES.DELIVERED,
                ORDER_STATES.COMPLETED
            ];
        }
    };
    
    const workflow = getWorkflow(orderType);
    const currentIndex = workflow.indexOf(currentStatus);
    
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0' }}>
            {workflow.map((stage, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isFuture = index > currentIndex;
                const stateMetadata = OrderUIHelpers.getStateMetadata(stage);
                
                return (
                    <React.Fragment key={stage}>
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            flex: 1,
                            position: 'relative'
                        }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 14,
                                fontWeight: 700,
                                background: isCompleted ? stateMetadata.color : 
                                           isCurrent ? stateMetadata.color : 
                                           'var(--bg-card2)',
                                border: isCurrent ? `2px solid ${stateMetadata.color}` : 
                                         '2px solid var(--border)',
                                color: isCompleted || isCurrent ? 'white' : 'var(--text-dim)',
                                transition: 'all 0.3s ease'
                            }}>
                                {isCompleted ? '✓' : stateMetadata.icon}
                            </div>
                            <span style={{
                                fontSize: 11,
                                marginTop: 6,
                                fontWeight: isCurrent ? 700 : 500,
                                color: isCurrent ? 'var(--text)' : 
                                       isCompleted ? stateMetadata.color : 'var(--text-dim)',
                                textAlign: 'center',
                                textTransform: 'capitalize'
                            }}>
                                {stateMetadata.label}
                            </span>
                        </div>
                        {index < workflow.length - 1 && (
                            <div style={{
                                flex: 1,
                                height: 2,
                                background: isCompleted ? stateMetadata.color : 'var(--border)',
                                margin: '0 4px'
                            }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// Order type badge component
const OrderTypeBadge = ({ type }) => {
    if (type === 'pickup') {
        return (
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
                🟢 PICKUP
            </div>
        );
    } else {
        return (
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3B82F6',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
                🔵 DELIVERY
            </div>
        );
    }
};

// Compact progress indicator
const CompactProgress = ({ workflow, currentStatus, type }) => {
    const currentIndex = workflow.indexOf(currentStatus);
    const progress = ((currentIndex + 1) / workflow.length) * 100;
    
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ 
                width: 60, 
                height: 4, 
                background: 'var(--border)', 
                borderRadius: 2,
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: type === 'pickup' ? '#10B981' : '#3B82F6',
                    transition: 'width 0.3s ease'
                }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {currentIndex + 1}/{workflow.length}
            </span>
        </div>
    );
};

// Scheduling component
const OrderScheduling = ({ order, schedule, onUpdateSchedule }) => {
    const isPickup = order.deliveryType === 'pickup';
    const currentStatus = order.orderStatus;
    
    const canSchedule = (isPickup && currentStatus === 'confirmed') || 
                       (!isPickup && currentStatus === 'confirmed');
    
    if (!canSchedule) return null;
    
    return (
        <div style={{ 
            background: 'var(--bg-card2)', 
            borderRadius: 8, 
            padding: 12, 
            marginTop: 12 
        }}>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600 }}>
                {isPickup ? '📅 Ready Time' : '🚚 Delivery Schedule'}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                    type={isPickup ? 'time' : 'datetime-local'}
                    value={schedule || ''}
                    onChange={(e) => onUpdateSchedule(order._id, e.target.value)}
                    style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: 12,
                        flex: 1
                    }}
                />
                {schedule && (
                    <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>
                        {isPickup ? 'Ready by' : 'Deliver by'} {new Date(schedule).toLocaleString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            ...(isPickup ? {} : { day: 'numeric', month: 'short' })
                        })}
                    </span>
                )}
            </div>
        </div>
    );
};

// Enhanced Action buttons component with new state management system
const ActionButtons = ({ order, onUpdateStatus, onGeneratePickupCode, onCancelOrder, onContactCustomer }) => {
    const { user } = useApp();
    const currentStatus = order.orderStatus;
    const orderType = order.deliveryType === 'pickup' ? ORDER_TYPES.PICKUP : ORDER_TYPES.DELIVERY;
    const userRole = user?.role?.toUpperCase();
    
    // Get available actions based on current state and user role
    const availableActions = OrderStateValidator.getAvailableActions(orderType, currentStatus, userRole);
    
    // Separate primary and secondary actions
    const primaryActions = availableActions.filter(action => action.type === 'primary');
    const secondaryActions = availableActions.filter(action => action.type === 'secondary');
    const dangerActions = availableActions.filter(action => action.type === 'danger');
    
    // Add contact customer action for all non-completed orders
    const allSecondaryActions = [...secondaryActions];
    if (!OrderStateValidator.isTerminalState(currentStatus)) {
        allSecondaryActions.push({
            id: 'contact',
            label: 'Contact Customer',
            action: 'contact',
            type: 'secondary',
            icon: '📞',
            roles: ['SELLER', 'CUSTOMER']
        });
    }

    const getButtonStyle = (type) => {
        switch (type) {
            case 'primary':
                return {
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: 'fit-content',
                    boxShadow: '0 2px 4px rgba(108, 61, 225, 0.2)'
                };
            case 'secondary':
                return {
                    background: 'var(--bg-card2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    padding: '10px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: 'fit-content'
                };
            case 'danger':
                return {
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: 'fit-content'
                };
            default:
                return {};
        }
    };

    const handleActionClick = async (action) => {
        try {
            switch (action.id) {
                case 'generate_code':
                    await onGeneratePickupCode(order._id);
                    break;
                case 'cancel':
                    if (action.requiresConfirmation) {
                        const confirmMessage = `Are you sure you want to cancel this order? This action cannot be undone.`;
                        if (!window.confirm(confirmMessage)) {
                            return;
                        }
                    }
                    await onCancelOrder(order._id);
                    break;
                case 'contact':
                    onContactCustomer(order);
                    break;
                default:
                    if (action.targetState) {
                        // Validate transition before executing
                        const validation = OrderStateValidator.validateTransition(
                            orderType, 
                            currentStatus, 
                            action.targetState, 
                            userRole
                        );
                        
                        if (!validation.isValid) {
                            alert(`Invalid action: ${validation.errors.join(', ')}`);
                            return;
                        }
                        
                        await onUpdateStatus(order._id, action.targetState);
                    }
            }
        } catch (error) {
            console.error('Action failed:', error);
            alert(`Action failed: ${error.message}`);
        }
    };

    // Show completed state for terminal states
    if (OrderStateValidator.isTerminalState(currentStatus)) {
        const stateMetadata = OrderUIHelpers.getStateMetadata(currentStatus);
        return (
            <div style={{ marginTop: 20 }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 12 
                }}>
                    <div style={{ 
                        width: 4, 
                        height: 16, 
                        background: stateMetadata.color, 
                        borderRadius: 2 
                    }} />
                    <h4 style={{ 
                        fontSize: 14, 
                        fontWeight: 700, 
                        color: 'var(--text)', 
                        margin: 0 
                    }}>
                        Order Status
                    </h4>
                </div>
                
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    background: stateMetadata.bgColor,
                    border: `1px solid ${stateMetadata.color}20`,
                    borderRadius: 8
                }}>
                    <span style={{ fontSize: 16 }}>{stateMetadata.icon}</span>
                    <span style={{ 
                        fontSize: 13, 
                        fontWeight: 600, 
                        color: stateMetadata.color 
                    }}>
                        {stateMetadata.label}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div style={{ marginTop: 20 }}>
            {/* Actions Header */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 12 
            }}>
                <div style={{ 
                    width: 4, 
                    height: 16, 
                    background: 'var(--primary)', 
                    borderRadius: 2 
                }} />
                <h4 style={{ 
                    fontSize: 14, 
                    fontWeight: 700, 
                    color: 'var(--text)', 
                    margin: 0 
                }}>
                    Available Actions
                </h4>
            </div>

            {/* Primary Actions */}
            {primaryActions.length > 0 && (
                <div style={{ 
                    display: 'flex', 
                    gap: 8, 
                    marginBottom: 12, 
                    flexWrap: 'wrap' 
                }}>
                    {primaryActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            style={getButtonStyle(action.type)}
                            onMouseEnter={(e) => {
                                if (action.type === 'primary') {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 4px 8px rgba(108, 61, 225, 0.3)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (action.type === 'primary') {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 4px rgba(108, 61, 225, 0.2)';
                                }
                            }}
                            title={`Role: ${action.roles.join(', ')}`}
                        >
                            <span style={{ marginRight: 6 }}>{action.icon}</span>
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Secondary Actions */}
            {allSecondaryActions.length > 0 && (
                <div style={{ 
                    display: 'flex', 
                    gap: 8, 
                    marginBottom: 12, 
                    flexWrap: 'wrap' 
                }}>
                    {allSecondaryActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            style={getButtonStyle(action.type)}
                            onMouseEnter={(e) => {
                                e.target.style.background = action.type === 'danger' ? 
                                    'rgba(239, 68, 68, 0.9)' : 'var(--bg-card)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = action.type === 'danger' ? 
                                    'var(--danger)' : 'var(--bg-card2)';
                            }}
                            title={action.roles ? `Role: ${action.roles.join(', ')}` : ''}
                        >
                            <span style={{ marginRight: 6 }}>{action.icon}</span>
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Danger Actions */}
            {dangerActions.length > 0 && (
                <div style={{ 
                    display: 'flex', 
                    gap: 8, 
                    flexWrap: 'wrap' 
                }}>
                    {dangerActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            style={getButtonStyle(action.type)}
                            title={`Role: ${action.roles.join(', ')}`}
                        >
                            <span style={{ marginRight: 6 }}>{action.icon}</span>
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Compact Order Card Component
const CompactOrderCard = ({ order, isExpanded, onToggle, workflow }) => {
    const isPickup = order.deliveryType === 'pickup';
    const isCompleted = order.orderStatus === 'completed';
    
    return (
        <div 
            style={{
                background: isCompleted ? 'var(--bg-card2)' : 'var(--bg-card)',
                border: `1px solid ${isCompleted ? 'var(--border)' : isPickup ? '#10B981' : '#3B82F6'}`,
                borderLeft: `3px solid ${isCompleted ? 'var(--border)' : isPickup ? '#10B981' : '#3B82F6'}`,
                borderRadius: 10,
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: isCompleted ? 0.7 : 1
            }}
            onClick={() => onToggle(order._id)}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Expand/Collapse Icon */}
                <div style={{ 
                    fontSize: 12, 
                    color: 'var(--text-dim)', 
                    transition: 'transform 0.2s ease',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                }}>
                    ▶
                </div>
                
                {/* Order Icon */}
                <div style={{ fontSize: 16 }}>
                    {isPickup ? '📦' : '🚚'}
                </div>
                
                {/* Order Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ 
                            fontSize: 11, 
                            color: 'var(--text-dim)', 
                            fontFamily: 'monospace',
                            fontWeight: 600
                        }}>
                            #{order._id.slice(-8).toUpperCase()}
                        </span>
                        <OrderTypeBadge type={order.deliveryType} />
                        {statusBadge(order.orderStatus)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ 
                            fontSize: 13, 
                            fontWeight: 600, 
                            color: 'var(--text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {order.customer?.name || 'N/A'}
                        </span>
                        <span style={{ 
                            fontSize: 14, 
                            fontWeight: 700, 
                            color: 'var(--primary-light)',
                            marginLeft: 8
                        }}>
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
                
                {/* Compact Progress */}
                <CompactProgress 
                    workflow={workflow} 
                    currentStatus={order.orderStatus} 
                    type={order.deliveryType} 
                />
            </div>
        </div>
    );
};

export default function SellerDashboard() {
    const { user, showToast } = useApp();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders');
    const [orderFilter, setOrderFilter] = useState('all');
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [orderSchedules, setOrderSchedules] = useState({});
    
    // Initialize OrderStateManager
    const [orderStateManager] = useState(() => {
        const apiClient = {
            get: (url) => fetch(`${API}${url}`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` }}),
            put: (url, data) => fetch(`${API}${url}`, { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
                body: JSON.stringify(data)
            })
        };
        return new OrderStateManager(apiClient);
    });

    // Product form
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '', category: '', description: '', price: '', stock: '',
        image: null, features: '', specifications: {}, medicalInfo: {},
        variants: [] // { color: '', stock: 0, image: null, preview: null }
    });

    // Shop settings form
    const [shopForm, setShopForm] = useState({});

    const headers = useCallback(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token} ` }), [user]);

    const fetchAll = useCallback(async () => {
        if (!user) { navigate('/seller/signup'); return; }
        setLoading(true);
        try {
            const [sRes, pRes, oRes] = await Promise.all([
                fetch(`${API}/shops/my-shop`, { headers: headers() }),
                fetch(`${API}/products/my-products`, { headers: headers() }),
                fetch(`${API}/orders/shop-orders`, { headers: headers() })
            ]);
            const [sData, pData, oData] = await Promise.all([sRes.json(), pRes.json(), oRes.json()]);

            if (!sRes.ok) { navigate('/seller/signup'); return; }

            setShop(sData);
            setShopForm(sData);
            setProducts(Array.isArray(pData) ? pData : []);
            setOrders(Array.isArray(oData) ? oData : []);

            // fetch shop reviews
            const rRes = await fetch(`${API}/shops/${sData._id}/reviews`);
            const rData = await rRes.json();
            setReviews(Array.isArray(rData) ? rData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user, navigate, headers]);

    useEffect(() => {
        if (!user || user.role !== 'seller') { navigate('/seller/signup'); return; }
        fetchAll();
    }, [user, navigate, fetchAll]);

    // Real-time polling for order updates
    useEffect(() => {
        if (!user || user.role !== 'seller') return;

        const pollInterval = setInterval(() => {
            fetchAll();
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(pollInterval);
    }, [user, fetchAll]);

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', productForm.name);
            formData.append('category', productForm.category);
            formData.append('description', productForm.description);
            formData.append('price', Number(productForm.price));
            formData.append('stock', Number(productForm.stock));

            // Specifications as object
            Object.entries(productForm.specifications).forEach(([key, val]) => {
                formData.append(`specifications[${key}]`, val);
            });

            // Medical Info as object
            Object.entries(productForm.medicalInfo).forEach(([key, val]) => {
                formData.append(`medicalInfo[${key}]`, val);
            });

            const featuresArray = productForm.features ? productForm.features.split(',').map(s => s.trim()).filter(Boolean) : [];
            featuresArray.forEach(f => formData.append('features[]', f));

            if (productForm.image) {
                formData.append('image', productForm.image);
            }

            // Variants
            productForm.variants.forEach((v, i) => {
                formData.append(`variants[${i}][color]`, v.color);
                formData.append(`variants[${i}][stock]`, v.stock);
                if (v.imageFile) {
                    formData.append(`variant_image_${i}`, v.imageFile);
                } else if (v.image) {
                    formData.append(`variants[${i}][image]`, v.image);
                }
            });

            let res;
            if (editingProduct) {
                res = await fetch(`${API}/products/${editingProduct._id}`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${user?.token}` },
                    body: formData
                });
            } else {
                res = await fetch(`${API}/products`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${user?.token}` },
                    body: formData
                });
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast(editingProduct ? 'Product updated!' : 'Product added!');
            setShowProductForm(false);
            setEditingProduct(null);
            setProductForm({ name: '', category: '', description: '', price: '', stock: '', image: null, features: '', specifications: {}, medicalInfo: {}, variants: [] });
            fetchAll();
        } catch (err) { showToast(err.message, 'error'); }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: headers() });
            showToast('Product deleted.');
            fetchAll();
        } catch (err) { showToast(err.message, 'error'); }
    };

    const startEdit = (p) => {
        setEditingProduct(p);
        setProductForm({
            name: p.name,
            category: p.category,
            description: p.description || '',
            price: p.price,
            stock: p.stock,
            image: null,
            features: (p.features || []).join(', '),
            specifications: p.specifications || {},
            medicalInfo: p.medicalInfo || {},
            variants: (p.variants || []).map(v => ({ ...v, preview: v.image ? `http://localhost:5000${v.image}` : null }))
        });
        setShowProductForm(true);
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const order = orders.find(o => o._id === orderId);
            if (!order) {
                throw new Error('Order not found');
            }
            
            const orderType = order.deliveryType === 'pickup' ? ORDER_TYPES.PICKUP : ORDER_TYPES.DELIVERY;
            const currentStatus = order.orderStatus;
            const userRole = user?.role?.toUpperCase();
            
            // Execute transition using OrderStateManager
            await orderStateManager.executeTransition(
                orderId, 
                orderType, 
                currentStatus, 
                newStatus, 
                userRole
            );
            
            showToast('Order status updated successfully!');
            fetchAll();
        } catch (err) { 
            showToast(err.message, 'error'); 
        }
    };

    const toggleOrderExpansion = (orderId) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const updateOrderSchedule = (orderId, schedule) => {
        setOrderSchedules(prev => ({
            ...prev,
            [orderId]: schedule
        }));
    };

    const generatePickupCode = async (orderId) => {
        try {
            await orderStateManager.generatePickupCode(orderId);
            showToast('Pickup code generated successfully!');
            fetchAll();
        } catch (err) { 
            showToast(err.message, 'error'); 
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
            return;
        }
        
        try {
            await orderStateManager.cancelOrder(orderId);
            showToast('Order cancelled successfully!');
            fetchAll();
        } catch (err) { 
            showToast(err.message, 'error'); 
        }
    };

    const handleContactCustomer = (order) => {
        const customerEmail = order.customer?.email;
        const customerPhone = order.delivery_phone || order.customer?.phone;
        const orderId = order._id.slice(-8).toUpperCase();
        
        if (!customerEmail && !customerPhone) {
            showToast('Customer contact information not available', 'error');
            return;
        }
        
        let contactInfo = `Order #${orderId}\n`;
        contactInfo += `Customer: ${order.customer?.name || 'N/A'}\n`;
        
        if (customerEmail) {
            contactInfo += `Email: ${customerEmail}`;
        }
        if (customerPhone) {
            contactInfo += `${customerEmail ? '\n' : ''}Phone: ${customerPhone}`;
        }
        
        // Create a modal-like dialog with contact options
        const contactOptions = [];
        
        if (customerEmail) {
            contactOptions.push(`📧 Email: ${customerEmail}`);
        }
        
        if (customerPhone) {
            contactOptions.push(`📱 Phone: ${customerPhone}`);
        }
        
        const message = `Contact Information for Order #${orderId}\n\n${contactOptions.join('\n')}\n\nClick OK to copy contact details to clipboard.`;
        
        if (window.confirm(message)) {
            const clipboardText = contactOptions.join('\n');
            navigator.clipboard.writeText(clipboardText).then(() => {
                showToast('Contact details copied to clipboard!');
            }).catch(() => {
                showToast('Failed to copy to clipboard', 'error');
            });
        }
    };

    const handleShopUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/shops/my-shop`, { method: 'PUT', headers: headers(), body: JSON.stringify(shopForm) });
            if (!res.ok) throw new Error('Failed to update shop');
            showToast('Shop updated!');
            fetchAll();
        } catch (err) { showToast(err.message, 'error'); }
    };

    if (!user) return null;
    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}><div className="spinner" /></div>;
    if (!shop) return null;

    // Analytics
    const totalRevenue = orders.filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'picked_up').reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;
    const totalOrders = orders.length;
    
    // Filter orders based on selected filter
    const filteredOrders = orderFilter === 'all' ? orders : 
                          orderFilter === 'pickup' ? orders.filter(o => o.deliveryType === 'pickup') :
                          orders.filter(o => o.deliveryType === 'delivery');

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'products', label: 'Products', icon: '📦' },
        { id: 'orders', label: 'Orders', icon: '🛍️' },
        { id: 'reviews', label: 'Reviews', icon: '⭐' },
        { id: 'settings', label: 'Shop Settings', icon: '⚙️' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', paddingTop: 70 }}>
            {/* Sidebar */}
            <div style={{ width: 260, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 70, left: 0, bottom: 0, zIndex: 10 }}>
                <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--border)' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6C3DE1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff' }}>K</div>
                        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>KARTIFY</span>
                    </Link>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Seller Dashboard</p>
                </div>

                <div style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)}
                            style={{
                                width: '100%', textAlign: 'left', padding: '12px 16px',
                                borderRadius: 10, marginBottom: 4, border: 'none', cursor: 'pointer',
                                background: activeTab === item.id ? 'linear-gradient(135deg,#6C3DE1,#8B5CF6)' : 'transparent',
                                color: activeTab === item.id ? 'white' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600,
                                transition: 'all 0.15s ease'
                            }}>
                            <span>{item.icon}</span>
                            {item.label}
                            {item.id === 'orders' && pendingOrders > 0 && (
                                <span style={{ marginLeft: 'auto', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingOrders}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6C3DE1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white' }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Seller</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ marginLeft: 260, flex: 1, padding: 36, overflowY: 'auto' }}>

                {/* DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
                            <div>
                                <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Welcome back, {user.name.split(' ')[0]}! 👋</h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{shop.name} · {shop.category}</p>
                            </div>
                            <button onClick={() => navigate('/seller/pickup-verification')} className="btn-primary" style={{ background: 'var(--success)', border: 'none' }}>
                                ✅ Verify Pickup
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
                            {[
                                { label: 'Total Products', value: products.length, icon: '📦', color: '#6C3DE1' },
                                { label: 'Total Orders', value: totalOrders, icon: '🛍️', color: '#8B5CF6' },
                                { label: 'Pending Orders', value: pendingOrders, icon: '⏳', color: '#F59E0B' },
                                { label: 'Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: '💰', color: '#10B981' },
                                { label: 'Shop Rating', value: `${Number(shop.rating || 0).toFixed(1)} ★`, icon: '⭐', color: '#F59E0B' }
                            ].map(stat => (
                                <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                                    <div style={{ fontSize: 28, marginBottom: 12 }}>{stat.icon}</div>
                                    <p style={{ fontSize: 26, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</p>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Recent Orders */}
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Recent Orders</h2>
                        {orders.slice(0, 5).length === 0 ? (
                            <div className="empty-state" style={{ padding: 40 }}><div className="icon">🛍️</div><h3>No orders yet</h3></div>
                        ) : (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            {['Order ID', 'Customer', 'Type', 'Amount', 'Status'].map(h => (
                                                <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.slice(0, 5).map(o => (
                                            <tr key={o._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '14px 20px', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-dim)' }}>{o._id.slice(-8).toUpperCase()}</td>
                                                <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600 }}>{o.customer?.name || 'N/A'}</td>
                                                <td style={{ padding: '14px 20px', fontSize: 13 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {o.deliveryType === 'delivery' ? (
                                                            <>
                                                                🚚
                                                                <span style={{ color: '#3B82F6', fontWeight: 600 }}>Delivery</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                📦
                                                                <span style={{ color: '#10B981', fontWeight: 600 }}>Pickup</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'var(--primary-light)' }}>₹{o.totalAmount.toLocaleString('en-IN')}</td>
                                                <td style={{ padding: '14px 20px' }}>{statusBadge(o.orderStatus)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* PRODUCTS */}
                {activeTab === 'products' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                            <div>
                                <h1 style={{ fontSize: 24, fontWeight: 800 }}>Products</h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{products.length} products in your shop</p>
                            </div>
                            <button className="btn-primary" onClick={() => { setEditingProduct(null); setProductForm({ name: '', category: '', description: '', price: '', stock: '', image: null, features: '', specifications: {}, medicalInfo: {}, variants: [] }); setShowProductForm(true); }}>
                                + Add Product
                            </button>
                        </div>

                        {/* Product Form */}
                        {showProductForm && (
                            <form onSubmit={handleProductSubmit} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, marginBottom: 28 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Product Name</label>
                                        <input required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="Product name" />
                                    </div>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select required value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                                            <option value="">Select category</option>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea rows={2} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Product description" />
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Price (₹)</label>
                                        <input required type="number" min="0" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="0" />
                                    </div>
                                    <div className="form-group">
                                        <label>Stock</label>
                                        <input required type="number" min="0" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} placeholder="0" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Key Features (comma-separated)</label>
                                    <input value={productForm.features} onChange={e => setProductForm({ ...productForm, features: e.target.value })} placeholder="Large display, Fast charging, AI Camera" />
                                </div>

                                {CATEGORY_ATTRIBUTES[productForm.category] && (
                                    <div style={{ marginBottom: 20 }}>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Specifications for {productForm.category}</p>
                                        <div className="grid-2">
                                            {CATEGORY_ATTRIBUTES[productForm.category].map(attr => (
                                                <div key={attr} className="form-group">
                                                    <label>{attr}</label>
                                                    <input
                                                        value={productForm.specifications[attr] || ''}
                                                        onChange={e => setProductForm({
                                                            ...productForm,
                                                            specifications: { ...productForm.specifications, [attr]: e.target.value }
                                                        })}
                                                        placeholder={attr}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {productForm.category === 'Medicine' && (
                                    <div style={{ marginBottom: 20, background: 'var(--bg-card2)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-light)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            💊 Medicine Information
                                        </p>
                                        <div className="grid-2">
                                            <div className="form-group">
                                                <label>Medicine Type</label>
                                                <select value={productForm.medicalInfo?.type || ''} onChange={e => setProductForm({ ...productForm, medicalInfo: { ...productForm.medicalInfo, type: e.target.value } })}>
                                                    <option value="">Select type</option>
                                                    <option value="Tablet">Tablet</option>
                                                    <option value="Syrup">Syrup</option>
                                                    <option value="Capsule">Capsule</option>
                                                    <option value="Injection">Injection</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Strength / Dosage</label>
                                                <input value={productForm.medicalInfo?.strength || ''} onChange={e => setProductForm({ ...productForm, medicalInfo: { ...productForm.medicalInfo, strength: e.target.value } })} placeholder="e.g. 500mg" />
                                            </div>
                                            <div className="form-group">
                                                <label>Pack Size</label>
                                                <input value={productForm.medicalInfo?.packSize || ''} onChange={e => setProductForm({ ...productForm, medicalInfo: { ...productForm.medicalInfo, packSize: e.target.value } })} placeholder="e.g. 10 tablets" />
                                            </div>
                                            <div className="form-group">
                                                <label>Prescription Required</label>
                                                <select value={productForm.medicalInfo?.prescriptionRequired || 'No'} onChange={e => setProductForm({ ...productForm, medicalInfo: { ...productForm.medicalInfo, prescriptionRequired: e.target.value } })}>
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Manufacture Date</label>
                                                <input type="month" value={productForm.medicalInfo?.manufactureDate || ''} onChange={e => setProductForm({ ...productForm, medicalInfo: { ...productForm.medicalInfo, manufactureDate: e.target.value } })} />
                                            </div>
                                            <div className="form-group">
                                                <label>Expiry Date</label>
                                                <input type="month" value={productForm.medicalInfo?.expiryDate || ''} onChange={e => setProductForm({ ...productForm, medicalInfo: { ...productForm.medicalInfo, expiryDate: e.target.value } })} />
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0, marginTop: 12 }}>
                                            <label>Storage Instructions</label>
                                            <input value={productForm.medicalInfo?.storage || ''} onChange={e => setProductForm({ ...productForm, medicalInfo: { ...productForm.medicalInfo, storage: e.target.value } })} placeholder="e.g. Store below 25°C" />
                                        </div>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Product Image</label>
                                    <input type="file" accept="image/*" onChange={e => setProductForm({ ...productForm, image: e.target.files[0] })} />
                                    {editingProduct && !productForm.image && editingProduct.images?.[0] && (
                                        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Current image: {editingProduct.images[0]}</p>
                                    )}
                                </div>

                                {/* Variants Section */}
                                <div style={{ marginBottom: 24, padding: 20, background: 'var(--bg-card2)', borderRadius: 16, border: '1px solid var(--border)' }}>
                                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        🎨 Color Variants
                                        <button type="button" onClick={() => setProductForm({ ...productForm, variants: [...productForm.variants, { color: '', stock: 0, imageFile: null, preview: null }] })} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>+ Add Color</button>
                                    </h4>

                                    {productForm.variants?.map((v, i) => (
                                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', gap: 12, marginBottom: 12, alignItems: 'end', background: 'var(--bg-card)', padding: 12, borderRadius: 12 }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: 11 }}>Color</label>
                                                <input value={v.color} onChange={e => {
                                                    const newVariants = [...productForm.variants];
                                                    newVariants[i].color = e.target.value;
                                                    setProductForm({ ...productForm, variants: newVariants });
                                                }} placeholder="e.g. Red" />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: 11 }}>Stock</label>
                                                <input type="number" value={v.stock} onChange={e => {
                                                    const newVariants = [...productForm.variants];
                                                    newVariants[i].stock = e.target.value;
                                                    setProductForm({ ...productForm, variants: newVariants });
                                                }} placeholder="0" />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: 11 }}>Image</label>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    {v.preview && <img src={v.preview} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />}
                                                    <input type="file" accept="image/*" onChange={e => {
                                                        const file = e.target.files[0];
                                                        const newVariants = [...productForm.variants];
                                                        newVariants[i].imageFile = file;
                                                        newVariants[i].preview = URL.createObjectURL(file);
                                                        setProductForm({ ...productForm, variants: newVariants });
                                                    }} style={{ fontSize: 10, padding: 4 }} />
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setProductForm({ ...productForm, variants: productForm.variants.filter((_, idx) => idx !== i) })} style={{ height: 38, background: 'var(--danger-light)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}>×</button>
                                        </div>
                                    ))}
                                    {(productForm.variants?.length || 0) === 0 && <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>No color variants added yet.</p>}
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button type="submit" className="btn-primary">{editingProduct ? 'Update Product' : 'Add Product'}</button>
                                    <button type="button" className="btn-secondary" onClick={() => { setShowProductForm(false); setEditingProduct(null); }}>Cancel</button>
                                </div>
                            </form>
                        )}

                        {/* Product List */}
                        {products.length === 0 ? (
                            <div className="empty-state"><div className="icon">📦</div><h3>No products yet</h3><p>Add your first product to start selling!</p></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {products.map(p => {
                                    let img = p.images?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=6C3DE1&color=fff&size=64`;
                                    if (img && img.startsWith('/uploads/')) img = `http://localhost:5000${img}`;
                                    return (
                                        <div key={p._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <img src={img} alt={p.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=6C3DE1&color=fff&size=64`; }} />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{p.name}</p>
                                                <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>{p.category}</p>
                                            </div>
                                            <div style={{ textAlign: 'right', marginRight: 24 }}>
                                                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-light)' }}>₹{p.price.toLocaleString('en-IN')}</p>
                                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                                                    {p.variants?.slice(0, 3).map((v, idx) => (
                                                        <div key={idx} style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary-light)', border: '1px solid var(--border)' }} title={v.color} />
                                                    ))}
                                                    {p.variants?.length > 3 && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>+{p.variants.length - 3}</span>}
                                                </div>
                                                <p style={{ fontSize: 12, color: p.stock <= 5 ? 'var(--danger)' : 'var(--text-dim)', marginTop: 4 }}>Total Stock: {p.stock + (p.variants?.reduce((s, v) => s + v.stock, 0) || 0)}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => startEdit(p)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>Edit</button>
                                                <button onClick={() => handleDeleteProduct(p._id)} className="btn-danger" style={{ padding: '8px 16px', fontSize: 13 }}>Delete</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ORDERS */}
                {activeTab === 'orders' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                            <div>
                                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Orders</h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{totalOrders} total orders · {pendingOrders} pending</p>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                            {[
                                { id: 'all', label: 'All Orders', count: orders.length },
                                { id: 'pickup', label: 'Pickup', count: orders.filter(o => o.deliveryType === 'pickup').length },
                                { id: 'delivery', label: 'Delivery', count: orders.filter(o => o.deliveryType === 'delivery').length }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setOrderFilter(filter.id)}
                                    style={{
                                        background: orderFilter === filter.id ? 'var(--primary)' : 'transparent',
                                        color: orderFilter === filter.id ? 'white' : 'var(--text-muted)',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: 8,
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}
                                >
                                    {filter.label}
                                    <span style={{
                                        background: orderFilter === filter.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-card2)',
                                        padding: '2px 6px',
                                        borderRadius: 10,
                                        fontSize: 12,
                                        minWidth: 20,
                                        textAlign: 'center'
                                    }}>
                                        {filter.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div className="empty-state" style={{ padding: 60 }}>
                                <div className="icon">🛍️</div>
                                <h3>No orders found</h3>
                                <p>
                                    {orderFilter === 'all' ? 'Orders from customers will appear here.' : 
                                     orderFilter === 'pickup' ? 'No pickup orders found.' : 
                                     'No delivery orders found.'}
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {filteredOrders.map(o => {
                                    const isPickup = o.deliveryType === 'pickup';
                                    const workflow = isPickup ? PICKUP_WORKFLOW : DELIVERY_WORKFLOW;
                                    const isCompleted = o.orderStatus === 'completed';
                                    const isExpanded = expandedOrders.has(o._id);
                                    
                                    return (
                                        <div key={o._id}>
                                            {/* Compact Card */}
                                            <CompactOrderCard 
                                                order={o}
                                                isExpanded={isExpanded}
                                                onToggle={toggleOrderExpansion}
                                                workflow={workflow}
                                            />
                                            
                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div style={{
                                                    background: 'var(--bg-card)',
                                                    border: `1px solid ${isPickup ? '#10B981' : '#3B82F6'}`,
                                                    borderTop: 'none',
                                                    borderRadius: '0 0 10px 10px',
                                                    padding: '20px 16px',
                                                    marginTop: -2,
                                                    animation: 'slideDown 0.3s ease'
                                                }}>
                                                    {/* Full Progress Tracker */}
                                                    <ProgressTracker 
                                                        order={o}
                                                    />

                                                    {/* Order Details Header */}
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'flex-start', 
                                                        marginBottom: 16,
                                                        paddingTop: 16,
                                                        borderTop: '1px solid var(--border)'
                                                    }}>
                                                        <div>
                                                            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                                                                Customer: {o.customer?.email || 'N/A'}
                                                            </p>
                                                            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                                                                Order Date: {new Date(o.createdAt).toLocaleDateString('en-IN')}
                                                            </p>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-light)' }}>
                                                                ₹{o.totalAmount.toLocaleString('en-IN')}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Dynamic Content Based on Order Type */}
                                                    <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                                                        {isPickup ? (
                                                            <div style={{ textAlign: 'center' }}>
                                                                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Pickup Code</div>
                                                                <div style={{ 
                                                                    fontSize: 28, 
                                                                    fontWeight: 900, 
                                                                    color: '#10B981', 
                                                                    letterSpacing: 4,
                                                                    fontFamily: 'monospace',
                                                                    marginBottom: 4
                                                                }}>
                                                                    {o.pickupCode || 'N/A'}
                                                                </div>
                                                                <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Show this code to the shop owner</p>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Delivery Address</div>
                                                                <p style={{ fontSize: 13, lineHeight: 1.5 }}>
                                                                    {o.delivery_address && (
                                                                        <>
                                                                            {o.delivery_name && <><strong>{o.delivery_name}</strong><br /></>}
                                                                            {o.delivery_address}<br />
                                                                            {o.delivery_city && `${o.delivery_city}, `}
                                                                            {o.delivery_pincode}
                                                                            {o.delivery_phone && <><br />📱 {o.delivery_phone}</>}
                                                                        </>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Items */}
                                                    <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                                                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Order Items</div>
                                                        {o.items?.map((item, i) => (
                                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                                                                <span style={{ color: 'var(--text-muted)' }}>
                                                                    {item.name} × {item.quantity}
                                                                    {item.color && <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>({item.color})</span>}
                                                                </span>
                                                                <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Scheduling */}
                                                    <OrderScheduling 
                                                        order={o}
                                                        schedule={orderSchedules[o._id]}
                                                        onUpdateSchedule={updateOrderSchedule}
                                                    />

                                                    {/* Action Buttons */}
                                                    <ActionButtons 
                                                        order={o} 
                                                        onUpdateStatus={handleUpdateStatus}
                                                        onGeneratePickupCode={generatePickupCode}
                                                        onCancelOrder={handleCancelOrder}
                                                        onContactCustomer={handleContactCustomer}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* REVIEWS */}
                {activeTab === 'reviews' && (
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Reviews</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
                            {reviews.length} reviews · {Number(shop.rating || 0).toFixed(1)} avg rating
                        </p>
                        {reviews.length === 0 ? (
                            <div className="empty-state"><div className="icon">⭐</div><h3>No reviews yet</h3><p>Customer reviews will appear here.</p></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {reviews.map(r => <ReviewCard key={r._id} review={r} />)}
                            </div>
                        )}
                    </div>
                )}

                {/* SETTINGS */}
                {activeTab === 'settings' && (
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 28 }}>Shop Settings</h1>
                        <form onSubmit={handleShopUpdate} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, maxWidth: 700 }}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Shop Name</label>
                                    <input required value={shopForm.name || ''} onChange={e => setShopForm({ ...shopForm, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select required value={shopForm.category || ''} onChange={e => setShopForm({ ...shopForm, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows={2} value={shopForm.description || ''} onChange={e => setShopForm({ ...shopForm, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <input value={shopForm.address || ''} onChange={e => setShopForm({ ...shopForm, address: e.target.value })} />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>City</label>
                                    <input value={shopForm.city || ''} onChange={e => setShopForm({ ...shopForm, city: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Pincode</label>
                                    <input value={shopForm.pincode || ''} onChange={e => setShopForm({ ...shopForm, pincode: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input value={shopForm.phone || ''} onChange={e => setShopForm({ ...shopForm, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Opening Hours</label>
                                    <input value={shopForm.openingHours || ''} onChange={e => setShopForm({ ...shopForm, openingHours: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Logo URL</label>
                                    <input value={shopForm.logo || ''} onChange={e => setShopForm({ ...shopForm, logo: e.target.value })} placeholder="https://..." />
                                </div>
                                <div className="form-group">
                                    <label>Banner URL</label>
                                    <input value={shopForm.banner || ''} onChange={e => setShopForm({ ...shopForm, banner: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                                    <input type="checkbox" checked={shopForm.deliveryAvailable || false} onChange={e => setShopForm({ ...shopForm, deliveryAvailable: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                                    🚚 Home Delivery
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                                    <input type="checkbox" checked={shopForm.pickupAvailable || false} onChange={e => setShopForm({ ...shopForm, pickupAvailable: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                                    📦 Shop Pickup
                                </label>
                            </div>
                            <div style={{ marginBottom: 24, padding: 20, background: 'var(--bg-card2)', borderRadius: 12 }}>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Update Shop Location (Select on map)</label>
                                <MapPicker
                                    location={shopForm.location}
                                    onChange={(loc) => setShopForm({ ...shopForm, location: loc })}
                                />
                                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                                    <span>Lat: {shopForm.location?.lat?.toFixed(4)}</span>
                                    <span>Lng: {shopForm.location?.lng?.toFixed(4)}</span>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary">Save Changes</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
