# Cereres - Piattaforma E-commerce

## Descrizione del Progetto
Cereres è una piattaforma e-commerce completa che offre funzionalità avanzate per la vendita di prodotti, con particolare attenzione alla personalizzazione e all'esperienza utente. Il sistema è strutturato con un'architettura moderna basata su microservizi, utilizzando React per il frontend e Node.js per il backend.

## Tecnologie Utilizzate

### Frontend
- **React 19**: Framework JavaScript per UI reattive e moderne
- **React Router 7**: Gestione del routing lato client
- **Bootstrap 5/React Bootstrap**: Framework CSS per design responsive
- **Material-UI**: Componenti UI moderni basati su Material Design
- **Axios**: Client HTTP per effettuare richieste API
- **React Toastify**: Notifiche utente eleganti
- **FontAwesome**: Icone e risorse grafiche

### Backend
- **Node.js**: Runtime JavaScript lato server
- **Express**: Framework per creare API RESTful
- **MongoDB**: Database NoSQL per la persistenza dei dati
- **Mongoose**: ODM (Object Data Modeling) per MongoDB
- **JWT (JSON Web Token)**: Autenticazione e autorizzazione utenti
- **Passport.js**: Autenticazione tramite provider OAuth (Google)
- **Multer**: Gestione upload di file
- **Cloudinary**: Storage di immagini e file su cloud
- **bcrypt.js**: Crittografia per password e dati sensibili
- **CORS**: Gestione delle politiche Cross-Origin Resource Sharing

## Funzionalità Principali

### Pubbliche
- **Home page** con presentazione prodotti in evidenza
- **Catalogo prodotti** con filtri e ricerca
- **Schede dettaglio prodotto** con descrizioni, immagini e varianti
- **Pagina about/chi siamo** con informazioni sull'azienda
- **Form di contatto** per richieste informazioni

### Utenti Registrati
- **Autenticazione** tradizionale e tramite Google
- **Gestione profilo** e modifiche dati personali
- **Carrello acquisti** con gestione quantità e varianti
- **Checkout** con vari metodi di pagamento
- **Storico ordini** con tracciamento stato
- **Richieste personalizzate** per prodotti su misura
- **Sistema di notifiche** per aggiornamenti ordini

### Area Amministrativa
- **Dashboard** con statistiche e report
- **Gestione prodotti** (creazione, modifica, eliminazione)
- **Gestione ordini** con cambio stato e notifiche automatiche
- **Gestione richieste personalizzate** da parte dei clienti
- **Gestione utenti** e permessi
- **Sistema di contatti/messaggi** da clienti

## Architettura del Sistema

Il progetto utilizza un'architettura a microservizi con:

- **Frontend**: Applicazione React SPA (Single Page Application)
- **Backend API**: Server Express che fornisce endpoint RESTful
- **Persistenza dati**: Database MongoDB per memorizzare prodotti, utenti, ordini, ecc.
- **Storage file**: Sistema ibrido con storage locale e cloud (Cloudinary)
- **Autenticazione**: Sistema JWT con supporto OAuth per provider esterni


### Produzione
- Server con Node.js 
- Database MongoDB (locale o cloud)
- Storage per file (locale o cloud)

## Installazione e Avvio

### Backend
```bash
cd backend
npm install
npm run dev   # per ambiente di sviluppo
npm start     # per ambiente di produzione
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Struttura del Progetto

```
progetto/
├── frontend/                # Applicazione React
│   ├── public/              # Asset statici
│   └── src/                 # Codice sorgente
│       ├── components/      # Componenti riutilizzabili
│       ├── pages/           # Componenti pagina
│       ├── services/        # Servizi per API e logica
│       ├── utils/           # Utility e funzioni helper
│       └── styles/          # CSS e stili
│
├── backend/                 # Server API Node.js
│   ├── src/                 # Codice sorgente
│   │   ├── config/          # Configurazioni
│   │   ├── controllers/     # Controller per le route
│   │   ├── models/          # Modelli dati Mongoose
│   │   ├── routes/          # Definizione delle route API
│   │   ├── middleware/      # Middleware personalizzati
│   │   ├── utils/           # Utility e funzioni helper
│   │   └── services/        # Servizi business logic
│   ├── uploads/             # Directory per file caricati
│   └── .env                 # Variabili d'ambiente
```

