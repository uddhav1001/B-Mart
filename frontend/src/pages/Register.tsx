import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [pincode, setPincode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, address, phone, pincode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Left Side: Visuals */}
            <div className="auth-visual">
                <div className="auth-visual-overlay"></div>
                <div className="auth-visual-content">
                    <div className="brand-logo-large">
                        🛍️<span>B-Mart</span> Fresh
                    </div>
                    <h2 className="visual-quote">
                        Join our community of fresh food lovers.
                    </h2>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '2rem' }}>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.05rem', opacity: 0.9 }}>
                            <span style={{ color: '#10b981', fontSize: '1.25rem' }}>✓</span> Same-day delivery on all fresh items
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.05rem', opacity: 0.9 }}>
                            <span style={{ color: '#10b981', fontSize: '1.25rem' }}>✓</span> Exclusive member discounts & weekly deals
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.05rem', opacity: 0.9 }}>
                            <span style={{ color: '#10b981', fontSize: '1.25rem' }}>✓</span> 100% freshness guarantee on produce
                        </li>
                    </ul>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="auth-form-container">
                <div className="auth-panel">
                    {/* Mobile Only Brand Header */}
                    <div className="mobile-brand">
                        🛍️ B-Mart
                    </div>

                    <h1 className="auth-title">Create an Account</h1>
                    <p className="auth-subtitle">Join B-Mart today</p>

                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Adress</label>
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="address">Delivery Address</label>
                            <input
                                id="address"
                                type="text"
                                className="form-input"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                                placeholder="Area, Building, Flat No."
                            />
                        </div>

                        <div className="form-group-row" style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label" htmlFor="phone">Phone Number</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    className="form-input"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    placeholder="9876543210"
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label" htmlFor="pincode">Pincode</label>
                                <input
                                    id="pincode"
                                    type="text"
                                    className="form-input"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    required
                                    placeholder="400001"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </button>
                    </form>

                    <p className="auth-link-text">
                        Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
