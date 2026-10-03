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
  IconButton
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

export default function Patients() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/patients?limit=2500');
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

  useEffect(() => {
    fetchPatients();
  }, []);

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

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            icon={<LocalHospitalIcon sx={{ fontSize: '15px !important' }} />}
            label={`Загружено в кэш: ${patients.length} пациентов`}
            size="small"
            sx={{ bgcolor: '#F0F6FA', color: '#0F3C64', fontWeight: 600, border: '1px solid #D6E4F0' }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              bgcolor: '#0F3C64',
              fontWeight: 700,
              '&:hover': { bgcolor: '#082540' }
            }}
          >
            Новый пациент
          </Button>
        </Box>
      </Box>

      {/* Main Patients DataGrid */}
      <Paper elevation={0} sx={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 2.5, overflow: 'hidden' }}>
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
