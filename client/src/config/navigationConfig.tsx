import React from 'react';
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

export interface NavItem {
  text: string;
  path: string;
  icon: React.ReactElement;
  tooltip: string;
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
    title: 'Операции и Мастеры',
    icon: <AutoAwesomeMotionIcon sx={{ fontSize: 20 }} />,
    defaultOpen: true,
    items: [
      {
        text: 'BI Дашборд',
        path: '/',
        icon: <DashboardIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Главный экран аналитики и KPI'
      },
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
        text: 'Отчетность и документы',
        path: '/reports',
        icon: <AssessmentIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Печать протоколов и аналитических отчетов'
      }
    ]
  },
  {
    id: 'base_entities',
    title: 'Базовые сущности (НСИ)',
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
        text: 'Персонал и врачи',
        path: '/staff',
        icon: <BadgeIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Реестр медицинского персонала, врачей и ассистентов'
      },
      {
        text: 'Каталог операций и услуг',
        path: '/operations',
        icon: <LocalHospitalIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Справочник процедур и технологических карт BOM'
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
    groupTitle: 'Операции и Мастеры',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/checkout': {
    title: 'Оформление визита (Wizard)',
    groupTitle: 'Операции и Мастеры',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/scheduling': {
    title: 'Расписание и прием',
    groupTitle: 'Операции и Мастеры',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/reports': {
    title: 'Отчетность и документы',
    groupTitle: 'Операции и Мастеры',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/patients': {
    title: 'Пациенты (ЭМК картотека)',
    groupTitle: 'Базовые сущности (НСИ)',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/staff': {
    title: 'Персонал и врачи',
    groupTitle: 'Базовые сущности (НСИ)',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/operations': {
    title: 'Каталог операций и услуг',
    groupTitle: 'Базовые сущности (НСИ)',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/inventory': {
    title: 'Склад материалов и медикаментов',
    groupTitle: 'Базовые сущности (НСИ)',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/parameters': {
    title: 'Параметры клиники',
    groupTitle: 'Базовые сущности (НСИ)',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/sqlite-studio': {
    title: 'SQLite Studio (БД)',
    groupTitle: 'Системные Инструменты',
    groupId: 'system_tools',
    parentPath: '/'
  },
  '/db-studio': {
    title: 'SQLite Studio (БД)',
    groupTitle: 'Системные Инструменты',
    groupId: 'system_tools',
    parentPath: '/'
  }
};
