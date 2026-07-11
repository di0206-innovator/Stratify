import { useEffect, useRef } from 'react';

/**
 * A custom hook to listen to the backend Server-Sent Events (SSE) stream.
 * 
 * @param {Object} eventHandlers - An object mapping event types to callback functions.
 *   Example: {
 *     post_created: (data) => { ... },
 *     post_clapped: (data) => { ... }
 *   }
 */
export default function useRealtime(eventHandlers = {}) {
  const handlersRef = useRef(eventHandlers);

  // Keep handlers ref fresh to avoid re-triggering connection on handler changes
  useEffect(() => {
    handlersRef.current = eventHandlers;
  }, [eventHandlers]);

  useEffect(() => {
    let eventSource = null;
    let reconnectTimeout = null;
    let reconnectDelay = 1000; // start with 1s reconnect delay
    const maxReconnectDelay = 30000;

    function connect() {
      // Connect to the SSE endpoint
      eventSource = new EventSource('/api/realtime/stream');

      eventSource.onopen = () => {
        console.log('⚡ [Realtime] SSE Connection established.');
        reconnectDelay = 1000; // reset delay on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'ping') {
            return; // keepalive ping, ignore
          }

          if (payload.type === 'connected') {
            console.log(`⚡ [Realtime] Server message: ${payload.message}`);
            return;
          }

          // Trigger appropriate registered handler
          const handler = handlersRef.current[payload.type];
          if (handler && typeof handler === 'function') {
            handler(payload.data);
          } else {
            console.debug(`⚡ [Realtime] No handler registered for event type: ${payload.type}`, payload.data);
          }
        } catch (err) {
          console.error('⚡ [Realtime] Failed to parse SSE message payload:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('⚡ [Realtime] SSE connection error. Reconnecting...', err);
        eventSource.close();
        
        // Exponential backoff reconnect
        reconnectTimeout = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
          connect();
        }, reconnectDelay);
      };
    }

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);
}
