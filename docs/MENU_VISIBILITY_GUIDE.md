# Menu Visibility System - Developer Guide

## Overview
The menu visibility system allows granular control over which menu items are shown to users based on their authentication state and role.

## Visibility Modes

| Mode | Description | Who Can See |
|------|-------------|-------------|
| `public` | Visible to everyone | All users (anonymous + authenticated) |
| `anonymous_only` | Only visible to non-logged-in users | Only anonymous users |
| `authenticated` | Visible to all logged-in users | All authenticated users (including admins) |
| `admin_only` | Only visible to administrators | Only users with admin role |

## Database Schema

### admin_settings Table
Menu visibility settings are stored in the `admin_settings` table:

```sql
category: 'menu_visibility'
setting_key: 'menu_item_<name>'
setting_value_text: 'public' | 'anonymous_only' | 'authenticated' | 'admin_only'
```

## Usage Examples

### 1. Check if a Single Menu Item Should Be Visible

```tsx
import { shouldShowMenuItem } from '@/utils/menuVisibility';
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAdmin } = useAuth();
  const visibilityMode = 'authenticated'; // From settings
  
  const shouldShow = shouldShowMenuItem(
    visibilityMode,
    !!user,
    isAdmin
  );
  
  if (!shouldShow) return null;
  
  return <MenuItem>...</MenuItem>;
}
```

### 2. Filter Multiple Menu Items

```tsx
import { filterVisibleMenuItems } from '@/utils/menuVisibility';
import { useAuth } from '@/contexts/AuthContext';

function Navigation() {
  const { user, isAdmin } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  
  useEffect(() => {
    async function loadMenu() {
      const settings = await menuVisibilityService.getMenuVisibilitySettings();
      const visible = filterVisibleMenuItems(
        ALL_MENU_ITEMS,
        settings,
        !!user,
        isAdmin
      );
      setMenuItems(visible);
    }
    loadMenu();
  }, [user, isAdmin]);
  
  return (
    <nav>
      {menuItems.map(item => (
        <Link key={item.id} to={item.href}>{item.name}</Link>
      ))}
    </nav>
  );
}
```

### 3. Dynamic Visibility Check

```tsx
import { shouldShowMenuItem } from '@/utils/menuVisibility';
import { MenuVisibilityMode } from '@/types/menuSettings';

// In any component
const checkAccess = (mode: MenuVisibilityMode) => {
  return shouldShowMenuItem(mode, !!user, isAdmin);
};

// Example usage
const canAccessAdmin = checkAccess('admin_only');
const canAccessPublic = checkAccess('public');
```

## Admin Dashboard

Admins can manage menu visibility from the Admin Settings page:

1. Navigate to `/admin/settings/menu-visibility`
2. Each menu item has a dropdown with 4 visibility options
3. Changes take effect immediately
4. Settings are persisted in the database

## Adding New Menu Items

To add a new menu item with visibility control:

1. **Update types** (`src/types/menuSettings.ts`):
```typescript
export interface MenuVisibilitySettings {
  // ... existing items
  menu_item_new_feature: MenuVisibilityMode;
}

export const MENU_ITEMS: MenuItem[] = [
  // ... existing items
  {
    title: 'New Feature',
    url: '/new-feature',
    settingKey: 'menu_item_new_feature',
    description: 'Description of the new feature',
  },
];
```

2. **Update service defaults** (`src/services/menuVisibilityService.ts`):
```typescript
const settings: MenuVisibilitySettings = {
  // ... existing defaults
  menu_item_new_feature: 'public', // Set default visibility
};
```

3. **Add database record** (optional - will be created on first save):
```sql
INSERT INTO admin_settings (category, setting_key, setting_value_text)
VALUES ('menu_visibility', 'menu_item_new_feature', 'public');
```

## Security Considerations

- **Client-side filtering only**: This system filters what's displayed in the UI
- **Backend protection required**: Always validate access on the backend
- **RLS policies**: Use Supabase Row-Level Security for data protection
- **Route guards**: Implement route-level authentication checks

