import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import CustomRequest from '../models/custom-request.model.js';
import User from '../models/user.model.js';
import { createNotification } from '../controllers/notification.controller.js';
import mongoose from 'mongoose';
import { verifyToken } from '../middleware/auth.js';
import Notification from '../models/notification.model.js';
import multer from 'multer';
import * as notificationUtil from '../utils/notifications.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Assicurati che la directory per il salvataggio dei file esista
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

// Creare una nuova richiesta personalizzata
router.post('/', verifyToken, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, budget, shippingInfo = "", materials = {}, productId = null } = req.body;
    const userId = req.user._id;
    
    console.log('Creazione richiesta personalizzata, utente:', req.user);
    
    // Verifica che i campi obbligatori siano presenti
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Titolo e descrizione sono obbligatori"
      });
    }
    
    // Carica i dati completi dell'utente per assicurarci di avere le informazioni più recenti
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utente non trovato"
      });
    }
    
    // Prepara i dati per la creazione della richiesta
    const requestData = {
      user: userId,
      title,
      description,
      budget: budget || null,
      status: 'pending',
      shippingInfo,
      materials: materials || {},
      materialsStatus: 'pending',
      // Salva le informazioni utente direttamente nella richiesta
      userInfo: {
        name: user.fullName || user.username || 'N/A',
        email: user.email,
        phone: user.phoneNumber || 'N/A'
      }
    };
    
    // Aggiungi il prodotto di riferimento se specificato
    if (productId) {
      requestData.productId = productId;
    }
    
    // Gestisci gli allegati se presenti
    if (req.files && req.files.length > 0) {
      requestData.attachments = req.files.map(file => {
        // Converti il buffer in array di numeri per una migliore serializzazione
        const dataArray = Array.from(new Uint8Array(file.buffer));
        return {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          data: dataArray // Salva come array di numeri invece che come buffer
        };
      });
      console.log('Allegati aggiunti alla richiesta:', requestData.attachments);
    }
    
    // Crea la richiesta nel database
    const customRequest = new CustomRequest(requestData);
    await customRequest.save();
    
    // Notifica agli admin della nuova richiesta
    try {
      // Utilizzo della funzione di utilità per notificare gli admin
      await notificationUtil.notifyAdminsOfNewRequest(customRequest);
      console.log(`Notifica inviata agli admin per la nuova richiesta personalizzata`);
    } catch (notifyError) {
      console.error('Errore nell\'invio delle notifiche agli admin:', notifyError);
      // Continuiamo l'esecuzione anche se la notifica fallisce
    }
    
    res.status(201).json({
      success: true,
      message: "Richiesta personalizzata creata con successo",
      data: customRequest
    });
  } catch (error) {
    console.error('Errore durante la creazione della richiesta personalizzata:', error);
    res.status(500).json({ 
      success: false, 
      message: "Errore durante la creazione della richiesta personalizzata",
      error: error.message
    });
  }
});

// Ottenere tutte le richieste dell'utente corrente
router.get('/', verifyToken, async (req, res) => {
    try {
        console.log('GET /custom-requests/client chiamata');
        console.log('Utente autenticato:', req.user);
        console.log('ID utente per la query:', req.user.id);
        
        const requests = await CustomRequest.find({ user: req.user.id })
            .sort({ createdAt: -1 });
        
        console.log(`Trovate ${requests.length} richieste per l'utente ${req.user.id}`);
        if (requests.length > 0) {
            console.log('Prima richiesta trovata:', requests[0]);
        } else {
            console.log('Nessuna richiesta trovata');
        }
        
        res.json(requests);
    } catch (error) {
        console.error('Errore durante il recupero delle richieste:', error);
        res.status(500).json({ message: error.message });
    }
});

