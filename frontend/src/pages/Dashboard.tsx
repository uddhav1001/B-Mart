import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

// Blinkit Categories - Indian Grocery Focus
const CATEGORIES = [
    { id: 'cat-oil', name: 'Oils & Ghee', icon: '🛢️' },
    { id: 'cat-grains', name: 'Grains, Atta & Rice', icon: '🌾' },
    { id: 'cat-chips', name: 'Chips & Namkeen', icon: '🥔' },
    { id: 'cat-biscuits', name: 'Biscuits & Cookies', icon: '🍪' },
    { id: 'cat-soap', name: 'Bath & Body', icon: '🧼' },
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

    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal } = useContext(CartContext);

    // Refs for smooth scrolling to sections
    const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

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
            // Adjust scroll position to account for sticky header
            const yOffset = -80;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

        try {
            // Trigger backend to create order
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
                    // If we had a phone number field, we'd pass it here. 
                    // Using null passes the logic to the backend mock defaults.
                    phoneNumber: null
                })
            });
        } catch (e) {
            console.error("Failed to notify backend of new order", e);
        }

        // Navigate to tracking page with cart data
        navigate('/tracking', {
            state: {
                items: [...cart],
                total: subtotal,
                orderId: orderId,
                paymentMethod: paymentMethod
            }
        });

        // Clear cart and close drawer
        clearCart();
        setIsCartOpen(false);
    };

    return (
        <div className="dashboard-container">
            {/* Top Navigation - Blinkit Style */}
            <nav className="dashboard-nav">
                <div className="nav-brand-group">
                    <div className="nav-brand" style={{ fontStyle: 'normal' }}>
                        B-Mart
                    </div>

                    <div className="nav-delivery-info" onClick={() => {
                        setEditAddressInput(userAddress);
                        setIsAddressModalOpen(true);
                    }} style={{ cursor: 'pointer' }} title="Click to edit address">
                        <span className="nav-delivery-time">Delivery in 10 minutes</span>
                        <span className="nav-delivery-location">{userAddress} ▾</span>
                    </div>
                </div>

                <div className="nav-search-container">
                    <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>🔍</button>
                    <input
                        type="text"
                        className="nav-search-input"
                        placeholder="Search 'milk'"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="nav-controls">
                    <div className="user-profile-container">
                        <button
                            className="user-profile-trigger"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            <div className="user-avatar">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="user-greeting">{userName}</span>
                        </button>

                        {isProfileOpen && (
                            <div className="profile-dropdown">
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
                                <button className="dropdown-item" onClick={() => navigate('/admin')}>
                                    <span>⚙️</span> Admin Dashboard
                                </button>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item" onClick={handleLogout} style={{ color: 'red' }}>
                                    <span>🚪</span> Logout
                                </button>
                            </div>
                        )}
                    </div>
                    <button className="btn-cart" onClick={() => setIsCartOpen(true)}>
                        🛒 {totalItems > 0 ? `${totalItems} Items | ₹${subtotal.toFixed(2)}` : 'My Cart'}
                    </button>
                </div>
            </nav>

            {/* Main Layout Setup */}
            <div className="dashboard-body">

                {/* Category Sidebar */}
                <aside className="categories-sidebar" style={{ padding: '1rem' }}>

                    {/* Parent Category: Grocery */}
                    <div className="parent-category" style={{ marginBottom: '1rem' }}>
                        <div
                            className="category-header"
                            onClick={() => setIsGroceryOpen(!isGroceryOpen)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 15px',
                                backgroundColor: 'var(--panel-bg)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                color: 'var(--text-primary)',
                                boxShadow: 'var(--shadow-sm)',
                                marginBottom: isGroceryOpen ? '0.5rem' : '0'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.2rem' }}>🛍️</span>
                                <span>Grocery</span>
                            </div>
                            <span style={{ transform: isGroceryOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                                ▾
                            </span>
                        </div>

                        {/* Child Categories */}
                        {isGroceryOpen && (
                            <div className="child-categories" style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {CATEGORIES.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                                        onClick={() => scrollToCategory(cat.id)}
                                        style={{
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            cursor: 'pointer',
                                            backgroundColor: activeCategory === cat.id ? 'var(--bg-color)' : 'transparent',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <div className="category-icon" style={{ fontSize: '1.2rem' }}>{cat.icon}</div>
                                        <span className="category-name" style={{ fontSize: '0.95rem', color: activeCategory === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{cat.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </aside>

                {/* Main Content Area - Category Sections */}
                <main className="dashboard-main" style={{ scrollBehavior: 'smooth' }}>

                    {isLoadingProducts ? (
                        <div style={{ padding: '2rem', textAlign: 'center', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                            Loading fresh products...
                        </div>
                    ) : (
                        CATEGORIES.map((category) => {
                            // Filter products for this specific category and search query
                            const categoryProducts = products.filter(p => {
                                const matchesCategory = p.categoryId === category.id;
                                const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                                return matchesCategory && matchesSearch;
                            });

                            // Only render the section if it has products
                            if (categoryProducts.length === 0) return null;

                            return (
                                <div
                                    key={category.id}
                                    id={category.id}
                                    ref={(el) => { sectionRefs.current[category.id] = el; }}
                                    style={{ marginBottom: '3rem' }}
                                >
                                    <header className="catalog-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem' }}>
                                        <h2 className="catalog-title" style={{ fontSize: '1.25rem' }}>{category.name}</h2>
                                    </header>

                                    {/* Product Grid - Blinkit Style */}
                                    <div className="product-grid">
                                        {categoryProducts.map((product) => (
                                            <div key={product.id} className="product-card">

                                                <div className="delivery-badge">
                                                    ⏱️ {product.delivery}
                                                </div>

                                                <div className="product-image-container" onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>
                                                    <img src={product.image} alt={product.name} className="product-image" />
                                                </div>

                                                <div className="product-info">
                                                    <div className="product-name" title={product.name} onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>{product.name}</div>
                                                    <div className="product-unit">{product.unit}</div>

                                                    <div className="product-action-row">
                                                        <div className="product-price-col">
                                                            <span className="product-price">₹{product.price.toFixed(2)}</span>
                                                            {product.originalPrice && (
                                                                <span className="product-old-price">₹{product.originalPrice.toFixed(2)}</span>
                                                            )}
                                                        </div>

                                                        {/* Cart Add/Quantity Controls */}
                                                        <button className="btn-add"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const currentQty = cart.find(item => item.id === String(product._id))?.quantity || 0;
                                                                if (currentQty === 0) {
                                                                    addToCart({ id: String(product._id), name: product.name, price: product.price, originalPrice: product.originalPrice, delivery: product.delivery, image: product.image, unit: product.unit, categoryId: product.categoryId });
                                                                }
                                                            }}>
                                                            {cart.find(item => item.id === String(product._id)) ? (
                                                                <div className="quantity-control" style={{ width: '100%', justifyContent: 'space-between' }}>
                                                                    <button
                                                                        className="qty-btn"
                                                                        onClick={(e) => { e.stopPropagation(); updateQuantity(String(product._id), (cart.find(item => item.id === String(product._id))?.quantity || 1) - 1); }}
                                                                    >-</button>
                                                                    <span className="qty-val">{cart.find(item => item.id === String(product._id))?.quantity}</span>
                                                                    <button
                                                                        className="qty-btn"
                                                                        onClick={(e) => { e.stopPropagation(); updateQuantity(String(product._id), (cart.find(item => item.id === String(product._id))?.quantity || 0) + 1); }}
                                                                        style={{ color: 'var(--action-color)', background: 'white' }}
                                                                    >+</button>
                                                                </div>
                                                            ) : "ADD"}
                                                        </button>

                                                    </div>
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }))}
                </main>

            </div>

            {/* Product Details Modal Overlay */}
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

            {/* Cart Drawer Overlay */}
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
                                                <div className="quantity-control" style={{ height: '28px' }}>
                                                    <button className="qty-btn" onClick={() => {
                                                        if (item.quantity === 1) {
                                                            removeFromCart(item.id);
                                                        } else {
                                                            updateQuantity(item.id, -1);
                                                        }
                                                    }}>-</button>
                                                    <span className="qty-val">{item.quantity}</span>
                                                    <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
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
                                        {/* COD Option */}
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

                                        {/* Online Option */}
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

                                                {/* Expanding QR Code Section */}
                                                {paymentMethod === 'online' && (
                                                    <div style={{ marginTop: '0.5rem', animation: 'slideDown 0.3s ease-out' }}>
                                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px dashed #ccc', textAlign: 'center' }}>
                                                            {/* Placeholder QR Code Box */}
                                                            <div style={{ width: '150px', height: '150px', background: '#f8f9fa', border: '4px solid black', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                                {/* Little fake QR pattern */}
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
            {/* Address Edit Modal Overlay */}
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


