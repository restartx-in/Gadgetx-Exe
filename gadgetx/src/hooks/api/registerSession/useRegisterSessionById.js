import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

async function fetchSessionById(id) {
  if (!id) return null;
  const response = await api.get(API_ENDPOINTS.REGISTER_SESSIONS.BY_ID(id));
  return response.data;
}

export function useRegisterSessionById(id) {
  return useQuery({
    queryKey: ["register_sessions", "detail", id],
    queryFn: () => fetchSessionById(id),
    enabled: !!id,
    gcTime: Infinity,
    staleTime: Infinity,
  });
}
export default useRegisterSessionById;
