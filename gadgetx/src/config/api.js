const server = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const API_FILES = server;
export const API_BASE_URL = server + "/api/gadgetx";

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
  },
  STOCK_DETAILED_REPORT: {
    BASE: API_BASE_URL + "/stock-detailed-report",
  },
  ITEM_PROFIT_REPORT: {
    BASE: API_BASE_URL + "/item-profit-report",
  },

  DAILY_PROFIT_REPORT: {
    BASE: "/daily-profit-report",
  },
  PERIODIC_PROFIT_REPORT: {
    BASE: "/periodic-profit-report",
  },
  BALANCE_SHEET_REPORT: {
    BASE: "/balance-sheet-report",
  },
  TAX_SUMMARY_REPORT: {
    BASE: "/tax-summary-report",
  },
  STOCK_VALUE_REPORT: {
    BASE: "/stock-value-report",
    PAGINATED: API_BASE_URL + "/stock-value-report/paginated", // +++ ADD THIS LINE
  },
  REGISTER_SESSIONS: {
     BASE: '/register-sessions',
    PAGINATED: '/register-sessions/paginated',
    CURRENT: '/register-sessions/current',
    OPEN: '/register-sessions/open',
    BY_ID: (id) => `/register-sessions/${id}`,
    CLOSE: (id) => `/register-sessions/${id}/close`,
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
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized, redirecting to login...", error.response);
    }
    return Promise.reject(error);
  }
);

export default api;
