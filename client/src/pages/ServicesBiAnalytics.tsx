import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress
} from '@mui/material';
import {
  DataGrid,
  type GridColDef
} from '@mui/x-data-grid';
import { ruRU } from '@mui/x-data-grid/locales';
import { useReactToPrint } from 'react-to-print';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

// Icons
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CategoryIcon from '@mui/icons-material/Category';
import GridViewIcon from '@mui/icons-material/GridView';
import BadgeIcon from '@mui/icons-material/Badge';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarIcon from '@mui/icons-material/Star';
import PetsIcon from '@mui/icons-material/Pets';
import HelpOutlineIcon from '@mui/icons-material/Help';
import BlockIcon from '@mui/icons-material/Block';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Custom Subcomponents
import { ServicesBiGridToolbar } from '../components/analytics/ServicesBiGridToolbar';
import { ServicesBiGridFooter } from '../components/analytics/ServicesBiGridFooter';
import { ServicePassportDrawer } from '../components/analytics/ServicePassportDrawer';
import { ServicesBiReportTemplate, type ServicesBiReportData } from '../components/analytics/ServicesBiReportTemplate';

import { API_BASE_URL } from '../config/apiConfig';

const CATEGORIES_LIST = [
  'Все категории',
  'Инъекционная терапия и PRP/SVF',
  'Хирургические операции',
  'Иммобилизация и травматология',
  'Консультации и диагностика',
  'Физиотерапия и реабилитация',
  'Прочие манипуляции и процедуры'
];

