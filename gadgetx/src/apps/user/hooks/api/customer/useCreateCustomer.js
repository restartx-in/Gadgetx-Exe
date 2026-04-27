import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // Force type to 'customer'
      const payload = { ...data, type: "customer" };
      const res = await api.post(API_ENDPOINTS.PARTIES.BASE, payload);
      return res.data; // { status: "success", data: newParty }
    },
    onSuccess: (response) => {
      // Invalidate all related lists
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["parties"] }); 
      queryClient.invalidateQueries({ queryKey: ["ledgers_paginated"] }); // Because backend creates a ledger
    },
  });
}
export default useCreateCustomer;
