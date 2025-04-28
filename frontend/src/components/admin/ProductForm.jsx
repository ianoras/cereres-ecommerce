import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faTimes, faUpload, faSave, faTrash 
} from '@fortawesome/free-solid-svg-icons';

const ProductForm = ({ product, isEditing, onSubmit, loading }) => {
  const initialFormData = {
    name: '',
    description: '',
    price: '',
    category: '',
    inStock: true,
    customization: false,
    customizationOptions: [],
    images: []
  };

  const [formData, setFormData] = useState(initialFormData);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [newOption, setNewOption] = useState({ name: '', options: [] });
  const [newOptionValue, setNewOptionValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Inizializza il form con i dati del prodotto da modificare
  useEffect(() => {
    if (isEditing && product) {
      console.log('Initializing form with product:', product);
      setFormData({
        ...product,
        price: product.price.toString()
      });
      
      // Prepara le immagini esistenti per l'anteprima
      if (product.images && product.images.length > 0) {
        setImagePreviewUrls(product.images);
      }
    }
  }, [isEditing, product]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    console.log(`Field changed: ${name} = ${value}`, type === 'checkbox' ? checked : value);
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Cancella l'errore di validazione quando l'utente modifica il campo
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleImageUpload = (e) => {
    e.preventDefault();
    const files = Array.from(e.target.files);
    
    if (!files.length) return;
    
    // Aggiunge i nuovi file alla lista esistente
    setImageFiles(prev => [...prev, ...files]);
    
    // Crea e aggiunge le URL di anteprima per i nuovi file
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };
  
  const removeImage = (index) => {
    // Rimuove il file e l'anteprima all'indice specificato
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    
    // Se stiamo modificando un prodotto esistente, rimuoviamo anche l'URL dell'immagine
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    
    // Aggiorna il formData rimuovendo l'immagine
    if (isEditing && index < formData.images.length) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };
  
  const addCustomizationOption = () => {
    if (!newOption.name.trim()) {
      setValidationErrors(prev => ({
        ...prev,
        newOption: 'Il nome dell\'opzione non può essere vuoto'
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      customizationOptions: [
        ...prev.customizationOptions,
        { ...newOption, options: [...newOption.options] } // Crea una copia profonda
      ]
    }));
    
    // Reset del form
    setNewOption({ name: '', options: [] });
    setNewOptionValue('');
    setValidationErrors(prev => ({ ...prev, newOption: null }));
  };
  
  const addOptionValue = () => {
    if (!newOptionValue.trim()) return;
    
    setNewOption(prev => ({
      ...prev,
      options: [...prev.options, newOptionValue.trim()]
    }));
    
    setNewOptionValue('');
  };
  
  const removeOptionValue = (index) => {
    setNewOption(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };
  
  const removeCustomizationOption = (index) => {
    setFormData(prev => ({
      ...prev,
      customizationOptions: prev.customizationOptions.filter((_, i) => i !== index)
    }));
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Il nome del prodotto è richiesto';
    if (!formData.description.trim()) errors.description = 'La descrizione è richiesta';
    if (!formData.price.trim()) errors.price = 'Il prezzo è richiesto';
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errors.price = 'Il prezzo deve essere un numero maggiore di 0';
    }
    if (!formData.category) errors.category = 'La categoria è richiesta';
    
    if (formData.customization && formData.customizationOptions.length === 0) {
      errors.customizationOptions = 'Devi specificare almeno un\'opzione di personalizzazione';
    }
    
    if (!isEditing && imageFiles.length === 0) {
      errors.images = 'Devi caricare almeno un\'immagine';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    console.log('Form submission - form data before processing:', formData);
    
    // Crea FormData per inviare il prodotto e le immagini
    const productFormData = new FormData();
    
    try {
      // Aggiungi i campi principali esplicitamente
      productFormData.append('name', formData.name);
      productFormData.append('description', formData.description || '');
      productFormData.append('price', formData.price);
      productFormData.append('category', formData.category);
      productFormData.append('inStock', formData.inStock.toString());
      productFormData.append('customization', formData.customization.toString());
      
      // Aggiungi l'ID se stiamo modificando
      if (isEditing && formData._id) {
          productFormData.append('id', formData._id);
      }
      
      // Aggiungi le opzioni di personalizzazione come JSON
      if (formData.customization && formData.customizationOptions.length > 0) {
          productFormData.append('customizationOptions', JSON.stringify(formData.customizationOptions));
      } else {
          productFormData.append('customizationOptions', JSON.stringify([]));
      }
      
      // Aggiungi le immagini (solo i nuovi file)
      imageFiles.forEach(file => {
          productFormData.append('images', file);
      });
      
      // Aggiungi le immagini esistenti (se modifica)
      if (isEditing && formData.images && formData.images.length > 0) {
          productFormData.append('existingImages', JSON.stringify(formData.images));
      }
      
      // Stampa i dati per debug
      console.log("Dati inviati al server - Categorie: ", formData.category);
      console.log("Dati inviati al server - Personalizzabile: ", formData.customization.toString());
      
      const entries = [];
      for(var pair of productFormData.entries()) {
          if (pair[0] !== 'images') { // Non logghiamo il blob delle immagini
              entries.push(pair[0] + ': ' + pair[1]);
          }
      }
      console.log("FormData completo:", entries);
      console.log("Numero di nuove immagini:", imageFiles.length);
      console.log("Numero di immagini esistenti:", formData.images ? formData.images.length : 0);
      
      // Verifica se il FormData è vuoto
      if (entries.length === 0) {
        throw new Error('Errore: Nessun dato da inviare nel FormData');
      }
      
      // Passa alla funzione onSubmit l'ID del prodotto se stiamo modificando
      if (isEditing && product && product._id) {
          onSubmit(productFormData, !isEditing, product._id);
      } else {
          onSubmit(productFormData, !isEditing);
      }
    } catch (error) {
      console.error('Errore nella preparazione dei dati del form:', error);
      alert('Si è verificato un errore nella preparazione dei dati. Riprova.');
    }
  };
  
  return (
    <div className="product-form">
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Nome del prodotto *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={validationErrors.name ? 'error' : ''}
              disabled={loading}
            />
            {validationErrors.name && (
              <div className="error-message">{validationErrors.name}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Categoria *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={validationErrors.category ? 'error' : ''}
              disabled={loading}
            >
              <option value="">Seleziona categoria</option>
              <option value="borse">Borse</option>
              <option value="guanti">Guanti</option>
              <option value="abbigliamento">Abbigliamento</option>
              <option value="cappelli">Cappelli</option>
              <option value="accessori">Accessori</option>
              <option value="altro">Altro</option>
            </select>
            {validationErrors.category && (
              <div className="error-message">{validationErrors.category}</div>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Prezzo (€) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              className={validationErrors.price ? 'error' : ''}
              disabled={loading}
            />
            {validationErrors.price && (
              <div className="error-message">{validationErrors.price}</div>
            )}
          </div>
          
          <div className="form-group checkbox-group">
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="inStock"
                name="inStock"
                checked={formData.inStock}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="inStock">Disponibile</label>
            </div>
            
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="customization"
                name="customization"
                checked={formData.customization}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="customization">Personalizzabile</label>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Descrizione *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            className={validationErrors.description ? 'error' : ''}
            disabled={loading}
          ></textarea>
          {validationErrors.description && (
            <div className="error-message">{validationErrors.description}</div>
          )}
        </div>
        
        <div className="form-group images-upload">
          <label>Immagini del prodotto *</label>
          <div className="upload-container">
            <label htmlFor="images" className="upload-btn">
              <FontAwesomeIcon icon={faUpload} /> Carica immagini
            </label>
            <input
              type="file"
              id="images"
              name="images"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="file-input"
              disabled={loading}
            />
          </div>
          
          {validationErrors.images && (
            <div className="error-message">{validationErrors.images}</div>
          )}
          
          {imagePreviewUrls.length > 0 && (
            <div className="image-previews">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="image-preview-item">
                  <img src={url} alt={`Anteprima ${index + 1}`} />
                  <button 
                    type="button"
                    className="remove-image" 
                    onClick={() => removeImage(index)}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {formData.customization && (
          <div className="customization-section">
            <h3>Opzioni di personalizzazione</h3>
            
            {validationErrors.customizationOptions && (
              <div className="error-message">{validationErrors.customizationOptions}</div>
            )}
            
            {formData.customizationOptions.length > 0 && (
              <div className="customization-options-list">
                {formData.customizationOptions.map((option, index) => (
                  <div key={index} className="customization-option-item">
                    <div className="option-header">
                      <h4>{option.name}</h4>
                      <button 
                        type="button" 
                        className="btn-icon" 
                        onClick={() => removeCustomizationOption(index)}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                    
                    <div className="option-values">
                      {option.options.length > 0 ? (
                        <ul>
                          {option.options.map((val, i) => (
                            <li key={i}>{val}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="no-values">Testo libero (nessun valore predefinito)</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="add-customization-option">
              <h4>Aggiungi nuova opzione</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="optionName">Nome opzione *</label>
                  <input
                    type="text"
                    id="optionName"
                    value={newOption.name}
                    onChange={(e) => setNewOption(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Es: Colore, Dimensione, Materiale..."
                    className={validationErrors.newOption ? 'error' : ''}
                    disabled={loading}
                  />
                  {validationErrors.newOption && (
                    <div className="error-message">{validationErrors.newOption}</div>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group option-values-input">
                  <label>Valori predefiniti (opzionale)</label>
                  <div className="option-value-add">
                    <input
                      type="text"
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value)}
                      placeholder="Inserisci un valore e premi '+'"
                      disabled={loading}
                    />
                    <button 
                      type="button" 
                      className="btn-icon" 
                      onClick={addOptionValue}
                      disabled={!newOptionValue.trim() || loading}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                  <p className="help-text">
                    Se lasci vuoto l'elenco, il cliente potrà inserire un testo libero.
                  </p>
                </div>
              </div>
              
              {newOption.options.length > 0 && (
                <div className="option-values-preview">
                  <label>Valori aggiunti:</label>
                  <ul>
                    {newOption.options.map((value, index) => (
                      <li key={index}>
                        {value}
                        <button 
                          type="button" 
                          className="btn-icon" 
                          onClick={() => removeOptionValue(index)}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={addCustomizationOption}
                disabled={!newOption.name.trim() || loading}
              >
                <FontAwesomeIcon icon={faPlus} /> Aggiungi opzione
              </button>
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{
              fontSize: '1.1rem',
              padding: '0.8rem 1.5rem',
              minWidth: '200px',
            }}
          >
            <FontAwesomeIcon icon={faSave} style={{marginRight: '8px'}} />
            {loading ? 'Salvataggio in corso...' : (isEditing ? 'Aggiorna prodotto' : 'Crea prodotto')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm; 