module.exports = async (client) => {
  console.log("🚀 Starting SQLite-compatible Database Migration...");

  /**
   * Helper function to run queries safely.
   * If a column already exists, SQLite throws an error; we catch it so the script continues.
   */
  const safeQuery = async (label, sql) => {
    try {
      await client.query(sql);
      console.log(`✅ ${label} successful.`);
    } catch (err) {
      if (err.message.includes("duplicate column name") || err.message.includes("already exists")) {
        console.log(`ℹ️ ${label} skipped (already exists).`);
      } else {
        console.warn(`⚠️ ${label} warning: ${err.message}`);
      }
    }
  };

  try {
    // --- 1. PAYROLL TABLE UPDATES ---
    
    // Add ledger_id
    await safeQuery(
      "Add ledger_id to payroll",
      `ALTER TABLE payroll ADD COLUMN ledger_id INTEGER REFERENCES ledger(id) ON DELETE CASCADE;`
    );

    // Try to drop account_id (Requires SQLite 3.35.0+)
    await safeQuery(
      "Drop account_id from payroll",
      `ALTER TABLE payroll DROP COLUMN account_id;`
    );

    // Create Index
    await safeQuery(
      "Create payroll ledger index",
      `CREATE INDEX IF NOT EXISTS idx_payroll_ledger_id ON payroll(ledger_id);`
    );


    // --- 2. SALES TABLE UPDATES ---

    await safeQuery(
      "Add ledger_id to sales",
      `ALTER TABLE sales ADD COLUMN ledger_id INTEGER REFERENCES ledger(id) ON DELETE SET NULL;`
    );

    await safeQuery(
      "Add change_return to sales",
      `ALTER TABLE sales ADD COLUMN change_return DECIMAL(10, 2) DEFAULT 0.00;`
    );

    await safeQuery(
      "Add status to sales",
      `ALTER TABLE sales ADD COLUMN status VARCHAR(255) DEFAULT 'unpaid';`
    );

    await safeQuery(
      "Create sales ledger index",
      `CREATE INDEX IF NOT EXISTS idx_sales_ledger_id ON sales(ledger_id);`
    );

    console.log("🎉 Database migration script completed successfully.");
  } catch (e) {
    console.error("❌ A critical error occurred during migration:", e.message);
    throw e;
  }
};