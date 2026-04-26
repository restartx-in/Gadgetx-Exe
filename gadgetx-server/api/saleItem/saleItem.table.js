module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='sale_item';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "sale_item" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE sale_item (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          sales_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          item_id INTEGER NOT NULL REFERENCES item(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL,
          returned_quantity INTEGER NOT NULL DEFAULT 0, 
          unit_price DECIMAL(10, 2) NOT NULL,
          total_price DECIMAL(10, 2) NOT NULL,
          tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `)
      console.log('✅ "sale_item" table has been created.')

      await client.query(
        'CREATE INDEX idx_sale_item_tenant_id ON sale_item(tenant_id);'
      )
      await client.query(
        'CREATE INDEX idx_sale_item_sales_id ON sale_item(sales_id);'
      )
      await client.query(
        'CREATE INDEX idx_sale_item_item_id ON sale_item(item_id);'
      )
      console.log('✅ Indexes for "sale_item" table created.')
    }
  } catch (err) {
    console.error('❌ Failed to create "sale_item" table:', err.message)
    throw err
  }
}
