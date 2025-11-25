import * as dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/database";
import app from "./app";

const PORT = process.env.PORT || 8000;

connectDB();
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
