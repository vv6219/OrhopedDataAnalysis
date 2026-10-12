import { useState } from 'react';
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
  Tooltip
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
import { usePos } from '../context/PosContext';
import { API_BASE_URL } from '../config/apiConfig';

export default function PosDeviceCard({ onRefresh }: { onRefresh?: () => void }) {
  const navigate = useNavigate();
  const { posStatus, activeProfile, loading, refreshPosStatus, testHost } = usePos();
  const [testingHost, setTestingHost] = useState(false);
  const [hostResult, setHostResult] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [togglingMode, setTogglingMode] = useState(false);

  const handleToggleMock = async (newMock: boolean) => {
    if (!activeProfile) return;
    setTogglingMode(true);
    try {
      await fetch(`${API_BASE_URL}/api/pos/settings/${activeProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_mock_mode: newMock ? 1 : 0 })
      });
      await refreshPosStatus();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Error toggling mock mode:', e);
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
                  Протокол {posStatus?.driverType || 'Arcus-2'} • TID: <b>{posStatus?.terminalId || 'ALFA_770192'}</b> • Профиль: {posStatus?.profileName || 'Основной'}
                </Typography>
              </Box>
            </Box>

            {/* Mode Switcher */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      {isMock ? '🟡 Эмуляция (Mock)' : '🟢 Реальный POS'}
                    </Typography>
                  }
                />
              </Tooltip>

              <Tooltip title="Обновить статус оборудования">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={refreshPosStatus}
                  disabled={loading}
                  sx={{ minWidth: 36, px: 1, borderColor: '#CBD5E1', color: '#475569' }}
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
                <UsbIcon sx={{ fontSize: 18, color: '#0F3C64' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  {posStatus?.connectionType === 'COM'
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

      {/* Host Diagnostic Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCardIcon /> Результат проверки связи с АО «Альфа-Банк»
        </DialogTitle>
        <DialogContent dividers>
          {hostResult?.success ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="success" icon={<CheckCircleIcon sx={{ fontSize: 24 }} />}>
                <Typography sx={{ fontWeight: 700 }}>
                  Связь с процессингом Альфа-Банка установлена успешно!
                </Typography>
                <Typography variant="body2">
                  {hostResult.message}
                </Typography>
              </Alert>

              <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="body2" sx={{ mb: 0.8 }}>
                  • Код ответа процессинга: <b>{hostResult.responseCode || '00'} (Успех)</b>
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.8 }}>
                  • Задержка отклика (RTT): <b>{hostResult.rttMs || 142} мс</b>
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.8 }}>
                  • Терминал: <b>{posStatus?.terminalId}</b> (Мерчант: {posStatus?.merchantId})
                </Typography>
                <Typography variant="body2">
                  • Время запроса: <b>{new Date(hostResult.timestamp || Date.now()).toLocaleString('ru-RU')}</b>
                </Typography>
              </Box>
            </Box>
          ) : (
            <Alert severity="error" icon={<ErrorIcon sx={{ fontSize: 24 }} />}>
              <Typography sx={{ fontWeight: 700 }}>Ошибка сеанса связи с банком</Typography>
              <Typography variant="body2">{hostResult?.error || 'Таймаут хоста'}</Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="contained" sx={{ bgcolor: '#0F3C64' }}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
