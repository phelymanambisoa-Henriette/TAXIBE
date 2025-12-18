// src/index.js - AVEC LanguageProvider GLOBAL
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './styles/darkMode.css';
import App from './App';
import { LocationProvider } from './contexts/LocationContext';
import { LanguageProvider } from './contexts/LanguageContext'; // ← AJOUT

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>            
        <LocationProvider>
          <App />
        </LocationProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);