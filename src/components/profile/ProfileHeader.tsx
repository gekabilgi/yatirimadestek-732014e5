import React from 'react';
import { UserProfileData } from '@/services/userManagementService';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileHeaderProps {
  profileData: UserProfileData;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profileData }) => {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'ydo':
        return 'default';
      case 'qna':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'ydo':
        return 'YDO';
      case 'qna':
        return 'Q&A Yöneticisi';
      default:
        return role;
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm p-6">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">
              {profileData.full_name}
            </h1>
            {!profileData.is_active && (
              <Badge variant="outline" className="text-destructive border-destructive">
                Inactive
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {profileData.email}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Joined {format(new Date(profileData.created_at), 'MMM d, yyyy')}
            </div>
          </div>

          {/* Roles */}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {profileData.roles.length > 0 ? (
                profileData.roles.map((role) => (
                  <Badge key={role} variant={getRoleBadgeVariant(role)}>
                    {getRoleLabel(role)}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">User</Badge>
              )}
            </div>
          </div>

          {/* Province & Department */}
          {(profileData.province || profileData.department) && (
            <div className="mt-3 text-sm text-muted-foreground">
              {profileData.province && <span>Province: {profileData.province}</span>}
              {profileData.province && profileData.department && <span className="mx-2">•</span>}
              {profileData.department && <span>Department: {profileData.department}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
