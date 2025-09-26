// Server semplificato per debug
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware base
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Health check semplificato
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Route di test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// Servi index.html per tutte le altre route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Avvio server
const server = app.listen(PORT, () => {
  console.log(`🚀 Simple Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Server ready!`);
});

// Gestione errori
server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

module.exports = app;
