// src/apps/utilisateur/Profil.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { utilisateurService } from '../../services/utilisateurService';
import { favoritesService } from '../../services/favoritesService';
import { contributionService } from '../../services/contributionService';
import interactionService from '../../services/interactionService';
import { useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaEnvelope,
  FaEdit,
  FaSave,
  FaTimes,
  FaCamera,
  FaLock,
  FaHeart,
  FaTrash,
  FaSignOutAlt,
  FaComment,
  FaStar,
  FaBus,
  FaSpinner,
  FaHistory,
  FaEye
} from 'react-icons/fa';
import './Profil.css';

const Profil = () => {
  const { user, checkAuth, logout } = useAuth();
  const navigate = useNavigate();

  // États UI
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState('favoris');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Données du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    username: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Données utilisateur
  const [formErrors, setFormErrors] = useState({});
  const [favoris, setFavoris] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [commentaires, setCommentaires] = useState([]);
  const [stats, setStats] = useState({
    reputation: 0,
    favoris_count: 0,
    contributions_count: 0
  });

  // Afficher un message temporaire
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Charger les données utilisateur
  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        favoritesService.getUserFavorites(),
        contributionService.getUserContributions(),
        interactionService.getMyComments(),
        utilisateurService.getStats()
      ]);

      // Extraire les résultats
      if (results[0].status === 'fulfilled') {
        const favData = results[0].value?.data;
        setFavoris(Array.isArray(favData) ? favData : (favData?.results || []));
      }

      if (results[1].status === 'fulfilled') {
        const contribData = results[1].value?.data;
        setContributions(Array.isArray(contribData) ? contribData : (contribData?.results || []));
      }

      if (results[2].status === 'fulfilled') {
        const commData = results[2].value?.data;
        setCommentaires(Array.isArray(commData) ? commData : (commData?.results || []));
      }

      if (results[3].status === 'fulfilled') {
        setStats(results[3].value?.data || {
          reputation: 0,
          favoris_count: 0,
          contributions_count: 0
        });
      }

    } catch (error) {
      console.error("Erreur chargement données profil :", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effet initial - Charger les données quand user change
  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || user.first_name || user.username || '',
        email: user.email || '',
        username: user.username || '',
      });

      // Gérer l'URL de l'avatar
      if (user.avatar) {
        if (user.avatar.startsWith('http')) {
          setAvatarPreview(user.avatar);
        } else {
          const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
          setAvatarPreview(`${baseUrl}${user.avatar}`);
        }
      } else {
        setAvatarPreview(null);
      }

      loadUserData();
    }
  }, [user, loadUserData]);

  // Gestion des inputs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Gestion des inputs mot de passe
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Gestion du changement d'avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'L\'image ne doit pas dépasser 5MB');
      return;
    }

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Veuillez sélectionner une image valide');
      return;
    }

    // Nettoyer l'ancienne preview
    if (avatarFile && avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setIsEditing(true);
  };

  // Toggle mode édition
  const handleEditToggle = () => {
    if (isEditing) {
      // Annuler les modifications
      setFormData({
        nom: user.nom || user.first_name || user.username || '',
        email: user.email || '',
        username: user.username || '',
      });

      // Nettoyer l'avatar temporaire
      if (avatarFile && avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }

      // Restaurer l'avatar original
      if (user.avatar) {
        if (user.avatar.startsWith('http')) {
          setAvatarPreview(user.avatar);
        } else {
          const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
          setAvatarPreview(`${baseUrl}${user.avatar}`);
        }
      } else {
        setAvatarPreview(null);
      }

      setAvatarFile(null);
      setFormErrors({});
    }
    setIsEditing(!isEditing);
  };

  // Sauvegarder le profil
  const handleSaveProfile = async () => {
    setSaving(true);
    setFormErrors({});

    try {
      const hasTextChanges =
        formData.nom !== (user.nom || user.first_name || user.username || '') ||
        formData.email !== (user.email || '') ||
        formData.username !== (user.username || '');

      // Si aucun changement
      if (!avatarFile && !hasTextChanges) {
        setSaving(false);
        setIsEditing(false);
        showMessage('info', 'Aucune modification détectée');
        return;
      }

      let payload;
      let isMultipart = false;

      if (avatarFile) {
        // Utiliser FormData pour l'upload de fichier
        isMultipart = true;
        payload = new FormData();
        payload.append('avatar', avatarFile);
        
        if (hasTextChanges) {
          payload.append('nom', formData.nom);
          payload.append('email', formData.email);
          payload.append('username', formData.username);
        }
      } else {
        // Envoi JSON simple
        payload = {
          nom: formData.nom,
          email: formData.email,
          username: formData.username
        };
      }

      await utilisateurService.updateProfile(payload, isMultipart);

      // Nettoyer l'URL temporaire de l'avatar
      if (avatarFile && avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }

      // Rafraîchir les données utilisateur
      await checkAuth();
      
      setAvatarFile(null);
      setIsEditing(false);
      showMessage('success', 'Profil mis à jour avec succès !');

    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      
      const errorData = error.response?.data;
      if (errorData) {
        if (typeof errorData === 'object' && !errorData.detail) {
          setFormErrors(errorData);
        } else {
          showMessage('error', errorData.detail || errorData.error || 'Erreur de mise à jour');
        }
      } else {
        showMessage('error', 'Erreur de connexion au serveur');
      }
    } finally {
      setSaving(false);
    }
  };

  // Changer le mot de passe
  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validation
    if (passwordData.new_password !== passwordData.confirm_password) {
      showMessage('error', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.new_password.length < 8) {
      showMessage('error', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      await utilisateurService.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password
      });

      showMessage('success', 'Mot de passe changé avec succès !');
      setShowPasswordModal(false);
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });

    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.old_password?.[0] ||
                       error.response?.data?.new_password?.[0] ||
                       'Erreur lors du changement de mot de passe';
      showMessage('error', errorMsg);
    }
  };

  // Supprimer un favori
  const handleRemoveFavori = async (id) => {
    if (!window.confirm('Supprimer ce favori ?')) return;

    try {
      await favoritesService.removeFavorite(id);
      setFavoris(prev => prev.filter(f => f.id !== id));
      showMessage('success', 'Favori supprimé');
    } catch (error) {
      console.error('Erreur suppression favori:', error);
      showMessage('error', 'Erreur lors de la suppression');
    }
  };

  // Navigation vers un bus
  const handleViewBus = (busId) => {
    if (busId) {
      navigate(`/bus/${busId}`);
    }
  };

  // Déconnexion
  const handleLogout = () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      logout();
      navigate('/login');
    }
  };

  // Affichage chargement initial
  if (!user) {
    return (
      <div className="profil-page">
        <div className="profil-loading">
          <FaSpinner className="spin" />
          <p>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Variable pour afficher les boutons Save/Cancel
  const isSaveVisible = isEditing || avatarFile;

  // Obtenir les initiales pour l'avatar placeholder
  const getInitials = () => {
    const name = user.nom || user.first_name || user.username || user.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="profil-page">
      {/* Message de notification */}
      {message.text && (
        <div className={`profil-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profil-card-main">
        {/* ========== HEADER DU PROFIL ========== */}
        <div className="profil-header">
          {/* Section Avatar */}
          <div className="profil-avatar-section">
            <div className="avatar-container">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar" 
                  className="avatar-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              
              <div 
                className="avatar-placeholder" 
                style={{ display: avatarPreview ? 'none' : 'flex' }}
              >
                {getInitials()}
              </div>

              {isEditing && (
                <label htmlFor="avatar-upload" className="avatar-edit-btn">
                  <FaCamera />
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Section Informations */}
          <div className="profil-info-section">
            <h2 className="profil-name">
              {user.nom || user.first_name || user.username || 'Utilisateur'}
            </h2>
            
            <p className="profil-email">
              <FaEnvelope /> {user.email || 'Email non défini'}
            </p>
            
            <p className="profil-username">
              <FaUser /> @{user.username || 'username'}
            </p>

            {/* Statistiques */}
            <div className="profil-stats">
              <div className="stat-item">
                <FaStar className="stat-icon" />
                <div className="stat-content">
                  <strong>{stats.reputation || 0}</strong>
                  <span>Réputation</span>
                </div>
              </div>
              
              <div className="stat-item">
                <FaHeart className="stat-icon" />
                <div className="stat-content">
                  <strong>{favoris.length}</strong>
                  <span>Favoris</span>
                </div>
              </div>
              
              <div className="stat-item">
                <FaEdit className="stat-icon" />
                <div className="stat-content">
                  <strong>{contributions.length}</strong>
                  <span>Contributions</span>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="profil-actions">
              {isSaveVisible ? (
                <>
                  <button
                    className="btn-primary"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? <FaSpinner className="spin" /> : <FaSave />}
                    {saving ? ' Enregistrement...' : ' Enregistrer'}
                  </button>
                  <button className="btn-secondary" onClick={handleEditToggle}>
                    <FaTimes /> Annuler
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-primary" onClick={handleEditToggle}>
                    <FaEdit /> Modifier
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <FaLock /> Mot de passe
                  </button>
                  <button className="btn-danger" onClick={handleLogout}>
                    <FaSignOutAlt /> Déconnexion
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ========== FORMULAIRE D'ÉDITION ========== */}
        {isEditing && (
          <div className="profil-edit-form">
            <h3>Modifier mes informations</h3>

            <div className="form-group">
              <label htmlFor="nom">Nom complet</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                placeholder="Votre nom"
                className={formErrors.nom ? 'error' : ''}
              />
              {formErrors.nom && (
                <span className="error-text">{formErrors.nom}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Nom d'utilisateur"
                className={formErrors.username ? 'error' : ''}
              />
              {formErrors.username && (
                <span className="error-text">{formErrors.username}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Adresse email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Adresse email"
                className={formErrors.email ? 'error' : ''}
              />
              {formErrors.email && (
                <span className="error-text">{formErrors.email}</span>
              )}
            </div>
          </div>
        )}

        {/* ========== ONGLETS ========== */}
        <div className="profil-tabs">
          <button
            className={activeTab === 'favoris' ? 'active' : ''}
            onClick={() => setActiveTab('favoris')}
          >
            <FaHeart /> Favoris ({favoris.length})
          </button>
          <button
            className={activeTab === 'contributions' ? 'active' : ''}
            onClick={() => setActiveTab('contributions')}
          >
            <FaHistory /> Contributions ({contributions.length})
          </button>
          <button
            className={activeTab === 'commentaires' ? 'active' : ''}
            onClick={() => setActiveTab('commentaires')}
          >
            <FaComment /> Commentaires ({commentaires.length})
          </button>
        </div>

        {/* ========== CONTENU DES ONGLETS ========== */}
        <div className="profil-tab-content">
          {loading ? (
            <div className="tab-loading">
              <FaSpinner className="spin" />
              <p>Chargement...</p>
            </div>
          ) : (
            <>
              {/* ===== ONGLET FAVORIS ===== */}
              {activeTab === 'favoris' && (
                <div className="tab-panel">
                  {favoris.length > 0 ? (
                    favoris.map((favori) => (
                      <div key={favori.id} className="list-item favori-item">
                        <div className="item-icon">
                          <FaBus />
                        </div>
                        <div className="item-content">
                          <strong>
                            Bus {favori.bus_numero || favori.bus?.numeroBus || 'N/A'}
                          </strong>
                          <span>
                            {favori.bus_trajet || favori.bus?.quartier || 'Trajet non spécifié'}
                          </span>
                        </div>
                        <div className="item-actions">
                          <button
                            className="btn-icon view"
                            onClick={() => handleViewBus(favori.bus_id || favori.bus?.id)}
                            title="Voir le bus"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleRemoveFavori(favori.id)}
                            title="Supprimer des favoris"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <FaHeart className="empty-icon" />
                      <p>Vous n'avez pas encore de favoris</p>
                      <button onClick={() => navigate('/recherche')}>
                        Rechercher des bus
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ===== ONGLET CONTRIBUTIONS ===== */}
              {activeTab === 'contributions' && (
                <div className="tab-panel">
                  {contributions.length > 0 ? (
                    contributions.map((contrib) => (
                      <div key={contrib.id} className="list-item contribution-item">
                        <div className="item-icon">
                          <FaEdit />
                        </div>
                        <div className="item-content">
                          <strong>{contrib.type || 'Contribution'}</strong>
                          <span>{contrib.description || contrib.contenu || 'Aucune description'}</span>
                          <div className="item-meta">
                            <span className={`status-badge ${(contrib.status || 'pending').toLowerCase().replace(' ', '_')}`}>
                              {contrib.status || 'En attente'}
                            </span>
                            {contrib.created_at && (
                              <span className="date">
                                {new Date(contrib.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <FaEdit className="empty-icon" />
                      <p>Vous n'avez pas encore contribué</p>
                      <button onClick={() => navigate('/contribuer')}>
                        Faire une contribution
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ===== ONGLET COMMENTAIRES ===== */}
              {activeTab === 'commentaires' && (
                <div className="tab-panel">
                  {commentaires.length > 0 ? (
                    commentaires.map((comment) => (
                      <div key={comment.id} className="list-item comment-item">
                        <div className="item-icon">
                          <FaComment />
                        </div>
                        <div className="item-content">
                          <strong>
                            Bus {comment.bus_numero || comment.bus?.numeroBus || 'N/A'}
                          </strong>
                          <p className="comment-text">
                            {comment.contenu || comment.content || 'Commentaire'}
                          </p>
                          {comment.created_at && (
                            <span className="date">
                              {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <FaComment className="empty-icon" />
                      <p>Vous n'avez pas encore laissé de commentaire</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========== MODAL CHANGEMENT MOT DE PASSE ========== */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaLock /> Changer le mot de passe</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowPasswordModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="modal-body">
              <div className="form-group">
                <label htmlFor="old_password">Ancien mot de passe</label>
                <input
                  type="password"
                  id="old_password"
                  name="old_password"
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  placeholder="Votre mot de passe actuel"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new_password">Nouveau mot de passe</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Minimum 8 caractères"
                  required
                  minLength={8}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password">Confirmer le mot de passe</label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder="Retapez le nouveau mot de passe"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  <FaSave /> Changer le mot de passe
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profil;