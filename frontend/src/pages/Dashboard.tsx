import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

// Blinkit Categories - Indian Grocery Focus
const CATEGORIES = [
    { id: 'cat-oil',      name: 'Oils & Ghee',          image: 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcT3lKy6TyothXGaOYEHK8MgOkvbQgmrpeK7td6EhTN5ySRCLwdhy6dVq9USNWMbuJczwmXQRq5Vrxkv8sz3AWoAdKkE9QGW',  color: '#ff8c42', bg: 'linear-gradient(135deg, #fff3e8 0%, #ffe0c8 100%)', tag: 'Kitchen' },
    { id: 'cat-grains',  name: 'Grains, Atta & Rice',   image: 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSGkREYDe-LWlLxH3Z8VRpXzku1hjgGcfyfFPte-Mazo5tBJgelsEN1Iiem9mVUtRquu3muy_s6glacKN9dTq_6lKEJO9Ino4cg-ThyxG7bxmXTVXPlk4LAEg', color: '#a67c52', bg: 'linear-gradient(135deg, #fdf6ec 0%, #f5e9d5 100%)', tag: 'Staples' },
    { id: 'cat-chips',   name: 'Chips & Namkeen',        image: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQRruMrqIuD-VqpLEIzvZOmEXlXq3m6CmK0P864mW3pc5OjyrGq8F31aFGm1kyQivWSBQqaskaYkEtkPUHsjNGrQo2AqOplcQ', color: '#e53935', bg: 'linear-gradient(135deg, #fff0ef 0%, #ffd9d6 100%)', tag: 'Snacks' },
    { id: 'cat-biscuits',name: 'Biscuits & Cookies',     image: 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcS-dwdLU2M0VIbfx5E7A1j5a_OcGMj4Fe4ncJ3BubH9zJmuoxU01NUj7iZm4sVuT2HXyttxy79-wNXHEZ7LM5WVb1IIzp8c4HtcluJKsL_sm6JG1-bDR2BQoc0', color: '#6d4c41', bg: 'linear-gradient(135deg, #fdf3ee 0%, #f5ddd1 100%)', tag: 'Sweet' },
    { id: 'cat-soap',    name: 'Bath & Body',            image: 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQgk8m_v8cVI8nKdInUgb4oPA0BGsNzsiepu1YlOE_QXnXNjXOgY-MCvfcpmN8tbtULPozpULIKSORRmbJtMNvSXIPPPnXk',  color: '#039be5', bg: 'linear-gradient(135deg, #e8f6ff 0%, #cce8fa 100%)', tag: 'Care' },
];

// Interface for Product data from API
interface Product {
    _id: string; // The database ID (string from MongoDB)
    id: string;  // The ID used by cart context
    name: string;
    price: number;
    originalPrice?: number;
    delivery: string;
    image: string;
    unit: string;
    categoryId: string;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState<string>('Login');
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);

    // Address State
    const [userId, setUserId] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');
    const [userAddress, setUserAddress] = useState<string>('B-Mart Hub, Downtown');
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editAddressInput, setEditAddressInput] = useState('');
    const [addressError, setAddressError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isGroceryOpen, setIsGroceryOpen] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth < 1024);

    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal } = useContext(CartContext);

    // Refs for smooth scrolling to sections
    const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
    const sliderRef = useRef<HTMLDivElement>(null);

    const scrollSlider = (dir: 'left' | 'right') => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        // Read user from localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                if (parsedUser.username) {
                    setUserName(parsedUser.username);
                }
                if (parsedUser.id) {
                    setUserId(parsedUser.id);
                }
                if (parsedUser.email) {
                    setUserEmail(parsedUser.email);
                }
                if (parsedUser.address) {
                    setUserAddress(parsedUser.address);
                }
            } catch (e) {
                console.error("Failed to parse user from localStorage");
            }
        } else {
            navigate('/login');
        }

        // Fetch products from database
        const fetchProducts = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/products');
                const data = await res.json();

                // Map _id to id for the cart context compatibility
                const mappedProducts = data.map((p: any) => ({
                    ...p,
                    id: p._id
                }));

                setProducts(mappedProducts);
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        fetchProducts();
    }, [navigate]);

    const handleSaveAddress = async () => {
        setAddressError('');
        if (!editAddressInput.trim() || !userId) {
            setIsAddressModalOpen(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/auth/address', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, address: editAddressInput.trim() })
            });

            if (res.ok) {
                const data = await res.json();
                setUserAddress(data.user.address);

                // Update local storage
                const savedUserStr = localStorage.getItem('user');
                if (savedUserStr) {
                    const savedUser = JSON.parse(savedUserStr);
                    savedUser.address = data.user.address;
                    localStorage.setItem('user', JSON.stringify(savedUser));
                }
                setIsAddressModalOpen(false);
            } else {
                setAddressError('Failed to save. Has your backend restarted?');
            }
        } catch (err) {
            console.error('Failed to save address:', err);
            setAddressError('Network error. Is your backend running?');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const scrollToCategory = (categoryId: string) => {
        setActiveCategory(categoryId);
        const element = sectionRefs.current[categoryId];
        if (element) {
            const yOffset = -80;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

        try {
            await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    items: cart,
                    total: subtotal,
                    paymentMethod,
                    customerName: userName,
                    email: userEmail,
                    phoneNumber: null
                })
            });
        } catch (e) {
            console.error("Failed to notify backend of new order", e);
        }

        navigate('/tracking', {
            state: {
                items: [...cart],
                total: subtotal,
                orderId: orderId,
                paymentMethod: paymentMethod
            }
        });

        clearCart();
        setIsCartOpen(false);
    };

    return (
        <div className="dashboard-container">

            {/* ===== ENHANCED HEADER ===== */}
            <header className="dashboard-header">
                {/* Top accent bar */}
                <div className="header-accent-bar">
                    <span className="live-badge">
                        <span className="live-dot"></span>
                        LIVE
                    </span>
                    <span className="accent-bar-text">⚡ Express delivery in under 10 minutes — now available!</span>
                </div>

                {/* Main Nav */}
                <nav className="dashboard-nav">
                    <div className="nav-left-group">
                        {/* Sidebar toggle */}
                        <button
                            className="sidebar-toggle-btn"
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            title="Toggle sidebar"
                        >
                            <span className={`hamburger-icon ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                                <span></span><span></span><span></span>
                            </span>
                        </button>

                        <div className="nav-brand" style={{ fontStyle: 'normal' }}>
                            <span className="brand-icon">🛒</span>
                            B-Mart
                        </div>

                        {/* Delivery Info */}
                        <div
                            className="nav-delivery-info"
                            onClick={() => {
                                setEditAddressInput(userAddress);
                                setIsAddressModalOpen(true);
                            }}
                            title="Click to edit address"
                        >
                            <div className="delivery-label">
                                <span className="delivery-timer-icon">⏱️</span>
                                <span className="nav-delivery-time">Delivery in 10 minutes</span>
                            </div>
                            <span className="nav-delivery-location">
                                <span>📍</span> {userAddress} <span className="edit-hint">▾</span>
                            </span>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="nav-search-container">
                        <span className="search-icon-wrap">🔍</span>
                        <input
                            type="text"
                            className="nav-search-input"
                            placeholder="Search for groceries, snacks, essentials…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="search-clear-btn"
                                onClick={() => setSearchQuery('')}
                            >✕</button>
                        )}
                    </div>

                    {/* Right Controls */}
                    <div className="nav-controls">
                        {/* Profile */}
                        <div className="user-profile-container">
                            <button
                                className="user-profile-trigger"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            >
                                <div className="user-avatar">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-info-col">
                                    <span className="user-greeting-label">Hello,</span>
                                    <span className="user-greeting">{userName}</span>
                                </div>
                                <span className="avatar-chevron">▾</span>
                            </button>

                            {isProfileOpen && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-user-header">
                                        <div className="dropdown-avatar">
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="dropdown-username">{userName}</div>
                                            <div className="dropdown-email">{userEmail}</div>
                                        </div>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item" onClick={() => navigate('/profile')}>
                                        <span>👤</span> My Profile
                                    </button>
                                    <button className="dropdown-item" onClick={() => navigate('/active-orders')}>
                                        <span>🛒</span> Active Orders
                                    </button>
                                    <button className="dropdown-item" onClick={() => navigate('/past-orders')}>
                                        <span>📋</span> Order History
                                    </button>
                                    <div className="dropdown-divider"></div>

                                    {/* Security: Only show Admin Dashboard if email matches */}
                                    {userEmail === 'admin@bmart.com' && (
                                        <>
                                            <button className="dropdown-item" onClick={() => navigate('/admin')}>
                                                <span>⚙️</span> Admin Dashboard
                                            </button>
                                            <div className="dropdown-divider"></div>
                                        </>
                                    )}

                                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                                        <span>🚪</span> Logout
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Cart Button */}
                        <button className="btn-cart" onClick={() => setIsCartOpen(true)}>
                            <span className="cart-icon-wrapper">
                                🛒
                                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                            </span>
                            <span className="cart-btn-text">
                                {totalItems > 0
                                    ? <><strong>{totalItems} Items</strong> | ₹{subtotal.toFixed(2)}</>
                                    : 'My Cart'
                                }
                            </span>
                        </button>
                    </div>
                </nav>
            </header>

            {/* Mobile sidebar overlay */}
            {!isSidebarCollapsed && window.innerWidth < 1024 && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarCollapsed(true)}
                />
            )}

            {/* Main Layout */}
            <div className="dashboard-body">

                {/* ===== ENHANCED SIDEBAR ===== */}
                <aside className={`categories-sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

                    {/* Sidebar Categories */}
                    <div className="sidebar-section">
                        {!isSidebarCollapsed && (
                            <div className="sidebar-section-title">
                                <span>🧺</span> Shop by Category
                            </div>
                        )}

                        {/* Grocery Group */}
                        <div className="parent-category">
                            {!isSidebarCollapsed && (
                                <div
                                    className="category-header-btn"
                                    onClick={() => setIsGroceryOpen(!isGroceryOpen)}
                                >
                                    <div className="cat-header-left">
                                        <span className="cat-parent-icon">🛍️</span>
                                        <span>Grocery</span>
                                    </div>
                                    <span className={`cat-chevron ${isGroceryOpen ? 'open' : ''}`}>▾</span>
                                </div>
                            )}

                            {(isGroceryOpen || isSidebarCollapsed) && (
                                <div className={`child-categories ${isSidebarCollapsed ? 'collapsed-cats' : ''}`}>
                                    {CATEGORIES.map((cat) => (
                                        <div
                                            key={cat.id}
                                            className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                                            onClick={() => scrollToCategory(cat.id)}
                                            title={cat.name}
                                            style={{ '--cat-color': cat.color, '--cat-bg': cat.bg } as React.CSSProperties}
                                        >
                                            <div
                                                className="category-icon"
                                                style={{ background: cat.bg }}
                                            >
                                                <img src={cat.image} alt={cat.name} className="cat-icon-img" />
                                            </div>
                                            {!isSidebarCollapsed && (
                                                <div className="category-name-col">
                                                    <span className="category-name">{cat.name}</span>
                                                    <span className="category-tag-sub">{cat.tag}</span>
                                                </div>
                                            )}
                                            {activeCategory === cat.id && !isSidebarCollapsed && (
                                                <span className="cat-active-dot"></span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Links Section */}
                    {!isSidebarCollapsed && (
                        <div className="sidebar-section sidebar-quick-links">
                            <div className="sidebar-section-title">
                                <span>⚡</span> Quick Links
                            </div>
                            <button className="quick-link-item" onClick={() => navigate('/active-orders')}>
                                <span className="ql-icon">🛒</span>
                                <span>Active Orders</span>
                            </button>
                            <button className="quick-link-item" onClick={() => navigate('/past-orders')}>
                                <span className="ql-icon">📋</span>
                                <span>Order History</span>
                            </button>
                            <button className="quick-link-item" onClick={() => navigate('/profile')}>
                                <span className="ql-icon">👤</span>
                                <span>My Profile</span>
                            </button>
                        </div>
                    )}
                </aside>

                {/* Main Content Area */}
                <main className="dashboard-main" style={{ scrollBehavior: 'smooth' }}>

                    {/* Welcome Banner */}
                    <div className="dashboard-welcome-banner">
                        <div className="welcome-text">
                            <h2 className="welcome-title">Good day, {userName}! 👋</h2>
                            <p className="welcome-sub">Fresh groceries delivered to your door in minutes.</p>
                        </div>
                        <div className="welcome-stats">
                            <div className="stat-chip">
                                <span className="stat-icon">⚡</span>
                                <div>
                                    <div className="stat-val">10 min</div>
                                    <div className="stat-lbl">Delivery</div>
                                </div>
                            </div>
                            <div className="stat-chip">
                                <span className="stat-icon">🏷️</span>
                                <div>
                                    <div className="stat-val">{products.length}+</div>
                                    <div className="stat-lbl">Products</div>
                                </div>
                            </div>
                            <div className="stat-chip">
                                <span className="stat-icon">🔖</span>
                                <div>
                                    <div className="stat-val">Best</div>
                                    <div className="stat-lbl">Prices</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== CATEGORY SLIDER ===== */}
                    <div className="cat-slider-wrap content-cat-slider">
                        <button className="cat-slider-arrow" onClick={() => scrollSlider('left')}>‹</button>
                        <div className="cat-slider-track" ref={sliderRef}>
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    className={`cat-slider-card ${activeCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => scrollToCategory(cat.id)}
                                    style={{ '--cat-color': cat.color, '--cat-bg': cat.bg } as React.CSSProperties}
                                >
                                    <div className="cat-card-icon-wrap">
                                        <img src={cat.image} alt={cat.name} className="cat-card-img" />
                                    </div>
                                    <span className="cat-card-label">{cat.name}</span>
                                    <span className="cat-card-tag">{cat.tag}</span>
                                    {activeCategory === cat.id && <span className="cat-card-active-bar" />}
                                </button>
                            ))}
                        </div>
                        <button className="cat-slider-arrow" onClick={() => scrollSlider('right')}>›</button>
                    </div>

                    {isLoadingProducts ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <span>Loading fresh products…</span>
                        </div>
                    ) : searchQuery ? (
                        /* ── SEARCH MODE: show all matching products across categories ── */
                        <div>
                            {CATEGORIES.map((category) => {
                                const categoryProducts = products.filter(p =>
                                    p.categoryId === category.id &&
                                    p.name.toLowerCase().includes(searchQuery.toLowerCase())
                                );
                                if (categoryProducts.length === 0) return null;
                                return (
                                    <div key={category.id} className="category-section-block">
                                        <header
                                            className="catalog-header enhanced-catalog-header"
                                            style={{ '--cat-color': category.color, '--cat-bg': category.bg } as React.CSSProperties}
                                        >
                                            <div className="cat-header-left-group">
                                                <div className="cat-header-icon-pill" style={{ background: category.bg }}>
                                                    <img src={category.image} alt={category.name} className="cat-header-img" />
                                                </div>
                                                <div>
                                                    <h2 className="catalog-title">{category.name}</h2>
                                                    <span className="cat-header-tag-label">{category.tag}</span>
                                                </div>
                                            </div>
                                            <div className="cat-header-right-group">
                                                <span className="catalog-count">{categoryProducts.length} items</span>
                                            </div>
                                            <div className="cat-header-accent-line" style={{ background: `linear-gradient(90deg, ${category.color}, transparent)` }} />
                                        </header>
                                        <div className="product-grid">
                                            {categoryProducts.map((product) => (
                                                <div key={product.id} className="product-card">
                                                    <div className="delivery-badge">⏱️ {product.delivery}</div>
                                                    <div className="product-image-container" onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>
                                                        <img src={product.image} alt={product.name} className="product-image" />
                                                    </div>
                                                    <div className="product-info">
                                                        <div className="product-name" title={product.name} onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>{product.name}</div>
                                                        <div className="product-unit">{product.unit}</div>
                                                        <div className="product-action-row">
                                                            <div className="product-price-col">
                                                                <span className="product-price">₹{product.price.toFixed(2)}</span>
                                                                {product.originalPrice && <span className="product-old-price">₹{product.originalPrice.toFixed(2)}</span>}
                                                            </div>
                                                            {(() => {
                                                                const cartItem = cart.find(item => item.id === String(product._id));
                                                                return cartItem ? (
                                                                    <div className="quantity-control" onClick={e => e.stopPropagation()}>
                                                                        <button className="qty-btn" onClick={(e) => { e.stopPropagation(); updateQuantity(String(product._id), cartItem.quantity - 1); }}>−</button>
                                                                        <span className="qty-val">{cartItem.quantity}</span>
                                                                        <button className="qty-btn qty-btn-plus" onClick={(e) => { e.stopPropagation(); updateQuantity(String(product._id), cartItem.quantity + 1); }}>+</button>
                                                                    </div>
                                                                ) : (
                                                                    <button className="btn-add" onClick={(e) => { e.stopPropagation(); addToCart({ id: String(product._id), name: product.name, price: product.price, originalPrice: product.originalPrice, delivery: product.delivery, image: product.image, unit: product.unit, categoryId: product.categoryId }); }}>ADD</button>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* ── CATEGORY MODE: show only the active category ── */
                        (() => {
                            const category = CATEGORIES.find(c => c.id === activeCategory);
                            if (!category) return null;
                            const categoryProducts = products.filter(p => p.categoryId === category.id);
                            return (
                                <div key={activeCategory} className="category-section-block cat-section-animate">
                                    <header
                                        className="catalog-header enhanced-catalog-header"
                                        style={{ '--cat-color': category.color, '--cat-bg': category.bg } as React.CSSProperties}
                                    >
                                        <div className="cat-header-left-group">
                                            <div className="cat-header-icon-pill" style={{ background: category.bg }}>
                                                <img src={category.image} alt={category.name} className="cat-header-img" />
                                            </div>
                                            <div>
                                                <h2 className="catalog-title">{category.name}</h2>
                                                <span className="cat-header-tag-label">{category.tag}</span>
                                            </div>
                                        </div>
                                        <div className="cat-header-right-group">
                                            <span className="catalog-count">{categoryProducts.length} items</span>
                                        </div>
                                        <div className="cat-header-accent-line" style={{ background: `linear-gradient(90deg, ${category.color}, transparent)` }} />
                                    </header>

                                    {categoryProducts.length === 0 ? (
                                        <div className="empty-category-msg">
                                            <span>😕</span>
                                            <p>No products available in this category yet.</p>
                                        </div>
                                    ) : (
                                        <div className="product-grid">
                                            {categoryProducts.map((product) => (
                                                <div key={product.id} className="product-card">
                                                    <div className="delivery-badge">⏱️ {product.delivery}</div>
                                                    <div className="product-image-container" onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>
                                                        <img src={product.image} alt={product.name} className="product-image" />
                                                    </div>
                                                    <div className="product-info">
                                                        <div className="product-name" title={product.name} onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>{product.name}</div>
                                                        <div className="product-unit">{product.unit}</div>
                                                        <div className="product-action-row">
                                                            <div className="product-price-col">
                                                                <span className="product-price">₹{product.price.toFixed(2)}</span>
                                                                {product.originalPrice && <span className="product-old-price">₹{product.originalPrice.toFixed(2)}</span>}
                                                            </div>
                                                            {(() => {
                                                                const cartItem = cart.find(item => item.id === String(product._id));
                                                                return cartItem ? (
                                                                    <div className="quantity-control" onClick={e => e.stopPropagation()}>
                                                                        <button className="qty-btn" onClick={(e) => { e.stopPropagation(); updateQuantity(String(product._id), cartItem.quantity - 1); }}>−</button>
                                                                        <span className="qty-val">{cartItem.quantity}</span>
                                                                        <button className="qty-btn qty-btn-plus" onClick={(e) => { e.stopPropagation(); updateQuantity(String(product._id), cartItem.quantity + 1); }}>+</button>
                                                                    </div>
                                                                ) : (
                                                                    <button className="btn-add" onClick={(e) => { e.stopPropagation(); addToCart({ id: String(product._id), name: product.name, price: product.price, originalPrice: product.originalPrice, delivery: product.delivery, image: product.image, unit: product.unit, categoryId: product.categoryId }); }}>ADD</button>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()
                    )}

                </main>

            </div>

            {/* Product Details Modal */}
            {selectedProduct && (
                <div className="cart-overlay" style={{ justifyContent: 'center', alignItems: 'center' }} onClick={() => setSelectedProduct(null)}>
                    <div className="product-modal" onClick={(e) => e.stopPropagation()} style={{
                        backgroundColor: 'var(--panel-bg)',
                        padding: '2rem',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '450px',
                        position: 'relative',
                        boxShadow: 'var(--shadow-lg)',
                        animation: 'slideUpFade 0.3s forwards ease-out',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <button className="btn-close" onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-color)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-primary)' }}>✕</button>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', maxWidth: '250px', height: '250px', objectFit: 'contain' }} />

                            <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '0.5rem' }}>
                                    <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text-primary)' }}>{selectedProduct.name}</h2>
                                    <span className="delivery-badge" style={{ position: 'static', whiteSpace: 'nowrap' }}>⏱️ {selectedProduct.delivery}</span>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1.1rem' }}>{selectedProduct.unit}</div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{selectedProduct.price.toFixed(2)}</span>
                                    {selectedProduct.originalPrice && (
                                        <span style={{ fontSize: '1.2rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>₹{selectedProduct.originalPrice.toFixed(2)}</span>
                                    )}
                                </div>

                                <div style={{ color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}>
                                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>Product Details</p>
                                    <p style={{ margin: 0, fontSize: '0.95rem' }}>High-quality {selectedProduct.name} delivered fresh to your doorstep. Guaranteed quality and standard packaging. Suitable for everyday use.</p>
                                </div>

                                <div style={{ marginTop: '2rem' }}>
                                    {(() => {
                                        const currentQtyInModal = cart.find(item => item.id === String(selectedProduct._id))?.quantity || 0;
                                        if (currentQtyInModal > 0) {
                                            return (
                                                <div className="quantity-control" style={{ width: '100%', height: '48px', justifyContent: 'center', fontSize: '1.2rem', borderRadius: '12px' }}>
                                                    <button className="qty-btn" onClick={() => {
                                                        if (currentQtyInModal === 1) {
                                                            removeFromCart(String(selectedProduct._id));
                                                        } else {
                                                            updateQuantity(String(selectedProduct._id), -1);
                                                        }
                                                    }} style={{ width: '60px' }}>-</button>
                                                    <span className="qty-val" style={{ width: '60px', textAlign: 'center' }}>{currentQtyInModal}</span>
                                                    <button className="qty-btn" onClick={() => updateQuantity(String(selectedProduct._id), 1)} style={{ width: '60px' }}>+</button>
                                                </div>
                                            );
                                        }
                                        return (
                                            <button className="btn-add" style={{ width: '100%', padding: '14px', fontSize: '1.1rem', borderRadius: '12px', backgroundColor: 'var(--action-color)', color: 'white', border: 'none' }} onClick={() => addToCart({
                                                id: String(selectedProduct._id),
                                                name: selectedProduct.name,
                                                price: selectedProduct.price,
                                                originalPrice: selectedProduct.originalPrice,
                                                delivery: selectedProduct.delivery,
                                                image: selectedProduct.image,
                                                unit: selectedProduct.unit,
                                                categoryId: selectedProduct.categoryId
                                            })}>Add to Cart</button>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Drawer */}
            {isCartOpen && (
                <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="cart-header">
                            <h2 className="cart-title">My Cart</h2>
                            <button className="btn-close" onClick={() => setIsCartOpen(false)}>✕</button>
                        </div>

                        <div className="cart-body">
                            {cart.length === 0 ? (
                                <div className="empty-cart">
                                    <span style={{ fontSize: '3rem' }}>🛒</span>
                                    <p>Your cart is empty.</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <img src={item.image} alt={item.name} className="cart-item-img" />
                                        <div className="cart-item-details">
                                            <div className="cart-item-name">{item.name}</div>
                                            <div className="cart-item-unit">{item.unit}</div>
                                            <div className="cart-item-bottom">
                                                <div className="cart-item-price">₹{item.price.toFixed(2)}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Qty: {item.quantity}</span>
                                                    <button 
                                                        onClick={() => removeFromCart(item.id)}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="cart-footer">
                                <div className="payment-method-section" style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '0.8rem', color: 'var(--text-primary)' }}>Payment Method</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', border: paymentMethod === 'cod' ? '1px solid var(--action-color)' : '1px solid var(--panel-border)', borderRadius: '8px', backgroundColor: paymentMethod === 'cod' ? 'var(--action-color-light, rgba(76, 175, 80, 0.1))' : 'transparent', transition: 'all 0.2s' }}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={paymentMethod === 'cod'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                style={{ accentColor: 'var(--action-color)' }}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                <span style={{ fontSize: '1.2rem' }}>💵</span>
                                                <div>
                                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Cash on Delivery</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pay exactly when it arrives.</div>
                                                </div>
                                            </div>
                                        </label>

                                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px', border: paymentMethod === 'online' ? '1px solid var(--action-color)' : '1px solid var(--panel-border)', borderRadius: '8px', backgroundColor: paymentMethod === 'online' ? 'var(--action-color-light, rgba(76, 175, 80, 0.1))' : 'transparent', transition: 'all 0.2s' }}>
                                            <div style={{ paddingTop: '4px' }}>
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="online"
                                                    checked={paymentMethod === 'online'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    style={{ accentColor: 'var(--action-color)' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>📱</span>
                                                    <div>
                                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Online (GPay / PhonePe)</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pay securely via UPI QR Code.</div>
                                                    </div>
                                                </div>

                                                {paymentMethod === 'online' && (
                                                    <div style={{ marginTop: '0.5rem', animation: 'slideDown 0.3s ease-out' }}>
                                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px dashed #ccc', textAlign: 'center' }}>
                                                            <div style={{ width: '150px', height: '150px', background: '#f8f9fa', border: '4px solid black', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                                <div style={{ width: '80%', height: '80%', background: 'conic-gradient(black 25%, white 0 50%, black 0 75%, white 0)', backgroundSize: '15px 15px' }}></div>
                                                                <div style={{ position: 'absolute', background: 'white', padding: '4px', fontWeight: 'bold' }}>UPI</div>
                                                            </div>
                                                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: '#666' }}>Scan this code using any UPI app</p>
                                                            <p style={{ margin: '4px 0 0', fontWeight: 'bold', fontSize: '1.1rem', color: 'black' }}>To Pay: ₹{subtotal.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <div className="cart-summary-row">
                                    <span>To Pay</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <button className="btn-checkout" onClick={handleCheckout}>
                                    <span>Place Order</span>
                                    <span>➔</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Address Edit Modal */}
            {isAddressModalOpen && (
                <div className="cart-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 2000 }} onClick={() => setIsAddressModalOpen(false)}>
                    <div className="product-modal" onClick={(e) => e.stopPropagation()} style={{
                        backgroundColor: 'var(--panel-bg)',
                        padding: '2rem',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '400px',
                        position: 'relative',
                        boxShadow: 'var(--shadow-lg)',
                        animation: 'slideUpFade 0.3s forwards ease-out',
                    }}>
                        <button className="btn-close" onClick={() => setIsAddressModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-color)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-primary)' }}>✕</button>

                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.5rem', textAlign: 'center' }}>Delivery Address</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter your real-time address</label>
                            <input
                                type="text"
                                value={editAddressInput}
                                onChange={(e) => setEditAddressInput(e.target.value)}
                                placeholder="E.g., 123 Main St, Apt 4B"
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--panel-border)',
                                    backgroundColor: 'var(--bg-color)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                                autoFocus
                            />

                            {addressError && (
                                <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '-0.5rem' }}>
                                    {addressError}
                                </div>
                            )}

                            <button
                                onClick={handleSaveAddress}
                                style={{
                                    marginTop: '1rem',
                                    padding: '14px',
                                    fontSize: '1.1rem',
                                    borderRadius: '12px',
                                    backgroundColor: 'var(--action-color)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Save Address
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
