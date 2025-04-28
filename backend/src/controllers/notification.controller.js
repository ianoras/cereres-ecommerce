import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { logger } from '../utils/logger.js';

/**
 * Ottiene tutte le notifiche dell'utente
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    return res.status(200).json(notifications);
  } catch (error) {
    logger.error(`Errore nel recupero delle notifiche: ${error.message}`);
    return res.status(500).json({ message: 'Errore nel recupero delle notifiche' });
  }
};

/**
 * Ottiene i conteggi delle notifiche non lette per tipo
 */
export const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Esegui query parallele per ottimizzare le prestazioni
    const [messages, orders, requests] = await Promise.all([
      Notification.countDocuments({ recipient: userId, type: 'new_message', read: false }),
      Notification.countDocuments({ recipient: userId, type: 'new_order', read: false }),
      Notification.countDocuments({ recipient: userId, type: 'new_request', read: false })
    ]);
    
    const total = messages + orders + requests;
    
    return res.status(200).json({ 
      messages, 
      orders, 
      requests, 
      total 
    });
  } catch (error) {
    logger.error(`Errore nel conteggio delle notifiche non lette: ${error.message}`);
    return res.status(500).json({ message: 'Errore nel conteggio delle notifiche non lette' });
  }
};

/**
 * Segna una notifica come letta
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notifica non trovata' });
    }
    
    return res.status(200).json(notification);
  } catch (error) {
    logger.error(`Errore nel segnare la notifica come letta: ${error.message}`);
    return res.status(500).json({ message: 'Errore nel segnare la notifica come letta' });
  }
};

/**
 * Segna tutte le notifiche come lette
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;
    
    const query = { recipient: userId, read: false };
    
    // Se è specificato un tipo, filtra per tipo
    if (type) {
      query.type = type;
    }
    
    const result = await Notification.updateMany(query, { read: true });
    
    return res.status(200).json({ 
      message: 'Notifiche segnate come lette', 
      count: result.modifiedCount 
    });
  } catch (error) {
    logger.error(`Errore nel segnare tutte le notifiche come lette: ${error.message}`);
    return res.status(500).json({ message: 'Errore nel segnare tutte le notifiche come lette' });
  }
};

/**
 * Crea una nuova notifica
 */
export const createNotification = async (req, res) => {
  try {
    const { recipient, type, title, message, requestId, orderId } = req.body;
    
    if (!recipient || !type || !title || !message) {
      return res.status(400).json({ message: 'Campi recipient, type, title e message sono obbligatori' });
    }
    
    const notification = new Notification({
      recipient,
      type,
      title,
      message,
      requestId,
      orderId,
      read: false
    });
    
    await notification.save();
    
    return res.status(201).json({ 
      message: 'Notifica creata con successo', 
      notification 
    });
  } catch (error) {
    logger.error(`Errore nella creazione della notifica: ${error.message}`);
    return res.status(500).json({ message: 'Errore nella creazione della notifica' });
  }
}; 