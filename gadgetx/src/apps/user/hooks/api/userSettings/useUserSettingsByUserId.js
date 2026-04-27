import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

async function fetchUserSettingsByUserId(userId) {
  if (!userId) {
    return null;
  }
  const url = API_ENDPOINTS.USER_SETTINGS.BY_USER_ID(userId);
  const response = await api.get(url);
  return response.data;
}
export function useUserSettingsByUserId(userId) {
  return useQuery({
    queryKey: ["userSettingsByUserId", userId],
    queryFn: () => fetchUserSettingsByUserId(userId),
    enabled: !!userId,
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useUserSettingsByUserId;
