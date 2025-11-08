import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const Profil = () => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return <p>Veuillez vous connecter pour voir votre profil.</p>;

  return (
    <div className="profil-container">
      <h2>👤 Profil utilisateur</h2>
      <p><strong>Nom :</strong> {user.nom}</p>
      <p><strong>Email :</strong> {user.email}</p>
      <button onClick={logout}>Se déconnecter</button>
    </div>
  );
};

export default Profil;
