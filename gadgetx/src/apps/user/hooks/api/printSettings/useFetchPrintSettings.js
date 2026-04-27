import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useFetchPrintSettings() {
  return useQuery({
    queryKey: ["print-settings"], // The key is correct.
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.PRINT_SETTINGS);
      return response.data;
    },
   
  });
}

export default useFetchPrintSettings;