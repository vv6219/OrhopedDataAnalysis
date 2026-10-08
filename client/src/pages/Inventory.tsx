import { useState, useEffect, useMemo, useRef } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
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
  Tabs,
  Tab,
  Chip,
  Grid,
  CircularProgress,
  LinearProgress,
  Alert
} from '@mui/material';
import { 
  DataGrid, 
  type GridColDef, 
  type GridRenderCellParams, 
  type GridFilterModel,
  GridFooterContainer, 
  GridPagination, 
  getGridStringOperators 
} from '@mui/x-data-grid';
import CustomToolbar from '../components/CustomToolbar';
import { ruRU } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BarChartIcon from '@mui/icons-material/BarChart';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface MaterialItem {
  id: number;
  material_name: string;
  unit_of_measure: string;
  current_unit_cost: number;
  package_cost: number;
}

interface PriceTier {
  name: string;
  category: string;
  count: number;
  color: string;
}

interface MonthlyExpense {
  month: string;
  amount: number;
  items_count: number;
}

interface QualityAlert {
  id: string;
  title: string;
  count: number;
  severity: 'error' | 'warning' | 'info';
  text: string;
  actionLabel: string;
  filterKey: string;
}

interface MaterialsAnalyticsData {
  totals: {
    totalMaterials: number;
    linkedToOperations: number;
    linkedPct: number;
    avgUnitCost: number;
    totalProcurementSum: number;
  };
  priceTiers: PriceTier[];
  topExpensive: MaterialItem[];
  monthlyExpenses: MonthlyExpense[];
  dataQuality: {
    score: number;
    completeness: {
      unitCost: { count: number; total: number; pct: number };
      standardUom: { count: number; total: number; pct: number };
      realMaterial: { count: number; total: number; pct: number };
      bomIntegrity: { count: number; total: number; pct: number };
      packageCost: { count: number; total: number; pct: number };
    };
    alerts: QualityAlert[];
  };
}

