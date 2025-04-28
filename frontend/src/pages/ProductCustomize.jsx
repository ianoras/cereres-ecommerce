import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { productService, authService } from '../services/api';
import '../styles/product-customize.css';
import axios from 'axios';

const ProductCustomize = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const fetchedRef = useRef(false);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [budget, setBudget] = useState('');
  const [customizationOptions, setCustomizationOptions] = useState({});
  
  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/products/${id}/customize` } });
    }
  }, [currentUser, id, navigate]);
  
  // Fetch product data
  useEffect(() => {
    // Se l'utente non è autenticato o abbiamo già caricato i dati, non fare nulla
    if (!currentUser || fetchedRef.current) return;
    
    // Imposta il flag per indicare che stiamo caricando i dati
    fetchedRef.current = true;
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productService.getById(id);
        const productData = response.data;
        
        if (!productData.customization) {
          setError('Questo prodotto non è personalizzabile');
          setLoading(false);
          return;
        }
        
        setProduct(productData);
        setTitle(`Personalizzazione: ${productData.name}`);
        setBudget(productData.price.toString());
        
        // Initialize customization options
        if (productData.customizationOptions && productData.customizationOptions.length > 0) {
          const options = {};
          productData.customizationOptions.forEach(option => {
            options[option.name] = '';
          });
          setCustomizationOptions(options);
        }
      } catch (err) {
        console.error('Errore caricamento prodotto:', err);
        setError('Errore nel caricamento del prodotto: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id, currentUser]);
  
  const handleOptionChange = (optionName, value) => {
    setCustomizationOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazione input
    if (!title.trim()) {
      setError('Il titolo è obbligatorio');
      return;
    }
    
    if (!details.trim()) {
      setError('I dettagli della richiesta sono obbligatori');
      return;
    }
    
    if (!budget.trim()) {
      setError('Il budget è obbligatorio');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      console.log('Preparazione invio richiesta personalizzazione...');
      
      const formData = new FormData();
      
      // Aggiungi i campi di base
      formData.append('title', title);
      formData.append('details', details);
      formData.append('budget', budget);
      
      // Aggiungi le opzioni di personalizzazione come stringa JSON
      if (Object.keys(customizationOptions).length > 0) {
        formData.append('customizationOptions', JSON.stringify(customizationOptions));
      }
      
      // Log dei dati da inviare per debug
      console.log('Invio richiesta di personalizzazione:', {
        productId: id,
        title,
        details,
        budget,
        options: customizationOptions
      });
      
      const response = await axios.post(
        `http://localhost:3001/api/custom-requests/client/products/${id}/customize`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('Risposta dal server:', response);
      
      if (response.data) {
        console.log('Richiesta inviata con successo:', response.data);
        setSubmitSuccess(true);
        
        // Reindirizza dopo 2 secondi
        setTimeout(() => {
          navigate('/custom-requests');
        }, 2000);
      } else {
        throw new Error('Risposta dal server non valida');
      }
    } catch (err) {
      console.error('Errore invio richiesta:', err);
      setError('Errore durante l\'invio della richiesta: ' + 
        (err.response?.data?.message || err.message || 'Si è verificato un errore imprevisto'));
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="customize-container">
        <div className="customize-loading">
          <div className="spinner"></div>
          <p>Caricamento prodotto...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="customize-container">
        <div className="customize-error">
          <h2>Si è verificato un errore</h2>
          <p>{error}</p>
          <Link to={`/products/${id}`} className="back-link">
            <FontAwesomeIcon icon={faArrowLeft} /> Torna al prodotto
          </Link>
        </div>
      </div>
    );
  }
  
  if (submitSuccess) {
    return (
      <div className="customize-container">
        <div className="customize-success">
          <h2>Richiesta inviata con successo!</h2>
          <p>Verrai reindirizzato alle tue richieste personalizzate...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="customize-container">
      <div className="customize-header">
        <Link to={`/products/${id}`} className="back-link">
          <FontAwesomeIcon icon={faArrowLeft} /> Torna al prodotto
        </Link>
        <h1>Personalizza questo prodotto</h1>
      </div>
      
      {product && (
        <div className="customize-content">
          <div className="product-summary">
            <div className="product-image">
              <img 
                src={product.images && product.images.length > 0 
                  ? product.images[0] 
                  : 'https://placehold.co/400x300?text=Immagine+non+disponibile'
                } 
                alt={product.name} 
              />
            </div>
            <div className="product-info">
              <h2>{product.name}</h2>
              <p className="product-price">Prezzo base: €{product.price.toFixed(2)}</p>
              <p className="product-description">{product.description}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="customize-form">
            <h3>Dettagli della personalizzazione</h3>
            
            <div className="form-group">
              <label htmlFor="title">Titolo della richiesta</label>
              <input 
                type="text" 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Inserisci un titolo per la tua richiesta"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="budget">Budget (€)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                id="budget" 
                value={budget} 
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Inserisci il tuo budget"
                required
              />
            </div>
            
            {product.customizationOptions && product.customizationOptions.length > 0 && (
              <div className="form-group customization-options">
                <h4>Opzioni di personalizzazione</h4>
                {product.customizationOptions.map((option, index) => (
                  <div className="option-item" key={index}>
                    <label htmlFor={`option-${index}`}>{option.name}</label>
                    {option.type === 'select' ? (
                      <select 
                        id={`option-${index}`}
                        value={customizationOptions[option.name] || ''}
                        onChange={(e) => handleOptionChange(option.name, e.target.value)}
                        required
                      >
                        <option value="">Seleziona un'opzione</option>
                        {option.options.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        id={`option-${index}`}
                        value={customizationOptions[option.name] || ''}
                        onChange={(e) => handleOptionChange(option.name, e.target.value)}
                        placeholder="Inserisci la tua preferenza"
                        required
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="details">Dettagli aggiuntivi</label>
              <textarea 
                id="details" 
                rows="4" 
                value={details} 
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Descrivi eventuali dettagli aggiuntivi sulla personalizzazione richiesta..."
              ></textarea>
            </div>
            
            <div className="form-group info-note">
              <div className="info-box">
                <h4>Nota sugli allegati:</h4>
                <p>Una volta inviata la richiesta, potrai allegare immagini e file di riferimento direttamente nella sezione messaggi della richiesta.</p>
                <p>Questo ti permetterà di condividere facilmente materiale visivo durante la conversazione con il nostro team.</p>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-submit" 
                disabled={submitting}
              >
                <FontAwesomeIcon icon={faPaperPlane} /> 
                {submitting ? 'Invio in corso...' : 'Invia richiesta'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductCustomize; 