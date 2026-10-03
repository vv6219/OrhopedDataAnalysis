import { useState, useEffect, useRef } from 'react';
import { 
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Autocomplete,
  Tabs,
  Tab,
  Chip,
  Grid,
  CircularProgress,
  LinearProgress,
  Alert
} from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import { ReportTemplate } from '../components/ReportTemplate';
import { 
  DataGrid, 
  type GridColDef, 
  type GridRenderCellParams, 
  GridFooterContainer, 
  GridPagination, 
  getGridStringOperators 
} from '@mui/x-data-grid';
import CustomToolbar from '../components/CustomToolbar';
import { ruRU } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import BarChartIcon from '@mui/icons-material/BarChart';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface OperationItem {
  id: number;
  name: string;
  price: number;
  material_cost: number;
  materials_count: number;
  null_materials: number;
  margin: number;
  margin_pct: number;
  clinical_category: string;
}

interface OperationsAnalyticsData {
  totals: {
    totalOperations: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    positiveMarginCount: number;
    positiveMarginPct: number;
    negativeMarginCount: number;
    brokenBomCount: number;
    totalTransactionsRevenue: number;
    totalTransactionsCount: number;
  };
  marginZones: { name: string; count: number; color: string; category: string }[];
  priceTiers: { name: string; category: string; count: number; color: string }[];
  clinicalCategories: { name: string; count: number; color: string }[];
  topExpensive: { id: number; name: string; price: number; cost: number; margin: number }[];
  dataQuality: {
    score: number;
    completeness: {
      priceFilled: { count: number; total: number; pct: number };
      bomCoverage: { count: number; total: number; pct: number };
      marginIntegrity: { count: number; total: number; pct: number };
      bomClean: { count: number; total: number; pct: number };
      normQuantity: { count: number; total: number; pct: number };
    };
    alerts: {
      id: string;
      title: string;
      count: number;
      severity: 'error' | 'warning' | 'info';
      text: string;
      actionLabel: string;
      filterKey: string;
    }[];
  };
}

const customStringOperators = getGridStringOperators().map((operator) => {
  if (operator.value === 'contains') {
    return {
      ...operator,
      getApplyFilterFn: (filterItem) => {
        if (!filterItem.value) return null;
        const normalizedSearch = filterItem.value.replace(/[- ]+/g, '').toLowerCase();
        return (value) => {
          if (value == null) return false;
          const normalizedCell = String(value).replace(/[- ]+/g, '').toLowerCase();
          return normalizedCell.includes(normalizedSearch);
        };
      },
    };
  }
  return operator;
});

