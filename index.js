import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './lib/db.js';
import authroutes from './routes/auth.route.js'
import paymentRoutes from './routes/payment.route.js'
import batchroutes from './routes/batch.route.js'
import cookieParser from 'cookie-parser';
import adminroute from './routes/admin.route.js'
import cron from 'node-cron';
import Subscription from './models/subscription.model.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser())
app.use(cors({
  origin: [
    "http://localhost:5174", // suffaheducation
    "http://localhost:5173", // dashboard
  ],
  credentials: true,
}));


// Routes
app.use('/api/auth', authroutes);
app.use('/api/batches', batchroutes);
app.use('/api/admin', adminroute);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running');
});

// cron job
cron.schedule("0 0 * * *", async () => {
  const now = new Date();
  await Subscription.updateMany(
    { expiryDate: { $lt: now } },
    { status: "expired" }
  );
  console.log("Expired subscriptions updated");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});