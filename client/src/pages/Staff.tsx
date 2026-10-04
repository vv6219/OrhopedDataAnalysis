import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Chip,
  Snackbar,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  GridFooterContainer,
  GridPagination,
  getGridStringOperators,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { ruRU } from '@mui/x-data-grid/locales';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
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

interface StaffMember {
  id: number;
  full_name: string;
  role: string;
  specialization?: string;
  contact_phone?: string;
  email?: string;
  status?: string;
}

interface DoctorWorkloadItem {
  docn: number;
  doctorName: string;
  shortName: string;
  role: string;
  visits: number;
  pct: number;
  color: string;
}

interface AnnualTrendItem {
  year: string;
  dobrouchkin: number;
  gavlovsky: number;
  total: number;
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

interface StaffAnalyticsData {
  totals: {
    totalStaff: number;
    activeStaff: number;
    doctorsCount: number;
    nursesCount: number;
    adminCount: number;
    totalVisitsHandled: number;
    lastYearVisits: number;
  };
  doctorWorkload: DoctorWorkloadItem[];
  annualTrends: AnnualTrendItem[];
  roleDistribution: { name: string; count: number; color: string }[];
  dataQuality: {
    score: number;
    completeness: {
      phone: { count: number; total: number; pct: number };
      email: { count: number; total: number; pct: number };
      formalName: { count: number; total: number; pct: number };
      standardRole: { count: number; total: number; pct: number };
      activeStatus: { count: number; total: number; pct: number };
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

function CustomStaffToolbar() {
  return (
    <GridToolbarContainer sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
      </Box>
      <GridToolbarQuickFilter debounceMs={300} />
    </GridToolbarContainer>
  );
}

export default function Staff() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Quality filter
  const [activeTab, setActiveTab] = useState<number>(0);
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [qualityFilterLabel, setQualityFilterLabel] = useState<string>('');

  // Analytics State
  const [analytics, setAnalytics] = useState<StaffAnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Partial<StaffMember>>({
    full_name: '',
    role: 'Врач травматолог-ортопед',
    specialization: '',
    contact_phone: '+7 (988) ',
    email: '',
    status: 'active'
  });

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // Notifications
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const fetchStaff = async (filterKey = qualityFilter) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/staff`;
      if (filterKey === 'missing_contacts') {
        url += '?missing_contacts=true';
      } else if (filterKey === 'informal_name') {
        url += '?informal_name=true';
      } else if (filterKey === 'non_standard_role') {
        url += '?non_standard_role=true';
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (e) {
      console.error('Failed to load staff list', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/analytics-overview`);
      if (res.ok) {
        const json = await res.json();
        setAnalytics(json);
      }
    } catch (err) {
      console.error('Failed to load staff analytics', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchStaff(qualityFilter);
    fetchAnalytics();
  }, []);

  const handleApplyQualityFilter = (filterKey: string, label: string) => {
    setQualityFilter(filterKey);
    setQualityFilterLabel(label);
    setActiveTab(0);
    fetchStaff(filterKey);
  };

