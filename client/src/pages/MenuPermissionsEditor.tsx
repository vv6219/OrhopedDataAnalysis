import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Snackbar,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Backdrop
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SecurityIcon from '@mui/icons-material/Security';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/apiConfig';
import initialMenuConfig from '../config/menuPermissionsConfig.json';

// Все поддерживаемые иконки Material-UI для каталога
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
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DnsIcon from '@mui/icons-material/Dns';
import ScienceIcon from '@mui/icons-material/Science';
import UsbIcon from '@mui/icons-material/Usb';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';

// Карта компонентов иконок для живого предпросмотра
const ICON_COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
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

const AVAILABLE_ICONS = Object.keys(ICON_COMPONENT_MAP);

const PRESET_COLORS = [
  '#0F3C64', // Темно-синий брендовый
  '#0284C7', // Лазурный системный
  '#2563EB', // Яркий синий
  '#16A34A', // Изумрудно-зеленый
  '#D97706', // Янтарно-золотой
  '#DC2626', // Красный предупреждающий
  '#7C3AED', // Фиолетовый
  '#64748B'  // Нейтральный сланец
];

// Типы конфигурации
interface RoleItem {
  code: string;
  name: string;
  description?: string;
}

interface MenuItem {
  id: string;
  text: string;
  path: string;
  icon?: string;
  iconColor?: string;
  tooltip?: string;
  isExternal?: boolean;
  defaultOpen?: boolean;
  permissions: string[];
}

interface MenuGroup {
  id: string;
  title: string;
  icon?: string;
  iconColor?: string;
  defaultOpen?: boolean;
  tooltip?: string;
  permissions?: string[];
  items: MenuItem[];
}

interface MenuPermissionsConfig {
  $schema?: string;
  version: string;
  description?: string;
  rolesAndPermissions: RoleItem[];
  menuGroups: MenuGroup[];
  screenElements: Record<string, Record<string, string[]>>;
}

interface BackupItem {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export const MenuPermissionsEditor: React.FC = () => {
  const { currentUser, token } = useAuth();
  const isSysadmin = Boolean(currentUser?.permissionCodes?.includes('sysadmin') || currentUser?.role === 'sysadmin');

  // Состояние рабочей конфигурации
  const [config, setConfig] = useState<MenuPermissionsConfig>(() => JSON.parse(JSON.stringify(initialMenuConfig)));
  const [originalConfig, setOriginalConfig] = useState<MenuPermissionsConfig>(() => JSON.parse(JSON.stringify(initialMenuConfig)));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Список резервных копий
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  // Ошибки и уведомления
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Диалог подтверждения сохранения и перезагрузки
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [reloadingOverlay, setReloadingOverlay] = useState(false);

  // Диалог редактирования пункта меню
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemFormData, setItemFormData] = useState<MenuItem>({
    id: '',
    text: '',
    path: '',
    icon: 'AutoAwesomeMotion',
    iconColor: '#0F3C64',
    tooltip: '',
    isExternal: false,
    permissions: ['sysadmin']
  });

  // Диалог редактирования группы
  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  const [groupFormData, setGroupFormData] = useState<MenuGroup>({
    id: '',
    title: '',
    icon: 'AutoAwesomeMotion',
    iconColor: '#0F3C64',
    tooltip: '',
    defaultOpen: false,
    permissions: ['*'],
    items: []
  });

  // Поиск иконки в модалке выбора иконок
  const [iconSearchTerm, setIconSearchTerm] = useState('');

  // Диалог выбора иконки
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<'item' | 'group'>('item');

