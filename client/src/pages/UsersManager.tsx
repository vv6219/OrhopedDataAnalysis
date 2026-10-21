import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Avatar,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { ruRU } from '@mui/x-data-grid/locales';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import BadgeIcon from '@mui/icons-material/Badge';
import SecurityIcon from '@mui/icons-material/Security';
import LockClockIcon from '@mui/icons-material/LockClock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ShieldIcon from '@mui/icons-material/Shield';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import AddIcon from '@mui/icons-material/Add';
import KeyIcon from '@mui/icons-material/VpnKey';
import CustomToolbar from '../components/CustomToolbar';
import UsersGridFooter from '../components/UsersGridFooter';
import PermissionsGridFooter from '../components/PermissionsGridFooter';
import { API_BASE_URL } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';
import { getPermittedScreens, getScreenTitleByPath } from '../utils/permissionUtils';

export interface PermissionRecord {
  id: number;
  code: string;
  name: string;
  description: string;
  badge_color: string;
  is_system: number;
  created_at?: string;
  updated_at?: string;
  users_count?: number;
  assigned_users_count?: number;
}

export interface UserRecord {
  id: number;
  username: string;
  full_name: string;
  role: string;
  staff_id: number | null;
  is_active: number;
  expires_at: string | null;
  auto_lock_minutes: number;
  main_screen?: string | null;
  last_login_at: string | null;
  last_logout_at: string | null;
  created_at: string;
  updated_at: string;
  staff_name?: string | null;
  staff_role?: string | null;
  staff_specialization?: string | null;
  staff_phone?: string | null;
  staff_email?: string | null;
  permissions?: PermissionRecord[];
  permission_codes?: string[];
}

interface StaffOption {
  id: number;
  full_name: string;
  role: string;
  specialization?: string;
  status?: string;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Администратор системы', color: '#0F3C64', bg: '#EBF5FA' },
  { value: 'doctor', label: 'Врач травматолог-ортопед', color: '#0284C7', bg: '#E0F2FE' },
  { value: 'nurse', label: 'Медицинская сестра', color: '#166534', bg: '#DCFCE7' },
  { value: 'cashier', label: 'Кассир / Регистратор', color: '#B45309', bg: '#FEF3C7' },
  { value: 'manager', label: 'Руководитель / Управляющий', color: '#7C3AED', bg: '#F3E8FF' }
];

const PRESET_COLORS = [
  { label: 'Синий сапфир', hex: '#0F3C64' },
  { label: 'Лазурный бриз', hex: '#0284C7' },
  { label: 'Изумрудный', hex: '#166534' },
  { label: 'Янтарный', hex: '#D97706' },
  { label: 'Фиолетовый', hex: '#7C3AED' },
  { label: 'Рубиновый', hex: '#E11D48' },
  { label: 'Глубокий индиго', hex: '#4338CA' },
  { label: 'Морская волна', hex: '#0D9488' },
  { label: 'Серый сланец', hex: '#64748B' }
];

