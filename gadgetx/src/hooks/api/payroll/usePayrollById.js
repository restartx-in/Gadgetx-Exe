
import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api.js';

async function fetchPayrollById(id) {
  if (!id) return null;
  
  const res = await api.get(API_ENDPOINTS.PAYROLL.BY_ID(id));
  return res.data;
}

export function usePayrollById(id) {
  return useQuery({
    queryKey: ['payroll', id],
    queryFn: () => fetchPayrollById(id),
    enabled: !!id, 
  });
}

export default usePayrollById;