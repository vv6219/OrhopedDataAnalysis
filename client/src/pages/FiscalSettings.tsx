import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Switch, FormControlLabel,
  MenuItem, Select, FormControl, InputLabel, Card, CardContent, Chip,
  Divider, IconButton, Tooltip, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Tab, Tabs, FormHelperText, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/apiConfig';
import FiscalDeviceCard from '../components/FiscalDeviceCard';
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
import BusinessIcon from '@mui/icons-material/Business';
import SpeedIcon from '@mui/icons-material/Speed';
import ErrorIcon from '@mui/icons-material/Error';
import { useFiscal } from '../context/FiscalContext';
import type { ConnectionTestResult } from '../components/FiscalDeviceCard';

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
  org_name?: string;
  clinic_subname?: string;
  org_address?: string;
  org_inn?: string;
  org_ogrnip?: string;
  fns_site?: string;
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
const TAX_PRESETS = [
  { value: 6, label: '6: Без НДС (мед. услуги)', regime: 'Без НДС (пп. 2 п. 2 ст. 149 НК РФ — медицинские услуги)' },
  { value: 1, label: '1: НДС 20%', regime: 'Основная система налогообложения (НДС 20% по ст. 164 НК РФ)' },
  { value: 2, label: '2: НДС 10%', regime: 'Льготный НДС 10% (ст. 164 НК РФ)' },
  { value: 4, label: '4: НДС 0%', regime: 'Ставка НДС 0% (ст. 164 НК РФ)' },
  { value: 3, label: '3: Расчетный 20/120', regime: 'Расчетная ставка НДС 20/120' },
  { value: 5, label: '5: Расчетный 10/110', regime: 'Расчетная ставка НДС 10/110' },
  { value: 7, label: '7: НДС 5% (УСН 2025)', regime: 'Специальный налоговый режим УСН (НДС 5% по ст. 164 НК РФ)' },
  { value: 8, label: '8: НДС 7% (УСН 2025)', regime: 'Специальный налоговый режим УСН (НДС 7% по ст. 164 НК РФ)' }
];

