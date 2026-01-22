import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { connectDB } from './lib/db.js';
import authroutes from './routes/auth.route.js'
import paymentRoutes from './routes/payment.route.js'
import batchroutes from './routes/batch.route.js'
import cookieParser from 'cookie-parser';
import adminroute from './routes/admin.route.js'
import cron from 'node-cron';
import Subscription from './models/subscription.model.js';
import timeout from 'express-timeout-handler';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(timeout.handler({
  timeout: 30000,
  onTimeout: function (req, res) {
    res.status(503).json({ message: 'Service unavailable. Please try again.' });
  }
}));

app.use(cookieParser())

// CORS: allow a list of origins. You can set `FRONTEND_URLS` in .env as a comma-separated list for production
const allowedOrigins = [
  "http://localhost:5174", // suffaheducation (local)
  "http://localhost:5173", // dashboard (local)
  ...(process.env.FRONTEND_URL_1 ? process.env.FRONTEND_URL_1.split(',') : []),
].map(s => s && s.trim()).filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Trust proxy when behind a reverse proxy (useful for secure cookies in production)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Basic security + performance middlewares
app.use(helmet());
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000, // limit each IP
});
app.use(apiLimiter);
app.use(compression());


// Routes
app.use('/api/auth', authroutes);
app.use('/api/batches', batchroutes);
app.use('/api/admin', adminroute);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running');
});

// cron job
// cron.schedule("0 0 * * *", async () => {
//   const now = new Date();
//   await Subscription.updateMany(
//     { expiryDate: { $lt: now } },
//     { status: "expired" }
//   );
//   console.log("Expired subscriptions updated");
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});

// Unified error handler (last middleware)
app.use((err, req, res, next) => {
  // Minimal, consistent error logging
  console.error(err && err.stack ? err.stack : err);
  const status = err && err.status ? err.status : 500;
  const message = err && err.message ? err.message : 'Internal Server Error';
  res.status(status).json({ message });
});