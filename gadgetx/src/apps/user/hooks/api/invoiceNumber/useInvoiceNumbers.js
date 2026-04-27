import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api"; 
import buildQueryParams from "@/utils/buildQueryParams";

async function fetchInvoiceNumbers(filters) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.INVOICE_NUMBER.BASE}${query}`);
  return res.data;
}

export function useInvoiceNumbers(filters = {}) {
  return useQuery({
    queryKey: ["invoice_numbers", filters],
    queryFn: () => fetchInvoiceNumbers(filters),
  });
}