import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
  Card,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TableChartIcon from '@mui/icons-material/TableChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

export interface DayBreakdownItem {
  appointment_date: string;
  total: number;
  waiting: number;
  in_progress: number;
  completed: number;
  scheduled: number;
  cito: number;
}

export interface TotalSummary {
  total: number;
  waiting: number;
  in_progress: number;
  completed: number;
  scheduled: number;
  cito: number;
}

interface QueueSummaryModalProps {
  open: boolean;
  onClose: () => void;
  dayBreakdown: DayBreakdownItem[];
  totalSummary: TotalSummary;
  doctorName: string;
  onSelectDate: (date: string) => void;
  onOpenCalendar: () => void;
}

// Форматирование даты
function formatSummaryDate(dateStr: string) {
  if (!dateStr) return { title: '', dayOfWeek: '', isToday: false };
  const parts = dateStr.split('-');
  if (parts.length !== 3) return { title: dateStr, dayOfWeek: '', isToday: false };
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const dt = new Date(y, m - 1, d);
  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const fullWeekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const isToday = dateStr === '2026-10-21';
  return {
    isToday,
    title: `${d} ${months[dt.getMonth()]} ${y}`,
    dayOfWeek: fullWeekdays[dt.getDay()],
    shortDay: weekdays[dt.getDay()]
  };
}

