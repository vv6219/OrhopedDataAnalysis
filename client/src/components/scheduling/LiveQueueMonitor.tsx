import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import RefreshIcon from '@mui/icons-material/Refresh';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BadgeIcon from '@mui/icons-material/Badge';
import { useNavigate } from 'react-router-dom';
import type { Appointment, AppointmentStatus } from './SchedulingTypes';

interface LiveQueueMonitorProps {
  appointments: Appointment[];
  onRefresh: () => void;
}

export default function LiveQueueMonitor({ appointments, onRefresh }: LiveQueueMonitorProps) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update live clock every 30 seconds for waiting duration
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter queues
  const waitingList = appointments.filter((a) => a.status === 'waiting');
  const inProgressList = appointments.filter((a) => a.status === 'in_progress');
  const upcomingList = appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed');
  const completedToday = appointments.filter((a) => a.status === 'completed');

  // Compute wait duration in minutes from arrival_time ('HH:MM:SS')
  const getElapsedWaitMinutes = (arrivalTimeStr?: string | null) => {
    if (!arrivalTimeStr) return null;
    const [h, m] = arrivalTimeStr.split(':').map(Number);
    const arrivalDate = new Date();
    arrivalDate.setHours(h, m, 0, 0);

    const diffMs = currentTime.getTime() - arrivalDate.getTime();
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / (1000 * 60));
  };

  const handleStatusChange = async (appId: number, newStatus: AppointmentStatus) => {
    setActionLoadingId(appId);
    setErrorMsg(null);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/scheduling/appointments/${appId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        setErrorMsg(data.error || 'Ошибка обновления статуса');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Сетевая ошибка';
      setErrorMsg(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckoutTransfer = (app: Appointment) => {
    sessionStorage.setItem(
      'checkout_prefill',
      JSON.stringify({
        patientId: app.patient_id,
        patientName: app.patient_name,
        operationId: app.operation_id,
        operationName: app.operation_name,
        appointmentId: app.id
      })
    );
    navigate('/checkout');
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
            Электронная очередь и монитор холла ожидания
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Фиксация времени явки пациентов, живой хронометраж ожидания и вызов в кабинеты
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          size="small"
          sx={{ textTransform: 'none' }}
        >
          Обновить статус очереди
        </Button>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* 3 Main Monitor Columns */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
          gap: 2.5
        }}
      >
        {/* Column 1: Ожидают в холле */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '14px',
            border: '2px solid #FDE68A',
            bgcolor: '#FFFBEB'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HourglassTopIcon sx={{ color: '#D97706' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#92400E' }}>
                В холле клиники
              </Typography>
            </Box>
            <Chip
              label={`${waitingList.length} чел.`}
              color="warning"
              size="small"
              sx={{ fontWeight: 800, fontSize: '0.8rem' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {waitingList.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', py: 3, fontStyle: 'italic' }}>
                В холле ожидания пациентов нет
              </Typography>
            ) : (
              waitingList.map((app) => {
                const waitMins = getElapsedWaitMinutes(app.arrival_time);
                return (
                  <Paper
                    key={app.id}
                    elevation={2}
                    sx={{
                      p: 2,
                      borderRadius: '10px',
                      bgcolor: '#FFFFFF',
                      borderLeft: '4px solid #D97706',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                          {app.patient_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Карта №{app.patient_mednum} · {app.doctor_name}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={waitMins !== null ? `Ждёт: ${waitMins} мин` : 'Только вошёл'}
                        color={waitMins && waitMins > 15 ? 'error' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                      Назначено: <strong>{app.start_time}</strong> · {app.room_number}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Button
                        variant="contained"
                        color="info"
                        size="small"
                        fullWidth
                        startIcon={
                          actionLoadingId === app.id ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <PlayArrowIcon />
                          )
                        }
                        disabled={actionLoadingId === app.id}
                        onClick={() => handleStatusChange(app.id, 'in_progress')}
                        sx={{ fontWeight: 700, textTransform: 'none' }}
                      >
                        Пригласить в кабинет
                      </Button>
                    </Box>
                  </Paper>
                );
              })
            )}
          </Box>
        </Paper>

        {/* Column 2: Сейчас на приёме */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '14px',
            border: '2px solid #BAE6FD',
            bgcolor: '#F0F9FF'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MeetingRoomIcon sx={{ color: '#0284C7' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0369A1' }}>
                Сейчас на приёме
              </Typography>
            </Box>
            <Chip
              label={`${inProgressList.length} чел.`}
              color="info"
              size="small"
              sx={{ fontWeight: 800, fontSize: '0.8rem' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {inProgressList.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', py: 3, fontStyle: 'italic' }}>
                В кабинетах приём не ведётся
              </Typography>
            ) : (
              inProgressList.map((app) => (
                <Paper
                  key={app.id}
                  elevation={2}
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: '#FFFFFF',
                    borderLeft: '4px solid #0284C7',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        {app.patient_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Врач: {app.doctor_name}
                      </Typography>
                    </Box>
                    <Chip label={app.room_number} color="primary" size="small" sx={{ fontWeight: 700 }} />
                  </Box>

                  <Typography variant="caption" sx={{ color: '#334155' }}>
                    Услуга: <strong>{app.operation_name}</strong>
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      fullWidth
                      startIcon={
                        actionLoadingId === app.id ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <CheckCircleIcon />
                        )
                      }
                      disabled={actionLoadingId === app.id}
                      onClick={() => handleStatusChange(app.id, 'completed')}
                      sx={{ fontWeight: 700, textTransform: 'none' }}
                    >
                      Завершить приём
                    </Button>
                    <Tooltip title="Оформить списание материалов и чек на кассе" arrow>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleCheckoutTransfer(app)}
                        sx={{ minWidth: 42, px: 1 }}
                      >
                        <PointOfSaleIcon sx={{ fontSize: 18 }} />
                      </Button>
                    </Tooltip>
                  </Box>
                </Paper>
              ))
            )}
          </Box>
        </Paper>

        {/* Column 3: Ожидаемые сегодня (явка не зафиксирована) */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '14px',
            border: '2px solid #E2E8F0',
            bgcolor: '#F8FAFC'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HowToRegIcon sx={{ color: '#475569' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155' }}>
                Ожидаются сегодня
              </Typography>
            </Box>
            <Chip label={`${upcomingList.length} чел.`} size="small" sx={{ fontWeight: 700 }} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 380, overflowY: 'auto' }}>
            {upcomingList.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', py: 3, fontStyle: 'italic' }}>
                Все пациенты на сегодня уже прибыли или обслужены
              </Typography>
            ) : (
              upcomingList.map((app) => (
                <Paper
                  key={app.id}
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: '10px',
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                      {app.patient_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {app.start_time} · {app.doctor_name}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<HourglassTopIcon />}
                    onClick={() => handleStatusChange(app.id, 'waiting')}
                    disabled={actionLoadingId === app.id}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                  >
                    Прибыл в клинику
                  </Button>
                </Paper>
              ))
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
