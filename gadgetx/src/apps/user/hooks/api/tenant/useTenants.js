import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

async function fetchTenant() {
  const res = await api.get(API_ENDPOINTS.TANENT.BASE); // Assumes API_ENDPOINTS.COST_CENTERS is configured
  return res.data || [];
}

export default function useTenants() {
  return useQuery({
    queryKey: ["tenant","gadget"],
    queryFn: () => fetchTenant(),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}
