import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CustomRequest from '../models/custom-request.model.js';
import User from '../models/user.model.js';
import { config } from '../config/config.js';

// Carica le variabili d'ambiente
dotenv.config();

async function updateCustomRequests() {
  try {
    console.log('Connessione al database...');
    
    // Connessione al database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connesso al database MongoDB');
    
    // Trova tutte le richieste
    const requests = await CustomRequest.find({});
    console.log(`Trovate ${requests.length} richieste da aggiornare`);
    
    let updated = 0;
    let failed = 0;
    
    // Aggiorna ogni richiesta
    for (const request of requests) {
      try {
        // Trova l'utente associato alla richiesta
        const user = await User.findById(request.user);
        
        if (user) {
          // Aggiorna le informazioni dell'utente nella richiesta
          request.userInfo = {
            name: user.fullName || user.username || 'N/A',
            email: user.email,
            phone: user.phoneNumber || 'N/A'
          };
          
          await request.save();
          updated++;
          console.log(`Richiesta ${request._id} aggiornata con successo`);
        } else {
          console.log(`Utente non trovato per la richiesta ${request._id}`);
          failed++;
        }
      } catch (error) {
        console.error(`Errore nell'aggiornamento della richiesta ${request._id}:`, error);
        failed++;
      }
    }
    
    console.log(`\nAggiornamento completato:`);
    console.log(`- Richieste aggiornate con successo: ${updated}`);
    console.log(`- Richieste non aggiornate: ${failed}`);
    console.log(`- Totale richieste: ${requests.length}`);
    
  } catch (error) {
    console.error('Errore durante l\'aggiornamento delle richieste:', error);
  } finally {
    // Chiudi la connessione al database
    await mongoose.connection.close();
    console.log('Connessione al database chiusa');
  }
}

// Esegui lo script
updateCustomRequests(); 