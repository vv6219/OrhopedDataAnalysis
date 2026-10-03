import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Alert
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CancelIcon from '@mui/icons-material/Cancel';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import { useNavigate } from 'react-router-dom';
import type { Appointment, Doctor, AppointmentStatus } from './SchedulingTypes';

interface TimetableGridProps {
  date: string;
  appointments: Appointment[];
  doctors: Doctor[];
  onRefresh: () => void;
  onOpenWizard: (doctorId: number, startTime: string) => void;
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string; border: string }> = {
  scheduled: { label: 'Запланирован', color: '#475569', bg: '#F1F5F9', border: '#CBD5E1' },
  confirmed: { label: 'Подтверждён', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  waiting: { label: 'Ожидает в холле', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  in_progress: { label: 'На приёме', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
  completed: { label: 'Завершён', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  cancelled: { label: 'Отменён', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  no_show: { label: 'Неявка', color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' }
};

export default function TimetableGrid({
  date: _date,
  appointments,
  doctors,
  onRefresh,
  onOpenWizard
}: TimetableGridProps) {
  const navigate = useNavigate();
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Clinic working hours in 30-min display steps (from 09:00 to 19:00)
  const timeHeaders: string[] = [];
  for (let h = 9; h < 19; h++) {
    timeHeaders.push(`${String(h).padStart(2, '0')}:00`);
    timeHeaders.push(`${String(h).padStart(2, '0')}:30`);
  }

  // Handle status transition
  const handleUpdateStatus = async (appId: number, newStatus: AppointmentStatus) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/scheduling/appointments/${appId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
        setSelectedApp(null);
      } else {
        setActionError(data.error || 'Ошибка смены статуса');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Сетевая ошибка';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // 1-Click transfer to Checkout
  const handleCheckoutTransfer = (app: Appointment) => {
    // Store quick referral in sessionStorage for CheckoutWizard
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
      {/* Timetable Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '70px repeat(2, 1fr)', md: '90px repeat(2, 1fr)' },
          gap: 1.5,
          mb: 1
        }}
      >
        <Paper
          sx={{
            p: 1.5,
            bgcolor: '#0F3C64',
            color: '#FFFFFF',
            borderRadius: '10px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 20 }} />
        </Paper>

        {doctors.map((doc) => (
          <Paper
            key={doc.id}
            sx={{
              p: 1.5,
              bgcolor: doc.id === 2 ? '#0F3C64' : '#156C9C',
              color: '#FFFFFF',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {doc.full_name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                {doc.roomNumber}
              </Typography>
            </Box>
            <Chip
              label={`${appointments.filter((a) => a.doctor_id === doc.id && a.status !== 'cancelled').length} зап.`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', fontWeight: 700 }}
            />
          </Paper>
        ))}
      </Box>

      {/* Timetable Rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {timeHeaders.map((time) => {
          return (
            <Box
              key={time}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '70px repeat(2, 1fr)', md: '90px repeat(2, 1fr)' },
                gap: 1.5,
                alignItems: 'stretch'
              }}
            >
              {/* Time Column */}
              <Box
                sx={{
                  bgcolor: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: '#475569'
                }}
              >
                {time}
              </Box>

              {/* Doctor Columns */}
              {doctors.map((doc) => {
                const docApps = appointments.filter(
                  (a) => a.doctor_id === doc.id && a.start_time <= time && a.end_time > time
                );
                const currentApp = docApps[0];

                if (currentApp) {
                  // Only render the card at the exact start time slot to avoid duplicating
                  const isStartTime = currentApp.start_time === time;
                  if (!isStartTime) {
                    return (
                      <Box
                        key={doc.id}
                        sx={{
                          bgcolor: 'rgba(15, 60, 100, 0.04)',
                          borderLeft: '4px solid #0F3C64',
                          borderRight: '1px dashed #CBD5E1',
                          borderRadius: '4px',
                          minHeight: 50,
                          display: 'flex',
                          alignItems: 'center',
                          px: 1.5
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                          ↳ продолжение приёма ({currentApp.patient_name})
                        </Typography>
                      </Box>
                    );
                  }

                  const cfg = STATUS_CONFIG[currentApp.status] || STATUS_CONFIG.scheduled;

                  return (
                    <Paper
                      key={doc.id}
                      onClick={() => setSelectedApp(currentApp)}
                      elevation={1}
                      sx={{
                        p: 1.5,
                        cursor: 'pointer',
                        borderRadius: '10px',
                        border: `1.5px solid ${cfg.border}`,
                        bgcolor: cfg.bg,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 0.5,
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(15, 60, 100, 0.12)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                            {currentApp.patient_name}
                          </Typography>
                          {currentApp.patient_age && (
                            <Chip
                              label={`${currentApp.patient_age} л.`}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                          {currentApp.urgency_level === 'urgent' && (
                            <Chip
                              label="ОСТРАЯ БОЛЬ"
                              size="small"
                              color="error"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                            />
                          )}
                        </Box>
                        <Chip
                          label={cfg.label}
                          size="small"
                          sx={{
                            bgcolor: cfg.color,
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 22
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#334155',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '75%'
                          }}
                        >
                          {currentApp.operation_name || 'Консультативный приём ортопеда'}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                          {currentApp.start_time} - {currentApp.end_time} ({currentApp.duration_minutes}м)
                        </Typography>
                      </Box>
                    </Paper>
                  );
                }

                // Empty slot -> Booking button
                return (
                  <Box
                    key={doc.id}
                    onClick={() => onOpenWizard(doc.id, time)}
                    sx={{
                      minHeight: 50,
                      borderRadius: '8px',
                      border: '1px dashed #CBD5E1',
                      bgcolor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: '#F0F9FF',
                        borderColor: '#0F3C64'
                      }
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                      Свободное окно приёма
                    </Typography>
                    <Tooltip title={`Записать пациента на ${time} к ${doc.full_name}`} arrow>
                      <IconButton size="small" sx={{ color: '#0F3C64', p: 0.5 }}>
                        <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>

      {/* Appointment Detail Modal */}
      {selectedApp && (
        <Dialog
          open={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          maxWidth="sm"
          fullWidth
          disableRestoreFocus
          slotProps={{
            paper: {
              sx: { borderRadius: '16px', overflow: 'hidden' }
            }
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: '#0F3C64',
              color: '#FFFFFF',
              py: 2,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedicalServicesIcon sx={{ color: '#38BDF8' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Карточка приёма #{selectedApp.id}
              </Typography>
            </Box>
            <IconButton onClick={() => setSelectedApp(null)} sx={{ color: '#FFFFFF' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            {actionError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
                {actionError}
              </Alert>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                {selectedApp.patient_name}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                <Chip label={`ЭМК № ${selectedApp.patient_mednum}`} size="small" color="primary" />
                <Chip label={`Тел: ${selectedApp.patient_phone || '—'}`} size="small" variant="outlined" />
                <Chip
                  label={selectedApp.patient_dms ? `ДМС: ${selectedApp.patient_dms}` : 'Физическое лицо'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: '0.9rem', color: '#334155' }}>
              <Typography variant="body2">
                <strong>Врач:</strong> {selectedApp.doctor_name} ({selectedApp.room_number})
              </Typography>
              <Typography variant="body2">
                <strong>Время приёма:</strong> {selectedApp.appointment_date} с {selectedApp.start_time} до{' '}
                {selectedApp.end_time} ({selectedApp.duration_minutes} мин)
              </Typography>
              <Typography variant="body2">
                <strong>Услуга:</strong> {selectedApp.operation_name} (
                {selectedApp.operation_price ? `${selectedApp.operation_price.toLocaleString('ru-RU')} ₽` : 'Прейскурант'}
                )
              </Typography>
              {selectedApp.notes && (
                <Typography variant="body2" sx={{ fontStyle: 'italic', bgcolor: '#F8FAFC', p: 1, borderRadius: '6px' }}>
                  <strong>Заметки:</strong> {selectedApp.notes}
                </Typography>
              )}
              {selectedApp.arrival_time && (
                <Typography variant="body2" sx={{ color: '#D97706' }}>
                  <strong>Время прибытия в холл:</strong> {selectedApp.arrival_time}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              Управление статусом визита:
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant={selectedApp.status === 'waiting' ? 'contained' : 'outlined'}
                color="warning"
                size="small"
                startIcon={<HourglassTopIcon />}
                onClick={() => handleUpdateStatus(selectedApp.id, 'waiting')}
                disabled={actionLoading}
              >
                Пациент в холле
              </Button>
              <Button
                variant={selectedApp.status === 'in_progress' ? 'contained' : 'outlined'}
                color="info"
                size="small"
                startIcon={<PlayArrowIcon />}
                onClick={() => handleUpdateStatus(selectedApp.id, 'in_progress')}
                disabled={actionLoading}
              >
                Вызвать в кабинет
              </Button>
              <Button
                variant={selectedApp.status === 'completed' ? 'contained' : 'outlined'}
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleUpdateStatus(selectedApp.id, 'completed')}
                disabled={actionLoading}
              >
                Приём завершён
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => handleUpdateStatus(selectedApp.id, 'cancelled')}
                disabled={actionLoading}
              >
                Отменить
              </Button>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PointOfSaleIcon />}
              onClick={() => handleCheckoutTransfer(selectedApp)}
              sx={{ bgcolor: '#0F3C64', fontWeight: 700 }}
            >
              Перейти к оплате (Checkout)
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={() => setSelectedApp(null)}>Закрыть</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
