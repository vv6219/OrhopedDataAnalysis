import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CircleIcon from '@mui/icons-material/Circle';
import StorageIcon from '@mui/icons-material/Storage';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { routeMetaMap } from '../config/navigationConfig';
import { useAuth } from '../context/AuthContext';
import { usePos } from '../context/PosContext';
import { useFiscal } from '../context/FiscalContext';
import FiscalShiftCloseModal from './FiscalShiftCloseModal';

export default function TopStatusBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { posStatus, refreshPosStatus } = usePos();
  const { fiscalStatus, refreshFiscalStatus } = useFiscal();
  const [shiftStatus, setShiftStatus] = useState<any>(null);
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);

  const fetchShiftStatus = async () => {
    try {
      const res = await fetch('/api/fiscal/shifts/current');
      const data = await res.json();
      setShiftStatus(data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchShiftStatus();
    const interval = setInterval(() => {
      fetchShiftStatus();
      refreshFiscalStatus();
      refreshPosStatus();
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
        bgcolor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0',
        px: { xs: 2, md: 3 },
        py: 1.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
      }}
    >
      {/* Left side: Back Navigation & Breadcrumbs */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                p: 0.75,
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isHome ? '#F7FAFC' : '#F0F6FA',
                  borderColor: '#0F3C64',
                  transform: isHome ? 'none' : 'translateX(-2px)'
                }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Breadcrumbs
          separator={<NavigateNextIcon sx={{ fontSize: 16, color: '#A0AEC0' }} />}
          aria-label="breadcrumb"
          sx={{ fontSize: '0.85rem' }}
        >
          {/* Level 1: Главная (Always leads to Dashboard) */}
          <Link
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: isHome ? '#0F3C64' : '#718096',
              fontWeight: isHome ? 700 : 500,
              fontSize: '0.84rem'
            }}
            onClick={() => navigate('/')}
          >
            Главная
          </Link>

          {/* Level 2: Group Name (if not home) */}
          {!isHome && (
            <Typography
              sx={{
                color: '#718096',
                fontWeight: 500,
                fontSize: '0.84rem'
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
                fontSize: '0.86rem'
              }}
            >
              {currentMeta.title}
            </Typography>
          )}
        </Breadcrumbs>
      </Box>

      {/* Right side: System Status Indicators & Guide */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        {/* Redesigned Multi-Target User Guide Navigation Control */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#FFFFFF',
            borderRadius: 2,
            border: '1px solid',
            borderColor: (location.pathname === '/user-guide' || location.pathname === '/guide') ? '#0F3C64' : '#CBD5E1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            height: 28,
            transition: 'all 0.2s ease'
          }}
        >
          {/* Main Full Guide Button */}
          <Tooltip title="Полное интерактивное руководство пользователя МИС «ОртоERP» (все 18 разделов: Том I + Том II)" arrow enterDelay={150}>
            <Box
              onClick={() => navigate('/user-guide?volume=all')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.6,
                px: 1,
                height: '100%',
                cursor: 'pointer',
                bgcolor: (location.pathname === '/user-guide' || location.pathname === '/guide') && (!location.search || location.search.includes('volume=all')) ? '#EBF5FA' : 'transparent',
                color: (location.pathname === '/user-guide' || location.pathname === '/guide') && (!location.search || location.search.includes('volume=all')) ? '#0F3C64' : '#334155',
                fontWeight: 700,
                fontSize: '0.74rem',
                borderRight: '1px solid #E2E8F0',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#F0F9FF', color: '#0F3C64' }
              }}
            >
              <MenuBookIcon sx={{ fontSize: '14px !important', color: '#0F3C64' }} />
              <span>Полное Руководство</span>
            </Box>
          </Tooltip>

          {/* Volume I (System) Button */}
          <Tooltip title="Том I: Системное Руководство (п. 1.1–1.10) — архитектура БД, маржа, визиты, фискализация 54-ФЗ, службы бэкенда, FAQ" arrow enterDelay={150}>
            <Box
              onClick={() => navigate('/user-guide?volume=system')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 0.9,
                height: '100%',
                cursor: 'pointer',
                bgcolor: (location.pathname === '/user-guide' || location.pathname === '/guide') && location.search.includes('volume=system') ? '#E0F2FE' : 'transparent',
                color: (location.pathname === '/user-guide' || location.pathname === '/guide') && location.search.includes('volume=system') ? '#0284C7' : '#64748B',
                fontWeight: (location.pathname === '/user-guide' || location.pathname === '/guide') && location.search.includes('volume=system') ? 800 : 600,
                fontSize: '0.72rem',
                borderRight: '1px solid #E2E8F0',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#F1F5F9', color: '#0F3C64' }
              }}
            >
              Том I (Системный)
            </Box>
          </Tooltip>

          {/* Volume II (Clinical) Button */}
          <Tooltip title="Том II: Клиническое Руководство (п. 2.1–2.8) — 180 клинических протоколов 2.0, 1377 ортотестов, 37 методов УЗИ, манипуляции, физиотерапия, ортезы, ЛФК, ROM" arrow enterDelay={150}>
            <Box
              onClick={() => navigate('/user-guide?volume=clinical')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 0.9,
                height: '100%',
                cursor: 'pointer',
                bgcolor: (location.pathname === '/user-guide' || location.pathname === '/guide') && location.search.includes('volume=clinical') ? '#DCFCE7' : 'transparent',
                color: (location.pathname === '/user-guide' || location.pathname === '/guide') && location.search.includes('volume=clinical') ? '#166534' : '#64748B',
                fontWeight: (location.pathname === '/user-guide' || location.pathname === '/guide') && location.search.includes('volume=clinical') ? 800 : 600,
                fontSize: '0.72rem',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#F1F5F9', color: '#166534' }
              }}
            >
              Том II (Клинический)
            </Box>
          </Tooltip>
        </Box>

        {/* DB Connection Status Badge */}
        <Chip
          icon={<StorageIcon sx={{ fontSize: '15px !important', color: '#2B6CB0 !important' }} />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <CircleIcon sx={{ fontSize: 7, color: '#38A169' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '0.75rem' }}>
                БД SQLite: 15 табл.
              </Typography>
            </Box>
          }
          size="small"
          sx={{
            bgcolor: '#F0F6FA',
            border: '1px solid #D6E4F0',
            borderRadius: 2,
            px: 0.5,
            height: 28
          }}
        />

        {/* Clinic Doctor Badge */}
        <Chip
          icon={<LocalHospitalIcon sx={{ fontSize: '15px !important', color: '#156C9C !important' }} />}
          label="Клиника Добрушкина (г. Сочи)"
          size="small"
          sx={{
            bgcolor: '#F7FAFC',
            border: '1px solid #E2E8F0',
            fontWeight: 600,
            color: '#4A5568',
            fontSize: '0.75rem',
            height: 28,
            display: { xs: 'none', sm: 'inline-flex' }
          }}
        />

        {/* KKT Shift Badge */}
        <Tooltip
          title={
            shiftStatus?.isOpen
              ? `Кассовая смена ККТ «${shiftStatus.currentShift?.mnemonic_code}» открыта (${shiftStatus.currentShift?.hours_running || 0} ч). Нажмите для управления, сверки или снятия Z-отчета.`
              : 'Кассовая смена ККТ закрыта. При первой оплате откроется автоматически. Нажмите для управления.'
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
            onClick={() => setCloseShiftModalOpen(true)}
            clickable
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
              cursor: 'pointer'
            }}
          />
        </Tooltip>

        {/* ATOL 91F KKT Device Status Badge */}
        <Tooltip
          title={`Онлайн-касса «${fiscalStatus?.deviceModel || 'АТОЛ 91Ф'}» (ФФД 1.2, 54-ФЗ). Порт: ${fiscalStatus?.port || 'COM3'}. Режим: ${fiscalStatus?.isMockMode ? 'Эмуляция (Mock)' : 'Физический ККТ'}. Связь: ${fiscalStatus?.online !== false ? 'Готова к фискализации' : 'Ошибка связи'}. Нажмите для перехода в мастер тестов ККТ.`}
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
            onClick={() => navigate('/admin/fiscal-test-wizard')}
            clickable
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
              cursor: 'pointer'
            }}
          />
        </Tooltip>

        {/* Alfa-Bank POS Terminal Badge */}
        <Tooltip
          title={`Банковский терминал Альфа-Банка (TID: ${posStatus?.terminalId || 'ALFA_770192'}). Режим: ${posStatus?.isMockMode ? 'Эмуляция (Mock)' : 'Физический POS'}. Нажмите для перехода в мастер тестов эквайринга.`}
        >
          <Chip
            icon={<CreditCardIcon sx={{ fontSize: '15px !important', color: posStatus?.isMockMode ? '#D97706 !important' : '#2563EB !important' }} />}
            label={posStatus?.isMockMode ? 'Альфа-Банк: Mock' : 'Альфа-Банк POS: Ок'}
            size="small"
            onClick={() => navigate('/admin/pos-test-wizard')}
            clickable
            sx={{
              bgcolor: posStatus?.isMockMode ? '#FFFBEB' : '#EFF6FF',
              color: posStatus?.isMockMode ? '#B45309' : '#1D4ED8',
              border: `1px solid ${posStatus?.isMockMode ? '#FDE68A' : '#BFDBFE'}`,
              fontWeight: 700,
              fontSize: '0.75rem',
              height: 28,
              cursor: 'pointer'
            }}
          />
        </Tooltip>

        {/* User & Logout Controls */}
        {isAuthenticated && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, ml: 0.5 }}>
            <Chip
              icon={<AdminPanelSettingsIcon sx={{ fontSize: '15px !important', color: '#0F3C64 !important' }} />}
              label={user || 'Администратор'}
              size="small"
              sx={{
                bgcolor: '#EBF8FF',
                border: '1px solid #BEE3F8',
                fontWeight: 700,
                color: '#0F3C64',
                fontSize: '0.75rem',
                height: 28
              }}
            />
            <Tooltip title="Выйти из системы (Завершить сессию)">
              <IconButton
                size="small"
                onClick={logout}
                sx={{
                  border: '1px solid #CBD5E1',
                  bgcolor: '#FFFFFF',
                  color: '#DC2626',
                  p: 0.6,
                  borderRadius: 2,
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

      {/* Modal for closing shift */}
      <FiscalShiftCloseModal
        open={closeShiftModalOpen}
        onClose={() => setCloseShiftModalOpen(false)}
        onShiftClosed={fetchShiftStatus}
      />
    </Box>
  );
}
