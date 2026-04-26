module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='done_by';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "done_by" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE "done_by" (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          name VARCHAR(100) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `)

      console.log('✅ "done_by" table has been created.')

      await client.query(`
        CREATE INDEX idx_doneby_tenant_id ON "done_by"(tenant_id);
      `)
    }
  } catch (err) {
    console.error('❌ Failed to create "done_by" table:', err.message)
    throw err
  }
}
