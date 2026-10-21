import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
import { useNavigate } from 'react-router-dom';
import { isElementPermitted } from '../utils/permissionUtils';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Snackbar,
  LinearProgress
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  GridFooterContainer,
  GridPagination
} from '@mui/x-data-grid';
import { ruRU } from '@mui/x-data-grid/locales';
import AnalyticsGridToolbar from '../components/AnalyticsGridToolbar';

// Recharts
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Icons
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import BadgeIcon from '@mui/icons-material/Badge';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

// Type definitions
interface ReceptionSummary {
  totalAppointments: number;
  completedVisits: number;
  cancelledVisits: number;
  noShowVisits: number;
  waitingVisits: number;
  inProgressVisits: number;
  scheduledVisits: number;
  totalRevenue: number;
  avgCheck: number;
  showRate: number;
  cancellationRate: number;
  noShowRate: number;
  avgDuration: number;
  avgWaitTime: number;
  primaryVisits: number;
  followUpVisits: number;
  retentionRate: number;
}

interface StaffPerformance {
  doctorId: number;
  doctorName: string;
  doctorRole: string;
  roomNumber: string;
  totalAppointments: number;
  completedVisits: number;
  cancelledVisits: number;
  noShowVisits: number;
  showRate: number;
  totalRevenue: number;
  avgCheck: number;
  avgDuration: number;
  avgWaitTime: number;
  occupancyRate: number;
  shareOfClinicRevenue: number;
  shareOfClinicVisits: number;
}

interface TimelineItem {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

interface StatusBreakdownItem {
  status: string;
  label: string;
  color: string;
  count: number;
  percent: number;
}

interface JointBreakdownItem {
  joint_area: string;
  label: string;
  count: number;
  revenue: number;
  percent: number;
}

interface HourlyHeatmapItem {
  hour: string;
  hourNumber: number;
  count: number;
}

interface ReceptionAppointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  operation_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  room_number: string;
  joint_area: string;
  joint_label: string;
  urgency_level: string;
  status: string;
  status_info: { label: string; color: string };
  arrival_time: string | null;
  wait_time_minutes: number | null;
  cancellation_reason: string | null;
  notes: string | null;
  patient_name: string;
  patient_mednum: string;
  patient_age: number;
  patient_phone: string;
  patient_dms: string;
  doctor_name: string;
  doctor_role: string;
  operation_name: string;
  operation_price: number;
}

// Custom Grid Footer for reception history totals
function ReceptionGridFooter(props: { totals?: { count: number; completed: number; revenue: number; avgCheck: number } }) {
  const { totals } = props;
  const count = totals?.count || 0;
  const completed = totals?.completed || 0;
  const revenue = totals?.revenue || 0;
  const avgCheck = totals?.avgCheck || 0;

  return (
    <GridFooterContainer
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 2,
        bgcolor: '#F8FAFC',
        borderTop: '2px solid #CBD5E1',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}
    >
      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          Записей в выборке: <strong style={{ color: '#0F3C64' }}>{count}</strong> (Завершено: <strong>{completed}</strong>)
        </Typography>
        <Divider orientation="vertical" flexItem sx={{ height: 18, my: 'auto' }} />
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          Выручка выборки: <strong style={{ color: '#16A34A' }}>{revenue.toLocaleString('ru-RU')} ₽</strong>
        </Typography>
        <Divider orientation="vertical" flexItem sx={{ height: 18, my: 'auto' }} />
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
          Средний чек: <strong style={{ color: '#0284C7' }}>{avgCheck.toLocaleString('ru-RU')} ₽</strong>
        </Typography>
      </Box>
      <GridPagination />
    </GridFooterContainer>
  );
}

