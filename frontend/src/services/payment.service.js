import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Servizio per la gestione dei pagamenti
 */
const paymentService = {
  /**
   * Processa un pagamento con carta di credito
   * @param {Object} paymentData - Dati del pagamento
   * @returns {Promise} Promessa con la conferma del pagamento
   */
  processCreditCardPayment: async (paymentData) => {
    try {
      console.log('Elaborazione pagamento con carta di credito...', paymentData);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/payments/credit-card`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Pagamento con carta di credito elaborato:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore durante l\'elaborazione del pagamento con carta di credito:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Processa un pagamento PayPal
   * @param {Object} paymentData - Dati del pagamento
   * @returns {Promise} Promessa con la conferma del pagamento
   */
  processPayPalPayment: async (paymentData) => {
    try {
      console.log('Elaborazione pagamento PayPal...', paymentData);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/payments/paypal`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Pagamento PayPal elaborato:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore durante l\'elaborazione del pagamento PayPal:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Verifica lo stato di un pagamento
   * @param {string} paymentId - ID del pagamento
   * @returns {Promise} Promessa con lo stato del pagamento
   */
  verifyPaymentStatus: async (paymentId) => {
    try {
      console.log(`Verifica stato pagamento ${paymentId}...`);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/api/payments/status/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Stato pagamento verificato:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Errore durante la verifica dello stato del pagamento ${paymentId}:`, error.response?.data || error.message);
      throw error;
    }
  }
};

export default paymentService; 