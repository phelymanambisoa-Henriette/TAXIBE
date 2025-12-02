// src/apps/utilisateur/Register.jsx (VERSION COMPLÈTE & STABLE)
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaCheckCircle, FaCamera } from 'react-icons/fa';
import './Register.css';

const Register = () => {
  // 🔥 Utilisation du hook et assignation explicite pour éviter les conflits de scope
  const auth = useAuth();
  const register = auth.register; 
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    // ... (Logique de validation) ...
    const e = {};
    if (!formData.username.trim()) e.username = "Nom d'utilisateur requis";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email invalide';
    if (!formData.password) e.password = 'Mot de passe requis';
    if (formData.password.length < 6) e.password = '6 caractères minimum';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setSubmitError('');
  };

  const handleAvatarChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setAvatarFile(file);
          setAvatarPreview(URL.createObjectURL(file));
      } else {
          setAvatarFile(null);
          setAvatarPreview(null);
      }
      setSubmitError('');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError('');

    let payload;
    let isMultipart = false;

    if (avatarFile) {
        isMultipart = true;
        payload = new FormData();
        payload.append('username', formData.username);
        payload.append('password', formData.password);
        if (formData.email) payload.append('email', formData.email);
        payload.append('avatar', avatarFile); 
    } else {
        payload = {
            username: formData.username,
            password: formData.password,
            email: formData.email || undefined,
        };
    }

    // L'appel à register fonctionne maintenant
    const result = await register(payload, isMultipart); 
    setLoading(false);

    if (result.success) {
      navigate('/profil'); 
    } else {
      setSubmitError(result.error || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="register-page">
      
      {/* FOND ANIMÉ / CARTE VERRE */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="register-glass-card">
        <div className="register-header">
          <h2>Créer un compte</h2>
          <p>Rejoignez la communauté TaxiBe</p>
        </div>

        {submitError && <div className="error-message">{submitError}</div>}

        <form onSubmit={handleSubmit} className="glass-form">
          
          {/* Section Upload Avatar */}
          <div className="avatar-upload-group">
            
            {/* VIGNETTE DE PRÉVISUALISATION */}
            <div className="vignette-preview">
                {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="preview-image-constrained" />
                ) : (
                    <FaUser size={30} className="default-user-icon" />
                )}
            </div>
            
            <label htmlFor="avatar-file" className="btn-upload">
                {/* 🔥 L'erreur FaCa n'est plus ici, elle doit être dans le JSX précédent */}
                <FaCamera /> Photo de Profil (Optionnel)
            </label>
            <input 
                id="avatar-file"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
            />
          </div>

          {/* Username */}
          <div className="input-group">
            <label>Nom d'utilisateur *</label>
            <div className="input-wrapper">
              <input name="username" type="text" placeholder="Votre pseudo" value={formData.username} onChange={handleChange} required disabled={loading} />
              <FaUser className="input-icon-right" />
            </div>
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>

          {/* Email */}
          <div className="input-group">
            <label>Email (Optionnel)</label>
            <div className="input-wrapper">
              <input name="email" type="email" placeholder="vous@email.com" value={formData.email} onChange={handleChange} disabled={loading} />
              <FaEnvelope className="input-icon-right" />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="input-group">
            <label>Mot de passe *</label>
            <div className="input-wrapper">
              <input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required disabled={loading} />
              <FaLock className="input-icon-right" />
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label>Confirmation *</label>
            <div className="input-wrapper">
              <input name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required disabled={loading} />
              <FaCheckCircle className="input-icon-right" />
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn-glass-submit" disabled={loading}>
            {loading ? 'Création...' : "S'inscrire"}
          </button>
        </form>

        <div className="register-footer">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;