// Ottenere una richiesta specifica
router.get('/:id', verifyToken, async (req, res) => {
    try {
        console.log(`GET /custom-requests/client/${req.params.id} chiamata`);
        console.log('Utente autenticato:', req.user);
        
        // Validiamo l'ID prima di fare la query
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.log(`ID non valido: ${req.params.id}`);
            return res.status(400).json({ message: 'ID richiesta non valido' });
        }
        
        // Prova senza populate prima
        const request = await CustomRequest.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        // Se la richiesta non è stata trovata, verifica se il problema è user vs userId
        if (!request) {
            console.log(`Richiesta ${req.params.id} non trovata con user=${req.user.id}, provo con userId...`);
            const altRequest = await CustomRequest.findOne({ 
                _id: req.params.id,
                userId: req.user.id 
            });
            
            if (altRequest) {
                console.log('Richiesta trovata con userId invece di user');
                // Ora aggiungiamo il populate manualmente
                try {
                    if (altRequest.productId) {
                        const Product = mongoose.model('Product');
                        const product = await Product.findById(altRequest.productId).select('name images price');
                        if (product) {
                            altRequest.productId = product;
                        }
                    }
                } catch (populateError) {
                    console.error('Errore durante il populate del prodotto:', populateError);
                }
                
                return res.status(200).json(altRequest);
            }
            
            console.log(`Richiesta ${req.params.id} non trovata per l'utente ${req.user.id} (provato sia user che userId)`);
            return res.status(404).json({ message: 'Richiesta non trovata' });
        }
        
        // Se abbiamo trovato la richiesta, proviamo ad aggiungere i dati del prodotto
        try {
            if (request.productId) {
                const Product = mongoose.model('Product');
                const product = await Product.findById(request.productId).select('name images price');
                if (product) {
                    request.productId = product;
                }
            }
        } catch (populateError) {
            console.error('Errore durante il populate del prodotto:', populateError);
            // Continuiamo comunque, restituendo la richiesta senza i dati del prodotto
        }
        
        console.log(`Richiesta ${req.params.id} trovata con successo`);
        res.status(200).json(request);
    } catch (error) {
        console.error('Errore dettagliato durante il recupero della richiesta:', error);
        res.status(500).json({ message: 'Errore durante il recupero della richiesta' });
    }
});

// Ottieni la timeline di una richiesta specifica
router.get('/:id/timeline', verifyToken, async (req, res) => {
    try {
        // Verifica se la richiesta appartiene all'utente o se l'utente è un admin
        const query = req.user.role === 'admin' 
            ? { _id: req.params.id } 
            : { _id: req.params.id, user: req.user.id };
        
        const request = await CustomRequest.findOne(query);
        
        if (!request) {
            return res.status(404).json({ message: 'Richiesta non trovata' });
        }
        
        // Crea un array con tutti gli eventi della timeline, inclusi:
        // 1. Le voci esplicite della timeline
        // 2. Le date significative (creazione, inizio lavoro, completamento)
        
        const timelineEvents = [
            // Aggiunta evento di creazione richiesta
            {
                title: 'Richiesta creata',
                date: request.createdAt,
                status: 'inviata',
                actor: 'client'
            },
            // Aggiungi tutte le voci della timeline
            ...request.timelineEntries.map(entry => ({
                title: `Stato: ${entry.status}`,
                date: entry.date,
                status: entry.status,
                notes: entry.notes,
                actor: entry.actor
            }))
        ];
        
        // Ordina gli eventi per data crescente
        timelineEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        res.status(200).json({
            requestId: request._id,
            title: request.title,
            currentStatus: request.status,
            timeline: timelineEvents
        });
    } catch (error) {
        console.error('Errore durante il recupero della timeline:', error);
        res.status(500).json({ message: 'Errore durante il recupero della timeline' });
    }
});

// Aggiornare una richiesta (solo se è ancora "inviata" o "in valutazione")
router.put('/:id', verifyToken, async (req, res) => {
    try {
        console.log(`PUT /custom-requests/client/${req.params.id} chiamata`);
        console.log('Utente autenticato:', req.user);
        
        const request = await CustomRequest.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        if (!request) {
            console.log(`Richiesta ${req.params.id} non trovata per l'utente ${req.user.id}`);
            return res.status(404).json({ message: 'Richiesta non trovata' });
        }
        
        // Permetti modifiche solo se la richiesta è ancora in fase iniziale
        if (!['inviata', 'in valutazione'].includes(request.status)) {
            return res.status(400).json({ 
                message: 'Questa richiesta non può più essere modificata perché già in fase avanzata'
            });
        }
        
        const updateFields = {};
        const allowedFields = ['title', 'details', 'budget', 'attachments'];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateFields[field] = req.body[field];
            }
        });
        
        // Aggiorna specifici sottocampi dell'oggetto materials se forniti
        if (req.body.materials) {
            updateFields.materials = { ...request.materials };
            
            if (req.body.materials.description !== undefined) {
                updateFields.materials.description = req.body.materials.description;
            }
            
            // Non permettere di cambiare lo stato dei materiali direttamente dal cliente
        }
        
        // Aggiorna specifici sottocampi dell'oggetto shippingInfo se forniti
        if (req.body.shippingInfo) {
            updateFields.shippingInfo = { ...request.shippingInfo };
            
            if (req.body.shippingInfo.address !== undefined) {
                updateFields.shippingInfo.address = req.body.shippingInfo.address;
            }
        }
        
        const updatedRequest = await CustomRequest.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        );
        
        res.status(200).json({
            message: 'Richiesta aggiornata con successo',
            request: updatedRequest
        });
    } catch (error) {
        console.error('Errore durante l\'aggiornamento della richiesta:', error);
        res.status(500).json({ message: 'Errore durante l\'aggiornamento della richiesta' });
    }
});

