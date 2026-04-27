import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.BRAND.BY_ID(id), data);
      return res.data.data;
    },
    onSuccess: (updatedBrand) => {
      // queryClient.invalidateQueries({ queryKey: ["brand"] });
      queryClient.invalidateQueries({ queryKey: ["brand", updatedBrand.id] });
      queryClient.setQueriesData({ queryKey: ["brand"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedBrand.id ? updatedBrand : item
        );
      });
    },
  });
}

export default useUpdateBrand;
