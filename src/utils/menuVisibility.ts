import { MenuVisibilityMode } from '@/types/menuSettings';

/**
 * Determines if a menu item should be visible based on its visibility mode
 * and the current user's authentication state and role.
 * 
 * @param visibilityMode - The visibility mode of the menu item
 * @param isAuthenticated - Whether the user is logged in
 * @param isAdmin - Whether the user has admin role
 * @returns true if the menu item should be visible, false otherwise
 * 
 * @example
 * ```tsx
 * const shouldShow = shouldShowMenuItem('authenticated', !!user, isAdmin);
 * if (shouldShow) {
 *   return <MenuItem ... />
 * }
 * ```
 */
export function shouldShowMenuItem(
  visibilityMode: MenuVisibilityMode,
  isAuthenticated: boolean,
  isAdmin: boolean
): boolean {
  switch (visibilityMode) {
    case 'public':
      // Visible to everyone
      return true;
      
    case 'anonymous_only':
      // Only visible to non-authenticated users
      return !isAuthenticated;
      
    case 'authenticated':
      // Visible to all authenticated users (including admins)
      return isAuthenticated;
      
    case 'admin_only':
      // Only visible to users with admin role
      return isAdmin;
      
    default:
      // Default to not showing if mode is unknown
      return false;
  }
}

/**
 * Filters a list of menu items based on visibility rules
 * 
 * @example
 * ```tsx
 * import { filterVisibleMenuItems } from '@/utils/menuVisibility';
 * 
 * const visibleItems = filterVisibleMenuItems(
 *   allMenuItems,
 *   visibilitySettings,
 *   !!user,
 *   isAdmin
 * );
 * ```
 */
export function filterVisibleMenuItems<T extends { settingKey: string }>(
  items: T[],
  visibilitySettings: Record<string, MenuVisibilityMode>,
  isAuthenticated: boolean,
  isAdmin: boolean
): T[] {
  return items.filter(item => {
    const mode = visibilitySettings[item.settingKey];
    if (!mode) return false;
    return shouldShowMenuItem(mode, isAuthenticated, isAdmin);
  });
}
