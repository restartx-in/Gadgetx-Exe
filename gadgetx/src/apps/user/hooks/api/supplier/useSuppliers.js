import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchSuppliers(filters = {}) {
  const params = { ...filters, type: "supplier" };
  const query = buildQueryParams(params);
  const res = await api.get(`${API_ENDPOINTS.PARTIES.BASE}${query}`);
  return res.data || [];
}

export function useSuppliers(filters = {}) {
  return useQuery({
    queryKey: ["suppliers", filters],
    queryFn: () => fetchSuppliers(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}
export default useSuppliers;
