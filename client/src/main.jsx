import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import AdminApp from './AdminApp.jsx';
import './styles.css';
import './admin.css';

const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin';
document.title = isAdminRoute ? 'DentalCare Admin' : document.title;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdminRoute ? <AdminApp /> : <App />}
  </React.StrictMode>,
);
