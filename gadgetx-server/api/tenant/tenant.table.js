module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='tenant';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "tenant" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE tenant (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL CHECK (type IN ('vehicle', 'restaurant', 'fitness', 'garage','gadget')),
            plan VARCHAR(50) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `)
      console.log('✅ "tenant" table has been created.')
    }
  } catch (err) {
    console.error('❌ Failed to create "tenant" table:', err.message)
    throw err
  }
}
