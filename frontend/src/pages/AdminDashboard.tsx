import { useState, useEffect, useRef } from 'react';
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
    { id: 'all', name: 'All Products', icon: '🏪' },
    { id: 'cat-oil', name: 'Oils & Ghee', icon: '🛢️' },
    { id: 'cat-grains', name: 'Grains, Atta & Rice', icon: '🌾' },
    { id: 'cat-chips', name: 'Chips & Namkeen', icon: '🥔' },
    { id: 'cat-biscuits', name: 'Biscuits & Cookies', icon: '🍪' },
    { id: 'cat-soap', name: 'Bath & Body', icon: '🧼' },
];

const ADMIN_NAV = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'orders', label: 'Orders', icon: '🚚' },
];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const sliderRef = useRef<HTMLDivElement>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeNav, setActiveNav] = useState<'overview' | 'products' | 'orders'>('overview');
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        originalPrice: '',
        delivery: '10 MINS',
        image: '',
        unit: '',
        categoryId: CATEGORIES[1].id
    });

    useEffect(() => {
        // --- Security Check: Restrict to Admin Email ---
        const savedUserStr = localStorage.getItem('user');
        if (!savedUserStr) {
            navigate('/login');
            return;
        }

        try {
            const savedUser = JSON.parse(savedUserStr);
            if (savedUser.email !== 'admin@bmart.com') {
                navigate('/dashboard');
                return;
            }
        } catch (e) {
            console.error('Failed to parse user session');
            navigate('/login');
            return;
        }

        // --- Fetch initial data if authorized ---
        fetchProducts();
        fetchOrders();
    }, [navigate]);

    const fetchOrders = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/orders');
            const data = await res.json();
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
            if (res.ok) fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
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
            setFormData({ name: '', price: '', originalPrice: '', delivery: '10 MINS', image: '', unit: '', categoryId: CATEGORIES[1].id });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => { setIsFormOpen(false); setEditingId(null); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            price: Number(formData.price),
            originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined
        };
        try {
            const url = editingId ? `http://localhost:5000/api/products/${editingId}` : 'http://localhost:5000/api/products';
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) { fetchProducts(); handleCloseForm(); }
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const getCategoryName = (id: string) => CATEGORIES.find(c => c.id === id)?.name || id;
    const getCategoryIcon = (id: string) => CATEGORIES.find(c => c.id === id)?.icon || '📦';

    // Filtered products
    const filteredProducts = products.filter(p => {
        const matchesCat = activeCategory === 'all' || p.categoryId === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    // Stats
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const pendingOrders = orders.filter(o => o.status !== 'Delivered').length;
    const codTotal = orders.filter(o => o.paymentMethod === 'cod').reduce((s, o) => s + o.total, 0);
    const onlineTotal = orders.filter(o => o.paymentMethod === 'online').reduce((s, o) => s + o.total, 0);

    const scrollSlider = (dir: 'left' | 'right') => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

    return (
        <div className="admin-shell">

            {/* ===== BLINKIT-STYLE HEADER ===== */}
            <header className="admin-header">
                {/* Top accent bar */}
                <div className="admin-accent-bar">
                    <span className="admin-live-badge">
                        <span className="admin-live-dot"></span>ADMIN
                    </span>
                    <span>⚡ B-Mart Admin Panel — Manage products, orders & deliveries</span>
                </div>

                {/* Main Nav */}
                <div className="admin-nav">
                    <div className="admin-nav-left">
                        <button
                            className={`admin-hamburger-btn ${isSidebarOpen ? 'open' : ''}`}
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
                            aria-label="Toggle sidebar"
                        >
                            <span className="hb-line top"></span>
                            <span className="hb-line mid"></span>
                            <span className="hb-line bot"></span>
                        </button>
                        <div className="admin-brand">
                            <span>🛒</span> B-Mart
                            <span className="admin-brand-badge">Admin</span>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="admin-search-bar">
                        <span>🔍</span>
                        <input
                            type="text"
                            placeholder="Search products, orders…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')}>✕</button>
                        )}
                    </div>

                    {/* Right Controls */}
                    <div className="admin-nav-right">
                        <button
                            className="admin-add-btn"
                            onClick={() => { setActiveNav('products'); handleOpenForm(); }}
                        >
                            + Add Product
                        </button>
                        <button className="admin-back-btn" onClick={() => navigate('/dashboard')}>
                            ← Store
                        </button>
                    </div>
                </div>
            </header>


            {/* Sidebar overlay — only on mobile/tablet */}
            {isSidebarOpen && window.innerWidth < 1024 && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ===== BODY: SIDEBAR + MAIN ===== */}
            <div className="admin-body">

                {/* Sidebar */}
                <aside className={`admin-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>

                    {/* Stats Quick View */}
                    <div className="admin-sidebar-stat">
                        <div className="asis-row">
                            <span className="asis-icon">📦</span>
                            <div>
                                <div className="asis-val">{products.length}</div>
                                <div className="asis-lbl">Products</div>
                            </div>
                        </div>
                    </div>
                    <div className="admin-sidebar-stat green">
                        <div className="asis-row">
                            <span className="asis-icon">🚚</span>
                            <div>
                                <div className="asis-val">{orders.length}</div>
                                <div className="asis-lbl">Total Orders</div>
                            </div>
                        </div>
                    </div>
                    <div className="admin-sidebar-stat orange">
                        <div className="asis-row">
                            <span className="asis-icon">⏳</span>
                            <div>
                                <div className="asis-val">{pendingOrders}</div>
                                <div className="asis-lbl">Pending</div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-sidebar-divider"></div>

                    {/* Nav Links */}
                    <nav className="admin-sidebar-nav">
                        {ADMIN_NAV.map(item => (
                            <button
                                key={item.id}
                                className={`admin-nav-item ${activeNav === item.id ? 'active' : ''}`}
                                onClick={() => setActiveNav(item.id as any)}
                            >
                                <span className="ani-icon">{item.icon}</span>
                                {isSidebarOpen && <span>{item.label}</span>}
                                {activeNav === item.id && <span className="ani-dot"></span>}
                            </button>
                        ))}
                    </nav>

                    <div className="admin-sidebar-divider"></div>

                    {/* Category Quick Nav */}
                    {isSidebarOpen && (
                        <div className="admin-sidebar-cats">
                            <div className="asc-title">📂 Categories</div>
                            {CATEGORIES.slice(1).map(cat => (
                                <button
                                    key={cat.id}
                                    className={`asc-item ${activeCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => { setActiveCategory(cat.id); setActiveNav('products'); }}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.name}</span>
                                    <span className="asc-count">{products.filter(p => p.categoryId === cat.id).length}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                {/* ===== MAIN CONTENT ===== */}
                <main className="admin-main">

                    {/* OVERVIEW TAB */}
                    {activeNav === 'overview' && (
                        <div>
                            <div className="admin-section-title">📊 Dashboard Overview</div>

                            {/* Stat Cards */}
                            <div className="admin-stats-grid">
                                <div className="admin-stat-card purple">
                                    <div className="asc-top">
                                        <span className="asc-emoji">📦</span>
                                        <div className="asc-label">Active Products</div>
                                    </div>
                                    <div className="asc-big">{products.length}</div>
                                    <div className="asc-sub">Items in catalog</div>
                                    <div className="asc-actions">
                                        <button onClick={() => setActiveNav('products')}>View All</button>
                                        <button onClick={() => { setActiveNav('products'); handleOpenForm(); }}>+ Add</button>
                                    </div>
                                </div>

                                <div className="admin-stat-card amber">
                                    <div className="asc-top">
                                        <span className="asc-emoji">💳</span>
                                        <div className="asc-label">Total Revenue</div>
                                    </div>
                                    <div className="asc-big">₹{totalRevenue.toFixed(0)}</div>
                                    <div className="asc-sub-row">
                                        <span className="badge-cod">COD ₹{codTotal.toFixed(0)}</span>
                                        <span className="badge-online">Online ₹{onlineTotal.toFixed(0)}</span>
                                    </div>
                                </div>

                                <div className="admin-stat-card teal">
                                    <div className="asc-top">
                                        <span className="asc-emoji">🚚</span>
                                        <div className="asc-label">Pending Dispatches</div>
                                    </div>
                                    <div className="asc-big">{pendingOrders}</div>
                                    <div className="asc-sub">Out of {orders.length} orders</div>
                                    <div className="asc-actions">
                                        <button onClick={() => setActiveNav('orders')}>Manage Orders</button>
                                    </div>
                                </div>

                                <div className="admin-stat-card green">
                                    <div className="asc-top">
                                        <span className="asc-emoji">✅</span>
                                        <div className="asc-label">Delivered</div>
                                    </div>
                                    <div className="asc-big">{orders.filter(o => o.status === 'Delivered').length}</div>
                                    <div className="asc-sub">Successfully completed</div>
                                </div>
                            </div>

                            {/* Recent Orders Quick View */}
                            <div className="admin-section-title" style={{ marginTop: '2rem' }}>🕐 Recent Orders</div>
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Total</th>
                                            <th>Payment</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.slice(0, 5).map(order => (
                                            <tr key={order.id}>
                                                <td><span className="order-id-chip">{order.id}</span></td>
                                                <td>{order.customerName}</td>
                                                <td><strong>₹{order.total?.toFixed(2)}</strong></td>
                                                <td>
                                                    <span className={order.paymentMethod === 'cod' ? 'badge-cod' : 'badge-online'}>
                                                        {order.paymentMethod === 'cod' ? 'COD' : 'Online'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge status-${order.status?.toLowerCase().replace(/\s/g, '-')}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && (
                                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No orders yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* PRODUCTS TAB */}
                    {activeNav === 'products' && (
                        <div>
                            <div className="admin-section-header">
                                <div className="admin-section-title">
                                    📦 Products
                                    <span className="section-count">{filteredProducts.length}</span>
                                </div>
                                <button className="btn-primary-admin" onClick={() => handleOpenForm()}>
                                    + Add Product
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="admin-loading">
                                    <div className="admin-spinner"></div>
                                    <span>Loading products…</span>
                                </div>
                            ) : (
                                <div className="admin-table-wrap">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Image</th>
                                                <th>Name</th>
                                                <th>Category</th>
                                                <th>Unit</th>
                                                <th>Price</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredProducts.length === 0 ? (
                                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No products found.</td></tr>
                                            ) : (
                                                filteredProducts.map(product => (
                                                    <tr key={product._id}>
                                                        <td>
                                                            <div className="prod-thumb">
                                                                {product.image.startsWith('http') || product.image.startsWith('data:')
                                                                    ? <img src={product.image} alt={product.name} />
                                                                    : <span style={{ fontSize: '0.75rem', color: '#aaa' }}>IMG</span>
                                                                }
                                                            </div>
                                                        </td>
                                                        <td><span className="prod-name">{product.name}</span></td>
                                                        <td>
                                                            <span className="cat-pill">
                                                                {getCategoryIcon(product.categoryId)} {getCategoryName(product.categoryId)}
                                                            </span>
                                                        </td>
                                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{product.unit}</td>
                                                        <td>
                                                            <div className="price-col">
                                                                <span className="price-main">₹{product.price}</span>
                                                                {product.originalPrice && <span className="price-old">₹{product.originalPrice}</span>}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="action-btns">
                                                                <button className="btn-edit" onClick={() => handleOpenForm(product)}>✏️ Edit</button>
                                                                <button className="btn-delete" onClick={() => handleDelete(product._id)}>🗑️ Delete</button>
                                                            </div>
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

                    {/* ORDERS TAB */}
                    {activeNav === 'orders' && (
                        <div>
                            <div className="admin-section-header">
                                <div className="admin-section-title">
                                    🚚 Orders
                                    <span className="section-count">{orders.length}</span>
                                </div>
                                <button className="btn-primary-admin" onClick={fetchOrders}>↻ Refresh</button>
                            </div>

                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Total</th>
                                            <th>Payment</th>
                                            <th>Date</th>
                                            <th style={{ textAlign: 'right' }}>Delivery Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.length === 0 ? (
                                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No orders placed yet.</td></tr>
                                        ) : (
                                            orders.map(order => (
                                                <tr key={order.id}>
                                                    <td><span className="order-id-chip">{order.id}</span></td>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.phoneNumber}</div>
                                                    </td>
                                                    <td><strong>₹{order.total?.toFixed(2)}</strong></td>
                                                    <td>
                                                        <span className={order.paymentMethod === 'cod' ? 'badge-cod' : 'badge-online'}>
                                                            {order.paymentMethod === 'cod' ? '💵 COD' : '📱 Online'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                        {new Date(order.createdAt).toLocaleString()}
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="status-select"
                                                            value={order.status}
                                                            onChange={e => updateOrderStatus(order.id, e.target.value)}
                                                            data-status={order.status}
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

                </main>
            </div>

            {/* ===== ADD/EDIT MODAL ===== */}
            {isFormOpen && (
                <div className="admin-modal-overlay" onClick={handleCloseForm}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>{editingId ? '✏️ Edit Product' : '➕ Add New Product'}</h2>
                            <button className="modal-close-btn" onClick={handleCloseForm}>✕</button>
                        </div>

                        <form onSubmit={handleSave} className="admin-form">
                            <div className="form-row">
                                <div className="form-field">
                                    <label>Product Name *</label>
                                    <input required type="text" value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Fortune Sunflower Oil" />
                                </div>
                            </div>

                            <div className="form-row two-col">
                                <div className="form-field">
                                    <label>Price (₹) *</label>
                                    <input required type="number" step="0.01" value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="e.g. 120" />
                                </div>
                                <div className="form-field">
                                    <label>Original Price (₹) — Optional</label>
                                    <input type="number" step="0.01" value={formData.originalPrice}
                                        onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
                                        placeholder="e.g. 150" />
                                </div>
                            </div>

                            <div className="form-row two-col">
                                <div className="form-field">
                                    <label>Unit *</label>
                                    <input required type="text" value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                        placeholder="e.g. 1L, 500g" />
                                </div>
                                <div className="form-field">
                                    <label>Delivery Time *</label>
                                    <input required type="text" value={formData.delivery}
                                        onChange={e => setFormData({ ...formData, delivery: e.target.value })}
                                        placeholder="e.g. 10 MINS" />
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Category *</label>
                                <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                                    {CATEGORIES.slice(1).map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-field">
                                <label>Image URL *</label>
                                <input required type="text" value={formData.image}
                                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                                    placeholder="https://... or data:image/..." />
                                <small>Paste a direct image URL or base64 string.</small>
                            </div>

                            {formData.image && (formData.image.startsWith('http') || formData.image.startsWith('data:')) && (
                                <div className="form-preview">
                                    <img src={formData.image} alt="preview" />
                                    <span>Image Preview</span>
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={handleCloseForm}>Cancel</button>
                                <button type="submit" className="btn-save">
                                    {editingId ? '💾 Save Changes' : '➕ Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
