// src/pages/LoginStandalone.jsx - CRÉEZ CE FICHIER
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../apps/utilisateur/utilisateur.css'; // Utilise le même CSS

const LoginStandalone = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Destination après login
  const searchParams = new URLSearchParams(location.search);
  const urlRedirect = searchParams.get('redirect');
  const fromState = location.state?.from?.pathname;
  const redirectTo = urlRedirect || fromState || '/profil';

  // ✅ Redirection UNIQUEMENT si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, redirectTo, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.error || 'Identifiants invalides');
    }
  };

  return (
    <div className="login-container standalone-login">
      <div className="login-card">
        <h2>🔐 Connexion à TaxiBe</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              placeholder="votre_identifiant"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="login-footer">
          <p>Pas encore de compte ? <Link to="/register">Inscrivez-vous</Link></p>
          <p className="guest-link">
            <Link to="/home">Continuer en tant qu'invité</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginStandalone;