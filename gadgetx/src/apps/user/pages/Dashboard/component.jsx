import React, { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  LuShoppingCart as ShoppingCart,
  LuUsers as Users,
  LuActivity as Activity,
  LuCreditCard as CreditCard,
  LuTarget as Target,
  LuGlasses as Glasses,
  LuScrollText as ScrollText,
  LuPackage as Package,
  LuChevronRight as ChevronRight,
  LuArrowRight as ArrowRight,
  LuArrowUpRight as ArrowUpRight,
  LuTrendingUp as TrendingUp,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import AmountSymbol from "@/apps/user/components/AmountSymbol";

// Hooks
import useFetchPrintSettings from "@/apps/user/hooks/api/printSettings/useFetchPrintSettings";
import useFetchSettings from "@/apps/user/hooks/api/settings/useFetchSettings";
import { useFinancialSummary } from "@/apps/user/hooks/api/summary/useFinancialSummary";
import { useWeeklySalesAndPurchases } from "@/apps/user/hooks/api/summary/useWeeklySalesAndPurchases";
import { useStockAlerts } from "@/apps/user/hooks/api/summary/useStockAlerts";
import { useRecentSales } from "@/apps/user/hooks/api/summary/useRecentSales";
import { useRecentPurchases } from "@/apps/user/hooks/api/summary/useRecentPurchases";
import { useFrameVariants } from "@/apps/user/hooks/api/frameVariant/useFrameVariants";
import { useLenses } from "@/apps/user/hooks/api/lens/useLenses";
import { useServicesPaginated } from "@/apps/user/hooks/api/services/useServicesPaginated";
import { usePrescriptionsPaginated } from "@/apps/user/hooks/api/prescription/usePrescriptionsPaginated";
import { useCustomersPaginated } from "@/apps/user/hooks/api/customer/useCustomersPaginated";

import "./style.scss";

const Dashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("month");

  // Real Data Hooks
  const { data: financialSummary, isLoading: summaryLoading } =
    useFinancialSummary(period);
  const { data: weeklyData } = useWeeklySalesAndPurchases(period);
  const { data: stockAlerts } = useStockAlerts();
  const { data: recentSales } = useRecentSales();
  const { data: recentPurchases } = useRecentPurchases();
  const { data: servicesData } = useServicesPaginated({ limit: 5 });
  const { data: frameVariants } = useFrameVariants({ page_size: 10 });

  const { data: patientsData } = useCustomersPaginated({ limit: 1 });
  const { data: prescriptionsData } = usePrescriptionsPaginated({ limit: 1 });

  const periodLabel = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
  }[period];

  if (summaryLoading && !financialSummary) {
    return (
      <div className="dashboard--optical" style={{ padding: "40px" }}>
        Loading Dashboard Data...
      </div>
    );
  }

  return (
    <div className="dashboard--optical">
      {/* ── Header ── */}
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Dashboard Overview</h1>
          <p className="dashboard__subtitle">
            Track your optical shop's performance and inventory.
          </p>
        </div>
        <div className="header-actions">
          <div className="period-toggle-clean">
            {["today", "week", "month", "year"].map((p) => (
              <button
                key={p}
                className={period === p ? "active" : ""}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── KPI Grid ── */}
      <section className="kpi-grid">
        <div className="kpi-card" onClick={() => navigate("/sale-report")}>
          <div className="kpi-content">
            <span className="label">{periodLabel} Sales</span>
            <div className="value">
              <AmountSymbol>{financialSummary?.sales?.total}</AmountSymbol>
            </div>
            <span className="subtext">Completed orders</span>
          </div>
          <div className="kpi-icon green">
            <Glasses size={24} />
          </div>
        </div>

        <div
          className="kpi-card"
          onClick={() => navigate("/prescription-list")}
        >
          <div className="kpi-content">
            <span className="label">Prescriptions</span>
            <div className="value">{prescriptionsData?.count || 0}</div>
            <span className="subtext">Issued records</span>
          </div>
          <div className="kpi-icon orange">
            <ScrollText size={24} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate("/service-list")}>
          <div className="kpi-content">
            <span className="label">Service Profit</span>
            <div className="value">
              <AmountSymbol>
                {financialSummary?.service?.total_profit}
              </AmountSymbol>
            </div>
            <span className="subtext">Repairs & maintenance</span>
          </div>
          <div className="kpi-icon purple">
            <Activity size={24} />
          </div>
        </div>
      </section>

      {/* ── Analytics Row ── */}
      <div className="dashboard-content-grid">
        <div className="panel-card">
          <div className="panel-header">
            <h3>Revenue Comparison (Sales vs Purchases)</h3>
          </div>
          <div className="panel-body">
            <div style={{ height: "300px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#edf2f7"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#718096" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#718096" }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#f7fafc" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="Sales"
                    fill="#2be438"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="Purchases"
                    fill="#e0243d"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Expense Summary</h3>
          </div>
          <div className="panel-body">
            <div className="expense-summary-box">
              <div className="summary-row">
                <span className="label">Total Expense</span>
                <span className="value text-danger">
                  <AmountSymbol>
                    {financialSummary?.expense?.total}
                  </AmountSymbol>
                </span>
              </div>
              <div className="summary-row">
                <span className="label">Amount Paid</span>
                <span className="value text-success">
                  <AmountSymbol>{financialSummary?.expense?.paid}</AmountSymbol>
                </span>
              </div>
              <div className="summary-row" style={{ borderBottom: "none" }}>
                <span className="label">Balance Due</span>
                <span className="value">
                  <AmountSymbol>
                    {financialSummary?.expense?.balance}
                  </AmountSymbol>
                </span>
              </div>
            </div>
            <div style={{ marginTop: "24px" }}>
              <button
                className="btn-primary-clean"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => navigate("/expense-report")}
              >
                View Expense Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Reports Section ── */}
      <div className="dashboard-content-grid">
        {/* SALE REPORT WIDGET */}
        <div className="panel-card">
          <div className="panel-header">
            <h3>Recent Sales</h3>
            <button
              className="btn-link"
              onClick={() => navigate("/sale-report")}
            >
              Report <ChevronRight size={14} />
            </button>
          </div>
          <div className="panel-body" style={{ padding: "0 24px" }}>
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales?.slice(0, 5).map((sale) => (
                  <tr key={sale.reference}>
                    <td style={{ fontWeight: 600 }}>{sale.party}</td>
                    <td style={{ color: "#4c51bf", fontWeight: 700 }}>
                      <AmountSymbol>{sale.grandTotal}</AmountSymbol>
                    </td>
                    <td>
                      <span
                        className={`pill-status ${sale.paymentStatus?.toLowerCase()}`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PURCHASE REPORT WIDGET */}
        <div className="panel-card">
          <div className="panel-header">
            <h3>Recent Purchases</h3>
            <button
              className="btn-link"
              onClick={() => navigate("/purchase-report")}
            >
              Report <ChevronRight size={14} />
            </button>
          </div>
          <div className="panel-body" style={{ padding: "0 24px" }}>
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases?.slice(0, 5).map((pur) => (
                  <tr key={pur.reference}>
                    <td style={{ fontSize: "13px", fontWeight: 600 }}>
                      {pur.party}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <AmountSymbol>{pur.grandTotal}</AmountSymbol>
                    </td>
                    <td>
                      <span
                        className={`pill-status ${pur.paymentStatus?.toLowerCase()}`}
                      >
                        {pur.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SERVICE REPORT WIDGET */}
        <div className="panel-card">
          <div className="panel-header">
            <h3>Recent Services</h3>
            <button
              className="btn-link"
              onClick={() => navigate("/service-list")}
            >
              Report <ChevronRight size={14} />
            </button>
          </div>
          <div className="panel-body" style={{ padding: "0 24px" }}>
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Details</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {servicesData?.data?.slice(0, 5).map((svc) => (
                  <tr key={svc.id}>
                    <td style={{ fontWeight: 600 }}>
                      {svc.customer_name || "Customer"}
                    </td>
                    <td>
                      <div style={{ fontSize: "12px", fontWeight: 600 }}>
                        {svc.item_name || "Repair"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#718096" }}>
                        {svc.description || svc.issue_report}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <AmountSymbol>
                        {svc.service_charge || svc.cost}
                      </AmountSymbol>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <InventoryPanel
          title="Latest Frames"
          items={stockAlerts?.frames}
          navigatePath="/frames"
          navigateLabel="Frames"
        />

        <InventoryPanel
          title="Latest Lenses"
          items={stockAlerts?.lenses}
          navigatePath="/lens-list"
          navigateLabel="Lenses"
        />

        <InventoryPanel
          title="Latest Addons"
          items={stockAlerts?.addons}
          navigatePath="/lens-addons"
          navigateLabel="Addons"
        />
      </div>

      {/* ── Footer ── */}
      <footer className="dashboard-footer-clean">
        <span>© 2026 OptiVision • Professional Optical Management</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#38a169",
            }}
          ></div>
          <span>System Online</span>
        </div>
      </footer>
    </div>
  );
};

// Helper component for Inventory Panels
const InventoryPanel = ({ title, items, navigatePath, navigateLabel }) => {
  const navigate = useNavigate();
  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>{title}</h3>
        <button className="btn-link" onClick={() => navigate(navigatePath)}>
          {navigateLabel} <ChevronRight size={14} />
        </button>
      </div>
      <div className="panel-body" style={{ padding: "0 24px" }}>
        <table className="clean-table">
          <thead>
            <tr>
              <th>Product Details</th>
              <th style={{ textAlign: "right" }}>Stock Status</th>
            </tr>
          </thead>
          <tbody>
            {items?.slice(0, 5).map((item) => (
              <tr key={item.code}>
                <td style={{ fontSize: "13px" }}>
                  <div style={{ fontWeight: 600 }}>{item.product}</div>
                  <div style={{ fontSize: "11px", color: "#718096" }}>
                    Code: {item.code}
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <span
                    className={`stock-badge ${item.quantity <= 5 ? "low" : "good"}`}
                  >
                    {item.quantity} In Stock
                  </span>
                </td>
              </tr>
            ))}
            {(!items || items.length === 0) && (
              <tr>
                <td
                  colSpan="2"
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "#718096",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <Package size={24} opacity={0.3} />
                  </div>
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
