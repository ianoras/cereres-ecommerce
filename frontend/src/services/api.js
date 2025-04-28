import axios from 'axios';
// Importiamo il servizio di notifiche all'inizio del file
import notificationServiceInstance from '../services/notificationService';
// Rimuoviamo questa importazione circolare che causa problemi
// import notificationServiceModule from './notificationService';

const API_URL = 'http://localhost:3001/api';

// Create an instance of axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000, // Aumentiamo il timeout globale a 60 secondi
});

// Interceptor per aggiungere il token a ogni richiesta
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Aggiungiamo un timestamp per evitare la cache
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime()
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire gli errori di rete
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Richiesta timeout:', error.config.url);
      // Possiamo mostrare un messaggio più specifico all'utente
      error.message = 'La richiesta ha impiegato troppo tempo. Riprova più tardi.';
    }
    return Promise.reject(error);
  }
);

// Servizi di autenticazione
const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('User logged in:', response.data.user);
    }
    return response.data;
  },
  
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('Current user:', user);
      return user;
    }
    return null;
  },
  
  checkAuthStatus: async () => {
    return await api.get('/auth/status');
  }
};

// Servizi per gli utenti
const userService = {
  // Ottiene il profilo dell'utente autenticato
  getProfile: async () => {
    return await api.get('/users/profile');
  },
  
  // Aggiorna il profilo dell'utente
  updateProfile: async (profileData) => {
    return await api.put('/users/profile', profileData);
  },
  
  // Cambia la password dell'utente
  changePassword: async (passwordData) => {
    return await api.put('/users/password', passwordData);
  },
  
  // Carica un nuovo avatar per l'utente
  uploadAvatar: async (formData) => {
    return await api.put('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// Servizi per i prodotti
const productService = {
  getAll: async (timestamp) => {
    // Aggiungiamo un parametro timestamp per evitare la cache del browser
    return await api.get(`/products${timestamp ? `?_t=${timestamp}` : ''}`);
  },
  
  getById: async (id) => {
    return await api.get(`/products/${id}`);
  },
  
  createProduct: async (productData) => {
    return await api.post('/products', productData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  updateProduct: async (id, productData) => {
    console.log('Servizio API - Updating product with ID:', id);
    
    // Controlliamo se productData è un'istanza di FormData
    const isFormData = productData instanceof FormData;
    
    if (isFormData) {
      // Debug per vedere cosa c'è nel FormData
      console.log('FormData keys:');
      let hasContent = false;
      for (let key of productData.keys()) {
        hasContent = true;
        const value = productData.get(key);
        console.log(`- ${key}: ${typeof value === 'object' ? 'File o oggetto complesso' : value}`);
      }
      
      // Verifica se il FormData è vuoto (potrebbe accadere a causa di un bug nel form)
      if (!hasContent) {
        console.error('ERRORE: FormData è vuoto! Non ci sono dati da aggiornare.');
        throw new Error('Nessun dato fornito per l\'aggiornamento del prodotto');
      }
      
      // Aggiungiamo un timestamp al FormData per evitare problemi di cache
      productData.append('_t', new Date().getTime());
      
      // Assicuriamoci di impostare il Content-Type corretto e di non usare axios transformer
      return await api.put(`/products/${id}`, productData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        transformRequest: [(data) => data], // Previene la trasformazione automatica del FormData
        timeout: 10000 // Aumenta il timeout
      });
    } else {
      // Se non è FormData, creiamo una nuova istanza
      const formData = new FormData();
      
      // Aggiungiamo ogni campo al FormData
      Object.keys(productData).forEach(key => {
        // Se il campo è un array o oggetto, lo aggiungiamo come JSON string
        if (typeof productData[key] === 'object' && !(productData[key] instanceof File)) {
          formData.append(key, JSON.stringify(productData[key]));
        } else {
          formData.append(key, productData[key]);
        }
      });
      
      // Aggiungiamo un timestamp al FormData per evitare problemi di cache
      formData.append('_t', new Date().getTime());
      
      // Con le stesse opzioni come sopra
      return await api.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        transformRequest: [(data) => data], // Previene la trasformazione automatica del FormData
        timeout: 10000 // Aumenta il timeout
      });
    }
  },
  
  deleteProduct: async (id) => {
    return await api.delete(`/products/${id}`);
  }
};

// Servizi per le richieste personalizzate
const customRequestService = {
  // Richieste di personalizzazione
  getAll: async () => {
    try {
      console.log('Chiamata API per ottenere tutte le richieste personalizzate...');
      // Aumentiamo il timeout per dare più tempo alla richiesta di completarsi
      const response = await api.get('/custom-requests/client', {
        timeout: 30000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // Verifica che la risposta sia valida prima di restituirla
      if (response && response.data) {
        console.log('Risposta API ricevuta:', response.data);
        return response;
      } else {
        console.warn('Risposta API vuota o non valida');
        return { data: { requests: [] } };
      }
    } catch (error) {
      console.error('Errore durante il recupero delle richieste personalizzate:', error);
      console.error('Dettagli errore:', error.response?.data || error.message);
      // Ritorniamo un oggetto vuoto invece di lanciare un'eccezione
      return { data: { requests: [] } };
    }
  },
  getById: async (id) => {
    try {
      console.log('Chiamata API per ottenere i dettagli della richiesta:', id);
      const response = await api.get(`/custom-requests/client/${id}`);
      console.log('Risposta dettaglio richiesta:', response);
      return response;
    } catch (error) {
      console.error(`Errore recupero dettagli richiesta ${id}:`, error);
      console.error('Dettagli errore:', error.response?.data || error.message);
      throw error;
    }
  },
  create: async (data) => api.post('/custom-requests/client', data),
  
  // Richiesta di personalizzazione da prodotto esistente
  createFromProduct: async (productId, formData) => {
    console.log('Invio richiesta personalizzazione per prodotto ID:', productId);
    
    // Log dettagliato dei contenuti del FormData
    console.log('Contenuto FormData:');
    for (let [key, value] of formData.entries()) {
      const valueDisplay = value instanceof File 
        ? `File: ${value.name} (${value.size} bytes)` 
        : value;
      console.log(`- ${key}: ${valueDisplay}`);
    }

    try {
      // Assicuriamoci che productId sia valido
      if (!productId) {
        throw new Error('ID prodotto mancante');
      }
      
      // Controllo dell'autenticazione
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Utente non autenticato');
      }
      
      // Disabilita la trasformazione automatica da axios per mantenere il FormData intatto
      return await axios.post(
        `http://localhost:3001/api/custom-requests/client/products/${productId}/customize`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          transformRequest: [(data) => data], // Impedisce ad axios di modificare i dati
          timeout: 60000, // Aumentiamo il timeout per gestire upload di file
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progresso: ${percentCompleted}%`);
          }
        }
      );
    } catch (error) {
      console.error('Errore dettagliato nella richiesta:', error);
      
      // Migliore gestione degli errori del server
      if (error.response?.data) {
        console.error('Risposta di errore dal server:', error.response.data);
      }
      
      throw error;
    }
  },
  
  // Aggiungi messaggio a una richiesta
  addMessage: async (requestId, data) => {
    console.log('addMessage chiamato con:', { requestId, dataType: typeof data });
    
    // Controlla se il dato è già un FormData
    if (data instanceof FormData) {
      console.log('Invio FormData al backend');
      
      // Stampa contenuto del FormData (solo per debug)
      console.log('Contenuto FormData:');
      for (let [key, value] of data.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File (${value.name}, ${value.size} bytes, tipo: ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      try {
        const response = await api.post(
          `/custom-requests/client/${requestId}/messages`, 
          data,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        console.log('Risposta dal backend:', response);
        return response;
      } catch (error) {
        console.error('Errore nella richiesta:', error);
        console.error('Dettagli errore:', error.response?.data || error.message);
        throw error;
      }
    }

    // Altrimenti creiamo un oggetto JSON normale
    console.log('Invio JSON al backend:', data);
    
    // Assicuriamoci che il campo 'message' venga convertito in 'text' se presente
    const fixedData = { ...data };
    if (fixedData.message !== undefined && fixedData.text === undefined) {
      fixedData.text = fixedData.message;
      delete fixedData.message;
    }
    
    try {
      const response = await api.post(
        `/custom-requests/client/${requestId}/messages`, 
        fixedData
      );
      console.log('Risposta dal backend (JSON):', response);
      return response;
    } catch (error) {
      console.error('Errore nella richiesta JSON:', error);
      console.error('Dettagli errore JSON:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Aggiorna richiesta
  update: async (id, data) => api.put(`/custom-requests/client/${id}`, data),
  
  // Accetta un preventivo
  acceptQuote: async (requestId) => {
    try {
      console.log('Chiamata API per accettare il preventivo:', requestId);
      const response = await api.post(`/custom-requests/client/${requestId}/accept-quote`);
      console.log('Risposta accettazione preventivo:', response);
      return response;
    } catch (error) {
      console.error('Errore durante l\'accettazione del preventivo:', error);
      console.error('Dettagli errore:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Rifiuta un preventivo
  rejectQuote: async (requestId) => {
    try {
      console.log('Chiamata API per rifiutare il preventivo:', requestId);
      const response = await api.post(`/custom-requests/client/${requestId}/reject-quote`);
      console.log('Risposta rifiuto preventivo:', response);
      return response;
    } catch (error) {
      console.error('Errore durante il rifiuto del preventivo:', error);
      console.error('Dettagli errore:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Ottieni la timeline di una richiesta
  getTimeline: async (requestId) => {
    try {
      console.log('Chiamata API per ottenere la timeline della richiesta:', requestId);
      const response = await api.get(`/custom-requests/client/${requestId}/timeline`);
      console.log('Risposta timeline richiesta:', response);
      return response;
    } catch (error) {
      console.error(`Errore recupero timeline richiesta ${requestId}:`, error);
      console.error('Dettagli errore:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Servizi per le richieste personalizzate admin
const customRequestAdminService = {
  // Ottiene tutte le richieste personalizzate
  getAll: async () => {
    try {
      console.log('Chiamata API per ottenere tutte le richieste personalizzate (admin)...');
      console.log('URL chiamata:', `${API_URL}/custom-requests/admin/all`);
      
      // Verifichiamo il token prima di fare la chiamata
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token mancante per la chiamata API');
        throw new Error('Utente non autenticato. Effettua il login per continuare.');
      }
      
      // Aggiorniamo la configurazione della richiesta
      const config = {
        timeout: 60000, // Aumentiamo il timeout a 60 secondi
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      };
      
      // Aggungiamo un timestamp alla query per evitare la cache
      const timestamp = new Date().getTime();
      const url = `/custom-requests/admin/all?_t=${timestamp}`;
      
      // Effettuiamo la chiamata con promessa e timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout della richiesta')), 60000)
      );
      
      const fetchPromise = api.get(url, config);
      
      // Attendiamo il risultato o il timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log('Risposta ricevuta da /custom-requests/admin/all:', response?.status);
      
      // Verifica che la risposta abbia un codice di successo
      if (response?.status !== 200) {
        console.error('Risposta con codice di errore:', response?.status);
        throw new Error(`Errore nella risposta del server: ${response?.status}`);
      }
      
      // Verifica che la risposta sia nel formato corretto
      if (response?.data && Array.isArray(response.data.requests)) {
        console.log(`Risposta API valida: trovate ${response.data.requests.length} richieste`);
        // Aggiunge un log dei primi elementi per debug
        if (response.data.requests.length > 0) {
          console.log('Primo elemento:', JSON.stringify(response.data.requests[0]).substring(0, 200) + '...');
        }
        
        return {
          data: {
            requests: response.data.requests,
            total: response.data.total || 0,
            pages: response.data.pages || 1,
            currentPage: response.data.currentPage || 1
          }
        };
      } else if (response?.data && Array.isArray(response.data)) {
        // Se la risposta è un array diretto, la adattiamo al formato atteso
        console.log(`Risposta API è un array diretto: trovate ${response.data.length} richieste`);
        return {
          data: {
            requests: response.data,
            total: response.data.length || 0,
            pages: 1,
            currentPage: 1
          }
        };
      } else if (response?.data) {
        console.warn('Risposta API ricevuta ma formato non standard:', typeof response.data);
        
        // Se abbiamo dati ma non nel formato atteso, proviamo a estrarli
        let requests = [];
        
        if (response.data.isErrorFallback) {
          console.log('Ricevuta risposta di fallback dal server');
        }
        
        // Tentativi di estrazione dei dati
        if (response.data.requests) {
          requests = Array.isArray(response.data.requests) ? response.data.requests : [];
        } else if (Array.isArray(response.data)) {
          requests = response.data;
        } else if (typeof response.data === 'object') {
          // Cerca qualsiasi array nell'oggetto
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              requests = response.data[key];
              break;
            }
          }
        }
        
        console.log(`Estratti ${requests.length} elementi dalla risposta`);
        
        return {
          data: {
            requests: requests,
            total: response.data.total || requests.length || 0,
            pages: response.data.pages || 1,
            currentPage: response.data.currentPage || 1
          }
        };
      } else {
        console.warn('Formato risposta non valido o dati mancanti:', response);
        throw new Error('Formato risposta non valido');
      }
    } catch (error) {
      console.error('Errore durante il recupero delle richieste personalizzate (admin):', error);
      console.error('Tipo di errore:', error.name);
      console.error('Messaggio errore:', error.message);
      
      if (error.response) {
        console.error('Risposta errore dal server:', error.response.status);
        console.error('Dati errore:', error.response.data);
      } else if (error.request) {
        console.error('Nessuna risposta ricevuta dal server');
      }
      
      // Se è un errore di timeout, inviamo un messaggio specifico
      if (error.message === 'Timeout della richiesta') {
        return {
          error: 'Il server sta impiegando troppo tempo a rispondere. Riprova più tardi.',
          data: {
            requests: [],
            total: 0,
            pages: 1,
            currentPage: 1
          }
        };
      }
      
      // Per altri tipi di errori
      return {
        error: error.message || 'Errore durante il recupero delle richieste',
        data: {
          requests: [],
          total: 0,
          pages: 1,
          currentPage: 1
        }
      };
    }
  },

  // Ottiene i dettagli di una richiesta specifica
  getById: async (id) => {
    try {
      console.log('Chiamata API per ottenere i dettagli della richiesta:', id);
      const response = await api.get(`/custom-requests/admin/${id}`);
      console.log('Risposta dettaglio richiesta ricevuta');
      return response;
    } catch (error) {
      console.error(`Errore recupero dettagli richiesta ${id}:`, error);
      console.error('Dettagli errore:', error.response?.data || error.message);
      throw error;
    }
  },

  // Aggiunge un messaggio a una richiesta
  addMessage: async (requestId, data) => {
    try {
      console.log('Chiamata API per aggiungere un messaggio alla richiesta:', requestId);
      const isFormData = data instanceof FormData;
      
      // Debug dei dati inviati
      if (isFormData) {
        console.log('Invio dati come FormData');
        for (let [key, value] of data.entries()) {
          if (value instanceof File) {
            console.log(`- ${key}: File (${value.name}, ${value.size} bytes)`);
          } else {
            console.log(`- ${key}: ${value}`);
          }
        }
      } else {
        console.log('Invio dati come JSON:', data);
      }
      
      const config = isFormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {};
      
      const response = await api.post(`/custom-requests/admin/${requestId}/messages`, data, config);
      console.log('Messaggio aggiunto con successo');
      return response;
    } catch (error) {
      console.error(`Errore nell'aggiunta del messaggio alla richiesta ${requestId}:`, error);
      console.error('Dettagli errore:', error.response?.data || error.message);
      throw error;
    }
  },

  // Aggiorna lo stato di una richiesta
  updateStatus: async (requestId, newStatus, notes = '') => {
    try {
      console.log(`Aggiornamento stato della richiesta ${requestId} a ${newStatus}`);
      const response = await api.patch(`/custom-requests/admin/${requestId}/status`, { status: newStatus, notes });
      return response;
    } catch (error) {
      console.error(`Errore nell'aggiornamento dello stato della richiesta ${requestId}:`, error);
      throw error;
    }
  },

  // Elimina una richiesta
  deleteRequest: async (requestId) => {
    try {
      console.log(`Eliminazione della richiesta ${requestId}`);
      const response = await api.delete(`/custom-requests/admin/${requestId}`);
      return response;
    } catch (error) {
      console.error(`Errore nell'eliminazione della richiesta ${requestId}:`, error);
      throw error;
    }
  },

  // Aggiunge un preventivo a una richiesta
  addQuote: async (requestId, quoteData) => {
    try {
      console.log(`Invio preventivo per la richiesta ${requestId}:`, quoteData);
      const response = await api.put(`/custom-requests/admin/${requestId}/quote`, quoteData);
      console.log('Preventivo inviato con successo');
      return response;
    } catch (error) {
      console.error(`Errore nell'aggiunta del preventivo alla richiesta ${requestId}:`, error);
      console.error('Dettagli errore:', error.response?.data || error.message);
      throw error;
    }
  },

  // Ottiene la timeline di una richiesta
  getTimeline: async (requestId) => {
    try {
      console.log(`Recupero timeline per la richiesta ${requestId}`);
      const response = await api.get(`/custom-requests/admin/${requestId}/timeline`);
      console.log('Timeline recuperata con successo');
      return response;
    } catch (error) {
      console.error(`Errore nel recupero della timeline della richiesta ${requestId}:`, error);
      console.error('Dettagli errore:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Servizio per il carrello
const cartService = {
  // Ottiene il carrello dal localStorage
  getCart: () => {
    return JSON.parse(localStorage.getItem('cartItems')) || [];
  },
  
  // Salva il carrello nel localStorage
  saveCart: (cart) => {
    localStorage.setItem('cartItems', JSON.stringify(cart));
  },
  
  // Aggiunge un prodotto al carrello
  addToCart: (product) => {
    const cart = cartService.getCart();
    
    // Verifica se il prodotto è già nel carrello
    const existingItemIndex = cart.findIndex(item => item.id.toString() === product.id.toString());
    
    if (existingItemIndex !== -1) {
      // Aggiorna la quantità se il prodotto esiste già
      cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + (product.quantity || 1);
    } else {
      // Aggiungi il nuovo prodotto al carrello
      cart.push({
        ...product,
        quantity: product.quantity || 1
      });
    }
    
    cartService.saveCart(cart);
    return cart;
  },
  
  // Rimuove un prodotto dal carrello
  removeFromCart: (productId) => {
    const cart = cartService.getCart();
    const updatedCart = cart.filter(item => item.id.toString() !== productId.toString());
    cartService.saveCart(updatedCart);
    return updatedCart;
  },
  
  // Aggiorna la quantità di un prodotto
  updateQuantity: (productId, delta) => {
    const cart = cartService.getCart();
    const itemIndex = cart.findIndex(item => item.id.toString() === productId.toString());
    
    if (itemIndex === -1) return cart;
    
    const newQuantity = cart[itemIndex].quantity + delta;
    if (newQuantity < 1) return cart;
    
    cart[itemIndex].quantity = newQuantity;
    cartService.saveCart(cart);
    return cart;
  },
  
  // Svuota il carrello
  emptyCart: () => {
    localStorage.removeItem('cartItems');
    return [];
  },
  
  // Calcola il totale del carrello
  getCartTotal: () => {
    const cart = cartService.getCart();
    return cart.reduce((total, item) => {
      const price = typeof item.price === 'string' 
        ? parseFloat(item.price.replace('€', '').trim()) 
        : (typeof item.price === 'number' ? item.price : 0);
      
      return total + (price * (item.quantity || 1));
    }, 0);
  },
  
  // Ottiene il numero totale di articoli nel carrello
  getCartItemCount: () => {
    const cart = cartService.getCart();
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  }
};

// Servizio per i messaggi di contatto
const contactService = {
  // Invia un nuovo messaggio di contatto
  create: async (contactData) => {
    return await api.post('/contacts', contactData);
  },
  
  // Ottiene tutti i messaggi di contatto con paginazione
  getAll: async (page = 1, limit = 10) => {
    return await api.get(`/contacts?page=${page}&limit=${limit}`);
  },
  
  // Ottiene un singolo messaggio per ID
  getById: async (id) => {
    return await api.get(`/contacts/${id}`);
  },
  
  // Segna un messaggio come risposto
  markAsResponded: async (id) => {
    return await api.patch(`/contacts/${id}/respond`);
  },
  
  // Elimina un messaggio
  delete: async (id) => {
    return await api.delete(`/contacts/${id}`);
  },
  
  // Ottiene statistiche sui messaggi
  getStats: async () => {
    return await api.get('/contacts/stats');
  },
  
  // Controlla se ci sono messaggi non letti
  getUnreadCount: async () => {
    try {
      const response = await api.get('/contacts/stats');
      return response.data?.stats?.unread || 0;
    } catch (error) {
      console.error('Errore nel recupero del conteggio messaggi:', error);
      return 0;
    }
  }
};

// Import del servizio di notifiche esterno
// Non definiamo alcuna implementazione qui per evitare conflitti
const notificationService = notificationServiceInstance;

// Servizio per gli ordini
const orderService = {
  // Ottiene tutti gli ordini dell'utente
  getMyOrders: async (params = { page: 1, limit: 10 }) => {
    try {
      console.log('Recupero ordini personali...');
      const response = await api.get('/orders/my-orders', { params });
      console.log('Ordini recuperati:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore durante il recupero degli ordini:', error);
      throw error;
    }
  },
  
  // Ottiene i dettagli di un ordine specifico
  getOrderDetails: async (orderId) => {
    try {
      console.log(`Recupero dettagli ordine ${orderId}...`);
      const response = await api.get(`/orders/${orderId}`);
      console.log('Dettagli ordine recuperati:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante il recupero dei dettagli dell'ordine ${orderId}:`, error);
      throw error;
    }
  },
  
  // Crea un nuovo ordine
  createOrder: async (orderData) => {
    try {
      console.log('Creazione nuovo ordine...');
      const response = await api.post('/orders', orderData);
      console.log('Ordine creato:', response.data);
      
      // Aggiorna immediatamente le notifiche quando viene creato un nuovo ordine
      if (notificationService && typeof notificationService.fetchUnreadCounts === 'function') {
        console.log('Aggiornamento notifiche dopo creazione ordine...');
        setTimeout(async () => {
          try {
            await notificationService.fetchUnreadCounts();
            
            // Aggiorna anche l'interfaccia se la funzione globale esiste
            if (typeof window.updateNotificationCounts === 'function') {
              window.updateNotificationCounts();
            }
          } catch (err) {
            console.error('Errore durante l\'aggiornamento delle notifiche post-ordine:', err);
          }
        }, 1000); // Attendi 1 secondo per dare tempo al backend di creare la notifica
      }
      
      return response.data;
    } catch (error) {
      console.error('Errore durante la creazione dell\'ordine:', error);
      throw error;
    }
  },
  
  // Annulla un ordine
  cancelOrder: async (orderId, reason) => {
    try {
      console.log(`Annullamento ordine ${orderId}...`);
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      console.log('Ordine annullato:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante l'annullamento dell'ordine ${orderId}:`, error);
      throw error;
    }
  },
  
  // Ottiene la cronologia di un ordine
  getOrderHistory: async (orderId) => {
    try {
      console.log(`Recupero cronologia ordine ${orderId}...`);
      const response = await api.get(`/orders/${orderId}/history`);
      console.log('Cronologia ordine recuperata:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante il recupero della cronologia dell'ordine ${orderId}:`, error);
      throw error;
    }
  },
  
  // Ottiene tutti gli ordini (solo per admin)
  getAllOrders: async (params = { page: 1, limit: 10 }) => {
    try {
      console.log('Recupero tutti gli ordini (admin)...');
      const response = await api.get('/orders', { params });
      console.log('Tutti gli ordini recuperati:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore durante il recupero di tutti gli ordini:', error);
      throw error;
    }
  },
  
  // Aggiorna lo stato di un ordine (solo per admin)
  updateOrderStatus: async (orderId, status, note = '') => {
    try {
      console.log(`Aggiornamento stato ordine ${orderId} a ${status}...`);
      const response = await api.put(`/orders/${orderId}/status`, { status, note });
      console.log('Stato ordine aggiornato:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante l'aggiornamento dello stato dell'ordine ${orderId}:`, error);
      throw error;
    }
  },
  
  // Ottiene le statistiche degli ordini (solo per admin)
  getOrderStats: async () => {
    try {
      console.log('Recupero statistiche ordini...');
      const response = await api.get('/orders/stats');
      console.log('Statistiche ordini recuperate:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore durante il recupero delle statistiche degli ordini:', error);
      throw error;
    }
  }
};

// Esporta l'istanza di axios per altri servizi
export { api };

export {
  authService,
  userService,
  productService,
  customRequestService,
  customRequestAdminService,
  cartService,
  contactService,
  notificationService,
  orderService
}; 