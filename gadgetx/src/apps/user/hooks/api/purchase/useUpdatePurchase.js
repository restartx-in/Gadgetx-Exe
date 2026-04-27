import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, purchaseData }) => {
      return api.put(API_ENDPOINTS.PURCHASE.BY_ID(id), purchaseData);
    },
    onSuccess: (updatedPurchase) => {
      queryClient.invalidateQueries({
        queryKey: ["purchase", updatedPurchase.id],
      });
      queryClient.setQueriesData({ queryKey: ["purchases"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedPurchase.id ? updatedPurchase : item,
        );
      });
      queryClient.refetchQueries({ queryKey: ["purchases_paginated"] });
      queryClient.refetchQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["items"] });
      queryClient.refetchQueries({ queryKey: ["items_paginated"] });
      queryClient.refetchQueries({ queryKey: ["party_summary_report"] });
      queryClient.refetchQueries({ queryKey: ["vouchers"] });
      queryClient.refetchQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["done_by_summary_report"] });
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
    },
  });
}
export default useUpdatePurchase;
