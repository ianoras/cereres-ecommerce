import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Rotte del carrello (implementazione minimale)
router.get('/', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Funzionalità carrello in fase di implementazione',
    data: []
  });
});

export default router; 