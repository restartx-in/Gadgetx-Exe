module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='invoice_number';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "invoice_number" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE invoice_number (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          transaction_type VARCHAR(50) NOT NULL,
          value INT DEFAULT 0,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (tenant_id, transaction_type)
        );
      `)

      console.log('✅ "invoice_number" table has been created.')

      await client.query(`
        CREATE INDEX idx_invoice_number_tenant_id ON "invoice_number"(tenant_id);
      `)
    }
  } catch (err) {
    console.error('❌ Failed to create "invoice_number" table:', err.message)
    throw err
  }
}
