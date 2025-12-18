// components/layout/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Si c'est une route admin et que l'utilisateur n'est pas admin
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/home" replace />;
  }

  // ✅ Si c'est un admin sur une route normale, rediriger vers admin
  if (!adminOnly && isAdmin()) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;