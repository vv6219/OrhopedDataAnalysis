import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Card,
  Stack,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { API_BASE_URL } from '../../config/apiConfig';
import { type QueueItem } from './DoctorQueueHub';

interface QueueCalendarModalProps {
  open: boolean;
  onClose: () => void;
  selectedDoctorId: string;
  doctorName: string;
  onSelectAppointment: (appointment: QueueItem) => void;
  onSelectDate: (date: string) => void;
  dayCounts?: Record<string, number>;
  initialDate?: string;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
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

export default function QueueCalendarModal({
  open,
  onClose,
  selectedDoctorId,
  doctorName,
  onSelectAppointment,
  onSelectDate,
  dayCounts: initialDayCounts = {},
  initialDate = '2026-10-21'
}: QueueCalendarModalProps) {
  // Выбранная дата для просмотра пациентов в календаре
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(initialDate);

  // Текущий отображаемый месяц и год (по умолчанию Октябрь 2026)
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(9); // 0-indexed: 9 = Октябрь

  // Все загруженные приемы и сводка по дням
  const [allAppointments, setAllAppointments] = useState<QueueItem[]>([]);
  const [calendarDayCounts, setCalendarDayCounts] = useState<Record<string, number>>(initialDayCounts);
  const [dayStatsMap, setDayStatsMap] = useState<Record<string, { waiting: number; in_progress: number; cito: number }>>({});
  const [loading, setLoading] = useState(false);

  // Фильтр поиска по пациентам выбранного дня
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка всех записанных пациентов при открытии модального окна
  const loadAllAppointments = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const qParams = new URLSearchParams({
        date: 'all',
        doctorId: selectedDoctorId
      });
      const res = await fetch(`${API_BASE_URL}/api/ortho/queue?${qParams.toString()}`);
      if (!res.ok) throw new Error('Ошибка загрузки данных календаря');
      const data = await res.json();
      if (data.success) {
        const queue: QueueItem[] = data.queue || [];
        setAllAppointments(queue);
        if (data.dayCounts) {
          setCalendarDayCounts(data.dayCounts);
        }

        // Подсчитаем быстрые маркеры по каждому дню
        const stats: Record<string, { waiting: number; in_progress: number; cito: number }> = {};
        queue.forEach((item) => {
          const d = item.appointment_date;
          if (!d) return;
          if (!stats[d]) stats[d] = { waiting: 0, in_progress: 0, cito: 0 };
          if (item.status === 'waiting') stats[d].waiting++;
          if (item.status === 'in_progress') stats[d].in_progress++;
          if (item.urgency_level === 'cito') stats[d].cito++;
        });
        setDayStatsMap(stats);
      }
    } catch (err) {
      console.error('Error loading calendar appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [open, selectedDoctorId]);

  useEffect(() => {
    if (open) {
      loadAllAppointments();
      if (initialDate) {
        setSelectedCalendarDate(initialDate);
        const [y, m] = initialDate.split('-').map(Number);
        if (y && m) {
          setViewYear(y);
          setViewMonth(m - 1);
        }
      }
    }
  }, [open, loadAllAppointments, initialDate]);

  // Переключение месяца
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    setViewYear(2026);
    setViewMonth(9); // Октябрь
    setSelectedCalendarDate('2026-10-21');
  };

  // Расчет сетки дней для выбранного месяца (понедельник - первый день недели)
  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    // В JS 0 - Вс, 1 - Пн ... 6 - Сб. Переводим в формат: 0 - Пн ... 6 - Вс
    const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const cells: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      count: number;
      stats?: { waiting: number; in_progress: number; cito: number };
      isToday: boolean;
      isSelected: boolean;
    } | null> = [];

    // Пустые ячейки до 1-го числа
    for (let i = 0; i < mondayOffset; i++) {
      cells.push(null);
    }

    // Дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${viewYear}-${mStr}-${dStr}`;
      const count = calendarDayCounts[dateStr] || 0;
      const stats = dayStatsMap[dateStr];
      const isToday = dateStr === '2026-10-21';
      const isSelected = dateStr === selectedCalendarDate;

