import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import '../config/passport.js';  // Importo la configurazione di passport

const router = express.Router();

// Route per iniziare l'autenticazione Google
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // Forza la selezione dell'account
  })
);

// Callback URL per Google
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000/login?error=true',
    session: false 
  }),
  (req, res) => {
    try {
      // Genera un token JWT
      const token = jwt.sign(
        { 
          id: req.user._id, 
          username: req.user.username,
          role: req.user.role 
        },
        config.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Prepara i dati utente
      const userData = {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        profileImage: req.user.profileImage
      };
      
      // Codifica i dati utente per l'URL
      const userDataStr = encodeURIComponent(JSON.stringify(userData));
      
      // URL di redirect al frontend 
      res.redirect(`http://localhost:3000/auth/success?token=${token}&user=${userDataStr}`);
    } catch (error) {
      console.error('❌ Errore durante il callback Google:', error);
      res.redirect('http://localhost:3000/login?error=true');
    }
  }
);

export default router; 