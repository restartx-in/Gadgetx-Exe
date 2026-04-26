import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";
import { usePurchaseInvoiceNextNo } from "@/hooks/api/purchaseInvoiceNo/usePurchaseInvoiceNextNo";
export function useCreatePurchase() {
  const queryClient = useQueryClient();
  const purchaseInvoiceNextNoMutation = usePurchaseInvoiceNextNo();

  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(API_ENDPOINTS.PURCHASE.BASE, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["purchases_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["items"] });
      queryClient.refetchQueries({ queryKey: ["items_paginated"] });
      queryClient.refetchQueries({ queryKey: ["party_summary_report"] });
      queryClient.refetchQueries({ queryKey: ["vouchers"] });
      queryClient.refetchQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["done_by_summary_report"] });
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
      purchaseInvoiceNextNoMutation.mutate();
    },
  });
}
export default useCreatePurchase;
