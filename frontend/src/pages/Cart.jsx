import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faMinus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { cartService } from '../services/api';
import '../styles/cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const items = cartService.getCart();
    setCartItems(items);
    setTotal(cartService.getCartTotal());
  };

  const handleRemoveItem = (id) => {
    cartService.removeFromCart(id);
    loadCart();
  };

  const handleUpdateQuantity = (id, delta) => {
    cartService.updateQuantity(id, delta);
    loadCart();
  };

  const handleEmptyCart = () => {
    cartService.emptyCart();
    loadCart();
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    // Implementare il processo di checkout
    navigate('/checkout');
  };

  return (
    <div className="cart-page-container">
      <div className="cart-header">
        <Link to="/products" className="back-link">
          <FontAwesomeIcon icon={faArrowLeft} /> Continua lo Shopping
        </Link>
        <h1>Il Tuo Carrello</h1>
        {cartItems.length > 0 && (
          <button 
            className="empty-cart-btn" 
            onClick={handleEmptyCart}
          >
            Svuota Carrello
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart-message">
          <p>Il tuo carrello è vuoto.</p>
          <Link to="/products" className="shop-now-btn">
            Inizia a fare acquisti
          </Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            <div className="cart-items-header">
              <span className="item-col">Prodotto</span>
              <span className="price-col">Prezzo</span>
              <span className="quantity-col">Quantità</span>
              <span className="subtotal-col">Subtotale</span>
              <span className="actions-col"></span>
            </div>
            {cartItems.map((item) => {
              const itemPrice = typeof item.price === 'string' 
                ? parseFloat(item.price.replace('€', '').trim()) 
                : (typeof item.price === 'number' ? item.price : 0);
              
              const subtotal = itemPrice * item.quantity;
              
              return (
                <div className="cart-item" key={item.id}>
                  <div className="item-col">
                    <div className="item-image">
                      <img 
                        src={item.imageUrl || '/placeholder-image.jpg'} 
                        alt={item.name} 
                      />
                    </div>
                    <div className="item-details">
                      <h3>
                        <Link to={`/products/${item.id}`}>{item.name}</Link>
                      </h3>
                      {item.customization && (
                        <div className="customization-details">
                          <span className="customizable-badge">Personalizzato</span>
                          <p>{item.customization}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="price-col">€{itemPrice.toFixed(2)}</div>
                  <div className="quantity-col">
                    <div className="quantity-controls">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                  </div>
                  <div className="subtotal-col">€{subtotal.toFixed(2)}</div>
                  <div className="actions-col">
                    <button 
                      className="remove-btn" 
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="cart-summary">
            <h2>Riepilogo Ordine</h2>
            <div className="summary-row subtotal">
              <span>Subtotale</span>
              <span>€{total.toFixed(2)}</span>
            </div>
            <div className="summary-row shipping">
              <span>Spedizione</span>
              <span>Calcolata al checkout</span>
            </div>
            <div className="summary-row taxes">
              <span>Tasse</span>
              <span>Calcolate al checkout</span>
            </div>
            <div className="summary-row total">
              <span>Totale</span>
              <span>€{total.toFixed(2)}</span>
            </div>
            <button 
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
            >
              Procedi al Checkout
            </button>
            <div className="payment-methods">
              <p>Accettiamo</p>
              <div className="payment-icons">
                {/* Placeholder per le icone dei metodi di pagamento */}
                <span>Visa</span>
                <span>Mastercard</span>
                <span>PayPal</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart; 