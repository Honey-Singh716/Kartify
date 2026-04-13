// Order State Management System
// This file contains all the logic for order state transitions, validation, and permissions

// Order Types
export const ORDER_TYPES = {
    PICKUP: 'pickup',
    DELIVERY: 'delivery'
};

// Order States
export const ORDER_STATES = {
    // Common states
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',

    // Pickup specific states
    READY_FOR_PICKUP: 'ready_for_pickup',
    PICKED_UP: 'picked_up',

    // Delivery specific states
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered'
};

// State Transitions - Define valid transitions for each order type
export const STATE_TRANSITIONS = {
    [ORDER_TYPES.PICKUP]: {
        'pending': ['confirmed', 'cancelled'],
        [ORDER_STATES.CONFIRMED]: [ORDER_STATES.READY_FOR_PICKUP, ORDER_STATES.CANCELLED],
        [ORDER_STATES.READY_FOR_PICKUP]: [ORDER_STATES.PICKED_UP, ORDER_STATES.CANCELLED],
        [ORDER_STATES.PICKED_UP]: [ORDER_STATES.COMPLETED],
        [ORDER_STATES.COMPLETED]: [], // Terminal state
        [ORDER_STATES.CANCELLED]: [] // Terminal state
    },
    [ORDER_TYPES.DELIVERY]: {
        'pending': ['confirmed', 'cancelled'],
        [ORDER_STATES.CONFIRMED]: [ORDER_STATES.OUT_FOR_DELIVERY, ORDER_STATES.CANCELLED],
        [ORDER_STATES.OUT_FOR_DELIVERY]: [ORDER_STATES.DELIVERED, ORDER_STATES.CANCELLED],
        [ORDER_STATES.DELIVERED]: [ORDER_STATES.COMPLETED],
        [ORDER_STATES.COMPLETED]: [], // Terminal state
        [ORDER_STATES.CANCELLED]: [] // Terminal state
    }
};

// State Metadata - Display information for each state
export const STATE_METADATA = {
    'pending': {
        label: 'Order Pending',
        description: 'Your order is waiting for seller confirmation',
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        icon: '⏳',
        progress: 10,
        isTerminal: false,
        canCancel: true
    },
    [ORDER_STATES.CONFIRMED]: {
        label: 'Order Confirmed',
        description: 'Your order has been confirmed and is being prepared',
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        icon: '✅',
        progress: 25,
        isTerminal: false,
        canCancel: true
    },
    [ORDER_STATES.READY_FOR_PICKUP]: {
        label: 'Ready for Pickup',
        description: 'Your order is ready for pickup from the store',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        icon: '📦',
        progress: 50,
        isTerminal: false,
        canCancel: true,
        requiresPickupCode: true
    },
    [ORDER_STATES.PICKED_UP]: {
        label: 'Picked Up',
        description: 'Order has been picked up by customer',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        icon: '🎯',
        progress: 75,
        isTerminal: false,
        canCancel: false
    },
    [ORDER_STATES.OUT_FOR_DELIVERY]: {
        label: 'Out for Delivery',
        description: 'Your order is on the way to your address',
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        icon: '🚚',
        progress: 75,
        isTerminal: false,
        canCancel: false,
        showETA: true
    },
    [ORDER_STATES.DELIVERED]: {
        label: 'Delivered',
        description: 'Order has been delivered to your address',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        icon: '🏠',
        progress: 90,
        isTerminal: false,
        canCancel: false
    },
    [ORDER_STATES.COMPLETED]: {
        label: 'Completed',
        description: 'Order has been completed successfully',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        icon: '🎉',
        progress: 100,
        isTerminal: true,
        canCancel: false
    },
    [ORDER_STATES.CANCELLED]: {
        label: 'Cancelled',
        description: 'Order has been cancelled',
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        icon: '❌',
        progress: 0,
        isTerminal: true,
        canCancel: false
    }
};

// Role-based permissions
export const ROLE_PERMISSIONS = {
    SELLER: {
        canUpdateStatus: true,
        canCancelOrder: true,
        canGeneratePickupCode: true,
        allowedTransitions: 'all' // Can perform all valid transitions
    },
    CUSTOMER: {
        canUpdateStatus: false,
        canCancelOrder: false, // Can request cancellation but not execute
        canGeneratePickupCode: false,
        allowedTransitions: [] // Cannot perform any transitions
    }
};

