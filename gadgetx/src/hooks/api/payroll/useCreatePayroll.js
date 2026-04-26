
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api.js';

const createPayroll = async (payrollData) => {
  const res = await api.post(API_ENDPOINTS.PAYROLL.LIST, payrollData);
  return res.data;
};

export function useCreatePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPayroll,
    onSuccess: () => {

      queryClient.refetchQueries({ queryKey: ['payroll'] });
      queryClient.refetchQueries({ queryKey: ['payroll_paginated'] });
    },
  });
}

export default useCreatePayroll;