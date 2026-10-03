import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Slider,
  Collapse,
  Drawer,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tabs,
  Tab,
  Divider,
  Alert,
  Skeleton
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  getGridStringOperators
} from '@mui/x-data-grid';
import { ruRU } from '@mui/x-data-grid/locales';
import AnalyticsGridToolbar from '../components/AnalyticsGridToolbar';
import AnalyticsGridFooter from '../components/AnalyticsGridFooter';
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
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine
} from 'recharts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TuneIcon from '@mui/icons-material/Tune';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LayersIcon from '@mui/icons-material/Layers';
import PieChartIcon from '@mui/icons-material/PieChart';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import ScienceIcon from '@mui/icons-material/Science';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';

const CATEGORY_COLORS: Record<string, string> = {
  'Инъекционная терапия и PRP/SVF': '#0284C7',
  'Хирургические операции': '#DC2626',
  'Иммобилизация и травматология': '#D97706',
  'Консультации и диагностика': '#059669',
  'Физиотерапия и реабилитация': '#7C3AED',
  'Прочие манипуляции и процедуры': '#64748B'
};

const QUADRANT_COLORS: Record<string, string> = {
  stars: '#10B981',       // High volume + High margin (Emerald)
  niche: '#3B82F6',       // Low volume + High margin (Blue)
  cash_cows: '#8B5CF6',   // High volume + Low margin (Purple)
  question: '#F59E0B'     // Low volume + Low margin (Amber)
};

// Custom string operators for flexible Russian searches (ignoring hyphens and spaces)
const customStringOperators = getGridStringOperators().map((operator) => {
  if (operator.value === 'contains') {
    return {
      ...operator,
      getApplyFilterFn: (filterItem: any) => {
        if (!filterItem.value) return null;
        const normalizedSearch = String(filterItem.value).replace(/[- ]+/g, '').toLowerCase();
        return (value: any) => {
          if (value == null) return false;
          const normalizedCell = String(value).replace(/[- ]+/g, '').toLowerCase();
          return normalizedCell.includes(normalizedSearch);
        };
      },
    };
  }
  return operator;
});

