class JobSheetPrintSettingsService {
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
      email: 'service@techsolutions.com',
      phone: '+1 (555) 123-4567',
      store: 'Service Center',
      address: '123 Business Park, Suite 400\nNew York, NY 10001\nUnited States',
      header_image_url: null,
      image_height: null, 
      image_width: null, 
      tr_number: '',
      footer_message: 'Thank you for choosing our service!',
      print_type: 'thermal',
      show_arabic_translations: false // Added default value
    }
  }

  async updateSettings(db, tenantId, partialSettingsData) {
    const fullSettings = await this.getSettings(db, tenantId)
    const mergedSettings = { ...fullSettings, ...partialSettingsData }
    return this.repository.createOrUpdate(db, tenantId, mergedSettings)
  }
}

module.exports = JobSheetPrintSettingsService