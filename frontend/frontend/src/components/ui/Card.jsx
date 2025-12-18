import React from 'react';
import './Card.css';

const Card = ({ title, subtitle, children }) => {
  return (
    <div className="card">
      <h3>{title}</h3>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      <div className="card-content">{children}</div>
    </div>
  );
};

export default Card;
