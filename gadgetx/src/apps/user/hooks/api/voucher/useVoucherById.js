import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

async function fetchVoucherById(id) {
  if (!id) return null;
  const response = await api.get(API_ENDPOINTS.VOUCHERS.BY_ID(id));
  return response.data;
}

export function useVoucherById(id) {
  return useQuery({
    queryKey: ["vouchers", "detail", id],
    queryFn: () => fetchVoucherById(id),
    enabled: !!id,
  });
}

export default useVoucherById;
