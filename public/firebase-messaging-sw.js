// Firebase Cloud Messaging Service Worker
// This file must be in the public directory

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
// Use the same config as in your firebase.js file
const firebaseConfig = {
  apiKey: "AIzaSyAgSRBVMvec3CxML8qf2RrKxGyP43DEWbs",
  authDomain: "rizaq-app-9b13f.firebaseapp.com",
  projectId: "rizaq-app-9b13f",
  storageBucket: "rizaq-app-9b13f.firebasestorage.app",
  messagingSenderId: "685567565249",
  appId: "1:685567565249:web:da7aed7ea8a7f733f5a340",
  measurementId: "G-6YFM77D5Y5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification',
    icon: payload.notification?.icon || payload.data?.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    image: payload.notification?.image || payload.data?.image,
    data: payload.data || {},
    tag: payload.data?.tag || 'notification',
    requireInteraction: payload.data?.requireInteraction || false,
    actions: payload.data?.actions || []
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  // Handle notification action clicks
  if (event.action) {
    console.log('Action clicked:', event.action);
    // Handle different actions
    if (event.action === 'view') {
      event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
      );
    }
    return;
  }

  // Default: open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      const urlToOpen = event.notification.data?.url || '/';
      
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed.', event);
});

