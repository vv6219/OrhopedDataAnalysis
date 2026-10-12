import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Switch, FormControlLabel,
  MenuItem, Select, FormControl, InputLabel, Chip,
  Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Tab, Tabs, FormHelperText, CircularProgress,
  Slider
} from '@mui/material';
import { API_BASE_URL } from '../config/apiConfig';
import PosDeviceCard from '../components/PosDeviceCard';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import UsbIcon from '@mui/icons-material/Usb';
import SecurityIcon from '@mui/icons-material/Security';
import { usePos, type PosSettingsProfile } from '../context/PosContext';

export interface PosAuditRecord {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  event_type: string;
  terminal_id: string;
  transaction_uuid?: string;
  amount?: number;
  rrn?: string;
  auth_code?: string;
  properties_json: string;
}

const COMMON_PORTS = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', '/dev/ttyUSB0'];
const BAUD_RATES = [9600, 19200, 38400, 57600, 115200];
const DRIVER_TYPES = ['Arcus-2', 'INPAS', 'UCS', 'Mock'];
const CONNECTION_TYPES = [
  { value: 'COM', label: 'COM-порт (USB-Serial)' },
  { value: 'TCP_IP', label: 'Ethernet (Локальная сеть TCP/IP)' },
  { value: 'USB_HID', label: 'Прямой USB-HID интерфейс' }
];

