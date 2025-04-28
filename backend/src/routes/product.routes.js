import express from 'express';
import { 
    getAllProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct 
} from '../controllers/product.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/config.js';

const router = express.Router();

// Configura Cloudinary
cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET
});

// Storage per immagini di prodotti
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

// Fallback storage se Cloudinary non è configurato
const fallbackStorage = multer.memoryStorage();

// Inizializza multer
const storage = config.CLOUDINARY_CLOUD_NAME ? productStorage : fallbackStorage;
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // limite 5MB
});

// Route pubbliche
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Route protette (solo admin)
router.post('/', verifyToken, isAdmin, upload.array('images', 5), createProduct);
router.put('/:id', verifyToken, isAdmin, upload.array('images', 5), updateProduct);
router.delete('/:id', verifyToken, isAdmin, deleteProduct);

export default router; 