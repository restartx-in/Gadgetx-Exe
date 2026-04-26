import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios/api.js';
import { API_ENDPOINTS } from '@/config/api';
import buildQueryParams from '@/utils/buildQueryParams.js';

async function fetchPaginatedVouchers(filters) {
  const query = buildQueryParams(filters);
  const url = `${API_ENDPOINTS.VOUCHERS.PAGINATED}${query}`;
  const res = await api.get(url);
  return res.data || [];
}

export function useVouchersPaginated(filters = {}) {
  return useQuery({
    queryKey: ['vouchers_paginated', filters],
    queryFn: () => fetchPaginatedVouchers(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useVouchersPaginated;