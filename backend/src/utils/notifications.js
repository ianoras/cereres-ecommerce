import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { logger } from './logger.js';

/**
 * Crea una nuova notifica
 * @param {String} recipientId - ID dell'utente destinatario
 * @param {String} type - Tipo di notifica ('new_message', 'new_order', 'new_request')
 * @param {String} title - Titolo della notifica
 * @param {String} message - Messaggio della notifica
 * @param {String} requestId - ID della richiesta correlata (opzionale)
 * @param {String} orderId - ID dell'ordine correlato (opzionale)
 * @returns {Promise<Object>} - La notifica creata
 */
export const createNotification = async (recipientId, type, title, message, requestId = null, orderId = null) => {
  try {
    // Validazione parametri
    if (!recipientId || !type || !title || !message) {
      logger.error(`Parametri mancanti per la creazione della notifica: recipient=${recipientId}, type=${type}, title=${title}, message=${message}`);
      return null;
    }

    // Creazione della notifica
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      requestId,
      orderId,
      read: false
    });

    await notification.save();
    logger.info(`Notifica creata con successo: ${notification._id}`);
    
    return notification;
  } catch (error) {
    logger.error(`Errore nella creazione della notifica: ${error.message}`);
    return null;
  }
};

/**
 * Notifica tutti gli amministratori
 * @param {String} type - Tipo di notifica
 * @param {String} title - Titolo della notifica
 * @param {String} message - Messaggio della notifica
 * @param {String} requestId - ID della richiesta correlata (opzionale)
 * @param {String} orderId - ID dell'ordine correlato (opzionale)
 * @returns {Promise<Array>} - Array delle notifiche create
 */
export const notifyAllAdmins = async (type, title, message, requestId = null, orderId = null) => {
  try {
    // Trova tutti gli amministratori
    const admins = await User.find({ role: 'admin' });
    
    if (!admins || admins.length === 0) {
      logger.warn('Nessun amministratore trovato per la notifica');
      return [];
    }
    
    const notifications = [];
    
    // Crea una notifica per ogni admin
    for (const admin of admins) {
      const notification = await createNotification(
        admin._id,
        type,
        title,
        message,
        requestId,
        orderId
      );
      
      if (notification) {
        notifications.push(notification);
      }
    }
    
    logger.info(`Notifiche create per ${notifications.length} amministratori`);
    return notifications;
  } catch (error) {
    logger.error(`Errore nella notifica agli amministratori: ${error.message}`);
    return [];
  }
};

/**
 * Notifica gli amministratori di un nuovo ordine
 * @param {Object} order - L'ordine creato
 * @returns {Promise<Array>} - Array delle notifiche create
 */
export const notifyAdminsOfNewOrder = async (order) => {
  try {
    return await notifyAllAdmins(
      'new_order',
      'Nuovo ordine',
      `Nuovo ordine #${order.orderNumber} da ${order.shippingAddress.fullName}`,
      null,
      order._id
    );
  } catch (error) {
    logger.error(`Errore nella notifica del nuovo ordine: ${error.message}`);
    return [];
  }
};

/**
 * Notifica gli amministratori di una nuova richiesta personalizzata
 * @param {Object} request - La richiesta personalizzata
 * @returns {Promise<Array>} - Array delle notifiche create
 */
export const notifyAdminsOfNewRequest = async (request) => {
  try {
    return await notifyAllAdmins(
      'new_request',
      'Nuova richiesta personalizzata',
      `Nuova richiesta personalizzata: "${request.title}"`,
      request._id,
      null
    );
  } catch (error) {
    logger.error(`Errore nella notifica della nuova richiesta: ${error.message}`);
    return [];
  }
};

/**
 * Notifica gli amministratori di un nuovo messaggio
 * @param {String} message - Il messaggio
 * @param {String} requestId - ID della richiesta correlata (opzionale)
 * @returns {Promise<Array>} - Array delle notifiche create
 */
export const notifyAdminsOfNewMessage = async (message, requestId = null) => {
  try {
    // Tronca il messaggio se è troppo lungo
    const shortMessage = message && message.length > 100 
      ? `${message.substring(0, 100)}...` 
      : message;
    
    return await notifyAllAdmins(
      'new_message',
      'Nuovo messaggio',
      `Nuovo messaggio: "${shortMessage}"`,
      requestId,
      null
    );
  } catch (error) {
    logger.error(`Errore nella notifica del nuovo messaggio: ${error.message}`);
    return [];
  }
}; 