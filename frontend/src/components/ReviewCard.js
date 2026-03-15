import React from 'react';

export default function ReviewCard({ review }) {
    const stars = Math.round(review.rating || 0);
    const date = new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const name = review.userName || (review.user && review.user.name) || (review.user_id && review.user_id.name) || 'Anonymous';

    return (
        <div style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#6C3DE1,#8B5CF6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0
                }}>
                    {name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>{date}</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <div className="stars">
                        {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} style={{ color: s <= stars ? '#F59E0B' : '#3A3A55' }}>★</span>
                        ))}
                    </div>
                </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{review.comment}</p>
        </div>
    );
}
