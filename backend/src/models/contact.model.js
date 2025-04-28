import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Il nome è richiesto'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email è richiesta'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Formato email non valido']
  },
  messaggio: {
    type: String,
    required: [true, 'Il messaggio è richiesto'],
    trim: true,
    minlength: [10, 'Il messaggio deve contenere almeno 10 caratteri']
  },
  letto: {
    type: Boolean,
    default: false
  },
  risposto: {
    type: Boolean,
    default: false
  },
  dataCreazione: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Contact = mongoose.model('Contact', contactSchema);

export default Contact; 