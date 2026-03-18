/**
 * Detects user location and opens OpenStreetMap directions to the shop.
 * @param {Object} shopLocation { lat, lng }
 * @param {Function} showToast Function to show error messages
 */
export const getUserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
};

/**
 * Opens directions from user's location to a shop.
 * @param {Object} shopLocation     { lat, lng }
 * @param {Function} showToast
 * @param {Object|null} savedLocation  Optional pre-saved location { lat, lng } from customer profile.
 *                                     If provided, skips GPS request and uses it directly.
 */
export const openDirections = (shopLocation, showToast, savedLocation = null) => {
    if (!shopLocation || !shopLocation.lat || !shopLocation.lng) {
        showToast('Shop location not available', 'error');
        return;
    }

    const shopLat = shopLocation.lat;
    const shopLng = shopLocation.lng;

    const openMap = (userLat, userLng) => {
        const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLat},${userLng};${shopLat},${shopLng}`;
        window.open(url, '_blank');
    };

    // Priority 1: Use saved profile location (instant — no GPS prompt)
    if (savedLocation?.lat && savedLocation?.lng) {
        showToast('Opening directions from your home location 🏠');
        openMap(savedLocation.lat, savedLocation.lng);
        return;
    }

    // Priority 2: Fall back to live GPS
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', 'error');
        return;
    }

    showToast('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
        (position) => openMap(position.coords.latitude, position.coords.longitude),
        (error) => {
            let message = 'Failed to detect location';
            if (error.code === error.PERMISSION_DENIED) {
                message = 'Location denied — save your home location in your Profile for instant directions';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                message = 'Location information is unavailable';
            } else if (error.code === error.TIMEOUT) {
                message = 'Location request timed out';
            }
            showToast(message, 'error');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
};

/**
 * Calculates the distance between two points in kilometers.
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};
