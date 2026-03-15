import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateDistance } from '../utils/geo';

// Fix for default marker icons
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const UserIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to update map view based on markers
function MapUpdater({ markers, userLocation }) {
    const map = useMap();
    useEffect(() => {
        if (!markers || markers.length === 0) return;

        const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
        if (userLocation) {
            bounds.extend([userLocation.lat, userLocation.lng]);
        }

        if (markers.length === 1 && !userLocation) {
            map.setView([markers[0].lat, markers[0].lng], 15);
        } else {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [markers, userLocation, map]);
    return null;
}

/**
 * ShopMap component
 * @param {Object} location - Single location {lat, lng} (legacy/single mode)
 * @param {string} shopName - Single shop name (legacy/single mode)
 * @param {Array} shops - Array of shop objects { _id, name, location: {lat, lng} }
 * @param {Object} userLocation - {lat, lng} of the user
 * @param {string} height - CSS height (default 350px)
 */
export default function ShopMap({ location, shopName, shops = [], userLocation, height = '350px' }) {
    // Determine the list of shop markers
    const markers = shops.length > 0
        ? shops.filter(s => s.location?.lat && s.location?.lng).map(s => ({
            id: s._id,
            name: s.name,
            lat: s.location.lat,
            lng: s.location.lng
        }))
        : (location?.lat && location?.lng ? [{ id: 'single', name: shopName, lat: location.lat, lng: location.lng }] : []);

    if (markers.length === 0 && !userLocation) return null;

    const initialCenter = markers.length > 0 ? [markers[0].lat, markers[0].lng] : (userLocation ? [userLocation.lat, userLocation.lng] : [0, 0]);

    return (
        <div style={{ height, width: '100%', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', marginTop: '24px', position: 'relative' }}>
            <MapContainer center={initialCenter} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {markers.length > 0 && <MapUpdater markers={markers} userLocation={userLocation} />}

                {markers.map(m => (
                    <Marker key={m.id} position={[m.lat, m.lng]}>
                        <Popup>
                            <div style={{ minWidth: 120 }}>
                                <strong style={{ display: 'block', marginBottom: 4 }}>{m.name}</strong>
                                {userLocation && (
                                    <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: 0 }}>
                                        📍 {calculateDistance(userLocation.lat, userLocation.lng, m.lat, m.lng).toFixed(2)} km away
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={UserIcon}>
                        <Popup><strong>You are here</strong></Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}
