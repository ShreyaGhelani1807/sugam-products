import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function useAnalyticsOverview() {
  return useQuery({ queryKey: ['analytics-overview'], queryFn: () => api.get('/api/admin/analytics/overview').then(r => r.data) });
}

export function useAnalyticsMonthly() {
  return useQuery({ queryKey: ['analytics-monthly'], queryFn: () => api.get('/api/admin/analytics/monthly').then(r => r.data) });
}

export function useAnalyticsProducts() {
  return useQuery({ queryKey: ['analytics-products'], queryFn: () => api.get('/api/admin/analytics/products').then(r => r.data) });
}
