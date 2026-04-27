import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useCreateDoneBy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doneByData) => {
      const res = await api.post(API_ENDPOINTS.DONE_BYS.BASE, doneByData);
      return res.data;
    },
    onSuccess: (response) => {
      queryClient.setQueriesData({ queryKey: ["done_bys"] }, (oldData) => {
        if (!oldData) return oldData;
        return [...oldData, response.data];
      });
    },
  });
}
