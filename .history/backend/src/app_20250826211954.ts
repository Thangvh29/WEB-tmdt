// frontend/src/app.ts
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import morgan from 'morgan';
import config from './config/config.js';
import { fileURLToPath } from 'url';
import { createChatRouter } from './routes/admin/chat.routes.js'; // Import chat routes

import './passport/index.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/user/product.routes.js';
import cartRoutes from './routes/user/cart.routes.js';
import postRoutes from './routes/user/post.routes.js';
import profileRoutes from './routes/user/profile.routes.js';
import orderRoutes from './routes/user/order.routes.js';
import productAdminRoutes from './routes/admin/product.routes.js';
import orderAdminRoutes from './routes/admin/order.routes.js';
import postAdminRoutes from './routes/admin/post.routes.js';
import inventoryAdminRoutes from './routes/admin/inventory.routes.js';
import userAdminRoutes from './routes/admin/user.routes.js';
import profileAdminRoutes from './routes/admin/profile.routes.js';
import dashboardAdminRoutes from './routes/admin/dashboard.routes.js';
import reviewAdminRoutes from './routes/admin/review.routes.js';
import categoryAdminRoutes from './routes/admin/category.routes.js';
import commentAdminRoutes from './routes/admin/comment.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Static uploads
const uploadsPath = path.resolve(__dirname, './Uploads');
app.use('/uploads', express.static(uploadsPath));
console.log('Static uploads served from:', uploadsPath);

// CORS
app.use(
  cors({
    origin: config.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Logger
app.use(morgan('dev'));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session
app.use(
  session({
    secret: config.JWT_SECRET || 'super_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: config.NODE_ENV === 'production' },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user/products', productRoutes);
app.use('/api/user/cart', cartRoutes);
app.use('/api/user/posts', postRoutes);
app.use('/api/user/profile', profileRoutes);
app.use('/api/user/orders', orderRoutes);

// Admin routes
app.use('/api/admin/products', productAdminRoutes);
app.use('/api/admin/orders', orderAdminRoutes);
app.use('/api/admin/posts', postAdminRoutes);
app.use('/api/admin/inventory', inventoryAdminRoutes);
app.use('/api/admin/users', userAdminRoutes);
app.use('/api/admin/profile', profileAdminRoutes);
app.use('/api/admin/dashboard', dashboardAdminRoutes);
app.use('/api/admin/reviews', reviewAdminRoutes);
app.use('/api/admin/categories', categoryAdminRoutes);
app.use('/api/admin/comments', commentAdminRoutes);

// Mount chat routes (NEW)
import { Server } from 'socket.io'; // Import Server để tạo io instance
const io = new Server(http.createServer(app), {
  cors: {
    origin: config.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.use('/api/admin', createChatRouter(io)); // Mount chat routes

// Health check
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err && (err.stack || err));
  const status = err?.status || 500;
  res.status(status).json({ message: err?.message || 'Internal server error' });
});

// MongoDB connection
mongoose
  .connect(config.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err && (err.stack || err)));

export default app;