import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdateVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, voucherData }) => {
      return api.put(API_ENDPOINTS.VOUCHERS.BY_ID(id), voucherData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers", "list"] });
      queryClient.refetchQueries({ queryKey: ["sales_paginated"] });
      queryClient.refetchQueries({ queryKey: ["saleReturns_paginated"] });
      queryClient.refetchQueries({ queryKey: ["purchaseReturns_paginated"] });
      queryClient.refetchQueries({ queryKey: ["purchase_paginated"] });
    },
  });
}

export default useUpdateVoucher;
