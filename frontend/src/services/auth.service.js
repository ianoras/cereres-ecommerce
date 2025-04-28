import { api, cartService, notificationService } from './api';

// Effettua il login
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    if (response.data.token) {
      // Svuota il carrello
      cartService.emptyCart();
      
      // Salva il token nel localStorage
      localStorage.setItem('user', JSON.stringify({
        ...response.data.user,
        accessToken: response.data.token
      }));
      
      // Inizializza il servizio di notifiche
      notificationService.startPolling();
    }
    
    return response.data;
  } catch (error) {
    console.error('Errore durante il login:', error);
    throw error;
  }
};

// Effettua il logout
export const logout = () => {
  // Disconnetti il servizio di notifiche
  notificationService.stopPolling();
  
  // Rimuovi l'utente dal localStorage
  localStorage.removeItem('user');
};

// Ottieni l'utente corrente dal localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// Ottieni il token di autenticazione
export const getToken = () => {
  const user = getCurrentUser();
  return user?.accessToken;
};

// Inizializza l'autenticazione con token e utente già presenti
export const initAuth = () => {
  const token = localStorage.getItem('token');
  if (token) {
    // Inizializza il servizio di notifiche con il token
    notificationService.startPolling();
    return true;
  }
  return false;
}; 