// Aggiungere un messaggio alla conversazione
router.post('/:id/messages', verifyToken, upload.array('attachments'), async (req, res) => {
    try {
        console.log('POST /:id/messages chiamata');
        console.log('Body ricevuto:', req.body);
        console.log('File ricevuti:', req.files ? req.files.length : 0);
        
        const { text, attachments } = req.body;
        
        console.log(`Campo 'text' ricevuto: ${text !== undefined ? '"' + text + '"' : 'non presente'}`);
        
        // Controlla che ci sia almeno un allegato o un testo
        if (!text && (!req.files || req.files.length === 0) && !attachments) {
            console.log('Errore: Il messaggio deve contenere testo o almeno un allegato');
            return res.status(400).json({ message: 'Il messaggio deve contenere testo o almeno un allegato' });
        }
        
        const request = await CustomRequest.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        if (!request) {
            console.log(`Richiesta ${req.params.id} non trovata per l'utente ${req.user.id}`);
            return res.status(404).json({ message: 'Richiesta non trovata' });
        }
        
        console.log('Richiesta trovata, processo gli allegati');
        
        // Array per gli allegati
        let messageAttachments = [];
        
        // Gestione degli allegati caricati tramite upload.array
        if (req.files && req.files.length > 0) {
            console.log(`Processo ${req.files.length} file ricevuti:`, 
                req.files.map(f => ({
                    filename: f.originalname,
                    size: f.size,
                    mimetype: f.mimetype
                }))
            );
            
            for (const file of req.files) {
                console.log(`Processando file: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
                
                try {
                    // Genera il nome del file univoco
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const filename = uniqueSuffix + path.extname(file.originalname);
                    const filePath = path.join(uploadDir, filename);
                    
                    // Copia il file nella directory corretta
                    await fs.promises.copyFile(file.path, filePath);
                    // Rimuovi il file temporaneo
                    await fs.promises.unlink(file.path);
                    
                    const attachment = {
                        filename: file.originalname,
                        path: filePath,
                        url: `/uploads/custom-requests/${filename}`,
                        mimetype: file.mimetype,
                        size: file.size
                    };
                    
                    messageAttachments.push(attachment);
                    console.log(`Allegato aggiunto: ${file.originalname}`);
                } catch (fileError) {
                    console.error(`Errore durante il processo del file ${file.originalname}:`, fileError);
                }
            }
        }
        
        // Gestione degli allegati inviati come JSON
        if (attachments) {
            console.log('Processo allegati inviati come JSON:', 
                Array.isArray(attachments) ? `Array con ${attachments.length} elementi` : typeof attachments);
            
            try {
                // Se attachments è una stringa, prova a parsarla come JSON
                let parsedAttachments = attachments;
                if (typeof attachments === 'string') {
                    try {
                        parsedAttachments = JSON.parse(attachments);
                        console.log('Allegati JSON parsati con successo');
                    } catch (e) {
                        console.error('Errore nel parsing degli allegati JSON:', e);
                    }
                }
                
                // Se parsedAttachments è un array, processa ogni elemento
                if (Array.isArray(parsedAttachments)) {
                    for (const attachment of parsedAttachments) {
                        console.log('Processo allegato JSON:', attachment);
                        messageAttachments.push(attachment);
                    }
                } else if (parsedAttachments && typeof parsedAttachments === 'object') {
                    // Se è un singolo oggetto, aggiungilo come allegato
                    console.log('Processo singolo allegato JSON:', parsedAttachments);
                    messageAttachments.push(parsedAttachments);
                }
            } catch (parseError) {
                console.error('Errore nella gestione degli allegati JSON:', parseError);
            }
        }
        
        console.log(`Aggiungo messaggio con ${messageAttachments.length} allegati`);
        
        const newMessage = {
            sender: 'user',
            message: text || 'Allegato inviato', // Se non c'è testo, usa un placeholder
            attachments: messageAttachments,
            timestamp: new Date()
        };
        
        console.log('Messaggio creato:', {
            sender: newMessage.sender,
            message: newMessage.message,
            timestamp: newMessage.timestamp,
            attachmentsCount: newMessage.attachments.length
        });
        
        request.conversation.push(newMessage);
        await request.save();
        console.log(`Messaggio aggiunto con successo alla richiesta ${req.params.id}. ID messaggio: ${request.conversation[request.conversation.length-1]._id}`);
        
        // Crea notifica per gli admin
        try {
            // Utilizziamo l'utility di notifica per notificare tutti gli admin
            await notificationUtil.notifyAllAdmins(
                'new_request',
                'Nuova richiesta di personalizzazione',
                `${req.user.name || 'Un cliente'} ha richiesto una personalizzazione per il prodotto "${request.productId.name}"`,
                request._id,
                null
            );
            console.log('Notifiche create per tutti gli admin');
        } catch (notifError) {
            console.error('Errore durante la creazione della notifica:', notifError);
            // Non interrompiamo il flusso se la notifica fallisce
        }
        
        console.log('Messaggio aggiunto con successo');
        res.status(201).json({
            message: 'Messaggio aggiunto con successo',
            newMessage: {
                sender: newMessage.sender,
                message: newMessage.message,
                timestamp: newMessage.timestamp,
                attachments: newMessage.attachments.map(att => ({
                    filename: att.filename,
                    mimetype: att.mimetype,
                    size: att.size,
                    url: att.url,
                    hasData: !!att.data
                }))
            }
        });
    } catch (error) {
        console.error('Errore durante l\'aggiunta del messaggio:', error);
        res.status(500).json({ message: 'Errore durante l\'aggiunta del messaggio' });
    }
});

// Aggiungere/aggiornare informazioni di spedizione per i materiali
router.put('/:id/shipping-info', verifyToken, async (req, res) => {
    try {
        const request = await CustomRequest.findOne({
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!request) {
            return res.status(404).json({ message: 'Richiesta non trovata' });
        }
        
        // Controlla se la richiesta è di tipo upcycling e se i materiali sono forniti dal cliente
        if (request.requestType !== 'upcycling' || !request.materials.providedByCustomer) {
            return res.status(400).json({ 
                message: 'Le informazioni di spedizione possono essere aggiornate solo per richieste di upcycling con materiali forniti dal cliente' 
            });
        }
        
        // Controlla se la richiesta è in uno stato appropriato
        if (!['inviata', 'in valutazione', 'preventivo inviato', 'approvata'].includes(request.status)) {
            return res.status(400).json({ 
                message: 'Le informazioni di spedizione non possono essere aggiornate in questa fase' 
            });
        }
        
        const { address, trackingCode, carrier } = req.body;
        
        request.shippingInfo = {
            ...request.shippingInfo,
            ...(address && { address }),
            ...(trackingCode && { trackingCode }),
            ...(carrier && { carrier })
        };
        
        // Se il cliente fornisce un tracking code, aggiorna lo stato dei materiali
        if (trackingCode && trackingCode.trim() !== '') {
            request.materials.status = 'da inviare';
            
            // Aggiungi un messaggio automatico alla conversazione
            request.conversation.push({
                sender: 'client',
                message: `Ho spedito i materiali. Codice di tracciamento: ${trackingCode} (${carrier || 'corriere non specificato'})`,
                timestamp: new Date()
            });
        }
        
        await request.save();
        
        res.status(200).json({
            message: 'Informazioni di spedizione aggiornate con successo',
            shippingInfo: request.shippingInfo,
            materialsStatus: request.materials.status
        });
    } catch (error) {
        console.error('Errore durante l\'aggiornamento delle informazioni di spedizione:', error);
        res.status(500).json({ message: 'Errore durante l\'aggiornamento delle informazioni di spedizione' });
    }
});

// Approvare un preventivo
router.post('/:id/approve', verifyToken, async (req, res) => {
    try {
        console.log(`POST /custom-requests/client/${req.params.id}/approve chiamata`);
        console.log('Utente autenticato:', req.user);
        
        const request = await CustomRequest.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        if (!request) {
            console.log(`Richiesta ${req.params.id} non trovata per l'utente ${req.user.id}`);
            return res.status(404).json({ message: 'Richiesta non trovata' });
        }
        
        if (request.status !== 'preventivo inviato') {
            return res.status(400).json({ 
                message: 'Questa richiesta non ha un preventivo da approvare o è già stata approvata' 
            });
        }
        
        // Aggiorna lo stato della richiesta
        request.status = 'approvata';
        
        // Aggiungi una voce alla timeline
        request.timelineEntries.push({
            status: 'accepted',
            date: new Date(),
            notes: 'Hai accettato il preventivo. La tua richiesta è ora in fase di produzione!',
            actor: 'client'
        });
        
        // Notifica gli admin dell'accettazione
        try {
            await notificationUtil.notifyAllAdmins(
                'Preventivo accettato',
                `Il cliente ha accettato il preventivo per la richiesta "${request.title}"`,
                'quote_accepted',
                request._id,
                req.user.id
            );
        } catch (notifyError) {
            console.error('Errore nell\'invio della notifica agli admin:', notifyError);
        }
        
        await request.save();
        
        res.status(200).json({
            message: 'Preventivo approvato con successo',
            status: request.status
        });
    } catch (error) {
        console.error('Errore durante l\'approvazione del preventivo:', error);
        res.status(500).json({ message: 'Errore durante l\'approvazione del preventivo' });
    }
});

// Annullare una richiesta
router.put('/:id/cancel', verifyToken, async (req, res) => {
    try {
        console.log(`PUT /custom-requests/client/${req.params.id}/cancel chiamata`);
        const request = await CustomRequest.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        if (!request) {
            console.log(`Richiesta ${req.params.id} non trovata per l'utente ${req.user.id}`);
            return res.status(404).json({ message: 'Richiesta non trovata' });
        }
        
        // Controlla se la richiesta può essere annullata
        if (['in lavorazione', 'completata', 'annullata'].includes(request.status)) {
            return res.status(400).json({ 
                message: 'Questa richiesta non può essere annullata perché è già in fase avanzata o completata' 
            });
        }
        
        const oldStatus = request.status;
        request.status = 'annullata';
        
        // Aggiungi una voce alla timeline
        request.timelineEntries.push({
            status: 'annullata',
            date: new Date(),
            notes: 'Richiesta annullata dal cliente',
            actor: 'client'
        });
        
        // Aggiungi un messaggio automatico alla conversazione
        request.conversation.push({
            sender: 'user',
            message: 'Ho annullato questa richiesta.',
            timestamp: new Date()
        });
        
        await request.save();
        
        // Crea una notifica per gli admin
        try {
            await notificationUtil.notifyAllAdmins(
                'new_request',
                'Richiesta annullata',
                `Il cliente ha annullato la richiesta "${request.title}"`,
                request._id,
                null
            );
            console.log('Notifiche di annullamento create per tutti gli admin');
        } catch (notifError) {
            console.error('Errore durante la creazione della notifica:', notifError);
            // Non interrompiamo il flusso se la notifica fallisce
        }
        
        res.status(200).json({
            message: 'Richiesta annullata con successo',
            status: request.status
        });
    } catch (error) {
        console.error('Errore durante l\'annullamento della richiesta:', error);
        res.status(500).json({ message: 'Errore durante l\'annullamento della richiesta' });
    }
});

// Marcare un messaggio come letto
router.put('/:id/messages/:messageId/read', verifyToken, async (req, res) => {
    try {
        const { id, messageId } = req.params;
        const userId = req.user.id;
        
        // Trova la richiesta
        const request = await CustomRequest.findOne({
            _id: id,
            $or: [
                { user: userId },
                ...(req.user.role === 'admin' ? [{ _id: id }] : [])
            ]
        });
        
        if (!request) {
            return res.status(404).json({ message: 'Richiesta non trovata' });
        }
        
        // Trova il messaggio
        const message = request.conversation.id(messageId);
        
        if (!message) {
            return res.status(404).json({ message: 'Messaggio non trovato' });
        }
        
        // Un utente può marcare come letto solo i messaggi inviati dall'altro utente
        const expectedSender = req.user.role === 'admin' ? 'user' : 'admin';
        
        if (message.sender !== expectedSender) {
            return res.status(400).json({ 
                message: 'Puoi marcare come letti solo i messaggi ricevuti, non quelli inviati' 
            });
        }
        
        // Marca il messaggio come letto se non lo è già
        if (!message.read) {
            message.read = true;
            message.readAt = new Date();
            await request.save();
        }
        
        res.status(200).json({
            message: 'Messaggio marcato come letto',
            updatedMessage: message
        });
    } catch (error) {
        console.error('Errore durante la marcatura del messaggio come letto:', error);
        res.status(500).json({ message: 'Errore durante la marcatura del messaggio come letto' });
    }
});

// Ottenere il conteggio dei messaggi non letti
router.get('/messages/unread-count', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        
        // Trova tutte le richieste rilevanti per l'utente
        const requests = isAdmin
            ? await CustomRequest.find({})
            : await CustomRequest.find({ user: userId });
            
        // Conta i messaggi non letti
        let unreadCount = 0;
        
        requests.forEach(request => {
            if (request.conversation) {
                request.conversation.forEach(message => {
                    // Un admin conta i messaggi non letti inviati dai client (user)
                    // Un client conta i messaggi non letti inviati dagli admin
                    if ((isAdmin && message.sender === 'user' && !message.read) ||
                        (!isAdmin && message.sender === 'admin' && !message.read)) {
                        unreadCount++;
                    }
                });
            }
        });
        
        res.status(200).json({ unreadCount });
    } catch (error) {
        console.error('Errore durante il conteggio dei messaggi non letti:', error);
        res.status(500).json({ message: 'Errore durante il conteggio dei messaggi non letti' });
    }
});

