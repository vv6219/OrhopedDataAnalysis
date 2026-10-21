import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import { API_BASE_URL } from '../../config/apiConfig';

export interface FullPatientSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPatient: (patient: any) => void;
}

export default function FullPatientSearchModal({
  open,
  onClose,
  onSelectPatient
}: FullPatientSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const qParam = encodeURIComponent(query.trim());
      const res = await fetch(`${API_BASE_URL}/api/ortho/patients/search?q=${qParam}&limit=40`);
      if (!res.ok) throw new Error(`Ошибка поиска пациентов (HTTP ${res.status})`);
      const data = await res.json();
      if (data.success) {
        setPatients(data.patients || []);
      } else {
        throw new Error(data.error || 'Не удалось загрузить список пациентов');
      }
    } catch (err: any) {
      console.error('Error fetching patients list:', err);
      setError(err.message || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchPatients(searchTerm);
    }
  }, [open, fetchPatients]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    fetchPatients(val);
  };

  const handleClear = () => {
    setSearchTerm('');
    fetchPatients('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 45px rgba(15, 60, 100, 0.22)',
            minHeight: '580px',
            display: 'flex',
            flexDirection: 'column'
          }
        }
      }}
    >
      {/* Заголовок модального окна */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          background: 'linear-gradient(135deg, #0F3C64 0%, #1E293B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <PeopleAltIcon sx={{ color: '#38BDF8', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.2 }}>
              Картотека пациентов клиники
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.78rem' }}>
              Прямой выбор любого пациента для внепланового или повторного приема
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Поле живого поиска */}
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            size="medium"
            placeholder="Поиск по ФИО, номеру медкарты, телефону или ID..."
            value={searchTerm}
            onChange={handleSearchChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#0F3C64' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClear}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: {
                  borderRadius: 2.5,
                  bgcolor: '#F8FAFC',
                  '&:hover': { bgcolor: '#F1F5F9' },
                  fontSize: '0.95rem'
                }
              }
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Список пациентов в таблице */}
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            flex: 1,
            maxHeight: '380px',
            borderRadius: 2.5,
            borderColor: '#E2E8F0',
            overflow: 'auto'
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#F1F5F9', fontWeight: 700, color: '#334155', fontSize: '0.78rem' } }}>
                <TableCell width="90">№ Карты</TableCell>
                <TableCell>Пациент (ФИО)</TableCell>
                <TableCell width="110">Пол / Возраст</TableCell>
                <TableCell width="140">Телефон</TableCell>
                <TableCell width="120">ДМС</TableCell>
                <TableCell width="110">Последний визит</TableCell>
                <TableCell width="130" align="center">Действие</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} sx={{ color: '#0F3C64', mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      Поиск в базе данных пациентов клиники...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <PersonIcon sx={{ fontSize: 44, color: '#CBD5E1', mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#475569' }}>
                      {searchTerm ? 'Пациенты по запросу не найдены' : 'Введите запрос для поиска'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Попробуйте указать фамилию, телефон или номер амбулаторной карты
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((p) => {
                  const displayName = p.full_name || `${p.surname || ''} ${p.name || ''} ${p.patron || ''}`.trim() || 'Без имени';
                  const isMale = p.sex_display === 'М' || p.sex === 1;

                  return (
                    <TableRow
                      key={p.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(15, 60, 100, 0.04)' }
                      }}
                      onClick={() => onSelectPatient(p)}
                    >
                      <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BadgeIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
                          {p.mednum ? `#${p.mednum}` : `#${p.id}`}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A' }}>
                          {displayName}
                        </Typography>
                        {p.total_visits > 0 && (
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
                            Всего визитов в клинику: {p.total_visits}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={isMale ? 'М' : 'Ж'}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: isMale ? '#E0F2FE' : '#FCE7F3',
                              color: isMale ? '#0284C7' : '#DB2777'
                            }}
                          />
                          <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#334155' }}>
                            {p.age ? `${p.age} лет` : '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#334155' }}>
                            {p.sphone || p.phone || '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        {p.dms_insurer ? (
                          <Chip
                            label={p.dms_insurer}
                            size="small"
                            sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600 }}
                          />
                        ) : (
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            ОМС / Нал
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.78rem' }}>
                          {p.last_visit_date ? p.last_visit_date.slice(0, 10) : 'Первичный'}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(p);
                          }}
                          sx={{
                            textTransform: 'none',
                            bgcolor: '#0F3C64',
                            borderRadius: 2,
                            py: 0.4,
                            px: 1.2,
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            boxShadow: 'none',
                            '&:hover': { bgcolor: '#0284C7' }
                          }}
                        >
                          Выбрать
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Найдено записей: <strong>{patients.length}</strong> (показано до 40)
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            Подсказка: кликните по строке любого пациента для открытия его АРМ приема
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
        <Button onClick={onClose} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600 }}>
          Отмена
        </Button>
      </DialogActions>
    </Dialog>
  );
}
