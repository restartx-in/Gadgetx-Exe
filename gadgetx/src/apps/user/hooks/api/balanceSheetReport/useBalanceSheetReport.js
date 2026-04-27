import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

const EMPTY_BALANCE_SHEET_SUMMARY = {
  as_of_date: "",
  assets: {
    cash_in_hand: 0,
    bank_balance: 0,
    stock_value: 0,
    accounts_receivable: 0,
    total_assets: 0,
  },
  liabilities: {
    accounts_payable: 0,
    total_liabilities: 0,
  },
  equity: 0,
};

const toSafeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeBalanceSheetSummary = (payload = {}) => {
  const assets = payload?.assets || {};
  const liabilities = payload?.liabilities || {};

  return {
    as_of_date:
      typeof payload?.as_of_date === "string" ? payload.as_of_date : "",
    assets: {
      cash_in_hand: toSafeNumber(assets.cash_in_hand),
      bank_balance: toSafeNumber(assets.bank_balance),
      stock_value: toSafeNumber(assets.stock_value),
      accounts_receivable: toSafeNumber(assets.accounts_receivable),
      total_assets: toSafeNumber(assets.total_assets),
    },
    liabilities: {
      accounts_payable: toSafeNumber(liabilities.accounts_payable),
      total_liabilities: toSafeNumber(liabilities.total_liabilities),
    },
    equity: toSafeNumber(payload?.equity),
  };
};

async function fetchBalanceSheetReport(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(
    `${API_ENDPOINTS.BALANCE_SHEET_REPORT.BASE}${query}`
  );
  return normalizeBalanceSheetSummary(
    res?.data || EMPTY_BALANCE_SHEET_SUMMARY
  );
}

export function useBalanceSheetReport(filters = {}) {
  return useQuery({
    queryKey: ["balance_sheet_report", filters],
    queryFn: () => fetchBalanceSheetReport(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useBalanceSheetReport;
