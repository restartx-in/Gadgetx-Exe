const { query } = require('./config/db');

async function fix() {
  try {
    console.log("🛠️ Starting tenant table schema fix...");
    
    // 1. Rename old table
    await query("ALTER TABLE tenant RENAME TO tenant_old");
    console.log("✅ Renamed old tenant table.");

    // 2. Create new table without CHECK constraint
    await query(`
      CREATE TABLE tenant (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'optical',
          plan VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Created new tenant table.");

    // 3. Copy data
    await query("INSERT INTO tenant (id, name, type, plan, created_at, updated_at) SELECT id, name, type, plan, created_at, updated_at FROM tenant_old");
    console.log("✅ Migrated data to new table.");

    // 4. Drop old table
    await query("DROP TABLE tenant_old");
    console.log("✅ Dropped old tenant table.");

    console.log("🎉 Successfully removed the CHECK constraint from the tenant table!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error fixing tenant table:", err.message);
    process.exit(1);
  }
}

fix();
