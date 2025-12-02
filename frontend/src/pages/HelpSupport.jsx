// src/pages/HelpSupport.jsx
import React, { useState } from 'react';
import { FaChevronDown, FaBus, FaQuestionCircle, FaEnvelope, FaMap } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './HelpSupport.css';

const faqData = [
  {
    id: 1,
    question: "Comment suivre un bus en temps réel ?",
    answer: "Sur la page d'accueil ou 'Liste des bus', cliquez sur une ligne. Si le bus est équipé du GPS et en service (statut 'Actif'), sa position actuelle sera affichée sur la carte dans la page de détails du bus."
  },
  {
    id: 2,
    question: "Comment puis-je signaler un problème (bus en panne, arrêt manquant) ?",
    answer: (
      <>
        Vous pouvez signaler tout incident ou faire une suggestion via la page de <Link to="/contribution">Contribution</Link>. Votre aide est précieuse pour maintenir les informations à jour !
      </>
    )
  },
  {
    id: 3,
    question: "Dois-je créer un compte pour voir les trajets ?",
    answer: "Non. Vous pouvez rechercher et consulter les lignes sans compte. Cependant, un compte est requis pour sauvegarder des bus favoris, publier des commentaires ou envoyer des contributions."
  },
  {
    id: 4,
    question: "Quelle est la différence entre Primus et Terminus ?",
    answer: "Primus (Premier) est l'arrêt de départ officiel de la ligne, et Terminus est l'arrêt final. Pour les lignes circulaires, ils peuvent être identiques."
  },
];

const AccordionItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
      <button className="accordion-header" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        <span className="question-text">{question}</span>
        <FaChevronDown className="accordion-icon" />
      </button>
      <div className="accordion-content">
        <p>{answer}</p>
      </div>
    </div>
  );
};


const HelpSupport = () => {
  return (
    <div className="help-page">
      <div className="help-container">
        
        {/* HEADER */}
        <div className="help-header">
          <h1><FaQuestionCircle /> Centre d'Aide TaxiBe</h1>
          <p>Trouvez rapidement les réponses à vos questions.</p>
        </div>

        {/* CONTENU EN GRILLE */}
        <div className="help-grid">
            
            {/* FAQ / ACCORDEON */}
            <div className="faq-section">
                <h2>Questions Fréquentes</h2>
                <div className="accordion-wrapper">
                    {faqData.map(item => (
                        <AccordionItem key={item.id} question={item.question} answer={item.answer} />
                    ))}
                </div>
            </div>

            {/* CONTACT & NAVIGATION RAPIDE */}
            <div className="contact-nav-section">
                
                <div className="contact-card">
                    <h3>Contactez-nous</h3>
                    <div className="contact-detail">
                        <FaEnvelope /> support@taxibe.mg
                    </div>
                    <p>Pour les problèmes techniques ou demandes spécifiques.</p>
                </div>

                <div className="quick-links-card">
                    <h3>Ressources Utiles</h3>
                    <Link to="/transport" className="quick-link">
                        <FaBus /> Liste Complète des Bus
                    </Link>
                    <Link to="/carte" className="quick-link">
                        <FaMap /> Voir la Carte du Réseau
                    </Link>
                    <Link to="/admin" className="quick-link admin">
                        <FaBus /> Espace Administration
                    </Link>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default HelpSupport;