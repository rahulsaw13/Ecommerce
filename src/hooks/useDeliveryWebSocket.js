import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Subscribes to real-time delivery location updates via STOMP/WebSocket.
 * @param {string|number} orderId
 * @param {function} onLocationUpdate - called with { latitude, longitude, heading, speed_kmh, timestamp }
 * @param {boolean} active - only connect when true
 */
function useDeliveryWebSocket(orderId, onLocationUpdate, active = true) {
  const clientRef = useRef(null);

  const connect = useCallback(() => {
    if (!orderId || !active) return;

    const baseUrl = window.location.origin;
    const sockUrl = `${baseUrl}/ws/delivery`;

    const client = new Client({
      webSocketFactory: () => new SockJS(sockUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/delivery/${orderId}`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload?.data?.location) {
              onLocationUpdate(payload.data.location);
            }
          } catch (e) {
            // ignore malformed frames
          }
        });
      },
    });

    client.activate();
    clientRef.current = client;
  }, [orderId, active, onLocationUpdate]);

  useEffect(() => {
    connect();
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [connect]);
}

export default useDeliveryWebSocket;
