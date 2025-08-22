import dotenv from 'dotenv';

dotenv.config(); 

const config = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'MONGO_URI=mongodb+srv://thang29:svDLiqOHKeqKnLLZ@cluster0.qr86y.mongodb.net/TMDT_DT?retryWrites=true&w=majority&appName=Cluster0',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_key',
  NODE_ENV: process.env.NODE_ENV || 'development',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID || 'your_facebook_client_id',
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET || 'your_facebook_client_secret',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5713',
};

export default config;
