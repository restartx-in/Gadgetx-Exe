import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.CATEGORY.BY_ID(id), data);
      return res.data.data;
    },
    onSuccess: (updatedCategory) => {
      // queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({
        queryKey: ["category", updatedCategory.id],
      });
      queryClient.setQueriesData({ queryKey: ["categories"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedCategory.id ? updatedCategory : item
        );
      });
    },
  });
  queryClient.refetchQueries({ queryKey: ["categories"] });
  queryClient.refetchQueries({ queryKey: ["items"] });
}

export default useUpdateCategory;
