// ================ API PHARMACONNECT - VERSION ULTRA COMPACTE ================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { WebSocketServer } = require('ws');
const app = express();
mongoose.connect

// Config de base
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmaconnect';

// Connexion DB
mongoose.connect(MONGODB_URI).then(() => console.log('✅ DB connectée')).catch(err => console.error('❌ Erreur DB:', err));

// Modèle Order
const Order = mongoose.model('Order', {
  pharmacyId: String,
  customer: { name: String, phone: String },
  medications: [{ name: String, quantity: Number }],
  status: { type: String, default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

// Middleware
app.use(express.json());

// Routes
app.post('/api/orders', async (req, res) => {
  try {
    const order = await Order.create(req.body);
    broadcast(order); // Envoi temps réel
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/orders/:pharmacyId', async (req, res) => {
  const orders = await Order.find({ pharmacyId: req.params.pharmacyId }).sort('-createdAt');
  res.json(orders);
});

// WebSocket
const server = app.listen(PORT, () => console.log(`🚀 API sur http://localhost:${PORT}`));
const wss = new WebSocketServer({ server });
const clients = new Map();

wss.on('connection', (ws, req) => {
  const pharmacyId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('pharmacyId');
  if (pharmacyId) clients.set(pharmacyId, ws);
  ws.on('close', () => clients.delete(pharmacyId));
});

function broadcast(order) {
  const ws = clients.get(order.pharmacyId);
  ws && ws.send(JSON.stringify({ type: 'NEW_ORDER', data: order }));
}


// ================ CONFIG MINIMALE .env ================
/*
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pharmaconnect
PORT=5000
*/