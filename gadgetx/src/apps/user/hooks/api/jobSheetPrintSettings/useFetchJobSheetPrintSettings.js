import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useFetchJobSheetPrintSettings() {
  return useQuery({
    queryKey: ["job-sheet-print-settings"],
    queryFn: async () => {
      // Ensure API_ENDPOINTS.JOB_SHEET_PRINT_SETTINGS is defined in your config
      const response = await api.get(API_ENDPOINTS.JOB_SHEET_PRINT_SETTINGS);
      return response.data;
    },
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useFetchJobSheetPrintSettings;
