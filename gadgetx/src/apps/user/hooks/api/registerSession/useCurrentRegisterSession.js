import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

async function fetchCurrentSession() {
  try {
    const response = await api.get(API_ENDPOINTS.REGISTER_SESSIONS.CURRENT);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

export function useCurrentRegisterSession() {
  return useQuery({
    queryKey: ["register_sessions", "current"],
    queryFn: fetchCurrentSession,
    retry: false,
    gcTime: 5 * 60 * 1000,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
export default useCurrentRegisterSession;
