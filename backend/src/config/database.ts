import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("❌ MONGO_URI is not defined in environment variables!");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Mongoose connected to MongoDB');
  } catch (error: any) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
