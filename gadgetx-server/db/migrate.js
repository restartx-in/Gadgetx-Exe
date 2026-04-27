const createTables = require("./migrations/createTables"); // this is your migration.js
require("dotenv").config();
(async () => {
  console.log("-----------------------------------------");
  console.log(`🚀 Starting Migration to SQLite: ${process.env.DB_FILE || "inventoryx.db"}`);
  console.log("-----------------------------------------");
  
  await createTables()
    .then(() => {
      console.log("✅ Database structure created successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Migration failed!");
      console.error("Details:", err.message);
      process.exit(1);
    });
})();
