module.exports = async (client) => {
  console.log("🚀 Starting SQLite Cleanup & Migration...");

  /**
   * Helper function to run queries safely.
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
    // --- 1. CLEANUP: DELETE TABLES ---
    // Drop sale_item first because it depends on sales
    await client.query(`DROP TABLE IF EXISTS sale_item;`);
    console.log('✅ "sale_item" table deleted.');

    await client.query(`DROP TABLE IF EXISTS sales;`);
    console.log('✅ "sales" table deleted.');


    // --- 2. PAYROLL TABLE UPDATES (Fixing the account_id error) ---
    
    // Add ledger_id
    await safeQuery(
      "Add ledger_id to payroll",
      `ALTER TABLE payroll ADD COLUMN ledger_id INTEGER REFERENCES ledger(id) ON DELETE CASCADE;`
    );

    // Remove the problematic account_id column
    await safeQuery(
      "Drop account_id from payroll",
      `ALTER TABLE payroll DROP COLUMN account_id;`
    );

    // Create Index
    await safeQuery(
      "Create payroll ledger index",
      `CREATE INDEX IF NOT EXISTS idx_payroll_ledger_id ON payroll(ledger_id);`
    );

    console.log("🎉 Cleanup successful. Tables dropped and payroll updated.");
    console.log("ℹ️ Note: Your sales and sale_item tables will be re-created when you run your table creation scripts.");

  } catch (e) {
    console.error("❌ A critical error occurred during migration:", e.message);
    throw e;
  }
};