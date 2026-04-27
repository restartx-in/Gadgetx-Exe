import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchCashBooks(filters = {}) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.CASH_BOOK.BASE}${query}`);
  return res.data || [];
}

export function useCashBooks(filters = {}) {
  return useQuery({
    queryKey: ["cash_books", filters],
    queryFn: () => fetchCashBooks(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useCashBooks;
