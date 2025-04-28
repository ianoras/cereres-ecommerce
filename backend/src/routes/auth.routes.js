import express from 'express';
import { register, login, getProfile, promoteToAdmin, checkAuthStatus } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

console.log('🔧 Routes di autenticazione caricate');

// Route pubbliche
router.post('/register', register);
router.post('/login', login);

// Route temporanea per promuovere a admin
router.post('/promote-to-admin', promoteToAdmin);

// Route protette
router.get('/profile', verifyToken, getProfile);
router.get('/status', verifyToken, checkAuthStatus);

export default router; 