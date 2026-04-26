const { movePrintHeaderImage } = require('../../middlewares/upload');

class JobSheetPrintSettingsController {
  constructor(service) {
    this.service = service
  }

  async get(req, res, next) {
    try {
      // Pass req.db
      const settings = await this.service.getSettings(req.db, req.user.tenant_id)
      res.json(settings)
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const settingsData = { ...req.body };

      if (req.file) {
        const imagePath = await movePrintHeaderImage(req.file, req.user.tenant_id);
        if (imagePath) {
          settingsData.header_image_url = `/uploads/${imagePath}`;
        }
      }

      // Pass req.db
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

module.exports = JobSheetPrintSettingsController;