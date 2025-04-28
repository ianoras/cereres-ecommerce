import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faTruck, faHandHoldingHeart, faChevronLeft, faChevronRight, faLeaf, faRecycle } from '@fortawesome/free-solid-svg-icons';
import '../styles/home.css'; // Importo gli stili della home page
// Importiamo le immagini necessarie
import book8 from '../images/book_8.jpg';
import workshop from '../images/book_8.jpg';
// Importiamo il servizio API per recuperare i prodotti
import { productService } from '../services/api';

const Home = () => {
  // Stato per i prodotti in evidenza
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Stato per tenere traccia dell'indice dell'immagine corrente per ogni prodotto
  const [currentImageIndices, setCurrentImageIndices] = useState({});

  // Recupera i prodotti dal backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('Recupero prodotti per la home page...');
        const response = await productService.getAll(new Date().getTime());
        console.log('Prodotti ricevuti:', response.data);
        
        // Prendiamo i primi 3 prodotti invece di 4
        const products = response.data.slice(0, 3);
        console.log('Primi 3 prodotti selezionati:', products);

        if (products.length > 0) {
          // Log per debug
          products.forEach(product => {
            console.log(`Prodotto: ${product.name}, Immagini:`, product.images);
          });
        }

        setFeaturedProducts(products);
        
        // Inizializza gli indici delle immagini correnti
        const initialIndices = {};
        products.forEach(product => {
          initialIndices[product._id] = 0;
        });
        setCurrentImageIndices(initialIndices);
        
        setLoading(false);
      } catch (err) {
        console.error('Errore nel recupero dei prodotti:', err);
        setError('Impossibile caricare i prodotti. Riprova più tardi.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Funzione per passare all'immagine successiva
  const nextImage = (productId, e) => {
    e.preventDefault(); // Previene la navigazione del link
    const product = featuredProducts.find(p => p._id === productId);
    if (product && product.images.length > 1) {
      setCurrentImageIndices(prev => ({
        ...prev,
        [productId]: (prev[productId] + 1) % product.images.length
      }));
    }
  };

  // Funzione per passare all'immagine precedente
  const prevImage = (productId, e) => {
    e.preventDefault(); // Previene la navigazione del link
    const product = featuredProducts.find(p => p._id === productId);
    if (product && product.images.length > 1) {
      setCurrentImageIndices(prev => ({
        ...prev,
        [productId]: (prev[productId] - 1 + product.images.length) % product.images.length
      }));
    }
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-images">
          <div className="hero-image-left">
            <img src={book8} alt="Cereres collezione" />
          </div>
          <div className="hero-image-right">
            <img src="/images/home_2.jpeg" alt="Cereres collezione" />
          </div>
        </div>
        <div className="hero-content">
          <h1>Cereres</h1>
          <p>Arte e passione <span>in ogni</span> creazione</p>
          <Link to="/products" className="cta-button">SCOPRI LE COLLEZIONI</Link>
        </div>
      </section>

      {/* Prodotti in Evidenza */}
      <section className="featured-products">
        <div className="container">
          <h2 className="section-title">Le Nostre Creazioni</h2>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Caricamento prodotti in corso...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className={`products-grid ${featuredProducts.length < 4 ? 'products-grid-centered' : ''}`}>
                {featuredProducts.map(product => (
                  <div className="product-card" key={product._id}>
                    <div className="product-image-container">
                      <img 
                        src={product.images && product.images.length > 0 
                          ? product.images[currentImageIndices[product._id] || 0]
                          : 'https://placehold.co/400x400?text=Immagine+non+disponibile'} 
                        alt={product.name}
                        onError={(e) => {
                          console.log("Errore caricamento immagine:", e.target.src);
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/400x400?text=Immagine+non+disponibile';
                        }}
                      />
                      
                      {product.images && product.images.length > 1 && (
                        <>
                          <button 
                            className="image-nav-btn prev" 
                            onClick={(e) => {
                              e.preventDefault();
                              prevImage(product._id, e);
                            }}
                          >
                            <FontAwesomeIcon icon={faChevronLeft} />
                          </button>
                          <button 
                            className="image-nav-btn next" 
                            onClick={(e) => {
                              e.preventDefault();
                              nextImage(product._id, e);
                            }}
                          >
                            <FontAwesomeIcon icon={faChevronRight} />
                          </button>
                          <div className="image-navigation">
                            {product.images.map((_, index) => (
                              <div 
                                key={index} 
                                className={`image-dot ${(currentImageIndices[product._id] || 0) === index ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentImageIndices(prev => ({
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
                        <p className="product-price">€{Number(product.price).toFixed(2)}</p>
                      </div>
                      <p className="product-category">{product.category}</p>
                      <div className="product-actions">
                        <Link to={`/products/${product._id}`} className="btn-details">
                          Dettagli
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="center-button">
                <Link to="/products" className="btn btn-primary">Scopri tutte le creazioni</Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Chi Siamo */}
      <section className="about-preview">
        <div className="container">
          <div className="about-grid">
            <div className="about-image">
              <img src="/images/chisiamo.jpeg" alt="Il nostro laboratorio" />
            </div>
            <div className="about-content">
              <h2>Chi Siamo</h2>
              <p>
              Cereres è il punto dove creatività, sostenibilità e mindfulness si incontrano. Realizziamo pezzi unici usando materiali riciclati, ma l'uncinetto per noi è anche un momento di pausa. Ogni punto è un invito a fermarsi, concentrarsi e trovare calma. Qui, fare crochet è un modo per prenderci cura di noi stessi e dell'ambiente
              </p>
              <Link to="/about" className="btn btn-outline">Scopri di più</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Servizi */}
      <section className="services">
        <div className="container">
          <h2 className="section-title">Il Nostro Impegno</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">
                <FontAwesomeIcon icon={faLeaf} />
              </div>
              <h3>Sostenibilità</h3>
              <p>Ogni creazione è pensata per ridurre l'impatto ambientale, scegliendo tecniche e materiali che rispettano il pianeta e valorizzano l'uso consapevole delle risorse.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <FontAwesomeIcon icon={faRecycle} />
              </div>
              <h3>Upcycling Creativo</h3>
              <p>Trasformiamo vecchi capi e materiali in filati unici, ridando vita a ciò che sarebbe altrimenti scartato. Ogni progetto è una nuova opportunità di reinventare il passato.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <FontAwesomeIcon icon={faHandHoldingHeart} />
              </div>
              <h3>Design Artigianale e Unicità</h3>
              <p>Ogni pezzo è fatto a mano, con passione e cura per i dettagli.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <div className="container">
          <h2>Hai un'idea speciale in mente?</h2>
          <p>Contattaci per una creazione personalizzata</p>
          <Link to="/about" className="btn btn-light">Contattaci</Link>
        </div>
      </section>
    </main>
  );
};

export default Home; 