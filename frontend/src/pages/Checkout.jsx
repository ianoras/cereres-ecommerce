import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck, faCreditCard, faMoneyBill, faTruck } from '@fortawesome/free-solid-svg-icons';
import { cartService, authService } from '../services/api';
import orderService from '../services/order.service';
import '../styles/checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(5.99);
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    // Shipping information
    name: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
    country: 'Italia',
    
    // Payment information
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
    paymentMethod: 'card',
    
    // Additional information
    notes: '',
    saveInfo: false
  });
  
  // Form errors
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      // Precompila alcuni campi con le informazioni dell'utente
      setFormData(prev => ({
        ...prev,
        name: currentUser.name?.split(' ')[0] || '',
        lastName: currentUser.name?.split(' ').slice(1).join(' ') || '',
        email: currentUser.email || ''
      }));
    }
    
    loadCart();
  }, []);
  
  const loadCart = () => {
    const items = cartService.getCart();
    if (items.length === 0) {
      // Reindirizza al carrello se è vuoto
      navigate('/cart');
      return;
    }
    
    setCartItems(items);
    const subtotal = cartService.getCartTotal();
    setTotal(subtotal + shippingCost);
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Rimuovi l'errore quando l'utente inizia a digitare
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validazione diversa a seconda dello step attivo
    if (activeStep === 1) {
      if (!formData.name) newErrors.name = 'Il nome è obbligatorio';
      if (!formData.lastName) newErrors.lastName = 'Il cognome è obbligatorio';
      if (!formData.email) newErrors.email = 'L\'email è obbligatoria';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email non valida';
      if (!formData.phone) newErrors.phone = 'Il telefono è obbligatorio';
      if (!formData.address) newErrors.address = 'L\'indirizzo è obbligatorio';
      if (!formData.city) newErrors.city = 'La città è obbligatoria';
      if (!formData.postalCode) newErrors.postalCode = 'Il CAP è obbligatorio';
      if (!formData.province) newErrors.province = 'La provincia è obbligatoria';
    } else if (activeStep === 2 && formData.paymentMethod === 'card') {
      if (!formData.cardName) newErrors.cardName = 'Il nome sulla carta è obbligatorio';
      if (!formData.cardNumber) newErrors.cardNumber = 'Il numero della carta è obbligatorio';
      else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) 
        newErrors.cardNumber = 'Numero carta non valido';
      if (!formData.cardExpiry) newErrors.cardExpiry = 'Data di scadenza obbligatoria';
      else if (!/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) 
        newErrors.cardExpiry = 'Formato scadenza non valido (MM/YY)';
      if (!formData.cardCVV) newErrors.cardCVV = 'Il CVV è obbligatorio';
      else if (!/^\d{3,4}$/.test(formData.cardCVV)) 
        newErrors.cardCVV = 'CVV non valido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateForm()) {
      setActiveStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };
  
  const handleSubmitOrder = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        // Prepara gli elementi del carrello per il backend (rinomina "id" in "product")
        const formattedItems = cartItems.map(item => ({
          product: item.id, // Campo "id" rinominato in "product" come richiesto dal backend
          price: item.price,
          quantity: item.quantity,
          customization: item.customization || {}
        }));
        
        // Creazione effettiva dell'ordine tramite orderService
        const orderData = {
          items: formattedItems,
          shipping: {
            name: formData.name,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            province: formData.province,
            country: formData.country,
            notes: formData.notes
          },
          payment: {
            method: formData.paymentMethod,
            cardDetails: formData.paymentMethod === 'card' ? {
              lastFourDigits: formData.cardNumber.slice(-4)
            } : null
          },
          total: total,
          subtotal: total - shippingCost,
          shippingCost: shippingCost + (formData.paymentMethod === 'cash' ? 2.5 : 0)
        };
        
        console.log('Invio ordine al server:', orderData);
        
        // Chiamata al servizio ordini
        const response = await orderService.createOrder(orderData);
        
        // Usa il numero d'ordine dalla risposta o genera un id casuale se non disponibile
        const orderNum = response?.orderId || 'ORD-' + Math.floor(100000 + Math.random() * 900000);
        setOrderNumber(orderNum);
        
        // Svuota il carrello
        cartService.emptyCart();
        
        setOrderComplete(true);
        setActiveStep(4);
      } catch (error) {
        console.error('Errore durante l\'elaborazione dell\'ordine:', error);
        alert('Si è verificato un errore durante l\'elaborazione dell\'ordine. Riprova più tardi.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const renderShippingForm = () => (
    <div className="checkout-form">
      <h2>Informazioni di Spedizione</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Nome *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">Cognome *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={errors.lastName ? 'error' : ''}
          />
          {errors.lastName && <span className="error-message">{errors.lastName}</span>}
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Telefono *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>
      </div>
      
      <div className="form-group full-width">
        <label htmlFor="address">Indirizzo *</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          className={errors.address ? 'error' : ''}
        />
        {errors.address && <span className="error-message">{errors.address}</span>}
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="city">Città *</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className={errors.city ? 'error' : ''}
          />
          {errors.city && <span className="error-message">{errors.city}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="postalCode">CAP *</label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleInputChange}
            className={errors.postalCode ? 'error' : ''}
          />
          {errors.postalCode && <span className="error-message">{errors.postalCode}</span>}
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="province">Provincia *</label>
          <input
            type="text"
            id="province"
            name="province"
            value={formData.province}
            onChange={handleInputChange}
            className={errors.province ? 'error' : ''}
          />
          {errors.province && <span className="error-message">{errors.province}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="country">Paese *</label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
          >
            <option value="Italia">Italia</option>
            <option value="Francia">Francia</option>
            <option value="Germania">Germania</option>
            <option value="Spagna">Spagna</option>
            <option value="Regno Unito">Regno Unito</option>
          </select>
        </div>
      </div>
      
      <div className="form-group full-width">
        <label htmlFor="notes">Note per la consegna (opzionale)</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows="3"
        ></textarea>
      </div>
      
      <div className="form-group checkbox">
        <input
          type="checkbox"
          id="saveInfo"
          name="saveInfo"
          checked={formData.saveInfo}
          onChange={handleInputChange}
        />
        <label htmlFor="saveInfo">Salva queste informazioni per la prossima volta</label>
      </div>
      
      <div className="form-actions">
        <Link to="/cart" className="back-btn">
          <FontAwesomeIcon icon={faArrowLeft} /> Torna al carrello
        </Link>
        <button className="next-btn" onClick={handleNext}>
          Continua al pagamento
        </button>
      </div>
    </div>
  );
  
  const renderPaymentForm = () => (
    <div className="checkout-form">
      <h2>Informazioni di Pagamento</h2>
      
      <div className="payment-methods">
        <h3>Metodo di pagamento</h3>
        <div className="payment-options">
          <div 
            className={`payment-option ${formData.paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, paymentMethod: 'card'})}
          >
            <FontAwesomeIcon icon={faCreditCard} />
            <span>Carta di Credito</span>
            {formData.paymentMethod === 'card' && <FontAwesomeIcon icon={faCheck} className="check-icon" />}
          </div>
          
          <div 
            className={`payment-option ${formData.paymentMethod === 'paypal' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, paymentMethod: 'paypal'})}
          >
            <i className="fab fa-paypal"></i>
            <span>PayPal</span>
            {formData.paymentMethod === 'paypal' && <FontAwesomeIcon icon={faCheck} className="check-icon" />}
          </div>
          
          <div 
            className={`payment-option ${formData.paymentMethod === 'cash' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, paymentMethod: 'cash'})}
          >
            <FontAwesomeIcon icon={faMoneyBill} />
            <span>Contrassegno</span>
            {formData.paymentMethod === 'cash' && <FontAwesomeIcon icon={faCheck} className="check-icon" />}
          </div>
        </div>
      </div>
      
      {formData.paymentMethod === 'card' && (
        <div className="card-payment-form">
          <div className="form-group full-width">
            <label htmlFor="cardName">Nome sulla carta *</label>
            <input
              type="text"
              id="cardName"
              name="cardName"
              value={formData.cardName}
              onChange={handleInputChange}
              className={errors.cardName ? 'error' : ''}
              placeholder="Mario Rossi"
            />
            {errors.cardName && <span className="error-message">{errors.cardName}</span>}
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="cardNumber">Numero carta *</label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleInputChange}
              className={errors.cardNumber ? 'error' : ''}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
            />
            {errors.cardNumber && <span className="error-message">{errors.cardNumber}</span>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cardExpiry">Scadenza (MM/YY) *</label>
              <input
                type="text"
                id="cardExpiry"
                name="cardExpiry"
                value={formData.cardExpiry}
                onChange={handleInputChange}
                className={errors.cardExpiry ? 'error' : ''}
                placeholder="MM/YY"
                maxLength="5"
              />
              {errors.cardExpiry && <span className="error-message">{errors.cardExpiry}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="cardCVV">CVV *</label>
              <input
                type="text"
                id="cardCVV"
                name="cardCVV"
                value={formData.cardCVV}
                onChange={handleInputChange}
                className={errors.cardCVV ? 'error' : ''}
                placeholder="123"
                maxLength="4"
              />
              {errors.cardCVV && <span className="error-message">{errors.cardCVV}</span>}
            </div>
          </div>
          
          <div className="card-logos">
            <span className="card-logo visa">Visa</span>
            <span className="card-logo mastercard">MasterCard</span>
            <span className="card-logo amex">American Express</span>
          </div>
        </div>
      )}
      
      {formData.paymentMethod === 'paypal' && (
        <div className="paypal-info">
          <p>Sarai reindirizzato al sito di PayPal per completare il pagamento dopo aver verificato il tuo ordine.</p>
        </div>
      )}
      
      {formData.paymentMethod === 'cash' && (
        <div className="cash-info">
          <p>Pagherai in contanti alla consegna. Assicurati di avere l'importo esatto.</p>
          <p>Nota: Per gli ordini in contrassegno è previsto un supplemento di €2.50.</p>
        </div>
      )}
      
      <div className="form-actions">
        <button className="back-btn" onClick={handleBack}>
          <FontAwesomeIcon icon={faArrowLeft} /> Torna alla spedizione
        </button>
        <button className="next-btn" onClick={handleNext}>
          Rivedi ordine
        </button>
      </div>
    </div>
  );
  
  const renderOrderReview = () => (
    <div className="checkout-form">
      <h2>Rivedi il tuo ordine</h2>
      
      <div className="order-sections">
        <div className="order-section">
          <div className="section-header">
            <h3>Spedizione</h3>
            <button className="edit-btn" onClick={() => setActiveStep(1)}>Modifica</button>
          </div>
          <div className="section-content">
            <p><strong>{formData.name} {formData.lastName}</strong></p>
            <p>{formData.address}</p>
            <p>{formData.postalCode}, {formData.city}, {formData.province}</p>
            <p>{formData.country}</p>
            <p>Email: {formData.email}</p>
            <p>Telefono: {formData.phone}</p>
            {formData.notes && <p>Note: {formData.notes}</p>}
          </div>
        </div>
        
        <div className="order-section">
          <div className="section-header">
            <h3>Pagamento</h3>
            <button className="edit-btn" onClick={() => setActiveStep(2)}>Modifica</button>
          </div>
          <div className="section-content">
            {formData.paymentMethod === 'card' && (
              <>
                <p><strong>Carta di Credito</strong></p>
                <p>**** **** **** {formData.cardNumber.slice(-4)}</p>
                <p>Scadenza: {formData.cardExpiry}</p>
              </>
            )}
            {formData.paymentMethod === 'paypal' && (
              <p><strong>PayPal</strong></p>
            )}
            {formData.paymentMethod === 'cash' && (
              <p><strong>Pagamento in contrassegno</strong></p>
            )}
          </div>
        </div>
        
        <div className="order-section">
          <div className="section-header">
            <h3>Prodotti</h3>
            <Link to="/cart" className="edit-btn">Modifica</Link>
          </div>
          <div className="section-content">
            <div className="review-items">
              {cartItems.map((item) => {
                const itemPrice = typeof item.price === 'string' 
                  ? parseFloat(item.price.replace('€', '').trim()) 
                  : (typeof item.price === 'number' ? item.price : 0);
                
                return (
                  <div className="review-item" key={item.id}>
                    <div className="item-image">
                      <img src={item.imageUrl || '/placeholder-image.jpg'} alt={item.name} />
                    </div>
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p>Quantità: {item.quantity}</p>
                      <p>€{itemPrice.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="order-summary">
        <h3>Riepilogo</h3>
        <div className="summary-row">
          <span>Subtotale</span>
          <span>€{(total - shippingCost).toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Spedizione</span>
          <span>€{shippingCost.toFixed(2)}</span>
        </div>
        {formData.paymentMethod === 'cash' && (
          <div className="summary-row">
            <span>Supplemento contrassegno</span>
            <span>€2.50</span>
          </div>
        )}
        <div className="summary-row total">
          <span>Totale</span>
          <span>€{(total + (formData.paymentMethod === 'cash' ? 2.5 : 0)).toFixed(2)}</span>
        </div>
      </div>
      
      <div className="form-actions">
        <button className="back-btn" onClick={handleBack}>
          <FontAwesomeIcon icon={faArrowLeft} /> Torna al pagamento
        </button>
        <button 
          className="complete-order-btn" 
          onClick={handleSubmitOrder}
          disabled={isLoading}
        >
          {isLoading ? 'Elaborazione in corso...' : 'Completa ordine'}
        </button>
      </div>
    </div>
  );
  
  const renderOrderComplete = () => (
    <div className="order-complete">
      <div className="success-icon">
        <FontAwesomeIcon icon={faCheck} />
      </div>
      <h2>Grazie per il tuo ordine!</h2>
      <p>Numero ordine: <strong>{orderNumber}</strong></p>
      <p>Abbiamo ricevuto il tuo ordine e ti abbiamo inviato una conferma via email a <strong>{formData.email}</strong>.</p>
      
      <div className="shipping-info">
        <FontAwesomeIcon icon={faTruck} />
        <div>
          <h3>Informazioni sulla spedizione</h3>
          <p>Riceverai una notifica quando il tuo ordine sarà spedito.</p>
          <p>Puoi seguire lo stato del tuo ordine nella sezione "I miei ordini" del tuo account.</p>
        </div>
      </div>
      
      <div className="form-actions">
        <Link to="/products" className="back-to-shop-btn">
          Continua lo shopping
        </Link>
        <Link to="/orders" className="view-order-btn">
          Visualizza i miei ordini
        </Link>
      </div>
    </div>
  );
  
  const renderCheckoutSteps = () => (
    <div className="checkout-steps">
      <div className={`step ${activeStep >= 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}>
        <span className="step-number">1</span>
        <span className="step-name">Spedizione</span>
      </div>
      <div className="step-connector"></div>
      <div className={`step ${activeStep >= 2 ? 'active' : ''} ${activeStep > 2 ? 'completed' : ''}`}>
        <span className="step-number">2</span>
        <span className="step-name">Pagamento</span>
      </div>
      <div className="step-connector"></div>
      <div className={`step ${activeStep >= 3 ? 'active' : ''} ${activeStep > 3 ? 'completed' : ''}`}>
        <span className="step-number">3</span>
        <span className="step-name">Rivedi ordine</span>
      </div>
      <div className="step-connector"></div>
      <div className={`step ${activeStep >= 4 ? 'active' : ''}`}>
        <span className="step-number">4</span>
        <span className="step-name">Completato</span>
      </div>
    </div>
  );
  
  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        {!orderComplete && renderCheckoutSteps()}
      </div>
      
      <div className="checkout-content">
        {activeStep === 1 && renderShippingForm()}
        {activeStep === 2 && renderPaymentForm()}
        {activeStep === 3 && renderOrderReview()}
        {activeStep === 4 && renderOrderComplete()}
      </div>
    </div>
  );
};

export default Checkout; 