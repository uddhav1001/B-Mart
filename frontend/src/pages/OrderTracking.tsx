import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CartItem } from '../context/CartContext';

interface LocationState {
    items: CartItem[];
    total: number;
    orderId: string;
}

const TRACKING_STEPS = [
    { id: 'placed', label: 'Order Placed', time: '10:00 AM' },
    { id: 'packed', label: 'Order Packed', time: '10:02 AM' },
    { id: 'on_way', label: 'Out for Delivery', time: '10:05 AM' },
    { id: 'delivered', label: 'Delivered', time: '10:10 AM' }
];

export default function OrderTracking() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as LocationState;

    // Default mock data if accessed directly without cart state
    const items = state?.items || [];
    const total = state?.total || 0;
    const orderId = state?.orderId || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Redirect if no items and no state (prevents blank page on direct URL visit)
        if (!state && items.length === 0) {
            navigate('/dashboard');
            return;
        }

        const fetchOrderStatus = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/orders/${orderId}`);
                const data = await response.json();
                
                if (data.success && data.order) {
                    // Map Status String to Step Index
                    const statusMap: { [key: string]: number } = {
                        'Processing': 0,
                        'Packing': 1,
                        'On the Way': 2,
                        'Delivered': 3
                    };
                    
                    const newStep = statusMap[data.order.status];
                    if (newStep !== undefined && newStep !== currentStep) {
                        setCurrentStep(newStep);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch order status:", error);
            }
        };

        // Poll immediately, then every 3 seconds
        fetchOrderStatus();
        const pollInterval = setInterval(fetchOrderStatus, 3000);

        return () => clearInterval(pollInterval);
    }, [navigate, state, items.length, orderId, currentStep]);

    return (
        <div className="dashboard-container" style={{ backgroundColor: '#f4f6f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Minimal Header */}
            <header style={{ backgroundColor: 'white', padding: '1rem 2rem', borderBottom: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    ←
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Tracking Order: {orderId}</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Arriving in 10 minutes</p>
                </div>
            </header>

            <main style={{ maxWidth: '800px', width: '100%', margin: '2rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>

                {/* Visual Tracker Banner */}
                <section style={{ backgroundColor: currentStep === 3 ? '#e6f4ea' : 'white', borderRadius: '12px', padding: '2rem', boxShadow: 'var(--shadow-sm)', transition: 'background-color 0.5s ease' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.8rem', color: currentStep === 3 ? 'var(--action-color)' : 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            {currentStep === 3 ? 'Order Delivered! 🎉' : 'Arriving in 10 mins'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                            {currentStep === 0 && 'We have received your order.'}
                            {currentStep === 1 && 'Your items are packed and ready.'}
                            {currentStep === 2 && 'Our delivery partner is on the way.'}
                            {currentStep === 3 && 'Enjoy your items!'}
                        </p>
                    </div>

                    {/* Progress Bar Container */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '3rem' }}>

                        {/* Background Track */}
                        <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '4px', backgroundColor: '#e8e8e8', zIndex: 0 }}></div>

                        {/* Active Fill Track */}
                        <div style={{
                            position: 'absolute', top: '15px', left: '10%',
                            width: `${(currentStep / (TRACKING_STEPS.length - 1)) * 80}%`,
                            height: '4px', backgroundColor: 'var(--action-color)',
                            zIndex: 1, transition: 'width 0.8s ease-in-out'
                        }}></div>

                        {TRACKING_STEPS.map((step, index) => {
                            const isCompleted = index <= currentStep;
                            const isActive = index === currentStep;

                            return (
                                <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '25%' }}>
                                    <div style={{
                                        width: '34px', height: '34px',
                                        borderRadius: '50%',
                                        backgroundColor: isCompleted ? 'var(--action-color)' : 'white',
                                        border: `3px solid ${isCompleted ? 'var(--action-color)' : '#d1d5db'}`,
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        color: isCompleted ? 'white' : '#9ca3af',
                                        fontWeight: 'bold',
                                        marginBottom: '0.5rem',
                                        transition: 'all 0.3s ease',
                                        boxShadow: isActive ? '0 0 0 4px rgba(12, 131, 31, 0.2)' : 'none'
                                    }}>
                                        {isCompleted ? '✓' : index + 1}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 'bold' : 'normal', color: isCompleted ? 'var(--text-primary)' : 'var(--text-tertiary)', textAlign: 'center' }}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Order Summary */}
                <section style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem' }}>Order Details</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {items.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', padding: '4px' }}>
                                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '500' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.unit} x {item.quantity}</div>
                                    </div>
                                </div>
                                <div style={{ fontWeight: '600' }}>₹{(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                        ))}
                    </div >

                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Total Paid</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--action-color)' }}>₹{total.toFixed(2)}</span>
                    </div>
                </section >

            </main >
        </div >
    );
}
