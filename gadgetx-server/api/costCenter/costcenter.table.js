module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='cost_center';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "cost_center" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE "cost_center" (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          name VARCHAR(100) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `)

      console.log('✅ "cost_center" table has been created.')

      await client.query(`
        CREATE INDEX idx_costcenter_tenant_id ON "cost_center"(tenant_id);
      `)
    }
  } catch (err) {
    console.error('❌ Failed to create "cost_center" table:', err.message)
    throw err
  }
}
