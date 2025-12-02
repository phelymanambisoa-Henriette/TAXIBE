// src/pages/NearbyBuses.jsx
import React, { useEffect, useMemo, useState } from 'react';
import useGeolocation from '../hooks/useGeolocation';
import { localisationService } from '../services/localisationService';
import { transportService } from '../services/transportService';
import { calculerDistance, formaterDistance } from '../utils/carteUtils';
import { FaLocationArrow, FaBus, FaMapMarkerAlt, FaSync } from 'react-icons/fa';

const NearbyBuses = () => {
  const { location, error: geoError, loading: geoLoading } = useGeolocation();

  const [arrets, setArrets] = useState([]);
  const [buses, setBuses] = useState([]);
  const [trajetsIndex, setTrajetsIndex] = useState(new Map()); // arretId -> Set(busNumero)
  const [radiusKm, setRadiusKm] = useState(1); // rayon par défaut 1 km
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErr('');
    try {
      const [arretsRes, busesRes] = await Promise.all([
        localisationService.getAllArrets(),
        transportService.getAllBuses(),
      ]);

      const arretsData = arretsRes.data || [];
      const busesData = busesRes.data || [];

      setArrets(arretsData);
      setBuses(busesData);

      // Construire l'index arretId -> Set(busNumero) en récupérant les trajets
      const index = new Map();
      for (const bus of busesData) {
        try {
          const det = await transportService.getBusById(bus.id);
          const busDetails = det.data;
          if (busDetails.trajets && busDetails.trajets.length > 0) {
            busDetails.trajets.forEach((trajet) => {
              (trajet.arrets || []).forEach((a) => {
                if (!index.has(a.id)) index.set(a.id, new Set());
                index.get(a.id).add(bus.numeroBus || bus.numero || `#${bus.id}`);
              });
            });
          }
        } catch (e) {
          // On ignore les erreurs de détail bus pour ne pas bloquer
          console.warn('Bus detail error', bus.id, e?.response?.status || e?.message);
        }
      }
      setTrajetsIndex(index);
    } catch (e) {
      console.error('Erreur chargement données Nearby:', e);
      setErr("Impossible de charger les données (arrêts/bus).");
    } finally {
      setLoading(false);
    }
  };

  const nearestStops = useMemo(() => {
    if (!location || arrets.length === 0) return [];
    const { latitude, longitude } = location;

    const enriched = arrets.map((a) => {
      const dist = calculerDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(a.latitude),
        parseFloat(a.longitude)
      );
      const busSet = trajetsIndex.get(a.id) || new Set();
      return {
        ...a,
        distanceKm: dist,
        busList: Array.from(busSet),
      };
    });

    // Filtrer par rayon et trier par distance
    return enriched
      .filter((a) => a.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20); // limiter à 20 pour l'affichage
  }, [location, arrets, trajetsIndex, radiusKm]);

  const refreshGeo = () => {
    // Le hook useGeolocation watch déjà la position,
    // mais on peut forcer un refresh de l’UI
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h1 style={{ marginBottom: 8 }}>🧭 Bus proches de vous</h1>
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
          Trouvez les arrêts et lignes à proximité de votre position.
        </p>

        {/* Etat géolocalisation */}
        {geoLoading ? (
          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
            Obtention de votre position...
          </div>
        ) : geoError ? (
          <div style={{ padding: 12, background: 'rgba(244, 67, 54, 0.15)', borderRadius: 8, border: '1px solid rgba(244, 67, 54, 0.3)' }}>
            ⚠️ Géolocalisation indisponible: {geoError}
            <div style={{ marginTop: 8 }}>
              - Vérifiez les permissions du navigateur (icône cadenas  ,  Site settings  ,  Location: Allow)
              <br />
              - Sur Windows: Paramètres  ,  Confidentialité  ,  Position: activée
            </div>
          </div>
        ) : location ? (
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <FaLocationArrow />
              <span>
                Lat {Number(location.latitude).toFixed(5)}, Lng {Number(location.longitude).toFixed(5)} • ±
                {Math.round(location.accuracy)}m
              </span>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                Rayon:
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value={0.3}>300 m</option>
                  <option value={0.5}>500 m</option>
                  <option value={1}>1 km</option>
                  <option value={2}>2 km</option>
                  <option value={5}>5 km</option>
                </select>
              </label>

              <button
                onClick={refreshGeo}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <FaSync /> Actualiser
              </button>
            </div>
          </div>
        ) : null}

        {err && (
          <div style={{ marginTop: 12, padding: 12, background: 'rgba(244, 67, 54, 0.1)', borderRadius: 8, border: '1px solid rgba(244,67,54,0.25)' }}>
            {err}
          </div>
        )}
      </div>

      {/* Résultats */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          padding: 20,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h2 style={{ marginBottom: 16 }}>📍 Arrêts à proximité</h2>

        {loading ? (
          <div style={{ padding: 12 }}>Chargement des arrêts et lignes...</div>
        ) : !location ? (
          <div style={{ padding: 12 }}>
            Autorisez la géolocalisation pour voir les arrêts proches.
          </div>
        ) : nearestStops.length === 0 ? (
          <div style={{ padding: 12 }}>
            Aucun arrêt trouvé dans un rayon de {radiusKm} km.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {nearestStops.map((a) => (
              <div
                key={a.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: 14,
                  background: 'var(--bg-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FaMapMarkerAlt />
                  <strong>{a.nomArret || a.nom}</strong>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
                    {formaterDistance(a.distanceKm)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(a.busList.length ? a.busList : []).map((num) => (
                    <span
                      key={`${a.id}-${num}`}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <FaBus /> {num}
                    </span>
                  ))}
                  {a.busList.length === 0 && (
                    <span style={{ color: 'var(--text-tertiary)' }}>Aucune ligne indexée</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyBuses;