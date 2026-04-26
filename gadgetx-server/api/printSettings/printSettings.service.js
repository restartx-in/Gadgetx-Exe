class PrintSettingsService {
  constructor(repository) {
    this.repository = repository
  }

  async getSettings(db, tenantId) {
    const settings = await this.repository.getByTenantId(db, tenantId)
    if (settings) {
      return settings
    }

    // Default settings for a new tenant
    return {
      tenant_id: tenantId,
      company_name: 'Tech Solutions Inc.',
      email: 'contact@techsolutions.com',
      phone: '+1 (555) 123-4567',
      store: ' ABC store',
      address: '123 Business Park, Suite 400\nNew York, NY 10001\nUnited States',
      header_image_url: null,
      image_height: null, 
      image_width: null, 
      tr_number: '',
      footer_message: '',
      print_type: 'thermal',
      qr_image_url: null,
      qr_width: null,
      qr_height: null,
      show_arabic_translations: false // The only new default field
    }
  }

  async updateSettings(db, tenantId, partialSettingsData) {
    const fullSettings = await this.getSettings(db, tenantId)
    const mergedSettings = { ...fullSettings, ...partialSettingsData }
    return this.repository.createOrUpdate(db, tenantId, mergedSettings)
  }
}

module.exports = PrintSettingsService