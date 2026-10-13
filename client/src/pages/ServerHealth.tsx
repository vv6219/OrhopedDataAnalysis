import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Tooltip,
  Grid,
  Switch,
  FormControlLabel,
  Snackbar
} from '@mui/material';
import { API_BASE_URL } from '../config/apiConfig';

// Icons
import DnsIcon from '@mui/icons-material/Dns';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StorageIcon from '@mui/icons-material/Storage';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CodeIcon from '@mui/icons-material/Code';
import BackupIcon from '@mui/icons-material/Backup';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TerminalIcon from '@mui/icons-material/Terminal';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';

export interface ServiceDetail {
  id: string;
  name: string;
  category: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'ERROR';
  latencyMs: number;
  url?: string;
  description: string;
  details?: Record<string, any>;
  error?: string;
}

export interface ServicesStatusResponse {
  success: boolean;
  timestamp: string;
  summary: {
    total: number;
    online: number;
    degraded: number;
    offline: number;
    isSystemHealthy: boolean;
  };
  services: ServiceDetail[];
  logs?: Array<{ timestamp: string; level: string; message: string }>;
}

export default function ServerHealth() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<ServicesStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [testing, setTesting] = useState<boolean>(false);
  const [repairingId, setRepairingId] = useState<string | null>(null);
  const [repairingAll, setRepairingAll] = useState<boolean>(false);
  const [autoRepair, setAutoRepair] = useState<boolean>(false);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ timestamp: string; level: string; message: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const hasTriggeredParam = useRef<boolean>(false);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  // Fetch quick status
  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/services/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json: ServicesStatusResponse = await res.json();
      setData(json);
      if (json.logs && json.logs.length > 0) {
        setLogs(json.logs);
      }
    } catch (err: any) {
      const msg = err.message === 'Failed to fetch'
        ? 'Не удалось связаться с сервером (Failed to fetch). Убедитесь, что веб-приложение открыто по адресу http://localhost:5173 или http://localhost:5000'
        : (err.message || 'Ошибка загрузки статуса служб бэкенда');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Run deep diagnostic test on all backend services (optionally with autoRepair)
  const runDeepTests = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/services/test-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRepair })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json: ServicesStatusResponse = await res.json();
      setData(json);
      if (json.logs) {
        setLogs(json.logs);
      }
      if (autoRepair) {
        setSuccessFeedback('Тестирование с автоматическим устранением сбоев завершено.');
      }
    } catch (err: any) {
      const msg = err.message === 'Failed to fetch'
        ? 'Не удалось связаться с сервером (Failed to fetch). Убедитесь, что веб-приложение открыто по адресу http://localhost:5173 или http://localhost:5000'
        : (err.message || 'Ошибка выполнения тестов доступности служб');
      setError(msg);
    } finally {
      setTesting(false);
    }
  };

  // Repair or restart individual service
  const handleRepairService = async (serviceId: string) => {
    setRepairingId(serviceId);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/services/${serviceId}/repair`, {
        method: 'POST'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Ошибка при перезапуске/восстановлении службы [${serviceId}]`);
      }
      if (json.logs && json.logs.length > 0) {
        setLogs(prev => [...prev, ...json.logs]);
      }
      setSuccessFeedback(json.message || `Служба ${serviceId} успешно восстановлена!`);
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || `Не удалось восстановить службу ${serviceId}`);
    } finally {
      setRepairingId(null);
    }
  };

  // Batch repair all failing/degraded services
  const handleRepairAll = async () => {
    setRepairingAll(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/services/repair-all`, {
        method: 'POST'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Ошибка при пакетном восстановлении служб');
      }
      if (json.logs && json.logs.length > 0) {
        setLogs(prev => [...prev, ...json.logs]);
      }
      setSuccessFeedback(json.message || 'Пакетное восстановление служб выполнено');
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Ошибка запуска авто-восстановления');
    } finally {
      setRepairingAll(false);
    }
  };

  // Auto-scroll logs
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Initial load & check query param ?action=run-tests
  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if ((params.get('action') === 'run-tests' || params.get('action') === 'run-test') && !hasTriggeredParam.current) {
      hasTriggeredParam.current = true;
      runDeepTests();
    }
  }, [location.search]);

  // Helper to choose service icon
  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'express':
        return <DnsIcon sx={{ fontSize: 28, color: '#0284C7' }} />;
      case 'sqlite':
        return <StorageIcon sx={{ fontSize: 28, color: '#16A34A' }} />;
      case 'fiscal':
        return <PointOfSaleIcon sx={{ fontSize: 28, color: '#9333EA' }} />;
      case 'pos':
        return <CreditCardIcon sx={{ fontSize: 28, color: '#D97706' }} />;
      case 'firebird':
        return <SyncAltIcon sx={{ fontSize: 28, color: '#EA580C' }} />;
      case 'swagger':
        return <CodeIcon sx={{ fontSize: 28, color: '#2563EB' }} />;
      case 'backup':
        return <BackupIcon sx={{ fontSize: 28, color: '#0D9488' }} />;
      default:
        return <DnsIcon sx={{ fontSize: 28, color: '#64748B' }} />;
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status: ServiceDetail['status']) => {
    if (status === 'ONLINE') {
      return (
        <Chip
          icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
          label="ONLINE (В сети)"
          color="success"
          size="small"
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        />
      );
    }
    if (status === 'DEGRADED') {
      return (
        <Chip
          icon={<WarningAmberIcon sx={{ fontSize: '16px !important' }} />}
          label="DEGRADED (Ограничен)"
          color="warning"
          size="small"
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        />
      );
    }
    return (
      <Chip
        icon={<ErrorIcon sx={{ fontSize: '16px !important' }} />}
        label="OFFLINE (Недоступен)"
        color="error"
        size="small"
        sx={{ fontWeight: 700, borderRadius: 1.5 }}
      />
    );
  };

  // Calculate average latency
  const avgLatency = data?.services && data.services.length > 0
    ? Math.round(data.services.reduce((acc, s) => acc + (s.latencyMs || 0), 0) / data.services.length)
    : 0;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1440, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              bgcolor: '#0F3C64',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(15, 60, 100, 0.25)'
            }}
          >
            <DnsIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              Статус и мониторинг сервисов бэкенда
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Сквозное тестирование доступности и целостности всех серверных компонентов клиники
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={autoRepair}
                onChange={(e) => setAutoRepair(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F3C64', userSelect: 'none' }}>
                Авто-исправление сбоев
              </Typography>
            }
            sx={{ m: 0 }}
          />

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchStatus}
            disabled={loading || testing || repairingAll}
            sx={{ borderColor: '#CBD5E1', color: '#0F3C64', fontWeight: 600 }}
          >
            {loading ? 'Опрос...' : 'Обновить статус'}
          </Button>

          <Button
            variant="outlined"
            color="warning"
            startIcon={repairingAll ? <CircularProgress size={16} color="inherit" /> : <RestartAltIcon />}
            onClick={handleRepairAll}
            disabled={loading || testing || repairingAll}
            sx={{ fontWeight: 700, borderColor: '#F59E0B', color: '#B45309' }}
          >
            {repairingAll ? 'Восстановление...' : 'Перезапустить сбойные'}
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={testing ? <CircularProgress size={18} color="inherit" /> : <PlayCircleFilledWhiteIcon />}
            onClick={runDeepTests}
            disabled={loading || testing || repairingAll}
            sx={{
              fontWeight: 700,
              bgcolor: '#0284C7',
              '&:hover': { bgcolor: '#0369A1' },
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}
          >
            {testing ? 'Тестирование служб...' : 'Запустить тест всех служб'}
          </Button>
        </Box>
      </Box>

      {/* Error alert if any */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* System Overall Health Status Banner */}
      {data && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: data.summary.isSystemHealthy ? '#BBF7D0' : '#FECACA',
            bgcolor: data.summary.isSystemHealthy ? '#F0FDF4' : '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: data.summary.isSystemHealthy ? '#16A34A' : '#DC2626',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {data.summary.isSystemHealthy ? <CheckCircleIcon sx={{ fontSize: 26 }} /> : <ErrorIcon sx={{ fontSize: 26 }} />}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: data.summary.isSystemHealthy ? '#166534' : '#991B1B' }}>
                {data.summary.isSystemHealthy
                  ? 'Все службы сервера работают в штатном режиме'
                  : 'Обнаружены сбои или недоступность серверных служб!'}
              </Typography>
              <Typography variant="body2" sx={{ color: data.summary.isSystemHealthy ? '#15803D' : '#B91C1C' }}>
                {data.summary.isSystemHealthy
                  ? `Успешно верифицировано ${data.summary.online} из ${data.summary.total} компонентов бэкенда (Express, SQLite, Fiscal Daemon, Firebird, Swagger, Backups, POS).`
                  : `В сети: ${data.summary.online} из ${data.summary.total}, ошибок/недоступно: ${data.summary.offline + data.summary.degraded}. Проверьте конфигурацию.`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {!data.summary.isSystemHealthy && (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={repairingAll ? <CircularProgress size={16} color="inherit" /> : <AutoFixHighIcon />}
                onClick={handleRepairAll}
                disabled={repairingAll || testing}
                sx={{ fontWeight: 700, borderRadius: 1.5, px: 2 }}
              >
                {repairingAll ? 'Восстановление...' : 'Устранить все сбои'}
              </Button>
            )}
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Последняя проверка
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                {new Date(data.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
            <Chip
              icon={<SpeedIcon />}
              label={`Задержка: ~${avgLatency} мс`}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600, borderColor: '#CBD5E1' }}
            />
          </Box>
        </Paper>
      )}

      {/* KPI Overview Tiles */}
      {data && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#EFF6FF', color: '#2563EB' }}>
                  <DnsIcon />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Доступность служб
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    {data.summary.online} / {data.summary.total} онлайн
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#F0FDF4', color: '#16A34A' }}>
                  <StorageIcon />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    БД SQLite (Пациентов)
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    {data.services.find(s => s.id === 'sqlite')?.details?.stats?.patients?.toLocaleString() || '61 301'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#FFF7ED', color: '#EA580C' }}>
                  <SyncAltIcon />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Firebird МИС (Визитов)
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    {data.services.find(s => s.id === 'firebird')?.details?.records?.visits?.toLocaleString() || '37 538'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#FAF5FF', color: '#9333EA' }}>
                  <MemoryIcon />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    RAM Express / Uptime
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    {data.services.find(s => s.id === 'express')?.details?.memoryRssMb || '72'} MB
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Services Grid */}
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
        Реестр сервисов и диагностика компонентов
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {data?.services?.map((svc) => (
          <Grid key={svc.id} size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                borderRadius: 3,
                borderColor: svc.status === 'ONLINE' ? '#E2E8F0' : '#FECACA',
                bgcolor: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(15, 60, 100, 0.08)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ pb: 1 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        bgcolor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {getServiceIcon(svc.id)}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                        {svc.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {svc.category}
                      </Typography>
                    </Box>
                  </Box>

                  {renderStatusBadge(svc.status)}
                </Box>

                <Typography variant="body2" sx={{ color: '#475569', mb: 2, fontSize: '0.85rem', minHeight: 38 }}>
                  {svc.description}
                </Typography>

                {/* Service Details Attributes */}
                <Box
                  sx={{
                    bgcolor: '#F8FAFC',
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid #EDF2F7',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                    mb: 1
                  }}
                >
                  {svc.url && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Адрес / Endpoint:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64', wordBreak: 'break-all' }}>
                        {svc.url.length > 32 ? `${svc.url.substring(0, 32)}...` : svc.url}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Время отклика (Latency):
                    </Typography>
                    <Chip
                      label={`${svc.latencyMs} мс`}
                      size="small"
                      color={svc.latencyMs < 100 ? 'success' : svc.latencyMs < 1000 ? 'default' : 'warning'}
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700 }}
                    />
                  </Box>

                  {/* Dynamic Fields per service */}
                  {svc.id === 'express' && svc.details && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Порт / Node:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.port} ({svc.details.nodeVersion})</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Аптайм сервера:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.uptimeText}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Память (RSS / Heap):</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.memoryRssMb} MB / {svc.details.memoryHeapUsedMb} MB</Typography>
                      </Box>
                    </>
                  )}

                  {svc.id === 'sqlite' && svc.details && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Целостность / Режим:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#16A34A' }}>{svc.details.integrity} ({svc.details.journalMode})</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Размер БД / Таблиц:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.fileSizeMb} / {svc.details.tableCount} таблиц</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Пациентов / Операций:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.stats?.patients} / {svc.details.stats?.operations}</Typography>
                      </Box>
                    </>
                  )}

                  {svc.id === 'fiscal' && svc.details && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Модель / Порт:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.deviceModel} ({svc.details.port})</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Состояние смены:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#16A34A' }}>{svc.details.isShiftOpen} (№{svc.details.shiftNumber})</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Serilog Sink:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.serilogSinkActive}</Typography>
                      </Box>
                    </>
                  )}

                  {svc.id === 'firebird' && svc.details && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Пациентов в МИС:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#EA580C' }}>{svc.details.records?.patients?.toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Визитов / Договоров:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.records?.visits?.toLocaleString()} / {svc.details.records?.contracts?.toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Каналов / ДМС карт:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.records?.channels} / {svc.details.records?.dmsCards}</Typography>
                      </Box>
                    </>
                  )}

                  {svc.id === 'swagger' && svc.details && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Стандарт спецификации:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>OpenAPI {svc.details.specVersion}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Интерактивный UI:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#2563EB' }}>Swagger UI Active</Typography>
                      </Box>
                    </>
                  )}

                  {svc.id === 'backup' && svc.details && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Всего снимков БД:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.totalBackupsCount} копий (лимит {svc.details.keepLastNBackups})</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Последний снимок:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.latestBackupSize}</Typography>
                      </Box>
                    </>
                  )}

                  {svc.id === 'pos' && svc.details && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Драйвер эквайринга:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.driverType} ({svc.details.isMockMode})</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Профиль / Подключение:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.connection}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>ID Терминала / Служба:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{svc.details.terminalId} ({svc.details.serviceStatus})</Typography>
                      </Box>
                    </>
                  )}

                  {/* Error if present */}
                  {svc.error && (
                    <Box sx={{ bgcolor: '#FEF2F2', p: 1, borderRadius: 1, border: '1px solid #FECACA', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 600, display: 'block' }}>
                        {svc.error}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>

              {/* Bottom Card Action */}
              <Box sx={{ p: 1.5, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {svc.status !== 'ONLINE' && (
                  <Button
                    size="small"
                    variant="contained"
                    color="warning"
                    fullWidth
                    startIcon={repairingId === svc.id ? <CircularProgress size={16} color="inherit" /> : <RestartAltIcon sx={{ fontSize: 18 }} />}
                    onClick={() => handleRepairService(svc.id)}
                    disabled={repairingId === svc.id || repairingAll || testing}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: '#D97706',
                      '&:hover': { bgcolor: '#B45309' },
                      borderRadius: 1.5
                    }}
                  >
                    {repairingId === svc.id ? 'Восстановление...' : 'Восстановить / Перезапустить'}
                  </Button>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {svc.id === 'swagger' ? (
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                      onClick={() => window.open(`${API_BASE_URL}/api-docs`, '_blank', 'noopener,noreferrer')}
                      sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#2563EB' }}
                    >
                      Открыть Swagger UI
                    </Button>
                  ) : svc.id === 'sqlite' ? (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/sqlite-studio')}
                        sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#0F3C64' }}
                      >
                        SQLite Studio (БД)
                      </Button>
                      {svc.status === 'ONLINE' && (
                        <Tooltip title="Очистить WAL и проверить целостность">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleRepairService('sqlite')}
                            disabled={repairingId === 'sqlite' || repairingAll}
                            sx={{ minWidth: 40, px: 1, borderColor: '#CBD5E1', color: '#16A34A' }}
                          >
                            {repairingId === 'sqlite' ? <CircularProgress size={14} /> : <BuildCircleIcon sx={{ fontSize: 18 }} />}
                          </Button>
                        </Tooltip>
                      )}
                    </>
                  ) : svc.id === 'fiscal' ? (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/admin/fiscal-test-wizard')}
                        sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#0F3C64' }}
                      >
                        Мастер тестов ККТ
                      </Button>
                      {svc.status === 'ONLINE' && (
                        <Tooltip title="Перезапустить службу OrthoErp.FiscalService">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleRepairService('fiscal')}
                            disabled={repairingId === 'fiscal' || repairingAll}
                            sx={{ minWidth: 40, px: 1, borderColor: '#CBD5E1', color: '#9333EA' }}
                          >
                            {repairingId === 'fiscal' ? <CircularProgress size={14} /> : <RestartAltIcon sx={{ fontSize: 18 }} />}
                          </Button>
                        </Tooltip>
                      )}
                    </>
                  ) : svc.id === 'pos' ? (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/pos-settlement')}
                        sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#0F3C64' }}
                      >
                        Сверка итогов / POS
                      </Button>
                      {svc.status === 'ONLINE' && (
                        <Tooltip title="Перезапустить службу DualConnector">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleRepairService('pos')}
                            disabled={repairingId === 'pos' || repairingAll}
                            sx={{ minWidth: 40, px: 1, borderColor: '#CBD5E1', color: '#D97706' }}
                          >
                            {repairingId === 'pos' ? <CircularProgress size={14} /> : <RestartAltIcon sx={{ fontSize: 18 }} />}
                          </Button>
                        </Tooltip>
                      )}
                    </>
                  ) : svc.id === 'firebird' ? (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/admin/firebird-sync')}
                        sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#0F3C64' }}
                      >
                        FireBird Sync
                      </Button>
                      {svc.status === 'ONLINE' && (
                        <Tooltip title="Переподключить базу Firebird">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleRepairService('firebird')}
                            disabled={repairingId === 'firebird' || repairingAll}
                            sx={{ minWidth: 40, px: 1, borderColor: '#CBD5E1', color: '#EA580C' }}
                          >
                            {repairingId === 'firebird' ? <CircularProgress size={14} /> : <RestartAltIcon sx={{ fontSize: 18 }} />}
                          </Button>
                        </Tooltip>
                      )}
                    </>
                  ) : svc.id === 'backup' ? (
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      startIcon={repairingId === 'backup' ? <CircularProgress size={14} color="inherit" /> : <BackupIcon sx={{ fontSize: 18 }} />}
                      onClick={() => handleRepairService('backup')}
                      disabled={repairingId === 'backup' || repairingAll}
                      sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#0D9488' }}
                    >
                      {repairingId === 'backup' ? 'Создание снимка...' : 'Создать снимок БД'}
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      onClick={runDeepTests}
                      disabled={testing}
                      sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#0F3C64' }}
                    >
                      Повторить проверку
                    </Button>
                  )}
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Terminal / Execution Console */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid #1E293B',
          bgcolor: '#0F172A',
          color: '#E2E8F0',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.2,
            bgcolor: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #334155'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TerminalIcon sx={{ fontSize: 18, color: '#38BDF8' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F1F5F9' }}>
              Консоль выполнения проверок и журнал диагностики
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Очистить журнал">
              <Button
                size="small"
                onClick={() => setLogs([])}
                sx={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'none', minWidth: 'auto' }}
              >
                Очистить
              </Button>
            </Tooltip>
          </Box>
        </Box>

        <Box
          ref={logTerminalRef}
          sx={{
            p: 2,
            maxHeight: 220,
            overflowY: 'auto',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '0.82rem',
            lineHeight: 1.6
          }}
        >
          {logs.length === 0 ? (
            <Typography sx={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.82rem' }}>
              Журнал чист. Нажмите «Запустить тест всех служб», чтобы выполнить детальное тестирование с таймингом...
            </Typography>
          ) : (
            logs.map((log, index) => {
              const isError = log.level === 'ERROR';
              const isWarn = log.level === 'WARN';
              const color = isError ? '#EF4444' : isWarn ? '#F59E0B' : '#38BDF8';
              return (
                <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 0.5 }}>
                  <Typography component="span" sx={{ color: '#64748B', minWidth: 70, fontSize: '0.78rem' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </Typography>
                  <Typography component="span" sx={{ color, fontWeight: 700, minWidth: 60, fontSize: '0.78rem' }}>
                    [{log.level}]
                  </Typography>
                  <Typography component="span" sx={{ color: isError ? '#FCA5A5' : '#E2E8F0', flex: 1, fontSize: '0.8rem' }}>
                    {log.message}
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>
      </Paper>

      {/* Snackbar feedback */}
      <Snackbar
        open={Boolean(successFeedback)}
        autoHideDuration={5000}
        onClose={() => setSuccessFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessFeedback(null)}
          severity="success"
          variant="filled"
          sx={{ width: '100%', fontWeight: 600, borderRadius: 2 }}
        >
          {successFeedback}
        </Alert>
      </Snackbar>
    </Box>
  );
}
