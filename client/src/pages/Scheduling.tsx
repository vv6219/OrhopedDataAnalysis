import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  IconButton,
  TextField,
  CircularProgress
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import TelegramIcon from '@mui/icons-material/Telegram';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import TimetableGrid from '../components/scheduling/TimetableGrid';
import LiveQueueMonitor from '../components/scheduling/LiveQueueMonitor';
import NotificationCenter from '../components/scheduling/NotificationCenter';
import SchedulingReports from '../components/scheduling/SchedulingReports';
import SchedulingWizard from '../components/scheduling/SchedulingWizard';
import type { Appointment, Doctor, SchedulingSummary } from '../components/scheduling/SchedulingTypes';

export default function Scheduling() {
  const [activeTab, setActiveTab] = useState(0);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [summary, setSummary] = useState<SchedulingSummary>({
    total: 0,
    scheduled: 0,
    confirmed: 0,
    waiting: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    occupancyRate: 0
  });
  const [loading, setLoading] = useState(false);

  // Wizard modal state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDoctorId, setWizardDoctorId] = useState<number | undefined>(undefined);
  const [wizardStartTime, setWizardStartTime] = useState<string | undefined>(undefined);

  // Fetch doctors once
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/scheduling/doctors`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.doctors) {
          setDoctors(data.doctors);
        }
      })
      .catch((err) => console.error('Error fetching doctors:', err));
  }, []);

  // Fetch data for date
  const loadData = useCallback(() => {
    setLoading(true);
    const fetchCalendar = fetch(`${API_BASE_URL}/api/scheduling/calendar?date=${currentDate}`)
      .then((r) => r.json());
    const fetchSummary = fetch(`${API_BASE_URL}/api/scheduling/summary?date=${currentDate}`)
      .then((r) => r.json());

    Promise.all([fetchCalendar, fetchSummary])
      .then(([calData, sumData]) => {
        if (calData.success && calData.appointments) {
          setAppointments(calData.appointments);
        }
        if (sumData.success && sumData.summary) {
          setSummary(sumData.summary);
        }
      })
      .catch((err) => console.error('Error loading scheduling data:', err))
      .finally(() => setLoading(false));
  }, [currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Date step helper
  const handleShiftDate = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d.toISOString().slice(0, 10));
  };

  const handleOpenWizardWithSlot = (doctorId: number, startTime: string) => {
    setWizardDoctorId(doctorId);
    setWizardStartTime(startTime);
    setWizardOpen(true);
  };

  const handleWizardSuccess = () => {
    setWizardOpen(false);
    loadData();
  };

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* Top Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CalendarMonthIcon sx={{ fontSize: 32, color: '#0F3C64' }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px' }}>
              Расписание и приём пациентов
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
            Центр Ортопедии и Травматологии Добрушкина (г. Сочи) · Координация расписания, монитор холла и
            уведомления
          </Typography>
        </Box>

        {/* Date Selector & Action Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Paper
            variant="outlined"
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 0.5,
              borderRadius: '10px',
              bgcolor: '#FFFFFF',
              borderColor: '#CBD5E1'
            }}
          >
            <Tooltip title="Предыдущий день" arrow>
              <IconButton size="small" onClick={() => handleShiftDate(-1)}>
                <ChevronLeftIcon />
              </IconButton>
            </Tooltip>

            <TextField
              type="date"
              size="small"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              sx={{
                width: 145,
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '& .MuiInputBase-input': { fontWeight: 700, fontSize: '0.875rem', py: 0.5 }
              }}
            />

            <Tooltip title="Следующий день" arrow>
              <IconButton size="small" onClick={() => handleShiftDate(1)}>
                <ChevronRightIcon />
              </IconButton>
            </Tooltip>
          </Paper>

          <Button
            variant="outlined"
            size="small"
            onClick={() => setCurrentDate(new Date().toISOString().slice(0, 10))}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Сегодня
          </Button>

          <Tooltip title="Обновить расписание" arrow>
            <IconButton onClick={loadData} disabled={loading} sx={{ bgcolor: '#FFFFFF', border: '1px solid #CBD5E1' }}>
              {loading ? <CircularProgress size={18} /> : <RefreshIcon sx={{ color: '#0F3C64' }} />}
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={() => {
              setWizardDoctorId(undefined);
              setWizardStartTime(undefined);
              setWizardOpen(true);
            }}
            sx={{
              bgcolor: '#0F3C64',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(15, 60, 100, 0.2)',
              '&:hover': { bgcolor: '#082540' }
            }}
          >
            + Записать пациента
          </Button>
        </Box>
      </Box>

      {/* KPI Stat Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
          gap: 2,
          mb: 3
        }}
      >
        {/* Card 1: Total */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
              ВСЕГО ЗАПИСЕЙ
            </Typography>
            <CalendarMonthIcon sx={{ fontSize: 20, color: '#0F3C64' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64' }}>
            {summary.total}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Подтверждено: {summary.confirmed} чел.
          </Typography>
        </Paper>

        {/* Card 2: Waiting */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1.5px solid #FDE68A',
            bgcolor: '#FFFBEB',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400E' }}>
              В ХОЛЛЕ ОЖИДАНИЯ
            </Typography>
            <HourglassTopIcon sx={{ fontSize: 20, color: '#D97706' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#D97706' }}>
            {summary.waiting}
          </Typography>
          <Typography variant="caption" sx={{ color: '#92400E' }}>
            Пациенты зафиксировали явку
          </Typography>
        </Paper>

        {/* Card 3: In Progress */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1.5px solid #BAE6FD',
            bgcolor: '#F0F9FF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369A1' }}>
              СЕЙЧАС НА ПРИЁМЕ
            </Typography>
            <MeetingRoomIcon sx={{ fontSize: 20, color: '#0284C7' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0284C7' }}>
            {summary.in_progress}
          </Typography>
          <Typography variant="caption" sx={{ color: '#0369A1' }}>
            В кабинетах №1 и №2
          </Typography>
        </Paper>

        {/* Card 4: Completed */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1.5px solid #BBF7D0',
            bgcolor: '#F0FDF4',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534' }}>
              ОБСЛУЖЕНО СЕГОДНЯ
            </Typography>
            <CheckCircleIcon sx={{ fontSize: 20, color: '#16A34A' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#16A34A' }}>
            {summary.completed}
          </Typography>
          <Typography variant="caption" sx={{ color: '#166534' }}>
            Внесено в историю ЭМК
          </Typography>
        </Paper>

        {/* Card 5: Occupancy */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
              УТИЛИЗАЦИЯ ВРАЧЕЙ
            </Typography>
            <TrendingUpIcon sx={{ fontSize: 20, color: '#0F3C64' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64' }}>
            {summary.occupancyRate}%
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={summary.occupancyRate}
              sx={{ height: 6, borderRadius: 3, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: '#0F3C64' } }}
            />
          </Box>
        </Paper>
      </Box>

      {/* Navigation Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          p: 0.5,
          mb: 3
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              minHeight: 48,
              borderRadius: '10px',
              mx: 0.5,
              color: '#64748B',
              '&.Mui-selected': {
                color: '#0F3C64',
                bgcolor: 'rgba(15, 60, 100, 0.08)'
              }
            },
            '& .MuiTabs-indicator': {
              display: 'none'
            }
          }}
        >
          <Tab
            icon={<CalendarMonthIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Шахматка кабинетов и врачей"
          />
          <Tab
            icon={<HourglassTopIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={`Монитор живого приёма (${summary.waiting} в холле)`}
          />
          <Tab
            icon={<TelegramIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Центр уведомлений (Telegram / MAX / SMS)"
          />
          <Tab
            icon={<AssessmentIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Отчёты и печать (Талоны и ведомости)"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      {activeTab === 0 && (
        <TimetableGrid
          date={currentDate}
          appointments={appointments}
          doctors={doctors}
          onRefresh={loadData}
          onOpenWizard={handleOpenWizardWithSlot}
        />
      )}

      {activeTab === 1 && (
        <LiveQueueMonitor appointments={appointments} onRefresh={loadData} />
      )}

      {activeTab === 2 && (
        <NotificationCenter onRefreshParent={loadData} />
      )}

      {activeTab === 3 && (
        <SchedulingReports appointments={appointments} doctors={doctors} currentDate={currentDate} />
      )}

      {/* Scheduling Wizard Modal */}
      <SchedulingWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={handleWizardSuccess}
        initialDoctorId={wizardDoctorId}
        initialDate={currentDate}
        initialStartTime={wizardStartTime}
      />
    </Box>
  );
}
