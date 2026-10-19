import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  AttachMoney as CashIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import TreatmentGuidanceModal from './TreatmentGuidanceModal';

export interface OrthoticItem {
  code: string;
  name: string;
  subcategory: string;
  target_joint: string;
  service_scope: 'internal' | 'external';
  default_priority: string;
  weight_bearing_mode?: string;
  device_type_iso?: string;
  hinge_settings?: string;
  wearing_regimen?: string;
  description?: string;
  technique_details?: string;
  regimen_standard?: string;
  patient_preparation?: string;
  post_procedure_care?: string;
  clinical_indications?: string;
  contraindications?: string;
  servdict_id?: number | null;
  servdict_name?: string | null;
  servdict_price?: number | null;
  sort_order?: number;
  is_active?: number;
}

const JOINT_OPTIONS = [
  { key: 'all', label: 'Все суставы' },
  { key: 'knee', label: 'Коленный' },
  { key: 'hip', label: 'Тазобедренный' },
  { key: 'shoulder', label: 'Плечевой' },
  { key: 'elbow', label: 'Локтевой' },
  { key: 'wrist', label: 'Кисть/Запястье' },
  { key: 'ankle', label: 'Стопа/Голеностоп' },
  { key: 'spine', label: 'Позвоночник' },
  { key: 'general', label: 'Общие / Разгрузка' }
];

const WEIGHT_BEARING_CONFIG: Record<string, { label: string; short: string; color: string; bg: string }> = {
  all: { label: 'Любая осевая нагрузка', short: 'Все', color: '#0F3C64', bg: '#F1F5F9' },
  NWB: { label: 'NWB: Без опоры (0%)', short: 'NWB (0%)', color: '#DC2626', bg: '#FEF2F2' },
  TTWB: { label: 'TTWB: Касание носком (5–10%)', short: 'TTWB (10%)', color: '#EA580C', bg: '#FFF7ED' },
  PWB: { label: 'PWB: Частичная опора (20–50%)', short: 'PWB (20-50%)', color: '#CA8A04', bg: '#FEF9C3' },
  WBAT: { label: 'WBAT: По переносимости боли', short: 'WBAT', color: '#2563EB', bg: '#EFF6FF' },
  FWB: { label: 'FWB: Полная опора (100%)', short: 'FWB (100%)', color: '#059669', bg: '#ECFDF5' }
};

interface Props {
  onCatalogChanged?: () => void;
}

