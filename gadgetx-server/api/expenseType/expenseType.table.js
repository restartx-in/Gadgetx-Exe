module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='expense_type';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "expense_type" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE "expense_type" (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          name VARCHAR(100) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `)

      console.log('✅ "expense_type" table has been created.')

      await client.query(`
        CREATE INDEX idx_expensetype_tenant_id ON "expense_type"(tenant_id);
      `)
    }
  } catch (err) {
    console.error('❌ Failed to create "expense_type" table:', err.message)
    throw err
  }
}
