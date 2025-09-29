import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple API endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Social Network API is running!', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Fallback endpoint for users (since Railway uses this server)
// Removed fallback endpoint - Railway should use backend/server.cjs

// Static frontend (serve from root directory)
app.use(express.static(__dirname));

// SPA fallback (skip asset files like .js, .css, images)
app.get('*', (req, res, next) => {
  if (req.path.includes('.')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


