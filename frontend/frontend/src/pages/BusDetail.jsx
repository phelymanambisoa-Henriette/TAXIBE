import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { transportService } from '../services/transportService'; // Vérifie ce chemin
import { localisationService } from '../services/localisationService'; // Vérifie ce chemin
import { useAuth } from '../contexts/AuthContext';
import Comments from '../components/Comments'; // Vérifie ce chemin
import FavoriteButton from '../components/FavoriteButton'; // Vérifie ce chemin
import BusMap from '../components/map/BusMap'; // Vérifie ce chemin
import { HiArrowLeft, HiLocationMarker, HiTicket, HiChatAlt, HiMap, HiInformationCircle } from 'react-icons/hi';
import { FaBus } from 'react-icons/fa';
import './BusDetail.css'; // Assure-toi que ce fichier CSS est dans le même dossier

const formatAriary = (value) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('fr-MG').format(value) + ' Ar';
};

const BusDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [bus, setBus] = useState(null);
  const [busDetails, setBusDetails] = useState(null);
  const [arretsMap, setArretsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('info');

  const busId = useMemo(() => parseInt(id, 10), [id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const busRes = await transportService.getBusById(busId);
        setBus(busRes.data);

        const arretsRes = await localisationService.getAllArrets();
        const list = Array.isArray(arretsRes.data) ? arretsRes.data : arretsRes.data.results || [];
        const map = {};
        list.forEach(a => { map[a.id] = a; });
        setArretsMap(map);

        if (isAuthenticated) {
          try {
            const detailsRes = await transportService.getBusDetails(busId);
            setBusDetails(detailsRes.data);
          } catch (err) { console.warn("Détails non dispos"); }
        }
      } catch (e) {
        setError("Impossible de charger ce bus.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [busId, isAuthenticated]);

  if (loading) return <div className="bd-loading"><div className="spinner"></div><p>Chargement...</p></div>;
  if (error) return <div className="bd-error"><h2>❌ Erreur</h2><p>{error}</p></div>;
  if (!bus) return null;

  const depart = arretsMap[bus.primus]?.nomArret || `Arrêt #${bus.primus}`;
  const arrivee = arretsMap[bus.terminus]?.nomArret || `Arrêt #${bus.terminus}`;
  const frais = busDetails?.frais ?? bus.frais;
  const arretsAller = busDetails?.arrets_aller || [];
  const arretsRetour = busDetails?.arrets_retour || [];

  return (
    <div className="bus-detail-page">
      
      {/* HEADER */}
      <div className="bd-header">
        <button onClick={() => navigate(-1)} className="bd-back-link">
          <HiArrowLeft /> Retour
        </button>

        <div className="bd-header-content">
          <div className="bd-title-section">
            <div className="bd-bus-icon"><FaBus /></div>
            <div>
              <h1>Bus {bus.numeroBus}</h1>
              <div className="bd-route-badges">
                <span className="badge">{depart}</span>
                <span className="arrow">→</span>
                <span className="badge">{arrivee}</span>
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

        {/* LES ONGLETS (C'est ce qui manque sur ton écran) */}
        <div className="bd-tabs">
          <button className={`tab-btn ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
            <HiInformationCircle /> Infos
          </button>
          <button className={`tab-btn ${tab === 'carte' ? 'active' : ''}`} onClick={() => setTab('carte')}>
            <HiMap /> Carte
          </button>
          <button className={`tab-btn ${tab === 'avis' ? 'active' : ''}`} onClick={() => setTab('avis')}>
            <HiChatAlt /> Avis
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div className="bd-content">
        
        {/* ONGLET INFOS */}
        {tab === 'info' && (
          <div className="bd-grid-info">
            <div className="bd-card info-summary">
              <h3>Informations</h3>
              <div className="info-row">
                <div className="info-block">
                  <span className="label"><HiTicket /> Tarif</span>
                  <span className="value highlight">{isAuthenticated ? formatAriary(frais) : '🔒'}</span>
                </div>
                <div className="info-block">
                  <span className="label">Ville</span>
                  <span className="value">Tana</span>
                </div>
                <div className="info-block">
                  <span className="label"><HiLocationMarker /> Position</span>
                  <span className="value small">{bus.current_latitude ? 'Connue' : 'Inconnue'}</span>
                </div>
              </div>
            </div>

            <div className="bd-card stops-list">
              <h3>Itinéraire</h3>
              {isAuthenticated ? (
                <div className="stops-container">
                  <div className="stops-column">
                    <h4>Aller</h4>
                    {arretsAller.length > 0 ? (
                      <ul>{arretsAller.map(a => <li key={a.id}><span className="stop-dot"></span> {a.nom}</li>)}</ul>
                    ) : <p className="empty-text">Pas d'info</p>}
                  </div>
                  <div className="stops-column">
                    <h4>Retour</h4>
                    {arretsRetour.length > 0 ? (
                      <ul>{arretsRetour.map(a => <li key={a.id}><span className="stop-dot red"></span> {a.nom}</li>)}</ul>
                    ) : <p className="empty-text">Pas d'info</p>}
                  </div>
                </div>
              ) : <div className="login-block">🔒 Connectez-vous pour voir les arrêts.</div>}
            </div>
          </div>
        )}

        {/* ONGLET CARTE */}
        {tab === 'carte' && (
          <div className="bd-card map-container-full">
            <BusMap selectedBus={busId} showAllBuses={false} showStops={true} />
          </div>
        )}

        {/* ONGLET AVIS */}
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