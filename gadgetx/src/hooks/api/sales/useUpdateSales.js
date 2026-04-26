import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdateSales() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, saleData }) => {
      return api.put(API_ENDPOINTS.SALES.BY_ID(id), saleData);
    },
    onSuccess: (data, { id }) => {
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: ["sales_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "list"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["items"] });
      queryClient.refetchQueries({ queryKey: ["items_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers"] });
      queryClient.refetchQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["done_by_summary_report"] });
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
    },
  });
}
export default useUpdateSales;
