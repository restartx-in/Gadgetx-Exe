module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='print_settings';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "print_settings" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE print_settings (
          tenant_id INTEGER PRIMARY KEY REFERENCES "tenant"(id) ON DELETE CASCADE, 
          company_name TEXT,
          email TEXT,
          phone TEXT,
          address TEXT,
          store TEXT,
          image_height TEXT,
          image_width TEXT,
          tr_number TEXT, 
          qr_image_url TEXT,
          qr_width TEXT,
          qr_height TEXT,
          print_type TEXT DEFAULT 'thermal',
          footer_message TEXT,
          header_image_url TEXT,
          show_arabic_translations BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );  
      `)
   
      console.log('✅ "print_settings" table has been created.')
    }
  } catch (err) {
    console.error(
      '❌ Failed to create or update "print_settings" table:',
      err.message
    )
    throw err
  }
}