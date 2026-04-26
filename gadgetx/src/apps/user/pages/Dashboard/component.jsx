import React, { useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FaShoppingCart,
  FaArrowRight,
  FaArrowLeft,
  FaHandHoldingUsd,
  FaDollarSign,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import TextBadge from "@/apps/user/components/TextBadge";
import { useDashboardSummary } from "@/hooks/api/summary/useDashboardSummary";
import SummaryCard from "@/apps/user/components/SummaryCard";
import Loader from "@/components/Loader";
import AmountSymbol from "@/components/AmountSymbol";
import useFetchPrintSettings from "@/hooks/api/printSettings/useFetchPrintSettings";
import useFetchSettings from "@/hooks/api/settings/useFetchSettings";

import "./style.scss";

const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];
const CUSTOMER_PIE_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#ddd6fe",
];

const CARD_COLORS = {
  expense: "#3498db",
  service: "#fd5bf5bd",
  sales: "#2e8b57",
  purchases: "#4682b4",
  sales_returns: "#ffa500",
  purchase_returns: "#dc143c",
  today_sales: "#6a5acd",
  today_received: "#20b2aa",
  today_purchases: "#778899",
  today_expenses: "#b22222",
  today_service_cost: "#f2786dbd",
  today_service_profit: "#91fd25bd",
};

