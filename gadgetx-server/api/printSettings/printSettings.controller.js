const { movePrintHeaderImage, movePrintQrImage } = require('../../middlewares/upload');

class PrintSettingsController {
  constructor(service) {
    this.service = service
  }

  async get(req, res, next) {
    try {
      const settings = await this.service.getSettings(req.db, req.user.tenant_id)
      res.json(settings)
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      // Collect body data (includes print_type, company_name, etc.)
      const settingsData = { ...req.body };

      // Check if files were uploaded (using upload.fields)
      if (req.files) {
        // Handle Header Image
        if (req.files.header_image && req.files.header_image[0]) {
          const imagePath = await movePrintHeaderImage(req.files.header_image[0], req.user.tenant_id);
          if (imagePath) {
            settingsData.header_image_url = `/uploads/${imagePath}`;
          }
        }

        // Handle QR Code Image
        if (req.files.qr_image && req.files.qr_image[0]) {
          const qrPath = await movePrintQrImage(req.files.qr_image[0], req.user.tenant_id);
          if (qrPath) {
            settingsData.qr_image_url = `/uploads/${qrPath}`;
          }
        }
      }

      const updatedSettings = await this.service.updateSettings(
        req.db,
        req.user.tenant_id,
        settingsData
      );
      res.json(updatedSettings);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PrintSettingsController;