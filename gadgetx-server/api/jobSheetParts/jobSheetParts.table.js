module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='job_sheet_parts';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "job_sheet_parts" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE job_sheet_parts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          job_id INT REFERENCES job_sheets(job_id) ON DELETE CASCADE,
          item_id INT REFERENCES item(id) ON DELETE CASCADE, -- Assuming PK of item is 'id'
          quantity INT NOT NULL,
          cost DECIMAL(12,2),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `)
      console.log('✅ "job_sheet_parts" table created.')
      await client.query(`
        CREATE INDEX idx_job_sheet_parts_tenant_id ON job_sheet_parts(tenant_id);
      `)
      await client.query(`
        CREATE INDEX idx_job_sheet_parts_job_id ON job_sheet_parts(job_id);
      `)
      await client.query(`
        CREATE INDEX idx_job_sheet_parts_item_id ON job_sheet_parts(item_id);
      `)
      console.log('✅ Indexes created on job_id and item_id.')
    }
  } catch (err) {
    console.error('❌ Error creating "job_sheet_parts" table:', err.message)
    throw err
  }
}