      cells.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        count,
        stats,
        isToday,
        isSelected
      });
    }

    return cells;
  }, [viewYear, viewMonth, calendarDayCounts, dayStatsMap, selectedCalendarDate]);

  // Пациенты выбранного в календаре дня
  const activeDayAppointments = useMemo(() => {
    const list = allAppointments.filter((a) => a.appointment_date === selectedCalendarDate);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) => {
      const matchName = (item.patient_name || '').toLowerCase().includes(q);
      const matchNote = (item.notes || '').toLowerCase().includes(q);
      const matchJoint = (item.joint_area || '').toLowerCase().includes(q);
      const matchMednum = String(item.patient_mednum || '').includes(q);
      return matchName || matchNote || matchJoint || matchMednum;
    });
  }, [allAppointments, selectedCalendarDate, searchQuery]);

  // Заголовок выбранной даты
  const activeDateTitle = useMemo(() => {
    if (!selectedCalendarDate) return '';
    const parts = selectedCalendarDate.split('-');
    if (parts.length !== 3) return selectedCalendarDate;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    const dt = new Date(y, m - 1, d);
    const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const isToday = selectedCalendarDate === '2026-10-21';
    return isToday
      ? `Сегодня, ${d} ${months[dt.getMonth()]} (${weekdays[dt.getDay()]})`
      : `${d} ${months[dt.getMonth()]} ${y}, ${weekdays[dt.getDay()]}`;
  }, [selectedCalendarDate]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            width: '100%',
            maxWidth: '1180px',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(15, 60, 100, 0.28)',
            maxHeight: '92vh'
          }
        }
      }}
    >
      {/* 1. Верхний заголовок формы */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #0F3C64 0%, #1E293B 100%)',
          color: '#FFFFFF',
          p: 2.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              bgcolor: 'rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.4)'
            }}
          >
            <CalendarMonthIcon sx={{ color: '#38BDF8', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
              Интерактивный календарь приемов
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem' }}>
              Врач: <strong>{doctorName}</strong> • Выберите дату для мгновенного просмотра списка пациентов
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#FFFFFF', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.15)' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* 2. Основное тело: две колонки (слева Календарь, справа Список пациентов) */}
      <DialogContent sx={{ p: 0, bgcolor: '#F8FAFC' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '430px 1fr' },
            minHeight: 560
          }}
        >
          {/* ЛЕВАЯ ПАНЕЛЬ: Календарная сетка месяца */}
          <Box
            sx={{
              p: 2.5,
              borderRight: { xs: 'none', md: '1px solid #E2E8F0' },
              borderBottom: { xs: '1px solid #E2E8F0', md: 'none' },
              bgcolor: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              {/* Панель переключения месяцев */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.3px' }}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<TodayIcon sx={{ fontSize: 16 }} />}
                    onClick={handleJumpToToday}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      py: 0.4,
                      px: 1.2,
                      borderRadius: 1.8,
                      borderColor: '#CBD5E1',
                      color: '#0F3C64'
                    }}
                  >
                    Сегодня
                  </Button>
                  <IconButton size="small" onClick={handlePrevMonth} sx={{ bgcolor: '#F1F5F9' }}>
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={handleNextMonth} sx={{ bgcolor: '#F1F5F9' }}>
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Дни недели */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  textAlign: 'center',
                  mb: 1.2
                }}
              >
                {WEEKDAYS.map((wd, idx) => (
                  <Typography
                    key={wd}
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      color: idx >= 5 ? '#E11D48' : '#64748B',
                      textTransform: 'uppercase'
                    }}
                  >
                    {wd}
                  </Typography>
                ))}
              </Box>

              {/* Сетка ячеек дней месяца */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 0.8
                }}
              >
                {calendarGrid.map((cell, idx) => {
                  if (!cell) {
                    return <Box key={`empty-${idx}`} sx={{ height: 60 }} />;
                  }

                  const hasAppointments = cell.count > 0;
                  const isSelected = cell.isSelected;
                  const isToday = cell.isToday;

                  return (
                    <Box
                      key={cell.dateStr}
                      onClick={() => setSelectedCalendarDate(cell.dateStr)}
                      sx={{
                        height: 60,
                        borderRadius: 2,
                        p: 0.6,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                        bgcolor: isSelected
                          ? '#0F3C64'
                          : hasAppointments
                          ? '#F0F9FF'
                          : '#FFFFFF',
                        border: isSelected
                          ? '2px solid #0F3C64'
                          : isToday
                          ? '2px solid #38BDF8'
                          : hasAppointments
                          ? '1px solid #BAE6FD'
                          : '1px solid #F1F5F9',
                        boxShadow: isSelected
                          ? '0 4px 14px rgba(15, 60, 100, 0.28)'
                          : 'none',
                        '&:hover': {
                          bgcolor: isSelected ? '#0F3C64' : '#E2E8F0',
                          transform: 'scale(1.03)'
                        }
                      }}
                    >
                      {/* Верх: Число дня и маркер Сегодня */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <Typography
                          sx={{
                            fontWeight: isSelected || isToday ? 800 : 600,
                            fontSize: '0.85rem',
                            color: isSelected ? '#FFFFFF' : isToday ? '#0284C7' : '#1E293B',
                            lineHeight: 1
                          }}
                        >
                          {cell.dayNum}
                        </Typography>
                      </Box>

                      {/* Низ: Бейдж с количеством пациентов и цветные точки */}
                      {hasAppointments ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 0.3 }}>
                          <Box
                            sx={{
                              bgcolor: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#0284C7',
                              color: '#FFFFFF',
                              borderRadius: '8px',
                              px: 0.7,
                              py: 0.1,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              lineHeight: 1
                            }}
                          >
                            {cell.count}
                          </Box>

                          {/* Цветные индикаторы статусов */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, height: 6 }}>
                            {cell.stats && cell.stats.waiting > 0 && (
                              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#22C55E' }} />
                            )}
                            {cell.stats && cell.stats.in_progress > 0 && (
                              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#38BDF8' }} />
                            )}
                            {cell.stats && cell.stats.cito > 0 && (
                              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#EF4444' }} />
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ height: 16 }} />
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Легенда маркеров календаря */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem', display: 'block', mb: 1 }}>
                Обозначения маркеров
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22C55E' }} />
                  <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>В холле</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#38BDF8' }} />
                  <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>На приеме</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#EF4444' }} />
                  <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>CITO!</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '6px', bgcolor: '#0284C7', color: '#fff', fontSize: '0.62rem', fontWeight: 800, textAlign: 'center', lineHeight: '14px' }}>N</Box>
                  <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>Кол-во записей</Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          {/* ПРАВАЯ ПАНЕЛЬ: Список пациентов на выбранную дату */}
          <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F8FAFC' }}>
            {/* Заголовок панели списка пациентов */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.2px' }}>
                    {activeDateTitle}
                  </Typography>
                  <Chip
                    label={`${activeDayAppointments.length} пациентов`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 22,
                      bgcolor: activeDayAppointments.length > 0 ? '#0F3C64' : '#E2E8F0',
                      color: activeDayAppointments.length > 0 ? '#FFFFFF' : '#64748B'
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Нажмите на пациента, чтобы сразу перейти к приему
                </Typography>
              </Box>

              {activeDayAppointments.length > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    onSelectDate(selectedCalendarDate);
                    onClose();
                  }}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    borderRadius: 2,
                    borderColor: '#0284C7',
                    color: '#0284C7'
                  }}
                >
                  Открыть в основной очереди
                </Button>
              )}
            </Box>

            {/* Фильтр поиска по списку дня */}
            <TextField
              size="small"
              placeholder="Поиск по пациентам на этот день (ФИО, жалоба, № карты)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#64748B', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: '#FFFFFF', fontSize: '0.85rem', mb: 2 }
                }
              }}
            />

            {/* Контейнер карточек пациентов */}
            <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
              {loading ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <CircularProgress size={36} sx={{ color: '#0F3C64', mb: 1.5 }} />
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Загрузка приемов...</Typography>
                </Box>
              ) : activeDayAppointments.length === 0 ? (
                <Card
                  elevation={0}
                  sx={{
                    p: 5,
                    textAlign: 'center',
                    borderRadius: 2.5,
                    border: '1px dashed #CBD5E1',
                    bgcolor: '#FFFFFF',
                    mt: 2
                  }}
                >
                  <EventAvailableIcon sx={{ fontSize: 44, color: '#CBD5E1', mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                    На дату {selectedCalendarDate} приемы отсутствуют
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                    Выберите в календаре слева дату с синим бейджем (например, 21.10 – 25.10).
                  </Typography>
                </Card>
              ) : (
                <Stack spacing={1.5}>
                  {activeDayAppointments.map((item) => {
                    const jointCfg = JOINT_COLORS[item.joint_area] || { bg: '#F1F5F9', color: '#475569', label: item.joint_area || 'Сустав не указан' };
                    const isWaiting = item.status === 'waiting';
                    const isInProgress = item.status === 'in_progress';
                    const isCompleted = ['completed', 'protocol_signed'].includes(item.status);
                    const isCito = item.urgency_level === 'cito';

                    let borderLeftColor = '#94A3B8';
                    if (isCito) borderLeftColor = '#DC2626';
                    else if (isInProgress) borderLeftColor = '#0284C7';
                    else if (isWaiting) borderLeftColor = '#16A34A';
                    else if (isCompleted) borderLeftColor = '#059669';

                    return (
                      <Card
                        key={item.id}
                        elevation={0}
                        onClick={() => {
                          onSelectAppointment(item);
                          onClose();
                        }}
                        sx={{
                          p: 1.8,
                          borderRadius: 2,
                          bgcolor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderLeft: `4px solid ${borderLeftColor}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                            borderColor: '#CBD5E1'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
                          {/* Время и статус */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                p: 0.8,
                                borderRadius: 1.5,
                                bgcolor: isInProgress ? '#E0F2FE' : isWaiting ? '#DCFCE7' : '#F1F5F9',
                                textAlign: 'center',
                                minWidth: 65
                              }}
                            >
                              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: isInProgress ? '#0284C7' : isWaiting ? '#15803D' : '#1E293B', lineHeight: 1 }}>
                                {item.start_time}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                                до {item.end_time}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                              {isWaiting && (
                                <Chip
                                  icon={<FiberManualRecordIcon sx={{ fontSize: '9px !important', color: '#16A34A !important' }} />}
                                  label={item.arrival_time ? `В холле (${item.arrival_time.slice(0, 5)})` : 'В холле'}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#DCFCE7', color: '#15803D' }}
                                />
                              )}
                              {isInProgress && (
                                <Chip
                                  label="Идет прием"
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#E0F2FE', color: '#0369A1' }}
                                />
                              )}
                              {isCompleted && (
                                <Chip
                                  icon={<CheckCircleIcon sx={{ fontSize: '11px !important', color: '#059669 !important' }} />}
                                  label="Завершен"
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#ECFDF5', color: '#065F46' }}
                                />
                              )}
                              {item.status === 'scheduled' && (
                                <Chip
                                  label="Запланирован"
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, bgcolor: '#F8FAFC', color: '#64748B' }}
                                />
                              )}
                              {isCito && (
                                <Chip
                                  icon={<FlashOnIcon sx={{ fontSize: '11px !important', color: '#DC2626 !important' }} />}
                                  label="CITO!"
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, bgcolor: '#FEE2E2', color: '#991B1B' }}
                                />
                              )}
                            </Box>
                          </Box>

                          {/* ФИО и данные пациента */}
                          <Box sx={{ flex: 1, minWidth: 200 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>
                                {item.patient_name}
                              </Typography>
                              <Chip
                                label={item.patient_sex === 'М' ? 'М' : 'Ж'}
                                size="small"
                                sx={{
                                  height: 17,
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  bgcolor: item.patient_sex === 'М' ? '#E0F2FE' : '#FCE7F3',
                                  color: item.patient_sex === 'М' ? '#0284C7' : '#DB2777'
                                }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                                {item.patient_age ? `${item.patient_age} л.` : ''}
                              </Typography>
                              <Chip
                                label={`№ ${item.patient_mednum || item.patient_id}`}
                                size="small"
                                sx={{ height: 17, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F1F5F9', color: '#475569' }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3, flexWrap: 'wrap' }}>
                              <Chip
                                label={jointCfg.label}
                                size="small"
                                sx={{
                                  height: 19,
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  bgcolor: jointCfg.bg,
                                  color: jointCfg.color
                                }}
                              />
                              {item.patient_phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                  <PhoneIcon sx={{ fontSize: 12, color: '#64748B' }} />
                                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                                    {item.patient_phone}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>

                          {/* Кнопка быстрого перехода к приему */}
                          <Button
                            variant="contained"
                            size="small"
                            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAppointment(item);
                              onClose();
                            }}
                            sx={{
                              bgcolor: isInProgress ? '#0284C7' : isWaiting ? '#16A34A' : isCompleted ? '#059669' : '#0F3C64',
                              color: '#FFFFFF',
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              borderRadius: 1.8,
                              py: 0.6,
                              px: 1.6,
                              boxShadow: 'none',
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                bgcolor: isInProgress ? '#0369A1' : isWaiting ? '#15803D' : isCompleted ? '#047857' : '#0284C7'
                              }
                            }}
                          >
                            {isInProgress ? 'Продолжить' : isWaiting ? 'Начать' : isCompleted ? 'Протокол' : 'Принять'}
                          </Button>
                        </Box>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
