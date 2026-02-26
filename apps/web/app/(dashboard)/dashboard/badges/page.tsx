'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCredentials, useCredentialStatistics } from '@/hooks/useBadges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Award } from 'lucide-react';

export default function BadgesPage() {
  const { user: _user } = useAuth();
  const { data: stats, isLoading: loadingStats } = useCredentialStatistics();
  const [page, setPage] = useState(1);
  const { data: credentials, isLoading: loadingCreds, error } = useCredentials({ page, limit: 10 });

  const s = stats as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Badges & Credentials</h1>
        <p className="text-muted-foreground mt-2">
          Your earned credentials and verifiable achievements
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{s?.total ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{s?.active ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">valid credentials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{s?.expired ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">need renewal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{s?.pending ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">in progress</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Credentials
          </CardTitle>
          <CardDescription>
            Your Open Badges 3.0 verifiable credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCreds ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">Failed to load credentials.</p>
          ) : !credentials?.data?.length ? (
            <p className="text-sm text-muted-foreground">
              No credentials earned yet. Complete training and assessments to earn verifiable badges.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>EC Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.data.map((cred) => (
                    <TableRow key={cred.id}>
                      <TableCell>{cred.type}</TableCell>
                      <TableCell className="font-mono text-sm">{cred.ecCode || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={cred.status === 'ACTIVE' ? 'default' : cred.status === 'EXPIRED' ? 'destructive' : 'secondary'}>
                          {cred.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{cred.issuedAt ? new Date(cred.issuedAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{cred.expiresAt ? new Date(cred.expiresAt).toLocaleDateString() : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {credentials.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {credentials.page} of {credentials.totalPages} ({credentials.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= credentials.totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