export default function ReceptionHistoryBi() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Screen element permissions (restricted to sysadmin via menuPermissionsConfig.json)
  const canSeedMock = isElementPermitted('reception_history_bi', 'seed_mock_button', currentUser?.permissionCodes);
  const canCleanMock = isElementPermitted('reception_history_bi', 'clean_mock_button', currentUser?.permissionCodes);

  // Filters State
  const [startDate, setStartDate] = useState<string>('2026-09-15');
  const [endDate, setEndDate] = useState<string>('2026-10-25');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedJointArea, setSelectedJointArea] = useState<string>('all');

  // Active View Tab (0: Overview & Charts, 1: Staff Benchmark, 2: Detailed Registry)
  const [activeTab, setActiveTab] = useState<number>(0);

  // Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<ReceptionSummary | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [staffBreakdown, setStaffBreakdown] = useState<StaffPerformance[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdownItem[]>([]);
  const [jointBreakdown, setJointBreakdown] = useState<JointBreakdownItem[]>([]);
  const [hourlyHeatmap, setHourlyHeatmap] = useState<HourlyHeatmapItem[]>([]);
  const [appointments, setAppointments] = useState<ReceptionAppointment[]>([]);

  // Doctors list for filter
  const [doctorsList, setDoctorsList] = useState<Array<{ id: number; full_name: string }>>([]);

  // Selected Appointment for Modal
  const [selectedApp, setSelectedApp] = useState<ReceptionAppointment | null>(null);
  const [appModalOpen, setAppModalOpen] = useState<boolean>(false);

  // Snackbar notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [seedingLoading, setSeedingLoading] = useState<boolean>(false);
  const [cleaningLoading, setCleaningLoading] = useState<boolean>(false);

  // Preset Date Range Helper
  const applyPreset = (preset: 'today' | '7days' | 'october' | 'september' | 'all') => {
    if (preset === 'today') {
      setStartDate('2026-10-21');
      setEndDate('2026-10-21');
    } else if (preset === '7days') {
      setStartDate('2026-10-15');
      setEndDate('2026-10-21');
    } else if (preset === 'october') {
      setStartDate('2026-10-01');
      setEndDate('2026-10-25');
    } else if (preset === 'september') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    } else if (preset === 'all') {
      setStartDate('2026-09-01');
      setEndDate('2026-10-25');
    }
  };

  // Fetch doctors list once
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/scheduling/doctors`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.doctors) {
          setDoctorsList(data.doctors);
        }
      })
      .catch((e) => console.error('Error fetching doctors:', e));
  }, []);

  // Fetch BI Reception History Data
  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (selectedDoctorId && selectedDoctorId !== 'all') params.append('doctorId', selectedDoctorId);
    if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
    if (selectedJointArea && selectedJointArea !== 'all') params.append('jointArea', selectedJointArea);

    fetch(`${API_BASE_URL}/api/analytics/reception-history?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.summary);
          setTimeline(data.timeline || []);
          setStaffBreakdown(data.staffBreakdown || []);
          setStatusBreakdown(data.statusBreakdown || []);
          setJointBreakdown(data.jointBreakdown || []);
          setHourlyHeatmap(data.hourlyHeatmap || []);
          setAppointments(data.appointments || []);
        }
      })
      .catch((err) => console.error('Error fetching reception history:', err))
      .finally(() => setLoading(false));
  }, [startDate, endDate, selectedDoctorId, selectedStatus, selectedJointArea]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Seed Mock Data [TEST_DAEMON]
  const handleSeedMockData = async () => {
    setSeedingLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/reception-history/seed-mock`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(data.message || 'Тестовые данные успешно сгенерированы!');
        loadData();
      } else {
        setToastMessage(`Ошибка генерации: ${data.error}`);
      }
    } catch (e: any) {
      setToastMessage(`Ошибка сети: ${e?.message}`);
    } finally {
      setSeedingLoading(false);
    }
  };

  // Clean Mock Data [TEST_DAEMON]
  const handleCleanMockData = async () => {
    setCleaningLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/reception-history/clean-mock`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(data.message || 'Смоделированные тестовые записи успешно удалены!');
        loadData();
      } else {
        setToastMessage(`Ошибка удаления: ${data.error}`);
      }
    } catch (e: any) {
      setToastMessage(`Ошибка сети: ${e?.message}`);
    } finally {
      setCleaningLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStartDate('2026-09-15');
    setEndDate('2026-10-25');
    setSelectedDoctorId('all');
    setSelectedStatus('all');
    setSelectedJointArea('all');
  };

  // Grid Columns definition
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'appointment_date',
        headerName: 'Дата и время',
        width: 145,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64', lineHeight: 1.2 }}>
              {params.row.appointment_date}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              {params.row.start_time} — {params.row.end_time}
            </Typography>
          </Box>
        )
      },
      {
        field: 'patient_name',
        headerName: 'Пациент (ФИО, ЭМК, возраст)',
        flex: 1.6,
        minWidth: 200,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ py: 0.5, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              {params.row.patient_name || 'Не указан'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
              ЭМК: {params.row.patient_mednum || '—'} · {params.row.patient_age ? `${params.row.patient_age} лет` : ''} · {params.row.patient_dms || 'Физлицо (Платный приём)'}
            </Typography>
          </Box>
        )
      },
      {
        field: 'doctor_name',
        headerName: 'Врач / Кабинет',
        flex: 1.4,
        minWidth: 180,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ py: 0.5, whiteSpace: 'normal', wordBreak: 'break-word' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', lineHeight: 1.2 }}>
              {params.row.doctor_name || 'Не назначен'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              {params.row.room_number || 'Кабинет №1'}
            </Typography>
          </Box>
        )
      },
      {
        field: 'operation_name',
        headerName: 'Услуга / Назначение',
        flex: 1.6,
        minWidth: 200,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ py: 0.5, whiteSpace: 'normal', wordBreak: 'break-word' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.25 }}>
              {params.row.operation_name || 'Первичный консультативный приём'}
            </Typography>
            {params.row.notes && (
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontStyle: 'italic' }}>
                {params.row.notes.slice(0, 70)}...
              </Typography>
            )}
          </Box>
        )
      },
      {
        field: 'joint_label',
        headerName: 'Локализация',
        width: 140,
        renderCell: (params: GridRenderCellParams) => (
          <Chip
            size="small"
            label={params.row.joint_label || 'Общая'}
            sx={{
              bgcolor: '#F1F5F9',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.75rem',
              border: '1px solid #CBD5E1'
            }}
          />
        )
      },
      {
        field: 'status',
        headerName: 'Статус явки',
        width: 150,
        renderCell: (params: GridRenderCellParams) => {
          const info = params.row.status_info || { label: params.row.status, color: '#64748B' };
          return (
            <Chip
              size="small"
              label={info.label}
              sx={{
                bgcolor: `${info.color}15`,
                color: info.color,
                fontWeight: 700,
                fontSize: '0.75rem',
                border: `1px solid ${info.color}40`
              }}
            />
          );
        }
      },
      {
        field: 'wait_time_minutes',
        headerName: 'Ожидание',
        width: 105,
        renderCell: (params: GridRenderCellParams) => {
          const wait = params.row.wait_time_minutes;
          if (wait === null || wait === undefined) return <Typography variant="caption" sx={{ color: '#94A3B8' }}>—</Typography>;
          const color = wait > 20 ? '#DC2626' : wait > 10 ? '#D97706' : '#16A34A';
          return (
            <Typography variant="body2" sx={{ fontWeight: 700, color }}>
              {wait} мин
            </Typography>
          );
        }
      },
      {
        field: 'operation_price',
        headerName: 'Сумма (₽)',
        width: 115,
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
            {(Number(params.row.operation_price) || 0).toLocaleString('ru-RU')} ₽
          </Typography>
        )
      },
      {
        field: 'actions',
        headerName: 'Действия',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Открыть карточку приёма" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedApp(params.row);
                  setAppModalOpen(true);
                }}
                sx={{ color: '#0F3C64' }}
              >
                <LaunchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )
      }
    ],
    []
  );

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* 1. Header Section */}
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
            <CalendarMonthIcon sx={{ fontSize: 34, color: '#0F3C64' }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px' }}>
              История Приема (BI Аналитика)
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
            Центр Ортопедии и Травматологии Добрушкина (г. Сочи) · Многомерный управленческий анализ потока пациентов, явок, загрузки врачей и выручки клиники
          </Typography>
        </Box>

        {/* Action Controls on top right */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {canSeedMock && (
            <Tooltip title="Сгенерировать 120-180 реалистичных приёмов за последние 40 дней для проверки [TEST_DAEMON] (Доступно только sysadmin)" arrow>
              <Button
                variant="outlined"
                size="small"
                startIcon={seedingLoading ? <CircularProgress size={16} /> : <SmartToyIcon />}
                disabled={seedingLoading || cleaningLoading}
                onClick={handleSeedMockData}
                sx={{
                  borderColor: '#0284C7',
                  color: '#0284C7',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.06)' }
                }}
              >
                {seedingLoading ? 'Генерация...' : '[TEST_DAEMON] Симуляция потока'}
              </Button>
            </Tooltip>
          )}

          {canCleanMock && (
            <Tooltip title="Удалить все смоделированные тестовые приёмы [TEST_DAEMON] из расписания клиники (Доступно только sysadmin)" arrow>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={cleaningLoading ? <CircularProgress size={16} color="error" /> : <DeleteSweepIcon />}
                disabled={seedingLoading || cleaningLoading}
                onClick={handleCleanMockData}
                sx={{
                  borderColor: '#DC2626',
                  color: '#DC2626',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.06)' }
                }}
              >
                {cleaningLoading ? 'Удаление...' : 'Удалить [TEST_DAEMON] Симуляция потока'}
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Обновить аналитические данные" arrow>
            <IconButton onClick={loadData} disabled={loading} sx={{ bgcolor: '#FFFFFF', border: '1px solid #CBD5E1' }}>
              {loading ? <CircularProgress size={18} /> : <RefreshIcon sx={{ color: '#0F3C64' }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 2. Multi-Dimensional Filter Control Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: '16px',
          border: '1.5px solid #CBD5E1',
          bgcolor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {/* Preset chips row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mr: 1 }}>
            БЫСТРЫЙ ПЕРИОД:
          </Typography>
          <Chip
            label="Сегодня (21.10)"
            clickable
            size="small"
            onClick={() => applyPreset('today')}
            sx={{ fontWeight: 600, bgcolor: startDate === '2026-10-21' && endDate === '2026-10-21' ? '#0F3C64' : '#F1F5F9', color: startDate === '2026-10-21' && endDate === '2026-10-21' ? '#FFFFFF' : '#334155' }}
          />
          <Chip
            label="Последние 7 дней"
            clickable
            size="small"
            onClick={() => applyPreset('7days')}
            sx={{ fontWeight: 600, bgcolor: startDate === '2026-10-15' && endDate === '2026-10-21' ? '#0F3C64' : '#F1F5F9', color: startDate === '2026-10-15' && endDate === '2026-10-21' ? '#FFFFFF' : '#334155' }}
          />
          <Chip
            label="Октябрь 2026 (Текущий месяц)"
            clickable
            size="small"
            onClick={() => applyPreset('october')}
            sx={{ fontWeight: 600, bgcolor: startDate === '2026-10-01' ? '#0F3C64' : '#F1F5F9', color: startDate === '2026-10-01' ? '#FFFFFF' : '#334155' }}
          />
          <Chip
            label="Сентябрь 2026"
            clickable
            size="small"
            onClick={() => applyPreset('september')}
            sx={{ fontWeight: 600, bgcolor: startDate === '2026-09-01' && endDate === '2026-09-30' ? '#0F3C64' : '#F1F5F9', color: startDate === '2026-09-01' && endDate === '2026-09-30' ? '#FFFFFF' : '#334155' }}
          />
          <Chip
            label="Все данные (Осень 2026)"
            clickable
            size="small"
            onClick={() => applyPreset('all')}
            sx={{ fontWeight: 600, bgcolor: startDate === '2026-09-01' && endDate === '2026-10-25' ? '#0F3C64' : '#F1F5F9', color: startDate === '2026-09-01' && endDate === '2026-10-25' ? '#FFFFFF' : '#334155' }}
          />
        </Box>

        {/* Inputs row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            type="date"
            label="Дата начала"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
          />

          <TextField
            type="date"
            label="Дата окончания"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
          />

          <TextField
            select
            label="Врач / Специалист"
            size="small"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            sx={{ minWidth: 230 }}
          >
            <MenuItem value="all">Все врачи клиники (Вся клиника)</MenuItem>
            {doctorsList.map((d) => (
              <MenuItem key={d.id} value={String(d.id)}>
                {d.full_name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Статус приёма"
            size="small"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">Все статусы приёма</MenuItem>
            <MenuItem value="completed_group">✓ Завершённые и подписанные</MenuItem>
            <MenuItem value="in_progress">В кабинете у врача</MenuItem>
            <MenuItem value="waiting">В холле (ожидают)</MenuItem>
            <MenuItem value="scheduled">Запланированные</MenuItem>
            <MenuItem value="cancelled_group">✕ Отменённые и неявки</MenuItem>
          </TextField>

          <TextField
            select
            label="Локализация (Сустав)"
            size="small"
            value={selectedJointArea}
            onChange={(e) => setSelectedJointArea(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">Все локализации</MenuItem>
            <MenuItem value="knee">Коленный сустав</MenuItem>
            <MenuItem value="spine">Позвоночник</MenuItem>
            <MenuItem value="hip">Тазобедренный сустав</MenuItem>
            <MenuItem value="shoulder">Плечевой сустав</MenuItem>
            <MenuItem value="ankle">Голеностоп и стопа</MenuItem>
          </TextField>

          <Button
            variant="text"
            startIcon={<FilterAltOffIcon />}
            onClick={handleResetFilters}
            sx={{ color: '#64748B', fontWeight: 600, textTransform: 'none' }}
          >
            Сброс
          </Button>
        </Box>
      </Paper>

      {/* 3. Executive KPI Dashboard Cards (Top 5 Pillars) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
          gap: 2,
          mb: 3
        }}
      >
        {/* KPI 1: Всего записей */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>
              ВСЕГО ПРИЁМОВ
            </Typography>
            <CalendarMonthIcon sx={{ fontSize: 22, color: '#0F3C64' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64' }}>
            {summary?.totalAppointments || 0}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700 }}>
              Завершено: {summary?.completedVisits || 0} чел. ({summary?.showRate || 0}%)
            </Typography>
            <LinearProgress
              variant="determinate"
              value={summary?.showRate || 0}
              sx={{ height: 6, borderRadius: 3, mt: 0.5, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: '#16A34A' } }}
            />
          </Box>
        </Paper>

        {/* KPI 2: Валовая Выручка */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: '14px',
            border: '1.5px solid #BBF7D0',
            bgcolor: '#F0FDF4',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#15803D' }}>
              ВЫРУЧКА ПРИЁМОВ
            </Typography>
            <MonetizationOnIcon sx={{ fontSize: 22, color: '#16A34A' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#14532D' }}>
            {(summary?.totalRevenue || 0).toLocaleString('ru-RU')} ₽
          </Typography>
          <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600, mt: 1 }}>
            Средний чек: <strong>{(summary?.avgCheck || 0).toLocaleString('ru-RU')} ₽</strong> / визит
          </Typography>
        </Paper>

        {/* KPI 3: Показатель явки (Show Rate) */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: '14px',
            border: '1.5px solid #BAE6FD',
            bgcolor: '#F0F9FF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369A1' }}>
              ПОКАЗАТЕЛЬ ЯВКИ (SHOW-RATE)
            </Typography>
            <CheckCircleIcon sx={{ fontSize: 22, color: '#0284C7' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0C4A6E' }}>
            {summary?.showRate || 0}%
          </Typography>
          <Typography variant="caption" sx={{ color: '#075985', fontWeight: 600, mt: 1 }}>
            Отмены: {summary?.cancelledVisits || 0} ({summary?.cancellationRate || 0}%) · Неявки: {summary?.noShowVisits || 0} ({summary?.noShowRate || 0}%)
          </Typography>
        </Paper>

        {/* KPI 4: Длительность & Ожидание */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>
              СЕРВИСНЫЕ ТАЙМИНГИ
            </Typography>
            <AccessTimeIcon sx={{ fontSize: 22, color: '#F59E0B' }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              {summary?.avgDuration || 30}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
              мин приём
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, mt: 1 }}>
            Ожидание в холле: <strong>{summary?.avgWaitTime || 10} мин</strong> до приёма
          </Typography>
        </Paper>

        {/* KPI 5: Retention & Пациенты */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>
              СТРУКТУРА ПАЦИЕНТОВ
            </Typography>
            <PeopleAltIcon sx={{ fontSize: 22, color: '#8B5CF6' }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#6D28D9' }}>
              {summary?.retentionRate || 0}%
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
              повторных
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, mt: 1 }}>
            Первичных: {summary?.primaryVisits || 0} · Повторных: {summary?.followUpVisits || 0}
          </Typography>
        </Paper>
      </Box>

      {/* 4. Tab Navigation Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          p: 0.5
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              minHeight: 46,
              borderRadius: '10px',
              mx: 0.5,
              color: '#64748B',
              '&.Mui-selected': {
                color: '#0F3C64',
                bgcolor: 'rgba(15, 60, 100, 0.08)'
              }
            },
            '& .MuiTabs-indicator': { display: 'none' }
          }}
        >
          <Tab
            icon={<QueryStatsIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Сводные графики и KPI клиники"
          />
          <Tab
            icon={<BadgeIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Аналитика по персоналу (Врачи)"
          />
          <Tab
            icon={<AssignmentIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={`Детализированный реестр истории (${appointments.length} записей)`}
          />
        </Tabs>
      </Paper>

      {/* 5. Tab Panels */}

      {/* TAB 0: Clinic BI Overview & Visual Charts */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Row 1: Timeline chart & Status Donut */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
            {/* Chart 1: Dynamic Timeline of Appointments & Revenue */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    Динамика приёмов и выручки по дням
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Соотношение числа завершённых визитов (столбцы) и начисленной выручки в рублях (линия)
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ width: '100%', height: 320 }}>
                {timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeline} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(d) => d.slice(5)} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#16A34A' }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                      <RechartsTooltip
                        formatter={(val: any, name: any) => {
                          if (name === 'revenue') return [`${Number(val).toLocaleString('ru-RU')} ₽`, 'Выручка'];
                          if (name === 'completed') return [val, 'Завершено'];
                          return [val, 'Всего приёмов'];
                        }}
                        labelFormatter={(lbl) => `Дата: ${lbl}`}
                      />
                      <Legend
                        formatter={(val) => {
                          if (val === 'completed') return 'Завершено (чел)';
                          if (val === 'revenue') return 'Выручка (₽)';
                          return 'Всего записей';
                        }}
                      />
                      <Bar yAxisId="left" dataKey="completed" fill="#0F3C64" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={3} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                      Нет данных за выбранный диапазон дат
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Chart 2: Status Breakdown Pie */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', mb: 0.5 }}>
                Структура статусов явок
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', mb: 2 }}>
                Доли завершённых, отменённых и запланированных визитов
              </Typography>

              <Box sx={{ width: '100%', height: 240 }}>
                {statusBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusBreakdown}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: any) => [`${val} приёмов`, 'Количество']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" sx={{ color: '#94A3B8' }}>Нет данных</Typography>
                  </Box>
                )}
              </Box>

              {/* Status Legend List */}
              <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {statusBreakdown.slice(0, 4).map((s) => (
                  <Box key={s.status} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>
                        {s.label}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                      {s.count} ({s.percent}%)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>

          {/* Row 2: Joint Area Profiles & Hourly Heatmap */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
            {/* Chart 3: Joint Area Breakdown */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                Распределение по анатомическим зонам
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                Объём консультаций и манипуляций по видам суставов
              </Typography>

              <Box sx={{ width: '100%', height: 260 }}>
                {jointBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jointBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#334155' }} width={120} />
                      <RechartsTooltip
                        formatter={(val: any, name: any) => [
                          name === 'revenue' ? `${Number(val).toLocaleString('ru-RU')} ₽` : `${val} приёмов`,
                          name === 'revenue' ? 'Выручка' : 'Приёмов'
                        ]}
                      />
                      <Bar dataKey="count" fill="#156C9C" radius={[0, 4, 4, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" sx={{ color: '#94A3B8' }}>Нет данных</Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Chart 4: Hourly Heatmap load */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                Тепловая карта загрузки часов клиники (09:00 — 19:00)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                Плотность приёмов в течение дня: определение пиковых часов для планирования смен
              </Typography>

              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyHeatmap} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <RechartsTooltip formatter={(val: any) => [`${val} приёмов`, 'Загрузка']} />
                    <Bar dataKey="count" fill="#0284C7" radius={[4, 4, 0, 0]} maxBarSize={28}>
                      {hourlyHeatmap.map((entry, index) => {
                        const isPeak = entry.count > 15;
                        return <Cell key={`cell-${index}`} fill={isPeak ? '#0F3C64' : '#38BDF8'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* TAB 1: Staff Performance & Benchmarking */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Top Doctors Cards Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 3
            }}
          >
            {staffBreakdown.map((doc) => (
              <Paper
                key={doc.doctorId}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: '1.5px solid #CBD5E1',
                  bgcolor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '12px',
                        bgcolor: 'rgba(15, 60, 100, 0.08)',
                        color: '#0F3C64',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.2rem'
                      }}
                    >
                      {doc.doctorName.slice(0, 1)}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                        {doc.doctorName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {doc.doctorRole} · {doc.roomNumber}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={`Доля: ${doc.shareOfClinicRevenue}% выручки`}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Divider sx={{ my: 0.5 }} />

                {/* KPI Metrics Matrix for Doctor */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, textAlign: 'center' }}>
                  <Box sx={{ bgcolor: '#F8FAFC', p: 1.2, borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                      Приёмов (всего/факт)
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      {doc.totalAppointments} / {doc.completedVisits}
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: '#F0FDF4', p: 1.2, borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 600 }}>
                      Выручка врача
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#15803D' }}>
                      {doc.totalRevenue.toLocaleString('ru-RU')} ₽
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: '#F0F9FF', p: 1.2, borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 600 }}>
                      Средний чек
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0284C7' }}>
                      {doc.avgCheck.toLocaleString('ru-RU')} ₽
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#475569' }}>
                    Показатель явки (Show-Rate): <strong>{doc.showRate}%</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569' }}>
                    Средняя длительность: <strong>{doc.avgDuration} мин</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569' }}>
                    Ожидание: <strong>{doc.avgWaitTime} мин</strong>
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={doc.showRate}
                  sx={{ height: 6, borderRadius: 3, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: '#0F3C64' } }}
                />
              </Paper>
            ))}
          </Box>

          {/* Comparative Benchmarking Table */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1 }}>
              Сравнительная таблица производительности врачей (Benchmarking)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
              Сравнение ключевых показателей продуктивности, дисциплины расписания и конверсии
            </Typography>

            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#0F3C64' }}>Врач / Специалист</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#0F3C64' }}>Кабинет</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#0F3C64', textAlign: 'right' }}>Приёмов</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#0F3C64', textAlign: 'right' }}>Завершено</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#0F3C64', textAlign: 'right' }}>Явка (%)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#0F3C64', textAlign: 'right' }}>Выручка (₽)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#0F3C64', textAlign: 'right' }}>Доля клиники</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#0F3C64', textAlign: 'right' }}>Средний чек</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#0F3C64', textAlign: 'right' }}>Ожидание</th>
                  </tr>
                </thead>
                <tbody>
                  {staffBreakdown.map((s) => (
                    <tr key={s.doctorId} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F3C64' }}>{s.doctorName}</td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{s.roomNumber}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{s.totalAppointments}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#16A34A' }}>{s.completedVisits}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>
                        <span style={{ color: s.showRate > 80 ? '#16A34A' : s.showRate > 60 ? '#D97706' : '#DC2626' }}>
                          {s.showRate}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#0F3C64' }}>
                        {s.totalRevenue.toLocaleString('ru-RU')} ₽
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Chip label={`${s.shareOfClinicRevenue}%`} size="small" sx={{ fontWeight: 700, height: 20 }} />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                        {s.avgCheck.toLocaleString('ru-RU')} ₽
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748B' }}>
                        {s.avgWaitTime} мин
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Box>
      )}

      {/* TAB 2: Detailed Reception History DataGrid */}
      {activeTab === 2 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            width: '100%'
          }}
        >
          <DataGrid
            autoHeight
            getRowHeight={() => 'auto'}
            rows={appointments}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            initialState={{
              pagination: { paginationModel: { pageSize: 15, page: 0 } },
              sorting: { sortModel: [{ field: 'appointment_date', sort: 'desc' }] }
            }}
            pageSizeOptions={[10, 15, 25, 50, 100]}
            disableRowSelectionOnClick
            showToolbar
            localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
            slots={{
              toolbar: AnalyticsGridToolbar,
              footer: ReceptionGridFooter as any
            }}
            slotProps={{
              footer: {
                totals: {
                  count: appointments.length,
                  completed: appointments.filter((a) => a.status === 'completed' || a.status === 'protocol_signed').length,
                  revenue: appointments
                    .filter((a) => a.status === 'completed' || a.status === 'protocol_signed')
                    .reduce((acc, curr) => acc + (Number(curr.operation_price) || 0), 0),
                  avgCheck: summary?.avgCheck || 0
                }
              } as any
            }}
            sx={{
              width: '100%',
              border: 'none',
              '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#F8FAFC',
                color: '#0F3C64',
                fontWeight: 700,
                borderBottom: '2px solid #CBD5E1'
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: 'rgba(15, 60, 100, 0.04)'
              }
            }}
          />
        </Paper>
      )}

      {/* 6. Single Appointment Details Modal */}
      {selectedApp && (
        <Dialog
          open={appModalOpen}
          onClose={() => setAppModalOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: '16px', overflow: 'hidden' } } }}
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
            <IconButton onClick={() => setAppModalOpen(false)} sx={{ color: '#FFFFFF' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 3, bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    ПАЦИЕНТ
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    {selectedApp.patient_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    ЭМК №{selectedApp.patient_mednum} · Возраст: {selectedApp.patient_age} · Телефон: {selectedApp.patient_phone || 'не указан'}
                  </Typography>
                </Box>
                <Chip
                  label={selectedApp.status_info.label}
                  sx={{
                    bgcolor: `${selectedApp.status_info.color}15`,
                    color: selectedApp.status_info.color,
                    fontWeight: 700,
                    border: `1px solid ${selectedApp.status_info.color}40`
                  }}
                />
              </Box>

              <Divider />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    ДАТА И ВРЕМЯ
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedApp.appointment_date} ({selectedApp.start_time} — {selectedApp.end_time})
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    ВРАЧ И КАБИНЕТ
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedApp.doctor_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {selectedApp.room_number}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    УСЛУГА
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedApp.operation_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 800 }}>
                    {Number(selectedApp.operation_price).toLocaleString('ru-RU')} ₽
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    СУСТАВ / ОБЛАСТЬ
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedApp.joint_label}
                  </Typography>
                </Box>
              </Box>

              {selectedApp.notes && (
                <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                    ЖАЛОБЫ И ПРИМЕЧАНИЯ:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedApp.notes}
                  </Typography>
                </Box>
              )}

              {selectedApp.cancellation_reason && (
                <Alert severity="error" sx={{ py: 0.5 }}>
                  Причина отмены: {selectedApp.cancellation_reason}
                </Alert>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
            <Button onClick={() => setAppModalOpen(false)} sx={{ color: '#64748B' }}>
              Закрыть
            </Button>
            <Button
              variant="contained"
              startIcon={<LaunchIcon />}
              onClick={() => {
                setAppModalOpen(false);
                navigate(`/ortho-workstation/${selectedApp.id}`);
              }}
              sx={{ bgcolor: '#0F3C64', fontWeight: 700 }}
            >
              Перейти в АРМ Врача
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Snackbar notification */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
