import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { utilisateurService } from '../../services/utilisateurService';
import { favoritesService } from '../../services/favoritesService';
import { contributionService } from '../../services/contributionService';
import { interactionService } from '../../services/interactionService';
import { useNavigate } from 'react-router-dom';
import {
  FaUser, FaEnvelope, FaShieldAlt, FaBus, FaEdit, FaSave, FaTimes,
  FaCamera, FaLock, FaHeart, FaHistory, FaTrash, FaSignOutAlt, FaComment
} from 'react-icons/fa';
import './Profil.css';

const Profil = () => {
  const { user, checkAuth, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [formData, setFormData] = useState({ nom: '', email: '', username: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });

  const [formErrors, setFormErrors] = useState({});
  const [favoris, setFavoris] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [commentaires, setCommentaires] = useState([]);
  const [stats, setStats] = useState({
    reputation: 0,
    favoris_count: 0,
    contributions_count: 0
  });

  const loadUserData = useCallback(async () => {
    try {
      const [favRes, contribRes, commRes, statsRes] = await Promise.all([
        favoritesService.getUserFavorites(),
        contributionService.getUserContributions(),
        interactionService.getMyComments(),
        utilisateurService.getStats()
      ]);

      setFavoris(favRes.data);
      setContributions(contribRes.data);
      setCommentaires(commRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Erreur chargement données profil :", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || '',
        email: user.email || '',
        username: user.username || '',
      });
      setAvatarPreview(user.avatar || null);
      loadUserData();
    }
  }, [user, loadUserData]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: null });
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setIsEditing(true);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({
        nom: user.nom || '',
        email: user.email || '',
        username: user.username || '',
      });
      if (avatarFile) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(user.avatar || null);
      setAvatarFile(null);
    }
    setFormErrors({});
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setFormErrors({});

    let payload, isMultipart = false;
    const isTextModified =
      formData.nom !== user.nom ||
      formData.email !== user.email ||
      formData.username !== user.username;

    if (avatarFile || isTextModified) {
      if (avatarFile) {
        isMultipart = true;
        payload = new FormData();
        payload.append('nom', formData.nom);
        payload.append('email', formData.email);
        payload.append('username', formData.username);
        payload.append('avatar', avatarFile);
      } else {
        payload = formData;
      }
    } else {
      setLoading(false);
      setIsEditing(false);
      return;
    }

    try {
      await utilisateurService.updateProfile(payload, isMultipart);
      if (avatarFile) URL.revokeObjectURL(avatarPreview);
      await checkAuth();
      setIsEditing(false);
      alert("Profil mis à jour !");
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData) setFormErrors(errorData);
      else alert("Erreur de mise à jour");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    alert("Fonction de changement de mot de passe à connecter plus tard !");
    setShowPasswordModal(false);
  };

  const handleRemoveFavori = async (id) => {
    try {
      await favoritesService.removeFavorite(id);
      setFavoris((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewBus = (busId) => {
    navigate(`/bus/${busId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <div className="profil-page"><h2>Chargement...</h2></div>;
  const isSaveVisible = isEditing || avatarFile;

  return (
    <div className="profil-page">
      <div className="profil-card-main">
        <div className="profil-header">
          <div className="left">
            <div className="avatar-img">
              {avatarPreview ? <img src={avatarPreview} alt="avatar" />
                : user.username?.charAt(0)}
              {isEditing && (
                <>
                  <label htmlFor="avatar-upload"><FaCamera /></label>
                  <input type="file" id="avatar-upload" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </>
              )}
            </div>
          </div>

          <div className="right">
            <h2>{user.nom || user.username}</h2>
            <p><FaEnvelope /> {user.email}</p>

            <div className="stats">
              <div><strong>{stats.reputation}</strong><span> Réputation</span></div>
              <div><strong>{favoris.length}</strong><span> Favoris</span></div>
              <div><strong>{contributions.length}</strong><span> Contributions</span></div>
            </div>

            <div className="actions">
              {isSaveVisible ? (
                <>
                  <button onClick={handleSaveProfile}><FaSave /> Enregistrer</button>
                  <button onClick={handleEditToggle}><FaTimes /> Annuler</button>
                </>
              ) : (
                <>
                  <button onClick={handleEditToggle}><FaEdit /> Modifier</button>
                  <button onClick={handleLogout}><FaSignOutAlt /> Déconnexion</button>
                </>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="profil-form-area">
            <input name="nom" value={formData.nom} onChange={handleInputChange} placeholder="Nom" />
            <input name="username" value={formData.username} onChange={handleInputChange} placeholder="Nom d'utilisateur" />
            <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Email" />
          </div>
        )}

        <div className="profil-section">
          <h3><FaHeart /> Mes favoris</h3>
          {favoris.length > 0 ? favoris.map(f => (
            <div key={f.id} className="favori-item">
              <p><strong>Bus {f.bus_numero}</strong> - {f.bus_trajet}</p>
              <button onClick={() => handleRemoveFavori(f.id)}><FaTrash /></button>
            </div>
          )) : <p>Aucun favori.</p>}
        </div>

        <div className="profil-section">
          <h3><FaHistory /> Mes contributions</h3>
          {contributions.length > 0 ? contributions.map(c => (
            <div key={c.id}><strong>{c.type}</strong> - {c.description} <em>({c.status})</em></div>
          )) : <p>Aucune contribution.</p>}
        </div>

        <div className="profil-section">
          <h3><FaComment /> Mes commentaires</h3>
          {commentaires.length > 0 ? commentaires.map(c => (
            <div key={c.id}>
              <p><strong>Bus {c.bus_numero}</strong>: {c.contenu}</p>
            </div>
          )) : <p>Aucun commentaire.</p>}
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal-backdrop">
          <div className="modal-password">
            <h3>Changer de mot de passe</h3>
            <form onSubmit={handleChangePassword}>
              <input type="password" name="old_password" placeholder="Ancien mot de passe" onChange={handlePasswordChange} />
              <input type="password" name="new_password" placeholder="Nouveau mot de passe" onChange={handlePasswordChange} />
              <input type="password" name="confirm_password" placeholder="Confirmation" onChange={handlePasswordChange} />
              <button type="submit">Enregistrer</button>
              <button type="button" onClick={() => setShowPasswordModal(false)}>Annuler</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profil;