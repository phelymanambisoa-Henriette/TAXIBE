// src/apps/admin/AdminBusForm.jsx - VERSION AVEC MOCK DATA

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import '../../leafletConfig';
import './AdminBusForm.css';

import localisationService from '../../services/localisationService';
import busService from '../../services/busService';

// ✅ MOCK DATA pour développement
const MOCK_VILLES = [
  { id: 1, nomVille: 'Antananarivo' },
  { id: 2, nomVille: 'Fianarantsoa' },
  { id: 3, nomVille: 'Toamasina' },
];

const MOCK_ARRETS = [
  { id: 1, nomArret: 'Analakely', latitude: -18.9103, longitude: 47.5255 },
  { id: 2, nomArret: 'Ambohijatovo', latitude: -18.9150, longitude: 47.5280 },
  { id: 3, nomArret: 'Antanimena', latitude: -18.8950, longitude: 47.5200 },
  { id: 4, nomArret: 'Behoririka', latitude: -18.8920, longitude: 47.5320 },
  { id: 5, nomArret: 'Tsaralalana', latitude: -18.9050, longitude: 47.5180 },
  { id: 6, nomArret: '67 Ha', latitude: -18.8850, longitude: 47.5100 },
  { id: 7, nomArret: 'Ankorondrano', latitude: -18.8780, longitude: 47.5150 },
  { id: 8, nomArret: 'Ivandry', latitude: -18.8700, longitude: 47.5200 },
];

