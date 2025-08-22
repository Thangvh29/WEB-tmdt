import dotenv from 'dotenv';

dotenv.config(); 

const config = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'MONGO_URI=mongodb+srv://thang2904:svDLiqOHKeqKnLLZ@cluster0.qr86y.mongodb.net/TMDT_DT?retryWrites=true&w=majority&appName=Cluster0',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_key',
  NODE_ENV: process.env.NODE_ENV || 'development',
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET.
};

export default config;
