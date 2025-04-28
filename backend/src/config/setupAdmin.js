import User from '../models/user.model.js';
import { config } from './config.js';

/**
 * Verifica se esiste già un account admin, altrimenti lo crea
 */
export const setupAdmin = async () => {
    try {
        // Verifica se esiste già un utente admin con l'email specificata
        const adminExists = await User.findOne({ 
            email: config.ADMIN_EMAIL, 
            role: 'admin' 
        });

        if (adminExists) {
            console.log('✅ Admin già esistente nel database');
            return;
        }

        // Verifica se esiste un utente con la stessa email ma non admin
        const userExists = await User.findOne({ email: config.ADMIN_EMAIL });
        
        if (userExists) {
            // Aggiorna l'utente esistente a admin
            userExists.role = 'admin';
            await userExists.save();
            console.log('✅ Utente esistente promosso ad admin');
            return;
        }

        // Crea un nuovo utente admin
        const admin = new User({
            username: config.ADMIN_USERNAME,
            email: config.ADMIN_EMAIL,
            password: config.ADMIN_PASSWORD,
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Account admin creato con successo');
    } catch (error) {
        console.error('❌ Errore durante la creazione dell\'account admin:', error);
    }
}; 