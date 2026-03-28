import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // TailwindCSS debe estar importado aquí
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Bootstrap JS (necesario para Navbar, Dropdowns, etc.)
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = 'TU_CLIENT_ID_GOOGLE';




ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={clientId}>
     <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>
);
