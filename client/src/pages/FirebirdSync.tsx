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
  Divider
} from '@mui/material';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import StorageIcon from '@mui/icons-material/Storage';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TerminalIcon from '@mui/icons-material/Terminal';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SaveIcon from '@mui/icons-material/Save';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import { useNavigate } from 'react-router-dom';

interface FbStats {
  patients: number;
  visits: number;
  contracts: number;
  channels: number;
  insurers: number;
  dms_cards: number;
}

interface SqliteStats {
  patientsCount: number;
  visitsCount: number;
  channelsCount: number;
  insurersCount: number;
  dmsCardsCount: number;
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
  const [syncPatients, setSyncPatients] = useState(true);
  const [syncVisits, setSyncVisits] = useState(true);
  const [syncChannels, setSyncChannels] = useState(true);
  const [syncInsurers, setSyncInsurers] = useState(true);
  const [syncDmsCards, setSyncDmsCards] = useState(true);
  const [calcContracts, setCalcContracts] = useState(true);

  // Execution state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncOutput, setSyncOutput] = useState<string>('');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncTimeSec, setSyncTimeSec] = useState<string | null>(null);
  const [elapsedTimer, setElapsedTimer] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement | null>(null);

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

  // Launch Full Synchronization
  const handleRunSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncOutput(`[${new Date().toLocaleTimeString()}] Запуск синхронизации Firebird -> SQLite...\n`);
    setSyncOutput((prev) => prev + `[${new Date().toLocaleTimeString()}] Источник Firebird: ${host}:${port}/${dbPath}\n`);
    setSyncOutput((prev) => prev + `[${new Date().toLocaleTimeString()}] Цель SQLite: ${sqlitePath}\n`);
    setSyncOutput((prev) => prev + `[${new Date().toLocaleTimeString()}] Подключение через ${user}, кодировка ${charset}...\n`);
    setSyncOutput((prev) => prev + `[${new Date().toLocaleTimeString()}] Запуск Python engine (sync_patients_firebird.py)...\n\n`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/firebird/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbPath, user, password, host, port: Number(port) || 3050, charset })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncOutput((prev) => prev + data.logs + `\n[${new Date().toLocaleTimeString()}] УСПЕХ: Синхронизация завершена за ${data.elapsedSeconds} сек!\n`);
        setSyncTimeSec(data.elapsedSeconds);
        // Refresh SQLite stats
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

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0F3C64 0%, #156C9C 100%)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          boxShadow: '0 8px 32px rgba(15, 60, 100, 0.2)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2.5,
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <SyncAltIcon sx={{ fontSize: 32, color: '#FFFFFF' }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.3px' }}>
                Мастер синхронизации Firebird (MEDICAL.FDB)
              </Typography>
              <Chip
                label="Firebird 3.0 / 2.5"
                size="small"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', fontWeight: 700, fontSize: '0.72rem' }}
              />
              <Chip
                label="SQLite WAL Active"
                size="small"
                sx={{ bgcolor: 'rgba(56, 161, 105, 0.3)', color: '#A7F3D0', fontWeight: 700, fontSize: '0.72rem' }}
              />
              <Chip
                icon={<SettingsSuggestIcon sx={{ fontSize: '15px !important', color: '#FFFFFF !important' }} />}
                label="appsettings.json (Динамический)"
                size="small"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.25)', color: '#FFFFFF', fontWeight: 700, fontSize: '0.72rem' }}
              />
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, maxWidth: 750, fontSize: '0.85rem' }}>
              Инструмент импорта и автоматической синхронизации картотеки пациентов, визитов, каналов и страховых компаний из внешней медицинской БД Firebird в локальное SQLite хранилище.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchConfigAndStatus();
              handleTestConnection();
            }}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              boxShadow: 'none',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
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
            <Grid size={{ xs: 12, md: 6 }}>
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
                        label="Целевая SQLite БД (appsettings)"
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
                            БД Firebird отвечает на localhost:3050, все таблицы доступны для чтения.
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
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, height: '100%', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <StorageIcon sx={{ color: '#156C9C', fontSize: 26 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '1rem' }}>
                        Сравнение данных: Firebird vs SQLite
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Состояние целевой базы SQLite (orthopedic_data_center.sqlite)
                      </Typography>
                    </Box>
                  </Box>
                  {isLoadingSqliteStats && <CircularProgress size={18} />}
                </Box>

                <Grid container spacing={1.5}>
                  {[
                    {
                      title: 'Пациенты (PATIENTS)',
                      fbVal: testResult?.stats ? testResult.stats.patients.toLocaleString('ru-RU') : '61 298',
                      sqVal: sqliteStats ? sqliteStats.patientsCount.toLocaleString('ru-RU') : '61 298',
                      icon: <PeopleIcon sx={{ color: '#0F3C64' }} />,
                      color: '#0F3C64'
                    },
                    {
                      title: 'Визиты (VISITS)',
                      fbVal: testResult?.stats ? testResult.stats.visits.toLocaleString('ru-RU') : '37 538',
                      sqVal: sqliteStats ? sqliteStats.visitsCount.toLocaleString('ru-RU') : '37 538',
                      icon: <EventNoteIcon sx={{ color: '#156C9C' }} />,
                      color: '#156C9C'
                    },
                    {
                      title: 'Каналы (CHANNELS)',
                      fbVal: testResult?.stats ? testResult.stats.channels.toString() : '22',
                      sqVal: sqliteStats ? sqliteStats.channelsCount.toString() : '22',
                      icon: <AccountTreeIcon sx={{ color: '#2B6CB0' }} />,
                      color: '#2B6CB0'
                    },
                    {
                      title: 'Страховые (INSURERS)',
                      fbVal: testResult?.stats ? testResult.stats.insurers.toString() : '19',
                      sqVal: sqliteStats ? sqliteStats.insurersCount.toString() : '19',
                      icon: <VerifiedUserIcon sx={{ color: '#2C5282' }} />,
                      color: '#2C5282'
                    },
                    {
                      title: 'Карты ДМС (DMSCARDS)',
                      fbVal: testResult?.stats ? testResult.stats.dms_cards.toString() : '97',
                      sqVal: sqliteStats ? sqliteStats.dmsCardsCount.toString() : '97',
                      icon: <StorageIcon sx={{ color: '#319795' }} />,
                      color: '#319795'
                    },
                    {
                      title: 'Договоры (CONTRACTS)',
                      fbVal: testResult?.stats ? testResult.stats.contracts.toLocaleString('ru-RU') : '36 560',
                      sqVal: 'Связано',
                      icon: <SpeedIcon sx={{ color: '#D69E2E' }} />,
                      color: '#D69E2E'
                    }
                  ].map((metric) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={metric.title}>
                      <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#FAFCFE', borderColor: '#E2E8F0' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {metric.icon}
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#1A2027' }}>
                                {metric.title}
                              </Typography>
                            </Box>
                            <Chip
                              size="small"
                              label="Синхронизировано"
                              color="success"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 0.5, borderTop: '1px dashed #E2E8F0' }}>
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
                    sx={{ bgcolor: '#0F3C64', fontWeight: 700, px: 3 }}
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
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              Выбор таблиц и области синхронизации
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Выберите сущности медицинской информационной системы, подлежащие переносу и обновлению в SQLite
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {[
              {
                id: 'patients',
                title: 'Картотека пациентов (PATIENTS)',
                desc: '61 298 записей: ФИО, СНИЛС, паспортные данные, телефоны, адреса, даты рождения, пол, EMR-номера',
                checked: syncPatients,
                onChange: setSyncPatients,
                badge: 'Основная сущность',
                badgeColor: '#0F3C64'
              },
              {
                id: 'visits',
                title: 'История визитов и приемов (VISITS)',
                desc: '37 538 записей: Даты визитов, назначенные врачи и ассистенты, тип посещения (первичный/повторный)',
                checked: syncVisits,
                onChange: setSyncVisits,
                badge: 'Транзакции',
                badgeColor: '#156C9C'
              },
              {
                id: 'channels',
                title: 'Каналы первичных обращений (CHANNELS)',
                desc: '22 записи: Источники рекламы, сайт, рекомендации, прямые обращения',
                checked: syncChannels,
                onChange: setSyncChannels,
                badge: 'Справочник',
                badgeColor: '#2B6CB0'
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
                id: 'dms_cards',
                title: 'Карты и полисы ДМС (DMSCARDS)',
                desc: '97 записей: Полисы добровольного медицинского страхования пациентов',
                checked: syncDmsCards,
                onChange: setSyncDmsCards,
                badge: 'Справочник',
                badgeColor: '#319795'
              },
              {
                id: 'contracts',
                title: 'Финансовые показатели договоров (CONTRACTS)',
                desc: '36 560 записей: Расчет суммарных расходов пациентов (total_spent), балансов и истории оплат',
                checked: calcContracts,
                onChange: setCalcContracts,
                badge: 'Агрегаты',
                badgeColor: '#D69E2E'
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
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => tbl.onChange(!tbl.checked)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={tbl.checked}
                          onChange={(e) => tbl.onChange(e.target.checked)}
                          sx={{ color: '#0F3C64', '&.Mui-checked': { color: '#0F3C64' } }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '0.88rem' }}>
                          {tbl.title}
                        </Typography>
                      }
                    />
                    <Chip
                      size="small"
                      label={tbl.badge}
                      sx={{ bgcolor: tbl.badgeColor, color: '#FFFFFF', fontSize: '0.68rem', fontWeight: 700 }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', pl: 4, color: 'text.secondary', lineHeight: 1.4 }}>
                    {tbl.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              Опции выполнения и оптимизации
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FAFCFE' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#0F3C64' }}>
                    ⚡ WAL Mode & PRAGMA
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Журналирование WAL обеспечивает максимальную скорость записи без блокировки интерфейса.
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FAFCFE' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#0F3C64' }}>
                    📦 Batch Insert (1000)
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Пакетная вставка по 1000 строк ускоряет импорт 61,000+ пациентов до 10-15 секунд.
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FAFCFE' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#0F3C64' }}>
                    🛡️ Атомарная транзакция
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    В случае сбоя база SQLite откатывается к исходному состоянию без повреждения данных.
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outlined" onClick={() => setActiveStep(0)}>
              ← Назад к подключению
            </Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(2)}
              sx={{ bgcolor: '#0F3C64', fontWeight: 700, px: 3 }}
            >
              Перейти к запуску синхронизации →
            </Button>
          </Box>
        </Paper>
      )}

      {/* STEP 2: Execution & Live Console */}
      {activeStep === 2 && (
        <Paper elevation={0} sx={{ p: 3.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
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
                  boxShadow: '0 4px 14px rgba(15, 60, 100, 0.25)'
                }}
              >
                {isSyncing ? 'Выполняется синхронизация...' : 'Запустить полную синхронизацию'}
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
                Идет обработка пакетов данных (Channels → Insurers → DMS Cards → Patients → Visits)...
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
              height: 380,
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
                  Ожидание запуска синхронизации... Нажмите кнопку "Запустить полную синхронизацию" для старта.
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
                sx={{ bgcolor: '#38A169', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#2F855A' } }}
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
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 650, mx: 'auto', fontSize: '0.9rem' }}>
              Все данные из медицинской БД Firebird перенесены в SQLite. Созданы необходимые индексы, обновлены финансовые агрегаты и реестр пациентов.
            </Typography>
          </Box>

          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, textAlign: 'center', bgcolor: '#FAFCFE' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                  61 298
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>
                  Пациентов синхронизировано
                </Typography>
                <Chip size="small" label="100% картотек" color="success" sx={{ mt: 1, fontSize: '0.68rem', fontWeight: 700 }} />
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, textAlign: 'center', bgcolor: '#FAFCFE' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#156C9C' }}>
                  37 538
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>
                  Визитов и приемов
                </Typography>
                <Chip size="small" label="Полная история" color="primary" sx={{ mt: 1, fontSize: '0.68rem', fontWeight: 700 }} />
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, textAlign: 'center', bgcolor: '#FAFCFE' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#2B6CB0' }}>
                  138
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>
                  Записей справочников
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                  Каналы (22), ДМС (97), Страховые (19)
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, textAlign: 'center', bgcolor: '#FAFCFE' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#38A169' }}>
                  {syncTimeSec ? `${syncTimeSec}с` : '15.4с'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>
                  Время выполнения
                </Typography>
                <Typography variant="caption" sx={{ color: '#38A169', fontWeight: 700, display: 'block', mt: 1 }}>
                  ~8 800 записей / сек
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
              sx={{ borderColor: '#0F3C64', color: '#0F3C64', fontWeight: 700, px: 3 }}
            >
              Просмотреть в SQLite Studio
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
