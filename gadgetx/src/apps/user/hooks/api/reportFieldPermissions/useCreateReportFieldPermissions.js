import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useCreateReportFieldPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissionsData) => {
      const response = await api.post(
        API_ENDPOINTS.REPORT_FIELD_PERMISSIONS.BASE,
        permissionsData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ["report_field_permissions"],
      });
    },
  });
}

export default useCreateReportFieldPermissions;