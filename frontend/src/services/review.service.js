import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Servizio per la gestione delle recensioni dei prodotti
 */
const reviewService = {
  /**
   * Ottiene tutte le recensioni di un prodotto
   * @param {string} productId - ID del prodotto
   * @param {Object} params - Parametri di paginazione (page, limit)
   * @returns {Promise} Promessa con le recensioni del prodotto
   */
  getProductReviews: async (productId, params = { page: 1, limit: 10 }) => {
    try {
      console.log(`Recupero recensioni per il prodotto ${productId}...`);
      
      const response = await axios.get(
        `${API_URL}/api/reviews/product/${productId}`,
        { 
          params: params 
        }
      );

      console.log('Recensioni recuperate:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante il recupero delle recensioni per il prodotto ${productId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Aggiunge una nuova recensione per un prodotto
   * @param {string} productId - ID del prodotto
   * @param {Object} reviewData - Dati della recensione (rating, comment)
   * @returns {Promise} Promessa con la recensione creata
   */
  addReview: async (productId, reviewData) => {
    try {
      console.log(`Aggiunta recensione per il prodotto ${productId}...`, reviewData);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/reviews/product/${productId}`,
        reviewData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Recensione aggiunta:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante l'aggiunta della recensione per il prodotto ${productId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Aggiorna una recensione esistente
   * @param {string} reviewId - ID della recensione
   * @param {Object} reviewData - Dati aggiornati della recensione
   * @returns {Promise} Promessa con la recensione aggiornata
   */
  updateReview: async (reviewId, reviewData) => {
    try {
      console.log(`Aggiornamento recensione ${reviewId}...`, reviewData);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_URL}/api/reviews/${reviewId}`,
        reviewData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Recensione aggiornata:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante l'aggiornamento della recensione ${reviewId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Elimina una recensione
   * @param {string} reviewId - ID della recensione
   * @returns {Promise} Promessa con lo stato dell'eliminazione
   */
  deleteReview: async (reviewId) => {
    try {
      console.log(`Eliminazione recensione ${reviewId}...`);
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(
        `${API_URL}/api/reviews/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Recensione eliminata:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante l'eliminazione della recensione ${reviewId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Ottiene il rating medio di un prodotto
   * @param {string} productId - ID del prodotto
   * @returns {Promise} Promessa con il rating medio
   */
  getAverageRating: async (productId) => {
    try {
      console.log(`Recupero rating medio per il prodotto ${productId}...`);
      
      const response = await axios.get(`${API_URL}/api/reviews/product/${productId}/rating`);

      console.log('Rating medio recuperato:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante il recupero del rating medio per il prodotto ${productId}:`, error.response?.data || error.message);
      throw error;
    }
  }
};

export default reviewService; 