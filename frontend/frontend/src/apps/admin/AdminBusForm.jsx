// src/apps/admin/AdminBusForm.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, Autocomplete, Polyline } from '@react-google-maps/api';
import { 
  FaBus, FaSave, FaArrowLeft, FaMapMarkerAlt, 
  FaRoute, FaMoneyBillWave, FaTrash, FaSearchLocation, FaMapPin,
  FaCity, FaPlus, FaTimes, FaBuilding, FaSearch
} from 'react-icons/fa';
import api from '../../services/api';
import './AdminBusForm.css';

// Configuration Google Maps
const GOOGLE_MAPS_API_KEY = 'AIzaSyCFoD4Hjb03bnmax3cIzdyc2sEFFaUH7l0';
const libraries = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '450px',
  borderRadius: '12px'
};

// Coordonnées des villes principales de Madagascar
const VILLES_COORDS = {
  'Antananarivo': { lat: -18.8792, lng: 47.5079, zoom: 13 },
  'Toamasina': { lat: -18.1443, lng: 49.3958, zoom: 14 },
  'Antsirabe': { lat: -19.8659, lng: 47.0333, zoom: 14 },
  'Fianarantsoa': { lat: -21.4526, lng: 47.0857, zoom: 14 },
  'Mahajanga': { lat: -15.7167, lng: 46.3167, zoom: 14 },
  'Toliara': { lat: -23.3500, lng: 43.6667, zoom: 14 },
  'Antsiranana': { lat: -12.2765, lng: 49.2913, zoom: 14 },
  'Ambositra': { lat: -20.5300, lng: 47.2400, zoom: 14 },
  'Moramanga': { lat: -18.9333, lng: 48.2167, zoom: 14 },
  'Manakara': { lat: -22.1333, lng: 48.0167, zoom: 14 },
  'default': { lat: -18.8792, lng: 47.5079, zoom: 6 }
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  clickableIcons: false
};

const AdminBusForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const geocoderRef = useRef(null);

  // États du formulaire
  const [formData, setFormData] = useState({
    numeroBus: '',
    frais: '600',
    status: 'Actif',
    villeRef: '',
    quartier: ''
  });

  // États pour les données de référence
  const [villes, setVilles] = useState([]);
  const [quartiers, setQuartiers] = useState([]);
  const [allQuartiers, setAllQuartiers] = useState([]);
  const [selectedVilleName, setSelectedVilleName] = useState('');

  // États pour les modals
  const [showAddVille, setShowAddVille] = useState(false);
  const [showAddQuartier, setShowAddQuartier] = useState(false);
  const [newVille, setNewVille] = useState({ nomVille: '', codePostal: '', pays: 'Madagascar' });
  const [newQuartier, setNewQuartier] = useState({ nomQuartier: '', villeRef: '' });
  const [savingVille, setSavingVille] = useState(false);
  const [savingQuartier, setSavingQuartier] = useState(false);

  // États pour les arrêts du trajet
  const [arrets, setArrets] = useState([]);
  const [arretSearchValues, setArretSearchValues] = useState({});
  const [arretAutocompletes, setArretAutocompletes] = useState({});

  // États Google Maps
  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState(VILLES_COORDS.default);
  const [mapZoom, setMapZoom] = useState(6);
  const [isMapReady, setIsMapReady] = useState(false);

  // États UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clickMode, setClickMode] = useState(true);

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  useEffect(() => {
    fetchVilles();
    fetchQuartiers();
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      fetchBus();
    }
  }, [id, isEditMode]);

  // Filtrer les quartiers par ville
  useEffect(() => {
    if (formData.villeRef) {
      const filtered = allQuartiers.filter(
        q => String(q.villeRef) === String(formData.villeRef) || 
             String(q.villeRef?.id) === String(formData.villeRef)
      );
      setQuartiers(filtered);
    } else {
      setQuartiers([]);
    }
  }, [formData.villeRef, allQuartiers]);

  // Centrer la carte quand on change de ville
  useEffect(() => {
    if (selectedVilleName && isMapReady) {
      const coords = VILLES_COORDS[selectedVilleName] || null;
      
      if (coords) {
        setMapCenter({ lat: coords.lat, lng: coords.lng });
        setMapZoom(coords.zoom);
        if (map) {
          map.panTo({ lat: coords.lat, lng: coords.lng });
          map.setZoom(coords.zoom);
        }
      } else {
        geocodeVille(selectedVilleName);
      }
    }
  }, [selectedVilleName, isMapReady, map]);

  const geocodeVille = async (villeName) => {
    if (!window.google || !window.google.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { address: `${villeName}, Madagascar` },
      (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const newCenter = { lat: location.lat(), lng: location.lng() };
          setMapCenter(newCenter);
          setMapZoom(14);
          if (map) {
            map.panTo(newCenter);
            map.setZoom(14);
          }
        }
      }
    );
  };

  const fetchVilles = async () => {
    try {
      console.log('Chargement des villes...');
      const response = await api.get('/localisation/villes/');
      console.log('Reponse villes:', response.data);
      
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data.results) {
        data = response.data.results;
      }
      
      setVilles(data);
    } catch (err) {
      console.error('Erreur chargement villes:', err);
      setError('Impossible de charger les villes');
      setTimeout(() => setError(''), 5000);
    }
  };

  const fetchQuartiers = async () => {
    try {
      console.log('Chargement des quartiers...');
      const response = await api.get('/localisation/quartiers/');
      console.log('Reponse quartiers:', response.data);
      
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data.results) {
        data = response.data.results;
      }
      
      setAllQuartiers(data);
    } catch (err) {
      console.error('Erreur chargement quartiers:', err);
    }
  };

  const fetchBus = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/transport/bus/${id}/`);
      const bus = response.data;

      const ville = villes.find(v => v.id === (bus.villeRef?.id || bus.villeRef));
      if (ville) {
        setSelectedVilleName(ville.nomVille);
      }

      setFormData({
        numeroBus: bus.numeroBus || '',
        frais: bus.frais || '600',
        status: bus.status || 'Actif',
        villeRef: bus.villeRef?.id || bus.villeRef || '',
        quartier: bus.quartier || ''
      });

      if (bus.trajets && bus.trajets.length > 0) {
        const trajet = bus.trajets[0];
        if (trajet.arrets && trajet.arrets.length > 0) {
          const formattedArrets = trajet.arrets.map((a, index) => ({
            id: a.id || null,
            nomArret: a.nom || a.nomArret || '',
            latitude: a.latitude ? String(a.latitude) : '',
            longitude: a.longitude ? String(a.longitude) : '',
            ordre: index + 1,
            type: index === 0 ? 'depart' : 
                  index === trajet.arrets.length - 1 ? 'arrivee' : 'intermediaire',
            quartier: a.quartier || ''
          }));
          setArrets(formattedArrets);

          if (formattedArrets[0].latitude && formattedArrets[0].longitude) {
            setMapCenter({
              lat: parseFloat(formattedArrets[0].latitude),
              lng: parseFloat(formattedArrets[0].longitude)
            });
            setMapZoom(14);
          }
        }
      }
    } catch (err) {
      console.error('Erreur chargement bus:', err);
      setError('Impossible de charger les donnees du bus');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GESTION DE LA CARTE
  // ==========================================

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    setIsMapReady(true);
    if (window.google && window.google.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, []);

  const handleMapClick = useCallback((event) => {
    if (!clickMode || !formData.villeRef) {
      if (!formData.villeRef) {
        setError('Selectionnez d\'abord une ville');
        setTimeout(() => setError(''), 3000);
      }
      return;
    }

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    if (geocoderRef.current) {
      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results, status) => {
          let nomArret = `Arret ${arrets.length + 1}`;
          
          if (status === 'OK' && results[0]) {
            const addressComponents = results[0].address_components;
            const route = addressComponents.find(c => c.types.includes('route'));
            const neighborhood = addressComponents.find(c => c.types.includes('neighborhood'));
            const locality = addressComponents.find(c => c.types.includes('locality'));
            const sublocality = addressComponents.find(c => c.types.includes('sublocality'));
            
            nomArret = route?.long_name || 
                       neighborhood?.long_name || 
                       sublocality?.long_name ||
                       locality?.long_name || 
                       `Arret ${arrets.length + 1}`;
          }

          addNewArret(nomArret, lat.toFixed(6), lng.toFixed(6));
        }
      );
    } else {
      addNewArret(`Arret ${arrets.length + 1}`, lat.toFixed(6), lng.toFixed(6));
    }
  }, [clickMode, formData.villeRef, arrets.length]);

  const addNewArret = (nom, lat, lng) => {
    setArrets(prev => {
      const newArret = {
        id: null,
        nomArret: nom,
        latitude: lat,
        longitude: lng,
        ordre: prev.length + 1,
        type: prev.length === 0 ? 'depart' : 'arrivee',
        quartier: ''
      };

      const updated = [...prev, newArret].map((arret, i, arr) => ({
        ...arret,
        ordre: i + 1,
        type: i === 0 ? 'depart' : i === arr.length - 1 ? 'arrivee' : 'intermediaire'
      }));

      return updated;
    });

    setSuccess(`Arret "${nom}" ajoute!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  // ==========================================
  // GESTION DES ARRÊTS AVEC AUTOCOMPLETE
  // ==========================================

  const handleArretAutocompleteLoad = (index, autocomplete) => {
    setArretAutocompletes(prev => ({
      ...prev,
      [index]: autocomplete
    }));
  };

  const handleArretPlaceChanged = (index) => {
    const autocomplete = arretAutocompletes[index];
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    if (!place.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const nom = place.name || place.formatted_address || arrets[index].nomArret;

    setArrets(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        nomArret: nom,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6)
      };
      return updated;
    });

    setMapCenter({ lat, lng });
    if (map) {
      map.panTo({ lat, lng });
      map.setZoom(16);
    }

    setSuccess(`Arret "${nom}" localise!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleArretSearchChange = (index, value) => {
    setArretSearchValues(prev => ({
      ...prev,
      [index]: value
    }));

    setArrets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], nomArret: value };
      return updated;
    });
  };

  // ==========================================
  // GESTION DES VILLES
  // ==========================================

  const handleVilleChange = (e) => {
    const villeId = e.target.value;
    setFormData(prev => ({ ...prev, villeRef: villeId, quartier: '' }));

    const ville = villes.find(v => String(v.id) === String(villeId));
    if (ville) {
      setSelectedVilleName(ville.nomVille);
    } else {
      setSelectedVilleName('');
      setMapCenter(VILLES_COORDS.default);
      setMapZoom(6);
    }
  };

  const handleAddVille = async () => {
    if (!newVille.nomVille.trim()) {
      setError('Le nom de la ville est requis');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSavingVille(true);
    try {
      const response = await api.post('/localisation/villes/', {
        nomVille: newVille.nomVille.trim(),
        codePostal: newVille.codePostal.trim() || '000',
        pays: newVille.pays || 'Madagascar'
      });

      const createdVille = response.data;
      setVilles(prev => [...prev, createdVille]);
      setFormData(prev => ({ ...prev, villeRef: createdVille.id }));
      setSelectedVilleName(createdVille.nomVille);
      setNewVille({ nomVille: '', codePostal: '', pays: 'Madagascar' });
      setShowAddVille(false);
      setSuccess('Ville creee avec succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur creation ville:', err);
      setError(err.response?.data?.nomVille?.[0] || 'Erreur lors de la creation');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSavingVille(false);
    }
  };

  // ==========================================
  // GESTION DES QUARTIERS
  // ==========================================

  const handleAddQuartier = async () => {
    if (!newQuartier.nomQuartier.trim()) {
      setError('Le nom du quartier est requis');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSavingQuartier(true);
    try {
      const response = await api.post('/localisation/quartiers/', {
        nomQuartier: newQuartier.nomQuartier.trim(),
        villeRef: parseInt(newQuartier.villeRef || formData.villeRef)
      });

      const createdQuartier = response.data;
      setAllQuartiers(prev => [...prev, createdQuartier]);
      setNewQuartier({ nomQuartier: '', villeRef: '' });
      setShowAddQuartier(false);
      setSuccess('Quartier cree avec succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur creation quartier:', err);
      setError('Erreur lors de la creation du quartier');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSavingQuartier(false);
    }
  };

  // ==========================================
  // GESTION DES ARRÊTS
  // ==========================================

  const handleArretChange = (index, field, value) => {
    setArrets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeArret = (index) => {
    setArrets(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((arret, i) => ({
        ...arret,
        ordre: i + 1,
        type: i === 0 ? 'depart' : i === updated.length - 1 ? 'arrivee' : 'intermediaire'
      }));
    });
  };

  const clearAllArrets = () => {
    if (window.confirm('Supprimer tous les arrets?')) {
      setArrets([]);
    }
  };

  const centerOnArret = (index) => {
    const arret = arrets[index];
    if (arret.latitude && arret.longitude) {
      const center = {
        lat: parseFloat(arret.latitude),
        lng: parseFloat(arret.longitude)
      };
      setMapCenter(center);
      if (map) {
        map.panTo(center);
        map.setZoom(17);
      }
    }
  };

  // ==========================================
  // SOUMISSION DU FORMULAIRE
  // ==========================================

  const validateForm = () => {
    if (!formData.numeroBus.trim()) {
      setError('Le numero de bus est requis');
      return false;
    }

    if (!formData.villeRef) {
      setError('Veuillez selectionner une ville');
      return false;
    }

    if (arrets.length < 2) {
      setError('Le trajet doit avoir au moins 2 arrets (depart et arrivee)');
      return false;
    }

    const invalidArrets = arrets.filter(a => !a.nomArret.trim() || !a.latitude || !a.longitude);
    if (invalidArrets.length > 0) {
      setError('Tous les arrets doivent avoir un nom et des coordonnees');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      setTimeout(() => setError(''), 5000);
      return;
    }

    setSaving(true);

    try {
      // Étape 1: Créer les arrêts
      const arretIds = [];
      
      for (const arret of arrets) {
        if (arret.id) {
          arretIds.push(arret.id);
        } else {
          const arretPayload = {
            nomArret: arret.nomArret.trim(),
            latitude: parseFloat(arret.latitude),
            longitude: parseFloat(arret.longitude),
            villeRef: parseInt(formData.villeRef),
            quartier: arret.quartier ? parseInt(arret.quartier) : (quartiers[0]?.id || null)
          };

          try {
            const arretResponse = await api.post('/localisation/arrets/', arretPayload);
            arretIds.push(arretResponse.data.id);
          } catch (arretErr) {
            console.error('Erreur creation arret:', arretErr);
            throw new Error(`Erreur lors de la creation de l'arret "${arret.nomArret}"`);
          }
        }
      }

      // Étape 2: Créer/Mettre à jour le bus
      const busPayload = {
        numeroBus: formData.numeroBus.trim(),
        frais: parseFloat(formData.frais) || 600,
        status: formData.status,
        villeRef: parseInt(formData.villeRef),
        quartier: formData.quartier || null,
        primus: arretIds[0],
        terminus: arretIds[arretIds.length - 1],
        arrets_ids: arretIds
      };

      if (isEditMode) {
        await api.put(`/transport/bus/${id}/`, busPayload);
        setSuccess('Bus mis a jour avec succes!');
      } else {
        await api.post('/transport/bus/', busPayload);
        setSuccess('Bus cree avec succes!');
      }

      setTimeout(() => navigate('/admin/bus'), 1500);

    } catch (err) {
      console.error('Erreur sauvegarde bus:', err);
      
      if (err.response?.data) {
        const errors = err.response.data;
        let errorMsg = typeof errors === 'string' ? errors :
                       errors.detail || errors.non_field_errors?.join(', ') ||
                       Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' | ');
        setError(errorMsg || 'Erreur lors de la sauvegarde');
      } else {
        setError(err.message || 'Erreur de connexion');
      }

      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Polyline pour connecter les arrêts
  const getPolylinePath = () => {
    return arrets
      .filter(a => a.latitude && a.longitude)
      .map(a => ({ lat: parseFloat(a.latitude), lng: parseFloat(a.longitude) }));
  };

  // ==========================================
  // RENDU
  // ==========================================

  if (loading) {
    return (
      <div className="admin-form-loading">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="admin-bus-form">
      {/* Header */}
      <div className="form-header">
        <button onClick={() => navigate('/admin/bus')} className="btn-back">
          <FaArrowLeft /> Retour
        </button>
        <h1>
          <FaBus /> {isEditMode ? 'Modifier le Bus' : 'Nouveau Bus'}
        </h1>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-layout">
        {/* Colonne gauche : Formulaire */}
        <div className="form-column">
          <form onSubmit={handleSubmit}>
            
            {/* Informations de base */}
            <div className="form-section">
              <h2><FaBus /> Informations du Bus</h2>
              
              {/* Ville */}
              <div className="form-group">
                <label>
                  <FaCity /> Ville * 
                  <span className="label-hint">(La carte se centrera sur cette ville)</span>
                </label>
                <div className="select-with-add">
                  <select
                    name="villeRef"
                    value={formData.villeRef}
                    onChange={handleVilleChange}
                    required
                  >
                    <option value="">-- Selectionner une ville --</option>
                    {villes.map((ville) => (
                      <option key={ville.id} value={ville.id}>
                        {ville.nomVille}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-add-inline"
                    onClick={() => setShowAddVille(true)}
                    title="Ajouter une ville"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>

              {/* Quartier */}
              <div className="form-group">
                <label><FaBuilding /> Quartier (zone desservie)</label>
                <div className="select-with-add">
                  <select
                    name="quartier"
                    value={formData.quartier}
                    onChange={(e) => setFormData(prev => ({ ...prev, quartier: e.target.value }))}
                    disabled={!formData.villeRef}
                  >
                    <option value="">-- Optionnel --</option>
                    {quartiers.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.nomQuartier}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-add-inline"
                    onClick={() => {
                      setNewQuartier({ nomQuartier: '', villeRef: formData.villeRef });
                      setShowAddQuartier(true);
                    }}
                    title="Ajouter un quartier"
                    disabled={!formData.villeRef}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Numero de Bus *</label>
                  <input
                    type="text"
                    name="numeroBus"
                    value={formData.numeroBus}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroBus: e.target.value }))}
                    placeholder="Ex: 135, A1..."
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label><FaMoneyBillWave /> Tarif (Ar)</label>
                  <input
                    type="number"
                    name="frais"
                    value={formData.frais}
                    onChange={(e) => setFormData(prev => ({ ...prev, frais: e.target.value }))}
                    placeholder="600"
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="Maintenance">En maintenance</option>
                </select>
              </div>
            </div>

            {/* Arrêts du trajet */}
            <div className="form-section">
              <div className="section-header">
                <h2><FaRoute /> Arrets du trajet ({arrets.length})</h2>
                {arrets.length > 0 && (
                  <button type="button" className="btn-clear-all" onClick={clearAllArrets}>
                    <FaTrash /> Tout effacer
                  </button>
                )}
              </div>
              
              <div className="section-instructions">
                <p><FaMapPin /> <strong>2 methodes pour ajouter des arrets :</strong></p>
                <ul>
                  <li>🖱️ <strong>Cliquez sur la carte</strong> pour ajouter un arret (nom auto-detecte)</li>
                  <li>🔍 <strong>Cherchez un lieu</strong> dans le champ de l'arret ci-dessous</li>
                </ul>
              </div>

              {arrets.length === 0 ? (
                <div className="no-arrets-message">
                  <FaMapMarkerAlt />
                  <p>Aucun arret pour le moment</p>
                  <span>Selectionnez une ville puis cliquez sur la carte pour commencer</span>
                </div>
              ) : (
                <div className="arrets-list">
                  {arrets.map((arret, index) => (
                    <div 
                      key={index} 
                      className={`arret-item ${arret.type}`}
                    >
                      <div className="arret-header">
                        <span className={`arret-badge ${arret.type}`}>
                          {arret.type === 'depart' ? '🟢 Depart' : 
                           arret.type === 'arrivee' ? '🔴 Arrivee' : `🔵 ${index + 1}`}
                        </span>
                        <div className="arret-actions">
                          <button
                            type="button"
                            className="btn-center-map"
                            onClick={() => centerOnArret(index)}
                            title="Centrer sur la carte"
                            disabled={!arret.latitude || !arret.longitude}
                          >
                            <FaMapMarkerAlt />
                          </button>
                          <button
                            type="button"
                            className="btn-remove-arret"
                            onClick={() => removeArret(index)}
                            title="Supprimer"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      <div className="arret-fields">
                        {/* Champ de recherche avec Autocomplete */}
                        {isMapReady ? (
                          <Autocomplete
                            onLoad={(autocomplete) => handleArretAutocompleteLoad(index, autocomplete)}
                            onPlaceChanged={() => handleArretPlaceChanged(index)}
                            options={{ 
                              componentRestrictions: { country: 'mg' }
                            }}
                          >
                            <div className="arret-search-wrapper">
                              <FaSearch />
                              <input
                                type="text"
                                placeholder="Rechercher ou saisir le nom de l'arret..."
                                value={arretSearchValues[index] !== undefined ? arretSearchValues[index] : arret.nomArret}
                                onChange={(e) => handleArretSearchChange(index, e.target.value)}
                                className="arret-nom-input"
                              />
                            </div>
                          </Autocomplete>
                        ) : (
                          <div className="arret-search-wrapper">
                            <FaSearch />
                            <input
                              type="text"
                              placeholder="Nom de l'arret..."
                              value={arret.nomArret}
                              onChange={(e) => handleArretChange(index, 'nomArret', e.target.value)}
                              className="arret-nom-input"
                            />
                          </div>
                        )}

                        {/* Quartier */}
                        <select
                          value={arret.quartier}
                          onChange={(e) => handleArretChange(index, 'quartier', e.target.value)}
                          className="arret-quartier"
                          disabled={!formData.villeRef}
                        >
                          <option value="">-- Quartier --</option>
                          {quartiers.map((q) => (
                            <option key={q.id} value={q.id}>{q.nomQuartier}</option>
                          ))}
                        </select>

                        {/* Coordonnées */}
                        <div className="coords-row">
                          <div className="coord-field">
                            <span className="coord-label">Lat:</span>
                            <input
                              type="text"
                              value={arret.latitude}
                              className="coord-input"
                              readOnly
                            />
                          </div>
                          <div className="coord-field">
                            <span className="coord-label">Lng:</span>
                            <input
                              type="text"
                              value={arret.longitude}
                              className="coord-input"
                              readOnly
                            />
                          </div>
                        </div>
                        
                        {arret.latitude && arret.longitude && (
                          <span className="coords-valid">✓ Position definie</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Boutons */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => navigate('/admin/bus')}
                disabled={saving}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="btn-save"
                disabled={saving || arrets.length < 2}
              >
                {saving ? 'Sauvegarde...' : (
                  <><FaSave /> {isEditMode ? 'Mettre a jour' : 'Creer le bus'}</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Colonne droite : Carte */}
        <div className="map-column">
          <div className="map-container">
            <div className="map-header">
              <h2><FaMapMarkerAlt /> Carte - {selectedVilleName || 'Madagascar'}</h2>
              <div className="map-mode-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={clickMode}
                    onChange={(e) => setClickMode(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  Mode ajout par clic
                </label>
              </div>
            </div>
            
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                options={mapOptions}
                onLoad={onMapLoad}
                onClick={handleMapClick}
              >
                {/* Marqueurs des arrêts */}
                {arrets.map((arret, index) => (
                  arret.latitude && arret.longitude && (
                    <Marker
                      key={index}
                      position={{
                        lat: parseFloat(arret.latitude),
                        lng: parseFloat(arret.longitude)
                      }}
                      label={{
                        text: String(index + 1),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                      icon={{
                        url: arret.type === 'depart' 
                          ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                          : arret.type === 'arrivee'
                          ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                          : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                      }}
                      title={arret.nomArret || `Arret ${index + 1}`}
                      onClick={() => centerOnArret(index)}
                    />
                  )
                ))}

                {/* Ligne reliant les arrêts */}
                {getPolylinePath().length >= 2 && (
                  <Polyline
                    path={getPolylinePath()}
                    options={{
                      strokeColor: '#3b82f6',
                      strokeOpacity: 0.8,
                      strokeWeight: 4
                    }}
                  />
                )}
              </GoogleMap>
            </LoadScript>

            {/* Légende */}
            <div className="map-legend">
              <div className="legend-item">
                <span className="legend-dot green"></span> Depart (Primus)
              </div>
              <div className="legend-item">
                <span className="legend-dot blue"></span> Intermediaire
              </div>
              <div className="legend-item">
                <span className="legend-dot red"></span> Arrivee (Terminus)
              </div>
            </div>

            {/* Instructions */}
            <div className="map-instructions">
              <h4>📍 Instructions :</h4>
              <ol>
                <li><strong>Selectionnez une ville</strong> - La carte se centre automatiquement</li>
                <li><strong>Cliquez sur la carte</strong> pour ajouter des arrets (dans l'ordre du trajet)</li>
                <li><strong>Ou cherchez</strong> un lieu dans le champ de chaque arret</li>
                <li>Les coordonnees se remplissent automatiquement</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ajouter Ville */}
      {showAddVille && (
        <div className="modal-overlay" onClick={() => setShowAddVille(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaCity /> Ajouter une ville</h3>
              <button className="btn-close-modal" onClick={() => setShowAddVille(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nom de la ville *</label>
                <input
                  type="text"
                  value={newVille.nomVille}
                  onChange={(e) => setNewVille({ ...newVille, nomVille: e.target.value })}
                  placeholder="Ex: Antananarivo"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Code Postal</label>
                <input
                  type="text"
                  value={newVille.codePostal}
                  onChange={(e) => setNewVille({ ...newVille, codePostal: e.target.value })}
                  placeholder="Ex: 101"
                />
              </div>
              <div className="form-group">
                <label>Pays</label>
                <input
                  type="text"
                  value={newVille.pays}
                  onChange={(e) => setNewVille({ ...newVille, pays: e.target.value })}
                  placeholder="Madagascar"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddVille(false)} disabled={savingVille}>
                Annuler
              </button>
              <button className="btn-save" onClick={handleAddVille} disabled={savingVille}>
                {savingVille ? 'Ajout...' : <><FaPlus /> Ajouter</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter Quartier */}
      {showAddQuartier && (
        <div className="modal-overlay" onClick={() => setShowAddQuartier(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaBuilding /> Ajouter un quartier</h3>
              <button className="btn-close-modal" onClick={() => setShowAddQuartier(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nom du quartier *</label>
                <input
                  type="text"
                  value={newQuartier.nomQuartier}
                  onChange={(e) => setNewQuartier({ ...newQuartier, nomQuartier: e.target.value })}
                  placeholder="Ex: Analakely"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Ville</label>
                <select
                  value={newQuartier.villeRef || formData.villeRef}
                  onChange={(e) => setNewQuartier({ ...newQuartier, villeRef: e.target.value })}
                >
                  <option value="">-- Selectionner --</option>
                  {villes.map((ville) => (
                    <option key={ville.id} value={ville.id}>
                      {ville.nomVille}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddQuartier(false)} disabled={savingQuartier}>
                Annuler
              </button>
              <button className="btn-save" onClick={handleAddQuartier} disabled={savingQuartier}>
                {savingQuartier ? 'Ajout...' : <><FaPlus /> Ajouter</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBusForm;