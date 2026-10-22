import { useState, useEffect, useMemo, useCallback, type MouseEvent } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import TodayIcon from '@mui/icons-material/Today';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PhoneIcon from '@mui/icons-material/Phone';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import TableChartIcon from '@mui/icons-material/TableChart';
import { API_BASE_URL } from '../../config/apiConfig';
import FullPatientSearchModal from './FullPatientSearchModal';
import QueueSummaryModal, { type DayBreakdownItem, type TotalSummary } from './QueueSummaryModal';
import QueueCalendarModal from './QueueCalendarModal';
import { useAuth } from '../../context/AuthContext';

export interface QueueItem {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name: string;
  doctor_role?: string;
  doctor_specialization?: string;
  room_number?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  joint_area: string;
  urgency_level: string;
  status: string;
  arrival_time?: string | null;
  notes?: string;
  created_at?: string;
  patient_name: string;
  patient_mednum: number;
  patient_age: number;
  patient_sex: string;
  patient_phone: string;
  patient_dms?: string;
  operation_name?: string;
  operation_price?: number;
  protocol_id?: number | null;
  protocol_is_signed?: number | null;
  protocol_signed_at?: string | null;
}

export interface DoctorQueueHubProps {
  onSelectAppointment: (appointment: QueueItem) => void;
  onSelectPatientDirectly: (patient: any) => void;
  selectedAppointmentId?: number | null;
}

// 5 дней для быстрых чипов навигатора
const FIVE_DAYS = [
  { date: '2026-10-21', short: '21.10', label: 'Сегодня (21 окт)' },
  { date: '2026-10-22', short: '22.10', label: 'Чт (22 окт)' },
  { date: '2026-10-23', short: '23.10', label: 'Пт (23 окт)' },
  { date: '2026-10-24', short: '24.10', label: 'Сб (24 окт)' },
  { date: '2026-10-25', short: '25.10', label: 'Вс (25 окт)' }
];

// Цветовые токены для суставов
const JOINT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  knee: { bg: '#E0F2FE', color: '#0284C7', label: 'Коленный сустав' },
  hip: { bg: '#F3E8FF', color: '#7E22CE', label: 'Тазобедренный сустав' },
  shoulder: { bg: '#FEF3C7', color: '#B45309', label: 'Плечевой сустав' },
  elbow: { bg: '#FFEDD5', color: '#C2410C', label: 'Локтевой сустав' },
  wrist: { bg: '#FCE7F3', color: '#BE185D', label: 'Лучезапястный сустав' },
  ankle: { bg: '#DCFCE7', color: '#15803D', label: 'Голеностопный сустав' },
  foot: { bg: '#CCFBF1', color: '#0F766E', label: 'Стопа / Подиатрия' },
  spine: { bg: '#FEE2E2', color: '#B91C1C', label: 'Позвоночник / Дорсопатия' }
};

// Функция форматирования дат на русском
function formatRussianDate(dateStr: string) {
  if (!dateStr || dateStr === 'all') return { title: 'Все даты', isToday: false, weekday: '', short: '' };
  const parts = dateStr.split('-');
  if (parts.length !== 3) return { title: dateStr, isToday: false, weekday: '', short: dateStr };
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const dt = new Date(y, m - 1, d);
  const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const isToday = dateStr === '2026-10-21';
  const weekday = weekdays[dt.getDay()];
  const monthName = months[dt.getMonth()];
  return {
    isToday,
    title: isToday ? `Сегодня, ${d} ${monthName}` : `${d} ${monthName}, ${weekday}`,
    weekday,
    dayMonth: `${d} ${monthName}`,
    short: `${d.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')}`
  };
}

