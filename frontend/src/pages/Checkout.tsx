import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

export default function Checkout() {
    const navigate = useNavigate();
    const { cart, subtotal } = useContext(CartContext);

    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userAddress, setUserAddress] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [isEditingAddress, setIsEditingAddress] = useState(false);

    const deliveryFee = 0;
    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    const grandTotal = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

    useEffect(() => {
        if (cart.length === 0) {
            navigate('/dashboard');
            return;
        }
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const u = JSON.parse(savedUser);
                setUserName(u.username || '');
                setUserEmail(u.email || '');
                setUserAddress(u.address || 'B-Mart Hub, Downtown');
                setEditAddress(u.address || 'B-Mart Hub, Downtown');
            } catch { navigate('/login'); }
        } else {
            navigate('/login');
        }
    }, [navigate, cart]);

    const handleProceed = () => {
        navigate('/payment', {
            state: {
                items: cart,
                subtotal,
                deliveryFee,
                tax,
                grandTotal,
                customerName: userName,
                email: userEmail,
                address: userAddress,
            }
        });
    };

    const handleSaveAddress = () => {
        if (!editAddress.trim()) return;
        setUserAddress(editAddress.trim());
        const savedUserStr = localStorage.getItem('user');
        if (savedUserStr) {
            const u = JSON.parse(savedUserStr);
            u.address = editAddress.trim();
            localStorage.setItem('user', JSON.stringify(u));
        }
        setIsEditingAddress(false);
    };

    return (
        <div className="checkout-page">
            {/* Header */}
            <header className="checkout-header">
                <button className="checkout-back-btn" onClick={() => navigate('/dashboard')}>
                    ← Back
                </button>
                <div className="checkout-header-brand">
                    <span>🛒</span> B-Mart
                </div>
                <div className="checkout-steps">
                    <span className="checkout-step active">1. Checkout</span>
                    <span className="checkout-step-arrow">›</span>
                    <span className="checkout-step">2. Payment</span>
                    <span className="checkout-step-arrow">›</span>
                    <span className="checkout-step">3. Invoice</span>
                </div>
            </header>

            <main className="checkout-main">
                <div className="checkout-grid">

                    {/* LEFT — Address + Items */}
                    <div className="checkout-left">

                        {/* Delivery Address Card */}
                        <div className="checkout-card">
                            <div className="checkout-card-title">
                                <span className="checkout-card-icon">📍</span>
                                Delivery Address
                            </div>
                            {isEditingAddress ? (
                                <div className="address-edit-area">
                                    <textarea
                                        className="address-textarea"
                                        value={editAddress}
                                        onChange={e => setEditAddress(e.target.value)}
                                        rows={3}
                                        autoFocus
                                    />
                                    <div className="address-edit-actions">
                                        <button className="btn-save-address" onClick={handleSaveAddress}>Save</button>
                                        <button className="btn-cancel-address" onClick={() => { setIsEditingAddress(false); setEditAddress(userAddress); }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="address-display">
                                    <div className="address-name">{userName}</div>
                                    <div className="address-text">{userAddress}</div>
                                    <div className="address-email">{userEmail}</div>
                                    <button className="btn-edit-address" onClick={() => { setEditAddress(userAddress); setIsEditingAddress(true); }}>
                                        ✏️ Change Address
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Order Items Card */}
                        <div className="checkout-card">
                            <div className="checkout-card-title">
                                <span className="checkout-card-icon">🛍️</span>
                                Order Items ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                            </div>
                            <div className="checkout-items-list">
                                {cart.map(item => (
                                    <div key={item.id} className="checkout-item">
                                        <div className="checkout-item-img-wrap">
                                            <img src={item.image} alt={item.name} className="checkout-item-img" />
                                        </div>
                                        <div className="checkout-item-info">
                                            <div className="checkout-item-name">{item.name}</div>
                                            <div className="checkout-item-unit">{item.unit}</div>
                                            <div className="checkout-item-qty">Qty: {item.quantity}</div>
                                        </div>
                                        <div className="checkout-item-price">₹{(item.price * item.quantity).toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="checkout-card checkout-delivery-info">
                            <span className="checkout-delivery-badge">⚡ Express Delivery</span>
                            <span className="checkout-delivery-text">Estimated arrival: <strong>10 minutes</strong></span>
                        </div>
                    </div>

                    {/* RIGHT — Price Summary */}
                    <div className="checkout-right">
                        <div className="checkout-summary-card">
                            <div className="checkout-card-title">
                                <span className="checkout-card-icon">🧾</span>
                                Price Summary
                            </div>

                            <div className="summary-rows">
                                <div className="summary-row">
                                    <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Delivery Fee</span>
                                    <span className="free-tag">FREE</span>
                                </div>
                                <div className="summary-row">
                                    <span>GST (5%)</span>
                                    <span>₹{tax.toFixed(2)}</span>
                                </div>
                                <div className="summary-divider" />
                                <div className="summary-row summary-total">
                                    <span>Grand Total</span>
                                    <span>₹{grandTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="checkout-savings-badge">
                                🎉 You're saving ₹0 on delivery!
                            </div>

                            <button className="btn-proceed-payment" onClick={handleProceed}>
                                <span>Proceed to Payment</span>
                                <span className="btn-arrow">→</span>
                            </button>

                            <div className="secure-badge">
                                🔒 100% Secure Checkout
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
