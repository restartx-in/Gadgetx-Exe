import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

async function fetchFrameVariants(filters = {}) {
  const { pageSize, ...rest } = filters;
  const apiFilters = { ...rest, page_size: pageSize || rest.page_size || 100 };
  // Using the base endpoint usually returns a full or filtered list depending on backend implementation
  // Following the pattern from useLenses.js
  const res = await api.get(API_ENDPOINTS.FRAME_VARIANT.BASE, { params: apiFilters });
  return res.data?.data || res.data || [];
}

export function useFrameVariants(filters = {}) {
  return useQuery({
    queryKey: ["frameVariants", filters],
    queryFn: () => fetchFrameVariants(filters),
  });
}
