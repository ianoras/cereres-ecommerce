import Contact from '../models/contact.model.js';
import { sendErrorResponse, sendResponse } from '../utils/responseUtils.js';
import mongoose from 'mongoose';
import * as notificationUtil from '../utils/notifications.js';

// Crea un nuovo messaggio di contatto
export const createContact = async (req, res) => {
  try {
    const { nome, email, messaggio } = req.body;
    
    // Validazione dei dati
    if (!nome || !email || !messaggio) {
      return sendErrorResponse(res, 400, 'Tutti i campi sono richiesti');
    }
    
    // Creazione del messaggio
    const nuovoMessaggio = new Contact({
      nome,
      email,
      messaggio
    });
    
    await nuovoMessaggio.save();
    
    // Notifica gli amministratori del nuovo messaggio
    try {
      await notificationUtil.notifyAdminsOfNewMessage(`Nuovo messaggio da ${nome} (${email}): ${messaggio}`);
      console.log('Notifiche per il nuovo messaggio inviate agli admin');
    } catch (notifError) {
      console.error('Errore durante l\'invio delle notifiche per il nuovo messaggio:', notifError);
      // Non interrompiamo il flusso se la notifica fallisce
    }
    
    return sendResponse(res, 201, {
      message: 'Messaggio inviato con successo',
      contactId: nuovoMessaggio._id
    });
  } catch (error) {
    console.error('Errore durante l\'invio del messaggio:', error);
    return sendErrorResponse(res, 500, 'Errore durante l\'invio del messaggio');
  }
};

// Ottieni tutti i messaggi di contatto (solo admin)
export const getAllContacts = async (req, res) => {
  try {
    // Controlla se l'utente è admin
    if (req.user.role !== 'admin') {
      return sendErrorResponse(res, 403, 'Accesso non autorizzato');
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const contacts = await Contact.find()
      .sort({ dataCreazione: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Contact.countDocuments();
    
    return sendResponse(res, 200, {
      contacts,
      pagination: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Errore durante il recupero dei messaggi:', error);
    return sendErrorResponse(res, 500, 'Errore durante il recupero dei messaggi');
  }
};

// Ottieni un singolo messaggio di contatto (solo admin)
export const getContactById = async (req, res) => {
  try {
    // Controlla se l'utente è admin
    if (req.user.role !== 'admin') {
      return sendErrorResponse(res, 403, 'Accesso non autorizzato');
    }
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return sendErrorResponse(res, 404, 'Messaggio non trovato');
    }
    
    // Segna come letto se non lo è già
    if (!contact.letto) {
      contact.letto = true;
      await contact.save();
    }
    
    return sendResponse(res, 200, { contact });
  } catch (error) {
    console.error('Errore durante il recupero del messaggio:', error);
    return sendErrorResponse(res, 500, 'Errore durante il recupero del messaggio');
  }
};

// Segna un messaggio come risposto (solo admin)
export const markAsResponded = async (req, res) => {
  try {
    // Controlla se l'utente è admin
    if (req.user.role !== 'admin') {
      return sendErrorResponse(res, 403, 'Accesso non autorizzato');
    }
    
    const contactId = req.params.id;
    
    // Verifica che l'ID sia valido per MongoDB
    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return sendErrorResponse(res, 400, 'ID messaggio non valido');
    }
    
    // Trova e aggiorna il documento - nota: utilizziamo findByIdAndUpdate per garantire l'atomicità
    const updatedContact = await Contact.findByIdAndUpdate(
      contactId,
      { $set: { risposto: true } },
      { new: true, runValidators: true }
    );
    
    if (!updatedContact) {
      return sendErrorResponse(res, 404, 'Messaggio non trovato');
    }
    
    return sendResponse(res, 200, { 
      message: 'Messaggio segnato come risposto',
      contact: updatedContact
    });
    
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del messaggio:', error);
    return sendErrorResponse(res, 500, 'Errore durante l\'aggiornamento del messaggio');
  }
};

// Elimina un messaggio di contatto (solo admin)
export const deleteContact = async (req, res) => {
  try {
    // Controlla se l'utente è admin
    if (req.user.role !== 'admin') {
      return sendErrorResponse(res, 403, 'Accesso non autorizzato');
    }
    
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return sendErrorResponse(res, 404, 'Messaggio non trovato');
    }
    
    return sendResponse(res, 200, { 
      message: 'Messaggio eliminato con successo'
    });
  } catch (error) {
    console.error('Errore durante l\'eliminazione del messaggio:', error);
    return sendErrorResponse(res, 500, 'Errore durante l\'eliminazione del messaggio');
  }
};

// Ottieni conteggi e statistiche dei messaggi (solo admin)
export const getContactStats = async (req, res) => {
  try {
    // Controlla se l'utente è admin
    if (req.user.role !== 'admin') {
      return sendErrorResponse(res, 403, 'Accesso non autorizzato');
    }
    
    const totalContacts = await Contact.countDocuments();
    const unreadContacts = await Contact.countDocuments({ letto: false });
    const respondedContacts = await Contact.countDocuments({ risposto: true });
    
    // Messaggi degli ultimi 7 giorni
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const lastWeekContacts = await Contact.countDocuments({ 
      dataCreazione: { $gte: oneWeekAgo } 
    });
    
    return sendResponse(res, 200, {
      stats: {
        total: totalContacts,
        unread: unreadContacts,
        responded: respondedContacts,
        lastWeek: lastWeekContacts
      }
    });
  } catch (error) {
    console.error('Errore durante il recupero delle statistiche:', error);
    return sendErrorResponse(res, 500, 'Errore durante il recupero delle statistiche');
  }
}; 