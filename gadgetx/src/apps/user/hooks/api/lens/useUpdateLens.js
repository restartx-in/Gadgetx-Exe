import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdateLens() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.LENSES.BY_ID(id), data);
      return res.data.data;
    },
    onSuccess: (updatedLens) => {
      queryClient.invalidateQueries({ queryKey: ["lens", updatedLens.id] });
      queryClient.invalidateQueries({ queryKey: ["lenses"] });
    },
  });
}