export default function UsersManager() {
  const { currentUser, token } = useAuth();

  // Tab State: 'users' or 'permissions'
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');

  // Users State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Permissions State
  const [permissionsList, setPermissionsList] = useState<PermissionRecord[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  // Filters for Users
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filters for Permissions
  const [permissionSearchQuery, setPermissionSearchQuery] = useState('');

  // User Edit / Create Dialog State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'doctor',
    staff_id: '' as string | number,
    is_active: true,
    is_permanent: true,
    expires_at: '',
    auto_lock_minutes: 15,
    main_screen: '/',
    selectedPermissionIds: [] as number[]
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Reset Password Dialog State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSaving, setResetSaving] = useState(false);

  // Delete User Dialog State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserRecord | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // Permission Edit / Create Dialog State
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [isEditingPermission, setIsEditingPermission] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(null);
  const [permissionFormData, setPermissionFormData] = useState({
    code: '',
    name: '',
    description: '',
    badge_color: '#0F3C64',
    is_system: 0
  });
  const [permissionModalError, setPermissionModalError] = useState<string | null>(null);
  const [permissionModalSaving, setPermissionModalSaving] = useState(false);

  // Delete Permission Dialog State
  const [deletePermissionModalOpen, setDeletePermissionModalOpen] = useState(false);
  const [deleteTargetPermission, setDeleteTargetPermission] = useState<PermissionRecord | null>(null);
  const [deletePermissionSaving, setDeletePermissionSaving] = useState(false);

  // Fetch Users, Staff, and Permissions
  const fetchData = useCallback(async () => {
    setLoading(true);
    setPermissionsLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [usersRes, staffRes, permsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users`, { headers }),
        fetch(`${API_BASE_URL}/api/staff`, { headers }),
        fetch(`${API_BASE_URL}/api/permissions`, { headers })
      ]);

      if (!usersRes.ok) {
        throw new Error(`Ошибка загрузки пользователей: HTTP ${usersRes.status}`);
      }
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffList(staffData.staff || (Array.isArray(staffData) ? staffData : []));
      }

      if (permsRes.ok) {
        const permsData = await permsRes.json();
        setPermissionsList(permsData.permissions || []);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка связи с сервером');
    } finally {
      setLoading(false);
      setPermissionsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toast auto-clear
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Filtered and Sorted Users List (active first, then alphabetical А..Я)
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        // Role filter
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        // Status filter
        if (statusFilter === 'active' && u.is_active !== 1) return false;
        if (statusFilter === 'blocked' && u.is_active !== 0) return false;

        // Text search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesUsername = u.username.toLowerCase().includes(q);
          const matchesName = u.full_name.toLowerCase().includes(q);
          const matchesStaff = u.staff_name ? u.staff_name.toLowerCase().includes(q) : false;
          const matchesRole = u.role.toLowerCase().includes(q);
          const matchesPerm = u.permissions ? u.permissions.some(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) : false;
          return matchesUsername || matchesName || matchesStaff || matchesRole || matchesPerm;
        }
        return true;
      })
      .sort((a, b) => {
        // 1. Active first (is_active: 1 before 0)
        const activeA = a.is_active === 1 ? 1 : 0;
        const activeB = b.is_active === 1 ? 1 : 0;
        if (activeB !== activeA) {
          return activeB - activeA;
        }
        // 2. Alphabetical order А..Я by full_name (fallback to username)
        const nameA = (a.full_name || a.username || '').trim();
        const nameB = (b.full_name || b.username || '').trim();
        return nameA.localeCompare(nameB, 'ru', { sensitivity: 'base' });
      });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Filtered Permissions List
  const filteredPermissions = useMemo(() => {
    return permissionsList.filter((p) => {
      if (!permissionSearchQuery.trim()) return true;
      const q = permissionSearchQuery.toLowerCase().trim();
      return (
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    });
  }, [permissionsList, permissionSearchQuery]);

  // Statistics for Users
  const userStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active === 1).length;
    const linked = users.filter((u) => u.staff_id != null).length;
    const blocked = total - active;
    return { total, active, linked, blocked };
  }, [users]);

  // Statistics for Permissions
  const permissionStats = useMemo(() => {
    const total = permissionsList.length;
    const system = permissionsList.filter(p => p.is_system === 1).length;
    const custom = total - system;
    const totalAssignments = permissionsList.reduce((acc, p) => acc + (p.assigned_users_count || p.users_count || 0), 0);
    return { total, system, custom, totalAssignments };
  }, [permissionsList]);

  // Get default permission id
  const defaultPermission = useMemo(() => {
    return permissionsList.find(p => p.code === 'default');
  }, [permissionsList]);

  // Dynamically compute permitted screens for the user being created/edited
  const selectedUserPermCodes = useMemo(() => {
    return permissionsList
      .filter((p) => formData.selectedPermissionIds.includes(p.id))
      .map((p) => p.code);
  }, [permissionsList, formData.selectedPermissionIds]);

  const availableScreens = useMemo(() => {
    return getPermittedScreens(selectedUserPermCodes);
  }, [selectedUserPermCodes]);

  // Open Create User Dialog
  const handleOpenCreateUser = () => {
    setIsEditing(false);
    setSelectedUserId(null);

    // Initial permissions: default permission always preselected
    const initialPermIds: number[] = [];
    if (defaultPermission) {
      initialPermIds.push(defaultPermission.id);
    }

    setFormData({
      username: '',
      password: '',
      full_name: '',
      role: 'doctor',
      staff_id: '',
      is_active: true,
      is_permanent: true,
      expires_at: '',
      auto_lock_minutes: 15,
      main_screen: '/',
      selectedPermissionIds: initialPermIds
    });
    setModalError(null);
    setShowPassword(false);
    setUserModalOpen(true);
  };

  // Open Edit User Dialog
  const handleOpenEditUser = (user: UserRecord) => {
    setIsEditing(true);
    setSelectedUserId(user.id);

    // Get current permission IDs from user
    let permIds: number[] = [];
    if (user.permissions && user.permissions.length > 0) {
      permIds = user.permissions.map(p => p.id);
    } else if (defaultPermission) {
      permIds = [defaultPermission.id];
    }

    setFormData({
      username: user.username,
      password: '', // Blank unless changing
      full_name: user.full_name,
      role: user.role,
      staff_id: user.staff_id || '',
      is_active: user.is_active === 1,
      is_permanent: !user.expires_at,
      expires_at: user.expires_at || '',
      auto_lock_minutes: user.auto_lock_minutes || 15,
      main_screen: user.main_screen || '/',
      selectedPermissionIds: permIds
    });
    setModalError(null);
    setShowPassword(false);
    setUserModalOpen(true);
  };

  // Toggle permission selection in User Dialog
  const handleTogglePermissionId = (id: number) => {
    setFormData(prev => {
      const exists = prev.selectedPermissionIds.includes(id);
      let updated: number[];
      if (exists) {
        updated = prev.selectedPermissionIds.filter(x => x !== id);
      } else {
        updated = [...prev.selectedPermissionIds, id];
      }
      return { ...prev, selectedPermissionIds: updated };
    });
  };

  // Quick preset: Select default permission
  const handleSetDefaultPermissions = () => {
    if (defaultPermission) {
      setFormData(prev => ({
        ...prev,
        selectedPermissionIds: [defaultPermission.id]
      }));
    }
  };

  // Quick preset: Select sysadmin + administrator + default
  const handleSetAdminPermissions = () => {
    const adminCodes = ['sysadmin', 'administrator', 'default'];
    const matched = permissionsList.filter(p => adminCodes.includes(p.code)).map(p => p.id);
    setFormData(prev => ({
      ...prev,
      selectedPermissionIds: matched
    }));
  };

  // Quick preset: Select all permissions
  const handleSelectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      selectedPermissionIds: permissionsList.map(p => p.id)
    }));
  };

  // When staff selection changes, autofill full_name if empty
  const handleStaffSelect = (staffIdStr: string) => {
    const staffId = staffIdStr ? Number(staffIdStr) : '';
    const selectedStaff = staffList.find((s) => s.id === staffId);
    setFormData((prev) => ({
      ...prev,
      staff_id: staffId,
      full_name: !prev.full_name && selectedStaff ? selectedStaff.full_name : prev.full_name
    }));
  };

  // Save User (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.username.trim()) {
      setModalError('Логин пользователя обязателен');
      return;
    }
    if (!formData.full_name.trim()) {
      setModalError('ФИО пользователя обязательно');
      return;
    }
    if (!isEditing && (!formData.password || formData.password.length < 4)) {
      setModalError('Пароль для нового пользователя должен содержать не менее 4 символов');
      return;
    }

    // Ensure at least default permission is included if empty
    let finalPermIds = [...formData.selectedPermissionIds];
    if (finalPermIds.length === 0 && defaultPermission) {
      finalPermIds.push(defaultPermission.id);
    }

    setModalSaving(true);
    try {
      const payload: any = {
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        role: formData.role,
        staff_id: formData.staff_id ? Number(formData.staff_id) : null,
        is_active: formData.is_active ? 1 : 0,
        expires_at: formData.is_permanent ? null : formData.expires_at.trim() || null,
        auto_lock_minutes: Number(formData.auto_lock_minutes) || 15,
        main_screen: formData.main_screen || '/',
        permission_ids: finalPermIds
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const url = isEditing
        ? `${API_BASE_URL}/api/users/${selectedUserId}`
        : `${API_BASE_URL}/api/users`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при сохранении пользователя');
      }

      setUserModalOpen(false);
      setSuccessMessage(data.message || (isEditing ? 'Пользователь обновлен' : 'Пользователь создан'));
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Ошибка сохранения');
    } finally {
      setModalSaving(false);
    }
  };

  // Quick Toggle Active/Blocked
  const handleToggleStatus = async (user: UserRecord) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/toggle-status`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка изменения статуса');
      }
      setSuccessMessage(data.message);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Open Reset Password Dialog
  const handleOpenResetPassword = (user: UserRecord) => {
    setResetTargetUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setResetError(null);
    setResetModalOpen(true);
  };

  // Submit Password Reset
  const handleSubmitResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setResetError('Пароль должен содержать не менее 4 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Введенные пароли не совпадают');
      return;
    }

    setResetSaving(true);
    setResetError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${resetTargetUser?.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ newPassword: newPassword.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка сброса пароля');
      }
      setResetModalOpen(false);
      setSuccessMessage(data.message || 'Пароль успешно изменен');
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setResetSaving(false);
    }
  };

  // Open Delete User Dialog
  const handleOpenDeleteUser = (user: UserRecord) => {
    setDeleteTargetUser(user);
    setDeleteModalOpen(true);
  };

  // Confirm Delete User
  const handleConfirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setDeleteSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${deleteTargetUser.id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка удаления пользователя');
      }
      setDeleteModalOpen(false);
      setSuccessMessage(data.message || 'Пользователь удален');
      fetchData();
    } catch (err: any) {
      setError(err.message);
      setDeleteModalOpen(false);
    } finally {
      setDeleteSaving(false);
    }
  };

  // Open Create Permission Dialog
  const handleOpenCreatePermission = () => {
    setIsEditingPermission(false);
    setSelectedPermissionId(null);
    setPermissionFormData({
      code: '',
      name: '',
      description: '',
      badge_color: '#0F3C64',
      is_system: 0
    });
    setPermissionModalError(null);
    setPermissionModalOpen(true);
  };

  // Open Edit Permission Dialog
  const handleOpenEditPermission = (perm: PermissionRecord) => {
    setIsEditingPermission(true);
    setSelectedPermissionId(perm.id);
    setPermissionFormData({
      code: perm.code,
      name: perm.name,
      description: perm.description || '',
      badge_color: perm.badge_color || '#0F3C64',
      is_system: perm.is_system || 0
    });
    setPermissionModalError(null);
    setPermissionModalOpen(true);
  };

  // Save Permission (Create or Update)
  const handleSavePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    setPermissionModalError(null);

    if (!permissionFormData.code.trim()) {
      setPermissionModalError('Код разрешения обязателен (на латинице, например: sysadmin)');
      return;
    }
    if (!permissionFormData.name.trim()) {
      setPermissionModalError('Наименование разрешения обязательно');
      return;
    }

    setPermissionModalSaving(true);
    try {
      const payload = {
        code: permissionFormData.code.trim().toLowerCase(),
        name: permissionFormData.name.trim(),
        description: permissionFormData.description.trim(),
        badge_color: permissionFormData.badge_color.trim() || '#0F3C64'
      };

      const url = isEditingPermission
        ? `${API_BASE_URL}/api/permissions/${selectedPermissionId}`
        : `${API_BASE_URL}/api/permissions`;
      const method = isEditingPermission ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при сохранении разрешения');
      }

      setPermissionModalOpen(false);
      setSuccessMessage(data.message || (isEditingPermission ? 'Разрешение обновлено' : 'Разрешение создано'));
      fetchData();
    } catch (err: any) {
      setPermissionModalError(err.message || 'Ошибка сохранения разрешения');
    } finally {
      setPermissionModalSaving(false);
    }
  };

  // Open Delete Permission Dialog
  const handleOpenDeletePermission = (perm: PermissionRecord) => {
    setDeleteTargetPermission(perm);
    setDeletePermissionModalOpen(true);
  };

  // Confirm Delete Permission
  const handleConfirmDeletePermission = async () => {
    if (!deleteTargetPermission) return;
    setDeletePermissionSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/permissions/${deleteTargetPermission.id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при удалении разрешения');
      }
      setDeletePermissionModalOpen(false);
      setSuccessMessage(data.message || 'Разрешение успешно удалено');
      fetchData();
    } catch (err: any) {
      setError(err.message);
      setDeletePermissionModalOpen(false);
    } finally {
      setDeletePermissionSaving(false);
    }
  };

  const getRoleConfig = (role: string) => {
    return (
      ROLE_OPTIONS.find((r) => r.value === role) || {
        value: role,
        label: role,
        color: '#475569',
        bg: '#F1F5F9'
      }
    );
  };

  // Accounting and summary totals for Users grid footer
  const usersTotals = useMemo(() => {
    const totalCount = filteredUsers.length;
    const activeCount = filteredUsers.filter((u) => u.is_active === 1).length;
    const blockedCount = totalCount - activeCount;
    const linkedCount = filteredUsers.filter((u) => u.staff_id != null).length;
    const permanentCount = filteredUsers.filter((u) => !u.expires_at).length;
    return {
      totalCount,
      activeCount,
      blockedCount,
      linkedCount,
      permanentCount
    };
  }, [filteredUsers]);

  // Summary totals for Permissions grid footer
  const permissionsTotals = useMemo(() => {
    const totalCount = filteredPermissions.length;
    const systemCount = filteredPermissions.filter(p => p.is_system === 1).length;
    const customCount = totalCount - systemCount;
    const totalAssignments = filteredPermissions.reduce((acc, p) => acc + (p.assigned_users_count || p.users_count || 0), 0);
    return {
      totalCount,
      systemCount,
      customCount,
      totalAssignments
    };
  }, [filteredPermissions]);

  // DataGrid Column Definitions for Users (Zero horizontal scroll, flexible layout)
  const userColumns: GridColDef<UserRecord>[] = useMemo(() => [
    {
      field: 'full_name',
      headerName: 'Пользователь / Логин',
      flex: 1.8,
      minWidth: 170,
      valueGetter: (_value, row) => `${row.full_name || ''} ${row.username || ''}`,
      sortComparator: (v1, v2) => (v1 || '').localeCompare(v2 || '', 'ru', { sensitivity: 'base' }),
      renderCell: (params) => {
        const u = params.row;
        const roleCfg = getRoleConfig(u.role);
        const isCurrent = currentUser?.id === u.id;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 0.8, width: '100%', minWidth: 0 }}>
            <Avatar
              sx={{
                bgcolor: roleCfg.color,
                color: '#FFFFFF',
                width: 32,
                height: 32,
                fontWeight: 700,
                fontSize: '0.82rem',
                flexShrink: 0
              }}
            >
              {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.84rem', lineHeight: 1.25 }}>
                  {u.full_name}
                </Typography>
                {isCurrent && (
                  <Chip
                    label="Вы"
                    size="small"
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#0284C7', color: '#FFFFFF' }}
                  />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'monospace', display: 'block' }}>
                @{u.username}
              </Typography>
            </Box>
          </Box>
        );
      }
    },
    {
      field: 'role',
      headerName: 'Роль в системе',
      flex: 1.0,
      minWidth: 110,
      valueGetter: (_value, row) => {
        const r = ROLE_OPTIONS.find((x) => x.value === row.role);
        return r ? r.label : row.role;
      },
      renderCell: (params) => {
        const roleCfg = getRoleConfig(params.row.role);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip
              label={roleCfg.label}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.74rem',
                color: roleCfg.color,
                bgcolor: roleCfg.bg,
                border: `1px solid ${roleCfg.color}30`
              }}
            />
          </Box>
        );
      }
    },
    {
      field: 'permissions',
      headerName: 'Права (Permissions)',
      flex: 1.5,
      minWidth: 145,
      valueGetter: (_value, row) => (row.permissions || []).map((p: any) => p.code).join(', ') || 'default',
      renderCell: (params) => {
        const u = params.row;
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.8, alignItems: 'center', width: '100%' }}>
            {u.permissions && u.permissions.length > 0 ? (
              u.permissions.map((p) => (
                <Tooltip key={p.id} title={`${p.name}: ${p.description || 'Доступ разрешен'}`} arrow>
                  <Chip
                    label={p.code}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      bgcolor: p.badge_color || '#0F3C64',
                      color: '#FFFFFF',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  />
                </Tooltip>
              ))
            ) : (
              <Tooltip title="Базовый общесистемный доступ по умолчанию" arrow>
                <Chip
                  label="default"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    bgcolor: '#64748B',
                    color: '#FFFFFF'
                  }}
                />
              </Tooltip>
            )}
          </Box>
        );
      }
    },
    {
      field: 'main_screen',
      headerName: 'Входной экран',
      flex: 1.2,
      minWidth: 125,
      valueGetter: (_value, row) => getScreenTitleByPath(row.main_screen),
      renderCell: (params) => {
        const mainScreen = params.row.main_screen || '/';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
            <Tooltip title={`Основной экран при входе в систему: ${mainScreen}`} arrow>
              <Chip
                icon={<MedicalServicesIcon sx={{ fontSize: '13px !important', color: '#0F3C64 !important' }} />}
                label={getScreenTitleByPath(mainScreen)}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  color: '#0F3C64',
                  bgcolor: '#F0F6FA',
                  border: '1px solid #D6E4F0',
                  maxWidth: '100%',
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }
                }}
              />
            </Tooltip>
          </Box>
        );
      }
    },
    {
      field: 'staff_name',
      headerName: 'Медперсонал (Staff)',
      flex: 1.3,
      minWidth: 135,
      valueGetter: (_value, row) => row.staff_name || 'Не привязан к staff',
      renderCell: (params) => {
        const u = params.row;
        if (!u.staff_id) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                Не привязан к staff
              </Typography>
            </Box>
          );
        }
        const staffMember = staffList.find((s) => s.id === u.staff_id);
        return (
          <Box sx={{ py: 0.8, minWidth: 0, width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.82rem', lineHeight: 1.2 }}>
                {u.staff_name}
              </Typography>
              {staffMember?.status === 'archive' && (
                <Chip
                  label="В архиве"
                  size="small"
                  sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 700, border: '1px solid #CBD5E1' }}
                />
              )}
              {staffMember?.status === 'vacation' && (
                <Chip
                  label="В отпуске"
                  size="small"
                  sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 700, border: '1px solid #FCD34D' }}
                />
              )}
            </Box>
            {u.staff_specialization && (
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.2, mt: 0.3 }} noWrap>
                {u.staff_specialization}
              </Typography>
            )}
          </Box>
        );
      }
    },
    {
      field: 'is_active',
      headerName: 'Статус',
      flex: 0.9,
      minWidth: 95,
      align: 'center',
      headerAlign: 'center',
      type: 'singleSelect',
      valueOptions: ['Активен', 'Заблокирован'],
      valueGetter: (_value, row) => (row.is_active === 1 ? 'Активен' : 'Заблокирован'),
      sortComparator: (v1, v2) => {
        // Higher value for 'Активен' so that 'desc' sorting puts Active users first
        const n1 = (v1 === 'Активен' || v1 === 1 || v1 === true) ? 1 : 0;
        const n2 = (v2 === 'Активен' || v2 === 1 || v2 === true) ? 1 : 0;
        return n1 - n2;
      },
      renderCell: (params) => {
        const u = params.row;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Tooltip title={u.is_active === 1 ? 'Нажмите для блокировки' : 'Нажмите для активации'}>
              <Chip
                label={u.is_active === 1 ? 'Активен' : 'Заблокирован'}
                size="small"
                onClick={() => handleToggleStatus(u)}
                clickable
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  bgcolor: u.is_active === 1 ? '#DCFCE7' : '#F1F5F9',
                  color: u.is_active === 1 ? '#166534' : '#64748B',
                  border: `1px solid ${u.is_active === 1 ? '#86EFAC' : '#CBD5E1'}`
                }}
              />
            </Tooltip>
          </Box>
        );
      }
    },
    {
      field: 'expires_at',
      headerName: 'Срок действия',
      flex: 0.8,
      minWidth: 85,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (_value, row) => row.expires_at || 'Бессрочно',
      renderCell: (params) => {
        const u = params.row;
        const isExpired = u.expires_at ? new Date(u.expires_at).getTime() < Date.now() : false;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {u.expires_at ? (
              <Chip
                label={isExpired ? `Просрочен: ${u.expires_at}` : `До: ${u.expires_at}`}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.70rem',
                  bgcolor: isExpired ? '#FEE2E2' : '#F8FAFC',
                  color: isExpired ? '#DC2626' : '#475569',
                  border: `1px solid ${isExpired ? '#FCA5A5' : '#E2E8F0'}`
                }}
              />
            ) : (
              <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>
                Бессрочно
              </Typography>
            )}
          </Box>
        );
      }
    },
    {
      field: 'auto_lock_minutes',
      headerName: 'Автоблок',
      flex: 0.8,
      minWidth: 80,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (_value, row) => (row.auto_lock_minutes > 0 ? `${row.auto_lock_minutes} мин` : 'Отключена'),
      renderCell: (params) => {
        const u = params.row;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, height: '100%' }}>
            <LockClockIcon sx={{ fontSize: 15, color: '#64748B' }} />
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
              {u.auto_lock_minutes > 0 ? `${u.auto_lock_minutes} мин` : 'Отключена'}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const u = params.row;
        const isCurrent = currentUser?.id === u.id;
        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '100%', gap: 0.3 }}>
            <Tooltip title="Редактировать пользователя и права">
              <IconButton
                size="small"
                onClick={() => handleOpenEditUser(u)}
                sx={{ color: '#0F3C64', p: 0.5, '&:hover': { bgcolor: '#F0F9FF' } }}
              >
                <EditIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Сменить пароль">
              <IconButton
                size="small"
                onClick={() => handleOpenResetPassword(u)}
                sx={{ color: '#0284C7', p: 0.5, '&:hover': { bgcolor: '#F0F9FF' } }}
              >
                <VpnKeyIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Удалить пользователя">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDeleteUser(u)}
                  disabled={isCurrent || (u.role === 'admin' && userStats.total === 1)}
                  sx={{ color: '#DC2626', p: 0.5, '&:hover': { bgcolor: '#FEF2F2' } }}
                >
                  <DeleteIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      }
    }
  ], [currentUser, staffList, userStats.total]);

  // DataGrid Column Definitions for Permissions
  const permissionColumns: GridColDef<PermissionRecord>[] = useMemo(() => [
    {
      field: 'code',
      headerName: 'Код (Code)',
      flex: 1.1,
      minWidth: 120,
      renderCell: (params) => {
        const p = params.row;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip
              label={p.code}
              size="small"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '0.74rem',
                bgcolor: p.badge_color || '#0F3C64',
                color: '#FFFFFF',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            />
          </Box>
        );
      }
    },
    {
      field: 'name',
      headerName: 'Наименование',
      flex: 1.4,
      minWidth: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'description',
      headerName: 'Описание назначения',
      flex: 2.2,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ py: 1, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>
          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
            {params.value || '—'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'badge_color',
      headerName: 'Цвет бейджа',
      flex: 0.9,
      minWidth: 110,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              bgcolor: params.value,
              border: '2px solid #FFFFFF',
              boxShadow: '0 0 0 1px #CBD5E1'
            }}
          />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748B', fontWeight: 600 }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'is_system',
      headerName: 'Тип',
      flex: 0.8,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (_value, row) => (row.is_system === 1 ? 'Системное' : 'Пользовательское'),
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {params.row.is_system === 1 ? (
            <Chip
              label="Системное"
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.7rem',
                bgcolor: '#F3E8FF',
                color: '#7C3AED',
                border: '1px solid #DDD6FE'
              }}
            />
          ) : (
            <Chip
              label="Пользовательское"
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.7rem',
                bgcolor: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1'
              }}
            />
          )}
        </Box>
      )
    },
    {
      field: 'assigned_users_count',
      headerName: 'Пользователей',
      flex: 0.8,
      minWidth: 95,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (_value, row) => (row.assigned_users_count !== undefined ? row.assigned_users_count : (row.users_count || 0)),
      renderCell: (params) => {
        const count = params.value;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Chip
              label={`${count} чел.`}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.72rem',
                bgcolor: Number(count) > 0 ? '#EFF6FF' : '#F8FAFC',
                color: Number(count) > 0 ? '#1D4ED8' : '#94A3B8',
                border: `1px solid ${Number(count) > 0 ? '#BFDBFE' : '#E2E8F0'}`
              }}
            />
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 90,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const p = params.row;
        const usersCount = p.assigned_users_count !== undefined ? p.assigned_users_count : (p.users_count || 0);
        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '100%', gap: 0.5 }}>
            <Tooltip title="Редактировать разрешение">
              <IconButton
                size="small"
                onClick={() => handleOpenEditPermission(p)}
                sx={{ color: '#7C3AED', p: 0.5, '&:hover': { bgcolor: '#F5F3FF' } }}
              >
                <EditIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>

            <Tooltip
              title={
                p.is_system === 1
                  ? 'Системные разрешения защищены от удаления'
                  : usersCount > 0
                  ? `Нельзя удалить: назначено ${usersCount} пользователям`
                  : 'Удалить разрешение'
              }
            >
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDeletePermission(p)}
                  disabled={p.is_system === 1 || usersCount > 0}
                  sx={{ color: '#DC2626', p: 0.5, '&:hover': { bgcolor: '#FEF2F2' } }}
                >
                  <DeleteIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      }
    }
  ], []);

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* Top Header Card */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#0F3C64', width: 44, height: 44, boxShadow: '0 4px 10px rgba(15, 60, 100, 0.25)' }}>
              <BadgeIcon sx={{ fontSize: 24, color: '#FFFFFF' }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.3px' }}>
                Пользователи и безопасность системы
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.2 }}>
                Администрирование учетных записей, ролей, многоуровневых разрешений (Permissions), защита ПДн (152-ФЗ)
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Tooltip title="Обновить все данные с сервера">
            <IconButton onClick={fetchData} disabled={loading} sx={{ border: '1px solid #CBD5E1', borderRadius: 2, bgcolor: '#FFFFFF' }}>
              <RefreshIcon sx={{ color: '#0F3C64', fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          {activeTab === 'users' ? (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenCreateUser}
              sx={{
                bgcolor: '#0F3C64',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                px: 2.2,
                boxShadow: '0 2px 8px rgba(15, 60, 100, 0.25)',
                '&:hover': { bgcolor: '#156C9C' }
              }}
            >
              Добавить пользователя
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreatePermission}
              sx={{
                bgcolor: '#7C3AED',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                px: 2.2,
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                '&:hover': { bgcolor: '#6D28D9' }
              }}
            >
              Добавить разрешение
            </Button>
          )}
        </Box>
      </Box>

      {/* Global Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 2.5, borderRadius: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Navigation Tabs (Users vs Permissions) */}
      <Paper sx={{ mb: 3, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', p: 0.5, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            minHeight: 46,
            '& .MuiTab-root': {
              minHeight: 46,
              fontWeight: 700,
              fontSize: '0.86rem',
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              transition: 'all 0.15s ease',
              color: '#64748B',
              '&.Mui-selected': {
                color: '#0F3C64',
                bgcolor: '#F0F6FA'
              }
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#0F3C64',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab
            value="users"
            icon={<PeopleIcon sx={{ fontSize: 19 }} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Учетные записи пользователей</span>
                <Chip
                  label={users.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    bgcolor: activeTab === 'users' ? '#0F3C64' : '#E2E8F0',
                    color: activeTab === 'users' ? '#FFFFFF' : '#475569'
                  }}
                />
              </Box>
            }
          />
          <Tab
            value="permissions"
            icon={<ShieldIcon sx={{ fontSize: 19 }} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Типы разрешений и права доступа (Permissions)</span>
                <Chip
                  label={permissionsList.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    bgcolor: activeTab === 'permissions' ? '#7C3AED' : '#E2E8F0',
                    color: activeTab === 'permissions' ? '#FFFFFF' : '#475569'
                  }}
                />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* TAB 1: USERS CRUD */}
      {activeTab === 'users' && (
        <Box>
          {/* Summary Stat Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            <Card sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                    Всего пользователей
                  </Typography>
                  <PeopleIcon sx={{ color: '#0F3C64', fontSize: 22 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', mt: 0.5 }}>
                  {userStats.total}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2.5, border: '1px solid #BBF7D0', bgcolor: '#F0FDF4', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                    Активных записей
                  </Typography>
                  <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 22 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#166534', mt: 0.5 }}>
                  {userStats.active}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2.5, border: '1px solid #BAE6FD', bgcolor: '#F0F9FF', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                    Связаны со staff
                  </Typography>
                  <MedicalServicesIcon sx={{ color: '#0284C7', fontSize: 22 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0369A1', mt: 0.5 }}>
                  {userStats.linked}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2.5, border: '1px solid #FED7AA', bgcolor: '#FFFBEB', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                    Заблокировано
                  </Typography>
                  <BlockIcon sx={{ color: '#D97706', fontSize: 22 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#92400E', mt: 0.5 }}>
                  {userStats.blocked}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Filter and Search Bar */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid #E2E8F0', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Поиск по логину, имени, сотруднику, роли или разрешению..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#64748B', fontSize: 20 }} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ flex: 1, minWidth: 280 }}
            />

            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel>Фильтр по роли</InputLabel>
              <Select
                value={roleFilter}
                label="Фильтр по роли"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">Все роли ({users.length})</MenuItem>
                {ROLE_OPTIONS.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Статус</InputLabel>
              <Select
                value={statusFilter}
                label="Статус"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Все статусы</MenuItem>
                <MenuItem value="active">Только активные ({userStats.active})</MenuItem>
                <MenuItem value="blocked">Заблокированные ({userStats.blocked})</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          {/* Users Data Grid */}
          <Paper sx={{ width: '100%', borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <DataGrid
              autoHeight
              getRowHeight={() => 'auto'}
              showToolbar
              rows={filteredUsers}
              columns={userColumns}
              loading={loading}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
                sorting: {
                  sortModel: [
                    { field: 'is_active', sort: 'desc' }
                  ]
                }
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              disableRowSelectionOnClick
              columnHeaderHeight={52}
              localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
              slots={{
                toolbar: CustomToolbar,
                footer: UsersGridFooter as any
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 400 },
                },
                footer: {
                  totals: usersTotals
                } as any
              }}
              sx={{
                width: '100%',
                border: 'none',
                '& .MuiDataGrid-main': {
                  width: '100%'
                },
                '& .MuiDataGrid-virtualScroller': {
                  overflowX: 'hidden'
                },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: '#F8FAFC',
                  color: '#0F3C64',
                  fontWeight: 700,
                  borderBottom: '2px solid #E2E8F0',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #EDF2F7',
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  '&:focus, &:focus-within': {
                    outline: 'none !important'
                  }
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: '#F8FAFC'
                }
              }}
            />
          </Paper>
        </Box>
      )}

      {/* TAB 2: PERMISSIONS CRUD */}
      {activeTab === 'permissions' && (
        <Box>
          {/* Summary Stat Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            <Card sx={{ borderRadius: 2.5, border: '1px solid #DDD6FE', bgcolor: '#F5F3FF', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6D28D9', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                    Всего типов разрешений
                  </Typography>
                  <ShieldIcon sx={{ color: '#7C3AED', fontSize: 22 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#6D28D9', mt: 0.5 }}>
                  {permissionStats.total}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2.5, border: '1px solid #BAE6FD', bgcolor: '#F0F9FF', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                    Системных базовых
                  </Typography>
                  <KeyIcon sx={{ color: '#0284C7', fontSize: 22 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0369A1', mt: 0.5 }}>
                  {permissionStats.system}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2.5, border: '1px solid #BBF7D0', bgcolor: '#F0FDF4', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                    Пользовательских
                  </Typography>
                  <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 22 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#166534', mt: 0.5 }}>
                  {permissionStats.custom}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                    Всего назначений
                  </Typography>
                  <PeopleIcon sx={{ color: '#0F3C64', fontSize: 22 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', mt: 0.5 }}>
                  {permissionStats.totalAssignments}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Permissions Search & Info Bar */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid #E2E8F0', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Поиск по коду, наименованию или описанию разрешения..."
              value={permissionSearchQuery}
              onChange={(e) => setPermissionSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#64748B', fontSize: 20 }} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ flex: 1, minWidth: 300 }}
            />

            <Typography variant="caption" sx={{ color: '#64748B', bgcolor: '#F8FAFC', p: 1, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
              ℹ️ Системные разрешения (is_system = 1) защищены от удаления, так как к ним привязана бизнес-логика.
            </Typography>
          </Paper>

          {/* Permissions Data Grid */}
          <Paper sx={{ width: '100%', borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <DataGrid
              autoHeight
              getRowHeight={() => 'auto'}
              showToolbar
              rows={filteredPermissions}
              columns={permissionColumns}
              loading={permissionsLoading}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
                sorting: {
                  sortModel: [
                    { field: 'is_system', sort: 'desc' },
                    { field: 'name', sort: 'asc' }
                  ]
                }
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              disableRowSelectionOnClick
              columnHeaderHeight={52}
              localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
              slots={{
                toolbar: CustomToolbar,
                footer: PermissionsGridFooter as any
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 400 },
                },
                footer: {
                  totals: permissionsTotals
                } as any
              }}
              sx={{
                width: '100%',
                border: 'none',
                '& .MuiDataGrid-main': {
                  width: '100%'
                },
                '& .MuiDataGrid-virtualScroller': {
                  overflowX: 'hidden'
                },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: '#F8FAFC',
                  color: '#0F3C64',
                  fontWeight: 700,
                  borderBottom: '2px solid #E2E8F0',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #EDF2F7',
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  '&:focus, &:focus-within': {
                    outline: 'none !important'
                  }
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: '#F8FAFC'
                }
              }}
            />
          </Paper>
        </Box>
      )}

      {/* ========================================================================= */}
      {/* DIALOG: CREATE / EDIT USER                                                */}
      {/* ========================================================================= */}
      <Dialog
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, color: '#0F3C64' }}>
          <SecurityIcon sx={{ color: '#0F3C64', fontSize: 26 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {isEditing ? `Редактирование пользователя: @${formData.username}` : 'Создание нового пользователя'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Настройка учетной записи, роли и прав доступа в МИС «ОртоERP»
            </Typography>
          </Box>
        </DialogTitle>

        <Box component="form" onSubmit={handleSaveUser}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, pt: 1.5 }}>
            {modalError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {modalError}
              </Alert>
            )}

            {/* Username & Full Name */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Логин пользователя (Username)"
                placeholder="doctor_ivanov, admin2..."
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                fullWidth
                size="small"
                required
                helperText="Уникальный системный логин (на латинице)"
              />

              <TextField
                label="ФИО пользователя"
                placeholder="Иванов Иван Иванович"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                fullWidth
                size="small"
                required
                helperText="Отображается в интерфейсе и протоколах"
              />
            </Box>

            {/* Role & Staff Linkage */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Системная роль</InputLabel>
                <Select
                  value={formData.role}
                  label="Системная роль"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Привязка к медперсоналу (Staff)</InputLabel>
                <Select
                  value={formData.staff_id}
                  label="Привязка к медперсоналу (Staff)"
                  onChange={(e) => handleStaffSelect(String(e.target.value))}
                >
                  <MenuItem value="">
                    <em>Не привязан (Отдельный аккаунт)</em>
                  </MenuItem>
                  {staffList.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.full_name} ({s.role}){s.status === 'archive' ? ' — [Архивный сотрудник]' : s.status === 'vacation' ? ' — [В отпуске]' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* MULTI-PERMISSIONS SELECTION SECTION */}
            <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShieldIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>
                    Назначенные права доступа (Permissions):
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSetDefaultPermissions}
                    sx={{ fontSize: '0.72rem', py: 0.3, textTransform: 'none', borderColor: '#CBD5E1', color: '#475569' }}
                  >
                    По умолчанию (default)
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSetAdminPermissions}
                    sx={{ fontSize: '0.72rem', py: 0.3, textTransform: 'none', borderColor: '#DDD6FE', color: '#6D28D9' }}
                  >
                    Админ (sysadmin+admin)
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSelectAllPermissions}
                    sx={{ fontSize: '0.72rem', py: 0.3, textTransform: 'none', borderColor: '#BAE6FD', color: '#0369A1' }}
                  >
                    Выбрать все
                  </Button>
                </Box>
              </Box>

              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                Нажмите на карточку права, чтобы включить или отключить его для пользователя. Допускается несколько прав одновременно:
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.2 }}>
                {permissionsList.map((perm) => {
                  const isSelected = formData.selectedPermissionIds.includes(perm.id);

                  return (
                    <Box
                      key={perm.id}
                      onClick={() => handleTogglePermissionId(perm.id)}
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: '1.5px solid',
                        borderColor: isSelected ? perm.badge_color || '#0F3C64' : '#E2E8F0',
                        bgcolor: isSelected ? '#FFFFFF' : '#F1F5F9',
                        boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.2,
                        '&:hover': {
                          borderColor: perm.badge_color || '#0F3C64',
                          bgcolor: '#FFFFFF'
                        }
                      }}
                    >
                      <Switch
                        checked={isSelected}
                        onChange={() => {}} // handled by parent onClick
                        size="small"
                        sx={{ mt: -0.3 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
                          <Chip
                            label={perm.code}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              bgcolor: perm.badge_color || '#0F3C64',
                              color: '#FFFFFF'
                            }}
                          />
                          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#1E293B' }} noWrap>
                            {perm.name}
                          </Typography>
                        </Box>
                        {perm.description && (
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.25 }}>
                            {perm.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>

            {/* MAIN (ENTER) SCREEN SELECTION */}
            <Paper sx={{ p: 2, bgcolor: '#F0F9FF', borderRadius: 2.5, border: '1px solid #BAE6FD' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MedicalServicesIcon sx={{ color: '#0284C7', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369A1' }}>
                  Главный (входной) экран при авторизации:
                </Typography>
              </Box>

              <FormControl fullWidth size="small" sx={{ bgcolor: '#FFFFFF', borderRadius: 1.5 }}>
                <InputLabel id="main-screen-select-label">Основной экран</InputLabel>
                <Select
                  labelId="main-screen-select-label"
                  value={formData.main_screen || '/'}
                  label="Основной экран"
                  onChange={(e) => setFormData({ ...formData, main_screen: e.target.value })}
                >
                  {availableScreens.map((s) => (
                    <MenuItem key={s.path} value={s.path}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Chip
                            size="small"
                            label={s.groupTitle}
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#E0F2FE', color: '#0284C7' }}
                          />
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F3C64' }}>
                            {s.text}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                          {s.path}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" sx={{ color: '#0369A1', mt: 0.8, display: 'block' }}>
                💡 Пользователь перенаправляется на этот экран сразу после успешного входа в систему. Доступны только те экраны, на которые выданы разрешения.
              </Typography>
            </Paper>

            {/* Password Field */}
            <TextField
              label={isEditing ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль доступа'}
              placeholder={isEditing ? '••••••••' : 'Введите пароль доступа...'}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              fullWidth
              size="small"
              required={!isEditing}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="переключить видимость"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
              helperText="Хэшируется алгоритмом PBKDF2-SHA512 (минимум 4 символа)"
            />

            {/* Auto Lock Timeout */}
            <FormControl size="small" fullWidth>
              <InputLabel>Таймаут автоблокировки при бездействии</InputLabel>
              <Select
                value={formData.auto_lock_minutes}
                label="Таймаут автоблокировки при бездействии"
                onChange={(e) => setFormData({ ...formData, auto_lock_minutes: Number(e.target.value) })}
              >
                <MenuItem value={5}>5 минут (Высокая безопасность)</MenuItem>
                <MenuItem value={10}>10 минут</MenuItem>
                <MenuItem value={15}>15 минут (Рекомендуется по 152-ФЗ)</MenuItem>
                <MenuItem value={30}>30 минут</MenuItem>
                <MenuItem value={60}>1 час</MenuItem>
                <MenuItem value={0}>Отключена (Не рекомендуется)</MenuItem>
              </Select>
            </FormControl>

            {/* Expiration Controls */}
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_permanent}
                    onChange={(e) => setFormData({ ...formData, is_permanent: e.target.checked })}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    Бессрочная учетная запись
                  </Typography>
                }
              />

              {!formData.is_permanent && (
                <TextField
                  type="date"
                  label="Срок действия учетной записи (до)"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  fullWidth
                  size="small"
                  slotProps={{
                    inputLabel: { shrink: true }
                  }}
                  sx={{ mt: 1.5 }}
                />
              )}
            </Box>

            {/* Active Status */}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  color="success"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600, color: formData.is_active ? '#166534' : '#DC2626' }}>
                  {formData.is_active ? 'Учетная запись активна' : 'Учетная запись заблокирована'}
                </Typography>
              }
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
            <Button onClick={() => setUserModalOpen(false)} sx={{ color: '#64748B', textTransform: 'none' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={modalSaving}
              sx={{
                bgcolor: '#0F3C64',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
                '&:hover': { bgcolor: '#156C9C' }
              }}
            >
              {modalSaving ? <CircularProgress size={18} color="inherit" /> : isEditing ? 'Сохранить изменения' : 'Создать пользователя'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: CREATE / EDIT PERMISSION                                          */}
      {/* ========================================================================= */}
      <Dialog
        open={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, color: '#7C3AED' }}>
          <ShieldIcon sx={{ fontSize: 26, color: '#7C3AED' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {isEditingPermission ? `Редактирование разрешения: ${permissionFormData.code}` : 'Новый тип разрешения (Permission)'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Настройка системного кода, наименования и цветового бейджа
            </Typography>
          </Box>
        </DialogTitle>

        <Box component="form" onSubmit={handleSavePermission}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, pt: 1.5 }}>
            {permissionModalError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {permissionModalError}
              </Alert>
            )}

            {/* Code */}
            <TextField
              label="Код разрешения (Code)"
              placeholder="receptionist, radiologist..."
              value={permissionFormData.code}
              onChange={(e) => setPermissionFormData({ ...permissionFormData, code: e.target.value })}
              fullWidth
              size="small"
              required
              disabled={isEditingPermission && permissionFormData.is_system === 1}
              helperText={
                isEditingPermission && permissionFormData.is_system === 1
                  ? 'Код системного разрешения защищен от изменения'
                  : 'Уникальный строковый код на латинице (например: sysadmin, doctor, nurse)'
              }
            />

            {/* Name */}
            <TextField
              label="Наименование разрешения"
              placeholder="Администратор клиники, Врач травматолог-ортопед..."
              value={permissionFormData.name}
              onChange={(e) => setPermissionFormData({ ...permissionFormData, name: e.target.value })}
              fullWidth
              size="small"
              required
              helperText="Официальное понятное название роли или права доступа"
            />

            {/* Description */}
            <TextField
              label="Описание полномочий и доступа"
              placeholder="Опишите, какие функции и модули доступны пользователям с данным правом..."
              value={permissionFormData.description}
              onChange={(e) => setPermissionFormData({ ...permissionFormData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              size="small"
              helperText="Подробное описание для подсказок и аудита безопасности"
            />

            {/* Badge Color Selector */}
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <ColorLensIcon sx={{ fontSize: 18, color: '#7C3AED' }} /> Цвет бейджа в интерфейсе:
                </Typography>

                {/* Live Preview */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Превью:</Typography>
                  <Chip
                    label={permissionFormData.code || 'badge'}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      bgcolor: permissionFormData.badge_color || '#0F3C64',
                      color: '#FFFFFF'
                    }}
                  />
                </Box>
              </Box>

              {/* Preset Palette */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                {PRESET_COLORS.map((c) => (
                  <Tooltip key={c.hex} title={`${c.label} (${c.hex})`} arrow>
                    <Box
                      onClick={() => setPermissionFormData({ ...permissionFormData, badge_color: c.hex })}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: c.hex,
                        cursor: 'pointer',
                        border: permissionFormData.badge_color === c.hex ? '3px solid #0F172A' : '2px solid #FFFFFF',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'transform 0.1s ease',
                        '&:hover': { transform: 'scale(1.15)' }
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>

              <TextField
                label="Пользовательский HEX-код цвета"
                value={permissionFormData.badge_color}
                onChange={(e) => setPermissionFormData({ ...permissionFormData, badge_color: e.target.value })}
                size="small"
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: permissionFormData.badge_color, border: '1px solid #CBD5E1' }} />
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
            <Button onClick={() => setPermissionModalOpen(false)} sx={{ color: '#64748B', textTransform: 'none' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={permissionModalSaving}
              sx={{
                bgcolor: '#7C3AED',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
                '&:hover': { bgcolor: '#6D28D9' }
              }}
            >
              {permissionModalSaving ? <CircularProgress size={18} color="inherit" /> : isEditingPermission ? 'Сохранить изменения' : 'Создать разрешение'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: DELETE PERMISSION CONFIRMATION                                    */}
      {/* ========================================================================= */}
      <Dialog
        open={deletePermissionModalOpen}
        onClose={() => setDeletePermissionModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ color: '#DC2626', fontWeight: 800 }}>
          Удаление типа разрешения
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.5 }}>
            Вы действительно хотите удалить разрешение <strong>{deleteTargetPermission?.name}</strong> (код: <code>{deleteTargetPermission?.code}</code>)?
            Это действие необратимо.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeletePermissionModalOpen(false)} sx={{ color: '#64748B', textTransform: 'none' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeletePermission}
            disabled={deletePermissionSaving}
            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
          >
            {deletePermissionSaving ? <CircularProgress size={18} color="inherit" /> : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: RESET USER PASSWORD                                               */}
      {/* ========================================================================= */}
      <Dialog
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, color: '#0284C7' }}>
          <VpnKeyIcon sx={{ fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Смена пароля пользователя
          </Typography>
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmitResetPassword}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Укажите новый пароль для учетной записи <strong>@{resetTargetUser?.username}</strong> ({resetTargetUser?.full_name}):
            </Typography>

            {resetError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {resetError}
              </Alert>
            )}

            <TextField
              label="Новый пароль"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              size="small"
              required
              autoFocus
            />

            <TextField
              label="Подтверждение пароля"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              size="small"
              required
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
            <Button onClick={() => setResetModalOpen(false)} sx={{ color: '#64748B', textTransform: 'none' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={resetSaving}
              sx={{
                bgcolor: '#0284C7',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: '#0369A1' }
              }}
            >
              {resetSaving ? <CircularProgress size={18} color="inherit" /> : 'Установить пароль'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: DELETE USER CONFIRMATION                                          */}
      {/* ========================================================================= */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ color: '#DC2626', fontWeight: 800 }}>
          Удаление пользователя
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.5 }}>
            Вы действительно хотите удалить учетную запись <strong>@{deleteTargetUser?.username}</strong> ({deleteTargetUser?.full_name})?
            Это действие необратимо.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteModalOpen(false)} sx={{ color: '#64748B', textTransform: 'none' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteUser}
            disabled={deleteSaving}
            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
          >
            {deleteSaving ? <CircularProgress size={18} color="inherit" /> : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
