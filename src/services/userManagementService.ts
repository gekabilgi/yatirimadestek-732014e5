import { supabase } from '@/integrations/supabase/client';

export interface UnifiedUser {
  id: string;
  email: string;
  full_name: string;
  user_type: 'admin' | 'ydo' | 'qna' | 'regular';
  has_auth_account: boolean;
  auth_user_id: string | null;
  is_admin: boolean;
  is_active: boolean;
  province?: string;
  created_at: string;
  ydo_user_id?: string;
  qna_admin_id?: string;
}

/**
 * Fetch all users from different tables and unify them
 */
export const fetchAllUsersWithRoles = async (): Promise<UnifiedUser[]> => {
  try {
    // Fetch all profiles with roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, created_at');

    if (profilesError) throw profilesError;

    // Fetch user roles
    // Fetch admin ids via edge function (service role)
    const { data: adminRes, error: adminError } = await supabase.functions.invoke('manage-user-roles', {
      body: { action: 'list_admin_ids' },
    });

    if (adminError) throw adminError;
    const adminIdSet = new Set<string>((adminRes as any)?.adminIds ?? []);

    // Fetch YDO users
    const { data: ydoUsers, error: ydoError } = await supabase
      .from('ydo_users')
      .select('id, user_id, email, full_name, province, created_at');

    if (ydoError) throw ydoError;

    // Fetch QNA admin emails
    const { data: qnaAdmins, error: qnaError } = await supabase
      .from('qna_admin_emails')
      .select('id, email, full_name, is_active, created_at');

    if (qnaError) throw qnaError;

    // Create a map to store unified users
    const userMap = new Map<string, UnifiedUser>();

    // Add profiles to map
    profiles?.forEach((profile) => {
      if (profile.email) {
        userMap.set(profile.email, {
          id: profile.id,
          email: profile.email,
          full_name: profile.email.split('@')[0],
          user_type: 'regular',
          has_auth_account: true,
          auth_user_id: profile.id,
          is_admin: false,
          is_active: true,
          created_at: profile.created_at,
        });
      }
    });

    // Mark admins using the adminIdSet
    profiles?.forEach((p) => {
      if (p.email && userMap.has(p.email)) {
        const u = userMap.get(p.email)!;
        if (adminIdSet.has(p.id)) {
          u.is_admin = true;
          u.user_type = 'admin';
        }
      }
    });

    // Add YDO users
    ydoUsers?.forEach((ydoUser) => {
      const existingUser = userMap.get(ydoUser.email);
      
      if (existingUser) {
        // Update existing user with YDO info
        existingUser.user_type = existingUser.is_admin ? 'admin' : 'ydo';
        existingUser.full_name = ydoUser.full_name;
        existingUser.province = ydoUser.province;
        existingUser.ydo_user_id = ydoUser.id;
      } else {
        // Add new YDO user without auth account
        userMap.set(ydoUser.email, {
          id: ydoUser.id,
          email: ydoUser.email,
          full_name: ydoUser.full_name,
          user_type: 'ydo',
          has_auth_account: !!ydoUser.user_id,
          auth_user_id: ydoUser.user_id,
          is_admin: false,
          is_active: true,
          province: ydoUser.province,
          created_at: ydoUser.created_at,
          ydo_user_id: ydoUser.id,
        });
      }
    });

    // Add QNA admins
    qnaAdmins?.forEach((qnaAdmin) => {
      const existingUser = userMap.get(qnaAdmin.email);
      
      if (existingUser) {
        // Update existing user with QNA info
        if (existingUser.user_type === 'regular') {
          existingUser.user_type = 'qna';
        }
        existingUser.qna_admin_id = qnaAdmin.id;
      } else {
        // Add new QNA admin without auth account
        userMap.set(qnaAdmin.email, {
          id: qnaAdmin.id,
          email: qnaAdmin.email,
          full_name: qnaAdmin.full_name,
          user_type: 'qna',
          has_auth_account: false,
          auth_user_id: null,
          is_admin: false,
          is_active: qnaAdmin.is_active,
          created_at: qnaAdmin.created_at,
          qna_admin_id: qnaAdmin.id,
        });
      }
    });

    return Array.from(userMap.values());
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Grant admin role to a user
 */
export const grantAdminRole = async (userId: string): Promise<void> => {
  const { error } = await supabase.functions.invoke('manage-user-roles', {
    body: { action: 'grant_admin', userId },
  });

  if (error) throw error as any;
};

/**
 * Revoke admin role from a user
 */
export const revokeAdminRole = async (userId: string): Promise<void> => {
  const { error } = await supabase.functions.invoke('manage-user-roles', {
    body: { action: 'revoke_admin', userId },
  });

  if (error) throw error as any;
};

/**
 * Link YDO user to an existing auth account
 */
export const linkYdoUserToAuth = async (ydoUserId: string, authUserId: string): Promise<void> => {
  const { error } = await supabase
    .from('ydo_users')
    .update({ user_id: authUserId })
    .eq('id', ydoUserId);

  if (error) throw error;
};

/**
 * Check if user exists by email
 */
export const checkIfUserExists = async (email: string): Promise<{ exists: boolean; userId?: string }> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;

  return {
    exists: !!data,
    userId: data?.id,
  };
};

/**
 * Create auth account for a user via edge function
 */
export const createAuthAccountForUser = async (
  email: string,
  password: string,
  fullName: string
): Promise<{ userId: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-user-account', {
      body: {
        email,
        password,
        fullName,
      },
    });

    if (error) throw error;

    return { userId: data.userId };
  } catch (error: any) {
    console.error('Error creating auth account:', error);
    return { userId: '', error: error.message };
  }
};

/**
 * Toggle QNA admin active status
 */
export const toggleQnaAdminStatus = async (qnaAdminId: string, isActive: boolean): Promise<void> => {
  const { error } = await supabase
    .from('qna_admin_emails')
    .update({ is_active: isActive })
    .eq('id', qnaAdminId);

  if (error) throw error;
};

/**
 * Add user to YDO users
 */
export const addUserToYdo = async (
  email: string,
  fullName: string,
  province: string,
  userId?: string
): Promise<void> => {
  const { error } = await supabase
    .from('ydo_users')
    .insert({
      email,
      full_name: fullName,
      province,
      user_id: userId,
    });

  if (error) throw error;
};

/**
 * Remove user from YDO users
 */
export const removeUserFromYdo = async (ydoUserId: string): Promise<void> => {
  const { error } = await supabase
    .from('ydo_users')
    .delete()
    .eq('id', ydoUserId);

  if (error) throw error;
};

/**
 * Add user to QNA admins
 */
export const addUserToQna = async (
  email: string,
  fullName: string
): Promise<void> => {
  const { error } = await supabase
    .from('qna_admin_emails')
    .insert({
      email,
      full_name: fullName,
      is_active: true,
    });

  if (error) throw error;
};

/**
 * Remove user from QNA admins
 */
export const removeUserFromQna = async (qnaAdminId: string): Promise<void> => {
  const { error } = await supabase
    .from('qna_admin_emails')
    .delete()
    .eq('id', qnaAdminId);

  if (error) throw error;
};

/**
 * Update YDO user province
 */
export const updateYdoUserProvince = async (ydoUserId: string, province: string): Promise<void> => {
  const { error } = await supabase
    .from('ydo_users')
    .update({ province })
    .eq('id', ydoUserId);

  if (error) throw error;
};

// ============= USER PROFILE FUNCTIONS =============

export interface UserProfileData {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  province?: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  last_password_change?: string;
  two_factor_enabled: boolean;
}

export interface ProfileUpdates {
  full_name?: string;
  province?: string;
  department?: string;
}

export interface LoginHistory {
  timestamp: string;
  ip_address: string;
  user_agent: string;
  status: string;
}

export interface ActivityHistory {
  id: string;
  activity_type: string;
  page_path: string;
  created_at: string;
  metadata?: any;
}

/**
 * Fetch complete user profile with all related data
 */
export const fetchUserProfileWithActivity = async (userId: string): Promise<UserProfileData> => {
  try {
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Fetch roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) throw rolesError;

    // Fetch metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('user_metadata')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (metadataError) throw metadataError;

    // Fetch auth user data for last sign in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    return {
      id: profile.id,
      email: profile.email || '',
      full_name: (profile as any).full_name || profile.email?.split('@')[0] || 'User',
      roles: roles?.map(r => r.role) || [],
      province: metadata?.province,
      department: metadata?.department,
      is_active: metadata?.is_active ?? true,
      created_at: profile.created_at,
      last_sign_in_at: user?.last_sign_in_at,
      email_confirmed_at: user?.email_confirmed_at,
      last_password_change: metadata?.last_password_change,
      two_factor_enabled: metadata?.two_factor_enabled ?? false,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update user profile information
 */
export const updateUserProfile = async (userId: string, updates: ProfileUpdates): Promise<void> => {
  try {
    // Update profile table
    if (updates.full_name) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: updates.full_name } as any)
        .eq('id', userId);

      if (profileError) throw profileError;
    }

    // Update metadata table
    if (updates.province || updates.department) {
      const { error: metadataError } = await supabase
        .from('user_metadata')
        .upsert({
          user_id: userId,
          province: updates.province,
          department: updates.department,
        }, {
          onConflict: 'user_id'
        });

      if (metadataError) throw metadataError;
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Fetch user login history
 */
export const fetchUserLoginHistory = async (userId: string, limit: number = 10): Promise<LoginHistory[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-auth-logs', {
      body: { limit },
    });

    if (error) throw error;

    return data?.data || [];
  } catch (error) {
    console.error('Error fetching login history:', error);
    return [];
  }
};

/**
 * Fetch user activity history from user_sessions  
 */
export const fetchUserActivityHistory = async (userId: string, limit: number = 20): Promise<ActivityHistory[]> => {
  try {
    // Explicitly type to avoid deep instantiation
    const result = await (supabase as any)
      .from('user_sessions')
      .select('id, activity_type, page_path, created_at, activity_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (result.error) throw result.error;

    return (result.data || []).map((item: any) => ({
      id: item.id,
      activity_type: item.activity_type,
      page_path: item.page_path || 'Unknown',
      created_at: item.created_at,
      metadata: item.activity_data,
    }));
  } catch (error) {
    console.error('Error fetching activity history:', error);
    return [];
  }
};

/**
 * Change user password
 */
export const changeUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> => {
  try {
    // First, verify current password by attempting sign in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return { error: 'User not found' };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return { error: 'Current password is incorrect' };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { error: updateError.message };
    }

    // Update last_password_change in metadata
    await supabase
      .from('user_metadata')
      .upsert({
        user_id: user.id,
        last_password_change: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    return {};
  } catch (error: any) {
    console.error('Error changing password:', error);
    return { error: error.message };
  }
};
