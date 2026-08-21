import mongoose from 'mongoose';

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGO_URL ||
  'mongodb://127.0.0.1:27017/cloakvault';

export const connectDB = async (retries = 5, delayMs = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.error(`[MongoDB] Connection attempt ${i}/${retries} failed: ${error.message}`);
      if (i === retries) {
        console.error(`[MongoDB] Critical: Unable to connect to MongoDB Atlas after ${retries} attempts.`);
        process.exit(1);
      }
      console.log(`[MongoDB] Retrying connection in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};
