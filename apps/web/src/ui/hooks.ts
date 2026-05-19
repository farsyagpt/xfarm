import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Me } from '@xfarming/shared';
import { apiFetch } from '../lib/api';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<Me>('/api/me'),
    retry: false,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ ok: true }>('/api/auth/logout', { method: 'POST', body: '{}' }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

