import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import './Login.css';

import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      const res = await login(username, password);
      setLoading(false);

      if (res && !res.ok) {
        setErr(res.error || 'Identifiants incorrects');
      } else {
        // ✅ CORRECTION: Marquer comme visité et rediriger vers /home
        localStorage.setItem('taxibe_visited', 'true');
        navigate('/home'); // ✅ Changé de '/' vers '/home'
      }

    } catch (error) {
      setLoading(false);
      console.error("Erreur Login:", error);
      if (error.response && error.response.status === 401) {
        setErr("Nom d'utilisateur ou mot de passe incorrect.");
      } else {
        setErr("Impossible de contacter le serveur.");
      }
    }
  };

  return (
    <div className="login-page">
      
      {/* --- ARRIÈRE-PLAN : SPHÈRES VERTES (Plus de jaune) --- */}
      <div className="background-shapes">
        <div className="shape shape-1"></div> {/* Grosse boule Menthe */}
        <div className="shape shape-2"></div> {/* Boule Émeraude foncée */}
        <div className="shape shape-3"></div> {/* Petite boule claire */}
      </div>

      {/* --- CARTE EFFET VERRE --- */}
      <div className="login-glass-card">
        <div className="login-header">
          <h2>Bienvenue</h2>
          <p>Connectez-vous à TaxiBe</p>
        </div>

        {err && <div className="error-message">{err}</div>}

        <form onSubmit={submit} className="glass-form">
          
          {/* Input Username */}
          <div className="input-group">
            <label>Nom d'utilisateur</label>
            <div className="input-wrapper">
              <input 
                value={username} 
                onChange={(e) => setU(e.target.value)} 
                placeholder="Votre pseudo" 
                required
              />
              {/* Icône à Droite */}
              <FaUser className="input-icon-right" />
            </div>
          </div>

          {/* Input Password */}
          <div className="input-group">
            <label>Mot de passe</label>
            <div className="input-wrapper">
              <input 
                value={password} 
                onChange={(e) => setP(e.target.value)} 
                placeholder="••••••••" 
                type="password" 
                required
              />
              {/* Icône à Droite */}
              <FaLock className="input-icon-right" />
            </div>
          </div>

          <div className="forgot-pass">
            <Link to="/forgot-password">Mot de passe oublié ?</Link>
          </div>

          <button className="btn-glass-submit" disabled={loading}>
            {loading ? 'Chargement...' : 'Se Connecter'}
          </button>
        </form>

        <div className="login-footer">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;