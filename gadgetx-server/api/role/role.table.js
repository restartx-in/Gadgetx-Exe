module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='role';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "role" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE "role" (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          name VARCHAR(255) NOT NULL,
          permissions TEXT, 
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (tenant_id, name)
        );
      `)
      console.log('✅ "role" table has been created.')

      await client.query(`
        CREATE INDEX idx_role_tenant_id ON role(tenant_id);
      `)
      console.log('✅ Indexes for "role" table have been created.')
    }
  } catch (err) {
    console.error('❌ Failed to create "role" table:', err.message)
    throw err
  }
}
