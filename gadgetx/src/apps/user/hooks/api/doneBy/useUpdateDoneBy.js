import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useUpdateDoneBy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.DONE_BYS.BY_ID(id), data);
      return res.data.data;
    },
    onSuccess: (updatedDoneBy) => {
      queryClient.invalidateQueries({
        queryKey: ["done_by", updatedDoneBy.id],
      });
      queryClient.setQueriesData({ queryKey: ["done_bys"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedDoneBy.id ? updatedDoneBy : item,
        );
      });
    },
  });
}

export default useUpdateDoneBy;
