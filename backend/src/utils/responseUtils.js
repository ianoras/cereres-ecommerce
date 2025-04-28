/**
 * Invia una risposta standard con status code e dati
 * @param {Object} res - Response object di Express
 * @param {Number} statusCode - Status code HTTP
 * @param {Object} data - Dati da inviare nella risposta
 * @returns {Object} - Response object
 */
export const sendResponse = (res, statusCode, data) => {
  return res.status(statusCode).json(data);
};

/**
 * Invia una risposta di errore con status code e messaggio
 * @param {Object} res - Response object di Express
 * @param {Number} statusCode - Status code HTTP
 * @param {String} message - Messaggio di errore
 * @param {Object} errors - Eventuali dettagli sull'errore (opzionale)
 * @returns {Object} - Response object
 */
export const sendErrorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
}; 