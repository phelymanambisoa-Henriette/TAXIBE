import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useProtectedRoute = (redirectTo = '/login') => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, loading, navigate, redirectTo]);

  return { isAuthenticated, loading };
};