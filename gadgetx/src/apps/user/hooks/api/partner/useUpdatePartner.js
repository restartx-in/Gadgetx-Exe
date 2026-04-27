import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api";

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(API_ENDPOINTS.PARTNERS.BY_ID(id), data);
      return res.data.data;
    },
    onSuccess: (updatedPartner) => {
      queryClient.invalidateQueries({
        queryKey: ["partner", updatedPartner.id],
      });
      queryClient.setQueriesData({ queryKey: ["partners"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedPartner.id ? updatedPartner : item,
        );
      });

      queryClient.refetchQueries({ queryKey: ["partners_paginated"] });
    },
  });
}
export default useUpdatePartner;
