module.exports = async (client) => {
  try {
    await client.query(updatePayrollTable);
    console.log("✅ payroll table updated (account_id to ledger_id).");

    console.log(
      "🚀 Database migration script (query.js) - No legacy migrations needed for fresh SQLite install.",
    );
    console.log("🎉 All migrations completed successfully.");
  } catch (e) {
    console.error("❌ An error occurred during migration:", e.message);
    throw e;
  }
};

const updatePayrollTable = `
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payroll' AND column_name='ledger_id') THEN
        ALTER TABLE payroll ADD COLUMN ledger_id INTEGER REFERENCES ledger(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payroll' AND column_name='account_id') THEN
        ALTER TABLE payroll DROP COLUMN account_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'payroll' AND indexname = 'idx_payroll_ledger_id') THEN
        CREATE INDEX idx_payroll_ledger_id ON payroll(ledger_id);
    END IF;
END $$;
`;