const AdminBusForm = () => {
  const navigate = useNavigate();

  const [villes, setVilles] = useState([]);
  const [arrets, setArrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [useMockData, setUseMockData] = useState(false); // ✅ Toggle mock data

  const [formData, setFormData] = useState({
    numeroBus: '',
    villeRef: '',
    quartier: '',
    frais: 600,
    status: 'Actif',
    primus: null,
    terminus: null,
    arretsIntermediaires: [], // ✅ Nouveau : arrêts intermédiaires
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [selectedField, setSelectedField] = useState(null);
  const [modeSelection, setModeSelection] = useState('endpoints'); // 'endpoints' | 'route'

  // ✅ Charger villes + arrêts (avec fallback mock)
  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement villes et arrêts...');
      
      const [villesData, arretsData] = await Promise.all([
        localisationService.getAllVilles(),
        localisationService.getAllArrets(),
      ]);

      console.log('✅ Villes:', villesData);
      console.log('✅ Arrêts:', arretsData);

      if (villesData && villesData.length > 0 && arretsData && arretsData.length > 0) {
        setVilles(villesData);
        setArrets(arretsData);
        setUseMockData(false);
      } else {
        console.warn('⚠️ Pas de données en base, utilisation des mock data');
        setVilles(MOCK_VILLES);
        setArrets(MOCK_ARRETS);
        setUseMockData(true);
      }

    } catch (err) {
      console.error('❌ Erreur chargement:', err);
      console.log('📦 Utilisation des données de test');
      setVilles(MOCK_VILLES);
      setArrets(MOCK_ARRETS);
      setUseMockData(true);
      setAlert({ 
        type: 'warning', 
        message: 'Données de test chargées. Ajoutez des arrêts réels dans la base de données.' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ✅ Centre de la carte basé sur les arrêts
  const centreCarte = useMemo(() => {
    if (arrets.length > 0) {
      const avgLat = arrets.reduce((s, a) => s + (a.latitude || 0), 0) / arrets.length;
      const avgLng = arrets.reduce((s, a) => s + (a.longitude || 0), 0) / arrets.length;
      return [avgLat, avgLng];
    }
    return [-18.8792, 47.5079]; // Antananarivo par défaut
  }, [arrets]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'frais' ? Number(value) || 0 : value,
    }));
    setAlert({ type: '', message: '' });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // ✅ Gestion du clic sur un marqueur
  const handleMarkerClick = (arretId) => {
    if (modeSelection === 'endpoints') {
      // Mode sélection départ/arrivée
      if (selectedField === 'primus') {
        setFormData((prev) => ({ ...prev, primus: arretId }));
        setSelectedField(null);
      } else if (selectedField === 'terminus') {
        setFormData((prev) => ({ ...prev, terminus: arretId }));
        setSelectedField(null);
      } else {
        // Auto : départ puis arrivée
        if (!formData.primus) {
          setFormData((prev) => ({ ...prev, primus: arretId }));
        } else if (!formData.terminus && formData.primus !== arretId) {
          setFormData((prev) => ({ ...prev, terminus: arretId }));
        }
      }
    } else {
      // Mode construction de route
      setFormData((prev) => {
        const intermediaires = [...prev.arretsIntermediaires];
        const index = intermediaires.indexOf(arretId);
        
        if (index > -1) {
          // Déjà sélectionné : retirer
          intermediaires.splice(index, 1);
        } else {
          // Ajouter
          intermediaires.push(arretId);
        }
        
        return { ...prev, arretsIntermediaires: intermediaires };
      });
    }
  };

  const getArretLabel = (id) => {
    const a = arrets.find((x) => x.id === id);
    return a ? a.nomArret || a.nom || `Arrêt #${a.id}` : 'Aucun';
  };

  // ✅ Calculer le trajet complet (départ + intermédiaires + arrivée)
  const trajetComplet = useMemo(() => {
    const route = [];
    if (formData.primus) route.push(formData.primus);
    route.push(...formData.arretsIntermediaires);
    if (formData.terminus && formData.terminus !== formData.primus) {
      route.push(formData.terminus);
    }
    return route;
  }, [formData.primus, formData.terminus, formData.arretsIntermediaires]);

  // ✅ Coordonnées pour la polyline
  const polylinePositions = useMemo(() => {
    return trajetComplet
      .map(id => arrets.find(a => a.id === id))
      .filter(a => a && a.latitude && a.longitude)
      .map(a => [a.latitude, a.longitude]);
  }, [trajetComplet, arrets]);

  const validate = () => {
    const e = {};
    if (!formData.numeroBus.trim()) e.numeroBus = 'Numéro requis';
    if (!formData.villeRef) e.villeRef = 'Ville requise';
    if (!formData.primus) e.primus = 'Arrêt de départ requis';
    if (!formData.terminus) e.terminus = 'Arrêt d\'arrivée requis';
    if (formData.primus === formData.terminus) {
      e.terminus = 'Départ et arrivée doivent être différents';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    if (!validate()) {
      setAlert({ type: 'error', message: 'Veuillez corriger les erreurs' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        numeroBus: formData.numeroBus,
        primus: formData.primus,
        terminus: formData.terminus,
        villeRef: formData.villeRef,
        quartier: formData.quartier || '',
        frais: formData.frais,
        status: formData.status,
        arrets_ids: trajetComplet, // ✅ Inclut les arrêts intermédiaires
      };

      console.log('📤 Payload envoyé:', payload);

      if (useMockData) {
        // Simulation pour mock data
        console.log('⚠️ MODE TEST : Les données ne seront pas sauvegardées');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAlert({ 
          type: 'warning', 
          message: 'Mode test : Bus non sauvegardé. Configurez votre base de données.' 
        });
      } else {
        await busService.createBus(payload);
        setAlert({ type: 'success', message: 'Bus créé avec succès !' });
        setTimeout(() => navigate('/admin/bus'), 1500);
      }

    } catch (err) {
      console.error('❌ Erreur création:', err);
      const data = err.response?.data;
      
      if (data && typeof data === 'object') {
        setErrors((prev) => ({ ...prev, ...data }));
        setAlert({ type: 'error', message: 'Erreur de validation du serveur' });
      } else {
        setAlert({ type: 'error', message: 'Erreur lors de la création du bus' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-bus-form-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-bus-form-page">
      {/* HEADER */}
      <div className="form-header">
        <div>
          <h1>🚌 Ajouter un Bus</h1>
          <p>Configurez un nouveau bus et tracez son itinéraire sur la carte</p>
          {useMockData && (
            <div className="mock-badge">
              📦 Mode test - Données de démonstration
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn-secondary header-back"
          onClick={() => navigate('/admin/bus')}
        >
          ← Retour
        </button>
      </div>

      {/* ALERT */}
      {alert.message && (
        <div className={`form-alert ${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* MODE SELECTION */}
      <div className="mode-selector">
        <button
          type="button"
          className={`mode-btn ${modeSelection === 'endpoints' ? 'active' : ''}`}
          onClick={() => setModeSelection('endpoints')}
        >
          📍 Départ/Arrivée
        </button>
        <button
          type="button"
          className={`mode-btn ${modeSelection === 'route' ? 'active' : ''}`}
          onClick={() => setModeSelection('route')}
        >
           Tracer l'itinéraire
        </button>
      </div>

      <div className="form-grid">
        {/* FORMULAIRE */}
        <form className="bus-form" onSubmit={handleSubmit}>
          {/* Numéro */}
          <div className="form-group">
            <label>Numéro du bus *</label>
            <input
              name="numeroBus"
              value={formData.numeroBus}
              onChange={handleChange}
              placeholder="Ex: 119, 194, 135..."
            />
            {errors.numeroBus && <span className="error-text">{errors.numeroBus}</span>}
          </div>

          {/* Ville */}
          <div className="form-group">
            <label>Ville *</label>
            <select name="villeRef" value={formData.villeRef} onChange={handleChange}>
              <option value="">Sélectionner</option>
              {villes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nomVille}
                </option>
              ))}
            </select>
            {errors.villeRef && <span className="error-text">{errors.villeRef}</span>}
          </div>

          {/* Quartier */}
          <div className="form-group">
            <label>Quartier</label>
            <input
              name="quartier"
              value={formData.quartier}
              onChange={handleChange}
              placeholder="Ex: Analakely, Ivandry..."
            />
          </div>

          {/* Tarif */}
          <div className="form-group">
            <label>Tarif (Ar)</label>
            <input
              type="number"
              name="frais"
              value={formData.frais}
              onChange={handleChange}
              min={0}
              step={100}
            />
          </div>

          {/* Statut */}
          <div className="form-group">
            <label>Statut</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          {modeSelection === 'endpoints' ? (
            <>
              {/* Départ */}
              <div className="form-group">
                <label>Arrêt de départ *</label>
                <div className="select-with-map">
                  <select
                    value={formData.primus || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, primus: Number(e.target.value) || null }))
                    }
                  >
                    <option value="">Choisir</option>
                    {arrets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nomArret}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={`map-select-btn ${selectedField === 'primus' ? 'active' : ''}`}
                    onClick={() => setSelectedField('primus')}
                  >
                    📍 Sur carte
                  </button>
                </div>
                <small className="helper">
                  Sélectionné : <strong>{getArretLabel(formData.primus)}</strong>
                </small>
                {errors.primus && <span className="error-text">{errors.primus}</span>}
              </div>

              {/* Arrivée */}
              <div className="form-group">
                <label>Arrêt d'arrivée *</label>
                <div className="select-with-map">
                  <select
                    value={formData.terminus || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, terminus: Number(e.target.value) || null }))
                    }
                  >
                    <option value="">Choisir</option>
                    {arrets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nomArret}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={`map-select-btn ${selectedField === 'terminus' ? 'active' : ''}`}
                    onClick={() => setSelectedField('terminus')}
                  >
                    📍 Sur carte
                  </button>
                </div>
                <small className="helper">
                  Sélectionné : <strong>{getArretLabel(formData.terminus)}</strong>
                </small>
                {errors.terminus && <span className="error-text">{errors.terminus}</span>}
              </div>
            </>
          ) : (
            <div className="form-group">
              <label>Trajet complet ({trajetComplet.length} arrêts)</label>
              <div className="route-preview">
                {trajetComplet.map((id, index) => (
                  <div key={id} className="route-step">
                    <span className="step-number">{index + 1}</span>
                    <span className="step-name">{getArretLabel(id)}</span>
                    {index < trajetComplet.length - 1 && <span className="step-arrow">→</span>}
                  </div>
                ))}
                {trajetComplet.length === 0 && (
                  <p className="empty-route">Cliquez sur les arrêts dans la carte</p>
                )}
              </div>
              <button
                type="button"
                className="btn-clear-route"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  primus: null, 
                  terminus: null, 
                  arretsIntermediaires: [] 
                }))}
              >
                🗑️ Effacer le trajet
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/admin/bus')}
            >
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '⏳ Enregistrement...' : '✅ Enregistrer'}
            </button>
          </div>
        </form>

        {/* CARTE */}
        <div className="bus-map">
          <div className="map-header">
            <h3>🗺️ Carte interactive</h3>
            <p>
              {modeSelection === 'endpoints' 
                ? 'Cliquez sur les arrêts pour définir départ et arrivée'
                : 'Cliquez sur les arrêts dans l\'ordre du trajet'
              }
            </p>
          </div>
          
          <MapContainer center={centreCarte} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Polyline du trajet */}
            {polylinePositions.length > 1 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: '#667eea',
                  weight: 4,
                  opacity: 0.7,
                }}
              />
            )}

            {/* Marqueurs */}
            {arrets.map((a) => {
              if (!a.latitude || !a.longitude) return null;

              const isPrimus = formData.primus === a.id;
              const isTerminus = formData.terminus === a.id;
              const isInRoute = formData.arretsIntermediaires.includes(a.id);
              const isSelected = isPrimus || isTerminus || isInRoute;

              let iconHtml = '<div class="marker-pin default"></div>';
              if (isPrimus) {
                iconHtml = '<div class="marker-pin start">🚩</div>';
              } else if (isTerminus) {
                iconHtml = '<div class="marker-pin end">🏁</div>';
              } else if (isInRoute) {
                const index = formData.arretsIntermediaires.indexOf(a.id) + 1;
                iconHtml = `<div class="marker-pin intermediate">${index}</div>`;
              }

              const customIcon = L.divIcon({
                className: 'custom-marker',
                html: iconHtml,
                iconSize: [30, 42],
                iconAnchor: [15, 42],
              });

              return (
                <Marker
                  key={a.id}
                  position={[a.latitude, a.longitude]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => handleMarkerClick(a.id),
                  }}
                >
                  <Popup>
                    <div className="marker-popup">
                      <strong>{a.nomArret}</strong>
                      <p>
                        <small>
                          {a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}
                        </small>
                      </p>
                      {!isSelected && (
                        <button
                          type="button"
                          onClick={() => handleMarkerClick(a.id)}
                          className="popup-btn"
                        >
                          ✅ Sélectionner
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminBusForm;