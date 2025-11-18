import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MainNavbar from '@/components/MainNavbar';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileEditForm from '@/components/profile/ProfileEditForm';
import PasswordChangeForm from '@/components/profile/PasswordChangeForm';
import SecurityStatsCard from '@/components/profile/SecurityStatsCard';
import LoginHistoryTable from '@/components/profile/LoginHistoryTable';
import ActivityHistoryCard from '@/components/profile/ActivityHistoryCard';
import { fetchUserProfileWithActivity, UserProfileData } from '@/services/userManagementService';
import { Skeleton } from '@/components/ui/skeleton';

const UserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const data = await fetchUserProfileWithActivity(user.id);
          setProfileData(data);
        } catch (error) {
          console.error('Error loading profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      loadProfile();
    }
  }, [user, authLoading]);

  const handleProfileUpdate = () => {
    if (user) {
      fetchUserProfileWithActivity(user.id).then(setProfileData);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-32 w-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-muted-foreground">Failed to load profile data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileHeader profileData={profileData} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column - Profile & Password */}
          <div className="lg:col-span-2 space-y-6">
            <ProfileEditForm 
              profileData={profileData} 
              onUpdate={handleProfileUpdate}
            />
            <PasswordChangeForm userId={user.id} />
          </div>

          {/* Right Column - Security & Activity */}
          <div className="space-y-6">
            <SecurityStatsCard profileData={profileData} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <LoginHistoryTable userId={user.id} />
          <ActivityHistoryCard userId={user.id} />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
