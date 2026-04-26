// party.table.js

module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='party';
    `)

    const tableExists = result.rows.length > 0
    if (tableExists) {
      console.log('ℹ️ "party" table already exists.')
    } else {
      await client.query(`
      CREATE TABLE party (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
         done_by_id INTEGER REFERENCES "done_by"(id) ON DELETE SET NULL,
         cost_center_id INTEGER REFERENCES "cost_center"(id) ON DELETE SET NULL,
         ledger_id INTEGER REFERENCES "ledger"(id) ON DELETE SET NULL,
         type VARCHAR(50) NOT NULL CHECK (type IN ('customer', 'supplier')),
         name VARCHAR(255) NOT NULL,
         email VARCHAR(255), -- UNIQUE constraint removed to allow nulls/duplicates
         phone VARCHAR(20),
         address TEXT,
         credit_limit DECIMAL(10, 2) DEFAULT 0.00, -- Specific to customers
         outstanding_balance DECIMAL(10, 2) DEFAULT 0.00, -- Specific to customers
         payment_terms VARCHAR(255), -- Specific to suppliers
         created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
      console.log('✅ "party" table created.')

      await client.query(
        `CREATE INDEX idx_party_tenant_id ON party(tenant_id);`
      )
      await client.query(`CREATE INDEX idx_party_type ON party(type);`)
      await client.query(
        `CREATE INDEX idx_party_done_by_id ON party(done_by_id);`
      )
      await client.query(
        `CREATE INDEX idx_party_cost_center_id ON party(cost_center_id);`
      )
      await client.query(
        `CREATE INDEX idx_party_ledger_id ON party(ledger_id);`
      ) 
      console.log('✅ Indexes for "party" table created.')
    }
  } catch (err) {
    console.error('❌ Error creating "party" table:', err.message)
  }
}