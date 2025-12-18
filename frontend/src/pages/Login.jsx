// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Changé de '../../contexts' à '../contexts'
import './Login.css'; // Changé de './utilisateur.css' à './Login.css'

const Login = () => {
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
      console.log('✅ Déjà connecté, redirection vers:', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, redirectTo, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('📝 Soumission formulaire login');

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      console.log('✅ Login OK, redirection vers:', redirectTo);
      navigate(redirectTo, { replace: true });
    } else {
      console.log('❌ Login échoué');
      setError(result.error || 'Identifiants invalides');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🔐 Connexion</h2>

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
        </div>
      </div>
    </div>
  );
};

export default Login;