'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Enrollment {
  id: string;
  userId: string;
  ecCode: string;
  status: string;
  progress: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

interface PaginatedEnrollments {
  data: Enrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseEnrollmentsOptions {
  page?: number;
  limit?: number;
  status?: string;
}

export function useEnrollments(options: UseEnrollmentsOptions = {}) {
  const { page = 1, limit = 10, status } = options;

  return useQuery<PaginatedEnrollments>({
    queryKey: ['enrollments', { page, limit, status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) params.append('status', status);
      return apiClient.get<PaginatedEnrollments>(`/ec-training/enrollments?${params.toString()}`);
    },
  });
}

export function useEnrollment(id: string | undefined) {
  return useQuery<Enrollment>({
    queryKey: ['enrollments', id],
    queryFn: () => apiClient.get<Enrollment>(`/ec-training/enrollments/${id}`),
    enabled: !!id,
  });
}

export function useUserEnrollments(userId: string | undefined) {
  return useQuery<Enrollment[]>({
    queryKey: ['enrollments', 'user', userId],
    queryFn: () => apiClient.get<Enrollment[]>(`/ec-training/enrollments/user/${userId}`),
    enabled: !!userId,
  });
}

export function useEnrollmentProgress(enrollmentId: string | undefined) {
  return useQuery({
    queryKey: ['enrollments', enrollmentId, 'progress'],
    queryFn: () => apiClient.get(`/ec-training/enrollments/${enrollmentId}/progress`),
    enabled: !!enrollmentId,
  });
}

export function useEnrollmentActivity(enrollmentId: string | undefined) {
  return useQuery({
    queryKey: ['enrollments', enrollmentId, 'activity'],
    queryFn: () => apiClient.get(`/ec-training/enrollments/${enrollmentId}/activity`),
    enabled: !!enrollmentId,
  });
}

interface EnrollUserData {
  userId: string;
  ecCode: string;
}

export function useEnrollUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EnrollUserData) =>
      apiClient.post<Enrollment>('/ec-training/enrollments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
