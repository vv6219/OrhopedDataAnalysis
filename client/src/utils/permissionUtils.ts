import menuConfig from '../config/menuPermissionsConfig.json';
import type { NavGroup, NavItem } from '../config/navigationConfig';

export interface PermittedScreenOption {
  path: string;
  text: string;
  groupTitle: string;
  groupId: string;
}

/**
 * Checks if the user has access to a specific permission rule
 * - If requiredPerms is '*' or contains '*', access is granted to all users
 * - If user has 'sysadmin', access is unconditionally granted
 * - If user has ANY of the permissions in requiredPerms, access is granted
 */
export function isPermissionAllowed(
  requiredPerms: string[] | string | undefined | null,
  userPermCodes: string[] = []
): boolean {
  if (!requiredPerms) return true;

  // Wildcard check
  if (requiredPerms === '*' || (Array.isArray(requiredPerms) && requiredPerms.includes('*'))) {
    return true;
  }

  // Sysadmin has unrestricted access
  if (userPermCodes.includes('sysadmin')) {
    return true;
  }

  // Multi-permission check
  if (Array.isArray(requiredPerms)) {
    return requiredPerms.some((req) => userPermCodes.includes(req));
  }

  return userPermCodes.includes(requiredPerms);
}

/**
 * Creates a fast lookup map from path to required permissions based on menuPermissionsConfig.json
 */
export function getMenuPermissionsMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  if (menuConfig && Array.isArray(menuConfig.menuGroups)) {
    menuConfig.menuGroups.forEach((group: any) => {
      if (Array.isArray(group.items)) {
        group.items.forEach((item: any) => {
          if (item.path) {
            map[item.path] = Array.isArray(item.permissions) ? item.permissions : ['*'];
          }
        });
      }
    });
  }
  return map;
}

/**
 * Filters the sidebar navigation groups and items based on the user's active permissions.
 * If a group has no permitted items, the entire group is hidden.
 */
export function getPermittedNavigation(
  rawGroups: NavGroup[],
  userPermCodes: string[] = []
): NavGroup[] {
  const permMap = getMenuPermissionsMap();
  const permittedGroups: NavGroup[] = [];

  for (const group of rawGroups) {
    // Find group config in JSON if present
    const groupConfig = (menuConfig.menuGroups as any[]).find((g) => g.id === group.id);
    if (groupConfig && groupConfig.permissions) {
      if (!isPermissionAllowed(groupConfig.permissions, userPermCodes)) {
        continue;
      }
    }

    const permittedItems: NavItem[] = [];
    for (const item of group.items) {
      const itemPerms = permMap[item.path] || (item as any).permissions || ['*'];
      if (!isPermissionAllowed(itemPerms, userPermCodes)) {
        continue;
      }

      let filteredChildren: NavItem[] | undefined = undefined;
      if (item.children && item.children.length > 0) {
        filteredChildren = item.children.filter((child) => {
          const childPerms = permMap[child.path] || (child as any).permissions || ['*'];
          return isPermissionAllowed(childPerms, userPermCodes);
        });
        if (filteredChildren.length === 0 && !item.path) {
          continue;
        }
      }

      permittedItems.push({
        ...item,
        ...(filteredChildren !== undefined ? { children: filteredChildren } : {})
      });
    }

    if (permittedItems.length > 0) {
      permittedGroups.push({
        ...group,
        items: permittedItems
      });
    }
  }

  return permittedGroups;
}

/**
 * Returns a flat list of all distinct screens that this user is permitted to access.
 * Used to populate the "Главный (входной) экран" select in user management.
 */
export function getPermittedScreens(userPermCodes: string[] = []): PermittedScreenOption[] {
  const screens: PermittedScreenOption[] = [];
  const seenPaths = new Set<string>();

  if (menuConfig && Array.isArray(menuConfig.menuGroups)) {
    menuConfig.menuGroups.forEach((group: any) => {
      if (group.permissions && !isPermissionAllowed(group.permissions, userPermCodes)) {
        return;
      }

      if (Array.isArray(group.items)) {
        group.items.forEach((item: any) => {
          if (!item.path || item.path.startsWith('http')) return; // Exclude external links
          if (seenPaths.has(item.path)) return;

          if (isPermissionAllowed(item.permissions, userPermCodes)) {
            seenPaths.add(item.path);
            screens.push({
              path: item.path,
              text: item.text,
              groupTitle: group.title,
              groupId: group.id
            });
          }
        });
      }
    });
  }

  return screens;
}

/**
 * Determines the best entry screen for a user:
 * 1. Checks if preferredScreen is provided and permitted.
 * 2. If not, picks the first permitted screen from the list.
 * 3. Falls back to '/' if nothing else is available.
 */
export function getDefaultEnterScreen(
  userPermCodes: string[] = [],
  preferredScreen?: string | null
): string {
  const permitted = getPermittedScreens(userPermCodes);
  if (permitted.length === 0) return '/';

  if (preferredScreen && permitted.some((s) => s.path === preferredScreen)) {
    return preferredScreen;
  }

  // If '/' is permitted, return '/'
  const homeScreen = permitted.find((s) => s.path === '/');
  if (homeScreen && (!preferredScreen || preferredScreen === '/')) {
    return '/';
  }

  // Return the first permitted screen (e.g., /ortho-workstation for doctors)
  return permitted[0].path;
}

/**
 * Checks if a specific screen UI element (button, tab, action) is permitted for the user.
 */
export function isElementPermitted(
  screenKey: keyof typeof menuConfig.screenElements | string,
  elementKey: string,
  userPermCodes: string[] = []
): boolean {
  const screen = (menuConfig.screenElements as any)[screenKey];
  if (!screen) return true; // Default allow if not restricted

  const requiredPerms = screen[elementKey];
  if (!requiredPerms) return true;

  return isPermissionAllowed(requiredPerms, userPermCodes);
}

/**
 * Returns the human-readable title of a route path
 */
export function getScreenTitleByPath(path?: string | null): string {
  if (!path || path === '/') return 'BI Дашборд';
  const allScreens = getPermittedScreens(['sysadmin']);
  const found = allScreens.find((s) => s.path === path);
  return found ? found.text : path;
}

