import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function ResetPassword() {
    const { token } = useParams<{ token: string }>();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            setSuccess(true);
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
                        Create a strong new password to secure your account.
                    </h2>
                    <p style={{ opacity: 0.8, fontSize: '1.1rem', lineHeight: '1.6' }}>
                        Choose something memorable — at least 6 characters long.
                    </p>
                </div>
            </div>

            {/* Right Form */}
            <div className="auth-form-container">
                <div className="auth-panel">
                    <div className="mobile-brand">🛍️ B-Mart</div>

                    <h1 className="auth-title">New Password</h1>
                    <p className="auth-subtitle">Set a new password for your account</p>

                    {success ? (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08))',
                            border: '1px solid rgba(34,197,94,0.35)',
                            borderRadius: '14px',
                            padding: '1.75rem',
                            textAlign: 'center',
                            marginBottom: '1.25rem',
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
                            <h3 style={{ color: '#22c55e', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                                Password Reset Successful!
                            </h3>
                            <p style={{ opacity: 0.75, fontSize: '0.9rem', lineHeight: 1.5 }}>
                                Your password has been updated. You can now log in with your new password.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="new-password">New Password</label>
                                <input
                                    id="new-password"
                                    type="password"
                                    className="form-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    className="form-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>

                            {/* Password match indicator */}
                            {confirmPassword && (
                                <p style={{
                                    fontSize: '0.82rem',
                                    color: newPassword === confirmPassword ? '#22c55e' : '#f87171',
                                    marginBottom: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                }}>
                                    {newPassword === confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
                                </p>
                            )}

                            {error && <div className="error-message">{error}</div>}

                            <button
                                type="submit"
                                className="auth-button"
                                disabled={loading || (!!confirmPassword && newPassword !== confirmPassword)}
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    <p className="auth-link-text">
                        <Link to="/login" className="auth-link">← Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
