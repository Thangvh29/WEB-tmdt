import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import morgan from 'morgan';
import config from './config/config.js';
import { fileURLToPath } from 'url';


import './passport/index.js';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/user/product.routes.js';
import cartRoutes from './routes/user/cart.routes.js';
import postRoutes from './routes/user/post.routes.js';
import profileRoutes from './routes/user/profile.routes.js';
import orderRoutes from './routes/user/order.routes.js';

// Admin routes (nếu một số file route chưa có, comment routes tương ứng để tránh import-time error)
import productAdminRoutes from './routes/admin/product.routes.js';
import orderAdminRoutes from './routes/admin/order.routes.js';
import postAdminRoutes from './routes/admin/post.routes.js';
import inventoryAdminRoutes from './routes/admin/inventory.routes.js';
import userAdminRoutes from './routes/admin/user.routes.js';
import profileAdminRoutes from './routes/admin/profile.routes.js';
import dashboardAdminRoutes from './routes/admin/dashboard.routes.js';
import reviewAdminRoutes from './routes/admin/review.routes.js';
import categoryAdminRoutes from './routes/admin/category.routes.js';
import come
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Static uploads
const uploadsPath = path.resolve(__dirname, './uploads'); // ra backend/uploads
app.use('/uploads', express.static(uploadsPath));
console.log('Static uploads served from:', uploadsPath);

// CORS
app.use(
  cors({
    origin: config.FRONTEND_URL || "http://localhost:5173", // URL FE
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // Cho phép header Bearer
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
// Health check
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Error handler (last middleware)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err && (err.stack || err));
  const status = err?.status || 500;
  res.status(status).json({ message: err?.message || 'Internal server error' });
});

// Connect to Mongo (best-effort here, but startup continues if failure logged)
mongoose
  .connect(config.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err && (err.stack || err)));

export default app;