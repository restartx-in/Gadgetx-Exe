import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useDeleteVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => {
      return api.delete(API_ENDPOINTS.VOUCHERS.BY_ID(id));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["sales_paginated"] });
      queryClient.refetchQueries({ queryKey: ["saleReturns_paginated"] });
      queryClient.refetchQueries({ queryKey: ["purchaseReturns_paginated"] });
      queryClient.refetchQueries({ queryKey: ["purchase_paginated"] });
      queryClient.setQueriesData({ queryKey: ["vouchers", "list"] }, (oldData) => {
        if (!oldData) {
          return [];
        }
        return oldData.filter((item) => item.id !== id);
      });
    },
  });
}

export default useDeleteVoucher;
