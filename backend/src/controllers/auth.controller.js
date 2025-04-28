import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { config } from '../config/config.js';

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Verifica se l'utente esiste già
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                message: 'Username o email già in uso' 
            });
        }

        // Crea nuovo utente
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        // Genera token JWT
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username,
                role: user.role 
            },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Utente registrato con successo',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        res.status(500).json({
            message: 'Errore durante la registrazione',
            error: error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Trova l'utente
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Credenziali non valide' });
        }

        // Verifica password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenziali non valide' });
        }

        // Genera token JWT
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username,
                role: user.role 
            },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login effettuato con successo',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Errore durante il login:', error);
        res.status(500).json({
            message: 'Errore durante il login',
            error: error.message
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        res.json(user);
    } catch (error) {
        console.error('Errore nel recupero del profilo:', error);
        res.status(500).json({
            message: 'Errore nel recupero del profilo',
            error: error.message
        });
    }
};

// Funzione temporanea per promuovere un utente a admin
export const promoteToAdmin = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        user.role = 'admin';
        await user.save();
        
        // Genera un nuovo token con il ruolo aggiornato
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username,
                role: user.role 
            },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Utente promosso ad admin con successo',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Errore durante la promozione dell\'utente:', error);
        res.status(500).json({
            message: 'Errore durante la promozione dell\'utente',
            error: error.message
        });
    }
};

// Verifica lo stato dell'utente
export const checkAuthStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        res.json({
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Errore nella verifica dello stato:', error);
        res.status(500).json({
            message: 'Errore nella verifica dello stato',
            error: error.message
        });
    }
}; 