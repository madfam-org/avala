'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Credential {
  id: string;
  type: string;
  status: string;
  traineeId: string;
  ecCode: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface PaginatedCredentials {
  data: Credential[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseCredentialsOptions {
  page?: number;
  limit?: number;
  status?: string;
}

export function useCredentials(options: UseCredentialsOptions = {}) {
  const { page = 1, limit = 10, status } = options;

  return useQuery<PaginatedCredentials>({
    queryKey: ['credentials', { page, limit, status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) params.append('status', status);
      return apiClient.get<PaginatedCredentials>(`/credentials?${params.toString()}`);
    },
  });
}

export function useCredential(id: string | undefined) {
  return useQuery<Credential>({
    queryKey: ['credentials', id],
    queryFn: () => apiClient.get<Credential>(`/credentials/${id}`),
    enabled: !!id,
  });
}

export function useCredentialStatistics() {
  return useQuery({
    queryKey: ['credentials', 'statistics'],
    queryFn: () => apiClient.get('/credentials/statistics'),
  });
}

export function useTraineeCredentials(traineeId: string | undefined) {
  return useQuery<Credential[]>({
    queryKey: ['credentials', 'trainee', traineeId],
    queryFn: () => apiClient.get<Credential[]>(`/credentials/trainee/${traineeId}`),
    enabled: !!traineeId,
  });
}
