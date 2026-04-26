import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import { useSaleInvoiceNextNo } from "@/hooks/api/saleInvoiceNo/useSaleInvoiceNextNo";

export function useCreateSales() {
  const queryClient = useQueryClient();
  const saleInvoiceNextNoMutation = useSaleInvoiceNextNo();
  return useMutation({
    mutationFn: async (salesData) => {
      const response = await api.post(API_ENDPOINTS.SALES.BASE, salesData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["sales_paginated"] });
      queryClient.refetchQueries({ queryKey: ["sales"] });
      queryClient.refetchQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["items"] });
      queryClient.refetchQueries({ queryKey: ["items_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers"] });
      queryClient.refetchQueries({ queryKey: ["done_by_summary_report"] });
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
      saleInvoiceNextNoMutation.mutate();
    },
  });
}
export default useCreateSales;
