import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/config.js';
import User from '../models/user.model.js';
import CustomRequest from '../models/custom-request.model.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configura Cloudinary
cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET
});

// Configura lo storage per gli avatar
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'cereres/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto:good' }
        ]
    }
});

const uploadAvatar = multer({ storage: avatarStorage });

// Ottieni il profilo dell'utente corrente
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        // Ottieni il numero di richieste dell'utente (per statistiche)
        const requestsCount = await CustomRequest.countDocuments({ userId: req.user.id });
        
        // Ottieni il numero di richieste attive
        const activeRequestsCount = await CustomRequest.countDocuments({ 
            userId: req.user.id,
            status: { $nin: ['completata', 'annullata'] }
        });
        
        res.status(200).json({
            user,
            stats: {
                totalRequests: requestsCount,
                activeRequests: activeRequestsCount
            }
        });
    } catch (error) {
        console.error('Errore durante il recupero del profilo:', error);
        res.status(500).json({ message: 'Errore durante il recupero del profilo' });
    }
});

// Aggiorna il profilo dell'utente
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { username, email, fullName, phoneNumber, address } = req.body;
        
        // Verifica se l'email è già utilizzata (se l'utente sta cambiando email)
        if (email) {
            const user = await User.findById(req.user.id);
            
            if (user.email !== email) {
                const existingUser = await User.findOne({ email });
                
                if (existingUser) {
                    return res.status(400).json({ message: 'Email già in uso' });
                }
            }
        }
        
        // Crea l'oggetto di aggiornamento con i campi forniti
        const updateFields = {};
        
        if (username) updateFields.username = username;
        if (email) updateFields.email = email;
        if (fullName !== undefined) updateFields.fullName = fullName;
        if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
        if (address !== undefined) updateFields.address = address;
        
        // Aggiorna il profilo
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true }
        ).select('-password');
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        res.status(200).json({
            message: 'Profilo aggiornato con successo',
            user: updatedUser
        });
    } catch (error) {
        console.error('Errore durante l\'aggiornamento del profilo:', error);
        res.status(500).json({ message: 'Errore durante l\'aggiornamento del profilo' });
    }
});

// Cambia la password
router.put('/password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                message: 'Password attuale e nuova password sono obbligatorie' 
            });
        }
        
        // Verifica la complessità della nuova password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ 
                message: 'La password deve contenere almeno 8 caratteri, una lettera maiuscola, una minuscola, un numero e un carattere speciale' 
            });
        }
        
        // Ottieni l'utente
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        // Per gli utenti Google, verifica che abbiano impostato una password
        if (user.googleId && !user.password) {
            // Se l'utente è registrato con Google e non ha mai impostato una password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            user.password = hashedPassword;
            await user.save();
            
            return res.status(200).json({ message: 'Password impostata con successo' });
        }
        
        // Verifica la password attuale
        const isMatch = await user.comparePassword(currentPassword);
        
        if (!isMatch) {
            return res.status(400).json({ message: 'Password attuale non corretta' });
        }
        
        // Imposta la nuova password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        user.password = hashedPassword;
        await user.save();
        
        res.status(200).json({ message: 'Password aggiornata con successo' });
    } catch (error) {
        console.error('Errore durante l\'aggiornamento della password:', error);
        res.status(500).json({ message: 'Errore durante l\'aggiornamento della password' });
    }
});

// Carica o aggiorna l'avatar dell'utente
router.put('/avatar', verifyToken, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nessun file caricato' });
        }
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        // Se l'utente ha già un avatar, elimina la vecchia immagine da Cloudinary
        if (user.avatar && user.avatar.publicId) {
            try {
                await cloudinary.uploader.destroy(user.avatar.publicId);
            } catch (error) {
                console.error('Errore durante l\'eliminazione dell\'avatar precedente:', error);
                // Continua comunque anche se l'eliminazione fallisce
            }
        }
        
        // Aggiorna l'avatar dell'utente
        user.avatar = {
            url: req.file.path,
            publicId: req.file.filename
        };
        
        await user.save();
        
        res.status(200).json({
            message: 'Avatar aggiornato con successo',
            avatar: user.avatar
        });
    } catch (error) {
        console.error('Errore durante l\'aggiornamento dell\'avatar:', error);
        res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'avatar' });
    }
});

// Rimuovi l'avatar dell'utente
router.delete('/avatar', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        // Se l'utente ha un avatar, eliminalo da Cloudinary
        if (user.avatar && user.avatar.publicId) {
            try {
                await cloudinary.uploader.destroy(user.avatar.publicId);
            } catch (error) {
                console.error('Errore durante l\'eliminazione dell\'avatar:', error);
                // Continua comunque anche se l'eliminazione fallisce
            }
        }
        
        // Rimuovi l'avatar dall'utente
        user.avatar = null;
        await user.save();
        
        res.status(200).json({ message: 'Avatar rimosso con successo' });
    } catch (error) {
        console.error('Errore durante la rimozione dell\'avatar:', error);
        res.status(500).json({ message: 'Errore durante la rimozione dell\'avatar' });
    }
});

// Ottieni il profilo pubblico di un utente (solo admin)
router.get('/:id/profile', verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        // Ottieni statistiche sulle richieste dell'utente
        const stats = await CustomRequest.aggregate([
            { $match: { userId: user._id } },
            { 
                $group: { 
                    _id: "$status", 
                    count: { $sum: 1 } 
                } 
            }
        ]);
        
        // Formatta le statistiche
        const formattedStats = {};
        stats.forEach(stat => {
            formattedStats[stat._id] = stat.count;
        });
        
        const totalRequests = Object.values(formattedStats).reduce((sum, count) => sum + count, 0);
        
        res.status(200).json({
            user,
            stats: {
                ...formattedStats,
                totalRequests
            }
        });
    } catch (error) {
        console.error('Errore durante il recupero del profilo:', error);
        res.status(500).json({ message: 'Errore durante il recupero del profilo' });
    }
});

export default router; 