import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function useProducts(params) {
  return useQuery({ queryKey: ['products', params], queryFn: () => api.get('/api/products', { params }).then(r => r.data) });
}

export function useProduct(slug) {
  return useQuery({ queryKey: ['product', slug], queryFn: () => api.get(`/api/products/${slug}`).then(r => r.data), enabled: !!slug });
}
