import { useState, useEffect } from 'react';
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
  MenuItem
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
import BadgeIcon from '@mui/icons-material/Badge';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

interface StaffMember {
  id: number;
  full_name: string;
  role: string;
  specialization?: string;
  contact_phone?: string;
  email?: string;
  status?: string;
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
    <GridToolbarContainer sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 1 }}>
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

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Partial<StaffMember>>({
    full_name: '',
    role: 'Врач травматолог-ортопед',
    specialization: '',
    contact_phone: '',
    email: '',
    status: 'active'
  });

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // Notifications
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/staff');
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
      let url = 'http://localhost:5000/api/staff';
      let method = 'POST';

      if (isEditing && currentStaff.id) {
        url = `http://localhost:5000/api/staff/${currentStaff.id}`;
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
      const res = await fetch(`http://localhost:5000/api/staff/${staffToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSnackbarMessage(`Сотрудник ${staffToDelete.full_name} удален`);
        setDeleteConfirmOpen(false);
        setStaffToDelete(null);
        fetchStaff();
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
    if (r.includes('главный') || r.includes('врач') || r.includes('ортопед') || r.includes('хирург')) {
      return (
        <Chip
          label={role}
          size="small"
          sx={{
            bgcolor: 'rgba(15, 60, 100, 0.1)',
            color: '#0F3C64',
            fontWeight: 700,
            border: '1px solid rgba(15, 60, 100, 0.25)'
          }}
        />
      );
    }
    if (r.includes('медсестра') || r.includes('сестра') || r.includes('ассистент')) {
      return (
        <Chip
          label={role}
          size="small"
          sx={{
            bgcolor: 'rgba(49, 130, 206, 0.1)',
            color: '#2B6CB0',
            fontWeight: 700,
            border: '1px solid rgba(49, 130, 206, 0.25)'
          }}
        />
      );
    }
    return (
      <Chip
        label={role}
        size="small"
        sx={{
          bgcolor: 'rgba(128, 90, 213, 0.1)',
          color: '#6B46C1',
          fontWeight: 700,
          border: '1px solid rgba(128, 90, 213, 0.25)'
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
    { field: 'id', headerName: 'ID', width: 70, align: 'center', headerAlign: 'center' },
    {
      field: 'full_name',
      headerName: 'ФИО Сотрудника',
      flex: 1.4,
      minWidth: 220,
      filterOperators: customStringOperators,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: '100%' }}>
          <Avatar sx={{ bgcolor: '#0F3C64', width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700 }}>
            {getInitials(params.value)}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'role',
      headerName: 'Должность / Роль',
      flex: 1.2,
      minWidth: 200,
      filterOperators: customStringOperators,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {getRoleChip(params.value)}
        </Box>
      )
    },
    {
      field: 'specialization',
      headerName: 'Специализация / Направление',
      flex: 1.5,
      minWidth: 240,
      filterOperators: customStringOperators,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#4A5568', fontSize: '0.85rem' }}>
          {params.value || 'Общая практика'}
        </Typography>
      )
    },
    {
      field: 'contact_phone',
      headerName: 'Телефон',
      width: 170,
      filterOperators: customStringOperators,
      renderCell: (params) => params.value ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#2D3748' }}>
          <PhoneIcon sx={{ fontSize: 16, color: '#718096' }} />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ) : (
        <Typography variant="caption" sx={{ color: '#A0AEC0' }}>Н/Д</Typography>
      )
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 210,
      filterOperators: customStringOperators,
      renderCell: (params) => params.value ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#2D3748' }}>
          <EmailIcon sx={{ fontSize: 16, color: '#718096' }} />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ) : (
        <Typography variant="caption" sx={{ color: '#A0AEC0' }}>Н/Д</Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Статус',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const isActive = params.value === 'active' || !params.value;
        return (
          <Chip
            size="small"
            icon={<CheckCircleIcon style={{ color: isActive ? '#38A169' : '#CBD5E0', fontSize: 14 }} />}
            label={isActive ? 'Работает' : 'В отпуске'}
            sx={{
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 600,
              bgcolor: isActive ? '#F0FFF4' : '#EDF2F7',
              color: isActive ? '#22543D' : '#718096'
            }}
          />
        );
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Действия',
      width: 110,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Редактировать сотрудника">
              <EditIcon sx={{ color: '#0F3C64', fontSize: 18 }} />
            </Tooltip>
          }
          label="Edit"
          onClick={() => handleOpenEdit(params.row as StaffMember)}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Удалить из реестра">
              <DeleteIcon sx={{ color: '#E53E3E', fontSize: 18 }} />
            </Tooltip>
          }
          label="Delete"
          onClick={() => {
            setStaffToDelete(params.row as StaffMember);
            setDeleteConfirmOpen(true);
          }}
        />
      ]
    }
  ];

  return (
    <Box sx={{ width: '100%', minHeight: 'calc(100vh - 120px)', p: { xs: 1, md: 3 } }}>
      {/* Top Banner / Hero Card */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #0F3C64 0%, #156C9C 100%)',
          color: '#FFFFFF',
          borderRadius: 3,
          boxShadow: '0 8px 32px 0 rgba(15, 60, 100, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <BadgeIcon sx={{ fontSize: 32, color: '#63B3ED' }} />
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>
              Медицинский персонал и врачи
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 700 }}>
            Реестр врачей-ортопедов, хирургов, ассистирующих медсестер и администраторов Центра Ортопедии Добрушкина.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
            <Chip
              icon={<MedicalServicesIcon style={{ color: '#FFFFFF' }} />}
              label={`Всего сотрудников: ${staffList.length}`}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', fontWeight: 700 }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchStaff}
            sx={{
              color: '#FFFFFF',
              borderColor: 'rgba(255, 255, 255, 0.4)',
              '&:hover': { borderColor: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            Обновить
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#0F3C64',
              fontWeight: 800,
              px: 3,
              '&:hover': { bgcolor: '#F7FAFC' }
            }}
          >
            Добавить сотрудника
          </Button>
        </Box>
      </Paper>

      {/* Main Staff DataGrid */}
      <Paper sx={{ width: '100%', height: 650, borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <DataGrid
          rows={staffList}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
          }}
          slots={{
            toolbar: CustomStaffToolbar,
            footer: () => (
              <GridFooterContainer sx={{ p: 1, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ px: 2, display: 'flex', gap: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                    Всего в штате: {staffList.length} сотр.
                  </Typography>
                </Box>
                <GridPagination />
              </GridFooterContainer>
            )
          }}
          localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
          disableRowSelectionOnClick
          density="comfortable"
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#F1F5F9',
              fontWeight: 800,
              color: '#0F3C64',
              fontSize: '0.88rem'
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'rgba(15, 60, 100, 0.03)'
            }
          }}
        />
      </Paper>

      {/* Add / Edit Staff Modal Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1px solid #E2E8F0' }}>
          {isEditing ? 'Редактировать данные сотрудника' : 'Добавить нового сотрудника в штат'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
          <TextField
            label="ФИО сотрудника"
            placeholder="например: Добрушкин Владимир Иванович"
            fullWidth
            required
            value={currentStaff.full_name || ''}
            onChange={(e) => setCurrentStaff({ ...currentStaff, full_name: e.target.value })}
          />

          <FormControl fullWidth required>
            <InputLabel>Должность / Роль</InputLabel>
            <Select
              label="Должность / Роль"
              value={currentStaff.role || 'Врач травматолог-ортопед'}
              onChange={(e) => setCurrentStaff({ ...currentStaff, role: e.target.value })}
            >
              <MenuItem value="Главный врач, ортопед-травматолог">Главный врач, ортопед-травматолог</MenuItem>
              <MenuItem value="Врач травматолог-ортопед">Врач травматолог-ортопед</MenuItem>
              <MenuItem value="Врач-хирург">Врач-хирург</MenuItem>
              <MenuItem value="Врач-реабилитолог">Врач-реабилитолог</MenuItem>
              <MenuItem value="Старшая медицинская сестра">Старшая медицинская сестра</MenuItem>
              <MenuItem value="Ассистирующая медсестра">Ассистирующая медсестра</MenuItem>
              <MenuItem value="Медицинская сестра процедурного кабинета">Медицинская сестра процедурного кабинета</MenuItem>
              <MenuItem value="Администратор клиники">Администратор клиники</MenuItem>
              <MenuItem value="Менеджер">Менеджер</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Специализация и ключевые направления"
            placeholder="например: Артроскопия, внутрисуставные блокады, PRP"
            fullWidth
            value={currentStaff.specialization || ''}
            onChange={(e) => setCurrentStaff({ ...currentStaff, specialization: e.target.value })}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Контактный телефон"
              placeholder="+7 (988) 000-00-00"
              fullWidth
              value={currentStaff.contact_phone || ''}
              onChange={(e) => setCurrentStaff({ ...currentStaff, contact_phone: e.target.value })}
            />

            <TextField
              label="Email"
              placeholder="doctor@orthocenter.ru"
              fullWidth
              value={currentStaff.email || ''}
              onChange={(e) => setCurrentStaff({ ...currentStaff, email: e.target.value })}
            />
          </Box>

          <FormControl fullWidth>
            <InputLabel>Статус</InputLabel>
            <Select
              label="Статус"
              value={currentStaff.status || 'active'}
              onChange={(e) => setCurrentStaff({ ...currentStaff, status: e.target.value })}
            >
              <MenuItem value="active">Активен (Ведет прием)</MenuItem>
              <MenuItem value="vacation">В отпуске</MenuItem>
              <MenuItem value="inactive">Не активен</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Отмена
          </Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#0F3C64', fontWeight: 700 }}>
            {isEditing ? 'Сохранить изменения' : 'Добавить сотрудника'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800, color: '#E53E3E' }}>
          Подтверждение удаления
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Вы уверены, что хотите удалить сотрудника <b>{staffToDelete?.full_name}</b> ({staffToDelete?.role}) из реестра клиники?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Отмена
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Удалить сотрудника
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Snackbar */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
