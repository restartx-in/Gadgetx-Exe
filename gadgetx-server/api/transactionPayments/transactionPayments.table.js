module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='transaction_payments';
    `);

    const tableExists = result.rows.length > 0;

    if (tableExists) {
      console.log('ℹ️ "transaction_payments" table already exists.');
    } else {
      await client.query(`
        CREATE TABLE transaction_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES tenant(id) ON DELETE CASCADE, 
          account_id INTEGER NOT NULL REFERENCES account(id),
          amount DECIMAL(10, 2) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

          mode_of_payment_id INTEGER REFERENCES mode_of_payment(id),
          sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
          sale_return_id INTEGER REFERENCES sale_return(id) ON DELETE CASCADE,
          purchase_id INTEGER REFERENCES purchase(id) ON DELETE CASCADE,
          purchase_return_id INTEGER REFERENCES purchase_return(id) ON DELETE CASCADE,

          CONSTRAINT check_single_transaction_link CHECK (
            (sale_id IS NOT NULL) +
            (sale_return_id IS NOT NULL) +
            (purchase_id IS NOT NULL) +
            (purchase_return_id IS NOT NULL) <= 1
          )
        );
      `);

      console.log('✅ "transaction_payments" table has been created.');

      const indexQueries = [
        `CREATE INDEX idx_srp_tenant_id ON transaction_payments(tenant_id);`,
        `CREATE INDEX idx_srp_sale_return_id ON transaction_payments(sale_return_id);`,
        `CREATE INDEX idx_srp_account_id ON transaction_payments(account_id);`,
        `CREATE INDEX idx_srp_mode_of_payment_id ON transaction_payments(mode_of_payment_id);`
      ];
      for (let q of indexQueries) {
        await client.query(q);
      }

      console.log('✅ Indexes for "transaction_payments" table created.');
    }
  } catch (err) {
    console.error('❌ Failed to create "transaction_payments" table:', err.message);
    throw err;
  }
};