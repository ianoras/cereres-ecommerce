import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Servizio per la gestione degli ordini
 */
const orderService = {
  /**
   * Ottiene tutti gli ordini dell'utente
   * @param {Object} params - Parametri di paginazione (page, limit)
   * @returns {Promise} Promessa con gli ordini dell'utente
   */
  getMyOrders: async (params = { page: 1, limit: 10 }) => {
    try {
      console.log('Recupero ordini personali...');
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/api/orders/my-orders`,
        {
          params: params,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Ordini recuperati:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore durante il recupero degli ordini:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Ottiene i dettagli di un ordine specifico
   * @param {string} orderId - ID dell'ordine
   * @returns {Promise} Promessa con i dettagli dell'ordine
   */
  getOrderDetails: async (orderId) => {
    try {
      console.log(`Recupero dettagli ordine ${orderId}...`);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/api/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Dettagli ordine recuperati:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante il recupero dei dettagli dell'ordine ${orderId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Crea un nuovo ordine
   * @param {Object} orderData - Dati dell'ordine (prodotti, indirizzo, metodo di pagamento)
   * @returns {Promise} Promessa con l'ordine creato
   */
  createOrder: async (orderData) => {
    try {
      console.log('Creazione nuovo ordine...');
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/orders`,
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Ordine creato:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore durante la creazione dell\'ordine:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Annulla un ordine
   * @param {string} orderId - ID dell'ordine
   * @param {string} reason - Motivo dell'annullamento
   * @returns {Promise} Promessa con lo stato dell'annullamento
   */
  cancelOrder: async (orderId, reason) => {
    try {
      console.log(`Annullamento ordine ${orderId}...`);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/cancel`,
        { reason },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Ordine annullato:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante l'annullamento dell'ordine ${orderId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Ottiene la cronologia di un ordine
   * @param {string} orderId - ID dell'ordine
   * @returns {Promise} Promessa con la cronologia dell'ordine
   */
  getOrderHistory: async (orderId) => {
    try {
      console.log(`Recupero cronologia ordine ${orderId}...`);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/api/orders/${orderId}/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Cronologia ordine recuperata:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante il recupero della cronologia dell'ordine ${orderId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Ottiene tutti gli ordini (solo per admin)
   * @param {Object} params - Parametri di paginazione e filtri (page, limit, status)
   * @returns {Promise} Promessa con gli ordini
   */
  getAllOrders: async (params = { page: 1, limit: 10 }) => {
    try {
      console.log('Recupero tutti gli ordini (admin)...');
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/api/orders`,
        {
          params: params,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Tutti gli ordini recuperati:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore durante il recupero di tutti gli ordini:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Aggiorna lo stato di un ordine (solo per admin)
   * @param {string} orderId - ID dell'ordine
   * @param {string} status - Nuovo stato dell'ordine
   * @param {string} note - Note opzionali sull'aggiornamento
   * @returns {Promise} Promessa con l'ordine aggiornato
   */
  updateOrderStatus: async (orderId, status, note = '') => {
    try {
      console.log(`Aggiornamento stato ordine ${orderId} a ${status}...`);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        { status, note },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Stato ordine aggiornato:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante l'aggiornamento dello stato dell'ordine ${orderId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Ottiene le statistiche degli ordini (solo per admin)
   * @returns {Promise} Promessa con le statistiche degli ordini
   */
  getOrderStats: async () => {
    try {
      console.log('Recupero statistiche ordini...');
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/api/orders/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Statistiche ordini recuperate:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore durante il recupero delle statistiche degli ordini:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Elimina un ordine (solo per admin)
   * @param {string} orderId - ID dell'ordine da eliminare
   * @returns {Promise} Promessa con il risultato dell'eliminazione
   */
  deleteOrder: async (orderId) => {
    try {
      console.log(`Eliminazione ordine ${orderId}...`);
      const token = localStorage.getItem('token');
      
      // Provo prima con il percorso standard
      try {
        const response = await axios.delete(
          `${API_URL}/api/orders/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        console.log('Ordine eliminato:', response.data);
        return response.data;
      } catch (initialError) {
        // Se il percorso standard fallisce, provo con un percorso alternativo
        if (initialError.response && initialError.response.status === 404) {
          console.log('Percorso standard non trovato, provo percorso alternativo...');
          
          const altResponse = await axios.delete(
            `${API_URL}/api/admin/orders/${orderId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          
          console.log('Ordine eliminato (percorso alternativo):', altResponse.data);
          return altResponse.data;
        } else {
          // Se l'errore non è 404 o c'è un altro problema, rilancio l'errore originale
          throw initialError;
        }
      }
    } catch (error) {
      console.error(`Errore durante l'eliminazione dell'ordine ${orderId}:`, error.response?.data || error.message);
      throw error;
    }
  }
};

export default orderService; 