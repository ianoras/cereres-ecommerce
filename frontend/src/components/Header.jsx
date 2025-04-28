import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService, cartService, contactService, notificationService } from '../services/api.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faUser, faAngleDown, faBoxOpen, faFileAlt, faUserCog, faSignOutAlt, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import '../styles/navbar.css'; // Aggiorno il percorso del CSS
import NotificationCenter from './NotificationCenter';

// Se l'utente è admin, ottieni il conteggio dei messaggi non letti
const fetchUnreadMessages = async () => {
  try {
    const count = await contactService.getUnreadCount();
    return count;
  } catch (error) {
    console.error('Errore nel recuperare i messaggi non letti:', error);
    return 0;
  }
};

const Header = () => {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);
  const cartMenuRef = useRef(null);
  
  // Controlla se siamo nella homepage
  const isHomePage = location.pathname === '/';
  
  // Funzione per aggiornare il conteggio dei messaggi nell'interfaccia
  const updateUnreadCount = async () => {
    if (user && user.role === 'admin') {
      const count = await fetchUnreadMessages();
      setUnreadMessagesCount(count);
    }
  };

  // Funzione per controllare le notifiche non lette
  const checkUnreadNotifications = async () => {
    if (user) {
      try {
        // Forza un aggiornamento dei conteggi delle notifiche
        const counts = await notificationService.fetchUnreadCounts();
        console.log('Conteggi notifiche aggiornati in Header:', counts);
        
        // Aggiorna il conteggio delle notifiche non lette
        if (counts && typeof counts === 'object') {
          setUnreadNotificationsCount(counts.total || 0);
        }
      } catch (error) {
        console.error('Errore nel controllo delle notifiche:', error);
      }
    }
  };

  useEffect(() => {
    // Controlla se l'utente è già loggato ogni volta che cambia la location
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    // Aggiungi event listener per lo scroll solo se siamo nella homepage
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    // Imposta scrolled a true per tutte le pagine tranne la homepage
    if (!isHomePage) {
      setScrolled(true);
    } else {
      // Richiama handleScroll all'inizio per impostare correttamente lo stato nella homepage
      handleScroll();
      window.addEventListener('scroll', handleScroll);
    }
    
    // Chiudi il menu del profilo quando si clicca altrove
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      
      if (cartMenuRef.current && !cartMenuRef.current.contains(event.target)) {
        setCartDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    // Aggiorna il conteggio articoli del carrello
    const updateCartBadge = () => {
      const count = cartService.getCartItemCount();
      setCartItemCount(count);
    };
    
    // Aggiorna il badge quando il componente viene montato
    updateCartBadge();
    
    // Aggiorna il conteggio dei messaggi non letti
    updateUnreadCount();
    
    // Controlla le notifiche non lette immediatamente
    checkUnreadNotifications();
    
    // Imposta un intervallo per aggiornare il conteggio dei messaggi non letti ogni 3 minuti per gli admin
    let messageInterval;
    if (currentUser && currentUser.role === 'admin') {
      messageInterval = setInterval(updateUnreadCount, 3 * 60 * 1000);
    }
    
    // Imposta un intervallo per verificare le notifiche ogni 10 secondi invece di ogni minuto
    const notificationsInterval = setInterval(checkUnreadNotifications, 10000);
    
    // Aggiungi un event listener per ascoltare i cambiamenti nel localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'cartItems') {
        updateCartBadge();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Aggiungi un listener per gli aggiornamenti delle notifiche
    const removeNotificationListener = notificationService.addListener((data) => {
      console.log('Header: ricevuto aggiornamento notifiche:', data);
      if (data && typeof data === 'object') {
        setUnreadNotificationsCount(data.total || 0);
      }
    });
    
    return () => {
      if (isHomePage) {
        window.removeEventListener('scroll', handleScroll);
      }
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('storage', handleStorageChange);
      if (messageInterval) clearInterval(messageInterval);
      if (notificationsInterval) clearInterval(notificationsInterval);
      removeNotificationListener();
    };
  }, [location, isHomePage]);

  const handleLogout = () => {
    // Svuota il carrello prima di effettuare il logout
    cartService.emptyCart();
    // Aggiorna il conteggio del carrello
    setCartItemCount(0);
    // Esegui il logout
    authService.logout();
    setUser(null);
    navigate('/');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleProfileMenu = (e) => {
    e.preventDefault();
    setProfileMenuOpen(!profileMenuOpen);
  };
  
  const toggleCartDropdown = (e) => {
    e.preventDefault();
    // Se il carrello è vuoto, vai direttamente alla pagina del carrello
    if (cartItemCount === 0) {
      e.stopPropagation(); // Previene qualsiasi altro gestore di eventi
      navigate('/cart');
      return; // Esce dalla funzione dopo la navigazione
    } else {
      // Altrimenti, mostra il dropdown come di consueto
      setCartDropdownOpen(!cartDropdownOpen);
    }
  };

  const renderUserLinks = () => {
    if (user) {
      return (
        <>
          <li className="profile-menu-container" ref={profileMenuRef}>
            <button className="profile-menu-toggle" onClick={toggleProfileMenu}>
              <div className="user-icon-container" style={{ position: 'relative' }}>
                <FontAwesomeIcon icon={faUser} />
                {unreadNotificationsCount > 0 && (
                  <span className="notification-badge" style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    backgroundColor: '#ff3b30',
                    color: 'white',
                    fontSize: '0.7rem',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                    zIndex: 1000
                  }}>
                    {unreadNotificationsCount <= 99 ? unreadNotificationsCount : '99+'}
                  </span>
                )}
              </div>
              <span>{user.username || user.name}</span>
              <FontAwesomeIcon icon={faAngleDown} className="dropdown-icon" />
            </button>
            {profileMenuOpen && (
              <ul className="profile-dropdown">
                <li className="notification-center-container">
                  <NotificationCenter />
                </li>
                <li>
                  <Link to="/profile" onClick={() => { setProfileMenuOpen(false); setMenuOpen(false); }}>
                    <FontAwesomeIcon icon={faUserCog} /> Gestione Profilo
                  </Link>
                </li>
                <li>
                  <Link to="/orders" onClick={() => { setProfileMenuOpen(false); setMenuOpen(false); }}>
                    <FontAwesomeIcon icon={faBoxOpen} /> I Miei Ordini
                  </Link>
                </li>
                <li>
                  <Link to="/custom-requests" onClick={() => { setProfileMenuOpen(false); setMenuOpen(false); }}>
                    <FontAwesomeIcon icon={faFileAlt} /> Richieste Personalizzate
                  </Link>
                </li>
                {user && user.role === 'admin' && (
                  <li>
                    <Link 
                      to="/admin" 
                      onClick={() => { 
                        setProfileMenuOpen(false); 
                        setMenuOpen(false); 
                        // Aggiorna il conteggio quando si naviga all'admin
                        updateUnreadCount();
                      }} 
                      className="admin-link"
                    >
                      <FontAwesomeIcon icon={faUserCog} /> Amministrazione
                      {unreadMessagesCount > 0 && (
                        <span className="message-badge">{unreadMessagesCount}</span>
                      )}
                    </Link>
                  </li>
                )}
                <li>
                  <button
                    className="logout-btn"
                    onClick={() => { handleLogout(); setProfileMenuOpen(false); setMenuOpen(false); }}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                  </button>
                </li>
              </ul>
            )}
          </li>
        </>
      );
    }
    
    return (
      <>
        <li>
          <Link to="/login" onClick={() => setMenuOpen(false)}>
            Accedi
          </Link>
        </li>
        <li>
          <Link to="/register" onClick={() => setMenuOpen(false)}>
            Registrati
          </Link>
        </li>
      </>
    );
  };

  return (
    <nav className={`navbar ${scrolled || !isHomePage ? 'scrolled' : ''}`}>
      <div className="logo">
        <Link to="/">
          <div className={`logo-container ${scrolled || !isHomePage ? 'scrolled-container' : 'transparent-container'}`}>
            <img 
              src="/images/logo.jpg" 
              alt="Cereres Logo" 
              className="logo-image" 
            />
          </div>
        </Link>
      </div>
      <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
        <li><Link to="/" className="active" onClick={() => setMenuOpen(false)}>Home</Link></li>
        <li><Link to="/products" onClick={() => setMenuOpen(false)}>Prodotti</Link></li>
        <li><Link to="/customization" onClick={() => setMenuOpen(false)}>Personalizzazioni</Link></li>
        <li><Link to="/about" onClick={() => setMenuOpen(false)}>Chi Siamo</Link></li>
        <li className="cart-container" ref={cartMenuRef}>
          <a 
            href="#" 
            onClick={toggleCartDropdown} 
            className="cart-link"
          >
            <FontAwesomeIcon icon={faShoppingCart} /> Carrello
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </a>
          {cartItemCount > 0 && cartDropdownOpen && (
            <div className="cart-dropdown">
              <div className="cart-summary">
                <p>{cartItemCount} {cartItemCount === 1 ? 'articolo' : 'articoli'} nel carrello</p>
              </div>
              <div className="cart-actions">
                <Link 
                  to="/cart" 
                  className="view-cart-btn" 
                  onClick={() => {
                    setCartDropdownOpen(false);
                    setMenuOpen(false);
                  }}
                >
                  Visualizza Carrello
                </Link>
                <Link 
                  to="/checkout" 
                  className="checkout-btn" 
                  onClick={() => {
                    setCartDropdownOpen(false);
                    setMenuOpen(false);
                  }}
                >
                  Vai al Checkout
                </Link>
              </div>
            </div>
          )}
        </li>
        {renderUserLinks()}
      </ul>
      <div className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>
    </nav>
  );
};

export default Header; 