import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Tooltip
} from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SpeedIcon from '@mui/icons-material/Speed';
import SyncIcon from '@mui/icons-material/Sync';
import ScienceIcon from '@mui/icons-material/Science';
import PublicIcon from '@mui/icons-material/Public';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LayersIcon from '@mui/icons-material/Layers';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/apiConfig';

export interface MedflexLiveStatus {
  success: boolean;
  mode: 'production' | 'sandbox' | 'disabled';
  sandboxDirection: 'dual' | 'request_only' | 'response_only';
  enabled: boolean;
  circuitState: 'healthy' | 'degraded' | 'offline' | 'recovering';
  isOnline: boolean;
  lastLatencyMs: number;
  lastPingAt: string;
  lastError?: string | null;
  queueStats: {
    total: number;
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  };
  openIncidentsCount: number;
  simulatedFailureActive: boolean;
}

interface MedflexLiveStatusBarProps {
  onRefreshParent?: () => void;
  compact?: boolean;
}

export default function MedflexLiveStatusBar({ onRefreshParent, compact = false }: MedflexLiveStatusBarProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<MedflexLiveStatus | null>(null);
  const [pinging, setPinging] = useState(false);
  const [lastCheckSec, setLastCheckSec] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/live-status`);
      const data = await res.json();
      if (data.success) {
        setStatus(data);
        setLastCheckSec(0);
      }
    } catch (err) {
      console.warn('Failed to fetch MedFlex live status:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // 30s poll
    const secTimer = setInterval(() => setLastCheckSec((prev) => prev + 1), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(secTimer);
    };
  }, [fetchStatus]);

  const handleTestPing = async () => {
    try {
      setPinging(true);
      const res = await fetch(`${API_BASE_URL}/api/medflex/admin/ping-test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
        if (onRefreshParent) onRefreshParent();
      }
    } catch (err) {
      console.error('Ping test error:', err);
    } finally {
      setPinging(false);
    }
  };

  if (!status) {
    return null;
  }

  // Ping latency color
  const latency = status.lastLatencyMs || 0;
  let latencyColor = '#10b981'; // green
  if (latency > 300 || !status.isOnline) {
    latencyColor = '#ef4444'; // red
  } else if (latency > 100) {
    latencyColor = '#f59e0b'; // yellow/amber
  }

  // Mode badge label & color
  let modeLabel = 'БОЕВОЙ РЕЖИМ';
  let modeBg = '#2563eb';
  let modeIcon = <PublicIcon sx={{ fontSize: 16 }} />;

  if (status.mode === 'sandbox') {
    if (status.sandboxDirection === 'dual') {
      modeLabel = 'ПЕСОЧНИЦА: DUAL';
      modeBg = '#7c3aed'; // Purple
    } else if (status.sandboxDirection === 'request_only') {
      modeLabel = 'ПЕСОЧНИЦА: ИСХОДЯЩИЕ';
      modeBg = '#ea580c'; // Orange
    } else if (status.sandboxDirection === 'response_only') {
      modeLabel = 'ПЕСОЧНИЦА: ВХОДЯЩИЕ';
      modeBg = '#d97706'; // Amber
    }
    modeIcon = <ScienceIcon sx={{ fontSize: 16 }} />;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 1 : 1.5,
        mb: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: status.isOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.35)',
        background: status.isOnline
          ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.04) 0%, rgba(99, 102, 241, 0.03) 100%)'
          : 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5
      }}
    >
      {/* Left: Mode & Status badges */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.2 }}>
        {/* Mode Badge */}
        <Tooltip title={`Режим работы интеграции: ${status.mode} (${status.sandboxDirection})`}>
          <Chip
            size="small"
            icon={modeIcon}
            label={modeLabel}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              color: '#fff',
              bgcolor: modeBg,
              '& .MuiChip-icon': { color: '#fff' }
            }}
          />
        </Tooltip>

        {/* Circuit Breaker Status */}
        <Tooltip
          title={
            status.isOnline
              ? 'Канал связи с MedFlex стабилен, вебхуки и слоты синхронизируются штатно'
              : `Связь с MedFlex нарушена (${status.lastError || 'Автономный режим'}). Операции буферизуются в очередь.`
          }
        >
          <Chip
            size="small"
            icon={status.isOnline ? <WifiIcon sx={{ fontSize: 16 }} /> : <WifiOffIcon sx={{ fontSize: 16 }} />}
            label={
              status.circuitState === 'healthy'
                ? 'Связь активна'
                : status.circuitState === 'degraded'
                ? 'Деградация канала'
                : status.circuitState === 'recovering'
                ? 'Восстановление'
                : 'Сбой связи (Offline)'
            }
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              color: status.isOnline ? '#065f46' : '#991b1b',
              bgcolor: status.isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: '1px solid',
              borderColor: status.isOnline ? '#10b981' : '#ef4444',
              '& .MuiChip-icon': { color: status.isOnline ? '#10b981' : '#ef4444' }
            }}
          />
        </Tooltip>

        {/* Real Ping Telemetry */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1, bgcolor: 'background.paper', border: '1px solid rgba(0,0,0,0.06)' }}>
          <SpeedIcon sx={{ fontSize: 17, color: latencyColor }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: latencyColor }}>
            Пинг: {status.isOnline ? `${latency} мс` : 'Таймаут'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 0.5, fontSize: '0.7rem' }}>
            ({lastCheckSec}с назад)
          </Typography>
        </Box>

        {/* Offline Queue Badge */}
        {status.queueStats.pending > 0 && (
          <Tooltip title={`В оффлайн-очереди ${status.queueStats.pending} операций, ожидающих отправки в MedFlex`}>
            <Chip
              size="small"
              icon={<LayersIcon sx={{ fontSize: 15 }} />}
              label={`В очереди: ${status.queueStats.pending}`}
              sx={{
                fontWeight: 700,
                fontSize: '0.72rem',
                color: '#fff',
                bgcolor: '#f59e0b',
                animation: 'pulse 2s infinite',
                '& .MuiChip-icon': { color: '#fff' }
              }}
            />
          </Tooltip>
        )}

        {/* Open Incidents Badge */}
        {status.openIncidentsCount > 0 && (
          <Tooltip title={`${status.openIncidentsCount} инцидентов синхронизации требуют внимания`}>
            <Chip
              size="small"
              icon={<WarningAmberIcon sx={{ fontSize: 15 }} />}
              label={`Инцидентов: ${status.openIncidentsCount}`}
              sx={{
                fontWeight: 700,
                fontSize: '0.72rem',
                color: '#fff',
                bgcolor: '#ef4444',
                '& .MuiChip-icon': { color: '#fff' }
              }}
            />
          </Tooltip>
        )}
      </Box>

      {/* Right: Quick Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={handleTestPing}
          disabled={pinging}
          startIcon={pinging ? <CircularProgress size={14} color="inherit" /> : <SyncIcon sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            py: 0.4,
            px: 1.2
          }}
        >
          {pinging ? 'Замер...' : 'Тест пинга'}
        </Button>

        <Button
          size="small"
          variant="contained"
          onClick={() => navigate('/analytics/medflex-sync')}
          endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
          sx={{
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            py: 0.4,
            px: 1.2,
            bgcolor: '#4f46e5',
            '&:hover': { bgcolor: '#4338ca' }
          }}
        >
          Центр MedFlex
        </Button>
      </Box>
    </Paper>
  );
}
