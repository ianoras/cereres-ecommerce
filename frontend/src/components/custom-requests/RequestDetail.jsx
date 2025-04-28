import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { formatDate } from './utils';
import { createImageUrl } from './utils';
import StatusBadge from './StatusBadge';
import Conversation from './Conversation';
import Timeline from './Timeline';
import './RequestDetail.css';

const RequestDetail = ({ 
  request, 
  onClose, 
  onSendMessage, 
  processingMessage,
  onAcceptQuote,
  onRejectQuote,
  loading
}) => {
  if (!request) return null;

  const renderAttachment = (attachment) => {
    const isImage = attachment.mimetype?.startsWith('image/') || 
                   /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.filename);
    
    if (isImage) {
      const imageUrl = createImageUrl(attachment);
      return (
        <div className="image-attachment">
          <img 
            src={imageUrl} 
            alt={attachment.filename} 
            className="attachment-preview"
            onError={(e) => {
              console.error('Errore nel caricamento dell\'immagine:', e);
              e.target.src = 'https://placehold.co/400x400?text=Immagine+non+disponibile';
            }}
          />
          <div className="attachment-filename">{attachment.filename}</div>
        </div>
      );
    }
    
    return (
      <div className="file-attachment">
        <a href={createImageUrl(attachment)} download={attachment.filename}>
          <span className="file-icon">📎</span>
          <span className="file-name">{attachment.filename}</span>
        </a>
      </div>
    );
  };

  return (
    <div className="request-detail-container">
      <div className="request-detail-header">
        <button 
          className="btn btn-outline-secondary" 
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faTimes} /> Torna alla lista
        </button>
        <h2>{request.title}</h2>
        <div className="status-info">
          <StatusBadge status={request.status} />
          <span className="request-date">
            {formatDate(request.createdAt)}
          </span>
        </div>
      </div>
      
      <div className="request-detail-content">
        <div className="row">
          <div className="col-md-8">
            <div className="request-info-card">
              <h3>Dettagli della Richiesta</h3>
              <div className="request-info-content">
                <p><strong>Tipo:</strong> {request.requestType}</p>
                <p><strong>Descrizione:</strong></p>
                <p className="request-details">{request.details}</p>
                
                {request.productId && (
                  <div className="reference-product">
                    <p><strong>Prodotto di riferimento:</strong></p>
                    <div className="product-card">
                      <img 
                        src={request.productId.images?.[0] || '/placeholder.jpg'} 
                        alt={request.productId.name} 
                      />
                      <div>
                        <h4>{request.productId.name}</h4>
                        <p>€{request.productId.price}</p>
                        <Link to={`/products/${request.productId._id}`} className="btn btn-sm btn-outline-primary">
                          Visualizza
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                
                {request.budget && (
                  <p><strong>Budget indicativo:</strong> €{request.budget}</p>
                )}
                
                {request.materials && (
                  <div className="materials-info">
                    <p><strong>Materiali:</strong> {request.materials.providedByCustomer ? 'Forniti da te' : 'Forniti dal laboratorio'}</p>
                    {request.materials.description && (
                      <p><strong>Descrizione materiali:</strong> {request.materials.description}</p>
                    )}
                    {request.materials.status && (
                      <p><strong>Stato materiali:</strong> {request.materials.status}</p>
                    )}
                  </div>
                )}
                
                {request.attachments && request.attachments.length > 0 && (
                  <div className="attachments-container">
                    <h3>Allegati</h3>
                    <div className="attachments-list">
                      {request.attachments.map((attachment, index) => (
                        <div key={index} className="attachment-item">
                          {renderAttachment(attachment)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <Conversation 
              conversation={request.conversation} 
              onSendMessage={onSendMessage}
              loading={loading}
              processingMessage={processingMessage}
            />
          </div>
          
          <div className="col-md-4">
            <div className="request-info-card">
              <h3>Stato Richiesta</h3>
              <Timeline timeline={request.timelineEntries} />
            </div>
            
            {request.quote && request.status === 'quoted' && (
              <div className="request-info-card quote-actions-card">
                <h3>Preventivo Proposto</h3>
                <div className="quote-info">
                  <p><strong>Importo:</strong> €{request.quote.amount}</p>
                  {request.quote.description && (
                    <p><strong>Descrizione:</strong> {request.quote.description}</p>
                  )}
                  {request.quote.validUntil && (
                    <p><strong>Valido fino al:</strong> {formatDate(request.quote.validUntil)}</p>
                  )}
                </div>
                <div className="quote-actions">
                  <button 
                    className="btn btn-success" 
                    onClick={onAcceptQuote}
                    disabled={loading}
                  >
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />} Accetta
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={onRejectQuote}
                    disabled={loading}
                  >
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTimes} />} Rifiuta
                  </button>
                </div>
              </div>
            )}
            
            <NextStepInfo 
              status={request.status} 
              adminAccepted={request.timelineEntries?.some(entry => 
                entry.status === 'accepted' && 
                entry.actor === 'admin' && 
                entry.notes?.includes('amministratore ha accettato')
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente per visualizzare informazioni sul prossimo passo
const NextStepInfo = ({ status, adminAccepted }) => {
  const getNextStep = (status, adminAccepted) => {
    switch (status) {
      case 'pending':
        return "Il tuo progetto è stato inviato. I nostri designer lo stanno valutando. Riceverai una notifica quando inizieranno ad analizzare la tua richiesta.";
      case 'in_progress':
        return "Stiamo analizzando attentamente la tua richiesta. Il nostro team sta valutando i dettagli e preparerà presto un preventivo personalizzato.";
      case 'quoted':
        return "Ti abbiamo inviato un preventivo dettagliato. Puoi accettarlo per procedere con il progetto o rifiutarlo se desideri modifiche. Il preventivo è valido per 7 giorni.";
      case 'accepted':
        if (adminAccepted) {
          return "L'amministratore ha accettato il tuo preventivo. Il nostro team ha iniziato a lavorare sul tuo progetto. Riceverai aggiornamenti sull'avanzamento dei lavori.";
        } else {
          return "Grazie per aver approvato il preventivo! Il nostro team ha iniziato a lavorare sul tuo progetto. Riceverai aggiornamenti sull'avanzamento dei lavori.";
        }
      case 'rejected':
        return "Hai rifiutato il preventivo. Se desideri procedere con il progetto, puoi contattarci per discutere modifiche o un nuovo preventivo.";
      case 'completed':
        return "Il tuo progetto è stato completato con successo! A breve riceverai informazioni sulla spedizione. Grazie per aver scelto i nostri servizi.";
      case 'cancelled':
        return "La richiesta è stata annullata. Se desideri procedere con un nuovo progetto, non esitare a crearne uno nuovo dal nostro catalogo.";
      default:
        return "Stato non riconosciuto. Per favore, contatta il supporto per assistenza.";
    }
  };
  
  return (
    <div className="request-info-card">
      <h3>Prossimo Passo</h3>
      <div className="next-step-container">
        <p>{getNextStep(status, adminAccepted)}</p>
      </div>
    </div>
  );
};

export default RequestDetail; 