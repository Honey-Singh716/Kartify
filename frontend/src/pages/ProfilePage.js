import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { API_URL, IMAGE_URL } from '../config';

const API = API_URL;

/* ─── tiny inline map component (Leaflet via CDN) ─── */
function LocationPickerMap({ location, onChange }) {
    const mapRef = useRef(null);
    const instanceRef = useRef(null);
    const markerRef = useRef(null);
    const containerId = 'customer-location-map';

    useEffect(() => {
        if (instanceRef.current) return; // already initialized

        // Dynamically load Leaflet CSS + JS if not already present
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        const initMap = () => {
            const L = window.L;
            if (!L || !document.getElementById(containerId)) return;

            const defaultLat = location?.lat || 20.5937;
            const defaultLng = location?.lng || 78.9629;

            const map = L.map(containerId, { zoomControl: true }).setView([defaultLat, defaultLng], location?.lat ? 14 : 5);
            instanceRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Custom red marker icon
            const icon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
            });

            // Place marker if we already have a saved location
            if (location?.lat && location?.lng) {
                markerRef.current = L.marker([location.lat, location.lng], { icon, draggable: true }).addTo(map);
                markerRef.current.bindPopup('📍 Your home location').openPopup();
                markerRef.current.on('dragend', (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    onChange({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
                });
            }

            // Click to place / move marker
            map.on('click', (e) => {
                const { lat, lng } = e.latlng;
                const pos = { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                } else {
                    markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
                    markerRef.current.bindPopup('📍 Your home location').openPopup();
                    markerRef.current.on('dragend', (ev) => {
                        const p = ev.target.getLatLng();
                        onChange({ lat: parseFloat(p.lat.toFixed(6)), lng: parseFloat(p.lng.toFixed(6)) });
                    });
                }
                onChange(pos);
            });
        };

        if (window.L) {
            initMap();
        } else {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = initMap;
            document.head.appendChild(script);
        }

        return () => {
            if (instanceRef.current) {
                instanceRef.current.remove();
                instanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, []); // only once

    return (
        <div
            id={containerId}
            ref={mapRef}
            style={{ width: '100%', height: 300, borderRadius: 14, overflow: 'hidden', zIndex: 0 }}
        />
    );
}

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
        pincode: '',
        location: null   // { lat, lng }
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
                        pincode: data.pincode || '',
                        location: data.location?.lat ? data.location : null
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

    const handleMapPick = (coords) => {
        setProfile(prev => ({ ...prev, location: coords }));
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
                    pincode: profile.pincode,
                    location: profile.location
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

    const openDirections = () => {
        if (!profile.location) return;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${profile.location.lat},${profile.location.lng}`;
        window.open(url, '_blank');
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

                        {/* ── Home Location Map ── */}
                        <div style={{ marginTop: 8, marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>🗺️ Your Home Location</label>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                                        Click or drag the pin on the map to set your home location. This helps calculate distance to shops.
                                    </p>
                                </div>
                                {profile.location && (
                                    <button
                                        type="button"
                                        onClick={openDirections}
                                        style={{
                                            background: 'none', border: '1px solid var(--primary)', color: 'var(--primary-light)',
                                            borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                                            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 12
                                        }}
                                    >
                                        🧭 Open in Maps
                                    </button>
                                )}
                            </div>

                            <LocationPickerMap location={profile.location} onChange={handleMapPick} />

                            {profile.location ? (
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                    📌 Saved: {profile.location.lat.toFixed(5)}, {profile.location.lng.toFixed(5)}
                                    <button
                                        type="button"
                                        onClick={() => setProfile(prev => ({ ...prev, location: null }))}
                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', marginLeft: 10, cursor: 'pointer', fontSize: 12 }}
                                    >
                                        ✕ Clear
                                    </button>
                                </p>
                            ) : (
                                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>No location set — click on the map to pin your home.</p>
                            )}
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