// ✅ Recent Sales Table (Corrected)
const RecentSalesTable = ({ data = [] }) => (
  <div className="responsive-table fs16 fw600">
    <table>
      <thead>
        <tr>
          <th>Customer</th>
          <th>Status</th>
          <th>Grand Total</th>
          <th>Paid</th>
          {/* <th>Due</th> */}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan="5" style={{ textAlign: "center" }}>
              No recent sales found.
            </td>
          </tr>
        ) : (
          data.map((sale) => (
            <tr key={sale.reference}>
              <td data-label="Customer">{sale.party || "N/A"}</td>
              <td data-label="Status">
                <TextBadge variant="paymentStatus" type={sale.paymentStatus}>
                  {sale.paymentStatus}
                </TextBadge>
              </td>
              <td data-label="Grand Total">
                <AmountSymbol>{sale.grandTotal}</AmountSymbol>
              </td>
              <td style={{ color: "green" }} data-label="Paid">
                <AmountSymbol>{sale.paid}</AmountSymbol>
              </td>
              {/* <td style={{ color: "red" }} data-label="Due">
                <AmountSymbol>{sale.due}</AmountSymbol>
              </td> */}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// ✅ Recent Purchases Table (New)
const RecentPurchasesTable = ({ data = [] }) => (
  <div className="responsive-table fs16 fw600">
    <table>
      <thead>
        <tr>
          <th>Supplier</th>
          <th>Status</th>
          <th>Grand Total</th>
          <th>Paid</th>
          {/* <th>Due</th> */}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan="5" style={{ textAlign: "center" }}>
              No recent purchases found.
            </td>
          </tr>
        ) : (
          data.map((purchase) => (
            <tr key={purchase.reference}>
              <td data-label="Supplier">{purchase.party || "N/A"}</td>
              <td data-label="Status">
                <TextBadge
                  variant="paymentStatus"
                  type={purchase.paymentStatus}
                >
                  {purchase.paymentStatus}
                </TextBadge>
              </td>
              <td data-label="Grand Total">
                <AmountSymbol>{purchase.grandTotal}</AmountSymbol>
              </td>
              <td style={{ color: "green" }} data-label="Paid">
                <AmountSymbol>{purchase.paid}</AmountSymbol>
              </td>
              {/* <td style={{ color: "red" }} data-label="Due">
                <AmountSymbol>{purchase.due}</AmountSymbol>
              </td> */}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// ✅ Recent Expenses Table (New)
const RecentExpensesTable = ({ data = [] }) => (
  <div className="responsive-table fs16 fw600">
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Description</th>
          <th>Grand Total</th>
          <th>Paid</th>
          {/* <th>Due</th> */}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan="5" style={{ textAlign: "center" }}>
              No recent expenses found.
            </td>
          </tr>
        ) : (
          data.map((expense) => (
            <tr key={expense.reference}>
              <td data-label="Category">{expense.category || "N/A"}</td>
              <td data-label="Description">{expense.description}</td>
              <td data-label="Grand Total">
                <AmountSymbol>{expense.grandTotal}</AmountSymbol>
              </td>
              <td style={{ color: "green" }} data-label="Paid">
                <AmountSymbol>{expense.paid}</AmountSymbol>
              </td>
              {/* <td style={{ color: "red" }} data-label="Due">
                <AmountSymbol>{expense.due}</AmountSymbol>
              </td> */}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// ✅ Stock Alert Table
const StockAlertTable = ({ data = [] }) => (
  <div className="responsive-table">
    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Product</th>
          <th>Quantity</th>
          <th>Alert Quantity</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan="4" style={{ textAlign: "center" }}>
              No items are below stock alert level.
            </td>
          </tr>
        ) : (
          data.map((item) => (
            <tr key={item.code}>
              <td data-label="Code">{item.code}</td>
              <td data-label="Product">{item.product}</td>
              <td data-label="Quantity">
                <span className="quantity-badge quantity-badge--low">
                  {item.quantity} units
                </span>
              </td>
              <td style={{ color: "red" }} data-label="Alert Quantity">
                <span className="quantity-badge quantity-badge--alert">
                  {item.alert_quantity} units
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useDashboardSummary();
  const { data: printSettings } = useFetchPrintSettings();

  const { data: userSettings } = useFetchSettings();

  useEffect(() => {
    if (printSettings) {
      localStorage.setItem("PRINT_SETTINGS", JSON.stringify(printSettings));
    }
  }, [printSettings]);

  useEffect(() => {
    if (userSettings) {
      const defaultCostCenterId =
        userSettings.user_settings?.default_cost_center_id;
      if (defaultCostCenterId) {
        localStorage.setItem("DEFAULT_COST_CENTER", defaultCostCenterId);
      } else {
        localStorage.removeItem("DEFAULT_COST_CENTER");
      }
    }
  }, [userSettings]);

  if (isLoading) {
    return (
      <div className="dashboard-status">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return <div className="dashboard-status error">Error: {error.message}</div>;
  }

  const summary = data?.summary || {};
  const weeklyChartData = data?.weeklyChartData || [];

  const topProductsPieData = (data?.topProductsPieData || []).map((item) => ({
    name: item.name || item.product || "Unknown",
    value: Number(item.value || item.total || 0),
  }));

  const topCustomersData = (data?.topCustomersData || []).map((item) => ({
    name: item.name || item.customer || "Unknown",
    value: Number(item.value || item.salesTotal || 0),
  }));

  const recentSalesData = data?.recentSales || [];
  const recentPurchasesData = data?.recentPurchases || []; // New
  const recentExpensesData = data?.recentExpenses || []; // New
  const stockAlertData = data?.stockAlerts || [];

  return (
    <div className="dashboard">
      {/* Summary Cards */}
      <section className="dashboard__stats-grid-8">
        <SummaryCard
          theme="sales"
          icon={FaHandHoldingUsd}
          color={CARD_COLORS.sales}
          label="Sales"
          value={<AmountSymbol>{summary.sales?.total}</AmountSymbol>}
          subStats={[
            {
              label: "Received",
              value: <AmountSymbol>{summary.sales?.paid}</AmountSymbol>,
            },
            {
              label: "Balance",
              value: <AmountSymbol>{summary.sales?.pending}</AmountSymbol>,
              align: "end",
            },
          ]}
        />

        <SummaryCard
          theme="purchases"
          icon={FaShoppingCart}
          color={CARD_COLORS.purchases}
          label="Purchases"
          value={<AmountSymbol>{summary.purchases?.total}</AmountSymbol>}
          subStats={[
            {
              label: "Paid",
              value: <AmountSymbol>{summary.purchases?.paid}</AmountSymbol>,
            },
            {
              label: "Balance",
              value: <AmountSymbol>{summary.purchases?.pending}</AmountSymbol>,
              align: "end",
            },
          ]}
        />

        <SummaryCard
          theme="sales-returns"
          icon={FaArrowRight}
          label="Sales Returns"
          color={CARD_COLORS.sales_returns}
          value={<AmountSymbol>{summary.salesReturns?.total}</AmountSymbol>}
          subStats={[
            {
              label: "Received",
              value: <AmountSymbol>{summary.salesReturns?.paid}</AmountSymbol>,
            },
            {
              label: "Balance",
              value: (
                <AmountSymbol>{summary.salesReturns?.pending}</AmountSymbol>
              ),
              align: "end",
            },
          ]}
        />

        <SummaryCard
          theme="purchase-returns"
          icon={FaArrowLeft}
          label="Purchase Returns"
          color={CARD_COLORS.purchase_returns}
          value={<AmountSymbol>{summary.purchaseReturns?.total}</AmountSymbol>}
          subStats={[
            {
              label: "Paid",
              value: (
                <AmountSymbol>{summary.purchaseReturns?.paid}</AmountSymbol>
              ),
            },
            {
              label: "Balance",
              value: (
                <AmountSymbol>{summary.purchaseReturns?.pending}</AmountSymbol>
              ),
              align: "end",
            },
          ]}
        />

        <SummaryCard
          theme="expense"
          icon={FaArrowLeft}
          label="Expense"
          color={CARD_COLORS.expense}
          value={<AmountSymbol>{summary.expense?.total}</AmountSymbol>}
          subStats={[
            {
              label: "Paid",
              value: <AmountSymbol>{summary.expense?.paid}</AmountSymbol>,
            },
            {
              label: "Balance",
              value: <AmountSymbol>{summary.expense?.balance}</AmountSymbol>,
              align: "end",
            },
          ]}
        />
        <SummaryCard
          theme="service"
          icon={FaArrowLeft}
          label="Serivice"
          color={CARD_COLORS.service}
          value={<AmountSymbol>{summary.service?.total_profit}</AmountSymbol>}
          subStats={[
            {
              label: "Cost",
              value: <AmountSymbol>{summary.service?.total_cost}</AmountSymbol>,
            },
            {
              label: "Charge",
              value: (
                <AmountSymbol>
                  {summary.service?.total_service_charges}
                </AmountSymbol>
              ),
              align: "end",
            },
          ]}
        />

        <SummaryCard
          theme="today-sales"
          icon={FaDollarSign}
          color={CARD_COLORS.today_sales}
          label="Today's Sales"
          value={<AmountSymbol>{summary.today?.salesTotal}</AmountSymbol>}
        />

        <SummaryCard
          theme="today-received"
          color={CARD_COLORS.today_received}
          icon={FaMoneyBillWave}
          label="Today's Received"
          value={<AmountSymbol>{summary.today?.salesPaid}</AmountSymbol>}
        />

        <SummaryCard
          theme="today-purchases"
          color={CARD_COLORS.today_purchases}
          icon={FaShoppingCart}
          label="Today's Purchases"
          value={<AmountSymbol>{summary.today?.purchasesTotal}</AmountSymbol>}
        />

        <SummaryCard
          theme="today-expenses"
          color={CARD_COLORS.today_expenses}
          icon={FaFileInvoiceDollar}
          label="Today's Expense"
          value={<AmountSymbol>{summary.today?.expensesTotal}</AmountSymbol>}
        />
        <SummaryCard
          theme="today-service-cost"
          icon={FaFileInvoiceDollar}
          color={CARD_COLORS.today_service_cost}
          label="Today's Service Cost"
          value={<AmountSymbol>{summary.today?.serviceCost}</AmountSymbol>}
        />
        <SummaryCard
          theme="today-service-profit"
          icon={FaFileInvoiceDollar}
          color={CARD_COLORS.today_service_profit}
          label="Today's Service Profit"
          value={<AmountSymbol>{summary.today?.serviceProfit}</AmountSymbol>}
        />
      </section>

      {/* Charts & Tables */}
      <main className="dashboard__main-content fs16 fw600">
        {/* Weekly Sales & Purchases */}
        <div className="card-widget">
          <div className="card-widget__header">
            <h3>This Week Sales & Purchases</h3>
          </div>
          <div className="card-widget__body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={weeklyChartData}
                margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => (
                    <span>
                      <AmountSymbol>{value}</AmountSymbol>
                    </span>
                  )}
                />
                <Legend />
                <Bar dataKey="Sales" fill="#8884d8" />
                <Bar dataKey="Purchases" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="card-widget">
          <div className="card-widget__header">
            <h3>Top Selling Products</h3>
          </div>
          <div className="card-widget__body" style={{ height: 300 }}>
            {topProductsPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProductsPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {topProductsPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} units sold`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-message">
                No top selling product data available.
              </div>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="card-widget">
          <div className="card-widget__header">
            <h3>Top 5 Customers</h3>
          </div>
          <div className="card-widget__body" style={{ height: 300 }}>
            {topCustomersData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCustomersData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {topCustomersData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          CUSTOMER_PIE_COLORS[
                            index % CUSTOMER_PIE_COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => (
                      <span>
                        Total Sales: <AmountSymbol>{value}</AmountSymbol>
                      </span>
                    )}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-message">
                No top customer data available.
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card-widget full-width">
          <div className="card-widget__header">
            <h3>Recent Sales</h3>
            <a
              href="/sale-report"
              className="card-widget__view-all"
              onClick={(e) => {
                e.preventDefault();
                navigate("/sale-report");
              }}
            >
              View All Sales
            </a>
          </div>
          <div className="card-widget__body">
            <RecentSalesTable data={recentSalesData} />
          </div>
        </div>

        <div className="card-widget full-width">
          <div className="card-widget__header">
            <h3>Recent Purchases</h3>
            <a
              href="/purchase-report"
              className="card-widget__view-all"
              onClick={(e) => {
                e.preventDefault();
                navigate("/purchase-report");
              }}
            >
              View All Purchases
            </a>
          </div>
          <div className="card-widget__body">
            <RecentPurchasesTable data={recentPurchasesData} />
          </div>
        </div>

        {/* Recent Expenses (New) */}
        <div className="card-widget full-width">
          <div className="card-widget__header">
            <h3>Recent Expenses</h3>
            <a
              href="/expense-report"
              className="card-widget__view-all"
              onClick={(e) => {
                e.preventDefault();
                navigate("/expense-report");
              }}
            >
              View All Expenses
            </a>
          </div>
          <div className="card-widget__body">
            <RecentExpensesTable data={recentExpensesData} />
          </div>
        </div>

        {/* Stock Alert */}
        <div className="card-widget full-width">
          <div className="card-widget__header">
            <h3>Stock Alert</h3>
            <a
              href="/item-list"
              className="card-widget__view-all"
              onClick={(e) => {
                e.preventDefault();
                navigate("/item-list");
              }}
            >
              View Full Report
            </a>
          </div>
          <div className="card-widget__body">
            <StockAlertTable data={stockAlertData} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
