import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, faShoppingBag, faClipboardList, 
  faTachometerAlt, faPlus, faTimes, faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import { authService, productService, contactService, orderService } from '../services/api';
import notificationService from '../services/notificationService';
import axios from 'axios';
import '../styles/admin.css';

// Componenti
import ProductsList from '../components/admin/ProductsList';
import ProductForm from '../components/admin/ProductForm';
import OrdersList from '../components/admin/OrdersList';
import CustomRequestsList from '../components/admin/CustomRequestsList';
import ContactsList from '../components/admin/ContactsList';

const Admin = () => {
  const [user] = useState(authService.getCurrentUser());
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadCustomRequestsCount, setUnreadCustomRequestsCount] = useState(0);
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  
  // Stats per dashboard
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomRequests: 0,
    recentOrders: [],
    recentCustomRequests: []
  });
  
  // Stato per prodotti
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Carica i conteggi delle notifiche non lette
  const loadNotificationCounts = useCallback(() => {
    try {
      // Utilizziamo il servizio di notifica con debounce
      const messagesCount = notificationService.getUnreadCount('messages');
      const requestsCount = notificationService.getUnreadCount('requests');
      const ordersCount = notificationService.getUnreadCount('orders');
      
      console.log('Conteggi notifiche caricati:', { messagesCount, requestsCount, ordersCount });
      
      setUnreadMessagesCount(messagesCount);
      setUnreadCustomRequestsCount(requestsCount);
      setUnreadOrdersCount(ordersCount);
    } catch (error) {
      console.error('Errore nel caricamento dei conteggi delle notifiche:', error);
      
      // Se l'errore è di autenticazione, reimpostiamo i conteggi a zero
      if (error.response && error.response.status === 401) {
        console.log('Errore di autenticazione, reimpostazione conteggi a zero');
        setUnreadMessagesCount(0);
        setUnreadCustomRequestsCount(0);
        setUnreadOrdersCount(0);
      }
    }
  }, []);
  
  // Imposta una funzione per aggiornare i conteggi
  useEffect(() => {
    // Carica i conteggi all'avvio - utilizziamo il servizio di notifica per fetchare i dati
    notificationService.debouncedFetchUnreadCounts();
    
    // Aggiorna i conteggi quando cambia la pagina
    loadNotificationCounts();
    
    // Aggiorna i conteggi ogni 30 secondi
    const notificationTimer = setInterval(() => {
      notificationService.debouncedFetchUnreadCounts();
      loadNotificationCounts();
    }, 30000);
    
    // Funzione globale per aggiornare i conteggi delle notifiche
    window.updateNotificationCounts = async () => {
      console.log('Aggiornamento globale dei conteggi delle notifiche...');
      
      try {
        // Carichiamo i conteggi aggiornati dallo stato del servizio
        loadNotificationCounts();
      } catch (error) {
        console.error('Errore nell\'aggiornamento globale dei conteggi:', error);
      }
    };
    
    // Pulisci il timer quando il componente viene smontato
    return () => {
      clearInterval(notificationTimer);
      delete window.updateNotificationCounts;
    };
  }, [loadNotificationCounts]);
  
  // Aggiungo la classe admin-page al body al montaggio e la rimuovo allo smontaggio
  useEffect(() => {
    document.body.classList.add('admin-page');
    
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);
  
  // Carica il conteggio degli ordini non letti
  const fetchUnreadOrders = async () => {
    try {
      // Non eseguiamo la chiamata se siamo già nella sezione ordini
      if (user && user.role === 'admin' && activeSection !== 'orders') {
        const count = await notificationService.getUnreadCount('orders');
        setUnreadOrdersCount(count);
      }
    } catch (err) {
      console.error('Errore nel recupero degli ordini non letti:', err);
    }
  };
  
  useEffect(() => {
    // Controllo se l'utente è admin
    if (user && user.role !== 'admin') {
      setError('Accesso negato. Solo gli amministratori possono accedere a questa pagina.');
    }
    
    // Carica dati iniziali
    if (activeSection === 'dashboard') {
      fetchDashboardStats();
    } else if (activeSection === 'products' || activeSection === 'edit-product' || activeSection === 'add-product') {
      fetchProducts();
    }
    
    // Carica il conteggio dei messaggi non letti
    const fetchUnreadMessages = async () => {
      try {
        // Non eseguiamo la chiamata se siamo già nella sezione contatti
        if (user && user.role === 'admin' && activeSection !== 'contacts') {
          const count = await contactService.getUnreadCount();
          setUnreadMessagesCount(count);
        }
      } catch (err) {
        console.error('Errore nel recupero dei messaggi non letti:', err);
      }
    };
    
    // Carica il conteggio delle richieste personalizzate non lette
    const fetchUnreadCustomRequests = async () => {
      try {
        // Non eseguiamo la chiamata se siamo già nella sezione richieste personalizzate
        if (user && user.role === 'admin' && activeSection !== 'custom-requests') {
          console.log('Recuperando conteggio richieste personalizzate non lette...');
          // Usiamo direttamente 'new_request' per ottenere il conteggio corretto
          const count = await notificationService.getUnreadCount('new_request');
          console.log('Conteggio richieste personalizzate non lette:', count);
          setUnreadCustomRequestsCount(count);
        }
      } catch (err) {
        console.error('Errore nel recupero delle richieste personalizzate non lette:', err);
      }
    };
    
    fetchUnreadMessages();
    fetchUnreadCustomRequests();
    fetchUnreadOrders();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, user]);
  
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // Qui dovremo implementare le chiamate API per ottenere le statistiche
      // Per ora impostiamo solo il totale prodotti
      const productsResponse = await productService.getAll();
      
      // Ottieni il conteggio totale delle richieste personalizzate
      let totalCustomRequests = 0;
      let recentCustomRequests = [];
      try {
        const customRequestsResponse = await axios.get('http://localhost:3001/api/custom-requests/admin/stats/requests', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        totalCustomRequests = customRequestsResponse.data.total || 0;
        
        // Ottieni le richieste personalizzate recenti
        const recentRequestsResponse = await axios.get('http://localhost:3001/api/custom-requests/admin/all?limit=5', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        recentCustomRequests = recentRequestsResponse.data.requests || [];
      } catch (err) {
        console.error('Errore nel caricamento delle statistiche delle richieste personalizzate:', err);
        
        // Se l'errore è di autenticazione, reimpostiamo i valori a zero
        if (err.response && err.response.status === 401) {
          console.log('Errore di autenticazione, reimpostazione valori a zero');
          totalCustomRequests = 0;
          recentCustomRequests = [];
        }
      }
      
      // Ottieni statistiche sugli ordini
      let totalOrders = 0;
      let recentOrders = [];
      try {
        const ordersStats = await orderService.getOrderStats();
        totalOrders = ordersStats.total || 0;
        recentOrders = ordersStats.recentOrders || [];
      } catch (err) {
        console.error('Errore nel caricamento delle statistiche degli ordini:', err);
        
        // Se l'errore è di autenticazione, reimpostiamo i valori a zero
        if (err.response && err.response.status === 401) {
          console.log('Errore di autenticazione, reimpostazione valori a zero');
          totalOrders = 0;
          recentOrders = [];
        }
      }
      
      setStats(prev => ({
        ...prev,
        totalProducts: productsResponse.data.length,
        totalCustomRequests: totalCustomRequests,
        recentCustomRequests: recentCustomRequests,
        totalOrders: totalOrders,
        recentOrders: recentOrders
      }));
    } catch (err) {
      setError('Errore nel caricamento delle statistiche: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Aggiungiamo un timestamp come parametro per evitare la cache
      const timestamp = new Date().getTime();
      console.log('Fetching products with timestamp:', timestamp);
      const response = await productService.getAll(timestamp);
      setProducts(response.data);
      console.log('Products fetched:', response.data);
    } catch (err) {
      setError('Errore nel caricamento dei prodotti: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setActiveSection('add-product');
    setIsEditing(false);
  };
  
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setActiveSection('edit-product');
    setIsEditing(true);
  };
  
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      return;
    }
    
    try {
      setLoading(true);
      await productService.deleteProduct(productId);
      setSuccessMessage('Prodotto eliminato con successo');
      
      // Aggiorna la lista prodotti
      setProducts(products.filter(p => p._id !== productId));
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Errore durante l\'eliminazione del prodotto: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  const handleProductSubmit = async (productData, isNew = false, productId = null) => {
    try {
      setLoading(true);
      let response;
      
      console.log('Submitting product:', {
        isNew,
        productId, 
        productData: productData instanceof FormData 
          ? 'FormData Object' 
          : productData
      });
      
      if (isNew) {
        response = await productService.createProduct(productData);
        setSuccessMessage('Prodotto creato con successo');
      } else {
        // Usiamo l'ID passato come parametro o quello dal prodotto selezionato
        const idToUse = productId || (selectedProduct && selectedProduct._id);
        if (!idToUse) {
          throw new Error('ID prodotto mancante');
        }
        
        console.log(`Aggiornamento del prodotto ${idToUse} in corso...`);
        response = await productService.updateProduct(idToUse, productData);
        console.log('Risposta del server dopo aggiornamento:', response.data);
        
        setSuccessMessage('Prodotto aggiornato con successo');
      }
      
      // Forziamo il ricaricamento dei prodotti direttamente
      await fetchProducts();
      
      // Torna alla lista prodotti
      setActiveSection('products');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Errore durante il salvataggio del prodotto: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Cambio di sezione con gestione delle notifiche
  const handleSectionChange = (section) => {
    // Prima di cambiare sezione, controlliamo se dobbiamo aggiornare le notifiche
    const previousSection = activeSection;
    
    // Imposta la nuova sezione attiva
    setActiveSection(section);
    
    // Gestione delle notifiche in base alla sezione 
    switch (section) {
      case 'custom-requests':
        // Se ci sono notifiche non lette, le segniamo come lette in anticipo
        if (unreadCustomRequestsCount > 0) {
          // Imposta subito il conteggio a 0 per un'esperienza utente migliore
          setUnreadCustomRequestsCount(0);
          
          // Segna le notifiche come lette nel backend
          notificationService.markAllAsRead('new_request')
            .then(() => loadNotificationCounts())
            .catch(error => console.error('Errore nel segnare le notifiche come lette:', error));
        }
        break;
      
      case 'orders':
        // Se ci sono notifiche non lette, le segniamo come lette in anticipo
        if (unreadOrdersCount > 0) {
          // Imposta subito il conteggio a 0 per un'esperienza utente migliore
          setUnreadOrdersCount(0);
          
          // Segna le notifiche come lette nel backend
          notificationService.markAllAsRead('new_order')
            .then(() => loadNotificationCounts())
            .catch(error => console.error('Errore nel segnare le notifiche come lette:', error));
        }
        break;
        
      case 'contacts':
        // Se ci sono notifiche non lette, le segniamo come lette in anticipo
        if (unreadMessagesCount > 0) {
          // Imposta subito il conteggio a 0 per un'esperienza utente migliore
          setUnreadMessagesCount(0);
          
          // Segna le notifiche come lette nel backend
          notificationService.markAllAsRead('new_message')
            .then(() => loadNotificationCounts())
            .catch(error => console.error('Errore nel segnare le notifiche come lette:', error));
        }
        break;
        
      default:
        break;
    }
    
    // Se la sezione è stata cambiata, aggiorniamo i conteggi
    if (previousSection !== section) {
      loadNotificationCounts();
    }
  };
  
  // Se l'utente non è loggato, redirect alla pagina di login
  if (!user) {
    return <Navigate to="/login" state={{ from: '/admin' }} />;
  }
  
  // Se l'utente non è admin, mostra errore
  if (user && user.role !== 'admin') {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h3>Accesso negato</h3>
          <p>Solo gli amministratori possono accedere a questa pagina.</p>
          <p>Dettagli utente:</p>
          <pre>{JSON.stringify(user, null, 2)}</pre>
          <Link to="/" className="btn btn-primary">Torna alla home</Link>
        </div>
      </div>
    );
  }
  
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="admin-dashboard">
            <h2>Dashboard</h2>
            
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faBox} />
                </div>
                <div className="stat-info">
                  <h3>Prodotti</h3>
                  <p className="stat-number">{stats.totalProducts}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faShoppingBag} />
                </div>
                <div className="stat-info">
                  <h3>Ordini</h3>
                  <p className="stat-number">{stats.totalOrders}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faClipboardList} />
                </div>
                <div className="stat-info">
                  <h3>Richieste Personalizzate</h3>
                  <p className="stat-number">{stats.totalCustomRequests}</p>
                </div>
              </div>
            </div>
            
            <div className="recent-activity">
              <div className="recent-orders">
                <h3>Ordini Recenti</h3>
                {stats.recentOrders.length > 0 ? (
                  <ul>
                    {stats.recentOrders.map(order => (
                      <li key={order._id}>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span>{order.user.username}</span>
                        <span>€{order.totalAmount.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Nessun ordine recente</p>
                )}
              </div>
              
              <div className="recent-requests">
                <h3>Richieste Recenti</h3>
                {stats.recentCustomRequests.length > 0 ? (
                  <ul>
                    {stats.recentCustomRequests.map(request => (
                      <li key={request._id}>
                        <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                        <span>{request.user.username}</span>
                        <span>{request.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Nessuna richiesta recente</p>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'products':
        return (
          <div className="admin-products">
            <div className="section-header">
              <h2>Gestione Prodotti</h2>
              <button className="btn btn-primary" onClick={handleAddProduct}>
                <FontAwesomeIcon icon={faPlus} /> Nuovo Prodotto
              </button>
            </div>
            
            <ProductsList 
              products={products}
              onEdit={handleEditProduct} 
              onDelete={handleDeleteProduct}
              loading={loading}
            />
          </div>
        );
        
      case 'add-product':
      case 'edit-product':
        return (
          <div className="admin-product-form">
            <div className="section-header">
              <h2>{isEditing ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h2>
              <button 
                className="btn btn-outline" 
                onClick={() => setActiveSection('products')}
              >
                Torna alla lista
              </button>
            </div>
            
            <ProductForm 
              product={selectedProduct} 
              isEditing={isEditing}
              onSubmit={handleProductSubmit}
              loading={loading}
            />
          </div>
        );
        
      case 'orders':
        return (
          <div className="admin-orders">
            <h2>Gestione Ordini</h2>
            <OrdersList />
          </div>
        );
        
      case 'custom-requests':
        return (
          <div className="admin-custom-requests admin-page-container">
            <h2>Richieste Personalizzate</h2>
            <CustomRequestsList />
          </div>
        );
        
      case 'contacts':
        return (
          <div className="admin-contacts">
            <h2>Messaggi di Contatto</h2>
            <ContactsList />
          </div>
        );
        
      default:
        return <div>Seleziona una sezione</div>;
    }
  };
  
  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h3>Admin Panel</h3>
          <Link to="/" className="back-to-site">
            Torna al sito
          </Link>
        </div>
        <ul className="admin-nav">
          <li className={activeSection === 'dashboard' ? 'active' : ''}>
            <button onClick={() => handleSectionChange('dashboard')}>
              <FontAwesomeIcon icon={faTachometerAlt} />
              Dashboard
            </button>
          </li>
          <li className={['products', 'add-product', 'edit-product'].includes(activeSection) ? 'active' : ''}>
            <button onClick={() => handleSectionChange('products')}>
              <FontAwesomeIcon icon={faBox} />
              Prodotti
            </button>
          </li>
          <li className={activeSection === 'orders' ? 'active' : ''}>
            <button onClick={() => handleSectionChange('orders')}>
              <FontAwesomeIcon icon={faShoppingBag} />
              Ordini
              {unreadOrdersCount > 0 && (
                <span className="badge-notification">{unreadOrdersCount}</span>
              )}
            </button>
          </li>
          <li className={activeSection === 'custom-requests' ? 'active' : ''}>
            <button onClick={() => handleSectionChange('custom-requests')}>
              <FontAwesomeIcon icon={faClipboardList} />
              Personalizzazioni
              {unreadCustomRequestsCount > 0 && (
                <span className="badge-notification">{unreadCustomRequestsCount}</span>
              )}
            </button>
          </li>
          <li className={activeSection === 'contacts' ? 'active' : ''}>
            <button onClick={() => handleSectionChange('contacts')}>
              <FontAwesomeIcon icon={faEnvelope} />
              Messaggi
              {unreadMessagesCount > 0 && (
                <span className="badge-notification">{unreadMessagesCount}</span>
              )}
            </button>
          </li>
        </ul>
      </div>
      
      <div className="admin-main">
        <div className="admin-header">
          <div className="admin-user">
            <span>Bentornato, {user.username}</span>
          </div>
        </div>
        
        <div className="admin-content">
          {error && (
            <div className="alert alert-danger">
              {error}
              <button className="close-alert" onClick={() => setError('')}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
          
          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
              <button className="close-alert" onClick={() => setSuccessMessage('')}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
          
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Caricamento in corso...</p>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin; 