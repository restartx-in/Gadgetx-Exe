import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export const useFrameVariantsPaginated = (params) => {
  return useQuery({
    queryKey: ["frameVariants", params],
    queryFn: async () => {
      const { data } = await api.get("/frame-variants/paginated", { params });
      return data;
    },
  });
};