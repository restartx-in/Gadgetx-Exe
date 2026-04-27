import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

async function fetchExpenseById(id) {
  if (!id) return null;
  const res = await api.get(API_ENDPOINTS.EXPENSES.BY_ID(id));
  return res.data;
}

export function useExpenseById(id) {
  return useQuery({
    queryKey: ["expense", id],
    queryFn: () => fetchExpenseById(id),
    enabled: !!id,
  });
}

export default useExpenseById;
