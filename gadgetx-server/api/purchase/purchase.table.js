module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='purchase';
    `)
    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "purchase" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE purchase (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          party_id INTEGER NOT NULL REFERENCES party(id), 
          done_by_id INTEGER REFERENCES "done_by"(id) ON DELETE SET NULL,
          cost_center_id INTEGER REFERENCES "cost_center"(id) ON DELETE SET NULL,
          
          total_amount DECIMAL(10, 2) NOT NULL,
          paid_amount DECIMAL(10, 2) NOT NULL,
          discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          invoice_number VARCHAR(100) NOT NULL,
          date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(255) NOT NULL DEFAULT 'unpaid' -- <<< ADDED STATUS COLUMN
        );
      `)
      console.log('✅ "purchase" table created.')
      await client.query(
        `CREATE INDEX idx_purchase_tenant_id ON purchase(tenant_id);`
      )
      await client.query(
        `CREATE INDEX idx_purchase_party_id ON purchase(party_id);`
      )
      await client.query(
        `CREATE INDEX idx_purchase_done_by_id ON purchase(done_by_id);`
      )
      await client.query(
        `CREATE INDEX idx_purchase_cost_center_id ON purchase(cost_center_id);`
      )
      await client.query(
        `CREATE INDEX idx_purchase_status ON purchase(status);`
      )
      console.log(
        '✅ Indexes created on tenant_id, party_id, done_by_id, cost_center_id, and status.'
      )
    }
  } catch (err) {
    console.error('❌ Error creating "purchase" table:', err.message)
    throw err
  }
}