export default function OrthoticsCatalogManager({ onCatalogChanged }: Props) {
  const [items, setItems] = useState<OrthoticItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJoint, setSelectedJoint] = useState('all');
  const [selectedWb, setSelectedWb] = useState('all');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Editor State
  const [editorItem, setEditorItem] = useState<OrthoticItem | null>(null);
  const [isNewMode, setIsNewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  // Clinic Services Autocomplete Cache
  const [servicesOptions, setServicesOptions] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [guidanceModalOpen, setGuidanceModalOpen] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchServices('');
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ortho/treatments/orthotics');
      const data = await res.json();
      if (data.success && Array.isArray(data.orthotics)) {
        setItems(data.orthotics);
        if (data.orthotics.length > 0 && !selectedCode && !isNewMode) {
          selectItem(data.orthotics[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load orthotics catalog:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async (q: string) => {
    setServicesLoading(true);
    try {
      const res = await fetch(`/api/ortho/services?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setServicesOptions(data.services || []);
      }
    } catch (e) {
      console.error('Failed to search clinic services:', e);
    } finally {
      setServicesLoading(false);
    }
  };

  const selectItem = (item: OrthoticItem) => {
    setSelectedCode(item.code);
    setIsNewMode(false);
    setEditorItem({ ...item });
    setStatusMessage({ type: '', text: '' });
  };

  const startCreateNew = () => {
    setIsNewMode(true);
    setSelectedCode(null);
    setEditorItem({
      code: '',
      name: '',
      subcategory: 'Ортопедические изделия',
      target_joint: selectedJoint !== 'all' ? selectedJoint : 'knee',
      service_scope: 'internal',
      default_priority: 'high',
      weight_bearing_mode: 'WBAT',
      device_type_iso: '',
      hinge_settings: '',
      wearing_regimen: 'Постоянное ношение при ходьбе',
      clinical_indications: '',
      contraindications: '',
      technique_details: '',
      patient_preparation: '',
      post_procedure_care: '',
      servdict_id: null,
      sort_order: 10,
      is_active: 1
    });
    setStatusMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    if (!editorItem || !editorItem.code || !editorItem.name || !editorItem.target_joint) {
      setStatusMessage({ type: 'error', text: 'Заполните обязательные поля: Код, Название и Сустав' });
      return;
    }

    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const url = isNewMode
        ? '/api/ortho/treatments/orthotics'
        : `/api/ortho/treatments/orthotics/${encodeURIComponent(editorItem.code)}`;
      const method = isNewMode ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editorItem)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: isNewMode ? 'Изделие успешно создано!' : 'Изделие обновлено!' });
        await fetchItems();
        setIsNewMode(false);
        setSelectedCode(editorItem.code);
        if (onCatalogChanged) onCatalogChanged();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Ошибка при сохранении' });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'Ошибка сети' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editorItem || !editorItem.code) return;
    try {
      const res = await fetch(`/api/ortho/treatments/orthotics/${encodeURIComponent(editorItem.code)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setDeleteDialogOpen(false);
        await fetchItems();
        if (items.length > 0) selectItem(items[0]);
        if (onCatalogChanged) onCatalogChanged();
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((m) => {
      if (selectedJoint !== 'all' && m.target_joint !== selectedJoint && m.target_joint !== 'general') return false;
      if (selectedWb !== 'all' && m.weight_bearing_mode !== selectedWb) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchCode = m.code?.toLowerCase().includes(q);
        const matchIndications = m.clinical_indications?.toLowerCase().includes(q);
        const matchIso = m.device_type_iso?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchIndications && !matchIso) return false;
      }
      return true;
    });
  }, [items, selectedJoint, selectedWb, searchQuery]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Top Banner / Toolbar */}
      <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#F0FDFA', color: '#0D9488', display: 'flex' }}>
              <ShieldIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                Справочник ортезирования и средств разгрузки ({items.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Шарнирные ортезы, жесткие туторы, мягкие бандажи, индивидуальные стельки, режимы весовой нагрузки (NWB–FWB)
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<MenuBookIcon />}
              onClick={() => setGuidanceModalOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Клинический гид
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddIcon />}
              onClick={startCreateNew}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Создать изделие
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchItems}
              sx={{ textTransform: 'none' }}
            >
              Обновить
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Split Grid */}
      <Grid container spacing={2} sx={{ flexGrow: 1, minHeight: 0, height: 'calc(100% - 90px)' }}>
        {/* Left Column: Filterable Master List */}
        <Grid size={{ xs: 12, md: 4, lg: 3.5 }} sx={{ height: '100%', minHeight: 0 }}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Поиск по изделию, коду, ISO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: searchQuery ? (
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ) : undefined
                }
              }}
              sx={{ mb: 1.25 }}
            />

            {/* Joint Filter Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.25 }}>
              {JOINT_OPTIONS.map((j) => {
                const count = j.key === 'all'
                  ? items.length
                  : items.filter(m => m.target_joint === j.key || (j.key === 'knee' && m.target_joint === 'general')).length;
                const isSelected = selectedJoint === j.key;
                return (
                  <Chip
                    key={j.key}
                    label={`${j.label} (${count})`}
                    size="small"
                    clickable
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => setSelectedJoint(j.key)}
                    sx={{ fontSize: '0.68rem', height: 22, fontWeight: isSelected ? 700 : 500 }}
                  />
                );
              })}
            </Box>

            {/* Weight Bearing Filter Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5, pb: 1, borderBottom: '1px solid #E2E8F0' }}>
              {Object.entries(WEIGHT_BEARING_CONFIG).map(([k, cfg]) => {
                const isSelected = selectedWb === k;
                return (
                  <Chip
                    key={k}
                    label={cfg.short}
                    size="small"
                    clickable
                    onClick={() => setSelectedWb(k)}
                    sx={{
                      fontSize: '0.66rem',
                      height: 20,
                      fontWeight: isSelected ? 700 : 500,
                      bgcolor: isSelected ? cfg.bg : '#F8FAFC',
                      color: isSelected ? cfg.color : '#475569',
                      border: `1px solid ${isSelected ? cfg.color : '#E2E8F0'}`
                    }}
                  />
                );
              })}
            </Box>

            {/* Items List */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
              НАЙДЕНО: {filteredItems.length} из {items.length}
            </Typography>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : filteredItems.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>Ортопедические изделия не найдены</Alert>
              ) : (
                filteredItems.map((m) => {
                  const isSelected = selectedCode === m.code && !isNewMode;
                  const hasPrice = !!m.servdict_id;
                  const wb = WEIGHT_BEARING_CONFIG[m.weight_bearing_mode || 'WBAT'] || WEIGHT_BEARING_CONFIG.all;

                  return (
                    <Card
                      key={m.code}
                      variant="outlined"
                      onClick={() => selectItem(m)}
                      sx={{
                        mb: 1.25,
                        cursor: 'pointer',
                        borderRadius: 1.5,
                        borderLeft: `4px solid ${wb.color}`,
                        borderColor: isSelected ? '#0D9488' : '#E2E8F0',
                        bgcolor: isSelected ? '#F0FDFA' : '#FFFFFF',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: '#0D9488',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: '10px !important' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip
                              label={m.code}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                height: 18,
                                bgcolor: isSelected ? '#0D9488' : '#F1F5F9',
                                color: isSelected ? '#FFF' : '#334155'
                              }}
                            />
                            {m.weight_bearing_mode && (
                              <Chip
                                label={m.weight_bearing_mode}
                                size="small"
                                sx={{
                                  fontSize: '0.62rem',
                                  height: 18,
                                  fontWeight: 800,
                                  bgcolor: wb.bg,
                                  color: wb.color
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                            {m.target_joint}
                          </Typography>
                        </Box>

                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5, lineHeight: 1.3 }}>
                          {m.name}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
                            {m.device_type_iso ? `ISO ${m.device_type_iso}` : m.subcategory}
                          </Typography>
                          {hasPrice ? (
                            <Chip
                              icon={<CashIcon sx={{ fontSize: '12px !important', color: '#047857 !important' }} />}
                              label={`${m.servdict_price || 0} ₽`}
                              size="small"
                              sx={{ fontSize: '0.65rem', height: 18, bgcolor: '#ECFDF5', color: '#047857', fontWeight: 800 }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem' }}>
                              Без прайса
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Editor Panel */}
        <Grid size={{ xs: 12, md: 8, lg: 8.5 }} sx={{ height: '100%', minHeight: 0 }}>
          <Paper sx={{ p: 2.5, height: '100%', overflowY: 'auto', borderRadius: 2, border: '1px solid #E2E8F0' }}>
            {!editorItem ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="text.secondary">Выберите изделие слева или нажмите «Создать изделие»</Typography>
              </Box>
            ) : (
              <>
                {/* Header Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5, mb: 2, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      {isNewMode ? 'Создание ортопедического изделия' : `Редактирование: ${editorItem.name}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Код в каталоге: <b>{editorItem.code || 'Не назначен'}</b>
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!isNewMode && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteDialogOpen(true)}
                        sx={{ textTransform: 'none' }}
                      >
                        В архив
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={saving}
                      sx={{ textTransform: 'none', fontWeight: 700, px: 2 }}
                    >
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                  </Box>
                </Box>

                {statusMessage.text && (
                  <Alert severity={statusMessage.type === 'success' ? 'success' : 'error'} sx={{ mb: 2 }}>
                    {statusMessage.text}
                  </Alert>
                )}

                {/* Form Fields */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Уникальный код"
                      size="small"
                      fullWidth
                      required
                      value={editorItem.code}
                      disabled={!isNewMode}
                      onChange={(e) => setEditorItem({ ...editorItem, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                      helperText={isNewMode ? 'Например: ORTH_KNEE_HINGED' : 'Код нельзя изменить'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      label="Наименование ортопедического изделия"
                      size="small"
                      fullWidth
                      required
                      value={editorItem.name}
                      onChange={(e) => setEditorItem({ ...editorItem, name: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl size="small" fullWidth required>
                      <InputLabel>Анатомический сустав</InputLabel>
                      <Select
                        label="Анатомический сустав"
                        value={editorItem.target_joint}
                        onChange={(e) => setEditorItem({ ...editorItem, target_joint: e.target.value })}
                      >
                        {JOINT_OPTIONS.filter(j => j.key !== 'all').map(j => (
                          <MenuItem key={j.key} value={j.key}>{j.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Режим весовой осевой нагрузки</InputLabel>
                      <Select
                        label="Режим весовой осевой нагрузки"
                        value={editorItem.weight_bearing_mode || 'WBAT'}
                        onChange={(e) => setEditorItem({ ...editorItem, weight_bearing_mode: e.target.value })}
                      >
                        <MenuItem value="NWB">🚫 NWB: Строгая разгрузка без опоры (0%)</MenuItem>
                        <MenuItem value="TTWB">🦶 TTWB: Касание носком для баланса (5–10%)</MenuItem>
                        <MenuItem value="PWB">⚖️ PWB: Частичная опора на костылях (20–50%)</MenuItem>
                        <MenuItem value="WBAT">🚶 WBAT: Опора по переносимости боли</MenuItem>
                        <MenuItem value="FWB">✅ FWB: Полная свободная опора (100%)</MenuItem>
                        <MenuItem value="N/A">ℹ️ N/A: Верхняя конч./позвоночник</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Код ISO (Классификатор ТСР)"
                      size="small"
                      fullWidth
                      placeholder="Напр. 06.12.06"
                      value={editorItem.device_type_iso || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, device_type_iso: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Установки шарниров / Угловой лимитер"
                      size="small"
                      fullWidth
                      placeholder="Напр. Сгибание 0–90°, Разгибание 0° (блок)"
                      value={editorItem.hinge_settings || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, hinge_settings: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Режим и схема ношения"
                      size="small"
                      fullWidth
                      placeholder="Напр. Постоянное ношение 4 недели, сон в ортезе"
                      value={editorItem.wearing_regimen || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, wearing_regimen: e.target.value })}
                    />
                  </Grid>
                </Grid>

                {/* Medwork Clinic Price Link */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 1.5, bgcolor: '#F8FAFC' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CashIcon fontSize="small" color="success" /> Привязка к позиции прайс-листа клиники Медворк (servdict)
                  </Typography>
                  <Autocomplete
                    options={servicesOptions}
                    loading={servicesLoading}
                    getOptionLabel={(option) => `${option.code ? `[${option.code}] ` : ''}${option.name} (${option.price || 0} ₽)`}
                    value={servicesOptions.find(o => o.id === editorItem.servdict_id) || (editorItem.servdict_id ? { id: editorItem.servdict_id, name: editorItem.servdict_name || '', price: editorItem.servdict_price } : null)}
                    onChange={(_, val) => {
                      setEditorItem({
                        ...editorItem,
                        servdict_id: val ? val.id : null,
                        servdict_name: val ? val.name : null,
                        servdict_price: val ? val.price : null
                      });
                    }}
                    onInputChange={(_, val) => {
                      if (val.length >= 2) fetchServices(val);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Начните ввод кода или названия услуги из прайс-листа..."
                        helperText={editorItem.servdict_id ? `Привязано к прайсу: #${editorItem.servdict_id} • Цена: ${editorItem.servdict_price || 0} ₽` : 'Без привязки к платной услуге'}
                      />
                    )}
                  />
                </Paper>

                {/* Clinical Protocols & Instructions */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B', mb: 1.5 }}>
                  Клинические показания, инструктаж пациента и биомеханика
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Клинические показания к ортезированию"
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      value={editorItem.clinical_indications || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, clinical_indications: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Правила подгонки, надевания и компрессии"
                      size="small"
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Подгонка по размерной сетке, исключение сдавления малоберцового нерва..."
                      value={editorItem.technique_details || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, technique_details: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Противопоказания и риск осложнений (ТГВ, пролежни)"
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      value={editorItem.contraindications || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, contraindications: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800, color: '#DC2626' }}>Архивировать изделие?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите перенести ортопедическое изделие <b>{editorItem?.name}</b> ({editorItem?.code}) в архив?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>Отмена</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>В архив</Button>
        </DialogActions>
      </Dialog>

      {/* Clinical Guidance Modal */}
      <TreatmentGuidanceModal
        open={guidanceModalOpen}
        onClose={() => setGuidanceModalOpen(false)}
        category="orthotics"
        title="Клиническое руководство по ортезированию и разгрузке"
      />
    </Box>
  );
}
