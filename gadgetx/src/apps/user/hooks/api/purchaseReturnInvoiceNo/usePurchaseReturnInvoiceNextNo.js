import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function usePurchaseReturnInvoiceNextNo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (type = "purchase_return") => {
      return api.post(API_ENDPOINTS.INVOICE_NUMBER.NEXT, { type });
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["purchase-return-invoice"] });
    },
  });
}