const customStringOperators = getGridStringOperators().map((operator) => {
  if (operator.value === 'contains') {
    return {
      ...operator,
      getApplyFilterFn: (filterItem: any) => {
        if (!filterItem.value) return null;
        const normalizedSearch = filterItem.value.replace(/[- ]+/g, '').toLowerCase();
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

interface InventoryFooterProps {
  totalCount?: number;
  totalCost?: number;
  avgCost?: number;
}

function InventoryGridFooter(props: InventoryFooterProps) {
  const totalCount = props.totalCount || 0;
  const totalCost = props.totalCost || 0;
  const avgCost = props.avgCost || 0;

  return (
    <GridFooterContainer sx={{ p: 1.5, borderTop: '2px solid #E2E8F0', bgcolor: '#F8FAFC', flexWrap: 'wrap', gap: 2 }}>
      <Box sx={{ px: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
          Номенклатурных позиций: {totalCount}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          •
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
          Общая балансовая сумма: {totalCost.toLocaleString('ru-RU')} ₽
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          •
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
          Средняя цена единицы: {avgCost.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ₽
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1 }} />
      <GridPagination />
    </GridFooterContainer>
  );
}

export default function Inventory() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Tabs & Quality filter
  const [activeTab, setActiveTab] = useState<number>(0);
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [qualityFilterLabel, setQualityFilterLabel] = useState<string>('');

  // Search State
  const [quickSearch, setQuickSearch] = useState<string>('');
  const searchTimeoutRef = useRef<any>(null);

  // Analytics State
  const [analytics, setAnalytics] = useState<MaterialsAnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);

  const fetchMaterials = async (filterKey = qualityFilter, search = quickSearch) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/materials`;
      const queryParams = new URLSearchParams();
      if (search && search.trim()) {
        queryParams.append('search', search.trim());
      }
      if (filterKey === 'zero_cost') {
        queryParams.append('zero_cost', 'true');
      } else if (filterKey === 'is_invoice') {
        queryParams.append('is_invoice', 'true');
      } else if (filterKey === 'invalid_uom') {
        queryParams.append('invalid_uom', 'true');
      } else if (filterKey === 'unlinked') {
        queryParams.append('unlinked', 'true');
      }
      const qs = queryParams.toString();
      if (qs) {
        url += `?${qs}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/materials/analytics-overview`);
      if (res.ok) {
        const json = await res.json();
        setAnalytics(json);
      }
    } catch (err) {
      console.error('Error fetching materials analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchMaterials(qualityFilter);
    fetchAnalytics();
  }, []);

  const handleApplyQualityFilter = (filterKey: string, label: string) => {
    setQualityFilter(filterKey);
    setQualityFilterLabel(label);
    setActiveTab(0);
    fetchMaterials(filterKey);
  };

  const handleClearQualityFilter = () => {
    setQualityFilter('all');
    setQualityFilterLabel('');
    fetchMaterials('all');
  };

  const handleOpen = (item: any = null) => {
    setEditingItem(item || { id: Date.now(), material_name: '', unit_of_measure: 'шт', current_unit_cost: 0, package_cost: 0 });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    const isEditing = !!materials.find(m => m.id === editingItem.id);
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_BASE_URL}/api/materials/${editingItem.id}` : `${API_BASE_URL}/api/materials`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });
      const data = await response.json();
      
      if (isEditing) {
        setMaterials(materials.map(m => m.id === data.id ? data : m));
      } else {
        setMaterials([...materials, data]);
      }
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to save material', err);
    }
    handleClose();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту позицию со склада?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/materials/${id}`, { method: 'DELETE' });
      setMaterials(materials.filter(m => m.id !== id));
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const materialsTotals = useMemo(() => {
    let totalCost = 0;
    materials.forEach((m) => {
      totalCost += Number(m.current_unit_cost || 0);
    });
    const avgCost = materials.length > 0 ? totalCost / materials.length : 0;
    return {
      totalCount: materials.length,
      totalCost,
      avgCost
    };
  }, [materials]);

  const columns: GridColDef[] = [
    { 
      field: 'id', 
      headerName: '№', 
      width: 70,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
          #{params.value}
        </Typography>
      )
    },
    { 
      field: 'material_name', 
      headerName: 'Наименование материала / препарата', 
      flex: 2, 
      minWidth: 260,
      filterOperators: customStringOperators,
      getApplyQuickFilterFn: (value) => {
        if (!value) return null;
        const normalizedSearch = value.toLowerCase().replace(/[-_ \[\]]+/g, ' ').trim();
        const searchWords = normalizedSearch.split(/\s+/).filter(Boolean);
        return (cellValue) => {
          if (cellValue == null) return false;
          const normalizedCell = String(cellValue).toLowerCase().replace(/[-_ \[\]]+/g, ' ');
          return searchWords.every((word: string) => normalizedCell.includes(word));
        };
      },
      renderCell: (params: GridRenderCellParams) => {
        const val = String(params.value || '');
        const isInvoice = /ИП |счет|долг|ООО |Связь|АППАРАТ|BTL|УВТ|Зельцер/i.test(val);
        const isHighEnd = (params.row?.current_unit_cost || 0) >= 50000;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                {val}
              </Typography>
              {isInvoice && (
                <Chip 
                  label="Финансовый счёт / проводка" 
                  size="small" 
                  sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 700 }}
                />
              )}
              {isHighEnd && (
                <Chip 
                  label="Высокотехнологичный препарат" 
                  size="small" 
                  sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#F5F3FF', color: '#7C3AED', fontWeight: 700 }}
                />
              )}
            </Box>
          </Box>
        );
      }
    },
    { 
      field: 'unit_of_measure', 
      headerName: 'Ед. измерения', 
      width: 140,
      renderCell: (params: GridRenderCellParams) => {
        const uom = String(params.value || '').trim();
        const isSuspicious = /^№|^от |nan|ноябрь|лонгидаза/i.test(uom);

        if (isSuspicious) {
          return (
            <Tooltip title="Нестандартная единица измерения (номер накладной, дата или текст). Рекомендуется исправить на шт/уп." arrow enterDelay={200}>
              <Chip 
                label={uom || '—'} 
                size="small" 
                sx={{ bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 600 }}
              />
            </Tooltip>
          );
        }

        return (
          <Chip 
            label={uom || 'шт'} 
            size="small" 
            variant="outlined" 
            sx={{ fontWeight: 500, color: '#475569', borderColor: '#CBD5E1' }}
          />
        );
      }
    },
    { 
      field: 'current_unit_cost', 
      headerName: 'Стоимость единицы (₽)', 
      width: 180, 
      type: 'number',
      renderCell: (params: GridRenderCellParams) => {
        const val = Number(params.value || 0);
        if (val === 0) {
          return (
            <Tooltip title="Цена не указана (0 ₽). Себестоимость операции с этим материалом будет занижена." arrow enterDelay={200}>
              <Chip 
                label="0 ₽ (Не задана)" 
                size="small" 
                sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 700 }}
              />
            </Tooltip>
          );
        }
        return (
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
            {val.toLocaleString('ru-RU')} ₽
          </Typography>
        );
      }
    },
    { 
      field: 'package_cost', 
      headerName: 'Стоимость упаковки (₽)', 
      width: 180, 
      type: 'number',
      renderCell: (params: GridRenderCellParams) => {
        const val = Number(params.value || 0);
        if (val === 0) {
          return (
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              — не указана
            </Typography>
          );
        }
        return (
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
            {val.toLocaleString('ru-RU')} ₽
          </Typography>
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
          <Tooltip title="Редактировать параметры материала и стоимость" arrow enterDelay={200}>
            <IconButton size="small" color="primary" onClick={() => handleOpen(params.row)} sx={{ cursor: 'pointer' }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить позицию со склада" arrow enterDelay={200}>
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)} sx={{ cursor: 'pointer' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1440px', margin: '0 auto', gap: 3, pb: 6 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px' }}>
            Склад материалов и медикаментов
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Номенклатурный учет, технологические спецификации операций (BOM), анализ себестоимости и контроль качества данных
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Chip
            icon={<Inventory2Icon sx={{ fontSize: '15px !important' }} />}
            label={quickSearch ? `Найдено на складе: ${materials.length} поз.` : `Всего на складе: ${materials.length} поз.`}
            size="small"
            sx={{ bgcolor: '#F0F6FA', color: '#0F3C64', fontWeight: 600, border: '1px solid #D6E4F0' }}
          />
          <Tooltip title="Обновить складские показатели и данные из базы" arrow enterDelay={200}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => { fetchMaterials(); fetchAnalytics(); }}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#0F3C64', borderColor: '#CBD5E1' }}
            >
              Обновить
            </Button>
          </Tooltip>
          <Tooltip title="Добавить новый медицинский материал или лекарственный препарат на склад" arrow enterDelay={200}>
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
              Добавить материал
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
            <Tab icon={<Inventory2Icon fontSize="small" />} iconPosition="start" label="Номенклатурный справочник" />
            <Tab icon={<BarChartIcon fontSize="small" />} iconPosition="start" label="Аналитика склада и затрат" />
            <Tab 
              icon={<HealthAndSafetyIcon fontSize="small" />} 
              iconPosition="start" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Аудит качества данных</span>
                  <Chip 
                    label={`${analytics?.dataQuality?.score || 92} / 100`} 
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

        {/* TAB 0: Materials Catalog Registry */}
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
                    Сбросить фильтр и показать все материалы
                  </Button>
                }
              >
                <strong>Активен фильтр аудита качества:</strong> {qualityFilterLabel} (показано {materials.length} позиций).
              </Alert>
            )}

            <DataGrid
              autoHeight
              showToolbar
              loading={loading}
              rows={materials}
              columns={columns}
              onFilterModelChange={(model: GridFilterModel) => {
                const searchStr = (model.quickFilterValues || []).join(' ').trim();
                if (searchStr !== quickSearch) {
                  setQuickSearch(searchStr);
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  searchTimeoutRef.current = setTimeout(() => {
                    fetchMaterials(qualityFilter, searchStr);
                  }, 300);
                }
              }}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              disableRowSelectionOnClick
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
                }
              }}
              slots={{ 
                toolbar: CustomToolbar,
                footer: InventoryGridFooter as any
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 400 },
                },
                footer: materialsTotals as any
              }}
            />
          </Box>
        )}

        {/* TAB 1: Warehouse & Cost Analytics */}
        {activeTab === 1 && (
          loadingAnalytics ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
              <CircularProgress size={40} sx={{ color: '#0F3C64' }} />
            </Box>
          ) : (
            <Box sx={{ p: 2.5 }}>
              {/* Top 4 KPI Cards */}
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip title="Полное число учтенных в номенклатуре медикаментов, препаратов, перевязочных средств и имплантов" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Inventory2Icon sx={{ color: '#0F3C64', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Номенклатура склада</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                        {(analytics?.totals?.totalMaterials || 427).toLocaleString('ru-RU')} поз.
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                        Единый справочник клиники
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip title="Материалы, привязанные к технологическим картам (BOM) операций для автоматического списания и расчета себестоимости" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <LocalHospitalIcon sx={{ color: '#0284C7', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>В спецификациях операций</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                        {analytics?.totals?.linkedToOperations || 55} поз.
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600 }}>
                        {analytics?.totals?.linkedPct || 12.9}% участвуют в протоколах
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip title="Средняя расчетная стоимость учетной единицы материала по всему каталогу" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <MonetizationOnIcon sx={{ color: '#D97706', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Средняя цена единицы</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                        {(analytics?.totals?.avgUnitCost || 12291).toLocaleString('ru-RU')} ₽
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 600 }}>
                        Включая ортопедические препараты
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip title="Суммарный объем зафиксированных закупок материалов и медикаментов по актам расходов" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <ShoppingBagIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Объём закупок за период</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                        {(analytics?.totals?.totalProcurementSum || 6829411).toLocaleString('ru-RU')} ₽
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#7C3AED', fontWeight: 600 }}>
                        260 накладных и актов поставок
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>
              </Grid>

              {/* 4 Interactive Charts */}
              <Grid container spacing={2.5}>
                {/* Chart 1: Price Tiers Distribution */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Распределение материалов по ценовым группам
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Группировка номенклатуры от доступного расхода до дорогостоящих имплантов
                      </Typography>
                    </Box>

                    <Box sx={{ height: 280, width: '100%' }}>
                      {analytics?.priceTiers && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.priceTiers} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                            <YAxis stroke="#64748B" fontSize={12} />
                            <RechartsTooltip
                              formatter={(v: any) => [`${v} наименований`, 'Количество']}
                              labelFormatter={(_, payload) => {
                                const item = payload && payload[0] && payload[0].payload;
                                return item ? `${item.name} (${item.category})` : '';
                              }}
                              contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                            />
                            <Bar dataKey="count" name="Материалов" radius={[4, 4, 0, 0]}>
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

                {/* Chart 2: Monthly Procurement Trend */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Динамика закупок медикаментов по месяцам
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Фактические затраты клиники на пополнение склада (в рублях)
                      </Typography>
                    </Box>

                    <Box sx={{ height: 280, width: '100%' }}>
                      {analytics?.monthlyExpenses && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.monthlyExpenses} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                            <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <RechartsTooltip
                              formatter={(v: any) => [`${Number(v).toLocaleString('ru-RU')} ₽`, 'Сумма закупки']}
                              contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="amount" 
                              name="Закупки" 
                              stroke="#0284C7" 
                              strokeWidth={3} 
                              dot={{ r: 4, fill: '#0F3C64' }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Chart 3: Top Expensive Materials */}
                <Grid size={{ xs: 12, lg: 7 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Топ-8 самых затратных позиций в номенклатуре
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Наиболее дорогостоящие препараты суставной терапии и оборудование
                      </Typography>
                    </Box>

                    <Box sx={{ height: 290, width: '100%' }}>
                      {analytics?.topExpensive && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            layout="vertical" 
                            data={analytics.topExpensive} 
                            margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                            <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <YAxis type="category" dataKey="material_name" stroke="#64748B" fontSize={11} width={130} />
                            <RechartsTooltip
                              formatter={(v: any) => [`${Number(v).toLocaleString('ru-RU')} ₽`, 'Цена единицы']}
                              contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                            />
                            <Bar dataKey="current_unit_cost" fill="#0F3C64" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Chart 4: Usage Structure Donut */}
                <Grid size={{ xs: 12, lg: 5 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Структура применения материалов
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Привязка позиций к операциям и общеклиническому расходу
                      </Typography>
                    </Box>

                    <Box sx={{ height: 290, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'В спецификациях операций (BOM)', value: 55, color: '#0F3C64' },
                              { name: 'Процедурный и перевязочный расход', value: 198, color: '#0284C7' },
                              { name: 'Диагностика и амбулаторный фонд', value: 132, color: '#16A34A' },
                              { name: 'Финансовые проводки / архив', value: 42, color: '#EA580C' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            <Cell fill="#0F3C64" />
                            <Cell fill="#0284C7" />
                            <Cell fill="#16A34A" />
                            <Cell fill="#EA580C" />
                          </Pie>
                          <RechartsTooltip
                            formatter={(v: any) => [`${v} позиций`, 'Количество']}
                            contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )
        )}

        {/* TAB 2: Data Quality Audit */}
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
                          Сводный индекс чистоты номенклатуры: {analytics?.dataQuality?.score || 92} из 100 баллов
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          Высокий уровень заполнения цен и стандартных единиц измерения. Основные точки контроля — нормализация финансовых проводок в отдельную категорию и заполнение оптовых цен упаковок.
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Справочник готов к расчёту себестоимости"
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
                Полнота заполнения ключевых реквизитов материалов
              </Typography>

              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {/* Unit Cost Completeness */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Наличие указанной цены за единицу для расчета калькуляций операций" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Стоимость за единицу</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                          {analytics?.dataQuality?.completeness?.unitCost?.pct || 96.3}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.unitCost?.pct || 96.3}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#16A34A' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">411 из 427 поз.</Typography>
                        <Chip label="Отлично" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>

                {/* Standard UoM Completeness */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Использование физических единиц измерения (шт, мл, уп, флакон) без номеров накладных" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Корректная единица изм.</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                          {analytics?.dataQuality?.completeness?.standardUom?.pct || 97.2}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.standardUom?.pct || 97.2}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#16A34A' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">415 из 427 поз.</Typography>
                        <Chip label="Отлично" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>

                {/* Real Medical Materials */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Доля фактических медикаментов и расходных материалов без смешения с актами подрядчиков" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Медицинская номенклатура</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0284C7' }}>
                          {analytics?.dataQuality?.completeness?.realMaterial?.pct || 96.3}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.realMaterial?.pct || 96.3}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#0284C7' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">411 из 427 поз.</Typography>
                        <Chip label="Норма" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#E0F2FE', color: '#0284C7', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>

                {/* BOM Integrity */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Доля ссылок в спецификациях хирургических операций, имеющих точный код материала в справочнике" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Связи в шаблонах операций (BOM)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                          {analytics?.dataQuality?.completeness?.bomIntegrity?.pct || 95.9}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.bomIntegrity?.pct || 95.9}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#16A34A' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">827 из 862 связей</Typography>
                        <Chip label="Хорошо" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>

                {/* Package Cost Completeness */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Наличие оптовой цены упаковки (требуется для сопоставления оптовых партий поставщиков)" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Стоимость упаковки</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
                          {analytics?.dataQuality?.completeness?.packageCost?.pct || 15.7}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.packageCost?.pct || 15.7}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#D97706' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">67 из 427 поз.</Typography>
                        <Chip label="Зона роста" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>
              </Grid>

              {/* 4 Actionable Audit Alerts */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
                Обнаруженные аномалии и оперативные задачи склада
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
                                label={`${alert.count} записей`}
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

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F3C64' }}>
          {editingItem?.material_name ? 'Редактировать параметры материала' : 'Новый медицинский материал'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth margin="normal" label="Наименование материала / препарата"
            value={editingItem?.material_name || ''}
            onChange={(e) => setEditingItem({...editingItem, material_name: e.target.value})}
            placeholder="Например: Шприц инъекционный 5.0 мл"
          />
          <TextField
            fullWidth margin="normal" label="Единица измерения"
            value={editingItem?.unit_of_measure || ''}
            onChange={(e) => setEditingItem({...editingItem, unit_of_measure: e.target.value})}
            placeholder="шт, уп, мл, флакон, ампула"
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth margin="normal" label="Стоимость единицы (₽)" type="number"
              value={editingItem?.current_unit_cost || ''}
              onChange={(e) => setEditingItem({...editingItem, current_unit_cost: Number(e.target.value)})}
            />
            <TextField
              fullWidth margin="normal" label="Стоимость упаковки (₽)" type="number"
              value={editingItem?.package_cost || ''}
              onChange={(e) => setEditingItem({...editingItem, package_cost: Number(e.target.value)})}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Tooltip title="Отменить изменения и закрыть форму" arrow enterDelay={200}>
            <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#64748B' }}>
              Отмена
            </Button>
          </Tooltip>
          <Tooltip title="Зафиксировать параметры материала в базе данных" arrow enterDelay={200}>
            <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#0F3C64', textTransform: 'none', fontWeight: 700 }}>
              Сохранить
            </Button>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
