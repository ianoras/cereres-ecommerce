import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    image: String,
    customization: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  shippingAddress: {
    fullName: String,
    street: String,
    houseNumber: String,
    city: String,
    province: String,
    postalCode: String,
    country: String,
    phone: String
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'paypal', 'cash', 'bank_transfer']
  },
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed
  },
  subtotal: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },
  shippingMethod: String,
  trackingNumber: String,
  notes: String,
  history: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }]
}, { 
  timestamps: true
});

// Middleware per generare automaticamente il numero d'ordine
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    // Formato: ORD-ANNO-MESE-XXXXX (esempio: ORD-2023-04-00001)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Trova l'ultimo ordine per generare il numero progressivo
    const Order = mongoose.model('Order', orderSchema);
    const lastOrder = await Order.findOne({}, {}, { sort: { 'createdAt': -1 } });
    
    let counter = 1;
    if (lastOrder && lastOrder.orderNumber) {
      // Estrai il contatore dall'ultimo numero d'ordine
      const lastCounter = lastOrder.orderNumber.split('-').pop();
      counter = parseInt(lastCounter, 10) + 1;
    }
    
    // Formatta il contatore con zeri iniziali
    const formattedCounter = String(counter).padStart(5, '0');
    this.orderNumber = `ORD-${year}-${month}-${formattedCounter}`;
  }
  
  // Aggiungi lo stato iniziale alla cronologia se è un nuovo ordine
  if (this.isNew) {
    this.history.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Ordine creato'
    });
  }
  
  next();
});

// Metodo per aggiungere un evento alla cronologia dell'ordine
orderSchema.methods.addToHistory = function(status, note) {
  this.status = status;
  this.history.push({
    status,
    timestamp: new Date(),
    note: note || ''
  });
  return this.save();
};

// Indici per migliorare le query
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order; 