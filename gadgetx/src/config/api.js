// Ensure base URL is always a string (avoid malformed URLs / ERR_NAME_NOT_RESOLVED)
const raw = import.meta.env.VITE_API_BASE_URL;
const server =
  typeof raw === "string" && raw.trim()
    ? raw.trim().replace(/\/$/, "")
    : "http://localhost:5000";

export const API_FILES = server + "/apps/opticals";
export const API_BASE_URL = server + "/api";
export const API_UPLOADS_BASE = server;


export function buildUploadUrl(base, path) {
  const b = typeof base === "string" && base.trim() ? base.trim().replace(/\/$/, "") : "";
  let p = typeof path === "string" && path.trim() ? path.trim() : "";
  if (!b || !p) return null;
  if (/[{}]/.test(p)) return null;
  if (p.startsWith("http")) return p;
  // p is a relative path like "uploads/{tenantId}/print/{filename}"
  // or already "/uploads/{tenantId}/print/{filename}"
  return `${b}${p.startsWith("/") ? p : `/${p}`}`;
}


export function isInvalidImageUrl(url) {
  if (url == null || typeof url !== "string") return true;
  return /[{}]/.test(url) || url.includes('""');
}
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: API_BASE_URL + "/auth/login",
    REGISTER: API_BASE_URL + "/auth/register",
  },

  SETTINGS: {
    BASE: API_BASE_URL + "/settings",
    BY_USER_ID: (userId) => `${API_BASE_URL}/settings/user/${userId}`,
  },

  PRINT_SETTINGS: API_BASE_URL + "/print-settings",
  JOB_SHEET_PRINT_SETTINGS: API_BASE_URL + "/jobsheetprint-settings",
  USERS: {
    BASE: API_BASE_URL + "/users",
    BY_ID: function (id) {
      return API_BASE_URL + "/users/" + id;
    },
    CREATE_BY_ADMIN: function (id = "new") {
      return API_BASE_URL + "/users/role-based/" + id;
    },
    PROFILE: API_BASE_URL + "/users/profile",
    ADD_STAFF: API_BASE_URL + "/users/add-staff",
  },

  TANENT: {
    BASE: API_BASE_URL + "/tenants",
    BY_ID: function (id) {
      return API_BASE_URL + "/tenants/" + id;
    },
    PAGINATED: API_BASE_URL + "/tenants/paginated",
  },

  INVOICE_NUMBER: {
    BASE: API_BASE_URL + "/invoice",
    NEXT: API_BASE_URL + "/invoice/next",
  },
  USER_SETTINGS: {
    BASE: API_BASE_URL + "/user-settings",
    BY_ID: function (id) {
      return API_BASE_URL + "/user-settings/" + id;
    },
    BY_USER_ID: function (userId) {
      return API_BASE_URL + "/user-settings/user/" + userId;
    },
  },
  SALES: {
    BASE: API_BASE_URL + "/sales",
    PAGINATED: API_BASE_URL + "/sales/paginated",
    BY_ID: (id) => API_BASE_URL + `/sales/${id}`,
  },
  SALE_RETURNS: {
    BASE: API_BASE_URL + "/sale-returns",
    PAGINATED: API_BASE_URL + "/sale-returns/paginated",
    BY_ID: (id) => API_BASE_URL + `/sale-returns/${id}`,
  },
  PARTIES: {
    BASE: API_BASE_URL + "/party",
    PAGINATED: API_BASE_URL + "/party/paginated",
    BY_ID: (id) => API_BASE_URL + `/party/${id}`,
  },
  EMPLOYEE: {
    BASE: API_BASE_URL + "/employees",
    PAGINATED: API_BASE_URL + "/employees/paginated",
    BY_ID: function (id) {
      return API_BASE_URL + "/employees/" + id;
    },
  },
  PAYROLL: {
    LIST: API_BASE_URL + "/employee-payroll",
    PAGINATED: API_BASE_URL + "/employee-payroll/paginated",
    BULK: API_BASE_URL + "/employee-payroll/bulk",
    BY_ID: (id) => `${API_BASE_URL}/employee-payroll/${id}`,
  },
  EMPLOYEE_POSITION: {
    BASE: API_BASE_URL + "/employee-position",
    BY_ID: function (id) {
      return API_BASE_URL + "/employee-position/" + id;
    },
  },

  ITEMS: {
    BASE: API_BASE_URL + "/items",
    PAGINATED: API_BASE_URL + "/items/paginated",
    BY_ID: function (id) {
      return API_BASE_URL + "/items/" + id;
    },
  },
  EXPENSES: {
    BASE: API_BASE_URL + "/expenses",
    PAGINATED: API_BASE_URL + "/expenses/paginated",
    BY_ID: function (id) {
      return API_BASE_URL + "/expenses/" + id;
    },
  },
  EXPENSE_TYPES: {
    BASE: API_BASE_URL + "/expense-type",
    BY_ID: function (id) {
      return API_BASE_URL + "/expense-type/" + id;
    },
  },

  COST_CENTERS: {
    BASE: API_BASE_URL + "/cost-centers",
    BY_ID: function (id) {
      return API_BASE_URL + "/cost-centers/" + id;
    },
  },

  DONE_BYS: {
    BASE: API_BASE_URL + "/done-by",
    BY_ID: function (id) {
      return API_BASE_URL + "/done-by/" + id;
    },
  },
  BRAND: {
    BASE: API_BASE_URL + "/brand",
    BY_ID: function (id) {
      return API_BASE_URL + "/brand/" + id;
    },
  },
  CATEGORY: {
    BASE: API_BASE_URL + "/category",
    BY_ID: function (id) {
      return API_BASE_URL + "/category/" + id;
    },
  },

  INVOICE_NUMBER: {
    BASE: API_BASE_URL + "/invoice-number",
    NEXT: API_BASE_URL + "/invoice-number/next",
    BY_ID: function (id) {
      return API_BASE_URL + "/invoice-number/" + id;
    },
  },
  UNITS: {
    BASE: API_BASE_URL + "/units",
    BY_ID: function (id) {
      return API_BASE_URL + "/units/" + id;
    },
  },
  VOUCHERS: {
    BASE: API_BASE_URL + "/vouchers",
    PAGINATED: API_BASE_URL + "/vouchers/paginated",
    BY_ID: (id) => API_BASE_URL + `/vouchers/${id}`,
  },
  MODEOFPAYMENT: {
    BASE: API_BASE_URL + "/mode-of-payment",
    BY_ID: function (id) {
      return API_BASE_URL + "/mode-of-payment/" + id;
    },
  },
  ACCOUNTS: {
    BASE: API_BASE_URL + "/accounts",
    PAGINATED: API_BASE_URL + "/accounts/paginated",
    BY_ID: (id) => API_BASE_URL + `/accounts/${id}`,
  },

  LEDGERS: {
    BASE: API_BASE_URL + "/ledgers",
    PAGINATED: API_BASE_URL + "/ledgers/paginated",
    BY_ID: (id) => API_BASE_URL + `/ledgers/${id}`,
  },

  CASH_BOOK: {
    BASE: API_BASE_URL + "/transactions",
    PAGINATED: API_BASE_URL + "/transactions/paginated",
    BY_ID: (id) => API_BASE_URL + `/transactions/${id}`,
  },
  PARTNERS: {
    BASE: API_BASE_URL + "/partners",
    PAGINATED: API_BASE_URL + "/partners/paginated",
    BY_ID: (id) => API_BASE_URL + `/partners/${id}`,
  },
  PARTNERSHIPS: {
    BASE: API_BASE_URL + "/partnerships",
    PAGINATED: API_BASE_URL + "/partnerships/paginated",
    BY_ID: (id) => API_BASE_URL + `/partnerships/${id}`,
  },
  JOBSHEETS: {
    BASE: API_BASE_URL + "/jobsheets",
    PAGINATED: API_BASE_URL + "/jobsheets/paginated",
    BY_ID: (id) => API_BASE_URL + `/jobsheets/${id}`,
  },
  DAILY_SUMMARY: {
    BASE: API_BASE_URL + "/daily-summary",
  },
  MONTHLY_SUMMARY: {
    BASE: API_BASE_URL + "/monthly-summary",
  },
  PURCHASE: {
    BASE: API_BASE_URL + "/purchases",
    PAGINATED: API_BASE_URL + "/purchases/paginated",
    BY_ID: function (id) {
      return API_BASE_URL + "/purchases/" + id;
    },
  },
  PURCHASE_RETURNS: {
    BASE: API_BASE_URL + "/purchase-returns",
    PAGINATED: API_BASE_URL + "/purchase-returns/paginated",
    BY_ID: (id) => API_BASE_URL + `/purchase-returns/${id}`,
  },
  ROLES: {
    BASE: API_BASE_URL + "/roles",
    BY_ID: function (id) {
      return API_BASE_URL + "/roles/" + id;
    },
  },

  COST_CENTER_SUMMARY_REPORT: {
    BASE: API_BASE_URL + "/cost-center-summary",
  },
  DONE_BY_SUMMARY_REPORT: {
    BASE: API_BASE_URL + "/done-by-summary",
  },
  PARTY_SUMMARY_REPORT: {
    BASE: API_BASE_URL + "/party-summary",
    PAYMENTS: (party_id) => `/party-summary/payments/${party_id}`,
    DETAILS: (party_id) => `/party-summary/details/${party_id}`,
  },
  STOCK_DETAILED_REPORT: {
    BASE: API_BASE_URL + "/stock-detailed-report",
  },
  ITEM_PROFIT_REPORT: {
    BASE: API_BASE_URL + "/item-profit-report",
  },

  DAILY_PROFIT_REPORT: {
    BASE: API_BASE_URL + "/daily-profit-report",
  },
  PERIODIC_PROFIT_REPORT: {
    BASE: API_BASE_URL + "/periodic-profit-report",
  },
  BALANCE_SHEET_REPORT: {
    BASE: API_BASE_URL + "/balance-sheet-report",
  },
  TAX_SUMMARY_REPORT: {
    BASE: API_BASE_URL + "/tax-summary-report",
  },
  STOCK_VALUE_REPORT: {
    BASE: API_BASE_URL + "/stock-value-report",
    PAGINATED: API_BASE_URL + "/stock-value-report/paginated", // +++ ADD THIS LINE
  },
  AGEING_STOCK_REPORT: {
    BASE: API_BASE_URL + "/ageing-stock-report",
    PAGINATED: API_BASE_URL + "/ageing-stock-report/paginated",
  },
  REGISTER_SESSIONS: {
    BASE: API_BASE_URL + "/register-sessions",
    PAGINATED: API_BASE_URL + "/register-sessions/paginated",
    CURRENT: API_BASE_URL + "/register-sessions/current",
    OPEN: API_BASE_URL + "/register-sessions/open",
    BY_ID: (id) => API_BASE_URL + `/register-sessions/${id}`,
    CLOSE: (id) => API_BASE_URL + `/register-sessions/${id}/close`,
  },
  DASHBOARD: {
    FINANCIAL_SUMMARY: API_BASE_URL + "/dashboard/financial-summary",
    WEEKLY_SALES_PURCHASES: API_BASE_URL + "/dashboard/weekly-sales-purchases",
    TOP_SELLING_PRODUCTS: API_BASE_URL + "/dashboard/top-selling-products",
    TOP_CUSTOMERS: API_BASE_URL + "/dashboard/top-customers",
    STOCK_ALERTS: API_BASE_URL + "/dashboard/stock-alerts",
    RECENT_SALES: API_BASE_URL + "/dashboard/recent-sales",
    RECENT_PURCHASES: API_BASE_URL + "/dashboard/recent-purchases",
    RECENT_EXPENSES: API_BASE_URL + "/dashboard/recent-expenses",
    RECENT_TRANSACTIONS: API_BASE_URL + "/dashboard/recent-transactions",
  },
  REPORT_FIELD_PERMISSIONS: {
    BASE: API_BASE_URL + "/report-field-permissions",
    BY_ID: (id) => API_BASE_URL + `/report-field-permissions/${id}`,
  },
  TRANSACTION_FIELD_PERMISSIONS: {
    BASE: API_BASE_URL + "/transaction-field-permissions",
    BY_ID: (id) => API_BASE_URL + `/transaction-field-permissions/${id}`,
  },
  FRAME: {
    BASE: API_BASE_URL + "/frames",
    PAGINATED: API_BASE_URL + "/frames/paginated",
    BY_ID: (id) => API_BASE_URL + `/frames/${id}`,
  },
  SERVICES: {
    BASE: API_BASE_URL + "/services",
    PAGINATED: API_BASE_URL + "/services/paginated",
    BY_ID: (id) => API_BASE_URL + `/services/${id}`,
  },

 FRAME_VARIANT: {
    BASE: API_BASE_URL + "/frame-variants",
    PAGINATED: API_BASE_URL + "/frame-variants/paginated",
    BY_ID: (id) => API_BASE_URL + "/frame-variants/" + id,
  },
  LENS_ADDONS: {
    BASE: API_BASE_URL + "/lens-addons",
    BY_ID: (id) => API_BASE_URL + `/lens-addons/${id}`,
  },
  LENSES: {
    BASE: API_BASE_URL + "/lenses",
    PAGINATED: API_BASE_URL + "/lenses/paginated",
    BY_ID: (id) => API_BASE_URL + `/lenses/${id}`,
  },
  PRESCRIPTIONS: {
    BASE: API_BASE_URL + "/prescriptions",
    PAGINATED: API_BASE_URL + "/prescriptions/paginated",
    BY_ID: (id) => API_BASE_URL + `/prescriptions/${id}`,
  },
};

const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

export const API_CONFIG = {
  DEFAULT_HEADERS: {
    Accept: "application/json",
  },
  TIMEOUT: API_TIMEOUT,
};

import axios from "axios";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: API_TIMEOUT,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized, redirecting to login...", error.response);
    }
    return Promise.reject(error);
  },
);

export default api;
