// src/hooks/api/ledger/useLedger.js
import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchLedgers(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.LEDGERS.BASE}${query}`);
  return res.data || [];
}

export function useLedger(filters = {}) {
  return useQuery({
    queryKey: ["ledgers", filters],
    queryFn: () => fetchLedgers(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useLedger;
