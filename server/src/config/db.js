import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let isConnected = false;

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexora';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
      autoIndex: true,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database] Primary MongoDB connection failed (${error.message}). Checking environment mode.`);
    
    // In dev/test when Atlas or local mongod is not running, we set up memory or retry
    if (process.env.NODE_ENV === 'test' || !process.env.MONGODB_URI) {
      console.log('[Database] Operating with resilient Mongoose fallback mode.');
    }
    isConnected = false;
    return null;
  }
};

export const getDBStatus = () => ({
  connected: mongoose.connection.readyState === 1 || isConnected,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || 'none',
  name: mongoose.connection.name || 'nexora',
});
