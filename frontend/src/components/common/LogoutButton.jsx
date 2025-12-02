// src/components/common/LogoutButton.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaSignOutAlt } from 'react-icons/fa';

const LogoutButton = ({ full = false }) => {
  const { logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={() => logout(true)}
      className="btn-secondary"
      style={{
        width: full ? '100%' : 'auto',
        padding: '10px 12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
      }}
      title="Se déconnecter"
    >
      <FaSignOutAlt /> Se déconnecter
    </button>
  );
};

export default LogoutButton;