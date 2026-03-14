import React, { useState, useEffect } from 'react';
import { useApp } from '../App';

const API = 'http://localhost:5000/api';

export default function ProfilePage() {
    const { user, showToast } = useApp();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        role: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });

    useEffect(() => {
        if (!user) return;
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API}/users/profile`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setProfile({
                        name: data.name || '',
                        email: data.email || '',
                        role: data.role || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        city: data.city || '',
                        state: data.state || '',
                        pincode: data.pincode || ''
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    phone: profile.phone,
                    address: profile.address,
                    city: profile.city,
                    state: profile.state,
                    pincode: profile.pincode
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast('Profile updated successfully! ✨');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>;

    return (
        <div className="page" style={{ paddingBottom: 60 }}>
            <div className="container" style={{ paddingTop: 40, maxWidth: 800 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>My Profile</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Manage your account settings and personal information</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                    {/* Account Info - Read Only */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                            🛡️ Account Information
                        </h2>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input value={profile.name} readOnly style={{ background: 'var(--bg-card2)', cursor: 'not-allowed', color: 'var(--text-dim)' }} />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input value={profile.email} readOnly style={{ background: 'var(--bg-card2)', cursor: 'not-allowed', color: 'var(--text-dim)' }} />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Account Type</label>
                            <span className="badge badge-primary" style={{ textTransform: 'capitalize', fontSize: 13, padding: '6px 14px' }}>
                                {profile.role}
                            </span>
                        </div>
                    </div>

                    {/* Personal Info - Editable */}
                    <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                            📍 Personal Information
                        </h2>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input name="phone" value={profile.phone} onChange={handleChange} placeholder="Enter phone number" />
                            </div>
                            <div className="form-group">
                                <label>Pincode</label>
                                <input name="pincode" value={profile.pincode} onChange={handleChange} placeholder="6-digit pincode" maxLength={6} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Street Address</label>
                            <input name="address" value={profile.address} onChange={handleChange} placeholder="House no, Street, Area..." />
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>City</label>
                                <input name="city" value={profile.city} onChange={handleChange} placeholder="City name" />
                            </div>
                            <div className="form-group">
                                <label>State</label>
                                <input name="state" value={profile.state} onChange={handleChange} placeholder="State name" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                            <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '12px 32px' }}>
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
