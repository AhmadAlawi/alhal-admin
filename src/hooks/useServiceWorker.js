import { useEffect, useState } from 'react';

/**
 * Hook to register Firebase Cloud Messaging service worker
 */
export const useServiceWorker = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js', {
          scope: '/'
        })
        .then((reg) => {
          console.log('Service Worker registered:', reg);
          setRegistration(reg);
          setIsRegistered(true);
          setError(null);
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
          setError(err);
          setIsRegistered(false);
        });
    } else {
      console.warn('Service Workers are not supported in this browser');
      setError(new Error('Service Workers are not supported'));
    }
  }, []);

  return { isRegistered, registration, error };
};

export default useServiceWorker;

