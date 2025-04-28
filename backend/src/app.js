import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import passport from 'passport';
import { logger } from './utils/logger.js';
import { config } from './config/config.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import googleAuthRoutes from './routes/google-auth.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import customRequestRoutes from './routes/custom-request.routes.js';
import userRoutes from './routes/user.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import orderRoutes from './routes/order.routes.js';
import contactRoutes from './routes/contact.routes.js';
import { setupAdmin } from './config/setupAdmin.js';
import './config/passport.js';  // Importa la configurazione di passport
import cartRoutes from './routes/cart.routes.js';
import customRequestClientRoutes from './routes/custom-request-client.routes.js';
import customRequestAdminRoutes from './routes/custom-request-admin.routes.js';
import path from 'path';
import fs from 'fs';
import User from './models/user.model.js';
import './models/order.model.js';

// Configura ambiente
dotenv.config();
const app = express();
const PORT = config.PORT;

// Configura le directory per gli upload
const uploadsDir = path.join(process.cwd(), 'uploads');
const customRequestsDir = path.join(uploadsDir, 'custom-requests');

// Crea le directory se non esistono
[uploadsDir, customRequestsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Directory creata: ${dir}`);
  }
});

// Configura il servizio dei file statici
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
logger.info(`Directory uploads configurata per il servizio statico: ${uploadsDir}`);

// Configura il server HTTP
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://accounts.google.com'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Log per ogni richiesta
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Route di base
app.get('/', (req, res) => {
  res.json({ message: 'Server Cereres API è attivo!' });
});

// Endpoint di debug per verificare se un file è accessibile
app.get('/api/check-file', (req, res) => {
  const filePath = req.query.path;
  
  if (!filePath) {
    return res.status(400).json({ success: false, message: 'Percorso del file non specificato' });
  }
  
  const fullPath = path.join(process.cwd(), filePath);
  
  // Verifica se il file esiste
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      logger.error(`File non trovato: ${fullPath}`);
      return res.status(404).json({ 
        success: false, 
        message: 'File non trovato',
        requestedPath: filePath,
        fullPath: fullPath,
        error: err.message
      });
    }
    
    // Il file esiste
    logger.info(`File trovato: ${fullPath}`);
    res.json({ 
      success: true, 
      message: 'File accessibile',
      path: filePath,
      fullPath: fullPath,
      url: `/uploads/${filePath.replace(/^uploads[\/\\]/, '')}`
    });
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/custom-requests', customRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/custom-requests/client', customRequestClientRoutes);
app.use('/api/custom-requests/admin', customRequestAdminRoutes);
app.use('/api/uploads', uploadRoutes);

// Connessione MongoDB
mongoose.connect(config.MONGODB_URI)
    .then(() => {
        logger.info('✅ Connesso con successo a MongoDB');
        // Esegui la configurazione dell'admin dopo la connessione
        setupAdmin();
        
        // Avvia il server
        server.listen(PORT, () => {
            logger.info(`🚀 Server in esecuzione sulla porta ${PORT}`);
        });
    })
    .catch(err => {
        logger.error('❌ Errore di connessione a MongoDB:', err);
        logger.error('URI di connessione: ' + config.MONGODB_URI);
        logger.error('Dettagli completi dell\'errore:', JSON.stringify(err, null, 2));
        process.exit(1);
    });

// Gestione errori
app.use((err, req, res, next) => {
    logger.error(`❌ Errore: ${err.message}`);
    res.status(500).json({
        success: false,
        message: 'Errore interno del server',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Gestione 404
app.use((req, res) => {
    logger.error('❌ Route non trovata:', req.url);
    res.status(404).json({ message: 'Route non trovata' });
});

// Elenca tutte le rotte disponibili
logger.info('📚 Route registrate:');
function printRoutes(stack, basePath = '') {
  stack.forEach(r => {
    if (r.route && r.route.path) {
      Object.keys(r.route.methods).forEach(method => {
        if (r.route.methods[method]) {
          logger.info(`${method.toUpperCase().padEnd(7)} ${basePath}${r.route.path}`);
        }
      });
    } else if (r.name === 'router' && r.handle && r.handle.stack) {
      const newBase = basePath + (r.regexp.toString().match(/^\/\^\\\/([^\\\/]*)/)?.[1] || '');
      printRoutes(r.handle.stack, newBase ? `/${newBase}` : '');
    }
  });
}

try {
  printRoutes(app._router.stack);
} catch (err) {
  logger.error('Errore nel visualizzare le route:', err.message);
}

export default app; 