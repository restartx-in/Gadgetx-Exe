import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(API_ENDPOINTS.EXPENSES.BY_ID(id));
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["expenses"] });
      queryClient.refetchQueries({ queryKey: ["expenses_paginated"] });
      queryClient.refetchQueries({ queryKey: ["summary"] });
      queryClient.refetchQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["monthlySummary"] });
      queryClient.refetchQueries({ queryKey: ["done_by_summary_report"] });
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
      
    },
  });
}
export default useDeleteExpense;
