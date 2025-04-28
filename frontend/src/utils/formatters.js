/**
 * Utility di formattazione per date e prezzi
 */

/**
 * Formatta una data in formato leggibile
 * @param {string|Date} date - Data da formattare
 * @returns {string} Data formattata
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Data non valida';
  }
  
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Formatta una data in formato relativo (es. "2 giorni fa")
 * @param {string|Date} date - Data da formattare
 * @returns {string} Data formattata in modo relativo
 */
export const formatRelativeDate = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Data non valida';
  }
  
  const now = new Date();
  const diffInMs = now - dateObj;
  const diffInSec = Math.floor(diffInMs / 1000);
  const diffInMin = Math.floor(diffInSec / 60);
  const diffInHours = Math.floor(diffInMin / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSec < 60) {
    return 'Adesso';
  } else if (diffInMin < 60) {
    return `${diffInMin} ${diffInMin === 1 ? 'minuto' : 'minuti'} fa`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'ora' : 'ore'} fa`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'giorno' : 'giorni'} fa`;
  } else {
    return formatDate(dateObj);
  }
};

/**
 * Formatta un prezzo con valuta
 * @param {number} price - Prezzo da formattare
 * @param {string} currency - Valuta (default: EUR)
 * @returns {string} Prezzo formattato
 */
export const formatPrice = (price, currency = 'EUR') => {
  if (price === undefined || price === null) return 'N/A';
  
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}; 