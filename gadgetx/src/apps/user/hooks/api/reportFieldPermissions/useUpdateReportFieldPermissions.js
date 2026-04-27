import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdateReportFieldPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, permissionsData }) => {
      const response = await api.put(
        API_ENDPOINTS.REPORT_FIELD_PERMISSIONS.BY_ID(id),
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

export default useUpdateReportFieldPermissions;