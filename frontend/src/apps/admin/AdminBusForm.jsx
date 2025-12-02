// src/apps/admin/AdminBusForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { transportService } from '../../services/transportService';
import { localisationService } from '../../services/localisationService';
import { useAuth } from '../../contexts/AuthContext';
import { FaSave, FaTrash, FaArrowLeft, FaBus, FaMapMarkerAlt } from 'react-icons/fa';
import GoogleRouteBuilder from '../../components/map/GoogleRouteBuilder'; 
import GoogleMapWrapper from '../../components/map/GoogleMapWrapper';

import './AdminBusForm.css';

// 🔥 Votre clé API Google Maps 🔥
const GOOGLE_MAPS_API_KEY = "AIzaSyA1UBF5vqOCJJwU2SA0mE3yR5y5Uc6mYMU"; 


const AdminBusForm = () => {
  const { user } = useAuth();
  const deny = !!user && !user.is_staff && !user.is_superuser && !user.is_staf;
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    numeroBus: '',
    frais: '',
    status: 'Actif',
    villeRef: '',
    primus: '',
    terminus: '',
  });

  const [routeStops, setRouteStops] = useState([]); // [{id, lat, lng, nom...}, ...]
  const [villes, setVilles] = useState([]);
  const [arrets, setArrets] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: -18.8792, lng: 47.5079 }); // Tana par défaut
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: 'success', text: '' });

  const showToast = (text, type = 'success', duration = 2500) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ ...toast, show: false }), duration);
  };

  // Chargement des listes
  useEffect(() => {
    const loadLists = async () => {
      try {
        const [arsRes, villesRes] = await Promise.all([
          localisationService.getAllArrets(),
          localisationService.getAllVilles(),
        ]);
        setArrets(arsRes.data || []);
        setVilles(villesRes.data || []);
      } catch (e) {
        showToast('Erreur chargement listes (villes/arrêts)', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadLists();
  }, []);

  // Centrage de la carte et gestion du changement de ville
  const handleVilleChange = (e) => {
    const villeId = e.target.value;
    setForm({ ...form, villeRef: villeId, primus: '', terminus: '' });
    setRouteStops([]); // Réinitialise le tracé

    const selectedVille = villes.find(v => String(v.id) === String(villeId));
    if (selectedVille && selectedVille.latitude && selectedVille.longitude) {
      // FORMAT Google Maps {lat, lng}
      setMapCenter({ lat: parseFloat(selectedVille.latitude), lng: parseFloat(selectedVille.longitude) });
    } else {
      setMapCenter({ lat: -18.8792, lng: 47.5079 });
    }
  };
  
  // Met à jour Primus/Terminus du formulaire après tracé sur la carte
  const handleRouteChanged = (stops) => {
      setRouteStops(stops);
      setForm((p) => ({
          ...p,
          primus: stops[0]?.id || '',
          terminus: stops[stops.length - 1]?.id || '',
      }));
  }

  // Arrêts disponibles pour la carte (filtrés par ville)
  const availableStopsForMap = useMemo(() => {
    if (!form.villeRef) return [];
    return arrets.filter(a => String(a.villeRef) === String(form.villeRef));
  }, [arrets, form.villeRef]);


  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (deny) return showToast('Accès refusé', 'error');
    if (!form.numeroBus) return showToast('Numéro du bus requis', 'error');
    if (routeStops.length < 2) return showToast('Tracez le trajet (min 2 arrêts) sur la carte', 'error');

    setSaving(true);
    try {
      const payload = {
        numeroBus: form.numeroBus,
        status: form.status,
        villeRef: parseInt(form.villeRef, 10),
        frais: form.frais !== '' ? Number(form.frais) : 0,
        
        // Envoi des IDs ordonnés (requis par le sérialiseur Django)
        primus: routeStops[0].id,
        terminus: routeStops[routeStops.length - 1].id,
        arrets_ids: routeStops.map(a => a.id), 
      };

      if (isNew) {
        await transportService.createBus(payload);
        showToast('Bus créé avec trajet ✅');
      } else {
        // Logique de mise à jour si tu l'implémentes
        await transportService.updateBus(id, payload);
        showToast('Bus mis à jour ✅');
      }
      setTimeout(() => navigate('/admin/bus'), 500);
    } catch (e) {
      console.error(e);
      showToast('Erreur enregistrement: ' + (e.response?.data?.arrets_ids || e.message), 'error', 5000);
    } finally {
      setSaving(false);
    }
  };

  if (deny) {
    return (
      <div className="admin-denied">
        <h2>⛔ Accès Refusé</h2>
        <p>Cette section est réservée aux administrateurs.</p>
      </div>
    );
  }
  
  return (
    <div className="admin-bus-form-page">
      
      <div className="page-header">
        <button onClick={() => navigate('/admin/bus')} className="btn-back-link">
          <FaArrowLeft /> Retour à la liste
        </button>
        <h1><FaBus /> {isNew ? 'Ajouter un nouveau Bus' : `Éditer Bus N°${form.numeroBus}`}</h1>
        <p>Définissez les informations générales et tracez l'itinéraire sur la carte.</p>
      </div>

      {/* Toast */}
      {toast.show && <div className={`au-toast ${toast.type}`}>{toast.text}</div>}
      
      {loading ? (
          <div className="loading-msg">Chargement des données...</div>
      ) : (
          <form className="form-grid" onSubmit={save}>
              
              {/* COLONNE GAUCHE: Formulaire */}
              <div className="form-col">
                  <div className="form-card">
                      <h3>Infos Générales</h3>

                      <div className="form-group">
                          <label>Ville *</label>
                          <select name="villeRef" value={form.villeRef} onChange={handleVilleChange} required>
                              <option value="">-- Sélectionnez une ville --</option>
                              {villes.map(v => <option key={v.id} value={v.id}>{v.nomVille}</option>)}
                          </select>
                      </div>

                      <div className="form-group">
                          <label>Numéro du bus *</label>
                          <input type="text" name="numeroBus" value={form.numeroBus} onChange={onChange} placeholder="Ex: 119" required />
                      </div>

                      <div className="form-group">
                          <label>Frais (Ar)</label>
                          <input type="number" name="frais" value={form.frais} onChange={onChange} placeholder="Ex: 600" />
                      </div>

                      <div className="form-group">
                          <label>Statut</label>
                          <select name="status" value={form.status} onChange={onChange}>
                              <option value="Actif">Actif</option>
                              <option value="Inactif">Inactif</option>
                          </select>
                      </div>

                      <div className="form-group">
                          <label>Arrêt de départ (Primus)</label>
                          <input type="text" value={routeStops[0]?.nomArret || 'Défini par la carte'} disabled />
                      </div>
                      
                      <div className="form-group">
                          <label>Arrêt d’arrivée (Terminus)</label>
                          <input type="text" value={routeStops[routeStops.length - 1]?.nomArret || 'Défini par la carte'} disabled />
                      </div>

                  </div>
                  
                  <div className="form-submit-footer">
                      <button type="submit" disabled={saving || routeStops.length < 2} className="btn-save-admin">
                          <FaSave /> {saving ? 'Enregistrement...' : (isNew ? 'Créer le Bus' : 'Sauvegarder')}
                      </button>
                      {!isNew && (
                        <button type="button" className="btn-delete-admin">
                           <FaTrash /> Supprimer
                        </button>
                      )}
                  </div>
              </div>

              {/* COLONNE DROITE: Carte */}
              <div className="map-col">
                  <div className="map-card-wrapper">
                      <h3><FaMapMarkerAlt /> Tracer l'itinéraire</h3>
                      <p className="map-instruction">
                          {form.villeRef ? `Ville: ${villes.find(v => String(v.id) === String(form.villeRef))?.nomVille || 'Inconnue'}. Arrêts disponibles: ${availableStopsForMap.length}.` : 'Sélectionnez une ville à gauche pour commencer.'}
                      </p>

                      <div className="map-area">
                          {form.villeRef ? (
                            <GoogleRouteBuilder 
                                apiKey={GOOGLE_MAPS_API_KEY}
                                center={mapCenter}
                                availableStops={availableStopsForMap}
                                onRouteChanged={handleRouteChanged}
                            />
                          ) : (
                            <div className="map-placeholder">
                                Carte inactive. Veuillez sélectionner une ville.
                            </div>
                          )}
                      </div>
                      
                      {routeStops.length > 0 && (
                          <div className="route-summary">
                              <p>Points ajoutés : {routeStops.length}</p>
                              <p className="route-preview">{routeStops.map(s => s.nomArret).join(' ➝ ')}</p>
                          </div>
                      )}
                  </div>
              </div>
          </form>
      )}
    </div>
  );
};

export default AdminBusForm;