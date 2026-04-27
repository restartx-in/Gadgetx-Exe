import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const updateInvoiceNumber = async ({ id, data }) => {
  if (!id) throw new Error("ID is required for update");
  const res = await api.put(API_ENDPOINTS.INVOICE_NUMBER.BY_ID(id), data);
  return res.data;
};

export function useUpdateInvoiceNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInvoiceNumber,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["invoice_number", response.data?.id] });
      queryClient.refetchQueries({ queryKey: ["invoice_numbers"] });
    },
  });
}
export default useUpdateInvoiceNumber;