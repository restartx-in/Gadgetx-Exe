// --- useJobSheetById.js ---

import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

async function fetchJobSheetById(id) {
  if (!id) return null;
  const response = await api.get(API_ENDPOINTS.JOBSHEETS.BY_ID(id));
  return response.data;
}

export function useJobSheetById(id, options) {
  return useQuery({
    // ✅ FIX: Use a consistent query key prefix
    queryKey: ["jobsheets", "detail", id],
    queryFn: () => fetchJobSheetById(id),
    // ✅ FIX: Spread the options object to pass `enabled` and other flags
    ...options,
  });
}

export default useJobSheetById;
