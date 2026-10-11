import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Switch, FormControlLabel,
  MenuItem, Select, FormControl, InputLabel, Card, CardContent, Chip,
  Divider, IconButton, Tooltip, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Tab, Tabs, FormHelperText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/apiConfig';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import HistoryIcon from '@mui/icons-material/History';
import UsbIcon from '@mui/icons-material/Usb';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SecurityIcon from '@mui/icons-material/Security';

export interface FiscalSettingsProfile {
  id: number;
  profile_name: string;
  port: string;
  baud_rate: number;
  device_model: string;
  is_mock_mode: number;
  single_consumer_queue: number;
  execution_timeout_seconds: number;
  fn_number: string;
  kkt_reg_number: string;
  default_tax_type: number;
  tax_regime_name: string;
  payment_subject_type: number;
  payment_method_type: number;
  default_shift_number: number;
  base_fiscal_document_number: number;
  external_daemon_url: string;
  is_active: number;
  notes: string;
  updated_at: string;
  updated_by: string;
}

export interface AuditRecord {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  event_type: string;
  properties_json: string;
  properties?: any;
}

const COMMON_PORTS = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', '/dev/ttyUSB0'];
const BAUD_RATES = [9600, 19200, 38400, 57600, 115200];
const TAX_TYPES = [
  { value: 6, label: 'Без НДС (пп. 2 п. 2 ст. 149 НК РФ — медицинские услуги)' },
  { value: 1, label: 'НДС 20%' },
  { value: 2, label: 'НДС 10%' },
  { value: 4, label: 'НДС 0%' }
];
const SUBJECT_TYPES = [
  { value: 4, label: '4 — Услуга (медицинские и ортопедические процедуры)' },
  { value: 1, label: '1 — Товар (медикаменты, ортезы, расходные материалы)' }
];
const METHOD_TYPES = [
  { value: 4, label: '4 — Полный расчет (оплата при оказании услуги)' },
  { value: 1, label: '1 — Предоплата 100%' }
];

