import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useDeleteVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => {
      return api.delete(API_ENDPOINTS.VOUCHERS.BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["sales_paginated"] });
      queryClient.refetchQueries({ queryKey: ["saleReturns_paginated"] });
      queryClient.refetchQueries({ queryKey: ["purchaseReturns_paginated"] });
      queryClient.refetchQueries({ queryKey: ["purchase_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers", "list"] });
    },
  });
}

export default useDeleteVoucher;
