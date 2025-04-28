import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';
import * as notificationUtil from '../utils/notifications.js';

const router = express.Router();

// Ottieni statistiche sugli ordini (admin)
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    // Conteggio totale degli ordini
    const totalOrders = await Order.countDocuments();
    
    // Conteggio per stato
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    
    // Ordini per mese
    const ordersByMonth = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Ordini recenti (ultimi 5)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username email')
      .lean();
    
    res.json({
      total: totalOrders,
      byStatus: {
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders
      },
      byMonth: ordersByMonth,
      recentOrders: recentOrders
    });
  } catch (error) {
    console.error('Errore nel recupero delle statistiche degli ordini:', error);
    res.status(500).json({ message: error.message });
  }
});

// Ottieni tutti gli ordini (admin)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    // Parametri di paginazione
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Parametri di filtro e ordinamento
    const filters = {};
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    // Ricerca per orderNumber o username utente
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      
      const userIds = await mongoose.model('User').find({
        $or: [
          { username: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');
      
      filters.$or = [
        { orderNumber: searchRegex },
        { user: { $in: userIds.map(user => user._id) } }
      ];
    }
    
    // Campo e direzione di ordinamento
    const sortField = req.query.sort || 'createdAt';
    const sortDirection = req.query.direction === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortField] = sortDirection;
    
    // Conta il totale degli ordini (per la paginazione)
    const total = await Order.countDocuments(filters);
    
    // Esegui la query con paginazione, filtri e ordinamento
    const orders = await Order.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('user', 'username email')
      .lean();
    
    res.json({
      orders,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Errore nel recupero degli ordini:', error);
    res.status(500).json({ message: error.message });
  }
});

// Ottieni tutti gli ordini dell'utente corrente
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    // Parametri di paginazione
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Conta il totale degli ordini dell'utente
    const total = await Order.countDocuments({ user: req.user.id });
    
    // Recupera gli ordini dell'utente con paginazione
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    res.json({
      orders,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Errore nel recupero degli ordini personali:', error);
    res.status(500).json({ message: error.message });
  }
});

// Ottieni un ordine specifico
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'username email')
      .populate('items.product', 'name images');
    
    if (!order) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }
    
    // Verifica che l'utente sia il proprietario dell'ordine o un admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato ad accedere a questo ordine' });
    }
    
    res.json(order);
  } catch (error) {
    console.error(`Errore nel recupero dell'ordine ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Ottieni la cronologia di un ordine
router.get('/:id/history', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }
    
    // Verifica che l'utente sia il proprietario dell'ordine o un admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato ad accedere a questo ordine' });
    }
    
    res.json({
      orderId: order._id,
      orderNumber: order.orderNumber,
      events: order.history
    });
  } catch (error) {
    console.error(`Errore nel recupero della cronologia dell'ordine ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Crea un nuovo ordine
router.post('/', verifyToken, async (req, res) => {
  try {
    const { items, shipping, payment, total, subtotal, shippingCost } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Nessun prodotto specificato per l\'ordine' });
    }
    
    // Verifica che i prodotti esistano e recupera i loro dettagli
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    
    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'Uno o più prodotti non esistono' });
    }
    
    // Formatta gli elementi dell'ordine
    const orderItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.product);
      return {
        product: item.product,
        name: product.name,
        price: item.price || product.price,
        quantity: item.quantity,
        image: product.images[0],
        customization: item.customization || {}
      };
    });
    
    // Crea l'indirizzo di spedizione
    const shippingAddress = {
      fullName: `${shipping.name} ${shipping.lastName}`,
      street: shipping.address,
      city: shipping.city,
      province: shipping.province,
      postalCode: shipping.postalCode,
      country: shipping.country,
      phone: shipping.phone
    };
    
    // Crea il nuovo ordine
    const newOrder = new Order({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod: payment.method,
      paymentDetails: payment.cardDetails || {},
      subtotal,
      shippingCost,
      totalAmount: total,
      notes: shipping.notes || ''
    });
    
    // Salva l'ordine
    await newOrder.save();
    
    // Notifica gli amministratori del nuovo ordine
    try {
      await notificationUtil.notifyAdminsOfNewOrder(newOrder);
      console.log('Notifiche per il nuovo ordine inviate agli admin');
    } catch (notifError) {
      console.error('Errore durante l\'invio delle notifiche per il nuovo ordine:', notifError);
      // Non interrompiamo il flusso se la notifica fallisce
    }
    
    res.status(201).json({
      message: 'Ordine creato con successo',
      orderId: newOrder._id,
      orderNumber: newOrder.orderNumber
    });
  } catch (error) {
    console.error('Errore nella creazione dell\'ordine:', error);
    res.status(500).json({ message: error.message });
  }
});

// Aggiorna lo stato di un ordine (solo admin)
router.put('/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;
    const { id } = req.params;
    
    if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Stato non valido' });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }
    
    // Salva lo stato precedente per la notifica
    const oldStatus = order.status;
    
    // Aggiorna lo stato e aggiungi alla cronologia
    order.status = status;
    order.history.push({
      status,
      timestamp: new Date(),
      note: note || ''
    });
    
    if (status === 'shipped' && req.body.trackingNumber) {
      order.trackingNumber = req.body.trackingNumber;
    }
    
    await order.save();
    
    // Invia una notifica all'utente riguardo l'aggiornamento dello stato
    try {
      await notificationUtil.notifyOrderStatusUpdate(order, oldStatus, status);
      console.log(`Notifica di aggiornamento stato ordine inviata all'utente ${order.user}`);
    } catch (notifError) {
      console.error('Errore durante l\'invio della notifica di aggiornamento stato:', notifError);
      // Non interrompiamo il flusso se la notifica fallisce
    }
    
    res.json({
      message: 'Stato ordine aggiornato con successo',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error(`Errore nell'aggiornamento dello stato dell'ordine ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Annulla un ordine (utente)
router.put('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }
    
    // Verifica che l'utente sia il proprietario dell'ordine
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorizzato ad annullare questo ordine' });
    }
    
    // Verifica che l'ordine possa essere annullato (solo ordini in processing)
    if (order.status !== 'processing') {
      return res.status(400).json({ message: 'Solo gli ordini in elaborazione possono essere annullati' });
    }
    
    // Aggiorna lo stato e aggiungi alla cronologia
    order.status = 'cancelled';
    order.history.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason || 'Annullato dall\'utente'
    });
    
    await order.save();
    
    res.json({
      message: 'Ordine annullato con successo',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error(`Errore nell'annullamento dell'ordine ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Elimina un ordine (solo admin)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }
    
    // Elimina l'ordine
    await Order.findByIdAndDelete(id);
    
    // Registra l'operazione nei log
    console.log(`Ordine ${id} eliminato dall'admin ${req.user.id}`);
    
    res.json({
      message: 'Ordine eliminato con successo',
      orderId: id
    });
  } catch (error) {
    console.error(`Errore durante l'eliminazione dell'ordine ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

export default router; 