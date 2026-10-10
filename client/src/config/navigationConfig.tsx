import React from 'react';
import { API_BASE_URL } from './apiConfig';
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

export interface NavItem {
  text: string;
  path: string;
  icon: React.ReactElement;
  tooltip: string;
  isExternal?: boolean;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: React.ReactElement;
  defaultOpen: boolean;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    id: 'operations_and_wizards',
    title: 'Сервисы',
    icon: <AutoAwesomeMotionIcon sx={{ fontSize: 20 }} />,
    defaultOpen: true,
    items: [
      {
        text: 'Оформление визита (Wizard)',
        path: '/checkout',
        icon: <LocalHospitalIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Пошаговый мастер регистрации визита и калькуляции'
      },
      {
        text: 'Расписание и прием',
        path: '/scheduling',
        icon: <EventIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Календарь записей и расписание врачей'
      },
      {
        text: 'Выплаты сотрудникам',
        path: '/staff-payouts',
        icon: <AccountBalanceWalletIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Расчет и ведомости выплат врачам и медсестрам на основе визитов и сервисов'
      },
      {
        text: 'Отчетность и документы',
        path: '/reports',
        icon: <AssessmentIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Печать протоколов и аналитических отчетов'
      },
      {
        text: 'Инструкция пользователя',
        path: '/user-guide',
        icon: <MenuBookIcon sx={{ fontSize: 20, color: '#0F3C64' }} />,
        tooltip: 'Интерактивное руководство пользователя, архитектура сущностей, параметры и регламент расчетов'
      }
    ]
  },
  {
    id: 'base_entities',
    title: 'Базовые данные',
    icon: <FolderSpecialIcon sx={{ fontSize: 20 }} />,
    defaultOpen: true,
    items: [
      {
        text: 'Пациенты (ЭМК картотека)',
        path: '/patients',
        icon: <PeopleIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Реестр пациентов и электронные медицинские карты'
      },
      {
        text: 'Сотрудники и врачи',
        path: '/staff',
        icon: <BadgeIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Реестр сотрудников, врачей и ассистентов'
      },
      {
        text: 'Каталог сервисов',
        path: '/operations',
        icon: <LocalHospitalIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Справочник сервисов и технологических карт BOM'
      },
      {
        text: 'Склад материалов и медикаментов',
        path: '/inventory',
        icon: <InventoryIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Учет складских остатков и медикаментов'
      },
      {
        text: 'Параметры клиники',
        path: '/parameters',
        icon: <SettingsIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Системные настройки и коэффициенты'
      }
    ]
  },
  {
    id: 'bi',
    title: 'Аналитика',
    icon: <BarChartIcon sx={{ fontSize: 20 }} />,
    defaultOpen: true,
    items: [
      {
        text: 'BI Дашборд',
        path: '/',
        icon: <DashboardIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Главный экран аналитики и KPI'
      },
      {
        text: 'Анализ сервисов',
        path: '/analytics/operations',
        icon: <AssessmentIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Глубокий финансовый и маржинальный анализ сервисов'
      },
      {
        text: 'BI Сервисы и Выплаты',
        path: '/analytics/services-bi',
        icon: <QueryStatsIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Глубокая аналитика сервисов, выплат и доходности'
      }
    ]
  },
  {
    id: 'administrator',
    title: 'Администратор',
    icon: <AdminPanelSettingsIcon sx={{ fontSize: 20 }} />,
    defaultOpen: true,
    items: [
      {
        text: 'FireBird Sync',
        path: '/admin/firebird-sync',
        icon: <SyncAltIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Мастер синхронизации медицинской БД Firebird (MEDICAL.FDB)'
      },
      {
        text: 'SQLite Studio (БД)',
        path: '/sqlite-studio',
        icon: <StorageIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Менеджер базы данных SQLite: таблицы, структура, SQL-консоль'
      },
      {
        text: 'OpenAPI (Swagger)',
        path: `${API_BASE_URL}/api-docs`,
        icon: <CodeIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Интерактивная REST API документация Swagger UI (в новой вкладке)',
        isExternal: true
      },
      {
        text: 'Демо-данные [TEST_DAEMON]',
        path: '/admin/daemon-data',
        icon: <SmartToyIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Панель управления демо-данными: создание, очистка и запуск тестов'
      },
      {
        text: 'Заполнить демо-данные',
        path: '/admin/daemon-data?action=seed',
        icon: <AddCircleIcon sx={{ fontSize: 20, color: '#16A34A' }} />,
        tooltip: 'Заполнить БД тестовыми демо-данными (3 периода, PRP, сторно)'
      },
      {
        text: 'Удалить демо-данные',
        path: '/admin/daemon-data?action=purge',
        icon: <DeleteForeverIcon sx={{ fontSize: 20, color: '#DC2626' }} />,
        tooltip: 'Удалить все тестовые данные с маркером [TEST_DAEMON]'
      },
      {
        text: 'Запуск тестов потока',
        path: '/admin/daemon-data?action=run-tests',
        icon: <PlayCircleFilledWhiteIcon sx={{ fontSize: 20, color: '#2563EB' }} />,
        tooltip: 'Запустить автоматическое тестирование потока FL-01 — FL-14 (27 проверок)'
      }
    ]
  }
];

export interface RouteMeta {
  title: string;
  groupTitle: string;
  groupId: string;
  parentPath: string;
}

export const routeMetaMap: Record<string, RouteMeta> = {
  '/': {
    title: 'BI Дашборд',
    groupTitle: 'Аналитика',
    groupId: 'bi',
    parentPath: '/'
  },
  '/analytics/operations': {
    title: 'Анализ сервисов',
    groupTitle: 'Аналитика',
    groupId: 'bi',
    parentPath: '/'
  },
  '/analytics/services-bi': {
    title: 'BI Сервисы и Выплаты',
    groupTitle: 'Аналитика',
    groupId: 'bi',
    parentPath: '/'
  },
  '/checkout': {
    title: 'Оформление визита (Wizard)',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/scheduling': {
    title: 'Расписание и прием',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/reports': {
    title: 'Отчетность и документы',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/staff-payouts': {
    title: 'Выплаты сотрудникам',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/user-guide': {
    title: 'Инструкция пользователя МИС',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/patients': {
    title: 'Пациенты (ЭМК картотека)',
    groupTitle: 'Базовые данные',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/staff': {
    title: 'Сотрудники и врачи',
    groupTitle: 'Базовые данные',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/operations': {
    title: 'Каталог сервисов',
    groupTitle: 'Базовые данные',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/inventory': {
    title: 'Склад материалов и медикаментов',
    groupTitle: 'Базовые данные',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/parameters': {
    title: 'Параметры клиники',
    groupTitle: 'Базовые данные',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/admin/firebird-sync': {
    title: 'FireBird Sync (Мастер синхронизации)',
    groupTitle: 'Администратор',
    groupId: 'administrator',
    parentPath: '/'
  },
  '/sqlite-studio': {
    title: 'SQLite Studio (БД)',
    groupTitle: 'Администратор',
    groupId: 'administrator',
    parentPath: '/'
  },
  '/db-studio': {
    title: 'SQLite Studio (БД)',
    groupTitle: 'Администратор',
    groupId: 'administrator',
    parentPath: '/'
  },
  '/admin/daemon-data': {
    title: 'Управление демо-данными [TEST_DAEMON]',
    groupTitle: 'Администратор',
    groupId: 'administrator',
    parentPath: '/'
  }
};
