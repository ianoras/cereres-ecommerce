import cloudinary from '../config/cloudinary.config.js';

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nessun file caricato' });
        }

        // Upload su Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'cereres',
            resource_type: 'auto'
        });

        // Rimuovi il file locale dopo l'upload su Cloudinary
        // fs.unlinkSync(req.file.path);

        res.status(200).json({
            message: 'Immagine caricata con successo',
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Errore durante l\'upload:', error);
        res.status(500).json({
            message: 'Errore durante l\'upload dell\'immagine',
            error: error.message
        });
    }
};

export const deleteImage = async (req, res) => {
    try {
        const { public_id } = req.params;
        
        const result = await cloudinary.uploader.destroy(public_id);
        
        res.status(200).json({
            message: 'Immagine eliminata con successo',
            result
        });
    } catch (error) {
        console.error('Errore durante l\'eliminazione:', error);
        res.status(500).json({
            message: 'Errore durante l\'eliminazione dell\'immagine',
            error: error.message
        });
    }
}; 