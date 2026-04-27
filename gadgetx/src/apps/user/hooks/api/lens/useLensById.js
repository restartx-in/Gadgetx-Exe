import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

async function fetchLensById(id) {
  if (!id) return null;
  const res = await api.get(API_ENDPOINTS.LENSES.BY_ID(id));
  return res.data;
}

export function useLensById(id) {
  return useQuery({
    queryKey: ["lens", id],
    queryFn: () => fetchLensById(id),
    enabled: !!id,
    staleTime: 60000,
  });
}
