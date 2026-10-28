import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Drawer,
  Divider,
  CircularProgress,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import { API_BASE_URL } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';
import { isElementPermitted } from '../utils/permissionUtils';

// Icons
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ErrorIcon from '@mui/icons-material/Error';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SpeedIcon from '@mui/icons-material/Speed';
import DnsIcon from '@mui/icons-material/Dns';
import TableRowsIcon from '@mui/icons-material/TableRows';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HubIcon from '@mui/icons-material/Hub';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// ============================================================================
// Interfaces
// ============================================================================
export interface SerilogLogItem {
  id: number;
  timestamp: string;
  level: string;
  event_type: string;
  source_context: string;
  message: string;
  properties_json: string | null;
  protocol_id: number | null;
  appointment_id: number | null;
  patient_id: number | null;
  doctor_id: number | null;
  user_id: number | null;
  username: string | null;
  duration_ms: number;
  client_ip: string | null;
  exception: string | null;
}

export interface SerilogSummary {
  totalLogs: number;
  totalErrors: number;
  totalWarnings: number;
  totalUserActions: number;
  levelBreakdown: Record<string, number>;
  topEvents: Array<{ event_type: string; count: number }>;
  sourcesBreakdown: Array<{ source_context: string; count: number }>;
  avgDurationMs: number;
}

export interface GroupedOperationItem {
  source_context: string;
  event_type: string;
  total_count: number;
  error_count: number;
  warn_count: number;
  info_count: number;
  avg_duration_ms: number | null;
  max_duration_ms: number | null;
  last_seen: string;
  active_users_count: number;
  users_list: string | null;
}

export interface ServiceSummaryItem {
  source_context: string;
  operations_count: number;
  total_events: number;
  error_count: number;
  warn_count: number;
  avg_duration_ms: number | null;
  last_seen: string;
}

// ============================================================================
// Helper dictionaries for Human-readable Russian labels
// ============================================================================
export const SERVICE_NAMES_RU: Record<string, { title: string; color: string; bg: string }> = {
  'OrthoErp.FiscalShifts': { title: 'Кассовые смены АТОЛ 91Ф', color: '#0F3C64', bg: '#E0F2FE' },
  'OrthoErp.FiscalAtol': { title: 'Драйвер ККТ АТОЛ 91Ф', color: '#0284C7', bg: '#BAE6FD' },
  'OrthoErp.FiscalSettings': { title: 'Параметры ККТ АТОЛ 91Ф', color: '#0369A1', bg: '#E0F2FE' },
  'OrthoErp.FiscalDaemon': { title: 'Служба фискализации .NET', color: '#0284C7', bg: '#E0F2FE' },
  'OrthoErp.Payouts': { title: 'Выплаты персоналу и ФОТ', color: '#4F46E5', bg: '#EEF2FF' },
  'OrthoErp.Operations': { title: 'Прейскурант и BOM техкарты', color: '#7C3AED', bg: '#F5F3FF' },
  'OrthoErp.Warehouse': { title: 'Склад материалов и медикаментов', color: '#0D9488', bg: '#CCFBF1' },
  'OrthoErp.CalculationParams': { title: 'Параметры расчетов клиники', color: '#6366F1', bg: '#EEF2FF' },
  'OrthoErp.AlfaPos': { title: 'Банковский эквайринг Альфа-Банка', color: '#D97706', bg: '#FEF3C7' },
  'OrthoErp.Workstation': { title: 'АРМ врача-ортопеда', color: '#0F3C64', bg: '#E2E8F0' },
  'OrthoErp.Clinical': { title: 'Клинические протоколы', color: '#0284C7', bg: '#E0F2FE' },
  'OrthoErp.Referrals': { title: 'Направления пациентов', color: '#2563EB', bg: '#DBEAFE' },
  'OrthoErp.Templates': { title: 'Клинические шаблоны 2.0', color: '#9333EA', bg: '#F3E8FF' },
  'OrthoErp.MedFlexSync': { title: 'Шлюз интеграции MedFlex', color: '#4F46E5', bg: '#EEF2FF' },
  'OrthoErp.Auth': { title: 'Авторизация и безопасность', color: '#059669', bg: '#D1FAE5' },
  'OrthoErp.Users': { title: 'Управление персоналом и RBAC', color: '#16A34A', bg: '#DCFCE7' },
  'OrthoErp.Admin': { title: 'Системное ядро и БД SQLite', color: '#334155', bg: '#F1F5F9' },
  'OrthoERP.Central': { title: 'Центральный сервер МИС', color: '#1E293B', bg: '#F8FAFC' }
};

