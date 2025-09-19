import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import morgan from 'morgan';
import fs from 'fs'; // ✅ Thêm fs để kiểm tra
import config from './config/config.js';
import { fileURLToPath } from 'url';

import './passport/index.js';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/user/product.routes.js';
import cartRoutes from './routes/user/cart.routes.js';
import postRoutes from './routes/user/post.routes.js';
import profileRoutes from './routes/user/profile.routes.js';
import orderRoutes from './routes/user/order.routes.js';

// Admin routes
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

// ✅ DEBUG: Kiểm tra uploads path
const uploadsPath = path.resolve(__dirname, './uploads');
console.log('🔍 Uploads path:', uploadsPath);
console.log('🔍 Path exists:', fs.existsSync(uploadsPath));

// Kiểm tra các subfolder
const postPath = path.join(uploadsPath, 'post');
const productPath = path.join(uploadsPath, 'product');
console.log('🔍 Post folder exists:', fs.existsSync(postPath));
console.log('🔍 Product folder exists:', fs.existsSync(productPath));

// Tạo folder nếu chưa có
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✅ Created uploads directory');
}
if (!fs.existsSync(postPath)) {
  fs.mkdirSync(postPath, { recursive: true });
  console.log('✅ Created post directory');
}
if (!fs.existsSync(productPath)) {
  fs.mkdirSync(productPath, { recursive: true });
  console.log('✅ Created product directory');
}

// Static uploads
app.use('/uploads', express.static(uploadsPath));
console.log('✅ Static uploads served from:', uploadsPath);

// CORS
app.use(
  cors({
    origin: config.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Logger
app.use(morgan('dev'));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session (optional)
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

app.use('/api/auth', authRoutes);
// Mount routes
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

// Health check
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// ✅ DEBUG: Test route để kiểm tra static files
app.get('/debug/uploads', (req, res) => {
  try {
    const postFiles = fs.existsSync(postPath) ? fs.readdirSync(postPath) : [];
    const productFiles = fs.existsSync(productPath) ? fs.readdirSync(productPath) : [];
    
    res.json({
      uploadsPath,
      postPath,
      productPath,
      postFiles: postFiles.slice(0, 5), // chỉ hiển thị 5 file đầu
      productFiles: productFiles.slice(0, 5),
      postFileCount: postFiles.length,
      productFileCount: productFiles.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handler (last middleware)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err && (err.stack || err));
  const status = err?.status || 500;
  res.status(status).json({ message: err?.message || 'Internal server error' });
});

// Connect to Mongo
mongoose
  .connect(config.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err && (err.stack || err)));

export default app;