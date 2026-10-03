import { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Box,
  Button,
  Tooltip,
  Paper,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  LinearProgress,
  Alert
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import CustomToolbar from '../components/CustomToolbar';
import PatientsGridFooter from '../components/PatientsGridFooter';
import { ruRU } from '@mui/x-data-grid/locales';
import PersonIcon from '@mui/icons-material/Person';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

export interface PatientRecord {
  id: number;
  surname: string;
  name: string;
  patron: string;
  full_name: string;
  brief_name: string;
  sex: number;
  sex_display: string;
  bdate: string | null;
  age: number;
  weight: number;
  height: number;
  phone: string;
  phones: string;
  sphone: string;
  email: string;
  address: string;
  subject: string;
  region: string;
  city: string;
  area: string;
  street: string;
  house: string;
  flat: string;
  pseries: string;
  pnumber: string;
  pdate: string | null;
  pauthor: string;
  parent: string;
  mednum: number;
  dms_flag: number;
  dms_policy: string;
  dms_insurer: string;
  ignor_flag: number;
  unch_flag: number;
  ch_id: number | null;
  channel_name: string;
  rdate: string | null;
  last_visit_date: string | null;
  total_visits: number;
  total_spent: number;
  contact_phone?: string;
  firstName?: string;
  lastName?: string;
  contact?: string;
  lastVisit?: string;
}

export interface PatientVisit {
  id: number;
  patient_id: number;
  docn: number;
  visit_date: string;
  visit_time: number;
  visit_time_s: string;
  remark: string;
}

export interface PatientsAnalyticsData {
  success: boolean;
  totals: {
    totalPatients: number;
    activePatients: number;
    averageAge: number;
    returnRatePct: number;
  };
  genderStats: Array<{ name: string; count: number; share: number; color: string }>;
  ageGroups: Array<{ groupName: string; label: string; focus: string; count: number; share: number; color: string }>;
  geography: Array<{ name: string; count: number; share: number; color: string }>;
  channels: Array<{ name: string; count: number; share: number; color: string }>;
  dataQuality: {
    score: number;
    completeness: {
      phone: { count: number; pct: number; target: number; status: string };
      bdate: { count: number; pct: number; target: number; status: string };
      address: { count: number; pct: number; target: number; status: string };
      channel: { count: number; pct: number; target: number; status: string };
      passport: { count: number; pct: number; target: number; status: string };
      email: { count: number; pct: number; target: number; status: string };
    };
    alerts: Array<{
      id: string;
      severity: string;
      title: string;
      badge: string;
      text: string;
      hint: string;
      filterKey: string;
      actionLabel: string;
    }>;
  };
}

export default function Patients() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs State: 0 - Grid, 1 - Demographics Analytics, 2 - Data Quality Audit
  const [activeTab, setActiveTab] = useState<number>(0);
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [qualityFilterLabel, setQualityFilterLabel] = useState<string>('');

  // Analytics State
  const [analytics, setAnalytics] = useState<PatientsAnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);

  // EMR Details Dialog State
  const [emrDialogOpen, setEmrDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [patientVisits, setPatientVisits] = useState<PatientVisit[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Add Patient Dialog State
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSurname, setNewSurname] = useState('');
  const [newName, setNewName] = useState('');
  const [newPatron, setNewPatron] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBdate, setNewBdate] = useState('');
  const [newSex, setNewSex] = useState<number>(1);
  const [newCity, setNewCity] = useState('г. Сочи');
  const [newAddress, setNewAddress] = useState('');
  const [savingNew, setSavingNew] = useState(false);

  const fetchPatients = async (filterKey = qualityFilter) => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/patients?limit=2500';
      if (filterKey === 'fake_phone') {
        url += '&fake_phone=true';
      } else if (filterKey === 'no_passport_visits') {
        url += '&no_passport_visits=true';
      } else if (filterKey === 'no_phone') {
        url += '&no_phone=true';
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (e) {
      console.error('Failed to load patients', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('http://localhost:5000/api/patients/analytics-overview');
      if (res.ok) {
        const json = await res.json();
        setAnalytics(json);
      }
    } catch (e) {
      console.error('Failed to load patient analytics', e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchPatients(qualityFilter);
    fetchAnalytics();
  }, []);

  const handleApplyQualityFilter = (filterKey: string, label: string) => {
    setQualityFilter(filterKey);
    setQualityFilterLabel(label);
    setActiveTab(0);
    fetchPatients(filterKey);
  };

  const handleClearQualityFilter = () => {
    setQualityFilter('all');
    setQualityFilterLabel('');
    fetchPatients('all');
  };

  const handleOpenEmr = async (patientId: number) => {
    setEmrDialogOpen(true);
    setLoadingDetails(true);
    try {
      const res = await fetch(`http://localhost:5000/api/patients/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPatient(data);
        setPatientVisits(data.visits || []);
      }
    } catch (e) {
      console.error('Failed to load patient EMR details', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreatePatient = async () => {
    if (!newSurname.trim() || !newName.trim()) {
      alert('Пожалуйста, укажите Фамилию и Имя пациента.');
      return;
    }

    setSavingNew(true);

    try {
      const res = await fetch('http://localhost:5000/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newName.trim(),
          last_name: newSurname.trim(),
          contact_phone: newPhone.trim(),
          date_of_birth: newBdate,
          medical_history_notes: `Город: ${newCity}. Адрес: ${newAddress}`
        })
      });

      if (res.ok) {
        setAddDialogOpen(false);
        setNewSurname('');
        setNewName('');
        setNewPatron('');
        setNewPhone('');
        setNewBdate('');
        setNewAddress('');
        fetchPatients();
      } else {
        const err = await res.json();
        alert('Ошибка при создании: ' + (err.error || 'Ошибка сервера'));
      }
    } catch (e: any) {
      alert('Сетевая ошибка: ' + e.message);
    } finally {
      setSavingNew(false);
    }
  };

  const patientsTotals = useMemo(() => {
    let maleCount = 0;
    let femaleCount = 0;
    let dmsCount = 0;
    let totalVisits = 0;

    patients.forEach((p: any) => {
      if (p.sex === 1) maleCount++;
      else femaleCount++;
      if (p.dms_flag || p.dms_policy) dmsCount++;
      totalVisits += (p.total_visits || 0);
    });

    return {
      totalCount: patients.length,
      maleCount,
      femaleCount,
      dmsCount,
      totalVisits
    };
  }, [patients]);

  const columns: GridColDef[] = [
    {
      field: 'mednum',
      headerName: '№ ЭМК',
      width: 95,
      minWidth: 90,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? `№ ${params.value}` : `ID ${params.row.id}`}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: '#EBF8FF',
            color: '#2B6CB0',
            fontSize: '0.78rem',
            borderRadius: 1.5
          }}
        />
      )
    },
    {
      field: 'full_name',
      headerName: 'ФИО Пациента',
      flex: 2,
      minWidth: 230,
      renderCell: (params: GridRenderCellParams) => {
        const initials = `${params.row.surname?.[0] || ''}${params.row.name?.[0] || ''}`.toUpperCase();
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 0.5, width: '100%' }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                bgcolor: params.row.sex === 1 ? '#0F3C64' : '#9B2C2C',
                fontSize: '0.78rem',
                fontWeight: 700
              }}
            >
              {initials || <PersonIcon sx={{ fontSize: 18 }} />}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64', lineHeight: 1.25, fontSize: '0.84rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                {params.value || `${params.row.surname} ${params.row.name}`}
              </Typography>
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.72rem', display: 'block' }}>
                {params.row.brief_name || 'ЭМК'}
              </Typography>
            </Box>
          </Box>
        );
      }
    },
    {
      field: 'bdate',
      headerName: 'Дата рожд. / Возраст',
      width: 155,
      minWidth: 145,
      renderCell: (params: GridRenderCellParams) => {
        const bdate = params.value ? new Date(params.value).toLocaleDateString('ru-RU') : 'Н/Д';
        const age = params.row.age ? ` (${params.row.age} лет)` : '';
        return (
          <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#2D3748' }}>
            {bdate}{age}
          </Typography>
        );
      }
    },
    {
      field: 'sex_display',
      headerName: 'Пол',
      width: 65,
      minWidth: 60,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const isMale = params.row.sex === 1;
        return (
          <Chip
            label={isMale ? 'М' : 'Ж'}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              bgcolor: isMale ? '#EBF8FF' : '#FFF5F5',
              color: isMale ? '#2B6CB0' : '#C53030'
            }}
          />
        );
      }
    },
    {
      field: 'sphone',
      headerName: 'Телефон',
      width: 155,
      minWidth: 145,
      renderCell: (params: GridRenderCellParams) => {
        const ph = params.value || params.row.phone || params.row.contact_phone || 'Н/Д';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PhoneIcon sx={{ fontSize: 14, color: '#718096' }} />
            <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 500 }}>
              {ph}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'city',
      headerName: 'Город / Адрес',
      flex: 1.4,
      minWidth: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#4A5568', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3, py: 0.5 }}>
          {params.value || params.row.address || 'г. Сочи'}
        </Typography>
      )
    },
    {
      field: 'channel_name',
      headerName: 'Источник / Канал',
      flex: 1,
      minWidth: 130,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) return <Typography variant="caption" sx={{ color: '#A0AEC0' }}>Не указан</Typography>;
        return (
          <Chip
            label={params.value}
            size="small"
            variant="outlined"
            sx={{
              borderColor: '#CBD5E0',
              color: '#4A5568',
              fontSize: '0.72rem',
              maxWidth: 160
            }}
          />
        );
      }
    },
    {
      field: 'dms_flag',
      headerName: 'ДМС',
      width: 75,
      minWidth: 70,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        params.value ? (
          <Tooltip title={`Полис ДМС: ${params.row.dms_policy || 'Да'} (${params.row.dms_insurer || ''})`}>
            <Chip
              icon={<VerifiedUserIcon sx={{ fontSize: '13px !important' }} />}
              label="ДМС"
              size="small"
              color="success"
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          </Tooltip>
        ) : (
          <Typography variant="caption" sx={{ color: '#CBD5E0' }}>—</Typography>
        )
      )
    },
    {
      field: 'total_visits',
      headerName: 'Визитов',
      width: 85,
      minWidth: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value || 0}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: (params.value || 0) > 0 ? '#FEFCBF' : '#EDF2F7',
            color: (params.value || 0) > 0 ? '#B7791F' : '#718096',
            fontSize: '0.75rem'
          }}
        />
      )
    },
    {
      field: 'last_visit_date',
      headerName: 'Посл. визит',
      width: 120,
      minWidth: 110,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) return <Typography variant="caption" sx={{ color: '#A0AEC0' }}>Первичный</Typography>;
        const d = new Date(params.value).toLocaleDateString('ru-RU');
        return (
          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#2D3748' }}>
            {d}
          </Typography>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'ЭМК',
      sortable: false,
      filterable: false,
      width: 90,
      minWidth: 85,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="Открыть полную медицинскую карту пациента" arrow>
          <Button
            size="small"
            variant="contained"
            onClick={() => handleOpenEmr(params.row.id)}
            sx={{
              bgcolor: '#0F3C64',
              fontSize: '0.72rem',
              py: 0.3,
              px: 1,
              fontWeight: 700,
              minWidth: 64,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#082540' }
            }}
          >
            ЭМК
          </Button>
        </Tooltip>
      )
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1600px', mx: 'auto', pb: 4 }}>
      {/* Top Header & Metrics Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 1 }}>
            <BadgeIcon sx={{ fontSize: 28, color: '#0F3C64' }} /> Картотека пациентов (ЭМК)
          </Typography>
          <Typography variant="body2" sx={{ color: '#718096', mt: 0.2 }}>
            Полная база пациентов, синхронизированная с медицинской базой Firebird (61 298 записей)
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip
            icon={<LocalHospitalIcon sx={{ fontSize: '15px !important' }} />}
            label={`В кэше: ${patients.length} карт`}
            size="small"
            sx={{ bgcolor: '#F0F6FA', color: '#0F3C64', fontWeight: 600, border: '1px solid #D6E4F0' }}
          />
          <Tooltip title="Обновить список пациентов и аналитические показатели" arrow enterDelay={200}>
            <span>
              <IconButton
                onClick={() => { fetchPatients(qualityFilter); fetchAnalytics(); }}
                disabled={loading}
                sx={{ border: '1px solid #CBD5E1', borderRadius: 2, p: 0.8, bgcolor: '#FFFFFF' }}
              >
                <RefreshIcon fontSize="small" sx={{ color: '#0F3C64' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              bgcolor: '#0F3C64',
              fontWeight: 700,
              borderRadius: 2,
              '&:hover': { bgcolor: '#082540' }
            }}
          >
            Новый пациент
          </Button>
        </Box>
      </Box>

      {/* Main Tabbed Interface */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5, bgcolor: '#FFFFFF', mb: 2.5, overflow: 'hidden' }}>
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
                <Tooltip title="Рабочий реестр картотеки пациентов: таблица с поиском, фильтрами и открытием медицинской карты (ЭМК)" arrow enterDelay={200}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BadgeIcon fontSize="small" />
                    <span>Реестр картотеки (ЭМК)</span>
                  </Box>
                </Tooltip>
              }
            />
            <Tab
              label={
                <Tooltip title="Демографический профиль контингента: возрастная пирамида, соотношение по полу, география по районам Сочи и каналы обращений" arrow enterDelay={200}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BarChartIcon fontSize="small" />
                    <span>Аналитика контингента</span>
                  </Box>
                </Tooltip>
              }
            />
            <Tab
              label={
                <Tooltip title="Аудит качества данных: интегральный индекс заполнения базы ЭМК, проверка паспортов, номеров телефонов и выявление аномалий" arrow enterDelay={200}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HealthAndSafetyIcon fontSize="small" />
                    <span>Аудит качества данных</span>
                  </Box>
                </Tooltip>
              }
            />
          </Tabs>
        </Box>

        {/* TAB 0: Main Patients DataGrid */}
        {activeTab === 0 && (
          <Box sx={{ p: 2 }}>
            {qualityFilter !== 'all' && (
              <Alert
                severity="info"
                sx={{ mb: 2, borderRadius: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<FilterAltOffIcon />}
                    onClick={handleClearQualityFilter}
                    sx={{ fontWeight: 700 }}
                  >
                    Сбросить фильтр
                  </Button>
                }
              >
                Активен фильтр аудита качества: <strong>{qualityFilterLabel}</strong> ({patients.length} записей)
              </Alert>
            )}

            <DataGrid
              autoHeight
              getRowHeight={() => 'auto'}
              showToolbar
              rows={patients}
              columns={columns}
              loading={loading}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              disableRowSelectionOnClick
              columnHeaderHeight={52}
              localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
              slots={{
                toolbar: CustomToolbar,
                footer: PatientsGridFooter
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 400 },
                },
                footer: {
                  totals: patientsTotals
                } as any
              }}
              sx={{
                border: 'none',
                width: '100%',
                minHeight: 480,
                '& .MuiDataGrid-virtualScroller': {
                  overflowX: 'hidden'
                },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: '#F8FAFC',
                  color: '#0F3C64',
                  fontWeight: 700,
                  borderBottom: '2px solid #E2E8F0',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #EDF2F7',
                  fontSize: '0.82rem',
                  py: 1,
                  display: 'flex',
                  alignItems: 'center'
                },
                '& .MuiDataGrid-row': {
                  minHeight: '48px !important'
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: 'rgba(15, 60, 100, 0.04)'
                }
              }}
            />
          </Box>
        )}

        {/* TAB 1: Patients Analytics & Demographics */}
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
                <Tooltip title="Общее количество зарегистрированных электронных медицинских карт за всю историю работы Центра ортопедии" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Всего в картотеке</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                      {(analytics?.totals?.totalPatients || 61298).toLocaleString('ru-RU')} карт
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                      Единая база данных пациентов
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Tooltip title="Пациенты, у которых в системе зафиксирован хотя бы один визит, консультация или манипуляция" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Активные пациенты</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                      {(analytics?.totals?.activePatients || 16493).toLocaleString('ru-RU')} чел.
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600 }}>
                      26.9% проходили лечение в клинике
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Tooltip title="Средний возраст пациентов клиники на основе зарегистрированных дат рождения" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Средний возраст</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', my: 0.5 }}>
                      {analytics?.totals?.averageAge || 43.8} года
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#7C3AED', fontWeight: 600 }}>
                      Преобладание трудоспособного возраста
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Tooltip title="Доля пациентов, пришедших на повторный приём, перевязку или курс процедур после первичной консультации" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', cursor: 'help' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Повторные приёмы</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669', my: 0.5 }}>
                      {analytics?.totals?.returnRatePct || 36.6}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                      Завершение курсов лечения
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>
            </Grid>

            {/* Demographics & Age Pyramid Charts */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Age Groups Pyramid */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Tooltip title="Распределение пациентов по возрасту с акцентом на профильные ортопедические патологии" arrow enterDelay={200}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                    Возрастная пирамида контингента клиники (Клинические группы)
                  </Typography>
                </Tooltip>
                <Box sx={{ width: '100%', height: 320 }}>
                  {analytics?.ageGroups && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.ageGroups} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
                        <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <RechartsTooltip
                          formatter={(v: any) => [`${Number(v).toLocaleString('ru-RU')} пациентов`, 'Количество']}
                          labelFormatter={(label, payload) => {
                            const item = payload && payload[0] && payload[0].payload;
                            return item ? `${item.groupName} — ${item.focus}` : label;
                          }}
                          contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                        <Bar dataKey="count" name="Пациентов" fill="#0F3C64" radius={[4, 4, 0, 0]}>
                          {analytics.ageGroups.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#0F3C64'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Grid>

              {/* Gender Distribution Pie Chart */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Tooltip title="Соотношение мужчин и женщин среди зарегистрированных пациентов клиники" arrow enterDelay={200}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                    Распределение по полу
                  </Typography>
                </Tooltip>
                <Box sx={{ width: '100%', height: 320 }}>
                  {analytics?.genderStats && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.genderStats}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {analytics.genderStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(v: any, name: any) => [`${Number(v).toLocaleString('ru-RU')} чел.`, name]}
                          contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                        <Legend verticalAlign="bottom" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Geography & Channels Charts */}
            <Grid container spacing={3}>
              {/* Geography Chart */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <Tooltip title="Территориальное распределение пациентов по районам Большого Сочи и иногородним пациентам" arrow enterDelay={200}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                    География пациентов (Районы Сочи и регионы РФ)
                  </Typography>
                </Tooltip>
                <Box sx={{ width: '100%', height: 320 }}>
                  {analytics?.geography && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={analytics.geography} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={170} />
                        <RechartsTooltip
                          formatter={(v: any) => [`${Number(v).toLocaleString('ru-RU')} пациентов`, 'Количество']}
                          contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                        <Bar dataKey="count" fill="#0284C7" radius={[0, 4, 4, 0]}>
                          {analytics.geography.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#0284C7'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Grid>

              {/* Channels Chart */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <Tooltip title="Источники первичных обращений пациентов в клинику ортопедии" arrow enterDelay={200}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, cursor: 'help' }}>
                    Каналы привлечения пациентов (Маркетинговые источники)
                  </Typography>
                </Tooltip>
                <Box sx={{ width: '100%', height: 320 }}>
                  {analytics?.channels && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={analytics.channels} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={180} />
                        <RechartsTooltip
                          formatter={(v: any) => [`${Number(v).toLocaleString('ru-RU')} обращений`, 'Количество']}
                          contentStyle={{ borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                        <Bar dataKey="count" fill="#0F3C64" radius={[0, 4, 4, 0]}>
                          {analytics.channels.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#0F3C64'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
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
                        Сводный индекс заполнения базы ЭМК: {analytics?.dataQuality?.score || 88} из 100 баллов
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        Хороший уровень заполнения. Телефоны и даты рождения заполнены практически идеально (98.6% и 99.2%). Ключевая зона внимания — паспортные данные для договоров.
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Статус: База пригодна к учету"
                    sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.85rem', px: 1 }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Field Completeness Progress Bars */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
              Полнота заполнения обязательных реквизитов медицинской карты
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              {/* Phone */}
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <Tooltip title="Наличие контактного номера телефона пациента для связи, подтверждения записи и SMS-оповещений" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Номера телефонов</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                        {analytics?.dataQuality?.completeness?.phone?.pct || 98.6}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={analytics?.dataQuality?.completeness?.phone?.pct || 98.6}
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#059669' } }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">60 449 карт</Typography>
                      <Chip label="Идеально" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700 }} />
                    </Box>
                  </Paper>
                </Tooltip>
              </Grid>

              {/* Birth Date */}
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <Tooltip title="Наличие даты рождения и точного возраста пациента для дозирования медикаментов и оценки рисков" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Даты рождения и возраст</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                        {analytics?.dataQuality?.completeness?.bdate?.pct || 99.2}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={analytics?.dataQuality?.completeness?.bdate?.pct || 99.2}
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#059669' } }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">60 786 карт</Typography>
                      <Chip label="Идеально" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700 }} />
                    </Box>
                  </Paper>
                </Tooltip>
              </Grid>

              {/* Address */}
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <Tooltip title="Наличие населённого пункта, улицы и дома для оформления больничных листов и справок" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Адрес и город</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0284C7' }}>
                        {analytics?.dataQuality?.completeness?.address?.pct || 90.4}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={analytics?.dataQuality?.completeness?.address?.pct || 90.4}
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#0284C7' } }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">55 391 карт</Typography>
                      <Chip label="Отлично" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#EFF6FF', color: '#0284C7', fontWeight: 700 }} />
                    </Box>
                  </Paper>
                </Tooltip>
              </Grid>

              {/* Acquisition Channel */}
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <Tooltip title="Фиксация источника обращения пациента для оценки эффективности рекламы и рекомендаций" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Канал привлечения</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
                        {analytics?.dataQuality?.completeness?.channel?.pct || 71.4}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={analytics?.dataQuality?.completeness?.channel?.pct || 71.4}
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#D97706' } }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">43 743 карт</Typography>
                      <Chip label="Требует внимания" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700 }} />
                    </Box>
                  </Paper>
                </Tooltip>
              </Grid>

              {/* Passport */}
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <Tooltip title="Наличие паспортных данных для официального договора на платные медицинские услуги и налоговых справок" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Паспортные данные</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>
                        {analytics?.dataQuality?.completeness?.passport?.pct || 43.5}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={analytics?.dataQuality?.completeness?.passport?.pct || 43.5}
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#DC2626' } }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">26 671 карт</Typography>
                      <Chip label="Юридический риск" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 700 }} />
                    </Box>
                  </Paper>
                </Tooltip>
              </Grid>

              {/* Email */}
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <Tooltip title="Наличие электронной почты для отправки протоколов исследований, чеков и справок об оплате" arrow enterDelay={200}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, cursor: 'help' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Электронная почта</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#7C3AED' }}>
                        {analytics?.dataQuality?.completeness?.email?.pct || 8.9}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={analytics?.dataQuality?.completeness?.email?.pct || 8.9}
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#7C3AED' } }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">5 485 карт</Typography>
                      <Chip label="Резерв сервиса" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FAF5FF', color: '#7C3AED', fontWeight: 700 }} />
                    </Box>
                  </Paper>
                </Tooltip>
              </Grid>
            </Grid>

            {/* Quality Alerts & Actionable Buttons */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2 }}>
              Оперативные сигналы чистоты базы и быстрое исправление
            </Typography>
            <Grid container spacing={2}>
              {(analytics?.dataQuality?.alerts || []).map((alert) => {
                const isWarning = alert.severity === 'warning';
                const isError = alert.severity === 'error';
                const isSuccess = alert.severity === 'success';

                const borderCol = isError ? '#FECACA' : isWarning ? '#FED7AA' : isSuccess ? '#BBF7D0' : '#E2E8F0';
                const bgCol = isError ? '#FEF2F2' : isWarning ? '#FFFBEB' : isSuccess ? '#F0FDF4' : '#F8FAFC';
                const titleCol = isError ? '#991B1B' : isWarning ? '#9A3412' : isSuccess ? '#166534' : '#0F3C64';

                return (
                  <Grid size={{ xs: 12, md: 6 }} key={alert.id}>
                    <Tooltip title={alert.hint} arrow enterDelay={200}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2.5,
                          border: `1px solid ${borderCol}`,
                          bgcolor: bgCol,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%'
                        }}
                      >
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isError && <ErrorOutlineIcon sx={{ color: '#DC2626', fontSize: 20 }} />}
                              {isWarning && <WarningAmberIcon sx={{ color: '#EA580C', fontSize: 20 }} />}
                              {isSuccess && <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 20 }} />}
                              {!isError && !isWarning && !isSuccess && <PeopleAltIcon sx={{ color: '#7C3AED', fontSize: 20 }} />}
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: titleCol }}>
                                {alert.title}
                              </Typography>
                            </Box>
                            <Chip
                              label={alert.badge}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                bgcolor: isError ? '#FEE2E2' : isWarning ? '#FFEDD5' : isSuccess ? '#DCFCE7' : '#EDE9FE',
                                color: isError ? '#DC2626' : isWarning ? '#C2410C' : isSuccess ? '#15803D' : '#6D28D9'
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

      {/* FULL EMR MEDICAL RECORD DIALOG */}
      <Dialog
        open={emrDialogOpen}
        onClose={() => setEmrDialogOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 0.5 } } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #E2E8F0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: selectedPatient?.sex === 1 ? '#0F3C64' : '#9B2C2C', width: 44, height: 44 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2, fontSize: '1.1rem' }}>
                {selectedPatient?.full_name || 'Медицинская карта пациента'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>
                ЭМК № {selectedPatient?.mednum} • ID: {selectedPatient?.id} • Регистрация: {selectedPatient?.rdate ? new Date(selectedPatient.rdate).toLocaleDateString('ru-RU') : 'Н/Д'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setEmrDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2, pt: 0 }}>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 250, gap: 2 }}>
              <CircularProgress size={36} sx={{ color: '#0F3C64' }} />
              <Typography variant="body2" sx={{ color: '#4A5568' }}>Загрузка медицинской истории...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Personal & Passport Details Grid */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <BadgeIcon sx={{ fontSize: 18 }} /> 1. Персональные данные и документ
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontWeight: 600 }}>Дата рождения / Пол</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      {selectedPatient?.bdate ? new Date(selectedPatient.bdate).toLocaleDateString('ru-RU') : 'Не указана'}
                      {selectedPatient?.age ? ` (${selectedPatient.age} лет)` : ''} • {selectedPatient?.sex === 1 ? 'Мужской' : 'Женский'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontWeight: 600 }}>Основной телефон</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      {selectedPatient?.sphone || selectedPatient?.phone || 'Не указан'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontWeight: 600 }}>Email</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      {selectedPatient?.email || 'Не указан'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontWeight: 600 }}>Паспорт (Серия / Номер)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      {selectedPatient?.pseries || selectedPatient?.pnumber ? `${selectedPatient?.pseries || ''} ${selectedPatient?.pnumber || ''}` : 'Не внесен в карточку'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontWeight: 600 }}>Дата выдачи паспорта</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      {selectedPatient?.pdate ? new Date(selectedPatient.pdate).toLocaleDateString('ru-RU') : '—'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontWeight: 600 }}>Кем выдан</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      {selectedPatient?.pauthor || '—'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Address & Insurance Grid */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <LocationOnIcon sx={{ fontSize: 18 }} /> 2. Адрес регистрации и страхование
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontWeight: 600 }}>Адрес проживания / регистрации</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      {selectedPatient?.address || `${selectedPatient?.city || 'г. Сочи'}, ${selectedPatient?.street || ''} ${selectedPatient?.house || ''}`}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontWeight: 600 }}>Рекламный канал привлечения</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2B6CB0' }}>
                      {selectedPatient?.channel_name || 'Не указан'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontWeight: 600 }}>Статус страхования ДМС</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: selectedPatient?.dms_flag ? '#276749' : '#718096' }}>
                      {selectedPatient?.dms_flag ? `Полис № ${selectedPatient.dms_policy || 'ДМС активен'}` : 'Обслуживание без полиса ДМС'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontWeight: 600 }}>Страховая компания</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      {selectedPatient?.dms_insurer || '—'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Patient Visits History Table */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <CalendarMonthIcon sx={{ fontSize: 18 }} /> 3. История визитов и приемов в клинике ({patientVisits.length})
                </Typography>

                {patientVisits.length > 0 ? (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, maxHeight: 220 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, bgcolor: '#F0F4F8', color: '#0F3C64' }}>Дата визита</TableCell>
                          <TableCell sx={{ fontWeight: 700, bgcolor: '#F0F4F8', color: '#0F3C64' }}>Время / Талон</TableCell>
                          <TableCell sx={{ fontWeight: 700, bgcolor: '#F0F4F8', color: '#0F3C64' }}>Врач / Кабинет</TableCell>
                          <TableCell sx={{ fontWeight: 700, bgcolor: '#F0F4F8', color: '#0F3C64' }}>Клиническое примечание</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {patientVisits.map((v) => (
                          <TableRow key={v.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {v.visit_date ? new Date(v.visit_date).toLocaleDateString('ru-RU') : '—'}
                            </TableCell>
                            <TableCell>{v.visit_time_s || 'Плановый'}</TableCell>
                            <TableCell>Врач № {v.docn}</TableCell>
                            <TableCell sx={{ color: '#4A5568', fontStyle: v.remark ? 'normal' : 'italic' }}>
                              {v.remark || 'Осмотр и консультация'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: '#F8FAFC', border: '1px dashed #CBD5E0', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#718096', fontStyle: 'italic' }}>
                      В базе нет зафиксированных визитов для данного пациента.
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setEmrDialogOpen(false)} variant="outlined">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD NEW PATIENT MODAL */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1px solid #E2E8F0' }}>
          Регистрация нового пациента в ЭМК
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Фамилия *"
                fullWidth
                size="small"
                value={newSurname}
                onChange={(e) => setNewSurname(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Имя *"
                fullWidth
                size="small"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Отчество"
                fullWidth
                size="small"
                value={newPatron}
                onChange={(e) => setNewPatron(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Телефон *"
                fullWidth
                size="small"
                placeholder="+7 (___) ___-__-__"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Дата рождения"
                type="date"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={newBdate}
                onChange={(e) => setNewBdate(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Пол</InputLabel>
                <Select value={newSex} label="Пол" onChange={(e) => setNewSex(Number(e.target.value))}>
                  <MenuItem value={1}>Мужской</MenuItem>
                  <MenuItem value={2}>Женский</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Город"
                fullWidth
                size="small"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Адрес проживания"
                fullWidth
                size="small"
                placeholder="Улица, дом, квартира"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setAddDialogOpen(false)} variant="outlined">
            Отмена
          </Button>
          <Button
            onClick={handleCreatePatient}
            variant="contained"
            disabled={savingNew}
            sx={{ bgcolor: '#0F3C64', '&:hover': { bgcolor: '#082540' } }}
          >
            {savingNew ? 'Сохранение...' : 'Зарегистрировать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
