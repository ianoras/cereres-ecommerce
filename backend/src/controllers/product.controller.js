import Product from '../models/product.model.js';

// Ottieni tutti i prodotti
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        console.error('Errore nel recupero dei prodotti:', error);
        res.status(500).json({
            message: 'Errore nel recupero dei prodotti',
            error: error.message
        });
    }
};

// Ottieni un prodotto specifico
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Prodotto non trovato' });
        }
        res.json(product);
    } catch (error) {
        console.error('Errore nel recupero del prodotto:', error);
        res.status(500).json({
            message: 'Errore nel recupero del prodotto',
            error: error.message
        });
    }
};

// Crea un nuovo prodotto
export const createProduct = async (req, res) => {
    try {
        console.log('Creating new product');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        console.log('Content-Type:', req.headers['content-type']);
        
        // Crea l'oggetto prodotto dal body della richiesta
        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price),
            category: req.body.category,
            inStock: req.body.inStock === 'true' || req.body.inStock === true,
            customization: req.body.customization === 'true' || req.body.customization === true,
        };
        
        // Gestisci opzioni di personalizzazione
        if (req.body.customizationOptions) {
            try {
                productData.customizationOptions = typeof req.body.customizationOptions === 'string'
                    ? JSON.parse(req.body.customizationOptions)
                    : req.body.customizationOptions;
            } catch (e) {
                console.error('Errore nel parsing delle opzioni di personalizzazione:', e);
                productData.customizationOptions = [];
            }
        }
        
        // Gestisci immagini
        if (req.files && req.files.length > 0) {
            productData.images = req.files.map(file => file.path || file.location);
        } else {
            // Se non ci sono immagini, imposta un'immagine di default
            productData.images = ['https://via.placeholder.com/500?text=No+Image'];
        }
        
        console.log('Product data prepared:', productData);
        
        // Validazione manuale della categoria
        const validCategories = ['borse', 'guanti', 'abbigliamento', 'cappelli', 'accessori', 'altro'];
        if (!validCategories.includes(productData.category)) {
            console.log(`Categoria '${productData.category}' non valida, impostazione su 'altro'`);
            productData.category = 'altro';
        }
        
        const product = new Product(productData);
        await product.save();
        
        console.log('Product created successfully:', product);
        
        res.status(201).json({
            message: 'Prodotto creato con successo',
            product
        });
    } catch (error) {
        console.error('Errore nella creazione del prodotto:', error);
        res.status(500).json({
            message: 'Errore nella creazione del prodotto',
            error: error.message
        });
    }
};

// Aggiorna un prodotto
export const updateProduct = async (req, res) => {
    try {
        console.log('Updating product with ID:', req.params.id);
        console.log('Request body (raw):', req.body);
        console.log('Request files:', req.files);  // Aggiunti da multer
        console.log('Content-Type:', req.headers['content-type']);
        
        // Recupera il prodotto esistente
        const existingProduct = await Product.findById(req.params.id);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Prodotto non trovato' });
        }
        
        console.log('Prodotto esistente prima dell\'aggiornamento:', existingProduct);
        
        // Crea un oggetto per l'aggiornamento, inizializzato con i dati esistenti
        const updateData = {
            name: existingProduct.name,
            description: existingProduct.description,
            price: existingProduct.price,
            category: existingProduct.category,
            inStock: existingProduct.inStock,
            customization: existingProduct.customization,
            customizationOptions: existingProduct.customizationOptions,
            images: existingProduct.images
        };
        
        // Sovrascrivi con i nuovi dati se presenti
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.price) updateData.price = parseFloat(req.body.price);
        if (req.body.category) updateData.category = req.body.category;
        
        // Gestisci i campi booleani (importante convertirli correttamente)
        if (req.body.inStock !== undefined) {
            updateData.inStock = req.body.inStock === 'true' || req.body.inStock === true;
        }
        
        if (req.body.customization !== undefined) {
            updateData.customization = req.body.customization === 'true' || req.body.customization === true;
        }
        
        // Gestisci opzioni di personalizzazione
        if (req.body.customizationOptions) {
            try {
                const parsedOptions = typeof req.body.customizationOptions === 'string'
                    ? JSON.parse(req.body.customizationOptions)
                    : req.body.customizationOptions;
                    
                updateData.customizationOptions = parsedOptions;
            } catch (e) {
                console.error('Errore nel parsing delle opzioni di personalizzazione:', e);
            }
        }
        
        // Gestisci immagini nuove (caricate ora)
        if (req.files && req.files.length > 0) {
            console.log('Nuove immagini caricate:', req.files.length);
            // Se ci sono nuove immagini caricate, sostituisci le vecchie
            updateData.images = req.files.map(file => file.path || file.location);
        }
        // Gestisci immagini esistenti (se ci sono)
        else if (req.body.existingImages) {
            try {
                updateData.images = JSON.parse(req.body.existingImages);
            } catch (e) {
                console.error('Errore nel parsing delle immagini esistenti:', e);
            }
        }
        
        // Aggiornamento forzato del timestamp
        updateData.updatedAt = new Date();
        
        console.log('Update data prepared:', updateData);
        
        // Verifica se la categoria è valida rispetto all'enum attuale
        const validCategories = ['borse', 'guanti', 'abbigliamento', 'cappelli', 'accessori', 'altro'];
        if (updateData.category && !validCategories.includes(updateData.category)) {
            console.log(`Categoria '${updateData.category}' non valida, impostazione su 'altro'`);
            updateData.category = 'altro'; // Imposta una categoria di default valida
        }
        
        try {
            // Prima prova con validazione
            const product = await Product.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true, runValidators: true }
            );
            
            console.log('Product updated successfully:', product);
            
            res.json({
                message: 'Prodotto aggiornato con successo',
                product
            });
        } catch (validationError) {
            console.error('Errore di validazione durante l\'aggiornamento:', validationError);
            
            // Se fallisce la validazione, aggiorna senza validare
            const product = await Product.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true, runValidators: false }
            );
            
            console.log('Product updated without validation:', product);
            
            res.json({
                message: 'Prodotto aggiornato con successo (senza validazione)',
                product
            });
        }
    } catch (error) {
        console.error('Errore nell\'aggiornamento del prodotto:', error);
        res.status(500).json({
            message: 'Errore nell\'aggiornamento del prodotto',
            error: error.message
        });
    }
};

// Elimina un prodotto
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Prodotto non trovato' });
        }
        
        res.json({
            message: 'Prodotto eliminato con successo',
            product
        });
    } catch (error) {
        console.error('Errore nell\'eliminazione del prodotto:', error);
        res.status(500).json({
            message: 'Errore nell\'eliminazione del prodotto',
            error: error.message
        });
    }
}; 