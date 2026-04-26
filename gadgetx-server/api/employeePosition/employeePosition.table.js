module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='employee_position';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "employee_position" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE "employee_position" (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          name VARCHAR(100) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          done_by_id INTEGER REFERENCES "done_by"(id) ON DELETE SET NULL,
          cost_center_id INTEGER REFERENCES "cost_center"(id) ON DELETE SET NULL
        );
      `)

      console.log('✅ "employee_position" table has been created.')

      await client.query(`
        CREATE INDEX idx_employeeposition_tenant_id ON "employee_position"(tenant_id);
      `)
      await client.query(
        `CREATE INDEX idx_employeeposition_done_by_id ON "employee_position"(done_by_id);`
      )
      await client.query(
        `CREATE INDEX idx_employeeposition_cost_center_id ON "employee_position"(cost_center_id);`
      )
    }
  } catch (err)
 {
    console.error('❌ Failed to create "employee_position" table:', err.message)
    throw err
  }
}