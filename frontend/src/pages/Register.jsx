import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api.js';
import BackToHome from '../components/BackToHome';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import '../styles/auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      if (result && result.data) {
        navigate('/login');
      } else {
        setError('Errore durante la registrazione: risposta incompleta dal server');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <BackToHome />
      <div className="auth-card">
        <div className="auth-header">
          <h2>Registrati</h2>
        </div>
        <div className="auth-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Nome Utente</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
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
            <div className="form-group password-field">
              <label htmlFor="confirmPassword">Conferma Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? 'Nascondi password' : 'Mostra password'}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            <button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Caricamento...' : 'Registrati'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Hai già un account? <Link to="/login">Accedi</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 