  const handleClearQualityFilter = () => {
    setQualityFilter('all');
    setQualityFilterLabel('');
    fetchStaff('all');
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentStaff({
      full_name: '',
      role: 'Врач травматолог-ортопед',
      specialization: '',
      contact_phone: '+7 (988) ',
      email: '',
      status: 'active'
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (member: StaffMember) => {
    setIsEditing(true);
    setCurrentStaff({ ...member });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentStaff.full_name?.trim() || !currentStaff.role?.trim()) {
      alert('Пожалуйста, заполните ФИО и должность сотрудника.');
      return;
    }

    try {
      let url = `${API_BASE_URL}/api/staff`;
      let method = 'POST';

      if (isEditing && currentStaff.id) {
        url = `${API_BASE_URL}/api/staff/${currentStaff.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentStaff)
      });

      if (res.ok) {
        setSnackbarMessage(isEditing ? 'Данные сотрудника обновлены' : 'Новый сотрудник успешно добавлен');
        setDialogOpen(false);
        fetchStaff();
        fetchAnalytics();
      } else {
        const err = await res.json();
        alert('Ошибка при сохранении: ' + (err.error || 'Ошибка сервера'));
      }
    } catch (e: any) {
      alert('Сетевая ошибка: ' + e.message);
    }
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/${staffToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSnackbarMessage(`Сотрудник ${staffToDelete.full_name} удален`);
        setDeleteConfirmOpen(false);
        setStaffToDelete(null);
        fetchStaff();
        fetchAnalytics();
      } else {
        const err = await res.json();
        alert('Ошибка при удалении: ' + (err.error || 'Ошибка сервера'));
      }
    } catch (e: any) {
      alert('Ошибка сети: ' + e.message);
    }
  };

  const getRoleChip = (role: string) => {
    const r = (role || '').toLowerCase();
    let sxStyles = {
      bgcolor: 'rgba(124, 58, 237, 0.1)',
      color: '#7C3AED',
      fontWeight: 700,
      border: '1px solid rgba(124, 58, 237, 0.25)'
    };
    if (r.includes('главный') || r.includes('врач') || r.includes('ортопед') || r.includes('хирург')) {
      sxStyles = {
        bgcolor: 'rgba(15, 60, 100, 0.1)',
        color: '#0F3C64',
        fontWeight: 700,
        border: '1px solid rgba(15, 60, 100, 0.25)'
      };
    } else if (r.includes('медсестра') || r.includes('сестра') || r.includes('ассистент')) {
      sxStyles = {
        bgcolor: 'rgba(2, 132, 199, 0.1)',
        color: '#0284C7',
        fontWeight: 700,
        border: '1px solid rgba(2, 132, 199, 0.25)'
      };
    }

    return (
      <Chip
        label={role}
        size="small"
        sx={{
          ...sxStyles,
          height: 'auto',
          maxWidth: '100%',
          '& .MuiChip-label': {
            whiteSpace: 'normal',
            lineHeight: 1.25,
            py: 0.5,
            px: 0.8
          }
        }}
      />
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'С';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: '№', width: 50, minWidth: 45, align: 'center', headerAlign: 'center' },
    {
      field: 'full_name',
      headerName: 'ФИО Сотрудника',
      flex: 2,
      minWidth: 200,
      filterOperators: customStringOperators,
      renderCell: (params) => {
        const name = String(params.value || '');
        const isInformal = name.trim().split(' ').length < 2;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, width: '100%', py: 0.5 }}>
            <Avatar
              sx={{
                bgcolor: '#0F3C64',
                width: 32,
                height: 32,
                fontSize: '0.8rem',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {getInitials(name)}
            </Avatar>
            <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: '#0F3C64',
                  fontSize: '0.86rem',
                  lineHeight: 1.25,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}
              >
                {name}
              </Typography>
              {isInformal && (
                <Box sx={{ mt: 0.25 }}>
                  <Chip 
                    label="Неполное ФИО" 
                    size="small" 
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      bgcolor: '#FEF2F2',
                      color: '#DC2626',
                      fontWeight: 700,
                      border: '1px solid #FECACA'
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        );
      }
    },
    {
      field: 'role',
      headerName: 'Должность / Роль',
      flex: 1.3,
      minWidth: 160,
      filterOperators: customStringOperators,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 0.5 }}>
          {getRoleChip(params.value)}
        </Box>
      )
    },
    {
      field: 'specialization',
      headerName: 'Специализация / Направление',
      flex: 1.5,
      minWidth: 175,
      filterOperators: customStringOperators,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            color: '#4A5568',
            fontSize: '0.82rem',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: 1.3,
            py: 0.5
          }}
        >
          {params.value || 'Общая практика'}
        </Typography>
      )
    },
    {
      field: 'contact_phone',
      headerName: 'Контактный телефон',
      width: 150,
      minWidth: 140,
      filterOperators: customStringOperators,
      renderCell: (params) => params.value ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#2D3748' }}>
          <PhoneIcon sx={{ fontSize: 15, color: '#0F3C64', flexShrink: 0 }} />
          <Typography variant="body2" sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{params.value}</Typography>
        </Box>
      ) : (
        <Chip label="Не указан" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 600 }} />
      )
    },
    {
      field: 'email',
      headerName: 'Корпоративный Email',
      flex: 1.2,
      minWidth: 165,
      filterOperators: customStringOperators,
      renderCell: (params) => params.value ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#2D3748', width: '100%' }}>
          <EmailIcon sx={{ fontSize: 15, color: '#0284C7', flexShrink: 0 }} />
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.82rem',
              whiteSpace: 'normal',
              wordBreak: 'break-all',
              lineHeight: 1.25
            }}
          >
            {params.value}
          </Typography>
        </Box>
      ) : (
        <Chip label="Не указан" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 600 }} />
      )
    },
    {
      field: 'status',
      headerName: 'Статус',
      width: 110,
      minWidth: 105,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const isActive = params.value === 'active' || !params.value;
        return (
          <Chip
            size="small"
            icon={<CheckCircleIcon style={{ color: isActive ? '#16A34A' : '#94A3B8', fontSize: 13 }} />}
            label={isActive ? 'Работает' : 'В отпуске'}
            sx={{
              height: 22,
              fontSize: '0.72rem',
              fontWeight: 600,
              bgcolor: isActive ? '#DCFCE7' : '#F1F5F9',
              color: isActive ? '#166534' : '#64748B'
            }}
          />
        );
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Действия',
      width: 80,
      minWidth: 75,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={
            <Tooltip title="Редактировать данные сотрудника" arrow enterDelay={200}>
              <EditIcon sx={{ color: '#0F3C64', fontSize: 18 }} />
            </Tooltip>
          }
          label="Редактировать"
          onClick={() => handleOpenEdit(params.row as StaffMember)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={
            <Tooltip title="Удалить сотрудника из штатного реестра" arrow enterDelay={200}>
              <DeleteIcon sx={{ color: '#DC2626', fontSize: 18 }} />
            </Tooltip>
          }
          label="Удалить"
          onClick={() => {
            setStaffToDelete(params.row as StaffMember);
            setDeleteConfirmOpen(true);
          }}
        />
      ]
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 3, pb: 6 }}>
      {/* Top Banner / Hero Card */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px' }}>
            Медицинский персонал и врачи
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Кадровый реестр клиники, анализ консультативной нагрузки врачей-ортопедов и контроль качества учетных карточек
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Tooltip title="Обновить кадровый состав и статистику приемов" arrow enterDelay={200}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => { fetchStaff(); fetchAnalytics(); }}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#0F3C64', borderColor: '#CBD5E1' }}
            >
              Обновить
            </Button>
          </Tooltip>
          <Tooltip title="Внести нового врача, медсестру или администратора в кадровый реестр" arrow enterDelay={200}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleOpenAdd} 
              sx={{ 
                bgcolor: '#0F3C64', 
                textTransform: 'none', 
                fontWeight: 700, 
                boxShadow: 'none',
                '&:hover': { bgcolor: '#0A2744' } 
              }}
            >
              Добавить сотрудника
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
            <Tab icon={<PeopleIcon fontSize="small" />} iconPosition="start" label="Реестр персонала" />
            <Tab icon={<BarChartIcon fontSize="small" />} iconPosition="start" label="Нагрузка и аналитика приёма" />
            <Tab 
              icon={<HealthAndSafetyIcon fontSize="small" />} 
              iconPosition="start" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Аудит качества данных</span>
                  <Chip 
                    label={`${analytics?.dataQuality?.score || 82} / 100`} 
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

        {/* TAB 0: Staff Registry Table */}
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
                    Сбросить фильтр и показать всех сотрудников
                  </Button>
                }
              >
                <strong>Активен фильтр аудита качества:</strong> {qualityFilterLabel} (показано {staffList.length} сотр.).
              </Alert>
            )}

            <DataGrid
              autoHeight
              showToolbar
              getRowHeight={() => 'auto'}
              loading={loading}
              rows={staffList}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              columnHeaderHeight={54}
              localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
              sx={{
                border: 0,
                width: '100%',
                '& .MuiDataGrid-main': { width: '100%' },
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
                '& .MuiDataGrid-cell': {
                  display: 'flex',
                  alignItems: 'center',
                  py: 1.2,
                  borderBottom: '1px solid #F1F5F9'
                },
                '& .MuiDataGrid-row': {
                  minHeight: '56px !important'
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: 'rgba(15, 60, 100, 0.03)'
                }
              }}
              slots={{ 
                toolbar: CustomStaffToolbar,
                footer: () => (
                  <GridFooterContainer sx={{ p: 1 }}>
                    <Box sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Всего сотрудников в текущем списке: {staffList.length}
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
          </Box>
        )}

        {/* TAB 1: Clinical Workload & Staff Analytics */}
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
                  <Tooltip title="Суммарное число активных сотрудников в штатном расписании Центра ортопедии" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <PeopleIcon sx={{ color: '#0F3C64', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Штатный состав</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                        {analytics?.totals?.totalStaff || 5} специалистов
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>
                        100% активны в штате
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip title="Полный объём завершённых амбулаторных приёмов и консультаций за всю историю клиники" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <MedicalServicesIcon sx={{ color: '#0284C7', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Всего консультаций</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                        {(analytics?.totals?.totalVisitsHandled || 37538).toLocaleString('ru-RU')} приёмов
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600 }}>
                        Ведущие ортопеды клиники
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip title="Консультативная нагрузка врачей-ортопедов за последний полный календарный год (2025)" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <EventAvailableIcon sx={{ color: '#D97706', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Приёмов за 2025 год</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                        {(analytics?.totals?.lastYearVisits || 3046).toLocaleString('ru-RU')} пациентов
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 600 }}>
                        В среднем ~254 приёма в месяц
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip title="Распределение специалистов по клиническим, сестринским и административным ролям" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <HistoryEduIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Врачи / Сестры / Админ</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                        2 / 1 / 2 сотрудника
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#7C3AED', fontWeight: 600 }}>
                        Баланс врачебного состава и сервиса
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>
              </Grid>

              {/* 4 Interactive Analytics Charts */}
              <Grid container spacing={2.5}>
                {/* Chart 1: Doctor Consultation Distribution */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Распределение консультаций между специалистами
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Общий объём амбулаторных приёмов пациентов за всю историю работы
                      </Typography>
                    </Box>

                    <Box sx={{ height: 280, width: '100%' }}>
                      {analytics?.doctorWorkload && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.doctorWorkload} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="shortName" stroke="#64748B" fontSize={12} />
                            <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <RechartsTooltip
                              formatter={(v: any) => [`${Number(v).toLocaleString('ru-RU')} приёмов`, 'Количество консультаций']}
                              labelFormatter={(_, payload) => {
                                const item = payload && payload[0] && payload[0].payload;
                                return item ? `${item.doctorName} (${item.pct}%)` : '';
                              }}
                              contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                            />
                            <Bar dataKey="visits" name="Приёмов" radius={[4, 4, 0, 0]}>
                              {analytics.doctorWorkload.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Chart 2: Annual Trends */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Многолетняя динамика врачебных приёмов (2021–2026)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Сравнение консультативной нагрузки докторов по календарным годам
                      </Typography>
                    </Box>

                    <Box sx={{ height: 280, width: '100%' }}>
                      {analytics?.annualTrends && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.annualTrends} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="year" stroke="#64748B" fontSize={12} />
                            <YAxis stroke="#64748B" fontSize={11} />
                            <RechartsTooltip
                              formatter={(v: any, name: any) => [
                                `${Number(v).toLocaleString('ru-RU')} приёмов`, 
                                name === 'dobrouchkin' ? 'Добрушкин А. М.' : 'Гавловский В. В.'
                              ]}
                              contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                            />
                            <Legend 
                              formatter={(value) => value === 'dobrouchkin' ? 'Добрушкин А. М.' : 'Гавловский В. В.'} 
                            />
                            <Bar dataKey="dobrouchkin" fill="#0F3C64" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="gavlovsky" fill="#0284C7" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Chart 3: Role Structure Donut */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Кадровая структура по категориям персонала
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Соотношение врачебного, сестринского и административного блоков
                      </Typography>
                    </Box>

                    <Box sx={{ height: 270, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {analytics?.roleDistribution && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.roleDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={4}
                              dataKey="count"
                            >
                              {analytics.roleDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(v: any) => [`${v} сотрудников`, 'Численность']}
                              contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Chart 4: Historical Consultation Proportion */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        Долевое соотношение врачебного приёма
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Сбалансированность потока пациентов между ведущими специалистами
                      </Typography>
                    </Box>

                    <Box sx={{ height: 270, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {analytics?.doctorWorkload && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.doctorWorkload}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={4}
                              dataKey="visits"
                              nameKey="shortName"
                            >
                              {analytics.doctorWorkload.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(v: any, _, item: any) => [
                                `${Number(v).toLocaleString('ru-RU')} приёмов (${item?.payload?.pct}%)`, 
                                item?.payload?.doctorName
                              ]}
                              contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
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
                          Сводный индекс качества кадрового реестра: {analytics?.dataQuality?.score || 82} из 100 баллов
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          Хороший уровень заполнения. Все 100% сотрудников активны в штате. Ключевые точки контроля — заполнение контактов административного персонала и русификация наименований должностей.
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Реестр пригоден к учету"
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
                Полнота заполнения кадровых атрибутов
              </Typography>

              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {/* Contact Phone */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Наличие рабочего телефона сотрудника для оперативной связи и SMS-оповещений" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Контактный телефон</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
                          {analytics?.dataQuality?.completeness?.phone?.pct || 80.0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.phone?.pct || 80.0}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#D97706' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">4 из 5 сотрудников</Typography>
                        <Chip label="Внимание" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>

                {/* Email */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Наличие корпоративного адреса электронной почты для авторизации и системных уведомлений" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Корпоративный Email</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
                          {analytics?.dataQuality?.completeness?.email?.pct || 80.0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.email?.pct || 80.0}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#D97706' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">4 из 5 сотрудников</Typography>
                        <Chip label="Внимание" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>

                {/* Formal Name */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Регламентное указание фамилии, имени и отчества сотрудника без неформальных сокращений" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Регламентное ФИО</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
                          {analytics?.dataQuality?.completeness?.formalName?.pct || 80.0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.formalName?.pct || 80.0}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#D97706' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">4 из 5 сотрудников</Typography>
                        <Chip label="Внимание" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>

                {/* Standard Russian Role */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Использование официальных русскоязычных наименований должностей в соответствии с номенклатурой Минздрава" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Стандартизация должностей</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
                          {analytics?.dataQuality?.completeness?.standardRole?.pct || 80.0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.standardRole?.pct || 80.0}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#D97706' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">4 из 5 сотрудников</Typography>
                        <Chip label="Внимание" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>

                {/* Active Status */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Tooltip title="Наличие актуального статуса сотрудника в клинике" arrow enterDelay={200}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Активный статус в штате</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                          {analytics?.dataQuality?.completeness?.activeStatus?.pct || 100.0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analytics?.dataQuality?.completeness?.activeStatus?.pct || 100.0}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#16A34A' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">5 из 5 сотрудников</Typography>
                        <Chip label="Отлично" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }} />
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>
              </Grid>

              {/* 4 Actionable Audit Alerts */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
                Обнаруженные кадровые аномалии и задачи
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F3C64' }}>
          {isEditing ? 'Редактировать карточку сотрудника' : 'Добавить нового сотрудника'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            margin="normal"
            label="ФИО Сотрудника (полностью)"
            placeholder="Например: Иванов Иван Иванович"
            value={currentStaff.full_name || ''}
            onChange={(e) => setCurrentStaff({ ...currentStaff, full_name: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="staff-role-label" htmlFor="staff-role-select">Должность / Роль</InputLabel>
            <Select
              id="staff-role-select"
              labelId="staff-role-label"
              inputProps={{ id: 'staff-role-select' }}
              value={currentStaff.role || 'Врач травматолог-ортопед'}
              label="Должность / Роль"
              onChange={(e) => setCurrentStaff({ ...currentStaff, role: e.target.value })}
            >
              <MenuItem value="Главный врач, ортопед-травматолог">Главный врач, ортопед-травматолог</MenuItem>
              <MenuItem value="Врач травматолог-ортопед">Врач травматолог-ортопед</MenuItem>
              <MenuItem value="Врач-хирург">Врач-хирург</MenuItem>
              <MenuItem value="Старшая медицинская сестра">Старшая медицинская сестра</MenuItem>
              <MenuItem value="Операционная медицинская сестра">Операционная медицинская сестра</MenuItem>
              <MenuItem value="Администратор клиники">Администратор клиники</MenuItem>
              <MenuItem value="Управляющий клиникой">Управляющий клиникой</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Специализация / Направление деятельности"
            placeholder="Например: Артроскопия, блокады суставов, реабилитация"
            value={currentStaff.specialization || ''}
            onChange={(e) => setCurrentStaff({ ...currentStaff, specialization: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Контактный телефон"
            placeholder="+7 (988) 000-00-00"
            value={currentStaff.contact_phone || ''}
            onChange={(e) => setCurrentStaff({ ...currentStaff, contact_phone: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Рабочий Email"
            placeholder="doctor@orthocenter.ru"
            value={currentStaff.email || ''}
            onChange={(e) => setCurrentStaff({ ...currentStaff, email: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="staff-status-label" htmlFor="staff-status-select">Статус занятости</InputLabel>
            <Select
              id="staff-status-select"
              labelId="staff-status-label"
              inputProps={{ id: 'staff-status-select' }}
              value={currentStaff.status || 'active'}
              label="Статус занятости"
              onChange={(e) => setCurrentStaff({ ...currentStaff, status: e.target.value })}
            >
              <MenuItem value="active">Работает в клинике</MenuItem>
              <MenuItem value="vacation">В отпуске</MenuItem>
              <MenuItem value="archive">Архивный сотрудник</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Tooltip title="Отменить изменения и закрыть диалог" arrow enterDelay={200}>
            <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
              Отмена
            </Button>
          </Tooltip>
          <Tooltip title="Зафиксировать изменения в кадровой базе данных" arrow enterDelay={200}>
            <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#0F3C64', textTransform: 'none', fontWeight: 700 }}>
              Сохранить
            </Button>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626' }}>
          Подтверждение удаления
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Вы действительно хотите удалить сотрудника <strong>{staffToDelete?.full_name}</strong> из штатного реестра?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Отмена
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ textTransform: 'none', fontWeight: 700 }}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
      />
    </Box>
  );
}