  // Флаг изменений (Dirty Check)
  const isDirty = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  }, [config, originalConfig]);

  // Загрузка конфигурации с бэкенда при монтировании
  const loadConfigFromServer = useCallback(async () => {
    if (!token && !isSysadmin) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/menu-permissions/config`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
          setOriginalConfig(data.config);
        }
      } else if (res.status === 403) {
        setSnackbar({
          open: true,
          message: 'Доступ ограничен: только для системных администраторов (sysadmin)',
          severity: 'error'
        });
      }
    } catch (err: any) {
      console.warn('Не удалось загрузить конфигурацию через API, используется локальный файл:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isSysadmin]);

  // Загрузка списка резервных копий
  const loadBackupsFromServer = useCallback(async () => {
    if (!isSysadmin) return;
    setLoadingBackups(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/menu-permissions/backups`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.backups)) {
          setBackups(data.backups);
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки списка бэкапов:', err);
    } finally {
      setLoadingBackups(false);
    }
  }, [isSysadmin]);

  useEffect(() => {
    loadConfigFromServer();
  }, [loadConfigFromServer]);

  useEffect(() => {
    if (activeTab === 3) {
      loadBackupsFromServer();
    }
  }, [activeTab, loadBackupsFromServer]);

  // Клиентская валидация целостности на лету
  const integrityValidation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const roleCodes = new Set(config.rolesAndPermissions?.map(r => r.code) || []);

    if (!roleCodes.has('sysadmin')) {
      errors.push('Критическая ошибка: роль "sysadmin" не может быть удалена из справочника ролей');
    }

    const groupIds = new Set<string>();
    const itemIds = new Set<string>();
    const internalPaths = new Set<string>();

    let hasSysadminInUsersManager = false;
    let hasSysadminInMenuEditor = false;
    let hasPublicEntry = false;

    config.menuGroups.forEach((group, gIdx) => {
      if (!group.id?.trim()) errors.push(`Группа #${gIdx + 1}: отсутствует id`);
      if (!group.title?.trim()) errors.push(`Группа #${gIdx + 1}: отсутствует название title`);

      if (groupIds.has(group.id)) errors.push(`Дублирование ID группы: "${group.id}"`);
      groupIds.add(group.id);

      if (group.permissions) {
        group.permissions.forEach(p => {
          if (p !== '*' && !roleCodes.has(p)) {
            errors.push(`Группа "${group.title}": неизвестная роль "${p}"`);
          }
        });
      }

      group.items.forEach((item, iIdx) => {
        if (!item.id?.trim()) errors.push(`Группа "${group.title}", пункт #${iIdx + 1}: отсутствует id`);
        if (!item.text?.trim()) errors.push(`Группа "${group.title}", пункт #${iIdx + 1}: отсутствует название text`);
        if (!item.path?.trim()) errors.push(`Группа "${group.title}", пункт #${iIdx + 1}: отсутствует маршрут path`);

        if (itemIds.has(item.id)) errors.push(`Дублирование ID пункта: "${item.id}"`);
        itemIds.add(item.id);

        if (!item.isExternal && item.path) {
          const basePath = item.path.split('?')[0];
          if (internalPaths.has(basePath)) {
            errors.push(`Дублирование маршрута: "${basePath}"`);
          }
          internalPaths.add(basePath);
        }

        if (item.permissions.includes('*')) hasPublicEntry = true;

        item.permissions.forEach(p => {
          if (p !== '*' && !roleCodes.has(p)) {
            errors.push(`Пункт "${item.text}": неизвестная роль "${p}"`);
          }
        });

        if (item.path === '/admin/users' && (item.permissions.includes('sysadmin') || item.permissions.includes('*'))) {
          hasSysadminInUsersManager = true;
        }
        if (item.path === '/admin/menu-permissions' && (item.permissions.includes('sysadmin') || item.permissions.includes('*'))) {
          hasSysadminInMenuEditor = true;
        }
      });
    });

    if (!hasSysadminInUsersManager) {
      errors.push('Анти-блокировка: пункт "/admin/users" обязан быть разрешен для sysadmin');
    }
    if (!hasSysadminInMenuEditor) {
      errors.push('Анти-блокировка: пункт "/admin/menu-permissions" обязан быть разрешен для sysadmin');
    }
    if (!hasPublicEntry) {
      warnings.push('Рекомендуется иметь хотя бы один экран с доступом ["*"] для гарантированного входа всех пользователей');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [config]);

  // Сохранение с обязательной валидацией и перезагрузкой
  const handleSaveAndReload = async () => {
    if (!integrityValidation.isValid) {
      setSnackbar({
        open: true,
        message: 'Невозможно сохранить: исправьте ошибки целостности перед сохранением!',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/menu-permissions/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (data.errors && data.errors.join('; ')) || 'Ошибка сохранения конфигурации');
      }

      setConfirmSaveOpen(false);
      setReloadingOverlay(true);

      // Оповещение других вкладок через BroadcastChannel
      try {
        const bc = new BroadcastChannel('ortho_menu_sync');
        bc.postMessage({ type: 'CONFIG_UPDATED', timestamp: Date.now() });
      } catch (e) {
        localStorage.setItem('ortho_menu_permissions_last_updated', String(Date.now()));
      }

      // Перезагрузка страницы через 700 мс для фиксации успеха администратором
      setTimeout(() => {
        window.location.reload();
      }, 700);

    } catch (err: any) {
      setSaving(false);
      setConfirmSaveOpen(false);
      setSnackbar({
        open: true,
        message: `Ошибка: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Откат к резервной копии
  const handleRestoreBackup = async (filename: string) => {
    if (!window.confirm(`Вы действительно хотите восстановить конфигурацию из файла "${filename}"? Текущее состояние будет сохранено в аварийный бэкап.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/menu-permissions/restore-backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка восстановления из бэкапа');
      }

      setReloadingOverlay(true);
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err: any) {
      setLoading(false);
      setSnackbar({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  // Сброс к состоянию сервера
  const handleReset = () => {
    if (window.confirm('Отменить все несохраненные изменения и вернуть исходную конфигурацию?')) {
      setConfig(JSON.parse(JSON.stringify(originalConfig)));
      setSnackbar({
        open: true,
        message: 'Все изменения сброшены к исходному состоянию',
        severity: 'info'
      });
    }
  };

  // Перемещение группы вверх/вниз
  const handleMoveGroup = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= config.menuGroups.length) return;

    const newGroups = [...config.menuGroups];
    const [moved] = newGroups.splice(index, 1);
    newGroups.splice(targetIdx, 0, moved);

    setConfig({ ...config, menuGroups: newGroups });
  };

  // Перемещение пункта вверх/вниз
  const handleMoveItem = (groupId: string, itemIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? itemIdx - 1 : itemIdx + 1;
    const groupIdx = config.menuGroups.findIndex(g => g.id === groupId);
    if (groupIdx === -1) return;

    const group = config.menuGroups[groupIdx];
    if (targetIdx < 0 || targetIdx >= group.items.length) return;

    const newItems = [...group.items];
    const [moved] = newItems.splice(itemIdx, 1);
    newItems.splice(targetIdx, 0, moved);

    const newGroups = [...config.menuGroups];
    newGroups[groupIdx] = { ...group, items: newItems };

    setConfig({ ...config, menuGroups: newGroups });
  };

  // Открытие модалки создания/редактирования пункта
  const handleOpenItemEdit = (groupId: string, itemIdx: number | null) => {
    setEditingGroupId(groupId);
    setEditingItemIndex(itemIdx);

    if (itemIdx !== null) {
      const group = config.menuGroups.find(g => g.id === groupId);
      if (group && group.items[itemIdx]) {
        setItemFormData(JSON.parse(JSON.stringify(group.items[itemIdx])));
      }
    } else {
      setItemFormData({
        id: `item_${Date.now()}`,
        text: 'Новый раздел',
        path: '/new-path',
        icon: 'Description',
        iconColor: '#0F3C64',
        tooltip: 'Описание нового раздела',
        isExternal: false,
        permissions: ['sysadmin', 'doctor']
      });
    }

    setEditItemModalOpen(true);
  };

  // Сохранение пункта из модалки в стейт
  const handleSaveItemModal = () => {
    if (!editingGroupId) return;

    const groupIdx = config.menuGroups.findIndex(g => g.id === editingGroupId);
    if (groupIdx === -1) return;

    const group = config.menuGroups[groupIdx];
    const newItems = [...group.items];

    if (editingItemIndex !== null) {
      newItems[editingItemIndex] = itemFormData;
    } else {
      newItems.push(itemFormData);
    }

    const newGroups = [...config.menuGroups];
    newGroups[groupIdx] = { ...group, items: newItems };

    setConfig({ ...config, menuGroups: newGroups });
    setEditItemModalOpen(false);
  };

  // Удаление пункта
  const handleDeleteItem = (groupId: string, itemIdx: number) => {
    const group = config.menuGroups.find(g => g.id === groupId);
    const item = group?.items[itemIdx];
    if (!item) return;

    if (window.confirm(`Вы уверены, что хотите удалить пункт "${item.text}" (${item.path})?`)) {
      const groupIdx = config.menuGroups.findIndex(g => g.id === groupId);
      const newItems = [...group.items];
      newItems.splice(itemIdx, 1);

      const newGroups = [...config.menuGroups];
      newGroups[groupIdx] = { ...group, items: newItems };

      setConfig({ ...config, menuGroups: newGroups });
    }
  };

  // Дублирование пункта
  const handleDuplicateItem = (groupId: string, itemIdx: number) => {
    const groupIdx = config.menuGroups.findIndex(g => g.id === groupId);
    if (groupIdx === -1) return;

    const group = config.menuGroups[groupIdx];
    const item = group.items[itemIdx];
    if (!item) return;

    const duplicatedItem: MenuItem = {
      ...JSON.parse(JSON.stringify(item)),
      id: `${item.id}_copy_${Date.now()}`,
      text: `${item.text} (Копия)`,
      path: `${item.path}-copy`
    };

    const newItems = [...group.items];
    newItems.splice(itemIdx + 1, 0, duplicatedItem);

    const newGroups = [...config.menuGroups];
    newGroups[groupIdx] = { ...group, items: newItems };

    setConfig({ ...config, menuGroups: newGroups });
  };

  // Открытие модалки редактирования группы
  const handleOpenGroupEdit = (groupIndex: number | null) => {
    setEditingGroupIndex(groupIndex);

    if (groupIndex !== null && config.menuGroups[groupIndex]) {
      setGroupFormData(JSON.parse(JSON.stringify(config.menuGroups[groupIndex])));
    } else {
      setGroupFormData({
        id: `group_${Date.now()}`,
        title: 'Новая группа меню',
        icon: 'FolderSpecial',
        iconColor: '#0F3C64',
        tooltip: 'Описание назначения новой группы',
        defaultOpen: false,
        permissions: ['*'],
        items: []
      });
    }

    setEditGroupModalOpen(true);
  };

  // Сохранение группы из модалки
  const handleSaveGroupModal = () => {
    const newGroups = [...config.menuGroups];
    if (editingGroupIndex !== null) {
      newGroups[editingGroupIndex] = {
        ...groupFormData,
        items: newGroups[editingGroupIndex].items
      };
    } else {
      newGroups.push(groupFormData);
    }

    setConfig({ ...config, menuGroups: newGroups });
    setEditGroupModalOpen(false);
  };

  // Удаление группы
  const handleDeleteGroup = (groupIndex: number) => {
    const group = config.menuGroups[groupIndex];
    if (!group) return;

    if (window.confirm(`Удалить группу меню "${group.title}" и все вложенные пункты (${group.items.length} шт.)?`)) {
      const newGroups = [...config.menuGroups];
      newGroups.splice(groupIndex, 1);
      setConfig({ ...config, menuGroups: newGroups });
    }
  };

  // Переключение роли для экранного элемента
  const handleToggleScreenElementPermission = (screenKey: string, elementKey: string, roleCode: string) => {
    const currentPerms = config.screenElements[screenKey]?.[elementKey] || [];
    let updatedPerms: string[];

    if (roleCode === '*') {
      updatedPerms = currentPerms.includes('*') ? ['sysadmin'] : ['*'];
    } else {
      if (currentPerms.includes(roleCode)) {
        updatedPerms = currentPerms.filter(p => p !== roleCode);
        if (updatedPerms.length === 0) updatedPerms = ['sysadmin'];
      } else {
        updatedPerms = [...currentPerms.filter(p => p !== '*'), roleCode];
      }
    }

    setConfig({
      ...config,
      screenElements: {
        ...config.screenElements,
        [screenKey]: {
          ...config.screenElements[screenKey],
          [elementKey]: updatedPerms
        }
      }
    });
  };

  // Вспомогательный рендер иконки
  const renderIconPreview = (iconName?: string, color?: string, size = 20) => {
    const Comp = (iconName && ICON_COMPONENT_MAP[iconName]) || AutoAwesomeMotionIcon;
    return <Comp sx={{ fontSize: size, color: color || '#0F3C64' }} />;
  };

  // Если пользователь не является системным администратором
  if (!isSysadmin) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" icon={<SecurityIcon fontSize="large" />} sx={{ maxWidth: 650, m: 'auto', mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }} gutterBottom>
            Доступ запрещен: требуется роль Системного администратора (sysadmin)
          </Typography>
          <Typography variant="body2">
            Редактирование структуры меню, конфигурации разделов и экранных элементов защищено строгими политиками безопасности МИС «ОртоERP».
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, margin: '0 auto' }}>
      {/* Шапка управления */}
      <Paper
        elevation={2}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#F8FAFC',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          border: '1px solid #334155'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TuneIcon sx={{ fontSize: 32, color: '#38BDF8' }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#F8FAFC', letterSpacing: '-0.5px' }}>
                Редактор меню и прав доступа (RBAC)
              </Typography>
              <Chip label={`v${config.version || '2.0.0'}`} size="small" sx={{ bgcolor: '#0284C7', color: 'white', fontWeight: 'bold' }} />
              {isDirty && (
                <Chip
                  label="Несохраненные изменения"
                  size="small"
                  sx={{
                    bgcolor: '#D97706',
                    color: '#FFF',
                    fontWeight: 'bold'
                  }}
                />
              )}
              {loading && <CircularProgress size={18} sx={{ color: '#38BDF8' }} />}
            </Box>
            <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
              Визуальное управление древовидной структурой Sidebar, ролями, подсказками и экранными элементами с обязательной валидацией целостности
            </Typography>
          </Box>
        </Box>

        {/* Панель кнопок действий */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isDirty && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleReset}
              startIcon={<RestoreIcon />}
              sx={{ borderColor: '#475569', color: '#CBD5E1', '&:hover': { borderColor: '#94A3B8' } }}
            >
              Сбросить
            </Button>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={() => setConfirmSaveOpen(true)}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            disabled={saving || !integrityValidation.isValid}
            sx={{
              bgcolor: integrityValidation.isValid ? '#0284C7' : '#475569',
              fontWeight: 'bold',
              px: 2.5,
              py: 1,
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
              '&:hover': { bgcolor: '#0369A1' }
            }}
          >
            Сохранить и перезагрузить
          </Button>
        </Box>
      </Paper>

      {/* Панель предупреждений о валидации целостности */}
      {!integrityValidation.isValid && (
        <Alert
          severity="error"
          icon={<ErrorIcon />}
          sx={{ mb: 3, borderRadius: 2, border: '1px solid #F87171' }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Обнаружены нарушения целостности конфигурации (сохранение заблокировано):
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0, mt: 0.5 }}>
            {integrityValidation.errors.map((err, idx) => (
              <li key={idx} style={{ fontSize: '0.85rem' }}>{err}</li>
            ))}
          </Box>
        </Alert>
      )}

      {integrityValidation.warnings.length > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Предупреждения по оптимизации структуры:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0, mt: 0.5 }}>
            {integrityValidation.warnings.map((warn, idx) => (
              <li key={idx} style={{ fontSize: '0.85rem' }}>{warn}</li>
            ))}
          </Box>
        </Alert>
      )}

      {/* Вкладки навигации редактора */}
      <Paper elevation={1} sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab
            label={`1. Дерево бокового меню (${config.menuGroups.length} групп)`}
            sx={{ fontWeight: 'bold', textTransform: 'none' }}
          />
          <Tab
            label="2. Экранные элементы (UI Elements)"
            sx={{ fontWeight: 'bold', textTransform: 'none' }}
          />
          <Tab
            label={`3. Справочник ролей (${config.rolesAndPermissions?.length || 0})`}
            sx={{ fontWeight: 'bold', textTransform: 'none' }}
          />
          <Tab
            label="4. JSON и Резервные копии"
            sx={{ fontWeight: 'bold', textTransform: 'none' }}
          />
        </Tabs>

        {/* ВКЛАДКА 1: ДЕРЕВО БОКОВОГО МЕНЮ */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0F3C64' }}>
                Структура боковой панели навигации
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenGroupEdit(null)}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                + Добавить группу меню
              </Button>
            </Box>

            {config.menuGroups.map((group, groupIdx) => (
              <Accordion
                key={group.id}
                defaultExpanded={groupIdx < 2}
                sx={{
                  mb: 2,
                  borderRadius: '8px !important',
                  border: '1px solid #CBD5E1',
                  boxShadow: 'none',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: '#F8FAFC',
                    borderRadius: '8px',
                    '&:hover': { bgcolor: '#F1F5F9' },
                    py: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                    {/* Кнопки перемещения группы */}
                    <Box sx={{ display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        disabled={groupIdx === 0}
                        onClick={() => handleMoveGroup(groupIdx, 'up')}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={groupIdx === config.menuGroups.length - 1}
                        onClick={() => handleMoveGroup(groupIdx, 'down')}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Иконка и цвет группы */}
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 1, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                      {renderIconPreview(group.icon, group.iconColor, 22)}
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
                          {group.title}
                        </Typography>
                        <Chip label={group.id} size="small" variant="outlined" sx={{ fontSize: '0.72rem', height: 20 }} />
                        <Chip label={`${group.items.length} пунктов`} size="small" sx={{ bgcolor: '#E2E8F0', height: 20, fontSize: '0.72rem' }} />
                      </Box>
                      {group.tooltip && (
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.25 }}>
                          {group.tooltip}
                        </Typography>
                      )}
                    </Box>

                    {/* Права доступа группы */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(group.permissions || ['*']).map(p => (
                        <Chip
                          key={p}
                          label={p === '*' ? 'Все роли (*)' : p}
                          size="small"
                          sx={{
                            bgcolor: p === '*' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                            color: p === '*' ? '#B45309' : '#0369A1',
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }}
                        />
                      ))}
                    </Box>

                    {/* Кнопки управления группой */}
                    <Box sx={{ display: 'flex', gap: 1 }} onClick={e => e.stopPropagation()}>
                      <Tooltip title="Редактировать группу">
                        <IconButton size="small" onClick={() => handleOpenGroupEdit(groupIdx)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Добавить пункт в группу">
                        <IconButton size="small" color="primary" onClick={() => handleOpenItemEdit(group.id, null)}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить группу">
                        <IconButton size="small" color="error" onClick={() => handleDeleteGroup(groupIdx)}>
                          <DeleteForeverIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 2, pt: 1, bgcolor: '#FFFFFF' }}>
                  {group.items.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center', color: '#94A3B8' }}>
                      <Typography variant="body2">В этой группе пока нет пунктов меню</Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenItemEdit(group.id, null)}
                        sx={{ mt: 1, textTransform: 'none' }}
                      >
                        Добавить первый пункт
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {group.items.map((item, itemIdx) => (
                        <Paper
                          key={item.id}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            border: '1px solid #E2E8F0',
                            borderRadius: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' }
                          }}
                        >
                          {/* Перемещение пункта */}
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              disabled={itemIdx === 0}
                              onClick={() => handleMoveItem(group.id, itemIdx, 'up')}
                            >
                              <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              disabled={itemIdx === group.items.length - 1}
                              onClick={() => handleMoveItem(group.id, itemIdx, 'down')}
                            >
                              <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>

                          {/* Иконка */}
                          <Box sx={{ display: 'flex', alignItems: 'center', p: 0.75, bgcolor: '#F1F5F9', borderRadius: 1 }}>
                            {renderIconPreview(item.icon, item.iconColor, 20)}
                          </Box>

                          {/* Текст и маршрут */}
                          <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
                                {item.text}
                              </Typography>
                              {item.isExternal && (
                                <Tooltip title="Внешняя ссылка (откроется в новой вкладке)">
                                  <OpenInNewIcon sx={{ fontSize: 14, color: '#64748B' }} />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: '#0284C7', fontFamily: 'monospace' }}>
                              {item.path}
                            </Typography>
                          </Box>

                          {/* Всплывающая подсказка */}
                          <Box sx={{ maxWidth: 280, display: { xs: 'none', lg: 'block' } }}>
                            <Typography variant="caption" sx={{ color: '#64748B', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.tooltip}
                            </Typography>
                          </Box>

                          {/* Права доступа */}
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', minWidth: 160, justifyContent: 'flex-end' }}>
                            {item.permissions.map(p => (
                              <Chip
                                key={p}
                                label={p === '*' ? 'Все (*)' : p}
                                size="small"
                                sx={{
                                  fontSize: '0.68rem',
                                  height: 22,
                                  bgcolor: p === '*' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(15, 60, 100, 0.08)',
                                  color: p === '*' ? '#B45309' : '#0F3C64',
                                  fontWeight: 'bold'
                                }}
                              />
                            ))}
                          </Box>

                          {/* Действия */}
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Редактировать пункт">
                              <IconButton size="small" onClick={() => handleOpenItemEdit(group.id, itemIdx)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Дублировать пункт">
                              <IconButton size="small" onClick={() => handleDuplicateItem(group.id, itemIdx)}>
                                <ContentCopyIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Удалить пункт">
                              <IconButton size="small" color="error" onClick={() => handleDeleteItem(group.id, itemIdx)}>
                                <DeleteForeverIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Paper>
                      ))}

                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenItemEdit(group.id, null)}
                        sx={{ mt: 1, alignSelf: 'flex-start', textTransform: 'none', fontWeight: 'bold' }}
                      >
                        + Добавить пункт в «{group.title}»
                      </Button>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* ВКЛАДКА 2: ЭКРАННЫЕ ЭЛЕМЕНТЫ */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0F3C64', mb: 1 }}>
              Матрица прав доступа к экранным элементам и действиям
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              Управление доступом к кнопкам, интерактивным модальным окнам и кликабельности статусных индикаторов в приложении
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {Object.entries(config.screenElements || {}).map(([screenKey, elements]) => (
                <Card variant="outlined" sx={{ borderRadius: 2 }} key={screenKey}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
                        Экран: <span style={{ color: '#0284C7', fontFamily: 'monospace' }}>{screenKey}</span>
                      </Typography>
                      <Chip label={`${Object.keys(elements).length} элементов`} size="small" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {Object.entries(elements).map(([elementKey, perms]) => (
                        <Paper
                          key={elementKey}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            bgcolor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 1.5
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#0F172A' }}>
                              {elementKey}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              Кликабельность / показ элемента интерфейса
                            </Typography>
                          </Box>

                          {/* Роли */}
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ color: '#64748B', mr: 0.5 }}>Разрешено для:</Typography>
                            {config.rolesAndPermissions?.map(role => {
                              const isPermitted = perms.includes('*') || perms.includes(role.code);
                              return (
                                <Chip
                                  key={role.code}
                                  label={role.name}
                                  size="small"
                                  onClick={() => handleToggleScreenElementPermission(screenKey, elementKey, role.code)}
                                  color={isPermitted ? 'primary' : 'default'}
                                  variant={isPermitted ? 'filled' : 'outlined'}
                                  sx={{
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    fontWeight: isPermitted ? 'bold' : 'normal'
                                  }}
                                />
                              );
                            })}
                            <Chip
                              label="Все (*)"
                              size="small"
                              onClick={() => handleToggleScreenElementPermission(screenKey, elementKey, '*')}
                              color={perms.includes('*') ? 'warning' : 'default'}
                              variant={perms.includes('*') ? 'filled' : 'outlined'}
                              sx={{ fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold' }}
                            />
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* ВКЛАДКА 3: СПРАВОЧНИК РОЛЕЙ */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0F3C64', mb: 1 }}>
              Справочник ролей и прав доступа (RBAC)
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              Роли синхронизированы со структурой учетных записей пользователей и полномочиями в таблицах SQLite
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {config.rolesAndPermissions?.map(role => (
                <Card variant="outlined" sx={{ borderRadius: 2 }} key={role.code}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
                        {role.name}
                      </Typography>
                      <Chip
                        label={role.code}
                        size="small"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          bgcolor: role.code === 'sysadmin' ? '#DC2626' : role.code === 'doctor' ? '#0F3C64' : '#0284C7',
                          color: '#FFF'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64748B', minHeight: 40 }}>
                      {role.description || 'Описание прав доступа не заполнено'}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* ВКЛАДКА 4: JSON И РЕЗЕРВНЫЕ КОПИИ */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3 }}>
              {/* Левая колонка: Просмотр JSON */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
                    Спецификация JSON (Актуальная в памяти)
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `menuPermissionsConfig_export_${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Скачать .json
                  </Button>
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: '#0F172A',
                    color: '#38BDF8',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    maxHeight: 520,
                    overflow: 'auto',
                    borderRadius: 2,
                    border: '1px solid #334155'
                  }}
                >
                  <pre style={{ margin: 0 }}>{JSON.stringify(config, null, 2)}</pre>
                </Paper>
              </Box>

              {/* Правая колонка: Резервные копии на сервере */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0F172A' }}>
                    Резервные копии на сервере
                  </Typography>
                  <IconButton size="small" onClick={loadBackupsFromServer} disabled={loadingBackups}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Box>

                {loadingBackups ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : backups.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Резервные копии пока не созданы. Первый снимок будет сгенерирован автоматически при сохранении.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 520, overflow: 'auto' }}>
                    {backups.map(b => (
                      <Paper
                        key={b.filename}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          border: '1px solid #E2E8F0',
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                            {b.filename}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {new Date(b.createdAt).toLocaleString('ru-RU')} • {(b.sizeBytes / 1024).toFixed(1)} КБ
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={<RestoreIcon />}
                          onClick={() => handleRestoreBackup(b.filename)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          Откатить
                        </Button>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {/* ДИАЛОГ РЕДАКТИРОВАНИЯ ПУНКТА МЕНЮ */}
      <Dialog
        open={editItemModalOpen}
        onClose={() => setEditItemModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0F172A', borderBottom: '1px solid #E2E8F0' }}>
          {editingItemIndex !== null ? 'Редактирование пункта меню' : 'Добавление нового пункта меню'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Идентификатор пункта (ID)"
            value={itemFormData.id}
            onChange={e => setItemFormData({ ...itemFormData, id: e.target.value })}
            size="small"
            fullWidth
            helperText="Уникальный строковый ключ (snake_case, например: protocols_registry)"
          />

          <TextField
            label="Название пункта меню (text)"
            value={itemFormData.text}
            onChange={e => setItemFormData({ ...itemFormData, text: e.target.value })}
            size="small"
            fullWidth
          />

          <TextField
            label="Маршрут или URL (path)"
            value={itemFormData.path}
            onChange={e => setItemFormData({ ...itemFormData, path: e.target.value })}
            size="small"
            fullWidth
            helperText="Внутренний маршрут (например: /protocols-registry) или URL"
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>Иконка MUI:</Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setIconPickerTarget('item');
                  setIconPickerOpen(true);
                }}
                startIcon={renderIconPreview(itemFormData.icon, itemFormData.iconColor, 20)}
                fullWidth
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                {itemFormData.icon || 'Выбрать иконку...'}
              </Button>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>Цвет иконки:</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {PRESET_COLORS.slice(0, 5).map(c => (
                  <Box
                    key={c}
                    onClick={() => setItemFormData({ ...itemFormData, iconColor: c })}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: c,
                      cursor: 'pointer',
                      border: itemFormData.iconColor === c ? '2px solid #000' : '1px solid #CCC'
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          <TextField
            label="Контекстная подсказка (tooltip)"
            value={itemFormData.tooltip || ''}
            onChange={e => setItemFormData({ ...itemFormData, tooltip: e.target.value })}
            size="small"
            multiline
            rows={2}
            fullWidth
            helperText="Подробное описание назначения раздела при наведении курсора"
          />

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
              Права доступа (роли):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {config.rolesAndPermissions?.map(role => {
                const selected = itemFormData.permissions.includes(role.code);
                return (
                  <Chip
                    key={role.code}
                    label={role.name}
                    size="small"
                    color={selected ? 'primary' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => {
                      let updated = selected
                        ? itemFormData.permissions.filter(p => p !== role.code)
                        : [...itemFormData.permissions.filter(p => p !== '*'), role.code];
                      if (updated.length === 0) updated = ['sysadmin'];
                      setItemFormData({ ...itemFormData, permissions: updated });
                    }}
                  />
                );
              })}
              <Chip
                label="Все (*)"
                size="small"
                color={itemFormData.permissions.includes('*') ? 'warning' : 'default'}
                variant={itemFormData.permissions.includes('*') ? 'filled' : 'outlined'}
                onClick={() => {
                  setItemFormData({
                    ...itemFormData,
                    permissions: itemFormData.permissions.includes('*') ? ['sysadmin'] : ['*']
                  });
                }}
              />
            </Box>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(itemFormData.isExternal)}
                onChange={e => setItemFormData({ ...itemFormData, isExternal: e.target.checked })}
              />
            }
            label="Внешняя ссылка (открывать в новой вкладке)"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setEditItemModalOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveItemModal}>Применить</Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ РЕДАКТИРОВАНИЯ ГРУППЫ МЕНЮ */}
      <Dialog
        open={editGroupModalOpen}
        onClose={() => setEditGroupModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0F172A', borderBottom: '1px solid #E2E8F0' }}>
          {editingGroupIndex !== null ? 'Редактирование группы меню' : 'Добавление новой группы меню'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Идентификатор группы (ID)"
            value={groupFormData.id}
            onChange={e => setGroupFormData({ ...groupFormData, id: e.target.value })}
            size="small"
            fullWidth
            helperText="Уникальный строковый ключ группы (например: operations_and_wizards)"
          />

          <TextField
            label="Название группы (title)"
            value={groupFormData.title}
            onChange={e => setGroupFormData({ ...groupFormData, title: e.target.value })}
            size="small"
            fullWidth
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>Иконка группы:</Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setIconPickerTarget('group');
                  setIconPickerOpen(true);
                }}
                startIcon={renderIconPreview(groupFormData.icon, groupFormData.iconColor, 20)}
                fullWidth
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                {groupFormData.icon || 'Выбрать иконку...'}
              </Button>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>Цвет:</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {PRESET_COLORS.slice(0, 5).map(c => (
                  <Box
                    key={c}
                    onClick={() => setGroupFormData({ ...groupFormData, iconColor: c })}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: c,
                      cursor: 'pointer',
                      border: groupFormData.iconColor === c ? '2px solid #000' : '1px solid #CCC'
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          <TextField
            label="Подсказка группы (tooltip)"
            value={groupFormData.tooltip || ''}
            onChange={e => setGroupFormData({ ...groupFormData, tooltip: e.target.value })}
            size="small"
            multiline
            rows={2}
            fullWidth
          />

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
              Права доступа ко всей группе:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {config.rolesAndPermissions?.map(role => {
                const selected = (groupFormData.permissions || []).includes(role.code);
                return (
                  <Chip
                    key={role.code}
                    label={role.name}
                    size="small"
                    color={selected ? 'primary' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => {
                      let updated = selected
                        ? (groupFormData.permissions || []).filter(p => p !== role.code)
                        : [...(groupFormData.permissions || []).filter(p => p !== '*'), role.code];
                      if (updated.length === 0) updated = ['*'];
                      setGroupFormData({ ...groupFormData, permissions: updated });
                    }}
                  />
                );
              })}
              <Chip
                label="Все (*)"
                size="small"
                color={(groupFormData.permissions || []).includes('*') ? 'warning' : 'default'}
                variant={(groupFormData.permissions || []).includes('*') ? 'filled' : 'outlined'}
                onClick={() => {
                  setGroupFormData({
                    ...groupFormData,
                    permissions: (groupFormData.permissions || []).includes('*') ? ['sysadmin'] : ['*']
                  });
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setEditGroupModalOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveGroupModal}>Применить</Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ ВЫБОРА ИКОНКИ MUI */}
      <Dialog
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Каталог иконок Material-UI
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            placeholder="Поиск по названию иконки..."
            value={iconSearchTerm}
            onChange={e => setIconSearchTerm(e.target.value)}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }
            }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, maxHeight: 360, overflowY: 'auto' }}>
            {AVAILABLE_ICONS.filter(name => name.toLowerCase().includes(iconSearchTerm.toLowerCase())).map(name => {
              const Comp = ICON_COMPONENT_MAP[name];
              return (
                <Button
                  key={name}
                  variant="outlined"
                  onClick={() => {
                    if (iconPickerTarget === 'item') {
                      setItemFormData({ ...itemFormData, icon: name });
                    } else {
                      setGroupFormData({ ...groupFormData, icon: name });
                    }
                    setIconPickerOpen(false);
                  }}
                  sx={{
                    p: 1.5,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    textTransform: 'none',
                    borderColor: '#E2E8F0'
                  }}
                >
                  <Comp sx={{ fontSize: 26, color: '#0F3C64' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748B' }}>
                    {name}
                  </Typography>
                </Button>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIconPickerOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ ПОДТВЕРЖДЕНИЯ СОХРАНЕНИЯ С ВАЛИДАЦИЕЙ */}
      <Dialog
        open={confirmSaveOpen}
        onClose={() => setConfirmSaveOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 28 }} />
          Подтверждение сохранения и перезагрузки
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: '#334155', mb: 2 }}>
            Все проверки целостности успешно пройдены. Файл <code>menuPermissionsConfig.json</code> будет атомарно обновлен на сервере.
          </Typography>

          <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#0F3C64', fontWeight: 'bold' }}>
              Контрольный список безопасности:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0, fontSize: '0.85rem', color: '#334155' }}>
              <li>Роль <strong>sysadmin</strong> защищена от удаления и сохраняет доступ к панели администрирования.</li>
              <li>Все ID групп ({config.menuGroups.length}) и пунктов меню уникальны.</li>
              <li>Все указанные роли существуют в справочнике <code>rolesAndPermissions</code>.</li>
              <li>Перед записью на сервере будет создан автоматический снимок (бэкап).</li>
            </Box>
          </Paper>

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Сразу после записи сервер отдаст команду на <strong>автоматическую перезагрузку страницы</strong> для мгновенного применения новых правил во всех компонентах.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setConfirmSaveOpen(false)} disabled={saving}>
            Отмена
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveAndReload}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            sx={{ bgcolor: '#0284C7', fontWeight: 'bold', '&:hover': { bgcolor: '#0369A1' } }}
          >
            Подтвердить и перезагрузить
          </Button>
        </DialogActions>
      </Dialog>

      {/* ОВЕРЛЕЙ ПЕРЕЗАГРУЗКИ ПОСЛЕ УСПЕШНОГО СОХРАНЕНИЯ */}
      <Backdrop
        open={reloadingOverlay}
        sx={{
          color: '#fff',
          zIndex: 9999,
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'rgba(15, 23, 42, 0.85)'
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 64, color: '#38BDF8' }} />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Конфигурация меню успешно сохранена!
        </Typography>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
          Перезагрузка интерфейса приложения для применения новых правил навигации...
        </Typography>
        <CircularProgress color="inherit" size={32} sx={{ mt: 1 }} />
      </Backdrop>

      {/* Всплывающие уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MenuPermissionsEditor;