export default function FiscalSettings() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<FiscalSettingsProfile[]>([]);
  const [, setActiveProfileId] = useState<number | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<FiscalSettingsProfile | null>(null);
  const [formData, setFormData] = useState<Partial<FiscalSettingsProfile>>({});
  const [, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  // New Profile Dialog
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  // Delete Confirm Dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fiscal/settings`);
      if (res.ok) {
        const data: FiscalSettingsProfile[] = await res.json();
        setProfiles(data);
        const active = data.find(p => p.is_active === 1) || data[0];
        if (active) {
          setActiveProfileId(active.id);
          setSelectedProfile(prev => {
            const stillExists = data.find(p => p.id === prev?.id);
            const chosen = stillExists || active;
            setFormData(chosen);
            return chosen;
          });
        }
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: `Ошибка загрузки профилей: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fiscal/audit-logs?limit=30`);
      if (res.ok) {
        const data: AuditRecord[] = await res.json();
        const settingsLogs = data.filter(l => 
          l.event_type.startsWith('settings_') || 
          (l.message && l.message.includes('параметр'))
        );
        setAuditLogs(settingsLogs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchAuditLogs();
  }, []);

  const handleSelectProfile = (profile: FiscalSettingsProfile) => {
    setSelectedProfile(profile);
    setFormData(profile);
    setAlert(null);
  };

  const handleChange = (field: keyof FiscalSettingsProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!selectedProfile) return;
    setSaving(true);
    setAlert(null);

    try {
      const payload = {
        ...formData,
        updated_by: 'Администратор'
      };

      const res = await fetch(`${API_BASE_URL}/api/fiscal/settings/${selectedProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setAlert({
          type: 'success',
          message: `Параметры успешно сохранены в БД и зафиксированы в Serilog Audit! Изменено полей: ${data.changedFields?.length || 0} (${data.changedFields?.join(', ') || 'без изменений'})`
        });
        await fetchProfiles();
        await fetchAuditLogs();
      } else {
        setAlert({ type: 'error', message: data.error || 'Ошибка при сохранении' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (profileId: number) => {
    setSaving(true);
    setAlert(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fiscal/settings/${profileId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updated_by: 'Администратор' })
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', message: data.message });
        await fetchProfiles();
        await fetchAuditLogs();
      } else {
        setAlert({ type: 'error', message: data.error || 'Ошибка активации' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;
    setSaving(true);
    try {
      const base = selectedProfile || {
        port: 'COM3',
        baud_rate: 115200,
        device_model: 'АТОЛ 91Ф',
        is_mock_mode: 1,
        single_consumer_queue: 1,
        execution_timeout_seconds: 35,
        fn_number: '9960440301984210',
        kkt_reg_number: '0004928103049182',
        default_tax_type: 6,
        tax_regime_name: 'Без НДС (пп. 2 п. 2 ст. 149 НК РФ — медицинские услуги)',
        payment_subject_type: 4,
        payment_method_type: 4,
        default_shift_number: 14,
        base_fiscal_document_number: 1041,
        external_daemon_url: 'http://localhost:5050',
        notes: 'Новый профиль ККТ'
      };

      const payload = {
        ...base,
        profile_name: newProfileName.trim(),
        is_active: 0,
        updated_by: 'Администратор'
      };

      const res = await fetch(`${API_BASE_URL}/api/fiscal/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', message: `Профиль "${newProfileName}" успешно создан в БД` });
        setOpenNewDialog(false);
        setNewProfileName('');
        await fetchProfiles();
        await fetchAuditLogs();
      } else {
        setAlert({ type: 'error', message: data.error || 'Ошибка создания профиля' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfile) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fiscal/settings/${selectedProfile.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleted_by: 'Администратор' })
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'info', message: data.message });
        setOpenDeleteDialog(false);
        await fetchProfiles();
        await fetchAuditLogs();
      } else {
        setAlert({ type: 'error', message: data.error || 'Ошибка удаления профиля' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1300, mx: 'auto', p: { xs: 1, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PointOfSaleIcon sx={{ fontSize: 36, color: '#0F3C64' }} />
            Параметры фискального регистратора «АТОЛ 91Ф»
          </Typography>
          <Typography variant="body1" sx={{ color: '#718096', mt: 0.5 }}>
            Управление профилями ККТ в базе данных SQLite с горячим применением и сквозным аудитом Serilog (54-ФЗ)
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<PlayCircleFilledWhiteIcon />}
            onClick={() => navigate('/admin/fiscal-test-wizard')}
            sx={{ fontWeight: 700, borderColor: '#0F3C64', color: '#0F3C64' }}
          >
            Мастер тестов
          </Button>

          <Button
            variant="outlined"
            startIcon={<ReceiptLongIcon />}
            onClick={() => navigate('/fiscal-audit')}
            sx={{ fontWeight: 700, borderColor: '#2B6CB0', color: '#2B6CB0' }}
          >
            Журнал аудита
          </Button>

          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={() => { setNewProfileName(''); setOpenNewDialog(true); }}
            sx={{ bgcolor: '#0F3C64', fontWeight: 700 }}
          >
            Новый профиль
          </Button>

          <Tooltip title="Обновить профили">
            <IconButton onClick={() => { fetchProfiles(); fetchAuditLogs(); }} sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alert */}
      {alert && (
        <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Profiles Cards / Selector */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4A5568', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Профили оборудования в БД ({profiles.length})
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {profiles.map(p => {
            const isSelected = selectedProfile?.id === p.id;
            const isActive = p.is_active === 1;

            return (
              <Card
                key={p.id}
                onClick={() => handleSelectProfile(p)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 3,
                  border: isSelected ? '2px solid #0F3C64' : '1px solid #E2E8F0',
                  boxShadow: isSelected ? '0 4px 16px rgba(15, 60, 100, 0.12)' : 'none',
                  bgcolor: isSelected ? '#F0F7FF' : '#FFFFFF',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '1.05rem' }}>
                      {p.profile_name}
                    </Typography>
                    {isActive && (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                        label="АКТИВНЫЙ"
                        color="success"
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1 }}>
                    <Chip
                      icon={<UsbIcon sx={{ fontSize: '14px !important' }} />}
                      label={`${p.port} • ${p.baud_rate} бод`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                    />
                    <Chip
                      label={p.is_mock_mode ? '🟢 Режим Mock' : '🔴 Физический ККТ'}
                      size="small"
                      color={p.is_mock_mode ? 'primary' : 'warning'}
                      sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                    />
                  </Box>

                  <Typography variant="caption" sx={{ color: '#718096', display: 'block', mt: 1 }}>
                    ФН: {p.fn_number} • Таймаут: {p.execution_timeout_seconds}с
                  </Typography>

                  {!isActive && isSelected && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={(e) => { e.stopPropagation(); handleActivate(p.id); }}
                      sx={{ mt: 1.5, width: '100%', fontWeight: 700 }}
                    >
                      Сделать активным
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>

      {/* Tabs: Settings Form / Serilog History */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab icon={<UsbIcon />} iconPosition="start" label="Параметры оборудования и 54-ФЗ" sx={{ fontWeight: 700 }} />
          <Tab icon={<HistoryIcon />} iconPosition="start" label={`Журнал аудита параметров (${auditLogs.length})`} sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      {/* Tab 0: Parameters Editor */}
      {activeTab === 0 && selectedProfile && (
        <Paper sx={{ p: { xs: 2, md: 3.5 }, borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                Редактирование профиля: {formData.profile_name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#718096' }}>
                ID: {selectedProfile.id} • Изменено: {formData.updated_at || '—'} • Автор: {formData.updated_by || 'Администратор'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {selectedProfile.is_active === 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setOpenDeleteDialog(true)}
                  sx={{ fontWeight: 700 }}
                >
                  Удалить профиль
                </Button>
              )}

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{ bgcolor: '#0F3C64', px: 3, fontWeight: 700 }}
              >
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Section 1: Connection & Port */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <UsbIcon sx={{ color: '#0F3C64' }} />
            1. Параметры интерфейса и подключение к ККТ
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
            <TextField
              fullWidth
              label="Название профиля"
              value={formData.profile_name || ''}
              onChange={e => handleChange('profile_name', e.target.value)}
              helperText="Уникальное имя профиля для идентификации в системе"
            />
            <TextField
              fullWidth
              label="Модель ККТ"
              value={formData.device_model || ''}
              onChange={e => handleChange('device_model', e.target.value)}
              helperText="Поддерживаемое устройство (ДТО 10)"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 2.5 }}>
            <FormControl fullWidth>
              <InputLabel>COM-порт</InputLabel>
              <Select
                value={formData.port || 'COM3'}
                label="COM-порт"
                onChange={e => handleChange('port', e.target.value)}
              >
                {COMMON_PORTS.map(p => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
              <FormHelperText>Физический или виртуальный порт</FormHelperText>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Скорость (Baud Rate)</InputLabel>
              <Select
                value={formData.baud_rate || 115200}
                label="Скорость (Baud Rate)"
                onChange={e => handleChange('baud_rate', Number(e.target.value))}
              >
                {BAUD_RATES.map(b => (
                  <MenuItem key={b} value={b}>{b} бод</MenuItem>
                ))}
              </Select>
              <FormHelperText>Стандарт для АТОЛ 91Ф: 115200</FormHelperText>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Таймаут команды (сек)"
              value={formData.execution_timeout_seconds || 35}
              onChange={e => handleChange('execution_timeout_seconds', Number(e.target.value))}
              helperText="Лимит ожидания ответа ККТ (сек)"
            />

            <TextField
              fullWidth
              label="Внешний сервис (C# Daemon)"
              value={formData.external_daemon_url || 'http://localhost:5050'}
              onChange={e => handleChange('external_daemon_url', e.target.value)}
              helperText="URL демона прямого управления ДТО 10"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
            <Paper sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(formData.is_mock_mode)}
                    onChange={e => handleChange('is_mock_mode', e.target.checked ? 1 : 0)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#0F3C64' }}>
                      Режим программной эмуляции (Mock Mode)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Включен: операции чеков симулируются без физического обращения к порту ККТ.
                    </Typography>
                  </Box>
                }
              />
            </Paper>

            <Paper sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(formData.single_consumer_queue)}
                    onChange={e => handleChange('single_consumer_queue', e.target.checked ? 1 : 0)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#0F3C64' }}>
                      Однопоточная очередь (Single Consumer Queue)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Изолирует транзакции для предотвращения конфликтов параллельного доступа к COM-порту.
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Section 2: Fiscal Requirements & 54-FZ */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon sx={{ color: '#0F3C64' }} />
            2. Фискальные реквизиты и параметры налогообложения (54-ФЗ)
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
            <TextField
              fullWidth
              label="Заводской номер ФН (Тег 1041)"
              value={formData.fn_number || ''}
              onChange={e => handleChange('fn_number', e.target.value)}
              helperText="16-значный номер фискального накопителя"
            />
            <TextField
              fullWidth
              label="Регистрационный номер ККТ (РН ККТ)"
              value={formData.kkt_reg_number || ''}
              onChange={e => handleChange('kkt_reg_number', e.target.value)}
              helperText="16-значный регистрационный номер в ФНС"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
            <FormControl fullWidth>
              <InputLabel>Ставка НДС по умолчанию</InputLabel>
              <Select
                value={formData.default_tax_type ?? 6}
                label="Ставка НДС по умолчанию"
                onChange={e => handleChange('default_tax_type', Number(e.target.value))}
              >
                {TAX_TYPES.map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
              <FormHelperText>Для клиники применяется ставка 6 (Без НДС)</FormHelperText>
            </FormControl>

            <TextField
              fullWidth
              label="Наименование налогового режима"
              value={formData.tax_regime_name || ''}
              onChange={e => handleChange('tax_regime_name', e.target.value)}
              helperText="Основание освобождения от НДС в чеке"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
            <FormControl fullWidth>
              <InputLabel>Признак предмета расчета (Тег 1212)</InputLabel>
              <Select
                value={formData.payment_subject_type ?? 4}
                label="Признак предмета расчета (Тег 1212)"
                onChange={e => handleChange('payment_subject_type', Number(e.target.value))}
              >
                {SUBJECT_TYPES.map(s => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
              <FormHelperText>Тип реализуемой позиции по ФФД 1.2</FormHelperText>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Признак способа расчета (Тег 1214)</InputLabel>
              <Select
                value={formData.payment_method_type ?? 4}
                label="Признак способа расчета (Тег 1214)"
                onChange={e => handleChange('payment_method_type', Number(e.target.value))}
              >
                {METHOD_TYPES.map(m => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
              <FormHelperText>Порядок оплаты по ФФД 1.2</FormHelperText>
            </FormControl>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Номер смены по умолчанию"
              value={formData.default_shift_number ?? 14}
              onChange={e => handleChange('default_shift_number', Number(e.target.value))}
              helperText="Текущий номер фискальной смены"
            />

            <TextField
              fullWidth
              type="number"
              label="Базовый номер документа (ФД)"
              value={formData.base_fiscal_document_number ?? 1041}
              onChange={e => handleChange('base_fiscal_document_number', Number(e.target.value))}
              helperText="Начальный счетчик фискального документа"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Section 3: Notes */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', mb: 2 }}>
            3. Служебные примечания к профилю
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Примечания и описание конфигурации"
            value={formData.notes || ''}
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="Например: Основная касса на стойке ресепшн, подключенная через преобразователь USB-RS232"
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{ bgcolor: '#0F3C64', px: 4, py: 1.2, fontWeight: 700 }}
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения профиля в БД'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Tab 1: Serilog Audit Log History */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon sx={{ color: '#0F3C64' }} />
                История изменений параметров ККТ (Serilog Audit)
              </Typography>
              <Typography variant="caption" sx={{ color: '#718096' }}>
                Все действия по изменению портов, режимов Mock и фискальных реквизитов записываются в fiscal_audit_logs с фиксацией diff
              </Typography>
            </Box>

            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchAuditLogs}
              sx={{ fontWeight: 600 }}
            >
              Обновить
            </Button>
          </Box>

          {auditLogs.length === 0 ? (
            <Alert severity="info">Записи об изменении параметров ККТ пока отсутствуют.</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {auditLogs.map(log => {
                let diffInfo: any = null;
                try {
                  const props = typeof log.properties_json === 'string' ? JSON.parse(log.properties_json) : log.properties;
                  diffInfo = props?.diff || props;
                } catch {
                  diffInfo = null;
                }

                const isWarn = log.level === 'Warning' || log.level === 'Error';

                return (
                  <Paper
                    key={log.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid #E2E8F0',
                      bgcolor: isWarn ? '#FFFDF5' : '#FAFCFF',
                      borderLeft: `4px solid ${isWarn ? '#D69E2E' : '#2B6CB0'}`
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5, flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={log.level}
                          size="small"
                          color={isWarn ? 'warning' : 'primary'}
                          sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                        />
                        <Chip
                          label={log.event_type}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2D3748' }}>
                          {log.message}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>
                        {log.timestamp}
                      </Typography>
                    </Box>

                    {diffInfo && typeof diffInfo === 'object' && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px dashed #CBD5E0', fontSize: '0.78rem' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#4A5568', display: 'block', mb: 0.5 }}>
                          Детализация измененных параметров (Serilog diff):
                        </Typography>
                        <Box component="pre" sx={{ m: 0, fontSize: '0.75rem', fontFamily: 'monospace', color: '#2D3748', whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(diffInfo, null, 2)}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </Paper>
      )}

      {/* Dialog: Create New Profile */}
      <Dialog open={openNewDialog} onClose={() => setOpenNewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64' }}>
          Создание нового профиля ККТ
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#718096', mb: 2 }}>
            Новый профиль будет создан на основе текущих настроек и сохранен в таблице fiscal_device_settings.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Название нового профиля"
            value={newProfileName}
            onChange={e => setNewProfileName(e.target.value)}
            placeholder="Например: Резервная касса (COM4)"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenNewDialog(false)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={handleCreateProfile}
            disabled={!newProfileName.trim() || saving}
            sx={{ bgcolor: '#0F3C64', fontWeight: 700 }}
          >
            Создать профиль
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Delete Confirmation */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 800, color: '#E53E3E' }}>
          Удаление профиля ККТ
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Вы уверены, что хотите удалить профиль <strong>"{selectedProfile?.profile_name}"</strong>?
          </Typography>
          <Typography variant="caption" sx={{ color: '#718096', mt: 1, display: 'block' }}>
            Это действие будет зафиксировано в журнале Serilog Audit.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)}>Отмена</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteProfile}
            disabled={saving}
            sx={{ fontWeight: 700 }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
