import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import passport from 'passport';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import './config/passport-config.js'; // Initialize passport strategies

// Load environment variables from backend/.env
dotenv.config({ path: '../.env' });

// Initialize Express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:5713', // Allow frontend origin
  credentials: true // Allow cookies to be sent
}));
app.use(morgan('dev')); // Logging HTTP requests
app.use(passport.initialize()); // Initialize passport

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://thang2904:svDLiqOHKeqKnLLZ@cluster0.qr86y.mongodb.net/TMDT_DT?retryWrites=true&w=majority&appName=Cluster0', {
      // Removed deprecated options
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Lỗi server',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});