import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0F0F13 0%, #1A1032 50%, #0F0F13 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Glowing orbs */}
            <div style={{ position: 'absolute', top: '20%', left: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(108,61,225,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '10%', right: '20%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

            {/* Main content */}
            <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: 700, position: 'relative', zIndex: 1 }}>
                {/* Logo badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 40,
                    background: 'rgba(108,61,225,0.15)', border: '1px solid rgba(108,61,225,0.3)',
                    borderRadius: 50, padding: '10px 24px'
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'linear-gradient(135deg, #6C3DE1, #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 900, color: '#fff', boxShadow: '0 4px 20px rgba(108,61,225,0.5)'
                    }}>K</div>
                    <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.9)' }}>KARTIFY</span>
                </div>

                {/* Main title */}
                <h1 style={{
                    fontSize: 'clamp(52px, 10vw, 88px)',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    marginBottom: 24,
                    background: 'linear-gradient(135deg, #fff 30%, #8B5CF6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    KARTIFY
                </h1>

                {/* Tagline */}
                <p style={{
                    fontSize: 20,
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.7,
                    marginBottom: 16,
                    maxWidth: 540,
                    margin: '0 auto 16px'
                }}>
                    Discover local shops near you. Order products for home delivery or reserve for shop pickup.
                </p>

                <p style={{
                    fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 52,
                    letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500
                }}>
                    Shops · Products · Delivery · Pickup
                </p>

                {/* CTA Buttons */}
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/home')}
                        style={{
                            background: 'linear-gradient(135deg, #6C3DE1, #8B5CF6)',
                            color: 'white', padding: '18px 40px', borderRadius: 14,
                            fontSize: 17, fontWeight: 700, border: 'none', cursor: 'pointer',
                            boxShadow: '0 8px 32px rgba(108,61,225,0.5)',
                            transition: 'all 0.2s ease',
                            display: 'flex', alignItems: 'center', gap: 10
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(108,61,225,0.65)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(108,61,225,0.5)'; }}>
                        🛍️ Try Kartify
                    </button>

                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
                    {[['9+', 'Categories'], ['Local Shops', 'Near You'], ['Fast', 'Delivery']].map(([val, label]) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary-light)' }}>{val}</div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
