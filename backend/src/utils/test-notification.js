import mongoose from 'mongoose';
import { createNotification } from './notifications.js';
import User from '../models/user.model.js';
import { config } from '../config/config.js';

// Test di creazione di una notifica
async function testCreateNotification() {
  try {
    // Connessione al database
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connesso a MongoDB');
    
    // Cerca un admin e un cliente
    const admin = await User.findOne({ role: 'admin' });
    const client = await User.findOne({ role: { $ne: 'admin' } });
    
    if (!admin) {
      console.error('Admin non trovato. Assicurati che ci sia almeno un utente con ruolo "admin" nel database.');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    if (!client) {
      console.error('Cliente non trovato. Assicurati che ci sia almeno un utente non admin nel database.');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`Admin trovato: ${admin._id}`);
    console.log(`Cliente trovato: ${client._id}`);
    
    // Crea una notifica di test per l'admin
    // Formato: (recipientId, type, message, requestId = null, senderId = null)
    const notificationToAdmin = await createNotification(
      admin._id,
      'new_request',
      'Questa è una notifica di test per verificare il sistema',
      null,
      client._id
    );
    
    if (notificationToAdmin) {
      console.log('Notifica creata per admin:', notificationToAdmin._id);
    } else {
      console.error('Errore nella creazione della notifica per admin');
    }
    
    // Crea una notifica di test per il cliente
    const notificationToClient = await createNotification(
      client._id,
      'system',
      'Benvenuto nel sistema di notifiche di Cereres',
      null,
      admin._id
    );
    
    if (notificationToClient) {
      console.log('Notifica creata per cliente:', notificationToClient._id);
    } else {
      console.error('Errore nella creazione della notifica per cliente');
    }
    
    console.log('Test completato con successo!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Errore durante il test:', error);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('Errore durante la disconnessione:', disconnectError);
    }
    process.exit(1);
  }
}

// Esegui il test
testCreateNotification(); 