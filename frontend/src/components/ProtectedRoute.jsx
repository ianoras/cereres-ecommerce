import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Prima controlla se c'è un utente nel localStorage
        const user = authService.getCurrentUser();
        
        if (!user) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        // Verifica anche con il server lo stato dell'autenticazione
        const response = await authService.checkAuthStatus();
        if (response.data && response.data.isAuthenticated) {
          setIsAuthenticated(true);
        } else {
          // Se il server dice che non sei autenticato, rimuovi i dati locali
          authService.logout();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Errore nella verifica dell\'autenticazione:', error);
        // In caso di errore di connessione, manteniamo lo stato basato sul localStorage
        setIsAuthenticated(!!authService.getCurrentUser());
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="text-center p-5">Caricamento in corso...</div>;
  }

  if (!isAuthenticated) {
    // Salva un messaggio in sessionStorage che verrà visualizzato nella pagina di login
    sessionStorage.setItem('authRedirectMessage', 'Devi effettuare l\'accesso per visualizzare questa pagina');
    
    // Reindirizza al login se non autenticato, memorizzando la pagina attuale
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; 