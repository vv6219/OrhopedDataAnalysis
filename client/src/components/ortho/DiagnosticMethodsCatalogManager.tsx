import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Biotech as BiotechIcon,
  AttachMoney as CashIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Visibility as PreviewIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';

import DiagnosticMethodGuidanceModal from './DiagnosticMethodGuidanceModal';

export interface DiagnosticMethodItem {
  code: string;
  name: string;
  modality: string;
  target_joint: string;
  servdict_id?: number | null;
  clinical_indications?: string | null;
  protocol_phrase: string;
  priority_level: string;
  is_active: number;
  sort_order: number;
  servdict_name?: string | null;
  servdict_price?: number | null;
  servdict_code?: string | null;
  templates_count?: number;
  description?: string | null;
  technique_details?: string | null;
  patient_preparation?: string | null;
  diagnostic_criteria?: string | null;
  contraindications?: string | null;
}

interface DiagnosticMethodsCatalogManagerProps {
  onCatalogChanged?: () => void;
}

const MODALITY_CONFIG: Record<string, { label: string; color: string }> = {
  all: { label: 'Все модальности', color: '#0F3C64' },
  xray: { label: 'Рентген', color: '#0284C7' },
  mri: { label: 'МРТ', color: '#7C3AED' },
  ct: { label: 'КТ', color: '#D97706' },
  ultrasound: { label: 'УЗИ', color: '#059669' },
  lab: { label: 'Лаборатория', color: '#DC2626' },
  enmg: { label: 'ЭНМГ', color: '#4B5563' },
  plantography: { label: 'Плантография', color: '#0891B2' }
};

const JOINT_OPTIONS = [
  { key: 'all', label: 'Все суставы' },
  { key: 'knee', label: 'Коленный' },
  { key: 'elbow', label: 'Локтевой' },
  { key: 'shoulder', label: 'Плечевой' },
  { key: 'hip', label: 'Тазобедренный' },
  { key: 'ankle', label: 'Стопа/Голеностоп' },
  { key: 'wrist', label: 'Кисть/Запястье' },
  { key: 'spine', label: 'Позвоночник' },
  { key: 'general', label: 'Общие / Все зоны' }
];

export default function DiagnosticMethodsCatalogManager({ onCatalogChanged }: DiagnosticMethodsCatalogManagerProps) {
  // Catalog List State
  const [methods, setMethods] = useState<DiagnosticMethodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState('all');
  const [selectedJoint, setSelectedJoint] = useState('all');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Editor State
  const [editorMethod, setEditorMethod] = useState<DiagnosticMethodItem | null>(null);
  const [isNewMode, setIsNewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  // Clinic Services Autocomplete Cache
  const [servicesOptions, setServicesOptions] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Delete Confirm Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [guidanceModalOpen, setGuidanceModalOpen] = useState(false);

  useEffect(() => {
    fetchMethods();
    fetchServices('');
  }, []);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ortho/diagnostics/catalog?includeInactive=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.diagnostics)) {
        setMethods(data.diagnostics);
        if (data.diagnostics.length > 0 && !selectedCode && !isNewMode) {
          selectMethod(data.diagnostics[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load diagnostics catalog:', e);
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

  const selectMethod = (m: DiagnosticMethodItem) => {
    setSelectedCode(m.code);
    setIsNewMode(false);
    setEditorMethod({ ...m });
    setStatusMessage({ type: '', text: '' });
  };

  const startCreateNew = () => {
    setIsNewMode(true);
    setSelectedCode(null);
    setEditorMethod({
      code: '',
      name: '',
      modality: 'xray',
      target_joint: selectedJoint !== 'all' ? selectedJoint : 'knee',
      servdict_id: null,
      clinical_indications: '',
      protocol_phrase: '',
      priority_level: 'primary',
      is_active: 1,
      sort_order: 10
    });
    setStatusMessage({ type: '', text: '' });
  };

  // Filtered List
  const filteredMethods = useMemo(() => {
    return methods.filter((m) => {
      if (selectedModality !== 'all' && m.modality !== selectedModality) return false;
      if (selectedJoint !== 'all' && m.target_joint !== selectedJoint && m.target_joint !== 'general') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchCode = m.code?.toLowerCase().includes(q);
        const matchPhrase = m.protocol_phrase?.toLowerCase().includes(q);
        const matchIndications = m.clinical_indications?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPhrase && !matchIndications) return false;
      }
      return true;
    });
  }, [methods, selectedModality, selectedJoint, searchQuery]);

  // Save Method (Create or Update)
  const handleSave = async () => {
    if (!editorMethod) return;

    if (!editorMethod.code?.trim() || !editorMethod.name?.trim() || !editorMethod.protocol_phrase?.trim()) {
      setStatusMessage({ type: 'error', text: 'Пожалуйста, заполните код, наименование и протокольную фразу' });
      return;
    }

    setSaving(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const url = isNewMode
        ? '/api/ortho/diagnostics/catalog'
        : `/api/ortho/diagnostics/catalog/${editorMethod.code}`;
      const method = isNewMode ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editorMethod)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Ошибка при сохранении метода');
      }

      setStatusMessage({ type: 'success', text: isNewMode ? 'Метод диагностики успешно добавлен!' : 'Изменения сохранены!' });
      setIsNewMode(false);
      setSelectedCode(editorMethod.code);
      fetchMethods();
      if (onCatalogChanged) onCatalogChanged();
    } catch (err: any) {
      console.error('Error saving diagnostic method:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  };

  // Delete or Deactivate Method
  const handleDelete = async (force: boolean = false) => {
    if (!editorMethod) return;

    try {
      const res = await fetch(`/api/ortho/diagnostics/catalog/${editorMethod.code}${force ? '?force=true' : ''}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Ошибка при удалении');
      }

      setDeleteConfirmOpen(false);
      setStatusMessage({ type: 'success', text: data.message || 'Метод удален' });
      fetchMethods();
      if (onCatalogChanged) onCatalogChanged();
    } catch (err: any) {
      console.error('Error deleting diagnostic method:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Ошибка удаления' });
    }
  };

  // Find linked servdict object
  const currentLinkedService = useMemo(() => {
    if (!editorMethod?.servdict_id) return null;
    return servicesOptions.find((s) => s.id === editorMethod.servdict_id) || {
      id: editorMethod.servdict_id,
      name: editorMethod.servdict_name || `Услуга #${editorMethod.servdict_id}`,
      price: editorMethod.servdict_price || 0,
      code: editorMethod.servdict_code || ''
    };
  }, [editorMethod, servicesOptions]);

  // Joint counts map
  const jointCounts = useMemo(() => {
    const counts: Record<string, number> = { all: methods.length };
    methods.forEach((m) => {
      if (m.target_joint) {
        counts[m.target_joint] = (counts[m.target_joint] || 0) + 1;
      }
    });
    return counts;
  }, [methods]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Banner / Stats */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BiotechIcon sx={{ fontSize: 28, color: '#0F3C64' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.15rem' }}>
              Каталог методов диагностики и инструментальных исследований
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Рентген, МРТ, КТ, УЗИ, Лаборатория и функциональные пробы с интеграцией в прайс-лист клиники
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MenuBookIcon />}
            onClick={() => setGuidanceModalOpen(true)}
            sx={{
              color: '#0284C7',
              borderColor: '#BAE6FD',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: '#F0F9FF', borderColor: '#0284C7' }
            }}
          >
            Клинический гид
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchMethods();
              fetchServices('');
            }}
            sx={{ fontWeight: 600, textTransform: 'none' }}
          >
            Обновить
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={startCreateNew}
            sx={{ bgcolor: '#0284C7', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#0369A1' } }}
          >
            Новый метод диагностики
          </Button>
        </Box>
      </Paper>

      {/* Main 2-Column Master-Detail Layout */}
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* LEFT PANEL: Master List (35% Width) */}
        <Grid size={{ xs: 12, md: 4.5, lg: 4 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: 'calc(100vh - 210px)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF'
            }}
          >
            {/* Search Input */}
            <TextField
              size="small"
              fullWidth
              placeholder="Поиск по названию, коду или показаниям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                }
              }}
              sx={{ mb: 1.5 }}
            />

            {/* Modality Filter Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {Object.entries(MODALITY_CONFIG).map(([key, cfg]) => {
                const count = key === 'all'
                  ? methods.length
                  : methods.filter(m => m.modality === key).length;
                return (
                  <Chip
                    key={key}
                    label={`${cfg.label} (${count})`}
                    size="small"
                    clickable
                    onClick={() => setSelectedModality(key)}
                    color={selectedModality === key ? 'primary' : 'default'}
                    variant={selectedModality === key ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: selectedModality === key ? 700 : 500,
                      fontSize: '0.72rem',
                      height: 24
                    }}
                  />
                );
              })}
            </Box>

            {/* Joint Filter Chips with counted numbers */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
              {JOINT_OPTIONS.map((j) => {
                const count = jointCounts[j.key] || 0;
                return (
                  <Chip
                    key={j.key}
                    label={`${j.label} (${count})`}
                    size="small"
                    clickable
                    onClick={() => setSelectedJoint(j.key)}
                    color={selectedJoint === j.key ? 'secondary' : 'default'}
                    variant={selectedJoint === j.key ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: selectedJoint === j.key ? 700 : 500,
                      fontSize: '0.68rem',
                      height: 20
                    }}
                  />
                );
              })}
            </Box>

            <Divider sx={{ mb: 1 }} />

            {/* Methods Scrollable List */}
            <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : filteredMethods.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#64748B', textAlign: 'center', py: 4 }}>
                  Методы диагностики не найдены
                </Typography>
              ) : (
                filteredMethods.map((m) => {
                  const isSelected = selectedCode === m.code && !isNewMode;
                  const modCfg = MODALITY_CONFIG[m.modality] || { label: m.modality, color: '#64748B' };

                  return (
                    <Box
                      key={m.code}
                      onClick={() => selectMethod(m)}
                      sx={{
                        p: 1.25,
                        mb: 1,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: isSelected ? '#0284C7' : '#E2E8F0',
                        bgcolor: isSelected ? '#F0F9FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: '#94A3B8',
                          bgcolor: isSelected ? '#F0F9FF' : '#F8FAFC'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: isSelected ? '#0369A1' : '#1E293B',
                            fontSize: '0.85rem',
                            lineHeight: 1.25
                          }}
                        >
                          {m.name}
                        </Typography>
                        {m.is_active === 1 ? (
                          <ActiveIcon sx={{ fontSize: 16, color: '#16A34A', flexShrink: 0, mt: 0.2 }} />
                        ) : (
                          <InactiveIcon sx={{ fontSize: 16, color: '#94A3B8', flexShrink: 0, mt: 0.2 }} />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.6, mt: 0.75 }}>
                        <Chip
                          label={m.code}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.68rem',
                            height: 18,
                            bgcolor: '#F1F5F9',
                            color: '#475569'
                          }}
                        />
                        <Chip
                          label={modCfg.label}
                          size="small"
                          sx={{
                            fontSize: '0.68rem',
                            height: 18,
                            fontWeight: 700,
                            bgcolor: `${modCfg.color}15`,
                            color: modCfg.color
                          }}
                        />
                        {m.servdict_price ? (
                          <Chip
                            icon={<CashIcon sx={{ fontSize: '13px !important' }} />}
                            label={`${m.servdict_price.toLocaleString('ru-RU')} ₽`}
                            size="small"
                            sx={{
                              fontSize: '0.68rem',
                              height: 18,
                              fontWeight: 700,
                              bgcolor: '#DCFCE7',
                              color: '#166534'
                            }}
                          />
                        ) : (
                          <Chip
                            label="Внешнее"
                            size="small"
                            sx={{
                              fontSize: '0.68rem',
                              height: 18,
                              bgcolor: '#F3F4F6',
                              color: '#6B7280'
                            }}
                          />
                        )}
                        {m.templates_count !== undefined && m.templates_count > 0 && (
                          <Chip
                            label={`В ${m.templates_count} шабл.`}
                            size="small"
                            sx={{
                              fontSize: '0.68rem',
                              height: 18,
                              bgcolor: '#EFF6FF',
                              color: '#1E40AF',
                              fontWeight: 600
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Paper>
        </Grid>

        {/* RIGHT PANEL: Method Detail Editor (65% Width) */}
        <Grid size={{ xs: 12, md: 7.5, lg: 8 }} sx={{ height: '100%' }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              height: 'calc(100vh - 210px)',
              overflowY: 'auto',
              borderRadius: 2,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {statusMessage.text && (
              <Alert
                severity={statusMessage.type === 'success' ? 'success' : 'error'}
                onClose={() => setStatusMessage({ type: '', text: '' })}
                sx={{ mb: 2 }}
              >
                {statusMessage.text}
              </Alert>
            )}

            {!editorMethod ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 1 }}>
                <BiotechIcon sx={{ fontSize: 48, color: '#94A3B8' }} />
                <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Выберите метод диагностики слева или создайте новый
                </Typography>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={startCreateNew} sx={{ mt: 1 }}>
                  Создать метод
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
                {/* Editor Header Bar */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.15rem' }}>
                      {isNewMode ? 'Создание нового метода диагностики' : `Редактирование: ${editorMethod.name}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {isNewMode ? 'Заполните параметры метода и привяжите к кассовой услуге клиники' : `Уникальный системный код: ${editorMethod.code}`}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!isNewMode && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteConfirmOpen(true)}
                        sx={{ fontWeight: 600 }}
                      >
                        Удалить
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={saving}
                      sx={{ bgcolor: '#0284C7', fontWeight: 700, '&:hover': { bgcolor: '#0369A1' } }}
                    >
                      {saving ? 'Сохранение...' : 'Сохранить изменения'}
                    </Button>
                  </Box>
                </Box>

                <Divider />

                {/* Section 1: Main Identification & Modality */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Системный код (ID)"
                      value={editorMethod.code}
                      onChange={(e) => setEditorMethod({ ...editorMethod, code: e.target.value })}
                      disabled={!isNewMode}
                      helperText={isNewMode ? 'Латинские буквы, например: us_knee_patella' : 'Уникальный ключ в базе данных'}
                      slotProps={{
                        input: {
                          sx: { fontFamily: 'monospace', fontWeight: 600 }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Полное наименование исследования"
                      value={editorMethod.name}
                      onChange={(e) => setEditorMethod({ ...editorMethod, name: e.target.value })}
                      placeholder="Например: Рентгенография локтевого сустава (2 проекции)"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Модальность</InputLabel>
                      <Select
                        value={editorMethod.modality}
                        label="Модальность"
                        onChange={(e) => setEditorMethod({ ...editorMethod, modality: e.target.value })}
                      >
                        <MenuItem value="xray">Рентген (Рентгенография)</MenuItem>
                        <MenuItem value="mri">МРТ (Томография)</MenuItem>
                        <MenuItem value="ct">КТ (Компьютерная томография)</MenuItem>
                        <MenuItem value="ultrasound">УЗИ (Ультразвуковое исследование)</MenuItem>
                        <MenuItem value="lab">Лаборатория (Анализы, Синовия, Кровь)</MenuItem>
                        <MenuItem value="enmg">ЭНМГ (Электронейромиография)</MenuItem>
                        <MenuItem value="plantography">Плантография (Подометрия / Стельки)</MenuItem>
                        <MenuItem value="functional">Функциональная диагностика</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Анатомическая область (Сустав)</InputLabel>
                      <Select
                        value={editorMethod.target_joint}
                        label="Анатомическая область (Сустав)"
                        onChange={(e) => setEditorMethod({ ...editorMethod, target_joint: e.target.value })}
                      >
                        <MenuItem value="knee">Коленный сустав</MenuItem>
                        <MenuItem value="elbow">Локтевой сустав</MenuItem>
                        <MenuItem value="shoulder">Плечевой сустав</MenuItem>
                        <MenuItem value="hip">Тазобедренный сустав</MenuItem>
                        <MenuItem value="ankle">Стопа и голеностоп</MenuItem>
                        <MenuItem value="wrist">Кисть и запястье</MenuItem>
                        <MenuItem value="spine">Позвоночник</MenuItem>
                        <MenuItem value="general">Общая / Универсальная (для любых зон)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Линия приоритета</InputLabel>
                      <Select
                        value={editorMethod.priority_level || 'primary'}
                        label="Линия приоритета"
                        onChange={(e) => setEditorMethod({ ...editorMethod, priority_level: e.target.value })}
                      >
                        <MenuItem value="primary">Первоочередное (Золотой стандарт)</MenuItem>
                        <MenuItem value="secondary">Второй линии (Уточняющее)</MenuItem>
                        <MenuItem value="optional">Факультативное (По показаниям)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Section 2: Integration with Clinic Price (servdict) */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: editorMethod.servdict_id ? '#F0FDF4' : '#F8FAFC',
                    borderColor: editorMethod.servdict_id ? '#86EFAC' : '#E2E8F0'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {editorMethod.servdict_id ? (
                        <LinkIcon sx={{ color: '#16A34A', fontSize: 22 }} />
                      ) : (
                        <LinkOffIcon sx={{ color: '#64748B', fontSize: 22 }} />
                      )}
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                        Связка с платной услугой клиники (Прейскурант servdict)
                      </Typography>
                    </Box>

                    {editorMethod.servdict_id && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<LinkOffIcon />}
                        onClick={() =>
                          setEditorMethod({
                            ...editorMethod,
                            servdict_id: null,
                            servdict_name: null,
                            servdict_price: null,
                            servdict_code: null
                          })
                        }
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Отвязать услугу (Внешнее направление)
                      </Button>
                    )}
                  </Box>

                  <Autocomplete
                    size="small"
                    options={servicesOptions}
                    loading={servicesLoading}
                    value={currentLinkedService}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return `${option.name} [Код: ${option.code || option.id}] — ${(option.price || 0).toLocaleString('ru-RU')} ₽`;
                    }}
                    onInputChange={(_, val) => {
                      if (val && val.length >= 2) fetchServices(val);
                    }}
                    onChange={(_, selected) => {
                      if (selected) {
                        setEditorMethod({
                          ...editorMethod,
                          servdict_id: selected.id,
                          servdict_name: selected.name,
                          servdict_price: selected.price,
                          servdict_code: selected.code
                        });
                      } else {
                        setEditorMethod({
                          ...editorMethod,
                          servdict_id: null,
                          servdict_name: null,
                          servdict_price: null,
                          servdict_code: null
                        });
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Поиск по прейскуранту клиники (Рентген, УЗИ, Лаборатория...)"
                        placeholder="Введите название или код услуги..."
                        helperText={
                          editorMethod.servdict_id
                            ? `Привязано: ${editorMethod.servdict_name || ''} — тариф: ${(editorMethod.servdict_price || 0).toLocaleString('ru-RU')} ₽. Врач в АРМ сможет начислить услугу в кассу в 1 клик.`
                            : 'Услуга не привязана. Метод будет выводиться как внешнее направление в протоколе без начисления в кассу.'
                        }
                      />
                    )}
                  />
                </Paper>

                {/* Section 3: Clinical Indications & Protocol Phrasing */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Клинические показания к назначению"
                      multiline
                      minRows={2}
                      value={editorMethod.clinical_indications || ''}
                      onChange={(e) => setEditorMethod({ ...editorMethod, clinical_indications: e.target.value })}
                      placeholder="Обоснование необходимости исследования (подозрение на разрыв, стадия артроза, синовит...)"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Юридически точная формулировка для протокола осмотра (План обследования)"
                      multiline
                      minRows={3}
                      value={editorMethod.protocol_phrase}
                      onChange={(e) => setEditorMethod({ ...editorMethod, protocol_phrase: e.target.value })}
                      placeholder="Формулировка, которая вставляется в официальный протокол осмотра и план лечения пациента..."
                      helperText="Именно этот текст подставляется в протокол и лист рекомендаций при нажатии кнопки «+ В план»"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Клиническое описание и физическая сущность исследования (EBM)"
                      multiline
                      minRows={3}
                      value={editorMethod.description || ''}
                      onChange={(e) => setEditorMethod({ ...editorMethod, description: e.target.value })}
                      placeholder="Подробное описание: что визуализирует, физический принцип, точность, диагностическая роль..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Методика проведения, укладки и протоколы сканирования"
                      multiline
                      minRows={3}
                      value={editorMethod.technique_details || ''}
                      onChange={(e) => setEditorMethod({ ...editorMethod, technique_details: e.target.value })}
                      placeholder="Укладки (Розенберг, Merchant, Saltzman, Dunn, Zanca), последовательности МРТ (PD-FS, T1, STIR), датчики УЗИ..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Подготовка пациента к исследованию"
                      multiline
                      minRows={2.5}
                      value={editorMethod.patient_preparation || ''}
                      onChange={(e) => setEditorMethod({ ...editorMethod, patient_preparation: e.target.value })}
                      placeholder="Натощак, снятие металла, свободная одежда, подготовка к контрасту..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Противопоказания и клинические ограничения"
                      multiline
                      minRows={2.5}
                      value={editorMethod.contraindications || ''}
                      onChange={(e) => setEditorMethod({ ...editorMethod, contraindications: e.target.value })}
                      placeholder="Кардиостимуляторы, беременность, аллергия на йод, СКФ < 30 мл/мин, клаустрофобия..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Диагностические критерии и валидированные шкалы (EBM)"
                      multiline
                      minRows={3}
                      value={editorMethod.diagnostic_criteria || ''}
                      onChange={(e) => setEditorMethod({ ...editorMethod, diagnostic_criteria: e.target.value })}
                      placeholder="Шкалы Kellgren-Lawrence, Stoller, Rockwood, Outerbridge, Walch, Dejour, TT-TG, HKA..."
                    />
                  </Grid>
                </Grid>

                {/* Section 4: Live Preview of Doctor Workstation Card */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#F8FAFC',
                    border: '1px dashed #CBD5E1'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PreviewIcon sx={{ fontSize: 16 }} /> Превью карточки в АРМ врача:
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<MenuBookIcon />}
                      onClick={() => setGuidanceModalOpen(true)}
                      sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}
                    >
                      Посмотреть полное окно описания (i)
                    </Button>
                  </Box>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid #E2E8F0',
                      bgcolor: '#FFFFFF',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 260 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                          {editorMethod.name || 'Название исследования'}
                        </Typography>
                        <Chip
                          label={MODALITY_CONFIG[editorMethod.modality]?.label || editorMethod.modality}
                          size="small"
                          sx={{ fontSize: '0.68rem', height: 20, fontWeight: 700 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block', lineHeight: 1.3 }}>
                        «{editorMethod.protocol_phrase || 'Формулировка направления'}»
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none' }}
                      >
                        + В протокол
                      </Button>
                      {editorMethod.servdict_price ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CashIcon />}
                          sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none' }}
                        >
                          + В кассу ({(editorMethod.servdict_price || 0).toLocaleString('ru-RU')} ₽)
                        </Button>
                      ) : (
                        <Chip
                          label="Внешнее направление"
                          size="small"
                          sx={{ fontSize: '0.75rem', bgcolor: '#F1F5F9', color: '#64748B' }}
                        />
                      )}
                    </Box>
                  </Paper>
                </Paper>

                {/* Section 5: Status & Sorting */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editorMethod.is_active === 1}
                        onChange={(e) => setEditorMethod({ ...editorMethod, is_active: e.target.checked ? 1 : 0 })}
                        color="success"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {editorMethod.is_active === 1 ? 'Метод активен (отображается в АРМ)' : 'Метод деактивирован'}
                      </Typography>
                    }
                  />

                  <TextField
                    size="small"
                    type="number"
                    label="Порядок сортировки"
                    value={editorMethod.sort_order || 0}
                    onChange={(e) => setEditorMethod({ ...editorMethod, sort_order: Number(e.target.value) || 0 })}
                    sx={{ width: 140 }}
                  />
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Удаление метода диагностики</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Вы уверены, что хотите удалить метод диагностики <b>«{editorMethod?.name}»</b>?
          </Typography>
          <Alert severity="warning">
            Если данный метод привязан к клиническим шаблонам, он будет деактивирован, чтобы не нарушать целостность существующих протоколов.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ fontWeight: 600 }}>
            Отмена
          </Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(false)} sx={{ fontWeight: 700 }}>
            Удалить / Деактивировать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full Detailed Guidance Modal */}
      <DiagnosticMethodGuidanceModal
        open={guidanceModalOpen}
        onClose={() => setGuidanceModalOpen(false)}
        diagnostic={editorMethod}
        readOnly={true}
      />
    </Box>
  );
}
