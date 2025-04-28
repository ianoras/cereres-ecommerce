import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPaperPlane, faSpinner, faTimes, faComment } from '@fortawesome/free-solid-svg-icons';
import { formatDate } from './utils';
import AttachmentViewer from './AttachmentViewer';
import { toast } from 'react-hot-toast';
import { config } from '../../config';  // Importo il file di configurazione

const Conversation = ({ 
  conversation = [], 
  onSendMessage, 
  loading, 
  processingMessage,
  requestInfo = {} // Aggiungo un parametro per le info sulla richiesta
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [fileInputs, setFileInputs] = useState([]);
  
  // Funzione per aprire WhatsApp
  const openWhatsApp = () => {
    // Prendo il numero di telefono dal file di configurazione
    const phoneNumber = config.whatsappPhone;
    
    // Prepara il testo del messaggio con informazioni sulla richiesta
    let text = 'Buongiorno, vorrei informazioni sulla mia richiesta personalizzata';
    
    // Aggiungi dettagli della richiesta se disponibili
    if (requestInfo.title && requestInfo.id) {
      text += `\n\nRiferimento richiesta:\n- Titolo: "${requestInfo.title}"\n- ID: ${requestInfo.id}`;
    } else if (requestInfo.title) {
      text += `\n\nTitolo richiesta: "${requestInfo.title}"`;
    } else if (requestInfo.id) {
      text += `\n\nID richiesta: ${requestInfo.id}`;
    }
    
    if (requestInfo.status) {
      text += `\n- Stato attuale: ${requestInfo.status}`;
    }
    
    // Aggiungi un messaggio di chiusura
    text += '\n\nGrazie per l\'assistenza!';
    
    // Genera l'URL di WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    
    // Apri WhatsApp in una nuova finestra/scheda
    window.open(whatsappUrl, '_blank');
  };

  const handleSendMessage = (event) => {
    if (event) event.preventDefault();
    
    // Verifichiamo se ci sono file da allegare
    const hasFiles = fileInputs.some(input => input.files && input.files.length > 0);
    
    // Verifichiamo se c'è un messaggio di testo
    const hasText = newMessage.trim() !== '';
    
    // Il messaggio deve contenere o testo o almeno un allegato
    if (!hasText && !hasFiles) {
      toast.error('Il messaggio o un allegato sono obbligatori');
      return;
    }

    // Prepariamo i dati per il messaggio
    const messageData = new FormData();
    
    // Aggiungiamo il testo come 'text' solo se c'è
    if (hasText) {
      messageData.append('text', newMessage.trim());
    }
    
    // Aggiungiamo tutti i file come 'attachments'
    if (hasFiles) {
      for (const input of fileInputs) {
        if (input.files && input.files.length > 0) {
          for (let i = 0; i < input.files.length; i++) {
            const file = input.files[i];
            console.log(`Aggiungendo file al FormData: ${file.name} (${file.size} bytes, ${file.type})`);
            messageData.append('attachments', file);
          }
        }
      }
    }
    
    // Inviamo il messaggio
    onSendMessage(messageData);
    
    // Reset dei campi
    setNewMessage('');
    setFileInputs([]);
  };

  // Gestione dell'aggiunta di un campo file
  const addFileInput = () => {
    if (fileInputs.length < 3) {
      setFileInputs([...fileInputs, { id: Date.now(), files: [] }]);
    } else {
      toast.warning('Puoi allegare massimo 3 file');
    }
  };
  
  // Gestione della rimozione di un campo file
  const removeFileInput = (id) => {
    setFileInputs(fileInputs.filter(input => input.id !== id));
  };

  return (
    <div className="request-info-card">
      <div className="conversation-header">
        <h3>Conversazione</h3>
        <button 
          className="whatsapp-button" 
          onClick={openWhatsApp}
          title="Continua su WhatsApp"
        >
          <FontAwesomeIcon icon={faComment} /> Continua su WhatsApp
        </button>
      </div>
      <div className="messages-container">
        {conversation && conversation.length > 0 ? (
          <div className="messages-list">
            {conversation.map((msg, index) => (
              <div 
                key={index} 
                className={`message-item ${msg.sender === 'admin' ? 'admin-message' : 'client-message'}`}
              >
                <div className="message-header">
                  <span className="sender">{msg.sender === 'admin' ? 'Laboratorio' : 'Tu'}</span>
                  <span className="timestamp">{formatDate(msg.timestamp)}</span>
                </div>
                <div className="message-content">
                  {msg.content || msg.message}
                </div>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="message-attachments">
                    {console.log('Rendering attachments:', msg.attachments)}
                    {msg.attachments.map((att, i) => (
                      <div key={i} className="message-attachment">
                        <AttachmentViewer attachment={att} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-messages">Nessun messaggio nella conversazione. Usa il modulo qui sotto per inviare il primo messaggio.</p>
        )}
        
        <form onSubmit={handleSendMessage} className="new-message-form">
          <div className="form-group">
            <label htmlFor="newMessage">Nuovo Messaggio:</label>
            <textarea 
              id="newMessage"
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              className="form-control" 
              rows="3"
              placeholder="Scrivi un messaggio..."
            />
          </div>
          
          <div className="file-inputs-container">
            {fileInputs.map((input) => (
              <div key={input.id} className="file-input-wrapper">
                <input
                  type="file"
                  className="form-control-file"
                  accept="image/*"
                  onChange={(e) => {
                    const files = e.target.files;
                    console.log(`File selezionati (${files.length}):`, 
                      Array.from(files).map(f => ({
                        name: f.name,
                        size: f.size,
                        type: f.type
                      })));
                    
                    const updatedInputs = fileInputs.map(fi => {
                      if (fi.id === input.id) {
                        return { ...fi, files: files };
                      }
                      return fi;
                    });
                    setFileInputs(updatedInputs);
                  }}
                />
                <button 
                  type="button" 
                  className="btn btn-sm btn-danger" 
                  onClick={() => removeFileInput(input.id)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            ))}
            
            {fileInputs.length < 3 && (
              <button 
                type="button" 
                className="btn btn-sm btn-secondary add-file-btn" 
                onClick={addFileInput}
              >
                <FontAwesomeIcon icon={faPlus} /> Aggiungi Allegato
              </button>
            )}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary send-btn"
            disabled={(!newMessage.trim() && fileInputs.length === 0) || processingMessage}
          >
            {processingMessage ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Invio in corso...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} /> Invia Messaggio
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Conversation; 