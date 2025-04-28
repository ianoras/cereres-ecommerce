import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log per ogni richiesta
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Route di test
app.get('/', (req, res) => {
    console.log('GET richiesta ricevuta alla root');
    res.json({ message: 'Server di test funzionante!' });
});

app.post('/test', (req, res) => {
    console.log('POST richiesta ricevuta');
    console.log('Body:', req.body);
    res.json({ 
        message: 'POST ricevuto!',
        data: req.body
    });
});

// Avvio del server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server di test in ascolto sulla porta ${PORT}`);
}); 