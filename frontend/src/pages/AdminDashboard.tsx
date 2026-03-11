import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Product {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    delivery: string;
    image: string;
    unit: string;
    categoryId: string;
}

const CATEGORIES = [
    { id: 'cat-oil', name: 'Oils & Ghee' },
    { id: 'cat-grains', name: 'Grains, Atta & Rice' },
    { id: 'cat-chips', name: 'Chips & Namkeen' },
    { id: 'cat-biscuits', name: 'Biscuits & Cookies' },
    { id: 'cat-soap', name: 'Bath & Body' },
];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const [showOrdersTable, setShowOrdersTable] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        originalPrice: '',
        delivery: '10 MINS',
        image: '',
        unit: '',
        categoryId: CATEGORIES[0].id
    });

    useEffect(() => {
        fetchProducts();
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/orders');
            const data = await res.json();
            // Sort to show highest pending first
            const sortedData = data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(sortedData);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                // Refresh both orders and products data just in case
                fetchOrders();
            } else {
                console.error("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/products');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (product?: Product) => {
        if (product) {
            setEditingId(product._id);
            setFormData({
                name: product.name,
                price: product.price.toString(),
                originalPrice: product.originalPrice?.toString() || '',
                delivery: product.delivery,
                image: product.image,
                unit: product.unit,
                categoryId: product.categoryId
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                price: '',
                originalPrice: '',
                delivery: '10 MINS',
                image: '',
                unit: '',
                categoryId: CATEGORIES[0].id
            });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            price: Number(formData.price),
            originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined
        };

        try {
            const url = editingId
                ? `http://localhost:5000/api/products/${editingId}`
                : 'http://localhost:5000/api/products';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                fetchProducts();
                handleCloseForm();
            } else {
                console.error('Failed to save product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchProducts();
            } else {
                console.error('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const getCategoryName = (id: string) => {
        const cat = CATEGORIES.find(c => c.id === id);
        return cat ? cat.name : id;
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                    >
                        ← Back to Shopping
                    </button>
                    <h1 style={{ margin: 0 }}>Admin Dashboard: Product Management</h1>
                </div>
            </div>

            {/* Dashboard Status Header Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', padding: '1.5rem', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: '600', opacity: 0.9 }}>📦 Product Status</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            {products.length} <span style={{ fontSize: '1rem', fontWeight: '400', opacity: 0.8 }}>Active Items</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
                        <button onClick={() => setShowTable(!showTable)} style={{ color: 'white', border: 'none', background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>{showTable ? 'Hide Table' : 'View All'}</button>
                        <button onClick={() => handleOpenForm()} style={{ color: 'white', border: 'none', background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>+ Add New</button>
                    </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', padding: '1.5rem', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: '600', opacity: 0.9 }}>💳 Payment Status</div>

                        {/* Calculate the Totals Dynamically */}
                        {(() => {
                            const codOrders = orders.filter(o => o.paymentMethod === 'cod');
                            const onlineOrders = orders.filter(o => o.paymentMethod === 'online');

                            const codTotal = codOrders.reduce((sum, order) => sum + order.total, 0);
                            const onlineTotal = onlineOrders.reduce((sum, order) => sum + order.total, 0);
                            const grandTotal = codTotal + onlineTotal;

                            return (
                                <>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '800', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                        ₹{grandTotal.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: '400', opacity: 0.8 }}>Total Revenue</span>
                                    </div>
                                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.25)', padding: '4px 8px', borderRadius: '4px' }}>
                                            ⚠️ Due (COD): ₹{codTotal.toFixed(2)}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.25)', padding: '4px 8px', borderRadius: '4px' }}>
                                            ✅ Done (Online): ₹{onlineTotal.toFixed(2)}
                                        </span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', padding: '1.5rem', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: '600', opacity: 0.9 }}>🚚 Delivery Status</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            {orders.filter(o => o.status !== 'Delivered').length} <span style={{ fontSize: '1rem', fontWeight: '400', opacity: 0.8 }}>Pending Dispatches</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
                        <button onClick={() => setShowOrdersTable(!showOrdersTable)} style={{ color: 'white', border: 'none', background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                            {showOrdersTable ? 'Hide Orders' : 'Manage Orders'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Orders Table - Conditionally Rendered */}
            {showOrdersTable && (
                <div id="orders-table" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '2rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Order ID</th>
                                <th style={{ padding: '1rem' }}>Customer</th>
                                <th style={{ padding: '1rem' }}>Total</th>
                                <th style={{ padding: '1rem' }}>Payment</th>
                                <th style={{ padding: '1rem' }}>Date</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Delivery Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>No orders placed yet.</td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{order.id}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '500' }}>{order.customerName}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>{order.phoneNumber}</div>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{order.total.toFixed(2)}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {order.paymentMethod === 'cod' ? (
                                                <span style={{ fontSize: '0.85rem', background: '#ffeeba', color: '#856404', padding: '4px 8px', borderRadius: '4px' }}>COD</span>
                                            ) : (
                                                <span style={{ fontSize: '0.85rem', background: '#d4edda', color: '#155724', padding: '4px 8px', borderRadius: '4px' }}>Online</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#6c757d', fontSize: '0.9rem' }}>
                                            {new Date(order.createdAt).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <select 
                                                value={order.status} 
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                style={{ 
                                                    padding: '6px 10px', 
                                                    borderRadius: '6px', 
                                                    border: order.status === 'Delivered' ? '1px solid #28a745' : '1px solid #007bff',
                                                    background: order.status === 'Delivered' ? '#d4edda' : '#e7f1ff',
                                                    color: order.status === 'Delivered' ? '#155724' : '#004085',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="Processing">⏳ Processing</option>
                                                <option value="Packing">📦 Packing</option>
                                                <option value="On the Way">🚚 On the Way</option>
                                                <option value="Delivered">✅ Delivered</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* Product Table - Conditionally Rendered */}
            {showTable && (
                <div id="product-table" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading products...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>Image</th>
                                    <th style={{ padding: '1rem' }}>Name</th>
                                    <th style={{ padding: '1rem' }}>Category</th>
                                    <th style={{ padding: '1rem' }}>Unit</th>
                                    <th style={{ padding: '1rem' }}>Price</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>No products found. Add one to get started!</td>
                                    </tr>
                                ) : (
                                    products.map(product => (
                                        <tr key={product._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ width: '50px', height: '50px', background: '#f8f9fa', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                                    {product.image.startsWith('http') || product.image.startsWith('data:')
                                                        ? <img src={product.image} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                        : <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Local Img</span>
                                                    }
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: '500' }}>{product.name}</td>
                                            <td style={{ padding: '1rem', color: '#495057' }}>{getCategoryName(product.categoryId)}</td>
                                            <td style={{ padding: '1rem', color: '#495057' }}>{product.unit}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 'bold' }}>₹{product.price}</div>
                                                {product.originalPrice && <div style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: '#adb5bd' }}>₹{product.originalPrice}</div>}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => handleOpenForm(product)}
                                                    style={{ marginRight: '0.5rem', padding: '6px 12px', borderRadius: '4px', border: '1px solid #007bff', background: 'transparent', color: '#007bff', cursor: 'pointer' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #dc3545', background: 'transparent', color: '#dc3545', cursor: 'pointer' }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isFormOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>{editingId ? 'Edit Product' : 'Add New Product'}</h2>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Product Name</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Price (₹)</label>
                                    <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Original Price (₹) - Optional</label>
                                    <input type="number" step="0.01" value={formData.originalPrice} onChange={e => setFormData({ ...formData, originalPrice: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Unit (e.g., 1L, 5kg)</label>
                                    <input required type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Delivery Time</label>
                                    <input required type="text" value={formData.delivery} onChange={e => setFormData({ ...formData, delivery: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Category</label>
                                <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Image URL</label>
                                <input required type="text" placeholder="https://..." value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                <small style={{ color: '#6c757d', display: 'block', marginTop: '0.25rem' }}>For now, paste a direct URL to an image or a base64 string.</small>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={handleCloseForm} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--action-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
