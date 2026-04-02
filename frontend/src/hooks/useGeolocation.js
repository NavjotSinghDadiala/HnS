import { useState, useEffect } from 'react';

/**
 * Hook to get user's geolocation
 * Returns { latitude, longitude, error, loading }
 */
export const useGeolocation = () => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation not supported',
        loading: false,
      }));
      return;
    }

    const success = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
      });
    };

    const error = (err) => {
      console.warn('Geolocation error:', err);
      setLocation(prev => ({
        ...prev,
        error: err.message || 'Unable to retrieve location',
        loading: false,
      }));
    };

    // Request geolocation with high accuracy
    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }, []);

  return location;
};

/**
 * Reverse geocode coordinates to nearest area using backend endpoint
 */
export const reverseGeocodeToArea = async (latitude, longitude) => {
  try {
    // For now, use a simple mapping based on coordinates
    // In production, you'd use a proper reverse geocoding API
    const area = coordinatesToArea(latitude, longitude);
    return area;
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    return 'Thane'; // Default fallback
  }
};

/**
 * Area coordinates (approximate center points)
 * Used to find the closest area to user's location
 */
const AREA_COORDINATES = {
  'Airoli': { lat: 19.14, lon: 72.83 },
  'Rabale': { lat: 19.18, lon: 72.80 },
  'Ghansoli': { lat: 19.13, lon: 72.91 },
  'Kopar Khairane': { lat: 19.17, lon: 72.93 },
  'Vashi': { lat: 19.08, lon: 72.99 },
  'Sanpada': { lat: 19.05, lon: 72.95 },
  'Juinagar': { lat: 19.04, lon: 72.82 },
  'Nerul': { lat: 19.03, lon: 73.02 },
  'Seawoods': { lat: 19.01, lon: 73.01 },
  'Belapur': { lat: 18.98, lon: 72.99 },
  'Kharghar': { lat: 18.94, lon: 73.07 },
  'Mansarovar': { lat: 18.96, lon: 73.12 },
  'Khandeshwar': { lat: 18.93, lon: 73.15 },
  'Panvel': { lat: 18.95, lon: 73.13 },
  'Thane': { lat: 19.22, lon: 72.85 },
  'Kalyan Subdistrict': { lat: 19.27, lon: 73.18 },
  'Kalyan-Dombivli': { lat: 19.23, lon: 73.22 },
  'Mumbai': { lat: 19.08, lon: 72.88 },
  'Navi Mumbai': { lat: 19.05, lon: 73.00 },
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

/**
 * Find the closest area to user's coordinates
 * Returns the nearest area name based on distance calculation
 */
const coordinatesToArea = (lat, lon) => {
  let closestArea = 'Thane'; // Default fallback
  let closestDistance = Infinity;

  // Calculate distance to each area and find the closest one
  Object.entries(AREA_COORDINATES).forEach(([areaName, coords]) => {
    const distance = calculateDistance(lat, lon, coords.lat, coords.lon);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestArea = areaName;
    }
  });

  console.log(`Detected location: ${closestArea} (distance: ${closestDistance.toFixed(2)}km from lat=${lat}, lon=${lon})`);
  return closestArea;
};
