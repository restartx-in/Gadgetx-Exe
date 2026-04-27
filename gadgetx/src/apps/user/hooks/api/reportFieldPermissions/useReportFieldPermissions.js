import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

async function fetchReportFieldPermissions() {
  const res = await api.get(API_ENDPOINTS.REPORT_FIELD_PERMISSIONS.BASE);
  return res.data;
}

export function useReportFieldPermissions() {
  return useQuery({
    queryKey: ["report_field_permissions"],
    queryFn: fetchReportFieldPermissions,
    staleTime: Infinity,
    cacheTime: Infinity,
  });
}

export default useReportFieldPermissions;