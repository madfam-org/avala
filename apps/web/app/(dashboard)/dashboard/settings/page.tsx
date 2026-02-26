'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Bell, Shield, Palette, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, tenant } = useAuth();

  if (!user || !tenant) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      <ProfileSection userId={user.id} user={user} tenant={tenant} />

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notification preferences coming in a future update.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Password and 2FA are managed through your SSO provider (Janua)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To change your password or enable two-factor authentication, use your organization&apos;s SSO portal.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Appearance settings coming in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSection({
  userId,
  user,
  tenant,
}: {
  userId: string;
  user: { email: string; firstName: string | null; lastName: string | null; role: string };
  tenant: { name: string };
}) {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const updateProfile = useUpdateProfile(userId);

  const hasChanges =
    firstName !== (user.firstName || '') || lastName !== (user.lastName || '');

  const handleSave = () => {
    updateProfile.mutate({ firstName, lastName });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Your personal information and account details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            defaultValue={user.email}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Email is managed through your SSO provider.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Input
            value={user.role.toLowerCase().replace('_', ' ')}
            disabled
            className="capitalize"
          />
        </div>
        <div className="space-y-2">
          <Label>Organization</Label>
          <Input value={tenant.name} disabled />
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateProfile.isPending}
        >
          {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        {updateProfile.isSuccess && (
          <p className="text-xs text-green-600">Profile updated successfully.</p>
        )}
        {updateProfile.isError && (
          <p className="text-xs text-destructive">Failed to update profile. Please try again.</p>
        )}
      </CardContent>
    </Card>
  );
}