function getTaxDescription(taxCode: number | string | undefined): { title: string; isStandard: boolean } {
  if (taxCode === undefined || taxCode === null || taxCode === '') {
    return { title: 'Ставка не указана', isStandard: false };
  }
  const num = Number(taxCode);
  if (isNaN(num)) return { title: 'Некорректное число', isStandard: false };
  const found = TAX_PRESETS.find(p => p.value === num);
  if (found) return { title: `Стандарт ДТО 10: ${found.label}`, isStandard: true };
  return { title: `Пользовательский код ставки ДТО 10: ${num}`, isStandard: false };
}
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
  const {
    fiscalStatus,
    activeProfile: globalActiveProfile,
    setMockMode: setGlobalMockMode,
    activateProfile: activateGlobalProfile,
    testConnection: testGlobalConnection
  } = useFiscal();

  const [profiles, setProfiles] = useState<FiscalSettingsProfile[]>([]);
  const [, setActiveProfileId] = useState<number | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<FiscalSettingsProfile | null>(null);
  const [formData, setFormData] = useState<Partial<FiscalSettingsProfile>>({});
  const [, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  // Connection Test & Mode Switch State for Profile Cards
  const [testingProfileId, setTestingProfileId] = useState<number | null>(null);
  const [switchingProfileId, setSwitchingProfileId] = useState<number | null>(null);
  const [connectionTestDialogOpen, setConnectionTestDialogOpen] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<ConnectionTestResult | null>(null);

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

  // Sync selectedProfile and formData with globalActiveProfile when it updates
  useEffect(() => {
    if (globalActiveProfile && selectedProfile && selectedProfile.id === globalActiveProfile.id) {
      if (selectedProfile.is_mock_mode !== globalActiveProfile.is_mock_mode) {
        setSelectedProfile(prev => prev ? ({ ...prev, is_mock_mode: globalActiveProfile.is_mock_mode }) : null);
        setFormData(prev => ({ ...prev, is_mock_mode: globalActiveProfile.is_mock_mode }));
      }
    }
  }, [globalActiveProfile]);

  // Sync selectedProfile and formData with fiscalStatus when the active profile mode changes
  useEffect(() => {
    if (fiscalStatus && selectedProfile && selectedProfile.is_active === 1) {
      const mockVal = fiscalStatus.isMockMode ? 1 : 0;
      if (selectedProfile.is_mock_mode !== mockVal) {
        setSelectedProfile(prev => prev ? ({ ...prev, is_mock_mode: mockVal }) : null);
        setFormData(prev => ({ ...prev, is_mock_mode: mockVal }));
      }
    }
  }, [fiscalStatus]);

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

  const taxVal = formData.default_tax_type;
  const isTaxValid = useMemo(() => {
    if (taxVal === undefined || taxVal === null || String(taxVal).trim() === '') return false;
    const num = Number(taxVal);
    return Number.isInteger(num) && num >= 0 && num <= 99;
  }, [taxVal]);

  const taxError = useMemo(() => {
    if (taxVal === undefined || taxVal === null || String(taxVal).trim() === '') return 'Укажите код ставки НДС';
    const num = Number(taxVal);
    if (isNaN(num)) return 'Код ставки должен быть числом';
    if (!Number.isInteger(num)) return 'Код ставки должен быть целым числом';
    if (num < 0 || num > 99) return 'Код ставки должен быть в диапазоне от 0 до 99';
    return null;
  }, [taxVal]);

  const handleSave = async () => {
    if (!selectedProfile) return;
    if (!isTaxValid) {
      setAlert({ type: 'error', message: `Ошибка валидации: ${taxError || 'Ставка НДС должна быть целым числом от 0 до 99'}` });
      return;
    }
    setSaving(true);
    setAlert(null);

    try {
      const payload = {
        ...formData,
        default_tax_type: Math.floor(Number(formData.default_tax_type)),
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
      const data = await activateGlobalProfile(profileId, 'Администратор');
      if (data.success) {
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

  const handleToggleProfileMockMode = async (profile: FiscalSettingsProfile, newIsMockMode: boolean) => {
    setSwitchingProfileId(profile.id);
    setAlert(null);
    try {
      const res = await setGlobalMockMode(newIsMockMode, profile.id, 'Администратор (Профили оборудования)');
      if (res.success) {
        setAlert({
          type: 'success',
          message: `Режим профиля «${profile.profile_name}» переключен: ${newIsMockMode ? '🟢 Эмулятор ККТ (Mock)' : '🔴 Реальное подключение (COM)'}`
        });
        await fetchProfiles();
        await fetchAuditLogs();
      } else {
        setAlert({ type: 'error', message: res.error || 'Ошибка смены режима профиля' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSwitchingProfileId(null);
    }
  };

  const handleTestConnectionForProfile = async (profile: FiscalSettingsProfile) => {
    setTestingProfileId(profile.id);
    setConnectionTestDialogOpen(true);
    setConnectionTestResult(null);
    try {
      const result = await testGlobalConnection(profile.id);
      setConnectionTestResult(result);
      await fetchProfiles();
    } catch (err: any) {
      setConnectionTestResult({
        success: false,
        isMockMode: Boolean(profile.is_mock_mode),
        modeLabel: profile.is_mock_mode ? 'Эмулятор ККТ (Mock)' : 'Реальное оборудование (COM-порт)',
        deviceModel: profile.device_model || 'АТОЛ 91Ф',
        port: profile.port || 'COM3',
        baudRate: profile.baud_rate || 115200,
        latencyMs: 0,
        message: `Ошибка проверки связи: ${err.message}`,
        error: err.message
      });
    } finally {
      setTestingProfileId(null);
    }
  };

  const handleSwitchToMockFromDialog = async () => {
    if (!connectionTestResult) return;
    const targetId = testingProfileId || globalActiveProfile?.id || selectedProfile?.id;
    if (!targetId) return;
    const target = profiles.find(p => p.id === targetId);
    if (target) {
      await handleToggleProfileMockMode(target, true);
      await handleTestConnectionForProfile({ ...target, is_mock_mode: 1 });
    }
  };

  const handleToggleFormMockMode = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIsMockMode = event.target.checked;
    const newMockVal = newIsMockMode ? 1 : 0;

    // 1. Update local form data and selected profile immediately
    setFormData(prev => ({ ...prev, is_mock_mode: newMockVal }));
    if (selectedProfile) {
      setSelectedProfile(prev => prev ? ({ ...prev, is_mock_mode: newMockVal }) : null);
      setProfiles(prev => prev.map(p => p.id === selectedProfile.id ? { ...p, is_mock_mode: newMockVal } : p));

      // 2. Persist to DB and sync with Global State
      setSwitchingProfileId(selectedProfile.id);
      try {
        const res = await setGlobalMockMode(newIsMockMode, selectedProfile.id, 'Администратор (Параметры ККТ - Режим Mock)');
        if (res.success) {
          setAlert({
            type: 'success',
            message: `Режим профиля «${selectedProfile.profile_name}» переключен: ${newIsMockMode ? '🟢 Эмулятор ККТ (Mock)' : '🔴 Реальное подключение (COM)'}. Синхронизировано с БД и глобальным стейтом!`
          });
          await fetchProfiles();
          await fetchAuditLogs();
        } else {
          setAlert({ type: 'error', message: res.error || 'Ошибка изменения режима' });
        }
      } catch (err: any) {
        setAlert({ type: 'error', message: `Ошибка синхронизации: ${err.message}` });
      } finally {
        setSwitchingProfileId(null);
      }
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
        org_name: 'ИЧП Добрушкин А.М.',
        clinic_subname: 'Центр Ортопедии и Травматологии',
        org_address: 'г. Сочи, ул. Транспортная 65',
        org_inn: '450107060083',
        org_ogrnip: '323237500208220',
        fns_site: 'www.nalog.gov.ru',
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

      {/* Фискализация на ККТ «АТОЛ 91Ф» (54-ФЗ) Card with Mode Switch & Connection Test */}
      <FiscalDeviceCard
        onStatusChange={() => fetchProfiles()}
        showNavigationButtons={false}
        sx={{ mb: 3 }}
      />

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
                    {isActive ? (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                        label="АКТИВНЫЙ"
                        color="success"
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                      />
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                        onClick={(e) => { e.stopPropagation(); handleActivate(p.id); }}
                        sx={{ fontSize: '0.72rem', fontWeight: 700, py: 0.2, px: 1, minHeight: 'auto', borderRadius: 1.5 }}
                      >
                        Сделать активным
                      </Button>
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

                  {/* Mode Switch & Connection Test Box (Same style as Wizard / FiscalDeviceCard) */}
                  <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      p: 1.5,
                      mt: 1.5,
                      borderRadius: 2,
                      bgcolor: p.is_mock_mode ? '#F8FAFC' : '#FEF3C7',
                      border: '1px solid',
                      borderColor: p.is_mock_mode ? '#CBD5E1' : '#F59E0B',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Tooltip title="Переключение режима фискализации для данного профиля: виртуальный Mock-драйвер или физический порт">
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={!p.is_mock_mode}
                              onChange={(e) => handleToggleProfileMockMode(p, !e.target.checked)}
                              disabled={switchingProfileId === p.id}
                              color="warning"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  color: !p.is_mock_mode ? '#B45309' : '#0F3C64',
                                  lineHeight: 1.2
                                }}
                              >
                                {!p.is_mock_mode ? 'Реальное подключение (COM)' : 'Эмулятор ККТ (Mock)'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                                {!p.is_mock_mode ? `Физический порт ${p.port}` : 'Виртуальный драйвер 54-ФЗ'}
                              </Typography>
                            </Box>
                          }
                          sx={{ m: 0 }}
                        />
                      </Tooltip>
                      {switchingProfileId === p.id && <CircularProgress size={14} />}
                    </Box>

                    <Button
                      size="small"
                      variant={!p.is_mock_mode ? 'contained' : 'outlined'}
                      color={!p.is_mock_mode ? 'warning' : 'primary'}
                      fullWidth
                      startIcon={testingProfileId === p.id ? <CircularProgress size={14} color="inherit" /> : <UsbIcon sx={{ fontSize: 16 }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestConnectionForProfile(p);
                      }}
                      disabled={testingProfileId === p.id || switchingProfileId === p.id}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        textTransform: 'none',
                        borderRadius: 1.5,
                        py: 0.6
                      }}
                    >
                      {testingProfileId === p.id ? 'Проверка связи...' : 'Проверить связь'}
                    </Button>
                  </Box>

                  <Typography variant="caption" sx={{ color: '#718096', display: 'block', mt: 1.5 }}>
                    ФН: {p.fn_number} • Таймаут: {p.execution_timeout_seconds}с
                  </Typography>
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
            <Paper
              sx={{
                p: 2,
                bgcolor: formData.is_mock_mode ? '#F0FDF4' : '#FFFBEB',
                border: '1px solid',
                borderColor: formData.is_mock_mode ? '#86EFAC' : '#FDE68A',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(formData.is_mock_mode)}
                      onChange={handleToggleFormMockMode}
                      disabled={switchingProfileId === selectedProfile?.id}
                      color={formData.is_mock_mode ? 'primary' : 'warning'}
                    />
                  }
                  label={
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: formData.is_mock_mode ? '#166534' : '#92400E' }}>
                          Режим программной эмуляции (Mock Mode)
                        </Typography>
                        {switchingProfileId === selectedProfile?.id && <CircularProgress size={14} />}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                        {formData.is_mock_mode
                          ? `🟢 Включен (Mock): операции чеков симулируются виртуальным драйвером 54-ФЗ без обращения к порту ККТ.`
                          : `🔴 Выключен (COM): операции чеков отправляются на физический кассовый аппарат на порту ${formData.port || 'COM3'} (${formData.baud_rate || 115200} бод).`}
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, flex: 1 }}
                />

                <Chip
                  label={formData.is_mock_mode ? '🟢 Mock Mode' : '🔴 Реальный COM'}
                  size="small"
                  color={formData.is_mock_mode ? 'success' : 'warning'}
                  sx={{ fontWeight: 700, fontSize: '0.72rem', ml: 1 }}
                />
              </Box>

              <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.72rem' }}>
                  <CheckCircleIcon sx={{ fontSize: 13, color: '#16A34A' }} />
                  Синхронизировано с БД ({selectedProfile?.profile_name || 'Профиль'}) и Глобальным стейтом
                </Typography>
                {selectedProfile && (
                  <Button
                    size="small"
                    variant="text"
                    color={formData.is_mock_mode ? 'primary' : 'warning'}
                    startIcon={testingProfileId === selectedProfile.id ? <CircularProgress size={12} /> : <UsbIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleTestConnectionForProfile(selectedProfile)}
                    disabled={testingProfileId === selectedProfile.id || switchingProfileId === selectedProfile.id}
                    sx={{ fontSize: '0.72rem', fontWeight: 700, p: 0, minWidth: 'auto', textTransform: 'none' }}
                  >
                    Проверить связь
                  </Button>
                )}
              </Box>
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
            <Box>
              <TextField
                fullWidth
                type="number"
                label="Ставка НДС (Код ДТО 10 / ФФД 1.2)"
                value={formData.default_tax_type ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  handleChange('default_tax_type', val);
                }}
                error={Boolean(taxError)}
                helperText={taxError || getTaxDescription(formData.default_tax_type).title}
                slotProps={{
                  htmlInput: { min: 0, max: 99, step: 1 }
                }}
              />

              {/* Quick Preset Chips */}
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 1, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#718096', fontWeight: 700 }}>
                  Стандартные пресеты:
                </Typography>
                {TAX_PRESETS.map(preset => {
                  const isSelected = Number(formData.default_tax_type) === preset.value;
                  return (
                    <Chip
                      key={preset.value}
                      size="small"
                      label={preset.label}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      onClick={() => {
                        handleChange('default_tax_type', preset.value);
                        if (!formData.tax_regime_name || formData.tax_regime_name.includes('НДС')) {
                          handleChange('tax_regime_name', preset.regime);
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: isSelected ? 800 : 500,
                        fontSize: '0.72rem',
                        '&:hover': { bgcolor: isSelected ? undefined : '#EDF2F7' }
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Наименование налогового режима"
              value={formData.tax_regime_name || ''}
              onChange={e => handleChange('tax_regime_name', e.target.value)}
              helperText="Основание освобождения или применение ставки в чеке"
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

          {/* Section 3: Organization & Receipt Slip Details */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon sx={{ color: '#0F3C64' }} />
            3. Реквизиты организации и печатного чека (54-ФЗ)
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
            <TextField
              fullWidth
              label="Наименование организации / ИП (Тег 1048)"
              value={formData.org_name || ''}
              onChange={e => handleChange('org_name', e.target.value)}
              helperText="Официальное наименование налогоплательщика, например: ИЧП Добрушкин А.М."
            />
            <TextField
              fullWidth
              label="Подзаголовок / Название клиники"
              value={formData.clinic_subname || ''}
              onChange={e => handleChange('clinic_subname', e.target.value)}
              helperText="Торговое обозначение медицинского центра на чеке"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
            <TextField
              fullWidth
              label="Адрес места расчетов (Тег 1009)"
              value={formData.org_address || ''}
              onChange={e => handleChange('org_address', e.target.value)}
              helperText="Адрес установки ККТ и оказания медицинских услуг"
            />
            <TextField
              fullWidth
              label="ИНН (Тег 1018)"
              value={formData.org_inn || ''}
              onChange={e => handleChange('org_inn', e.target.value)}
              helperText="ИНН пользователя ККТ"
            />
            <TextField
              fullWidth
              label="ОГРНИП / ОГРН"
              value={formData.org_ogrnip || ''}
              onChange={e => handleChange('org_ogrnip', e.target.value)}
              helperText="Регистрационный номер ИП или организации"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 2.5, mb: 3 }}>
            <TextField
              fullWidth
              label="Адрес сайта ФНС для проверки чека (Тег 1060)"
              value={formData.fns_site || ''}
              onChange={e => handleChange('fns_site', e.target.value)}
              helperText="Адрес официального сайта для верификации фискального документа (например: www.nalog.gov.ru)"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Section 4: Notes */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', mb: 2 }}>
            4. Служебные примечания к профилю
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

      {/* Dialog: Connection Test Diagnostics */}
      <Dialog
        open={connectionTestDialogOpen}
        onClose={() => setConnectionTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <SpeedIcon sx={{ color: connectionTestResult?.success ? '#16A34A' : '#DC2626' }} />
          Результаты проверки связи с ККТ «{connectionTestResult?.deviceModel || 'АТОЛ 91Ф'}»
        </DialogTitle>

        <DialogContent dividers>
          {testingProfileId !== null ? (
            <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={42} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F3C64' }}>
                Опрос состояния ККТ и порта...
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Проверка COM-порта, отклика фискального накопителя и очереди драйвера
              </Typography>
            </Box>
          ) : connectionTestResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert
                severity={connectionTestResult.success ? 'success' : 'error'}
                icon={connectionTestResult.success ? <CheckCircleIcon fontSize="inherit" /> : <ErrorIcon fontSize="inherit" />}
                sx={{ borderRadius: 2 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {connectionTestResult.success ? 'Связь с ККТ успешно установлена!' : 'Ошибка подключения к оборудованию!'}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  {connectionTestResult.message}
                </Typography>
              </Alert>

              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5 }}>
                  Диагностические параметры оборудования
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, fontSize: '0.82rem' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Режим работы:</Typography>
                    <Typography sx={{ fontWeight: 700, color: connectionTestResult.isMockMode ? '#0F3C64' : '#D97706' }}>
                      {connectionTestResult.modeLabel}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Время отклика (Latency):</Typography>
                    <Typography sx={{ fontWeight: 700, color: connectionTestResult.success ? '#16A34A' : '#DC2626' }}>
                      {connectionTestResult.latencyMs} мс
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Модель и порт:</Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      {connectionTestResult.deviceModel} ({connectionTestResult.port}, {connectionTestResult.baudRate} бод)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Состояние ленты:</Typography>
                    <Typography sx={{ fontWeight: 700, color: connectionTestResult.success ? '#16A34A' : '#DC2626' }}>
                      {connectionTestResult.paperStatusLabel || (connectionTestResult.success ? 'В норме (OK)' : 'Нет связи')}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Фискальный накопитель (ФН):</Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      №{connectionTestResult.fnNumber || '—'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Регистрационный номер ККТ:</Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      РН {connectionTestResult.kktRegNumber || '—'}
                    </Typography>
                  </Box>

                  {connectionTestResult.portDeviceName && (
                    <Box sx={{ gridColumn: '1 / -1', pt: 1, borderTop: '1px dashed #CBD5E1' }}>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>Устройство в системе Windows на порту {connectionTestResult.port}:</Typography>
                      <Typography sx={{ fontWeight: 700, color: connectionTestResult.success ? '#16A34A' : '#DC2626' }}>
                        {connectionTestResult.portDeviceName}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Advanced Technical Diagnostics & Troubleshooting Box */}
              {!connectionTestResult.success && (
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#92400E', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorIcon sx={{ fontSize: 18, color: '#D97706' }} />
                    Расширенная техническая диагностика и рекомендации
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: '0.8rem', color: '#451A03' }}>
                    <Box sx={{ p: 1.2, bgcolor: '#FEF3C7', borderRadius: 1.5, border: '1px solid #FCD34D' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#B45309', mb: 0.3 }}>
                        1. Причина сбоя аппаратного контура:
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        В операционной системе Windows к порту <strong>{connectionTestResult.port}</strong> привязано устройство <strong>«{connectionTestResult.portDeviceName || 'Неизвестно'}»</strong> (служба Bluetooth/Модем), а не физический кассовый аппарат <strong>«{connectionTestResult.deviceModel}»</strong>.
                      </Typography>
                    </Box>

                    <Box sx={{ p: 1.2, bgcolor: '#FEF3C7', borderRadius: 1.5, border: '1px solid #FCD34D' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#B45309', mb: 0.3 }}>
                        2. Как подключить физическую ККТ «АТОЛ 91Ф»:
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        • Подключите кассу кабелем USB к компьютеру и включите питание (клавиша [C]).
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        • Переведите аппарат в режим фискального регистратора (ФР) в меню кассы.
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        • Откройте <em>Диспетчер устройств Windows (devmgmt.msc)</em> → <em>Порты (COM и LPT)</em> и проверьте порт драйвера <code>ATOL USB VCP</code>.
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        • Укажите найденный номер порта в настройках профиля оборудования.
                      </Typography>
                    </Box>

                    <Box sx={{ p: 1.2, bgcolor: '#EFF6FF', borderRadius: 1.5, border: '1px solid #BFDBFE' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#1E40AF', mb: 0.3 }}>
                        3. Работа без физической кассы (программная эмуляция):
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#1E3A8A' }}>
                        Для работы визитов и финансовых отчетов без подключенного аппарата нажмите кнопку <strong>«Включить «Эмулятор ККТ»»</strong> ниже. Все операции 54-ФЗ будут симулироваться виртуальным драйвером.
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )}
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {connectionTestResult && !connectionTestResult.success && !connectionTestResult.isMockMode && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleSwitchToMockFromDialog}
                disabled={testingProfileId !== null}
                sx={{ fontWeight: 700 }}
              >
                Включить «Эмулятор ККТ»
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={() => {
                const targetId = testingProfileId || globalActiveProfile?.id || selectedProfile?.id;
                const p = profiles.find(item => item.id === targetId);
                if (p) handleTestConnectionForProfile(p);
              }}
              disabled={testingProfileId !== null}
              startIcon={<RefreshIcon />}
              sx={{ fontWeight: 700 }}
            >
              Повторить тест
            </Button>

            <Button
              variant="contained"
              onClick={() => setConnectionTestDialogOpen(false)}
              sx={{ bgcolor: '#0F3C64', fontWeight: 700 }}
            >
              Закрыть
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