// Marcare tutti i messaggi di una richiesta come letti
router.put('/:id/messages/read-all', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        
        // Trova la richiesta
        const request = await CustomRequest.findOne({
            _id: id,
            $or: [
                { user: userId },
                ...(isAdmin ? [{ _id: id }] : [])
            ]
        });
        
        if (!request) {
            return res.status(404).json({ message: 'Richiesta non trovata' });
        }
        
        // Determina quali messaggi marcare come letti
        const expectedSender = isAdmin ? 'user' : 'admin';
        let updatedCount = 0;
        
        if (request.conversation) {
            request.conversation.forEach(message => {
                if (message.sender === expectedSender && !message.read) {
                    message.read = true;
                    message.readAt = new Date();
                    updatedCount++;
                }
            });
        }
        
        if (updatedCount > 0) {
            await request.save();
        }
        
        res.status(200).json({
            message: 'Messaggi marcati come letti',
            updatedCount
        });
    } catch (error) {
        console.error('Errore durante la marcatura dei messaggi come letti:', error);
        res.status(500).json({ message: 'Errore durante la marcatura dei messaggi come letti' });
    }
});

// Creare una richiesta di personalizzazione da un prodotto esistente
router.post('/products/:productId/customize', verifyToken, upload.array('attachments'), async (req, res) => {
    try {
        const { productId } = req.params;
        const { title, details, budget, customizationOptions } = req.body;
        
        console.log('Ricevuta richiesta di personalizzazione per prodotto:', productId);
        console.log('Dati ricevuti:', req.body);
        console.log('File ricevuti:', req.files ? req.files.length : 0);
        
        // Verifica che il prodotto esista
        const Product = mongoose.model('Product');
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({ message: 'Prodotto non trovato' });
        }
        
        // Creazione della richiesta personalizzata
        const newRequest = new CustomRequest({
            user: req.user.id,
            title: title || `Personalizzazione: ${product.name}`,
            description: details || 'Richiesta di personalizzazione prodotto',
            budget: budget || product.price,
            status: 'pending',
            conversation: [{
                sender: 'user',
                message: 'Ho inviato una richiesta di personalizzazione',
                timestamp: new Date()
            }]
        });
        
        // Gestione degli allegati
        if (req.files && req.files.length > 0) {
            newRequest.attachments = req.files.map(file => ({
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                data: file.buffer
            }));
        }
        
        // Gestione delle opzioni di personalizzazione
        try {
            if (customizationOptions) {
                const options = typeof customizationOptions === 'string' 
                    ? JSON.parse(customizationOptions) 
                    : customizationOptions;
                
                newRequest.customizationOptions = options;
            }
        } catch (optionError) {
            console.error('Errore nel parsing delle opzioni di personalizzazione:', optionError);
            // Non interrompiamo il flusso se il parsing fallisce
        }
        
        // Salva la richiesta
        await newRequest.save();
        
        // Notifica gli amministratori
        try {
            // Utilizziamo l'utility di notifica per notificare tutti gli admin
            await notificationUtil.notifyAllAdmins(
                'new_request',
                'Nuova richiesta di personalizzazione',
                `${req.user.name || 'Un cliente'} ha richiesto una personalizzazione per il prodotto "${product.name}"`,
                newRequest._id,
                null
            );
            console.log('Notifiche create per tutti gli admin');
        } catch (notifError) {
            console.error('Errore durante la creazione della notifica:', notifError);
            // Non interrompiamo il flusso se la notifica fallisce
        }
        
        res.status(201).json({
            message: 'Richiesta di personalizzazione creata con successo',
            request: newRequest
        });
    } catch (error) {
        console.error('Errore durante la creazione della richiesta di personalizzazione:', error);
        res.status(500).json({ 
            message: 'Errore durante la creazione della richiesta di personalizzazione',
            error: error.message 
        });
    }
});

