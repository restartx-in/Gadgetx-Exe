require("dotenv").config({ path: require("path").resolve(__dirname, ".env"), override: false });

const cors = require("cors");
const express = require("express");
const path = require("path"); 
const dbSelector = require("./middlewares/dbSelector"); 

const gadgetxapp = require("./app.routes");
const createTables = require("./db/migrations/createTables");

const app = express();

// Run migrations on startup
createTables()
  .then(() => console.log("✅ Database tables verified/created"))
  .catch((err) => console.error("❌ Database migration failed:", err));

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 4000;

app.use('/api', dbSelector('gadgetx'), gadgetxapp);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

process.on('exit', (code) => {
  console.log(`⚠️ Process about to exit with code: ${code}`);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log("📡 Attempting to start server...");
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});

server.on('close', () => {
  console.log('🛑 Server closed');
});

server.on('error', (err) => {
  console.error('❌ Server error event:', err);
});