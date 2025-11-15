import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Register Firebase Cloud Messaging Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js', {
        scope: '/'
      })
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

