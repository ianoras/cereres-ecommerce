import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import CustomRequest from '../models/custom-request.model.js';
import User from '../models/user.model.js';
import { createNotification } from '../controllers/notification.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import Notification from '../models/notification.model.js';
import multer from 'multer';
import * as notificationUtil from '../utils/notifications.js';
import path from 'path';
import * as notificationController from '../controllers/notification.controller.js';
import fs from 'fs';

const router = express.Router();

// Configurazione della directory per il salvataggio dei file
const uploadDir = path.join(process.cwd(), 'uploads', 'custom-requests');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurazione multer per il salvataggio dei file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Genera un nome file univoco
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configurazione multer per accettare file fino a 5MB
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Funzione di utilità per sincronizzare i dati utente in una richiesta
const syncUserDataWithRequest = async (request) => {
  try {
    if (!request || !request.user) {
      console.log('Richiesta non valida o senza utente');
      return request;
    }
    
    // Carica i dati aggiornati dell'utente
    const user = await User.findById(request.user._id || request.user);
    if (!user) {
      console.log(`Utente non trovato: ${request.user._id || request.user}`);
      return request;
    }
    
    // Se la richiesta ha l'utente come oggetto popolato, aggiorniamo i campi
    if (request.user._id) {
      // Aggiorna i dati dell'utente nella richiesta
      request.user.fullName = user.fullName || user.username;
      request.user.phoneNumber = user.phoneNumber || 'N/A';
      request.user.email = user.email;
      request.user.avatar = user.avatar;
    }
    
    return request;
  } catch (error) {
    console.error('Errore durante la sincronizzazione dei dati utente:', error);
    return request;
  }
};

// Ottieni tutte le richieste con filtri e paginazione
router.get('/all', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('GET /all - Richiesta ricevuta per ottenere tutte le richieste admin');
    console.log('Query params:', req.query);
    console.log('User ID richiedente:', req.user._id);
    
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
      console.log(`Filtro per stato: ${status}`);
    }
    
    const skip = (page - 1) * limit;
    console.log(`Paginazione: page=${page}, limit=${limit}, skip=${skip}`);
    
    // Aumentiamo il timeout a 10 secondi
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout nel recupero delle richieste')), 10000);
    });

    // Eseguiamo la ricerca con un timeout
    const findPromise = Promise.resolve().then(async () => {
      try {
        const requests = await CustomRequest.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('user', 'name email fullName phoneNumber');
          
        console.log(`Trovate ${requests.length} richieste`);
        
        // Assicuriamoci che tutti i dati utente siano aggiornati
        for (let i = 0; i < requests.length; i++) {
          if (requests[i].user) {
            await syncUserDataWithRequest(requests[i]);
          }
        }
        
        const total = await CustomRequest.countDocuments(query);
        console.log(`Totale richieste: ${total}`);
        
        return {
          requests,
          total,
          pages: Math.ceil(total / limit),
          currentPage: parseInt(page)
        };
      } catch (err) {
        console.error('Errore in findPromise:', err);
        throw err;
      }
    });

    // Attendiamo il risultato o il timeout
    const result = await Promise.race([findPromise, timeoutPromise]);
    
    console.log('Risposta inviata con successo');
    
    // Aggiungiamo un log della struttura della risposta per debugging
    console.log('Struttura risposta:', JSON.stringify({
      requestsCount: result.requests.length,
      total: result.total,
      pages: result.pages
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Errore nel recupero delle richieste:', error);
    
    // Inviamo una risposta di errore più dettagliata
    if (error.name === 'CastError') {
      res.status(400).json({ 
        message: 'Errore di formattazione nella query', 
        error: error.message,
        success: false
      });
    } else if (error.message === 'Timeout nel recupero delle richieste') {
      res.status(408).json({ 
        message: 'Timeout nel recupero delle richieste', 
        error: 'La richiesta ha impiegato troppo tempo per essere completata',
        success: false
      });
    } else {
      // Proviamo a inviare comunque una risposta valida anche in caso di errore
      try {
        const defaultRequests = await CustomRequest.find({})
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('user', 'name email fullName phoneNumber');
        
        console.log(`Fallback: trovate ${defaultRequests.length} richieste`);
        
        res.json({
          requests: defaultRequests,
          total: defaultRequests.length,
          pages: 1,
          currentPage: 1,
          error: error.message,
          isErrorFallback: true
        });
      } catch (fallbackError) {
        res.status(500).json({ 
          message: 'Errore interno del server nel recupero delle richieste', 
          error: error.message,
          success: false
        });
      }
    }
  }
});

