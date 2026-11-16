import app from './app.js';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect database
  await connectDB();

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  NEXORA API SERVER RUNNING ON PORT ${PORT} `);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
};

startServer();
