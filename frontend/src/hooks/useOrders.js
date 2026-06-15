import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useMyOrders() {
  return useQuery({ queryKey: ['my-orders'], queryFn: () => api.get('/api/orders/my').then(r => r.data) });
}

export function useOrderDetail(id) {
  return useQuery({ queryKey: ['order', id], queryFn: () => api.get(`/api/orders/${id}`).then(r => r.data), enabled: !!id });
}

export function useSupplierOrders() {
  return useQuery({ queryKey: ['supplier-orders'], queryFn: () => api.get('/api/supplier/orders').then(r => r.data) });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/api/supplier/orders/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries(['supplier-orders']); },
  });
}

export function useAdminOrders(params) {
  return useQuery({ queryKey: ['admin-orders', params], queryFn: () => api.get('/api/admin/orders', { params }).then(r => r.data) });
}
