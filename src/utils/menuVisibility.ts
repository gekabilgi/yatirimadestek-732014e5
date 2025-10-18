import { MenuItemVisibility } from '@/types/menuSettings';

/**
 * Determines if a menu item should be visible based on its visibility settings
 * and the current user's authentication state and role.
 * 
 * @param visibility - The visibility settings for the menu item
 * @param isAuthenticated - Whether the user is logged in
 * @param isAdmin - Whether the user has admin role
 * @returns true if the menu item should be visible, false otherwise
 * 
 * @example
 * ```tsx
 * const shouldShow = shouldShowMenuItem(
 *   { admin: true, registered: false, anonymous: false },
 *   !!user,
 *   isAdmin
 * );
 * if (shouldShow) {
 *   return <MenuItem ... />
 * }
 * ```
 */
export function shouldShowMenuItem(
  visibility: MenuItemVisibility,
  isAuthenticated: boolean,
  isAdmin: boolean
): boolean {
  if (isAdmin && visibility.admin) {
    return true;
  }
  
  if (isAuthenticated && !isAdmin && visibility.registered) {
    return true;
  }
  
  if (!isAuthenticated && visibility.anonymous) {
    return true;
  }
  
  return false;
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
  visibilitySettings: Record<string, MenuItemVisibility>,
  isAuthenticated: boolean,
  isAdmin: boolean
): T[] {
  return items.filter(item => {
    const visibility = visibilitySettings[item.settingKey];
    if (!visibility) return false;
    return shouldShowMenuItem(visibility, isAuthenticated, isAdmin);
  });
}
