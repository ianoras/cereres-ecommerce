import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilter, faSearch, faSortAmountUp, 
  faSortAmountDown, faEdit, faCartPlus,
  faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { productService, cartService } from '../services/api';
import '../styles/products.css';
import CartNotification from '../components/CartNotification';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Stato per i filtri
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  
  // Stato per tenere traccia dell'immagine corrente per ogni prodotto
  const [currentImages, setCurrentImages] = useState({});
  
  // Carica i prodotti all'avvio
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('Recupero prodotti per la pagina prodotti...');
        const response = await productService.getAll(new Date().getTime());
        console.log('Prodotti ricevuti:', response.data.length);
        setProducts(response.data);
        setFilteredProducts(response.data);
      } catch (err) {
        setError('Errore nel caricamento dei prodotti: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Applica filtri e ordinamento quando cambiano
  useEffect(() => {
    let result = [...products];
    
    // Applica filtro categoria
    if (categoryFilter) {
      result = result.filter(product => product.category === categoryFilter);
    }
    
    // Applica filtro ricerca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query)
      );
    }
    
    // Applica ordinamento
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }
    
    setFilteredProducts(result);
  }, [products, categoryFilter, searchQuery, sortBy]);
  
  // Inizializza le immagini correnti quando i prodotti vengono caricati
  useEffect(() => {
    if (products.length > 0) {
      const initialImages = {};
      products.forEach(product => {
        if (product.images && product.images.length > 0) {
          initialImages[product._id] = 0;
        }
      });
      setCurrentImages(initialImages);
    }
  }, [products]);
  
  // Handler per reset filtri
  const resetFilters = () => {
    setCategoryFilter('');
    setSearchQuery('');
    setSortBy('newest');
  };
  
  // Handler per toggle della visualizzazione filtri su mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Funzione per cambiare immagine
  const changeImage = (productId, direction) => {
    const product = products.find(p => p._id === productId);
    if (!product || !product.images || product.images.length <= 1) return;
    
    setCurrentImages(prev => {
      const currentIndex = prev[productId] || 0;
      let newIndex;
      
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % product.images.length;
      } else {
        newIndex = (currentIndex - 1 + product.images.length) % product.images.length;
      }
      
      return {
        ...prev,
        [productId]: newIndex
      };
    });
  };
  
  const handleAddToCart = (product) => {
    if (!product) return;
    
    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : null,
      quantity: 1
    };
    
    cartService.addToCart(cartItem);
    setNotificationMessage(`${product.name} aggiunto al carrello!`);
    setShowNotification(true);
  };
  
  if (loading) {
    return (
      <div className="products-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Caricamento prodotti...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="products-container">
        <div className="error-message">
          <h3>Si è verificato un errore</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Riprova</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="products-container">
      <div className="products-header">
        <h1>Le Nostre Creazioni</h1>
        <p>Scopri la nostra collezione di prodotti artigianali</p>
      </div>
      
      <div className="filter-toggle-btn" onClick={toggleFilters}>
        <FontAwesomeIcon icon={faFilter} />
        <span>Filtri</span>
      </div>
      
      <div className={`filters-panel ${showFilters ? 'show' : ''}`}>
        <div className="search-bar">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Cerca prodotti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <label>Categoria</label>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Tutte le categorie</option>
              <option value="borse">Borse</option>
              <option value="guanti">Guanti</option>
              <option value="abbigliamento">Abbigliamento</option>
              <option value="cappelli">Cappelli</option>
              <option value="accessori">Accessori</option>
              <option value="altro">Altro</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Ordina per</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Più recenti</option>
              <option value="price-asc">Prezzo crescente</option>
              <option value="price-desc">Prezzo decrescente</option>
            </select>
          </div>
          
          <button className="reset-filters" onClick={resetFilters}>
            Reset filtri
          </button>
        </div>
      </div>
      
      <div className="filters-info">
        {filteredProducts.length > 0 ? (
          <p>Trovati {filteredProducts.length} prodotti</p>
        ) : (
          <p>Nessun prodotto trovato</p>
        )}
        
        <div className="sort-buttons">
          <button 
            className={sortBy === 'price-asc' ? 'active' : ''} 
            onClick={() => setSortBy('price-asc')}
          >
            <FontAwesomeIcon icon={faSortAmountUp} /> Prezzo
          </button>
          <button 
            className={sortBy === 'price-desc' ? 'active' : ''} 
            onClick={() => setSortBy('price-desc')}
          >
            <FontAwesomeIcon icon={faSortAmountDown} /> Prezzo
          </button>
        </div>
      </div>
      
      {filteredProducts.length > 0 ? (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div className="product-card" key={product._id}>
              <div className="product-image-container">
                <img 
                  src={product.images && product.images.length > 0 
                    ? product.images[currentImages[product._id] || 0] 
                    : 'https://placehold.co/400x400?text=Immagine+non+disponibile'} 
                  alt={product.name} 
                  onError={(e) => {
                    console.log("Errore caricamento immagine:", e.target.src);
                    e.target.onerror = null; 
                    e.target.src = 'https://placehold.co/400x400?text=Immagine+non+disponibile';
                  }}
                />
                
                {/* Navigazione tra immagini se ci sono più immagini */}
                {product.images && product.images.length > 1 && (
                  <>
                    <button 
                      className="image-nav-btn prev" 
                      onClick={(e) => {
                        e.preventDefault();
                        changeImage(product._id, 'prev');
                      }}
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <button 
                      className="image-nav-btn next" 
                      onClick={(e) => {
                        e.preventDefault();
                        changeImage(product._id, 'next');
                      }}
                    >
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                    <div className="image-navigation">
                      {product.images.map((_, index) => (
                        <div 
                          key={index} 
                          className={`image-dot ${(currentImages[product._id] || 0) === index ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentImages(prev => ({
                              ...prev,
                              [product._id]: index
                            }));
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                {product.customization && (
                  <div className="customizable-badge">
                    Personalizzabile
                  </div>
                )}
              </div>
              <div className="product-info">
                <div className="product-header">
                  <h3>{product.name}</h3>
                  <p className="product-price">€{product.price.toFixed(2)}</p>
                </div>
                <p className="product-category">{product.category}</p>
                <p className="product-description">{product.description}</p>
                <div className="product-actions">
                  <div className="circular-buttons">
                    <button 
                      className="btn-cart" 
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.inStock}
                      title="Aggiungi al carrello"
                    >
                      <FontAwesomeIcon icon={faCartPlus} />
                    </button>
                    
                    {product.customization && (
                      <Link to={`/products/${product._id}/customize`} className="btn-customize" title="Personalizza">
                        <FontAwesomeIcon icon={faEdit} />
                      </Link>
                    )}
                  </div>
                  
                  <Link to={`/products/${product._id}`} className="btn-details">
                    Dettagli
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-products">
          <p>Nessun prodotto corrisponde ai filtri selezionati.</p>
          <button className="btn btn-primary" onClick={resetFilters}>
            Mostra tutti i prodotti
          </button>
        </div>
      )}

      <CartNotification 
        message={notificationMessage}
        show={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
};

export default Products; 