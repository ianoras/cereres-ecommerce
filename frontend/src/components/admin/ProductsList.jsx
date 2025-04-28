import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faEye, faCheck, faTimes, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';

const ProductsList = ({ products, onEdit, onDelete, loading }) => {
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const sortProducts = (a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'date':
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
        break;
      default:
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  };
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  const getSortIcon = (field) => {
    if (sortBy !== field) return <FontAwesomeIcon icon={faSort} />;
    if (sortOrder === 'asc') return <FontAwesomeIcon icon={faSortUp} />;
    return <FontAwesomeIcon icon={faSortDown} />;
  };
  
  const filterProducts = () => {
    return products.filter(product => {
      // Filtro per nome
      const nameMatch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtro per categoria
      const categoryMatch = !categoryFilter || product.category === categoryFilter;
      
      return nameMatch && categoryMatch;
    });
  };
  
  const filteredProducts = filterProducts().sort(sortProducts);
  
  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Caricamento prodotti...</p>
      </div>
    );
  }
  
  if (products.length === 0) {
    return <div className="no-data">Nessun prodotto disponibile.</div>;
  }
  
  // Ottieni categorie uniche
  const categories = ['', ...new Set(products.map(p => p.category))];
  
  return (
    <div className="admin-products-list">
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Cerca prodotti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="category-filter">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Tutte le categorie</option>
            {categories.filter(Boolean).map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Immagine</th>
              <th onClick={() => handleSort('name')} className="sortable">
                Nome {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('price')} className="sortable">
                Prezzo {getSortIcon('price')}
              </th>
              <th onClick={() => handleSort('category')} className="sortable">
                Categoria {getSortIcon('category')}
              </th>
              <th>Disponibile</th>
              <th>Personalizzabile</th>
              <th onClick={() => handleSort('date')} className="sortable">
                Data creazione {getSortIcon('date')}
              </th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product._id}>
                <td>
                  <div className="product-image-preview">
                    <img
                      src={product.images && product.images.length > 0 
                        ? product.images[0]
                        : 'https://placehold.co/100x100?text=No+image'}
                      alt={product.name}
                    />
                  </div>
                </td>
                <td>{product.name}</td>
                <td>€{product.price.toFixed(2)}</td>
                <td>{product.category}</td>
                <td className="text-center">
                  {product.inStock ? (
                    <FontAwesomeIcon icon={faCheck} className="icon-success" />
                  ) : (
                    <FontAwesomeIcon icon={faTimes} className="icon-danger" />
                  )}
                </td>
                <td className="text-center">
                  {product.customization ? (
                    <FontAwesomeIcon icon={faCheck} className="icon-success" />
                  ) : (
                    <FontAwesomeIcon icon={faTimes} className="icon-danger" />
                  )}
                </td>
                <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="table-actions">
                    <button 
                      className="btn-icon btn-view" 
                      title="Visualizza prodotto"
                      onClick={() => window.open(`/products/${product._id}`, '_blank')}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button 
                      className="btn-icon btn-edit" 
                      title="Modifica prodotto"
                      onClick={() => onEdit(product)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      className="btn-icon btn-delete" 
                      title="Elimina prodotto"
                      onClick={() => onDelete(product._id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <div className="total-items">
          Totale: {filteredProducts.length} prodotti
        </div>
      </div>
    </div>
  );
};

export default ProductsList; 