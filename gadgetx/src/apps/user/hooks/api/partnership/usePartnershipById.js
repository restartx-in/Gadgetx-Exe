import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api";

async function fetchPartnershipById(id) {
  if (!id) {
    console.warn("usePartnerById hook: ID is undefined, skipping fetch.");
    return null;
  }

  try {
    const res = await api.get(API_ENDPOINTS.PARTNERSHIPS.BY_ID(id));
    return res.data;
  } catch (error) {
    console.error(`Error fetching partner with ID ${id}:`, error);
    throw error;
  }
}

export function usePartnershipById(id) {
  return useQuery({
    queryKey: ["partnership", id],
    queryFn: () => fetchPartnershipById(id),
    enabled: !!id,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export default usePartnershipById;
