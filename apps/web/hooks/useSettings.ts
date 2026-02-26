'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Role } from '@avala/db';

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  curp: string | null;
  rfc: string | null;
  avatarUrl: string | null;
}

interface UserStats {
  total: number;
  byRole: Record<string, number>;
}

export function useUserProfile(userId: string | undefined) {
  return useQuery<UserProfile>({
    queryKey: ['users', userId],
    queryFn: () => apiClient.get<UserProfile>(`/users/${userId}`),
    enabled: !!userId,
  });
}

export function useUserStats() {
  return useQuery<UserStats>({
    queryKey: ['users', 'stats'],
    queryFn: () => apiClient.get<UserStats>('/users/stats'),
  });
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  curp?: string;
  rfc?: string;
}

export function useUpdateProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) =>
      apiClient.patch<UserProfile>(`/users/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