// Ottieni una richiesta specifica
router.get('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const request = await CustomRequest.findById(req.params.id)
      .populate('user', 'name email fullName phoneNumber username avatar');
      
    if (!request) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    // Sincronizza i dati utente
    await syncUserDataWithRequest(request);
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Aggiorna lo stato di una richiesta
router.patch('/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Lo stato è obbligatorio' });
    }
    
    // Verifica che lo stato sia valido secondo il modello
    const validStatuses = [
      'pending',           // In attesa
      'in_progress',       // In Lavorazione
      'quoted',           // Preventivo Inviato
      'accepted',         // Approvata
      'rejected',         // Rifiutata
      'completed',        // Completata
      'cancelled'         // Annullata
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Stato non valido. Stati consentiti: ${validStatuses.join(', ')}` 
      });
    }
    
    const request = await CustomRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    const oldStatus = request.status;
    request.status = status;
    
    // Mappa degli stati in italiano
    const statusMap = {
      'pending': 'In attesa',
      'in_progress': 'In lavorazione',
      'completed': 'Completata',
      'cancelled': 'Annullata',
      'quoted': 'Preventivo inviato',
      'accepted': 'Approvata',
      'rejected': 'Rifiutata'
    };
    
    // Se lo stato non è cambiato, non creare una voce ridondante nella timeline
    if (oldStatus !== status) {
      // Crea un messaggio personalizzato per ogni tipo di transizione di stato
      let timelineMessage = '';
      
      switch (status) {
        case 'in_progress':
          timelineMessage = 'La tua richiesta è ora in fase di valutazione da parte del nostro team';
          break;
        case 'quoted':
          timelineMessage = 'È stato preparato un preventivo per la tua richiesta';
          break;
        case 'accepted':
          // Distinguiamo il caso in cui l'amministratore accetta un preventivo inviato dall'utente
          timelineMessage = 'L\'amministratore ha accettato il preventivo proposto';
          break;
        case 'rejected':
          // Distinguiamo il caso in cui l'amministratore rifiuta un preventivo inviato dall'utente
          timelineMessage = 'L\'amministratore ha rifiutato il preventivo proposto';
          break;
        case 'completed':
          timelineMessage = 'La tua richiesta è stata completata con successo';
          break;
        case 'cancelled':
          timelineMessage = 'La richiesta è stata annullata';
          break;
        default:
          // Fallback al messaggio generico per stati non gestiti specificamente
          timelineMessage = `Stato aggiornato da "${statusMap[oldStatus] || oldStatus}" a "${statusMap[status] || status}"`;
      }
      
      // Aggiungi una voce alla timeline
      request.timelineEntries.push({
        status: status,
        date: new Date(),
        notes: timelineMessage,
        actor: 'admin'
      });
    }
    
    const updatedRequest = await request.save();
    
    // Crea una notifica per l'utente con dettagli specifici
    await notificationUtil.createNotification(
      request.user,
      'Stato richiesta aggiornato',
      `La tua richiesta "${request.title}" è stata aggiornata da "${statusMap[oldStatus] || oldStatus}" a "${statusMap[status] || status}"`,
      'status_update',
      request._id
    );
    
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Aggiorna lo stato dei materiali
router.put('/:id/materials-status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { materialsStatus } = req.body;
    
    if (!materialsStatus) {
      return res.status(400).json({ message: 'Lo stato dei materiali è obbligatorio' });
    }
    
    const request = await CustomRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    request.materialsStatus = materialsStatus;
    const updatedRequest = await request.save();
    
    // Crea una notifica per l'utente
    await notificationUtil.createNotification(
      request.user,
      'Stato materiali aggiornato',
      `Lo stato dei materiali è stato aggiornato a: ${materialsStatus}`,
      'materials_update',
      request._id
    );
    
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Invia un preventivo
router.put('/:id/quote', verifyToken, isAdmin, async (req, res) => {
  try {
    const { amount, description, validUntil } = req.body;
    
    if (!amount) {
      return res.status(400).json({ message: 'L\'importo è obbligatorio' });
    }
    
    const request = await CustomRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    request.quote = {
      amount,
      description,
      validUntil: validUntil ? new Date(validUntil) : null,
      sentAt: new Date()
    };
    
    request.status = 'quoted';
    
    // Aggiungi una voce alla timeline
    request.timelineEntries.push({
      status: 'quoted',
      date: new Date(),
      notes: `È stato inviato un preventivo di ${amount}€${description ? `. ${description}` : ''}${validUntil ? `. Valido fino al ${new Date(validUntil).toLocaleDateString('it-IT')}` : ''}`,
      actor: 'admin'
    });
    
    const updatedRequest = await request.save();
    
    // Crea una notifica per l'utente
    await notificationUtil.createNotification(
      request.user,
      'Nuovo preventivo',
      `È stato inviato un preventivo di ${amount}€ per la tua richiesta`,
      'new_quote',
      request._id
    );
    
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Aggiungi un messaggio a una richiesta
router.post('/:id/messages', verifyToken, isAdmin, upload.array('attachments', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    console.log('Admin aggiunge messaggio alla richiesta:', id);
    console.log('Dati della richiesta:', req.body);
    console.log('File allegati:', req.files);
    
    // Trova la richiesta
    const request = await CustomRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: "Richiesta personalizzata non trovata" 
      });
    }
    
    // Prepara il messaggio
    const newMessage = {
      sender: 'admin',
      user: userId,
      message: req.body.text || 'Messaggio con allegato', // Assicurati che il messaggio non sia vuoto
      timestamp: new Date()
    };
    
    // Gestisci gli allegati se presenti
    if (req.files && req.files.length > 0) {
      try {
        newMessage.attachments = await Promise.all(req.files.map(async file => {
          // Genera il nome del file univoco
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = uniqueSuffix + path.extname(file.originalname);
          const filePath = path.join(uploadDir, filename);
          
          // Copia il file nella directory corretta
          await fs.promises.copyFile(file.path, filePath);
          // Rimuovi il file temporaneo
          await fs.promises.unlink(file.path);
          
          return {
            filename: file.originalname,
            path: filePath,
            url: `/uploads/custom-requests/${filename}`,
            mimetype: file.mimetype, // Usa mimetype invece di contentType per corrispondere al modello
            size: file.size
          };
        }));
        console.log('Allegati aggiunti al messaggio:', newMessage.attachments);
      } catch (error) {
        console.error('Errore nella gestione dei file:', error);
        return res.status(500).json({ 
          success: false, 
          message: "Errore nel salvataggio dei file",
          error: error.message 
        });
      }
    } else if (req.body.attachments) {
      // Gestisci gli allegati inviati come JSON
      try {
        let attachments = req.body.attachments;
        if (typeof attachments === 'string') {
          attachments = JSON.parse(attachments);
        }
        if (Array.isArray(attachments)) {
          newMessage.attachments = attachments;
        }
      } catch (error) {
        console.error('Errore nel parsing degli allegati:', error);
      }
    }
    
    // Aggiungi il messaggio alla conversazione
    request.conversation.push(newMessage);
    
    // Valida il documento prima del salvataggio
    const validationError = request.validateSync();
    if (validationError) {
      console.error('Errore di validazione:', validationError);
      return res.status(400).json({
        success: false,
        message: "Errore di validazione del messaggio",
        error: validationError.message
      });
    }

    // Salva con gestione errori esplicita
    try {
      await request.save();
      
      // Crea una notifica per l'utente
      await notificationUtil.createNotification(
        request.user,
        'Nuovo messaggio',
        `L'amministratore ha inviato un nuovo messaggio`,
        'new_message',
        request._id
      );
      
      res.status(201).json({
        success: true,
        message: "Messaggio aggiunto con successo",
        data: request
      });
    } catch (saveError) {
      console.error('Errore nel salvataggio del messaggio:', saveError);
      // Se ci sono allegati, proviamo a ripulire i file salvati
      if (newMessage.attachments) {
        try {
          await Promise.all(newMessage.attachments.map(attachment => 
            fs.promises.unlink(attachment.path).catch(err => 
              console.error(`Impossibile eliminare il file ${attachment.path}:`, err)
            )
          ));
        } catch (cleanupError) {
          console.error('Errore nella pulizia dei file:', cleanupError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: "Errore nel salvataggio del messaggio",
        error: saveError.message
      });
    }
  } catch (error) {
    console.error('Errore nell\'aggiunta del messaggio:', error);
    res.status(500).json({ 
      success: false, 
      message: "Errore nell'aggiunta del messaggio",
      error: error.message 
    });
  }
});

