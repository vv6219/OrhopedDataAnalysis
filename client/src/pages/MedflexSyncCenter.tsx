import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Alert,
  RadioGroup,
  Radio
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PrintIcon from '@mui/icons-material/Print';
import BugReportIcon from '@mui/icons-material/BugReport';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import StorageIcon from '@mui/icons-material/Storage';
import ScienceIcon from '@mui/icons-material/Science';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AutoDeleteIcon from '@mui/icons-material/AutoDelete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import {
  DataGrid,
  type GridColDef,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import { useReactToPrint } from 'react-to-print';
import { API_BASE_URL } from '../config/apiConfig';
import MedflexLiveStatusBar from '../components/medflex/MedflexLiveStatusBar';
import {
  MedflexIncidentReportTemplate,
  type IncidentReportItem
} from '../components/medflex/MedflexIncidentReportTemplate';

// Module-level custom toolbar for MedFlex Serilog DataGrid (per grid-improvements skill)
function MedflexSerilogCustomToolbar({
  onResetFilters,
  onlyFails,
  onToggleOnlyFails
}: {
  onResetFilters: () => void;
  onlyFails: boolean;
  onToggleOnlyFails: (val: boolean) => void;
}) {
  return (
    <GridToolbarContainer sx={{ p: 1.5, gap: 1, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC', flexWrap: 'wrap' }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport printOptions={{ disableToolbarButton: true }} />

      <Button
        size="small"
        startIcon={<FilterAltOffIcon />}
        onClick={onResetFilters}
        sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
      >
        Сбросить фильтры
      </Button>

      <Button
        size="small"
        variant={onlyFails ? 'contained' : 'outlined'}
        color={onlyFails ? 'warning' : 'inherit'}
        startIcon={<ReportProblemIcon />}
        onClick={() => onToggleOnlyFails(!onlyFails)}
        sx={{
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 2,
          ml: 1
        }}
      >
        {onlyFails ? 'Показаны: Только сбои и коллизии (ВКЛ)' : 'Сбои и коллизии'}
      </Button>

      <Box sx={{ ml: 'auto', width: 280 }}>
        <GridToolbarQuickFilter debounceMs={300} />
      </Box>
    </GridToolbarContainer>
  );
}

// Module-level custom footer for MedFlex Serilog DataGrid displaying accounting totals (per grid-improvements skill)
function MedflexSerilogCustomFooter({
  totalCount,
  errorCount,
  warningCount,
  duplicateCount,
  avgLatency
}: {
  totalCount: number;
  errorCount: number;
  warningCount: number;
  duplicateCount: number;
  avgLatency: number;
}) {
  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        borderTop: '1px solid #E2E8F0',
        bgcolor: '#F8FAFC'
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
          Всего записей в отчёте: {totalCount}
        </Typography>
        {errorCount > 0 ? (
          <Chip size="small" label={`Ошибок (Error): ${errorCount}`} sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 700 }} />
        ) : (
          <Chip size="small" label="Ошибок: 0" sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600 }} />
        )}
        {warningCount > 0 && (
          <Chip size="small" label={`Коллизий/Предупреждений: ${warningCount}`} sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }} />
        )}
        {duplicateCount > 0 && (
          <Chip size="small" label={`Подавлено дублей: ${duplicateCount}`} sx={{ bgcolor: '#E0E7FF', color: '#3730A3', fontWeight: 600 }} />
        )}
      </Box>
      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
        Среднее время RTT: <b>{avgLatency} мс</b> • Хранилище: SQLite (таблица medflex_audit_logs)
      </Typography>
    </Box>
  );
}

