import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import User from '../models/user.model.js';

/**
 * Middleware per verificare il token JWT
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export const verifyToken = (req, res, next) => {
    console.log('Verifica token in corso...');
    
    // Controlla se c'è un header di autorizzazione
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('Nessun header di autorizzazione trovato');
        return res.status(401).json({ message: 'Accesso negato: token mancante' });
    }
    
    // Estrai il token dal header
    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log('Token non valido nel header di autorizzazione');
        return res.status(401).json({ message: 'Accesso negato: token non valido' });
    }
    
    try {
        // Verifica token
        console.log('Verifica del token JWT usando la chiave segreta...');
        // Prova prima con JWT_SECRET e poi con jwtSecret
        let decoded;
        try {
            decoded = jwt.verify(token, config.JWT_SECRET);
        } catch (innerError) {
            console.log('JWT_SECRET non valido, provo con jwtSecret...');
            decoded = jwt.verify(token, config.jwtSecret || 'your_jwt_secret');
        }
        console.log('Token decodificato:', decoded);
        
        // Aggiungi l'utente alla richiesta
        req.user = decoded;
        console.log('Utente aggiunto alla richiesta:', req.user.id);
        next();
    } catch (error) {
        console.error('Errore durante la verifica del token:', error);
        return res.status(401).json({ message: 'Token non valido o scaduto' });
    }
};

/**
 * Middleware per verificare se l'utente è un admin
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Accesso negato: richiesti privilegi di amministratore' });
        }
        
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Errore del server' });
    }
}; 