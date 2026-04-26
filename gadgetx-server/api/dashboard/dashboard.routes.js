const express = require("express");
const router = express.Router();
const validateToken = require("../../middlewares/validateToken");
// REMOVED: const db = require("../../config/db");

const DashboardRepository = require("./dashboard.repository");
const DashboardService = require("./dashboard.service");
const DashboardController = require("./dashboard.controller");

// Import Sales Service dependencies (though DashboardService only uses DashboardRepository based on provided code)
const SalesRepository = require("../sales/sales.repository");
const ItemRepository = require("../item/item.repository");

// Initialize dependencies (Stateless)
const dashboardRepository = new DashboardRepository();
const salesRepository = new SalesRepository();
const itemRepository = new ItemRepository();


// Inject dependencies
// Note: DashboardService constructor in provided file only takes dashboardRepository
const dashboardService = new DashboardService(dashboardRepository); 
const dashboardController = new DashboardController(dashboardService);

router.get("/summary", validateToken, dashboardController.getSummary.bind(dashboardController));

module.exports = router;