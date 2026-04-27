import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

async function fetchLensAddonById(id) {
  if (!id) return null;
  const res = await api.get(API_ENDPOINTS.LENS_ADDONS.BY_ID(id));
  return res.data;
}

export function useLensAddonById(id) {
  return useQuery({
    queryKey: ["lens_addon", id],
    queryFn: () => fetchLensAddonById(id),
    enabled: !!id,
    staleTime: 60000,
  });
}
