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
  DirectionsRun as RunIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  AttachMoney as CashIcon,
  MenuBook as MenuBookIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import TreatmentGuidanceModal from './TreatmentGuidanceModal';

export interface LfkItem {
  id?: number;
  code: string;
  name: string;
  short_name?: string;
  exercise_type: string;
  target_joint: string;
  target_muscle_group?: string;
  kinetic_chain?: string;
  default_phase?: string;
  default_stage_step?: string;
  standard_dosage?: string;
  tempo_formula?: string;
  equipment_tags?: string;
  technique_description?: string;
  contraindications_notes?: string;
  servdict_id?: number | null;
  servdict_name?: string | null;
  servdict_price?: number | null;
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

const KINETIC_CHAIN_CONFIG: Record<string, { label: string; short: string; color: string; bg: string }> = {
  all: { label: 'Все цепи', short: 'Все', color: '#0F3C64', bg: '#F1F5F9' },
  CKC: { label: 'CKC: Закрытая кинематическая цепь', short: 'CKC Закрытая', color: '#6D28D9', bg: '#F5F3FF' },
  OKC: { label: 'OKC: Открытая кинематическая цепь', short: 'OKC Открытая', color: '#1D4ED8', bg: '#EFF6FF' },
  PNF: { label: 'PNF: Проприоцептивное облегчение', short: 'PNF', color: '#C2410C', bg: '#FFF7ED' },
  CORE: { label: 'CORE: Стабилизация кора и таза', short: 'CORE', color: '#BE185D', bg: '#FDF2F8' },
  ECC: { label: 'ECC: Эксцентрика (HSR / Альфредсон)', short: 'ECC Эксцентрика', color: '#A16207', bg: '#FEFCE8' }
};

interface Props {
  onCatalogChanged?: () => void;
}

export default function LfkCatalogManager({ onCatalogChanged }: Props) {
  const [items, setItems] = useState<LfkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJoint, setSelectedJoint] = useState('all');
  const [selectedChain, setSelectedChain] = useState('all');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Editor State
  const [editorItem, setEditorItem] = useState<LfkItem | null>(null);
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
      const res = await fetch('/api/ortho/treatments/lfk');
      const data = await res.json();
      if (data.success && Array.isArray(data.lfk)) {
        setItems(data.lfk);
        if (data.lfk.length > 0 && !selectedCode && !isNewMode) {
          selectItem(data.lfk[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load LFK catalog:', e);
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

  const selectItem = (item: LfkItem) => {
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
      short_name: '',
      exercise_type: 'Силовое / Укрепление',
      target_joint: selectedJoint !== 'all' ? selectedJoint : 'knee',
      target_muscle_group: '',
      kinetic_chain: 'CKC',
      default_phase: 'Phase 1',
      default_stage_step: 'Ступень 1',
      standard_dosage: '3 подхода × 12 повторений',
      tempo_formula: '3-1-3',
      equipment_tags: '',
      technique_description: '',
      contraindications_notes: '',
      servdict_id: null,
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
        ? '/api/ortho/treatments/lfk'
        : `/api/ortho/treatments/lfk/${encodeURIComponent(editorItem.code)}`;
      const method = isNewMode ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editorItem)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: isNewMode ? 'Упражнение успешно создано!' : 'Упражнение обновлено!' });
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
      const res = await fetch(`/api/ortho/treatments/lfk/${encodeURIComponent(editorItem.code)}`, {
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
      if (selectedChain !== 'all' && m.kinetic_chain !== selectedChain) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchCode = m.code?.toLowerCase().includes(q);
        const matchMuscle = m.target_muscle_group?.toLowerCase().includes(q);
        const matchTech = m.technique_description?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchMuscle && !matchTech) return false;
      }
      return true;
    });
  }, [items, selectedJoint, selectedChain, searchQuery]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Top Banner / Toolbar */}
      <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#ECFDF5', color: '#047857', display: 'flex' }}>
              <RunIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                Справочник ЛФК и кинезиотерапии ({items.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Поэтапные упражнения реабилитации (Фазы I–III), биомеханические цепи (CKC/OKC/PNF/CORE), формулы темпа и дозировка
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
              Создать упражнение
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
              placeholder="Поиск по упражнению, мышцам, коду..."
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

            {/* Kinetic Chain Filter Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5, pb: 1, borderBottom: '1px solid #E2E8F0' }}>
              {Object.entries(KINETIC_CHAIN_CONFIG).map(([k, cfg]) => {
                const isSelected = selectedChain === k;
                return (
                  <Chip
                    key={k}
                    label={cfg.short}
                    size="small"
                    clickable
                    onClick={() => setSelectedChain(k)}
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
                <Alert severity="info" sx={{ mt: 2 }}>Упражнения ЛФК не найдены</Alert>
              ) : (
                filteredItems.map((m) => {
                  const isSelected = selectedCode === m.code && !isNewMode;
                  const hasPrice = !!m.servdict_id;
                  const chain = KINETIC_CHAIN_CONFIG[m.kinetic_chain || 'CKC'] || KINETIC_CHAIN_CONFIG.all;

                  return (
                    <Card
                      key={m.code}
                      variant="outlined"
                      onClick={() => selectItem(m)}
                      sx={{
                        mb: 1.25,
                        cursor: 'pointer',
                        borderRadius: 1.5,
                        borderLeft: `4px solid ${chain.color}`,
                        borderColor: isSelected ? '#047857' : '#E2E8F0',
                        bgcolor: isSelected ? '#ECFDF5' : '#FFFFFF',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: '#047857',
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
                                bgcolor: isSelected ? '#047857' : '#F1F5F9',
                                color: isSelected ? '#FFF' : '#334155'
                              }}
                            />
                            {m.default_phase && (
                              <Chip
                                label={m.default_phase}
                                size="small"
                                sx={{
                                  fontSize: '0.62rem',
                                  height: 18,
                                  fontWeight: 800,
                                  bgcolor: '#EFF6FF',
                                  color: '#1D4ED8'
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
                            <Chip
                              label={chain.short}
                              size="small"
                              sx={{ fontSize: '0.62rem', height: 18, bgcolor: chain.bg, color: chain.color, fontWeight: 700 }}
                            />
                            {m.tempo_formula && (
                              <Chip
                                icon={<TimerIcon sx={{ fontSize: '11px !important' }} />}
                                label={m.tempo_formula}
                                size="small"
                                sx={{ fontSize: '0.62rem', height: 18, bgcolor: '#F8FAFC' }}
                              />
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
                              Базовый
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
                <Typography color="text.secondary">Выберите упражнение слева или нажмите «Создать упражнение»</Typography>
              </Box>
            ) : (
              <>
                {/* Header Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5, mb: 2, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      {isNewMode ? 'Создание упражнения ЛФК' : `Редактирование: ${editorItem.name}`}
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
                      helperText={isNewMode ? 'Например: LFK_KNEE_QUAD_ISO' : 'Код нельзя изменить'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      label="Полное наименование упражнения"
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
                      <InputLabel>Кинематическая цепь</InputLabel>
                      <Select
                        label="Кинематическая цепь"
                        value={editorItem.kinetic_chain || 'CKC'}
                        onChange={(e) => setEditorItem({ ...editorItem, kinetic_chain: e.target.value })}
                      >
                        <MenuItem value="CKC">🟣 CKC: Закрытая кинематическая цепь</MenuItem>
                        <MenuItem value="OKC">🔵 OKC: Открытая кинематическая цепь</MenuItem>
                        <MenuItem value="PNF">🟠 PNF: Проприоцептивное облегчение</MenuItem>
                        <MenuItem value="CORE">🔴 CORE: Стабилизация кора и таза</MenuItem>
                        <MenuItem value="ISOM">🟡 Изометрия (Статическая нагрузка)</MenuItem>
                        <MenuItem value="ECC">🟤 Эксцентрика (HSR / Альфредсон)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Фаза реабилитации</InputLabel>
                      <Select
                        label="Фаза реабилитации"
                        value={editorItem.default_phase || 'Phase 1'}
                        onChange={(e) => setEditorItem({ ...editorItem, default_phase: e.target.value })}
                      >
                        <MenuItem value="Phase 1">Фаза 1: Острая / Защита и активация</MenuItem>
                        <MenuItem value="Phase 2">Фаза 2: Подострая / Гипертрофия и сила</MenuItem>
                        <MenuItem value="Phase 3">Фаза 3: Продвинутая / Плиометрика и спорт</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Целевая мышечная группа"
                      size="small"
                      fullWidth
                      placeholder="Напр. Четырехглавая мышца, VMO, хамстринги"
                      value={editorItem.target_muscle_group || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, target_muscle_group: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Стандартная дозировка"
                      size="small"
                      fullWidth
                      placeholder="Напр. 3 подхода × 12 повторений"
                      value={editorItem.standard_dosage || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, standard_dosage: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Формула темпа и паузы"
                      size="small"
                      fullWidth
                      placeholder="Напр. 3-1-3 (эксцентрика-пауза-концентрика)"
                      value={editorItem.tempo_formula || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, tempo_formula: e.target.value })}
                    />
                  </Grid>
                </Grid>

                {/* Medwork Clinic Price Link */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 1.5, bgcolor: '#F8FAFC' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CashIcon fontSize="small" color="success" /> Привязка к позиции прайс-листа клиники Медворк (Индивидуальное занятие ЛФК)
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

                {/* Protocols and Instructions */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B', mb: 1.5 }}>
                  Методология упражнения, биомеханика и оборудование
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Биомеханическая цель и техника выполнения"
                      size="small"
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Исходное положение, траектория движения, дыхание, контроль угла сгибания..."
                      value={editorItem.technique_description || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, technique_description: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Необходимое оборудование / Инвентарь"
                      size="small"
                      fullWidth
                      placeholder="Напр. Эластичная лента TheraBand, балансировочная подушка"
                      value={editorItem.equipment_tags || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, equipment_tags: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Противопоказания и болевые критерии отмены"
                      size="small"
                      fullWidth
                      placeholder="Напр. Боль > 4 баллов по ВАШ, синовит, нестабильность"
                      value={editorItem.contraindications_notes || ''}
                      onChange={(e) => setEditorItem({ ...editorItem, contraindications_notes: e.target.value })}
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
        <DialogTitle sx={{ fontWeight: 800, color: '#DC2626' }}>Архивировать упражнение?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите перенести упражнение ЛФК <b>{editorItem?.name}</b> ({editorItem?.code}) в архив?
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
        category="lfk"
        title="Клиническое руководство по лечебной физкультуре и кинезиотерапии"
      />
    </Box>
  );
}
