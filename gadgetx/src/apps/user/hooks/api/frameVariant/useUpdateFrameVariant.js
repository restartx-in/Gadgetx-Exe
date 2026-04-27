import { useMutation } from "@tanstack/react-query";
import api from "@/utils/axios/api";

export const useUpdateFrameVariant = () => {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "image" && value instanceof File) {
          formData.append("image", value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });
      const response = await api.put(`/frame-variants/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
  });
};