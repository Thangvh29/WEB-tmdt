// src/app.ts
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import config from './config/config.js'; // đảm bảo export MONGO_URI, PORT, CLIENT_URL, JWT_SECRET, NODE_ENV
import './passport/index.js'; // nếu bạn có config passport (optional)

import authRoutes from './routes/auth.routes.js'; // chỉnh tên/đường dẫn nếu khác

// Admin routes
import productAdminRoutes from './routes/admin/product.routes.js';
import orderAdminRoutes from './routes/admin/order.routes.js';
import postAdminRoutes from './routes/admin/post.routes.js';
import inventoryAdminRoutes from './routes/admin/inventory.routes.js';
import chatAdminRoutesFactory from './routes/admin/chat.routes.js'; // exported factory createChatRouter(io)? (we will mount in server.ts)
import userAdminRoutes from './routes/admin/user.routes.js';
import profileAdminRoutes from './routes/admin/profile.routes.js';
import dashboardAdminRoutes from './routes/admin/dashboard.routes.js';
import reviewAdminRoutes from './routes/admin/review.routes.js';

// User / public routes
// import userRoutes from './routes/user/user.routes.js';
// import postRoutes from './routes/user/post.routes.js';
// import orderUserRoutes from './routes/user/order.routes.js';
// import guestRoutes from './routes/guest/guest.routes.js';

// Multer uploads static path will be served here
const app = express();

// Serve uploads (ensure these folders exist: src/uploads/product, src/uploads/avatar, src/uploads/post)
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
console.log('Static uploads served from:', uploadsPath);

// CORS
app.use(
  cors({
    origin: config.FRONTEND_URL || 'localhost:5713',
    credentials: true,
  })
);

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

// --- Mount routes ---
// Public / auth
app.use('/api/auth', authRoutes);

// Admin related (protected by middlewares inside routes files)
app.use('/api/admin/products', productAdminRoutes);
app.use('/api/admin/orders', orderAdminRoutes);
app.use('/api/admin/posts', postAdminRoutes);
app.use('/api/admin/inventory', inventoryAdminRoutes);
app.use('/api/admin/users', userAdminRoutes);
app.use('/api/admin/profile', profileAdminRoutes);
app.use('/api/admin/dashboard', dashboardAdminRoutes);
app.use('/api/admin/reviews', reviewAdminRoutes);



// User / front-facing endpoints


// Guest
app.use('/api/guest', guestRoutes);

// NOTE: Chat admin router requires socket.io instance. We don't mount it here because
// we need to pass `io`. server.ts will mount chat router with the `io` instance.
// e.g. in server.ts: app.use('/api/admin/chat', createChatRouter(io));

// --- Simple health check ---
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// --- Error handler ---
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

// --- MongoDB connection initiated here (can also move to server.ts) ---
mongoose
  .connect(config.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    // Note: do not exit here if you prefer to retry elsewhere
  });

export default app;
