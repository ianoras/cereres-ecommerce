import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, authService } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faUser, faEdit, faKey, faCheck, faTimes, faPhone, faEnvelope, faMapMarkerAlt, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import '../styles/profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  
  // Stati per la modifica del profilo
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Italia'
    }
  });
  
  // Stati per il cambio password
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  
  // Carica i dati del profilo all'avvio
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
          navigate('/login');
          return;
        }
        
        const response = await userService.getProfile();
        setUser(response.data.user || response.data);
        setFormData({
          username: response.data.user?.username || response.data.username || '',
          email: response.data.user?.email || response.data.email || '',
          fullName: response.data.user?.fullName || response.data.fullName || '',
          phoneNumber: response.data.user?.phoneNumber || response.data.phoneNumber || '',
          address: {
            street: response.data.user?.address?.street || response.data.address?.street || '',
            city: response.data.user?.address?.city || response.data.address?.city || '',
            postalCode: response.data.user?.address?.postalCode || response.data.address?.postalCode || '',
            country: response.data.user?.address?.country || response.data.address?.country || 'Italia'
          }
        });
      } catch (err) {
        setError('Errore nel caricamento del profilo: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [navigate]);
  
  // Gestione modifica dati profilo
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Gestione campi nidificati (ad es. address.street)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      setLoading(true);
      const response = await userService.updateProfile(formData);
      setUser(response.data.user || response.data);
      // Aggiorna anche l'utente nel localStorage
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          username: response.data.user?.username || response.data.username,
          email: response.data.user?.email || response.data.email,
          fullName: response.data.user?.fullName || response.data.fullName
        }));
      }
      setSuccess('Profilo aggiornato con successo!');
      setIsEditing(false);
    } catch (err) {
      setError("Errore durante l'aggiornamento: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione cambio password
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };
  
  const togglePasswordVisibility = (field) => {
    switch(field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Le password non coincidono');
      return;
    }
    
    try {
      setLoading(true);
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess('Password cambiata con successo!');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError("Errore durante il cambio password: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione upload avatar
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };
  
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Formati supportati dal backend
    const supportedFormatsBackend = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    
    // Verifica tipo file (tutti i formati di immagine supportati)
    const validImageTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp', 
      'image/svg+xml', 
      'image/bmp',
      'image/tiff'
    ];
    
    if (!validImageTypes.includes(file.type) && !file.type.startsWith('image/')) {
      setError('Per favore seleziona un file immagine valido (JPG, PNG, GIF, WEBP, ecc.)');
      return;
    }
    
    // Estrai l'estensione del file
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!supportedFormatsBackend.includes(fileExtension)) {
      setError(`Il formato ${fileExtension.toUpperCase()} non è supportato. Utilizza uno dei seguenti formati: JPG, PNG, GIF, WEBP, SVG, BMP.`);
      return;
    }
    
    // Verifica dimensione file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'immagine non può superare i 5MB');
      return;
    }
    
    setError('');
    setSuccess('');
    setUploadLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await userService.uploadAvatar(formData);
      
      if (response.data && response.data.avatar) {
        setUser(prev => ({
          ...prev,
          avatar: response.data.avatar
        }));
        setSuccess('Immagine profilo aggiornata con successo!');
      }
    } catch (err) {
      console.error('Errore upload:', err);
      if (err.response?.status === 500) {
        setError("Errore nel formato dell'immagine. Assicurati di utilizzare un formato supportato: JPG, PNG, GIF, WEBP, SVG, BMP.");
      } else {
        setError("Errore durante il caricamento dell'immagine: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setUploadLoading(false);
      // Reset del campo input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  if (loading && !user) {
    return (
      <div className="profile-container">
        <div className="profile-loader">Caricamento in corso...</div>
      </div>
    );
  }
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Il Mio Profilo</h1>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-avatar-container">
            <div className="profile-avatar" onClick={handleAvatarClick}>
              {uploadLoading && (
                <div className="avatar-loading-overlay">
                  <div className="spinner"></div>
                </div>
              )}
              
              {(user?.avatar?.url || user?.profileImage) ? (
                <img src={user.avatar?.url || user.profileImage} alt={user.fullName || user.username} />
              ) : (
                <div className="profile-avatar-placeholder">
                  <FontAwesomeIcon icon={faUser} />
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
                accept="image/jpeg, image/png, image/gif, image/webp, image/svg+xml, image/bmp, image/tiff, image/*"
              />
            </div>
            <p className="avatar-help-text">Clicca sull'immagine per cambiarla</p>
          </div>
          <div className="profile-nav">
            <button 
              className={`profile-nav-item ${!isEditing && !isChangingPassword ? 'active' : ''}`}
              onClick={() => {
                setIsEditing(false);
                setIsChangingPassword(false);
              }}
            >
              <FontAwesomeIcon icon={faUser} />
              <span>Informazioni</span>
            </button>
            <button 
              className={`profile-nav-item ${isEditing ? 'active' : ''}`}
              onClick={() => {
                setIsEditing(true);
                setIsChangingPassword(false);
              }}
            >
              <FontAwesomeIcon icon={faEdit} />
              <span>Modifica</span>
            </button>
            <button 
              className={`profile-nav-item ${isChangingPassword ? 'active' : ''}`}
              onClick={() => {
                setIsChangingPassword(true);
                setIsEditing(false);
              }}
            >
              <FontAwesomeIcon icon={faKey} />
              <span>Password</span>
            </button>
          </div>
        </div>
        
        <div className="profile-main">
          {!isEditing && !isChangingPassword ? (
            <div className="profile-details">
              <h2>Informazioni Personali</h2>
              <div className="profile-info">
                <div className="profile-info-section">
                  <h3>Dettagli Account</h3>
                  <div className="profile-info-item">
                    <span className="profile-info-label">
                      <FontAwesomeIcon icon={faUser} /> Nome Utente:
                    </span>
                    <span className="profile-info-value">{user?.username}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">
                      <FontAwesomeIcon icon={faEnvelope} /> Email:
                    </span>
                    <span className="profile-info-value">{user?.email}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">
                      <FontAwesomeIcon icon={faUser} /> Nome Completo:
                    </span>
                    <span className="profile-info-value">{user?.fullName || 'Non impostato'}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">
                      <FontAwesomeIcon icon={faPhone} /> Telefono:
                    </span>
                    <span className="profile-info-value">{user?.phoneNumber || 'Non impostato'}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">
                      <FontAwesomeIcon icon={faUser} /> Ruolo:
                    </span>
                    <span className="profile-info-value">{user?.role === 'admin' ? 'Amministratore' : 'Utente'}</span>
                  </div>
                </div>
                
                <div className="profile-info-section">
                  <h3>Indirizzo</h3>
                  <div className="profile-info-item">
                    <span className="profile-info-label">
                      <FontAwesomeIcon icon={faMapMarkerAlt} /> Via/Piazza:
                    </span>
                    <span className="profile-info-value">{user?.address?.street || 'Non impostato'}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">
                      <FontAwesomeIcon icon={faMapMarkerAlt} /> Città:
                    </span>
                    <span className="profile-info-value">{user?.address?.city || 'Non impostato'}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">
                      <FontAwesomeIcon icon={faMapMarkerAlt} /> CAP:
                    </span>
                    <span className="profile-info-value">{user?.address?.postalCode || 'Non impostato'}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">
                      <FontAwesomeIcon icon={faMapMarkerAlt} /> Paese:
                    </span>
                    <span className="profile-info-value">{user?.address?.country || 'Italia'}</span>
                  </div>
                </div>
                
                <div className="profile-info-section">
                  <h3>Altre Informazioni</h3>
                  <div className="profile-info-item">
                    <span className="profile-info-label">
                      <FontAwesomeIcon icon={faCalendarAlt} /> Registrato il:
                    </span>
                    <span className="profile-info-value">{new Date(user?.createdAt).toLocaleDateString()}</span>
                  </div>
                  {user?.lastLogin && (
                    <div className="profile-info-item">
                      <span className="profile-info-label">
                        <FontAwesomeIcon icon={faCalendarAlt} /> Ultimo accesso:
                      </span>
                      <span className="profile-info-value">{new Date(user?.lastLogin).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isEditing ? (
            <div className="profile-edit">
              <h2>Modifica Profilo</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
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
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fullName">Nome Completo</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phoneNumber">Numero di Telefono</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <h3 className="form-section-title">Indirizzo</h3>
                
                <div className="form-group">
                  <label htmlFor="address.street">Via/Piazza</label>
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="address.city">Città</label>
                    <input
                      type="text"
                      id="address.city"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address.postalCode">CAP</label>
                    <input
                      type="text"
                      id="address.postalCode"
                      name="address.postalCode"
                      value={formData.address.postalCode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="address.country">Paese</label>
                  <input
                    type="text"
                    id="address.country"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="profile-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset del form ai dati dell'utente
                      setFormData({
                        username: user.username || '',
                        email: user.email || '',
                        fullName: user.fullName || '',
                        phoneNumber: user.phoneNumber || '',
                        address: {
                          street: user.address?.street || '',
                          city: user.address?.city || '',
                          postalCode: user.address?.postalCode || '',
                          country: user.address?.country || 'Italia'
                        }
                      });
                    }}
                  >
                    Annulla
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="password-change">
              <h2>Cambia Password</h2>
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group password-field">
                  <label htmlFor="currentPassword">Password Attuale</label>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    onClick={() => togglePasswordVisibility('current')}
                    aria-label={showCurrentPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
                <div className="form-group password-field">
                  <label htmlFor="newPassword">Nuova Password</label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    onClick={() => togglePasswordVisibility('new')}
                    aria-label={showNewPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
                <div className="form-group password-field">
                  <label htmlFor="confirmPassword">Conferma Nuova Password</label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    onClick={() => togglePasswordVisibility('confirm')}
                    aria-label={showConfirmPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
                <div className="password-requirements">
                  <p>La password deve contenere:</p>
                  <ul>
                    <li className={passwordData.newPassword.length >= 8 ? 'valid' : 'invalid'}>
                      <FontAwesomeIcon icon={passwordData.newPassword.length >= 8 ? faCheck : faTimes} />
                      Almeno 8 caratteri
                    </li>
                    <li className={/[A-Z]/.test(passwordData.newPassword) ? 'valid' : 'invalid'}>
                      <FontAwesomeIcon icon={/[A-Z]/.test(passwordData.newPassword) ? faCheck : faTimes} />
                      Almeno una lettera maiuscola
                    </li>
                    <li className={/[a-z]/.test(passwordData.newPassword) ? 'valid' : 'invalid'}>
                      <FontAwesomeIcon icon={/[a-z]/.test(passwordData.newPassword) ? faCheck : faTimes} />
                      Almeno una lettera minuscola
                    </li>
                    <li className={/\d/.test(passwordData.newPassword) ? 'valid' : 'invalid'}>
                      <FontAwesomeIcon icon={/\d/.test(passwordData.newPassword) ? faCheck : faTimes} />
                      Almeno un numero
                    </li>
                    <li className={/[@$!%*?&]/.test(passwordData.newPassword) ? 'valid' : 'invalid'}>
                      <FontAwesomeIcon icon={/[@$!%*?&]/.test(passwordData.newPassword) ? faCheck : faTimes} />
                      Almeno un carattere speciale (@$!%*?&)
                    </li>
                  </ul>
                </div>
                <div className="profile-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Cambiamento in corso...' : 'Cambia Password'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                  >
                    Annulla
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 