import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService, cartService, authService } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEdit, faCartPlus, faShippingFast, faCheck, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import '../styles/product-detail.css';
import CartNotification from '../components/CartNotification';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productService.getById(id);
        setProduct(response.data);
        setCurrentImage(0);
      } catch (err) {
        setError('Errore nel caricamento del prodotto: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  const handleImageClick = (index) => {
    setCurrentImage(index);
  };
  
  const handleAddToCart = () => {
    if (!product) return;
    
    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : null,
      quantity: quantity
    };
    
    cartService.addToCart(cartItem);
    
    // Mostra la notifica invece dell'alert
    setShowNotification(true);
  };
  
  const handleCustomize = () => {
    // Verifica se l'utente è autenticato
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      // Se non è autenticato, reindirizza alla pagina di login
      navigate('/login', { state: { from: `/products/${id}/customize` } });
      return;
    }
    
    // Se l'utente è autenticato, reindirizza alla pagina di personalizzazione
    navigate(`/products/${id}/customize`);
  };
  
  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Caricamento prodotto...</p>
        </div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="product-detail-container">
        <div className="error-message">
          <h3>Si è verificato un errore</h3>
          <p>{error || 'Prodotto non trovato'}</p>
          <button onClick={() => navigate('/products')}>Torna ai prodotti</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="product-detail-container">
      <div className="product-detail-nav">
        <Link to="/products" className="back-link">
          <FontAwesomeIcon icon={faArrowLeft} /> Torna ai prodotti
        </Link>
        
        <div className="product-category-badge">
          {product.category}
        </div>
      </div>
      
      <div className="product-detail-content">
        <div className="product-images">
          <div className="product-main-image">
            <img 
              src={product.images && product.images.length > 0 
                ? product.images[currentImage] 
                : 'https://placehold.co/600x400?text=Immagine+non+disponibile'
              } 
              alt={product.name} 
            />
            {product.customization && (
              <div className="customizable-badge">
                Personalizzabile
              </div>
            )}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="product-thumbnails">
              {product.images.map((image, index) => (
                <div 
                  key={index} 
                  className={`thumbnail ${index === currentImage ? 'active' : ''}`}
                  onClick={() => handleImageClick(index)}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="product-info">
          <h1>{product.name}</h1>
          
          <div className="product-price">€{product.price.toFixed(2)}</div>
          
          <div className="product-description">
            {product.description}
          </div>
          
          {product.customizationOptions && product.customizationOptions.length > 0 && (
            <div className="customization-options">
              <h3>Opzioni di personalizzazione disponibili:</h3>
              <ul>
                {product.customizationOptions.map((option, index) => (
                  <li key={index}>
                    <strong>{option.name}:</strong> {option.options.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="product-actions">
            <div className="quantity-selector">
              <label htmlFor="quantity">Quantità:</label>
              <div className="quantity-controls">
                <button 
                  type="button" 
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  aria-label="Diminuisci quantità"
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <input 
                  type="number" 
                  id="quantity" 
                  name="quantity" 
                  min="1" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  readOnly
                />
                <button 
                  type="button" 
                  onClick={() => setQuantity(prev => prev + 1)}
                  aria-label="Aumenta quantità"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>
            
            <div className="buttons-container">
              <button 
                className="btn btn-primary add-to-cart-btn" 
                disabled={!product.inStock}
                onClick={handleAddToCart}
              >
                <FontAwesomeIcon icon={faCartPlus} /> {product.inStock ? 'Aggiungi al carrello' : 'Prodotto esaurito'}
              </button>
              
              {product.customization && (
                <button 
                  className="btn btn-secondary customize-btn"
                  onClick={handleCustomize}
                >
                  <FontAwesomeIcon icon={faEdit} /> Personalizza
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <CartNotification 
        message={`${product?.name} aggiunto al carrello!`}
        show={showNotification}
        onClose={() => setShowNotification(false)}
      />
      
      {/* Sezione prodotti correlati o suggeriti */}
      {/* 
      <div className="related-products">
        <h2>Potrebbero interessarti anche</h2>
        <div className="related-products-grid">
          {relatedProducts.map(product => (
            // Mini card prodotto
          ))}
        </div>
      </div>
      */}
    </div>
  );
};

export default ProductDetail; 