import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function usePurchaseInvoiceNextNo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (type = "purchase") => {
      return api.post(API_ENDPOINTS.INVOICE_NUMBER.NEXT, { type });
    },
    onSuccess: () => {
      // Invalidate all lists
      queryClient.refetchQueries({ queryKey: ["purchase-invoice"] });
    },
  });
}
