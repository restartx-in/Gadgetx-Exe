import { useQuery } from '@tanstack/react-query';
import api from '@/utils/axios/api';
import { API_ENDPOINTS } from '@/config/api';
import buildQueryParams from '@/utils/buildQueryParams.js';

async function fetchStockValueReportPaginated(filters) {
  const query = buildQueryParams(filters);
  const url = `${API_ENDPOINTS.STOCK_VALUE_REPORT.PAGINATED}${query}`;
  const res = await api.get(url);
  return res.data || { data: [], count: 0, page_count: 0 };
}

export function useStockValueReportPaginated(filters = {}) {
  return useQuery({
    queryKey: ['stock_value_report_paginated', filters],
    queryFn: () => fetchStockValueReportPaginated(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default useStockValueReportPaginated;