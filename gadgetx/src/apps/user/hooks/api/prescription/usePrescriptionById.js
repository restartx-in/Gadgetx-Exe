import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

async function fetchPrescriptionById(id) {
  if (!id) {
    console.warn("usePrescriptionById hook: ID is undefined, skipping fetch.");
    return null;
  }

  try {
    const res = await api.get(API_ENDPOINTS.PRESCRIPTIONS.BY_ID(id));
    return res.data;
  } catch (error) {
    console.error(`Error fetching prescription with ID ${id}:`, error);
    throw error;
  }
}

export function usePrescriptionById(id) {
  return useQuery({
    queryKey: ["prescription", id],
    queryFn: () => fetchPrescriptionById(id),
    enabled: !!id,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export default usePrescriptionById;
