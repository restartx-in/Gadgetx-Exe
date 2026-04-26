module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='voucher';
    `);
    const tableExists = result.rows.length > 0;

    if (tableExists) {
      console.log('ℹ️ "voucher" table already exists.');
    } else {
      await client.query(`
        CREATE TABLE voucher (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE,
          amount DECIMAL(10, 2) NOT NULL,
          date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          description TEXT,
          voucher_no VARCHAR(100) NOT NULL UNIQUE,
          voucher_type INTEGER NOT NULL, -- 0 for paid, 1 for received
          from_ledger_id INTEGER REFERENCES "ledger"(id) ON DELETE SET NULL,
          to_ledger_id INTEGER REFERENCES "ledger"(id) ON DELETE SET NULL,
          cost_center_id INTEGER REFERENCES "cost_center"(id) ON DELETE SET NULL,
          done_by_id INTEGER REFERENCES "done_by"(id) ON DELETE SET NULL,
          mode_of_payment_id INTEGER REFERENCES mode_of_payment(id)
        );
      `);
      console.log('✅ "voucher" table created.');
      
      const indexQueries = [
        `CREATE INDEX idx_voucher_tenant_id ON voucher(tenant_id);`,
        `CREATE INDEX idx_voucher_from_ledger_id ON voucher(from_ledger_id);`,
        `CREATE INDEX idx_voucher_to_ledger_id ON voucher(to_ledger_id);`,
        `CREATE INDEX idx_voucher_cost_center_id ON voucher(cost_center_id);`,
        `CREATE INDEX idx_voucher_done_by_id ON voucher(done_by_id);`,
        `CREATE INDEX idx_voucher_mode_of_payment_id ON voucher(mode_of_payment_id);`
      ];
      for (let q of indexQueries) {
        await client.query(q);
      }
      console.log('✅ Indexes created for "voucher" table.');
    }
  } catch (err) {
    console.error('❌ Error creating "voucher" table:', err.message);
    throw err;
  }
};
