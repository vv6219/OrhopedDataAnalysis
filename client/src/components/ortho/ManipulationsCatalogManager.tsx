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
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  MedicalServices as MedicalServicesIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  AttachMoney as CashIcon,
  WarningAmber as WarningIcon,
  MenuBook as MenuBookIcon,
  Biotech as UltrasoundIcon
} from '@mui/icons-material';
import TreatmentGuidanceModal from './TreatmentGuidanceModal';

export interface ManipulationItem {
  code: string;
  name: string;
  subcategory: string;
  target_joint: string;
  service_scope: 'internal' | 'external';
  default_priority: string;
  ebm_priority: 'P1' | 'P2' | 'P3' | 'P0-STOP' | string;
  navigation_type: 'us_guided' | 'landmark' | 'c_arm' | 'none' | string;
  anatomical_access?: string;
  drug_class?: string;
  is_stop_warning: number | boolean;
  stop_rationale?: string;
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
  { key: 'general', label: 'Общие / Все зоны' }
];

const NAVIGATION_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  all: { label: 'Любая навигация', icon: '📍', color: '#0F3C64', bg: '#F1F5F9' },
  us_guided: { label: 'УЗИ-навигация (US)', icon: '📡', color: '#0284C7', bg: '#F0F9FF' },
  landmark: { label: 'Пальпаторные ориентиры', icon: '🖐️', color: '#D97706', bg: '#FFFBEB' },
  c_arm: { label: 'Рентген ЭОП (C-Arm)', icon: '☢️', color: '#7C3AED', bg: '#F5F3FF' }
};

interface Props {
  onCatalogChanged?: () => void;
}

