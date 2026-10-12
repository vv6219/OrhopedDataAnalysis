import { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  FormControl,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Tooltip,
  Paper,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import UsbIcon from '@mui/icons-material/Usb';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TuneIcon from '@mui/icons-material/Tune';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import SpeedIcon from '@mui/icons-material/Speed';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SensorsIcon from '@mui/icons-material/Sensors';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TerminalIcon from '@mui/icons-material/Terminal';
import LanIcon from '@mui/icons-material/Lan';
import KeyIcon from '@mui/icons-material/Key';
import { usePos, type PosHostTestResult } from '../context/PosContext';

export default function PosDeviceCard({ onRefresh }: { onRefresh?: () => void }) {
  const navigate = useNavigate();
  const { posStatus, profiles, activeProfile, loading, refreshPosStatus, setMockMode, activateProfile, testHost } = usePos();
  const [testingHost, setTestingHost] = useState(false);
  const [hostResult, setHostResult] = useState<PosHostTestResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [togglingMode, setTogglingMode] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const handleToggleMock = async (newMock: boolean) => {
    setTogglingMode(true);
    setToggleError(null);
    try {
      const targetId = activeProfile?.id || posStatus?.activeProfileId;
      await setMockMode(newMock, targetId);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      console.error('Error toggling mock mode:', e);
      setToggleError(e.message || 'Ошибка переключения режима эквайринга');
    } finally {
      setTogglingMode(false);
    }
  };

  const handleSwitchActiveProfile = async (newProfileId: number) => {
    if (!newProfileId || newProfileId === activeProfile?.id) return;
    setTogglingMode(true);
    setToggleError(null);
    try {
      await activateProfile(newProfileId);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      console.error('Error activating profile:', e);
      setToggleError(e.message || 'Ошибка смены активного профиля');
    } finally {
      setTogglingMode(false);
    }
  };

  const handleRunHostTest = async () => {
    setTestingHost(true);
    try {
      const res = await testHost();
      setHostResult(res);
      setDialogOpen(true);
    } catch (err: any) {
      setHostResult({ success: false, error: err.message });
      setDialogOpen(true);
    } finally {
      setTestingHost(false);
    }
  };

  const isMock = posStatus?.isMockMode ?? true;

  return (
    <>
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(15, 60, 100, 0.08)',
          border: '1px solid #E2E8F0',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {toggleError && (
            <Alert severity="error" onClose={() => setToggleError(null)} sx={{ mb: 2, borderRadius: 2 }}>
              {toggleError}
            </Alert>
          )}

          {/* Header Row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  bgcolor: isMock ? '#FEF3C7' : '#EFF6FF',
                  color: isMock ? '#D97706' : '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <CreditCardIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.05rem' }}>
                    Банковский POS-терминал эквайринга
                  </Typography>
                  <Chip
                    size="small"
                    label={posStatus?.bankName || 'АО «АЛЬФА-БАНК»'}
                    sx={{
                      bgcolor: '#EF4444',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      height: 20
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Протокол {posStatus?.driverType || 'Arcus-2'} • TID: <b>{posStatus?.terminalId || 'ALFA_770192'}</b> •{' '}
                  {posStatus?.driverType === 'INPAS' ? (
                    <>
                      Служба: <b>{posStatus?.serviceName || 'DualConnectorService'}</b>{' '}
                      <span style={{ color: posStatus?.serviceStatus?.status === 'Running' ? '#16A34A' : isMock ? '#D97706' : '#DC2626', fontWeight: 700 }}>
                        ({posStatus?.serviceStatus ? (posStatus.serviceStatus.status === 'Running' ? '🟢 Работает' : '🔴 Остановлена') : isMock ? '🟡 Эмуляция' : '⚪ Не найдена'})
                      </span>
                    </>
                  ) : (
                    <>Драйвер: <b>{posStatus?.driverExecutablePath || 'C:\\Arcus2\\pos.exe'}</b></>
                  )}
                </Typography>
              </Box>
            </Box>

            {/* Mode & Profile Switcher Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              {profiles && profiles.length > 1 && (
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <Select
                    size="small"
                    value={activeProfile?.id || posStatus?.activeProfileId || profiles[0]?.id || ''}
                    onChange={(e) => handleSwitchActiveProfile(Number(e.target.value))}
                    disabled={togglingMode || loading}
                    sx={{
                      height: 36,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      bgcolor: '#F8FAFC',
                      borderRadius: 2,
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' }
                    }}
                  >
                    {profiles.map(p => (
                      <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.8rem', fontWeight: p.id === activeProfile?.id ? 800 : 500 }}>
                        {p.driver_type === 'INPAS' ? '🟣 INPAS' : '🔵 Arcus-2'}: {p.profile_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Tooltip title={isMock ? 'Переключить на физический POS-терминал (USB/Ethernet)' : 'Переключить в режим эмуляции (Mock)'}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!isMock}
                      onChange={(e) => handleToggleMock(!e.target.checked)}
                      disabled={togglingMode || loading}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: isMock ? '#D97706' : '#059669' }}>
                      {togglingMode ? 'Переключение...' : isMock ? '🟡 Эмуляция (Mock)' : '🟢 Реальный POS'}
                    </Typography>
                  }
                />
              </Tooltip>

              <Tooltip title="Обновить статус оборудования">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={refreshPosStatus}
                  disabled={loading || togglingMode}
                  sx={{ minWidth: 36, px: 1, height: 36, borderColor: '#CBD5E1', color: '#475569' }}
                >
                  <RefreshIcon sx={{ fontSize: 18 }} />
                </Button>
              </Tooltip>
            </Box>
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* Parameters Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 2,
              mb: 2.5
            }}
          >
            {/* Cell 1: Hardware Status */}
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5, fontWeight: 600 }}>
                Статус связи
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                {posStatus?.status === 'Ready' ? (
                  <CheckCircleIcon sx={{ fontSize: 18, color: '#16A34A' }} />
                ) : (
                  <ErrorIcon sx={{ fontSize: 18, color: '#DC2626' }} />
                )}
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  {posStatus?.status === 'Ready' ? 'Готов к приёму карт' : 'Занят / Ошибка'}
                </Typography>
              </Box>
            </Box>

            {/* Cell 2: Port & Connection */}
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5, fontWeight: 600 }}>
                Интерфейс подключения
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                {posStatus?.driverType === 'INPAS' ? (
                  <LanIcon sx={{ fontSize: 18, color: '#0F3C64' }} />
                ) : (
                  <UsbIcon sx={{ fontSize: 18, color: '#0F3C64' }} />
                )}
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  {posStatus?.driverType === 'INPAS'
                    ? `XML ${posStatus?.ipAddress || '127.0.0.1'}:${posStatus?.ipPort || 8888}`
                    : posStatus?.connectionType === 'COM'
                    ? `${posStatus.port} (${posStatus.baudRate} бод)`
                    : `${posStatus?.ipAddress}:${posStatus?.ipPort}`}
                </Typography>
              </Box>
            </Box>

            {/* Cell 3: SBP QR Support */}
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5, fontWeight: 600 }}>
                Система СБП (QR)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <QrCode2Icon sx={{ fontSize: 18, color: '#D97706' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  {posStatus?.enableSbpQr ? 'Включено на дисплее' : 'Отключено'}
                </Typography>
              </Box>
            </Box>

            {/* Cell 4: PIN Timeout */}
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5, fontWeight: 600 }}>
                Таймаут ввода PIN
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <SpeedIcon sx={{ fontSize: 18, color: '#6366F1' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  {posStatus?.executionTimeoutSeconds || 60} секунд
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Action Buttons Toolbar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleRunHostTest}
              disabled={testingHost || posStatus?.isLocked}
              startIcon={testingHost ? <CircularProgress size={16} color="inherit" /> : <PlayCircleFilledWhiteIcon />}
              sx={{
                bgcolor: '#0F3C64',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
                py: 0.8,
                '&:hover': { bgcolor: '#082540' }
              }}
            >
              {testingHost ? 'Связь с банком...' : 'Тест связи с процессингом (Команда 05)'}
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/admin/pos-test-wizard')}
              startIcon={<PlayCircleFilledWhiteIcon />}
              sx={{
                color: '#0F3C64',
                borderColor: '#0F3C64',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
                py: 0.8
              }}
            >
              Мастер тестирования эквайринга
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/admin/pos-settings')}
              startIcon={<TuneIcon />}
              sx={{
                color: '#475569',
                borderColor: '#CBD5E1',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
                py: 0.8,
                '&:hover': { bgcolor: '#F1F5F9' }
              }}
            >
              Параметры и профили
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Host Diagnostic Dialog with Full Diagnostic Breakdown */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: '#0F3C64',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            pb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SensorsIcon sx={{ color: '#0F3C64', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                Диагностика связи с процессингом (Команда 05 / Host Ping)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Банк-эквайер: АО «АЛЬФА-БАНК» • Протокол: {posStatus?.driverType || 'Arcus-2'}
              </Typography>
            </Box>
          </Box>
          <Chip
            size="small"
            label={hostResult?.success ? 'Связь OK' : 'Сбой связи'}
            sx={{
              bgcolor: hostResult?.success ? '#DCFCE7' : '#FEE2E2',
              color: hostResult?.success ? '#15803D' : '#B91C1C',
              fontWeight: 800
            }}
          />
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Main Status Banner */}
          {hostResult?.success ? (
            <Alert
              severity="success"
              icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
              sx={{ borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#166534' }}>
                Связь с процессингом Альфа-Банка установлена успешно!
              </Typography>
              <Typography variant="body2" sx={{ color: '#15803D', mt: 0.5 }}>
                {hostResult.message}
              </Typography>
            </Alert>
          ) : (
            <Alert
              severity="error"
              icon={<ErrorIcon sx={{ fontSize: 28 }} />}
              sx={{ borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#991B1B' }}>
                Ошибка сеанса связи с банком (Команда 05)
              </Typography>
              <Typography variant="body2" sx={{ color: '#B91C1C', mt: 0.5, wordBreak: 'break-word', fontFamily: 'monospace' }}>
                {hostResult?.error || hostResult?.message || 'Сбой соединения с хостом процессинга'}
              </Typography>
            </Alert>
          )}

          {/* Key Metrics Chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              icon={<TerminalIcon sx={{ fontSize: 16 }} />}
              label={`Код ответа: ${hostResult?.responseCode || (hostResult?.success ? '00' : '99')}`}
              size="small"
              sx={{ bgcolor: '#F1F5F9', fontWeight: 700 }}
            />
            <Chip
              icon={<SpeedIcon sx={{ fontSize: 16 }} />}
              label={`Задержка (RTT): ${hostResult?.rttMs || 0} мс`}
              size="small"
              sx={{ bgcolor: '#F1F5F9', fontWeight: 700 }}
            />
            <Chip
              icon={<CreditCardIcon sx={{ fontSize: 16 }} />}
              label={`Режим: ${hostResult?.isMockMode ?? isMock ? '🟡 Эмуляция (Mock)' : '🟢 Реальный POS'}`}
              size="small"
              sx={{ bgcolor: '#F1F5F9', fontWeight: 700 }}
            />
            <Chip
              icon={<LanIcon sx={{ fontSize: 16 }} />}
              label={`TID: ${hostResult?.terminalId || posStatus?.terminalId || 'ALFA_770192'}`}
              size="small"
              sx={{ bgcolor: '#F1F5F9', fontWeight: 700 }}
            />
            <Chip
              icon={<KeyIcon sx={{ fontSize: 16 }} />}
              label={`MID: ${hostResult?.merchantId || posStatus?.merchantId || 'MERCH_884102'}`}
              size="small"
              sx={{ bgcolor: '#F1F5F9', fontWeight: 700 }}
            />
          </Box>

          {/* Detailed Step-by-Step Diagnostic Chain */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TuneIcon sx={{ fontSize: 18 }} /> Пошаговый протокол диагностики связи:
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#FAFAFA' }}>
              <Stack divider={<Divider />}>
                {(hostResult?.diagnosticSteps && hostResult.diagnosticSteps.length > 0
                  ? hostResult.diagnosticSteps
                  : [
                      {
                        id: 'gateway',
                        name: 'Сетевой шлюз МИС (Node.js API)',
                        status: hostResult?.success ? 'success' : 'error',
                        details: hostResult?.success ? 'Маршрут /api/pos/test-host ответил штатно' : (hostResult?.error || 'Сбой запроса')
                      },
                      {
                        id: 'driver',
                        name: 'Исполняемый модуль драйвера эквайринга',
                        status: hostResult?.success ? 'success' : 'warning',
                        details: isMock ? 'Эмуляция драйвера активна' : 'Проверка драйвера в ОС Windows'
                      },
                      {
                        id: 'host',
                        name: 'Сеанс связи с хостом АО «Альфа-Банк» (Команда 05)',
                        status: hostResult?.success ? 'success' : 'error',
                        details: hostResult?.message || 'Ожидание ответа хоста'
                      }
                    ]
                ).map((step: any, idx: number) => {
                  const isOk = step.status === 'success';
                  const isErr = step.status === 'error';
                  const isWarn = step.status === 'warning';
                  return (
                    <Box key={step.id || idx} sx={{ p: 1.8, display: 'flex', alignItems: 'flex-start', gap: 1.5, bgcolor: '#FFFFFF' }}>
                      <Box sx={{ mt: 0.2 }}>
                        {isOk && <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 20 }} />}
                        {isErr && <ErrorIcon sx={{ color: '#DC2626', fontSize: 20 }} />}
                        {isWarn && <WarningAmberIcon sx={{ color: '#D97706', fontSize: 20 }} />}
                        {!isOk && !isErr && !isWarn && <ScheduleIcon sx={{ color: '#94A3B8', fontSize: 20 }} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.3 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                            {idx + 1}. {step.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={isOk ? 'OK' : isErr ? 'Ошибка' : isWarn ? 'Предупреждение' : 'Пропущено'}
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: isOk ? '#DCFCE7' : isErr ? '#FEE2E2' : isWarn ? '#FEF3C7' : '#F1F5F9',
                              color: isOk ? '#15803D' : isErr ? '#B91C1C' : isWarn ? '#B45309' : '#64748B'
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', wordBreak: 'break-word', fontFamily: 'monospace', bgcolor: '#F8FAFC', p: 0.8, borderRadius: 1 }}>
                          {step.details}
                        </Typography>

                        {/* Direct action button to configure driver path in PosSettings */}
                        {step.id === 'driver' && isErr && (
                          <Box sx={{ mt: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                setDialogOpen(false);
                                navigate('/admin/pos-settings?tab=hardware');
                              }}
                              startIcon={<TuneIcon />}
                              sx={{
                                bgcolor: '#0F3C64',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                textTransform: 'none',
                                borderRadius: 1.5,
                                '&:hover': { bgcolor: '#082540' }
                              }}
                            >
                              Изменить путь к файлу драйвера в «Параметры эквайринга «АО «АЛЬФА-БАНК»»
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          </Box>

          {/* Technical Diagnostics Info Box */}
          <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Технические параметры интеграции
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#334155' }}>
                • Протокол: <b>{posStatus?.driverType || 'Arcus-2'} (Команда 05)</b>
              </Typography>
              <Typography variant="caption" sx={{ color: '#334155' }}>
                • Порт подключения: <b>{hostResult?.port || posStatus?.port || 'COM4'} ({hostResult?.baudRate || posStatus?.baudRate || 115200} бод)</b>
              </Typography>
              <Typography variant="caption" sx={{ color: '#334155' }}>
                • Путь к драйверу: <b>{hostResult?.driverExecutablePath || posStatus?.driverExecutablePath || 'C:\\Arcus2\\pos.exe'}</b>
              </Typography>
              <Typography variant="caption" sx={{ color: '#334155' }}>
                • Время проверки: <b>{new Date(hostResult?.timestamp || Date.now()).toLocaleString('ru-RU')}</b>
              </Typography>
            </Box>
          </Box>

          {/* Actionable Remediation Box on Error */}
          {!hostResult?.success && (
            <Box sx={{ bgcolor: '#FFFBEB', p: 2, borderRadius: 2, border: '1px solid #FDE68A' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                <WarningAmberIcon sx={{ color: '#D97706', fontSize: 24, mt: 0.2 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#92400E', mb: 0.5 }}>
                    Рекомендация по устранению:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#B45309', mb: 1.5 }}>
                    {hostResult?.remediation ||
                      'Если физический POS-терминал не подключен по USB/COM-порту или на рабочей станции отсутствует драйвер Arcus-2, переключите эквайринг в режим эмуляции (Mock) для проверки сквозных сценариев МИС или укажите верный путь к файлу в Параметрах эквайринга.'}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {/* Quick Toggle to Mock Button if physically failing */}
                    {!(hostResult?.isMockMode ?? isMock) && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={async () => {
                          await handleToggleMock(true);
                          await handleRunHostTest();
                        }}
                        disabled={testingHost || togglingMode}
                        startIcon={<RestartAltIcon />}
                        sx={{
                          bgcolor: '#D97706',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: 1.5,
                          '&:hover': { bgcolor: '#B45309' }
                        }}
                      >
                        Переключить в режим эмуляции (Mock) и повторить тест
                      </Button>
                    )}

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setDialogOpen(false);
                        navigate('/admin/pos-settings?tab=hardware');
                      }}
                      startIcon={<TuneIcon />}
                      sx={{
                        color: '#0F3C64',
                        borderColor: '#0F3C64',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 1.5,
                        bgcolor: '#FFFFFF',
                        '&:hover': { bgcolor: '#F8FAFC' }
                      }}
                    >
                      Параметры эквайринга «АО «АЛЬФА-БАНК»»
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, justifyContent: 'space-between', bgcolor: '#F8FAFC' }}>
          <Button
            onClick={handleRunHostTest}
            disabled={testingHost || posStatus?.isLocked}
            variant="outlined"
            startIcon={testingHost ? <CircularProgress size={16} color="inherit" /> : <RestartAltIcon />}
            sx={{
              color: '#0F3C64',
              borderColor: '#CBD5E1',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            {testingHost ? 'Проверка...' : 'Повторить проверку связи'}
          </Button>

          <Button
            onClick={() => setDialogOpen(false)}
            variant="contained"
            sx={{
              bgcolor: '#0F3C64',
              color: '#FFFFFF',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              '&:hover': { bgcolor: '#082540' }
            }}
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
