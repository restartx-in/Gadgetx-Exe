module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='mode_of_payment';
    `)
    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "mode_of_payment" table already exists.')
    } else {
        await client.query(`
        CREATE TABLE mode_of_payment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            done_by_id INTEGER REFERENCES "done_by"(id) ON DELETE SET NULL,
            cost_center_id INTEGER REFERENCES "cost_center"(id) ON DELETE SET NULL
        );
      `)
      console.log('✅ "mode_of_payment" table created with new structure.')

      // Create indexes
      await client.query(`CREATE INDEX idx_mop_tenant_id ON mode_of_payment(tenant_id);`)
      await client.query(`CREATE INDEX idx_mop_done_by_id ON mode_of_payment(done_by_id);`)
      await client.query(`CREATE INDEX idx_mop_cost_center_id ON mode_of_payment(cost_center_id);`)
      console.log('✅ Indexes for "mode_of_payment" table created.')
    }

  } catch (err) {
    console.error('❌ Error creating "mode_of_payment" table:', err.message)
    // Re-throwing the error is important for the migration script to fail
    throw err;
  }
}