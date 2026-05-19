import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Suppress ResizeObserver loop completed with undelivered notifications
window.addEventListener('error', e => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications' || e.message === 'ResizeObserver loop limit exceeded') {
    const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div');
    const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
    if (resizeObserverErr) resizeObserverErr.style.display = 'none';
    if (resizeObserverErrDiv) resizeObserverErrDiv.style.display = 'none';
    e.stopImmediatePropagation();
  }
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);