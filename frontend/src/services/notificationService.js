import axios from 'axios';
import { API_URL } from '../config';

// Creazione di una nuova istanza axios indipendente
const apiInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000
});

// Interceptor per aggiungere il token a ogni richiesta
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Servizio per la gestione delle notifiche nel frontend
 */
class NotificationService {
  constructor() {
    this.baseURL = `${API_URL}/notifications`;
    this.pollingInterval = null;
    this.listeners = new Set();
    this.notificationCounts = {
      messages: 0,
      orders: 0,
      requests: 0,
      total: 0
    };
    
    // Mapping tra tipi frontend e tipi backend
    this.typeMapping = {
      // Quando il frontend chiede il conteggio usando 'new_message'
      'new_message': 'messages',
      'new_order': 'orders',
      'new_request': 'requests',
      // Quando il frontend chiede il conteggio usando il nome della proprietà
      'messages': 'messages',
      'orders': 'orders',
      'requests': 'requests'
    };
    
    // Mapping inverso per markAllAsRead
    this.apiTypeMapping = {
      'messages': 'new_message',
      'orders': 'new_order',
      'requests': 'new_request'
    };
    
    // Gestione del debounce e dello stato delle richieste
    this.fetchInProgress = false;
    this.debounceTimer = null;
    this.debounceDelay = 1000; // 1 secondo di ritardo
    
    console.log('Inizializzato notificationService con mapping:', {
      typeMapping: this.typeMapping,
      apiTypeMapping: this.apiTypeMapping
    });
  }

  /**
   * Inizia il polling per le notifiche
   * @param {Number} interval - Intervallo di polling in ms (default: 30000)
   */
  startPolling(interval = 30000) {
    // Se il polling è già attivo, non fare nulla
    if (this.pollingInterval) {
      console.log('Polling già attivo, ignorato');
      return;
    }
    
    console.log('Avvio polling notifiche');
    
    // Esegui subito un primo aggiornamento
    this.fetchUnreadCounts();
    
    // Imposta l'intervallo di polling a 10 secondi invece di 30
    this.pollingInterval = setInterval(() => {
      this.fetchUnreadCounts();
    }, 10000); // 10 secondi
  }

  /**
   * Ferma il polling delle notifiche
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Fermato polling notifiche');
    }
  }

  /**
   * Versione con debounce di fetchUnreadCounts
   */
  debouncedFetchUnreadCounts() {
    // Se c'è già una richiesta in corso, non ne facciamo un'altra
    if (this.fetchInProgress) {
      console.log('Richiesta di notifiche già in corso, saltando questa chiamata');
      return;
    }
    
    // Cancella eventuali timer di debounce esistenti
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      console.log('Debounce timer precedente cancellato');
    }
    
