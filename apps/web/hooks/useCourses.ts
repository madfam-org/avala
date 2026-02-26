'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  modality: string;
  durationHours: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedCourses {
  data: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseCoursesOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export function useCourses(options: UseCoursesOptions = {}) {
  const { page = 1, limit = 10, status, search } = options;

  return useQuery<PaginatedCourses>({
    queryKey: ['courses', { page, limit, status, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      return apiClient.get<PaginatedCourses>(`/courses?${params.toString()}`);
    },
  });
}

export function useCourse(id: string | undefined) {
  return useQuery<Course>({
    queryKey: ['courses', id],
    queryFn: () => apiClient.get<Course>(`/courses/${id}`),
    enabled: !!id,
  });
}

export function useCourseCurriculum(courseId: string | undefined) {
  return useQuery({
    queryKey: ['courses', courseId, 'curriculum'],
    queryFn: () => apiClient.get(`/courses/${courseId}/curriculum`),
    enabled: !!courseId,
  });
}

interface CreateCourseData {
  title: string;
  code: string;
  description?: string;
  modality?: string;
  durationHours?: number;
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCourseData) =>
      apiClient.post<Course>('/courses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}
