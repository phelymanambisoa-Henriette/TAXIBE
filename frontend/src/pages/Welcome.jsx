// src/pages/Welcome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkedAlt, FaRoute, FaArrowRight, FaUserCircle } from 'react-icons/fa';
import { HiLocationMarker, HiSearch } from 'react-icons/hi';
import './Welcome.css';

import logoTaxiBe from '../assets/logo-taxibe.png';

const Welcome = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAnimation, setShowAnimation] = useState(true);

  const features = [
    {
      icon: <HiLocationMarker size={50} />,
      title: 'Trouvez les arrêts proches',
      description: 'Localisez-vous et découvrez les arrêts de bus à proximité en temps réel.',
      color: '#01c6b2',
    },
    {
      icon: <HiSearch size={50} />,
      title: 'Recherchez des itinéraires',
      description: 'Planifiez vos trajets facilement avec notre moteur de recherche intelligent.',
      color: '#01c6b2',
    },
    {
      icon: <FaRoute size={50} />,
      title: 'Visualisez sur la carte',
      description: 'Consultez les lignes de bus et leurs trajets sur une carte interactive.',
      color: '#01c6b2',
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  const handleExplore = () => {
    localStorage.setItem('taxibe_visited', 'true'); // ✅ Déjà correct
    navigate('/home'); // ✅ Déjà correct
  };

  const handleLogin = () => {
    navigate('/login'); // ✅ Déjà correct
  };

  return (
    <div className="welcome-page">
      {showAnimation && (
        <div className="splash-screen">
          <div className="splash-logo">
            <img src={logoTaxiBe} alt="TaxiBe" className="splash-logo-img" />
            <h1 className="splash-title">TaxiBe</h1>
          </div>
        </div>
      )}

      <div className={`welcome-content ${!showAnimation ? 'visible' : ''}`}>
        
        <div className="welcome-header">
          <div className="logo-container">
            <img src={logoTaxiBe} alt="TaxiBe" className="header-logo-img" />
          </div>
          <button className="btn-login-link" onClick={handleLogin}>
            <FaUserCircle /> Se connecter
          </button>
        </div>

        <div className="hero-section-welcome">
          <div className="hero-text-welcome">
            <h2 className="hero-title">
              Voyagez plus <span className="highlight-gradient">intelligemment</span>
            </h2>
            <p className="hero-subtitle">
              Trouvez votre itinéraire en taxi-be partout à Madagascar, sans inscription.
            </p>
          </div>
        </div>

        <div className="features-carousel">
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {features.map((feature, index) => (
              <div key={index} className="feature-slide">
                <div className="feature-icon" style={{ color: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="carousel-indicators">
            {features.map((_, index) => (
              <button
                key={index}
                className={`indicator ${currentSlide === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        <div className="quick-benefits">
          <div className="benefit-card">
            <FaMapMarkedAlt className="benefit-icon" />
            <span>Carte interactive</span>
          </div>
          <div className="benefit-card">
            <HiLocationMarker className="benefit-icon" />
            <span>Géolocalisation</span>
          </div>
          <div className="benefit-card">
            <FaRoute className="benefit-icon" />
            <span>Itinéraires optimisés</span>
          </div>
        </div>

        <div className="cta-section">
          <button className="btn-explore" onClick={handleExplore}>
            <span>Commencer l'exploration</span>
            <FaArrowRight className="btn-icon" />
          </button>
          <p className="cta-note">
            Accès invité • Vous pourrez vous connecter plus tard si besoin.
          </p>
        </div>

        <div className="welcome-footer">
          <p>© 2025 TaxiBe • Mobilité urbaine à Madagascar</p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;