import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Order {
    id: string;
    total: number;
    status: string;
    items: Array<{ name: string; quantity: number }>;
    createdAt: string;
}

export default function PastOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
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

    // Fetch all orders
    useEffect(() => {
        if (!userEmail) return;

        const fetchOrders = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/orders/user/${userEmail}`);
                const data = await res.json();
                
                if (data.success && data.orders) {
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    // Sort descending (newest first) and keep only last 30 days
                    const sortedOrders = data.orders
                        .filter((o: any) => new Date(o.createdAt) >= thirtyDaysAgo)
                        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setOrders(sortedOrders);
                }
            } catch (err) {
                console.error("Failed to fetch past orders", err);
            }
        };

        fetchOrders();
    }, [userEmail]);

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                                <h2>Order History 📋</h2>
                                <p>View all your previous purchases here.</p>
                            </div>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#0c831f',
                                background: '#f3fcf4',
                                border: '1px solid #c3e6cb',
                                borderRadius: '20px',
                                padding: '4px 12px',
                                whiteSpace: 'nowrap',
                            }}>
                                🗓️ Orders saved for 30 days
                            </span>
                        </div>
                    </div>

                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧾</div>
                            <h3>No order history</h3>
                            <p>You haven't placed any orders yet.</p>
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="btn-save-profile" 
                                style={{ marginTop: '1.5rem', width: 'auto', padding: '0.8rem 2rem' }}>
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            {orders.map((order) => (
                                <div key={order.id} style={{ border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.2rem' }}>{order.id}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                            {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString()}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                            {order.items.length} item(s) • ₹{order.total.toFixed(2)}
                                        </div>
                                        <span style={{ 
                                            display: 'inline-block', 
                                            padding: '4px 12px', 
                                            borderRadius: '20px', 
                                            fontSize: '0.85rem', 
                                            fontWeight: 'bold', 
                                            backgroundColor: order.status === 'Delivered' ? '#d1fae5' : 'var(--action-light)', 
                                            color: order.status === 'Delivered' ? '#065f46' : 'var(--action-color)' 
                                        }}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <button 
                                        className="btn-save-profile" 
                                        style={{ 
                                            padding: '0.5rem 1rem', 
                                            fontSize: '0.9rem', 
                                            width: 'auto',
                                            backgroundColor: 'white',
                                            color: 'var(--action-color)',
                                            border: '1px solid var(--action-color)'
                                        }}
                                        onClick={() => navigate('/tracking', {
                                            state: { orderId: order.id, items: order.items, total: order.total }
                                        })}
                                    >
                                        View Details
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