export default function QueueSummaryModal({
  open,
  onClose,
  dayBreakdown,
  totalSummary,
  doctorName,
  onSelectDate,
  onOpenCalendar
}: QueueSummaryModalProps) {
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
            maxWidth: '1140px',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(15, 60, 100, 0.28)'
          }
        }
      }}
    >
      {/* 1. Шапка модального окна */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #0F3C64 0%, #1E293B 100%)',
          color: '#FFFFFF',
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TableChartIcon sx={{ color: '#38BDF8', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
              Сводные данные по всем записанным
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem' }}>
              Врач: <strong>{doctorName}</strong> • Анализ приемов по датам и статусам
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#FFFFFF', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.15)' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
        {/* 2. Верхняя карточная сводка ИТОГО */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(6, 1fr)'
            },
            gap: 1.5,
            mb: 3
          }}
        >
          <Card
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid #CBD5E1',
              bgcolor: '#FFFFFF',
              textAlign: 'center'
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
              Всего по записи
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', mt: 0.5 }}>
              {totalSummary.total}
            </Typography>
          </Card>

          <Card
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid #BBF7D0',
              bgcolor: '#F0FDF4',
              textAlign: 'center'
            }}
          >
            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
              В холле
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#15803D', mt: 0.5 }}>
              {totalSummary.waiting}
            </Typography>
          </Card>

          <Card
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid #BAE6FD',
              bgcolor: '#F0F9FF',
              textAlign: 'center'
            }}
          >
            <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
              На приеме
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0284C7', mt: 0.5 }}>
              {totalSummary.in_progress}
            </Typography>
          </Card>

          <Card
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: totalSummary.cito > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
              bgcolor: totalSummary.cito > 0 ? '#FEF2F2' : '#FFFFFF',
              textAlign: 'center'
            }}
          >
            <Typography variant="caption" sx={{ color: totalSummary.cito > 0 ? '#B91C1C' : '#64748B', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
              CITO! Срочные
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: totalSummary.cito > 0 ? '#DC2626' : '#64748B', mt: 0.5 }}>
              {totalSummary.cito}
            </Typography>
          </Card>

          <Card
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              textAlign: 'center'
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
              Запланировано
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#475569', mt: 0.5 }}>
              {totalSummary.scheduled}
            </Typography>
          </Card>

          <Card
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid #A7F3D0',
              bgcolor: '#ECFDF5',
              textAlign: 'center'
            }}
          >
            <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
              Завершено
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#059669', mt: 0.5 }}>
              {totalSummary.completed}
            </Typography>
          </Card>
        </Box>

        {/* 3. Интерактивная сводная таблица по дням */}
        <TableContainer component={Card} elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #CBD5E1', overflowX: 'auto', bgcolor: '#FFFFFF' }}>
          <Table size="small" sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                <TableCell sx={{ fontWeight: 800, color: '#334155', py: 1.5, minWidth: 155, whiteSpace: 'nowrap' }}>Дата приема</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#334155', py: 1.5, minWidth: 130, whiteSpace: 'nowrap' }}>День недели</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#334155', py: 1.5, minWidth: 70, whiteSpace: 'nowrap' }}>Всего</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#166534', py: 1.5, minWidth: 95, whiteSpace: 'nowrap' }}>В холле</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#0369A1', py: 1.5, minWidth: 100, whiteSpace: 'nowrap' }}>На приеме</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#B91C1C', py: 1.5, minWidth: 85, whiteSpace: 'nowrap' }}>CITO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', py: 1.5, minWidth: 75, whiteSpace: 'nowrap' }}>План</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#047857', py: 1.5, minWidth: 85, whiteSpace: 'nowrap' }}>Готово</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#334155', py: 1.5, minWidth: 135, whiteSpace: 'nowrap', pr: 2.5 }}>Действие</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dayBreakdown.map((row) => {
                const dateMeta = formatSummaryDate(row.appointment_date);
                return (
                  <TableRow
                    key={row.appointment_date}
                    hover
                    sx={{
                      bgcolor: dateMeta.isToday ? 'rgba(15, 60, 100, 0.04)' : '#FFFFFF',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{dateMeta.title}</span>
                        {dateMeta.isToday && (
                          <Chip
                            label="Сегодня"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              bgcolor: '#0F3C64',
                              color: '#FFFFFF'
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{dateMeta.dayOfWeek}</TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      <Chip
                        label={row.total}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          height: 22,
                          bgcolor: '#E2E8F0',
                          color: '#0F172A'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      {row.waiting > 0 ? (
                        <Chip
                          icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#16A34A !important' }} />}
                          label={row.waiting}
                          size="small"
                          sx={{ height: 22, fontWeight: 700, bgcolor: '#DCFCE7', color: '#15803D' }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: '#94A3B8' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      {row.in_progress > 0 ? (
                        <Chip
                          label={row.in_progress}
                          size="small"
                          sx={{ height: 22, fontWeight: 700, bgcolor: '#E0F2FE', color: '#0369A1' }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: '#94A3B8' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      {row.cito > 0 ? (
                        <Chip
                          icon={<FlashOnIcon sx={{ fontSize: '12px !important', color: '#DC2626 !important' }} />}
                          label={row.cito}
                          size="small"
                          sx={{ height: 22, fontWeight: 800, bgcolor: '#FEE2E2', color: '#991B1B' }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: '#94A3B8' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {row.scheduled}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      {row.completed > 0 ? (
                        <Chip
                          label={row.completed}
                          size="small"
                          sx={{ height: 22, fontWeight: 700, bgcolor: '#ECFDF5', color: '#065F46' }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: '#94A3B8' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', pr: 2.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                        onClick={() => {
                          onSelectDate(row.appointment_date);
                          onClose();
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          borderRadius: 1.8,
                          borderColor: '#CBD5E1',
                          color: '#0F3C64',
                          px: 1.8,
                          py: 0.5,
                          whiteSpace: 'nowrap',
                          '&:hover': { bgcolor: '#0F3C64', color: '#FFFFFF', borderColor: '#0F3C64' }
                        }}
                      >
                        Перейти
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow sx={{ bgcolor: '#0F3C64' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem', py: 1.8, whiteSpace: 'nowrap' }}>
                  ИТОГО ПО ВСЕМ ДАТАМ
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                  {totalSummary.total}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#86EFAC', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                  {totalSummary.waiting}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#7DD3FC', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                  {totalSummary.in_progress}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#FCA5A5', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                  {totalSummary.cito}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#E2E8F0', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                  {totalSummary.scheduled}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#A7F3D0', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                  {totalSummary.completed}
                </TableCell>
                <TableCell align="right" sx={{ color: '#FFFFFF', whiteSpace: 'nowrap', pr: 2.5 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      onSelectDate('all');
                      onClose();
                    }}
                    sx={{
                      bgcolor: '#0284C7',
                      color: '#FFFFFF',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      borderRadius: 1.8,
                      px: 2,
                      py: 0.6,
                      whiteSpace: 'nowrap',
                      '&:hover': { bgcolor: '#0369A1' }
                    }}
                  >
                    Все приемы
                  </Button>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<CalendarMonthIcon />}
            onClick={() => {
              onClose();
              onOpenCalendar();
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              borderRadius: 2,
              borderColor: '#0284C7',
              color: '#0284C7'
            }}
          >
            Интерактивный календарь приемов
          </Button>

          <Button
            variant="outlined"
            startIcon={<FormatListBulletedIcon />}
            onClick={() => {
              onSelectDate('all');
              onClose();
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              borderRadius: 2,
              borderColor: '#CBD5E1',
              color: '#334155'
            }}
          >
            Показать все (аккордеон)
          </Button>
        </Stack>

        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: '#0F3C64',
            color: '#FFFFFF',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            '&:hover': { bgcolor: '#1E293B' }
          }}
        >
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
}