    console.log(`Impostato nuovo debounce timer (${this.debounceDelay}ms)`);
    // Imposta un nuovo timer di debounce
    this.debounceTimer = setTimeout(() => {
      // Verifichiamo nuovamente se un'altra richiesta è stata avviata nel frattempo
      if (!this.fetchInProgress) {
        console.log('Esecuzione fetchUnreadCounts dopo debounce');
        this.fetchUnreadCounts();
      } else {
        console.log('Richiesta già in corso dopo debounce, operazione annullata');
      }
      this.debounceTimer = null;
    }, this.debounceDelay);
  }

  /**
   * Aggiunge un listener per gli aggiornamenti delle notifiche
   * @param {Function} listener - Funzione di callback
   * @returns {Function} Funzione per rimuovere il listener
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notifica tutti i listener registrati
   * @param {Object} data - Dati da inviare ai listener
   */
  notifyListeners(data) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Errore in un listener delle notifiche:', error);
      }
    });
  }

  /**
   * Recupera i conteggi delle notifiche non lette
   * @returns {Promise<Object>} Conteggi delle notifiche non lette
   */
  async fetchUnreadCounts() {
    // Se c'è già una richiesta in corso, non ne facciamo un'altra
    if (this.fetchInProgress) {
      console.log('Richiesta di notifiche già in corso, uscita');
      return this.notificationCounts;
    }
    
    // Otteniamo un timestamp per tracciare questa specifica richiesta
    const requestTimestamp = Date.now();
    console.log(`[${requestTimestamp}] Inizio fetchUnreadCounts`);
    
    try {
      this.fetchInProgress = true;
      
      // Verifichiamo il token prima di fare la chiamata
      const token = localStorage.getItem('token');
      if (!token) {
        console.log(`[${requestTimestamp}] Token mancante, annullamento richiesta`);
        return this.notificationCounts;
      }
      
      // Aggiungiamo un parametro di timestamp per evitare la cache del browser
      const response = await apiInstance.get('/notifications/unread-counts', {
        params: { _t: requestTimestamp },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log(`[${requestTimestamp}] Risposta API notifiche:`, response.data);
      
      // Aggiorna i conteggi memorizzati
      this.notificationCounts = {
        messages: response.data.messages || 0,
        orders: response.data.orders || 0,
        requests: response.data.requests || 0,
        total: response.data.total || 0
      };
      
      // Notifica i listener registrati
      this.notifyListeners(this.notificationCounts);
      
      // Chiama anche la funzione globale di aggiornamento se esiste
      if (typeof window !== 'undefined' && typeof window.updateNotificationCounts === 'function') {
        console.log(`[${requestTimestamp}] Chiamata alla funzione globale updateNotificationCounts`);
        // Usiamo setTimeout con 0ms per eseguire subito ma permettere al thread di continuare
        setTimeout(() => {
          try {
            window.updateNotificationCounts();
          } catch (err) {
            console.error(`[${requestTimestamp}] Errore durante l'esecuzione di updateNotificationCounts:`, err);
          }
        }, 0);
      }
      
      console.log(`[${requestTimestamp}] Fine fetchUnreadCounts con successo`);
      return this.notificationCounts;
    } catch (error) {
      console.error(`[${requestTimestamp}] Errore nel recupero dei conteggi delle notifiche:`, error);
      
      // Se l'errore è di autenticazione (401), proviamo a reimpostare i conteggi a zero
      if (error.response && error.response.status === 401) {
        console.log(`[${requestTimestamp}] Errore di autenticazione, reimpostazione conteggi a zero`);
        this.notificationCounts = {
          messages: 0,
          orders: 0,
          requests: 0,
          total: 0
        };
        
        // Notifica i listener con i conteggi azzerati
        this.notifyListeners(this.notificationCounts);
      }
      
      return this.notificationCounts;
    } finally {
      // Rilascia il lock con un piccolo ritardo per evitare chiamate troppo ravvicinate
      setTimeout(() => {
        this.fetchInProgress = false;
        console.log(`[${requestTimestamp}] Lock rilasciato per fetchUnreadCounts`);
      }, 500);
    }
  }

  /**
   * Recupera tutte le notifiche
   * @returns {Promise<Array>} Lista delle notifiche
   */
  async getAll() {
    try {
      const response = await apiInstance.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero delle notifiche:', error);
      return [];
    }
  }

  /**
   * Segna una notifica come letta
   * @param {String} id - ID della notifica
   * @returns {Promise<Object>} Notifica aggiornata
   */
  async markAsRead(id) {
    try {
      const response = await apiInstance.put(`/notifications/${id}/read`);
      this.fetchUnreadCounts(); // Aggiorna i conteggi
      return response.data;
    } catch (error) {
      console.error('Errore nel segnare la notifica come letta:', error);
      throw error;
    }
  }

  /**
   * Segna tutte le notifiche come lette
   * @param {String} type - Tipo di notifiche da segnare (opzionale)
   * @returns {Promise<Object>} Risultato dell'operazione
   */
  async markAllAsRead(type = null) {
    try {
      let apiType = null;
      
      if (type) {
        // Gestione specifica per ogni tipo
        if (type === 'requests') {
          apiType = 'new_request';
        } else if (type === 'messages') {
          apiType = 'new_message';
        } else if (type === 'orders') {
          apiType = 'new_order';
        } else {
          // Se il tipo è già in formato backend (new_*) o altro, usalo direttamente
          apiType = type;
        }
        
        console.log(`Tipo originale: ${type}, tipo per API: ${apiType}`);
      }
      
      const params = apiType ? { type: apiType } : {};
      console.log('Parametri per markAllAsRead:', params);
      
      const response = await apiInstance.put('/notifications/mark-all-read', {}, { params });
      console.log('Risposta da markAllAsRead:', response.data);
      
      this.fetchUnreadCounts(); // Aggiorna i conteggi
      return response.data;
    } catch (error) {
      console.error('Errore nel segnare tutte le notifiche come lette:', error);
      throw error;
    }
  }

  /**
   * Alias per markAllAsRead, segna tutte le notifiche come lette
   * @param {String} type - Tipo di notifiche da segnare (opzionale)
   * @returns {Promise<Object>} Risultato dell'operazione
   */
  async markNotificationsAsRead(type = null) {
    return this.markAllAsRead(type);
  }

  /**
   * Ottiene il conteggio delle notifiche non lette
   * @param {String} type - Tipo di notifica (opzionale)
   * @returns {Number} Conteggio delle notifiche non lette
   */
  getUnreadCount(type = null) {
    // Versione sincrona che utilizza i dati già presenti
    if (!this.notificationCounts) {
      console.warn('Dati delle notifiche non ancora inizializzati');
      return 0;
    }
    
    console.log('GetUnreadCount per tipo:', type, 'con dati:', this.notificationCounts);
    
    if (!type) {
      return this.notificationCounts.total || 0;
    }
    
    // Mappatura dei tipi
    switch(type) {
      case 'requests':
      case 'new_request':
        return this.notificationCounts.requests || 0;
      case 'messages':
      case 'new_message':
        return this.notificationCounts.messages || 0;
      case 'orders':
      case 'new_order':
        return this.notificationCounts.orders || 0;
      default:
        const mappedType = this.typeMapping[type];
        if (mappedType && this.notificationCounts[mappedType] !== undefined) {
          return this.notificationCounts[mappedType] || 0;
        }
        console.warn(`Tipo di notifica sconosciuto: ${type}`);
        return 0;
    }
  }

  /**
   * Ottiene il conteggio delle notifiche non lette per tipo specifico
   * @param {String} type - Tipo di notifica
   * @returns {Number} Conteggio delle notifiche non lette del tipo specificato
   */
  getUnreadCountByType(type) {
    return this.getUnreadCount(type);
  }

  /**
   * Ottiene tutte le notifiche non lette
   * @returns {Promise<Object>} Notifiche non lette raggruppate
   */
  async getUnreadNotifications() {
    try {
      // Recupera tutte le notifiche
      const response = await apiInstance.get('/notifications');
      
      // Filtra solo quelle non lette
      const unreadNotifications = response.data.filter(notification => !notification.read);
      
      // Raggruppa per tipo
      const byType = {
        new_message: [],
        new_order: [],
        new_request: []
      };
      
      unreadNotifications.forEach(notification => {
        if (byType[notification.type]) {
          byType[notification.type].push(notification);
        }
      });
      
      return {
        notifications: unreadNotifications,
        byType,
        total: unreadNotifications.length
      };
    } catch (error) {
      console.error('Errore nel recupero delle notifiche non lette:', error);
      return { notifications: [], byType: { new_message: [], new_order: [], new_request: [] }, total: 0 };
    }
  }

  /**
   * Segna tutte le notifiche di una richiesta come lette
   * @param {String} requestId - ID della richiesta
   * @returns {Promise<Object>} Risultato dell'operazione
   */
  async markRequestNotificationsAsRead(requestId) {
    try {
      // Recupera tutte le notifiche
      const allNotifications = await this.getAll();
      
      // Filtra quelle relative alla richiesta e non lette
      const requestNotifications = allNotifications.filter(
        notification => notification.requestId === requestId && !notification.read
      );
      
      // Segna come lette una ad una
      const promises = requestNotifications.map(notification => 
        this.markAsRead(notification._id)
      );
      
      await Promise.all(promises);
      
      // Aggiorna i conteggi
      this.fetchUnreadCounts();
      
      return { 
        success: true, 
        message: `Segnate ${requestNotifications.length} notifiche come lette` 
      };
    } catch (error) {
      console.error(`Errore nel segnare le notifiche della richiesta ${requestId} come lette:`, error);
      return { success: false, error: error.message };
    }
  }
}

// Crea un'istanza singleton del servizio
const notificationServiceInstance = new NotificationService();

export default notificationServiceInstance; 