import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api"; // Ensure you have FRAME: { BASE: '/frames', PAGINATED: '/frames/paginated' }
import buildQueryParams from "@/utils/buildQueryParams";

async function fetchFramesPaginated(filters) {
  const query = buildQueryParams(filters);
  const res = await api.get(`${API_ENDPOINTS.FRAME.PAGINATED}${query}`);
  return res.data;
}

export function useFramesPaginated(filters = {}) {
  return useQuery({
    queryKey: ["frames_paginated", filters],
    queryFn: () => fetchFramesPaginated(filters),
  });
}