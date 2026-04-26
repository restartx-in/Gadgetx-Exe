

module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='sales';
    `)
    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "sales" table already exists.')

    } else {
      await client.query(`
        CREATE TABLE sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          party_id INTEGER NOT NULL REFERENCES party(id), 
          done_by_id INTEGER REFERENCES "done_by"(id) ON DELETE SET NULL,
          cost_center_id INTEGER REFERENCES "cost_center"(id) ON DELETE SET NULL,
          total_amount DECIMAL(10, 2) NOT NULL,
          paid_amount DECIMAL(10, 2) NOT NULL,
          change_return DECIMAL(10, 2) DEFAULT 0.00, -- <<< ADDED
          discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(255) NOT NULL,
          invoice_number VARCHAR(100) NOT NULL,
          note TEXT DEFAULT NULL
        );
      `)
      console.log('✅ "sales" table created.')

      await client.query(
        `CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);`
      )
      await client.query(`CREATE INDEX idx_sales_party_id ON sales(party_id);`)
      await client.query(
        `CREATE INDEX idx_sales_done_by_id ON sales(done_by_id);`
      )
      await client.query(
        `CREATE INDEX idx_sales_cost_center_id ON sales(cost_center_id);`
      )
      console.log('✅ Indexes for "sales" table created.')
    }
  } catch (err) {
    console.error('❌ Error creating "sales" table:', err.message)
    throw err
  }
}