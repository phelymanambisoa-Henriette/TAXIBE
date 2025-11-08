import React, { useState, useEffect, useContext } from 'react';
import CommentaireSection from './CommentaireSection';
import ContributionForm from './ContributionForm';
import HistoriqueRecherche from './HistoriqueRecherche';
import { getCommentaires, getHistorique } from './InteractionService';
import { AuthContext } from '../../contexts/AuthContext';
import './interaction.css';

const Interaction = () => {
  const { user } = useContext(AuthContext);
  const [commentaires, setCommentaires] = useState([]);
  const [historique, setHistorique] = useState([]);

  useEffect(() => {
    getCommentaires().then(setCommentaires);
    if (user) getHistorique(user.id).then(setHistorique);
  }, [user]);

  return (
    <div className="interaction-container">
      <h2>💬 Espace Communauté</h2>

      <div className="interaction-content">
        <div className="left-side">
          <CommentaireSection commentaires={commentaires} canComment={!!user} />
        </div>

        <div className="right-side">
          {user && <ContributionForm userId={user.id} />}
          {user && <HistoriqueRecherche historique={historique} />}
          {!user && (
            <p className="info-message">
              Connecte-toi pour contribuer ou répondre aux commentaires.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Interaction;
