import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

async function fetchTransactionFieldPermissions() {
  const res = await api.get(API_ENDPOINTS.TRANSACTION_FIELD_PERMISSIONS.BASE);
  return res.data;
}

export function useTransactionFieldPermissions() {
  return useQuery({
    queryKey: ["transaction_field_permissions"],
    queryFn: fetchTransactionFieldPermissions,
  });
}

export default useTransactionFieldPermissions;