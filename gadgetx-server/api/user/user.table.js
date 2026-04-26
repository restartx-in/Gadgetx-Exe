module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='user';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "user" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE "user" (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE SET NULL, 
          role_id INTEGER REFERENCES "role"(id) ON DELETE SET NULL, 
          username VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          active BOOLEAN DEFAULT TRUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (tenant_id, username)
        );
      `)

      console.log('✅ "user" table has been created.')
    }
  } catch (err) {
    console.error('❌ Failed to create "user" table:', err.message)
    throw err
  }
}