// Action definitions for each state and order type
export const STATE_ACTIONS = {
    [ORDER_TYPES.PICKUP]: {
        'pending': [
            {
                id: 'confirm_order',
                label: 'Confirm Order',
                targetState: 'confirmed',
                type: 'primary',
                icon: '✅',
                roles: ['SELLER']
            },
            {
                id: 'cancel',
                label: 'Cancel Order',
                targetState: 'cancelled',
                type: 'danger',
                icon: '❌',
                roles: ['SELLER'],
                requiresConfirmation: true
            }
        ],
        [ORDER_STATES.CONFIRMED]: [
            {
                id: 'mark_ready',
                label: 'Mark Ready for Pickup',
                targetState: ORDER_STATES.READY_FOR_PICKUP,
                type: 'primary',
                icon: '📦',
                roles: ['SELLER']
            },
            {
                id: 'cancel',
                label: 'Cancel Order',
                targetState: ORDER_STATES.CANCELLED,
                type: 'danger',
                icon: '❌',
                roles: ['SELLER'],
                requiresConfirmation: true
            }
        ],
        [ORDER_STATES.READY_FOR_PICKUP]: [
            {
                id: 'generate_code',
                label: 'Generate Pickup Code',
                action: 'generatePickupCode',
                type: 'primary',
                icon: '🔢',
                roles: ['SELLER']
            },
            {
                id: 'mark_picked_up',
                label: 'Mark Picked Up',
                targetState: ORDER_STATES.PICKED_UP,
                type: 'secondary',
                icon: '✅',
                roles: ['SELLER']
            },
            {
                id: 'cancel',
                label: 'Cancel Order',
                targetState: ORDER_STATES.CANCELLED,
                type: 'danger',
                icon: '❌',
                roles: ['SELLER'],
                requiresConfirmation: true
            }
        ],
        [ORDER_STATES.PICKED_UP]: [
            {
                id: 'mark_completed',
                label: 'Mark Completed',
                targetState: ORDER_STATES.COMPLETED,
                type: 'primary',
                icon: '🎉',
                roles: ['SELLER']
            }
        ],
        [ORDER_STATES.COMPLETED]: [],
        [ORDER_STATES.CANCELLED]: []
    },
    [ORDER_TYPES.DELIVERY]: {
        'pending': [
            {
                id: 'confirm_order',
                label: 'Confirm Order',
                targetState: 'confirmed',
                type: 'primary',
                icon: '✅',
                roles: ['SELLER']
            },
            {
                id: 'cancel',
                label: 'Cancel Order',
                targetState: 'cancelled',
                type: 'danger',
                icon: '❌',
                roles: ['SELLER'],
                requiresConfirmation: true
            }
        ],
        [ORDER_STATES.CONFIRMED]: [
            {
                id: 'mark_out_for_delivery',
                label: 'Mark Out for Delivery',
                targetState: ORDER_STATES.OUT_FOR_DELIVERY,
                type: 'primary',
                icon: '🚚',
                roles: ['SELLER']
            },
            {
                id: 'cancel',
                label: 'Cancel Order',
                targetState: ORDER_STATES.CANCELLED,
                type: 'danger',
                icon: '❌',
                roles: ['SELLER'],
                requiresConfirmation: true
            }
        ],
        [ORDER_STATES.OUT_FOR_DELIVERY]: [
            {
                id: 'mark_delivered',
                label: 'Mark Delivered',
                targetState: ORDER_STATES.DELIVERED,
                type: 'primary',
                icon: '🏠',
                roles: ['SELLER']
            }
        ],
        [ORDER_STATES.DELIVERED]: [
            {
                id: 'mark_completed',
                label: 'Mark Completed',
                targetState: ORDER_STATES.COMPLETED,
                type: 'primary',
                icon: '🎉',
                roles: ['SELLER']
            }
        ],
        [ORDER_STATES.COMPLETED]: [],
        [ORDER_STATES.CANCELLED]: []
    }
};

