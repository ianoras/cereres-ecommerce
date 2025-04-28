const createImageUrl = (attachment) => {
  console.log('createImageUrl ricevuto:', attachment);
  
  // Se l'allegato ha già un URL, lo usiamo
  if (attachment.url) {
    console.log('Uso URL pre-esistente:', attachment.url);
    // Aggiungiamo il dominio del backend se l'URL è relativo
    if (attachment.url.startsWith('/')) {
      const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      return `${backendUrl}${attachment.url}`;
    }
    return attachment.url;
  }
  
  // Se l'allegato ha i dati binari, creiamo un Blob
  if (attachment.data) {
    console.log('Creo Blob da array di dati (' + attachment.data.length + ' byte)');
    const blob = new Blob([new Uint8Array(attachment.data)], { type: attachment.mimetype });
    const url = URL.createObjectURL(blob);
    console.log('URL oggetto creato:', url);
    return url;
  }
  
  console.error('Allegato non valido:', attachment);
  return null;
}; 