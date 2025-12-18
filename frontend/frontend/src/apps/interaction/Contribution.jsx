// src/apps/interaction/Contribution.jsx - VERSION AVEC MESSAGES AMÉLIORÉS
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { interactionService } from '../../services/interactionService';
import { transportService } from '../../services/transportService';
import { 
  FaPaperPlane, 
  FaBus, 
  FaMapMarkerAlt, 
  FaExclamationTriangle,
  FaLightbulb,
  FaInfoCircle,
  FaImage,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaTrash
} from 'react-icons/fa';
import './Contribution.css';

const Contribution = () => {
  const { isAuthenticated, user } = useAuth();

  // Formulaire - TYPES CORRIGÉS
  const [form, setForm] = useState({
    type: 'autre',        // ✅ CORRIGÉ (était 'problem')
    category: 'trajet',
    title: '',
    description: '',
    busLine: '',
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Liste des bus pour le select
  const [buses, setBuses] = useState([]);

  // Mes contributions
  const [myContributions, setMyContributions] = useState([]);
  const [showMyContributions, setShowMyContributions] = useState(false);
  const [loadingContributions, setLoadingContributions] = useState(false);

  // Charger la liste des bus
  useEffect(() => {
    loadBuses();
  }, []);

  // Charger mes contributions si connecté
  useEffect(() => {
    if (isAuthenticated && showMyContributions) {
      loadMyContributions();
    }
  }, [isAuthenticated, showMyContributions]);

  const loadBuses = async () => {
    try {
      const response = await transportService.getAllBuses();
      setBuses(response.data || []);
    } catch (err) {
      console.error('Erreur chargement bus:', err);
    }
  };

  const loadMyContributions = async () => {
    setLoadingContributions(true);
    try {
      const data = await interactionService.getMyContributions();
      setMyContributions(data);
    } catch (err) {
      console.error('Erreur chargement contributions:', err);
    } finally {
      setLoadingContributions(false);
    }
  };

  // 🆕 FONCTION AMÉLIORÉE POUR AFFICHER LES MESSAGES
  const showMessage = (type, message, duration = 5000) => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }

    // Scroll vers le haut pour voir le message
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto-hide avec animation
    setTimeout(() => {
      const alert = document.querySelector(`.contribution-alert.${type}`);
      if (alert) alert.classList.add('fade-out');
      
      setTimeout(() => {
        if (type === 'success') {
          setSuccess('');
        } else {
          setError('');
        }
      }, 400);
    }, duration);
  };

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const onFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Limite à 5 fichiers
    if (selectedFiles.length > 5) {
      showMessage('error', 'Maximum 5 fichiers autorisés', 3000);
      return;
    }

    // Vérifier la taille (max 5MB par fichier)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversized = selectedFiles.find(f => f.size > maxSize);
    if (oversized) {
      showMessage('error', `Le fichier ${oversized.name} est trop volumineux (max 5MB)`, 3000);
      return;
    }

    setFiles(selectedFiles);
    setError('');
  };

  // 🆕 FONCTION onSubmit AMÉLIORÉE
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isAuthenticated) {
      showMessage('error', 'Veuillez vous connecter pour contribuer.');
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      showMessage('error', 'Le titre et la description sont obligatoires.');
      return;
    }

    if (form.title.length < 10) {
      showMessage('error', 'Le titre doit contenir au moins 10 caractères.');
      return;
    }

    if (form.description.length < 20) {
      showMessage('error', 'La description doit contenir au moins 20 caractères.');
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('category', form.category);
      fd.append('title', form.title);
      fd.append('description', form.description);
      
      if (form.busLine) {
        fd.append('busLine', form.busLine);
        fd.append('bus', form.busLine);
      }

      files.forEach((file, index) => {
        fd.append('attachments', file);
        fd.append(`file_${index}`, file);
      });

      await interactionService.createContribution(fd);
      
      // 🆕 Message de succès immédiat et plus visible
      showMessage('success', '✅ Votre contribution a été envoyée avec succès ! Notre équipe l\'examinera dans les plus brefs délais.');
      
      // Reset form - TYPE CORRIGÉ
      setForm({ 
        type: 'autre',     // ✅ CORRIGÉ (était 'problem')
        category: 'trajet', 
        title: '', 
        description: '', 
        busLine: '' 
      });
      setFiles([]);
      
      // Recharger les contributions après un délai
      if (showMyContributions) {
        setTimeout(() => {
          loadMyContributions();
        }, 500);
      }

    } catch (err) {
      console.error('Erreur envoi contribution:', err);
      showMessage('error', err.response?.data?.detail || "Erreur lors de l'envoi de la contribution");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette contribution ?')) {
      return;
    }

    try {
      await interactionService.deleteContribution(id);
      showMessage('success', '✅ Contribution supprimée', 3000);
      loadMyContributions();
    } catch (err) {
      showMessage('error', 'Erreur lors de la suppression');
    }
  };

  // ICÔNES MISES À JOUR pour correspondre aux types Django
  const getTypeIcon = (type) => {
    switch (type) {
      case 'incident':
        return <FaExclamationTriangle className="type-icon problem" />;
      case 'horaire':
        return <FaClock className="type-icon info" />;
      case 'tarif':
        return <FaInfoCircle className="type-icon suggestion" />;
      case 'trajet':
        return <FaMapMarkerAlt className="type-icon info" />;
      case 'autre':
        return <FaLightbulb className="type-icon suggestion" />;
      default:
        return <FaInfoCircle className="type-icon" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
      case 'en_attente':
        return <span className="status-badge pending"><FaClock /> En attente</span>;
      case 'approved':
      case 'validee':
        return <span className="status-badge approved"><FaCheckCircle /> Validée</span>;
      case 'rejected':
      case 'rejetee':
        return <span className="status-badge rejected"><FaTimesCircle /> Rejetée</span>;
      default:
        return <span className="status-badge pending"><FaClock /> En attente</span>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="contribution-container">
        <div className="contribution-not-auth">
          <h2>🔒 Connexion requise</h2>
          <p>Vous devez être connecté pour soumettre une contribution.</p>
          <a href="/login" className="btn-login">Se connecter</a>
        </div>
      </div>
    );
  }

  return (
    <div className="contribution-container">
      {/* Header */}
      <div className="contribution-header">
        <h1>🤝 Contribuer à TAXIBE</h1>
        <p>Aidez-nous à améliorer les informations sur les transports</p>
      </div>

      {/* Messages FLOTTANTS */}
      {error && (
        <div className="contribution-alert error">
          <FaTimesCircle /> {error}
        </div>
      )}
      
      {success && (
        <div className="contribution-alert success">
          <FaCheckCircle /> {success}
        </div>
      )}

      {/* Toggle mes contributions */}
      <div className="contribution-toggle">
        <button
          onClick={() => setShowMyContributions(!showMyContributions)}
          className="btn-toggle"
        >
          {showMyContributions ? 'Masquer mes contributions' : 'Voir mes contributions'}
        </button>
      </div>

      {/* Liste des contributions */}
      {showMyContributions && (
        <div className="my-contributions-section">
          <h2>📋 Mes contributions</h2>
          
          {loadingContributions ? (
            <div className="loading-contributions">
              <div className="spinner"></div>
              <p>Chargement...</p>
            </div>
          ) : myContributions.length === 0 ? (
            <div className="no-contributions">
              <p>Vous n'avez pas encore de contributions.</p>
            </div>
          ) : (
            <div className="contributions-list">
              {myContributions.map((contrib) => {
                // 🆕 AMÉLIORATION : Vérifier si c'est ma contribution
                const isOwner = user && (
                  contrib.username === user.username ||
                  contrib.utilisateurRef === user.id
                );
                
                return (
                  <div key={contrib.id} className="contribution-item">
                    <div className="contrib-header">
                      <div className="contrib-type">
                        {getTypeIcon(contrib.type)}
                        <h3>{contrib.title || contrib.description.split('\n')[0].substring(0, 50)}</h3>
                      </div>
                      {getStatusBadge(contrib.status || contrib.statut)}
                    </div>
                    
                    <p className="contrib-description">{contrib.description}</p>
                    
                    <div className="contrib-meta">
                      <span className="contrib-category">
                        Type: {contrib.type}
                      </span>
                      {(contrib.busRef || contrib.bus_numero) && (
                        <span className="contrib-bus">
                          <FaBus /> Bus {contrib.bus_numero || contrib.busRef}
                        </span>
                      )}
                      <span className="contrib-date">
                        {new Date(contrib.date_creation || contrib.dateCreation).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {isOwner && contrib.status === 'pending' && (
                      <button
                        onClick={() => handleDelete(contrib.id)}
                        className="btn-delete"
                      >
                        <FaTrash /> Supprimer
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Formulaire */}
      <form className="contribution-form" onSubmit={onSubmit}>
        <div className="form-section">
          <h2>Nouvelle contribution</h2>

          <div className="contribution-grid">
            {/* Type - OPTIONS CORRIGÉES POUR DJANGO */}
            <div className="form-group">
              <label htmlFor="type">
                Type de contribution *
              </label>
              <select 
                id="type"
                name="type" 
                value={form.type} 
                onChange={onChange}
                required
              >
                <option value="incident">🚨 Incident/Problème</option>
                <option value="horaire">🕐 Horaire</option>
                <option value="tarif">💰 Tarif</option>
                <option value="trajet">🗺️ Trajet</option>
                <option value="autre">📝 Autre/Suggestion</option>
              </select>
            </div>

            {/* Catégorie - OPTIONNEL, on peut le garder pour le frontend */}
            <div className="form-group">
              <label htmlFor="category">
                Catégorie détaillée
              </label>
              <select 
                id="category"
                name="category" 
                value={form.category} 
                onChange={onChange}
              >
                <option value="trajet">🗺️ Trajet</option>
                <option value="arret">📍 Arrêt</option>
                <option value="horaire">🕐 Horaire</option>
                <option value="securite">🛡️ Sécurité</option>
                <option value="confort">🪑 Confort</option>
                <option value="tarif">💰 Tarif</option>
                <option value="autre">📝 Autre</option>
              </select>
            </div>

            {/* Bus */}
            <div className="form-group full-width">
              <label htmlFor="busLine">
                <FaBus /> Ligne de bus concernée (optionnel)
              </label>
              <select 
                id="busLine"
                name="busLine" 
                value={form.busLine} 
                onChange={onChange}
              >
                <option value="">-- Sélectionnez un bus --</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    Bus {bus.numeroBus || bus.numero} - {bus.typeTrajet || 'Trajet'}
                  </option>
                ))}
              </select>
            </div>

            {/* Titre */}
            <div className="form-group full-width">
              <label htmlFor="title">
                Titre * <small>(min. 10 caractères)</small>
              </label>
              <input 
                id="title"
                type="text"
                name="title" 
                value={form.title} 
                onChange={onChange}
                placeholder="Ex: Nouvel arrêt près du marché de..."
                minLength={10}
                required
              />
              <small className="char-count">
                {form.title.length}/10 caractères
              </small>
            </div>

            {/* Description */}
            <div className="form-group full-width">
              <label htmlFor="description">
                Description détaillée * <small>(min. 20 caractères)</small>
              </label>
              <textarea 
                id="description"
                name="description" 
                rows="6" 
                value={form.description} 
                onChange={onChange}
                placeholder="Décrivez en détail votre contribution..."
                minLength={20}
                required
              />
              <small className="char-count">
                {form.description.length}/20 caractères
              </small>
            </div>

            {/* Photos */}
            <div className="form-group full-width">
              <label htmlFor="files">
                <FaImage /> Photos (optionnel, max 5 fichiers)
              </label>
              <input 
                id="files"
                type="file" 
                multiple 
                accept="image/*" 
                onChange={onFileChange}
              />
              {files.length > 0 && (
                <div className="files-preview">
                  {files.map((file, index) => (
                    <div key={index} className="file-item">
                      📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="contribution-submit">
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <FaPaperPlane /> Envoyer la contribution
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Info box */}
      <div className="contribution-info">
        <h3>ℹ️ Informations</h3>
        <ul>
          <li>Toutes les contributions sont examinées avant publication</li>
          <li>Vous recevrez une notification une fois votre contribution validée</li>
          <li>Les contributions de qualité améliorent l'expérience de tous</li>
        </ul>
      </div>
    </div>
  );
};

export default Contribution;