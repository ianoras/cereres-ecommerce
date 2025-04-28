import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    images: [{
        type: String,
        required: true
    }],
    category: {
        type: String,
        required: true,
        enum: ['borse', 'guanti', 'abbigliamento', 'cappelli', 'accessori', 'altro']
    },
    inStock: {
        type: Boolean,
        default: true
    },
    customization: {
        type: Boolean,
        default: false
    },
    customizationOptions: [{
        name: String,
        options: [String]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Aggiorna il timestamp quando il documento viene modificato
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Product = mongoose.model('Product', productSchema);

export default Product; 