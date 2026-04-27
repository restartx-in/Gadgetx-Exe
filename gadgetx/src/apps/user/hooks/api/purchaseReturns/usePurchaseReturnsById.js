import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

async function fetchPurchaseReturnById(id) {
  if (!id) return null;
  const response = await api.get(API_ENDPOINTS.PURCHASE_RETURNS.BY_ID(id));
  return response.data;
}

export function usePurchaseReturnById(id) {
  return useQuery({
    queryKey: ["purchaseReturn", id],
    queryFn: () => fetchPurchaseReturnById(id),
    enabled: !!id,
  });
}

export default usePurchaseReturnById;
