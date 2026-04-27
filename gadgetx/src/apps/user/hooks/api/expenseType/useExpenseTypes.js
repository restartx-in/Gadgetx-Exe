import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js"; // Assuming you have an axios instance setup
import { API_ENDPOINTS } from "@/config/api"; // Assuming API_ENDPOINTS is configured

async function fetchExpenseTypes() {
  const res = await api.get(API_ENDPOINTS.EXPENSE_TYPES.BASE);
  return res.data || [];
}

export function useExpenseTypes() {
  return useQuery({
    queryKey: ["expense_types"], // Simple key as no filters are currently applied in the backend getAll
    queryFn: () => fetchExpenseTypes(),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}
