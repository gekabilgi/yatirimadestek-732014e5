import React from 'react';
import { UserProfileData } from '@/services/userManagementService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, Key, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SecurityStatsCardProps {
  profileData: UserProfileData;
}

const SecurityStatsCard: React.FC<SecurityStatsCardProps> = ({ profileData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Account Security
        </CardTitle>
        <CardDescription>Your account security status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Verification */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {profileData.email_confirmed_at ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
            <span className="text-sm font-medium">Email Verified</span>
          </div>
          <Badge variant={profileData.email_confirmed_at ? 'default' : 'destructive'}>
            {profileData.email_confirmed_at ? 'Yes' : 'No'}
          </Badge>
        </div>

        {/* Last Password Change */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Password Changed</span>
          </div>
          <div className="text-right">
            {profileData.last_password_change ? (
              <p className="text-sm text-muted-foreground">
                {format(new Date(profileData.last_password_change), 'MMM d, yyyy')}
              </p>
            ) : (
              <Badge variant="outline">Never</Badge>
            )}
          </div>
        </div>

        {/* Last Sign In */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Last Sign In</span>
          </div>
          <div className="text-right">
            {profileData.last_sign_in_at ? (
              <p className="text-sm text-muted-foreground">
                {format(new Date(profileData.last_sign_in_at), 'MMM d, yyyy HH:mm')}
              </p>
            ) : (
              <Badge variant="outline">Never</Badge>
            )}
          </div>
        </div>

        {/* 2FA Status */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Two-Factor Auth</span>
          </div>
          <Badge variant={profileData.two_factor_enabled ? 'default' : 'outline'}>
            {profileData.two_factor_enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {!profileData.two_factor_enabled && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              Enable two-factor authentication for enhanced security (coming soon)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityStatsCard;
