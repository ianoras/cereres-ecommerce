import mongoose from 'mongoose';

const customRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Campo per memorizzare info utente direttamente nella richiesta
    userInfo: {
        name: { type: String, default: 'N/A' },
        email: { type: String, default: 'N/A' },
        phone: { type: String, default: 'N/A' }
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    preferredMaterials: {
        type: [String],
        default: []
    },
    budget: {
        type: Number,
        required: true
    },
    deadline: {
        type: Date
    },
    // Allegati della richiesta
    attachments: [{
        filename: String,
        path: String,
        contentType: String,
        size: Number,
        url: String
    }],
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled', 'quoted', 'accepted', 'rejected'],
        default: 'pending'
    },
    materialsStatus: {
        type: String,
        enum: ['pending', 'received', 'evaluated', 'accepted', 'rejected'],
        default: 'pending'
    },
    quote: {
        amount: Number,
        description: String,
        validUntil: Date,
        sentAt: Date
    },
    acceptedQuote: {
        type: mongoose.Schema.Types.Mixed
    },
    conversation: [{
        sender: {
            type: String,
            enum: ['user', 'admin'],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        attachments: [{
            filename: String,
            mimetype: String,
            size: Number,
            data: mongoose.Schema.Types.Mixed,
            url: String
        }],
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    timelineEntries: [{
        status: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String
        },
        actor: {
            type: String,
            enum: ['admin', 'client', 'system'],
            default: 'system'
        }
    }],
    adminNotes: {
        type: String
    }
}, {
    timestamps: true
});

// Indici per migliorare le performance delle query
customRequestSchema.index({ user: 1 });
customRequestSchema.index({ status: 1 });
customRequestSchema.index({ "materialsStatus": 1 });
customRequestSchema.index({ createdAt: -1 });

const CustomRequest = mongoose.model('CustomRequest', customRequestSchema);

export default CustomRequest; 