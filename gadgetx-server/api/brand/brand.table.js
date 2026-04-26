module.exports = async (client) => {
  try {
    const result = await client.query(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='brand';
      `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "brand" table already exists.')
    } else {
      await client.query(`
          CREATE TABLE "brand" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
            name VARCHAR(100) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            done_by_id INTEGER REFERENCES "done_by"(id) ON DELETE SET NULL,
            cost_center_id INTEGER REFERENCES "cost_center"(id) ON DELETE SET NULL
          );
        `)

      console.log('✅ "brand" table has been created.')
      await client.query(`
          CREATE INDEX idx_brand_tenant_id ON brand(tenant_id);
        `)
      await client.query(
        `CREATE INDEX idx_brand_done_by_id ON brand(done_by_id);`
      )
      await client.query(
        `CREATE INDEX idx_brand_cost_center_id ON brand(cost_center_id);`
      )
    }
  } catch (err) {
    console.error('❌ Failed to create "brand" table:', err.message)
    throw err
  }
}
