import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useDeletePurchaseReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      return api.delete(API_ENDPOINTS.PURCHASE_RETURNS.BY_ID(id));
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["purchaseReturns"] });
      queryClient.refetchQueries({ queryKey: ["purchaseReturns_paginated"] });
      queryClient.refetchQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["items"] });
      queryClient.refetchQueries({ queryKey: ["items_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers"] });
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
    },
  });
}
export default useDeletePurchaseReturn;