export const EVENT_NAMES_RU: Record<string, string> = {
  // Authentication & Security
  'auth_login_success': 'Успешный вход в систему',
  'auth_login_failed': 'Неудачная попытка входа',
  'auth_logout': 'Выход из системы',
  'security_access_denied': 'Отказ в доступе (RBAC)',
  'auth_session_expired': 'Истечение срока сессии',

  // User Management
  'user_created': 'Создание учетной записи',
  'user_updated': 'Обновление данных пользователя',
  'user_deleted': 'Удаление пользователя',
  'user_permissions_updated': 'Изменение прав доступа пользователя',

  // Fiscal Shifts & Reports
  'fiscal_shift_opened': 'Открытие кассовой смены',
  'fiscal_shift_closed': 'Закрытие смены (Z-отчет)',
  'fiscal_x_report_printed': 'Печать промежуточного X-отчета',
  'fiscal_shift_reconciled': 'Сверка кассы со сменным итогом',
  'fiscal_shift_audit_export': 'Экспорт отчета смены (Excel/JSON)',
  'fiscal_receipt_issued': 'Фискализация чека продажи (54-ФЗ)',
  'fiscal_receipt_refund': 'Фискализация чека возврата',
  'fiscal_receipt_failed': 'Ошибка фискализации чека',
  'visit_receipt_repeat_printed': 'Повторная печать чека визита',

  // Hardware & Devices
  'device_connect': 'Инициализация оборудования',
  'device_status': 'Опрос статуса оборудования',
  'device_error': 'Аппаратная ошибка ККТ',
  'paper_error': 'Замятие / окончание ленты',
  'settings_created': 'Создание профиля настроек',
  'settings_updated': 'Обновление профиля настроек',
  'settings_activated': 'Активация профиля настроек',
  'settings_deleted': 'Удаление профиля настроек',
  'fiscal_mode_changed': 'Переключение режима (Mock/Реальный)',

  // Staff Payouts
  'payout_preview_calculated': 'Предварительный расчет выплат (Wizard)',
  'payout_calculation_committed': 'Фиксация начислений сотрудникам',
  'payout_scheme_created': 'Создание схемы выплат',
  'payout_scheme_updated': 'Обновление схемы выплат',
  'payout_staff_rates_updated': 'Обновление ставок сотрудника',
  'payout_services_locked': 'Блокировка услуг для расчета',
  'payout_services_unlocked': 'Снятие блокировки услуг',
  'payout_accrual_updated': 'Корректировка начисления сотруднику',
  'payout_accrual_deleted': 'Сторно / удаление начисления',
  'payout_accruals_bulk_action': 'Массовая операция с начислениями',
  'payout_sheet_created': 'Формирование платежной ведомости',
  'payout_sheet_status_changed': 'Смена статуса ведомости (Утверждена/Выплачена)',

  // Operations & BOM
  'operation_created': 'Создание услуги в прейскуранте',
  'operation_updated': 'Изменение стоимости / услуги',
  'operation_deleted': 'Удаление услуги из каталога',
  'operation_bom_updated': 'Изменение техкарты (BOM расхода)',

  // Warehouse & Inventory
  'inventory_item_created': 'Оприходование материала на склад',
  'inventory_item_updated': 'Обновление данных материала',
  'inventory_item_deleted': 'Списание / удаление со склада',

  // Calculation Parameters
  'calculation_parameter_updated': 'Изменение параметра расчетов',
  'calculation_parameter_deleted': 'Удаление параметра расчетов',

  // POS Acquiring
  'pos_auth_success': 'Успешная оплата картой через POS',
  'pos_auth_decline': 'Отказ в авторизации карты POS',
  'pos_reversal_success': 'Возврат / отмена транзакции POS',
  'pos_settlement_success': 'Сверка итогов дня POS (успешно)',
  'pos_settlement_fail': 'Сбой сверки итогов дня POS',
  'test_host': 'Тест связи с процессингом банка',
  'pos_connect': 'Инициализация POS сервиса',
  'pos_status': 'Статус эквайринга POS',

  // Clinical & Doctor ARM
  'visit_initiated': 'Начало приема в АРМ врача',
  'exam_draft_saved': 'Сохранение черновика осмотра',
  'shablon_action_sync': 'Применение клинического шаблона',
  'protocol_signed': 'Подписание протокола осмотра',
  'protocol_revoked': 'Отзыв / аннулирование протокола',
  'protocol_returned_to_draft': 'Возврат протокола в черновик',
  'protocol_printed': 'Печать протокола осмотра',
  'protocol_deleted': 'Удаление протокола',
  'protocol_access_granted': 'Предоставление доступа к протоколу',
  'protocol_access_revoked': 'Отзыв доступа к протоколу',
  'referral_issued': 'Выдача направления пациенту',
  'referral_printed': 'Печать направления',
  'referral_status_changed': 'Смена статуса направления',
  'patient_document_issued': 'Оформление справки / документа',
  'patient_document_printed': 'Печать официального бланка',
  'media_uploaded': 'Загрузка снимка / медиафайла',
  'media_deleted': 'Удаление снимка / медиафайла',

  // Templates 2.0
  'template_created': 'Создание шаблона 2.0',
  'template_updated': 'Обновление шаблона 2.0',
  'template_cloned': 'Клонирование шаблона',
  'template_deleted': 'Удаление шаблона',
  'catalog_item_created': 'Создание элемента каталога 2.0',
  'catalog_item_updated': 'Обновление элемента каталога 2.0',
  'catalog_item_archived': 'Архивация элемента каталога 2.0',

  // MedFlex & Schedule
  'mf_heartbeat_ok': 'MedFlex Heartbeat Ping OK',
  'mf_sync_completed': 'Синхронизация слотов MedFlex',
  'appointment_scheduled': 'Запись пациента на прием',
  'appointment_patient_arrived': 'Пациент прибыл в клинику'
};

export function getServiceReadable(sourceContext: string) {
  return SERVICE_NAMES_RU[sourceContext] || {
    title: sourceContext.replace('OrthoErp.', ''),
    color: '#334155',
    bg: '#F1F5F9'
  };
}

export function getEventReadable(eventType: string) {
  return EVENT_NAMES_RU[eventType] || eventType;
}

// ============================================================================
// Module-level DataGrid Toolbar (per grid-improvements skill)
// ============================================================================
export function SerilogGridToolbar({
  onResetFilters
}: {
  onResetFilters?: () => void;
}) {
  return (
    <GridToolbarContainer sx={{ p: 1.5, gap: 1, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      {onResetFilters && (
        <Button
          size="small"
          startIcon={<FilterAltOffIcon />}
          onClick={onResetFilters}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
        >
          Сбросить фильтры
        </Button>
      )}
      <Box sx={{ ml: 'auto', width: 280 }}>
        <GridToolbarQuickFilter debounceMs={300} />
      </Box>
    </GridToolbarContainer>
  );
}

// ============================================================================
// Module-level DataGrid Footer displaying accounting totals (per grid-improvements skill)
// ============================================================================
export function SerilogGridFooter({
  totalCount,
  infoCount,
  warnCount,
  errorCount,
  avgDuration
}: {
  totalCount: number;
  infoCount: number;
  warnCount: number;
  errorCount: number;
  avgDuration: number;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid #E2E8F0',
        bgcolor: '#F8FAFC',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
          Итого в выборке: <strong>{totalCount.toLocaleString('ru-RU')}</strong> событий
        </Typography>
        <Chip
          size="small"
          icon={<InfoOutlinedIcon sx={{ fontSize: 16 }} />}
          label={`Info: ${infoCount.toLocaleString('ru-RU')}`}
          sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}
        />
        <Chip
          size="small"
          icon={<WarningAmberIcon sx={{ fontSize: 16 }} />}
          label={`Предупреждений: ${warnCount.toLocaleString('ru-RU')}`}
          sx={{ bgcolor: '#FFFBEB', color: '#B45309', fontWeight: 600 }}
        />
        <Chip
          size="small"
          icon={<ErrorIcon sx={{ fontSize: 16 }} />}
          label={`Ошибок / Сбоев: ${errorCount.toLocaleString('ru-RU')}`}
          sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 600 }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SpeedIcon sx={{ fontSize: 18, color: '#64748B' }} />
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
          Среднее время операций: <strong>{avgDuration} мс</strong>
        </Typography>
      </Box>
    </Box>
  );
}

