import * as dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/database";
import app from "./app";
import { seedDatabase } from "./utils/seeder"; // Import the seeder

const PORT = process.env.PORT || 8000;

// 1. Connect to Database
connectDB().then(async () => {
  
  // 2. Run Seeder (Only runs if Admin doesn't exist)
  await seedDatabase();

  // 3. Start Server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});