export default function PosSettings() {
  const { refreshPosStatus, activateProfile } = usePos();
  const [profiles, setProfiles] = useState<PosSettingsProfile[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<PosSettingsProfile>>({
    profile_name: '',
    is_mock_mode: 1,
    driver_type: 'Arcus-2',
    connection_type: 'COM',
    port: 'COM4',
    baud_rate: 115200,
    ip_address: '192.168.1.150',
    ip_port: 8888,
    terminal_id: 'ALFA_770192',
    merchant_id: 'MERCH_884102',
    bank_name: 'АО «АЛЬФА-БАНК»',
    currency_code: '643',
    execution_timeout_seconds: 60,
    driver_executable_path: 'C:\\Arcus2\\pos.exe',
    enable_sbp_qr: 1,
    mock_scenario: 'success',
    mock_delay_seconds: 2,
    is_active: 0,
    notes: ''
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<PosAuditRecord[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditDetailOpen, setAuditDetailOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<PosAuditRecord | null>(null);

  // Dialogs
  const [newProfileOpen, setNewProfileOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/settings`);
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
        if (data.length > 0) {
          const currentActive = data.find((p: PosSettingsProfile) => p.is_active === 1);
          const defaultSelect = currentActive ? currentActive.id : data[0].id;
          setSelectedId(prev => (prev !== null && data.some((p: PosSettingsProfile) => p.id === prev) ? prev : defaultSelect));
        }
      }
    } catch (e: any) {
      setAlert({ type: 'error', message: `Ошибка загрузки профилей: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/audit-logs?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e: any) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (activeTab === 3) {
      fetchAuditLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedId !== null) {
      const p = profiles.find(item => item.id === selectedId);
      if (p) {
        setForm({ ...p });
      }
    }
  }, [selectedId, profiles]);

  const currentSelectedProfile = useMemo(() => {
    return profiles.find(p => p.id === selectedId) || null;
  }, [profiles, selectedId]);

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setAlert(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/settings/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', message: 'Профиль настроек эквайринга успешно сохранён!' });
        await fetchProfiles();
        await refreshPosStatus();
      } else {
        setAlert({ type: 'error', message: data.error || 'Ошибка при сохранении' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', message: `Сетевая ошибка: ${e.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedId) return;
    try {
      await activateProfile(selectedId);
      setAlert({ type: 'success', message: 'Профиль успешно активирован!' });
      await fetchProfiles();
    } catch (e: any) {
      setAlert({ type: 'error', message: `Ошибка активации: ${e.message}` });
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          profile_name: newProfileName.trim(),
          is_active: 0
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', message: `Профиль «${newProfileName}» создан!` });
        setNewProfileOpen(false);
        setNewProfileName('');
        await fetchProfiles();
        setSelectedId(data.id);
      } else {
        setAlert({ type: 'error', message: data.error || 'Ошибка создания профиля' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', message: e.message });
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/settings/${selectedId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', message: 'Профиль удален' });
        setDeleteConfirmOpen(false);
        await fetchProfiles();
      } else {
        setAlert({ type: 'error', message: data.error || 'Не удалось удалить профиль' });
        setDeleteConfirmOpen(false);
      }
    } catch (e: any) {
      setAlert({ type: 'error', message: e.message });
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Top Banner / Device Card */}
      <Box sx={{ mb: 3 }}>
        <PosDeviceCard onRefresh={fetchProfiles} />
      </Box>

      {/* Main Settings Paper */}
      <Paper
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(15, 60, 100, 0.08)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
      >
        {/* Header Toolbar */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: '#0F3C64',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CreditCardIcon sx={{ fontSize: 26, color: '#93C5FD' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF' }}>
                Параметры эквайринга «АО «АЛЬФА-БАНК»»
              </Typography>
              <Typography variant="caption" sx={{ color: '#E2E8F0' }}>
                Конфигурация POS-терминала, Arcus-2 драйвера, СБП и реквизитов торговой точки
              </Typography>
            </Box>
          </Box>

          {/* Profile Selector & Quick Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 260, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1.5 }}>
              <Select
                disabled={loading}
                value={selectedId || ''}
                onChange={(e) => setSelectedId(Number(e.target.value))}
                sx={{
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FFFFFF' },
                  '.MuiSvgIcon-root': { color: '#FFFFFF' }
                }}
              >
                {profiles.map(p => (
                  <MenuItem key={p.id} value={p.id} sx={{ fontWeight: p.is_active ? 800 : 500 }}>
                    {p.profile_name} {p.is_active === 1 ? ' ★ (АКТИВНЫЙ)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="small"
              onClick={() => setNewProfileOpen(true)}
              startIcon={<AddCircleIcon />}
              sx={{ bgcolor: '#2563EB', fontWeight: 700, textTransform: 'none', borderRadius: 1.5 }}
            >
              Новый профиль
            </Button>
          </Box>
        </Box>

        {/* Alerts */}
        {alert && (
          <Box sx={{ p: 2 }}>
            <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ borderRadius: 2 }}>
              {alert.message}
            </Alert>
          </Box>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} textColor="primary" indicatorColor="primary">
            <Tab label="1. Профиль и режим работы" icon={<CreditCardIcon fontSize="small" />} iconPosition="start" sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label="2. Аппаратное подключение" icon={<UsbIcon fontSize="small" />} iconPosition="start" sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label="3. Банковские реквизиты и СБП" icon={<SecurityIcon fontSize="small" />} iconPosition="start" sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label="4. Аудит эквайринга (Serilog)" icon={<HistoryIcon fontSize="small" />} iconPosition="start" sx={{ fontWeight: 700, textTransform: 'none' }} />
          </Tabs>
        </Box>

        {/* Tab 0: Profile & Mode */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
              <TextField
                label="Название профиля"
                value={form.profile_name || ''}
                onChange={(e) => setForm({ ...form, profile_name: e.target.value })}
                fullWidth
                helperText="Понятное наименование рабочего места (например, 'Касса №1 — Стойка администратора')"
              />

              <FormControl fullWidth>
                <InputLabel>Банковский протокол / Драйвер</InputLabel>
                <Select
                  value={form.driver_type || 'Arcus-2'}
                  label="Банковский протокол / Драйвер"
                  onChange={(e) => setForm({ ...form, driver_type: e.target.value })}
                >
                  {DRIVER_TYPES.map(d => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>Для терминалов Альфа-Банка используется стек Arcus-2</FormHelperText>
              </FormControl>
            </Box>

            {/* Mode Switch Highlight Box */}
            <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: form.is_mock_mode ? '#FFFBEB' : '#F0FDF4', border: '1px solid', borderColor: form.is_mock_mode ? '#FCD34D' : '#86EFAC' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: form.is_mock_mode ? '#92400E' : '#166534' }}>
                    {form.is_mock_mode ? '🟡 Включен режим эмуляции (Mock Mode)' : '🟢 Включен физический POS-терминал (Real Hardware)'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: form.is_mock_mode ? '#B45309' : '#15803D' }}>
                    {form.is_mock_mode
                      ? 'Транзакции симулируются программно. Реальные карты не требуются, списание средств не происходит.'
                      : 'Команды направляются на физический терминал через драйвер Arcus-2. Требуется реальный считыватель.'}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_mock_mode === 0}
                      onChange={(e) => setForm({ ...form, is_mock_mode: e.target.checked ? 0 : 1 })}
                      color="success"
                    />
                  }
                  label={<Typography sx={{ fontWeight: 700 }}>Физический терминал</Typography>}
                />
              </Box>

              {form.is_mock_mode === 1 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #FDE68A', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 240 }}>
                    <InputLabel>Сценарий симуляции</InputLabel>
                    <Select
                      value={form.mock_scenario || 'success'}
                      label="Сценарий симуляции"
                      onChange={(e) => setForm({ ...form, mock_scenario: e.target.value })}
                    >
                      <MenuItem value="success">Одобрено (Код 00: Успех)</MenuItem>
                      <MenuItem value="insufficient_funds">Отказ: Недостаточно средств (Код 51)</MenuItem>
                      <MenuItem value="cancelled">Отказ: Отмена клиентом на PIN-паде (Код 99)</MenuItem>
                      <MenuItem value="timeout">Таймаут ввода PIN-кода (Код 68)</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    type="number"
                    label="Задержка ответа (сек)"
                    value={form.mock_delay_seconds || 2}
                    onChange={(e) => setForm({ ...form, mock_delay_seconds: Number(e.target.value) })}
                    sx={{ width: 160 }}
                  />
                </Box>
              )}
            </Paper>

            <TextField
              label="Служебные примечания системного администратора"
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        )}

        {/* Tab 1: Hardware Connection */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Тип физического интерфейса</InputLabel>
                <Select
                  value={form.connection_type || 'COM'}
                  label="Тип физического интерфейса"
                  onChange={(e) => setForm({ ...form, connection_type: e.target.value })}
                >
                  {CONNECTION_TYPES.map(c => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {form.connection_type === 'COM' ? (
                <FormControl fullWidth>
                  <InputLabel>Последовательный порт (COM)</InputLabel>
                  <Select
                    value={form.port || 'COM4'}
                    label="Последовательный порт (COM)"
                    onChange={(e) => setForm({ ...form, port: e.target.value })}
                  >
                    {COMMON_PORTS.map(p => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="IP-адрес терминала"
                    value={form.ip_address || '192.168.1.150'}
                    onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="TCP-порт"
                    type="number"
                    value={form.ip_port || 8888}
                    onChange={(e) => setForm({ ...form, ip_port: Number(e.target.value) })}
                    sx={{ width: 140 }}
                  />
                </Box>
              )}

              <FormControl fullWidth>
                <InputLabel>Скорость обмена (Baud Rate)</InputLabel>
                <Select
                  value={form.baud_rate || 115200}
                  label="Скорость обмена (Baud Rate)"
                  onChange={(e) => setForm({ ...form, baud_rate: Number(e.target.value) })}
                >
                  {BAUD_RATES.map(b => (
                    <MenuItem key={b} value={b}>{b} бод</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Путь к исполняемому файлу Arcus-2"
                value={form.driver_executable_path || 'C:\\Arcus2\\pos.exe'}
                onChange={(e) => setForm({ ...form, driver_executable_path: e.target.value })}
                fullWidth
                helperText="Обычно C:\Arcus2\pos.exe или C:\sc552\pos.exe"
              />
            </Box>

            {/* Timeout Slider */}
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#0F3C64' }}>
                Время ожидания авторизации и ввода PIN-кода клиентом: <b>{form.execution_timeout_seconds || 60} сек</b>
              </Typography>
              <Slider
                value={form.execution_timeout_seconds || 60}
                min={15}
                max={180}
                step={5}
                onChange={(_, val) => setForm({ ...form, execution_timeout_seconds: val as number })}
                valueLabelDisplay="auto"
                sx={{ color: '#0F3C64' }}
              />
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Рекомендуемое время ожидания для медицинских касс — 60–90 секунд.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Tab 2: Bank Requisites & SBP */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
              <TextField
                label="Terminal ID (TID в банке)"
                value={form.terminal_id || 'ALFA_770192'}
                onChange={(e) => setForm({ ...form, terminal_id: e.target.value })}
                fullWidth
                helperText="8-значный идентификатор POS-терминала из договора эквайринга"
              />

              <TextField
                label="Merchant ID (MID мерчанта)"
                value={form.merchant_id || 'MERCH_884102'}
                onChange={(e) => setForm({ ...form, merchant_id: e.target.value })}
                fullWidth
                helperText="Идентификатор торгово-сервисного предприятия клиники"
              />

              <TextField
                label="Наименование банка-эквайера"
                value={form.bank_name || 'АО «АЛЬФА-БАНК»'}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                fullWidth
              />

              <TextField
                label="Код валюты транзакций"
                value={form.currency_code || '643'}
                onChange={(e) => setForm({ ...form, currency_code: e.target.value })}
                fullWidth
                helperText="643 = Российский рубль (RUB)"
              />
            </Box>

            <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.enable_sbp_qr)}
                    onChange={(e) => setForm({ ...form, enable_sbp_qr: e.target.checked ? 1 : 0 })}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#0F3C64' }}>
                      Генерация динамического QR-кода СБП на экране терминала
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Позволяет пациенту оплачивать приём через мобильный банк без физической банковской карты
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Box>
        )}

        {/* Tab 3: Serilog Audit Logs */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                Журнал телеметрии и аудита эквайринга (Serilog)
              </Typography>
              <Button size="small" variant="outlined" onClick={fetchAuditLogs} disabled={loadingAudit} startIcon={<RefreshIcon />}>
                Обновить журнал
              </Button>
            </Box>

            {loadingAudit ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
              <Box sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '140px 100px 180px 1fr 100px', p: 1.5, bgcolor: '#F1F5F9', fontWeight: 800, fontSize: '0.75rem', color: '#475569' }}>
                  <Box>ДАТА / ВРЕМЯ</Box>
                  <Box>УРОВЕНЬ</Box>
                  <Box>СОБЫТИЕ</Box>
                  <Box>СООБЩЕНИЕ</Box>
                  <Box>ДЕТАЛИ</Box>
                </Box>
                {auditLogs.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center', color: '#94A3B8' }}>Записей аудита пока нет</Box>
                ) : (
                  auditLogs.map((log) => (
                    <Box
                      key={log.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '140px 100px 180px 1fr 100px',
                        p: 1.2,
                        borderBottom: '1px solid #F1F5F9',
                        fontSize: '0.8rem',
                        alignItems: 'center',
                        '&:hover': { bgcolor: '#F8FAFC' }
                      }}
                    >
                      <Box sx={{ color: '#64748B', fontFamily: 'monospace' }}>
                        {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                      </Box>
                      <Box>
                        <Chip
                          size="small"
                          label={log.level}
                          sx={{
                            fontSize: '0.68rem',
                            height: 20,
                            fontWeight: 700,
                            bgcolor: log.level === 'Error' || log.level === 'Fatal' ? '#FEE2E2' : log.level === 'Warning' ? '#FEF3C7' : '#EFF6FF',
                            color: log.level === 'Error' || log.level === 'Fatal' ? '#DC2626' : log.level === 'Warning' ? '#D97706' : '#2563EB'
                          }}
                        />
                      </Box>
                      <Box sx={{ fontWeight: 600, color: '#334155' }}>{log.event_type}</Box>
                      <Box sx={{ color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.message}</Box>
                      <Box>
                        <Button
                          size="small"
                          onClick={() => { setSelectedAuditLog(log); setAuditDetailOpen(true); }}
                          sx={{ fontSize: '0.72rem', textTransform: 'none', py: 0.2 }}
                        >
                          JSON
                        </Button>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Footer Actions (Tabs 0-2) */}
        {activeTab !== 3 && (
          <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {currentSelectedProfile && (
                <>
                  {currentSelectedProfile.is_active === 1 ? (
                    <Chip icon={<CheckCircleIcon />} label="Этот профиль сейчас АКТИВЕН" color="success" size="small" sx={{ fontWeight: 700 }} />
                  ) : (
                    <Button variant="outlined" color="success" size="small" onClick={handleActivate} sx={{ fontWeight: 700, textTransform: 'none' }}>
                      Сделать активным
                    </Button>
                  )}

                  {currentSelectedProfile.is_active !== 1 && (
                    <Button variant="outlined" color="error" size="small" onClick={() => setDeleteConfirmOpen(true)} startIcon={<DeleteIcon />} sx={{ textTransform: 'none' }}>
                      Удалить
                    </Button>
                  )}
                </>
              )}
            </Box>

            <Button
              variant="contained"
              size="medium"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              sx={{ bgcolor: '#0F3C64', fontWeight: 800, textTransform: 'none', px: 3, borderRadius: 2 }}
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения профиля'}
            </Button>
          </Box>
        )}
      </Paper>

      {/* New Profile Dialog */}
      <Dialog open={newProfileOpen} onClose={() => setNewProfileOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64' }}>Новый профиль эквайринга</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Название нового профиля"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNewProfileOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleCreateProfile} sx={{ bgcolor: '#0F3C64' }}>Создать</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#DC2626' }}>Удаление профиля</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Вы уверены, что хотите удалить профиль «{currentSelectedProfile?.profile_name}»?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Отмена</Button>
          <Button variant="contained" color="error" onClick={handleDeleteProfile}>Удалить</Button>
        </DialogActions>
      </Dialog>

      {/* Audit JSON Dialog */}
      <Dialog open={auditDetailOpen} onClose={() => setAuditDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64' }}>Детали события аудита Serilog</DialogTitle>
        <DialogContent dividers>
          <pre style={{ margin: 0, padding: 12, backgroundColor: '#0F172A', color: '#38BDF8', borderRadius: 8, fontSize: '0.82rem', overflowX: 'auto' }}>
            {JSON.stringify(selectedAuditLog, null, 2)}
          </pre>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAuditDetailOpen(false)} variant="contained" sx={{ bgcolor: '#0F3C64' }}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
