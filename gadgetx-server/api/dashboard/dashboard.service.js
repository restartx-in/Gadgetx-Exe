class DashboardService {
  constructor(dashboardRepository) {
    this.dashboardRepository = dashboardRepository;
  }

  // ADDED: db param
  async getDashboardSummary(tenantId, db) {
    const [
      summary,
      weeklyChartData,
      topProductsPieData,
      topCustomersData,
      stockAlerts,
      recentSales,
      recentPurchases,
      recentExpenses,
    ] = await Promise.all([
      this.dashboardRepository.getFinancialSummary(db, tenantId),
      this.dashboardRepository.getWeeklySalesAndPurchases(db, tenantId),
      this.dashboardRepository.getTopSellingProducts(db, tenantId),
      this.dashboardRepository.getTopCustomers(db, tenantId),
      this.dashboardRepository.getStockAlerts(db, tenantId),
      this.dashboardRepository.getRecentSales(db, tenantId, 5),
      this.dashboardRepository.getRecentPurchases(db, tenantId, 5),
      this.dashboardRepository.getRecentExpenses(db, tenantId, 5),
    ]);
    
    return {
      summary,
      weeklyChartData,
      topProductsPieData,
      topCustomersData,
      stockAlerts,
      recentSales,
      recentPurchases,
      recentExpenses,
    };
  }
}

module.exports = DashboardService;