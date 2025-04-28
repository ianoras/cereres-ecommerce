import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faSpinner, 
  faSearch, 
  faFilter, 
  faSort, 
  faExclamationTriangle, 
  faCheck, 
  faTruck, 
  faTimes, 
  faTrash 
} from '@fortawesome/free-solid-svg-icons';
import orderService from '../../services/order.service';
import notificationService from '../../services/notificationService';
import toast from 'react-hot-toast';
import '../../styles/admin/orders-list.css';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [processingAction, setProcessingAction] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  
  // Stato per filtri e paginazione
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    sortField: 'createdAt',
    sortDirection: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });

  // Carica gli ordini all'avvio del componente
  useEffect(() => {
    fetchOrders();
  }, [filters, pagination.currentPage]);

  // Aggiorna le notifiche ogni 5 secondi per assicurarsi che i badge siano aggiornati
  useEffect(() => {
    const refreshNotifications = async () => {
      try {
        // Forza un aggiornamento delle notifiche attraverso il servizio
        await notificationService.fetchUnreadCounts();
        
        // Se esiste la funzione globale, usala per aggiornare l'interfaccia
        if (typeof window.updateNotificationCounts === 'function') {
          await window.updateNotificationCounts();
        }
      } catch (error) {
        console.error('Errore durante l\'aggiornamento delle notifiche:', error);
      }
    };
    
    // Esegui immediatamente e poi ogni 5 secondi
    refreshNotifications();
    const intervalId = setInterval(refreshNotifications, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Funzione per forzare l'aggiornamento delle notifiche
  const forceUpdateNotifications = async () => {
    try {
      setProcessingAction(true);
      
      // Aggiorna le notifiche
      await notificationService.fetchUnreadCounts();
      
      // Aggiorna l'interfaccia se esiste la funzione window.updateNotificationCounts
      if (typeof window.updateNotificationCounts === 'function') {
        window.updateNotificationCounts();
        toast.success('Notifiche aggiornate con successo');
      } else {
        toast.warning('Funzione di aggiornamento notifiche non disponibile');
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento delle notifiche:', error);
      toast.error('Errore durante l\'aggiornamento delle notifiche');
    } finally {
      setProcessingAction(false);
    }
  };

  // Funzione per caricare gli ordini
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        status: filters.status,
        search: filters.search,
        sort: filters.sortField,
        direction: filters.sortDirection
      };
      
      const response = await orderService.getAllOrders(params);
      
      if (response && response.orders) {
        setOrders(response.orders);
        setPagination({
          ...pagination,
          totalPages: response.totalPages || 1,
          totalItems: response.total || 0
        });
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Errore nel caricamento degli ordini:', err);
      setError('Si è verificato un errore nel caricamento degli ordini. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Funzione per visualizzare i dettagli di un ordine
  const viewOrderDetails = async (orderId) => {
    try {
      setLoading(true);
      const orderData = await orderService.getOrderDetails(orderId);
      setSelectedOrder(orderData);
      
      // Carica anche la cronologia dell'ordine
      const historyData = await orderService.getOrderHistory(orderId);
      setOrderHistory(historyData.events || []);
      
      setShowDetails(true);
    } catch (err) {
      console.error('Errore nel caricamento dei dettagli dell\'ordine:', err);
      setError('Impossibile caricare i dettagli dell\'ordine.');
    } finally {
      setLoading(false);
    }
  };

  // Funzione per chiudere i dettagli dell'ordine
  const closeOrderDetails = () => {
    setShowDetails(false);
    setSelectedOrder(null);
    setOrderHistory([]);
    setStatusNote('');
  };

  // Funzione per aggiornare lo stato di un ordine
  const updateOrderStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Sei sicuro di voler aggiornare lo stato dell'ordine a "${newStatus}"?`)) {
      return;
    }
    
    setProcessingAction(true);
    try {
      await orderService.updateOrderStatus(orderId, newStatus, statusNote);
      
      // Aggiorna i dettagli dell'ordine
      const updatedOrder = await orderService.getOrderDetails(orderId);
      setSelectedOrder(updatedOrder);
      
      // Aggiorna la cronologia
      const historyData = await orderService.getOrderHistory(orderId);
      setOrderHistory(historyData.events || []);
      
      // Aggiorna la lista degli ordini
      const updatedOrders = orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      
      // Resetta il campo note
      setStatusNote('');
      
      alert(`Stato dell'ordine aggiornato con successo a "${newStatus}".`);
    } catch (err) {
      console.error('Errore nell\'aggiornamento dello stato dell\'ordine:', err);
      alert(`Errore nell'aggiornamento dello stato dell'ordine: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Funzione per gestire il cambio pagina
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({ ...pagination, currentPage: newPage });
  };

  // Funzione per gestire il cambio filtro
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    
    // Resetta alla prima pagina quando si cambia un filtro
    setPagination({ ...pagination, currentPage: 1 });
  };

  // Funzione per gestire la ricerca
  const handleSearch = (e) => {
    e.preventDefault();
    // Reset alla prima pagina quando si effettua una ricerca
    setPagination({ ...pagination, currentPage: 1 });
    fetchOrders();
  };

  // Funzione per cambiare l'ordinamento
  const handleSort = (field) => {
    const direction = field === filters.sortField && filters.sortDirection === 'asc' ? 'desc' : 'asc';
    setFilters({ 
      ...filters, 
      sortField: field, 
      sortDirection: direction 
    });
  };

  // Funzione per formattare la data
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
  };

  // Funzione per formattare il prezzo
  const formatPrice = (price) => {
    return `€${parseFloat(price).toFixed(2)}`;
  };

  // Funzione per generare la classe CSS dello stato dell'ordine
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'completed':
      case 'delivered':
      case 'completato':
      case 'consegnato':
        return 'status-delivered';
      case 'shipped':
      case 'spedito':
        return 'status-shipped';
      case 'processing':
      case 'in elaborazione':
      case 'in lavorazione':
        return 'status-processing';
      case 'cancelled':
      case 'annullato':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  };

  // Funzione per tradurre lo stato in italiano
  const translateStatus = (status) => {
    switch(status.toLowerCase()) {
      case 'processing':
        return 'In elaborazione';
      case 'shipped':
        return 'Spedito';
      case 'delivered':
        return 'Consegnato';
      case 'cancelled':
        return 'Annullato';
      case 'completed':
        return 'Completato';
      default:
        return status;
    }
  };

  // Funzione per eliminare un ordine
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo ordine? Questa azione non può essere annullata.')) {
      return;
    }
    
    setProcessingAction(true);
    try {
      // Tentativo di eliminazione ordine
      toast.loading('Tentativo di eliminazione ordine in corso...');
      await orderService.deleteOrder(orderId);
      toast.success('Ordine eliminato con successo');
      closeOrderDetails();
      fetchOrders(); // Aggiorna la lista degli ordini
    } catch (error) {
      console.error('Errore durante l\'eliminazione dell\'ordine:', error);
      
      // Messaggio di errore specifico per API mancante
      if (error.response && error.response.status === 404) {
        toast.error('La funzione di eliminazione ordini non è disponibile. Contattare l\'amministratore di sistema.');
      } else {
        toast.error(error.response?.data?.message || 'Errore durante l\'eliminazione dell\'ordine');
      }
    } finally {
      setProcessingAction(false);
      toast.dismiss(); // Rimuove il toast di caricamento
    }
  };

  // Segna le notifiche degli ordini come lette
  const markOrderNotificationsAsRead = async (e) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      setProcessingAction(true);
      await notificationService.markNotificationsAsRead('new_order');
      // Aggiorna il conteggio delle notifiche non lette
      if (typeof window.updateNotificationCounts === 'function') {
        window.updateNotificationCounts();
      }
      toast.success('Notifiche ordini segnate come lette');
    } catch (error) {
      console.error('Errore durante la lettura delle notifiche:', error);
      toast.error('Impossibile segnare le notifiche come lette');
    } finally {
      setProcessingAction(false);
    }
  };

  // Renderizza il contenuto principale
  const renderContent = () => {
    if (loading && !orders.length) {
      return (
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Caricamento ordini...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
          <p>{error}</p>
          <button onClick={fetchOrders} className="retry-btn">Riprova</button>
        </div>
      );
    }

    // Componente di debug delle notifiche
    const NotificationsDebug = () => {
      // Ottieni i valori correnti dal servizio di notifiche
      const [debugInfo, setDebugInfo] = useState({
        orders: notificationService.getUnreadCount('orders'),
        messages: notificationService.getUnreadCount('messages'),
        requests: notificationService.getUnreadCount('requests')
      });
      
      // Aggiorna i valori di debug ogni secondo
      useEffect(() => {
        const interval = setInterval(() => {
          setDebugInfo({
            orders: notificationService.getUnreadCount('orders'),
            messages: notificationService.getUnreadCount('messages'),
            requests: notificationService.getUnreadCount('requests')
          });
        }, 1000);
        
        return () => clearInterval(interval);
      }, []);
      
      return (
        <div className="notifications-debug" style={{ 
          background: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <h4 style={{ marginTop: 0 }}>Debug Notifiche</h4>
          <div>Ordini: <strong>{debugInfo.orders}</strong></div>
          <div>Messaggi: <strong>{debugInfo.messages}</strong></div>
          <div>Richieste: <strong>{debugInfo.requests}</strong></div>
          <button 
            onClick={forceUpdateNotifications}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              marginTop: '10px',
              cursor: 'pointer'
            }}
            disabled={processingAction}
          >
            {processingAction ? 'Aggiornamento...' : 'Forza aggiornamento notifiche'}
          </button>
        </div>
      );
    };

    if (!orders.length) {
      return (
        <div>
          <NotificationsDebug />
          <div className="empty-orders">
            <h3>Nessun ordine trovato</h3>
            <p>Non ci sono ordini corrispondenti ai criteri di ricerca.</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <NotificationsDebug />
        <div className="orders-list-container">
          <div className="orders-table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('orderNumber')}>
                    ID Ordine 
                    {filters.sortField === 'orderNumber' && (
                      <FontAwesomeIcon icon={faSort} className={filters.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'} />
                    )}
                  </th>
                  <th onClick={() => handleSort('user.username')}>
                    Cliente
                    {filters.sortField === 'user.username' && (
                      <FontAwesomeIcon icon={faSort} className={filters.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'} />
                    )}
                  </th>
                  <th onClick={() => handleSort('createdAt')}>
                    Data
                    {filters.sortField === 'createdAt' && (
                      <FontAwesomeIcon icon={faSort} className={filters.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'} />
                    )}
                  </th>
                  <th onClick={() => handleSort('totalAmount')}>
                    Totale
                    {filters.sortField === 'totalAmount' && (
                      <FontAwesomeIcon icon={faSort} className={filters.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'} />
                    )}
                  </th>
                  <th onClick={() => handleSort('status')}>
                    Stato
                    {filters.sortField === 'status' && (
                      <FontAwesomeIcon icon={faSort} className={filters.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'} />
                    )}
                  </th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td>#{order.orderNumber || order._id.substring(0, 8)}</td>
                    <td>{order.user.username || order.user.email}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{formatPrice(order.totalAmount)}</td>
                    <td>
                      <span className={`order-status ${getStatusClass(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="view-btn" 
                        onClick={() => viewOrderDetails(order._id)}
                      >
                        <FontAwesomeIcon icon={faEye} /> Dettagli
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                disabled={pagination.currentPage === 1} 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                className="page-btn"
              >
                &laquo; Precedente
              </button>
              <span className="page-info">
                Pagina {pagination.currentPage} di {pagination.totalPages}
              </span>
              <button 
                disabled={pagination.currentPage === pagination.totalPages} 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                className="page-btn"
              >
                Successiva &raquo;
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizza i dettagli dell'ordine
  const renderOrderDetails = () => {
    if (!showDetails || !selectedOrder) return null;

    return (
      <div className="order-details-overlay">
        <div className="order-details-container">
          <div className="order-details-header">
            <h2>Dettagli Ordine #{selectedOrder.orderNumber || selectedOrder._id.substring(0, 8)}</h2>
            <button className="close-btn" onClick={closeOrderDetails}>&times;</button>
          </div>
          
          <div className="order-info-grid">
            <div className="order-info-section">
              <h3>Informazioni Ordine</h3>
              <p><strong>ID:</strong> #{selectedOrder.orderNumber || selectedOrder._id}</p>
              <p><strong>Data:</strong> {formatDate(selectedOrder.createdAt)}</p>
              <p><strong>Cliente:</strong> {selectedOrder.user.username || selectedOrder.user.email}</p>
              <p><strong>Stato:</strong> <span className={`order-status ${getStatusClass(selectedOrder.status)}`}>{translateStatus(selectedOrder.status)}</span></p>
              <p><strong>Totale:</strong> {formatPrice(selectedOrder.totalAmount)}</p>
              {selectedOrder.shippingMethod && (
                <p><strong>Metodo di Spedizione:</strong> {selectedOrder.shippingMethod}</p>
              )}
              {selectedOrder.trackingNumber && (
                <p><strong>Numero di Tracciamento:</strong> {selectedOrder.trackingNumber}</p>
              )}
            </div>
            
            <div className="order-info-section">
              <h3>Indirizzo di Spedizione</h3>
              <p>{selectedOrder.shippingAddress?.fullName}</p>
              <p>{selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.houseNumber}</p>
              <p>{selectedOrder.shippingAddress?.postalCode} {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.province}</p>
              <p>{selectedOrder.shippingAddress?.country}</p>
              {selectedOrder.shippingAddress?.phone && (
                <p><strong>Telefono:</strong> {selectedOrder.shippingAddress.phone}</p>
              )}
            </div>
          </div>
          
          <div className="order-items">
            <h3>Prodotti Ordinati</h3>
            <table>
              <thead>
                <tr>
                  <th>Prodotto</th>
                  <th>Prezzo</th>
                  <th>Quantità</th>
                  <th>Totale</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items && selectedOrder.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className="order-item">
                        {item.product && item.product.image && (
                          <img 
                            src={item.product.image} 
                            alt={item.product.name || 'Immagine prodotto'} 
                            className="order-item-image" 
                          />
                        )}
                        {item.image && !item.product?.image && (
                          <img 
                            src={item.image} 
                            alt={item.name || 'Immagine prodotto'} 
                            className="order-item-image" 
                          />
                        )}
                        <div>
                          <h4>{item.product?.name || item.name || `Prodotto #${index + 1}`}</h4>
                          {item.customization && Object.keys(item.customization).length > 0 && (
                            <div className="item-customization">
                              <p><strong>Personalizzazioni:</strong></p>
                              <ul>
                                {Object.entries(item.customization).map(([key, value]) => (
                                  <li key={key}>{key}: {value}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{formatPrice(item.price)}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-right"><strong>Subtotale:</strong></td>
                  <td>{formatPrice(selectedOrder.subtotal || selectedOrder.totalAmount)}</td>
                </tr>
                {selectedOrder.shippingCost > 0 && (
                  <tr>
                    <td colSpan="3" className="text-right"><strong>Spedizione:</strong></td>
                    <td>{formatPrice(selectedOrder.shippingCost)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan="3" className="text-right"><strong>Totale:</strong></td>
                  <td>{formatPrice(selectedOrder.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {orderHistory && orderHistory.length > 0 && (
            <div className="order-history">
              <h3>Cronologia Ordine</h3>
              <ul className="timeline">
                {orderHistory.map((event, index) => (
                  <li key={index} className="timeline-item">
                    <div className="timeline-badge">
                      <span className={`status-dot ${getStatusClass(event.status)}`}></span>
                    </div>
                    <div className="timeline-content">
                      <h4>{translateStatus(event.status)}</h4>
                      <p className="timeline-date">{formatDate(event.timestamp)}</p>
                      {event.note && <p className="timeline-note">{event.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="order-actions">
            <h3>Aggiorna Stato</h3>
            <div className="status-update-form">
              <div className="form-group">
                <label htmlFor="statusNote">Note (opzionale):</label>
                <textarea
                  id="statusNote"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Aggiungi note per l'aggiornamento dello stato..."
                />
              </div>
              <div className="status-buttons">
                {selectedOrder.status.toLowerCase() !== 'processing' && selectedOrder.status.toLowerCase() !== 'in elaborazione' && (
                  <button
                    className="btn status-btn processing"
                    onClick={() => updateOrderStatus(selectedOrder._id, 'processing')}
                    disabled={processingAction}
                  >
                    <FontAwesomeIcon icon={faSpinner} /> In Elaborazione
                  </button>
                )}
                {selectedOrder.status.toLowerCase() !== 'shipped' && selectedOrder.status.toLowerCase() !== 'spedito' && (
                  <button
                    className="btn status-btn shipped"
                    onClick={() => updateOrderStatus(selectedOrder._id, 'shipped')}
                    disabled={processingAction}
                  >
                    <FontAwesomeIcon icon={faTruck} /> Spedito
                  </button>
                )}
                {selectedOrder.status.toLowerCase() !== 'delivered' && selectedOrder.status.toLowerCase() !== 'consegnato' && (
                  <button
                    className="btn status-btn delivered"
                    onClick={() => updateOrderStatus(selectedOrder._id, 'delivered')}
                    disabled={processingAction}
                  >
                    <FontAwesomeIcon icon={faCheck} /> Consegnato
                  </button>
                )}
                {selectedOrder.status.toLowerCase() !== 'cancelled' && selectedOrder.status.toLowerCase() !== 'annullato' && (
                  <button
                    className="btn status-btn cancelled"
                    onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
                    disabled={processingAction}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Annullato
                  </button>
                )}
                <button
                  className="btn status-btn delete"
                  onClick={() => handleDeleteOrder(selectedOrder._id)}
                  disabled={processingAction}
                  title="Funzionalità temporaneamente disabilitata"
                >
                  <FontAwesomeIcon icon={faTrash} /> Elimina Ordine
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-orders-list">
      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Cerca per ID ordine o cliente..."
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
        </form>
        
        <div className="filter-container">
          <div className="filter-by-status">
            <FontAwesomeIcon icon={faFilter} />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="status-filter"
            >
              <option value="">Tutti gli stati</option>
              <option value="processing">In elaborazione</option>
              <option value="shipped">Spedito</option>
              <option value="delivered">Consegnato</option>
              <option value="cancelled">Annullato</option>
            </select>
          </div>
        </div>
      </div>
      
      {renderContent()}
      {renderOrderDetails()}
    </div>
  );
};

export default OrdersList; 