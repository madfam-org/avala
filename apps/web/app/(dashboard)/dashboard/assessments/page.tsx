'use client';

import { useState } from 'react';
import { useEnrollments } from '@/hooks/useTraining';
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
import { ClipboardCheck, FileQuestion, CheckCircle2 } from 'lucide-react';

export default function AssessmentsPage() {
  const [page, setPage] = useState(1);
  const { data: enrollments, isLoading, error } = useEnrollments({ page, limit: 10 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground mt-2">
          Create, manage, and grade trainee assessments
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{enrollments?.total ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">active trainees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {enrollments?.data?.filter(e => e.status === 'IN_PROGRESS').length ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">active assessments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {enrollments?.data?.filter(e => e.status === 'COMPLETED').length ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">graded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {enrollments?.data?.length
                  ? Math.round(enrollments.data.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.data.length)
                  : 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">across enrollments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Training Enrollments
          </CardTitle>
          <CardDescription>
            Active training enrollments and assessment progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">Failed to load enrollments.</p>
          ) : !enrollments?.data?.length ? (
            <p className="text-sm text-muted-foreground">No enrollments found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EC Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.data.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-mono text-sm">{enrollment.ecCode}</TableCell>
                      <TableCell>
                        <Badge variant={
                          enrollment.status === 'COMPLETED' ? 'default' :
                          enrollment.status === 'IN_PROGRESS' ? 'secondary' :
                          'outline'
                        }>
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{enrollment.progress}%</TableCell>
                      <TableCell>{new Date(enrollment.startedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {enrollments.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {enrollments.page} of {enrollments.totalPages} ({enrollments.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= enrollments.totalPages}>
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
