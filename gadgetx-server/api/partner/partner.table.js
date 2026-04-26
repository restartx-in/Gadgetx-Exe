module.exports = async (client) => {
  try {
    const result = await client.query(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='partner';
        `)

    const tableExists = result.rows.length > 0
    if (tableExists) {
      console.log('ℹ️ "partner" table already exists.')
    } else {
      await client.query(`
                CREATE TABLE partner (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
                done_by_id INTEGER REFERENCES "done_by"(id) ON DELETE SET NULL, -- <<< ADDED
                cost_center_id INTEGER REFERENCES "cost_center"(id) ON DELETE SET NULL, -- <<< ADDED
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                `)
      console.log('✅ "partner" table created.')
      await client.query(
        `CREATE INDEX idx_partner_tenant_id ON partner(tenant_id);`
      )
      await client.query(
        `CREATE INDEX idx_partner_done_by_id ON partner(done_by_id);`
      ) // <<< ADDED
      await client.query(
        `CREATE INDEX idx_partner_cost_center_id ON partner(cost_center_id);`
      ) // <<< ADDED
      console.log('✅ Indexes for "partner" table created.')
    }
  } catch (err) {
    console.error('❌ Error creating "partner" table:', err.message)
  }
}