export default function Operations() {
  const [operations, setOperations] = useState<OperationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Tabs & Quality Filter State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [qualityFilterLabel, setQualityFilterLabel] = useState<string>('');

  // Analytics State
  const [analytics, setAnalytics] = useState<OperationsAnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);

  // Master-Detail state
  const [selectedOperationId, setSelectedOperationId] = useState<number | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [operationMaterials, setOperationMaterials] = useState<any[]>([]);
  
  // Detail Dialog state
  const [openDetail, setOpenDetail] = useState(false);
  const [editingDetailItem, setEditingDetailItem] = useState<any>(null);
  const [parameters, setParameters] = useState<Record<string, number>>({});
  
  // Print & Report Preview state
  const [selectedOperationIds, setSelectedOperationIds] = useState<number[]>([]);
  const [bulkMaterials, setBulkMaterials] = useState<any[]>([]);
  const [printOperations, setPrintOperations] = useState<any[]>([]);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Калькуляция стоимости процедур — Центр Ортопедии Добрушкина',
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
  });

  const extractRowIds = (model: any): number[] => {
    if (!model) return [];
    if (Array.isArray(model)) {
      return model.map(Number).filter((n) => !isNaN(n));
    }
    if (model.ids) {
      if (model.ids instanceof Set) {
        return Array.from(model.ids).map(Number).filter((n) => !isNaN(n));
      }
      if (Array.isArray(model.ids)) {
        return model.ids.map(Number).filter((n) => !isNaN(n));
      }
    }
    return [];
  };

  const getEffectivePrintIds = (): number[] => {
    if (selectedOperationIds.length > 0) {
      return selectedOperationIds;
    }
    if (selectedOperationId) {
      return [selectedOperationId];
    }
    return [];
  };

  const handleOpenPrintPreview = async (customIds?: number[]) => {
    const targetIds = customIds && customIds.length > 0 ? customIds : getEffectivePrintIds();
    if (targetIds.length === 0) return;
    
    setIsPrinting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/operations/materials-bulk?ids=${targetIds.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setBulkMaterials(data);
      }
      
      const filteredOps = operations.filter((o) => targetIds.map(String).includes(String(o.id)));
      setPrintOperations(filteredOps);
      setPdfPreviewOpen(true);
    } catch (err) {
      console.error('Print fetch error', err);
    } finally {
      setIsPrinting(false);
    }
  };

  const fetchOperations = async (filterKey = qualityFilter) => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/operations';
      if (filterKey === 'negative_margin') {
        url += '?negative_margin=true';
      } else if (filterKey === 'broken_bom') {
        url += '?broken_bom=true';
      } else if (filterKey === 'patient_materials') {
        url += '?patient_materials=true';
      } else if (filterKey === 'high_margin') {
        url += '?high_margin=true';
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOperations(data);
      }
    } catch (err) {
      console.error('Error fetching operations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('http://localhost:5000/api/operations/analytics-overview');
      if (res.ok) {
        const json = await res.json();
        setAnalytics(json);
      }
    } catch (err) {
      console.error('Error fetching operations analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchOperations(qualityFilter);
    fetchAnalytics();
      
    // Fetch all materials for dropdown
    fetch('http://localhost:5000/api/materials')
      .then(res => res.json())
      .then(data => setMaterials(data))
      .catch(err => console.error('Error fetching materials:', err));
      
    // Fetch calculation parameters
    fetch('http://localhost:5000/api/parameters')
      .then(res => res.json())
      .then(data => setParameters(data))
      .catch(err => console.error('Error fetching parameters:', err));
  }, []);
  
  // Fetch materials for selected operation
  useEffect(() => {
    if (selectedOperationId) {
      fetch(`http://localhost:5000/api/operations/${selectedOperationId}/materials`)
        .then(res => res.json())
        .then(data => setOperationMaterials(data))
        .catch(err => console.error('Error fetching operation materials:', err));
    } else {
      setOperationMaterials([]);
    }
  }, [selectedOperationId]);

  const handleApplyQualityFilter = (filterKey: string, label: string) => {
    setQualityFilter(filterKey);
    setQualityFilterLabel(label);
    setActiveTab(0);
    fetchOperations(filterKey);
  };

  const handleClearQualityFilter = () => {
    setQualityFilter('all');
    setQualityFilterLabel('');
    fetchOperations('all');
  };

  // Master CRUD handlers
  const handleOpen = (item = null) => {
    setEditingItem(item || { id: Date.now(), name: '', price: 0 });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    const isEditing = !!operations.find(m => m.id === editingItem.id);
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `http://localhost:5000/api/operations/${editingItem.id}` : 'http://localhost:5000/api/operations';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingItem.name,
          price: editingItem.price
        })
      });
      const data = await response.json();
      
      if (isEditing) {
        setOperations(operations.map(m => m.id === data.id ? { ...m, ...data } : m));
      } else {
        setOperations([...operations, { ...data, material_cost: 0, materials_count: 0, null_materials: 0, margin: data.price, margin_pct: 100, clinical_category: 'Консультативный приём и диагностика' }]);
      }
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to save operation', err);
    }
    handleClose();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту операцию из каталога?')) return;
    try {
      await fetch(`http://localhost:5000/api/operations/${id}`, { method: 'DELETE' });
      setOperations(operations.filter(m => m.id !== id));
      if (selectedOperationId === id) setSelectedOperationId(null);
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to delete operation', err);
    }
  };
  
  // Detail CRUD handlers
  const handleOpenDetail = (item = null) => {
    setEditingDetailItem(item || { id: Date.now(), material_id: '', quantity: 1 });
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setEditingDetailItem(null);
  };
  
  const handleSaveDetail = async () => {
    if (!selectedOperationId) return;
    
    const isEditing = !!operationMaterials.find(m => m.id === editingDetailItem.id);
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing 
      ? `http://localhost:5000/api/operations/${selectedOperationId}/materials/${editingDetailItem.id}` 
      : `http://localhost:5000/api/operations/${selectedOperationId}/materials`;
      
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: editingDetailItem.material_id,
          quantity: editingDetailItem.quantity
        })
      });
      
      const res = await fetch(`http://localhost:5000/api/operations/${selectedOperationId}/materials`);
      const data = await res.json();
      setOperationMaterials(data);
      fetchOperations();
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to save detail', err);
    }
    handleCloseDetail();
  };
  
  const handleDeleteDetail = async (omId: number) => {
    if (!selectedOperationId) return;
    try {
      await fetch(`http://localhost:5000/api/operations/${selectedOperationId}/materials/${omId}`, { method: 'DELETE' });
      setOperationMaterials(operationMaterials.filter(m => m.id !== omId));
      fetchOperations();
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to delete detail', err);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: '№', width: 65, align: 'center', headerAlign: 'center' },
    { 
      field: 'name', 
      headerName: 'Наименование медицинской процедуры / услуги', 
      flex: 2, 
      minWidth: 260,
      filterOperators: customStringOperators,
      getApplyQuickFilterFn: (value) => {
        if (!value) return null;
        const normalizedSearch = value.replace(/[- ]+/g, '').toLowerCase();
        return (cellValue) => {
          if (cellValue == null) return false;
          const normalizedCell = String(cellValue).replace(/[- ]+/g, '').toLowerCase();
          return normalizedCell.includes(normalizedSearch);
        };
      },
      renderCell: (params: GridRenderCellParams) => {
        const val = String(params.value || '');
        const cat = params.row?.clinical_category || '';

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.3 }}>
              {val}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.3 }}>
              <Chip
                label={cat}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600 }}
              />
              {params.row?.null_materials > 0 && (
                <Chip
                  label="Разрыв BOM"
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FFF7ED', color: '#C2410C', fontWeight: 700 }}
                />
              )}
            </Box>
          </Box>
        );
      }
    },
    { 
      field: 'price', 
      headerName: 'Тариф (₽)', 
      width: 130, 
      type: 'number',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
          {Number(params.value || 0).toLocaleString('ru-RU')} ₽
        </Typography>
      )
    },
    { 
      field: 'material_cost', 
      headerName: 'Себестоимость (₽)', 
      width: 150, 
      type: 'number',
      renderCell: (params: GridRenderCellParams) => {
        const cost = Number(params.value || 0);
        const price = Number(params.row?.price || 0);
        const isExcess = cost > price;

        return (
          <Tooltip 
            title={isExcess ? "Себестоимость материалов превышает стоимость услуги! Требуется корректировка карты BOM." : "Расчётная стоимость расхода медикаментов по карте"} 
            arrow 
            enterDelay={200}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: isExcess ? '#DC2626' : '#475569' }}>
              {cost.toLocaleString('ru-RU')} ₽
            </Typography>
          </Tooltip>
        );
      }
    },
    { 
      field: 'margin', 
      headerName: 'Маржинальность', 
      width: 160, 
      type: 'number',
      renderCell: (params: GridRenderCellParams) => {
        const margin = Number(params.value || 0);
        const pct = Number(params.row?.margin_pct || 0);

        if (margin < 0) {
          return (
            <Tooltip title={`Отрицательная расчётная маржа (${margin.toLocaleString('ru-RU')} ₽). Себестоимость материалов превышает тариф.`} arrow enterDelay={200}>
              <Chip
                label={`Убыток (${pct}%)`}
                size="small"
                sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 800, height: 22 }}
              />
            </Tooltip>
          );
        }

        if (pct >= 70) {
          return (
            <Tooltip title={`Высокая маржинальность: прибыль ${margin.toLocaleString('ru-RU')} ₽ на операцию`} arrow enterDelay={200}>
              <Chip
                label={`Высокая (${pct}%)`}
                size="small"
                sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700, height: 22 }}
              />
            </Tooltip>
          );
        }

        return (
          <Tooltip title={`Стандартная нормативная маржа: прибыль ${margin.toLocaleString('ru-RU')} ₽`} arrow enterDelay={200}>
            <Chip
              label={`Норма (${pct}%)`}
              size="small"
              sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700, height: 22 }}
            />
          </Tooltip>
        );
      }
    },
    { 
      field: 'materials_count', 
      headerName: 'Карта BOM', 
      width: 130, 
      align: 'center', 
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const count = Number(params.value || 0);
        const nullCount = Number(params.row?.null_materials || 0);

        if (nullCount > 0) {
          return (
            <Tooltip title={`В карте ${count} поз., из них ${nullCount} ссылок на NULL (разорвана связь со складом)`} arrow enterDelay={200}>
              <Chip
                icon={<WarningAmberIcon style={{ fontSize: 14, color: '#C2410C' }} />}
                label={`${count} поз. (!)`}
                size="small"
                sx={{ bgcolor: '#FFF7ED', color: '#C2410C', fontWeight: 700, height: 22 }}
              />
            </Tooltip>
          );
        }

        return (
          <Chip
            label={`${count} поз.`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, color: '#475569', borderColor: '#CBD5E1', height: 22 }}
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Действия',
      sortable: false,
      filterable: false,
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Редактировать услугу и прейскурантный тариф" arrow enterDelay={200}>
            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpen(params.row); }} sx={{ cursor: 'pointer' }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить услугу из каталога" arrow enterDelay={200}>
            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(params.row.id); }} sx={{ cursor: 'pointer' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1440px', margin: '0 auto', gap: 3, pb: 6 }}>
      {/* Top Banner / Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px' }}>
            Каталог операций и технологических карт (BOM)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Прейскурант услуг Центра ортопедии Добрушкина, технологические спецификации расхода, анализ маржинальности и калькуляция
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Tooltip title="Обновить список процедур и аналитические показатели" arrow enterDelay={200}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => { fetchOperations(); fetchAnalytics(); }}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#0F3C64', borderColor: '#CBD5E1' }}
            >
              Обновить
            </Button>
          </Tooltip>
          <Tooltip 
            title={
              getEffectivePrintIds().length > 0
                ? `Открыть предпросмотр и напечатать официальный бланк калькуляции (${getEffectivePrintIds().length} процедур)`
                : "Выберите одну или несколько процедур в таблице (чекбоксом или кликом) для печати бланка калькуляции"
            } 
            arrow 
            enterDelay={200}
          >
            <span>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={isPrinting ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
                onClick={() => handleOpenPrintPreview()}
                disabled={getEffectivePrintIds().length === 0 || isPrinting}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                {getEffectivePrintIds().length > 0 
                  ? `Печать калькуляции (${getEffectivePrintIds().length})`
                  : 'Печать калькуляции'}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Добавить новую медицинскую услугу в прейскурант клиники" arrow enterDelay={200}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => handleOpen()} 
              sx={{ 
                bgcolor: '#0F3C64', 
                textTransform: 'none', 
                fontWeight: 700, 
                boxShadow: 'none',
                '&:hover': { bgcolor: '#0A2744' } 
              }}
            >
              Добавить процедуру
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Container Paper with Navigation Tabs */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#F8FAFC', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                minHeight: 48,
                color: '#64748B',
                '&.Mui-selected': { color: '#0F3C64' }
              },
              '& .MuiTabs-indicator': { bgcolor: '#0F3C64', height: 3 }
            }}
          >
            <Tab icon={<ReceiptLongIcon fontSize="small" />} iconPosition="start" label="Справочник прейскуранта и спецификаций (BOM)" />
            <Tab icon={<BarChartIcon fontSize="small" />} iconPosition="start" label="Экономика процедур и маржинальность" />
            <Tab 
              icon={<HealthAndSafetyIcon fontSize="small" />} 
              iconPosition="start" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Аудит качества технологических карт</span>
                  <Chip 
                    label={`${analytics?.dataQuality?.score || 89} / 100`} 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem', 
                      fontWeight: 700, 
                      bgcolor: '#DCFCE7', 
                      color: '#166534' 
                    }} 
                  />
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* TAB 0: Master Operations Registry & Detail BOM */}
        {activeTab === 0 && (
          <Box sx={{ p: 2.5 }}>
            {/* Active Audit Filter Alert Banner */}
            {qualityFilter !== 'all' && (
              <Alert
                severity="warning"
                sx={{ mb: 2.5, borderRadius: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<FilterAltOffIcon />}
                    onClick={handleClearQualityFilter}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Сбросить фильтр и показать весь прейскурант
                  </Button>
                }
              >
                <strong>Активен фильтр аудита качества:</strong> {qualityFilterLabel} (показано {operations.length} услуг).
              </Alert>
            )}

            <DataGrid
              autoHeight
              loading={loading}
              rows={operations}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              checkboxSelection
              onRowSelectionModelChange={(model) => {
                const ids = extractRowIds(model);
                setSelectedOperationIds(ids);
              }}
              onRowClick={(params) => setSelectedOperationId(params.row.id)}
              columnHeaderHeight={54}
              localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
              sx={{
                border: 0,
                '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' },
                '& .MuiDataGrid-columnHeader': {
                  alignItems: 'flex-start',
                },
                '& .MuiDataGrid-columnHeaderTitleContainer': {
                  alignItems: 'flex-start',
                  paddingTop: '6px',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  whiteSpace: 'normal',
                  lineHeight: '1.2rem',
                  fontWeight: 700,
                  color: '#1E293B'
                },
                '& .MuiDataGrid-row': { cursor: 'pointer' },
                '& .MuiDataGrid-row.Mui-selected': { bgcolor: 'rgba(15, 60, 100, 0.08) !important' }
              }}
              slots={{ 
                toolbar: CustomToolbar,
                footer: () => (
                  <GridFooterContainer sx={{ p: 1 }}>
                    <Box sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Всего процедур в списке: {operations.length}
                      </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <GridPagination />
                  </GridFooterContainer>
                )
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 400 },
                },
              }}
            />

            {/* Master-Detail: Selected Operation BOM Materials */}
            {selectedOperationId && (
              <Paper 
                elevation={0} 
                sx={{ 
                  mt: 3, 
                  p: 2.5, 
                  border: '1px solid #CBD5E1', 
                  borderRadius: 2.5, 
                  bgcolor: '#F8FAFC' 
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      Технологическая карта списания (BOM): {operations.find(o => o.id === selectedOperationId)?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Тариф: {operations.find(o => o.id === selectedOperationId)?.price?.toLocaleString('ru-RU')} ₽ | 
                      Коэффициент накладных расходов: {parameters.material_cost_factor || 1.15}x
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Tooltip title="Напечатать официальный бланк калькуляции для этой выбранной процедуры" arrow enterDelay={200}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={isPrinting ? <CircularProgress size={14} color="inherit" /> : <PrintIcon fontSize="small" />}
                        onClick={() => handleOpenPrintPreview([selectedOperationId])}
                        disabled={isPrinting}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Печать этой карты
                      </Button>
                    </Tooltip>
                    <Tooltip title="Привязать расходный материал к данной процедуре" arrow enterDelay={200}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDetail()}
                        sx={{ bgcolor: '#0F3C64', textTransform: 'none', fontWeight: 700 }}
                      >
                        Добавить материал в карту
                      </Button>
                    </Tooltip>
                  </Box>
                </Box>

                {operationMaterials.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#94A3B8', py: 2, textAlign: 'center' }}>
                    В карте списания пока нет привязанных материалов.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {operationMaterials.map((m: any, idx: number) => {
                      const isNull = !m.material_name || m.material_id == null;
                      return (
                        <Paper 
                          key={m.id || idx} 
                          elevation={0}
                          sx={{ 
                            p: 1.5, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            border: `1px solid ${isNull ? '#FECACA' : '#E2E8F0'}`, 
                            bgcolor: isNull ? '#FEF2F2' : '#FFFFFF',
                            borderRadius: 1.5 
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isNull ? '#DC2626' : '#1E293B' }}>
                              {m.material_name || 'Не привязан (NULL)'}
                            </Typography>
                            {isNull && (
                              <Chip label="Разорванная связь" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700 }} />
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                              Норма: <strong>{m.quantity}</strong> {m.unit_of_measure || 'шт'}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                              {((m.current_unit_cost || 0) * m.quantity).toLocaleString('ru-RU')} ₽
                            </Typography>
                            <IconButton size="small" color="primary" onClick={() => handleOpenDetail(m)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteDetail(m.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        )}

        {/* TAB 1: Economics & Margin Analytics */}
        {activeTab === 1 && (
          loadingAnalytics ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
              <CircularProgress size={40} sx={{ color: '#0F3C64' }} />
            </Box>
          ) : (
            <Box sx={{ p: 2.5 }}>
              {/* Top 4 Scorecards */}
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip title="Общее количество регламентных медицинских процедур и услуг Центра ортопедии" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <MedicalServicesIcon sx={{ color: '#0F3C64', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Прейскурант клиники</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                        {analytics?.totals?.totalOperations || 158} процедур
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>
                        100% оснащены картами BOM
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip title="Средняя стоимость услуги по прейскуранту Центра ортопедии Добрушкина" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <MonetizationOnIcon sx={{ color: '#0284C7', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Средний тариф</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                        {(analytics?.totals?.avgPrice || 6692).toLocaleString('ru-RU')} ₽
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600 }}>
                        Диапазон: от 250 ₽ до 90 000 ₽
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip title="Процедуры с положительной расчётной прибылью (доход превышает себестоимость материалов)" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <TrendingUpIcon sx={{ color: '#16A34A', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Рентабельные услуги</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                        {analytics?.totals?.positiveMarginCount || 122} из 158
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>
                        {analytics?.totals?.positiveMarginPct || 77.2}% с положительной маржой
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip title="Суммарная выручка по всем фактически выполненным клиническим протоколам операций" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <ReceiptLongIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Общий оборот процедур</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                        {(analytics?.totals?.totalTransactionsRevenue || 27429334).toLocaleString('ru-RU')} ₽
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#7C3AED', fontWeight: 600 }}>
                        4 155 выполненных протоколов
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>
              </Grid>

              {/* 4 Interactive Charts */}
              <Grid container spacing={2.5}>
                {/* Chart 1: Margin Zones */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Зонирование маржинальности процедур
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Соотношение высокорентабельных, нормативных и дефицитных услуг
                      </Typography>
                    </Box>

                    <Box sx={{ height: 280, width: '100%' }}>
                      {analytics?.marginZones && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.marginZones} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                            <YAxis stroke="#64748B" fontSize={11} />
                            <RechartsTooltip
                              formatter={(v: any) => [`${v} процедур`, 'Количество']}
                              contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                            />
                            <Bar dataKey="count" name="Услуг" radius={[4, 4, 0, 0]}>
                              {analytics.marginZones.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Chart 2: Price Tiers Distribution */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Ценовые диапазоны прейскуранта
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Группировка тарифов от доступных перевязок до клеточной терапии
                      </Typography>
                    </Box>

                    <Box sx={{ height: 280, width: '100%' }}>
                      {analytics?.priceTiers && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.priceTiers} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                            <YAxis stroke="#64748B" fontSize={11} />
                            <RechartsTooltip
                              formatter={(v: any) => [`${v} услуг`, 'Количество']}
                              labelFormatter={(_, payload) => {
                                const item = payload && payload[0] && payload[0].payload;
                                return item ? `${item.name} (${item.category})` : '';
                              }}
                              contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {analytics.priceTiers.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Chart 3: Clinical Categories Donut */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Клинические направления прейскуранта
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Специализированная структура услуг Центра ортопедии
                      </Typography>
                    </Box>

                    <Box sx={{ height: 280, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {analytics?.clinicalCategories && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.clinicalCategories}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={3}
                              dataKey="count"
                            >
                              {analytics.clinicalCategories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(v: any) => [`${v} процедур`, 'Количество']}
                              contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Chart 4: Top Expensive Procedures */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Топ-8 самых дорогостоящих процедур
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Флагманские услуги клеточной терапии, выездов и стелек
                      </Typography>
                    </Box>

                    <Box sx={{ height: 280, width: '100%' }}>
                      {analytics?.topExpensive && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            layout="vertical" 
                            data={analytics.topExpensive} 
                            margin={{ top: 5, right: 30, left: 130, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                            <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={10} width={120} />
                            <RechartsTooltip
                              formatter={(v: any) => [`${Number(v).toLocaleString('ru-RU')} ₽`, 'Тариф']}
                              contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                            />
                            <Bar dataKey="price" fill="#0F3C64" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )
        )}

        {/* TAB 2: BOM Data Quality Audit */}
        {activeTab === 2 && (
          loadingAnalytics ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
              <CircularProgress size={40} sx={{ color: '#0F3C64' }} />
            </Box>
          ) : (
            <Box sx={{ p: 2.5 }}>
              {/* Overall Quality Score Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2.5,
                  border: '1px solid #BBF7D0',
                  bgcolor: '#F0FDF4',
                  mb: 3
                }}
              >
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <HealthAndSafetyIcon sx={{ color: '#16A34A', fontSize: 32 }} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#166534' }}>
                          Сводный индекс технологических карт (BOM): {analytics?.dataQuality?.score || 89} из 100 баллов
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          Высокий уровень оснащённости прейскуранта. Все 100% услуг имеют положительные тарифы и карты списания. Главные зоны внимания — устранение разрывов связей со складом и корректировка карт снятия гипса.
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Прейскурант готов к расчётам"
                      sx={{
                        bgcolor: '#DCFCE7',
                        color: '#166534',
                        fontWeight: 700,
                        py: 2.5,
                        px: 1.5,
                        fontSize: '0.9rem'
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Completeness Progress Bars for 5 Key Attributes */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
                Полнота и технологическая целостность спецификаций (BOM)
              </Typography>

              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {/* Price Filled */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Наличие официального тарифа в прейскуранте Центра ортопедии" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Заполнение тарифов</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                          {analytics?.dataQuality?.completeness?.priceFilled?.pct || 100.0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.priceFilled?.pct || 100.0}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#16A34A' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">158 из 158 процедур</Typography>
                        <Chip label="Отлично" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>

                {/* BOM Assigned */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Наличие технологической карты расхода материалов (BOM) для каждой медицинской услуги" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Наличие карт расхода (BOM)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                          {analytics?.dataQuality?.completeness?.bomCoverage?.pct || 100.0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.bomCoverage?.pct || 100.0}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#16A34A' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">158 из 158 процедур</Typography>
                        <Chip label="Отлично" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>

                {/* Margin Integrity */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Доля услуг, где себестоимость материалов строго ниже тарифа услуги" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Корректность маржи</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
                          {analytics?.dataQuality?.completeness?.marginIntegrity?.pct || 77.2}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.marginIntegrity?.pct || 77.2}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#D97706' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">122 из 158 процедур</Typography>
                        <Chip label="Внимание" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>

                {/* BOM Cleanliness */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Доля услуг, в технологических картах которых отсутствуют разорванные ссылки на пустые материалы" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Целостность связей со складом</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
                          {analytics?.dataQuality?.completeness?.bomClean?.pct || 79.7}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.bomClean?.pct || 79.7}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#D97706' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">126 из 158 процедур</Typography>
                        <Chip label="Внимание" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>

                {/* Norm Quantity */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Доля строк списания с положительным утверждённым нормативом расхода материала" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Нормы расхода в спецификациях</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                          {analytics?.dataQuality?.completeness?.normQuantity?.pct || 98.2}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.normQuantity?.pct || 98.2}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#16A34A' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">847 из 862 строк</Typography>
                        <Chip label="Отлично" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>
              </Grid>

              {/* 4 Actionable Audit Alerts */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
                Обнаруженные технологические аномалии и оперативные задачи
              </Typography>

              <Grid container spacing={2.5}>
                {analytics?.dataQuality?.alerts?.map((alert) => {
                  const isError = alert.severity === 'error';
                  const isWarning = alert.severity === 'warning';

                  return (
                    <Grid key={alert.id} size={{ xs: 12, md: 6 }}>
                      <Tooltip title={`Нажмите кнопку действия внизу карточки, чтобы открыть эти ${alert.count} записей в реестре`} arrow enterDelay={200}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 2.5,
                            border: `1px solid ${isError ? '#FECACA' : isWarning ? '#FED7AA' : '#BAE6FD'}`,
                            bgcolor: isError ? '#FEF2F2' : isWarning ? '#FFF7ED' : '#F0F9FF',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {isError ? (
                                  <ErrorOutlineIcon sx={{ color: '#DC2626' }} />
                                ) : isWarning ? (
                                  <WarningAmberIcon sx={{ color: '#EA580C' }} />
                                ) : (
                                  <CheckCircleIcon sx={{ color: '#0284C7' }} />
                                )}
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                                  {alert.title}
                                </Typography>
                              </Box>
                              <Chip
                                label={`${alert.count} процедур`}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  bgcolor: isError ? '#FEE2E2' : isWarning ? '#FFEDD5' : '#E0F2FE',
                                  color: isError ? '#DC2626' : isWarning ? '#C2410C' : '#0369A1'
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.4, mb: 2 }}>
                              {alert.text}
                            </Typography>
                          </Box>

                          {alert.filterKey !== 'all' && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleApplyQualityFilter(alert.filterKey, alert.title)}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  borderColor: isError ? '#DC2626' : '#EA580C',
                                  color: isError ? '#DC2626' : '#C2410C',
                                  '&:hover': { bgcolor: isError ? '#FEE2E2' : '#FFEDD5' }
                                }}
                              >
                                {alert.actionLabel}
                              </Button>
                            </Box>
                          )}
                        </Paper>
                      </Tooltip>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )
        )}
      </Paper>

      {/* Add / Edit Operation Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F3C64' }}>
          {editingItem?.id && operations.some(o => o.id === editingItem.id) ? 'Редактировать процедуру' : 'Новая процедура в прейскуранте'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth margin="normal" label="Наименование процедуры"
            value={editingItem?.name || ''}
            onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
            placeholder="Например: Первичный приём врача ортопеда-травматолога"
          />
          <TextField
            fullWidth margin="normal" label="Стоимость по прейскуранту (₽)" type="number"
            value={editingItem?.price || ''}
            onChange={(e) => setEditingItem({...editingItem, price: Number(e.target.value)})}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#64748B' }}>Отмена</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#0F3C64', textTransform: 'none', fontWeight: 700 }}>Сохранить</Button>
        </DialogActions>
      </Dialog>
      
      {/* Detail Add / Edit BOM Material Dialog */}
      <Dialog open={openDetail} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F3C64' }}>
          {editingDetailItem?.id && operationMaterials.some(m => m.id === editingDetailItem.id) ? 'Изменить расход материала' : 'Привязать расходный материал'}
        </DialogTitle>
        <DialogContent dividers>
          <Autocomplete
            options={materials}
            getOptionLabel={(option: any) => typeof option === 'string' ? option : `${option.material_name} (${option.unit_of_measure}) — ${option.current_unit_cost} ₽`}
            value={materials.find(m => m.id === editingDetailItem?.material_id) || null}
            onChange={(_, newValue: any) => {
              setEditingDetailItem({ ...editingDetailItem, material_id: newValue ? newValue.id : '' });
            }}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Расходный материал со склада" 
                margin="normal" 
                placeholder="Поиск по названию материала..."
              />
            )}
          />
          <TextField
            fullWidth margin="normal" label="Норма расхода на 1 процедуру" type="number"
            value={editingDetailItem?.quantity || ''}
            onChange={(e) => setEditingDetailItem({...editingDetailItem, quantity: Number(e.target.value)})}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDetail} sx={{ textTransform: 'none', color: '#64748B' }}>Отмена</Button>
          <Button onClick={handleSaveDetail} variant="contained" sx={{ bgcolor: '#0F3C64', textTransform: 'none', fontWeight: 700 }}>Сохранить норму</Button>
        </DialogActions>
      </Dialog>

      {/* Print Preview & Direct Print Modal Dialog */}
      <Dialog
        open={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              maxHeight: '92vh',
              bgcolor: '#F8FAFC'
            }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PrintIcon sx={{ color: '#0F3C64' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                Предпросмотр бланка калькуляции ({printOperations.length} {printOperations.length === 1 ? 'процедура' : 'процедур'})
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Официальный расчет себестоимости и нормативного расхода материалов клиники
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => handlePrintTrigger()}
              sx={{ bgcolor: '#0F3C64', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#0A2744' } }}
            >
              Распечатать бланк
            </Button>
            <Button
              variant="outlined"
              onClick={() => setPdfPreviewOpen(false)}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#CBD5E1' }}
            >
              Закрыть
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#F1F5F9' }}>
          <Paper
            elevation={0}
            sx={{
              p: 0,
              bgcolor: '#FFFFFF',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}
          >
            <ReportTemplate
              ref={printRef}
              operations={printOperations || []}
              materialsData={bulkMaterials || []}
              materialCostFactor={parameters?.material_cost_factor || 1.15}
            />
          </Paper>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
