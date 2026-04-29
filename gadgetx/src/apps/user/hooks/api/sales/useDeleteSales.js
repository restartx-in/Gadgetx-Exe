import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useDeleteSales() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => {
      return api.delete(API_ENDPOINTS.SALES.BY_ID(id));
    },
    onSuccess: (data, deletedId) => {
      queryClient.setQueriesData({ queryKey: ["sales", "list"] }, (oldData) => {
        if (!Array.isArray(oldData)) {
          return oldData || [];
        }
        return oldData.filter((item) => item.id !== deletedId);
      });
      queryClient.invalidateQueries({ queryKey: ["sales_paginated"] });
      // queryClient.invalidateQueries({ queryKey: ["sales", "list"] });
      queryClient.invalidateQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["items"] });
      queryClient.refetchQueries({ queryKey: ["items_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["vouchers"] });
      queryClient.refetchQueries({ queryKey: ["done_by_summary_report"] });
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
    },
  });
}
export default useDeleteSales;
