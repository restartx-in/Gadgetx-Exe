import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdateJobSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, jobSheetData }) => {
      return api.put(API_ENDPOINTS.JOBSHEETS.BY_ID(id), jobSheetData);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["jobsheets_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["jobsheet", variables.id] });
      queryClient.refetchQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["cash_books_paginated"] });
      // queryClient.invalidateQueries({ queryKey: ["jobsheets"] });
      queryClient.setQueriesData({ queryKey: ["jobsheets"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === variables.id ? variables : item,
        );
      });
    },
  });
}
export default useUpdateJobSheet;
