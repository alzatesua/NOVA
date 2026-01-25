import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // TailwindCSS debe estar importado aquí
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = 'TU_CLIENT_ID_GOOGLE';




ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={clientId}>
     <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>
);
