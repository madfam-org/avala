"use client";

import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useSettings";
import { useDC3Statistics } from "@/hooks/useCompliance";
import { useCredentialStatistics } from "@/hooks/useBadges";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getNavigationForRole, type NavItem } from "@/config/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const t = useTranslations();

  if (!user || !tenant) {
    return null;
  }

  const navigation = getNavigationForRole(user.role);
  const quickActions = navigation
    .filter(
      (item) =>
        item.href !== "/dashboard" && item.href !== "/dashboard/settings",
    )
    .slice(0, 6);

  const roleKey = user.role
    .toLowerCase()
    .replace("_", "") as keyof typeof roleKeyMap;
  const roleKeyMap = {
    admin: "admin",
    complianceofficer: "manager",
    instructor: "instructor",
    assessor: "assessor",
    trainee: "trainee",
    supervisor: "manager",
    eceocadmin: "admin",
  } as const;
  const translatedRoleKey = roleKeyMap[roleKey] || "trainee";

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {user.firstName
            ? t("dashboard.welcomeUser", { name: user.firstName })
            : `${t("dashboard.welcome")}!`}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t(`roleMessages.${translatedRoleKey}`)}
        </p>
      </div>

      {/* Stats Cards - Role Dependent */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("dashboard.organization")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.name}</div>
            <p className="text-xs text-muted-foreground mt-1">{tenant.slug}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("dashboard.yourRole")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t(`roles.${translatedRoleKey}`)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("dashboard.accessLevel")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("dashboard.availableFeatures")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{navigation.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("dashboard.menuItems")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          {t("dashboard.quickActions")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((item) => (
            <QuickActionCard key={item.href} item={item} t={t} />
          ))}
        </div>
      </div>

      {/* Role-Specific Content */}
      <RoleSpecificContent role={user.role} userId={user.id} t={t} />
    </div>
  );
}

function QuickActionCard({
  item,
  t,
}: {
  item: NavItem;
  t: ReturnType<typeof useTranslations>;
}) {
  const Icon = item.icon;
  const title = t(item.titleKey);
  const description = item.descriptionKey ? t(item.descriptionKey) : undefined;

  return (
    <Link href={item.href}>
      <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              {title}
            </div>
            <ArrowRight className="h-4 w-4 opacity-50" />
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      </Card>
    </Link>
  );
}

function RoleSpecificContent({
  role,
  userId,
  t,
}: {
  role: string;
  userId: string;
  t: ReturnType<typeof useTranslations>;
}) {
  if (role === "ADMIN") {
    return <AdminDashboardWidgets t={t} />;
  }

  if (role === "TRAINEE") {
    return <TraineeDashboardWidgets userId={userId} t={t} />;
  }

  if (role === "INSTRUCTOR") {
    return <InstructorDashboardWidgets t={t} />;
  }

  return null;
}

function AdminDashboardWidgets({ t }: { t: ReturnType<typeof useTranslations> }) {
  const { data: userStats, isLoading: loadingUsers } = useUserStats();
  const { data: dc3Stats, isLoading: loadingDC3 } = useDC3Statistics();
  const { data: credStats, isLoading: loadingCreds } = useCredentialStatistics();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{t("dashboard.overview")}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{userStats?.total ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              DC-3 Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDC3 ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{(dc3Stats as any)?.total ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Credentials Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCreds ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{(credStats as any)?.total ?? 0}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TraineeDashboardWidgets({
  userId: _userId,
  t,
}: {
  userId: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const { data: credentials, isLoading } = useCredentialStatistics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("training.myTraining")}</CardTitle>
        <CardDescription>{t("training.progress")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-6 w-48" />
        ) : (
          <p className="text-sm text-muted-foreground">
            You have {(credentials as any)?.total ?? 0} credential(s) on record.
            Visit your <Link href="/dashboard/badges" className="text-primary underline">badges page</Link> for details.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function InstructorDashboardWidgets({ t }: { t: ReturnType<typeof useTranslations> }) {
  const { data: userStats, isLoading } = useUserStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("navigation.courses")}</CardTitle>
        <CardDescription>{t("dashboard.recentActivity")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-6 w-48" />
        ) : (
          <p className="text-sm text-muted-foreground">
            {userStats?.byRole?.TRAINEE ?? 0} trainee(s) in your organization.
            Visit <Link href="/dashboard/courses" className="text-primary underline">courses</Link> to manage your curriculum.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
