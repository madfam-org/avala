'use client';

import { useState } from 'react';
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
import { FileText, ClipboardList, Calendar, Download, RefreshCw } from 'lucide-react';
import { useDC3Records, useDC3Statistics, useSIRCEExports, useTriggerSIRCEExport, useLFTPlans, useLFTSummary } from '@/hooks/useCompliance';

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Management</h1>
        <p className="text-muted-foreground mt-2">
          DC-3 records, SIRCE exports, and LFT training plans
        </p>
      </div>

      <DC3StatsCards />
      <DC3RecordsTable />
      <SIRCEExportsSection />
      <LFTPlansSection />
    </div>
  );
}

function DC3StatsCards() {
  const { data: stats, isLoading } = useDC3Statistics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const s = stats as any;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total DC-3 Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s?.total ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Issued
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s?.issued ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s?.pending ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s?.thisMonth ?? 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function DC3RecordsTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useDC3Records({ page, limit: 10 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          DC-3 Records
        </CardTitle>
        <CardDescription>
          Constancia de Competencias certificates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">Failed to load DC-3 records.</p>
        ) : data?.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No DC-3 records found.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">{record.serial}</TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'ISSUED' ? 'default' : 'secondary'}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.issuedAt ? new Date(record.issuedAt).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {data.page} of {data.totalPages} ({data.total} total)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SIRCEExportsSection() {
  const { data: exports, isLoading, error } = useSIRCEExports();
  const triggerExport = useTriggerSIRCEExport();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              SIRCE Exports
            </CardTitle>
            <CardDescription>
              STPS reporting format exports
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => triggerExport.mutate({})}
            disabled={triggerExport.isPending}
          >
            {triggerExport.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            New Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">Failed to load exports.</p>
        ) : !exports?.length ? (
          <p className="text-sm text-muted-foreground">No SIRCE exports yet. Click &ldquo;New Export&rdquo; to generate one.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Format</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exports.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="uppercase">{exp.format}</TableCell>
                  <TableCell>{exp.recordCount}</TableCell>
                  <TableCell>
                    <Badge variant={exp.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {exp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(exp.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function LFTPlansSection() {
  const { data: plans, isLoading, error } = useLFTPlans();
  const { data: _summary } = useLFTSummary();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          LFT Training Plans
        </CardTitle>
        <CardDescription>
          Annual training plans per Ley Federal del Trabajo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">Failed to load LFT plans.</p>
        ) : !plans?.length ? (
          <p className="text-sm text-muted-foreground">No LFT plans found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-bold">{plan.year}</TableCell>
                  <TableCell>
                    <Badge variant={plan.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {plan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{plan.description || '—'}</TableCell>
                  <TableCell>{new Date(plan.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