export default function DoctorQueueHub({
  onSelectAppointment,
  onSelectPatientDirectly,
  selectedAppointmentId
}: DoctorQueueHubProps) {
  const { currentUser, hasPermission } = useAuth();

  // Дата приема (по умолчанию сегодня: 2026-10-21, либо 'all' для всех записанных)
  const [selectedDate, setSelectedDate] = useState('2026-10-21');

  // Доктор (по умолчанию: Добрушкин А.М. id=2)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('2');
  const [doctorsList, setDoctorsList] = useState<any[]>([]);

  // Состояние очереди
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [kpis, setKpis] = useState({
    total: 0,
    waiting: 0,
    in_progress: 0,
    completed: 0,
    scheduled: 0,
    cito: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры списка очереди
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Модальное окно полной картотеки пациентов
  const [patientModalOpen, setPatientModalOpen] = useState(false);

  // Модальные окна сводки по датам и интерактивного календаря
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [dayBreakdown, setDayBreakdown] = useState<DayBreakdownItem[]>([]);
  const [totalSummary, setTotalSummary] = useState<TotalSummary>({
    total: 0,
    waiting: 0,
    in_progress: 0,
    completed: 0,
    scheduled: 0,
    cito: 0
  });

  // Состояние свернутых/развернутых групп по датам (для режима 'all')
  // Сегодня (2026-10-21) развернуто по умолчанию, последующие даты свернуты
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({
    '2026-10-21': true
  });

  // Права администратора: разрешить переключать врача или смотреть всю клинику
  const isAdmin = useMemo(() => {
    return (
      hasPermission('administrator') ||
      hasPermission('sysadmin') ||
      currentUser?.role === 'sysadmin' ||
      currentUser?.role === 'admin'
    );
  }, [currentUser, hasPermission]);

  // Загрузка каталога врачей
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/ortho/doctors`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.doctors)) {
          setDoctorsList(data.doctors);
        }
      })
      .catch((err) => console.error('Error fetching doctors list:', err));
  }, []);

  // Если текущий пользователь привязан к конкретному врачу и не админ, фиксируем его
  useEffect(() => {
    if (!isAdmin && currentUser?.staffId) {
      setSelectedDoctorId(String(currentUser.staffId));
    }
  }, [isAdmin, currentUser]);

  // Загрузка очереди с бэкенда
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qParams = new URLSearchParams({
        date: selectedDate,
        doctorId: selectedDoctorId
      });
      const res = await fetch(`${API_BASE_URL}/api/ortho/queue?${qParams.toString()}`);
      if (!res.ok) throw new Error(`Ошибка загрузки очереди (HTTP ${res.status})`);
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue || []);
        setKpis(data.kpis || { total: 0, waiting: 0, in_progress: 0, completed: 0, scheduled: 0, cito: 0 });
        if (data.dayCounts) {
          setDayCounts(data.dayCounts);
        }
        if (data.dayBreakdown) {
          setDayBreakdown(data.dayBreakdown);
        }
        if (data.totalSummary) {
          setTotalSummary(data.totalSummary);
        }
      } else {
        throw new Error(data.error || 'Не удалось получить список очереди');
      }
    } catch (err: any) {
      console.error('Error fetching ortho queue:', err);
      setError(err.message || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedDoctorId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Смена статуса приема из карточки очереди (например, "Вызвать в кабинет")
  const handleUpdateStatus = async (item: QueueItem, nextStatus: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE_URL}/api/ortho/queue/${item.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchQueue();
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };

  // Фильтрованный список карточек
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      // Фильтр статуса
      if (filterStatus === 'waiting' && item.status !== 'waiting') return false;
      if (filterStatus === 'in_progress' && item.status !== 'in_progress') return false;
      if (filterStatus === 'completed' && !['completed', 'protocol_signed'].includes(item.status)) return false;
      if (filterStatus === 'scheduled' && item.status !== 'scheduled') return false;

      // Поисковый запрос
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (item.patient_name || '').toLowerCase().includes(q);
        const matchNote = (item.notes || '').toLowerCase().includes(q);
        const matchJoint = (item.joint_area || '').toLowerCase().includes(q);
        const matchDoctor = (item.doctor_name || '').toLowerCase().includes(q);
        const matchMednum = String(item.patient_mednum || '').includes(q);
        const matchDate = (item.appointment_date || '').includes(q);
        if (!matchName && !matchNote && !matchJoint && !matchDoctor && !matchMednum && !matchDate) return false;
      }

      return true;
    });
  }, [queue, filterStatus, searchQuery]);

  // Группировка очереди по датам для режима 'all'
  const groupedQueue = useMemo(() => {
    const groups: Record<string, QueueItem[]> = {};
    filteredQueue.forEach((item) => {
      const d = item.appointment_date || 'Без даты';
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    return groups;
  }, [filteredQueue]);

  const sortedGroupDates = useMemo(() => {
    return Object.keys(groupedQueue).sort();
  }, [groupedQueue]);

  const toggleDay = (dateKey: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  const expandAllDays = () => {
    const next: Record<string, boolean> = {};
    sortedGroupDates.forEach((d) => {
      next[d] = true;
    });
    setExpandedDays(next);
  };

  const collapseAllDays = () => {
    const next: Record<string, boolean> = {};
    sortedGroupDates.forEach((d) => {
      next[d] = false;
    });
    setExpandedDays(next);
  };

  // Проверка: выбрана ли произвольная дата вне 5 дней и не 'all'
  const isCustomDate = useMemo(() => {
    if (selectedDate === 'all') return false;
    return !FIVE_DAYS.some((d) => d.date === selectedDate);
  }, [selectedDate]);

  // Текущий выбранный доктор для отображения в плашке
  const activeDoctorName = useMemo(() => {
    if (selectedDoctorId === 'all') return 'Все врачи клиники (Сводная очередь)';
    const d = doctorsList.find((doc) => String(doc.id) === String(selectedDoctorId));
    return d ? d.full_name : (doctorsList[0]?.full_name || 'Врач клиники');
  }, [selectedDoctorId, doctorsList]);

  // Рендер отдельной карточки приема
  const renderAppointmentCard = (item: QueueItem, showDateBadge = false) => {
    const jointCfg = JOINT_COLORS[item.joint_area] || { bg: '#F1F5F9', color: '#475569', label: item.joint_area || 'Сустав не указан' };
    const isWaiting = item.status === 'waiting';
    const isInProgress = item.status === 'in_progress';
    const isCompleted = ['completed', 'protocol_signed'].includes(item.status);
    const isCito = item.urgency_level === 'cito';
    const isSelected = selectedAppointmentId === item.id;

    // Расчет цвета акцентной полоски
    let borderLeftColor = '#94A3B8';
    if (isCito) borderLeftColor = '#DC2626';
    else if (isInProgress) borderLeftColor = '#0284C7';
    else if (isWaiting) borderLeftColor = '#16A34A';
    else if (isCompleted) borderLeftColor = '#059669';

    return (
      <Card
        key={item.id}
        elevation={0}
        onClick={() => onSelectAppointment(item)}
        sx={{
          p: 2.2,
          borderRadius: 2.5,
          bgcolor: isSelected ? 'rgba(15, 60, 100, 0.04)' : '#FFFFFF',
          border: isSelected ? '2px solid #0F3C64' : '1px solid #E2E8F0',
          borderLeft: `5px solid ${borderLeftColor}`,
          boxShadow: isSelected ? '0 8px 24px rgba(15, 60, 100, 0.12)' : '0 2px 6px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          transition: 'all 0.18s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.07)'
          }
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '190px 1fr auto',
              md: '220px 1.5fr 1fr 180px'
            },
            alignItems: 'center',
            gap: 2
          }}
        >
          {/* Время приема, дата и статус ожидания */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: isInProgress ? '#E0F2FE' : isWaiting ? '#DCFCE7' : '#F1F5F9',
                textAlign: 'center',
                minWidth: 78
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: isInProgress ? '#0284C7' : isWaiting ? '#15803D' : '#1E293B', lineHeight: 1 }}>
                {item.start_time}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem', display: 'block', mt: 0.3 }}>
                до {item.end_time}
              </Typography>
              {showDateBadge && (
                <Chip
                  label={item.appointment_date?.slice(5)}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    mt: 0.4,
                    bgcolor: '#E2E8F0',
                    color: '#334155'
                  }}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {isWaiting && (
                <Chip
                  icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#16A34A !important' }} />}
                  label={item.arrival_time ? `В холле c ${item.arrival_time.slice(0, 5)}` : 'В холле'}
                  size="small"
                  sx={{ height: 22, fontWeight: 700, fontSize: '0.7rem', bgcolor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}
                />
              )}
              {isInProgress && (
                <Chip
                  icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#0284C7 !important' }} />}
                  label="Идет прием"
                  size="small"
                  sx={{ height: 22, fontWeight: 700, fontSize: '0.7rem', bgcolor: '#E0F2FE', color: '#0369A1', border: '1px solid #7DD3FC' }}
                />
              )}
              {isCompleted && (
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: '12px !important', color: '#059669 !important' }} />}
                  label="Завершен"
                  size="small"
                  sx={{ height: 22, fontWeight: 700, fontSize: '0.7rem', bgcolor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}
                />
              )}
              {item.status === 'scheduled' && (
                <Chip
                  label="Запланирован"
                  size="small"
                  sx={{ height: 22, fontWeight: 600, fontSize: '0.7rem', bgcolor: '#F8FAFC', color: '#64748B', border: '1px solid #CBD5E1' }}
                />
              )}
              {isCito && (
                <Chip
                  icon={<FlashOnIcon sx={{ fontSize: '12px !important', color: '#DC2626 !important' }} />}
                  label="CITO!"
                  size="small"
                  sx={{ height: 22, fontWeight: 800, fontSize: '0.7rem', bgcolor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}
                />
              )}
            </Box>
          </Box>

          {/* Информация о пациенте */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', letterSpacing: '-0.2px' }}>
                {item.patient_name}
              </Typography>
              <Chip
                label={item.patient_sex === 'М' ? 'М' : 'Ж'}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: item.patient_sex === 'М' ? '#E0F2FE' : '#FCE7F3',
                  color: item.patient_sex === 'М' ? '#0284C7' : '#DB2777'
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.82rem' }}>
                {item.patient_age ? `${item.patient_age} лет` : ''}
              </Typography>
              <Chip
                label={`№ ${item.patient_mednum || item.patient_id}`}
                size="small"
                sx={{ height: 18, fontSize: '0.68rem', fontWeight: 600, bgcolor: '#F1F5F9', color: '#475569' }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
              {item.patient_phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  <PhoneIcon sx={{ fontSize: 13, color: '#64748B' }} />
                  <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.78rem' }}>
                    {item.patient_phone}
                  </Typography>
                </Box>
              )}
              {item.patient_dms && (
                <Chip
                  label={`ДМС: ${item.patient_dms}`}
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#FEF3C7', color: '#92400E' }}
                />
              )}
              {selectedDoctorId === 'all' && (
                <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600, fontSize: '0.76rem' }}>
                  Врач: {item.doctor_name}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Клинический профиль (сустав, повод, примечания) */}
          <Box>
            <Chip
              label={jointCfg.label}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 700,
                bgcolor: jointCfg.bg,
                color: jointCfg.color,
                border: `1px solid ${jointCfg.color}40`,
                mb: 0.5
              }}
            />
            {item.notes && (
              <Typography
                variant="caption"
                sx={{
                  color: '#475569',
                  fontSize: '0.76rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.3
                }}
              >
                {item.notes.replace('[TEST_DAEMON] ', '')}
              </Typography>
            )}
          </Box>

          {/* Кнопка действия */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="contained"
              size="medium"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
              onClick={(e) => {
                e.stopPropagation();
                onSelectAppointment(item);
              }}
              sx={{
                bgcolor: isInProgress ? '#0284C7' : isWaiting ? '#16A34A' : isCompleted ? '#059669' : '#0F3C64',
                fontWeight: 700,
                fontSize: '0.8rem',
                textTransform: 'none',
                borderRadius: 2,
                py: 0.8,
                px: 2,
                boxShadow: 'none',
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: isInProgress ? '#0369A1' : isWaiting ? '#15803D' : isCompleted ? '#047857' : '#0284C7'
                }
              }}
            >
              {isInProgress ? 'Продолжить осмотр' : isWaiting ? 'Начать прием' : isCompleted ? 'Протокол осмотра' : 'Принять'}
            </Button>

            {isWaiting && (
              <Button
                variant="text"
                size="small"
                onClick={(e) => handleUpdateStatus(item, 'in_progress', e)}
                sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#0284C7', fontWeight: 600, py: 0 }}
              >
                Вызвать в кабинет
              </Button>
            )}
          </Box>
        </Box>
      </Card>
    );
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* 1. Верхний информационный банер кабинета врача */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0F3C64 0%, #1E293B 100%)',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px rgba(15, 60, 100, 0.16)'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                bgcolor: 'rgba(56, 189, 248, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56, 189, 248, 0.35)'
              }}
            >
              <LocalHospitalIcon sx={{ color: '#38BDF8', fontSize: 30 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.3px', color: '#FFFFFF' }}>
                  АРМ врача-ортопеда: Очередь приема
                </Typography>
                <Chip
                  icon={<MeetingRoomIcon sx={{ fontSize: '14px !important', color: '#0F3C64 !important' }} />}
                  label="Кабинет №1"
                  size="small"
                  sx={{
                    bgcolor: '#BAE6FD',
                    color: '#0369A1',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: 22
                  }}
                />
                {isAdmin && (
                  <Chip
                    icon={<AdminPanelSettingsIcon sx={{ fontSize: '14px !important', color: '#FFFFFF !important' }} />}
                    label="Режим Администратора"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(234, 179, 8, 0.25)',
                      color: '#FDE047',
                      border: '1px solid rgba(253, 224, 71, 0.4)',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 22
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 0.3, fontSize: '0.88rem' }}>
                Врач: <strong>{activeDoctorName}</strong> • Очередь пациентов, статус ожидания в холле и клинический осмотр
              </Typography>
            </Box>
          </Box>

          {/* Правая часть: Селектор врача (для администратора) и кнопка поиска по картотеке */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', alignSelf: { xs: 'stretch', md: 'auto' } }}>
            {isAdmin && (
              <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'rgba(255, 255, 255, 0.08)', borderRadius: 2 }}>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.8rem' }}>Врач клиники</InputLabel>
                <Select
                  value={selectedDoctorId}
                  label="Врач клиники"
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  sx={{
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#38BDF8' },
                    '.MuiSvgIcon-root': { color: '#FFFFFF' }
                  }}
                >
                  <MenuItem value="all">
                    <em>Все врачи клиники (Сводно)</em>
                  </MenuItem>
                  {doctorsList.map((doc) => (
                    <MenuItem key={doc.id} value={String(doc.id)}>
                      {doc.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Button
              variant="contained"
              startIcon={<PersonSearchIcon />}
              onClick={() => setPatientModalOpen(true)}
              sx={{
                bgcolor: '#0284C7',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.82rem',
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
                py: 0.9,
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                '&:hover': { bgcolor: '#0369A1' }
              }}
            >
              Картотека всех пациентов
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 2. Быстрый навигатор дат: 5 дней (21.10 - 25.10) + все записанные (collapsed) + календарь */}
      <Paper elevation={0} sx={{ p: 1.5, mb: 3, borderRadius: 2.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          {/* Левая часть: полоса быстрых чипов */}
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 0.5, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', mr: 0.5, display: { xs: 'none', lg: 'block' } }}>
              Дата приема:
            </Typography>

            {/* Чипы на 5 дней (21.10 – 25.10) */}
            {FIVE_DAYS.map((d) => {
              const isSelected = selectedDate === d.date;
              const count = dayCounts[d.date];
              return (
                <Chip
                  key={d.date}
                  icon={<CalendarMonthIcon sx={{ fontSize: '15px !important', color: isSelected ? '#FFFFFF !important' : '#0F3C64 !important' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <span>{d.label}</span>
                      {count !== undefined && (
                        <Box
                          component="span"
                          sx={{
                            bgcolor: isSelected ? 'rgba(255, 255, 255, 0.28)' : '#E2E8F0',
                            color: isSelected ? '#FFFFFF' : '#334155',
                            borderRadius: '10px',
                            px: 0.8,
                            py: 0.1,
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            lineHeight: 1.2
                          }}
                        >
                          {count}
                        </Box>
                      )}
                    </Box>
                  }
                  clickable
                  onClick={() => setSelectedDate(d.date)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    py: 2.1,
                    px: 0.8,
                    borderRadius: 2,
                    bgcolor: isSelected ? '#0F3C64' : '#F8FAFC',
                    color: isSelected ? '#FFFFFF' : '#334155',
                    border: isSelected ? '1px solid #0F3C64' : '1px solid #E2E8F0',
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': {
                      bgcolor: isSelected ? '#0F3C64' : '#E2E8F0'
                    }
                  }}
                />
              );
            })}

            {/* Чип: Все записанные (collapsed) */}
            {(() => {
              const isAll = selectedDate === 'all';
              const totalCount = dayCounts['all'] !== undefined ? dayCounts['all'] : queue.length;
              return (
                <Chip
                  icon={<DateRangeIcon sx={{ fontSize: '16px !important', color: isAll ? '#FFFFFF !important' : '#0284C7 !important' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <span>Все записанные</span>
                      <Box
                        component="span"
                        sx={{
                          bgcolor: isAll ? 'rgba(255, 255, 255, 0.28)' : '#BAE6FD',
                          color: isAll ? '#FFFFFF' : '#0369A1',
                          borderRadius: '10px',
                          px: 0.8,
                          py: 0.1,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          lineHeight: 1.2
                        }}
                      >
                        {totalCount}
                      </Box>
                    </Box>
                  }
                  clickable
                  onClick={() => setSelectedDate('all')}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    py: 2.1,
                    px: 0.8,
                    borderRadius: 2,
                    bgcolor: isAll ? '#0284C7' : '#F0F9FF',
                    color: isAll ? '#FFFFFF' : '#0369A1',
                    border: isAll ? '1px solid #0284C7' : '1px solid #BAE6FD',
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': {
                      bgcolor: isAll ? '#0284C7' : '#E0F2FE'
                    }
                  }}
                />
              );
            })()}

            {/* Индикатор произвольной даты из календаря */}
            {isCustomDate && (
              <Chip
                icon={<TodayIcon sx={{ fontSize: '15px !important', color: '#FFFFFF !important' }} />}
                label={`Календарь: ${selectedDate}`}
                onDelete={() => setSelectedDate('2026-10-21')}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  py: 2.1,
                  px: 0.8,
                  borderRadius: 2,
                  bgcolor: '#334155',
                  color: '#FFFFFF',
                  '.MuiChip-deleteIcon': { color: '#E2E8F0', '&:hover': { color: '#FFFFFF' } }
                }}
              />
            )}
          </Stack>

          {/* Правая часть: Сводка по датам, Интерактивный Календарь, выбор даты и обновление */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TableChartIcon sx={{ fontSize: 18 }} />}
              onClick={() => setSummaryModalOpen(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                borderRadius: 2,
                borderColor: '#CBD5E1',
                color: '#0F3C64',
                py: 0.7,
                px: 1.5,
                bgcolor: '#FFFFFF',
                '&:hover': {
                  bgcolor: '#F1F5F9',
                  borderColor: '#0F3C64'
                }
              }}
            >
              Сводка по датам
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
              onClick={() => setCalendarModalOpen(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                borderRadius: 2,
                bgcolor: '#0F3C64',
                color: '#FFFFFF',
                py: 0.7,
                px: 1.5,
                boxShadow: '0 2px 8px rgba(15, 60, 100, 0.25)',
                '&:hover': {
                  bgcolor: '#1E293B'
                }
              }}
            >
              Календарь записей
            </Button>

            <TextField
              type="date"
              size="small"
              value={selectedDate === 'all' ? '' : selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              title="Выбрать произвольную дату"
              sx={{
                width: 140,
                bgcolor: isCustomDate ? '#F8FAFC' : '#FFFFFF',
                borderRadius: 2,
                '& input': { fontSize: '0.82rem', fontWeight: 600, py: 0.75 }
              }}
            />
            <Tooltip title="Обновить очередь">
              <IconButton onClick={fetchQueue} disabled={loading} sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}>
                <RefreshIcon sx={{ color: '#0F3C64' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* 3. KPI Карточки сводки приема */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(5, 1fr)'
          },
          gap: 2,
          mb: 3
        }}
      >
        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
            {selectedDate === 'all' ? 'Всего по записи (все дни)' : 'Всего по записи'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              {kpis.total}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              пациентов
            </Typography>
          </Box>
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: '1px solid #BBF7D0',
            bgcolor: '#F0FDF4',
            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.08)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Ожидают в холле
            </Typography>
            {kpis.waiting > 0 && (
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: '#22C55E',
                  boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.25)'
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#15803D' }}>
              {kpis.waiting}
            </Typography>
            <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>
              готов к приему
            </Typography>
          </Box>
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: '1px solid #BAE6FD',
            bgcolor: '#F0F9FF',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)'
          }}
        >
          <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
            Идет прием
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0284C7' }}>
              {kpis.in_progress}
            </Typography>
            <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600 }}>
              в кабинете
            </Typography>
          </Box>
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
            Завершено
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#059669' }}>
              {kpis.completed}
            </Typography>
            <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
              протокол готов
            </Typography>
          </Box>
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: kpis.cito > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
            bgcolor: kpis.cito > 0 ? '#FEF2F2' : '#FFFFFF',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {kpis.cito > 0 && <FlashOnIcon sx={{ color: '#DC2626', fontSize: 16 }} />}
            <Typography variant="caption" sx={{ color: kpis.cito > 0 ? '#B91C1C' : '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
              CITO / Экстренные
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: kpis.cito > 0 ? '#DC2626' : '#64748B' }}>
              {kpis.cito}
            </Typography>
            <Typography variant="caption" sx={{ color: kpis.cito > 0 ? '#EF4444' : '#94A3B8', fontWeight: 600 }}>
              {kpis.cito > 0 ? 'требует внимания' : 'нет срочных'}
            </Typography>
          </Box>
        </Card>
      </Box>

      {/* 4. Поисково-фильтрационная панель очереди */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2 }}>
          <TextField
            size="small"
            placeholder="Быстрый фильтр в очереди (ФИО, жалоба, сустав, № карты, дата)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#64748B' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, fontSize: '0.88rem', minWidth: { md: 360 } }
              }
            }}
          />

          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Chip
              label={`Все (${queue.length})`}
              clickable
              onClick={() => setFilterStatus('all')}
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                bgcolor: filterStatus === 'all' ? '#0F3C64' : '#F1F5F9',
                color: filterStatus === 'all' ? '#FFFFFF' : '#475569'
              }}
            />
            <Chip
              icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#16A34A !important' }} />}
              label={`В холле (${kpis.waiting})`}
              clickable
              onClick={() => setFilterStatus('waiting')}
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                bgcolor: filterStatus === 'waiting' ? '#16A34A' : '#F0FDF4',
                color: filterStatus === 'waiting' ? '#FFFFFF' : '#166534',
                border: '1px solid #BBF7D0'
              }}
            />
            <Chip
              icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#0284C7 !important' }} />}
              label={`На приеме (${kpis.in_progress})`}
              clickable
              onClick={() => setFilterStatus('in_progress')}
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                bgcolor: filterStatus === 'in_progress' ? '#0284C7' : '#F0F9FF',
                color: filterStatus === 'in_progress' ? '#FFFFFF' : '#0369A1',
                border: '1px solid #BAE6FD'
              }}
            />
            <Chip
              label={`Запланированы (${kpis.scheduled})`}
              clickable
              onClick={() => setFilterStatus('scheduled')}
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                bgcolor: filterStatus === 'scheduled' ? '#64748B' : '#F8FAFC',
                color: filterStatus === 'scheduled' ? '#FFFFFF' : '#64748B',
                border: '1px solid #E2E8F0'
              }}
            />
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: filterStatus === 'completed' ? '#FFFFFF !important' : '#059669 !important' }} />}
              label={`Завершены (${kpis.completed})`}
              clickable
              onClick={() => setFilterStatus('completed')}
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                bgcolor: filterStatus === 'completed' ? '#059669' : '#ECFDF5',
                color: filterStatus === 'completed' ? '#FFFFFF' : '#065F46',
                border: '1px solid #A7F3D0'
              }}
            />
          </Stack>
        </Box>
      </Paper>

      {/* 5. Карточки очереди пациентов */}
      {loading ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3, border: '1px solid #E2E8F0' }}>
          <CircularProgress size={42} sx={{ color: '#0F3C64', mb: 2 }} />
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#475569' }}>
            {selectedDate === 'all' ? 'Загрузка списка всех записанных пациентов...' : `Загрузка очереди приемов на ${selectedDate}...`}
          </Typography>
        </Paper>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2.5, mb: 3 }}>
          {error}
        </Alert>
      ) : filteredQueue.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <AccessTimeIcon sx={{ fontSize: 50, color: '#CBD5E1', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
            В очереди нет пациентов по выбранным фильтрам
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 450, mx: 'auto', mt: 0.5, mb: 2.5 }}>
            {selectedDate === 'all'
              ? 'На ближайшие дни приемы отсутствуют или не соответствуют выбранному фильтру.'
              : `На дату ${selectedDate} приемы отсутствуют или не соответствуют выбранному фильтру.`}
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonSearchIcon />}
            onClick={() => setPatientModalOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0F3C64', borderRadius: 2 }}
          >
            Выбрать пациента из картотеки
          </Button>
        </Paper>
      ) : selectedDate === 'all' ? (
        /* Режим: Все записанные (сгруппировано по дням с аккордеоном) */
        <Box>
          {/* Панель управления аккордеонами дат */}
          <Paper
            elevation={0}
            sx={{
              p: 1.8,
              mb: 2.5,
              borderRadius: 2.5,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 1.5
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                Все записанные пациенты ({filteredQueue.length})
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Сегодня развернуто по умолчанию, последующие дни свернуты для удобного обзора
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<UnfoldMoreIcon sx={{ fontSize: 16 }} />}
                onClick={expandAllDays}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', borderRadius: 1.8, borderColor: '#CBD5E1', color: '#334155' }}
              >
                Развернуть все
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<UnfoldLessIcon sx={{ fontSize: 16 }} />}
                onClick={collapseAllDays}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', borderRadius: 1.8, borderColor: '#CBD5E1', color: '#334155' }}
              >
                Свернуть все
              </Button>
            </Stack>
          </Paper>

          {/* Список групп по дням */}
          <Stack spacing={2.5}>
            {sortedGroupDates.map((dateStr) => {
              const dayItems = groupedQueue[dateStr] || [];
              const dateMeta = formatRussianDate(dateStr);
              const isExpanded = !!expandedDays[dateStr];

              // Сводка по статусам для заголовка дня
              const dayWaiting = dayItems.filter((i) => i.status === 'waiting').length;
              const dayInProgress = dayItems.filter((i) => i.status === 'in_progress').length;
              const dayCompleted = dayItems.filter((i) => ['completed', 'protocol_signed'].includes(i.status)).length;
              const dayCito = dayItems.filter((i) => i.urgency_level === 'cito').length;

              return (
                <Card
                  key={dateStr}
                  elevation={0}
                  sx={{
                    borderRadius: 2.5,
                    border: dateMeta.isToday ? '2px solid #0F3C64' : '1px solid #E2E8F0',
                    bgcolor: '#FFFFFF',
                    overflow: 'hidden',
                    boxShadow: dateMeta.isToday ? '0 4px 16px rgba(15, 60, 100, 0.08)' : '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  {/* Заголовок группы дня (Кликабельный) */}
                  <Box
                    onClick={() => toggleDay(dateStr)}
                    sx={{
                      p: 2,
                      bgcolor: dateMeta.isToday ? 'rgba(15, 60, 100, 0.04)' : '#F8FAFC',
                      borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      alignItems: { xs: 'flex-start', md: 'center' },
                      justifyContent: 'space-between',
                      gap: 1.5,
                      transition: 'background-color 0.15s',
                      '&:hover': {
                        bgcolor: dateMeta.isToday ? 'rgba(15, 60, 100, 0.08)' : '#F1F5F9'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 2,
                          bgcolor: dateMeta.isToday ? '#0F3C64' : '#E2E8F0',
                          color: dateMeta.isToday ? '#FFFFFF' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {dateMeta.isToday ? <TodayIcon sx={{ fontSize: 22 }} /> : <CalendarMonthIcon sx={{ fontSize: 20 }} />}
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dateMeta.isToday ? '#0F3C64' : '#1E293B' }}>
                            {dateMeta.title}
                          </Typography>
                          <Chip
                            label={`${dayItems.length} пациентов`}
                            size="small"
                            sx={{
                              height: 22,
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              bgcolor: dateMeta.isToday ? '#0F3C64' : '#E2E8F0',
                              color: dateMeta.isToday ? '#FFFFFF' : '#334155'
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Дата: {dateStr}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Правая часть: бейджи статусов на день + шеврон */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', alignSelf: { xs: 'stretch', md: 'auto' }, justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap' }}>
                        {dayWaiting > 0 && (
                          <Chip
                            size="small"
                            label={`${dayWaiting} в холле`}
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#DCFCE7', color: '#15803D' }}
                          />
                        )}
                        {dayInProgress > 0 && (
                          <Chip
                            size="small"
                            label={`${dayInProgress} на приеме`}
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#E0F2FE', color: '#0369A1' }}
                          />
                        )}
                        {dayCito > 0 && (
                          <Chip
                            size="small"
                            label={`${dayCito} CITO`}
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#FEE2E2', color: '#991B1B' }}
                          />
                        )}
                        {dayCompleted > 0 && (
                          <Chip
                            size="small"
                            label={`${dayCompleted} завершено`}
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#ECFDF5', color: '#065F46' }}
                          />
                        )}
                      </Stack>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {isExpanded ? 'Свернуть' : 'Развернуть'}
                        </Typography>
                        {isExpanded ? <KeyboardArrowUpIcon sx={{ fontSize: 20 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 20 }} />}
                      </Box>
                    </Box>
                  </Box>

                  {/* Тело группы дня (раскрывается/сворачивается) */}
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit={false}>
                    <Box sx={{ p: 2 }}>
                      <Stack spacing={1.5}>
                        {dayItems.map((item) => renderAppointmentCard(item, false))}
                      </Stack>
                    </Box>
                  </Collapse>
                </Card>
              );
            })}
          </Stack>
        </Box>
      ) : (
        /* Режим: Конкретная дата (обычный плоский список) */
        <Stack spacing={2}>
          {filteredQueue.map((item) => renderAppointmentCard(item, false))}
        </Stack>
      )}

      {/* Модальное окно поиска любого пациента из всей картотеки */}
      <FullPatientSearchModal
        open={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSelectPatient={(patient) => {
          setPatientModalOpen(false);
          onSelectPatientDirectly(patient);
        }}
      />

      {/* Модальное окно: Сводные данные по всем записанным по датам и всего */}
      <QueueSummaryModal
        open={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        dayBreakdown={dayBreakdown}
        totalSummary={totalSummary}
        doctorName={activeDoctorName}
        onSelectDate={(date) => setSelectedDate(date)}
        onOpenCalendar={() => setCalendarModalOpen(true)}
      />

      {/* Форма: Интерактивный календарь приемов по всем записанным по датам */}
      <QueueCalendarModal
        open={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        selectedDoctorId={selectedDoctorId}
        doctorName={activeDoctorName}
        onSelectAppointment={onSelectAppointment}
        onSelectDate={(date) => setSelectedDate(date)}
        dayCounts={dayCounts}
        initialDate={selectedDate === 'all' ? '2026-10-21' : selectedDate}
      />
    </Box>
  );
}
