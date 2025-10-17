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
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) throw rolesError;

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

    // Update with admin roles
    userRoles?.forEach((role) => {
      const profile = profiles?.find(p => p.id === role.user_id);
      if (profile?.email && userMap.has(profile.email)) {
        const user = userMap.get(profile.email)!;
        if (role.role === 'admin') {
          user.is_admin = true;
          user.user_type = 'admin';
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
  const { error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: 'admin',
    });

  if (error) throw error;
};

/**
 * Revoke admin role from a user
 */
export const revokeAdminRole = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', 'admin');

  if (error) throw error;
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
