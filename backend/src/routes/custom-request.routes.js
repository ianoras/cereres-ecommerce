import express from 'express';
import clientRoutes from './custom-request-client.routes.js';
import adminRoutes from './custom-request-admin.routes.js';

const router = express.Router();

// Usa le route dei client
router.use('/client', clientRoutes);

// Usa le route degli admin
router.use('/admin', adminRoutes);

// Log delle route per debug
console.log('📋 Route custom-requests registrate:');
console.log('- /client/* -> clientRoutes');
console.log('- /admin/* -> adminRoutes');

export default router; 