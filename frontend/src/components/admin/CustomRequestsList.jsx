import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, faTimes,
  faPen, faComments, faTag,
  faPaperPlane, faBell, faCheckCircle,
  faTasks, faPaperclip, faTrash,
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/admin/custom-requests-list.css';
import { customRequestAdminService } from '../../services/api';
import { toast } from 'react-toastify';
import './CustomRequestsList.css';
import { formatDistance, format, differenceInDays, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import axios from 'axios';
import notificationService from '../../services/notificationService';

// Funzione di utilità per formattare le date
export const formatDate = (dateString) => {
  if (!dateString) return '';
  return formatDistance(new Date(dateString), new Date(), {
    addSuffix: true,
    locale: it
  });
};

// Renderizza un allegato basato sul tipo
const renderAttachment = (attachment) => {
  // Determina se è un'immagine
  const isImage = attachment.mimetype?.startsWith('image/') || 
                 /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.filename);
  
  // URL base per il server
  const baseUrl = 'http://localhost:3001';
  
  if (isImage) {
    // Costruisci l'URL dell'immagine
    let imageUrl;
    
    // Se c'è un URL nell'allegato, usalo (aggiungendo il baseUrl se non è un URL completo)
    if (attachment.url) {
      if (attachment.url.startsWith('http')) {
        imageUrl = attachment.url;
      } else {
        imageUrl = `${baseUrl}${attachment.url}`;
      }
    } 
    // Fallback al filename solo se non c'è URL
    else if (attachment.filename) {
      imageUrl = `${baseUrl}/uploads/custom-requests/${attachment.filename}`;
    }
    // Se non c'è né URL né filename, usa un placeholder
    else {
      imageUrl = 'https://placehold.co/400x400?text=Immagine+non+disponibile';
    }
    
    return (
      <div className="image-attachment">
        <img 
          src={imageUrl} 
          alt={attachment.filename || 'Immagine'} 
          className="attachment-preview"
          onError={(e) => {
            // In caso di errore, utilizza il placeholder
            e.target.src = 'https://placehold.co/400x400?text=Immagine+non+disponibile';
          }}
        />
        <div className="attachment-filename">{attachment.filename || 'Immagine'}</div>
      </div>
    );
  }
  
  // Per i file non immagine
  let fileUrl;
  if (attachment.url) {
    if (attachment.url.startsWith('http')) {
      fileUrl = attachment.url;
    } else {
      fileUrl = `${baseUrl}${attachment.url}`;
    }
  } 
  else if (attachment.filename) {
    fileUrl = `${baseUrl}/uploads/custom-requests/${attachment.filename}`;
  }
  else {
    fileUrl = '#';
  }
  
  return (
    <div className="file-attachment">
      <a href={fileUrl} download={attachment.filename || 'file'}>
        <span className="file-icon">📎</span>
        <span className="file-name">{attachment.filename || 'File'}</span>
      </a>
    </div>
  );
};

// Definizione delle etichette di stato
const statusLabels = {
  'pending': { label: 'In attesa', color: 'primary' },
  'in_progress': { label: 'In Lavorazione', color: 'warning' },
  'quoted': { label: 'Preventivo Inviato', color: 'info' },
  'accepted': { label: 'Approvata', color: 'success' },
  'rejected': { label: 'Rifiutata', color: 'danger' },
  'completed': { label: 'Completata', color: 'success' },
  'cancelled': { label: 'Annullata', color: 'secondary' }
};

const CustomRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [unreadRequests, setUnreadRequestsCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);
  const [fileInputs, setFileInputs] = useState([]);
  const [requestsWithNotifications, setRequestsWithNotifications] = useState({});
  const [activeTab, setActiveTab] = useState('details');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [adminNotesList, setAdminNotesList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [requestToDelete, setRequestToDelete] = useState(null);

  // Costanti
  const currentPage = page;

  // Stati per il form del preventivo
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteValidUntil, setQuoteValidUntil] = useState('');

  // Stato per il testo del messaggio
  const [messageText, setMessageText] = useState('');
  
  // Funzione per mostrare notifiche
  const displayNotification = (message, type = 'info') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else if (type === 'warning') {
      toast.warning(message);
    } else {
      toast.info(message);
    }
  };
  
  const fetchRequests = useCallback(async (page = 1, status = 'all') => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      console.log(`Tentativo di recupero richieste: pagina ${page}, stato ${status}`);
      
      // Introduciamo un breve ritardo per dare tempo al browser di renderizzare lo stato di caricamento
      if (isInitialLoad) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      console.log('Chiamando il servizio customRequestAdminService.getAll()');
      const response = await customRequestAdminService.getAll();
      console.log("Risposta completa ricevuta dal servizio:", response);
      
      // Controlliamo se c'è un errore nella risposta
      if (response.error) {
        console.error('Errore restituito dal servizio:', response.error);
        setError(response.error);
        setRequests([]);
        return;
      }
      
      // Verifica che la risposta contenga i dati attesi
      if (response && response.data && response.data.requests) {
        console.log(`Trovate ${response.data.requests.length} richieste`);
        const requestsData = response.data.requests;
        
        // Log dei primi due elementi per debug
        if (requestsData.length > 0) {
          console.log("Esempio di richiesta ricevuta:", JSON.stringify(requestsData[0], null, 2).substring(0, 200) + '...');
        }
        
        // Verifica che i dati abbiano la struttura attesa
        if (Array.isArray(requestsData)) {
          // Filtriamo per stato se necessario
          let filteredRequests = requestsData;
          if (status && status !== 'all') {
            filteredRequests = requestsData.filter(req => req.status === status);
            console.log(`Filtrate ${filteredRequests.length} richieste con stato '${status}'`);
          }
          
          setRequests(filteredRequests);
          setTotalPages(response.data.pages || Math.ceil(filteredRequests.length / 10) || 1);
          setError(null);
          console.log('Dati richieste impostati con successo nello stato del componente');
      } else {
          console.error('Formato richieste non valido, non è un array:', requestsData);
          setError('Formato richieste non valido');
          setRequests([]);
        }
      } else {
        console.error('Formato risposta non valido:', response);
        // Se abbiamo almeno qualche dato, proviamo a utilizzarlo
        if (response && response.data) {
          const fallbackRequests = Array.isArray(response.data) ? response.data : [];
          console.log('Utilizzando i dati fallback:', fallbackRequests.length);
          setRequests(fallbackRequests);
          setTotalPages(1);
        } else {
          setError('Errore nel formato dei dati ricevuti');
          setRequests([]);
        }
      }
    } catch (error) {
      console.error('Errore non gestito nel recupero delle richieste:', error);
      console.error('Dettagli errore:', error.response?.data || error.message);
      setError('Errore nel recupero delle richieste: ' + (error.message || 'Errore sconosciuto'));
      setRequests([]);
    } finally {
      if (isInitialLoad) {
        // Aggiunto un piccolo ritardo prima di rimuovere lo stato di caricamento
        // per evitare flickering dell'interfaccia
        setTimeout(() => {
          setLoading(false);
          setIsInitialLoad(false);
        }, 200);
      } else {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, [isInitialLoad]);
  
  const viewRequest = async (requestId, keepCurrentTab = false) => {
    try {
      setLoading(true);
      const response = await customRequestAdminService.getById(requestId);
      setSelectedRequest(response.data);
      
      // Inizializza la lista delle note se esistono
      if (response.data.adminNotes) {
        // Dividi le note in un array se contengono separatori
        const notesArray = response.data.adminNotes.split('---NOTE---').filter(note => note.trim() !== '');
        setAdminNotesList(notesArray);
      } else {
        setAdminNotesList([]);
      }
      
      if (!keepCurrentTab) {
        setActiveTab('details');
      }
      
      // Se questa richiesta ha notifiche non lette, marcale come lette
      if (requestsWithNotifications[requestId]) {
          await notificationService.markRequestNotificationsAsRead(requestId);
        
        // Rimuovi questa richiesta dall'elenco delle richieste con notifiche
        const updatedRequestsWithNotifications = { ...requestsWithNotifications };
        delete updatedRequestsWithNotifications[requestId];
        setRequestsWithNotifications(updatedRequestsWithNotifications);
        
        // Aggiorna i contatori
          await checkUnreadRequests();
        
        // Mostra un toast di conferma
        toast.success('Notifiche della richiesta segnate come lette');
      }
    } catch (error) {
      console.error('Errore nel recupero della richiesta:', error);
      toast.error('Errore nel recupero della richiesta');
    } finally {
      setLoading(false);
    }
  };
  
  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      await customRequestAdminService.updateStatus(requestId, newStatus);
      await fetchRequests(currentPage, statusFilter);
      toast.success('Stato aggiornato con successo');
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello stato:', error);
      toast.error('Errore nell\'aggiornamento dello stato');
    }
  };
  
  const sendMessage = async (requestId) => {
    try {
      const formData = new FormData();
      formData.append('text', messageText);
      
      // Aggiungi i file al FormData
      fileInputs.forEach((input) => {
        if (input.files && input.files.length > 0) {
          // Aggiungi ogni file come allegato
          formData.append('attachments', input.files[0]);
          console.log(`Allegato file: ${input.files[0].name}`);
        }
      });

      // Aggiungi log prima dell'invio
      console.log('Invio messaggio alla richiesta:', requestId);
      console.log('Testo messaggio:', messageText);
      
      await customRequestAdminService.addMessage(requestId, formData);
      
      // Aggiungi un ritardo prima di aggiornare la conversazione
      setTimeout(async () => {
        try {
          console.log('Aggiornamento conversazione dopo invio messaggio');
          const updatedRequest = await customRequestAdminService.getById(requestId);
          console.log('Dati richiesta aggiornati ricevuti:', updatedRequest);
          
          if (updatedRequest && updatedRequest.data) {
            console.log('Messaggi nella risposta:', updatedRequest.data.messages?.length || 0);
            setSelectedRequest(updatedRequest.data);
            
            // Imposta la tab dei messaggi come attiva
            setActiveTab('messages');
            
            // Pulisci il form
            setMessageText('');
            setFileInputs([{ id: 1 }]);
            
            toast.success('Messaggio inviato con successo');
            } else {
            console.error('Risposta non valida dopo invio messaggio:', updatedRequest);
            toast.warning('Messaggio inviato ma ci sono stati problemi nell\'aggiornamento della conversazione');
          }
        } catch (updateError) {
          console.error('Errore nell\'aggiornamento della conversazione:', updateError);
          toast.warning('Messaggio inviato ma ci sono stati problemi nell\'aggiornamento della conversazione');
        }
      }, 1000); // Ritardo di 1 secondo per assicurare che il server abbia completato l'elaborazione
    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error);
      toast.error('Errore nell\'invio del messaggio');
    }
  };
  
  const sendQuote = async (requestId) => {
    try {
      const quoteData = {
        amount: parseFloat(quoteAmount),
        description: quoteDescription,
        validUntil: quoteValidUntil
      };
      
      await customRequestAdminService.addQuote(requestId, quoteData);
      
      // Aggiorna i dettagli della richiesta
      const updatedRequest = await customRequestAdminService.getById(requestId);
      setSelectedRequest(updatedRequest.data);
      
      // Pulisci il form
      setQuoteAmount('');
      setQuoteDescription('');
      setQuoteValidUntil('');
      
      toast.success('Preventivo inviato con successo');
              } catch (error) {
      console.error('Errore nell\'invio del preventivo:', error);
      toast.error('Errore nell\'invio del preventivo');
    }
  };
  
  // Controllo delle notifiche non lette
  const checkUnreadRequests = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCountByType('new_request');
      setUnreadRequestsCount(count);
    } catch (error) {
      console.error("Errore nel controllo delle richieste non lette:", error);
    }
  }, []);

  // Segna tutte le notifiche come lette
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await notificationService.markRequestNotificationsAsRead();
      setUnreadRequestsCount(0);
    } catch (error) {
      console.error("Errore nel marcare le notifiche come lette:", error);
    }
  }, []);

  // Segna tutte le notifiche di una richiesta come lette
  const markRequestNotificationsAsRead = async (requestId, e) => {
    if (e) {
      e.stopPropagation(); // Impedisce di aprire i dettagli della richiesta
    }
    
    try {
      setLoading(true);
      await notificationService.markRequestNotificationsAsRead(requestId);
      
      // Aggiorna i conteggi
      await checkUnreadRequests();
      
      toast.success('Notifiche della richiesta segnate come lette');
    } catch (error) {
      console.error('Errore durante la lettura delle notifiche della richiesta:', error);
      toast.error('Si è verificato un errore. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Caricamento iniziale
  useEffect(() => {
    fetchRequests();
    checkUnreadRequests();
    
    // Attiva il polling delle notifiche
    const intervalId = setInterval(checkUnreadRequests, 30000);
    
    // Segna le notifiche come lette quando si visita questa pagina
    markAllNotificationsAsRead();
    
    return () => {
      clearInterval(intervalId);
    };
  }, [page, filter, searchTerm, checkUnreadRequests, markAllNotificationsAsRead]);
  
  // Salva le note amministrative
  const saveAdminNotes = async (requestId) => {
    try {
      if (!adminNotes.trim()) {
        toast.warning('Inserisci una nota prima di salvare');
        return;
      }
      
      // Aggiungi la nuova nota alla lista
      const updatedNotesList = [...adminNotesList, adminNotes];
      
      // Unisci tutte le note con un separatore
      const combinedNotes = updatedNotesList.join('---NOTE---');
      
      // Invia sempre un oggetto con il campo notes, anche se vuoto
      await axios.put(
        `http://localhost:3001/api/custom-requests/admin/${requestId}/notes`,
        { notes: combinedNotes },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Aggiorna la richiesta selezionata
      if (selectedRequest && selectedRequest._id === requestId) {
        setSelectedRequest(prev => ({ ...prev, adminNotes: combinedNotes }));
      }
      
      // Aggiorna la lista delle note
      setAdminNotesList(updatedNotesList);

      // Aggiorna anche la lista delle richieste
      await fetchRequests(currentPage, statusFilter);
      
      // Pulisci il campo delle note dopo il salvataggio
      setAdminNotes('');
      
      toast.success('Note aggiornate con successo');
    } catch (err) {
      console.error('Errore nel salvare le note:', err);
      toast.error(`Errore: ${err.response?.data?.message || err.message}`);
    }
  };
  
  // Elimina una nota
  const deleteNote = async (requestId, noteIndex) => {
    try {
      // Rimuovi la nota dalla lista
      const updatedNotesList = adminNotesList.filter((_, index) => index !== noteIndex);
      
      // Unisci tutte le note con un separatore
      const combinedNotes = updatedNotesList.join('---NOTE---');
      
      // Invia l'aggiornamento al server
      await axios.put(
        `http://localhost:3001/api/custom-requests/admin/${requestId}/notes`,
        { notes: combinedNotes },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Aggiorna la richiesta selezionata
      if (selectedRequest && selectedRequest._id === requestId) {
        setSelectedRequest(prev => ({ ...prev, adminNotes: combinedNotes }));
      }
      
      // Aggiorna la lista delle note
      setAdminNotesList(updatedNotesList);
      
      // Aggiorna anche la lista delle richieste
      await fetchRequests(currentPage, statusFilter);
      
      toast.success('Nota eliminata con successo');
    } catch (err) {
      console.error('Errore nell\'eliminare la nota:', err);
      toast.error(`Errore: ${err.response?.data?.message || err.message}`);
    }
  };
  
  // Funzione per aggiungere un nuovo input file
  const addFileInput = () => {
    // Limita a massimo 3 file per messaggio
    if (fileInputs.length >= 3) {
      displayNotification('Puoi allegare al massimo 3 file per messaggio', 'warning');
      return;
    }
    
    const newId = Date.now().toString();
    setFileInputs(prev => [...prev, { id: newId, files: null }]);
  };
  
  // Funzione per gestire il cambio di file
  const handleFileChange = (inputId, event) => {
    const files = event.target.files;
    
    if (files && files.length > 0) {
      console.log(`File selezionato per input ${inputId}:`, files[0].name);
      
      setFileInputs(prev => prev.map(input => {
        if (input.id === inputId) {
          return { ...input, files: files };
        }
        return input;
      }));
    }
  };
  
  // Funzione per rimuovere un input file
  const removeFileInput = (inputId) => {
    setFileInputs(prev => prev.filter(input => input.id !== inputId));
  };

  // Gestire il cambio di filtro dello stato
  const handleStatusFilterChange = (e) => {
    const newFilter = e.target.value;
    setStatusFilter(newFilter);
    setPage(1);
    fetchRequests(1, newFilter);
  };
  
  // Funzione per gestire il cambio di pagina
  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchRequests(newPage, statusFilter);
  };
  
  // Funzione per renderizzare il badge dello stato
  const renderStatusBadge = (status) => {
    const statusInfo = statusLabels[status] || { label: 'Sconosciuto', color: 'secondary' };
    return (
      <span className={`badge bg-${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };
  
  // Formatta la data per la visualizzazione
  const formatDate = (dateString) => {
    if (!dateString) return 'Data non disponibile';
    
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: it });
  };

  // Formatta la data per visualizzazione relativa
  const formatRelativeDate = (dateString) => {
    if (!dateString) return 'Data non disponibile';
    
    const date = parseISO(dateString);
    const now = new Date();
    
    // Se la data è più recente di 7 giorni, mostra il tempo relativo (es. "2 giorni fa")
    if (differenceInDays(now, date) < 7) {
      return formatDistance(date, now, { addSuffix: true, locale: it });
    } 
    // Altrimenti mostra la data formattata
    else {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: it });
    }
  };

  // Elimina una richiesta
  const deleteRequest = async (requestId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Conferma della cancellazione
    if (!window.confirm('Sei sicuro di voler eliminare questa richiesta? Questa azione non può essere annullata.')) {
      return;
    }
    
    try {
      setLoading(true);
      await customRequestAdminService.deleteRequest(requestId);
      
      // Aggiorna la lista dopo l'eliminazione
      displayNotification('Richiesta eliminata con successo', 'success');
      fetchRequests(page, statusFilter);
    } catch (error) {
      console.error('Errore durante l\'eliminazione della richiesta:', error);
      displayNotification(`Errore: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Rendering principale del componente
  return (
    <div className="container mt-3">
      {totalUnread > 0 && (
        <div className={`notification-summary-banner ${unreadRequests > 0 && unreadMessages > 0 ? 'urgent' : ''} mb-3`} role="alert">
          <div className="d-flex justify-content-between align-items-center">
            <div className="notification-info">
              <div className="notification-title">
                <FontAwesomeIcon icon={faBell} className="notification-icon" /> 
                <span>Notifiche non lette</span>
              </div>
              <div className="notification-counts">
                {unreadRequests > 0 && (
                  <span className="notification-count-item">
                    <span className="notification-count-badge request">{unreadRequests}</span>
                    <span>nuove richieste</span>
                  </span>
                )}
                {unreadMessages > 0 && (
                  <span className="notification-count-item">
                    <span className="notification-count-badge message">{unreadMessages}</span>
                    <span>nuovi messaggi</span>
                  </span>
                )}
                {Object.keys(requestsWithNotifications).length > 0 && (
                  <span className="notification-count-item">
                    <span>in</span>
                    <span className="notification-count-badge">{Object.keys(requestsWithNotifications).length}</span>
                    <span>richieste</span>
                  </span>
                )}
              </div>
            </div>
            <button 
              className={`btn ${unreadRequests > 0 && unreadMessages > 0 ? 'btn-danger' : 'btn-warning'}`}
              onClick={markAllNotificationsAsRead}
            >
              <FontAwesomeIcon icon={faCheckCircle} /> Segna tutte come lette
            </button>
          </div>
        </div>
      )}

      {/* Filtri e ricerca */}
      <div className="row mb-3">
        <div className="col-md-4">
          <div className="form-group">
            <label htmlFor="statusFilter">Filtra per stato:</label>
            <select
              id="statusFilter"
              className="form-control" 
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="all">Tutti gli stati</option>
              <option value="pending">In attesa</option>
              <option value="in_progress">In lavorazione</option>
              <option value="quoted">Preventivo inviato</option>
              <option value="accepted">Approvata</option>
              <option value="rejected">Rifiutata</option>
              <option value="completed">Completata</option>
              <option value="cancelled">Annullata</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="d-flex justify-content-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
        </div>
      )}

      {!loading && requests.length === 0 && !error && (
        <div className="alert alert-info">
          Nessuna richiesta trovata. {statusFilter !== 'all' && `Prova a cambiare il filtro.`}
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Richieste Personalizzate ({requests.length})</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Titolo</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Stato</th>
                    <th className="text-center" style={{width: '120px'}}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(request => {
                    const hasNotifications = !!requestsWithNotifications[request._id];
                    const notificationData = requestsWithNotifications[request._id] || { count: 0, types: new Set() };
                    const hasNewRequests = notificationData.types && notificationData.types.has('new_request');
                    const hasNewMessages = notificationData.types && notificationData.types.has('new_message');
                    
                    let notificationType = '';
                    if (hasNewRequests && hasNewMessages) {
                      notificationType = 'mixed-notification';
                    } else if (hasNewMessages) {
                      notificationType = 'message-notification';
                    } else if (hasNewRequests) {
                      notificationType = 'request-notification';
                    }
                    
                    let notificationColor = '#ff9800';
                    if (hasNewRequests && hasNewMessages) {
                      notificationColor = '#dc3545';
                    } else if (hasNewMessages) {
                      notificationColor = '#0d6efd';
                    }
                    
                    return (
                      <tr 
                        key={request._id}
                        onClick={() => viewRequest(request._id)}
                        className={`${hasNotifications ? `has-notification ${notificationType}` : ''}`}
                        style={{
                          borderLeft: hasNotifications ? `5px solid ${notificationColor}` : 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <td className="position-relative">
                          {hasNotifications && <div className="notification-row-indicator" style={{backgroundColor: notificationColor}}></div>}
                          {request._id.substring(request._id.length - 8)}
                          {hasNotifications && (
                            <span className="notification-badge" style={{backgroundColor: notificationColor}}>
                              <FontAwesomeIcon icon={faBell} /> {notificationData.count}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="fw-bold">{request.title}</div>
                          {hasNotifications && (
                            <div className="notification-message" style={{color: notificationColor}}>
                              <FontAwesomeIcon icon={faBell} /> 
                              {hasNewRequests && hasNewMessages && 'Nuova richiesta e nuovi messaggi!'}
                              {hasNewRequests && !hasNewMessages && 'Nuova richiesta da gestire!'}
                              {!hasNewRequests && hasNewMessages && 'Nuovi messaggi da leggere!'}
                              <span className="notification-details">
                                {formatRelativeDate(new Date().toISOString())}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span>{request.user?.fullName || request.userInfo?.name || 'N/A'}</span>
                            <small className="text-muted">{request.user?.email || request.userInfo?.email || 'N/A'}</small>
                          </div>
                        </td>
                        <td>{formatDate(request.createdAt)}</td>
                        <td>{renderStatusBadge(request.status)}</td>
                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary" 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                viewRequest(request._id);
                              }}
                              title="Visualizza dettagli"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                            {hasNotifications && (
                              <button
                                className={`btn btn-sm mark-read-button ${notificationType.replace('-notification', '')}`}
                                onClick={(e) => markRequestNotificationsAsRead(request._id, e)}
                                title="Segna notifiche come lette"
                              >
                                <FontAwesomeIcon icon={faCheckCircle} />
                                {notificationData.count > 0 && <span className="badge-count">{notificationData.count}</span>}
                              </button>
                            )}
                            <button
                              className="btn btn-sm btn-outline-danger" 
                              onClick={(e) => deleteRequest(request._id, e)}
                              title="Elimina richiesta"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Paginazione */}
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                      >
                        Precedente
                      </button>
                    </li>
              
              {[...Array(totalPages).keys()].map(i => (
                <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                        <button
                          className="page-link"
                    onClick={() => handlePageChange(i + 1)}
                        >
                    {i + 1}
                        </button>
                      </li>
                    ))}
              
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                      >
                        Successivo
                      </button>
                    </li>
                  </ul>
                </nav>
            </div>
      )}

      {/* Visualizzazione a schermo intero della richiesta selezionata */}
      {selectedRequest && (
        <div className="custom-request-fullscreen">
          <div className="fullscreen-header">
            <div>
              <h3>{selectedRequest.title}</h3>
              <div className="request-metadata">
                <span className="request-id">ID: {selectedRequest._id.substring(selectedRequest._id.length - 8)}</span>
                <span className="request-date">Data: {formatDate(selectedRequest.createdAt)}</span>
                <span className="request-status">{renderStatusBadge(selectedRequest.status)}</span>
              </div>
            </div>
            <div>
              <button 
                className="btn btn-danger me-2" 
                onClick={() => {
                  if (window.confirm('Sei sicuro di voler eliminare questa richiesta? Questa azione non può essere annullata.')) {
                    deleteRequest(selectedRequest._id);
                    setSelectedRequest(null);
                  }
                }}
              >
                <FontAwesomeIcon icon={faTrash} /> Elimina Richiesta
              </button>
              <button 
                className="btn btn-outline-secondary close-fullscreen" 
                onClick={() => setSelectedRequest(null)}
              >
                <FontAwesomeIcon icon={faTimes} /> Chiudi
              </button>
            </div>
          </div>

          <div className="fullscreen-body">
            <div className="fullscreen-sidebar">
              <div className="client-info-card">
                <h4>Informazioni Cliente</h4>
                <p>
                  <strong>Nome:</strong> {selectedRequest.user?.fullName || selectedRequest.userInfo?.name || 'N/A'}
                </p>
                <p>
                  <strong>Email:</strong> {selectedRequest.user?.email || selectedRequest.userInfo?.email || 'N/A'}
                </p>
                <p>
                  <strong>Telefono:</strong> {selectedRequest.user?.phoneNumber || selectedRequest.userInfo?.phone || 'N/A'}
                </p>
              </div>
              
              <div className="status-update-card">
                <h4>Aggiorna Stato</h4>
                <select
                  className="form-control mb-2" 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">Seleziona stato...</option>
                  <option value="pending">In attesa</option>
                  <option value="in_progress">In lavorazione</option>
                  <option value="quoted">Preventivo inviato</option>
                  <option value="accepted">Approvata</option>
                  <option value="rejected">Rifiutata</option>
                  <option value="completed">Completata</option>
                  <option value="cancelled">Annullata</option>
                </select>
                        <button
                  className="btn btn-primary w-100" 
                  onClick={() => updateRequestStatus(selectedRequest._id, newStatus)}
                  disabled={!newStatus}
                >
                  <FontAwesomeIcon icon={faTasks} /> Aggiorna Stato
                        </button>
              </div>
              
              <div className="admin-notes-card">
                <h4>Note Admin</h4>
                
                {/* Visualizza le note salvate */}
                {adminNotesList.length > 0 && (
                  <div className="saved-notes mb-3">
                    <h5>Note salvate:</h5>
                    <div className="saved-notes-list">
                      {adminNotesList.map((note, index) => (
                        <div key={index} className="saved-note-item p-2 bg-light rounded mb-2 position-relative">
                          <button 
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                            onClick={() => deleteNote(selectedRequest._id, index)}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                          <div className="saved-note-content">
                            {note}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <textarea 
                  className="form-control mb-2"
                  rows="5"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Inserisci note amministrative..."
                ></textarea>
                        <button
                  className="btn btn-outline-primary w-100" 
                  onClick={() => saveAdminNotes(selectedRequest._id)}
                >
                  <FontAwesomeIcon icon={faPen} /> Salva Note
                        </button>
              </div>
            </div>
            
            <div className="fullscreen-main">
              <div className="main-tabs">
                        <button
                  className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  <FontAwesomeIcon icon={faEye} /> Dettagli
                        </button>
                        <button
                  className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`}
                  onClick={() => setActiveTab('messages')}
                >
                  <FontAwesomeIcon icon={faComments} /> Messaggi
                        </button>
                        <button
                  className={`tab-button ${activeTab === 'quote' ? 'active' : ''}`}
                  onClick={() => setActiveTab('quote')}
                >
                  <FontAwesomeIcon icon={faTag} /> Preventivo
                        </button>
              </div>

              <div className="tab-content">
                      {/* Tab Dettagli */}
                      <div
                  className="tab-panel" 
                  style={activeTab === 'details' ? {display: 'block'} : {display: 'none'}}
                >
                  <div className="request-details-card">
                    <h4>Descrizione richiesta</h4>
                    <div className="details-content">
                      {selectedRequest.description || 'Nessuna descrizione disponibile.'}
                          </div>
                        </div>

                        {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                    <div className="attachments-container">
                      <h3>Allegati</h3>
                      <div className="attachments-list">
                        {selectedRequest.attachments.map((attachment, index) => (
                          <div key={index} className="attachment-item">
                            {renderAttachment(attachment)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRequest.product && (
                    <div className="product-reference-card">
                      <h4>Prodotto di riferimento</h4>
                      <div className="product-info">
                        <div className="product-image">
                          <img 
                            src={selectedRequest.product.images?.[0] || 'https://via.placeholder.com/150'}
                            alt={selectedRequest.product.name}
                          />
                          </div>
                        <div className="product-details">
                          <h5>{selectedRequest.product.name}</h5>
                          <p className="product-price">€{selectedRequest.product.price?.toFixed(2) || '0.00'}</p>
                          <p className="product-description">{selectedRequest.product.description?.substring(0, 100) || 'Nessuna descrizione'}{selectedRequest.product.description?.length > 100 ? '...' : ''}</p>
                        </div>
                      </div>
                    </div>
                  )}
                      </div>

                {/* Tab Messaggi */}
                <div 
                  className="tab-panel" 
                  style={activeTab === 'messages' ? {display: 'block'} : {display: 'none'}}
                >
                  <div className="messages-container">
                    {selectedRequest.conversation && selectedRequest.conversation.length > 0 ? (
                            <div className="messages-list">
                        {selectedRequest.conversation.map((message, index) => (
                                <div
                                  key={index}
                            className={`message ${message.sender === 'admin' ? 'admin-message' : 'user-message'}`}
                                >
                                  <div className={`message-header ${message.sender}`}>
                                    <div className="message-sender">
                                      {message.sender === 'admin' ? 'Admin' : (selectedRequest.userInfo?.name || selectedRequest.user?.fullName || selectedRequest.user?.name || 'Cliente')}
                                    </div>
                                    <span className="date">{formatDate(message.timestamp)}</span>
                                  </div>
                            <div className="message-body">
                              {message.message}
                                  </div>
                                  {message.attachments && message.attachments.length > 0 && (
                                    <div className="message-attachments">
                                <div className="attachments-header">Allegati:</div>
                                <div className="attachments-grid">
                                  {message.attachments.map((attachment, idx) => (
                                    <div key={idx} className="attachment-item">
                                            {renderAttachment(attachment)}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                      <div className="no-messages">
                            <p>Nessun messaggio disponibile.</p>
                      </div>
                          )}

                    <div className="message-form">
                      <h4>Invia un messaggio</h4>
                            <div className="form-group">
                              <textarea 
                                className="form-control"
                          rows="4" 
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Scrivi un messaggio..."
                        ></textarea>
                            </div>

                      <div className="file-uploads">
                              {fileInputs.map((input) => (
                          <div key={input.id} className="file-input-container">
                                  <input
                                    type="file"
                              id={`file-${input.id}`}
                              className="form-control"
                                    onChange={(e) => handleFileChange(input.id, e)}
                                  />
                                  <button 
                                    type="button" 
                              className="btn btn-danger btn-sm remove-file"
                                    onClick={() => removeFileInput(input.id)}
                                    title="Rimuovi allegato"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </div>
                              ))}
                              
                              {fileInputs.length < 3 && (
                                <button 
                                  type="button"
                            className="btn btn-outline-primary add-file"
                                  onClick={addFileInput}
                                >
                            <FontAwesomeIcon icon={faPaperclip} /> Aggiungi allegato
                                </button>
                              )}
                            </div>

                            <button
                        className="btn btn-primary send-message"
                              onClick={() => sendMessage(selectedRequest._id)}
                        disabled={!messageText.trim() && fileInputs.every(input => !input.files || input.files.length === 0)}
                      >
                        <FontAwesomeIcon icon={faPaperPlane} /> Invia messaggio
                            </button>
                          </div>
                        </div>
                      </div>

                {/* Tab Preventivo */}
                <div 
                  className="tab-panel" 
                  style={activeTab === 'quote' ? {display: 'block'} : {display: 'none'}}
                >
                  {selectedRequest.quote ? (
                    <div className="quote-details-card">
                      <h4>Preventivo inviato</h4>
                      <div className="quote-info">
                        <div className="quote-status">
                          Stato: {
                            selectedRequest.quote.status === 'accepted' ? 
                              <span className="badge bg-success">Accettato</span> : 
                            selectedRequest.quote.status === 'rejected' ? 
                              <span className="badge bg-danger">Rifiutato</span> : 
                              <span className="badge bg-warning">In attesa</span>
                          }
                          </div>
                          
                        <div className="quote-fields">
                          <div className="quote-field">
                            <label>Importo:</label>
                            <span className="quote-amount">€{selectedRequest.quote.amount.toFixed(2)}</span>
                          </div>
                          
                          <div className="quote-field">
                            <label>Valido fino al:</label>
                            <span>{formatDate(selectedRequest.quote.validUntil)}</span>
                          </div>
                          
                          <div className="quote-field full-width">
                            <label>Descrizione:</label>
                            <div className="quote-description">
                              {selectedRequest.quote.description}
                                      </div>
                                    </div>
                                  </div>
                              </div>
                            </div>
                          ) : (
                    <div className="quote-form-card">
                      <h4>Invia un preventivo</h4>
                      <div className="quote-form">
                        <div className="form-group">
                          <label htmlFor="quoteAmount">Importo (€):</label>
                          <input
                            type="number"
                            id="quoteAmount"
                            className="form-control"
                            value={quoteAmount}
                            onChange={(e) => setQuoteAmount(e.target.value)}
                            min="0"
                            step="0.01"
                            required
                          />
                      </div>

                        <div className="form-group">
                          <label htmlFor="quoteValidUntil">Validità fino a:</label>
                          <input
                            type="date"
                            id="quoteValidUntil"
                            className="form-control"
                            value={quoteValidUntil}
                            onChange={(e) => setQuoteValidUntil(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                      </div>

                        <div className="form-group">
                          <label htmlFor="quoteDescription">Descrizione:</label>
                          <textarea
                            id="quoteDescription"
                            className="form-control"
                            rows="6"
                            value={quoteDescription}
                            onChange={(e) => setQuoteDescription(e.target.value)}
                            placeholder="Descrivi il preventivo e i dettagli del lavoro..."
                            required
                          ></textarea>
                        </div>
                        
                          <button
                            className="btn btn-primary"
                          onClick={() => sendQuote(selectedRequest._id)}
                          disabled={!quoteAmount || !quoteValidUntil || !quoteDescription}
                          >
                          <FontAwesomeIcon icon={faPaperPlane} /> Invia preventivo
                          </button>
                        </div>
                      </div>
                  )}
                    </div>
                  </div>
                    </div>
                  </div>
                </div>
              )}
    </div>
  );
};

export default CustomRequestsList;
