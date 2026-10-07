const express = require('express');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const recordRoutes = require('./routes/recordRoutes');
const kioskRoutes = require('./routes/kioskRoutes');
const ayushRoutes = require('./routes/ayushRoutes');
const clinicalSummaryRoutes = require('./routes/clinicalSummaryRoutes');
const consentRoutes = require('./routes/consentRoutes');
const interoperabilityRoutes = require('./routes/interoperabilityRoutes');
const interactionRoutes = require('./routes/interactionRoutes');

const app = express();

// Configure CORS for production (Vercel) and development (localhost)
const devOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Always allow local development origins
    if (devOrigins.includes(origin)) return callback(null, true);

    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim() : null;
    
    // Allow if FRONTEND_URL matches (supports single URL or comma-separated list)
    if (frontendUrl) {
      const allowedList = frontendUrl.split(',').map(u => u.trim().replace(/\/+$/, '')).filter(Boolean);
      if (allowedList.some(u => origin === u || origin.startsWith(u))) {
        return callback(null, true);
      }
      // Allow Vercel preview deployments if any FRONTEND_URL is on vercel.app
      if (allowedList.some(u => u.includes('vercel.app')) && origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    }

    // Allow in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Simple health check endpoint for Render / monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patient/records', recordRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/kiosk', kioskRoutes);
app.use('/api/ayush', ayushRoutes);
app.use('/api/clinical-summary', clinicalSummaryRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/interoperability', interoperabilityRoutes);
app.use('/api/interactions', interactionRoutes);

// Health check endpoint for API & Database status
const mongoose = require('mongoose');
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.status(200).json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      status: states[dbState] || 'unknown',
      connected: dbState === 1
    },
    version: '1.0.0',
    service: 'MediKiosk API'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Serve frontend build from frontend/dist
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback for React Router SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).send('Frontend build index.html not found. Please run "npm run build" first.');
    }
  });
});

module.exports = app;
