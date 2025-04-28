import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { customRequestService } from '../../services/api';
import notificationService from '../../services/notificationService';
import { toast, Toaster } from 'react-hot-toast';
import '../../styles/custom-requests.css';

// Componenti
import RequestsList from './RequestsList';
import RequestDetail from './RequestDetail';
import NotificationBadge from './NotificationBadge';

const CustomRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  const [processingMessage, setProcessingMessage] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [hasNotifications, setHasNotifications] = useState(false);
  
  // Riferimenti per tenere traccia delle richieste in corso
  const isFetchingRequests = useRef(false);
  const isFetchingNotifications = useRef(false);
  
  const location = useLocation();
  
  // Funzione per mostrare notifiche
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type, visible: true });
    
    // Nascondi la notifica dopo 3 secondi
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);
  
  // Funzione per controllare le notifiche
  const checkNotifications = useCallback(async (force = false) => {
    // Evita chiamate ripetute se una richiesta è già in corso
    if (isFetchingNotifications.current && !force) {
      console.log('Controllo notifiche già in corso, chiamata ignorata');
      return;
    }
    
    isFetchingNotifications.current = true;
    
    try {
      console.log('Controllo notifiche iniziato...');
      const response = await notificationService.getUnreadNotifications();
      
      if (response.notifications && response.byType.new_request) {
        // Filtriamo solo le notifiche relative alle richieste
        const requestNotifications = response.byType.new_request;
        
        // Aggiorna lo stato solo se ci sono nuove notifiche
        if (requestNotifications.length > 0) {
          setHasNotifications(true);
          setUnreadNotifications(requestNotifications.length);
          console.log('Nuove notifiche di richieste trovate:', requestNotifications);
        } else {
          setUnreadNotifications(0);
          setHasNotifications(false);
        }
      } else {
        setUnreadNotifications(0);
        setHasNotifications(false);
      }
    } catch (error) {
      console.error('Errore nel controllo delle notifiche:', error);
    } finally {
      isFetchingNotifications.current = false;
      console.log('Controllo notifiche completato');
    }
  }, []);
  
  // Recupero delle richieste dell'utente
  const fetchRequests = useCallback(async (force = false) => {
    // Evita chiamate ripetute se una richiesta è già in corso
    if (isFetchingRequests.current && !force) {
      console.log('Recupero richieste già in corso, chiamata ignorata');
      return;
    }
    
    isFetchingRequests.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log('Recupero richieste utente iniziato...');
      const response = await customRequestService.getAll();
      console.log('Richieste utente:', response.data);
      // Trasformiamo i dati per assicurarci che siano nel formato corretto
      const formattedRequests = response.data.map(req => ({
        ...req,
        // Assicuriamoci che i campi siano presenti anche se cambiano i nomi
        details: req.description || req.details || '',
        description: req.description || req.details || '',
        // Assicuriamoci che lo stato sia sempre presente
        status: req.status || 'pending'
      }));
      console.log('Richieste formattate:', formattedRequests);
      setRequests(formattedRequests);
    } catch (err) {
      console.error('Errore nel recupero delle richieste:', err);
      setError('Errore nel caricamento delle richieste: ' + 
        (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      isFetchingRequests.current = false;
      console.log('Recupero richieste utente completato');
    }
  }, []);
  
  // Recupero dettaglio di una richiesta
  const fetchRequestDetail = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Recupero dettagli richiesta: ${requestId}`);
      const response = await customRequestService.getById(requestId);
      console.log('Dettaglio richiesta:', response.data);
      
      // Recupera la timeline della richiesta
      const timelineResponse = await customRequestService.getTimeline(requestId);
      console.log('Timeline richiesta:', timelineResponse.data);
      
      // Assicurati che tutti i campi necessari siano presenti, anche vuoti se mancano
      const requestData = {
        ...response.data,
        // Gestisci correttamente sia user che userId
        userId: response.data.userId || response.data.user,
        user: response.data.user || response.data.userId,
        // Assicurati che i campi siano presenti
        details: response.data.details || response.data.description || '',
        description: response.data.description || response.data.details || '',
        // Altri campi di default
        status: response.data.status || 'pending',
        conversation: response.data.conversation || [],
        messages: response.data.messages || [],
        materials: response.data.materials || {},
        attachments: response.data.attachments || [],
        // Aggiungi la timeline
        timeline: timelineResponse.data.timeline || []
      };
      
      console.log('Dati richiesta normalizzati:', requestData);
      setSelectedRequest(requestData);
      
      // Segna le notifiche relative a questa richiesta come lette
      try {
        await notificationService.markRequestNotificationsAsRead(requestId);
        console.log(`Notifiche per la richiesta ${requestId} segnate come lette`);
        // Aggiorna il conteggio delle notifiche
        checkNotifications(true);
      } catch (notifError) {
        console.error('Errore nel segnare le notifiche come lette:', notifError);
      }
    } catch (err) {
      console.error('Errore nel recupero dei dettagli della richiesta:', err);
      setError('Errore nel caricamento dei dettagli: ' + 
        (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [checkNotifications]);
  
  // Invio di un nuovo messaggio
  const sendMessage = async (formData) => {
    if (!selectedRequest) return;
    
    setLoading(true);
    setProcessingMessage(true);
    
    try {
      console.log('Invio messaggio per la richiesta:', selectedRequest._id);
      await customRequestService.addMessage(selectedRequest._id, formData);
      console.log('Messaggio inviato con successo');
      
      // Ricarichiamo i dettagli della richiesta
      await fetchRequestDetail(selectedRequest._id);
      toast.success('Messaggio inviato con successo');
    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error);
      console.error('Dettagli errore:', error.response?.data || error.message);
      toast.error(`Errore nell'invio del messaggio: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
      setProcessingMessage(false);
    }
  };
  
  // Chiude la vista dettaglio
  const closeRequestDetail = () => {
    setSelectedRequest(null);
  };
  
  /**
   * Segna le notifiche delle richieste come lette
   */
  const markRequestNotificationsAsRead = async () => {
    try {
      setLoading(true);
      await notificationService.markNotificationsAsRead('requests');
      setHasNotifications(false);
      console.log('Notifiche delle richieste segnate come lette');
    } catch (error) {
      console.error('Errore nel segnare le notifiche come lette:', error);
      toast.error('Impossibile segnare le notifiche come lette');
    } finally {
      setLoading(false);
    }
  };
  
  // Accetta un preventivo
  const acceptQuote = async () => {
    if (!selectedRequest || !selectedRequest.quote) return;
    
    try {
      setLoading(true);
      
      // Chiamata API per accettare il preventivo
      const response = await customRequestService.acceptQuote(selectedRequest._id);
      console.log('Risposta accettazione preventivo:', response);
      
      // Aggiorna la richiesta selezionata con i dati aggiornati
      if (response && response.data) {
        setSelectedRequest(response.data);
      } else {
        // Se non riceviamo i dati aggiornati, ricarica la richiesta
        await fetchRequestDetail(selectedRequest._id);
      }
      
      showNotification('Preventivo accettato con successo', 'success');
    } catch (err) {
      console.error('Errore nell\'accettazione del preventivo:', err);
      showNotification('Errore: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Rifiuta un preventivo
  const rejectQuote = async () => {
    if (!selectedRequest || !selectedRequest.quote) return;
    
    try {
      setLoading(true);
      
      // Chiamata API per rifiutare il preventivo
      const response = await customRequestService.rejectQuote(selectedRequest._id);
      console.log('Risposta rifiuto preventivo:', response);
      
      // Aggiorna la richiesta selezionata con i dati aggiornati
      if (response && response.data) {
        setSelectedRequest(response.data);
      } else {
        // Se non riceviamo i dati aggiornati, ricarica la richiesta
        await fetchRequestDetail(selectedRequest._id);
      }
      
      showNotification('Preventivo rifiutato', 'warning');
    } catch (err) {
      console.error('Errore nel rifiuto del preventivo:', err);
      showNotification('Errore: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Carica le richieste e controlla le notifiche al montaggio del componente
  useEffect(() => {
    // Esegue le chiamate iniziali
    fetchRequests(true);
    checkNotifications(true);
    
    // Verifica se c'è un ID di richiesta da aprire passato tramite state
    if (location.state?.openRequestId) {
      console.log('Apertura richiesta con ID:', location.state.openRequestId);
      fetchRequestDetail(location.state.openRequestId);
    }
    
    // Crea un unico intervallo di polling per entrambe le operazioni
    const pollingInterval = setInterval(() => {
      // Se nessuna richiesta è selezionata, aggiorna l'elenco
      if (!selectedRequest) {
        fetchRequests();
      }
      
      // Controlla sempre le notifiche
      checkNotifications();
    }, 60000); // Aumentiamo l'intervallo a 60 secondi per ridurre le chiamate
    
    return () => {
      // Pulizia dell'intervallo quando il componente viene smontato
      clearInterval(pollingInterval);
    };
  }, [location.state, fetchRequests, fetchRequestDetail, checkNotifications, selectedRequest]);
  
  return (
    <div className="custom-requests-page">
      <Toaster position="top-right" />
      
      {notification.visible && (
        <div className={`notification notification-${notification.type}`}>
          <span>{notification.message}</span>
          <button 
            className="close-notification" 
            onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      <div className="container py-5">
        {error ? (
          <div className="error-container">
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchRequests}>
              Riprova
            </button>
          </div>
        ) : selectedRequest ? (
          <RequestDetail 
            request={selectedRequest}
            onClose={closeRequestDetail}
            onSendMessage={sendMessage}
            processingMessage={processingMessage}
            onAcceptQuote={acceptQuote}
            onRejectQuote={rejectQuote}
            loading={loading}
          />
        ) : (
          <>
            <div className="requests-header-with-notifications">
              <h1 className="mb-4">Le Mie Richieste Personalizzate</h1>
              <NotificationBadge count={unreadNotifications} />
            </div>
            <RequestsList 
              requests={requests} 
              loading={loading} 
              onViewRequest={fetchRequestDetail} 
              onReload={fetchRequests}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CustomRequests;