import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useCreateInvoiceNumber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(API_ENDPOINTS.INVOICE_NUMBER.BASE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice_numbers"] });
    },
  });
}