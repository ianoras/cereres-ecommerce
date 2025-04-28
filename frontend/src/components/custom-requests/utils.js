// Funzione per formattare la data
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    // Verifica se la data è valida
    if (isNaN(date.getTime())) {
      return 'Data non valida';
    }
    
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Errore nel formato della data:', error);
    return 'Data non valida';
  }
};

// Funzione di utility per creare URL per le immagini in base al formato dei dati
export const createImageUrl = (attachment) => {
  console.log('createImageUrl ricevuto:', attachment);
  
  // Se l'allegato ha già un URL, lo usiamo
  if (attachment.url) {
    console.log('Uso URL pre-esistente:', attachment.url);
    // Aggiungiamo il dominio del backend se l'URL è relativo
    if (attachment.url.startsWith('/')) {
      // Usiamo un URL hardcoded per il backend in sviluppo
      const backendUrl = 'http://localhost:3001';
      const fullUrl = `${backendUrl}${attachment.url}`;
      console.log('URL completo:', fullUrl);
      return fullUrl;
    }
    return attachment.url;
  }
  
  // Se l'allegato ha un path, costruiamo l'URL
  if (attachment.path) {
    const backendUrl = 'http://localhost:3001';
    const filename = attachment.path.split(/[/\\]/).pop();
    return `${backendUrl}/uploads/custom-requests/${filename}`;
  }
  
  // Se l'allegato ha i dati binari, creiamo un Blob
  if (attachment.data) {
    console.log('Creo Blob da array di dati (' + attachment.data.length + ' byte)');
    const blob = new Blob([new Uint8Array(attachment.data)], { type: attachment.mimetype });
    const url = URL.createObjectURL(blob);
    console.log('URL oggetto creato:', url);
    return url;
  }
  
  // Se l'allegato ha solo il filename, proviamo a costruire l'URL
  if (attachment.filename) {
    const backendUrl = 'http://localhost:3001';
    return `${backendUrl}/uploads/custom-requests/${encodeURIComponent(attachment.filename)}`;
  }
  
  console.error('Allegato non valido:', attachment);
  return null;
};

// Funzione per determinare se un attachment è un'immagine
export const isImage = (attachment) => {
  console.log('isImage check:', { 
    attachment,
    hasMimetype: !!attachment.mimetype,
    mimetypeIsImage: attachment.mimetype && attachment.mimetype.startsWith('image/'),
    hasUrl: !!attachment.url,
    hasData: !!attachment.data
  });

  if (attachment.mimetype && attachment.mimetype.startsWith('image/')) {
    return true;
  }
  
  if (attachment.url) {
    const url = attachment.url.toLowerCase();
    return url.endsWith('.jpg') || url.endsWith('.jpeg') || 
           url.endsWith('.png') || url.endsWith('.gif') || 
           url.endsWith('.webp') || url.endsWith('.svg');
  }
  
  // Se non c'è mimetype ma ci sono dati, assumiamo che sia un'immagine
  if (attachment.data && !attachment.mimetype) {
    console.log('Attachment ha data ma non mimetype, assunto come immagine');
    return true;
  }
  
  return false;
};

// Funzione per ottenere il testo dello stato in italiano
export const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'In attesa';
    case 'in_progress':
      return 'In valutazione';
    case 'quoted':
    case 'preventivo inviato':
      return 'Preventivo inviato';
    case 'accepted':
      return 'Approvata';
    case 'rejected':
      return 'Rifiutata';
    case 'completed':
      return 'Completata';
    case 'cancelled':
      return 'Annullata';
    default:
      return status;
  }
};

// Funzione per ottenere il colore dello stato
export const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'quoted':
    case 'preventivo inviato':
      return 'bg-purple-100 text-purple-800';
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Funzione per determinare il prossimo passo in base allo stato
export const getNextStep = (status) => {
  switch (status) {
    case 'pending':
      return "Il tuo progetto è stato inviato. I nostri designer lo stanno valutando. Riceverai una notifica quando inizieranno ad analizzare la tua richiesta.";
    case 'in_progress':
      return "Stiamo analizzando attentamente la tua richiesta. Il nostro team sta valutando i dettagli e preparerà presto un preventivo personalizzato.";
    case 'quoted':
      return "Ti abbiamo inviato un preventivo dettagliato. Puoi accettarlo per procedere con il progetto o rifiutarlo se desideri modifiche. Il preventivo è valido per 7 giorni.";
    case 'accepted':
      return "Grazie per aver approvato il preventivo! Il nostro team ha iniziato a lavorare sul tuo progetto. Riceverai aggiornamenti sull'avanzamento dei lavori.";
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