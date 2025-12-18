// src/pages/BusDetail.jsx - VERSION COMPLÈTE FINALE

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import trajetService from '../services/trajetService';
import { useAuth } from '../contexts/AuthContext';
import Comments from '../components/Comments';
import FavoriteButton from '../components/FavoriteButton';
import BusMap from '../components/map/BusMap';
import { 
  HiArrowLeft, 
  HiLocationMarker, 
  HiTicket, 
  HiChatAlt, 
  HiMap, 
  HiInformationCircle 
} from 'react-icons/hi';
import { FaBus } from 'react-icons/fa';
import './BusDetail.css';

const formatAriary = (value) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('fr-MG').format(value) + ' Ar';
};

const BusDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [busData, setBusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('info');
  
  // États pour contrôler l'affichage des trajets sur la carte
  const [showAller, setShowAller] = useState(true);
  const [showRetour, setShowRetour] = useState(true);

  const busId = useMemo(() => parseInt(id, 10), [id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('🔄 Chargement du bus avec trajets:', busId);
        
        const data = await trajetService.getBusTrajet(busId);
        console.log('✅ Bus avec trajets chargé:', data);
        
        setBusData(data);
        
      } catch (e) {
        console.error('❌ Erreur chargement bus:', e);
        setError("Impossible de charger ce bus.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [busId]);

  if (loading) {
    return (
      <div className="bd-loading">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bd-error">
        <h2>❌ Erreur</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="btn-retry">
          ← Retour
        </button>
      </div>
    );
  }
  
  if (!busData) return null;

  const { bus, trajets } = busData;

  // Extraire les trajets Aller et Retour
  const trajetAller = trajets?.find(t => t.type === 'Aller');
  const trajetRetour = trajets?.find(t => t.type === 'Retour');

  const arretsAller = trajetAller?.arrets || [];
  const arretsRetour = trajetRetour?.arrets || [];

  return (
    <div className="bus-detail-page">
      
      {/* ========== HEADER ========== */}
      <div className="bd-header">
        <button onClick={() => navigate(-1)} className="bd-back-link">
          <HiArrowLeft /> Retour
        </button>

        <div className="bd-header-content">
          <div className="bd-title-section">
            <div 
              className="bd-bus-icon"
              style={{ backgroundColor: bus.couleur || '#01c6b2' }}
            >
              <FaBus />
            </div>
            <div>
              <h1>Bus {bus.numero}</h1>
              <div className="bd-route-badges">
                <span className="badge">
                  {bus.primus?.nom || 'Départ'}
                </span>
                <span className="arrow">→</span>
                <span className="badge">
                  {bus.terminus?.nom || 'Arrivée'}
                </span>
              </div>
            </div>
          </div>

          <div className="bd-header-actions">
            <span className={`status-pill ${bus.status === 'Actif' ? 'active' : 'inactive'}`}>
              {bus.status === 'Actif' ? 'En Service' : 'Hors Service'}
            </span>
            <FavoriteButton busId={busId} />
          </div>
        </div>

        {/* ========== TABS ========== */}
        <div className="bd-tabs">
          <button 
            className={`tab-btn ${tab === 'info' ? 'active' : ''}`} 
            onClick={() => setTab('info')}
          >
            <HiInformationCircle /> Infos & Carte
          </button>
          <button 
            className={`tab-btn ${tab === 'carte' ? 'active' : ''}`} 
            onClick={() => setTab('carte')}
          >
            <HiMap /> Carte Plein Écran
          </button>
          <button 
            className={`tab-btn ${tab === 'avis' ? 'active' : ''}`} 
            onClick={() => setTab('avis')}
          >
            <HiChatAlt /> Avis
          </button>
        </div>
      </div>

      {/* ========== CONTENT ========== */}
      <div className="bd-content">
        
        {/* ===== TAB INFO AVEC CARTE INTÉGRÉE ===== */}
        {tab === 'info' && (
          <div className="bd-grid-info-with-map">
            
            {/* COLONNE GAUCHE : Infos + Itinéraires */}
            <div className="bd-left-column">
              
              {/* Informations générales */}
              <div className="bd-card info-summary">
                <h3>📊 Informations</h3>
                <div className="info-row">
                  <div className="info-block">
                    <span className="label"><HiTicket /> Tarif</span>
                    <span className="value highlight">
                      {formatAriary(bus.frais)}
                    </span>
                  </div>
                  <div className="info-block">
                    <span className="label"><HiLocationMarker /> Ville</span>
                    <span className="value">Fianarantsoa</span>
                  </div>
                  <div className="info-block">
                    <span className="label">🛤️ Trajets</span>
                    <span className="value">{trajets?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Itinéraires complets */}
              <div className="bd-card stops-list">
                <h3>
                  🚏 Itinéraires Complets
                  <span className="stops-count">
                    ({arretsAller.length + arretsRetour.length} arrêts)
                  </span>
                </h3>

                <div className="stops-container-inline">
                  
                  {/* Trajet Aller */}
                  <div className="trajet-section aller">
                    <div className="trajet-header">
                      <div className="trajet-title">
                        <span className="trajet-icon">↗</span>
                        <h4>Aller</h4>
                        {trajetAller && (
                          <span className="stops-badge">
                            {arretsAller.length} arrêts
                          </span>
                        )}
                      </div>
                    </div>

                    {arretsAller.length > 0 ? (
                      <div className="trajet-route-inline">
                        {arretsAller.map((arret, index) => (
                          <React.Fragment key={`aller-${arret.id}-${index}`}>
                            <span 
                              className={`stop-inline ${index === 0 ? 'first' : ''} ${index === arretsAller.length - 1 ? 'last' : ''}`}
                              title={arret.quartier ? `📍 ${arret.quartier}` : ''}
                            >
                              {arret.nom}
                              {index === 0 && <span className="stop-label-inline depart">Départ</span>}
                              {index === arretsAller.length - 1 && <span className="stop-label-inline arrivee">Arrivée</span>}
                            </span>
                            {index < arretsAller.length - 1 && (
                              <span className="separator-inline">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">
                        {trajetAller 
                          ? "Aucun arrêt configuré pour ce trajet" 
                          : "Trajet Aller non disponible"
                        }
                      </p>
                    )}
                  </div>

                  {/* Trajet Retour */}
                  <div className="trajet-section retour">
                    <div className="trajet-header">
                      <div className="trajet-title">
                        <span className="trajet-icon">↙</span>
                        <h4>Retour</h4>
                        {trajetRetour && (
                          <span className="stops-badge">
                            {arretsRetour.length} arrêts
                          </span>
                        )}
                      </div>
                    </div>

                    {arretsRetour.length > 0 ? (
                      <div className="trajet-route-inline">
                        {arretsRetour.map((arret, index) => (
                          <React.Fragment key={`retour-${arret.id}-${index}`}>
                            <span 
                              className={`stop-inline ${index === 0 ? 'first' : ''} ${index === arretsRetour.length - 1 ? 'last' : ''}`}
                              title={arret.quartier ? `📍 ${arret.quartier}` : ''}
                            >
                              {arret.nom}
                              {index === 0 && <span className="stop-label-inline depart">Départ</span>}
                              {index === arretsRetour.length - 1 && <span className="stop-label-inline arrivee">Arrivée</span>}
                            </span>
                            {index < arretsRetour.length - 1 && (
                              <span className="separator-inline">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">
                        {trajetRetour 
                          ? "Aucun arrêt configuré pour ce trajet" 
                          : "Trajet Retour non disponible"
                        }
                      </p>
                    )}
                  </div>

                </div>
              </div>

            </div>

            {/* COLONNE DROITE : Carte */}
            <div className="bd-right-column">
              <div className="bd-card map-card-integrated">
                <div className="map-header">
                  <h3>🗺️ Carte du Trajet</h3>
                  <div className="map-controls-mini">
                    <button 
                      className={`map-toggle-btn ${showAller ? 'active' : ''}`}
                      onClick={() => setShowAller(!showAller)}
                      title="Afficher/Masquer Aller"
                    >
                      ↗
                    </button>
                    <button 
                      className={`map-toggle-btn ${showRetour ? 'active' : ''}`}
                      onClick={() => setShowRetour(!showRetour)}
                      title="Afficher/Masquer Retour"
                    >
                      ↙
                    </button>
                    <button 
                      className="map-expand-btn"
                      onClick={() => setTab('carte')}
                      title="Voir en plein écran"
                    >
                      ⛶
                    </button>
                  </div>
                </div>
                <div className="map-container-integrated">
                  <BusMap 
                    selectedBus={busId} 
                    showAllBuses={false} 
                    showStops={true}
                  />
                </div>
                <div className="map-legend">
                  <div className="legend-item">
                    <span className="legend-line aller"></span>
                    <span>Trajet Aller</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-line retour"></span>
                    <span>Trajet Retour</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker"></span>
                    <span>Arrêts</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ===== TAB CARTE (Plein écran) ===== */}
        {tab === 'carte' && (
          <div className="bd-card map-container-full">
            <div className="map-fullscreen-header">
              <h3>🗺️ Carte Interactive - Bus {bus.numero}</h3>
              <button 
                className="map-close-btn"
                onClick={() => setTab('info')}
              >
                ← Retour aux infos
              </button>
            </div>
            <BusMap 
              selectedBus={busId} 
              showAllBuses={false} 
              showStops={true} 
            />
          </div>
        )}

        {/* ===== TAB AVIS ===== */}
        {tab === 'avis' && (
          <div className="bd-card comments-container">
            <Comments busId={busId} />
          </div>
        )}

      </div>
    </div>
  );
};

export default BusDetail;