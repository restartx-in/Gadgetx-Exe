import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios/api';
import { API_ENDPOINTS } from '@/config/api';

async function fetchRoleById(id) {
  if (!id) return null;
  const res = await api.get(API_ENDPOINTS.ROLES.BY_ID(id));
  return res.data;
}

export function useRoleById(id) {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => fetchRoleById(id),
    enabled: !!id,
  });
}

export default useRoleById;