export default function ManipulationsCatalogManager({ onCatalogChanged }: Props) {
  const [items, setItems] = useState<ManipulationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJoint, setSelectedJoint] = useState('all');
  const [selectedNav, setSelectedNav] = useState('all');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Editor State
  const [editorItem, setEditorItem] = useState<ManipulationItem | null>(null);
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
      const res = await fetch('/api/ortho/treatments/manipulations');
      const data = await res.json();
      if (data.success && Array.isArray(data.manipulations)) {
        setItems(data.manipulations);
        if (data.manipulations.length > 0 && !selectedCode && !isNewMode) {
          selectItem(data.manipulations[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load manipulations catalog:', e);
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

  const selectItem = (item: ManipulationItem) => {
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
      subcategory: 'Инъекционная терапия',
      target_joint: selectedJoint !== 'all' ? selectedJoint : 'knee',
      service_scope: 'internal',
      default_priority: 'high',
      ebm_priority: 'P2',
      navigation_type: 'us_guided',
      anatomical_access: '',
      drug_class: '',
      is_stop_warning: 0,
      stop_rationale: '',
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
        ? '/api/ortho/treatments/manipulations'
        : `/api/ortho/treatments/manipulations/${encodeURIComponent(editorItem.code)}`;
      const method = isNewMode ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editorItem)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: isNewMode ? 'Манипуляция успешно создана!' : 'Манипуляция обновлена!' });
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
      const res = await fetch(`/api/ortho/treatments/manipulations/${encodeURIComponent(editorItem.code)}`, {
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
      if (selectedNav !== 'all' && m.navigation_type !== selectedNav) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchCode = m.code?.toLowerCase().includes(q);
        const matchDrug = m.drug_class?.toLowerCase().includes(q);
        const matchIndications = m.clinical_indications?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDrug && !matchIndications) return false;
      }
      return true;
    });
  }, [items, selectedJoint, selectedNav, searchQuery]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Top Banner / Toolbar */}
      <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#ECFDF5', color: '#059669', display: 'flex' }}>
              <MedicalServicesIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                Справочник лечебных манипуляций и инъекционной терапии ({items.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Лечебно-медикаментозные блокады, внутрисуставные инъекции, PRP-терапия, УЗИ-навигация, CDSS STOP Red Flags и привязка к прайсу
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
              Создать манипуляцию
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
              placeholder="Поиск по названию, коду, препарату..."
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

            {/* Navigation Type Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5, pb: 1, borderBottom: '1px solid #E2E8F0' }}>
              {Object.entries(NAVIGATION_CONFIG).map(([k, cfg]) => {
                const isSelected = selectedNav === k;
                return (
                  <Chip
                    key={k}
                    label={`${cfg.icon} ${cfg.label}`}
                    size="small"
                    clickable
                    onClick={() => setSelectedNav(k)}
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
                <Alert severity="info" sx={{ mt: 2 }}>Манипуляции не найдены</Alert>
              ) : (
                filteredItems.map((m) => {
                  const isSelected = selectedCode === m.code && !isNewMode;
                  const hasPrice = !!m.servdict_id;
                  const isStop = m.is_stop_warning === 1 || m.is_stop_warning === true;

                  return (
                    <Card
                      key={m.code}
                      variant="outlined"
                      onClick={() => selectItem(m)}
                      sx={{
                        mb: 1.25,
                        cursor: 'pointer',
                        borderRadius: 1.5,
                        borderLeft: `4px solid ${isStop ? '#DC2626' : hasPrice ? '#059669' : '#0284C7'}`,
                        borderColor: isSelected ? '#0284C7' : '#E2E8F0',
                        bgcolor: isSelected ? '#F0F9FF' : '#FFFFFF',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: '#0284C7',
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
                                bgcolor: isSelected ? '#0284C7' : '#F1F5F9',
                                color: isSelected ? '#FFF' : '#334155'
                              }}
                            />
                            {m.ebm_priority && (
                              <Chip
                                label={m.ebm_priority}
                                size="small"
                                sx={{
                                  fontSize: '0.62rem',
                                  height: 18,
                                  fontWeight: 800,
                                  bgcolor: m.ebm_priority === 'P1' ? '#ECFDF5' : m.ebm_priority === 'P0-STOP' ? '#FEF2F2' : '#F0F9FF',
                                  color: m.ebm_priority === 'P1' ? '#047857' : m.ebm_priority === 'P0-STOP' ? '#DC2626' : '#0284C7'
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {m.navigation_type === 'us_guided' && (
                              <Chip icon={<UltrasoundIcon sx={{ fontSize: '11px !important' }} />} label="УЗИ" size="small" sx={{ fontSize: '0.62rem', height: 18, bgcolor: '#EFF6FF', color: '#1D4ED8' }} />
                            )}
                            {isStop && (
                              <Chip icon={<WarningIcon sx={{ fontSize: '11px !important', color: '#DC2626 !important' }} />} label="STOP" size="small" sx={{ fontSize: '0.62rem', height: 18, bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 800 }} />
                            )}
                          </Box>
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
                <Typography color="text.secondary">Выберите манипуляцию слева или нажмите «Создать манипуляцию»</Typography>
              </Box>
            ) : (
              <>
                {/* Header Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5, mb: 2, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      {isNewMode ? 'Создание новой манипуляции' : `Редактирование: ${editorItem.name}`}
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
                      helperText={isNewMode ? 'Например: INJ_KNEE_HA_US' : 'Код нельзя изменить'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      label="Клиническое наименование процедуры"
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
                      <InputLabel>Приоритет EBM</InputLabel>
                      <Select
                        label="Приоритет EBM"
                        value={editorItem.ebm_priority || 'P2'}
                        onChange={(e) => setEditorItem({ ...editorItem, ebm_priority: e.target.value })}
                      >
                        <MenuItem value="P1">⭐ P1: Золотой стандарт (Urgent/Primary)</MenuItem>
                        <MenuItem value="P2">🎯 P2: Таргетная терапия (Ортобиология/HA)</MenuItem>
                        <MenuItem value="P3">🔍 P3: Адъювантная манипуляция / ПИР</MenuItem>
                        <MenuItem value="P0-STOP">🚨 P0-STOP: Запрет / Ограничение</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Тип навигации</InputLabel>
                      <Select
                        label="Тип навигации"
                        value={editorItem.navigation_type || 'us_guided'}
                        onChange={(e) => setEditorItem({ ...editorItem, navigation_type: e.target.value })}
                      >
                        <MenuItem value="us_guided">📡 УЗИ-навигация (US-guided)</MenuItem>
                        <MenuItem value="landmark">🖐️ Пальпаторные анатомические ориентиры</MenuItem>
                        <MenuItem value="c_arm">☢️ Рентген-контроль (ЭОП / C-Arm)</MenuItem>
                        <MenuItem value="none">Без инструментальной навигации</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Фармакологический класс / Препарат"
                      size="small"
                      fullWidth
                      placeholder="Напр. Гиалуроновая кислота 2%, PRP, Бетаметазон"
                      value={editorItem.drug_class || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, drug_class: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Анатомический доступ"
                      size="small"
                      fullWidth
                      placeholder="Напр. Верхнелатеральный, передний парапателлярный"
                      value={editorItem.anatomical_access || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, anatomical_access: e.target.value })}
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

                {/* CDSS Safety & Red Flag Stop Rule */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 1.5, bgcolor: editorItem.is_stop_warning ? '#FEF2F2' : '#FFFFFF', borderColor: editorItem.is_stop_warning ? '#FCA5A5' : '#E2E8F0' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!editorItem.is_stop_warning}
                        onChange={(e) => setEditorItem({ ...editorItem, is_stop_warning: e.target.checked ? 1 : 0 })}
                        color="error"
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: editorItem.is_stop_warning ? '#DC2626' : '#1E293B' }}>
                          🚨 CDSS STOP Red Flag (Красный флаг безопасности)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Блокировать или предупреждать врача о противопоказании при назначении данного вмешательства
                        </Typography>
                      </Box>
                    }
                  />
                  {!!editorItem.is_stop_warning && (
                    <TextField
                      label="Обоснование запрета (Stop Rationale)"
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      sx={{ mt: 1.5 }}
                      placeholder="Напр. Категорически противопоказано при остром септическом артрите или коагулопатии..."
                      value={editorItem.stop_rationale || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, stop_rationale: e.target.value })}
                    />
                  )}
                </Paper>

                {/* Clinical Protocols & Instructions */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B', mb: 1.5 }}>
                  Клинические протоколы, показания и методология выполнения
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Клинические показания к проведению"
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
                      label="Техника выполнения и протокол навигации"
                      size="small"
                      fullWidth
                      multiline
                      rows={3}
                      value={editorItem.technique_details || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, technique_details: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Подготовка пациента к процедуре"
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      value={editorItem.patient_preparation || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, patient_preparation: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Пострежимный уход и наблюдение"
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      value={editorItem.post_procedure_care || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, post_procedure_care: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Противопоказания и ограничения"
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
        <DialogTitle sx={{ fontWeight: 800, color: '#DC2626' }}>Архивировать манипуляцию?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите перенести манипуляцию <b>{editorItem?.name}</b> ({editorItem?.code}) в архив?
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
        category="manipulation"
        title="Клиническое руководство по манипуляциям и инъекционной терапии"
      />
    </Box>
  );
}
