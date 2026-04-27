import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

async function fetchDoneBys() {
  const res = await api.get(API_ENDPOINTS.DONE_BYS.BASE); // Assumes API_ENDPOINTS.DONE_BYS is configured
  return res.data || [];
}

export function useDoneBys() {
  return useQuery({
    queryKey: ["done_bys"],
    queryFn: () => fetchDoneBys(),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}
export default useDoneBys;
