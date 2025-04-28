import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Middleware di autenticazione per tutte le routes
router.use(verifyToken);

/**
 * @route GET /api/notifications
 * @desc Ottiene tutte le notifiche dell'utente corrente
 * @access Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route GET /api/notifications/unread-counts
 * @desc Ottiene i conteggi delle notifiche non lette per tipo
 * @access Private
 */
router.get('/unread-counts', notificationController.getUnreadCounts);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Segna una notifica come letta
 * @access Private
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @route PUT /api/notifications/mark-all-read
 * @desc Segna tutte le notifiche come lette
 * @access Private
 */
router.put('/mark-all-read', notificationController.markAllAsRead);

/**
 * @route POST /api/notifications
 * @desc Crea una nuova notifica (solo per admin)
 * @access Admin
 */
router.post('/', isAdmin, notificationController.createNotification);

export default router; 