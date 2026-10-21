import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Divider,
  Popover,
  Switch,
  Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SecurityIcon from '@mui/icons-material/Security';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { API_BASE_URL } from '../config/apiConfig';
import { routeMetaMap } from '../config/navigationConfig';
import { useAuth } from '../context/AuthContext';
import { usePos } from '../context/PosContext';
import { useFiscal } from '../context/FiscalContext';
import { isElementPermitted } from '../utils/permissionUtils';
import FiscalShiftCloseModal from './FiscalShiftCloseModal';

export default function TopStatusBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, currentUser, lock, logout, isAuthenticated } = useAuth();
  const { posStatus, refreshPosStatus } = usePos();
  const { fiscalStatus, refreshFiscalStatus } = useFiscal();
  const [shiftStatus, setShiftStatus] = useState<any>(null);
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);
  const [medflexStatus, setMedflexStatus] = useState<any>(null);
  const [medflexAnchorEl, setMedflexAnchorEl] = useState<HTMLElement | null>(null);
  const [medflexToggling, setMedflexToggling] = useState(false);
  const [medflexPingLoading, setMedflexPingLoading] = useState(false);

  // Read permissions from menuPermissionsConfig.json
  const userPerms = currentUser?.permissionCodes?.length
    ? currentUser.permissionCodes
    : (currentUser?.role ? [currentUser.role] : []);

  const canClickShift = isElementPermitted('top_status_bar', 'kkt_shift_modal', userPerms);
  const canClickAtol = isElementPermitted('top_status_bar', 'atol_wizard_chip', userPerms);
  const canClickPos = isElementPermitted('top_status_bar', 'alfa_pos_chip', userPerms);
  const canViewMedflex = isElementPermitted('top_status_bar', 'medflex_status_chip', userPerms);
  const canToggleMedflex = isElementPermitted('top_status_bar', 'medflex_toggle_active', userPerms);

  const fetchShiftStatus = async () => {
    try {
      const res = await fetch('/api/fiscal/shifts/current');
      const data = await res.json();
      setShiftStatus(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchMedflexStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/live-status`);
      if (res.ok) {
        const data = await res.json();
        setMedflexStatus(data);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleToggleMedflex = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextState = e.target.checked;
    setMedflexToggling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/toggle-active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState })
      });
      if (res.ok) {
        await fetchMedflexStatus();
      }
    } catch (err) {
      console.error('Failed to toggle medflex:', err);
    } finally {
      setMedflexToggling(false);
    }
  };

  const handleMedflexPingTest = async () => {
    setMedflexPingLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/medflex/admin/ping-test`, { method: 'POST' });
      await fetchMedflexStatus();
    } catch (err) {
      console.error('Ping test failed:', err);
    } finally {
      setMedflexPingLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftStatus();
    fetchMedflexStatus();
    const interval = setInterval(() => {
      fetchShiftStatus();
      refreshFiscalStatus();
      refreshPosStatus();
      fetchMedflexStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentMeta = routeMetaMap[location.pathname] || {
    title: 'Страница',
    groupTitle: 'Раздел',
    groupId: 'other',
    parentPath: '/'
  };

  const isHome = location.pathname === '/';

  const handleBack = () => {
    if (isHome) return;
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1050,
        bgcolor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* LINE 1: System Status & Clinic Controls */}
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 0.85,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          gap: 1.5,
          borderBottom: '1px solid #EDF2F7',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' }
        }}
      >
        {/* Left side of Line 1: Clinic Brand Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              cursor: 'pointer',
              userSelect: 'none',
              px: 0.6,
              py: 0.3,
              borderRadius: 1.5,
              transition: 'background-color 0.15s ease',
              '&:hover': { bgcolor: 'rgba(15, 60, 100, 0.05)' }
            }}
            onClick={() => navigate('/')}
          >
            <LocalHospitalIcon sx={{ color: '#0F3C64', fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.82rem', letterSpacing: '-0.2px' }}>
              МИС «ОртоERP»
            </Typography>
          </Box>
        </Box>

        {/* Right side of Line 1: System Status Indicators & Guide */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, whiteSpace: 'nowrap' }}>
        {/* Redesigned Multi-Target User Guide Navigation Control */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            bgcolor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid',
            borderColor: (location.pathname === '/user-guide' || location.pathname === '/guide') ? '#0F3C64' : '#CBD5E1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            height: 30,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          {/* Main Full Guide Button */}
          <Tooltip title="Полное интерактивное руководство пользователя МИС «ОртоERP» (все 18 разделов: Том I + Том II)" arrow enterDelay={150}>
            <Box
              onClick={() => navigate('/user-guide?volume=all')}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 1,
                height: '100%',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                userSelect: 'none',
                bgcolor: (location.pathname === '/user-guide' || location.pathname === '/guide') && (!location.search || location.search.includes('volume=all')) ? '#EBF5FA' : 'transparent',
                color: (location.pathname === '/user-guide' || location.pathname === '/guide') && (!location.search || location.search.includes('volume=all')) ? '#0F3C64' : '#334155',
                fontWeight: 700,
                fontSize: '0.74rem',
                borderRight: '1px solid #E2E8F0',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#F0F9FF', color: '#0F3C64' }
              }}
            >
              <MenuBookIcon sx={{ fontSize: '16px !important', color: '#0F3C64', flexShrink: 0 }} />
            </Box>
          </Tooltip>

          {/* Volume I (System) Button */}
          <Tooltip title="Том I: Системное Руководство (п. 1.1–1.10) — архитектура БД, маржа, визиты, фискализация 54-ФЗ, службы бэкенда, FAQ" arrow enterDelay={150}>
            <Box
              onClick={() => navigate('/user-guide?volume=system')}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.1,
                height: '100%',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                userSelect: 'none',
                bgcolor: (location.pathname === '/user-guide' || location.pathname === '/guide') && location.search.includes('volume=system') ? '#E0F2FE' : 'transparent',
                color: (location.pathname === '/user-guide' || location.pathname === '/guide') && location.search.includes('volume=system') ? '#0284C7' : '#64748B',
                fontWeight: (location.pathname === '/user-guide' || location.pathname === '/guide') && location.search.includes('volume=system') ? 800 : 600,
                fontSize: '0.73rem',
                borderRight: '1px solid #E2E8F0',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#F1F5F9', color: '#0F3C64' }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', xl: 'inline' }, whiteSpace: 'nowrap' }}>Том I (Системный)</Box>
              <Box component="span" sx={{ display: { xs: 'inline', xl: 'none' }, whiteSpace: 'nowrap' }}>Том I</Box>
            </Box>
          </Tooltip>

          {/* Volume II (Clinical) Button */}
          <Tooltip title="Том II: Клиническое Руководство (п. 2.1–2.8) — 180 клинических протоколов 2.0, 1377 ортотестов, 37 методов УЗИ, манипуляции, физиотерапия, ортезы, ЛФК, ROM" arrow enterDelay={150}>
            <Box
              onClick={() => navigate('/user-guide?volume=clinical')}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.1,
                height: '100%',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                userSelect: 'none',
                bgcolor: (location.pathname === '/user-guide' || location.pathname === '/guide') && location.search.includes('volume=clinical') ? '#DCFCE7' : 'transparent',
                color: (location.pathname === '/user-guide' || location.pathname === '/guide') && location.search.includes('volume=clinical') ? '#166534' : '#64748B',
                fontWeight: (location.pathname === '/user-guide' || location.pathname === '/guide') && location.search.includes('volume=clinical') ? 800 : 600,
                fontSize: '0.73rem',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#F1F5F9', color: '#166534' }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', xl: 'inline' }, whiteSpace: 'nowrap' }}>Том II (Клинический)</Box>
              <Box component="span" sx={{ display: { xs: 'inline', xl: 'none' }, whiteSpace: 'nowrap' }}>Том II</Box>
            </Box>
          </Tooltip>
        </Box>


        {/* KKT Shift Badge */}
        <Tooltip
          title={
            shiftStatus?.isOpen
              ? (canClickShift
                  ? `Кассовая смена ККТ «${shiftStatus.currentShift?.mnemonic_code}» открыта (${shiftStatus.currentShift?.hours_running || 0} ч). Нажмите для управления, сверки или снятия Z-отчета.`
                  : `Кассовая смена ККТ «${shiftStatus.currentShift?.mnemonic_code}» открыта (${shiftStatus.currentShift?.hours_running || 0} ч).`)
              : (canClickShift
                  ? 'Кассовая смена ККТ закрыта. При первой оплате откроется автоматически. Нажмите для управления.'
                  : 'Кассовая смена ККТ закрыта.')
          }
        >
          <Chip
            icon={<PointOfSaleIcon sx={{ fontSize: '15px !important' }} />}
            label={
              shiftStatus?.isOpen
                ? `Смена: ${shiftStatus.currentShift?.mnemonic_code}`
                : 'Касса: Смена закрыта'
            }
            size="small"
            onClick={canClickShift ? () => setCloseShiftModalOpen(true) : undefined}
            clickable={canClickShift}
            sx={{
              bgcolor: shiftStatus?.isOpen
                ? (shiftStatus.currentShift?.is_expired ? '#FEE2E2' : '#F0FDF4')
                : '#F1F5F9',
              color: shiftStatus?.isOpen
                ? (shiftStatus.currentShift?.is_expired ? '#DC2626' : '#166534')
                : '#475569',
              border: `1px solid ${
                shiftStatus?.isOpen
                  ? (shiftStatus.currentShift?.is_expired ? '#FCA5A5' : '#BBF7D0')
                  : '#CBD5E1'
              }`,
              fontWeight: 700,
              fontSize: '0.75rem',
              height: 28,
              cursor: canClickShift ? 'pointer' : 'default',
              userSelect: canClickShift ? 'none' : 'text',
              ...(!canClickShift
                ? {
                    '&:hover': {
                      bgcolor: shiftStatus?.isOpen
                        ? (shiftStatus.currentShift?.is_expired ? '#FEE2E2' : '#F0FDF4')
                        : '#F1F5F9'
                    }
                  }
                : {})
            }}
          />
        </Tooltip>

        {/* ATOL 91F KKT Device Status Badge */}
        <Tooltip
          title={
            canClickAtol
              ? `Онлайн-касса «${fiscalStatus?.deviceModel || 'АТОЛ 91Ф'}» (ФФД 1.2, 54-ФЗ). Порт: ${fiscalStatus?.port || 'COM3'}. Режим: ${fiscalStatus?.isMockMode ? 'Эмуляция (Mock)' : 'Физический ККТ'}. Связь: ${fiscalStatus?.online !== false ? 'Готова к фискализации' : 'Ошибка связи'}. Нажмите для перехода в мастер тестов ККТ.`
              : `Онлайн-касса «${fiscalStatus?.deviceModel || 'АТОЛ 91Ф'}» (ФФД 1.2, 54-ФЗ). Порт: ${fiscalStatus?.port || 'COM3'}. Режим: ${fiscalStatus?.isMockMode ? 'Эмуляция (Mock)' : 'Физический ККТ'}. Связь: ${fiscalStatus?.online !== false ? 'Готова к фискализации' : 'Ошибка связи'}.`
          }
        >
          <Chip
            icon={
              <ReceiptLongIcon
                sx={{
                  fontSize: '15px !important',
                  color: fiscalStatus?.isMockMode
                    ? '#D97706 !important'
                    : fiscalStatus?.online === false
                    ? '#DC2626 !important'
                    : '#166534 !important'
                }}
              />
            }
            label={
              fiscalStatus?.isMockMode
                ? 'АТОЛ 91Ф: Mock'
                : fiscalStatus?.online === false
                ? 'АТОЛ 91Ф: Ошибка'
                : 'АТОЛ 91Ф: Ок'
            }
            size="small"
            onClick={canClickAtol ? () => navigate('/admin/fiscal-test-wizard') : undefined}
            clickable={canClickAtol}
            sx={{
              bgcolor: fiscalStatus?.isMockMode
                ? '#FFFBEB'
                : fiscalStatus?.online === false
                ? '#FEF2F2'
                : '#F0FDF4',
              color: fiscalStatus?.isMockMode
                ? '#B45309'
                : fiscalStatus?.online === false
                ? '#DC2626'
                : '#166534',
              border: `1px solid ${
                fiscalStatus?.isMockMode
                  ? '#FDE68A'
                  : fiscalStatus?.online === false
                  ? '#FCA5A5'
                  : '#BBF7D0'
              }`,
              fontWeight: 700,
              fontSize: '0.75rem',
              height: 28,
              cursor: canClickAtol ? 'pointer' : 'default',
              userSelect: canClickAtol ? 'none' : 'text',
              ...(!canClickAtol
                ? {
                    '&:hover': {
                      bgcolor: fiscalStatus?.isMockMode
                        ? '#FFFBEB'
                        : fiscalStatus?.online === false
                        ? '#FEF2F2'
                        : '#F0FDF4'
                    }
                  }
                : {})
            }}
          />
        </Tooltip>

        {/* Alfa-Bank POS Terminal Badge */}
        <Tooltip
          title={
            canClickPos
              ? `Банковский терминал Альфа-Банка (TID: ${posStatus?.terminalId || 'ALFA_770192'}). Режим: ${posStatus?.isMockMode ? 'Эмуляция (Mock)' : 'Физический POS'}. Нажмите для перехода в мастер тестов эквайринга.`
              : `Банковский терминал Альфа-Банка (TID: ${posStatus?.terminalId || 'ALFA_770192'}). Режим: ${posStatus?.isMockMode ? 'Эмуляция (Mock)' : 'Физический POS'}. Связь: Подключен.`
          }
        >
          <Chip
            icon={<CreditCardIcon sx={{ fontSize: '15px !important', color: posStatus?.isMockMode ? '#D97706 !important' : '#2563EB !important' }} />}
            label={posStatus?.isMockMode ? 'Альфа-Банк: Mock' : 'Альфа-Банк POS: Ок'}
            size="small"
            onClick={canClickPos ? () => navigate('/admin/pos-test-wizard') : undefined}
            clickable={canClickPos}
            sx={{
              bgcolor: posStatus?.isMockMode ? '#FFFBEB' : '#EFF6FF',
              color: posStatus?.isMockMode ? '#B45309' : '#1D4ED8',
              border: `1px solid ${posStatus?.isMockMode ? '#FDE68A' : '#BFDBFE'}`,
              fontWeight: 700,
              fontSize: '0.75rem',
              height: 28,
              cursor: canClickPos ? 'pointer' : 'default',
              userSelect: canClickPos ? 'none' : 'text',
              ...(!canClickPos
                ? {
                    '&:hover': {
                      bgcolor: posStatus?.isMockMode ? '#FFFBEB' : '#EFF6FF'
                    }
                  }
                : {})
            }}
          />
        </Tooltip>

        {/* MedFlex Online Booking Gateway Status Badge */}
        {canViewMedflex && (
          <Tooltip
            title={
              medflexStatus
                ? `MedFlex: ${medflexStatus.enabled ? 'Активен' : 'Отключен'}. Режим: ${medflexStatus.mode} (${medflexStatus.sandboxDirection || 'dual'}). Опрос: ${medflexStatus.pingIntervalSec || 60}с, синхр.: ${medflexStatus.scheduleSyncIntervalMin || 30}м. RTT: ${medflexStatus.lastLatencyMs || 0}мс. Очередь: ${medflexStatus.queueStats?.pending || 0}. Инциденты: ${medflexStatus.openIncidentsCount || 0}. Нажмите для управления.`
                : 'Шлюз онлайн-записи MedFlex / ПроДокторов. Загрузка статуса...'
            }
          >
            <Chip
              icon={
                <SyncAltIcon
                  sx={{
                    fontSize: '15px !important',
                    color: !medflexStatus?.enabled
                      ? '#64748B !important'
                      : medflexStatus?.isOnline
                      ? '#4F46E5 !important'
                      : '#DC2626 !important'
                  }}
                />
              }
              label={
                !medflexStatus?.enabled
                  ? 'MedFlex: Выкл'
                  : medflexStatus?.isOnline
                  ? `MedFlex: ${medflexStatus.lastLatencyMs || 0}мс`
                  : 'MedFlex: Оффлайн'
              }
              size="small"
              onClick={(e) => setMedflexAnchorEl(e.currentTarget)}
              clickable
              sx={{
                bgcolor: !medflexStatus?.enabled
                  ? '#F1F5F9'
                  : medflexStatus?.isOnline
                  ? '#EEF2FF'
                  : '#FEF2F2',
                color: !medflexStatus?.enabled
                  ? '#64748B'
                  : medflexStatus?.isOnline
                  ? '#4338CA'
                  : '#DC2626',
                border: `1px solid ${
                  !medflexStatus?.enabled
                    ? '#CBD5E1'
                    : medflexStatus?.isOnline
                    ? '#C7D2FE'
                    : '#FCA5A5'
                }`,
                fontWeight: 700,
                fontSize: '0.75rem',
                height: 28,
                cursor: 'pointer'
              }}
            />
          </Tooltip>
        )}

        {/* User, Lock Screen & Logout Controls */}
        {isAuthenticated && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, ml: 0.5 }}>
            <Tooltip
              arrow
              placement="bottom-end"
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: '#FFFFFF',
                    color: '#1E293B',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E2E8F0',
                    borderRadius: 2.5,
                    p: 2,
                    maxWidth: 380,
                    '& .MuiTooltip-arrow': {
                      color: '#FFFFFF',
                      '&::before': {
                        border: '1px solid #CBD5E1'
                      }
                    }
                  }
                }
              }}
              title={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 280, textAlign: 'left' }}>
                  {/* User Profile Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: '#0F3C64',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        fontWeight: 700
                      }}
                    >
                      {(currentUser?.fullName || user || 'A').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', lineHeight: 1.2 }}>
                        {currentUser?.fullName || user || 'Администратор'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
                        @{currentUser?.username || 'admin'} {currentUser?.staffName ? `• ${currentUser.staffName}` : ''}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: '#F1F5F9' }} />

                  {/* Permissions Title */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SecurityIcon sx={{ fontSize: 15, color: '#0F3C64' }} /> Права доступа:
                    </Typography>
                    <Chip
                      label={`${currentUser?.permissions && currentUser.permissions.length > 0 ? currentUser.permissions.length : 1} активных`}
                      size="small"
                      sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#F1F5F9', color: '#475569' }}
                    />
                  </Box>

                  {/* Permissions Chips & Details */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    {currentUser?.permissions && currentUser.permissions.length > 0 ? (
                      currentUser.permissions.map(perm => (
                        <Box
                          key={perm.id || perm.code}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                            p: 0.8,
                            borderRadius: 1.5,
                            bgcolor: '#F8FAFC',
                            border: '1px solid #EDF2F7'
                          }}
                        >
                          <Chip
                            size="small"
                            label={perm.code}
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              bgcolor: perm.badge_color || '#0F3C64',
                              color: '#FFFFFF',
                              flexShrink: 0
                            }}
                          />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
                              {perm.name}
                            </Typography>
                            {perm.description && (
                              <Typography sx={{ fontSize: '0.68rem', color: '#64748B', lineHeight: 1.2, mt: 0.2 }}>
                                {perm.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))
                    ) : (
                      // Fallback when permissions not yet populated
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 0.8,
                          borderRadius: 1.5,
                          bgcolor: '#F8FAFC',
                          border: '1px solid #EDF2F7'
                        }}
                      >
                        <Chip
                          size="small"
                          label={currentUser?.role === 'admin' ? 'sysadmin' : 'default'}
                          sx={{
                            height: 20,
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            bgcolor: currentUser?.role === 'admin' ? '#7C3AED' : '#64748B',
                            color: '#FFFFFF',
                            flexShrink: 0
                          }}
                        />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                          {currentUser?.role === 'admin' ? 'Системный администратор' : 'Базовый доступ (default)'}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Quick Action Link */}
                  <Box
                    onClick={() => navigate('/admin/users')}
                    sx={{
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#0284C7',
                      textAlign: 'center',
                      pt: 0.6,
                      borderTop: '1px dashed #E2E8F0',
                      '&:hover': { color: '#0369A1', textDecoration: 'underline' }
                    }}
                  >
                    Управление пользователями и правами →
                  </Box>
                </Box>
              }
            >
              <Chip
                icon={<AdminPanelSettingsIcon sx={{ fontSize: '15px !important', color: '#0F3C64 !important' }} />}
                label={currentUser?.fullName || user || 'Администратор'}
                size="small"
                onClick={() => navigate('/admin/users')}
                clickable
                sx={{
                  bgcolor: '#EBF8FF',
                  border: '1px solid #BEE3F8',
                  fontWeight: 700,
                  color: '#0F3C64',
                  fontSize: '0.75rem',
                  height: 30,
                  cursor: 'pointer',
                  maxWidth: { xs: 140, sm: 220 },
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: '#DDF0FF',
                    borderColor: '#90CDF4'
                  },
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }
                }}
              />
            </Tooltip>

            {/* Quick Lock Button */}
            <Tooltip title="Заблокировать экран (Ctrl+L) — защита персональных данных (152-ФЗ)">
              <IconButton
                size="small"
                onClick={lock}
                sx={{
                  border: '1px solid #CBD5E1',
                  bgcolor: '#FFFFFF',
                  color: '#0F3C64',
                  p: 0.7,
                  borderRadius: 2,
                  height: 30,
                  width: 30,
                  '&:hover': {
                    bgcolor: '#F0F9FF',
                    borderColor: '#0F3C64'
                  }
                }}
              >
                <LockOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            {/* Logout Button */}
            <Tooltip title="Выйти из системы (Завершить сеанс)">
              <IconButton
                size="small"
                onClick={logout}
                sx={{
                  border: '1px solid #CBD5E1',
                  bgcolor: '#FFFFFF',
                  color: '#DC2626',
                  p: 0.7,
                  borderRadius: 2,
                  height: 30,
                  width: 30,
                  '&:hover': {
                    bgcolor: '#FEF2F2',
                    borderColor: '#DC2626'
                  }
                }}
              >
                <LogoutIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>

    {/* LINE 2: Breadcrumbs Navigation Bar (Second Separate Line) */}
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: 0.65,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: '#FAFBFD',
        borderBottom: '1px solid #E2E8F0',
        gap: 1.5,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' }
      }}
    >
      {/* Left side of Line 2: Back Button + Breadcrumbs */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0, flexShrink: 0 }}>
        <Tooltip
          title={isHome ? 'Вы находитесь на главном экране' : 'Вернуться назад'}
          placement="bottom"
          arrow
        >
          <span>
            <IconButton
              size="small"
              onClick={handleBack}
              disabled={isHome}
              sx={{
                border: '1px solid',
                borderColor: isHome ? '#EDF2F7' : '#CBD5E0',
                bgcolor: isHome ? '#F7FAFC' : '#FFFFFF',
                color: isHome ? '#A0AEC0' : '#0F3C64',
                p: 0.45,
                borderRadius: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isHome ? '#F7FAFC' : '#F0F6FA',
                  borderColor: '#0F3C64',
                  transform: isHome ? 'none' : 'translateX(-2px)'
                }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Breadcrumbs
          separator={<NavigateNextIcon sx={{ fontSize: 15, color: '#94A3B8' }} />}
          aria-label="breadcrumb"
          sx={{ fontSize: '0.84rem' }}
        >
          {/* Level 1: Главная (Always leads to Dashboard) */}
          <Link
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: isHome ? '#0F3C64' : '#64748B',
              fontWeight: isHome ? 700 : 500,
              fontSize: '0.82rem'
            }}
            onClick={() => navigate('/')}
          >
            Главная
          </Link>

          {/* Level 2: Group Name (if not home) */}
          {!isHome && (
            <Typography
              sx={{
                color: '#64748B',
                fontWeight: 500,
                fontSize: '0.82rem'
              }}
            >
              {currentMeta.groupTitle}
            </Typography>
          )}

          {/* Level 3: Current Active Page Title (if not home) */}
          {!isHome && (
            <Typography
              sx={{
                color: '#0F3C64',
                fontWeight: 700,
                fontSize: '0.84rem'
              }}
            >
              {currentMeta.title}
            </Typography>
          )}
        </Breadcrumbs>
      </Box>

      {/* Right side of Line 2: Active Module Chip */}
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Chip
          size="small"
          label={currentMeta.groupTitle || 'Раздел'}
          sx={{
            height: 20,
            fontSize: '0.68rem',
            fontWeight: 700,
            bgcolor: 'rgba(15, 60, 100, 0.06)',
            color: '#0F3C64',
            border: '1px solid rgba(15, 60, 100, 0.12)'
          }}
        />
      </Box>
    </Box>

      {/* Modal for closing shift */}
      <FiscalShiftCloseModal
        open={closeShiftModalOpen}
        onClose={() => setCloseShiftModalOpen(false)}
        onShiftClosed={fetchShiftStatus}
      />

      {/* Popover for MedFlex Online Booking Service */}
      <Popover
        open={Boolean(medflexAnchorEl)}
        anchorEl={medflexAnchorEl}
        onClose={() => setMedflexAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              width: 340,
              borderRadius: 2.5,
              boxShadow: '0 10px 30px rgba(15, 60, 100, 0.18)',
              border: '1px solid #E2E8F0'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SyncAltIcon sx={{ color: '#4F46E5', fontSize: 22 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              Онлайн-запись MedFlex
            </Typography>
          </Box>
          <Chip
            size="small"
            label={medflexStatus?.mode === 'sandbox' ? `Sandbox (${medflexStatus?.sandboxDirection || 'dual'})` : 'Продакшн'}
            sx={{
              fontSize: '0.68rem',
              fontWeight: 700,
              bgcolor: medflexStatus?.mode === 'sandbox' ? '#FEF3C7' : '#DCFCE7',
              color: medflexStatus?.mode === 'sandbox' ? '#92400E' : '#166534'
            }}
          />
        </Box>

        <Box sx={{ p: 1.2, mb: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Статус связи:</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: medflexStatus?.isOnline ? '#16A34A' : '#DC2626' }}>
              {medflexStatus?.isOnline ? 'ONLINE (На связи)' : 'OFFLINE'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Пинг (RTT):</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {medflexStatus?.lastLatencyMs ? `${medflexStatus.lastLatencyMs} мс` : '—'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Очередь offline:</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: (medflexStatus?.queueStats?.pending || 0) > 0 ? '#D97706' : '#166534' }}>
              {medflexStatus?.queueStats?.pending || 0} задач
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Инциденты (RCA):</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: (medflexStatus?.openIncidentsCount || 0) > 0 ? '#DC2626' : '#166534' }}>
              {medflexStatus?.openIncidentsCount || 0} открыто
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Частота синхр. (пинг/расп.):</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#4F46E5' }}>
              {medflexStatus?.pingIntervalSec || 60}с / {medflexStatus?.scheduleSyncIntervalMin || 30}м
            </Typography>
          </Box>
        </Box>

        {/* Active / Inactive Toggle Switch */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
            p: 1.2,
            bgcolor: medflexStatus?.enabled ? '#F0FDF4' : '#FEF2F2',
            borderRadius: 2,
            border: `1px solid ${medflexStatus?.enabled ? '#BBF7D0' : '#FECACA'}`
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: medflexStatus?.enabled ? '#166534' : '#991B1B' }}>
              {medflexStatus?.enabled ? 'Служба активна' : 'Служба отключена'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
              {medflexStatus?.enabled ? 'Прием и передача записей включены' : 'Синхронизация приостановлена'}
            </Typography>
          </Box>
          <Switch
            size="small"
            checked={Boolean(medflexStatus?.enabled)}
            disabled={!canToggleMedflex || medflexToggling}
            onChange={handleToggleMedflex}
            color="primary"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            disabled={medflexPingLoading}
            onClick={handleMedflexPingTest}
            sx={{ fontSize: '0.74rem', py: 0.6 }}
          >
            {medflexPingLoading ? 'Пинг...' : 'Тест пинга'}
          </Button>
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={() => {
              setMedflexAnchorEl(null);
              navigate('/admin/medflex-sync');
            }}
            sx={{ fontSize: '0.74rem', py: 0.6, bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
          >
            Центр MedFlex
          </Button>
        </Box>
      </Popover>
    </Box>
  );
}
