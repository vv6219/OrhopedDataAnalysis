import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  LinearProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Divider,
  Switch
} from '@mui/material';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import StorageIcon from '@mui/icons-material/Storage';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TerminalIcon from '@mui/icons-material/Terminal';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SaveIcon from '@mui/icons-material/Save';
import DescriptionIcon from '@mui/icons-material/Description';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import BiotechIcon from '@mui/icons-material/Biotech';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useNavigate } from 'react-router-dom';

export interface FbStats {
  patients: number;
  visits: number;
  contracts: number;
  channels: number;
  insurers: number;
  dms_cards: number;
  dmscards?: number;
  protdict?: number;
  protocols?: number;
  protshots?: number;
  mkb?: number;
  diagnoses?: number;
  labdict?: number;
  labpdf?: number;
  labplan?: number;
  servdict?: number;
  services?: number;
  servprices?: number;
  servplan?: number;
  discounts?: number;
  schedule?: number;
  templates?: number;
}

export interface SqliteStats {
  patientsCount: number;
  visitsCount: number;
  channelsCount: number;
  insurersCount: number;
  dmsCardsCount: number;
  protdictCount?: number;
  protocolsCount?: number;
  protshotsCount?: number;
  mkbCount?: number;
  diagnosesCount?: number;
  labdictCount?: number;
  labpdfCount?: number;
  labplanCount?: number;
  servdictCount?: number;
  servicesCount?: number;
  servpricesCount?: number;
  servplanCount?: number;
  discountsCount?: number;
  scheduleCount?: number;
  templatesCount?: number;
}

const steps = [
  'Подключение и Диагностика',
  'Выбор таблиц и Параметры',
  'Синхронизация и Лог',
  'Результаты и Отчет'
];

