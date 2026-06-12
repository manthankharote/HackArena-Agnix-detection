require('dotenv').config();
require('dns').setServers(['8.8.8.8']);

// Global handlers to prevent crashes from unhandled library rejections (e.g. WhatsApp EBUSY)
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message || err);
  if (err.stack) console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const socketService = require('./services/socketService');
const { errorHandler } = require('./utils/helpers');

// Route imports
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const taskRoutes = require('./routes/tasks');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const detectionRoutes = require('./routes/detections');
const cctvRoutes = require('./routes/cctv');

// Connect DB and run migrations
connectDB().then(async () => {
  try {
    const User = require('./models/User');
    const Report = require('./models/Report');
    const Detection = require('./models/Detection');
    const { normalizeWard } = require('./utils/helpers');

    console.log('🔄 Running automated ward normalization migration...');

    // Migration for Users
    const users = await User.find({ ward: { $ne: null } });
    let updatedUsersCount = 0;
    for (const user of users) {
      const normalized = normalizeWard(user.ward);
      if (user.ward !== normalized) {
        user.ward = normalized;
        await user.save({ validateBeforeSave: false });
        updatedUsersCount++;
      }
    }

    // Migration for Reports
    const reports = await Report.find({ ward: { $ne: null } });
    let updatedReportsCount = 0;
    for (const report of reports) {
      const normalized = normalizeWard(report.ward);
      if (report.ward !== normalized) {
        report.ward = normalized;
        await report.save({ validateBeforeSave: false });
        updatedReportsCount++;
      }
    }

    // Migration for Detections
    const detections = await Detection.find({ ward: { $ne: null } });
    let updatedDetectionsCount = 0;
    for (const detection of detections) {
      const normalized = normalizeWard(detection.ward);
      if (detection.ward !== normalized) {
        detection.ward = normalized;
        await detection.save({ validateBeforeSave: false });
        updatedDetectionsCount++;
      }
    }

    if (updatedUsersCount > 0 || updatedReportsCount > 0 || updatedDetectionsCount > 0) {
      console.log(`✅ Ward normalization migration finished. Updated ${updatedUsersCount} users, ${updatedReportsCount} reports, ${updatedDetectionsCount} detections.`);
    } else {
      console.log('✅ Ward normalization migration finished. All records are already normalized.');
    }
  } catch (err) {
    console.error('❌ Ward normalization migration error:', err.message);
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});
socketService.init(io);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/detections', detectionRoutes);
app.use('/api/cctv', cctvRoutes);

// Root route - Status Page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
        <div style="text-align: center; border: 1px solid #334155; padding: 2rem; border-radius: 12px; background: #1e293b;">
          <h1 style="color: #22c55e;">🚀 CleanCity Backend is Live</h1>
          <p>Version 1.0.0 | Environment: ${process.env.NODE_ENV || 'development'}</p>
          <a href="/api/health" style="color: #38bdf8; text-decoration: none;">Check API Health →</a>
        </div>
      </body>
    </html>
  `);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CleanCity API is running', timestamp: new Date().toISOString() });
});

// WhatsApp diagnostic endpoints
const { getWhatsAppStatus, resetWhatsApp } = require('./services/whatsappService');

app.get('/api/whatsapp/status', (req, res) => {
  const status = getWhatsAppStatus();
  res.json({ success: true, ...status });
});

app.get('/api/whatsapp/reset', async (req, res) => {
  const result = await resetWhatsApp();
  res.json(result);
});

app.get('/api/whatsapp/scan', (req, res) => {
  const status = getWhatsAppStatus();
  if (status.isReady) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
          <div style="text-align: center; border: 1px solid #22c55e; padding: 2rem; border-radius: 12px; background: #1e293b;">
            <h1 style="color: #22c55e;">✅ WhatsApp Client is Ready!</h1>
            <p>You have successfully authenticated the agent.</p>
          </div>
        </body>
      </html>
    `);
  }
  
  if (status.initStatus === 'qr_ready' && status.qrCode) {
    return res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="5">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
        </head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
          <div style="text-align: center; border: 1px solid #334155; padding: 2rem; border-radius: 12px; background: #1e293b;">
            <h1 style="color: #38bdf8;">📲 Scan WhatsApp QR Code</h1>
            <p>Open WhatsApp on your phone, go to Linked Devices, and scan this QR code:</p>
            <div style="background: white; padding: 1.5rem; display: inline-block; border-radius: 8px; margin: 1rem 0;">
              <canvas id="qrcode"></canvas>
            </div>
            <p style="color: #94a3b8; font-size: 0.875rem;">Page auto-refreshes every 5 seconds. Status: <strong>${status.initStatus}</strong></p>
          </div>
          <script>
            try {
              new QRious({
                element: document.getElementById('qrcode'),
                value: ${JSON.stringify(status.qrCode)},
                size: 256
              });
            } catch (err) {
              console.error(err);
            }
          </script>
        </body>
      </html>
    `);
  }
  
  return res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="3">
      </head>
      <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
        <div style="text-align: center; border: 1px solid #e11d48; padding: 2rem; border-radius: 12px; background: #1e293b;">
          <h1 style="color: #f43f5e;">⏳ WhatsApp Client Loading...</h1>
          <p>Status: <strong>${status.initStatus}</strong></p>
          ${status.lastError ? `<p style="color: #f43f5e; background: #881337; padding: 0.5rem; border-radius: 6px;">Error: ${status.lastError}</p>` : ''}
          <p style="color: #94a3b8; font-size: 0.875rem;">Waiting for Puppeteer to launch. Page auto-refreshes every 3 seconds...</p>
        </div>
      </body>
    </html>
  `);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 CleanCity Backend running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server };
