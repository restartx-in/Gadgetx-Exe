class DashboardController {
  constructor(dashboardService) {
    this.service = dashboardService;
  }

  async getSummary(req, res, next) {
    try {
      // Pass req.db
      const summary = await this.service.getDashboardSummary(req.user.tenant_id, req.db);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;