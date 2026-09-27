import { useEffect, useRef, useState } from 'react';
import { allApiWithHeaderToken } from '@api/api';
import { API_CONSTANTS } from '@constants/apiurl';

const useDeliveryLocationTracker = (orderId, intervalMs = 15000) => {
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const latestPositionRef = useRef(null);
  const [gpsError, setGpsError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser/device.');
      return;
    }

    setGpsError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        latestPositionRef.current = pos.coords;
        setGpsError(null);
      },
      (err) => {
        const msg = err.code === 1
          ? 'GPS permission denied. Allow location access to enable tracking.'
          : 'Unable to get GPS location. Please check device settings.';
        setGpsError(msg);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    const push = async () => {
      const coords = latestPositionRef.current;
      if (!coords) return;
      try {
        await allApiWithHeaderToken(
          API_CONSTANTS.DELIVERY_UPDATE_LOCATION,
          {
            order_id: orderId,
            lat: coords.latitude,
            lng: coords.longitude,
            heading: coords.heading != null ? coords.heading : undefined,
            speed_kmh: coords.speed != null ? parseFloat((coords.speed * 3.6).toFixed(1)) : undefined,
          },
          'post'
        );
      } catch (_) {}
    };

    push();
    intervalRef.current = setInterval(push, intervalMs);

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderId, intervalMs]);

  return { gpsError };
};

export default useDeliveryLocationTracker;
