import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Destinatario della notifica
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Tipo di notifica
  type: {
    type: String,
    enum: ['new_message', 'new_order', 'new_request'],
    required: true,
    index: true
  },
  
  // Titolo della notifica
  title: {
    type: String,
    required: true
  },
  
  // Messaggio della notifica
  message: {
    type: String,
    required: true
  },
  
  // Flag per indicare se la notifica è stata letta
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Riferimento a una richiesta personalizzata (opzionale)
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomRequest',
    default: null,
    index: true
  },
  
  // Riferimento a un ordine (opzionale)
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
    index: true
  }
}, {
  timestamps: true
});

// Indici composti per ottimizzare le query comuni
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, type: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 