export default function OperationsAnalytics() {
  // Filters state
  const [period, setPeriod] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [doctorId, setDoctorId] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [activeChartTab, setActiveChartTab] = useState<number>(0);

  // What-If Simulation state
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [priceAdjustmentPct, setPriceAdjustmentPct] = useState<number>(0);
  const [bomAdjustmentPct, setBomAdjustmentPct] = useState<number>(0);

  // Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  // Slide-over Drawer state
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);
  const [drawerData, setDrawerData] = useState<any>(null);

  // Fetch Operations Analytics Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (category && category !== 'all') params.append('category', category);
      if (doctorId && doctorId !== 'all') params.append('doctorId', doctorId);
      if (search) params.append('search', search);

      const res = await fetch(`http://localhost:5000/api/analytics/operations?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch operations analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, category, doctorId]);

  // Open Drawer and fetch details
  const handleOpenDrawer = async (opId: number) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/analytics/operations/${opId}/details`);
      if (res.ok) {
        const json = await res.json();
        setDrawerData(json);
      }
    } catch (err) {
      console.error('Failed to fetch op details:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setPeriod('all');
    setCategory('all');
    setDoctorId('all');
    setSearch('');
    setPriceAdjustmentPct(0);
    setBomAdjustmentPct(0);
  };

  // Apply What-If simulation client-side to items and summary
  const simulatedData = useMemo(() => {
    if (!data || !data.items) return null;

    const priceMult = 1 + priceAdjustmentPct / 100;
    const bomMult = 1 + bomAdjustmentPct / 100;

    let simRevenue = 0;
    let simBomCost = 0;

    const items = data.items.map((it: any) => {
      const baseRev = it.totalRevenue || 0;
      const baseBom = it.totalBomCost || 0;
      const simulatedRev = Math.round(baseRev * priceMult * 100) / 100;
      const simulatedBom = Math.round(baseBom * bomMult * 100) / 100;
      const simulatedGrossProfit = Math.round((simulatedRev - simulatedBom) * 100) / 100;
      const simulatedMarginRate = simulatedRev > 0 ? Math.round(((simulatedGrossProfit / simulatedRev) * 100) * 10) / 10 : 0;
      const simulatedUnitBom = Math.round(it.unitBomCost * bomMult * 100) / 100;
      const simulatedAvgPrice = Math.round(it.avgPrice * priceMult * 100) / 100;

      simRevenue += simulatedRev;
      simBomCost += simulatedBom;

      return {
        ...it,
        simulatedRev,
        simulatedBom,
        simulatedGrossProfit,
        simulatedMarginRate,
        simulatedUnitBom,
        simulatedAvgPrice
      };
    });

    const simGrossProfit = simRevenue - simBomCost;
    const simMarginRate = simRevenue > 0 ? Math.round(((simGrossProfit / simRevenue) * 100) * 10) / 10 : 0;
    const revDelta = simRevenue - (data.summary?.totalRevenue || 0);
    const profitDelta = simGrossProfit - (data.summary?.grossProfit || 0);

    return {
      items,
      summary: {
        ...data.summary,
        totalRevenue: simRevenue,
        totalBomCost: simBomCost,
        grossProfit: simGrossProfit,
        marginRate: simMarginRate,
        revDelta,
        profitDelta
      }
    };
  }, [data, priceAdjustmentPct, bomAdjustmentPct]);

  // Filtered rows for DataGrid with local search query
  const gridRows = useMemo(() => {
    if (!simulatedData?.items) return [];
    if (!search.trim()) return simulatedData.items;
    const q = search.trim().toLowerCase();
    return simulatedData.items.filter((it: any) =>
      it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q) || it.category.toLowerCase().includes(q)
    );
  }, [simulatedData, search]);

  // Totals for Sticky Footer (sum of currently displayed grid rows)
  const gridTotals = useMemo(() => {
    const totalRev = gridRows.reduce((sum: number, r: any) => sum + r.simulatedRev, 0);
    const totalBom = gridRows.reduce((sum: number, r: any) => sum + r.simulatedBom, 0);
    const totalProfit = totalRev - totalBom;
    const totalVolume = gridRows.reduce((sum: number, r: any) => sum + r.volume, 0);
    const avgMargin = totalRev > 0 ? Math.round(((totalProfit / totalRev) * 100) * 10) / 10 : 0;

    return {
      count: gridRows.length,
      totalVolume,
      totalRev,
      totalBom,
      totalProfit,
      avgMargin
    };
  }, [gridRows]);

  // Helper function to render column header with tooltip
  const renderHeaderWithTooltip = (title: string, hint: string) => (
    <Tooltip title={hint} arrow enterDelay={150} placement="top">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
        <span>{title}</span>
        <HelpOutlineIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
      </Box>
    </Tooltip>
  );

  // DataGrid Columns Definition with balanced responsive widths and tooltips
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'code',
      headerName: 'Код',
      width: 110,
      minWidth: 100,
      filterOperators: customStringOperators,
      renderHeader: () => renderHeaderWithTooltip('Код', 'Уникальный номенклатурный артикул услуги в учетной системе клиники.'),
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={`Номенклатурный код: ${params.value}`} arrow enterDelay={200}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>
            {params.value}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'name',
      headerName: 'Наименование медицинской услуги',
      flex: 3,
      minWidth: 320,
      filterOperators: customStringOperators,
      renderHeader: () => renderHeaderWithTooltip('Наименование услуги', 'Название процедуры по прейскуранту клиники. Нажмите на строку, чтобы открыть технологическую карту списания материалов со склада.'),
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="Нажмите, чтобы открыть технологическую карту BOM, перечень материалов и врачей" arrow enterDelay={200}>
          <Box
            onClick={() => handleOpenDrawer(params.row.id)}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              py: 0.5,
              '&:hover': { color: '#0284C7', textDecoration: 'underline' }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F3C64', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>
              {params.value}
            </Typography>
          </Box>
        </Tooltip>
      )
    },
    {
      field: 'category',
      headerName: 'Направление',
      flex: 1.4,
      minWidth: 175,
      filterOperators: customStringOperators,
      renderHeader: () => renderHeaderWithTooltip('Направление', 'Клиническая специализация процедуры: инъекции, хирургия, иммобилизация, консультации и др.'),
      renderCell: (params: GridRenderCellParams) => {
        const catColor = CATEGORY_COLORS[params.value] || '#64748B';
        return (
          <Tooltip title={`Клиническое направление: ${params.value}`} arrow enterDelay={200}>
            <Chip
              size="small"
              label={params.value}
              sx={{
                bgcolor: `${catColor}15`,
                color: catColor,
                fontWeight: 600,
                fontSize: '0.74rem',
                border: `1px solid ${catColor}30`,
                height: 'auto',
                py: 0.5,
                '& .MuiChip-label': { whiteSpace: 'normal', wordBreak: 'break-word', px: 1, py: 0.25 }
              }}
            />
          </Tooltip>
        );
      }
    },
    {
      field: 'abcClass',
      headerName: 'ABC',
      width: 90,
      minWidth: 85,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => renderHeaderWithTooltip('ABC', 'ABC-классификация: Класс A — ядро доходов (80% выручки), Класс B — умеренные доходы (следующие 15%), Класс C — редкие услуги (последние 5%).'),
      renderCell: (params: GridRenderCellParams) => {
        const val = params.value;
        const color = val === 'A' ? '#10B981' : val === 'B' ? '#3B82F6' : '#94A3B8';
        const hintText = val === 'A'
          ? 'Класс A: ключевая услуга клиники, входит в 80% основной выручки'
          : val === 'B'
          ? 'Класс B: стабильная услуга со средним вкладом в оборот (следующие 15% выручки)'
          : 'Класс C: сопутствующая или редкая процедура (входит в оставшиеся 5% выручки)';
        return (
          <Tooltip title={hintText} arrow enterDelay={200}>
            <Chip
              size="small"
              label={`Класс ${val}`}
              sx={{
                bgcolor: `${color}20`,
                color,
                fontWeight: 700,
                fontSize: '0.7rem',
                border: `1px solid ${color}40`,
                cursor: 'help'
              }}
            />
          </Tooltip>
        );
      }
    },
    {
      field: 'volume',
      headerName: 'Выполнено',
      type: 'number',
      width: 100,
      headerAlign: 'right',
      align: 'right',
      renderHeader: () => renderHeaderWithTooltip('Выполнено', 'Фактическое количество проведенных процедур пациентам за выбранный отчетный период.'),
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={`Процедура выполнена ${params.value} раз за отчетный период`} arrow enterDelay={200}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.value?.toLocaleString('ru-RU')}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'simulatedAvgPrice',
      headerName: 'Цена (₽)',
      type: 'number',
      width: 110,
      headerAlign: 'right',
      align: 'right',
      renderHeader: () => renderHeaderWithTooltip('Цена (₽)', 'Фактическая средняя стоимость одной процедуры для пациента (с учетом скидок и параметров симуляции).'),
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={`Средняя цена для пациента: ${Math.round(params.value || 0).toLocaleString('ru-RU')} ₽ за 1 прием`} arrow enterDelay={200}>
          <Typography variant="body2">
            {Math.round(params.value || 0).toLocaleString('ru-RU')} ₽
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'simulatedUnitBom',
      headerName: 'Себест. BOM',
      type: 'number',
      width: 115,
      headerAlign: 'right',
      align: 'right',
      renderHeader: () => renderHeaderWithTooltip('Себест. BOM', 'Прямая себестоимость материалов (Bill of Materials) на 1 процедуру: сумма закупочных цен медикаментов и расходников по технологической карте.'),
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={`Списание медикаментов на 1 процедуру: ${Math.round(params.value || 0).toLocaleString('ru-RU')} ₽`} arrow enterDelay={200}>
          <Typography variant="body2" color="text.secondary">
            {Math.round(params.value || 0).toLocaleString('ru-RU')} ₽
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'simulatedRev',
      headerName: 'Выручка (₽)',
      type: 'number',
      width: 125,
      headerAlign: 'right',
      align: 'right',
      renderHeader: () => renderHeaderWithTooltip('Выручка (₽)', 'Совокупная сумма денежных поступлений в кассу клиники за эту процедуру за весь выбранный период.'),
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={`Общая выручка клиники по этой процедуре: ${Math.round(params.value || 0).toLocaleString('ru-RU')} ₽`} arrow enterDelay={200}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
            {Math.round(params.value || 0).toLocaleString('ru-RU')} ₽
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'simulatedGrossProfit',
      headerName: 'Вал. прибыль',
      type: 'number',
      width: 125,
      headerAlign: 'right',
      align: 'right',
      renderHeader: () => renderHeaderWithTooltip('Вал. прибыль', 'Валовая прибыль = Выручка минус Затраты на медикаменты со склада. Показывает, сколько чистых денег услуга приносит клинике.'),
      renderCell: (params: GridRenderCellParams) => {
        const val = params.value || 0;
        const profitHint = val >= 0
          ? `Прибыль клиники после вычета материалов: +${Math.round(val).toLocaleString('ru-RU')} ₽`
          : `Внимание: процедура убыточна на ${Math.round(Math.abs(val)).toLocaleString('ru-RU')} ₽ из-за заниженной цены по сравнению со стоимостью медикаментов`;
        return (
          <Tooltip title={profitHint} arrow enterDelay={200}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: val >= 0 ? '#059669' : '#DC2626' }}
            >
              {Math.round(val).toLocaleString('ru-RU')} ₽
            </Typography>
          </Tooltip>
        );
      }
    },
    {
      field: 'simulatedMarginRate',
      headerName: 'Маржа %',
      type: 'number',
      width: 130,
      headerAlign: 'right',
      align: 'right',
      renderHeader: () => renderHeaderWithTooltip('Маржа %', 'Маржинальность = (Валовая прибыль ÷ Выручка) × 100%. Зеленый (>70%) — высокая доходность, синий (50-70%) — норма, оранжевый/красный (<50%) — зона низких наценок.'),
      renderCell: (params: GridRenderCellParams) => {
        const val = params.value || 0;
        let barColor = '#10B981'; // Green (>70%)
        let statusText = 'Высокая маржинальность (отличная доходность)';
        if (val < 20) {
          barColor = '#EF4444';
          statusText = 'Критически низкая или отрицательная маржа (пересмотреть прейскурант)';
        } else if (val < 50) {
          barColor = '#F59E0B';
          statusText = 'Пониженная маржинальность (высокая доля расходников)';
        } else if (val < 70) {
          barColor = '#3B82F6';
          statusText = 'Хорошая стабильная маржинальность (в рамках отраслевой нормы)';
        }

        return (
          <Tooltip title={`Маржа ${val}% — ${statusText}`} arrow enterDelay={200}>
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.5, cursor: 'help' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: barColor }}>
                  {val}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, Math.max(0, val))}
                sx={{
                  height: 5,
                  borderRadius: 3,
                  bgcolor: '#E2E8F0',
                  '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 3 }
                }}
              />
            </Box>
          </Tooltip>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Детали',
      width: 75,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => renderHeaderWithTooltip('Детали', 'Кнопка быстрого открытия технологической карты BOM и истории выполнений услуги.'),
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="Открыть технологическую карту: рецептура материалов, нормы расхода, цены закупки и врачи" arrow enterDelay={200}>
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDrawer(params.row.id);
            }}
            sx={{
              bgcolor: 'rgba(15, 60, 100, 0.08)',
              '&:hover': { bgcolor: 'rgba(15, 60, 100, 0.16)' }
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', maxWidth: '1600px', mx: 'auto', pb: 5 }}>
      {/* 1. Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AssessmentIcon sx={{ fontSize: 32, color: '#0F3C64' }} />
            <Tooltip title="Аналитический экран оценки доходности и материалоемкости медицинских услуг Центра ортопедии Добрушкина" arrow>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F3C64', letterSpacing: '-0.5px', cursor: 'help' }}>
                Анализ операций и услуг (Operations BI)
              </Typography>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Финансовая эффективность, калькуляция себестоимости материалов (BOM), ABC-анализ и матрица позиционирования
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Открыть интерактивный калькулятор прогнозирования: позволяет наглядно оценить финансовый результат при изменении цен на операции или росте стоимости медикаментов" arrow>
            <Button
              variant={showSimulator ? 'contained' : 'outlined'}
              color={showSimulator ? 'secondary' : 'primary'}
              startIcon={<TuneIcon />}
              onClick={() => setShowSimulator(!showSimulator)}
              sx={{ fontWeight: 600 }}
            >
              {showSimulator ? 'Скрыть симулятор' : 'What-If Симулятор цен'}
            </Button>
          </Tooltip>

          <Tooltip title="Сбросить все выбранные фильтры по датам, направлениям, врачам и вернуть фактические цены" arrow>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<FilterAltOffIcon />}
              onClick={handleResetFilters}
              sx={{ borderColor: '#CBD5E1' }}
            >
              Сброс
            </Button>
          </Tooltip>

          <Tooltip title="Перезагрузить свежие данные из базы данных клиники" arrow>
            <IconButton onClick={fetchData} sx={{ bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 2. Interactive What-If Simulation Panel */}
      <Collapse in={showSimulator}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #0F3C64 0%, #156C9C 100%)',
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15, 60, 100, 0.25)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TuneIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Интерактивный симулятор чувствительности прибыли (What-If Analysis)
              </Typography>
            </Box>
            <Tooltip title="Сбросить смоделированные проценты и вернуть реальные цены каталога" arrow>
              <Button
                size="small"
                variant="contained"
                onClick={() => { setPriceAdjustmentPct(0); setBomAdjustmentPct(0); }}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#FFF', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                Сбросить к факту
              </Button>
            </Tooltip>
          </Box>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Tooltip title="Потяните ползунок, чтобы смоделировать изменение розничных цен в прейскуранте (например, индексацию на +10% или скидку -5%)" arrow placement="top">
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, cursor: 'help' }}>
                    Индексация прейскуранта (Цены операций):{' '}
                    <strong style={{ fontSize: '1.1rem', color: priceAdjustmentPct >= 0 ? '#34D399' : '#F87171' }}>
                      {priceAdjustmentPct > 0 ? `+${priceAdjustmentPct}%` : `${priceAdjustmentPct}%`}
                    </strong>
                  </Typography>
                  <Slider
                    value={priceAdjustmentPct}
                    min={-20}
                    max={30}
                    step={1}
                    onChange={(_, val) => setPriceAdjustmentPct(val as number)}
                    valueLabelDisplay="auto"
                    sx={{
                      color: '#34D399',
                      '& .MuiSlider-thumb': { bgcolor: '#FFFFFF' },
                      '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                  />
                </Box>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Tooltip title="Потяните ползунок, чтобы смоделировать изменение закупочных цен на медикаменты и расходники от поставщиков" arrow placement="top">
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1, cursor: 'help' }}>
                    Колебание стоимости расходных материалов (BOM):{' '}
                    <strong style={{ fontSize: '1.1rem', color: bomAdjustmentPct <= 0 ? '#34D399' : '#F87171' }}>
                      {bomAdjustmentPct > 0 ? `+${bomAdjustmentPct}%` : `${bomAdjustmentPct}%`}
                    </strong>
                  </Typography>
                  <Slider
                    value={bomAdjustmentPct}
                    min={-20}
                    max={30}
                    step={1}
                    onChange={(_, val) => setBomAdjustmentPct(val as number)}
                    valueLabelDisplay="auto"
                    sx={{
                      color: '#F87171',
                      '& .MuiSlider-thumb': { bgcolor: '#FFFFFF' },
                      '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                  />
                </Box>
              </Tooltip>
            </Grid>
          </Grid>

          {(priceAdjustmentPct !== 0 || bomAdjustmentPct !== 0) && simulatedData && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.12)',
                display: 'flex',
                gap: 3,
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              <Tooltip title="Ожидаемая дополнительная прибыль (или убыток) клиники в рублях при применении данных коэффициентов" arrow>
                <Typography variant="body2" sx={{ cursor: 'help' }}>
                  Прогнозное изменение прибыли:{' '}
                  <strong style={{ color: simulatedData.summary.profitDelta >= 0 ? '#34D399' : '#F87171' }}>
                    {simulatedData.summary.profitDelta >= 0 ? '+' : ''}
                    {Math.round(simulatedData.summary.profitDelta).toLocaleString('ru-RU')} ₽
                  </strong>
                </Typography>
              </Tooltip>

              <Tooltip title="Итоговая прогнозная выручка клиники с учетом индексации цен" arrow>
                <Typography variant="body2" sx={{ cursor: 'help' }}>
                  Скорректированная выручка:{' '}
                  <strong>{Math.round(simulatedData.summary.totalRevenue).toLocaleString('ru-RU')} ₽</strong>
                </Typography>
              </Tooltip>

              <Tooltip title="Новый расчетный средний процент валовой маржинальности процедур клиники" arrow>
                <Typography variant="body2" sx={{ cursor: 'help' }}>
                  Новая средняя маржинальность:{' '}
                  <strong>{simulatedData.summary.marginRate}%</strong>
                </Typography>
              </Tooltip>
            </Box>
          )}
        </Paper>
      </Collapse>

      {/* 3. Smart AI/BI Executive Digest */}
      {data?.insights && data.insights.length > 0 && (
        <Grid container spacing={2}>
          {data.insights.map((ins: any) => {
            let borderCol = '#10B981';
            let icon = <CheckCircleIcon sx={{ color: '#10B981' }} />;
            let hint = 'Ключевой аналитический вывод системы управления клиникой.';

            if (ins.id === 'top_driver') {
              borderCol = '#10B981';
              icon = <CheckCircleIcon sx={{ color: '#10B981' }} />;
              hint = 'Услуга-локомотив: обеспечивает максимальный объем денежных поступлений в кассу клиники. Рекомендуется контролировать постоянное наличие препаратов для нее.';
            } else if (ins.id === 'category_lead') {
              borderCol = '#0284C7';
              icon = <InfoIcon sx={{ color: '#0284C7' }} />;
              hint = 'Профильное флагманское направление: формирует основную массу выручки клиники с высокой нормой рентабельности.';
            } else if (ins.id === 'low_margin_alert') {
              borderCol = '#F59E0B';
              icon = <WarningAmberIcon sx={{ color: '#F59E0B' }} />;
              hint = 'Внимание руководству: у данных процедур стоимость медикаментов слишком высока по сравнению с ценой чека. Рекомендуется поднять цену в прейскуранте или пересмотреть протокол расхода.';
            } else if (ins.id === 'volume_leader') {
              borderCol = '#7C3AED';
              icon = <TrendingUpIcon sx={{ color: '#7C3AED' }} />;
              hint = 'Самая массовая процедура: формирует основной пациентопоток и загрузку кабинетов клиники.';
            }

            return (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={ins.id}>
                <Tooltip title={hint} arrow enterDelay={150} placement="top">
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      height: '100%',
                      borderRadius: 2.5,
                      border: '1px solid #E2E8F0',
                      borderLeft: `5px solid ${borderCol}`,
                      bgcolor: '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s',
                      cursor: 'help',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {icon}
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                          {ins.title}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.4, display: 'block' }}>
                        {ins.text}
                      </Typography>
                    </Box>
                  </Paper>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* 4. Clever Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center'
        }}
      >
        <Tooltip title="Ограничить анализ конкретным временным интервалом: за весь период, текущий год или отдельный месяц" arrow>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="period-label">Отчетный период</InputLabel>
            <Select
              labelId="period-label"
              value={period}
              label="Отчетный период"
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value="all">За всё время</MenuItem>
              <MenuItem value="2026">Весь 2026 год</MenuItem>
              <MenuItem value="2026-09">Сентябрь 2026</MenuItem>
              <MenuItem value="2026-08">Август 2026</MenuItem>
              <MenuItem value="2026-07">Июль 2026</MenuItem>
              <MenuItem value="2026-06">Июнь 2026</MenuItem>
              <MenuItem value="2026-05">Май 2026</MenuItem>
              <MenuItem value="2026-04">Апрель 2026</MenuItem>
              <MenuItem value="2026-03">Март 2026</MenuItem>
              <MenuItem value="2026-02">Февраль 2026</MenuItem>
              <MenuItem value="2026-01">Январь 2026</MenuItem>
            </Select>
          </FormControl>
        </Tooltip>

        <Tooltip title="Фильтровать операции по типу вмешательства (инъекции гиалуроновой кислоты и PRP, хирургия, иммобилизация Турбокаст и др.)" arrow>
          <FormControl size="small" sx={{ minWidth: 230 }}>
            <InputLabel id="category-label">Клиническое направление</InputLabel>
            <Select
              labelId="category-label"
              value={category}
              label="Клиническое направление"
              onChange={(e) => setCategory(e.target.value)}
            >
              <MenuItem value="all">Все направления клиники</MenuItem>
              <MenuItem value="Инъекционная терапия и PRP/SVF">Инъекционная терапия и PRP/SVF</MenuItem>
              <MenuItem value="Хирургические операции">Хирургические операции</MenuItem>
              <MenuItem value="Иммобилизация и травматология">Иммобилизация и травматология</MenuItem>
              <MenuItem value="Консультации и диагностика">Консультации и диагностика</MenuItem>
              <MenuItem value="Физиотерапия и реабилитация">Физиотерапия и реабилитация</MenuItem>
              <MenuItem value="Прочие манипуляции и процедуры">Прочие манипуляции</MenuItem>
            </Select>
          </FormControl>
        </Tooltip>

        <Tooltip title="Анализ эффективности работы конкретного специалиста: Добрушкин А.М. (Главврач) или Петров С.В. (Ортопед)" arrow>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="doctor-label">Оперирующий хирург</InputLabel>
            <Select
              labelId="doctor-label"
              value={doctorId}
              label="Оперирующий хирург"
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <MenuItem value="all">Все специалисты клиники</MenuItem>
              <MenuItem value="1">Добрушкин А.М. (Главный врач)</MenuItem>
              <MenuItem value="2">Петров С.В. (Врач-ортопед)</MenuItem>
            </Select>
          </FormControl>
        </Tooltip>

        <Tooltip title="Быстрый живой фильтр по названию процедуры или коду услуги в прейскуранте" arrow>
          <TextField
            size="small"
            placeholder="Фильтр по названию процедуры..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 220 }}
          />
        </Tooltip>
      </Paper>

      {/* 5. 6 KPI Scorecards */}
      <Grid container spacing={2}>
        {/* KPI 1: Выручка */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Tooltip
            title="Общая сумма поступивших денежных средств от пациентов за все проведенные манипуляции за выбранный период. Складывается из всех закрытых чеков."
            arrow
            placement="top"
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                cursor: 'help'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }} color="text.secondary">
                  ВЫРУЧКА
                </Typography>
                <MonetizationOnIcon sx={{ color: '#0F3C64', fontSize: 20 }} />
              </Box>
              {loading ? (
                <Skeleton variant="text" width={100} height={32} />
              ) : (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                    {Math.round(simulatedData?.summary.totalRevenue || 0).toLocaleString('ru-RU')} ₽
                  </Typography>
                  <Tooltip title="Средняя стоимость одной медицинской услуги для пациента (Общая выручка ÷ Объем процедур)" arrow>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Ср. чек: {Math.round(simulatedData?.summary.avgCheck || 0).toLocaleString('ru-RU')} ₽
                    </Typography>
                  </Tooltip>
                </>
              )}
            </Paper>
          </Tooltip>
        </Grid>

        {/* KPI 2: Затраты BOM */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Tooltip
            title="Себестоимость расходных материалов (Bill of Materials) — сумма закупочных цен всех медикаментов, имплантов, ампул и шприцев, списанных со склада клиники на проведение процедур. Показывает, сколько реальных денег клиника потратила на материалы."
            arrow
            placement="top"
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                cursor: 'help'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }} color="text.secondary">
                  ЗАТРАТЫ BOM
                </Typography>
                <Inventory2Icon sx={{ color: '#64748B', fontSize: 20 }} />
              </Box>
              {loading ? (
                <Skeleton variant="text" width={100} height={32} />
              ) : (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
                    {Math.round(simulatedData?.summary.totalBomCost || 0).toLocaleString('ru-RU')} ₽
                  </Typography>
                  <Tooltip title="Материалоемкость клиники: показывает, какой процент от выручки уходит поставщикам за медикаменты и расходники" arrow>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Доля: {simulatedData?.summary.totalRevenue > 0
                        ? Math.round((simulatedData.summary.totalBomCost / simulatedData.summary.totalRevenue) * 1000) / 10
                        : 0}%
                    </Typography>
                  </Tooltip>
                </>
              )}
            </Paper>
          </Tooltip>
        </Grid>

        {/* KPI 3: Валовая прибыль */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Tooltip
            title="Разница между полученной выручкой и затратами на медикаменты со склада (Выручка минус Затраты BOM). Это чистая маржинальная прибыль от медицинских манипуляций до вычета общих постоянных расходов (аренда, налоги, админперсонал)."
            arrow
            placement="top"
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                cursor: 'help'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }} color="text.secondary">
                  ВАЛОВАЯ ПРИБЫЛЬ
                </Typography>
                <TrendingUpIcon sx={{ color: '#059669', fontSize: 20 }} />
              </Box>
              {loading ? (
                <Skeleton variant="text" width={100} height={32} />
              ) : (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>
                    {Math.round(simulatedData?.summary.grossProfit || 0).toLocaleString('ru-RU')} ₽
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, display: 'block' }}>
                    {simulatedData?.summary.profitDelta !== 0 && simulatedData?.summary.profitDelta !== undefined
                      ? `${simulatedData.summary.profitDelta > 0 ? '+' : ''}${Math.round(simulatedData.summary.profitDelta).toLocaleString('ru-RU')} ₽`
                      : 'Чистая прибыль операций'}
                  </Typography>
                </>
              )}
            </Paper>
          </Tooltip>
        </Grid>

        {/* KPI 4: Средняя маржинальность */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Tooltip
            title="Процент выручки, остающийся после списания себестоимости материалов ((Прибыль ÷ Выручка) × 100%). Выше 70% — высокая норма прибыли, 50-70% — стандартная, ниже 40% — требует пересмотра цены услуги."
            arrow
            placement="top"
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                cursor: 'help'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }} color="text.secondary">
                  МАРЖИНАЛЬНОСТЬ
                </Typography>
                <AssessmentIcon sx={{ color: '#0284C7', fontSize: 20 }} />
              </Box>
              {loading ? (
                <Skeleton variant="text" width={100} height={32} />
              ) : (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0284C7' }}>
                    {simulatedData?.summary.marginRate || 0}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Целевой бенчмарк: &gt;60%
                  </Typography>
                </>
              )}
            </Paper>
          </Tooltip>
        </Grid>

        {/* KPI 5: Объем операций */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Tooltip
            title="Суммарное количество раз, сколько медицинские процедуры и операции были фактически проведены пациентам за выбранный период."
            arrow
            placement="top"
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                cursor: 'help'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }} color="text.secondary">
                  ОБЪЕМ ОПЕРАЦИЙ
                </Typography>
                <LayersIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
              </Box>
              {loading ? (
                <Skeleton variant="text" width={100} height={32} />
              ) : (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#7C3AED' }}>
                    {simulatedData?.summary.operationsCount?.toLocaleString('ru-RU') || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Всего визитов и манипуляций
                  </Typography>
                </>
              )}
            </Paper>
          </Tooltip>
        </Grid>

        {/* KPI 6: Активных процедур */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Tooltip
            title="Количество уникальных позиций процедур из официального каталога клиники, которые были реально выполнены хотя бы 1 раз за данный отчетный период."
            arrow
            placement="top"
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                cursor: 'help'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }} color="text.secondary">
                  НОМЕНКЛАТУР В РАБОТЕ
                </Typography>
                <ScienceIcon sx={{ color: '#D97706', fontSize: 20 }} />
              </Box>
              {loading ? (
                <Skeleton variant="text" width={100} height={32} />
              ) : (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#D97706' }}>
                    {simulatedData?.summary.uniqueProceduresCount || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Позиций из каталога
                  </Typography>
                </>
              )}
            </Paper>
          </Tooltip>
        </Grid>
      </Grid>

      {/* 6. Visualizations Tabs Bar */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: '#F8FAFC' }}>
          <Tabs
            value={activeChartTab}
            onChange={(_, val) => setActiveChartTab(val)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab
              icon={<BarChartIcon fontSize="small" />}
              iconPosition="start"
              label={
                <Tooltip title="Помесячные графики выручки, себестоимости и маржинальности клиники, а также диаграмма структуры доходов по направлениям" arrow>
                  <span>Финансовые тренды и направления</span>
                </Tooltip>
              }
            />
            <Tab
              icon={<ScatterPlotIcon fontSize="small" />}
              iconPosition="start"
              label={
                <Tooltip title="Интерактивная карта распределения услуг по объемам выполнения (X) и маржинальности (Y). Позволяет найти звездные услуги и зону ценового риска" arrow>
                  <span>4-Квадрантная матрица эффективности (BCG)</span>
                </Tooltip>
              }
            />
            <Tab
              icon={<PieChartIcon fontSize="small" />}
              iconPosition="start"
              label={
                <Tooltip title="Рейтинг наиболее доходных медицинских процедур в абсолютных рублях валовой прибыли" arrow>
                  <span>Рейтинг ТОП-10 услуг по прибыли</span>
                </Tooltip>
              }
            />
          </Tabs>
        </Box>

        {/* TAB 0: Monthly Trend + Categories Donut */}
        {activeChartTab === 0 && (
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Tooltip title="Темно-синие столбцы — выручка, серые — затраты на медикаменты со склада BOM, зеленая линия — процент чистой маржи клиники" arrow>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                    Помесячная динамика: Выручка vs Себестоимость BOM vs Маржинальность %
                  </Typography>
                </Tooltip>
                <Box sx={{ width: '100%', height: 320 }}>
                  {data?.monthlyTrend && data.monthlyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.monthlyTrend} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="label" stroke="#64748B" fontSize={12} />
                        <YAxis
                          yAxisId="left"
                          stroke="#64748B"
                          fontSize={12}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#10B981"
                          fontSize={12}
                          unit="%"
                          domain={[0, 100]}
                        />
                        <RechartsTooltip
                          formatter={(value: any, name: any) => {
                            if (name === 'Маржинальность') return [`${value}%`, name];
                            return [`${Math.round(value).toLocaleString('ru-RU')} ₽`, name];
                          }}
                          contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" name="Выручка" fill="#0F3C64" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="bomCost" name="Затраты BOM" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="marginRate"
                          name="Маржинальность"
                          stroke="#10B981"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Typography color="text.secondary">Нет данных за выбранный период</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Tooltip title="Нажмите на сектор или легенду, чтобы увидеть долю каждого медицинского профиля в общей выручке клиники" arrow>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                    Структура выручки по направлениям
                  </Typography>
                </Tooltip>
                <Box sx={{ width: '100%', height: 320 }}>
                  {data?.categories && data.categories.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.categories}
                          dataKey="revenue"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {data.categories.map((entry: any) => (
                            <Cell
                              key={entry.category}
                              fill={CATEGORY_COLORS[entry.category] || '#64748B'}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(v: any) => `${Math.round(v).toLocaleString('ru-RU')} ₽`}
                          contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Typography color="text.secondary">Нет данных</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 1: 4-Quadrant BCG Matrix */}
        {activeChartTab === 1 && (
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Tooltip title="Разделение процедур на 4 группы: Флагманы (высокий объем + высокая маржа), Ниши (мало операций, но высокая прибыль), Потоковые (высокий поток, средняя маржа) и Зона риска (мало операций и низкая маржа)" arrow>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', cursor: 'help' }}>
                  Матрица эффективности: Объем процедур (X) vs Маржинальность % (Y)
                </Typography>
              </Tooltip>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Tooltip title="Флагманы: много проводят и высокая маржа (основа финансового благополучия)" arrow>
                  <Chip size="small" label="Флагманы (Stars)" sx={{ bgcolor: `${QUADRANT_COLORS.stars}20`, color: QUADRANT_COLORS.stars, fontWeight: 700, cursor: 'help' }} />
                </Tooltip>
                <Tooltip title="Ниши: редкие операции с очень высокой прибылью с одной процедуры" arrow>
                  <Chip size="small" label="Высокодоходные ниши" sx={{ bgcolor: `${QUADRANT_COLORS.niche}20`, color: QUADRANT_COLORS.niche, fontWeight: 700, cursor: 'help' }} />
                </Tooltip>
                <Tooltip title="Потоковые: массовые манипуляции со стандартной или умеренной маржой" arrow>
                  <Chip size="small" label="Потоковые услуги" sx={{ bgcolor: `${QUADRANT_COLORS.cash_cows}20`, color: QUADRANT_COLORS.cash_cows, fontWeight: 700, cursor: 'help' }} />
                </Tooltip>
                <Tooltip title="Зона риска: низкий объем и низкая маржа (рекомендуется пересмотреть цены или исключить)" arrow>
                  <Chip size="small" label="Зона риска" sx={{ bgcolor: `${QUADRANT_COLORS.question}20`, color: QUADRANT_COLORS.question, fontWeight: 700, cursor: 'help' }} />
                </Tooltip>
              </Box>
            </Box>

            <Box sx={{ width: '100%', height: 380 }}>
              {data?.quadrantMatrix && data.quadrantMatrix.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      type="number"
                      dataKey="volume"
                      name="Выполнено операций"
                      stroke="#64748B"
                      fontSize={12}
                    />
                    <YAxis
                      type="number"
                      dataKey="marginRate"
                      name="Маржинальность %"
                      stroke="#64748B"
                      fontSize={12}
                      domain={[-50, 100]}
                      unit="%"
                    />
                    <ZAxis type="number" dataKey="revenue" range={[40, 400]} />
                    <ReferenceLine x={10} stroke="#94A3B8" strokeDasharray="4 4" label={{ value: 'Бенчмарк объема (10)', fill: '#64748B', fontSize: 11 }} />
                    <ReferenceLine y={60} stroke="#94A3B8" strokeDasharray="4 4" label={{ value: 'Бенчмарк маржи (60%)', fill: '#64748B', fontSize: 11 }} />
                    <RechartsTooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const it = payload[0].payload;
                          return (
                            <Paper sx={{ p: 1.5, border: '1px solid #CBD5E1', borderRadius: 2, maxWidth: 300 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                                {it.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Категория: {it.category}
                              </Typography>
                              <Divider sx={{ my: 0.5 }} />
                              <Typography variant="body2">
                                Выполнено: <strong>{it.volume} раз</strong>
                              </Typography>
                              <Typography variant="body2">
                                Маржа: <strong style={{ color: it.marginRate >= 50 ? '#059669' : '#DC2626' }}>{it.marginRate}%</strong>
                              </Typography>
                              <Typography variant="body2">
                                Выручка: <strong>{Math.round(it.revenue).toLocaleString('ru-RU')} ₽</strong>
                              </Typography>
                              <Chip
                                size="small"
                                label={it.quadrantLabel}
                                sx={{
                                  mt: 1,
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  bgcolor: `${QUADRANT_COLORS[it.quadrant] || '#64748B'}20`,
                                  color: QUADRANT_COLORS[it.quadrant] || '#64748B'
                                }}
                              />
                            </Paper>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter
                      data={data.quadrantMatrix}
                      fill="#0284C7"
                      onClick={(node: any) => handleOpenDrawer(node?.id || node?.payload?.id)}
                    >
                      {data.quadrantMatrix.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={QUADRANT_COLORS[entry.quadrant] || '#0284C7'}
                          style={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.secondary">Нет данных</Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* TAB 2: Top-10 Profitable Procedures */}
        {activeChartTab === 2 && (
          <Box sx={{ p: 2.5 }}>
            <Tooltip title="Процедуры, которые принесли клинике больше всего чистых денег после вычета стоимости израсходованных медикаментов" arrow>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                ТОП-10 процедур клиники по валовой прибыли (Gross Profit)
              </Typography>
            </Tooltip>
            <Box sx={{ width: '100%', height: 380 }}>
              {data?.topProcedures && data.topProcedures.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={data.topProcedures}
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis
                      type="number"
                      stroke="#64748B"
                      fontSize={12}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#64748B"
                      fontSize={11}
                      width={180}
                      tickFormatter={(name) => name.length > 25 ? `${name.substring(0, 25)}...` : name}
                    />
                    <RechartsTooltip
                      formatter={(v: any) => [`${Math.round(v).toLocaleString('ru-RU')} ₽`, 'Валовая прибыль']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                    />
                    <Bar dataKey="grossProfit" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.secondary">Нет данных</Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* 7. High-Density DataGrid (Adheres to grid-improvements skill: expanded height, full toolbar, sticky footer, zero scrollbars) */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          width: '100%',
          minHeight: 520
        }}
      >
        <Box sx={{ width: '100%' }}>
          <DataGrid
            autoHeight
            getRowHeight={() => 'auto'}
            rows={gridRows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
              sorting: { sortModel: [{ field: 'simulatedRev', sort: 'desc' }] }
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            showToolbar
            columnHeaderHeight={54}
            localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
            slots={{
              toolbar: AnalyticsGridToolbar,
              footer: AnalyticsGridFooter
            }}
            slotProps={{
              toolbar: {
                onClearCustomSearch: () => setSearch('')
              } as any,
              footer: {
                totals: gridTotals
              } as any
            }}
            sx={{
              border: 0,
              width: '100%',
              minHeight: 480,
              '& .MuiDataGrid-virtualScroller': {
                overflowX: 'hidden'
              },
              '& .MuiDataGrid-columnHeaders': {
                position: 'sticky',
                top: 0,
                zIndex: 1,
                bgcolor: '#F8FAFC',
                borderBottom: '2px solid #CBD5E1',
                fontWeight: 700,
                color: '#0F3C64'
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                color: '#0F3C64',
                whiteSpace: 'normal',
                lineHeight: '1.25rem'
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                py: 1.2
              },
              '& .MuiDataGrid-row': {
                minHeight: '52px !important'
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: '#F8FAFC'
              }
            }}
          />
        </Box>
      </Paper>

      {/* 8. Slide-Over Drill-down Drawer for BOM and Procedure Details */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 540, md: 620 },
              p: 3,
              bgcolor: '#FFFFFF'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tooltip title="Технологическая карта расхода материалов: спецификация медикаментов, имплантов и перевязочных средств со склада клиники" arrow>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64', cursor: 'help' }}>
              Технологическая карта (BOM)
            </Typography>
          </Tooltip>
          <Tooltip title="Закрыть панель детализации" arrow>
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {drawerLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
          </Box>
        ) : drawerData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header info */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0'
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <Tooltip title="Уникальный номенклатурный шифр услуги" arrow>
                  <Chip size="small" label={drawerData.operation.code} sx={{ fontFamily: 'monospace', fontWeight: 700, cursor: 'help' }} />
                </Tooltip>
                <Tooltip title="Клинический профиль медицинской помощи" arrow>
                  <Chip
                    size="small"
                    label={drawerData.operation.category}
                    sx={{
                      bgcolor: `${CATEGORY_COLORS[drawerData.operation.category] || '#64748B'}15`,
                      color: CATEGORY_COLORS[drawerData.operation.category] || '#64748B',
                      fontWeight: 600,
                      cursor: 'help'
                    }}
                  />
                </Tooltip>
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
                {drawerData.operation.name}
              </Typography>

              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 6 }}>
                  <Tooltip title="Официальная прейскурантная цена процедуры для пациента" arrow>
                    <Box sx={{ cursor: 'help' }}>
                      <Typography variant="caption" color="text.secondary">Каталожная цена:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {drawerData.operation.catalog_price?.toLocaleString('ru-RU')} ₽
                      </Typography>
                    </Box>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Tooltip title="Прямая сумма закупочных цен на медикаменты со склада на 1 процедуру" arrow>
                    <Box sx={{ cursor: 'help' }}>
                      <Typography variant="caption" color="text.secondary">Себестоимость BOM:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>
                        {drawerData.operation.totalBomCost?.toLocaleString('ru-RU')} ₽
                      </Typography>
                    </Box>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Tooltip title="Сколько раз процедура была проведена пациентам клиники за все время" arrow>
                    <Box sx={{ cursor: 'help' }}>
                      <Typography variant="caption" color="text.secondary">Всего выполнено:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {drawerData.operation.totalCount} раз
                      </Typography>
                    </Box>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Tooltip title="Процент валовой прибыли, остающийся клинике от стоимости услуги" arrow>
                    <Box sx={{ cursor: 'help' }}>
                      <Typography variant="caption" color="text.secondary">Маржинальность:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                        {drawerData.operation.marginRate}%
                      </Typography>
                    </Box>
                  </Tooltip>
                </Grid>
              </Grid>
            </Paper>

            {/* BOM Materials Table with Column Tooltips */}
            <Box>
              <Tooltip title="Полная номенклатурная спецификация расхода со склада: препараты, шприцы, анестетики, импланты и перевязка" arrow>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1, cursor: 'help' }}>
                  Расходные материалы по технологической карте ({drawerData.materials.length} поз.)
                </Typography>
              </Tooltip>
              {drawerData.materials.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                          <Tooltip title="Торговое или химическое наименование медикамента или изделия со склада" arrow>
                            <span>Материал</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                          <Tooltip title="Норма расхода материала на проведение 1 манипуляции (шт, мл, ампулы)" arrow>
                            <span>Норма</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                          <Tooltip title="Текущая средняя закупочная цена за 1 единицу материала от поставщиков" arrow>
                            <span>Цена за ед.</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                          <Tooltip title="Итоговые затраты клиники на этот конкретный материал в рамках 1 процедуры (Норма × Цена)" arrow>
                            <span>Сумма</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                          <Tooltip title="Доля стоимости этого материала в общей себестоимости процедуры (показывает ключевой удорожающий фактор)" arrow>
                            <span>Доля</span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {drawerData.materials.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell sx={{ fontSize: '0.8rem' }}>
                            <Tooltip title={`Наименование со склада: ${m.material_name}`} arrow enterDelay={200}>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                {m.material_name}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.8rem' }}>
                            <Tooltip title={`Расход: ${m.quantity} ${m.unit_of_measure}`} arrow enterDelay={200}>
                              <span>{m.quantity} {m.unit_of_measure}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.8rem' }}>
                            <Tooltip title={`Закупочная цена за единицу: ${m.current_unit_cost?.toLocaleString('ru-RU')} ₽`} arrow enterDelay={200}>
                              <span>{m.current_unit_cost?.toLocaleString('ru-RU')} ₽</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            <Tooltip title={`Сумма списания по позиции: ${m.total_line_cost?.toLocaleString('ru-RU')} ₽`} arrow enterDelay={200}>
                              <span>{m.total_line_cost?.toLocaleString('ru-RU')} ₽</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                            <Tooltip title={`Формирует ${m.shareInBom}% от всей стоимости материалов процедуры`} arrow enterDelay={200}>
                              <span>{m.shareInBom}%</span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell colSpan={3} sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          <Tooltip title="Полная себестоимость технологической карты расхода материалов" arrow>
                            <span>ИТОГО СЕБЕСТОИМОСТЬ BOM:</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#DC2626', fontSize: '0.85rem' }}>
                          <Tooltip title="Суммарная себестоимость медикаментов на 1 манипуляцию" arrow>
                            <span>{drawerData.operation.totalBomCost?.toLocaleString('ru-RU')} ₽</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          100%
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Для данной процедуры технологическая карта BOM пока не заполнена в номенклатуре.
                </Alert>
              )}
            </Box>

            {/* Doctors Distribution */}
            <Box>
              <Tooltip title="Статистика проведения данной процедуры хирургами клиники Добрушкина" arrow>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1, cursor: 'help' }}>
                  Распределение по оперирующим специалистам
                </Typography>
              </Tooltip>
              <Grid container spacing={2}>
                {drawerData.doctors.map((d: any) => (
                  <Grid size={{ xs: 6 }} key={d.id}>
                    <Tooltip title={`Врач ${d.name} провел(а) ${d.count} процедур (${d.sharePct}% от общего объема)`} arrow>
                      <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <PersonIcon fontSize="small" sx={{ color: '#0F3C64' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }} noWrap>
                            {d.name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {d.role}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {d.count} операций
                          </Typography>
                          <Chip size="small" label={`${d.sharePct}%`} sx={{ fontWeight: 700, height: 20 }} />
                        </Box>
                      </Paper>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Monthly Trend Mini Chart */}
            {drawerData.history && drawerData.history.length > 0 && (
              <Box>
                <Tooltip title="Динамика количества проведенных процедур по месяцам" arrow>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1, cursor: 'help' }}>
                    Помесячная динамика проведения услуги
                  </Typography>
                </Tooltip>
                <Box sx={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={drawerData.history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} />
                      <RechartsTooltip
                        formatter={(v: any, name: any) => [name === 'Количество' ? `${v} раз` : `${v} ₽`, name]}
                        contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                      />
                      <Bar dataKey="count" name="Количество" fill="#0F3C64" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}
          </Box>
        ) : null}
      </Drawer>
    </Box>
  );
}
