import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api.js";
import { API_ENDPOINTS } from "@/config/api";

async function fetchInvoiceNumber() {
  const res = await api.get(
    `${API_ENDPOINTS.INVOICE_NUMBER.BASE}?type=jobsheet`
  );

  return res.data || [];
}

export function useJobSheetInvoiceNo(enabled = false) {
  return useQuery({
    queryKey: ["jobsheet-invoice"],
    queryFn: () => fetchInvoiceNumber(),
    enabled,
  });
}
