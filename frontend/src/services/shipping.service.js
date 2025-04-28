import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Servizio per la gestione delle spedizioni
 */
const shippingService = {
  /**
   * Calcola il costo di spedizione in base all'indirizzo e ai prodotti
   * @param {Object} shippingData - Dati per il calcolo della spedizione
   * @returns {Promise} Promessa con i costi di spedizione
   */
  calculateShippingCost: async (shippingData) => {
    try {
      console.log('Calcolo costi di spedizione...', shippingData);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/shipping/calculate`,
        shippingData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Costi di spedizione calcolati:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore durante il calcolo dei costi di spedizione:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Ottiene i metodi di spedizione disponibili
   * @returns {Promise} Promessa con i metodi di spedizione disponibili
   */
  getShippingMethods: async () => {
    try {
      console.log('Recupero metodi di spedizione disponibili...');
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/api/shipping/methods`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Metodi di spedizione recuperati:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore durante il recupero dei metodi di spedizione:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Traccia una spedizione utilizzando il codice di tracciamento
   * @param {string} trackingNumber - Codice di tracciamento
   * @returns {Promise} Promessa con le informazioni di tracciamento
   */
  trackShipment: async (trackingNumber) => {
    try {
      console.log(`Tracciamento spedizione con codice ${trackingNumber}...`);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/api/shipping/track/${trackingNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Informazioni di tracciamento recuperate:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante il tracciamento della spedizione ${trackingNumber}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Aggiorna l'indirizzo di spedizione per un ordine
   * @param {string} orderId - ID dell'ordine
   * @param {Object} addressData - Nuovo indirizzo di spedizione
   * @returns {Promise} Promessa con l'ordine aggiornato
   */
  updateShippingAddress: async (orderId, addressData) => {
    try {
      console.log(`Aggiornamento indirizzo di spedizione per l'ordine ${orderId}...`);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_URL}/api/shipping/address/${orderId}`,
        addressData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Indirizzo di spedizione aggiornato:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante l'aggiornamento dell'indirizzo di spedizione per l'ordine ${orderId}:`, error.response?.data || error.message);
      throw error;
    }
  }
};

export default shippingService; 