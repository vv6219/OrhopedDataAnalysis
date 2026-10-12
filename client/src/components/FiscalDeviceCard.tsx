import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Tooltip,
  IconButton,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import UsbIcon from '@mui/icons-material/Usb';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TuneIcon from '@mui/icons-material/Tune';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import SpeedIcon from '@mui/icons-material/Speed';
import { useFiscal } from '../context/FiscalContext';

export interface FiscalDeviceStatus {
  online: boolean;
  isMockMode: boolean;
  mode?: string;
  modeLabel?: string;
  deviceModel: string;
  port: string;
  baudRate: number;
  isShiftOpen: boolean;
  shiftNumber: number;
  lastFiscalDocument?: number;
  fnNumber: string;
  kktRegNumber: string;
  paperStatus?: string;
  paperStatusLabel?: string;
  taxRegime?: string;
  profileName?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  isMockMode: boolean;
  modeLabel: string;
  deviceModel: string;
  port: string;
  baudRate: number;
  latencyMs: number;
  hardwareDetected?: boolean;
  portDeviceName?: string;
  fnNumber?: string;
  kktRegNumber?: string;
  isShiftOpen?: boolean;
  shiftNumber?: number;
  paperStatus?: string;
  paperStatusLabel?: string;
  daemonUrl?: string;
  message: string;
  error?: string;
}

interface FiscalDeviceCardProps {
  onStatusChange?: (status: FiscalDeviceStatus) => void;
  showNavigationButtons?: boolean;
  elevation?: number;
  autoTest?: boolean;
  sx?: any;
}

