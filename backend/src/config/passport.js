import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';
import { config } from './config.js';

// Log per debug
console.log('🔑 Google Client ID:', config.GOOGLE_CLIENT_ID ? 'Presente' : 'Mancante');
console.log('🔑 Google Client Secret:', config.GOOGLE_CLIENT_SECRET ? 'Presente' : 'Mancante');
console.log('🔑 Google Callback URL:', config.GOOGLE_CALLBACK_URL);

// Configurazione Passport Google Strategy solo se le credenziali sono presenti
if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && config.GOOGLE_CALLBACK_URL) {
  passport.use(new GoogleStrategy({
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('✅ Profilo Google ricevuto:', profile.displayName);
        
        // Cerca l'utente nel database usando l'email
        let user = await User.findOne({ email: profile.emails[0].value });
        
        // Estrai nome utente dall'email
        const username = profile.emails[0].value.split('@')[0];
        
        if (!user) {
          // Se l'utente non esiste, crealo
          user = new User({
            email: profile.emails[0].value,
            username: username,
            password: Math.random().toString(36).slice(-10), // Password casuale (non verrà usata)
            profileImage: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
            googleId: profile.id
          });
          await user.save();
          console.log('✅ Nuovo utente Google creato:', username);
        } else if (!user.googleId) {
          // Se l'utente esiste ma non ha googleId, aggiornalo
          user.googleId = profile.id;
          if (!user.profileImage && profile.photos && profile.photos.length > 0) {
            user.profileImage = profile.photos[0].value;
          }
          await user.save();
          console.log('✅ Account esistente collegato a Google:', username);
        }
        
        return done(null, user);
      } catch (error) {
        console.error('❌ Errore durante l\'autenticazione Google:', error);
        return done(error, null);
      }
    }
  ));
} else {
  console.log('⚠️ Autenticazione Google disabilitata: credenziali mancanti');
}

// Serializzazione dell'utente
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializzazione dell'utente
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport; 