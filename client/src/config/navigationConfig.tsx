import React from 'react';
import { API_BASE_URL } from './apiConfig';
import menuConfig from './menuPermissionsConfig.json';

import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventIcon from '@mui/icons-material/Event';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import InventoryIcon from '@mui/icons-material/Inventory';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import StorageIcon from '@mui/icons-material/Storage';
import CodeIcon from '@mui/icons-material/Code';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TuneIcon from '@mui/icons-material/Tune';
import DnsIcon from '@mui/icons-material/Dns';
import ScienceIcon from '@mui/icons-material/Science';
import UsbIcon from '@mui/icons-material/Usb';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';

export interface NavItem {
  id?: string;
  text: string;
  path: string;
  icon: React.ReactElement;
  tooltip: string;
  isExternal?: boolean;
  defaultOpen?: boolean;
  permissions?: string[];
  children?: NavItem[];
}

export interface NavGroup {
  id: string;
  title: string;
  icon: React.ReactElement;
  defaultOpen: boolean;
  tooltip?: string;
  permissions?: string[];
  items: NavItem[];
}

export interface RouteMeta {
  title: string;
  groupTitle: string;
  groupId: string;
  parentPath: string;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Dashboard: DashboardIcon,
  LocalHospital: LocalHospitalIcon,
  Event: EventIcon,
  Assessment: AssessmentIcon,
  People: PeopleIcon,
  Badge: BadgeIcon,
  Inventory: InventoryIcon,
  Settings: SettingsIcon,
  AutoAwesomeMotion: AutoAwesomeMotionIcon,
  FolderSpecial: FolderSpecialIcon,
  AdminPanelSettings: AdminPanelSettingsIcon,
  SyncAlt: SyncAltIcon,
  Storage: StorageIcon,
  Code: CodeIcon,
  BarChart: BarChartIcon,
  AccountBalanceWallet: AccountBalanceWalletIcon,
  SmartToy: SmartToyIcon,
  AddCircle: AddCircleIcon,
  DeleteForever: DeleteForeverIcon,
  PlayCircleFilledWhite: PlayCircleFilledWhiteIcon,
  MenuBook: MenuBookIcon,
  QueryStats: QueryStatsIcon,
  PointOfSale: PointOfSaleIcon,
  ReceiptLong: ReceiptLongIcon,
  Tune: TuneIcon,
  Dns: DnsIcon,
  Science: ScienceIcon,
  Usb: UsbIcon,
  CreditCard: CreditCardIcon,
  MedicalServices: MedicalServicesIcon,
  Description: DescriptionIcon,
  Assignment: AssignmentIcon,
  CalendarMonth: CalendarMonthIcon,
  ManageSearch: ManageSearchIcon
};

function getIconElement(iconName?: string, iconColor?: string, defaultFontSize = 20): React.ReactElement {
  const IconComponent = (iconName && iconMap[iconName]) || AutoAwesomeMotionIcon;
  const sx: Record<string, any> = { fontSize: defaultFontSize };
  if (iconColor) {
    sx.color = iconColor;
  }
  return <IconComponent sx={sx} />;
}

export function buildNavigationGroups(): NavGroup[] {
  return (menuConfig.menuGroups || []).map((group: any) => ({
    id: group.id,
    title: group.title,
    icon: getIconElement(group.icon, group.iconColor, 20),
    defaultOpen: Boolean(group.defaultOpen),
    tooltip: group.tooltip,
    permissions: group.permissions,
    items: (group.items || []).map((item: any) => {
      let resolvedPath = item.path;
      if (item.isExternal && resolvedPath === '/api-docs') {
        resolvedPath = `${API_BASE_URL}/api-docs`;
      }
      return {
        id: item.id,
        text: item.text,
        path: resolvedPath,
        icon: getIconElement(item.icon, item.iconColor, 20),
        tooltip: item.tooltip,
        isExternal: item.isExternal,
        defaultOpen: item.defaultOpen,
        permissions: item.permissions,
        children: item.children
          ? item.children.map((child: any) => ({
              id: child.id,
              text: child.text,
              path: child.path,
              icon: getIconElement(child.icon, child.iconColor, 20),
              tooltip: child.tooltip,
              isExternal: child.isExternal,
              permissions: child.permissions
            }))
          : undefined
      };
    })
  }));
}

export const navigationGroups: NavGroup[] = buildNavigationGroups();

function buildRouteMetaMap(groups: NavGroup[]): Record<string, RouteMeta> {
  const map: Record<string, RouteMeta> = {};

  groups.forEach((group) => {
    group.items.forEach((item) => {
      const cleanPath = item.path.split('?')[0];
      if (!item.isExternal && cleanPath) {
        map[cleanPath] = {
          title: item.text,
          groupTitle: group.title,
          groupId: group.id,
          parentPath: '/'
        };
      }
      if (item.children) {
        item.children.forEach((child) => {
          const childClean = child.path.split('?')[0];
          if (!child.isExternal && childClean) {
            map[childClean] = {
              title: child.text,
              groupTitle: group.title,
              groupId: group.id,
              parentPath: '/'
            };
          }
        });
      }
    });
  });

  const aliases: Record<string, RouteMeta> = {
    '/fiscal-settings': {
      title: 'Параметры фискального регистратора «АТОЛ 91Ф»',
      groupTitle: 'Бухгалтерия',
      groupId: 'accounting',
      parentPath: '/'
    },
    '/db-studio': {
      title: 'SQLite Studio (БД)',
      groupTitle: 'Администратор',
      groupId: 'administrator',
      parentPath: '/'
    },
    '/admin/tests': {
      title: 'Тесты и демо-данные [TEST_DAEMON]',
      groupTitle: 'ТЕСТЫ',
      groupId: 'tests',
      parentPath: '/'
    },
    '/fiscal-shifts': {
      title: 'Журнал и Аналитика смен',
      groupTitle: 'Бухгалтерия',
      groupId: 'accounting',
      parentPath: '/'
    },
    '/pos-settings': {
      title: 'Параметры POS Альфа-Банка',
      groupTitle: 'Бухгалтерия',
      groupId: 'accounting',
      parentPath: '/'
    },
    '/pos-test-wizard': {
      title: 'Мастер тестов эквайринга',
      groupTitle: 'ТЕСТЫ',
      groupId: 'tests',
      parentPath: '/'
    }
  };

  return { ...map, ...aliases };
}

export const routeMetaMap: Record<string, RouteMeta> = buildRouteMetaMap(navigationGroups);
