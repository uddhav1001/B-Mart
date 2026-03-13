import { useNavigate, useLocation } from 'react-router-dom';

interface InvoiceState {
    orderId: string;
    items: any[];
    subtotal: number;
    deliveryFee: number;
    tax: number;
    grandTotal: number;
    customerName: string;
    email: string;
    address: string;
    paymentMethod: string;
    paidAt: string;
}

const methodLabels: Record<string, string> = {
    cod:    'Cash on Delivery',
    upi:    'UPI / GPay / PhonePe',
    card:   'Debit / Credit Card',
    wallet: 'Mobile Wallet',
};

const methodIcons: Record<string, string> = {
    cod: '💵', upi: '📱', card: '💳', wallet: '👛',
};

export default function Invoice() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as InvoiceState;

    if (!state || !state.items || state.items.length === 0) {
        navigate('/dashboard');
        return null;
    }

    const paidDate   = new Date(state.paidAt);
    const formattedDate = paidDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const formattedTime = paidDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const totalQty  = state.items.reduce((s: number, i: any) => s + i.quantity, 0);

    return (
        <div className="invoice-page">

            {/* ── Action Bar (hidden on print) ── */}
            <div className="invoice-action-bar no-print">
                <button className="btn-back-dash" onClick={() => navigate('/dashboard')}>
                    ← Continue Shopping
                </button>
                <div className="invoice-action-right">
                    <button
                        className="btn-track-order"
                        onClick={() => navigate('/tracking', {
                            state: { items: state.items, total: state.grandTotal, orderId: state.orderId, paymentMethod: state.paymentMethod }
                        })}
                    >
                        📍 Track Order
                    </button>
                    <button className="btn-print-invoice" onClick={() => window.print()}>
                        🖨️ Print / Download
                    </button>
                </div>
            </div>

            {/* ── Invoice Card ── */}
            <div className="invoice-card" id="invoice-printable">

                {/* ── Header ── */}
                <div className="invoice-header">
                    <div className="invoice-brand">
                        <div className="invoice-brand-icon">🛒</div>
                        <div>
                            <div className="invoice-brand-name">B-Mart</div>
                            <div className="invoice-brand-tagline">Express Grocery Delivery</div>
                        </div>
                    </div>
                    <div className="invoice-meta">
                        <div className="invoice-title-badge">TAX INVOICE</div>
                        <div className="invoice-meta-row">
                            <span className="invoice-meta-label">Invoice No:</span>
                            <span className="invoice-meta-value">{state.orderId}</span>
                        </div>
                        <div className="invoice-meta-row">
                            <span className="invoice-meta-label">Date:</span>
                            <span className="invoice-meta-value">{formattedDate}</span>
                        </div>
                        <div className="invoice-meta-row">
                            <span className="invoice-meta-label">Time:</span>
                            <span className="invoice-meta-value">{formattedTime}</span>
                        </div>
                    </div>
                </div>

                {/* ── Payment Success Banner ── */}
                <div className="invoice-success-banner">
                    <span className="invoice-success-icon">✅</span>
                    <div>
                        <div className="invoice-success-title">Payment Successful! Your order is confirmed.</div>
                        <div className="invoice-success-sub">
                            Estimated delivery: <strong>within 10 minutes</strong> · {totalQty} item{totalQty !== 1 ? 's' : ''} ordered
                        </div>
                    </div>
                    <div style={{ marginLeft: 'auto', flexShrink: 0 }} className="no-print">
                        <div className="invoice-paid-stamp">✓ PAID</div>
                    </div>
                </div>

                {/* ── Bill To / From / Payment ── */}
                <div className="invoice-parties">
                    {/* Bill To */}
                    <div className="invoice-party">
                        <div className="invoice-party-label">Bill To</div>
                        <div className="invoice-party-name">{state.customerName}</div>
                        <div className="invoice-party-detail">{state.email}</div>
                        <div className="invoice-party-detail" style={{ marginTop: '0.4rem' }}>{state.address}</div>
                    </div>

                    {/* From */}
                    <div className="invoice-party">
                        <div className="invoice-party-label">From</div>
                        <div className="invoice-party-name">B-Mart Pvt. Ltd.</div>
                        <div className="invoice-party-detail">GSTIN: 29AABCU9603R1ZX</div>
                        <div className="invoice-party-detail">support@bmart.com</div>
                        <div className="invoice-party-detail">1800-123-4567 (toll-free)</div>
                    </div>

                    {/* Payment */}
                    <div className="invoice-party">
                        <div className="invoice-party-label">Payment Mode</div>
                        <div className="invoice-payment-badge" style={{ marginBottom: '0.6rem' }}>
                            <span>{methodIcons[state.paymentMethod]}</span>
                            <span>{methodLabels[state.paymentMethod] || state.paymentMethod}</span>
                        </div>
                        <div className="invoice-party-detail">
                            Status: <strong style={{ color: '#22c55e' }}>PAID ✓</strong>
                        </div>
                        <div className="invoice-party-detail" style={{ marginTop: '0.3rem' }}>
                            Delivery: <strong>Expected in 10 mins</strong>
                        </div>
                    </div>
                </div>

                {/* ── Items Table ── */}
                <div className="invoice-items-section">
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th className="invoice-th" style={{ width: '40px' }}>#</th>
                                <th className="invoice-th">Product</th>
                                <th className="invoice-th center">Unit</th>
                                <th className="invoice-th center">Qty</th>
                                <th className="invoice-th right">Unit Price</th>
                                <th className="invoice-th right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {state.items.map((item: any, idx: number) => (
                                <tr key={item.id} className={`invoice-tr ${idx % 2 === 0 ? 'even' : ''}`}>
                                    <td className="invoice-td" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{idx + 1}</td>
                                    <td className="invoice-td">
                                        <div className="invoice-item-cell">
                                            <img src={item.image} alt={item.name} className="invoice-item-img" />
                                            <span>{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="invoice-td center" style={{ color: 'var(--text-secondary)' }}>{item.unit}</td>
                                    <td className="invoice-td center" style={{ fontWeight: 600 }}>{item.quantity}</td>
                                    <td className="invoice-td right" style={{ color: 'var(--text-secondary)' }}>₹{item.price.toFixed(2)}</td>
                                    <td className="invoice-td right bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Totals ── */}
                <div className="invoice-totals-wrapper">
                    <div className="invoice-totals">
                        <div className="invoice-total-row">
                            <span>Subtotal ({totalQty} items)</span>
                            <span>₹{state.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="invoice-total-row">
                            <span>Delivery Charges</span>
                            <span className="free-tag-inv">FREE</span>
                        </div>
                        <div className="invoice-total-row">
                            <span>GST @ 5%</span>
                            <span>₹{state.tax.toFixed(2)}</span>
                        </div>
                        <div className="invoice-total-divider" />
                        <div className="invoice-total-row grand">
                            <span>Grand Total</span>
                            <span>₹{state.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="invoice-footer">
                    <div className="invoice-thank-you">🎉 Thank you for shopping with B-Mart!</div>
                    <div className="invoice-policy">
                        This is a computer-generated invoice and does not require a signature.
                        For queries, contact us at <strong>support@bmart.com</strong>.
                        Returns accepted within 7 days of delivery per our return policy.
                    </div>
                    <div className="invoice-footer-brand">
                        B-Mart · Express Grocery Delivery · www.bmart.com
                    </div>
                </div>

            </div>
        </div>
    );
}
