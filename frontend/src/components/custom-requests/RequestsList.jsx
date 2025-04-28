import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFileAlt, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import StatusBadge from './StatusBadge';
import { formatDate } from './utils';

const RequestsList = ({ requests, loading, onViewRequest, onReload }) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p className="mt-3">Caricamento richieste...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="no-requests-container">
        <FontAwesomeIcon icon={faFileAlt} size="4x" className="mb-3" />
        <h3>Nessuna richiesta personalizzata</h3>
        <p>Non hai ancora inviato nessuna richiesta di prodotto personalizzato.</p>
        <p>Scegli un prodotto dal nostro catalogo e personalizzalo secondo le tue esigenze!</p>
        <Link to="/products" className="btn btn-primary">
          Sfoglia il Catalogo
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="requests-header">
        <p>Qui puoi visualizzare tutte le tue richieste di prodotti personalizzati e upcycling.</p>
        <div className="button-group">
          <button onClick={onReload} className="btn btn-secondary me-2">
            <FontAwesomeIcon icon={faSpinner} className={loading ? "fa-spin" : ""} /> Ricarica
          </button>
          <Link to="/products" className="btn btn-primary">
            <FontAwesomeIcon icon={faPlus} /> Nuova Richiesta
          </Link>
        </div>
      </div>
      
      <div className="requests-list">
        <div className="row">
          {requests.map(request => (
            <div key={request._id} className="col-md-6 col-lg-4 mb-4">
              <div className="request-card">
                <div className="request-card-header">
                  <h3>{request.title}</h3>
                  <StatusBadge status={request.status} />
                </div>
                <div className="request-card-body">
                  <p><strong>Data:</strong> {formatDate(request.createdAt)}</p>
                  <p className="request-details-preview">
                    {request.description?.length > 100 
                      ? `${request.description.substring(0, 100)}...` 
                      : request.description || request.details}
                  </p>
                  <p><strong>Budget:</strong> €{request.budget}</p>
                </div>
                <div className="request-card-footer">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => onViewRequest(request._id)}
                  >
                    <FontAwesomeIcon icon={faEye} /> Visualizza
                  </button>
                  {request.status === 'quoted' && (
                    <span className="new-quote-badge">
                      Nuovo Preventivo
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default RequestsList; 