import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import { API_BASE_URL } from '../../config/apiConfig';

interface Scheme {
  id: number;
  scheme_name: string;
  description: string;
  default_rate_percent: number;
  revenue_basis_policy: string;
  max_brigade_pct_cap: number;
  is_active: number;
  assigned_staff_count?: number;
}

interface StaffSetting {
  staff_id: number;
  full_name: string;
  role: string;
  scheme_id: number | null;
  scheme_name: string | null;
  scheme_default_rate: number | null;
  tax_rate_percent: number;
  fixed_base_salary: number;
  payout_account_info: string;
}

interface OperationRateRow {
  operation_id: number;
  operation_name: string;
  operation_price: number;
  rate_id?: number;
  role_in_procedure?: string;
  effective_percent: number;
  custom_percent: number | null;
  fixed_min_payout: number;
  fixed_bonus: number;
  rate_notes?: string;
}

export function PayoutSchemeEditor() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [staffSettings, setStaffSettings] = useState<StaffSetting[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number>(2); // Default to doctor Dobrouchkin
  const [rates, setRates] = useState<OperationRateRow[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [savingRates, setSavingRates] = useState(false);
  const [searchOp, setSearchOp] = useState('');

  // Scheme Dialog
  const [schemeDialogOpen, setSchemeDialogOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Partial<Scheme>>({
    scheme_name: '',
    description: '',
    default_rate_percent: 30.0,
    revenue_basis_policy: 'from_actual_billed',
    max_brigade_pct_cap: 60.0
  });

  const [notification, setNotification] = useState<string | null>(null);

  // Bulk min payout state
  const [bulkMinVal, setBulkMinVal] = useState<number>(100);
  const [applyingBulk, setApplyingBulk] = useState<boolean>(false);

  const handleApplyBulkMinToCurrent = () => {
    setRates(prev => prev.map(r => ({ ...r, fixed_min_payout: bulkMinVal })));
    setNotification(`Фикс-минимум ${bulkMinVal} ₽ установлен для всех сервисов текущего сотрудника (нажмите «Сохранить ставки» для фиксации в БД)`);
  };

  const handleApplyBulkMinToAllStaff = async () => {
    if (!confirm(`Установить гарантированный фикс-минимум ${bulkMinVal} ₽ абсолютно для всех сотрудников и сервисов клиники?`)) return;
    setApplyingBulk(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/staff-rates/bulk-set-min`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ min_value: bulkMinVal, apply_to_all_staff: true })
      });
      if (res.ok) {
        setNotification(`Успешно установлен фикс-минимум ${bulkMinVal} ₽ для всех специалистов клиники!`);
        if (selectedStaffId) {
          fetchRates(selectedStaffId);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Ошибка: ' + (err.error || res.statusText));
      }
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    } finally {
      setApplyingBulk(false);
    }
  };

  const fetchData = async () => {
    try {
      const [schRes, stfRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/payouts/schemes`),
        fetch(`${API_BASE_URL}/api/payouts/staff-settings`)
      ]);
      if (schRes.ok) {
        const schData = await schRes.json();
        setSchemes(schData.schemes || []);
      }
      if (stfRes.ok) {
        const stfData = await stfRes.json();
        setStaffSettings(stfData.staffSettings || []);
      }
    } catch (err) {
      console.error('Failed to load schemes or staff', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchRates = async (staffId: number) => {
    setLoadingRates(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/staff-rates/${staffId}`);
      if (res.ok) {
        const data = await res.json();
        setRates(data.rates || []);
      }
    } catch (err) {
      console.error('Failed to load rates for staff', err);
    } finally {
      setLoadingRates(false);
    }
  };

  useEffect(() => {
    if (selectedStaffId) {
      fetchRates(selectedStaffId);
    }
  }, [selectedStaffId]);

  const handleRateChange = (opId: number, field: string, val: any) => {
    setRates(prev => prev.map(r => {
      if (r.operation_id === opId) {
        return { ...r, [field]: val };
      }
      return r;
    }));
  };

  const handleSaveRates = async () => {
    setSavingRates(true);
    try {
      const payload = rates.map(r => ({
        operation_id: r.operation_id,
        role_in_procedure: r.role_in_procedure || 'primary_doctor',
        payout_percent: r.custom_percent !== null && r.custom_percent !== undefined ? Number(r.custom_percent) : r.effective_percent,
        fixed_min_payout: Number(r.fixed_min_payout || 0),
        fixed_bonus: Number(r.fixed_bonus || 0),
        notes: r.rate_notes || ''
      }));

      const res = await fetch(`${API_BASE_URL}/api/payouts/staff-rates/${selectedStaffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: payload })
      });

      if (res.ok) {
        setNotification('Индивидуальные ставки сотрудника успешно сохранены!');
        fetchRates(selectedStaffId);
      } else {
        alert('Ошибка при сохранении ставок');
      }
    } catch (err: any) {
      alert('Ошибка соединения: ' + err.message);
    } finally {
      setSavingRates(false);
    }
  };

  const handleSaveScheme = async () => {
    try {
      const method = editingScheme.id ? 'PUT' : 'POST';
      const url = editingScheme.id ? `${API_BASE_URL}/api/payouts/schemes/${editingScheme.id}` : `${API_BASE_URL}/api/payouts/schemes`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingScheme)
      });

      if (res.ok) {
        setSchemeDialogOpen(false);
        setNotification('Схема начисления успешно сохранена!');
        fetchData();
      } else {
        const err = await res.json();
        alert('Ошибка: ' + (err.error || 'Ошибка сохранения'));
      }
    } catch (err: any) {
      alert('Ошибка соединения: ' + err.message);
    }
  };

  const filteredRates = rates.filter(r =>
    r.operation_name.toLowerCase().includes(searchOp.toLowerCase())
  );

  const selectedStaff = staffSettings.find(s => s.staff_id === selectedStaffId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. SCHEMES CATALOG */}
      <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Типовые схемы выплат клиники
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Шаблоны правил начисления вознаграждения для врачей, ассистентов и медсестер
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingScheme({
                  scheme_name: '',
                  description: '',
                  default_rate_percent: 30.0,
                  revenue_basis_policy: 'from_actual_billed',
                  max_brigade_pct_cap: 60.0
                });
                setSchemeDialogOpen(true);
              }}
              sx={{ bgcolor: '#0F3C64' }}
            >
              Новая схема
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {schemes.map(sch => (
              <Paper
                key={sch.id}
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #0F3C64', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      {sch.scheme_name}
                    </Typography>
                    <IconButton size="small" onClick={() => { setEditingScheme(sch); setSchemeDialogOpen(true); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                    {sch.description || 'Без описания'}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#156C9C' }}>
                    Базовая ставка: {sch.default_rate_percent}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Врачей: <strong>{sch.assigned_staff_count || 0}</strong>
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* 2. CUSTOM OPERATION RATES PER EMPLOYEE */}
      <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Персональные ставки сотрудника по сервисам
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Индивидуальное переопределение процента от маржинального дохода и гарантированного минимума
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ width: 280 }}>
                <InputLabel id="select-staff-label">Сотрудник</InputLabel>
                <Select
                  labelId="select-staff-label"
                  label="Сотрудник"
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(Number(e.target.value))}
                >
                  {staffSettings.map(st => (
                    <MenuItem key={st.staff_id} value={st.staff_id}>
                      {st.full_name} ({st.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                placeholder="Поиск сервиса..."
                value={searchOp}
                onChange={e => setSearchOp(e.target.value)}
                sx={{ width: 180 }}
              />

              {/* Bulk Min Payout Setting */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, bgcolor: '#F1F5F9', p: 0.5, px: 1, borderRadius: 2, border: '1px solid #CBD5E1' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                  Фикс-мин:
                </Typography>
                <TextField
                  size="small"
                  type="number"
                  value={bulkMinVal}
                  onChange={e => setBulkMinVal(Number(e.target.value))}
                  sx={{ width: 80, bgcolor: '#FFFFFF', '& input': { textAlign: 'center', p: 0.5, fontWeight: 700 } }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>₽</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleApplyBulkMinToCurrent}
                  sx={{ fontSize: '0.72rem', py: 0.3, px: 0.8, textTransform: 'none', fontWeight: 600 }}
                  title="Установить это значение для всех 162 сервисов текущего специалиста"
                >
                  Текущему
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={applyingBulk}
                  onClick={handleApplyBulkMinToAllStaff}
                  sx={{ fontSize: '0.72rem', py: 0.3, px: 0.8, textTransform: 'none', fontWeight: 700, bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' } }}
                  title="Записать значение 100 ₽ в базу данных сразу для всех сотрудников и сервисов клиники"
                >
                  {applyingBulk ? '...' : 'Всем (Клиника)'}
                </Button>
              </Box>

              <Button
                variant="contained"
                startIcon={savingRates ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={savingRates || loadingRates}
                onClick={handleSaveRates}
                sx={{ bgcolor: '#0F3C64', fontWeight: 600 }}
              >
                Сохранить ставки
              </Button>
            </Box>
          </Box>

          {selectedStaff && (
            <Alert severity="info" sx={{ mb: 2, py: 0.5, borderRadius: 2 }}>
              Назначенная схема: <strong>{selectedStaff.scheme_name || 'Не назначена'}</strong> (базовый процент схемы: {selectedStaff.scheme_default_rate || 20}%). Гарантированный минимум по умолчанию: <strong>100 ₽</strong>.
            </Alert>
          )}

          {loadingRates ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#0F3C64' }} />
            </Box>
          ) : (
            <Box sx={{ maxHeight: 460, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Table stickyHeader size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: '6%' }}>Код</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '38%' }}>Сервис</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, width: '12%' }}>Прейскурант</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, width: '14%' }}>Действующий %</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, width: '14%' }}>Персональный %</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, width: '16%' }}>Гарант. минимум (₽)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRates.map(row => (
                    <TableRow key={row.operation_id} hover>
                      <TableCell>{row.operation_id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.operation_name}</TableCell>
                      <TableCell align="right">{row.operation_price?.toLocaleString('ru-RU')} ₽</TableCell>
                      <TableCell align="center">
                        <strong>{row.custom_percent !== null && row.custom_percent !== undefined ? row.custom_percent : row.effective_percent}%</strong>
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          value={row.custom_percent !== null && row.custom_percent !== undefined ? row.custom_percent : ''}
                          placeholder={String(row.effective_percent)}
                          onChange={e => handleRateChange(row.operation_id, 'custom_percent', e.target.value === '' ? null : Number(e.target.value))}
                          sx={{ width: 90, '& input': { textAlign: 'center', p: 0.8 } }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          value={row.fixed_min_payout !== undefined && row.fixed_min_payout !== null ? row.fixed_min_payout : 100}
                          placeholder="100"
                          onChange={e => handleRateChange(row.operation_id, 'fixed_min_payout', e.target.value === '' ? 0 : Number(e.target.value))}
                          sx={{ width: 110, '& input': { textAlign: 'center', p: 0.8, fontWeight: 600 } }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* SCHEME CREATE/EDIT DIALOG */}
      <Dialog open={schemeDialogOpen} onClose={() => setSchemeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F3C64' }}>
          {editingScheme.id ? 'Редактирование схемы выплат' : 'Создание новой схемы выплат'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <TextField
            label="Название схемы"
            fullWidth
            required
            value={editingScheme.scheme_name || ''}
            onChange={e => setEditingScheme(prev => ({ ...prev, scheme_name: e.target.value }))}
          />
          <TextField
            label="Описание условий и правил"
            multiline
            rows={2}
            fullWidth
            value={editingScheme.description || ''}
            onChange={e => setEditingScheme(prev => ({ ...prev, description: e.target.value }))}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Базовый процент по умолчанию (%)"
              type="number"
              fullWidth
              value={editingScheme.default_rate_percent || 20}
              onChange={e => setEditingScheme(prev => ({ ...prev, default_rate_percent: Number(e.target.value) }))}
            />
            <TextField
              label="Макс. доля бригады (Cap %)"
              type="number"
              fullWidth
              value={editingScheme.max_brigade_pct_cap || 60}
              onChange={e => setEditingScheme(prev => ({ ...prev, max_brigade_pct_cap: Number(e.target.value) }))}
            />
          </Box>
          <FormControl fullWidth>
            <InputLabel id="basis-policy-label">Политика расчетной выручки</InputLabel>
            <Select
              labelId="basis-policy-label"
              label="Политика расчетной выручки"
              value={editingScheme.revenue_basis_policy || 'from_actual_billed'}
              onChange={e => setEditingScheme(prev => ({ ...prev, revenue_basis_policy: e.target.value }))}
            >
              <MenuItem value="from_actual_billed">Фактический чек пациента (с учетом скидок и ДМС)</MenuItem>
              <MenuItem value="from_catalog_price">Базовый прейскурант клиники (клиника компенсирует скидку)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSchemeDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveScheme} sx={{ bgcolor: '#0F3C64' }}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        message={notification}
      />
    </Box>
  );
}
