// src/components/map/GoogleMapWrapper.jsx
import React from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import GoogleRouteBuilder from './GoogleRouteBuilder';

// VOTRE CLÉ API GOOGLE MAPS
const GOOGLE_MAPS_API_KEY = "AIzaSyA1UBF5vqOCJJwU2SA0mE3yR5y5Uc6mYMU";

const GoogleMapWrapper = (props) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script-main',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
        preventGoogleFontsLoading: true
    });

    // ✅ Log la clé utilisée au chargement du composant
    console.log("📌 Clé Google Maps utilisée :", GOOGLE_MAPS_API_KEY);

    if (loadError) {
        console.error("❌ Erreur de chargement Google Maps >", loadError);
        return (
            <div className="map-error-placeholder">
                Erreur de chargement Google Maps : {loadError.message}
            </div>
        );
    }

    if (!isLoaded) {
        console.log("🕒 Google Maps en chargement...");
        return <div className="map-loading-placeholder">Chargement Google Maps...</div>;
    }

    console.log("✅ Google Maps chargée avec succès");

    return <GoogleRouteBuilder {...props} apiKey={GOOGLE_MAPS_API_KEY} />;
};

export default GoogleMapWrapper;