import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ActiveOrder {
    id: string;
    total: number;
    status: string;
    items: Array<{ name: string; quantity: number }>;
}

export default function ActiveOrders() {
    const navigate = useNavigate();
    const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
    const [userEmail, setUserEmail] = useState<string>('');

    useEffect(() => {
        // Check authentication and get email
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const savedUserStr = localStorage.getItem('user');
        if (savedUserStr) {
            try {
                const parsedUser = JSON.parse(savedUserStr);
                if (parsedUser.email) {
                    setUserEmail(parsedUser.email);
                }
            } catch (e) {
                console.error("Failed to parse user from localStorage");
            }
        }
    }, [navigate]);

    // Poll for active orders
    useEffect(() => {
        if (!userEmail) return;

        const fetchOrders = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/orders/user/${userEmail}`);
                const data = await res.json();
                
                if (data.success && data.orders) {
                    // Filter out delivered orders to only show Active ones
                    const nonDelivered = data.orders.filter((o: any) => o.status !== 'Delivered');
                    
                    // Only update state if something actually changed to prevent re-renders
                    if (JSON.stringify(nonDelivered) !== JSON.stringify(activeOrders)) {
                        setActiveOrders(nonDelivered);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch active orders", err);
            }
        };

        fetchOrders();
        const pollInterval = setInterval(fetchOrders, 3000);
        return () => clearInterval(pollInterval);
    }, [userEmail, activeOrders]);

    return (
        <div className="profile-page-container" style={{ minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
            <nav className="dashboard-nav" style={{ justifyContent: 'flex-start', gap: '2rem' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                    ← Back to Shopping
                </button>
                <div className="nav-brand" style={{ fontStyle: 'normal', fontSize: '1.5rem' }}>
                    B-Mart
                </div>
            </nav>

            <div className="profile-content" style={{ padding: '2rem' }}>
                <div className="profile-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="profile-header">
                        <h2>My Active Orders 🛒</h2>
                        <p>Track your ongoing deliveries right here.</p>
                    </div>

                    {activeOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                            <h3>No active deliveries</h3>
                            <p>Any orders you place will show up here until they are delivered!</p>
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="btn-save-profile" 
                                style={{ marginTop: '1.5rem', width: 'auto', padding: '0.8rem 2rem' }}>
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            {activeOrders.map((order) => (
                                <div key={order.id} style={{ border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{order.id}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                            {order.items.length} item(s) • ₹{order.total.toFixed(2)}
                                        </div>
                                        <span style={{ 
                                            display: 'inline-block', 
                                            padding: '4px 12px', 
                                            borderRadius: '20px', 
                                            fontSize: '0.85rem', 
                                            fontWeight: 'bold', 
                                            backgroundColor: 'var(--action-light)', 
                                            color: 'var(--action-color)' 
                                        }}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <button 
                                        className="btn-save-profile" 
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto' }}
                                        onClick={() => navigate('/tracking', {
                                            state: { orderId: order.id, items: order.items, total: order.total }
                                        })}
                                    >
                                        Track Live
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
