import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdatePurchaseReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      return api.put(API_ENDPOINTS.PURCHASE_RETURNS.BY_ID(id), data);
    },
    onSuccess: (updatedPurchasereturn) => {
      queryClient.invalidateQueries({
        queryKey: ["purchaseReturn", updatedPurchasereturn.id],
      });

      queryClient.setQueriesData(
        { queryKey: ["purchaseReturns"] },
        (oldData) => {
          if (!oldData) {
            return oldData;
          }
          return oldData.map((item) =>
            item.id === updatedPurchasereturn.id ? updatedPurchasereturn : item,
          );
        },
      );
      queryClient.refetchQueries({ queryKey: ["purchaseReturns_paginated"] });
      queryClient.refetchQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["items"] });
      queryClient.refetchQueries({ queryKey: ["items_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers"] });
      queryClient.refetchQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
    },
  });
}
export default useUpdatePurchaseReturn;
