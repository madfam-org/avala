'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// DC-3

interface DC3Record {
  id: string;
  serial: string;
  traineeId: string;
  courseId: string;
  status: string;
  issuedAt: string | null;
  createdAt: string;
}

interface PaginatedDC3 {
  data: DC3Record[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseDC3Options {
  page?: number;
  limit?: number;
  status?: string;
}

export function useDC3Records(options: UseDC3Options = {}) {
  const { page = 1, limit = 10, status } = options;

  return useQuery<PaginatedDC3>({
    queryKey: ['compliance', 'dc3', { page, limit, status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) params.append('status', status);
      return apiClient.get<PaginatedDC3>(`/compliance/dc3?${params.toString()}`);
    },
  });
}

export function useDC3Record(id: string | undefined) {
  return useQuery<DC3Record>({
    queryKey: ['compliance', 'dc3', id],
    queryFn: () => apiClient.get<DC3Record>(`/compliance/dc3/${id}`),
    enabled: !!id,
  });
}

export function useDC3Statistics() {
  return useQuery({
    queryKey: ['compliance', 'dc3', 'statistics'],
    queryFn: () => apiClient.get('/compliance/dc3/statistics'),
  });
}

interface GenerateDC3Data {
  traineeId: string;
  courseId: string;
}

export function useGenerateDC3() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateDC3Data) =>
      apiClient.post<DC3Record>('/compliance/dc3', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'dc3'] });
    },
  });
}

// SIRCE

interface SIRCEExport {
  id: string;
  status: string;
  format: string;
  recordCount: number;
  createdAt: string;
}

export function useSIRCEExports() {
  return useQuery<SIRCEExport[]>({
    queryKey: ['compliance', 'sirce', 'exports'],
    queryFn: () => apiClient.get<SIRCEExport[]>('/compliance/sirce/exports'),
  });
}

export function useTriggerSIRCEExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: { format?: string }) =>
      apiClient.post<SIRCEExport>('/compliance/sirce/exports', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'sirce'] });
    },
  });
}

// LFT Plans

interface LFTPlan {
  id: string;
  year: number;
  status: string;
  description: string | null;
  createdAt: string;
}

export function useLFTPlans() {
  return useQuery<LFTPlan[]>({
    queryKey: ['compliance', 'lft-plans'],
    queryFn: () => apiClient.get<LFTPlan[]>('/compliance/lft-plans'),
  });
}

export function useLFTPlan(id: string | undefined) {
  return useQuery<LFTPlan>({
    queryKey: ['compliance', 'lft-plans', id],
    queryFn: () => apiClient.get<LFTPlan>(`/compliance/lft-plans/${id}`),
    enabled: !!id,
  });
}

export function useLFTSummary() {
  return useQuery({
    queryKey: ['compliance', 'lft-plans', 'summary'],
    queryFn: () => apiClient.get('/compliance/lft-plans/summary'),
  });
}
