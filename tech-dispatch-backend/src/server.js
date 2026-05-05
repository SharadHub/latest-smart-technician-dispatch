import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./socket/index.js";
import { startJobExpiryScheduler } from "./jobs/jobExpiry.js";

connectDB();

const server = http.createServer(app);
initSocket(server);
startJobExpiryScheduler();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
