import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { favoritesService } from '../services/favoritesService';
import './FavoriteButton.css';

const FavoriteButton = ({ busId }) => {
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      checkFavorite();
    }
  }, [busId, isAuthenticated]);

  const checkFavorite = async () => {
    try {
      const res = await favoritesService.getFavorites();
      const favorites = res.data.results || res.data || [];
      setIsFavorite(favorites.some(f => f.bus_id === parseInt(busId)));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      alert('Connectez-vous pour ajouter aux favoris');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        await favoritesService.removeFavorite(busId);
      } else {
        await favoritesService.addFavorite(busId);
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`favorite-btn ${isFavorite ? 'active' : ''}`}
    >
      {isFavorite ? '⭐ Retiré des favoris' : '☆ Ajouter aux favoris'}
    </button>
  );
};

export default FavoriteButton;