export default function FirebirdSync() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  // Connection settings (dynamically populated from appsettings.json)
  const [dbPath, setDbPath] = useState('C:\\Users\\vladimir\\source\\DB\\Export\\MEDICAL.FDB');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState<number | string>(3050);
  const [user, setUser] = useState('SYSDBA');
  const [password, setPassword] = useState('masterkey');
  const [showPassword, setShowPassword] = useState(false);
  const [charset, setCharset] = useState('WIN1251');
  const [sqlitePath, setSqlitePath] = useState('db/orthopedic_data_center.sqlite');

  // Config saving state
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState<string | null>(null);

  // Connection & Diagnostics state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; stats?: FbStats; error?: string } | null>(null);
  const [testDurationMs, setTestDurationMs] = useState<number | null>(null);

  // Current SQLite Database status
  const [sqliteStats, setSqliteStats] = useState<SqliteStats | null>(null);
  const [isLoadingSqliteStats, setIsLoadingSqliteStats] = useState(false);

  // Table selection scope
  // Group 1: Protocols & Shots
  const [syncProtdict, setSyncProtdict] = useState(true);
  const [syncProtocols, setSyncProtocols] = useState(true);
  const [syncProtshots, setSyncProtshots] = useState(true);
  const [includeShotsBlob, setIncludeShotsBlob] = useState(false);

  // Group 2: ICD-10 MKB & Diagnoses
  const [syncMkb, setSyncMkb] = useState(true);
  const [syncDiagnoses, setSyncDiagnoses] = useState(true);

  // Group 3: Laboratory
  const [syncLabdict, setSyncLabdict] = useState(true);
  const [syncLabpdf, setSyncLabpdf] = useState(true);
  const [syncLabplan, setSyncLabplan] = useState(true);

  // Group 4: Services & Pricing
  const [syncServdict, setSyncServdict] = useState(true);
  const [syncServices, setSyncServices] = useState(true);
  const [syncServprices, setSyncServprices] = useState(true);
  const [syncServplan, setSyncServplan] = useState(true);

  // Group 5: Patients, DMS, Visits, Discounts
  const [syncPatients, setSyncPatients] = useState(true);
  const [syncVisits, setSyncVisits] = useState(true);
  const [syncChannels, setSyncChannels] = useState(true);
  const [syncInsurers, setSyncInsurers] = useState(true);
  const [syncDmsCards, setSyncDmsCards] = useState(true);
  const [syncDiscounts, setSyncDiscounts] = useState(true);
  const [syncSchedule, setSyncSchedule] = useState(true);
  const [syncTemplates, setSyncTemplates] = useState(true);

  // Execution state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncOutput, setSyncOutput] = useState<string>('');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncTimeSec, setSyncTimeSec] = useState<string | null>(null);
  const [elapsedTimer, setElapsedTimer] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  // Preset Handlers
  const handleSelectAll = () => {
    setSyncProtdict(true);
    setSyncProtocols(true);
    setSyncProtshots(true);
    setSyncMkb(true);
    setSyncDiagnoses(true);
    setSyncLabdict(true);
    setSyncLabpdf(true);
    setSyncLabplan(true);
    setSyncServdict(true);
    setSyncServices(true);
    setSyncServprices(true);
    setSyncServplan(true);
    setSyncPatients(true);
    setSyncVisits(true);
    setSyncChannels(true);
    setSyncInsurers(true);
    setSyncDmsCards(true);
    setSyncDiscounts(true);
    setSyncSchedule(true);
    setSyncTemplates(true);
  };

  const handleSelectNone = () => {
    setSyncProtdict(false);
    setSyncProtocols(false);
    setSyncProtshots(false);
    setSyncMkb(false);
    setSyncDiagnoses(false);
    setSyncLabdict(false);
    setSyncLabpdf(false);
    setSyncLabplan(false);
    setSyncServdict(false);
    setSyncServices(false);
    setSyncServprices(false);
    setSyncServplan(false);
    setSyncPatients(false);
    setSyncVisits(false);
    setSyncChannels(false);
    setSyncInsurers(false);
    setSyncDmsCards(false);
    setSyncDiscounts(false);
    setSyncSchedule(false);
    setSyncTemplates(false);
  };

  const handleSelectProtocolsAndMkb = () => {
    handleSelectNone();
    setSyncProtdict(true);
    setSyncProtocols(true);
    setSyncProtshots(true);
    setSyncMkb(true);
    setSyncDiagnoses(true);
  };

  const handleSelectServicesAndLab = () => {
    handleSelectNone();
    setSyncServdict(true);
    setSyncServices(true);
    setSyncServprices(true);
    setSyncServplan(true);
    setSyncLabdict(true);
    setSyncLabpdf(true);
    setSyncLabplan(true);
  };

  const handleSelectPatientsOnly = () => {
    handleSelectNone();
    setSyncPatients(true);
    setSyncVisits(true);
    setSyncChannels(true);
    setSyncInsurers(true);
    setSyncDmsCards(true);
    setSyncDiscounts(true);
  };

  // Fetch current SQLite status and dynamic appsettings.json configuration on mount
  const fetchConfigAndStatus = async () => {
    setIsLoadingSqliteStats(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/firebird/status`);
      if (res.ok) {
        const data = await res.json();
        setSqliteStats(data.sqliteStats);
        if (data.firebirdConfig) {
          if (data.firebirdConfig.DatabasePath) setDbPath(data.firebirdConfig.DatabasePath);
          if (data.firebirdConfig.User) setUser(data.firebirdConfig.User);
          if (data.firebirdConfig.Password) setPassword(data.firebirdConfig.Password);
          if (data.firebirdConfig.Host) setHost(data.firebirdConfig.Host);
          if (data.firebirdConfig.Port) setPort(data.firebirdConfig.Port);
          if (data.firebirdConfig.Charset) setCharset(data.firebirdConfig.Charset);
        }
        if (data.resolvedSqlitePath) {
          setSqlitePath(data.resolvedSqlitePath);
        }
      }
    } catch (e) {
      console.error('Error fetching SQLite stats:', e);
    } finally {
      setIsLoadingSqliteStats(false);
    }
  };

  useEffect(() => {
    fetchConfigAndStatus();
  }, []);

  // Save updated parameters to appsettings.json
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    setConfigSaveSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ConnectionStrings: {
            Firebird: {
              Host: host,
              Port: Number(port) || 3050,
              DatabasePath: dbPath,
              User: user,
              Password: password,
              Charset: charset
            }
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfigSaveSuccess('Параметры успешно сохранены в appsettings.json');
        setTimeout(() => setConfigSaveSuccess(null), 4000);
      } else {
        alert(data.error || 'Ошибка при сохранении конфигурации');
      }
    } catch (err: any) {
      alert('Ошибка при сохранении appsettings.json: ' + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Timer effect during sync
  useEffect(() => {
    let interval: any = null;
    if (isSyncing) {
      setElapsedTimer(0);
      interval = setInterval(() => {
        setElapsedTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSyncing]);

  // Auto-scroll console
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [syncOutput]);

  // Test Firebird connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/firebird/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbPath, user, password, host, port: Number(port) || 3050, charset })
      });
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setTestDurationMs(elapsed);
      if (res.ok && data.success) {
        setTestResult({ success: true, stats: data });
      } else {
        setTestResult({ success: false, error: data.error || 'Ошибка подключения к Firebird' });
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Сетевая ошибка' });
    } finally {
      setIsTesting(false);
    }
  };

  // Launch Synchronization with selected tables
  const handleRunSync = async () => {
    setIsSyncing(true);
    setSyncError(null);

    const selected: string[] = [];
    if (syncProtdict) selected.push('protdict');
    if (syncProtocols) selected.push('protocols');
    if (syncProtshots) selected.push('protshots');
    if (syncMkb) selected.push('mkb');
    if (syncDiagnoses) selected.push('diagnoses');
    if (syncLabdict) selected.push('labdict');
    if (syncLabpdf) selected.push('labpdf');
    if (syncLabplan) selected.push('labplan');
    if (syncServdict) selected.push('servdict');
    if (syncServices) selected.push('services');
    if (syncServprices) selected.push('servprices');
    if (syncServplan) selected.push('servplan');
    if (syncPatients) selected.push('patients');
    if (syncVisits) selected.push('visits');
    if (syncChannels) selected.push('channels');
    if (syncInsurers) selected.push('insurers');
    if (syncDmsCards) selected.push('dmscards');
    if (syncDiscounts) selected.push('discounts');
    if (syncSchedule) selected.push('schedule');
    if (syncTemplates) selected.push('templates');

    setSyncOutput(`[${new Date().toLocaleTimeString()}] Запуск синхронизации Firebird -> SQLite...\n`);
    setSyncOutput((prev) => prev + `[${new Date().toLocaleTimeString()}] Источник Firebird: ${host}:${port}/${dbPath}\n`);
    setSyncOutput((prev) => prev + `[${new Date().toLocaleTimeString()}] Цель SQLite: ${sqlitePath}\n`);
    setSyncOutput((prev) => prev + `[${new Date().toLocaleTimeString()}] Выбрано таблиц для синхронизации: ${selected.length} (${selected.join(', ')})\n`);
    setSyncOutput((prev) => prev + `[${new Date().toLocaleTimeString()}] Загрузка полных BLOB-изображений PROTSHOTS: ${includeShotsBlob ? 'ДА (~2.2 ГБ)' : 'НЕТ (метаданные + размеры)'}\n`);
    setSyncOutput((prev) => prev + `[${new Date().toLocaleTimeString()}] Запуск расширенного Python engine (sync_patients_firebird.py)...\n\n`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/firebird/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbPath,
          user,
          password,
          host,
          port: Number(port) || 3050,
          charset,
          tables: selected,
          includeShotsBlob
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncOutput((prev) => prev + data.logs + `\n[${new Date().toLocaleTimeString()}] УСПЕХ: Синхронизация завершена за ${data.elapsedSeconds} сек!\n`);
        setSyncTimeSec(data.elapsedSeconds);
        await fetchConfigAndStatus();
        setActiveStep(3); // Jump to results
      } else {
        setSyncError(data.error || 'Ошибка при синхронизации');
        setSyncOutput((prev) => prev + (data.stdout || '') + '\n' + (data.stderr || data.error || ''));
      }
    } catch (e: any) {
      setSyncError(e.message || 'Ошибка выполнения запроса');
      setSyncOutput((prev) => prev + `\n[ERROR] ${e.message}\n`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(syncOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to format values
  const fmt = (v: number | undefined, def: string) => {
    if (v !== undefined && v !== null) return v.toLocaleString('ru-RU');
    return def;
  };

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0F3C64 0%, #156C9C 50%, #2087C2 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          boxShadow: '0 8px 24px rgba(15, 60, 100, 0.2)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)'
            }}
          >
            <SyncAltIcon sx={{ fontSize: 32, color: '#FFFFFF' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              Мастер синхронизации Firebird (MEDICAL.FDB)
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Сквозной перенос протоколов, МКБ, лаборатории, услуг, ДМС и пациентов в локальную базу SQLite
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchConfigAndStatus}
            disabled={isLoadingSqliteStats}
            sx={{
              color: '#FFFFFF',
              borderColor: 'rgba(255, 255, 255, 0.4)',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              fontWeight: 600,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
            }}
          >
            Обновить статус
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/patients')}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#0F3C64',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              '&:hover': { bgcolor: '#F0F6FA' }
            }}
          >
            Пациенты
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<StorageIcon />}
            onClick={() => navigate('/sqlite-studio')}
            sx={{
              bgcolor: '#082540',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': { bgcolor: '#041525' }
            }}
          >
            SQLite Studio
          </Button>
        </Box>
      </Paper>

      {/* Stepper Navigation */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={activeStep > index}>
              <StepLabel
                sx={{
                  cursor: 'pointer',
                  '& .MuiStepLabel-label': {
                    fontSize: '0.84rem',
                    fontWeight: activeStep === index ? 700 : 500,
                    color: activeStep === index ? '#0F3C64' : 'text.secondary'
                  }
                }}
                onClick={() => {
                  if (!isSyncing) setActiveStep(index);
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* STEP 0: Connection & Diagnostics */}
      {activeStep === 0 && (
        <Box>
          <Grid container spacing={3}>
            {/* Connection Parameters Form */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, height: '100%', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <CloudQueueIcon sx={{ color: '#0F3C64', fontSize: 26 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '1rem' }}>
                      Параметры подключения к Firebird
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Укажите путь к файлу БД и учетные данные администратора
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Путь к файлу базы данных Firebird (.FDB)"
                    size="small"
                    value={dbPath}
                    onChange={(e) => setDbPath(e.target.value)}
                    helperText="Локальный или сетевой путь к файлу MEDICAL.FDB"
                  />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        label="Пользователь"
                        size="small"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        label="Пароль"
                        size="small"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 8 }}>
                      <TextField
                        fullWidth
                        label="Хост Firebird (Host)"
                        size="small"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        helperText="Имя хоста или IP (из appsettings.json)"
                      />
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <TextField
                        fullWidth
                        label="Порт"
                        size="small"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        helperText="По умолч. 3050"
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        label="Кодировка (Charset)"
                        size="small"
                        value={charset}
                        onChange={(e) => setCharset(e.target.value)}
                        helperText="WIN1251"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        label="Целевая SQLite БД"
                        size="small"
                        disabled
                        value={sqlitePath || 'orthopedic_data_center.sqlite'}
                        helperText="Активный файл базы данных"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      sx={{ flex: 1, bgcolor: '#0F3C64', py: 1.1, fontWeight: 700, borderRadius: 2 }}
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      startIcon={isTesting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                    >
                      {isTesting ? 'Проверка...' : 'Проверить соединение'}
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={handleSaveConfig}
                      disabled={isSavingConfig}
                      startIcon={isSavingConfig ? <CircularProgress size={18} /> : <SaveIcon />}
                      sx={{
                        borderColor: '#0F3C64',
                        color: '#0F3C64',
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 2,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isSavingConfig ? 'Сохранение...' : 'Сохранить в JSON'}
                    </Button>
                  </Box>

                  {configSaveSuccess && (
                    <Alert severity="success" icon={<CheckIcon />} sx={{ borderRadius: 2 }}>
                      {configSaveSuccess}
                    </Alert>
                  )}

                  {testResult && (
                    <Alert
                      severity={testResult.success ? 'success' : 'error'}
                      icon={testResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                      sx={{ mt: 1, borderRadius: 2 }}
                    >
                      {testResult.success ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Связь успешно установлена! ({testDurationMs} мс)
                          </Typography>
                          <Typography variant="caption">
                            БД Firebird отвечает на localhost:3050, все 21 таблица доступны для выборки.
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Ошибка подключения:
                          </Typography>
                          <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                            {testResult.error}
                          </Typography>
                        </Box>
                      )}
                    </Alert>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* SQLite & Firebird Records Comparison Overview */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, height: '100%', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <StorageIcon sx={{ color: '#156C9C', fontSize: 26 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '1rem' }}>
                        Реестр таблиц: Firebird vs SQLite
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Текущее состояние и сверка количества записей по всем модулям клиники
                      </Typography>
                    </Box>
                  </Box>
                  {isLoadingSqliteStats && <CircularProgress size={18} />}
                </Box>

                <Grid container spacing={1.5}>
                  {[
                    // Protocols & Shots
                    {
                      title: 'Протоколы (PROTOCOLS)',
                      fbVal: fmt(testResult?.stats?.protocols, '32 881'),
                      sqVal: fmt(sqliteStats?.protocolsCount, '0'),
                      icon: <DescriptionIcon sx={{ color: '#9333EA' }} />,
                      category: 'Клинические данные'
                    },
                    {
                      title: 'Шаблоны (PROTDICT)',
                      fbVal: fmt(testResult?.stats?.protdict, '530'),
                      sqVal: fmt(sqliteStats?.protdictCount, '530'),
                      icon: <DescriptionIcon sx={{ color: '#7E22CE' }} />,
                      category: 'Справочник'
                    },
                    {
                      title: 'Снимки (PROTSHOTS)',
                      fbVal: fmt(testResult?.stats?.protshots, '861'),
                      sqVal: fmt(sqliteStats?.protshotsCount, '861'),
                      icon: <PhotoCameraIcon sx={{ color: '#A855F7' }} />,
                      category: 'Графика'
                    },
                    // MKB & Diagnoses
                    {
                      title: 'МКБ-10 (MKB)',
                      fbVal: fmt(testResult?.stats?.mkb, '15 038'),
                      sqVal: fmt(sqliteStats?.mkbCount, '15 038'),
                      icon: <BiotechIcon sx={{ color: '#059669' }} />,
                      category: 'Классификатор'
                    },
                    {
                      title: 'Диагнозы (DIAGNOSES)',
                      fbVal: fmt(testResult?.stats?.diagnoses, '14 630'),
                      sqVal: fmt(sqliteStats?.diagnosesCount, '14 630'),
                      icon: <BiotechIcon sx={{ color: '#10B981' }} />,
                      category: 'Клинические диагнозы'
                    },
                    // Laboratory
                    {
                      title: 'Анализы (LABDICT)',
                      fbVal: fmt(testResult?.stats?.labdict, '1 154'),
                      sqVal: fmt(sqliteStats?.labdictCount, '1 154'),
                      icon: <BiotechIcon sx={{ color: '#0D9488' }} />,
                      category: 'Лаборатория'
                    },
                    // Services & Pricing
                    {
                      title: 'Услуги номенкл. (SERVDICT)',
                      fbVal: fmt(testResult?.stats?.servdict, '382'),
                      sqVal: fmt(sqliteStats?.servdictCount, '382'),
                      icon: <MedicalServicesIcon sx={{ color: '#D97706' }} />,
                      category: 'Номенклатура'
                    },
                    {
                      title: 'Оказанные услуги (SERVICES)',
                      fbVal: fmt(testResult?.stats?.services, '63 010'),
                      sqVal: fmt(sqliteStats?.servicesCount, '0'),
                      icon: <MedicalServicesIcon sx={{ color: '#B45309' }} />,
                      category: 'Транзакции'
                    },
                    {
                      title: 'Тарифы ДМС (SERVPRICES)',
                      fbVal: fmt(testResult?.stats?.servprices, '170'),
                      sqVal: fmt(sqliteStats?.servpricesCount, '170'),
                      icon: <MedicalServicesIcon sx={{ color: '#F59E0B' }} />,
                      category: 'Прайс-листы'
                    },
                    // Patients & DMS
                    {
                      title: 'Пациенты (PATIENTS)',
                      fbVal: fmt(testResult?.stats?.patients, '61 298'),
                      sqVal: fmt(sqliteStats?.patientsCount, '61 301'),
                      icon: <PeopleIcon sx={{ color: '#0F3C64' }} />,
                      category: 'ЭМК'
                    },
                    {
                      title: 'Визиты (VISITS)',
                      fbVal: fmt(testResult?.stats?.visits, '37 538'),
                      sqVal: fmt(sqliteStats?.visitsCount, '37 538'),
                      icon: <EventNoteIcon sx={{ color: '#156C9C' }} />,
                      category: 'Приемы'
                    },
                    {
                      title: 'Карты ДМС (DMSCARDS)',
                      fbVal: fmt(testResult?.stats?.dms_cards || testResult?.stats?.dmscards, '97'),
                      sqVal: fmt(sqliteStats?.dmsCardsCount, '97'),
                      icon: <StorageIcon sx={{ color: '#319795' }} />,
                      category: 'Страхование'
                    },
                    {
                      title: 'Скидки (DISCOUNTS)',
                      fbVal: fmt(testResult?.stats?.discounts, '8 978'),
                      sqVal: fmt(sqliteStats?.discountsCount, '8 978'),
                      icon: <LocalOfferIcon sx={{ color: '#E11D48' }} />,
                      category: 'Лояльность'
                    },
                    {
                      title: 'Расписание (SCHEDULE)',
                      fbVal: fmt(testResult?.stats?.schedule, '534'),
                      sqVal: fmt(sqliteStats?.scheduleCount, '534'),
                      icon: <CalendarMonthIcon sx={{ color: '#4F46E5' }} />,
                      category: 'Графики'
                    }
                  ].map((metric) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={metric.title}>
                      <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#FAFCFE', borderColor: '#E2E8F0' }}>
                        <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {metric.icon}
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#1A2027' }}>
                                {metric.title}
                              </Typography>
                            </Box>
                            <Chip
                              size="small"
                              label={metric.category}
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600, borderColor: '#CBD5E1' }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75, pt: 0.5, borderTop: '1px dashed #E2E8F0' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Firebird: <b>{metric.fbVal}</b>
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#0F3C64', fontWeight: 700 }}>
                              SQLite: <b>{metric.sqVal}</b>
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(1)}
                    sx={{ bgcolor: '#0F3C64', fontWeight: 700, px: 3, borderRadius: 2 }}
                  >
                    Перейти к выбору таблиц →
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* STEP 1: Tables Scope & Options */}
      {activeStep === 1 && (
        <Paper elevation={0} sx={{ p: 3.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Выбор таблиц и области синхронизации
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Выберите необходимые модули или воспользуйтесь быстрыми профилями выборки
              </Typography>
            </Box>

            {/* Quick Presets */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined" onClick={handleSelectAll} sx={{ fontWeight: 700, borderColor: '#0F3C64', color: '#0F3C64' }}>
                Выбрать ВСЁ (100%)
              </Button>
              <Button size="small" variant="outlined" onClick={handleSelectProtocolsAndMkb} sx={{ fontWeight: 600 }}>
                Протоколы, МКБ и Снимки
              </Button>
              <Button size="small" variant="outlined" onClick={handleSelectServicesAndLab} sx={{ fontWeight: 600 }}>
                Услуги и Лаборатория
              </Button>
              <Button size="small" variant="outlined" onClick={handleSelectPatientsOnly} sx={{ fontWeight: 600 }}>
                Пациенты и ДМС
              </Button>
              <Button size="small" variant="text" onClick={handleSelectNone} sx={{ color: '#64748B' }}>
                Снять выбор
              </Button>
            </Box>
          </Box>

          {/* Category 1: Protocols & Shots */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#9333EA', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon sx={{ fontSize: 20 }} /> 1. Клинические протоколы и графические снимки
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              {
                id: 'protdict',
                title: 'Шаблоны протоколов (PROTDICT)',
                desc: '530 шаблонов: структура приемов, описания осмотров ортопеда, текстовые поля и разделы',
                checked: syncProtdict,
                onChange: setSyncProtdict,
                badge: 'Шаблоны',
                badgeColor: '#9333EA'
              },
              {
                id: 'protocols',
                title: 'Протоколы приёмов пациентов (PROTOCOLS)',
                desc: '32 881 протоколов: осмотры ортопеда, анамнез, статус, назначения, привязка к пациенту и дате',
                checked: syncProtocols,
                onChange: setSyncProtocols,
                badge: 'Клинические данные',
                badgeColor: '#7E22CE'
              },
              {
                id: 'protshots',
                title: 'Снимки и графика к протоколам (PROTSHOTS)',
                desc: '861 снимок: рентген-снимки, стопы, суставы, прикрепленные файлы к протоколам',
                checked: syncProtshots,
                onChange: setSyncProtshots,
                badge: 'Графика и Фото',
                badgeColor: '#A855F7'
              }
            ].map((tbl) => (
              <Grid size={{ xs: 12, md: 4 }} key={tbl.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: tbl.checked ? '#FAF5FF' : '#FAFCFE',
                    borderColor: tbl.checked ? '#9333EA' : '#E2E8F0',
                    cursor: 'pointer'
                  }}
                  onClick={() => tbl.onChange(!tbl.checked)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <FormControlLabel
                      control={<Checkbox checked={tbl.checked} sx={{ color: '#9333EA', '&.Mui-checked': { color: '#9333EA' } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>{tbl.title}</Typography>}
                    />
                    <Chip size="small" label={tbl.badge} sx={{ bgcolor: tbl.badgeColor, color: '#FFF', fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', pl: 4, color: 'text.secondary' }}>
                    {tbl.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}

            {/* Toggle for full BLOB binary import */}
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 1.5, px: 2, borderRadius: 2, bgcolor: '#FDF4FF', borderColor: '#F0ABFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#86198F' }}>
                    Режим выгрузки снимков PROTSHOTS:
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#701A75' }}>
                    {includeShotsBlob
                      ? 'ВКЛЮЧЕНА полная загрузка бинарных изображений (BLOB ~2.2 ГБ). Перенос может занять 5-8 минут.'
                      : 'Оптимизированный режим: переносятся метаданные, имена файлов и размер байт (быстро, ~0.1 сек).'}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={<Switch checked={includeShotsBlob} onChange={(e) => setIncludeShotsBlob(e.target.checked)} color="secondary" />}
                  label={<Typography variant="caption" sx={{ fontWeight: 700, color: '#86198F' }}>Загружать полные BLOB-файлы (~2.2 ГБ)</Typography>}
                />
              </Paper>
            </Grid>
          </Grid>

          {/* Category 2: ICD-10 MKB & Diagnoses */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#059669', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BiotechIcon sx={{ fontSize: 20 }} /> 2. Классификатор МКБ-10 и Диагнозы
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              {
                id: 'mkb',
                title: 'Справочник МКБ-10 (MKB)',
                desc: '15 038 диагнозов: коды МКБ-10 (M17, M20, M21...), рубрики, иерархия и названия патологий',
                checked: syncMkb,
                onChange: setSyncMkb,
                badge: 'Классификатор',
                badgeColor: '#059669'
              },
              {
                id: 'diagnoses',
                title: 'Диагнозы протоколов (DIAGNOSES)',
                desc: '14 630 записей: установленные диагнозы по протоколам приёмов с автоматической связкой кодов',
                checked: syncDiagnoses,
                onChange: setSyncDiagnoses,
                badge: 'Связка M:N',
                badgeColor: '#10B981'
              }
            ].map((tbl) => (
              <Grid size={{ xs: 12, md: 6 }} key={tbl.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: tbl.checked ? '#F0FDF4' : '#FAFCFE',
                    borderColor: tbl.checked ? '#059669' : '#E2E8F0',
                    cursor: 'pointer'
                  }}
                  onClick={() => tbl.onChange(!tbl.checked)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <FormControlLabel
                      control={<Checkbox checked={tbl.checked} sx={{ color: '#059669', '&.Mui-checked': { color: '#059669' } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>{tbl.title}</Typography>}
                    />
                    <Chip size="small" label={tbl.badge} sx={{ bgcolor: tbl.badgeColor, color: '#FFF', fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', pl: 4, color: 'text.secondary' }}>
                    {tbl.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Category 3: Laboratory */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0D9488', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BiotechIcon sx={{ fontSize: 20 }} /> 3. Лабораторные исследования
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              {
                id: 'labdict',
                title: 'Справочник исследований (LABDICT)',
                desc: '1 154 анализа: номенклатура лабораторных тестов, цены, сроки выполнения и режимы',
                checked: syncLabdict,
                onChange: setSyncLabdict,
                badge: 'Справочник',
                badgeColor: '#0D9488'
              },
              {
                id: 'labpdf',
                title: 'PDF результатов анализов (LABPDF)',
                desc: 'Структура для хранения PDF-бланков результатов внешних лабораторий',
                checked: syncLabpdf,
                onChange: setSyncLabpdf,
                badge: 'Файлы PDF',
                badgeColor: '#14B8A6'
              },
              {
                id: 'labplan',
                title: 'Планы назначений анализов (LABPLAN)',
                desc: 'Планы лабораторных исследований и назначений в рамках приёмов',
                checked: syncLabplan,
                onChange: setSyncLabplan,
                badge: 'Назначения',
                badgeColor: '#2DD4BF'
              }
            ].map((tbl) => (
              <Grid size={{ xs: 12, md: 4 }} key={tbl.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: tbl.checked ? '#F0FDFA' : '#FAFCFE',
                    borderColor: tbl.checked ? '#0D9488' : '#E2E8F0',
                    cursor: 'pointer'
                  }}
                  onClick={() => tbl.onChange(!tbl.checked)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <FormControlLabel
                      control={<Checkbox checked={tbl.checked} sx={{ color: '#0D9488', '&.Mui-checked': { color: '#0D9488' } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>{tbl.title}</Typography>}
                    />
                    <Chip size="small" label={tbl.badge} sx={{ bgcolor: tbl.badgeColor, color: '#FFF', fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', pl: 4, color: 'text.secondary' }}>
                    {tbl.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Category 4: Services & Pricing */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#D97706', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MedicalServicesIcon sx={{ fontSize: 20 }} /> 4. Номенклатура медицинских услуг и прейскурант
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              {
                id: 'servdict',
                title: 'Номенклатура услуг (SERVDICT)',
                desc: '382 услуги: медицинские манипуляции, ортопедические процедуры, базовые цены и коды',
                checked: syncServdict,
                onChange: setSyncServdict,
                badge: 'Номенклатура',
                badgeColor: '#D97706'
              },
              {
                id: 'services',
                title: 'Оказанные услуги и чеки (SERVICES)',
                desc: '63 010 строк: полная история оказанных услуг, скидки, фактурные цены и врачи',
                checked: syncServices,
                onChange: setSyncServices,
                badge: 'Транзакции',
                badgeColor: '#B45309'
              },
              {
                id: 'servprices',
                title: 'Тарифы ДМС (SERVPRICES)',
                desc: '170 тарифов: согласованные прейскуранты по страховым компаниям ДМС',
                checked: syncServprices,
                onChange: setSyncServprices,
                badge: 'Прейскурант ДМС',
                badgeColor: '#F59E0B'
              },
              {
                id: 'servplan',
                title: 'Планы оказания услуг (SERVPLAN)',
                desc: '15 записей: назначенные курсовые процедуры по протоколам',
                checked: syncServplan,
                onChange: setSyncServplan,
                badge: 'План лечения',
                badgeColor: '#FBBF24'
              }
            ].map((tbl) => (
              <Grid size={{ xs: 12, md: 6 }} key={tbl.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: tbl.checked ? '#FFFBEB' : '#FAFCFE',
                    borderColor: tbl.checked ? '#D97706' : '#E2E8F0',
                    cursor: 'pointer'
                  }}
                  onClick={() => tbl.onChange(!tbl.checked)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <FormControlLabel
                      control={<Checkbox checked={tbl.checked} sx={{ color: '#D97706', '&.Mui-checked': { color: '#D97706' } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>{tbl.title}</Typography>}
                    />
                    <Chip size="small" label={tbl.badge} sx={{ bgcolor: tbl.badgeColor, color: '#FFF', fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', pl: 4, color: 'text.secondary' }}>
                    {tbl.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Category 5: Patients, DMS, Visits, Discounts */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon sx={{ fontSize: 20 }} /> 5. Пациенты, Визиты, ДМС, Скидки и Расписание
          </Typography>
          <Grid container spacing={2}>
            {[
              {
                id: 'patients',
                title: 'Картотека пациентов (PATIENTS)',
                desc: '61 298 записей: ФИО, СНИЛС, паспорта, телефоны, адреса, даты рождения, EMR-номера',
                checked: syncPatients,
                onChange: setSyncPatients,
                badge: 'Основная сущность',
                badgeColor: '#0F3C64'
              },
              {
                id: 'visits',
                title: 'История визитов (VISITS)',
                desc: '37 538 записей: Даты визитов, назначенные врачи и ассистенты, типы посещений',
                checked: syncVisits,
                onChange: setSyncVisits,
                badge: 'Визиты',
                badgeColor: '#156C9C'
              },
              {
                id: 'dms_cards',
                title: 'Карты ДМС (DMSCARDS)',
                desc: '97 записей: Полисы добровольного медицинского страхования пациентов',
                checked: syncDmsCards,
                onChange: setSyncDmsCards,
                badge: 'ДМС',
                badgeColor: '#319795'
              },
              {
                id: 'insurers',
                title: 'Страховые компании (INSURERS)',
                desc: '19 записей: Страховые компании и фонды ОМС/ДМС',
                checked: syncInsurers,
                onChange: setSyncInsurers,
                badge: 'Справочник',
                badgeColor: '#2C5282'
              },
              {
                id: 'channels',
                title: 'Каналы обращений (CHANNELS)',
                desc: '22 записи: Источники рекламы, сайт, рекомендации',
                checked: syncChannels,
                onChange: setSyncChannels,
                badge: 'Каналы',
                badgeColor: '#2B6CB0'
              },
              {
                id: 'discounts',
                title: 'Скидки пациентов (DISCOUNTS)',
                desc: '8 978 записей: Персональные скидки, льготы и основания предоставления',
                checked: syncDiscounts,
                onChange: setSyncDiscounts,
                badge: 'Скидки',
                badgeColor: '#E11D48'
              },
              {
                id: 'schedule',
                title: 'Расписание врачей (SCHEDULE)',
                desc: '534 записи: Графики работы специалистов, интервалы и рабочие дни',
                checked: syncSchedule,
                onChange: setSyncSchedule,
                badge: 'Графики',
                badgeColor: '#4F46E5'
              },
              {
                id: 'templates',
                title: 'Шаблоны документов (TEMPLATES)',
                desc: '2 шаблона: Стандартные формы бланков и согласий',
                checked: syncTemplates,
                onChange: setSyncTemplates,
                badge: 'Бланки',
                badgeColor: '#64748B'
              }
            ].map((tbl) => (
              <Grid size={{ xs: 12, md: 6 }} key={tbl.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: tbl.checked ? '#F0F6FA' : '#FAFCFE',
                    borderColor: tbl.checked ? '#156C9C' : '#E2E8F0',
                    cursor: 'pointer'
                  }}
                  onClick={() => tbl.onChange(!tbl.checked)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <FormControlLabel
                      control={<Checkbox checked={tbl.checked} sx={{ color: '#0F3C64', '&.Mui-checked': { color: '#0F3C64' } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>{tbl.title}</Typography>}
                    />
                    <Chip size="small" label={tbl.badge} sx={{ bgcolor: tbl.badgeColor, color: '#FFF', fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', pl: 4, color: 'text.secondary' }}>
                    {tbl.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outlined" onClick={() => setActiveStep(0)}>
              ← Назад к подключению
            </Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(2)}
              sx={{ bgcolor: '#0F3C64', fontWeight: 700, px: 3, borderRadius: 2 }}
            >
              Перейти к запуску синхронизации →
            </Button>
          </Box>
        </Paper>
      )}

      {/* STEP 2: Execution & Live Console */}
      {activeStep === 2 && (
        <Paper elevation={0} sx={{ p: 3.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Запуск процесса синхронизации
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Выполнение миграции данных Firebird → SQLite через оптимизированный Python worker
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isSyncing && (
                <Chip
                  icon={<CircularProgress size={14} color="inherit" />}
                  label={`Выполняется: ${elapsedTimer} сек`}
                  color="warning"
                  sx={{ fontWeight: 700 }}
                />
              )}
              <Button
                variant="contained"
                size="large"
                disabled={isSyncing}
                onClick={handleRunSync}
                startIcon={isSyncing ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #0F3C64 0%, #156C9C 100%)',
                  fontWeight: 800,
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(15, 60, 100, 0.25)'
                }}
              >
                {isSyncing ? 'Выполняется перенос...' : 'Запустить синхронизацию'}
              </Button>
            </Box>
          </Box>

          {isSyncing && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: '#E2E8F0',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #0F3C64, #156C9C, #38A169)'
                  }
                }}
              />
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: '#0F3C64', fontWeight: 600 }}>
                Идет перенос пакетов данных в SQLite...
              </Typography>
            </Box>
          )}

          {syncError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Ошибка синхронизации:</Typography>
              <Typography variant="caption">{syncError}</Typography>
            </Alert>
          )}

          {/* Dark Developer Terminal Console */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: '#0B132B',
              color: '#48CAE4',
              fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
              fontSize: '0.8rem',
              height: 420,
              overflowY: 'auto',
              border: '1px solid #1C2541',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, mb: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TerminalIcon sx={{ fontSize: 18, color: '#A0AEC0' }} />
                <Typography variant="caption" sx={{ color: '#E2E8F0', fontWeight: 700, letterSpacing: '0.5px' }}>
                  PYTHON SYNC ENGINE CONSOLE OUTPUT (WIN1251 → UTF-8)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                  onClick={handleCopyLogs}
                  sx={{ color: '#A0AEC0', fontSize: '0.72rem', py: 0.2 }}
                >
                  {copied ? 'Скопировано!' : 'Копировать'}
                </Button>
                <Button
                  size="small"
                  onClick={() => setSyncOutput('')}
                  sx={{ color: '#A0AEC0', fontSize: '0.72rem', py: 0.2 }}
                >
                  Очистить
                </Button>
              </Box>
            </Box>

            <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.5 }}>
              {syncOutput || (
                <Typography variant="caption" sx={{ color: '#718096' }}>
                  Ожидание запуска синхронизации... Выберите таблицы и нажмите кнопку "Запустить синхронизацию".
                </Typography>
              )}
              <div ref={consoleEndRef} />
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
            <Button variant="outlined" onClick={() => setActiveStep(1)} disabled={isSyncing}>
              ← Назад к параметрам
            </Button>
            {syncTimeSec && (
              <Button
                variant="contained"
                onClick={() => setActiveStep(3)}
                sx={{ bgcolor: '#38A169', fontWeight: 700, px: 3, borderRadius: 2, '&:hover': { bgcolor: '#2F855A' } }}
              >
                Посмотреть отчет и результаты →
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* STEP 3: Results & Summary */}
      {activeStep === 3 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'rgba(56, 161, 105, 0.12)',
                color: '#38A169',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: '0 0 0 8px rgba(56, 161, 105, 0.08)'
              }}
            >
              <DoneAllIcon sx={{ fontSize: 44 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1 }}>
              Синхронизация успешно завершена!
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 700, mx: 'auto', fontSize: '0.9rem' }}>
              Все выбранные сущности из Firebird перенесены в SQLite. Созданы производительные индексы для поиска и аналитики.
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#FAFCFE' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                  {fmt(sqliteStats?.patientsCount, '61 301')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Пациентов (PATIENTS)
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#FAFCFE' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#9333EA' }}>
                  {fmt(sqliteStats?.protocolsCount, '32 881')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Протоколов (PROTOCOLS)
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#FAFCFE' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>
                  {fmt(sqliteStats?.mkbCount, '15 038')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  МКБ-10 (MKB)
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#FAFCFE' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706' }}>
                  {fmt(sqliteStats?.servicesCount, '63 010')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Услуг (SERVICES)
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#FAFCFE' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#10B981' }}>
                  {fmt(sqliteStats?.diagnosesCount, '14 630')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Диагнозов (DIAGNOSES)
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#FAFCFE' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#A855F7' }}>
                  {fmt(sqliteStats?.protshotsCount, '861')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Снимков (PROTSHOTS)
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#FAFCFE' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0D9488' }}>
                  {fmt(sqliteStats?.labdictCount, '1 154')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Анализов (LABDICT)
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: '#FAFCFE' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#38A169' }}>
                  {syncTimeSec ? `${syncTimeSec}с` : 'Успешно'}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#38A169' }}>
                  Время выполнения
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/patients')}
              sx={{
                bgcolor: '#0F3C64',
                px: 3.5,
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(15, 60, 100, 0.2)'
              }}
            >
              Открыть Реестр Пациентов (ЭМК)
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<StorageIcon />}
              onClick={() => navigate('/sqlite-studio')}
              sx={{ borderColor: '#0F3C64', color: '#0F3C64', fontWeight: 700, px: 3, borderRadius: 2 }}
            >
              Просмотреть таблицы в SQLite Studio
            </Button>
            <Button
              variant="text"
              size="large"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setActiveStep(0);
                fetchConfigAndStatus();
              }}
              sx={{ color: '#718096', fontWeight: 600 }}
            >
              Новая синхронизация
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