export default function MedflexSyncCenter() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [kpi, setKpi] = useState<any>(null);
  const [incidents, setIncidents] = useState<IncidentReportItem[]>([]);
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'open' | 'critical' | 'resolved'>('all');
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logLevelFilter, setLogLevelFilter] = useState('all');
  const [onlyFailsFilter, setOnlyFailsFilter] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);
  const [settings, setSettings] = useState<any>({
    mode: 'sandbox',
    sandbox_direction: 'dual',
    clinic_token: '',
    filial_id: 1,
    webhook_secret: '',
    ping_interval_sec: 60,
    schedule_sync_interval_min: 30
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; severity: 'success' | 'info' | 'error' | 'warning' } | null>(null);
  const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Handle manual purge of Serilog audit logs older than 3 months
  const handleExecuteCleanup = async () => {
    setCleanupLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/medflex/reports/audit-logs/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionMonths: 3 })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          text: data.message || 'Очистка журнала аудита старше 3 месяцев успешно выполнена',
          severity: 'success'
        });
        fetchAuditLogs();
      } else {
        setActionMessage({
          text: data.error || 'Ошибка очистки логов',
          severity: 'error'
        });
      }
    } catch (err: any) {
      setActionMessage({
        text: err.message || 'Сбой сети при очистке журнала аудита',
        severity: 'error'
      });
    } finally {
      setCleanupLoading(false);
      setCleanupConfirmOpen(false);
    }
  };

  // Print ref for react-to-print
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrintReport = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Aкт_инцидентов_MedFlex_${new Date().toISOString().slice(0, 10)}`
  });

  // 1. Fetch KPI
  const fetchKpi = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/medflex/reports/kpi`);
      const data = await res.json();
      if (data.success) {
        setKpi(data.kpi);
      }
    } catch (err) {
      console.warn('Failed to fetch KPI:', err);
    }
  }, []);

  // 2. Fetch Incidents
  const fetchIncidents = useCallback(async () => {
    try {
      let statusParam = 'all';
      let severityParam = 'all';
      if (incidentFilter === 'open') statusParam = 'open';
      else if (incidentFilter === 'resolved') statusParam = 'resolved';
      else if (incidentFilter === 'critical') severityParam = 'critical';

      const url = `${API_BASE_URL}/api/medflex/reports/incidents?status=${statusParam}&severity=${severityParam}&limit=100`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setIncidents(data.incidents || []);
      }
    } catch (err) {
      console.warn('Failed to fetch incidents:', err);
    }
  }, [incidentFilter]);

  // 3. Fetch Settings & Queue
  const fetchSettingsAndQueue = useCallback(async () => {
    try {
      const [sRes, qRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/medflex/admin/settings`),
        fetch(`${API_BASE_URL}/api/medflex/admin/queue`)
      ]);
      const [sData, qData] = await Promise.all([sRes.json(), qRes.json()]);
      if (sData.success) setSettings(sData.settings);
      if (qData.success) setQueue(qData.queue || []);
    } catch (err) {
      console.warn('Failed to fetch settings/queue:', err);
    }
  }, []);

  // 4. Fetch Doctors
  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/doctors`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.staffDoctors || []);
      }
    } catch (err) {
      console.warn('Failed to fetch doctors:', err);
    }
  }, []);

  // 5. Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/medflex/reports/audit-logs?level=${logLevelFilter}&onlyFails=${onlyFailsFilter}&limit=300`
      );
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
    }
  }, [logLevelFilter, onlyFailsFilter]);

  // Statistics for Serilog DataGrid footer
  const auditStats = {
    total: auditLogs.length,
    errors: auditLogs.filter((l) => l.level === 'Error' || l.level === 'Fatal').length,
    warnings: auditLogs.filter((l) => l.level === 'Warning' || (l.event_type && l.event_type.includes('conflict'))).length,
    duplicates: auditLogs.filter((l) => l.is_duplicate === 1 || (l.event_type && l.event_type.includes('duplicate'))).length,
    avgLatency:
      auditLogs.length > 0
        ? Math.round(auditLogs.reduce((acc, curr) => acc + (curr.duration_ms || 0), 0) / auditLogs.length)
        : 0
  };

  // DataGrid Columns for Serilog report (per grid-improvements skill)
  const auditColumns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 75,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
          #{params.value}
        </Typography>
      )
    },
    {
      field: 'timestamp',
      headerName: 'Время',
      width: 155,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'level',
      headerName: 'Уровень',
      width: 120,
      renderCell: (params) => {
        const lvl = params.value;
        const isErr = lvl === 'Error' || lvl === 'Fatal';
        const isWarn = lvl === 'Warning';
        return (
          <Chip
            size="small"
            label={lvl}
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              color: isErr ? '#991B1B' : isWarn ? '#92400E' : '#065F46',
              bgcolor: isErr ? '#FEE2E2' : isWarn ? '#FEF3C7' : '#D1FAE5'
            }}
          />
        );
      }
    },
    {
      field: 'event_type',
      headerName: 'Событие Serilog',
      width: 215,
      renderCell: (params) => {
        const evt = String(params.value || '');
        const isConflict = evt.includes('conflict') || evt.includes('duplicate');
        const isFail = evt.includes('fail') || evt.includes('lost') || evt.includes('rejected');
        return (
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              color: isConflict ? '#D97706' : isFail ? '#DC2626' : '#2563EB',
              lineHeight: 1.2
            }}
          >
            {evt}
          </Typography>
        );
      }
    },
    {
      field: 'direction',
      headerName: 'Канал',
      width: 105,
      renderCell: (params) => (
        <Chip
          size="small"
          variant="outlined"
          label={params.value === 'Inbound' ? '📥 Вход' : '📤 Исход'}
          sx={{ fontSize: '0.7rem', fontWeight: 600 }}
        />
      )
    },
    {
      field: 'message',
      headerName: 'Сообщение / Детали сбоя или коллизии',
      flex: 3,
      minWidth: 280,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.82rem',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: 1.35,
            py: 1
          }}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'claim_id',
      headerName: 'MedFlex Claim',
      width: 145,
      renderCell: (params) =>
        params.value ? (
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#475569' }}>
            {params.value}
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            —
          </Typography>
        )
    },
    {
      field: 'duration_ms',
      headerName: 'RTT',
      width: 85,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
          {params.value ? `${params.value} мс` : '—'}
        </Typography>
      )
    },
    {
      field: 'http_status',
      headerName: 'HTTP',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const st = params.value;
        if (!st) return <Typography variant="caption" sx={{ color: '#94A3B8' }}>—</Typography>;
        const isOk = st >= 200 && st < 300;
        return (
          <Chip
            size="small"
            label={st}
            sx={{
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 700,
              bgcolor: isOk ? '#F0FDF4' : '#FEF2F2',
              color: isOk ? '#166534' : '#991B1B'
            }}
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Инфо',
      width: 75,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Посмотреть полный Serilog JSON и стек">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAuditLog(params.row);
            }}
            sx={{ color: '#2563EB' }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  useEffect(() => {
    fetchKpi();
    fetchIncidents();
    fetchSettingsAndQueue();
  }, [fetchKpi, fetchIncidents, fetchSettingsAndQueue]);

  useEffect(() => {
    if (activeTab === 2) fetchDoctors();
    if (activeTab === 3) fetchAuditLogs();
  }, [activeTab, fetchDoctors, fetchAuditLogs]);

  // Handlers
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ text: 'Настройки MedFlex успешно сохранены!', severity: 'success' });
        fetchSettingsAndQueue();
        fetchKpi();
      }
    } catch (err: any) {
      setActionMessage({ text: `Ошибка сохранения: ${err.message}`, severity: 'error' });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleFlushQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/queue/flush`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          text: `Очередь сброшена! Успешно отправлено: ${data.result.successful}, Ошибок: ${data.result.failed}`,
          severity: data.result.failed > 0 ? 'info' : 'success'
        });
        fetchSettingsAndQueue();
        fetchKpi();
      }
    } catch (err: any) {
      setActionMessage({ text: `Ошибка отправки очереди: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSchedule = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/sync-schedule`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ text: 'Сетка расписания на 30 дней успешно выгружена в MedFlex!', severity: 'success' });
        fetchKpi();
      } else {
        setActionMessage({ text: data.message || 'Ошибка выгрузки сетки', severity: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: `Ошибка: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePullCurrentAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/pull-appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success && data.result) {
        const { total, importedCount, existingCount, collisionCount, errorCount } = data.result;
        let msg = `Проверено записей: ${total}. `;
        if (importedCount > 0) msg += `Новых добавлено в календарь: ${importedCount}. `;
        if (existingCount > 0) msg += `Уже в календаре: ${existingCount}. `;
        if (collisionCount > 0) msg += `Коллизий времени: ${collisionCount}. `;
        if (errorCount > 0) msg += `Ошибок: ${errorCount}.`;

        setActionMessage({
          text: msg.trim(),
          severity: collisionCount > 0 || errorCount > 0 ? 'warning' : 'success'
        });
        fetchKpi();
        fetchIncidents();
      } else {
        setActionMessage({ text: data.error || 'Ошибка загрузки текущих записей', severity: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: `Ошибка: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Test Daemon Simulators
  const handleSimulateBooking = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/simulate/booking`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          text: `[TEST_DAEMON] Онлайн-запись успешно создана! Пациент: ${data.webhook.client.last_name} ${data.webhook.client.first_name}, Запись #${data.result.appointmentId}`,
          severity: 'success'
        });
        fetchKpi();
        fetchIncidents();
      } else {
        setActionMessage({ text: data.error || 'Ошибка симуляции', severity: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: `Ошибка симуляции: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateCancel = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/simulate/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          text: `[TEST_DAEMON] ${data.message}`,
          severity: 'info'
        });
        fetchKpi();
        fetchIncidents();
        fetchAuditLogs();
      } else {
        setActionMessage({ text: data.error || 'Ошибка отмены', severity: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: `Ошибка: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateCollision = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/simulate/collision`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          text: `[TEST_DAEMON] Коллизия двойной записи успешно перехвачена! ${data.error}`,
          severity: 'info'
        });
        fetchKpi();
        fetchIncidents();
      } else {
        setActionMessage({ text: data.message || data.error, severity: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: `Ошибка: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateConnectionDrop = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/simulate/connection-drop`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ text: data.message, severity: data.simulatedFailureActive ? 'info' : 'success' });
        fetchKpi();
      }
    } catch (err: any) {
      setActionMessage({ text: `Ошибка: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenIncidentModal = (inc: any) => {
    setSelectedIncident(inc);
    setModalOpen(true);
  };

  const handleResolveIncident = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/medflex/reports/incidents/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved', resolved_by: 'Администратор клиники' })
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchIncidents();
        fetchKpi();
      }
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    }
  };

  const handleSaveDoctorMapping = async (doctorId: number, medflexDoctorId: number, syncEnabled: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/doctors/${doctorId}/mapping`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medflex_doctor_id: medflexDoctorId, medflex_sync_enabled: syncEnabled })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ text: 'Привязка доктора успешно сохранена', severity: 'success' });
        fetchDoctors();
      }
    } catch (err: any) {
      setActionMessage({ text: `Ошибка: ${err.message}`, severity: 'error' });
    }
  };

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* 1. Live Status & Ping Bar */}
      <MedflexLiveStatusBar onRefreshParent={fetchKpi} />

      {/* Action Notification Message */}
      {actionMessage && (
        <Alert
          severity={actionMessage.severity}
          onClose={() => setActionMessage(null)}
          sx={{ mb: 2.5, borderRadius: 2 }}
        >
          {actionMessage.text}
        </Alert>
      )}

      {/* 2. Top Header & [TEST_DAEMON] Toolbar */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Центр синхронизации онлайн-записи MedFlex
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Двусторонний обмен слотами, онлайн-бронирования «ПроДокторов» / «СберЗдоровье», RCA-диагностика и аудит Serilog
          </Typography>
        </Box>

        {/* TEST_DAEMON Toolbar */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Tooltip title="Сгенерировать правдоподобную онлайн-запись от пациента с ПроДокторов">
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={handleSimulateBooking}
              disabled={loading}
              startIcon={<ScienceIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              [TEST] Бронь с ПроДокторов
            </Button>
          </Tooltip>

          <Tooltip title="Сгенерировать отмену активной онлайн-записи со стороны пациента на ПроДокторов">
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              onClick={handleSimulateCancel}
              disabled={loading}
              startIcon={<EventBusyIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              [TEST] Отмена с ПроДокторов
            </Button>
          </Tooltip>

          <Tooltip title="Эмулировать попытку двойной записи на уже занятый интервал">
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={handleSimulateCollision}
              disabled={loading}
              startIcon={<BugReportIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              [TEST] Коллизия слота
            </Button>
          </Tooltip>

          <Tooltip title="Искусственно сымитировать обрыв соединения для проверки оффлайн-очереди">
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleSimulateConnectionDrop}
              disabled={loading}
              startIcon={<WifiOffIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              [TEST] Обрыв / Восстановить связь
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* 3. KPI Cards Grid */}
      {kpi && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  SLA Успешности онлайн-записи
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: kpi.slaPercent >= 99 ? '#10b981' : '#f59e0b' }}>
                    {kpi.slaPercent}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                    Цель $\ge$ 99.5%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Средний пинг (RTT задержка)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#3b82f6' }}>
                    {kpi.avgLatencyMs} мс
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    макс {kpi.maxLatencyMs} мс
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Всего онлайн-броней
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {kpi.totalBookings}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    ({kpi.cancelledBookings} отменено)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Инциденты синхронизации
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: kpi.openIncidents > 0 ? '#ef4444' : '#10b981' }}>
                    {kpi.openIncidents}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    из {kpi.totalIncidents} ({kpi.resolvedIncidents} решено)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Оффлайн-очередь повторов
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: kpi.queuePending > 0 ? '#f59e0b' : '#10b981' }}>
                    {kpi.queuePending}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {kpi.queuePending > 0 ? 'в ожидании' : 'пусто'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 4. Tabs Navigation */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ borderBottom: '1px solid #e2e8f0', px: 2 }}
        >
          <Tab icon={<SpeedIcon />} iconPosition="start" label="Мониторинг и Очередь" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab
            icon={<WarningAmberIcon />}
            iconPosition="start"
            label={`Реестр инцидентов и RCA (${incidents.filter((i) => i.status === 'open').length})`}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab icon={<PersonSearchIcon />} iconPosition="start" label="Сопоставление врачей" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab icon={<StorageIcon />} iconPosition="start" label="Журнал аудита Serilog (Сбои и коллизии)" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        {/* Tab 0: Monitoring, Sandbox Direction & Queue */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Left Column: Sandbox & Mode Settings */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Режим работы и Настройки интеграции
                </Typography>

                <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Контур песочницы (Sandbox Direction):
                  </Typography>
                  <RadioGroup
                    value={settings.mode === 'sandbox' ? settings.sandbox_direction : 'production'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'production') {
                        setSettings({ ...settings, mode: 'production', sandbox_direction: 'none' });
                      } else {
                        setSettings({ ...settings, mode: 'sandbox', sandbox_direction: val });
                      }
                    }}
                  >
                    <FormControlLabel
                      value="dual"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            🧪 Dual Sandbox (Полная изоляция)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            И входящие, и исходящие запросы виртуализированы. Внешние серверы MedFlex не затрагиваются.
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      value="request_only"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            📤 Request-Only (Симуляция исходящих)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Принимаются реальные вебхуки с ПроДокторов, но локальные слоты не отправляются во внешний MedFlex.
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      value="response_only"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            📥 Response-Only (Симуляция входящих)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Слоты клиники реально выгружаются на mis-api.medflex.ru, но онлайн-брони эмулируются локально.
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      value="production"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563eb' }}>
                            🌐 Production (Боевой контур)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Полноценный двусторонний онлайн-обмен данными с боевыми серверами агрегатора в реальном времени.
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </Paper>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Clinic Token (api.medflex.ru)"
                      value={settings.clinic_token || ''}
                      onChange={(e) => setSettings({ ...settings, clinic_token: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Webhook Secret Token"
                      value={settings.webhook_secret || ''}
                      onChange={(e) => setSettings({ ...settings, webhook_secret: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="ID филиала клиники (LPU ID)"
                      type="number"
                      value={settings.filial_id || 1}
                      onChange={(e) => setSettings({ ...settings, filial_id: Number(e.target.value) || 1 })}
                    />
                  </Grid>

                  {/* Sync Frequency Parameters */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="ping-interval-label">Частота пинга/мониторинга</InputLabel>
                      <Select
                        labelId="ping-interval-label"
                        label="Частота пинга/мониторинга"
                        value={Number(settings.ping_interval_sec) || 60}
                        onChange={(e) => setSettings({ ...settings, ping_interval_sec: Number(e.target.value) })}
                      >
                        <MenuItem value={15}>Каждые 15 секунд (Экспресс)</MenuItem>
                        <MenuItem value={30}>Каждые 30 секунд (Высокая частота)</MenuItem>
                        <MenuItem value={60}>Каждые 60 секунд (По умолчанию)</MenuItem>
                        <MenuItem value={120}>Каждые 2 минуты (Экономный трафик)</MenuItem>
                        <MenuItem value={300}>Каждые 5 минут (Низкая нагрузка)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="schedule-sync-interval-label">Периодичность синхр. расписания</InputLabel>
                      <Select
                        labelId="schedule-sync-interval-label"
                        label="Периодичность синхр. расписания"
                        value={Number(settings.schedule_sync_interval_min) || 30}
                        onChange={(e) => setSettings({ ...settings, schedule_sync_interval_min: Number(e.target.value) })}
                      >
                        <MenuItem value={15}>Каждые 15 минут (Частая выгрузка)</MenuItem>
                        <MenuItem value={30}>Каждые 30 минут (По умолчанию)</MenuItem>
                        <MenuItem value={60}>Каждый час (Рекомендуется)</MenuItem>
                        <MenuItem value={120}>Каждые 2 часа</MenuItem>
                        <MenuItem value={360}>Каждые 6 часов</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSaveSettings}
                      disabled={settingsSaving}
                      sx={{ height: 42, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', fontWeight: 700 }}
                    >
                      {settingsSaving ? 'Сохранение...' : 'Сохранить параметры синхронизации'}
                    </Button>
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Column: Bulk Schedule Push & Offline Queue */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Персистентная оффлайн-очередь ({queue.length})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleSyncSchedule}
                      disabled={loading}
                      startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Выгрузить 30 дней
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={handlePullCurrentAppointments}
                      disabled={loading}
                      startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Загрузить текущие
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      onClick={handleFlushQueue}
                      disabled={loading || queue.filter((q) => q.status === 'pending').length === 0}
                      startIcon={<SyncIcon sx={{ fontSize: 16 }} />}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Сбросить очередь
                    </Button>
                  </Box>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, maxHeight: 320 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Операция</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Попыток</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Статус</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Ошибка</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {queue.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#64748b' }}>
                            Очередь пуста. Все операции успешно доставлены в MedFlex.
                          </TableCell>
                        </TableRow>
                      ) : (
                        queue.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>#{item.id}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                {item.operation_type}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                {item.created_at}
                              </Typography>
                            </TableCell>
                            <TableCell>{item.attempt_count} / {item.max_attempts}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={item.status}
                                sx={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: item.status === 'completed' ? '#065f46' : item.status === 'failed' ? '#991b1b' : '#92400e',
                                  bgcolor: item.status === 'completed' ? '#d1fae5' : item.status === 'failed' ? '#fee2e2' : '#fef3c7'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <Tooltip title={item.last_error || 'Нет ошибок'}>
                                <span>{item.last_error || '—'}</span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 1: Incidents Registry & RCA Breakdown */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {(['all', 'open', 'critical', 'resolved'] as const).map((filterKey) => (
                  <Chip
                    key={filterKey}
                    clickable
                    label={
                      filterKey === 'all'
                        ? 'Все инциденты'
                        : filterKey === 'open'
                        ? 'Только открытые'
                        : filterKey === 'critical'
                        ? 'Критические'
                        : 'Разрешённые'
                    }
                    color={incidentFilter === filterKey ? 'primary' : 'default'}
                    onClick={() => setIncidentFilter(filterKey)}
                    sx={{ fontWeight: 600 }}
                  />
                ))}
              </Box>

              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => handlePrintReport()}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Печать Акта инцидентов (PDF А4)
              </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Дата / Время</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Проблема (Severity)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Человекопонятное объяснение</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Врач / Пациент</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Статус</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Действие</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incidents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748b' }}>
                        Инцидентов в выбранной категории не обнаружено.
                      </TableCell>
                    </TableRow>
                  ) : (
                    incidents.map((inc) => (
                      <TableRow key={inc.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{inc.created_at}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              size="small"
                              label={inc.severity}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                color: '#fff',
                                bgcolor: inc.severity === 'critical' ? '#ef4444' : inc.severity === 'high' ? '#f59e0b' : '#3b82f6'
                              }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                              {inc.title}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b' }}>
                            {inc.problem_code}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                            {inc.explanation_human}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                            {inc.doctor_name || '—'}
                          </Typography>
                          {inc.patient_name && (
                            <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                              {inc.patient_name} ({inc.patient_phone})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={inc.status === 'open' ? 'Открыт' : 'Разрешён'}
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              color: inc.status === 'open' ? '#991b1b' : '#065f46',
                              bgcolor: inc.status === 'open' ? '#fee2e2' : '#d1fae5'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenIncidentModal(inc)}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                          >
                            Анализ RCA
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 2: Doctor Mapping */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Сопоставление докторов клиники с каталогом MedFlex
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2.5 }}>
              Укажите MedFlex Doctor ID для каждого врача, чтобы онлайн-записи и сетка слотов синхронизировались корректно.
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>ID в МИС</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ФИО Врача</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Специализация</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>MedFlex Doctor ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Синхронизация активна</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Действие</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {doctors.map((doc) => (
                    <DoctorMappingRow key={doc.id} doctor={doc} onSave={handleSaveDoctorMapping} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 3: Serilog Audit Logs & Fails/Collisions Report */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon color="primary" /> Отчёт журнала аудита Serilog: Сбои и коллизии
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Сквозная структурированная телеметрия онлайн-записи MedFlex (CLEF). Записи упорядочены от последних к ранним (Last on top).
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Tooltip title="Настроена ежедневная фоновая автоочистка: записи в БД и ежедневные файлы телеметрии (.clef) старше 3 месяцев удаляются автоматически">
                  <Chip
                    icon={<AutoDeleteIcon sx={{ fontSize: '16px !important', color: '#0284C7 !important' }} />}
                    label="Автоочистка: >3 мес."
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.74rem', bgcolor: '#F0F9FF', borderColor: '#BAE6FD', color: '#0369A1' }}
                  />
                </Tooltip>

                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<DeleteSweepIcon />}
                  onClick={() => setCleanupConfirmOpen(true)}
                  disabled={cleanupLoading || loading}
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#475569' }}
                >
                  Очистить старше 3 мес.
                </Button>

                <FormControl size="small" sx={{ width: 150 }}>
                  <InputLabel>Уровень логов</InputLabel>
                  <Select
                    value={logLevelFilter}
                    label="Уровень логов"
                    onChange={(e) => setLogLevelFilter(e.target.value)}
                  >
                    <MenuItem value="all">Все уровни</MenuItem>
                    <MenuItem value="Information">Information</MenuItem>
                    <MenuItem value="Warning">Warning</MenuItem>
                    <MenuItem value="Error">Error</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  size="small"
                  variant={onlyFailsFilter ? 'contained' : 'outlined'}
                  color={onlyFailsFilter ? 'warning' : 'inherit'}
                  startIcon={<ReportProblemIcon />}
                  onClick={() => setOnlyFailsFilter(!onlyFailsFilter)}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  {onlyFailsFilter ? 'Только сбои и коллизии (ВКЛ)' : 'Сбои и коллизии'}
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchAuditLogs}
                  disabled={loading}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Обновить
                </Button>
              </Box>
            </Box>

            {/* Main DataGrid strictly following grid-improvements skill */}
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
              <DataGrid
                autoHeight
                showToolbar
                rows={auditLogs}
                columns={auditColumns}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25, page: 0 } },
                  sorting: { sortModel: [{ field: 'id', sort: 'desc' }] }
                }}
                getRowHeight={() => 'auto'}
                slots={{
                  toolbar: () => (
                    <MedflexSerilogCustomToolbar
                      onResetFilters={() => {
                        setLogLevelFilter('all');
                        setOnlyFailsFilter(false);
                      }}
                      onlyFails={onlyFailsFilter}
                      onToggleOnlyFails={(val) => setOnlyFailsFilter(val)}
                    />
                  ),
                  footer: () => (
                    <MedflexSerilogCustomFooter
                      totalCount={auditStats.total}
                      errorCount={auditStats.errors}
                      warningCount={auditStats.warnings}
                      duplicateCount={auditStats.duplicates}
                      avgLatency={auditStats.avgLatency}
                    />
                  )
                }}
                sx={{
                  width: '100%',
                  border: 'none',
                  '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' },
                  '& .MuiDataGrid-columnHeaders': {
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    bgcolor: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    fontWeight: 800
                  },
                  '& .MuiDataGrid-cell': {
                    alignItems: 'center',
                    display: 'flex',
                    py: 1
                  },
                  '& .MuiDataGrid-row:hover': {
                    bgcolor: '#F8FAFC',
                    cursor: 'pointer'
                  }
                }}
                onRowClick={(params) => setSelectedAuditLog(params.row)}
              />
            </Paper>
          </Box>
        )}
      </Paper>

      {/* 5. RCA Incident Detail Modal */}
      {selectedIncident && (
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                size="small"
                label={selectedIncident.severity}
                sx={{
                  fontWeight: 700,
                  color: '#fff',
                  bgcolor: selectedIncident.severity === 'critical' ? '#ef4444' : '#f59e0b'
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {selectedIncident.title}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={selectedIncident.status === 'open' ? 'Открыт' : 'Разрешён'}
              color={selectedIncident.status === 'open' ? 'error' : 'success'}
            />
          </DialogTitle>

          <DialogContent dividers sx={{ pt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Код проблемы (Classifier):
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>
                {selectedIncident.problem_code}
              </Typography>
            </Box>

            <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                Человекопонятное объяснение сути сбоя:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', mt: 0.5 }}>
                {selectedIncident.explanation_human}
              </Typography>
            </Box>

            <Box sx={{ mb: 2.5, p: 2, bgcolor: '#fefce8', borderRadius: 2, border: '1px solid #fef08a' }}>
              <Typography variant="caption" sx={{ color: '#854d0e', fontWeight: 700 }}>
                Анализ первопричины (Root Cause Analysis - RCA):
              </Typography>
              <Typography variant="body2" sx={{ color: '#713f12', mt: 0.5 }}>
                {selectedIncident.root_cause_analysis}
              </Typography>
            </Box>

            <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>
                Пошаговые рекомендации по устранению:
              </Typography>
              <Typography variant="body2" sx={{ color: '#14532d', mt: 0.5 }}>
                {selectedIncident.remediation_steps}
              </Typography>
            </Box>

            {selectedIncident.technical_context_json && (
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Технический контекст инцидента (JSON):
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 1.5,
                    bgcolor: '#1e293b',
                    color: '#f8fafc',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                    mt: 0.5
                  }}
                >
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedIncident.technical_context_json), null, 2);
                    } catch (e) {
                      return selectedIncident.technical_context_json;
                    }
                  })()}
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button onClick={() => setModalOpen(false)} sx={{ textTransform: 'none' }}>
              Закрыть
            </Button>
            {selectedIncident.status === 'open' && (
              <Button
                variant="contained"
                color="success"
                onClick={() => handleResolveIncident(selectedIncident.id)}
                startIcon={<CheckCircleIcon />}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Отметить как разрешённый
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* 5.1. Serilog Audit Log Detail Inspection Modal */}
      {selectedAuditLog && (
        <Dialog open={Boolean(selectedAuditLog)} onClose={() => setSelectedAuditLog(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                size="small"
                label={selectedAuditLog.level}
                sx={{
                  fontWeight: 700,
                  color: selectedAuditLog.level === 'Error' ? '#991B1B' : selectedAuditLog.level === 'Warning' ? '#92400E' : '#065F46',
                  bgcolor: selectedAuditLog.level === 'Error' ? '#FEE2E2' : selectedAuditLog.level === 'Warning' ? '#FEF3C7' : '#D1FAE5'
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Событие аудита Serilog #{selectedAuditLog.id}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              {selectedAuditLog.timestamp}
            </Typography>
          </DialogTitle>

          <DialogContent dividers sx={{ pt: 2 }}>
            <Box sx={{ mb: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                Сообщение события / Суть сбоя:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A', mt: 0.5 }}>
                {selectedAuditLog.message}
              </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Тип события (EventType):</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0369A1' }}>
                  {selectedAuditLog.event_type}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Направление / HTTP:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedAuditLog.direction} • {selectedAuditLog.http_status ? `HTTP ${selectedAuditLog.http_status}` : 'Внутреннее событие'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Время отклика (RTT):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedAuditLog.duration_ms ? `${selectedAuditLog.duration_ms} мс` : '—'}
                </Typography>
              </Grid>

              {selectedAuditLog.claim_id && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>MedFlex Claim ID:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {selectedAuditLog.claim_id}
                  </Typography>
                </Grid>
              )}
              {selectedAuditLog.endpoint && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>API Эндпоинт:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    {selectedAuditLog.endpoint}
                  </Typography>
                </Grid>
              )}
            </Grid>

            {selectedAuditLog.exception && (
              <Box sx={{ mb: 2.5, p: 2, bgcolor: '#FEF2F2', borderRadius: 2, border: '1px solid #FECACA' }}>
                <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 700 }}>
                  Исключение / Ошибка (Exception Stack):
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 1.5,
                    bgcolor: '#450A0A',
                    color: '#FEE2E2',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                    mt: 0.5
                  }}
                >
                  {selectedAuditLog.exception}
                </Box>
              </Box>
            )}

            {selectedAuditLog.properties_json && (
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Структурированные свойства Serilog (Properties JSON):
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 1.5,
                    bgcolor: '#1E293B',
                    color: '#F8FAFC',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                    mt: 0.5
                  }}
                >
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedAuditLog.properties_json), null, 2);
                    } catch (e) {
                      return selectedAuditLog.properties_json;
                    }
                  })()}
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedAuditLog(null)} sx={{ textTransform: 'none' }}>
              Закрыть
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Confirmation Dialog for Purging Serilog Logs older than 3 months */}
      <Dialog
        open={cleanupConfirmOpen}
        onClose={() => !cleanupLoading && setCleanupConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteSweepIcon color="warning" /> Очистка архива логов Serilog
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#334155', mb: 1.5 }}>
            Выполнить очистку записей журнала аудита и архивных файлов <code>.clef</code> старше <strong>3 месяцев</strong>?
          </Typography>
          <Alert severity="info" sx={{ fontSize: '0.82rem' }}>
            В системе включена фоновая ежедневная автоочистка. Данная операция немедленно удалит устаревшие записи из базы данных и освободит дисковое пространство.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setCleanupConfirmOpen(false)}
            disabled={cleanupLoading}
            sx={{ textTransform: 'none', color: '#64748B' }}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleExecuteCleanup}
            disabled={cleanupLoading}
            startIcon={<DeleteSweepIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {cleanupLoading ? 'Очистка...' : 'Очистить сейчас'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6. Hidden Printable Report Template Container */}
      <Box sx={{ display: 'none' }}>
        <MedflexIncidentReportTemplate
          ref={printRef}
          incidents={incidents}
          kpi={kpi}
          generatedBy="Администратор клиники"
          filterPeriod="Отчёт по качеству синхронизации онлайн-записи"
        />
      </Box>
    </Box>
  );
}

// Subcomponent: Doctor Mapping Row
function DoctorMappingRow({ doctor, onSave }: { doctor: any; onSave: (docId: number, mfId: number, sync: boolean) => void }) {
  const [mfId, setMfId] = useState(doctor.medflex_doctor_id || '');
  const [syncEnabled, setSyncEnabled] = useState(doctor.medflex_sync_enabled === 1);
  const [dirty, setDirty] = useState(false);

  return (
    <TableRow hover>
      <TableCell>#{doctor.id}</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>{doctor.full_name}</TableCell>
      <TableCell>{doctor.specialization || 'Ортопед'}</TableCell>
      <TableCell sx={{ width: 200 }}>
        <TextField
          size="small"
          type="number"
          placeholder="e.g. 10452"
          value={mfId}
          onChange={(e) => {
            setMfId(e.target.value);
            setDirty(true);
          }}
          sx={{ width: 140 }}
        />
      </TableCell>
      <TableCell>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={syncEnabled}
              onChange={(e) => {
                setSyncEnabled(e.target.checked);
                setDirty(true);
              }}
            />
          }
          label={syncEnabled ? 'Включено' : 'Выключено'}
        />
      </TableCell>
      <TableCell align="right">
        <Button
          size="small"
          variant="contained"
          disabled={!dirty}
          onClick={() => {
            onSave(doctor.id, Number(mfId) || 0, syncEnabled);
            setDirty(false);
          }}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Сохранить
        </Button>
      </TableCell>
    </TableRow>
  );
}
