import React, { useState, useEffect } from 'react';
import CommentaireSection from './CommentaireSection';
import ContributionForm from './ContributionForm';
import HistoriqueRecherche from './HistoriqueRecherche';
import { getCommentaires, getHistorique } from './InteractionService';
import { useAuth } from '../../contexts/AuthContext';
import './interaction.css';

const Interaction = () => {
  const { user, isAuthenticated } = useAuth(); // ✅ Utilisation correcte de useAuth
  const [commentaires, setCommentaires] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Charger les commentaires
        const commentsData = await getCommentaires();
        setCommentaires(commentsData || []);
        
        // Charger l'historique si l'utilisateur est connecté
        if (user && user.id) {
          const historiqueData = await getHistorique(user.id);
          setHistorique(historiqueData || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // Utiliser des données mockées en cas d'erreur
        setCommentaires([
          {
            id: 1,
            author: 'Jean',
            text: 'Excellent service de bus!',
            date: new Date().toISOString(),
            busLine: 'Ligne 4'
          },
          {
            id: 2,
            author: 'Marie',
            text: 'Les horaires sont respectés.',
            date: new Date().toISOString(),
            busLine: 'DDD'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="interaction-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="interaction-container">
      <h2>💬 Espace Communauté</h2>

      <div className="interaction-content">
        <div className="left-side">
          <CommentaireSection 
            commentaires={commentaires} 
            canComment={isAuthenticated} 
          />
        </div>

        <div className="right-side">
          {isAuthenticated && user ? (
            <>
              <ContributionForm userId={user.id} />
              <HistoriqueRecherche historique={historique} />
            </>
          ) : (
            <div className="info-message">
              <p>👋 Bienvenue dans l'espace communauté!</p>
              <p>Connectez-vous pour :</p>
              <ul>
                <li>✍️ Laisser des commentaires</li>
                <li>🤝 Contribuer aux informations</li>
                <li>📊 Voir votre historique</li>
              </ul>
              <a href="/login" className="login-link">
                Se connecter →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Interaction;