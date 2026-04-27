import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const createSupplier = async (data) => {
  const payload = { ...data, type: "supplier" };
  const res = await api.post(API_ENDPOINTS.PARTIES.BASE, payload);
  return res.data;
};

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSupplier,
    onSuccess: (response) => {
      queryClient.setQueriesData({ queryKey: ["suppliers"] }, (oldData) => {
        if (!oldData) return oldData;
        return [...oldData, response.data];
      });
      queryClient.refetchQueries({ queryKey: ["suppliers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });
    },
  });
}
export default useCreateSupplier;
