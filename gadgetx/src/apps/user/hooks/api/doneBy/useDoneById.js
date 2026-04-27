import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

async function fetchDoneById(id) {
  if (!id) return null;
  const res = await api.get(API_ENDPOINTS.DONE_BYS.BY_ID(id)); // Assumes API_ENDPOINTS.DONE_BYS is configured
  return res.data;
}

export function useDoneById(id) {
  return useQuery({
    queryKey: ["done_by", id],
    queryFn: () => fetchDoneById(id),
    enabled: !!id,
  });
}
export default useDoneById;