// Aggiungi note admin
router.put('/:id/notes', verifyToken, isAdmin, async (req, res) => {
  try {
    const { notes } = req.body;
    
    if (!notes) {
      return res.status(400).json({ message: 'Le note sono obbligatorie' });
    }
    
    const request = await CustomRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    request.adminNotes = notes;
    const updatedRequest = await request.save();
    
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ottieni statistiche sulle richieste
router.get('/stats/requests', verifyToken, isAdmin, async (req, res) => {
  try {
    const totalRequests = await CustomRequest.countDocuments();
    const pendingRequests = await CustomRequest.countDocuments({ status: 'pending' });
    const inProgressRequests = await CustomRequest.countDocuments({ status: 'in_progress' });
    const completedRequests = await CustomRequest.countDocuments({ status: 'completed' });
    const cancelledRequests = await CustomRequest.countDocuments({ status: 'cancelled' });
    
    const requestsByMonth = await CustomRequest.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      total: totalRequests,
      byStatus: {
        pending: pendingRequests,
        inProgress: inProgressRequests,
        completed: completedRequests,
        cancelled: cancelledRequests
      },
      byMonth: requestsByMonth
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Aggiorna i dati utente in tutte le richieste
router.post('/sync-user-data', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('Avvio sincronizzazione dati utente per tutte le richieste');
    
    // Trova tutte le richieste
    const requests = await CustomRequest.find({})
      .populate('user', 'name email fullName phoneNumber');
    
    console.log(`Trovate ${requests.length} richieste da sincronizzare`);
    
    let updatedCount = 0;
    
    // Per ogni richiesta con un utente valido
    for (const request of requests) {
      if (request.user && request.user._id) {
        try {
          // Carica i dati aggiornati dell'utente
          const user = await User.findById(request.user._id);
          
          if (user) {
            // Se l'utente ha dati aggiornati, creiamo un riferimento esplicito
            // per alcune proprietà chiave direttamente nella richiesta
            if (!request.userInfo) {
              request.userInfo = {};
            }
            
            request.userInfo = {
              name: user.fullName || user.username || 'N/A',
              email: user.email,
              phone: user.phoneNumber || 'N/A'
            };
            
            await request.save();
            updatedCount++;
          }
        } catch (error) {
          console.error(`Errore nell'aggiornamento della richiesta ${request._id}:`, error);
        }
      }
    }
    
    res.json({
      success: true,
      message: `Sincronizzazione completata. Aggiornate ${updatedCount} richieste su ${requests.length}.`
    });
  } catch (error) {
    console.error('Errore durante la sincronizzazione dei dati utente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Errore durante la sincronizzazione dei dati utente', 
      error: error.message 
    });
  }
});

// Eliminare una richiesta personalizzata (admin può eliminare qualsiasi richiesta)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log(`DELETE /custom-requests/admin/${req.params.id} chiamata`);
    console.log('Admin autenticato:', req.user);
    
    // Verifica se la richiesta esiste
    const request = await CustomRequest.findById(req.params.id);
    
    if (!request) {
      console.log(`Richiesta ${req.params.id} non trovata`);
      return res.status(404).json({ 
        success: false,
        message: 'Richiesta non trovata' 
      });
    }
    
    // Elimina la richiesta
    await CustomRequest.findByIdAndDelete(req.params.id);
    
    // Invia una notifica all'utente se la richiesta è stata eliminata
    if (request.user) {
      try {
        await notificationUtil.createNotification(
          request.user,
          'Richiesta personalizzata eliminata',
          `La tua richiesta "${request.title}" è stata eliminata da un amministratore`,
          'request_deleted',
          null
        );
        console.log(`Notifica inviata all'utente ${request.user}`);
      } catch (notificationError) {
        console.error('Errore nell\'invio della notifica:', notificationError);
      }
    }
    
    console.log(`Richiesta ${req.params.id} eliminata con successo`);
    res.status(200).json({ 
      success: true,
      message: 'Richiesta personalizzata eliminata con successo' 
    });
  } catch (error) {
    console.error('Errore durante l\'eliminazione della richiesta:', error);
    res.status(500).json({ 
      success: false,
      message: 'Errore durante l\'eliminazione della richiesta', 
      error: error.message 
    });
  }
});

export default router; 