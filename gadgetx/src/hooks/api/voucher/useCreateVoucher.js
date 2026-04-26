import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useCreateVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voucherData) => {
      const response = await api.post(API_ENDPOINTS.VOUCHERS.BASE, voucherData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["sales_paginated"] });
      queryClient.refetchQueries({ queryKey: ["saleReturns_paginated"] });
      queryClient.refetchQueries({ queryKey: ["purchaseReturns_paginated"] });
      queryClient.refetchQueries({ queryKey: ["purchase_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers", "list"] });
    },
  });
}

export default useCreateVoucher;
