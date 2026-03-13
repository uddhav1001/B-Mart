import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [sentTo, setSentTo] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            setSentTo(email);
            setEmailSent(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Left Visual */}
            <div className="auth-visual">
                <div className="auth-visual-overlay"></div>
                <div className="auth-visual-content">
                    <div className="brand-logo-large">
                        🛍️<span>B-Mart</span> Fresh
                    </div>
                    <h2 className="visual-quote">
                        Forgot your password? No worries — we've got you covered.
                    </h2>
                    <p style={{ opacity: 0.8, fontSize: '1.1rem', lineHeight: '1.6' }}>
                        Enter your registered email to receive a password reset link instantly.
                    </p>
                </div>
            </div>

            {/* Right Form */}
            <div className="auth-form-container">
                <div className="auth-panel">
                    <div className="mobile-brand">🛍️ B-Mart</div>

                    <h1 className="auth-title">Reset Password</h1>
                    <p className="auth-subtitle">Enter your email to get a reset link</p>

                    {!emailSent ? (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="fp-email">Email Address</label>
                                <input
                                    id="fp-email"
                                    type="email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                />
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <button type="submit" className="auth-button" disabled={loading}>
                                {loading ? 'Sending Email...' : 'Send Reset Link'}
                            </button>
                        </form>
                    ) : (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08))',
                            border: '1px solid rgba(34,197,94,0.35)',
                            borderRadius: '14px',
                            padding: '1.75rem',
                            textAlign: 'center',
                            marginBottom: '1.25rem',
                        }}>
                            <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>📬</div>
                            <h3 style={{ color: '#22c55e', marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                                Email Sent!
                            </h3>
                            <p style={{ fontSize: '0.88rem', opacity: 0.75, lineHeight: 1.6 }}>
                                We've sent a password reset link to:
                            </p>
                            <p style={{
                                fontWeight: 700,
                                color: '#60a5fa',
                                fontSize: '0.95rem',
                                margin: '0.4rem 0 1rem',
                                wordBreak: 'break-all',
                            }}>
                                {sentTo}
                            </p>
                            <p style={{ fontSize: '0.82rem', opacity: 0.6, lineHeight: 1.5 }}>
                                Check your inbox (and spam folder). The link expires in <strong>1 hour</strong>.
                            </p>
                        </div>
                    )}

                    <p className="auth-link-text">
                        Remember your password? <Link to="/login" className="auth-link">Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
