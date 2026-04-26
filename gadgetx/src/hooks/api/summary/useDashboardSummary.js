import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";

const fetchDashboardSummary = async () => {
  const { data } = await api.get("/dashboard/summary");
  return data;
};

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: fetchDashboardSummary,
  });
};
