// Configurazione dell'applicazione
// Questo file raccoglie tutte le configurazioni dell'app in un unico posto

export const config = {
  // Numero di telefono per WhatsApp (formato internazionale senza il +)
  whatsappPhone: '3468894415',
  
  // Aggiungi qui altre configurazioni dell'applicazione
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
};

// Configurazione globale dell'applicazione
export const API_URL = 'http://localhost:3001/api';

// Configurazione per il periodo di polling delle notifiche (in ms)
export const NOTIFICATION_POLLING_INTERVAL = 30000; 