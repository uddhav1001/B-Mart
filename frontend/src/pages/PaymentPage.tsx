import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

interface OrderState {
    items: any[];
    subtotal: number;
    deliveryFee: number;
    tax: number;
    grandTotal: number;
    customerName: string;
    email: string;
    address: string;
}

interface MerchantConfig {
    upiId: string;
    qrCodeUrl: string;
}

type PaymentMethod = 'cod' | 'upi' | 'card' | 'wallet';

export default function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as OrderState;

    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod');
    const [isProcessing, setIsProcessing] = useState(false);
    const [merchantConfig, setMerchantConfig] = useState<MerchantConfig | null>(null);
    const { clearCart } = useContext(CartContext);

    // Fetch Merchant Config on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/payments/config');
                const data = await res.json();
                if (data.success) {
                    setMerchantConfig(data.config);
                }
            } catch (err) {
                console.error("Error fetching merchant config:", err);
            }
        };
        fetchConfig();
    }, []);

    // Card fields
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    // UPI Verification fields
    const [transactionId, setTransactionId] = useState('');
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Wallet selection
    const [wallet, setWallet] = useState('paytm');

    if (!state || !state.items || state.items.length === 0) {
        navigate('/dashboard');
        return null;
    }

    const formatCardNumber = (val: string) =>
        val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

    const formatExpiry = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
        return digits;
    };

    const handlePayNow = async () => {
        setIsProcessing(true);
        setErrorMessage('');
        const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

        let userId = null;
        try {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const u = JSON.parse(savedUser);
                userId = u.id || u._id || null;
            }
        } catch (e) {
            console.error("Error getting userId from localStorage", e);
        }

        // Special logic for UPI Verification
        if (selectedMethod === 'upi') {
            if (!transactionId || !screenshotFile) {
                setErrorMessage('Transaction ID and Screenshot are required for UPI payment.');
                setIsProcessing(false);
                return;
            }

            setVerificationStatus('verifying');
            try {
                // 1. Create the Order first in status "Processing"
                const orderRes = await fetch('http://localhost:5000/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId,
                        items: state.items,
                        total: state.grandTotal,
                        paymentMethod: selectedMethod,
                        customerName: state.customerName,
                        email: state.email,
                        phoneNumber: null,
                        userId,
                    }),
                });

                if (!orderRes.ok) throw new Error("Failed to create order");

                // 2. Upload and Verify Screenshot
                const formData = new FormData();
                formData.append('orderId', orderId);
                formData.append('transactionId', transactionId);
                formData.append('amount', state.grandTotal.toString());
                formData.append('screenshot', screenshotFile);

                const verifyRes = await fetch('http://localhost:5000/api/payments/verify-upi', {
                    method: 'POST',
                    body: formData,
                });

                const verifyData = await verifyRes.json();

                if (verifyData.success) {
                    setVerificationStatus('success');
                } else {
                    setVerificationStatus('failed');
                    setErrorMessage(verifyData.message || 'Verification failed. Our team will verify manually.');
                    setIsProcessing(false);
                    return;
                }

            } catch (e) {
                setVerificationStatus('failed');
                setErrorMessage('An error occurred during verification. Please try again or contact support.');
                setIsProcessing(false);
                return;
            }
        } else {
            // Existing logic for COD and others
            try {
                await fetch('http://localhost:5000/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId,
                        items: state.items,
                        total: state.grandTotal,
                        paymentMethod: selectedMethod,
                        customerName: state.customerName,
                        email: state.email,
                        phoneNumber: null,
                        userId,
                    }),
                });
            } catch (e) {
                console.error('Failed to save order', e);
            }
        }

        // Finalize order
        setTimeout(() => {
            setIsProcessing(false);
            clearCart();
            navigate('/invoice', {
                state: {
                    orderId,
                    items: state.items,
                    subtotal: state.subtotal,
                    deliveryFee: state.deliveryFee,
                    tax: state.tax,
                    grandTotal: state.grandTotal,
                    customerName: state.customerName,
                    email: state.email,
                    address: state.address,
                    paymentMethod: selectedMethod,
                    paidAt: new Date().toISOString(),
                }
            });
        }, 1200);
    };

    const methods: { id: PaymentMethod; label: string; icon: string; desc: string }[] = [
        { id: 'cod',    label: 'Cash on Delivery',       icon: '💵', desc: 'Pay when your order arrives.' },
        { id: 'upi',    label: 'UPI / GPay / PhonePe',   icon: '📱', desc: 'Scan QR & pay instantly.' },
        { id: 'card',   label: 'Debit / Credit Card',    icon: '💳', desc: 'Visa, Mastercard, RuPay.' },
        { id: 'wallet', label: 'Mobile Wallet',          icon: '👛', desc: 'Paytm, Amazon Pay & more.' },
    ];

    return (
        <div className="payment-page">
            <header className="checkout-header">
                <button className="checkout-back-btn" onClick={() => navigate(-1)}>← Back</button>
                <div className="checkout-header-brand"><span>🛒</span> B-Mart</div>
                <div className="checkout-steps">
                    <span className="checkout-step done">1. Checkout</span>
                    <span className="checkout-step-arrow">›</span>
                    <span className="checkout-step active">2. Payment</span>
                    <span className="checkout-step-arrow">›</span>
                    <span className="checkout-step">3. Invoice</span>
                </div>
            </header>

            <main className="payment-main">
                <div className="payment-grid">
                    <div className="payment-left">
                        <h2 className="payment-section-title">Choose Payment Method</h2>
                        <div className="payment-methods-list">
                            {methods.map(m => (
                                <button
                                    key={m.id}
                                    className={`payment-method-card ${selectedMethod === m.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedMethod(m.id)}
                                >
                                    <div className="pm-radio">
                                        <div className={`pm-radio-dot ${selectedMethod === m.id ? 'active' : ''}`} />
                                    </div>
                                    <span className="pm-icon">{m.icon}</span>
                                    <div className="pm-info">
                                        <div className="pm-label">{m.label}</div>
                                        <div className="pm-desc">{m.desc}</div>
                                    </div>
                                    {selectedMethod === m.id && <span className="pm-check">✓</span>}
                                </button>
                            ))}
                        </div>

                        <div className="payment-detail-panel">
                            {selectedMethod === 'upi' && (
                                <div className="upi-panel">
                                    <p className="upi-instruction">Scan the QR Code using <strong>GPay, PhonePe, or any UPI app</strong></p>
                                    <div className="qr-wrapper">
                                        {merchantConfig?.qrCodeUrl ? (
                                            <img 
                                                src={`http://localhost:5000${merchantConfig.qrCodeUrl}`} 
                                                alt="Payment QR" 
                                                className="qr-img" 
                                                style={{ width: '170px', height: '170px', objectFit: 'contain' }}
                                                onError={(e) => (e.currentTarget.src = 'https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=bmart@upi')}
                                            />
                                        ) : (
                                            <div className="qr-placeholder" style={{ width: '170px', height: '170px', display: 'flex', alignItems: 'center', justifySelf: 'center', background: '#f1f1f1', borderRadius: '8px' }}>Loading QR...</div>
                                        )}
                                        <div className="qr-amount">₹{state.grandTotal.toFixed(2)}</div>
                                    </div>
                                    <div className="upi-id-box">
                                        <span className="upi-id-label">UPI ID:</span>
                                        <span className="upi-id-value">{merchantConfig?.upiId || 'bmart@upi'}</span>
                                        <button className="btn-copy-upi" onClick={() => navigator.clipboard.writeText(merchantConfig?.upiId || 'bmart@upi')}>Copy</button>
                                    </div>
                                    
                                    <div className="upi-verification-form">
                                        <div className="upi-v-field">
                                            <label>Transaction ID / UTR</label>
                                            <input 
                                                type="text" 
                                                placeholder="Enter 12-digit UTR number" 
                                                value={transactionId} 
                                                onChange={e => setTransactionId(e.target.value)} 
                                            />
                                        </div>
                                        <div className="upi-v-field">
                                            <label>Upload Payment Screenshot</label>
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={e => setScreenshotFile(e.target.files?.[0] || null)} 
                                            />
                                        </div>
                                        {errorMessage && <div className="upi-error">{errorMessage}</div>}
                                    </div>

                                    <div className="upi-apps-logos">
                                        <div className="upi-app-logo">
                                            <div className="upi-app-icon" style={{background: 'linear-gradient(135deg, #1a73e8, #4285f4)'}}>G</div>
                                            <span>GPay</span>
                                        </div>
                                        <div className="upi-app-logo">
                                            <div className="upi-app-icon" style={{background: 'linear-gradient(135deg, #5f259f, #8b44be)'}}>Pp</div>
                                            <span>PhonePe</span>
                                        </div>
                                        <div className="upi-app-logo">
                                            <div className="upi-app-icon" style={{background: 'linear-gradient(135deg, #002970, #0066cc)'}}>P</div>
                                            <span>Paytm</span>
                                        </div>
                                        <div className="upi-app-logo">
                                            <div className="upi-app-icon" style={{background: 'linear-gradient(135deg, #E31837, #ff6b35)'}}>B</div>
                                            <span>BHIM</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Card Panel */}
                            {selectedMethod === 'card' && (
                                <div className="card-panel">
                                    {/* Visual Card */}
                                    <div className="visual-card">
                                        <div className="vc-top">
                                            <div className="vc-chip">
                                                <div className="vc-chip-line" /><div className="vc-chip-line" />
                                                <div className="vc-chip-line" /><div className="vc-chip-line" />
                                            </div>
                                            <div className="vc-contactless">◎</div>
                                        </div>
                                        <div className="vc-number">{cardNumber || '•••• •••• •••• ••••'}</div>
                                        <div className="vc-bottom">
                                            <div>
                                                <div className="vc-label">Card Holder</div>
                                                <div className="vc-value">{cardName || 'YOUR NAME'}</div>
                                            </div>
                                            <div>
                                                <div className="vc-label">Expires</div>
                                                <div className="vc-value">{cardExpiry || 'MM/YY'}</div>
                                            </div>
                                            <div className="vc-network">VISA</div>
                                        </div>
                                    </div>

                                    {/* Card Form */}
                                    <div className="card-form">
                                        <div className="card-field">
                                            <label>Cardholder Name</label>
                                            <input type="text" placeholder="Name on card" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} maxLength={26} />
                                        </div>
                                        <div className="card-field">
                                            <label>Card Number</label>
                                            <input type="text" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} />
                                        </div>
                                        <div className="card-field-row">
                                            <div className="card-field">
                                                <label>Expiry Date</label>
                                                <input type="text" placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} maxLength={5} />
                                            </div>
                                            <div className="card-field">
                                                <label>CVV</label>
                                                <input type="password" placeholder="•••" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} maxLength={3} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Wallet Panel */}
                            {selectedMethod === 'wallet' && (
                                <div className="wallet-panel">
                                    <p className="wallet-instruction">Select your preferred wallet</p>
                                    <div className="wallet-options">
                                        {[
                                            { id: 'paytm', label: 'Paytm', color: '#002970', tagline: 'Pay using Paytm wallet balance' },
                                            { id: 'amazon', label: 'Amazon Pay', color: '#FF9900', tagline: 'Use Amazon Pay balance' },
                                            { id: 'mobikwik', label: 'MobiKwik', color: '#572d6c', tagline: 'Pay with MobiKwik SuperCash' },
                                            { id: 'freecharge', label: 'FreeCharge', color: '#ef4723', tagline: 'Use FreeCharge balance' },
                                        ].map(w => (
                                            <button key={w.id} className={`wallet-option ${wallet === w.id ? 'selected' : ''}`} onClick={() => setWallet(w.id)}>
                                                <div className="wallet-icon" style={{ background: w.color }}>{w.label[0]}</div>
                                                <div className="wallet-info">
                                                    <div className="wallet-name">{w.label}</div>
                                                    <div className="wallet-tagline">{w.tagline}</div>
                                                </div>
                                                {wallet === w.id && <span className="wallet-check">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* COD Panel */}
                            {selectedMethod === 'cod' && (
                                <div className="cod-panel">
                                    <div className="cod-icon">💵</div>
                                    <div className="cod-text">
                                        <strong>Cash on Delivery</strong>
                                        <p>Keep exact change of <strong>₹{state.grandTotal.toFixed(2)}</strong> ready for our delivery partner.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT — Order Summary */}
                    <div className="payment-right">
                        <div className="payment-summary-card">
                            <div className="checkout-card-title">
                                <span className="checkout-card-icon">📦</span>
                                Order Summary
                            </div>
                            <div className="payment-items-mini">
                                {state.items.map((item: any) => (
                                    <div key={item.id} className="payment-item-mini">
                                        <img src={item.image} alt={item.name} className="payment-item-img" />
                                        <div className="payment-item-mini-info">
                                            <div className="payment-item-mini-name">{item.name}</div>
                                            <div className="payment-item-mini-qty">x{item.quantity}</div>
                                        </div>
                                        <div className="payment-item-mini-price">₹{(item.price * item.quantity).toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="payment-summary-divider" />
                            <div className="summary-rows">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>₹{state.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Delivery</span>
                                    <span className="free-tag">FREE</span>
                                </div>
                                <div className="summary-row">
                                    <span>GST (5%)</span>
                                    <span>₹{state.tax.toFixed(2)}</span>
                                </div>
                                <div className="summary-divider" />
                                <div className="summary-row summary-total">
                                    <span>Total</span>
                                    <span>₹{state.grandTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                className={`btn-pay-now ${isProcessing ? 'processing' : ''}`}
                                onClick={handlePayNow}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <><span className="pay-spinner" /> Processing…</>
                                ) : (
                                    <><span>Pay ₹{state.grandTotal.toFixed(2)}</span> <span className="btn-arrow">→</span></>
                                )}
                            </button>
                            <div className="secure-badge">🔒 Secured by 256-bit SSL</div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
