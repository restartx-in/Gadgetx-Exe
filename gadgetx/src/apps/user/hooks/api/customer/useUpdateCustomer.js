import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, customerData }) => {
      const res = await api.put(API_ENDPOINTS.PARTIES.BY_ID(id), customerData);
      return res.data; // { status: "success", data: updatedParty }
    },
    onSuccess: (response) => {
      const updatedItem = response.data;
      queryClient.invalidateQueries({ queryKey: ["customer", updatedItem.id] });
      queryClient.invalidateQueries({ queryKey: ["customers_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
export default useUpdateCustomer;
