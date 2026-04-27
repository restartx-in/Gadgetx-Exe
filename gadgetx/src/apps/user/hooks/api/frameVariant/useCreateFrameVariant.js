import { useMutation } from "@tanstack/react-query";
import api from "@/utils/axios/api";

export const useCreateFrameVariant = () => {
  return useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "image" && value instanceof File) {
          formData.append("image", value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });
      const response = await api.post("/frame-variants", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
  });
};