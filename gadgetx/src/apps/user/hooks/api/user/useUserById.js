import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

async function fetchUserById(id) {
  if (!id) return null;
  const res = await api.get(API_ENDPOINTS.USERS.BY_ID(id));
  return res.data;
}

export function useUserById(id) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUserById(id),
    enabled: !!id,
  });
}

export default useUserById;