// Aggiorna una richiesta
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const request = await CustomRequest.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!request) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    // Aggiorna solo i campi consentiti
    const allowedUpdates = ['description', 'preferredMaterials', 'budget', 'deadline'];
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        request[key] = req.body[key];
      }
    });
    
    const updatedRequest = await request.save();
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Accetta un preventivo
router.post('/:id/accept-quote', verifyToken, async (req, res) => {
  try {
    const request = await CustomRequest.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!request) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    if (request.status !== 'quoted' && request.status !== 'preventivo inviato') {
      return res.status(400).json({ message: 'La richiesta non ha un preventivo da accettare' });
    }
    
    request.status = 'accepted';
    request.acceptedQuote = request.quote;
    
    // Aggiungi una voce alla timeline
    request.timelineEntries.push({
      status: 'accepted',
      date: new Date(),
      notes: 'Hai accettato il preventivo. La produzione inizierà a breve.',
      actor: 'client'
    });
    
    const updatedRequest = await request.save();
    
    // Notifica gli admin dell'accettazione
    try {
      await notificationUtil.notifyAllAdmins(
        'Preventivo accettato',
        `Il cliente ha accettato il preventivo per la richiesta "${request.title}"`,
        'quote_accepted',
        request._id,
        req.user.id
      );
    } catch (notifyError) {
      console.error('Errore nell\'invio della notifica agli admin:', notifyError);
    }
    
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Rifiuta un preventivo
router.post('/:id/reject-quote', verifyToken, async (req, res) => {
  try {
    const request = await CustomRequest.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!request) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    if (request.status !== 'quoted' && request.status !== 'preventivo inviato') {
      return res.status(400).json({ message: 'La richiesta non ha un preventivo da rifiutare' });
    }
    
    request.status = 'rejected';
    request.quote = null;
    
    // Aggiungi una voce alla timeline
    request.timelineEntries.push({
      status: 'rejected',
      date: new Date(),
      notes: 'Hai rifiutato il preventivo. Puoi contattarci per richiedere modifiche o un nuovo preventivo.',
      actor: 'client'
    });
    
    const updatedRequest = await request.save();
    
    // Notifica gli admin del rifiuto
    try {
      await notificationUtil.notifyAllAdmins(
        'Preventivo rifiutato',
        `Il cliente ha rifiutato il preventivo per la richiesta "${request.title}"`,
        'quote_rejected',
        request._id,
        req.user.id
      );
    } catch (notifyError) {
      console.error('Errore nell\'invio della notifica agli admin:', notifyError);
    }
    
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminare una richiesta personalizzata (solo se è ancora "pending")
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        console.log(`DELETE /custom-requests/client/${req.params.id} chiamata`);
        console.log('Utente autenticato:', req.user);
        
        // Trova la richiesta dell'utente
        const request = await CustomRequest.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        // Verifica se la richiesta esiste
        if (!request) {
            console.log(`Richiesta ${req.params.id} non trovata per l'utente ${req.user.id}`);
            return res.status(404).json({ 
                success: false,
                message: 'Richiesta non trovata' 
            });
        }
        
        // Verifica se lo stato è "pending"
        if (request.status !== 'pending') {
            console.log(`Impossibile eliminare la richiesta: stato attuale è ${request.status}`);
            return res.status(403).json({ 
                success: false,
                message: 'Non è possibile eliminare una richiesta che è già in lavorazione o completata' 
            });
        }
        
        // Elimina la richiesta
        await CustomRequest.findByIdAndDelete(req.params.id);
        
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