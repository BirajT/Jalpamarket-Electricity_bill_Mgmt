import mongoose from "mongoose";
import { db_config } from "./config.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(db_config.uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
