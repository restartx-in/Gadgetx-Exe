export const formatModuleName = (name) => {
  return name
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b(\w)/g, (s) => s.toUpperCase());
};

export const PERMISSION_ACTIONS = ['create', 'view', 'edit', 'delete'];

export const PERMISSION_GROUPS = [
  {
    title: 'Master Data',
    modules: [
      'EMPLOYEE',
      'EMPLOYEE_POSITION',
      'PAYROLL',
      'EXPENSE_TYPES',
      'ACCOUNTS',
      'ITEMS',
      'SUPPLIERS',
      'CUSTOMERS',
      'BRAND',
      'CATEGORY',
      'UNITS',
      'PARTNERS',
      'DONE_BYS',
      'COST_CENTERS',
    ],
  },
  {
    title: 'Transactions',
    modules: [
      'PURCHASE',
      'PURCHASE_RETURNS',
      'SALES',
      'SALE_RETURNS',
      'EXPENSES',
      'CASH_BOOK',
      'JOBSHEETS',
      'PARTNERSHIPS',
    ],
  },
  {
    title: 'Reports & Summaries',
    modules: ['DASHBOARD', 'DAILY_SUMMARY', 'MONTHLY_SUMMARY'],
  },
  {
    title: 'Administration',
    modules: ['USERS', 'ROLES'],
  },
];
