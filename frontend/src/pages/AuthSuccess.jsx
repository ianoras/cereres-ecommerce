import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import '../styles/auth.css';
import * as authService from '../services/auth.service';
import { notificationService } from '../services/api';

const AuthSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processAuth = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');
        const userData = searchParams.get('user');

        if (!token || !userData) {
          throw new Error('Dati di autenticazione mancanti');
        }

        // Salva il token e i dati utente nel localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', userData);
        
        try {
          // Inizializza il servizio di notifiche direttamente
          notificationService.startPolling();
        } catch (notificationError) {
          console.warn('Errore nel servizio di notifiche, ma procediamo comunque:', notificationError);
          // Non blocchiamo il login se il servizio di notifiche fallisce
        }
        
        // Reindirizza alla home dopo l'autenticazione
        setTimeout(() => {
          navigate('/');
        }, 2000);

        setSuccess(true);

      } catch (err) {
        console.error('Errore durante l\'autenticazione:', err);
        setError('Si è verificato un errore durante l\'autenticazione. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    processAuth();
  }, [location, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Autenticazione Google</h2>
        </div>
        <div className="auth-body">
          {loading ? (
            <div className="text-center">
              <p className="mb-3">Autenticazione in corso...</p>
              <p className="mb-3">Stiamo verificando le tue credenziali con Google.</p>
              <p className="mb-4">Verrai reindirizzato automaticamente alla home page.</p>
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Caricamento...</span>
              </Spinner>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="success-icon mb-3">
                <i className="fas fa-check-circle text-success" style={{ fontSize: '3rem' }}></i>
              </div>
              <h4 className="text-success mb-3">Autenticazione Completata!</h4>
              <p className="mb-3">Benvenuto nella tua area personale.</p>
              <p className="text-muted">Verrai reindirizzato automaticamente alla home page.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess; 