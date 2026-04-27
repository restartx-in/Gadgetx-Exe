import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expenseData) => {
      const res = await api.post(API_ENDPOINTS.EXPENSES.BASE, expenseData);
      return res.data;
    },
    onSuccess: (response) => {
      // queryClient.refetchQueries({ queryKey: ["expenses"] });
      queryClient.refetchQueries({ queryKey: ["expenses_paginated"] });
      queryClient.refetchQueries({ queryKey: ["summary"] });
      queryClient.refetchQueries({ queryKey: ["cash_books_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["monthlySummary"] });
      queryClient.refetchQueries({ queryKey: ["done_by_summary_report"] });
      queryClient.refetchQueries({ queryKey: ["cost_center_summary_report"] });
      queryClient.setQueriesData({ queryKey: ["expenses"] }, (oldData) => {
        if (!oldData) return oldData;
        return [...oldData, response.data];
      });
    },
  });
}
export default useCreateExpense;
