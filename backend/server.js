const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const os = require('os');
require('dotenv').config();
const { isCloudinaryPdf, proxyCloudinaryPdf } = require('./lib/cloudinary');

const authRoutes = require('./routes/auth.routes');
const publicRoutes = require('./routes/public.routes');
const publicController = require('./controllers/public.controller');
const studentRoutes = require('./routes/student.routes');
const adminRoutes = require('./routes/admin.routes');

const PORT = process.env.PORT || 5000;

// Anti-Crash Global Handlers
process.on('uncaughtException', (err) => {
  console.error('CRITICAL ERROR (Uncaught Exception):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL ERROR (Unhandled Rejection):', reason);
});

console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const localIP = getLocalIP();

const app = express();
const prisma = require('./lib/prisma');

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(async (req, res, next) => {
  console.log("Request masuk:", req.url);
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Catch and redirect any Cloudinary URLs prepended with backend origin
  const matchCloudinary = req.url.match(/\/(https?):\/+(.*)/);
  if (matchCloudinary) {
    const targetUrl = `${matchCloudinary[1]}://${matchCloudinary[2]}`;
    if (isCloudinaryPdf(targetUrl)) {
      console.log(`[PROXY] Proxying Cloudinary PDF request: ${targetUrl}`);
      try {
        return await proxyCloudinaryPdf(targetUrl, res, 'document.pdf', false);
      } catch (err) {
        console.error(`[PROXY] Failed to proxy PDF: ${err.message}`);
        return res.status(500).send('Failed to load document');
      }
    }
    console.log(`[REDIRECT] Redirecting asset request directly to Cloudinary: ${targetUrl}`);
    return res.redirect(targetUrl);
  }
  
  next();
});

// Static files for uploads (dynamically routed to /tmp/uploads on Vercel)
const uploadRoot = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadRoot));

// Ensure upload directories exist
const fs = require('fs');
const uploadDirs = [
  '',
  'brosur',
  'hero',
  'logo',
  'announcements',
  'announcements/images',
  'announcements/pdf',
  'announcements/excel',
  'documents'
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(uploadRoot, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`[INIT] Created directory: ${fullPath}`);
  }
});

// Root Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'SPMB SMK Bina Putra API is running!',
    status: 'online',
    network_ip: localIP
  });
});

// API Info Route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'SPMB SMK Bina Putra API Base URL',
    endpoints: ['/auth', '/public', '/student', '/admin', '/health']
  });
});

// Routes
console.log('[DEBUG] Mounting routes...');
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
// Test direct route
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
console.log('[DEBUG] Routes mounted.');

// Test DB Connection
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: error.message });
  }
});




// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error detected:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(err.status || 500).json({ 
    message: 'Terjadi kesalahan pada server!', 
    error: err.message,
    path: req.url 
  });
});

// moved to top

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
  🚀 Server is running!
  🏠 Local:    http://localhost:${PORT}
  🌐 Network:  http://${localIP}:${PORT}
    `);
  });
}

module.exports = app;
