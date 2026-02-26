'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Assessment {
  id: string;
  ecCode: string;
  title: string;
  type: string;
  status: string;
  questionCount: number;
  createdAt: string;
}

interface Attempt {
  id: string;
  assessmentId: string;
  userId: string;
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
}

export function useAssessments(ecCode: string | undefined) {
  return useQuery<Assessment[]>({
    queryKey: ['assessments', ecCode],
    queryFn: () => apiClient.get<Assessment[]>(`/ec-assessment/assessments/${ecCode}`),
    enabled: !!ecCode,
  });
}

export function useAssessment(id: string | undefined) {
  return useQuery<Assessment>({
    queryKey: ['assessments', 'by-id', id],
    queryFn: () => apiClient.get<Assessment>(`/ec-assessment/assessments/by-id/${id}`),
    enabled: !!id,
  });
}

export function useAttempt(attemptId: string | undefined) {
  return useQuery<Attempt>({
    queryKey: ['assessments', 'attempts', attemptId],
    queryFn: () => apiClient.get<Attempt>(`/ec-assessment/attempts/${attemptId}`),
    enabled: !!attemptId,
  });
}

export function useAssessmentSummary(enrollmentId: string | undefined) {
  return useQuery({
    queryKey: ['assessments', 'summary', enrollmentId],
    queryFn: () => apiClient.get(`/ec-assessment/enrollments/${enrollmentId}/summary`),
    enabled: !!enrollmentId,
  });
}

interface StartAttemptData {
  assessmentId: string;
}

export function useStartAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartAttemptData) =>
      apiClient.post<Attempt>('/ec-assessment/attempts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
}
