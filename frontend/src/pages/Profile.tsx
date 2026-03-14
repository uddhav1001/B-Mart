import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
    name: string;
    email: string;
    phone: string;
    address: string;
    pincode: string;
    dob: string;
    gender: string;
}

export default function Profile() {
    const navigate = useNavigate();

    // Default structure
    const [profile, setProfile] = useState<UserProfile>({
        name: '',
        email: '',
        phone: '',
        address: '',
        pincode: '',
        dob: '',
        gender: 'Prefer not to say'
    });

    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Load base user details and any previously saved profile data
        const savedUserStr = localStorage.getItem('user');
        const savedProfileStr = localStorage.getItem('userProfile');

        const defaultProfile = { ...profile };

        if (savedUserStr) {
            try {
                const parsedUser = JSON.parse(savedUserStr);
                // Map new mandatory fields from the user object
                if (parsedUser.name) defaultProfile.name = parsedUser.name;
                if (parsedUser.email) defaultProfile.email = parsedUser.email;
                if (parsedUser.phone) defaultProfile.phone = parsedUser.phone;
                if (parsedUser.address) defaultProfile.address = parsedUser.address;
                if (parsedUser.pincode) defaultProfile.pincode = parsedUser.pincode;
            } catch (e) {
                console.error("Failed to parse user from localStorage");
            }
        }

        if (savedProfileStr) {
            try {
                const parsedProfile = JSON.parse(savedProfileStr);
                setProfile({ ...defaultProfile, ...parsedProfile });
            } catch (e) {
                console.error("Failed to parse profile from localStorage");
                setProfile(defaultProfile);
            }
        } else {
            setProfile(defaultProfile);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
        setIsSaved(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const savedUserStr = localStorage.getItem('user');
        if (!savedUserStr) {
            setError('User session not found. Please log in again.');
            return;
        }

        try {
            const parsedUser = JSON.parse(savedUserStr);
            const response = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: parsedUser.id,
                    name: profile.name,
                    phone: profile.phone,
                    address: profile.address,
                    pincode: profile.pincode
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }

            // Update local storage
            localStorage.setItem('user', JSON.stringify(data.user));
            // Keep userProfile for any extra fields like dob/gender that might not be in the core user model yet
            localStorage.setItem('userProfile', JSON.stringify(profile));

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="profile-page-container">
            {/* Super simple nav header for the profile page */}
            <nav className="dashboard-nav" style={{ justifyContent: 'flex-start', gap: '2rem' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                    ← Back to Shopping
                </button>
                <div className="nav-brand" style={{ fontStyle: 'normal', fontSize: '1.5rem' }}>
                    B-Mart
                </div>
            </nav>

            <div className="profile-content">
                <div className="profile-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="profile-header">
                        <h2>My Profile</h2>
                        <p>Manage your personal information and preferences.</p>
                    </div>

                    {error && (
                        <div className="error-message" style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
                            {error}
                        </div>
                    )}

                    {isSaved && (
                        <div className="save-banner" style={{ background: 'var(--action-light)', color: 'var(--action-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                            ✓ Profile saved successfully!
                        </div>
                    )}

                    <form onSubmit={handleSave} className="profile-form">

                        <div className="form-group-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="form-input"
                                    value={profile.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    className="form-input"
                                    value={profile.phone}
                                    onChange={handleInputChange}
                                    placeholder="+91 "
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="form-input"
                                value={profile.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="address">Delivery Address</label>
                            <textarea
                                id="address"
                                name="address"
                                className="form-input"
                                style={{ resize: 'vertical', minHeight: '80px' }}
                                value={profile.address}
                                onChange={handleInputChange}
                                placeholder="Flat / House No. / Building Name..."
                            />
                        </div>

                        <div className="form-group-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="pincode">Pincode</label>
                                <input
                                    type="text"
                                    id="pincode"
                                    name="pincode"
                                    className="form-input"
                                    value={profile.pincode}
                                    onChange={handleInputChange}
                                    maxLength={6}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="dob">Birth Date</label>
                                <input
                                    type="date"
                                    id="dob"
                                    name="dob"
                                    className="form-input"
                                    value={profile.dob}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="gender">Gender</label>
                            <select
                                id="gender"
                                name="gender"
                                className="form-select form-input"
                                value={profile.gender}
                                onChange={handleInputChange}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>

                        <div className="profile-actions">
                            <button type="submit" className="btn-save-profile">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
