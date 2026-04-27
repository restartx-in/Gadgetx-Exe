import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdateSaleReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      return api.put(API_ENDPOINTS.SALE_RETURNS.BY_ID(id), data);
    },
    onSuccess: (updatedSaleReturn) => {
      queryClient.invalidateQueries({
        queryKey: ["saleReturn", updatedSaleReturn.id],
      });

      queryClient.setQueriesData({ queryKey: ["saleReturns"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedSaleReturn.id ? updatedSaleReturn : item,
        );
      });
      queryClient.invalidateQueries({ queryKey: ["saleReturns_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["cash_books_pagated"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["items"] });
      queryClient.refetchQueries({ queryKey: ["items_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers"] });
      queryClient.refetchQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
    },
  });
}
export default useUpdateSaleReturn;
