import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import useUsers from "@/hooks/api/user/useUsers";
import "./style.scss";

const Icon = ({ children, color }) => (
  <div className="stat-card__icon" style={{ backgroundColor: color }}>
    {children}
  </div>
);

const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const DollarSignIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const UserPlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="17" y1="11" x2="23" y2="11" />
  </svg>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className="stat-card box-shadow ">
    {icon}
    <div className="stat-card__info">
      <p className="stat-card__title fs16">{title}</p>
      <p className="stat-card__value fs26" style={{ color }}>
        {value}
      </p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const {
    data: usersData,
    isLoading,
    isError,
    error,
  } = useUsers({ page: 1, page_size: 1000 });

  const processedData = useMemo(() => {
    if (!usersData?.data) {
      return {
        userList: [],
        totalUserCount: 0,
        totalRevenue: 0,
        newUsersMonthly: 0,
        userRoles: [],
      };
    }

    const processedUserList = usersData.data.map((user, index) => ({
      ...user,
      role: ["user", "Tenent", "Admin"][index % 3],
      monthly_spend: Math.floor(Math.random() * 200) + 20,
    }));

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const newUsersMonthly = processedUserList.filter(
      (u) => new Date(u.created_at) >= oneMonthAgo
    ).length;

    const totalRevenue = processedUserList.reduce(
      (acc, user) => acc + user.monthly_spend,
      0
    );

    const userRoles = processedUserList.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const userRoleData = Object.entries(userRoles).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      userList: processedUserList,
      totalUserCount: usersData.count || 0,
      totalRevenue,
      newUsersMonthly,
      userRoleData,
    };
  }, [usersData]);

  const {
    userList,
    totalUserCount,
    totalRevenue,
    newUsersMonthly,
    userRoleData,
  } = processedData;

  const userSignupData = useMemo(() => {
    if (!userList || userList.length === 0) return [];

    const signupsByMonth = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    userList.forEach((user) => {
      const date = new Date(user.created_at);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!signupsByMonth[monthKey]) {
        signupsByMonth[monthKey] = {
          month: `${monthNames[date.getMonth()]} '${String(
            date.getFullYear()
          ).slice(2)}`,
          "New Users": 0,
          sortKey: date.getFullYear() * 100 + date.getMonth(),
        };
      }
      signupsByMonth[monthKey]["New Users"]++;
    });

    return Object.values(signupsByMonth)
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-6); // Show last 6 months
  }, [userList]);

  const PIE_CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  if (isLoading)
    return <p className="dashboard-message">Loading dashboard data...</p>;
  if (isError)
    return <p className="dashboard-message error">Error: {error.message}</p>;

  return (
    <div className="admin_dashboard">
      <h1 className="admin_dashboard__title fs26">Dashboard Overview</h1>

      <div className="admin_dashboard__stats_grid">
        <StatCard
          title="Total Users"
          value={totalUserCount.toLocaleString()}
          color="var(--color-admin-blue-color)"
          icon={
            <Icon color="rgba(0, 136, 254, 0.1)">
              <UsersIcon />
            </Icon>
          }
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          color="var(--color-admin-orange-color)"
          icon={
            <Icon color="rgba(255, 128, 66, 0.1)">
              <DollarSignIcon />
            </Icon>
          }
        />
        <StatCard
          title="New Users (Month)"
          value={newUsersMonthly.toLocaleString()}
          color="var(--color-green)"
          icon={
            <Icon color="rgba(0, 196, 159, 0.1)">
              <UserPlusIcon />
            </Icon>
          }
        />
      </div>

      {/* --- Charts Grid --- */}
      <div className="admin_dashboard__charts_grid">
        <div className="chart-card box-shadow fs16">
          <h3 className="chart-card__title ">Monthly User Sign-ups</h3>
          <div className="chart-card__wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userSignupData}
                margin={{ top: 5, right: 20, left: -15, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-color)"
                />
                <XAxis
                  dataKey="month"
                  stroke="var(--text-secondary)"
                  fontSize={12}
                />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip
                  wrapperClassName="chart-tooltip"
                  cursor={{ fill: "rgba(206, 218, 226, 0.2)" }}
                />
                <Legend />
                <Bar
                  dataKey="New Users"
                  fill="var(--primary-color)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card box-shadow fs14">
          <h3 className="chart-card__title">User Role Distribution</h3>
          <div className="chart-card__wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userRoleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {userRoleData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip wrapperClassName="chart-tooltip" />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
