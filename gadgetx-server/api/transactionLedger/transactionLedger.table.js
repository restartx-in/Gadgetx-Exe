module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='transaction_ledger';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "transaction_ledger" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE transaction_ledger (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER NOT NULL,
          transaction_id INTEGER NOT NULL REFERENCES "transaction"(id) ON DELETE CASCADE,
          account_id INTEGER NOT NULL REFERENCES account(id) ON DELETE CASCADE,
          debit NUMERIC(12,2) DEFAULT 0 CHECK (debit >= 0),
          credit NUMERIC(12,2) DEFAULT 0 CHECK (credit >= 0),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `)
      console.log('✅ "transaction_ledger" table created.')

      const indexQueries = [
        `CREATE INDEX idx_transaction_ledger_tenant_id ON transaction_ledger(tenant_id);`,
        `CREATE INDEX idx_transaction_ledger_transaction_id ON transaction_ledger(transaction_id);`,
        `CREATE INDEX idx_transaction_ledger_account_id ON transaction_ledger(account_id);`
      ];
      for (let q of indexQueries) {
        await client.query(q);
      }
      console.log('✅ Indexes created on tenant_id, transaction_id, and account_id columns of "transaction_ledger" table.')
    }
  } catch (err) {
    console.error('❌ Error creating "transaction_ledger" table:', err.message)
    throw err
  }
}