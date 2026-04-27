import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useDeleteInvoiceNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.INVOICE_NUMBER.BY_ID(id));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice_numbers"] });
    },
  });
}
export default useDeleteInvoiceNumber;