export default function FiscalDeviceCard({
  onStatusChange,
  showNavigationButtons = true,
  elevation = 2,
  autoTest = false,
  sx
}: FiscalDeviceCardProps) {
  const navigate = useNavigate();
  const {
    fiscalStatus: globalStatus,
    refreshFiscalStatus,
    setMockMode: setGlobalMockMode,
    testConnection: testGlobalConnection
  } = useFiscal();

  const [status, setStatus] = useState<FiscalDeviceStatus | null>(globalStatus || null);
  const [loading, setLoading] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bannerAlert, setBannerAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (globalStatus) {
      setStatus(globalStatus);
      if (onStatusChange) onStatusChange(globalStatus);
    }
  }, [globalStatus]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      await refreshFiscalStatus();
    } catch (err: any) {
      console.error('Error fetching fiscal status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoTest) {
      handleTestConnection();
    }
  }, [autoTest]);

  const handleToggleMode = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIsMockMode = !event.target.checked; // checked means REAL hardware (is_mock_mode = false)
    setSwitchingMode(true);
    setBannerAlert(null);

    try {
      const data = await setGlobalMockMode(newIsMockMode, undefined, 'Администратор (Карточка ККТ)');
      if (data && data.success) {
        setBannerAlert({
          type: 'success',
          message: data.message || `Режим переключен: ${newIsMockMode ? 'Эмулятор ККТ (Mock)' : 'Реальное подключение (COM-порт)'}`
        });
      } else {
        setBannerAlert({
          type: 'error',
          message: data?.error || 'Ошибка при переключении режима ККТ'
        });
      }
    } catch (err: any) {
      setBannerAlert({
        type: 'error',
        message: `Ошибка связи с сервером: ${err.message}`
      });
    } finally {
      setSwitchingMode(false);
    }
  };

  const handleSwitchToMock = async () => {
    setSwitchingMode(true);
    setBannerAlert(null);
    try {
      await setGlobalMockMode(true, undefined, 'Администратор (Карточка ККТ)');
      await handleTestConnection();
    } catch (err: any) {
      console.error('Error switching to mock:', err);
    } finally {
      setSwitchingMode(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setDialogOpen(true);
    setTestResult(null);

    try {
      const data = await testGlobalConnection();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        isMockMode: status?.isMockMode ?? true,
        modeLabel: status?.isMockMode ? 'Эмулятор ККТ (Mock)' : 'Реальное оборудование (COM-порт)',
        deviceModel: status?.deviceModel || 'АТОЛ 91Ф',
        port: status?.port || 'COM3',
        baudRate: status?.baudRate || 115200,
        latencyMs: 0,
        message: `Ошибка сетевого запроса к серверу: ${err.message}`,
        error: err.message
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const isMock = status?.isMockMode ?? true;

  return (
    <>
      <Card
        elevation={elevation}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: isMock ? 'rgba(15, 60, 100, 0.15)' : 'rgba(217, 119, 6, 0.35)',
          background: isMock
            ? 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)'
            : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.25s ease',
          ...(sx || {})
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          {/* Top Banner Alert if any */}
          {bannerAlert && (
            <Alert
              severity={bannerAlert.type}
              onClose={() => setBannerAlert(null)}
              sx={{ mb: 2, borderRadius: 2 }}
            >
              {bannerAlert.message}
            </Alert>
          )}

          {/* Header Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: isMock ? '#0F3C64' : '#D97706',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isMock ? '0 4px 12px rgba(15, 60, 100, 0.25)' : '0 4px 12px rgba(217, 119, 6, 0.25)'
                }}
              >
                <PointOfSaleIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                  Фискализация на ККТ «АТОЛ 91Ф» (54-ФЗ)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Протокол ДТО 10 • ФФД 1.2 / 1.05 • Модель: {status?.deviceModel || 'АТОЛ 91Ф'}
                </Typography>
              </Box>
            </Box>

            {/* Mode Switch & Refresh */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: '#FFFFFF',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2.5,
                  border: '1px solid #CBD5E1',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: isMock ? '#0F3C64' : '#94A3B8',
                    mr: 0.5
                  }}
                >
                  Эмулятор ККТ
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={!isMock}
                      onChange={handleToggleMode}
                      disabled={switchingMode}
                      color="warning"
                      size="medium"
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />

                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: !isMock ? '#D97706' : '#94A3B8',
                    ml: 0.5
                  }}
                >
                  Реальное подключение (COM)
                </Typography>
                {switchingMode && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Box>

              <Tooltip title="Обновить статус ККТ">
                <IconButton onClick={fetchStatus} disabled={loading} size="small" sx={{ bgcolor: '#FFFFFF', border: '1px solid #CBD5E1' }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: isMock ? 'rgba(15, 60, 100, 0.08)' : 'rgba(217, 119, 6, 0.15)' }} />

          {/* Details Row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 1.5,
              mb: 2
            }}
          >
            {/* Status & Mode */}
            <Box sx={{ bgcolor: '#FFFFFF', p: 1.25, borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                Текущий режим
              </Typography>
              <Chip
                icon={isMock ? <CheckCircleIcon /> : <UsbIcon />}
                label={isMock ? 'ЭМУЛЯТОР (MOCK)' : 'РЕАЛЬНЫЙ COM3'}
                color={isMock ? 'primary' : 'warning'}
                size="small"
                sx={{ fontWeight: 800, mt: 0.5, fontSize: '0.72rem' }}
              />
            </Box>

            {/* Port & Baud */}
            <Box sx={{ bgcolor: '#FFFFFF', p: 1.25, borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                Порт и скорость
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', mt: 0.5 }}>
                {status?.port || 'COM3'} • {status?.baudRate || 115200} бод
              </Typography>
            </Box>

            {/* Shift & Document */}
            <Box sx={{ bgcolor: '#FFFFFF', p: 1.25, borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                Кассовая смена
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', mt: 0.5 }}>
                Смена №{status?.shiftNumber || 14} ({status?.isShiftOpen ? '🟢 Открыта' : '⚪ Закрыта'})
              </Typography>
            </Box>

            {/* Paper & FN */}
            <Box sx={{ bgcolor: '#FFFFFF', p: 1.25, borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                Бумага и ФН
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', mt: 0.5 }}>
                Лента: 57мм (OK) • ФН: {status?.fnNumber ? status.fnNumber.slice(-6) : '984210'}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color={isMock ? 'primary' : 'warning'}
                startIcon={testingConnection ? <CircularProgress size={16} color="inherit" /> : <SpeedIcon />}
                onClick={handleTestConnection}
                disabled={testingConnection}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 2.5,
                  py: 0.75,
                  boxShadow: 'none',
                  textTransform: 'none'
                }}
              >
                {testingConnection ? 'Проверка связи...' : 'Проверить связь с «АТОЛ 91Ф»'}
              </Button>
            </Box>

            {showNavigationButtons && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlayCircleFilledWhiteIcon />}
                  onClick={() => navigate('/admin/fiscal-test-wizard')}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: '#CBD5E1',
                    color: '#0F3C64'
                  }}
                >
                  Мастер тестов ККТ
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TuneIcon />}
                  onClick={() => navigate('/admin/fiscal-settings')}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: '#CBD5E1',
                    color: '#0F3C64'
                  }}
                >
                  Параметры ККТ (БД)
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Test Connection Results Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <SpeedIcon sx={{ color: testResult?.success ? '#16A34A' : '#DC2626' }} />
          Результаты проверки связи с ККТ «АТОЛ 91Ф»
        </DialogTitle>

        <DialogContent dividers>
          {testingConnection ? (
            <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={42} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F3C64' }}>
                Отправка команды опроса состояния драйвера ККТ...
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Проверка COM-порта {status?.port || 'COM3'}, отклика фискального накопителя и очереди
              </Typography>
            </Box>
          ) : testResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert
                severity={testResult.success ? 'success' : 'error'}
                icon={testResult.success ? <CheckCircleIcon fontSize="inherit" /> : <ErrorIcon fontSize="inherit" />}
                sx={{ borderRadius: 2 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {testResult.success ? 'Связь с ККТ успешно установлена!' : 'Ошибка подключения к оборудованию!'}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  {testResult.message}
                </Typography>
              </Alert>

              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5 }}>
                  Диагностические параметры оборудования
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, fontSize: '0.82rem' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Режим работы:</Typography>
                    <Typography sx={{ fontWeight: 700, color: testResult.isMockMode ? '#0F3C64' : '#D97706' }}>
                      {testResult.modeLabel}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Время отклика (Latency):</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#16A34A' }}>
                      {testResult.latencyMs} мс
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Модель и порт:</Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      {testResult.deviceModel} ({testResult.port}, {testResult.baudRate} бод)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Состояние ленты:</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#16A34A' }}>
                      {testResult.paperStatusLabel || 'В норме (OK)'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Фискальный накопитель (ФН):</Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      №{testResult.fnNumber || '9960440301984210'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Регистрационный номер ККТ:</Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      РН {testResult.kktRegNumber || '0004928103049182'}
                    </Typography>
                  </Box>

                  {testResult.portDeviceName && (
                    <Box sx={{ gridColumn: '1 / -1', pt: 1, borderTop: '1px dashed #CBD5E1' }}>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>Устройство в системе Windows на порту {testResult.port}:</Typography>
                      <Typography sx={{ fontWeight: 700, color: testResult.success ? '#16A34A' : '#DC2626' }}>
                        {testResult.portDeviceName}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Advanced Technical Diagnostics & Troubleshooting Box */}
              {!testResult.success && (
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#92400E', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorIcon sx={{ fontSize: 18, color: '#D97706' }} />
                    Расширенная техническая диагностика и рекомендации
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: '0.8rem', color: '#451A03' }}>
                    <Box sx={{ p: 1.2, bgcolor: '#FEF3C7', borderRadius: 1.5, border: '1px solid #FCD34D' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#B45309', mb: 0.3 }}>
                        1. Причина сбоя аппаратного контура:
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        В операционной системе Windows к порту <strong>{testResult.port}</strong> привязано устройство <strong>«{testResult.portDeviceName || 'Неизвестно'}»</strong> (служба Bluetooth/Модем), а не физический кассовый аппарат <strong>«{testResult.deviceModel}»</strong>.
                      </Typography>
                    </Box>

                    <Box sx={{ p: 1.2, bgcolor: '#FEF3C7', borderRadius: 1.5, border: '1px solid #FCD34D' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#B45309', mb: 0.3 }}>
                        2. Как подключить физическую ККТ «АТОЛ 91Ф»:
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        • Подключите кассу кабелем USB к компьютеру и включите питание (клавиша [C]).
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        • Переведите аппарат в режим фискального регистратора (ФР) в меню кассы.
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        • Откройте <em>Диспетчер устройств Windows (devmgmt.msc)</em> → <em>Порты (COM и LPT)</em> и проверьте порт драйвера <code>ATOL USB VCP</code>.
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        • Укажите найденный номер порта в настройках профиля оборудования.
                      </Typography>
                    </Box>

                    <Box sx={{ p: 1.2, bgcolor: '#EFF6FF', borderRadius: 1.5, border: '1px solid #BFDBFE' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#1E40AF', mb: 0.3 }}>
                        3. Работа без физической кассы (программная эмуляция):
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#1E3A8A' }}>
                        Для работы визитов и финансовых отчетов без подключенного аппарата нажмите кнопку <strong>«Включить «Эмулятор ККТ»»</strong> ниже. Все операции 54-ФЗ будут симулироваться виртуальным драйвером.
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )}
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {testResult && !testResult.success && !testResult.isMockMode && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleSwitchToMock}
                disabled={switchingMode || testingConnection}
                sx={{ fontWeight: 700 }}
              >
                Включить «Эмулятор ККТ»
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={handleTestConnection}
              disabled={testingConnection}
              startIcon={<RefreshIcon />}
              sx={{ fontWeight: 700 }}
            >
              Повторить тест
            </Button>

            <Button
              variant="contained"
              onClick={() => setDialogOpen(false)}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Закрыть
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}
