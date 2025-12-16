import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LocaleProvider } from './contexts/LocaleContext'
import './index.css'

// Service Worker Management
if ('serviceWorker' in navigator) {
  // Always unregister existing service workers first to prevent cache issues
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Service Worker unregistered');
        }
      });
    }
    
    // Only register in production after a delay to ensure unregistration completes
    if (import.meta.env.PROD) {
      setTimeout(() => {
        navigator.serviceWorker
          .register('/firebase-messaging-sw.js', {
            scope: '/',
            updateViaCache: 'none' // Always check for updates
          })
          .then((registration) => {
            console.log('Service Worker registered successfully:', registration);
            // Check for updates immediately
            registration.update();
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      }, 1000);
    }
  });
}

// Disable StrictMode in production to prevent double renders and refresh issues
const root = ReactDOM.createRoot(document.getElementById('root'))

if (import.meta.env.PROD) {
  // Production: No StrictMode to prevent double renders
  root.render(
    <LocaleProvider>
      <App />
    </LocaleProvider>
  )
} else {
  // Development: Use StrictMode for better debugging
  root.render(
    <React.StrictMode>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </React.StrictMode>
  )
}

