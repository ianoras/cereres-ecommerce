import express from 'express';
import { 
  createContact, 
  getAllContacts, 
  getContactById, 
  markAsResponded, 
  deleteContact,
  getContactStats
} from '../controllers/contact.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Route pubblica per l'invio di messaggi di contatto
router.post('/', createContact);

// Route protette per gli admin
router.get('/', verifyToken, isAdmin, getAllContacts);
router.get('/stats', verifyToken, isAdmin, getContactStats);
router.get('/:id', verifyToken, isAdmin, getContactById);
router.patch('/:id/respond', verifyToken, isAdmin, markAsResponded);
router.delete('/:id', verifyToken, isAdmin, deleteContact);

export default router; 