// ============================================================================
// Main Page Component: SerilogAnalytics
// ============================================================================
export default function SerilogAnalytics() {
  const { currentUser } = useAuth();
  const permissions = currentUser?.permissionCodes || [];

  const canExport = isElementPermitted('serilog_analytics', 'export_logs', permissions);
  const canPurge = isElementPermitted('serilog_analytics', 'purge_logs', permissions);

  // Active Tab: 0 = Flat Logs, 1 = Operation Grouping, 2 = Services Health
  const [activeTab, setActiveTab] = useState<number>(0);

  // Data states
  const [logs, setLogs] = useState<SerilogLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [summary, setSummary] = useState<SerilogSummary>({
    totalLogs: 0,
    totalErrors: 0,
    totalWarnings: 0,
    totalUserActions: 0,
    levelBreakdown: {},
    topEvents: [],
    sourcesBreakdown: [],
    avgDurationMs: 0
  });

  // Grouped operations states
  const [groupedOperations, setGroupedOperations] = useState<GroupedOperationItem[]>([]);
  const [servicesSummary, setServicesSummary] = useState<ServiceSummaryItem[]>([]);
  const [groupedLoading, setGroupedLoading] = useState(false);

  // Source options & Event types
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [eventTypeOptions, setEventTypeOptions] = useState<string[]>([]);

  // Pagination states
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Auto-refresh states
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Drawer inspector state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SerilogLogItem | null>(null);

  // Purge Dialog
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
  const [purgeDays, setPurgeDays] = useState(180);
  const [purgeLoading, setPurgeLoading] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Calculate dates based on preset
  useEffect(() => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    if (datePreset === 'today') {
      const todayStr = formatDate(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (datePreset === 'yesterday') {
      const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yestStr = formatDate(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (datePreset === '7days') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(formatDate(past7));
      setEndDate(formatDate(now));
    } else if (datePreset === '30days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(formatDate(past30));
      setEndDate(formatDate(now));
    } else {
      setStartDate('');
      setEndDate('');
    }
  }, [datePreset]);

  // Helper to get authenticated headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('ortho_auth_token') || localStorage.getItem('token') || '';
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-auth-token'] = token;
    }
    return headers;
  }, []);

  // Load sources and event types metadata on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/serilog/sources-and-events`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSourceOptions(data.sources || []);
          setEventTypeOptions(data.eventTypes || []);
        }
      })
      .catch(err => console.error('Error fetching sources/events:', err));
  }, [getAuthHeaders]);

  // Fetch flat logs and summary
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(paginationModel.page + 1));
      params.set('pageSize', String(paginationModel.pageSize));

      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (selectedSource !== 'ALL') params.set('sources', selectedSource);
      if (selectedLevels.length > 0) params.set('levels', selectedLevels.join(','));
      if (selectedEventType !== 'ALL') params.set('eventTypes', selectedEventType);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const headers = getAuthHeaders();

      // 1. Fetch Logs
      const logsPromise = fetch(`${API_BASE_URL}/api/admin/serilog/logs?${params.toString()}`, { headers })
        .then(res => res.json());

      // 2. Fetch Summary
      const summaryPromise = fetch(`${API_BASE_URL}/api/admin/serilog/summary?${params.toString()}`, { headers })
        .then(res => res.json());

      const [logsData, summaryData] = await Promise.all([logsPromise, summaryPromise]);

      if (logsData.success) {
        setLogs(logsData.items || []);
        setTotalRows(logsData.total || 0);
      } else {
        setLogs([]);
        setTotalRows(0);
        if (logsData.error) {
          setToast({
            open: true,
            message: 'Ошибка при загрузке данных: ' + logsData.error,
            severity: 'error'
          });
        }
      }

      if (summaryData.success) {
        setSummary(summaryData);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error loading Serilog data:', err);
      setToast({
        open: true,
        message: 'Ошибка при загрузке данных Serilog: ' + err.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, startDate, endDate, selectedSource, selectedLevels, selectedEventType, searchTerm, getAuthHeaders]);

  // Fetch grouped operations
  const fetchGroupedOperations = useCallback(async () => {
    setGroupedLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (selectedSource !== 'ALL') params.set('sources', selectedSource);
      if (selectedLevels.length > 0) params.set('levels', selectedLevels.join(','));
      if (selectedEventType !== 'ALL') params.set('eventTypes', selectedEventType);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(`${API_BASE_URL}/api/admin/serilog/grouped-operations?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setGroupedOperations(data.groups || []);
        setServicesSummary(data.services || []);
      }
    } catch (err: any) {
      console.error('Error loading grouped operations:', err);
    } finally {
      setGroupedLoading(false);
    }
  }, [startDate, endDate, selectedSource, selectedLevels, selectedEventType, searchTerm, getAuthHeaders]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (activeTab === 1 || activeTab === 2) {
      fetchGroupedOperations();
    }
  }, [activeTab, fetchGroupedOperations]);

  // Auto-refresh interval effect
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      fetchLogs();
      if (activeTab === 1 || activeTab === 2) {
        fetchGroupedOperations();
      }
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, fetchLogs, fetchGroupedOperations, activeTab]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSource('ALL');
    setSelectedLevels([]);
    setSelectedEventType('ALL');
    setDatePreset('7days');
    setPaginationModel({ page: 0, pageSize: 25 });
  };

  // Jump from grouped operation to filtered flat logs
  const handleDrilldownToLogs = (sourceContext: string, eventType: string) => {
    setSelectedSource(sourceContext);
    setSelectedEventType(eventType);
    setActiveTab(0);
    setPaginationModel({ page: 0, pageSize: 25 });
  };

  // Jump from service card to filtered flat logs
  const handleDrilldownToService = (sourceContext: string) => {
    setSelectedSource(sourceContext);
    setSelectedEventType('ALL');
    setActiveTab(0);
    setPaginationModel({ page: 0, pageSize: 25 });
  };

  // Export to CSV
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (selectedSource !== 'ALL') params.set('sources', selectedSource);
    if (selectedLevels.length > 0) params.set('levels', selectedLevels.join(','));
    if (selectedEventType !== 'ALL') params.set('eventTypes', selectedEventType);
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    params.set('format', 'csv');

    const token = localStorage.getItem('ortho_auth_token') || localStorage.getItem('token') || '';
    if (token) {
      params.set('auth_token', token);
    }

    window.open(`${API_BASE_URL}/api/admin/serilog/export?${params.toString()}`, '_blank');
  };

  // Perform purge
  const handleExecutePurge = async () => {
    setPurgeLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/serilog/purge?days=${purgeDays}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setToast({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setPurgeDialogOpen(false);
        fetchLogs();
        fetchGroupedOperations();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setToast({
        open: true,
        message: 'Ошибка при очистке: ' + e.message,
        severity: 'error'
      });
    } finally {
      setPurgeLoading(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setToast({
      open: true,
      message: `${label} скопирован в буфер обмена`,
      severity: 'success'
    });
  };

  // Level chip renderer
  const renderLevelChip = (level: string) => {
    const lvl = (level || '').toLowerCase();
    if (lvl === 'fatal') {
      return <Chip size="small" label="FATAL" sx={{ bgcolor: '#7F1D1D', color: '#FFFFFF', fontWeight: 700 }} />;
    }
    if (lvl === 'error') {
      return <Chip size="small" label="ERROR" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700 }} />;
    }
    if (lvl === 'warning' || lvl === 'warn') {
      return <Chip size="small" label="WARN" sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 600 }} />;
    }
    if (lvl === 'debug') {
      return <Chip size="small" label="DEBUG" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 500 }} />;
    }
    return <Chip size="small" label="INFO" sx={{ bgcolor: '#E0F2FE', color: '#0284C7', fontWeight: 600 }} />;
  };

  // Columns for Tab 0: Flat Logs (Full Serilog Information)
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 75,
      sortable: true
    },
    {
      field: 'timestamp',
      headerName: 'Время',
      width: 165,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ whiteSpace: 'normal', lineHeight: 1.25 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.8rem' }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'level',
      headerName: 'Уровень',
      width: 95,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => renderLevelChip(params.value)
    },
    {
      field: 'source_context',
      headerName: 'Служба / Контекст',
      flex: 1.4,
      minWidth: 170,
      renderCell: (params: GridRenderCellParams) => {
        const src = params.value || 'OrthoERP';
        const svcInfo = getServiceReadable(src);

        return (
          <Tooltip title={`Технический контекст: ${src}`}>
            <Box sx={{ whiteSpace: 'normal', lineHeight: 1.2 }}>
              <Chip
                size="small"
                label={svcInfo.title}
                sx={{
                  bgcolor: svcInfo.bg,
                  color: svcInfo.color,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  maxWidth: '100%'
                }}
              />
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.675rem', mt: 0.2 }}>
                {src.replace('OrthoErp.', '')}
              </Typography>
            </Box>
          </Tooltip>
        );
      }
    },
    {
      field: 'event_type',
      headerName: 'Операция / Событие',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => {
        const evt = params.value || '—';
        const readable = getEventReadable(evt);
        return (
          <Box sx={{ whiteSpace: 'normal', lineHeight: 1.25 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.8rem' }}>
              {readable}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748B', fontSize: '0.7rem' }}>
              {evt}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'username',
      headerName: 'Пользователь / IP',
      flex: 1.1,
      minWidth: 140,
      renderCell: (params: GridRenderCellParams) => {
        const username = params.value;
        const ip = params.row.client_ip;
        return (
          <Box sx={{ whiteSpace: 'normal', lineHeight: 1.2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.8rem' }}>
              {username ? `@${username}` : 'system'}
            </Typography>
            {ip && (
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                {ip}
              </Typography>
            )}
          </Box>
        );
      }
    },
    {
      field: 'context_links',
      headerName: 'Контекст',
      width: 140,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const r = params.row;
        const badges = [];
        if (r.patient_id) badges.push(`Пациент #${r.patient_id}`);
        if (r.doctor_id) badges.push(`Врач #${r.doctor_id}`);
        if (r.protocol_id) badges.push(`Протокол #${r.protocol_id}`);
        if (r.appointment_id) badges.push(`Прием #${r.appointment_id}`);

        if (badges.length === 0) return <Typography variant="caption" sx={{ color: '#94A3B8' }}>—</Typography>;

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            {badges.slice(0, 2).map((b, i) => (
              <Chip key={i} size="small" label={b} sx={{ height: 18, fontSize: '0.675rem', bgcolor: '#F1F5F9', color: '#334155' }} />
            ))}
          </Box>
        );
      }
    },
    {
      field: 'message',
      headerName: 'Сообщение лога',
      flex: 3,
      minWidth: 260,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
          <Typography variant="body2" sx={{ color: '#1E293B', fontSize: '0.825rem' }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'duration_ms',
      headerName: 'Длит.',
      width: 90,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => {
        const ms = params.value || 0;
        if (ms <= 0) return <Typography variant="caption" sx={{ color: '#94A3B8' }}>—</Typography>;
        let color = '#059669';
        let bg = '#ECFDF5';
        if (ms > 1000) { color = '#DC2626'; bg = '#FEF2F2'; }
        else if (ms > 200) { color = '#D97706'; bg = '#FEF3C7'; }

        return (
          <Chip
            size="small"
            label={`${ms}мс`}
            sx={{ bgcolor: bg, color, fontWeight: 600, fontSize: '0.7rem', height: 20 }}
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Детали',
      width: 75,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="Инспекция CLEF JSON, параметров и стек-трейса">
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setSelectedLog(params.row);
              setDrawerOpen(true);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], []);

  // Columns for Tab 1: Grouped Operations DataGrid
  const groupedColumns: GridColDef[] = useMemo(() => {
    const maxCount = groupedOperations.reduce((max, g) => Math.max(max, g.total_count), 1);

    return [
      {
        field: 'source_context',
        headerName: 'Служба бэкенда',
        flex: 1.3,
        minWidth: 170,
        renderCell: (params: GridRenderCellParams) => {
          const svcInfo = getServiceReadable(params.value);
          return (
            <Box sx={{ whiteSpace: 'normal', lineHeight: 1.2 }}>
              <Chip
                size="small"
                label={svcInfo.title}
                sx={{ bgcolor: svcInfo.bg, color: svcInfo.color, fontWeight: 700, fontSize: '0.75rem' }}
              />
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.675rem', mt: 0.2 }}>
                {params.value}
              </Typography>
            </Box>
          );
        }
      },
      {
        field: 'event_type',
        headerName: 'Операция / Событие',
        flex: 1.8,
        minWidth: 220,
        renderCell: (params: GridRenderCellParams) => {
          const readable = getEventReadable(params.value);
          return (
            <Box sx={{ whiteSpace: 'normal', lineHeight: 1.25 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.825rem' }}>
                {readable}
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748B', fontSize: '0.7rem' }}>
                {params.value}
              </Typography>
            </Box>
          );
        }
      },
      {
        field: 'total_count',
        headerName: 'Вызовов',
        width: 140,
        sortable: true,
        renderCell: (params: GridRenderCellParams) => {
          const count = params.value as number;
          const pct = Math.round((count / maxCount) * 100);
          return (
            <Box sx={{ width: '100%', pr: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {count.toLocaleString('ru-RU')}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  {pct}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: '#E2E8F0' }} />
            </Box>
          );
        }
      },
      {
        field: 'status_breakdown',
        headerName: 'Статусы (Инфо / Варн / Ошибки)',
        width: 210,
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as GroupedOperationItem;
          return (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                size="small"
                label={row.info_count}
                sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}
              />
              {row.warn_count > 0 && (
                <Chip
                  size="small"
                  label={row.warn_count}
                  sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#FFFBEB', color: '#B45309', fontWeight: 700 }}
                />
              )}
              {row.error_count > 0 && (
                <Chip
                  size="small"
                  label={row.error_count}
                  sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 700 }}
                />
              )}
            </Box>
          );
        }
      },
      {
        field: 'avg_duration_ms',
        headerName: 'Средн. время',
        width: 120,
        sortable: true,
        renderCell: (params: GridRenderCellParams) => {
          const ms = params.value as number | null;
          if (!ms) return <Typography variant="caption" sx={{ color: '#94A3B8' }}>—</Typography>;
          return (
            <Typography variant="body2" sx={{ fontWeight: 600, color: ms > 500 ? '#DC2626' : '#1E293B' }}>
              {ms} мс
            </Typography>
          );
        }
      },
      {
        field: 'last_seen',
        headerName: 'Последняя активность',
        width: 160,
        sortable: true,
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
            {params.value}
          </Typography>
        )
      },
      {
        field: 'users_list',
        headerName: 'Пользователи',
        flex: 1.1,
        minWidth: 140,
        renderCell: (params: GridRenderCellParams) => {
          const users = params.value ? String(params.value).split(',').filter(Boolean) : [];
          if (users.length === 0) return <Typography variant="caption" sx={{ color: '#94A3B8' }}>system / auto</Typography>;
          return (
            <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap' }}>
              {users.slice(0, 3).map((u, i) => (
                <Chip key={i} size="small" label={`@${u}`} sx={{ height: 18, fontSize: '0.675rem', bgcolor: '#F1F5F9' }} />
              ))}
              {users.length > 3 && (
                <Typography variant="caption" sx={{ color: '#64748B' }}>+{users.length - 3}</Typography>
              )}
            </Box>
          );
        }
      },
      {
        field: 'drilldown',
        headerName: 'Действие',
        width: 130,
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as GroupedOperationItem;
          return (
            <Button
              size="small"
              variant="outlined"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
              onClick={() => handleDrilldownToLogs(row.source_context, row.event_type)}
              sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25 }}
            >
              События
            </Button>
          );
        }
      }
    ];
  }, [groupedOperations]);

  // Custom toolbars and footers
  const customToolbar = useCallback(() => (
    <SerilogGridToolbar onResetFilters={handleResetFilters} />
  ), []);

  const customFooter = useCallback(() => (
    <SerilogGridFooter
      totalCount={totalRows}
      infoCount={summary.levelBreakdown['Information'] || 0}
      warnCount={summary.levelBreakdown['Warning'] || 0}
      errorCount={(summary.levelBreakdown['Error'] || 0) + (summary.levelBreakdown['Fatal'] || 0)}
      avgDuration={summary.avgDurationMs || 0}
    />
  ), [totalRows, summary]);

  // Drawer Parsed JSON
  const parsedDrawerProps = useMemo(() => {
    if (!selectedLog || !selectedLog.properties_json) return null;
    try {
      return JSON.parse(selectedLog.properties_json);
    } catch {
      return selectedLog.properties_json;
    }
  }, [selectedLog]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* 1. Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ManageSearchIcon sx={{ fontSize: 32, color: '#0284C7' }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Журнал и Аналитика Serilog
            </Typography>
            <Chip
              size="small"
              label="Центральный аудит бэкенда"
              sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Сквозной сбор телеметрии бэкенда (Node.js, .NET Fiscal, MedFlex, POS, Выплаты, Склад) и группировка операций
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Auto Refresh selector */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Автообновление</InputLabel>
            <Select
              value={autoRefreshInterval}
              label="Автообновление"
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
            >
              <MenuItem value={0}>Выкл</MenuItem>
              <MenuItem value={5}>Каждые 5 сек</MenuItem>
              <MenuItem value={15}>Каждые 15 сек</MenuItem>
              <MenuItem value={30}>Каждые 30 сек</MenuItem>
            </Select>
          </FormControl>

          {/* Manual Refresh */}
          <Tooltip title={`Последнее обновление: ${lastUpdated.toLocaleTimeString()}`}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={loading || groupedLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={() => {
                fetchLogs();
                if (activeTab === 1 || activeTab === 2) fetchGroupedOperations();
              }}
              disabled={loading || groupedLoading}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Обновить
            </Button>
          </Tooltip>

          {/* CSV Export */}
          {canExport && (
            <Button
              variant="contained"
              size="medium"
              color="primary"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportCsv}
              sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#0F3C64' }}
            >
              Экспорт CSV
            </Button>
          )}

          {/* Purge button */}
          {canPurge && (
            <Tooltip title="Очистить устаревшие логи из базы SQLite">
              <Button
                variant="outlined"
                color="error"
                size="medium"
                startIcon={<DeleteSweepIcon />}
                onClick={() => setPurgeDialogOpen(true)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Очистить
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* 2. KPI Summary Bar (4 Cards) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {/* Total Logs */}
        <Card
          sx={{
            cursor: 'pointer',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'transform 0.15s ease-in-out',
            '&:hover': { transform: 'translateY(-2px)' }
          }}
          onClick={() => {
            setSelectedLevels([]);
            setActiveTab(0);
            setPaginationModel({ page: 0, pageSize: 25 });
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                Всего событий
              </Typography>
              <DnsIcon sx={{ color: '#0284C7', fontSize: 22 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', mt: 1 }}>
              {summary.totalLogs.toLocaleString('ru-RU')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Все службы за выбранный период
            </Typography>
          </CardContent>
        </Card>

        {/* Errors & Fatal */}
        <Card
          sx={{
            cursor: 'pointer',
            border: '1px solid #FECACA',
            bgcolor: summary.totalErrors > 0 ? '#FFF5F5' : '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'transform 0.15s ease-in-out',
            '&:hover': { transform: 'translateY(-2px)' }
          }}
          onClick={() => {
            setSelectedLevels(['Error', 'Fatal']);
            setActiveTab(0);
            setPaginationModel({ page: 0, pageSize: 25 });
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#DC2626', textTransform: 'uppercase' }}>
                Ошибки и Сбои
              </Typography>
              <ErrorIcon sx={{ color: '#DC2626', fontSize: 22 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#DC2626', mt: 1 }}>
              {summary.totalErrors.toLocaleString('ru-RU')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#DC2626' }}>
              {summary.totalErrors > 0 ? 'Нажмите, чтобы отфильтровать сбои' : 'Сбоев в выборке не зафиксировано'}
            </Typography>
          </CardContent>
        </Card>

        {/* Warnings */}
        <Card
          sx={{
            cursor: 'pointer',
            border: '1px solid #FDE68A',
            bgcolor: summary.totalWarnings > 0 ? '#FFFDF5' : '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'transform 0.15s ease-in-out',
            '&:hover': { transform: 'translateY(-2px)' }
          }}
          onClick={() => {
            setSelectedLevels(['Warning']);
            setActiveTab(0);
            setPaginationModel({ page: 0, pageSize: 25 });
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#D97706', textTransform: 'uppercase' }}>
                Предупреждения
              </Typography>
              <WarningAmberIcon sx={{ color: '#D97706', fontSize: 22 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#D97706', mt: 1 }}>
              {summary.totalWarnings.toLocaleString('ru-RU')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#D97706' }}>
              События, требующие внимания
            </Typography>
          </CardContent>
        </Card>

        {/* User Actions */}
        <Card
          sx={{
            cursor: 'pointer',
            border: '1px solid #C7D2FE',
            bgcolor: '#F5F7FF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'transform 0.15s ease-in-out',
            '&:hover': { transform: 'translateY(-2px)' }
          }}
          onClick={() => {
            setActiveTab(1);
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#4F46E5', textTransform: 'uppercase' }}>
                Группы операций
              </Typography>
              <AccountTreeIcon sx={{ color: '#4F46E5', fontSize: 22 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#4F46E5', mt: 1 }}>
              {groupedOperations.length || summary.topEvents.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#4F46E5' }}>
              Нажмите для группировки операций
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 3. Advanced Search & Filter Bar */}
      <Paper sx={{ p: 2.5, mb: 3, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
            Параметры фильтрации и полнотекстовый поиск (SQLite FTS5)
          </Typography>

          {/* Date preset chips */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {(['today', 'yesterday', '7days', '30days', 'all'] as const).map((preset) => {
              const labels = {
                today: 'Сегодня',
                yesterday: 'Вчера',
                '7days': '7 дней',
                '30days': '30 дней',
                all: 'Все время'
              };
              const active = datePreset === preset;
              return (
                <Chip
                  key={preset}
                  label={labels[preset]}
                  size="small"
                  onClick={() => setDatePreset(preset)}
                  sx={{
                    fontWeight: 600,
                    cursor: 'pointer',
                    bgcolor: active ? '#0F3C64' : '#F1F5F9',
                    color: active ? '#FFFFFF' : '#475569'
                  }}
                />
              );
            })}
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {/* FTS Search Input */}
          <TextField
            label="Полнотекстовый поиск FTS"
            placeholder="Поиск по сообщениям, JSON, стеку..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPaginationModel({ page: 0, pageSize: 25 });
                fetchLogs();
                if (activeTab === 1 || activeTab === 2) fetchGroupedOperations();
              }
            }}
          />

          {/* Source context selector */}
          <FormControl size="small">
            <InputLabel>Служба / Контекст</InputLabel>
            <Select
              value={selectedSource}
              label="Служба / Контекст"
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setPaginationModel({ page: 0, pageSize: 25 });
              }}
            >
              <MenuItem value="ALL">Все службы (Unified)</MenuItem>
              {sourceOptions.map(src => {
                const sInfo = getServiceReadable(src);
                return (
                  <MenuItem key={src} value={src}>
                    {sInfo.title} ({src.replace('OrthoErp.', '')})
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Event type selector */}
          <FormControl size="small">
            <InputLabel>Тип события</InputLabel>
            <Select
              value={selectedEventType}
              label="Тип события"
              onChange={(e) => {
                setSelectedEventType(e.target.value);
                setPaginationModel({ page: 0, pageSize: 25 });
              }}
            >
              <MenuItem value="ALL">Все типы событий</MenuItem>
              {eventTypeOptions.map(evt => (
                <MenuItem key={evt} value={evt}>
                  {getEventReadable(evt)} ({evt})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Level Filter Chips */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            {['Information', 'Warning', 'Error', 'Fatal', 'Debug'].map((lvl) => {
              const active = selectedLevels.includes(lvl);
              return (
                <Chip
                  key={lvl}
                  size="small"
                  label={lvl.slice(0, 4)}
                  clickable
                  onClick={() => {
                    setSelectedLevels(prev =>
                      prev.includes(lvl) ? prev.filter(x => x !== lvl) : [...prev, lvl]
                    );
                    setPaginationModel({ page: 0, pageSize: 25 });
                  }}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: active ? '#0284C7' : '#F1F5F9',
                    color: active ? '#FFFFFF' : '#64748B'
                  }}
                />
              );
            })}
          </Box>
        </Box>
      </Paper>

      {/* 4. Tabs Header for Analyzing Modes */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              minHeight: 48,
              py: 1
            }
          }}
        >
          <Tab
            icon={<TableRowsIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Все события Serilog</span>
                <Chip size="small" label={totalRows.toLocaleString('ru-RU')} sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#E0F2FE', color: '#0284C7' }} />
              </Box>
            }
          />
          <Tab
            icon={<AccountTreeIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Группировка по операциям</span>
                <Chip size="small" label={groupedOperations.length} sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#EEF2FF', color: '#4F46E5' }} />
              </Box>
            }
          />
          <Tab
            icon={<HubIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Службы бэкенда</span>
                <Chip size="small" label={servicesSummary.length || sourceOptions.length} sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#F1F5F9', color: '#475569' }} />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* TAB 0: Flat Logs (Full Serilog Information & DataGrid) */}
      {activeTab === 0 && (
        <Paper sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
          <DataGrid
            showToolbar
            autoHeight
            getRowHeight={() => 'auto'}
            rows={logs}
            columns={columns}
            loading={loading}
            rowCount={totalRows}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            slots={{
              toolbar: customToolbar,
              footer: customFooter
            }}
            sx={{
              width: '100%',
              border: 'none',
              '& .MuiDataGrid-virtualScroller': {
                overflowX: 'hidden'
              },
              '& .MuiDataGrid-columnHeaders': {
                position: 'sticky',
                top: 0,
                zIndex: 1,
                bgcolor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                fontWeight: 700
              },
              '& .MuiDataGrid-row': {
                borderBottom: '1px solid #F1F5F9',
                '&:hover': {
                  bgcolor: '#F8FAFC'
                }
              },
              '& .MuiDataGrid-cell': {
                py: 1,
                alignItems: 'center'
              }
            }}
          />
        </Paper>
      )}

      {/* TAB 1: Grouped Operations DataGrid */}
      {activeTab === 1 && (
        <Paper sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Сводная группировка по операциям и службам бэкенда ({groupedOperations.length} уникальных операций)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Нажмите кнопку «События» напротив любой операции для мгновенного перехода в реестр
            </Typography>
          </Box>
          <DataGrid
            autoHeight
            getRowHeight={() => 'auto'}
            rows={groupedOperations.map((g, idx) => ({ id: `${g.source_context}_${g.event_type}_${idx}`, ...g }))}
            columns={groupedColumns}
            loading={groupedLoading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } }
            }}
            sx={{
              width: '100%',
              border: 'none',
              '& .MuiDataGrid-virtualScroller': {
                overflowX: 'hidden'
              },
              '& .MuiDataGrid-columnHeaders': {
                position: 'sticky',
                top: 0,
                zIndex: 1,
                bgcolor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                fontWeight: 700
              },
              '& .MuiDataGrid-row': {
                borderBottom: '1px solid #F1F5F9',
                '&:hover': {
                  bgcolor: '#F8FAFC'
                }
              },
              '& .MuiDataGrid-cell': {
                py: 1,
                alignItems: 'center'
              }
            }}
          />
        </Paper>
      )}

      {/* TAB 2: Backend Services Overview & Monitoring Cards */}
      {activeTab === 2 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          {servicesSummary.map((svc) => {
            const svcInfo = getServiceReadable(svc.source_context);
            const hasErrors = svc.error_count > 0;

            return (
              <Card
                key={svc.source_context}
                sx={{
                  border: `1px solid ${hasErrors ? '#FECACA' : '#E2E8F0'}`,
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Chip
                      size="small"
                      label={svcInfo.title}
                      sx={{ bgcolor: svcInfo.bg, color: svcInfo.color, fontWeight: 700, fontSize: '0.8rem' }}
                    />
                    {hasErrors ? (
                      <Chip
                        size="small"
                        icon={<ErrorIcon sx={{ fontSize: 14 }} />}
                        label={`${svc.error_count} сбоев`}
                        sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 700 }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                        label="Штатно"
                        sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 600 }}
                      />
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#64748B', fontSize: '0.75rem', mb: 2 }}>
                    {svc.source_context}
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Всего событий</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>{svc.total_events.toLocaleString('ru-RU')}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Операций</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0284C7' }}>{svc.operations_count}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Среднее время</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mt: 0.5 }}>
                        {svc.avg_duration_ms ? `${svc.avg_duration_ms} мс` : '—'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Последний лог</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#475569', fontWeight: 600, mt: 0.5 }}>
                        {svc.last_seen ? svc.last_seen.slice(11, 19) : '—'}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleDrilldownToService(svc.source_context)}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Показать журнал службы
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* 5. Slide-Over Detail Drawer (Full CLEF & Exception Inspector) */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: { width: { xs: '100%', sm: 540, md: 640 }, p: 3, bgcolor: '#FFFFFF' }
          }
        }}
      >
        {selectedLog && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ManageSearchIcon sx={{ color: '#0284C7', fontSize: 26 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Инспекция CLEF #{selectedLog.id}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {/* Quick Metadata Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
              <Paper sx={{ p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Время события</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>{selectedLog.timestamp}</Typography>
              </Paper>
              <Paper sx={{ p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Критичность</Typography>
                <Box sx={{ mt: 0.25 }}>{renderLevelChip(selectedLog.level)}</Box>
              </Paper>
              <Paper sx={{ p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Служба бэкенда</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>{selectedLog.source_context}</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>{getServiceReadable(selectedLog.source_context).title}</Typography>
              </Paper>
              <Paper sx={{ p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Операция</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>{getEventReadable(selectedLog.event_type)}</Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'monospace' }}>{selectedLog.event_type}</Typography>
              </Paper>
              <Paper sx={{ p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Пользователь / IP</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {selectedLog.username ? `@${selectedLog.username}` : 'system'} ({selectedLog.client_ip || '127.0.0.1'})
                </Typography>
              </Paper>
              <Paper sx={{ p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Длительность</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                  {selectedLog.duration_ms > 0 ? `${selectedLog.duration_ms} мс` : '—'}
                </Typography>
              </Paper>
            </Box>

            {/* Context IDs */}
            {(selectedLog.patient_id || selectedLog.doctor_id || selectedLog.protocol_id || selectedLog.appointment_id) && (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Идентификаторы клинического контекста
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                  {selectedLog.patient_id && <Chip label={`Пациент ID: ${selectedLog.patient_id}`} size="small" sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 600 }} />}
                  {selectedLog.doctor_id && <Chip label={`Врач / Сотрудник ID: ${selectedLog.doctor_id}`} size="small" sx={{ bgcolor: '#EEF2FF', color: '#4338CA', fontWeight: 600 }} />}
                  {selectedLog.protocol_id && <Chip label={`Протокол ID: ${selectedLog.protocol_id}`} size="small" sx={{ bgcolor: '#F3E8FF', color: '#7E22CE', fontWeight: 600 }} />}
                  {selectedLog.appointment_id && <Chip label={`Прием ID: ${selectedLog.appointment_id}`} size="small" sx={{ bgcolor: '#ECFDF5', color: '#047857', fontWeight: 600 }} />}
                </Box>
              </Box>
            )}

            {/* Message Box */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Сообщение лога (@mt)
              </Typography>
              <Paper sx={{ p: 1.5, mt: 0.5, bgcolor: '#F1F5F9', border: '1px solid #CBD5E1' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {selectedLog.message}
                </Typography>
              </Paper>
            </Box>

            {/* Structured Properties JSON */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Структурированные свойства (@properties)
                </Typography>
                {selectedLog.properties_json && (
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                    onClick={() => copyToClipboard(selectedLog.properties_json || '', 'JSON')}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0 }}
                  >
                    Копировать
                  </Button>
                )}
              </Box>
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: '#0F172A',
                  color: '#38BDF8',
                  fontFamily: 'Consolas, monospace',
                  fontSize: '0.8rem',
                  maxHeight: 280,
                  overflowY: 'auto',
                  border: '1px solid #334155',
                  borderRadius: 1
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {parsedDrawerProps ? JSON.stringify(parsedDrawerProps, null, 2) : '— Нет параметров —'}
                </pre>
              </Paper>
            </Box>

            {/* Exception Stack Trace */}
            {selectedLog.exception && (
              <Box sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
                    Стек исключения (@x)
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                    onClick={() => copyToClipboard(selectedLog.exception || '', 'Стек ошибки')}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0 }}
                  >
                    Копировать
                  </Button>
                </Box>
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: '#450A0A',
                    color: '#FCA5A5',
                    fontFamily: 'Consolas, monospace',
                    fontSize: '0.75rem',
                    maxHeight: 240,
                    overflowY: 'auto',
                    border: '1px solid #991B1B',
                    borderRadius: 1
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {selectedLog.exception}
                  </pre>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </Drawer>

      {/* 6. Purge Retention Maintenance Dialog */}
      <Dialog open={purgeDialogOpen} onClose={() => setPurgeDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F172A' }}>
          Очистка журналов Serilog
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
            Удаление устаревших записей логов из локальной базы данных SQLite для поддержания оптимального размера и быстродействия FTS5.
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Срок хранения</InputLabel>
            <Select
              value={purgeDays}
              label="Срок хранения"
              onChange={(e) => setPurgeDays(Number(e.target.value))}
            >
              <MenuItem value={30}>Удалить старше 30 дней</MenuItem>
              <MenuItem value={60}>Удалить старше 60 дней</MenuItem>
              <MenuItem value={90}>Удалить старше 90 дней</MenuItem>
              <MenuItem value={180}>Удалить старше 180 дней (По умолчанию)</MenuItem>
              <MenuItem value={365}>Удалить старше 1 года</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setPurgeDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleExecutePurge}
            disabled={purgeLoading}
            startIcon={purgeLoading ? <CircularProgress size={16} /> : <DeleteSweepIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Очистить логи
          </Button>
        </DialogActions>
      </Dialog>

      {/* 7. Toast Snackbar */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
