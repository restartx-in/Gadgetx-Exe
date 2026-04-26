class JobSheetPrintSettingsRepository {

  async getByTenantId(db, tenantId) {
    const { rows } = await db.query(
      `SELECT 
        tenant_id, company_name, email, phone, store, address, 
        header_image_url, image_height, image_width, tr_number, footer_message,
        print_type, show_arabic_translations
       FROM job_sheet_print_settings WHERE tenant_id = $1`,
      [tenantId]
    )
    return rows[0]
  }

  async createOrUpdate(db, tenantId, settingsData) {
    const { 
      company_name, email, phone, address, store, 
      header_image_url, image_height, image_width, 
      tr_number, footer_message, print_type,
      show_arabic_translations // Added field
    } = settingsData;

    // Convert boolean string from FormData to a real boolean
    const showArabicBool = show_arabic_translations === 'true';

    const { rows } = await db.query(
      `
      INSERT INTO job_sheet_print_settings (
        tenant_id, company_name, email, phone, address, store, 
        header_image_url, image_height, image_width, tr_number, footer_message, print_type,
        show_arabic_translations
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (tenant_id) DO UPDATE
      SET
        company_name = COALESCE($2, job_sheet_print_settings.company_name),
        email = COALESCE($3, job_sheet_print_settings.email),
        phone = COALESCE($4, job_sheet_print_settings.phone),
        address = COALESCE($5, job_sheet_print_settings.address),
        store = COALESCE($6, job_sheet_print_settings.store),
        header_image_url = COALESCE($7, job_sheet_print_settings.header_image_url),
        image_height = COALESCE($8, job_sheet_print_settings.image_height),
        image_width = COALESCE($9, job_sheet_print_settings.image_width),
        tr_number = COALESCE($10, job_sheet_print_settings.tr_number),
        footer_message = COALESCE($11, job_sheet_print_settings.footer_message),
        print_type = COALESCE($12, job_sheet_print_settings.print_type),
        show_arabic_translations = COALESCE($13, job_sheet_print_settings.show_arabic_translations)
      RETURNING *
      `,
      [
        tenantId, company_name, email, phone, address, store, 
        header_image_url, image_height, image_width, tr_number, footer_message, print_type,
        showArabicBool // Use the converted boolean
      ]
    )
    return rows[0]
  }
}

module.exports = JobSheetPrintSettingsRepository