// Validation Functions
export const OrderStateValidator = {
    // Check if a transition is valid
    isValidTransition: (orderType, currentState, targetState) => {
        const transitions = STATE_TRANSITIONS[orderType];
        if (!transitions || !transitions[currentState]) {
            return false;
        }
        return transitions[currentState].includes(targetState);
    },

    // Check if a user role can perform an action
    canPerformAction: (action, userRole) => {
        return action.roles.includes(userRole);
    },

    // Get available actions for a specific order state and user role
    getAvailableActions: (orderType, currentState, userRole) => {
        const actions = STATE_ACTIONS[orderType]?.[currentState] || [];
        return actions.filter(action => OrderStateValidator.canPerformAction(action, userRole));
    },

    // Check if an order can be cancelled
    canCancelOrder: (currentState) => {
        const metadata = STATE_METADATA[currentState];
        return metadata?.canCancel || false;
    },

    // Check if a state is terminal
    isTerminalState: (currentState) => {
        const metadata = STATE_METADATA[currentState];
        return metadata?.isTerminal || false;
    },

    // Get next valid states for current state
    getNextValidStates: (orderType, currentState) => {
        return STATE_TRANSITIONS[orderType]?.[currentState] || [];
    },

    // Validate state transition with detailed error messages
    validateTransition: (orderType, currentState, targetState, userRole) => {
        const errors = [];

        // Check if transition is valid
        if (!OrderStateValidator.isValidTransition(orderType, currentState, targetState)) {
            errors.push(`Invalid transition from ${currentState} to ${targetState}`);
        }

        // Check if user has permission
        const actions = STATE_ACTIONS[orderType]?.[currentState] || [];
        const targetAction = actions.find(action => action.targetState === targetState);

        if (targetAction && !OrderStateValidator.canPerformAction(targetAction, userRole)) {
            errors.push(`User role ${userRole} is not authorized to perform this action`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// State Transition Manager
export class OrderStateManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    // Execute a state transition
    async executeTransition(orderId, orderType, currentState, targetState, userRole, additionalData = {}) {
        // Validate the transition
        const validation = OrderStateValidator.validateTransition(orderType, currentState, targetState, userRole);

        if (!validation.isValid) {
            throw new Error(`Transition validation failed: ${validation.errors.join(', ')}`);
        }

        // Prepare the request payload - backend expects just 'status' field
        const payload = {
            status: targetState
        };

        try {
            // Make API call to update order status
            const response = await this.apiClient.put(`/orders/${orderId}/status`, payload);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update order status');
            }

            return await response.json();
        } catch (error) {
            throw new Error(`Failed to execute transition: ${error.message}`);
        }
    }

    // Generate pickup code for pickup orders
    async generatePickupCode(orderId) {
        try {
            // For pickup codes, we need to move the order to 'ready_for_pickup' state
            // The backend will automatically generate the pickup code
            const response = await this.apiClient.put(`/orders/${orderId}/status`, {
                status: 'ready_for_pickup'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate pickup code');
            }

            return await response.json();
        } catch (error) {
            throw new Error(`Failed to generate pickup code: ${error.message}`);
        }
    }

    // Generate random 6-digit pickup code
    generateRandomCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Cancel an order
    async cancelOrder(orderId, reason = '') {
        try {
            const response = await this.apiClient.put(`/orders/${orderId}/status`, {
                status: ORDER_STATES.CANCELLED,
                reason,
                timestamp: new Date().toISOString()
            });

            if (!response.ok) {
                throw new Error('Failed to cancel order');
            }

            return await response.json();
        } catch (error) {
            throw new Error(`Failed to cancel order: ${error.message}`);
        }
    }

    // Get order history with timestamps
    async getOrderHistory(orderId) {
        try {
            const response = await this.apiClient.get(`/orders/${orderId}/history`);

            if (!response.ok) {
                throw new Error('Failed to fetch order history');
            }

            return await response.json();
        } catch (error) {
            throw new Error(`Failed to fetch order history: ${error.message}`);
        }
    }
}

// Helper functions for UI components
export const OrderUIHelpers = {
    // Get state metadata for display
    getStateMetadata: (state) => {
        return STATE_METADATA[state] || STATE_METADATA[ORDER_STATES.CONFIRMED];
    },

    // Get progress percentage for progress bars
    getProgressPercentage: (state) => {
        return STATE_METADATA[state]?.progress || 0;
    },

    // Get state color for UI elements
    getStateColor: (state) => {
        return STATE_METADATA[state]?.color || '#6B7280';
    },

    // Get state background color
    getStateBgColor: (state) => {
        return STATE_METADATA[state]?.bgColor || 'rgba(107, 114, 128, 0.1)';
    },

    // Format timestamp for display
    formatTimestamp: (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    },

    // Check if order is in active state
    isOrderActive: (state) => {
        return !STATE_METADATA[state]?.isTerminal;
    },

    // Get next action for customer display
    getNextActionForCustomer: (orderType, state) => {
        const metadata = STATE_METADATA[state];

        switch (orderType) {
            case ORDER_TYPES.PICKUP:
                if (state === ORDER_STATES.READY_FOR_PICKUP) {
                    return 'Show this code at store';
                } else if (state === ORDER_STATES.CONFIRMED) {
                    return 'Preparing your order';
                } else if (state === ORDER_STATES.PICKED_UP) {
                    return 'Order picked up successfully';
                }
                break;

            case ORDER_TYPES.DELIVERY:
                if (state === ORDER_STATES.OUT_FOR_DELIVERY) {
                    return 'Stay available for delivery';
                } else if (state === ORDER_STATES.CONFIRMED) {
                    return 'Preparing your order';
                } else if (state === ORDER_STATES.DELIVERED) {
                    return 'Order delivered successfully';
                }
                break;
        }

        return metadata?.description || 'Processing your order';
    }
};

export default {
    ORDER_TYPES,
    ORDER_STATES,
    STATE_TRANSITIONS,
    STATE_METADATA,
    ROLE_PERMISSIONS,
    STATE_ACTIONS,
    OrderStateValidator,
    OrderStateManager,
    OrderUIHelpers
};
