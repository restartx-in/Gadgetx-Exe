import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useDeletePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return api.delete(API_ENDPOINTS.PURCHASE.BY_ID(id));
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["purchases"] });
      queryClient.refetchQueries({ queryKey: ["purchases_paginated"] });
      queryClient.refetchQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["items"] });
      queryClient.refetchQueries({ queryKey: ["items_paginated"] });
      queryClient.refetchQueries({ queryKey: ["party_summary_report"] });
      queryClient.refetchQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers"] });
      queryClient.refetchQueries({ queryKey: ["done_by_summary_report"] });
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
    },
  });
}
export default useDeletePurchase;