export default function ServicesBiAnalytics() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<number>(0);

  // Filters State
  const [period, setPeriod] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [category, setCategory] = useState<string>('Все категории');
  const [doctorId, setDoctorId] = useState<string>('all');
  const [cohort, setCohort] = useState<string>('all');

  // Staff list for filter
  const [staffList, setStaffList] = useState<any[]>([]);

  // Loading States
  const [loading, setLoading] = useState<boolean>(true);

  // Data States
  const [summaryData, setSummaryData] = useState<any>(null);
  const [waterfallData, setWaterfallData] = useState<any>(null);
  const [patientsData, setPatientsData] = useState<any>(null);
  const [categoriesData, setCategoriesData] = useState<any>(null);
  const [bcgAbcData, setBcgAbcData] = useState<any>(null);
  const [staffPerfData, setStaffPerfData] = useState<any>(null);
  const [gridRows, setGridRows] = useState<any[]>([]);

  // Slide-over Drawer State
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  // Printing & Reporting State
  const printRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<ServicesBiReportData | null>(null);

  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Аналитический отчет: Сервисы и Выплаты'
  });

  // Fetch staff list once
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/staff`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStaffList(data);
        else if (data?.staff) setStaffList(data.staff);
      })
      .catch(err => console.error('Failed to load staff:', err));
  }, []);

  // Fetch all analytical data based on active filters
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (category && category !== 'Все категории') params.append('category', category);
      if (doctorId && doctorId !== 'all') params.append('doctorId', doctorId);
      if (cohort && cohort !== 'all') params.append('cohort', cohort);

      const qs = params.toString();

      const [sumRes, watRes, patRes, catRes, bcgRes, stfRes, grdRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analytics/services-bi/summary?${qs}`),
        fetch(`${API_BASE_URL}/api/analytics/services-bi/waterfall?${qs}`),
        fetch(`${API_BASE_URL}/api/analytics/services-bi/patients-analysis?${qs}`),
        fetch(`${API_BASE_URL}/api/analytics/services-bi/categories?${qs}`),
        fetch(`${API_BASE_URL}/api/analytics/services-bi/bcg-abc?${qs}`),
        fetch(`${API_BASE_URL}/api/analytics/services-bi/staff-performance?${qs}`),
        fetch(`${API_BASE_URL}/api/analytics/services-bi/grid?${qs}`)
      ]);

      const [sum, wat, pat, cat, bcg, stf, grd] = await Promise.all([
        sumRes.json(),
        watRes.json(),
        patRes.json(),
        catRes.json(),
        bcgRes.json(),
        stfRes.json(),
        grdRes.json()
      ]);

      if (sum.success) setSummaryData(sum.summary);
      if (wat.success) setWaterfallData(wat);
      if (pat.success) setPatientsData(pat);
      if (cat.success) setCategoriesData(cat);
      if (bcg.success) setBcgAbcData(bcg);
      if (stf.success) setStaffPerfData(stf);
      if (grd.success) setGridRows(grd.rows || []);
    } catch (err) {
      console.error('Failed to load BI analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, startDate, endDate, category, doctorId, cohort]);

  // Reset filters handler
  const handleResetFilters = () => {
    setPeriod('all');
    setStartDate('');
    setEndDate('');
    setCategory('Все категории');
    setDoctorId('all');
    setCohort('all');
  };

  // Open Service 360 Passport
  const handleOpenPassport = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setDrawerOpen(true);
  };

  // Trigger Print Report
  const handlePrint = () => {
    if (!summaryData) return;
    setPrintData({
      summary: summaryData,
      rows: gridRows,
      generatedDate: new Date().toLocaleString('ru-RU'),
      filterPeriod: period === 'all' ? 'За весь период' : period
    });
    setTimeout(() => {
      handlePrintTrigger();
    }, 150);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!gridRows || gridRows.length === 0) return;
    const headers = ['Код', 'Наименование сервиса', 'Категория', 'Объем', 'Цена', 'Выручка', 'BOM (1.15)', 'Маржа I', 'ФОТ', 'Чистая прибыль', 'Рентабельность %'];
    const csvContent = [
      headers.join(';'),
      ...gridRows.map(r => [
        `"${r.code}"`,
        `"${r.name}"`,
        `"${r.category}"`,
        r.volume,
        r.catalogPrice,
        r.totalRevenue,
        r.totalBom,
        r.marginBase,
        r.totalStaffPayout,
        r.clinicProfit,
        `${r.marginPct}%`
      ].join(';'))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `services_bi_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0 ₽';
    return Math.round(Number(val)).toLocaleString('ru-RU') + ' ₽';
  };

  // Grid Totals calculation
  const gridTotals = useMemo(() => {
    if (!gridRows || gridRows.length === 0) {
      return { count: 0, revenue: 0, bom: 0, payout: 0, profit: 0, avgMargin: 0 };
    }
    const count = gridRows.length;
    const revenue = gridRows.reduce((acc, r) => acc + (r.totalRevenue || 0), 0);
    const bom = gridRows.reduce((acc, r) => acc + (r.totalBom || 0), 0);
    const payout = gridRows.reduce((acc, r) => acc + (r.totalStaffPayout || 0), 0);
    const profit = gridRows.reduce((acc, r) => acc + (r.clinicProfit || 0), 0);
    const avgMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { count, revenue, bom, payout, profit, avgMargin };
  }, [gridRows]);

  // DataGrid Column definitions conforming to grid-improvements skill
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'code',
      headerName: 'Код',
      width: 90,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{ fontWeight: 700, bgcolor: '#F1F5F9', color: '#0F3C64', fontSize: '0.75rem' }}
        />
      )
    },
    {
      field: 'name',
      headerName: 'Наименование сервиса',
      flex: 2,
      minWidth: 260,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: '#1E293B',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: 1.3,
            py: 1
          }}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'category',
      headerName: 'Категория',
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            fontSize: '0.72rem',
            bgcolor: '#F0F9FF',
            color: '#0284C7',
            fontWeight: 600,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        />
      )
    },
    {
      field: 'volume',
      headerName: 'Кол-во',
      width: 90,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'catalogPrice',
      headerName: 'Цена (₽)',
      width: 100,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'totalRevenue',
      headerName: 'Выручка (₽)',
      width: 125,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'totalBom',
      headerName: 'BOM (1.15)',
      width: 115,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#D97706' }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'totalStaffPayout',
      headerName: 'ФОТ (₽)',
      width: 115,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#7C3AED' }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'clinicProfit',
      headerName: 'Чистый доход',
      width: 130,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#16A34A' }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'marginPct',
      headerName: 'Маржа %',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const val = Number(params.value) || 0;
        let bgcolor = '#FEE2E2';
        let color = '#DC2626';
        if (val >= 50) {
          bgcolor = '#DCFCE7';
          color = '#15803D';
        } else if (val >= 30) {
          bgcolor = '#FEF3C7';
          color = '#B45309';
        }
        return (
          <Chip
            label={`${val.toFixed(1)}%`}
            size="small"
            sx={{ fontWeight: 700, bgcolor, color, fontSize: '0.75rem' }}
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Инфо',
      width: 70,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Открыть паспорт сервиса 360°">
          <IconButton
            size="small"
            onClick={() => handleOpenPassport(params.row.id)}
            sx={{
              color: '#0F3C64',
              bgcolor: '#F0F9FF',
              '&:hover': { bgcolor: '#E0F2FE' }
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], []);

  return (
    <Box sx={{ width: '100%', pb: 5 }}>
      {/* 1. Header & Title Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: 'white',
          borderRadius: 2.5,
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#0F3C64',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <QueryStatsIcon />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              АНАЛИТИКА СЕРВИСОВ: ВЫПЛАТЫ, ДОХОДЫ И ЭФФЕКТИВНОСТЬ
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 850 }}>
            Сквозной аудит Unit-экономики манипуляций, себестоимости материалов (BOM), вознаграждения врачей и чистой доходности клиники
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{
              borderColor: '#0F3C64',
              color: '#0F3C64',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#F0F9FF', borderColor: '#0A2540' }
            }}
          >
            Печать PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCsv}
            sx={{
              bgcolor: '#0F3C64',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#0A2540' }
            }}
          >
            Экспорт Excel
          </Button>
        </Box>
      </Paper>

      {/* 2. Smart Filter & Preset Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          bgcolor: 'white',
          borderRadius: 2.5,
          border: '1px solid #E2E8F0'
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
            Быстрый период:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {[
              { id: 'today', label: 'Сегодня' },
              { id: 'week', label: 'Неделя' },
              { id: 'month', label: 'Месяц' },
              { id: 'quarter', label: 'Квартал' },
              { id: '2026', label: '2026' },
              { id: 'all', label: 'Все время' }
            ].map(p => (
              <Chip
                key={p.id}
                label={p.label}
                clickable
                onClick={() => setPeriod(p.id)}
                sx={{
                  fontWeight: period === p.id ? 700 : 500,
                  bgcolor: period === p.id ? '#0F3C64' : '#F1F5F9',
                  color: period === p.id ? 'white' : '#475569',
                  '&:hover': { bgcolor: period === p.id ? '#0A2540' : '#E2E8F0' }
                }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <TextField
            label="С даты"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 155 }}
          />
          <TextField
            label="По дату"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 155 }}
          />

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Категория сервиса</InputLabel>
            <Select
              value={category}
              label="Категория сервиса"
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES_LIST.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Сотрудник / Врач</InputLabel>
            <Select
              value={doctorId}
              label="Сотрудник / Врач"
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <MenuItem value="all">Все сотрудники</MenuItem>
              {staffList.map(st => (
                <MenuItem key={st.id} value={String(st.id)}>{st.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Когорта пациентов</InputLabel>
            <Select
              value={cohort}
              label="Когорта пациентов"
              onChange={(e) => setCohort(e.target.value)}
            >
              <MenuItem value="all">Все пациенты</MenuItem>
              <MenuItem value="primary">Первичные</MenuItem>
              <MenuItem value="repeat">Повторные</MenuItem>
              <MenuItem value="course">Курсовые (PRP/SVF)</MenuItem>
              <MenuItem value="dms">Пациенты ДМС</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="text"
            size="small"
            startIcon={<FilterAltOffIcon />}
            onClick={handleResetFilters}
            sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600 }}
          >
            Сбросить
          </Button>
        </Box>
      </Paper>

      {/* 3. Executive KPI Summary Bar (5 Cards) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        {/* Card 1: Gross Revenue */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            border: '1px solid #E2E8F0',
            bgcolor: 'white',
            borderTop: '4px solid #0F3C64'
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Валовая выручка
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
            {formatCurrency(summaryData?.totalRevenue)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUpIcon sx={{ fontSize: 16, color: '#16A34A' }} />
            <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>
              +12.4% к пред. периоду
            </Typography>
          </Box>
        </Paper>

        {/* Card 2: BOM Materials */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            border: '1px solid #E2E8F0',
            bgcolor: 'white',
            borderTop: '4px solid #D97706'
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Расходники (BOM 1.15)
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706', my: 0.5 }}>
            {formatCurrency(summaryData?.totalBom)}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
            {summaryData?.bomPercent}% выручки (Норма &lt;20%)
          </Typography>
        </Paper>

        {/* Card 3: Staff Payouts */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            border: '1px solid #E2E8F0',
            bgcolor: 'white',
            borderTop: '4px solid #7C3AED'
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Выплаты сотрудникам
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#7C3AED', my: 0.5 }}>
            {formatCurrency(summaryData?.totalStaffPayouts)}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
            ФОТ {summaryData?.staffPayoutPercent}% маржи
          </Typography>
        </Paper>

        {/* Card 4: Clinic Net Profit */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            border: '1px solid #E2E8F0',
            bgcolor: 'white',
            borderTop: '4px solid #16A34A'
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Чистая прибыль клиники
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#16A34A', my: 0.5 }}>
            {formatCurrency(summaryData?.totalClinicProfit)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircleIcon sx={{ fontSize: 16, color: '#16A34A' }} />
            <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700 }}>
              Рентабельность {summaryData?.clinicProfitMargin}%
            </Typography>
          </Box>
        </Paper>

        {/* Card 5: Operations Count */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            border: '1px solid #E2E8F0',
            bgcolor: 'white',
            borderTop: '4px solid #0284C7'
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Объем манипуляций
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0284C7', my: 0.5 }}>
            {summaryData?.operationsCount?.toLocaleString('ru-RU') || 0} проц.
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
            Ср. чек: {formatCurrency(summaryData?.avgTicket)}
          </Typography>
        </Paper>
      </Box>

      {/* 4. Analytical Tabs */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          bgcolor: 'white',
          borderRadius: 2.5,
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              py: 2,
              color: '#64748B',
              '&.Mui-selected': { color: '#0F3C64' }
            },
            '& .MuiTabs-indicator': { bgcolor: '#0F3C64', height: 3 }
          }}
        >
          <Tab icon={<MonetizationOnIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="1. Unit-Экономика & P&L" />
          <Tab icon={<PeopleAltIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="2. Сервисы по Пациентам" />
          <Tab icon={<CategoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="3. Категории & BOM" />
          <Tab icon={<GridViewIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="4. ABC-XYZ & BCG" />
          <Tab icon={<BadgeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="5. Врачи и Бригады" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* TAB 0: Unit Economics & P&L */}
          {activeTab === 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3 }}>
              {/* Waterfall Chart */}
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                    Каскад доходов и себестоимости (Waterfall P&L)
                  </Typography>
                  <Chip label="Сквозная Unit-модель" size="small" sx={{ bgcolor: '#F0F9FF', color: '#0284C7', fontWeight: 600 }} />
                </Box>
                <Box sx={{ height: 320, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={waterfallData?.waterfallSteps || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#475569' }}
                        interval={0}
                        angle={-10}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#475569' }}
                        tickFormatter={(v) => `${Math.round(Math.abs(v) / 1000)}k`}
                      />
                      <RechartsTooltip
                        formatter={(val: any) => [`${Math.abs(Number(val)).toLocaleString('ru-RU')} ₽`, 'Сумма']}
                      />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {(waterfallData?.waterfallSteps || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || '#0F3C64'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              {/* Right column: Top Drivers & Radar */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5 }}>
                    ТОП-5 Драйверов чистой прибыли
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {waterfallData?.topDrivers?.map((d: any, idx: number) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 1.25,
                          bgcolor: '#F8FAFC',
                          borderRadius: 1.5,
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ maxWidth: '65%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', lineHeight: 1.2 }}>
                            {d.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {d.count} проц. • Маржа: {d.marginPct}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#16A34A' }}>
                          + {formatCurrency(d.profit)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>

                {/* Radar chart of categories */}
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>
                    Радар рентабельности по категориям
                  </Typography>
                  <Box sx={{ height: 200, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={waterfallData?.radarData || []}>
                        <PolarGrid stroke="#E2E8F0" />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#475569' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Radar name="Рентабельность %" dataKey="marginPct" stroke="#0F3C64" fill="#0F3C64" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}

          {/* TAB 1: Services by Patients */}
          {activeTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Funnel & Pathways */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '6fr 6fr' }, gap: 3 }}>
                {/* Retention Funnel */}
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      Курсовые манипуляции (Комплаентность PRP/SVF)
                    </Typography>
                    <Chip label="Retention Funnel" size="small" sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 600 }} />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {patientsData?.courseRetention?.map((c: any, idx: number) => (
                      <Box key={idx} sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                            {c.stage}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: idx === 0 ? '#16A34A' : '#0284C7' }}>
                            {c.patientsCount} пациентов ({c.percent}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={c.percent}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#E2E8F0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: idx === 0 ? '#16A34A' : idx === 1 ? '#0284C7' : '#7C3AED'
                            }
                          }}
                        />
                        {c.dropouts > 0 && (
                          <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 600, mt: 0.5, display: 'block' }}>
                            ⚠ {c.dropouts} пациентов не дошли до следующей процедуры (требуется звонок координатора)
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Paper>

                {/* Clinical Pathways */}
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>
                    Траектории пациентов (Clinical Pathways & Cross-Sell)
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {patientsData?.pathways?.map((pw: any, idx: number) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 1.5,
                          bgcolor: '#F8FAFC',
                          borderRadius: 2,
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.5
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: '65%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                            {pw.from}
                          </Typography>
                          <ArrowForwardIcon sx={{ fontSize: 16, color: '#0284C7' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                            {pw.to}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#16A34A' }}>
                            {pw.conversionPct}% конверсия
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Чек: {formatCurrency(pw.avgCheck)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Box>

              {/* Top Patients Contribution Table */}
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>
                  ТОП-20 Пациентов по чистой маржинальной отдаче клинике
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 700 }}>ФИО Пациента</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Медкарта</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Телефон</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Визитов</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Выручка</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>BOM</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>ФОТ</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Прибыль клиники</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Маржа %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patientsData?.topPatients?.map((p: any) => (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{p.fullName}</TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{p.mednum}</TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{p.phone}</TableCell>
                        <TableCell align="right">{p.visitsCount}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                          {formatCurrency(p.totalRevenue)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#D97706' }}>
                          {formatCurrency(p.totalBom)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#7C3AED' }}>
                          {formatCurrency(p.totalStaffPayout)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: '#16A34A' }}>
                          {formatCurrency(p.clinicProfit)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${p.marginPct}%`}
                            size="small"
                            sx={{ fontWeight: 700, bgcolor: '#DCFCE7', color: '#15803D' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          )}

          {/* TAB 2: Categories & BOM */}
          {activeTab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Category Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                {categoriesData?.categories?.map((c: any, idx: number) => (
                  <Paper
                    key={idx}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid #E2E8F0',
                      bgcolor: 'white',
                      borderTop: `4px solid ${idx % 2 === 0 ? '#0F3C64' : '#0284C7'}`
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1, minHeight: 48 }}>
                      {c.category}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>Выполнено манипуляций:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.operationsCount}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>Выручка:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>{formatCurrency(c.totalRevenue)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>Материалоемкость BOM:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>{c.bomIntensity}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>ФОТ сотрудников:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#7C3AED' }}>{formatCurrency(c.totalStaffPayout)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#166534' }}>Чистый доход:</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#16A34A' }}>{formatCurrency(c.clinicProfit)}</Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>

              {/* Top Materials Consumed */}
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>
                  ТОП-8 Складских материалов и препаратов по доле затрат клиники
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Наименование материала</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Ед. изм.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Цена за единицу</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Привязано к сервисам</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Суммарный вес в каталоге</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoriesData?.topMaterials?.map((m: any, idx: number) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{m.name}</TableCell>
                        <TableCell align="center" sx={{ color: '#64748B' }}>{m.unit}</TableCell>
                        <TableCell align="right">{formatCurrency(m.unitCost)}</TableCell>
                        <TableCell align="right">{m.usedInOperationsCount} услуг</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: '#D97706' }}>
                          {formatCurrency(m.totalCatalogWeight)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          )}

          {/* TAB 3: ABC-XYZ & BCG */}
          {activeTab === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* BCG Scatter Plot */}
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      Матрица BCG портфеля сервисов (Объем выполнения vs. Маржа на единицу)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Разделение 162 услуг клиники на 4 квадранта доходности
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip icon={<StarIcon sx={{ color: '#D97706 !important' }} />} label={`🌟 Звезды: ${bcgAbcData?.quadrantCounts?.stars || 0}`} size="small" sx={{ bgcolor: '#FEF3C7', fontWeight: 600 }} />
                    <Chip icon={<PetsIcon sx={{ color: '#0284C7 !important' }} />} label={`🐄 Дойные коровы: ${bcgAbcData?.quadrantCounts?.cows || 0}`} size="small" sx={{ bgcolor: '#E0F2FE', fontWeight: 600 }} />
                    <Chip icon={<HelpOutlineIcon sx={{ color: '#7C3AED !important' }} />} label={`❓ Трудные дети: ${bcgAbcData?.quadrantCounts?.question || 0}`} size="small" sx={{ bgcolor: '#F3E8FF', fontWeight: 600 }} />
                    <Chip icon={<BlockIcon sx={{ color: '#DC2626 !important' }} />} label={`🛑 Балласт: ${bcgAbcData?.quadrantCounts?.deadweight || 0}`} size="small" sx={{ bgcolor: '#FEE2E2', fontWeight: 600 }} />
                  </Box>
                </Box>

                <Box sx={{ height: 350, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis type="number" dataKey="volume" name="Объем выполнения" unit=" шт" tick={{ fontSize: 11 }} />
                      <YAxis type="number" dataKey="unitMargin" name="Маржа на ед." unit=" ₽" tick={{ fontSize: 11 }} />
                      <ZAxis range={[60, 200]} />
                      <RechartsTooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <Paper sx={{ p: 1.5, bgcolor: 'white', border: '1px solid #CBD5E1', boxShadow: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                                  {data.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                  Категория: {data.category}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  Объем: <strong>{data.volume} проц.</strong> | Выручка: <strong>{formatCurrency(data.revenue)}</strong>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#16A34A', fontWeight: 700 }}>
                                  Маржа на единицу: {formatCurrency(data.unitMargin)} ({data.marginPct}%)
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700, mt: 0.5, display: 'block' }}>
                                  Квадрант: {data.quadrant === 'stars' ? '🌟 Звезда' : data.quadrant === 'cows' ? '🐄 Дойная корова' : data.quadrant === 'question' ? '❓ Трудный ребенок' : '🛑 Балласт'}
                                </Typography>
                              </Paper>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter name="Сервисы" data={bcgAbcData?.items || []}>
                        {(bcgAbcData?.items || []).map((entry: any, index: number) => {
                          let fill = '#DC2626';
                          if (entry.quadrant === 'stars') fill = '#D97706';
                          else if (entry.quadrant === 'cows') fill = '#0284C7';
                          else if (entry.quadrant === 'question') fill = '#7C3AED';
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              {/* ABC-XYZ Ranking Table */}
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>
                  Матрица ABC-XYZ (Выручка и регулярность спроса)
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Ранг</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Код</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Наименование сервиса</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Объем</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Выручка</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Доля выручки</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Чистая прибыль</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Квадрант BCG</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bcgAbcData?.items?.slice(0, 15).map((item: any, idx: number) => (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Chip
                            label={item.abcXyzRank}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              bgcolor: item.abc === 'A' ? '#DCFCE7' : item.abc === 'B' ? '#FEF3C7' : '#F1F5F9',
                              color: item.abc === 'A' ? '#15803D' : item.abc === 'B' ? '#B45309' : '#64748B'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{item.code}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                        <TableCell align="right">{item.volume}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                          {formatCurrency(item.revenue)}
                        </TableCell>
                        <TableCell align="right">{item.sharePct}%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: '#16A34A' }}>
                          {formatCurrency(item.clinicProfit)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.quadrant === 'stars' ? 'Звезда' : item.quadrant === 'cows' ? 'Корова' : item.quadrant === 'question' ? 'Вопрос' : 'Балласт'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor: item.quadrant === 'stars' ? '#FEF3C7' : item.quadrant === 'cows' ? '#E0F2FE' : '#F1F5F9'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          )}

          {/* TAB 4: Staff & Brigades */}
          {activeTab === 4 && (
            <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>
                Эффективность сотрудников и врачебных бригад в разрезе манипуляций
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Сотрудник</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Должность и специализация</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Процедур</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Генерация выручки</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Расходники BOM</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Начислено сотруднику</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Чистый доход клиники</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Маржа клиники</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Дисциплина BOM</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffPerfData?.staffPerformance?.map((s: any) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>{s.fullName}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{s.role}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{s.proceduresCount}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        {formatCurrency(s.totalRevenue)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#D97706' }}>
                        {formatCurrency(s.totalBom)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#7C3AED' }}>
                        {formatCurrency(s.payoutEarned)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#16A34A' }}>
                        {formatCurrency(s.clinicProfitGenerated)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${s.retainedMarginPct}%`}
                          size="small"
                          sx={{ fontWeight: 700, bgcolor: '#DCFCE7', color: '#15803D' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${s.bomDisciplineRatio}x`}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: s.bomDisciplineRatio <= 1.05 ? '#F0FDF4' : '#FEF2F2',
                            color: s.bomDisciplineRatio <= 1.05 ? '#166534' : '#991B1B'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      </Paper>

      {/* 5. Complete DataGrid conforming strictly to grid-improvements skill */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'white',
          borderRadius: 2.5,
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
            ИНТЕРАКТИВНЫЙ РЕЕСТР СЕРВИСОВ И UNIT-ЭКОНОМИКИ
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Полная детализация финансовых потоков по каждому сервису каталога с расчетом чистой прибыли
          </Typography>
        </Box>

        <DataGrid
          autoHeight
          showToolbar
          rows={gridRows}
          columns={columns}
          loading={loading}
          localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
            sorting: { sortModel: [{ field: 'totalRevenue', sort: 'desc' }] }
          }}
          getRowHeight={() => 'auto'}
          slots={{
            toolbar: ServicesBiGridToolbar,
            footer: ServicesBiGridFooter
          }}
          slotProps={{
            toolbar: {
              onResetFilters: handleResetFilters,
              onPrint: handlePrint
            },
            footer: {
              totalCount: gridTotals.count,
              totalRevenue: gridTotals.revenue,
              totalBom: gridTotals.bom,
              totalStaffPayout: gridTotals.payout,
              totalClinicProfit: gridTotals.profit,
              avgMarginPct: gridTotals.avgMargin
            }
          }}
          sx={{
            width: '100%',
            border: 'none',
            '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' },
            '& .MuiDataGrid-columnHeaders': {
              position: 'sticky',
              top: 0,
              zIndex: 1,
              bgcolor: '#F8FAFC',
              borderBottom: '2px solid #CBD5E1',
              fontWeight: 700
            },
            '& .MuiDataGrid-cell': {
              py: 1,
              display: 'flex',
              alignItems: 'center'
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: '#F8FAFC'
            }
          }}
        />
      </Paper>

      {/* 6. Slide-Over 360° Service Passport */}
      <ServicePassportDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        serviceId={selectedServiceId}
      />

      {/* 7. Hidden Printable Report Template */}
      <Box sx={{ display: 'none' }}>
        <ServicesBiReportTemplate ref={printRef} data={printData} />
      </Box>
    </Box>
  );
}
