import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdatePrintSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      // The PUT request is correct.
      const response = await api.put(API_ENDPOINTS.PRINT_SETTINGS, payload, {});
      return response.data;
    },
    onSuccess: () => {
      // FIX: Ensure the queryKey here EXACTLY matches the key in useFetchPrintSettings.
      // In this case, it was already correct, but this is a critical check.
      queryClient.invalidateQueries({ queryKey: ["print-settings"] });
    },
  });
}

export default useUpdatePrintSettings;