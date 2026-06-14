import { setCookie, getCookie } from '@utils/cookies';
import { isDeliveryAvailable, SHOP_INFO, DELIVERY_CONFIG } from '@config/srirammart.config';

// Haversine formula — returns distance in km between two lat/lng points
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Check delivery availability purely on the frontend using store coordinates.
// SHOP_INFO has longitude/latitude labels swapped (see config comment):
//   SHOP_INFO.longitude = actual latitude value (23.x)
//   SHOP_INFO.latitude  = actual longitude value (72.x)
export const checkDeliveryAvailabilityLocal = (userLat, userLng) => {
  const storeLat = parseFloat(SHOP_INFO.longitude); // actually lat
  const storeLng = parseFloat(SHOP_INFO.latitude);  // actually lng
  if (!storeLat || !storeLng) return { available: true, distance: 0 };
  const distance = haversineDistance(userLat, userLng, storeLat, storeLng);
  return { available: distance <= DELIVERY_CONFIG.maxDeliveryRadius, distance };
};

// Get user's current location using browser geolocation API
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Get pincode from coordinates using reverse geocoding (mock implementation)
// In production, you would use Google Maps Geocoding API or similar service
export const getPincodeFromCoordinates = async (latitude, longitude) => {
  try {
    // Mock implementation - In production, use actual geocoding API
    // Example: Google Maps Geocoding API
    // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=YOUR_API_KEY`);
    
    // For now, return a default pincode
    // You should implement actual API call here
    
    // Mock response - replace with actual API call
    return {
      pincode: '380060',
      city: 'Ahmedabad',
      state: 'Gujarat',
      area: 'Satellite',
      address: 'Ahmedabad, Gujarat, 380060'
    };
  } catch (error) {
    return null;
  }
};

// Save location to cookies
export const saveLocationToCookie = (locationData) => {
  setCookie('userLocation', JSON.stringify(locationData), 365);
};

// Get location from cookies
export const getLocationFromCookie = () => {
  const locationStr = getCookie('userLocation');
  if (locationStr) {
    try {
      return JSON.parse(locationStr);
    } catch (error) {
      return null;
    }
  }
  return null;
};

// Check if location is already saved
export const hasLocationSaved = () => {
  return getLocationFromCookie() !== null;
};

// Request and save user location
export const requestAndSaveLocation = async () => {
  try {
    const coords = await getCurrentLocation();
    const locationData = await getPincodeFromCoordinates(coords.latitude, coords.longitude);
    
    if (locationData) {
      // Check if delivery is available
      const isAvailable = isDeliveryAvailable(locationData.pincode);
      locationData.deliveryAvailable = isAvailable;
      
      saveLocationToCookie(locationData);
      return { success: true, data: locationData };
    }
    
    return { success: false, error: 'Could not get location details' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
