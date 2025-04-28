import React from 'react';
import { formatDate } from './utils';

const Timeline = ({ timeline }) => {
  if (!timeline?.length) return null;

  // Filtra le voci ridondanti e migliora il formato dei messaggi
  const filteredTimeline = timeline.filter(entry => {
    // Rimuovi aggiornamenti di stato ridondanti (stesso stato iniziale e finale)
    if (entry.notes && entry.notes.includes('Stato aggiornato da')) {
      const match = entry.notes.match(/Stato aggiornato da "(.*)" a "(.*)"/);
      if (match && match[1] === match[2]) {
        return false; // Rimuovi questa voce
      }
    }
    return true;
  });

  // Funzione per ottenere un messaggio più user-friendly per le note
  const getUserFriendlyNotes = (entry) => {
    if (!entry.notes) return null;
    
    // Sostituisci i messaggi tecnici di aggiornamento stato con quelli più amichevoli
    if (entry.notes.includes('Stato aggiornato da')) {
      const match = entry.notes.match(/Stato aggiornato da "(.*)" a "(.*)"/);
      if (match) {
        const initialStatus = match[1];
        const newStatus = match[2];
        
        // Mappa degli stati in italiano
        const statusMap = {
          'pending': 'In attesa',
          'in_progress': 'In lavorazione',
          'quoted': 'Preventivo inviato',
          'accepted': 'Approvata',
          'rejected': 'Rifiutata',
          'completed': 'Completata',
          'cancelled': 'Annullata'
        };
        
        // Se gli stati sono gli stessi, mostra solo un messaggio di aggiornamento generico
        if (initialStatus === newStatus) {
          return `Stato aggiornato: ${statusMap[newStatus] || newStatus}`;
        }
        
        // Altrimenti mostra la transizione di stato
        return `Stato aggiornato da "${statusMap[initialStatus] || initialStatus}" a "${statusMap[newStatus] || newStatus}"`;
      }
    }
    
    // Restituisci la nota originale per altri tipi di note
    return entry.notes;
  };

  return (
    <div className="timeline">
      {filteredTimeline.map((entry, index) => {
        // Determina il testo dello stato in italiano
        let statusText = '';
        switch (entry.status) {
          case 'pending':
            statusText = 'In attesa';
            break;
          case 'in_progress':
            statusText = 'In lavorazione';
            break;
          case 'quoted':
            statusText = 'Preventivo inviato';
            break;
          case 'accepted':
            statusText = 'Preventivo accettato';
            break;
          case 'rejected':
            statusText = 'Preventivo rifiutato';
            break;
          case 'completed':
            statusText = 'Richiesta completata';
            break;
          case 'cancelled':
            statusText = 'Richiesta annullata';
            break;
          default:
            statusText = entry.title || `Stato: ${entry.status}`;
        }

        // Formatta la data
        const formattedDate = formatDate(entry.date);

        // Determina la classe CSS in base allo stato
        let statusClass = '';
        switch (entry.status) {
          case 'pending':
            statusClass = 'status-pending';
            break;
          case 'in_progress':
            statusClass = 'status-in-progress';
            break;
          case 'quoted':
            statusClass = 'status-quoted';
            break;
          case 'accepted':
            statusClass = 'status-accepted';
            break;
          case 'rejected':
            statusClass = 'status-rejected';
            break;
          case 'completed':
            statusClass = 'status-completed';
            break;
          case 'cancelled':
            statusClass = 'status-cancelled';
            break;
          default:
            statusClass = 'status-default';
        }

        // Ottieni le note formattate per l'utente
        const userFriendlyNotes = getUserFriendlyNotes(entry);

        return (
          <div key={index} className={`timeline-item ${statusClass}`}>
            <div className="timeline-date">{formattedDate}</div>
            <div className="timeline-content">
              <h4 className="timeline-title">{statusText}</h4>
              {userFriendlyNotes && <p className="timeline-description">{userFriendlyNotes}</p>}
              <p className="timeline-actor">
                {entry.actor === 'admin' ? 'Amministratore' : entry.actor === 'client' ? 'Cliente' : 'Sistema'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline; 