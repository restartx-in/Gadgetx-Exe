require("dotenv").config({ path: require("path").resolve(__dirname, ".env"), override: false });

const cors = require("cors");
const express = require("express");
const path = require("path"); 
const dbSelector = require("./middlewares/dbSelector"); 

const gadgetxapp = require("./app.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 4000;

app.use('/api/gadgetx', dbSelector('gadgetx'), gadgetxapp);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});