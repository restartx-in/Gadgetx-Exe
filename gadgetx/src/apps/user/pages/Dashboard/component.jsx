import React, { useState } from "react";
import { 
  MdDashboard as DashboardIcon, 
  MdShoppingCart as ShoppingCart, 
  MdPeople as Users, 
  MdInventory as Package,
  MdAccountBalanceWallet as Wallet,
  MdSettings as SettingsIcon,
  MdTrendingUp as TrendingUp,
  MdError as AlertCircle,
  MdRefresh as RefreshCw,
  MdBarChart as BarChartIcon
} from "react-icons/md";
import { 
  FaPlus as Plus,
  FaChevronRight as ChevronRight,
  FaFileAlt as FileText,
  FaUserCheck as UserCheck,
  FaThLarge as LayoutGrid,
  FaLayerGroup as Layers
} from "react-icons/fa";
import { RiFileList3Line as ScrollText } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Hooks
import { useFinancialSummary } from "@/apps/user/hooks/api/summary/useFinancialSummary";
import { useWeeklySalesAndPurchases } from "@/apps/user/hooks/api/summary/useWeeklySalesAndPurchases";
import { useStockAlerts } from "@/apps/user/hooks/api/summary/useStockAlerts";
import { useRecentSales } from "@/apps/user/hooks/api/summary/useRecentSales";
import { useRecentPurchases } from "@/apps/user/hooks/api/summary/useRecentPurchases";
import { useRecentExpenses } from "@/apps/user/hooks/api/summary/useRecentExpenses";

import "./style.scss";

const Dashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("month");

  // Fetch data using hooks
  const { data: financialData } = useFinancialSummary(period);
  const { data: chartData } = useWeeklySalesAndPurchases(period);
  const { data: stockAlerts } = useStockAlerts();
  const { data: recentSales } = useRecentSales();
  const { data: recentPurchases } = useRecentPurchases();
  const { data: recentExpenses } = useRecentExpenses();

  const handlePeriodChange = (p) => setPeriod(p);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val || 0);
  };

  const periodLabel = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
  }[period];

  // Config for Quick Access Launchpad

  return (
    <div className="dashboard--optical">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Gadgetx Management</h1>
          <p className="dashboard__subtitle">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="header-actions">
          <div className="period-toggle-clean">
            {["today", "week", "month", "year"].map((p) => (
              <button
                key={p}
                className={period === p ? "active" : ""}
                onClick={() => handlePeriodChange(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn-primary-clean" onClick={() => window.location.reload()}>
            <RefreshCw size={18} />
          </button>
        </div>
      </header>


      {/* ── KPI Grid ── */}
      <section className="kpi-grid">
        <div className="kpi-card" onClick={() => navigate("/sale-report")}>
          <div className="kpi-content">
            <span className="label">{periodLabel} Sales</span>
            <div className="value">{formatCurrency(financialData?.sales?.total)}</div>
            <span className="subtext">Paid: {formatCurrency(financialData?.sales?.paid)}</span>
          </div>
          <div className="kpi-icon green">
            <ShoppingCart size={24} />
          </div>
        </div>
        <div className="kpi-card" onClick={() => navigate("/purchase-report")}>
          <div className="kpi-content">
            <span className="label">{periodLabel} Purchases</span>
            <div className="value">{formatCurrency(financialData?.purchase?.total)}</div>
            <span className="subtext">Paid: {formatCurrency(financialData?.purchase?.paid)}</span>
          </div>
          <div className="kpi-icon orange">
            <Package size={24} />
          </div>
        </div>
        <div className="kpi-card" onClick={() => navigate("/expense-report")}>
          <div className="kpi-content">
            <span className="label">Expenses</span>
            <div className="value">{formatCurrency(financialData?.expense?.total)}</div>
            <span className="subtext">Paid: {formatCurrency(financialData?.expense?.paid)}</span>
          </div>
          <div className="kpi-icon purple">
            <Wallet size={24} />
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-content">
            <span className="label">Net Profit</span>
            <div className="value">{formatCurrency(financialData?.netProfit)}</div>
            <span className="subtext">Estimated Revenue</span>
          </div>
          <div className="kpi-icon blue">
            <TrendingUp size={24} />
          </div>
        </div>
      </section>

      {/* ── Analytics & Tables ── */}
      <div className="dashboard-content-grid">
        <div className="panel-card">
          <div className="panel-header">
            <h3>Revenue Overview</h3>
            <BarChartIcon size={18} color="#c9a84c" />
          </div>
          <div className="panel-body">
            <div style={{ height: "300px", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#718096" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#718096" }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: 'rgba(201, 168, 76, 0.05)' }}
                    />
                    <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '11px' }} />
                    <Bar
                      dataKey="Sales"
                      fill="#c9a84c"
                      radius={[4, 4, 0, 0]}
                      barSize={12}
                    />
                    <Bar
                      dataKey="Purchases"
                      fill="#e53e3e"
                      radius={[4, 4, 0, 0]}
                      barSize={12}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>No revenue data available for this period.</div>
              )}
            </div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Stock Alerts</h3>
            <AlertCircle size={18} className="text-danger" />
          </div>
          <div className="panel-body">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {stockAlerts?.length > 0 ? (
                  stockAlerts.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{item.product}</strong>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{item.code}</div>
                      </td>
                      <td>
                        <span className="stock-badge low">{item.quantity} Left</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>All stock levels healthy.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="panel-body" style={{ borderTop: '1px solid #eef1f6', padding: '12px 20px' }}>
            <button className="btn-link" onClick={() => navigate("/item-list?stock=low")}>
              View All Items <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="panel-card">
          <div className="panel-header">
            <h3>Recent Sales</h3>
            <button className="btn-link" onClick={() => navigate("/sale-report")}>
              Report <ChevronRight size={14} />
            </button>
          </div>
          <div className="panel-body">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Party</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales?.map((sale) => (
                  <tr key={sale.id}>
                    <td><strong>{sale.party}</strong></td>
                    <td><strong>{formatCurrency(sale.grandTotal)}</strong></td>
                    <td><span className={`pill-status ${sale.paymentStatus?.toLowerCase()}`}>{sale.paymentStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Recent Purchases</h3>
            <button className="btn-link" onClick={() => navigate("/purchase-report")}>
              Report <ChevronRight size={14} />
            </button>
          </div>
          <div className="panel-body">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Party</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases?.map((purchase) => (
                  <tr key={purchase.id}>
                    <td><strong>{purchase.party}</strong></td>
                    <td><strong>{formatCurrency(purchase.grandTotal)}</strong></td>
                    <td><span className={`pill-status ${purchase.paymentStatus?.toLowerCase()}`}>{purchase.paymentStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Recent Expenses</h3>
            <button className="btn-link" onClick={() => navigate("/expense-report")}>
              Report <ChevronRight size={14} />
            </button>
          </div>
          <div className="panel-body">
            <div className="expense-summary-box">
              {recentExpenses?.map((expense) => (
                <div key={expense.id} className="summary-row">
                  <div className="label">
                    <strong>{expense.description}</strong>
                    <div style={{ fontSize: '10px' }}>{expense.category}</div>
                  </div>
                  <div className="value text-danger">{formatCurrency(expense.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
