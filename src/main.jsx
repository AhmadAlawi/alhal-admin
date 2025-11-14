import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { useServiceWorker } from './hooks/useServiceWorker'
import './index.css'

// Service Worker Registration Component
const ServiceWorkerRegistration = () => {
  useServiceWorker();
  return null;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ServiceWorkerRegistration />
    <App />
  </React.StrictMode>
)

