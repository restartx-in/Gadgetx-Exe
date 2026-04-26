// src/hooks/api/ledger/useLedgerReport.js
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchLedgerReport(filters) {
  // Fetch default transactional report (all vouchers or specific ledger)
  const query = buildQueryParams(filters)
  const res = await api.get(`${API_ENDPOINTS.LEDGERS.BASE}/report${query}`)
  return res.data
}

async function fetchMonthlyReport(filters) {
  // Fetch Monthly/Summary report
  // Backend now handles "Get All" via the same endpoint if ledger_id is missing
  const query = buildQueryParams(filters)
  const res = await api.get(`${API_ENDPOINTS.LEDGERS.BASE}/report/monthly${query}`)
  return res.data
}

export function useLedgerReport(filters = {}) {
  const isMonthly = filters.view === 'monthly';
  
  return useQuery({
    queryKey: ['ledger_report', filters],
    queryFn: () => isMonthly ? fetchMonthlyReport(filters) : fetchLedgerReport(filters),
    keepPreviousData: true,
  })
}