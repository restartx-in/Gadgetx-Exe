module.exports = async (client) => {
  try {
    await client.query(updatePayrollTable);
    console.log("✅ payroll table updated (account_id to ledger_id).");

    // We split these because SQLite doesn't support multiple ADD COLUMN in one ALTER TABLE
    // and the driver handles "duplicate column" errors automatically.
    await client.query(addLedgerIdToSales);
    await client.query(addChangeReturnToSales);
    await client.query(addStatusToSales);
    await client.query(addIndexToSales);
    console.log("✅ sales table updated (ledger_id, status, change_return).");


    console.log(
      "🚀 Database migration script (query.js) - SQLite compatible migrations executed.",
    );
    console.log("🎉 All migrations completed successfully.");
  } catch (e) {
    console.error("❌ An error occurred during migration:", e.message);
    throw e;
  }
};

const updatePayrollTable = `
    ALTER TABLE payroll ADD COLUMN ledger_id INTEGER REFERENCES ledger(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_payroll_ledger_id ON payroll(ledger_id);
`;

const addLedgerIdToSales = `ALTER TABLE sales ADD COLUMN ledger_id INTEGER REFERENCES ledger(id) ON DELETE SET NULL;`;
const addChangeReturnToSales = `ALTER TABLE sales ADD COLUMN change_return DECIMAL(10, 2) DEFAULT 0.00;`;
const addStatusToSales = `ALTER TABLE sales ADD COLUMN status VARCHAR(255) NOT NULL DEFAULT 'unpaid';`;
const addIndexToSales = `CREATE INDEX IF NOT EXISTS idx_sales_ledger_id ON sales(ledger_id);`;


