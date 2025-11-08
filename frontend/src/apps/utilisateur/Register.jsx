import React, { useState } from 'react';
import { registerUser } from './UtilisateurService';
import './utilisateur.css';

const Register = () => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await registerUser({ nom, email, password });
    setSuccess(true);
  };

  return (
    <div className="register-container">
      <h2>🆕 Créer un compte</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Nom complet" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">S'inscrire</button>
      </form>
      {success && <p className="success-message">Compte créé avec succès !</p>}
    </div>
  );
};

export default Register;
