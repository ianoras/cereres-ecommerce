import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Inserisci un indirizzo email valido']
    },
    password: {
        type: String,
        required: function() {
            return this.googleId === null || this.googleId === undefined;
        },
        minlength: 8
    },
    profileImage: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    googleId: {
        type: String,
        default: null
    },
    fullName: {
        type: String,
        trim: true,
        default: ''
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: ''
    },
    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        country: { type: String, default: 'Italia' }
    },
    avatar: {
        url: { type: String, default: '' },
        publicId: { type: String, default: '' }
    },
    preferences: {
        notifications: { type: Boolean, default: true },
        newsletter: { type: Boolean, default: false },
        language: { type: String, default: 'it' }
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash della password prima del salvataggio
userSchema.pre('save', async function(next) {
    const user = this;
    
    // Verifica se la password è stata modificata o è nuova
    if (!user.isModified('password')) {
        return next();
    }
    
    // Salta l'hashing se l'utente è autenticato tramite Google e non ha una password
    if (user.googleId && !user.password) {
        return next();
    }
    
    // Genera il salt e hash della password
    try {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Metodo per confrontare le password
userSchema.methods.comparePassword = async function(candidatePassword) {
    // Se l'utente è autenticato tramite Google e non ha una password
    if (this.googleId && !this.password) {
        return false;
    }
    
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Indici per migliorare le performance delle query
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

const User = mongoose.model('User', userSchema);

export default User; 