### Example Route Guard

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin } = useAuth();
  
  if (!user) {
    return <Navigate to="/admin/login" />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }
  
  return children;
}
```

## Extensibility

The system is designed to be easily extended:

### Adding New Roles

1. Update the `MenuVisibilityMode` type:
```typescript
export type MenuVisibilityMode = 
  | 'anonymous_only' 
  | 'admin_only' 
  | 'authenticated' 
  | 'public'
  | 'moderator_only'  // New role
  | 'premium_only';   // New role
```

2. Update labels:
```typescript
export const VISIBILITY_MODE_LABELS: Record<MenuVisibilityMode, string> = {
  // ... existing
  moderator_only: 'Sadece Moderatörler',
  premium_only: 'Sadece Premium Üyeler',
};
```

3. Update the visibility check function:
```typescript
export function shouldShowMenuItem(
  visibilityMode: MenuVisibilityMode,
  isAuthenticated: boolean,
  isAdmin: boolean,
  isModerator?: boolean,  // New parameter
  isPremium?: boolean     // New parameter
): boolean {
  switch (visibilityMode) {
    // ... existing cases
    case 'moderator_only':
      return isModerator ?? false;
    case 'premium_only':
      return isPremium ?? false;
    default:
      return false;
  }
}
```

### Adding Conditional Visibility

For more complex scenarios (e.g., show only during business hours, based on user location):

```typescript
export function shouldShowMenuItemAdvanced(
  visibilityMode: MenuVisibilityMode,
  userContext: {
    isAuthenticated: boolean;
    isAdmin: boolean;
    location?: string;
    timestamp?: Date;
  }
): boolean {
  // Base visibility check
  const baseCheck = shouldShowMenuItem(
    visibilityMode,
    userContext.isAuthenticated,
    userContext.isAdmin
  );
  
  if (!baseCheck) return false;
  
  // Additional conditional logic
  if (visibilityMode === 'admin_only' && userContext.timestamp) {
    const hour = userContext.timestamp.getHours();
    // Only show admin items during business hours (9-17)
    return hour >= 9 && hour < 17;
  }
  
  return true;
}
```

## Testing

### Unit Tests Example

```typescript
import { shouldShowMenuItem } from '@/utils/menuVisibility';

describe('Menu Visibility', () => {
  test('public items visible to everyone', () => {
    expect(shouldShowMenuItem('public', false, false)).toBe(true);
    expect(shouldShowMenuItem('public', true, false)).toBe(true);
    expect(shouldShowMenuItem('public', true, true)).toBe(true);
  });
  
  test('anonymous_only items only for non-authenticated', () => {
    expect(shouldShowMenuItem('anonymous_only', false, false)).toBe(true);
    expect(shouldShowMenuItem('anonymous_only', true, false)).toBe(false);
  });
  
  test('admin_only items only for admins', () => {
    expect(shouldShowMenuItem('admin_only', true, false)).toBe(false);
    expect(shouldShowMenuItem('admin_only', true, true)).toBe(true);
  });
  
  test('authenticated items for all logged-in users', () => {
    expect(shouldShowMenuItem('authenticated', false, false)).toBe(false);
    expect(shouldShowMenuItem('authenticated', true, false)).toBe(true);
    expect(shouldShowMenuItem('authenticated', true, true)).toBe(true);
  });
});
```

## Migration from Boolean System

If migrating from the old boolean visibility system:

```sql
-- Old system: setting_value (0 or 1)
-- New system: setting_value_text ('anonymous_only', 'public', etc.)

-- Migration query (already applied)
UPDATE admin_settings
SET setting_value_text = CASE 
  WHEN setting_value = 0 THEN 'anonymous_only'
  WHEN setting_value = 1 THEN 'public'
  ELSE 'public'
END
WHERE category = 'menu_visibility' AND setting_value_text IS NULL;
```

## Troubleshooting

### Menu items not appearing
1. Check visibility mode in admin settings
2. Verify user authentication state
3. Check user role/permissions
4. Review browser console for errors
5. Verify database settings are correct

### Changes not taking effect
1. Refresh the page (settings are loaded on mount)
2. Clear browser cache
3. Check for JavaScript errors
4. Verify database connection

### Performance considerations
- Settings are fetched once per page load
- Consider caching for high-traffic applications
- Use `React.memo` for menu components if needed
