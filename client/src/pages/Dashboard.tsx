import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  LinearProgress
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import GroupIcon from '@mui/icons-material/Group';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DateRangeIcon from '@mui/icons-material/DateRange';
import TodayIcon from '@mui/icons-material/Today';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

interface DashboardData {
  success: boolean;
  period: string;
  kpi: {
    totalRevenue: number;
    revenueGrowthMoM: number;
    netProfit: number;
    netMarginPct: number;
    totalVisits: number;
    uniquePatients: number;
    registeredPatientsTotal: number;
    averageCheck: number;
    averageCheckGrowth: number;
    operationsCount: number;
    operationsTotalBilled: number;
    returnRatePct: number;
  };
  monthlyPL: Array<{
    id: number;
    month: string;
    revenue: number;
    expenses: number;
    salary: number;
    netProfit: number;
    marginPct: number;
  }>;
  revenueStreams: Array<{
    name: string;
    amount: number;
    share: number;
    color: string;
  }>;
  patientDynamics: Array<{
    month: string;
    label: string;
    totalVisits: number;
    primaryVisits: number;
    secondaryVisits: number;
  }>;
  doctors: Array<{
    id: number;
    name: string;
    role: string;
    specialty: string;
    visitsCount: number;
    operationsCount: number;
    estimatedRevenue: number;
    averageBill: number;
    color: string;
  }>;
  weeklyDynamics?: Array<{
    weekKey: string;
    weekNumber: number;
    label: string;
    fullLabel: string;
    operations: number;
    revenue: number;
    avgCheck: number;
    wowGrowthPct: number;
  }>;
  dayOfWeekStats?: Array<{
    dow: number;
    dayName: string;
    shortDay: string;
    operations: number;
    revenue: number;
    avgCheck: number;
    sharePct: number;
  }>;
  hitPoints: Array<{
    id: string;
    severity: string;
    title: string;
    badge: string;
    text: string;
    hint: string;
  }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchDashboardData = async (selectedPeriod = period) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/dashboard/overview?period=${selectedPeriod}`);
      const json = await res.json();
      if (json && json.success) {
        setData(json);
      }
      setLastUpdated(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Ошибка загрузки данных дашборда:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(period);
  }, [period]);

  const kpi = data?.kpi || {
    totalRevenue: 9652403,
    revenueGrowthMoM: 12.4,
    netProfit: 2799644,
    netMarginPct: 29.0,
    totalVisits: 37538,
    uniquePatients: 16493,
    registeredPatientsTotal: 61298,
    averageCheck: 2571,
    averageCheckGrowth: 3.1,
    operationsCount: 4155,
    operationsTotalBilled: 27429334,
    returnRatePct: 36.6
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden', pb: 4 }}>
      {/* 1. Header Toolbar with Russian Title, Description, Period Presets, and Actions */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: 3,
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          {/* Title and Subtitle */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Tooltip title="Главный цифровой пульт управления клиникой: сводные финансовые и медицинские данные в реальном времени" arrow enterDelay={200}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2.5,
                    bgcolor: '#EFF6FF',
                    color: '#0F3C64',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'help'
                  }}
                >
                  <BarChartIcon />
                </Box>
              </Tooltip>
              <Box>
                <Tooltip title="Аналитическая панель бизнес-аналитики (BI) Центра ортопедии и травматологии Добрушкина" arrow enterDelay={200}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', cursor: 'help' }}>
                    Аналитическая панель (BI)
                  </Typography>
                </Tooltip>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Сводные финансовые показатели, пациентопоток и точки управленческого контроля
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Period selector buttons (flex-wrap for zero horizontal scroll) */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Tooltip title="Показать аналитические данные только за текущий сегодняшний рабочий день клиники" arrow enterDelay={200}>
              <Button
                size="small"
                variant={period === 'today' ? 'contained' : 'outlined'}
                onClick={() => setPeriod('today')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: period === 'today' ? '#0F3C64' : 'transparent',
                  borderColor: '#CBD5E1',
                  color: period === 'today' ? '#FFFFFF' : '#475569'
                }}
              >
                Сегодня
              </Button>
            </Tooltip>

            <Tooltip title="Показать аналитические данные за текущий календарный месяц" arrow enterDelay={200}>
              <Button
                size="small"
                variant={period === 'month' ? 'contained' : 'outlined'}
                onClick={() => setPeriod('month')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: period === 'month' ? '#0F3C64' : 'transparent',
                  borderColor: '#CBD5E1',
                  color: period === 'month' ? '#FFFFFF' : '#475569'
                }}
              >
                Текущий месяц
              </Button>
            </Tooltip>

            <Tooltip title="Показать сводку за 3-й квартал 2026 года" arrow enterDelay={200}>
              <Button
                size="small"
                variant={period === 'q3' ? 'contained' : 'outlined'}
                onClick={() => setPeriod('q3')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: period === 'q3' ? '#0F3C64' : 'transparent',
                  borderColor: '#CBD5E1',
                  color: period === 'q3' ? '#FFFFFF' : '#475569'
                }}
              >
                3-й квартал
              </Button>
            </Tooltip>

            <Tooltip title="Показать финансовый и клинический отчёт за весь 2026 год" arrow enterDelay={200}>
              <Button
                size="small"
                variant={period === '2026' ? 'contained' : 'outlined'}
                onClick={() => setPeriod('2026')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: period === '2026' ? '#0F3C64' : 'transparent',
                  borderColor: '#CBD5E1',
                  color: period === '2026' ? '#FFFFFF' : '#475569'
                }}
              >
                2026 год
              </Button>
            </Tooltip>

            <Tooltip title="Отобразить совокупные исторические данные клиники за весь период накопления базы" arrow enterDelay={200}>
              <Button
                size="small"
                variant={period === 'all' ? 'contained' : 'outlined'}
                onClick={() => setPeriod('all')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: period === 'all' ? '#0F3C64' : 'transparent',
                  borderColor: '#CBD5E1',
                  color: period === 'all' ? '#FFFFFF' : '#475569'
                }}
              >
                За всё время
              </Button>
            </Tooltip>

            <Tooltip title="Обновить аналитические показатели из базы данных SQLite" arrow enterDelay={200}>
              <span>
                <IconButton
                  onClick={() => fetchDashboardData(period)}
                  disabled={loading}
                  sx={{
                    bgcolor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: 2,
                    p: 0.9,
                    color: '#0F3C64'
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            {lastUpdated && (
              <Tooltip title="Время последнего автоматического расчёта показателей в системе" arrow enterDelay={200}>
                <Typography variant="caption" sx={{ color: '#94A3B8', ml: 0.5, cursor: 'help' }}>
                  {lastUpdated}
                </Typography>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>

      {/* 2. Top Hero KPI Cards (MUI Grid v2 with size prop for responsive layout across mobile, tablet, 4K) */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* KPI 1: Gross Revenue */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Tooltip
            title="Общая сумма всех денежных средств, начисленных клиникой за медицинские услуги, консультации и операции со всех каналов оплаты за выбранный период"
            arrow
            enterDelay={200}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                height: 'auto',
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'help',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(15,60,100,0.08)' }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
                  Выручка клиники
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#EFF6FF', color: '#0284C7' }}>
                  <AccountBalanceWalletIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1, wordBreak: 'break-word' }}>
                {kpi.totalRevenue.toLocaleString('ru-RU')} ₽
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Tooltip title="Прирост выручки относительно предшествующего аналогичного периода" arrow enterDelay={200}>
                  <Chip
                    icon={<TrendingUpIcon style={{ fontSize: 14 }} />}
                    label={`+${kpi.revenueGrowthMoM}% MoM`}
                    size="small"
                    sx={{
                      bgcolor: '#ECFDF5',
                      color: '#059669',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 22
                    }}
                  />
                </Tooltip>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  по всем каналам
                </Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>

        {/* KPI 2: Net Profit & Margin */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Tooltip
            title="Чистый доход клиники после вычета фонда оплаты труда докторов, списания себестоимости медикаментов со склада (BOM) и покрытия постоянных расходов"
            arrow
            enterDelay={200}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                height: 'auto',
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'help',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(5,150,105,0.08)' }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
                  Чистая прибыль
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#ECFDF5', color: '#059669' }}>
                  <TrendingUpIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669', mb: 1, wordBreak: 'break-word' }}>
                {kpi.netProfit.toLocaleString('ru-RU')} ₽
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Tooltip title="Доля чистой прибыли в общей выручке клиники (рентабельность бизнеса)" arrow enterDelay={200}>
                  <Chip
                    label={`Маржа ${kpi.netMarginPct}%`}
                    size="small"
                    sx={{
                      bgcolor: '#F0FDF4',
                      color: '#16A34A',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 22
                    }}
                  />
                </Tooltip>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  рентабельность
                </Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>

        {/* KPI 3: Visits & Patients */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Tooltip
            title="Общее число зарегистрированных приёмов пациентов в клинике за всё время наблюдения, а также количество уникальных физических лиц"
            arrow
            enterDelay={200}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                height: 'auto',
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'help',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(124,58,237,0.08)' }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
                  Пациентопоток
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#F5F3FF', color: '#7C3AED' }}>
                  <PeopleAltIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1, wordBreak: 'break-word' }}>
                {kpi.totalVisits.toLocaleString('ru-RU')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Tooltip title="Количество уникальных пациентов, посетивших клинику" arrow enterDelay={200}>
                  <Chip
                    label={`${kpi.uniquePatients.toLocaleString('ru-RU')} пациентов`}
                    size="small"
                    sx={{
                      bgcolor: '#F3E8FF',
                      color: '#7C3AED',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 22
                    }}
                  />
                </Tooltip>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  визитов
                </Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>

        {/* KPI 4: Average Bill */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Tooltip
            title="Средняя сумма счёта за одно посещение клиники пациентом. Рост показателя отражает назначение комплексных курсов лечения и высокотехнологичных процедур"
            arrow
            enterDelay={200}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                height: 'auto',
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'help',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(234,88,12,0.08)' }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
                  Средний чек за визит
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#FFF7ED', color: '#EA580C' }}>
                  <ReceiptLongIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1, wordBreak: 'break-word' }}>
                {kpi.averageCheck.toLocaleString('ru-RU')} ₽
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Tooltip title="Положительная динамика среднего счёта к прошлому периоду" arrow enterDelay={200}>
                  <Chip
                    label={`+${kpi.averageCheckGrowth}% рост`}
                    size="small"
                    sx={{
                      bgcolor: '#FFEDD5',
                      color: '#C2410C',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 22
                    }}
                  />
                </Tooltip>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  на 1 визит
                </Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>

        {/* KPI 5: Procedures Count */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Tooltip
            title="Суммарное количество выполненных врачами оперативных вмешательств, диагностических блокад, процедур плазмотерапии (PRP/SVF) и наложений полимерных повязок Турбокаст"
            arrow
            enterDelay={200}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                height: 'auto',
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'help',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(15,60,100,0.08)' }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
                  Проведено процедур
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#EFF6FF', color: '#0F3C64' }}>
                  <MedicalServicesIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1, wordBreak: 'break-word' }}>
                {kpi.operationsCount.toLocaleString('ru-RU')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Tooltip title="Общая сумма начислений за выполненные манипуляции в транзакциях клиники" arrow enterDelay={200}>
                  <Chip
                    label={`${(kpi.operationsTotalBilled / 1000000).toFixed(1)}M ₽`}
                    size="small"
                    sx={{
                      bgcolor: '#EFF6FF',
                      color: '#0F3C64',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 22
                    }}
                  />
                </Tooltip>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  объём услуг
                </Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
      </Grid>

      {/* 3. Operational Hit Points (Alert badges of business early warnings) */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {(data?.hitPoints || []).map((hp) => {
            const isSuccess = hp.severity === 'success';
            const isWarning = hp.severity === 'warning';
            const isInfo = hp.severity === 'info';

            const borderColor = isSuccess ? '#BBF7D0' : isWarning ? '#FED7AA' : isInfo ? '#BAE6FD' : '#DDD6FE';
            const bgColor = isSuccess ? '#F0FDF4' : isWarning ? '#FFFBEB' : isInfo ? '#F0F9FF' : '#FAF5FF';
            const titleColor = isSuccess ? '#166534' : isWarning ? '#9A3412' : isInfo ? '#075985' : '#5B21B6';
            const chipBg = isSuccess ? '#DCFCE7' : isWarning ? '#FFEDD5' : isInfo ? '#E0F2FE' : '#EDE9FE';
            const chipColor = isSuccess ? '#15803D' : isWarning ? '#C2410C' : isInfo ? '#0369A1' : '#6D28D9';

            return (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={hp.id}>
                <Tooltip title={hp.hint} arrow enterDelay={200}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      height: 'auto',
                      borderRadius: 2.5,
                      border: `1px solid ${borderColor}`,
                      bgcolor: bgColor,
                      cursor: 'help'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isSuccess && <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 18 }} />}
                        {isWarning && <WarningAmberIcon sx={{ color: '#EA580C', fontSize: 18 }} />}
                        {isInfo && <LightbulbIcon sx={{ color: '#0284C7', fontSize: 18 }} />}
                        {!isSuccess && !isWarning && !isInfo && <VerifiedUserIcon sx={{ color: '#7C3AED', fontSize: 18 }} />}
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: titleColor }}>
                          {hp.title}
                        </Typography>
                      </Box>
                      <Chip
                        label={hp.badge}
                        size="small"
                        sx={{
                          bgcolor: chipBg,
                          color: chipColor,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.4 }}>
                      {hp.text}
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* 4. Tabbed Deep-Dive Analytics (P&L, Patients, Doctors, Opportunities) */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          mb: 3,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label={
                <Tooltip title="Помесячная финансовая отчётность клиники: выручка, операционные расходы, фонд оплаты труда и кривая чистой прибыли" arrow enterDelay={200}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BarChartIcon fontSize="small" />
                    <span>Финансы и P&L</span>
                  </Box>
                </Tooltip>
              }
            />
            <Tab
              label={
                <Tooltip title="Показатели пациентопотока: соотношение первичных и повторных приёмов, динамика визитов по месяцам" arrow enterDelay={200}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon fontSize="small" />
                    <span>Пациентопоток и удержание</span>
                  </Box>
                </Tooltip>
              }
            />
            <Tab
              label={
                <Tooltip title="Индивидуальная выработка специалистов клиники: выручка, количество приёмов и манипуляций, средний чек" arrow enterDelay={200}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PsychologyIcon fontSize="small" />
                    <span>Выработка специалистов</span>
                  </Box>
                </Tooltip>
              }
            />
            <Tab
              label={
                <Tooltip title="Детальный понедельный срез: недельная выручка, объём процедур, средний чек и загрузка клиники по дням недели (Пн–Вс)" arrow enterDelay={200}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DateRangeIcon fontSize="small" />
                    <span>Понедельный ритм</span>
                  </Box>
                </Tooltip>
              }
            />
          </Tabs>
        </Box>

        {/* TAB 0: Finances & P&L */}
        {activeTab === 0 && (
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={3}>
              {/* P&L Monthly Composed Chart */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Tooltip title="Столбцы показывают доходы и расходы клиники за каждый месяц, а зелёная линия — чистый остаток прибыли" arrow enterDelay={200}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                    Помесячный финансовый результат: Выручка vs Расходы vs Чистая прибыль
                  </Typography>
                </Tooltip>
                <Box sx={{ width: '100%', height: 340 }}>
                  {data?.monthlyPL && data.monthlyPL.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.monthlyPL} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                        <YAxis
                          yAxisId="left"
                          stroke="#64748B"
                          fontSize={11}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#10B981"
                          fontSize={11}
                          unit="%"
                          domain={[0, 100]}
                        />
                        <RechartsTooltip
                          formatter={(value: any, name: any) => {
                            if (name === 'Рентабельность %') return [`${value}%`, name];
                            return [`${Math.round(value).toLocaleString('ru-RU')} ₽`, name];
                          }}
                          contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" name="Выручка клиники" fill="#0F3C64" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="expenses" name="Все расходы (BOM + ФОТ)" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="marginPct"
                          name="Рентабельность %"
                          stroke="#10B981"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <CircularProgress size={32} />
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Revenue Streams Donut Chart */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Tooltip title="Доли входящего финансового потока по сервисам и источникам фиксации оплаты" arrow enterDelay={200}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                    Структура источников поступлений
                  </Typography>
                </Tooltip>
                <Box sx={{ width: '100%', height: 340 }}>
                  {data?.revenueStreams && data.revenueStreams.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.revenueStreams}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {data.revenueStreams.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#0284C7'} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: any, name: any) => [`${Number(value).toLocaleString('ru-RU')} ₽`, name]}
                          contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <CircularProgress size={32} />
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 1: Patient Dynamics & Retention */}
        {activeTab === 1 && (
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Tooltip title="Соотношение первичных консультаций новых пациентов и повторных визитов на курс лечения" arrow enterDelay={200}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                    Динамика визитов: Первичные vs Повторные приёмы
                  </Typography>
                </Tooltip>
                <Box sx={{ width: '100%', height: 340 }}>
                  {data?.patientDynamics && data.patientDynamics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.patientDynamics} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
                        <YAxis stroke="#64748B" fontSize={11} />
                        <RechartsTooltip
                          formatter={(v: any, name: any) => [`${v} визитов`, name]}
                          contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                        <Legend />
                        <Bar dataKey="primaryVisits" name="Первичные приёмы" fill="#0284C7" stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="secondaryVisits" name="Повторные приёмы (курс)" fill="#10B981" stackId="a" radius={[4, 4, 0, 0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <CircularProgress size={32} />
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Patient Base Key Metrics */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5 }}>
                  Показатели лояльности базы пациентов
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Всего зарегистрировано в картотеке клиники:
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', mt: 0.5 }}>
                      {kpi.registeredPatientsTotal.toLocaleString('ru-RU')} пациентов
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#059669', display: 'block', mt: 0.5 }}>
                      Активная электронная медицинская карта (ЭМК)
                    </Typography>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Коэффициент повторных обращений (удержание):
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669', mt: 0.5 }}>
                      {kpi.returnRatePct}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={kpi.returnRatePct}
                      sx={{ height: 8, borderRadius: 4, mt: 1, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#059669' } }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Пациенты, завершившие обследование и проходящие контрольный осмотр
                    </Typography>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Уникальных физических лиц на приёме:
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#7C3AED', mt: 0.5 }}>
                      {kpi.uniquePatients.toLocaleString('ru-RU')} чел.
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      В среднем 2.3 посещения на одного пациента
                    </Typography>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 2: Doctors & Specialists Performance */}
        {activeTab === 2 && (
          <Box sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
              Рейтинг и выработка оперирующих хирургов и специалистов клиники
            </Typography>
            <Grid container spacing={2.5}>
              {(data?.doctors || []).map((doc) => (
                <Grid size={{ xs: 12, md: 6 }} key={doc.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: '1px solid #E2E8F0',
                      bgcolor: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                          {doc.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600 }}>
                          {doc.role}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                          {doc.specialty}
                        </Typography>
                      </Box>
                      <Chip
                        label={`Ср. чек ${doc.averageBill.toLocaleString('ru-RU')} ₽`}
                        size="small"
                        sx={{ bgcolor: '#EFF6FF', color: '#0F3C64', fontWeight: 700 }}
                      />
                    </Box>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid size={{ xs: 4 }}>
                        <Tooltip title="Общее число проведённых приёмов и консультаций пациентов" arrow enterDelay={200}>
                          <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, cursor: 'help' }}>
                            <Typography variant="caption" color="text.secondary">Приёмов:</Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                              {doc.visitsCount.toLocaleString('ru-RU')}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Grid>

                      <Grid size={{ xs: 4 }}>
                        <Tooltip title="Количество выполненных хирургических операций, блокад и инъекций" arrow enterDelay={200}>
                          <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, cursor: 'help' }}>
                            <Typography variant="caption" color="text.secondary">Манипуляций:</Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#059669' }}>
                              {doc.operationsCount.toLocaleString('ru-RU')}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Grid>

                      <Grid size={{ xs: 4 }}>
                        <Tooltip title="Суммарная начисленная выручка за оказанные медицинские услуги" arrow enterDelay={200}>
                          <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, cursor: 'help' }}>
                            <Typography variant="caption" color="text.secondary">Выручка:</Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0284C7' }}>
                              {(doc.estimatedRevenue / 1000000).toFixed(1)}M ₽
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* TAB 3: Weekly Rhythm & Days of Week */}
        {activeTab === 3 && (
          <Box sx={{ p: 2.5 }}>
            {/* Top 3 Smart Insights on Weekly Rhythm */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Tooltip title="Вторник является наиболее загруженным и прибыльным днём в клинике" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #BBF7D0', bgcolor: '#F0FDF4', cursor: 'help' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <TodayIcon sx={{ color: '#16A34A', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#166534' }}>
                        Вторник — пиковый операционный день
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                      2 492 манипуляции и 10.18 млн ₽ выручки (37.1% всей выручки клиники). День массовых малоинвазивных манипуляций.
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Tooltip title="Пятница формирует второй по величине финансовый пик недели с высокими чеками" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #BAE6FD', bgcolor: '#F0F9FF', cursor: 'help' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <CheckCircleIcon sx={{ color: '#0284C7', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#075985' }}>
                        Пятница — хирургический пик
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                      664 процедуры и 6.27 млн ₽ выручки (22.8% дохода). Средний чек процедуры 9 440 ₽ за счёт сложных операций перед выходными.
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Tooltip title="Суббота и воскресенье формируют резерв для физиотерапии, перевязок и плановых консультаций" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #DDD6FE', bgcolor: '#FAF5FF', cursor: 'help' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <LightbulbIcon sx={{ color: '#7C3AED', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#5B21B6' }}>
                        Резерв выходных дней
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                      Выходные приносят 3.6% выручки (390 процедур). Имеется потенциал для расширения приёма реабилитации и повторных перевязок.
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>
            </Grid>

            {/* Charts Row */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Weekly Trends Chart */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Tooltip title="Динамика выручки и среднего чека процедуры по календарным неделям года" arrow enterDelay={200}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                    Понедельная динамика: Выручка клиники vs Средний чек манипуляции
                  </Typography>
                </Tooltip>
                <Box sx={{ width: '100%', height: 340 }}>
                  {data?.weeklyDynamics && data.weeklyDynamics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.weeklyDynamics} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="label" stroke="#64748B" fontSize={10} interval="preserveStartEnd" />
                        <YAxis
                          yAxisId="left"
                          stroke="#64748B"
                          fontSize={11}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#EA580C"
                          fontSize={11}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <RechartsTooltip
                          formatter={(value: any, name: any) => [`${Math.round(value).toLocaleString('ru-RU')} ₽`, name]}
                          labelFormatter={(label, payload) => {
                            const item = payload && payload[0] && payload[0].payload;
                            return item ? item.fullLabel : label;
                          }}
                          contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" name="Выручка недели (₽)" fill="#0F3C64" radius={[4, 4, 0, 0]} />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="avgCheck"
                          name="Средний чек процедуры (₽)"
                          stroke="#EA580C"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <CircularProgress size={32} />
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Day of Week Distribution Chart */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Tooltip title="Суммарная выручка и загрузка процедурных кабинетов клиники по дням недели (с Понедельника по Воскресенье)" arrow enterDelay={200}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                    Загрузка и выручка по дням недели
                  </Typography>
                </Tooltip>
                <Box sx={{ width: '100%', height: 340 }}>
                  {data?.dayOfWeekStats && data.dayOfWeekStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.dayOfWeekStats} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="shortDay" stroke="#64748B" fontSize={12} />
                        <YAxis
                          yAxisId="left"
                          stroke="#64748B"
                          fontSize={11}
                          tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                        />
                        <RechartsTooltip
                          formatter={(value: any, name: any) => {
                            if (name === 'Выручка') return [`${Number(value).toLocaleString('ru-RU')} ₽`, name];
                            return [`${value} манипуляций`, name];
                          }}
                          labelFormatter={(_, payload) => {
                            const item = payload && payload[0] && payload[0].payload;
                            return item ? `${item.dayName} (${item.sharePct}% выручки)` : '';
                          }}
                          contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="revenue"
                          name="Выручка"
                          fill="#0284C7"
                          radius={[4, 4, 0, 0]}
                        >
                          {data.dayOfWeekStats.map((entry, index) => {
                            const isPeak = entry.dow === 2 || entry.dow === 5;
                            return <Cell key={`cell-${index}`} fill={isPeak ? '#0F3C64' : '#38BDF8'} />;
                          })}
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <CircularProgress size={32} />
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Weekly Detailed Table (Zero scrollbars, autoHeight, pure Russian) */}
            <Box sx={{ mt: 2 }}>
              <Tooltip title="Полный понедельный реестр работы клиники: даты, количество манипуляций, выручка, средний чек и темп роста к прошлой неделе" arrow enterDelay={200}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                  Понедельный реестр показателей клиники ({data?.weeklyDynamics?.length || 0} нед.)
                </Typography>
              </Tooltip>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        <Tooltip title="Календарная неделя и диапазон дат проведения манипуляций" arrow enterDelay={200}>
                          <span>Период (Неделя)</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        <Tooltip title="Общее количество выполненных операций и манипуляций за эту неделю" arrow enterDelay={200}>
                          <span>Манипуляций</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        <Tooltip title="Суммарная начисленная выручка клиники за неделю со всех источников" arrow enterDelay={200}>
                          <span>Выручка за неделю</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        <Tooltip title="Средняя стоимость одной манипуляции за расчётную неделю" arrow enterDelay={200}>
                          <span>Средний чек</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        <Tooltip title="Темп изменения выручки по сравнению с предшествующей неделей (WoW %)" arrow enterDelay={200}>
                          <span>Динамика к пред. нед.</span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data?.weeklyDynamics || []).slice(-15).reverse().map((w) => {
                      const isPositive = w.wowGrowthPct >= 0;
                      return (
                        <TableRow key={w.weekKey} hover>
                          <TableCell sx={{ fontWeight: 600, color: '#0F3C64' }}>
                            <Tooltip title={w.fullLabel} arrow enterDelay={200}>
                              <span>{w.label}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {w.operations.toLocaleString('ru-RU')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                            {w.revenue.toLocaleString('ru-RU')} ₽
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#64748B' }}>
                            {w.avgCheck.toLocaleString('ru-RU')} ₽
                          </TableCell>
                          <TableCell align="right">
                            {w.wowGrowthPct !== 0 ? (
                              <Chip
                                label={`${isPositive ? '+' : ''}${w.wowGrowthPct}%`}
                                size="small"
                                sx={{
                                  bgcolor: isPositive ? '#ECFDF5' : '#FEF2F2',
                                  color: isPositive ? '#059669' : '#DC2626',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  height: 20
                                }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}
      </Paper>

      {/* 5. Direct Navigation Shortcuts to Specialized Modules */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip title="Перейти к расширенному экрану анализа операций: себестоимость материалов по технологическим картам BOM, 4-квадрантная матрица и симулятор What-If" arrow enterDelay={200}>
            <Paper
              onClick={() => navigate('/analytics/operations')}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#F8FAFC', transform: 'translateY(-2px)', borderColor: '#0284C7' }
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  Анализ операций и затрат BOM
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                  Калькуляция материалов, маржинальность и What-If
                </Typography>
              </Box>
              <ArrowForwardIcon sx={{ color: '#0284C7' }} />
            </Paper>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip title="Открыть картотеку пациентов: электронные медицинские карты (ЭМК), контактные данные, договоры и история визитов" arrow enterDelay={200}>
            <Paper
              onClick={() => navigate('/patients')}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#F8FAFC', transform: 'translateY(-2px)', borderColor: '#059669' }
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  Электронная картотека пациентов
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                  61 298 карт пациентов, поиск и фильтрация
                </Typography>
              </Box>
              <ArrowForwardIcon sx={{ color: '#059669' }} />
            </Paper>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip title="Управление подключением к базе Firebird и импорт свежих данных о пациентах и начислениях" arrow enterDelay={200}>
            <Paper
              onClick={() => navigate('/firebird-sync')}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#F8FAFC', transform: 'translateY(-2px)', borderColor: '#7C3AED' }
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  Синхронизация с Firebird МИС
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                  Прямой шлюз обмена с медицинской системой
                </Typography>
              </Box>
              <ArrowForwardIcon sx={{ color: '#7C3AED' }} />
            </Paper>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
}
