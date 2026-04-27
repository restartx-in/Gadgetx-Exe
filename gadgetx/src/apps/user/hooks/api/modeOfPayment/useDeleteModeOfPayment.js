import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

export function useDeleteModeOfPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(API_ENDPOINTS.MODEOFPAYMENT.BY_ID(id));
      return id;
    },

    onSuccess: (deletedId) => {
      queryClient.setQueriesData(
        { queryKey: ["modeOfPayments"], exact: false },
        (oldData) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.filter((item) => item.id !== deletedId);
        },
      );
    },
  });
}
