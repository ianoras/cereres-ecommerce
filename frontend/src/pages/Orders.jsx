import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../services/order.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faTimes, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import '../styles/orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pageInfo, setPageInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });

  // Funzione per caricare gli ordini
  const loadOrders = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getMyOrders({ page, limit: 10 });
      
      // Se la risposta contiene gli ordini, mostrali
      if (response && response.orders) {
        setOrders(response.orders);
        setPageInfo({
          currentPage: response.currentPage || 1,
          totalPages: response.totalPages || 1,
          totalOrders: response.total || 0
        });
      } else {
        // Se non ci sono ordini, mostra un array vuoto
        setOrders([]);
        setPageInfo({
          currentPage: 1,
          totalPages: 1,
          totalOrders: 0
        });
      }
    } catch (err) {
      console.error('Errore nel caricamento degli ordini:', err);
      setError('Si è verificato un errore nel caricamento degli ordini. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Carica gli ordini all'avvio del componente
  useEffect(() => {
    loadOrders();
  }, []);

  // Funzione per visualizzare i dettagli di un ordine
  const viewOrderDetails = async (orderId) => {
    try {
      setLoading(true);
      const orderData = await orderService.getOrderDetails(orderId);
      setSelectedOrder(orderData);
      
      // Carica anche la cronologia dell'ordine
      const historyData = await orderService.getOrderHistory(orderId);
      setOrderHistory(historyData);
    } catch (err) {
      console.error('Errore nel caricamento dei dettagli dell\'ordine:', err);
      setError('Impossibile caricare i dettagli dell\'ordine.');
    } finally {
      setLoading(false);
    }
  };

  // Funzione per chiudere i dettagli dell'ordine
  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setOrderHistory(null);
  };

  // Funzione per annullare un ordine
  const openCancelDialog = (orderId) => {
    setShowCancelModal(true);
    // Assicurati che l'ordine selezionato sia quello corretto
    if (!selectedOrder || selectedOrder._id !== orderId) {
      viewOrderDetails(orderId);
    }
  };

  // Funzione per confermare l'annullamento
  const confirmCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Per favore, inserisci un motivo per l\'annullamento.');
      return;
    }

    if (!selectedOrder) {
      setShowCancelModal(false);
      return;
    }

    setCancelling(true);
    try {
      await orderService.cancelOrder(selectedOrder._id, cancelReason);
      // Ricarica i dettagli dell'ordine e la lista degli ordini
      await viewOrderDetails(selectedOrder._id);
      await loadOrders(pageInfo.currentPage);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      console.error('Errore nell\'annullamento dell\'ordine:', err);
      setError('Impossibile annullare l\'ordine. Riprova più tardi.');
    } finally {
      setCancelling(false);
    }
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
      case 'completato':
      case 'consegnato':
        return 'status-delivered';
      case 'spedito':
        return 'status-shipped';
      case 'in elaborazione':
      case 'in lavorazione':
        return 'status-processing';
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
      default:
        return status;
    }
  };

  // Funzione per determinare se un ordine può essere annullato
  const canBeCancelled = (order) => {
    // Esempio: solo gli ordini in elaborazione possono essere annullati
    return order.status.toLowerCase() === 'processing' || 
           order.status.toLowerCase() === 'in elaborazione';
  };

  // Renderizza la lista degli ordini
  const renderOrdersList = () => {
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
          <button onClick={() => loadOrders()} className="retry-btn">Riprova</button>
        </div>
      );
    }

    if (!orders.length) {
      return (
        <div className="empty-orders">
          <h3>Nessun ordine trovato</h3>
          <p>Non hai ancora effettuato ordini. Visita la nostra sezione prodotti per iniziare.</p>
          <Link to="/products" className="shop-btn">Vai ai Prodotti</Link>
        </div>
      );
    }

    return (
      <div className="orders-list">
        <table>
          <thead>
            <tr>
              <th>ID Ordine</th>
              <th>Data</th>
              <th>Totale</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>#{order.orderNumber || order._id.substring(0, 8)}</td>
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
                  {canBeCancelled(order) && (
                    <button 
                      className="cancel-btn" 
                      onClick={() => openCancelDialog(order._id)}
                    >
                      <FontAwesomeIcon icon={faTimes} /> Annulla
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginazione */}
        {pageInfo.totalPages > 1 && (
          <div className="pagination">
            <button 
              disabled={pageInfo.currentPage === 1} 
              onClick={() => loadOrders(pageInfo.currentPage - 1)}
              className="page-btn"
            >
              &laquo; Precedente
            </button>
            <span className="page-info">
              Pagina {pageInfo.currentPage} di {pageInfo.totalPages}
            </span>
            <button 
              disabled={pageInfo.currentPage === pageInfo.totalPages} 
              onClick={() => loadOrders(pageInfo.currentPage + 1)}
              className="page-btn"
            >
              Successiva &raquo;
            </button>
          </div>
        )}
      </div>
    );
  };

  // Renderizza i dettagli dell'ordine
  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    return (
      <div className="order-details-overlay">
        <div className="order-details-container">
          <div className="order-details-header">
            <h2>Dettagli Ordine #{selectedOrder.orderNumber || selectedOrder._id.substring(0, 8)}</h2>
            <button className="close-btn" onClick={closeOrderDetails}>&times;</button>
          </div>
          
          <div className="order-info">
            <div className="order-info-section">
              <h3>Informazioni Ordine</h3>
              <p><strong>Data:</strong> {formatDate(selectedOrder.createdAt)}</p>
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
                        {item.product.image && (
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="order-item-image" 
                          />
                        )}
                        <div>
                          <h4>{item.product.name}</h4>
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
            </table>
          </div>
          
          {orderHistory && orderHistory.events && orderHistory.events.length > 0 && (
            <div className="order-history">
              <h3>Cronologia Ordine</h3>
              <ul className="timeline">
                {orderHistory.events.map((event, index) => (
                  <li key={index} className="timeline-item">
                    <div className="timeline-badge">
                      <span className={`status-dot ${getStatusClass(event.status)}`}></span>
                    </div>
                    <div className="timeline-content">
                      <h4>{translateStatus(event.status)}</h4>
                      <p className="timeline-date">{formatDate(event.timestamp)}</p>
                      {event.notes && <p>{event.notes}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {canBeCancelled(selectedOrder) && (
            <div className="order-actions">
              <button 
                className="cancel-order-btn" 
                onClick={() => openCancelDialog(selectedOrder._id)}
              >
                <FontAwesomeIcon icon={faTimes} /> Annulla Ordine
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Modal per l'annullamento dell'ordine
  const renderCancelModal = () => {
    if (!showCancelModal) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <h3>Annulla Ordine</h3>
            <button className="close-btn" onClick={() => setShowCancelModal(false)}>&times;</button>
          </div>
          <div className="modal-body">
            <p>Sei sicuro di voler annullare questo ordine?</p>
            <p><strong>Nota:</strong> Un ordine può essere annullato solo se non è stato ancora spedito.</p>
            <div className="form-group">
              <label htmlFor="cancelReason">Motivo dell'annullamento:</label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Inserisci il motivo dell'annullamento..."
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className="secondary-btn" 
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              Annulla
            </button>
            <button 
              className="primary-btn" 
              onClick={confirmCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Annullamento in corso...
                </>
              ) : (
                'Conferma Annullamento'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="orders-page">
      <div className="container">
        <h1>I Miei Ordini</h1>
        
        {renderOrdersList()}
        {renderOrderDetails()}
        {renderCancelModal()}
      </div>
    </div>
  );
};

export default Orders; 