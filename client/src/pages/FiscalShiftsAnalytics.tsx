import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Drawer,
  Tabs,
  Tab,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CloseIcon from '@mui/icons-material/Close';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import { useReactToPrint } from 'react-to-print';
import FiscalShiftCloseModal from '../components/FiscalShiftCloseModal';
import { FiscalZReportPrintTemplate } from '../components/FiscalZReportPrintTemplate';

export default function FiscalShiftsAnalytics() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentShiftStatus, setCurrentShiftStatus] = useState<any>(null);
  const [summary, setSummary] = useState<any>({
    totalShifts: 0,
    totalIncome: 0,
    cashIncome: 0,
    cardIncome: 0,
    sbpIncome: 0,
    receiptsCount: 0,
    totalDiscrepancy: 0
  });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [onlyDiscrepancies, setOnlyDiscrepancies] = useState(false);

  // Modals & Drawers
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [shiftDetails, setShiftDetails] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState(0);

  // Print ref for drawer Z-Report
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrintDrawerZ = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Z_Report_${shiftDetails?.shift?.mnemonic_code || 'Shift'}`
  });

  useEffect(() => {
    loadShifts();
    loadCurrentShiftStatus();
  }, [statusFilter, dateFrom, dateTo, onlyDiscrepancies]);

  const loadCurrentShiftStatus = async () => {
    try {
      const res = await fetch('/api/fiscal/shifts/current');
      const data = await res.json();
      setCurrentShiftStatus(data);
    } catch (e) {
      console.warn('Failed to fetch current shift status:', e);
    }
  };

  const loadShifts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (statusFilter) queryParams.set('status', statusFilter);
      if (dateFrom) queryParams.set('dateFrom', dateFrom);
      if (dateTo) queryParams.set('dateTo', dateTo);
      if (onlyDiscrepancies) queryParams.set('onlyDiscrepancies', 'true');
      queryParams.set('limit', '100');

      const res = await fetch(`/api/fiscal/shifts?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setShifts(data.items || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error loading shifts journal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = new Date().toISOString().slice(0, 10);

    if (preset === 'today') {
      setDateFrom(today);
      setDateTo(today);
    } else if (preset === 'yesterday') {
      const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      setDateFrom(y);
      setDateTo(y);
    } else if (preset === 'week') {
      const w = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      setDateFrom(w);
      setDateTo(today);
    } else if (preset === 'month') {
      const m = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      setDateFrom(m);
      setDateTo(today);
    } else {
      setDateFrom('');
      setDateTo('');
    }
  };

  const handleOpenDetails = async (shiftId: number) => {
    setDetailsDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerTab(0);
    try {
      const res = await fetch(`/api/fiscal/shifts/${shiftId}`);
      const data = await res.json();
      if (data.success) {
        setShiftDetails(data);
      }
    } catch (e) {
      console.error('Error fetching shift details:', e);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleManualOpenShift = async () => {
    try {
      const res = await fetch('/api/fiscal/shifts/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorName: 'Администратор' })
      });
      const data = await res.json();
      if (data.success) {
        loadShifts();
        loadCurrentShiftStatus();
      }
    } catch (e) {
      console.error('Error opening shift:', e);
    }
  };

  const formatCurrency = (val: number = 0) =>
    Number(val).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';

  // Columns for DataGrid
  const columns: GridColDef[] = [
    {
      field: 'mnemonic_code',
      headerName: 'Мнемоника смены',
      width: 175,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          onClick={() => handleOpenDetails(params.row.id)}
          sx={{
            fontWeight: 800,
            bgcolor: '#EBF8FF',
            color: '#0F3C64',
            border: '1px solid #BEE3F8',
            cursor: 'pointer',
            '&:hover': { bgcolor: '#BEE3F8' }
          }}
        />
      )
    },
    {
      field: 'shift_number',
      headerName: 'ФН №',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4A5568' }}>
          #{params.value}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Статус',
      width: 110,
      renderCell: (params: GridRenderCellParams) => {
        const isOpen = params.value === 'open';
        return (
          <Chip
            size="small"
            label={isOpen ? 'Открыта' : 'Закрыта'}
            color={isOpen ? 'success' : 'default'}
            sx={{ fontWeight: 700 }}
          />
        );
      }
    },
    {
      field: 'opened_at',
      headerName: 'Открытие',
      width: 155,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption" sx={{ color: '#334155', fontWeight: 500 }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'closed_at',
      headerName: 'Закрытие',
      width: 155,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption" sx={{ color: '#64748B' }}>
          {params.value || '— (в процессе)'}
        </Typography>
      )
    },
    {
      field: 'opened_by',
      headerName: 'Кассир',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'receipts_count',
      headerName: 'Чеков',
      width: 85,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {params.value || 0}
        </Typography>
      )
    },
    {
      field: 'cash_income',
      headerName: 'Наличные',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600 }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'card_income',
      headerName: 'Карты (ЭК)',
      width: 125,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ color: '#1E40AF', fontWeight: 600 }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'sbp_income',
      headerName: 'СБП (QR)',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ color: '#6B21A8', fontWeight: 600 }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'total_income',
      headerName: 'Итого Выручка',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'cash_difference',
      headerName: 'Расхождение',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => {
        const diff = Number(params.value) || 0;
        if (params.row.status === 'open') {
          return <Typography variant="caption" sx={{ color: '#94A3B8' }}>—</Typography>;
        }
        if (diff === 0) {
          return (
            <Chip size="small" label="0.00 ₽" sx={{ bgcolor: '#F0FDF4', color: '#16A34A', fontWeight: 700 }} />
          );
        }
        return (
          <Chip
            size="small"
            label={`${diff > 0 ? '+' : ''}${formatCurrency(diff)}`}
            sx={{
              bgcolor: diff > 0 ? '#FEF3C7' : '#FEE2E2',
              color: diff > 0 ? '#D97706' : '#DC2626',
              fontWeight: 800
            }}
          />
        );
      }
    },
    {
      field: 'z_report_number',
      headerName: 'Z-отчет',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {params.value ? `№ ${params.value} (ФД ${params.row.fiscal_document_number || '—'})` : '—'}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Детали смены и чеки">
            <IconButton size="small" onClick={() => handleOpenDetails(params.row.id)}>
              <VisibilityIcon fontSize="small" sx={{ color: '#0F3C64' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Скачать Excel (.xlsx)">
            <IconButton
              size="small"
              component="a"
              href={`/api/fiscal/shifts/${params.row.id}/export/excel`}
              target="_blank"
            >
              <FileDownloadIcon fontSize="small" sx={{ color: '#156C9C' }} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ pb: 6 }}>
      {/* Page Title & Quick Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PointOfSaleIcon sx={{ fontSize: 32, color: '#0F3C64' }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px' }}>
              Журнал и Аналитика смен ККТ «АТОЛ 91Ф»
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#4A5568', mt: 0.5 }}>
            Автоматическая мнемоническая нумерация (СМ-YYYYMMDD-NNN), контроль 24-часового правила 54-ФЗ, сверка кассы и Z-отчеты.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Shift status indicator & action button */}
          {currentShiftStatus?.isOpen ? (
            <Button
              variant="contained"
              color="error"
              startIcon={<LockIcon />}
              onClick={() => setCloseModalOpen(true)}
              sx={{
                py: 1,
                px: 2.5,
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: '#DC2626',
                '&:hover': { bgcolor: '#B91C1C' },
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)'
              }}
            >
              Закрыть смену (Z-отчет)
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<LockOpenIcon />}
              onClick={handleManualOpenShift}
              sx={{
                py: 1,
                px: 2.5,
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: '#0F3C64',
                '&:hover': { bgcolor: '#082540' },
                boxShadow: '0 4px 14px rgba(15, 60, 100, 0.25)'
              }}
            >
              Открыть смену вручную
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadShifts();
              loadCurrentShiftStatus();
            }}
            sx={{ py: 1, textTransform: 'none', fontWeight: 600 }}
          >
            Обновить
          </Button>
        </Box>
      </Box>

      {/* KPI Cards Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2, pb: '16px !important' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Всего смен в выборке:
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                {summary.totalShifts} смен
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Чеков: {summary.receiptsCount} шт.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2, pb: '16px !important' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Общая выручка за период:
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                {formatCurrency(summary.totalIncome)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                Средняя: {summary.totalShifts ? formatCurrency(summary.totalIncome / summary.totalShifts) : '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2, pb: '16px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PaymentsIcon sx={{ fontSize: 16, color: '#16A34A' }} />
                <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                  Наличные:
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#166534', my: 0.5 }}>
                {formatCurrency(summary.cashIncome)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#166534' }}>
                Доля: {summary.totalIncome ? `${Math.round((summary.cashIncome / summary.totalIncome) * 100)}%` : '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2, pb: '16px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CreditCardIcon sx={{ fontSize: 16, color: '#2563EB' }} />
                <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 600 }}>
                  Банковские карты:
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E40AF', my: 0.5 }}>
                {formatCurrency(summary.cardIncome)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#1E40AF' }}>
                Эквайринг
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ bgcolor: summary.totalDiscrepancy === 0 ? '#F8FAFC' : '#FEF2F2', border: '1px solid #CBD5E1', borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2, pb: '16px !important' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Кассовая дисциплина:
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: summary.totalDiscrepancy === 0 ? '#16A34A' : '#DC2626',
                  my: 0.5
                }}
              >
                {summary.totalDiscrepancy === 0 ? '0.00 ₽' : formatCurrency(summary.totalDiscrepancy)}
              </Typography>
              <Typography variant="caption" sx={{ color: summary.totalDiscrepancy === 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                {summary.totalDiscrepancy === 0 ? '100% без расхождений' : 'Обнаружены расхождения!'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* OmniSearch & Smart Filters Bar */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          {/* Multi-token OmniSearch */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Поиск по мнемонике, кассиру, ФД, пациенту, услуге..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadShifts()}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#64748B' }} />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Grid>

          {/* Quick Date Presets */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'Все' },
                { key: 'today', label: 'Сегодня' },
                { key: 'yesterday', label: 'Вчера' },
                { key: 'week', label: 'Неделя' },
                { key: 'month', label: 'Месяц' }
              ].map((p) => (
                <Chip
                  key={p.key}
                  label={p.label}
                  size="small"
                  clickable
                  color={datePreset === p.key ? 'primary' : 'default'}
                  onClick={() => handleDatePreset(p.key)}
                  sx={{ fontWeight: datePreset === p.key ? 700 : 500 }}
                />
              ))}
            </Box>
          </Grid>

          {/* Status Filter */}
          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Статус смены</InputLabel>
              <Select
                value={statusFilter}
                label="Статус смены"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Все статусы</MenuItem>
                <MenuItem value="open">🟢 Открытые</MenuItem>
                <MenuItem value="closed">⚪ Закрытые</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Discrepancy Toggle Button */}
          <Grid size={{ xs: 6, md: 2 }}>
            <Button
              fullWidth
              size="small"
              variant={onlyDiscrepancies ? 'contained' : 'outlined'}
              color="error"
              onClick={() => setOnlyDiscrepancies(!onlyDiscrepancies)}
              sx={{ textTransform: 'none', fontWeight: 700, py: 0.8 }}
            >
              {onlyDiscrepancies ? '⚠️ Только расхождения' : 'С расхождениями'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main DataGrid Table */}
      <Paper sx={{ width: '100%', borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <DataGrid
          rows={shifts}
          columns={columns}
          loading={loading}
          autoHeight
          pageSizeOptions={[15, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } }
          }}
          disableRowSelectionOnClick
          sx={{
            minHeight: 400,
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#F8FAFC',
              color: '#0F3C64',
              fontWeight: 700
            }
          }}
        />
      </Paper>

      {/* Interactive Shift Details Drawer (Slide-Over) */}
      <Drawer
        anchor="right"
        open={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: { width: { xs: '100%', sm: 620, md: 720 }, p: 0, bgcolor: '#F8FAFC' }
          }
        }}
      >
        {drawerLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={40} sx={{ color: '#0F3C64' }} />
          </Box>
        ) : shiftDetails ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Drawer Top Header */}
            <Box sx={{ bgcolor: '#0F3C64', color: '#FFFFFF', p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {shiftDetails.shift.mnemonic_code}
                  </Typography>
                  <Chip
                    size="small"
                    label={shiftDetails.shift.status === 'open' ? 'Открыта' : 'Закрыта'}
                    color={shiftDetails.shift.status === 'open' ? 'success' : 'default'}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#BAE6FD' }}>
                  Смена №{shiftDetails.shift.shift_number} • Открыта {shiftDetails.shift.opened_at} ({shiftDetails.shift.opened_by})
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setDetailsDrawerOpen(false)} sx={{ color: '#FFFFFF' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Navigation Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#FFFFFF' }}>
              <Tabs value={drawerTab} onChange={(_, v) => setDrawerTab(v)} variant="scrollable" scrollButtons="auto">
                <Tab label="1. Z-отчет (Слип)" sx={{ fontWeight: 600, textTransform: 'none' }} />
                <Tab label={`2. Чеки (${shiftDetails.receipts?.length || 0})`} sx={{ fontWeight: 600, textTransform: 'none' }} />
                <Tab label="3. Услуги и продажи" sx={{ fontWeight: 600, textTransform: 'none' }} />
                <Tab label="4. Аудит ККТ (Serilog)" sx={{ fontWeight: 600, textTransform: 'none' }} />
              </Tabs>
            </Box>

            {/* Tab Contents */}
            <Box sx={{ p: 2.5, flexGrow: 1, overflowY: 'auto' }}>
              {/* Tab 0: Z-Report Thermal Preview */}
              {drawerTab === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<PrintIcon />}
                      onClick={handlePrintDrawerZ}
                      sx={{ bgcolor: '#0F3C64', textTransform: 'none', fontWeight: 600 }}
                    >
                      Печать Z-отчета
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadIcon />}
                      component="a"
                      href={`/api/fiscal/shifts/${shiftDetails.shift.id}/export/excel`}
                      target="_blank"
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Excel (.xlsx)
                    </Button>
                  </Box>

                  <Card sx={{ maxWidth: 360, margin: '0 auto', boxShadow: 3, borderRadius: 2 }}>
                    <Box sx={{ p: 1, bgcolor: '#FFFFFF' }}>
                      <FiscalZReportPrintTemplate
                        ref={printRef}
                        data={{
                          mnemonicCode: shiftDetails.shift.mnemonic_code,
                          shiftNumber: shiftDetails.shift.shift_number,
                          zReportNumber: shiftDetails.shift.z_report_number,
                          fiscalDocumentNumber: shiftDetails.shift.fiscal_document_number,
                          fiscalSign: shiftDetails.shift.fiscal_sign,
                          openedAt: shiftDetails.shift.opened_at,
                          openedBy: shiftDetails.shift.opened_by,
                          closedAt: shiftDetails.shift.closed_at,
                          closedBy: shiftDetails.shift.closed_by,
                          durationMinutes: shiftDetails.shift.duration_minutes,
                          totals: {
                            receiptsCount: shiftDetails.shift.receipts_count,
                            returnsCount: shiftDetails.shift.returns_count,
                            totalIncome: shiftDetails.shift.total_income,
                            cashIncome: shiftDetails.shift.cash_income,
                            cardIncome: shiftDetails.shift.card_income,
                            sbpIncome: shiftDetails.shift.sbp_income,
                            totalReturns: shiftDetails.shift.total_returns,
                            expectedCash: shiftDetails.shift.expected_cash,
                            actualCash: shiftDetails.shift.actual_cash,
                            cashDifference: shiftDetails.shift.cash_difference
                          },
                          notes: shiftDetails.shift.notes
                        }}
                        isThermalFormat={true}
                      />
                    </Box>
                  </Card>
                </Box>
              )}

              {/* Tab 1: Receipts Register */}
              {drawerTab === 1 && (
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>ФД №</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Пациент</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Оплата</TableCell>
                        <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Сумма</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Время</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shiftDetails.receipts?.map((r: any) => (
                        <TableRow key={r.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>ФД №{r.fiscal_document_number || '—'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {r.patient_fio || 'Пациент'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              {r.patient_contact || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={r.payment_type === 'card' ? 'Карта' : (r.payment_type === 'cash' ? 'Нал' : 'СБП')}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'right', fontWeight: 700, color: '#0F3C64' }}>
                            {formatCurrency(r.total_amount)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {r.fiscalized_at?.slice(11, 19) || r.created_at?.slice(11, 19)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Tab 2: Services Breakdown */}
              {drawerTab === 2 && (
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Медицинская услуга</TableCell>
                        <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Кол-во</TableCell>
                        <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Выручка (₽)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shiftDetails.servicesBreakdown?.map((s: any, idx: number) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{s.quantity} шт.</TableCell>
                          <TableCell sx={{ textAlign: 'right', fontWeight: 700, color: '#0F3C64' }}>
                            {formatCurrency(s.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Tab 3: Serilog Audit Logs */}
              {drawerTab === 3 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {shiftDetails.auditLogs?.map((log: any) => (
                    <Card key={log.id} sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Chip
                          size="small"
                          label={log.event_type}
                          color={log.level === 'Error' ? 'error' : 'primary'}
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {log.timestamp}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {log.message}
                      </Typography>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ) : null}
      </Drawer>

      {/* Modal for Closing Shift with Denomination Calculator */}
      <FiscalShiftCloseModal
        open={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        onShiftClosed={() => {
          loadShifts();
          loadCurrentShiftStatus();
        }}
      />
    </Box>
  );
}
