import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, ListGroup, Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faEnvelope, 
  faShoppingCart, 
  faFileAlt, 
  faCheckDouble
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import './NotificationCenter.css'; // Aggiungeremo questo file CSS
import { toast } from 'react-hot-toast';

/**
 * Componente che mostra un centro notifiche completo
 */
const NotificationCenter = () => {
  // Stati del componente
  const [show, setShow] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsByType, setNotificationsByType] = useState({
    new_message: 0,
    new_order: 0,
    new_request: 0
  });
  
  // Usiamo useRef per memorizzare i valori senza causare re-render
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const notificationsRef = useRef([]);
  
  // Hook per la navigazione
  const navigate = useNavigate();

  // Carica tutte le notifiche
  const loadNotifications = useCallback(async () => {
    // Usa il ref per il controllo del caricamento invece dello stato
    // per evitare cicli di render
    if (loadingRef.current) {
      console.log('Caricamento già in corso, ignorato');
      return;
    }
    
    // Previeni richieste troppo frequenti (minimo 2 secondi tra le richieste)
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 2000 && notificationsRef.current.length > 0) {
      console.log('Richiesta troppo recente, ignorata');
      return;
    }
    
    // Aggiorni il ref di loading e lo stato
    loadingRef.current = true;
    setLoading(true);
    
    try {
      console.log('Caricamento notifiche...');
      const data = await notificationService.getAll();
      
      // Aggiorna solo se i dati sono diversi dai precedenti
      // o se è la prima volta che li carichiamo
      if (notificationsRef.current.length === 0 || 
          JSON.stringify(data) !== JSON.stringify(notificationsRef.current)) {
        
        notificationsRef.current = data;
        setNotifications(data);
        
        // Raggruppa le notifiche per tipo
        const byType = {
          new_message: 0,
          new_order: 0,
          new_request: 0
        };
        
        // Conta le notifiche non lette per tipo
        data.forEach(notification => {
          if (!notification.read && byType[notification.type] !== undefined) {
            byType[notification.type]++;
          }
        });
        
        setNotificationsByType(byType);
        console.log('Notifiche caricate:', data.length, 'Conteggi per tipo:', byType);
      } else {
        console.log('I dati sono invariati, nessun aggiornamento necessario');
      }
      
      // Aggiorna il timestamp dell'ultimo caricamento
      lastLoadTimeRef.current = Date.now();
    } catch (error) {
      console.error('Errore nel caricamento delle notifiche:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []); // Nessuna dipendenza per evitare cicli infiniti

  // Effetto per caricare le notifiche quando si apre il centro
  useEffect(() => {
    if (show && !loadingRef.current) {
      loadNotifications();
    }
  }, [show, loadNotifications]);

  // Effetto per aggiornare il conteggio totale delle notifiche
  useEffect(() => {
    const updateCount = (data) => {
      if (data && typeof data === 'object') {
        setUnreadCount(data.total || 0);
        console.log("NotificationCenter: unreadCount aggiornato a", data.total || 0);
      }
    };

    const removeListener = notificationService.addListener(updateCount);
    
    // Imposta il conteggio iniziale usando il valore già in memoria
    const initialCount = notificationService.getUnreadCount() || 0;
    setUnreadCount(initialCount);
    console.log("NotificationCenter: unreadCount iniziale", initialCount);
    
    return () => removeListener();
  }, []);

  // Effetto per aggiornare il conteggio quando si apre il modale
  useEffect(() => {
    if (show) {
      // Forza un aggiornamento dei conteggi quando si apre il modale
      console.log('Apertura modale, aggiornamento conteggi notifiche');
      
      // Aggiorna i conteggi delle notifiche
      notificationService.fetchUnreadCounts().then(counts => {
        console.log('Conteggi aggiornati dopo apertura modale:', counts);
        
        // Aggiorna il conteggio totale
        if (counts && typeof counts === 'object') {
          setUnreadCount(counts.total || 0);
        }
      }).catch(error => {
        console.error('Errore durante l\'aggiornamento dei conteggi:', error);
      });
      
      // Carica anche le notifiche
      loadNotifications();
    }
  }, [show, loadNotifications]);

  // Gestisce il click sulla campanellina
  const handleBellClick = useCallback(() => {
    // Se il modal è già aperto, non fare nulla
    if (show) {
      return;
    }
    
    // Se c'è stato un click recente, ignora
    if (Date.now() - lastLoadTimeRef.current < 1000) {
      console.log('Click multipli ignorati (debounce)');
      return;
    }
    
    // Se non ci sono notifiche non lette o è in caricamento, apri comunque il modale
    // ma non forzare un caricamento
    if (loadingRef.current) {
      console.log('Apertura modale durante caricamento');
      setShow(true);
      return;
    }
    
    // Altrimenti, mostra il modale e aggiorna
    console.log('Apertura modale e caricamento notifiche');
    setShow(true);
  }, [show]);
  
  // Gestisce la chiusura del modale
  const handleCloseModal = () => {
    setShow(false);
  };

  // Gestisce il click su una notifica
  const handleNotificationClick = async (notification) => {
    try {
      // Segna la notifica come letta
      await notificationService.markAsRead(notification._id);
      
      // Aggiorna lo stato locale
      setNotifications(prev => 
        prev.map(item => 
          item._id === notification._id 
            ? { ...item, read: true } 
            : item
        )
      );
      
      // Aggiorna i conteggi per tipo
      if (notificationsByType[notification.type] > 0) {
        setNotificationsByType(prev => ({
          ...prev,
          [notification.type]: Math.max(0, prev[notification.type] - 1)
        }));
      }
      
      // Aggiorna il conteggio totale
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Forza l'aggiornamento dei conteggi generali
      notificationService.fetchUnreadCounts();
      
      // Chiudi il centro notifiche
      setShow(false);
      
      // Naviga alla destinazione appropriata
      switch (notification.type) {
        case 'new_message':
          navigate('/admin/contacts');
          break;
        case 'new_order':
          navigate('/admin/orders');
          break;
        case 'new_request':
          navigate('/admin/custom-requests');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Errore durante la gestione della notifica:', error);
    }
  };

  // Ottiene l'icona appropriata per il tipo di notifica
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_message':
        return <FontAwesomeIcon icon={faEnvelope} className="text-primary notification-icon" />;
      case 'new_order':
        return <FontAwesomeIcon icon={faShoppingCart} className="text-success notification-icon" />;
      case 'new_request':
        return <FontAwesomeIcon icon={faFileAlt} className="text-info notification-icon" />;
      default:
        return <FontAwesomeIcon icon={faBell} className="notification-icon" />;
    }
  };

  // Formatta la data in modo relativo
  const formatDate = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true, 
        locale: it 
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <>
      {/* Pulsante per aprire il centro notifiche */}
      <div className="position-relative d-inline-block">
        <Button 
          variant="link" 
          className="notification-bell-button" 
          onClick={handleBellClick}
          style={{ fontSize: '1.2rem', padding: '8px' }}
        >
          <FontAwesomeIcon 
            icon={faBell} 
            size="lg"
            className={unreadCount > 0 ? 'notification-bell-active' : ''}
          />
        </Button>
        
        {/* Badge delle notifiche */}
        {unreadCount > 0 && (
          <div 
            className="notification-count-badge"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              transform: 'translate(25%, -25%)',
              minWidth: '18px',
              height: '18px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: '#ff3b30',
              color: 'white',
              borderRadius: '50%',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              zIndex: 1000,
              animation: 'pulse 1.5s infinite'
            }}
          >
            {unreadCount <= 99 ? unreadCount : '99+'}
          </div>
        )}
      </div>

      {/* Modal del centro notifiche */}
      <Modal show={show} onHide={handleCloseModal} className="notification-modal">
        <Modal.Header closeButton>
          <div className="d-flex justify-content-between align-items-center w-100">
            <Modal.Title>
              <FontAwesomeIcon icon={faBell} className="me-2" /> Notifiche
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className="p-0">
          {loading ? (
            <div className="text-center py-4 notification-loading">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Caricamento...</span>
              </div>
              <p className="mt-2">Caricamento notifiche...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4 notification-empty">
              <FontAwesomeIcon icon={faBell} size="2x" className="text-muted mb-2" />
              <p>Non hai nuove notifiche</p>
            </div>
          ) : (
            <ListGroup variant="flush" className="notification-list">
              {notifications.map(notification => (
                <ListGroup.Item 
                  key={notification._id}
                  action
                  onClick={() => handleNotificationClick(notification)}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                >
                  <div className="d-flex align-items-start">
                    <div className="me-3 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 notification-title">{notification.title}</h6>
                      <p className="mb-1 text-muted notification-message">{notification.message}</p>
                      <small className="text-muted notification-time">
                        {formatDate(notification.createdAt)}
                      </small>
                    </div>
                    {!notification.read && (
                      <Badge bg="primary" pill className="ms-2 unread-badge">Nuovo</Badge>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default NotificationCenter; 