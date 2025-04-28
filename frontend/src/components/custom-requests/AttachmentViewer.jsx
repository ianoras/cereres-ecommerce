import React from 'react';
import { createImageUrl, isImage } from './utils';

const AttachmentViewer = ({ attachment }) => {
  console.log('AttachmentViewer ricevuto:', attachment);
  
  // Se è null o indefinito
  if (!attachment) {
    console.log('Allegato nullo o indefinito');
    return <span>Allegato non disponibile</span>;
  }
  
  // Ottieni l'URL dell'allegato
  const url = createImageUrl(attachment);
  console.log('URL risultante:', url);
  
  // Se l'URL è null, mostra solo il nome del file
  if (!url) {
    return (
      <div className="attachment-fallback">
        <i className="fas fa-file"></i>
        <span>{attachment.filename || 'Allegato'}</span>
      </div>
    );
  }
  
  // Se è un'immagine, mostra l'anteprima
  if (isImage(attachment)) {
    return (
      <div className="image-preview">
        <img 
          src={url} 
          alt={attachment.filename || 'Immagine'} 
          onError={(e) => {
            console.error('Errore nel caricamento dell\'immagine:', e);
            e.target.src = renderImageFallback(attachment.mimetype);
          }}
        />
        <a href={url} target="_blank" rel="noopener noreferrer" className="download-link">
          <i className="fas fa-download"></i>
        </a>
      </div>
    );
  }
  
  // Per altri tipi di file, mostra un link per il download
  return (
    <div className="file-attachment">
      <i className="fas fa-file"></i>
      <span>{attachment.filename || 'Allegato'}</span>
      <a href={url} target="_blank" rel="noopener noreferrer" className="download-link">
        <i className="fas fa-download"></i>
      </a>
    </div>
  );
};

// Funzione helper per visualizzare un'icona di fallback quando l'immagine non può essere caricata
const renderImageFallback = (fileType) => {
  // Usa placehold.co come fallback generico per qualsiasi tipo di file
  return 'https://placehold.co/400x400?text=File+non+visualizzabile';
};

export default AttachmentViewer; 