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
  Snackbar
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
import PersonIcon from '@mui/icons-material/Person';
import SpeedIcon from '@mui/icons-material/Speed';
import DnsIcon from '@mui/icons-material/Dns';

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
// Main Page Component
// ============================================================================
export default function SerilogAnalytics() {
  const { currentUser } = useAuth();
  const permissions = currentUser?.permissionCodes || [];

  const canExport = isElementPermitted('serilog_analytics', 'export_logs', permissions);
  const canPurge = isElementPermitted('serilog_analytics', 'purge_logs', permissions);

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
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = off, 5, 15, 30 sec
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

  // Load sources and event types metadata on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/serilog/sources-and-events`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'x-auth-token': localStorage.getItem('token') || ''
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSourceOptions(data.sources || []);
          setEventTypeOptions(data.eventTypes || []);
        }
      })
      .catch(err => console.error('Error fetching sources/events:', err));
  }, []);

  // Fetch logs and summary
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

      const token = localStorage.getItem('token') || '';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token
      };

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
  }, [paginationModel, startDate, endDate, selectedSource, selectedLevels, selectedEventType, searchTerm]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh interval effect
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      fetchLogs();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, fetchLogs]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSource('ALL');
    setSelectedLevels([]);
    setSelectedEventType('ALL');
    setDatePreset('7days');
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

    const token = localStorage.getItem('token') || '';
    params.set('auth_token', token);

    window.open(`${API_BASE_URL}/api/admin/serilog/export?${params.toString()}`, '_blank');
  };

  // Perform purge
  const handleExecutePurge = async () => {
    setPurgeLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE_URL}/api/admin/serilog/purge?days=${purgeDays}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
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

  // Column level chip helper
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

  // Columns definition (complying with grid-improvements)
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
      headerName: 'Служба / Источник',
      flex: 1.2,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => {
        const src = params.value || 'OrthoERP';
        let color = '#475569';
        let bg = '#F1F5F9';
        if (src.includes('Fiscal')) { color = '#0284C7'; bg = '#E0F2FE'; }
        else if (src.includes('MedFlex')) { color = '#4F46E5'; bg = '#EEF2FF'; }
        else if (src.includes('POS')) { color = '#D97706'; bg = '#FEF3C7'; }
        else if (src.includes('Auth') || src.includes('Users')) { color = '#059669'; bg = '#D1FAE5'; }
        else if (src.includes('Workstation')) { color = '#0F3C64'; bg = '#E2E8F0'; }

        return (
          <Chip
            size="small"
            label={src.replace('OrthoErp.', '')}
            sx={{
              bgcolor: bg,
              color,
              fontWeight: 600,
              fontSize: '0.75rem',
              maxWidth: '100%'
            }}
          />
        );
      }
    },
    {
      field: 'event_type',
      headerName: 'Тип события',
      flex: 1.2,
      minWidth: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: '#334155',
            fontWeight: 600,
            whiteSpace: 'normal',
            wordBreak: 'break-all'
          }}
        >
          {params.value || '—'}
        </Typography>
      )
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
        <Tooltip title="Инспекция CLEF JSON и стек-трейса">
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

  // Filter toolbar callback
  const customToolbar = useCallback(() => (
    <SerilogGridToolbar onResetFilters={handleResetFilters} />
  ), []);

  // Footer totals callback
  const customFooter = useCallback(() => (
    <SerilogGridFooter
      totalCount={totalRows}
      infoCount={summary.levelBreakdown['Information'] || 0}
      warnCount={summary.levelBreakdown['Warning'] || 0}
      errorCount={(summary.levelBreakdown['Error'] || 0) + (summary.levelBreakdown['Fatal'] || 0)}
      avgDuration={summary.avgDurationMs || 0}
    />
  ), [totalRows, summary]);

  // Parsed JSON properties for drawer
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
              label="Центральный аудит"
              sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Сквозной сбор телеметрии бэкенда (Node.js, .NET Fiscal, MedFlex, POS) и тотальный аудит действий пользователей
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
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={fetchLogs}
              disabled={loading}
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
            setSelectedSource('OrthoErp.Auth');
            setPaginationModel({ page: 0, pageSize: 25 });
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#4F46E5', textTransform: 'uppercase' }}>
                Аудит действий
              </Typography>
              <PersonIcon sx={{ color: '#4F46E5', fontSize: 22 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#4F46E5', mt: 1 }}>
              {summary.totalUserActions.toLocaleString('ru-RU')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#4F46E5' }}>
              Входы, протоколы, роли, касса
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
              {sourceOptions.map(src => (
                <MenuItem key={src} value={src}>{src}</MenuItem>
              ))}
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
                <MenuItem key={evt} value={evt}>{evt}</MenuItem>
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

      {/* 4. MUI X DataGrid (Strict grid-improvements standard) */}
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

      {/* 5. Slide-Over Detail Drawer (CLEF & Exception Inspector) */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: { width: { xs: '100%', sm: 540, md: 620 }, p: 3, bgcolor: '#FFFFFF' }
          }
        }}
      >
        {selectedLog && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ManageSearchIcon sx={{ color: '#0284C7', fontSize: 24 }} />
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
              </Paper>
              <Paper sx={{ p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Пользователь / IP</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {selectedLog.username ? `@${selectedLog.username}` : 'system'} ({selectedLog.client_ip || 'local'})
                </Typography>
              </Paper>
            </Box>

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
                  maxHeight: 260,
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
                    maxHeight: 220,
                    overflowY: 'auto',
                    border: '1px solid #7F1D1D',
                    borderRadius: 1
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {selectedLog.exception}
                  </pre>
                </Paper>
              </Box>
            )}

            {/* Entity links */}
            {(selectedLog.protocol_id || selectedLog.appointment_id || selectedLog.patient_id || selectedLog.doctor_id) && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
                  Связанные клинические сущности
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedLog.protocol_id && (
                    <Chip size="small" label={`Протокол #${selectedLog.protocol_id}`} color="primary" variant="outlined" />
                  )}
                  {selectedLog.appointment_id && (
                    <Chip size="small" label={`Прием #${selectedLog.appointment_id}`} color="secondary" variant="outlined" />
                  )}
                  {selectedLog.patient_id && (
                    <Chip size="small" label={`Пациент #${selectedLog.patient_id}`} variant="outlined" />
                  )}
                  {selectedLog.doctor_id && (
                    <Chip size="small" label={`Врач #${selectedLog.doctor_id}`} variant="outlined" />
                  )}
                </Box>
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
          <Alert severity="warning" sx={{ mb: 2 }}>
            Удаление логов освобождает место в базе данных SQLite. Данные rolling CLEF файлов на диске при этом сохраняются.
          </Alert>
          <TextField
            label="Удалить записи старше (дней)"
            type="number"
            fullWidth
            value={purgeDays}
            onChange={(e) => setPurgeDays(Math.max(7, parseInt(e.target.value, 10) || 7))}
            helperText="Минимальный безопасный интервал хранения: 7 дней"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPurgeDialogOpen(false)} disabled={purgeLoading}>Отмена</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleExecutePurge}
            disabled={purgeLoading}
            startIcon={purgeLoading ? <CircularProgress size={16} /> : <DeleteSweepIcon />}
          >
            {purgeLoading ? 'Очистка...' : 'Подтвердить удаление'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 7. Snackbar Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

