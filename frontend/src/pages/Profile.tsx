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
                if (parsedUser.username) defaultProfile.name = parsedUser.username;
                if (parsedUser.email) defaultProfile.email = parsedUser.email;
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

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate API save by writing to localStorage
        localStorage.setItem('userProfile', JSON.stringify(profile));

        // Attempt to update the base 'user' name as well so it reflects in the dashboard
        const savedUserStr = localStorage.getItem('user');
        if (savedUserStr) {
            try {
                const parsedUser = JSON.parse(savedUserStr);
                parsedUser.username = profile.name;
                localStorage.setItem('user', JSON.stringify(parsedUser));
            } catch (e) { }
        }

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000); // Hide banner after 3 seconds
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
