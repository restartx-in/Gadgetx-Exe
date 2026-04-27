import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import { useSaleInvoiceNextNo } from "@/apps/user/hooks/api/saleInvoiceNo/useSaleInvoiceNextNo";

export function useCreateSales() {
  const queryClient = useQueryClient();
  const saleInvoiceNextNoMutation = useSaleInvoiceNextNo();
  return useMutation({
    mutationFn: async (salesData) => {
      const response = await api.post(API_ENDPOINTS.SALES.BASE, salesData);
      return response.data;
    },
    onSuccess: (response) => {
      // When queued offline the response has no real server data — skip
      // cache mutations and secondary requests to avoid corruption.
      const isQueued = response && response._queued;

      queryClient.refetchQueries({ queryKey: ["sales_paginated"] });
      if (!isQueued) {
        queryClient.setQueriesData({ queryKey: ["sales"] }, (oldData) => {
          if (!oldData) return oldData;
          return [...oldData, response.data];
        });
      }
      queryClient.refetchQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["items"] });
      queryClient.refetchQueries({ queryKey: ["items_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers"] });
      queryClient.refetchQueries({ queryKey: ["done_by_summary_report"] });
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
      queryClient.invalidateQueries({ queryKey: ["register_sessions", "current"] });
      queryClient.invalidateQueries({ queryKey: ["register_sessions", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["register_sessions_paginated"] });
      // Don't bump invoice number when offline — the server will do it on sync.
      if (!isQueued) {
        saleInvoiceNextNoMutation.mutate();
      }
    },
  });
}
export default useCreateSales;
