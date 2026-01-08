import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LocaleProvider } from './contexts/LocaleContext'
import './index.css'

// Service Worker Management - COMPLETELY DISABLED to prevent refresh loops
if ('serviceWorker' in navigator) {
  // Unregister ALL service workers immediately - no registration
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Service Worker unregistered');
        }
      });
    }
  });
  
  // Prevent any future service worker registration
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach(registration => registration.unregister());
    });
  });
}

// COMPLETELY DISABLE StrictMode to prevent double renders and refresh loops
const root = ReactDOM.createRoot(document.getElementById('root'))

// No StrictMode in any environment to prevent refresh issues
root.render(
  <LocaleProvider>
    <App />
  </LocaleProvider>
)

