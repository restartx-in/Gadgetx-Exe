import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useSaleReturnInvoiceNextNo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (type = "sale_return") => {
      return api.post(API_ENDPOINTS.INVOICE_NUMBER.NEXT, { type });
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["sale-return-invoice"] });
    },
  });
}
