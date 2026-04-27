import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import api from "@/utils/axios/api.js";

async function fetchEmployeeById(id) {
  if (!id) return null;
  const res = await api.get(API_ENDPOINTS.EMPLOYEE.BY_ID(id));
  return res.data;
}

export function useEmployeeById(id) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => fetchEmployeeById(id),
    enabled: !!id,
  });
}

export default useEmployeeById;
