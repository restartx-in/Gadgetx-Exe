module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='ledger';
    `);

    const tableExists = result.rows.length > 0;

    if (tableExists) {
      console.log('ℹ️ "ledger" table already exists.');
    } else {
      await client.query(`
       CREATE TABLE ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
            done_by_id INTEGER REFERENCES "done_by"(id) ON DELETE SET NULL,
            cost_center_id INTEGER REFERENCES "cost_center"(id) ON DELETE SET NULL,
            name VARCHAR(255) NOT NULL,
            balance DECIMAL(30, 2) NOT NULL DEFAULT 0.00,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ "ledger" table has been created.');

      await client.query(`CREATE INDEX idx_ledger_tenant_id ON ledger(tenant_id);`);
      await client.query(
        `CREATE INDEX idx_ledger_done_by_id ON ledger(done_by_id);`
      );
      await client.query(
        `CREATE INDEX idx_ledger_cost_center_id ON ledger(cost_center_id);`
      );
      console.log('✅ Indexes for "ledger" table created.');
    }
  } catch (err) {
    console.error('❌ Failed to create "ledger" table:', err.message);
    throw err;
  }
};