import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api.js';
import BackToHome from '../components/BackToHome';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import '../styles/auth.css';
import { Spinner } from 'react-bootstrap';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [redirectMessage, setRedirectMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Controlla se c'è un messaggio di reindirizzamento salvato o errori nell'URL
  useEffect(() => {
    // Controlla messaggio di reindirizzamento
    const message = sessionStorage.getItem('authRedirectMessage');
    if (message) {
      setRedirectMessage(message);
      sessionStorage.removeItem('authRedirectMessage');
    }
    
    // Controlla errori dall'autenticazione Google
    const hasError = searchParams.get('error');
    if (hasError) {
      setError('Si è verificato un errore durante l\'autenticazione con Google.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await authService.login(formData);
      // Verifica se l'autenticazione è avvenuta con successo
      if (result && result.token) {
        // Se c'era una pagina da cui l'utente è stato reindirizzato, torna a quella
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      } else {
        setError('Errore durante il login: dati incompleti dal server');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Redirect all'endpoint di autenticazione Google del backend
    window.location.href = 'http://localhost:3001/api/auth/google';
  };

  return (
    <div className="auth-container">
      <BackToHome />
      <div className="auth-card">
        <div className="auth-header">
          <h2>Accedi</h2>
        </div>
        <div className="auth-body">
          {redirectMessage && (
            <div className="alert alert-warning" role="alert">
              {redirectMessage}
            </div>
          )}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group password-field">
              <label htmlFor="password">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            <button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Caricamento...' : 'Accedi'}
            </button>
          </form>
          
          <div className="auth-divider">
            <span>oppure</span>
          </div>
          
          <div className="social-login">
            <button onClick={handleGoogleLogin} className="google-btn" disabled={googleLoading}>
              {googleLoading ? (
                <>
                  <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Autenticazione in corso...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faGoogle} /> Accedi con Google
                </>
              )}
            </button>
          </div>
          
          <div className="auth-footer">
            <p>Non hai un account? <Link to="/register">Registrati</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 