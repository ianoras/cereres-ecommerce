import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import '../styles/cart-notification.css';

const CartNotification = ({ message, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [show, onClose]);
  
  if (!show) return null;
  
  return (
    <div className="cart-notification">
      <div className="notification-content">
        <div className="notification-icon">
          <FontAwesomeIcon icon={faCheckCircle} />
        </div>
        <div className="notification-message">
          {message}
        </div>
      </div>
      <div className="notification-actions">
        <button className="close-btn" onClick={onClose}>
          Continua
        </button>
        <Link to="/cart" className="view-cart-btn">
          <FontAwesomeIcon icon={faShoppingCart} /> Vai al carrello
        </Link>
      </div>
    </div>
  );
};

export default CartNotification; 