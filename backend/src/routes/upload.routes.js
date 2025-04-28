import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { config } from '../config/config.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

// Configura Cloudinary
cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET
});

const router = express.Router();

// Configura lo storage per Multer con Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'cereres',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 1000, crop: 'limit' }, // Limita le dimensioni per ottimizzare
            { quality: 'auto:good' } // Ottimizza la qualità
        ]
    }
});

// Storage specifico per immagini di prodotti
const productStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'cereres/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 1200, crop: 'limit' },
            { quality: 'auto:good' }
        ]
    }
});

// Storage per immagini di riferimento per le richieste personalizzate
const referenceStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'cereres/references',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
        transformation: [
            { width: 1500, crop: 'limit' },
            { quality: 'auto:good' }
        ]
    }
});

// Inizializza multer con lo storage appropriato
const upload = multer({ storage: storage });
const productUpload = multer({ storage: productStorage });
const referenceUpload = multer({ storage: referenceStorage });

// Carica una singola immagine generica
router.post('/single', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nessun file caricato' });
        }
        
        // req.file.path contiene l'URL dell'immagine caricata
        res.status(201).json({
            message: 'Immagine caricata con successo',
            url: req.file.path,
            publicId: req.file.filename,
            format: req.file.format
        });
    } catch (error) {
        console.error('Errore durante il caricamento dell\'immagine:', error);
        res.status(500).json({ message: 'Errore durante il caricamento dell\'immagine' });
    }
});

// Carica multiple immagini generiche (max 5)
router.post('/multiple', verifyToken, upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Nessun file caricato' });
        }
        
        const uploadedImages = req.files.map(file => ({
            url: file.path,
            publicId: file.filename,
            format: file.format
        }));
        
        res.status(201).json({
            message: `${uploadedImages.length} immagini caricate con successo`,
            images: uploadedImages
        });
    } catch (error) {
        console.error('Errore durante il caricamento delle immagini:', error);
        res.status(500).json({ message: 'Errore durante il caricamento delle immagini' });
    }
});

// Carica immagini di prodotto (solo admin, max 10)
router.post('/products', verifyToken, isAdmin, productUpload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Nessun file caricato' });
        }
        
        const uploadedImages = req.files.map(file => ({
            url: file.path,
            publicId: file.filename,
            format: file.format
        }));
        
        res.status(201).json({
            message: `${uploadedImages.length} immagini di prodotto caricate con successo`,
            images: uploadedImages
        });
    } catch (error) {
        console.error('Errore durante il caricamento delle immagini di prodotto:', error);
        res.status(500).json({ message: 'Errore durante il caricamento delle immagini di prodotto' });
    }
});

// Carica immagini di riferimento per richieste personalizzate (max 8)
router.post('/references', verifyToken, referenceUpload.array('references', 8), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Nessun file caricato' });
        }
        
        const uploadedFiles = req.files.map(file => ({
            url: file.path,
            publicId: file.filename,
            format: file.format,
            name: file.originalname
        }));
        
        res.status(201).json({
            message: `${uploadedFiles.length} file di riferimento caricati con successo`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Errore durante il caricamento dei file di riferimento:', error);
        res.status(500).json({ message: 'Errore durante il caricamento dei file di riferimento' });
    }
});

// Elimina un'immagine da Cloudinary
router.delete('/:publicId', verifyToken, async (req, res) => {
    try {
        const { publicId } = req.params;
        
        if (!publicId) {
            return res.status(400).json({ message: 'ID pubblico non fornito' });
        }
        
        const result = await cloudinary.uploader.destroy(publicId);
        
        if (result.result === 'ok') {
            res.status(200).json({ message: 'Immagine eliminata con successo' });
        } else {
            res.status(400).json({ message: 'Impossibile eliminare l\'immagine', result });
        }
    } catch (error) {
        console.error('Errore durante l\'eliminazione dell\'immagine:', error);
        res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'immagine' });
    }
});

export default router; 