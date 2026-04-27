import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams.js";

async function fetchPartyFinancialDetails(partyId, filters = {}) {
  if (!partyId) return null;
  const query = buildQueryParams(filters);
  const res = await api.get(
    `${API_ENDPOINTS.PARTY_SUMMARY_REPORT.DETAILS(partyId)}${query}`
  );
  return res.data || null;
}

export function usePartyFinancialDetails(partyId, filters = {}, options = {}) {
  return useQuery({
    queryKey: ["party_financial_details", partyId, filters],
    queryFn: () => fetchPartyFinancialDetails(partyId, filters),
    enabled: !!partyId && (options.enabled ?? true),
    gcTime: Infinity,
    staleTime: Infinity,
  });
}

export default usePartyFinancialDetails;
