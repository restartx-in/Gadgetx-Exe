import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";
import { useJobSheetInvoiceNextNo } from "@/apps/user/hooks/api/jobSheetInvoiceNo/useJobSheetInvoiceNextNo";
export function useCreateJobSheet() {
  const queryClient = useQueryClient();
  const jobsheetInvoiceNextNoMutation = useJobSheetInvoiceNextNo();

  return useMutation({
    mutationFn: async (jobSheetData) => {
      const response = await api.post(
        API_ENDPOINTS.JOBSHEETS.BASE,
        jobSheetData
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["jobsheets_paginated"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["cash_books_paginated"] });
      // queryClient.invalidateQueries({ queryKey: ["jobsheets"] });
      queryClient.setQueriesData({ queryKey: ["jobsheets"] }, (oldData) => {
        if (!oldData) return oldData;
        return [...oldData, response.data];
      });

      jobsheetInvoiceNextNoMutation.mutate();
    },
  });
}
export default useCreateJobSheet;
