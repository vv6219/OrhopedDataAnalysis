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
  Tooltip,
  IconButton,
  Slider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Visibility as PreviewIcon,
  InfoOutlined as InfoIcon,
  Healing as HealingIcon,
  ContentCopy as DuplicateIcon,
  Rule as RuleIcon,
  Speed as AccuracyIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import OrthoTestGuidanceModal from './OrthoTestGuidanceModal';

export interface OrthopedicTestItem {
  code: string;
  name_ru: string;
  name_lat: string;
  joint_category: string;
  target_structure: string;
  methodology: string;
  positive_criteria: string;
  sensitivity_specificity?: string | null;
  sensitivity_pct?: number | null;
  specificity_pct?: number | null;
  evidence_level?: string | null;
  patient_position?: string | null;
  doctor_hand_placement?: string | null;
  applied_force_direction?: string | null;
  false_positive_factors?: string | null;
  clinical_interpretation?: string | null;
  illustration_key?: string | null;
  icon_type?: string;
  test_type?: string | null;
  is_supplemented?: number | null;
  is_active: number;
  sort_order: number;
  templates_count?: number;
}

interface OrthopedicTestsCatalogManagerProps {
  onCatalogChanged?: () => void;
}

export const TEST_TYPE_CONFIG: Record<string, { label: string; short: string; color: string; bg: string }> = {
  provocative: { label: 'Провокационный (боль/стресс)', short: 'Провокац.', color: '#DC2626', bg: '#FEF2F2' },
  relocation: { label: 'Релокационный / вправление', short: 'Релокац.', color: '#2563EB', bg: '#EFF6FF' },
  neurodynamic: { label: 'Нейродинамический (натяжение)', short: 'Нейродин.', color: '#D97706', bg: '#FFFBEB' },
  multifactor_cluster: { label: 'Многофакторный кластер', short: 'Кластер', color: '#7C3AED', bg: '#F5F3FF' }
};

const JOINT_OPTIONS = [
  { key: 'all', label: 'Все суставы', color: '#0F3C64' },
  { key: 'knee', label: 'Коленный', color: '#156C9C' },
  { key: 'elbow', label: 'Локтевой', color: '#E65100' },
  { key: 'shoulder', label: 'Плечевой', color: '#6A1B9A' },
  { key: 'hip', label: 'Тазобедренный', color: '#2E7D32' },
  { key: 'ankle', label: 'Стопа/Голеностоп', color: '#00838F' },
  { key: 'wrist', label: 'Кисть/Запястье', color: '#AD1457' },
  { key: 'spine', label: 'Позвоночник', color: '#455A64' }
];

const ICON_TYPE_OPTIONS = [
  { key: 'joint_stress', label: 'Стресс-тест / нагрузка' },
  { key: 'nerve_percussion', label: 'Перкуссия нерва (Тиннель)' },
  { key: 'nerve_stretch', label: 'Натяжение нерва (Ласег)' },
  { key: 'nerve_compression', label: 'Компрессия нерва (Фален)' },
  { key: 'effusion', label: 'Выпот / флюктуация' },
  { key: 'tendon', label: 'Сухожильный тест' },
  { key: 'posture', label: 'Осанка / деформация' }
];

const EVIDENCE_LEVEL_OPTIONS = [
  { key: 'A', label: 'Уровень A: Рандомизированные исследования / Мета-анализы (Высокий)' },
  { key: 'B', label: 'Уровень B: Контролируемые когортные исследования (Умеренный)' },
  { key: 'C', label: 'Уровень C: Экспертные серии наблюдений и клинический консенсус' }
];

export default function OrthopedicTestsCatalogManager({ onCatalogChanged }: OrthopedicTestsCatalogManagerProps) {
  // Master List State
  const [tests, setTests] = useState<OrthopedicTestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJoint, setSelectedJoint] = useState('all');
  const [selectedTestType, setSelectedTestType] = useState<string>('all');
  const [onlySupplemented, setOnlySupplemented] = useState<boolean>(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Detail / Form State
  const [editorTest, setEditorTest] = useState<OrthopedicTestItem | null>(null);
  const [isNewMode, setIsNewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  // Delete Confirm Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Live ARM Preview Interactive Toggle State
  const [previewTestState, setPreviewTestState] = useState<'negative' | 'positive'>('negative');
  const [previewInfoOpen, setPreviewInfoOpen] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ortho/tests/catalog?includeInactive=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.tests)) {
        setTests(data.tests);
        if (data.tests.length > 0 && !selectedCode && !isNewMode) {
          selectTest(data.tests[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load tests catalog:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectTest = (t: OrthopedicTestItem) => {
    setIsNewMode(false);
    setSelectedCode(t.code);
    setEditorTest({ ...t });
    setPreviewTestState('negative');
    setStatusMessage({ type: '', text: '' });
  };

  const handleStartCreateNew = () => {
    setIsNewMode(true);
    setSelectedCode(null);
    setPreviewTestState('negative');
    setEditorTest({
      code: '',
      name_ru: '',
      name_lat: '',
      joint_category: selectedJoint === 'all' ? 'knee' : selectedJoint,
      target_structure: '',
      methodology: '',
      positive_criteria: '',
      patient_position: '',
      doctor_hand_placement: '',
      applied_force_direction: '',
      false_positive_factors: '',
      clinical_interpretation: '',
      illustration_key: 'default_joint',
      sensitivity_pct: 80,
      specificity_pct: 85,
      evidence_level: 'B',
      icon_type: 'joint_stress',
      test_type: 'provocative',
      is_supplemented: 0,
      is_active: 1,
      sort_order: 50,
      templates_count: 0
    });
    setStatusMessage({ type: '', text: '' });
  };

  const handleDuplicate = () => {
    if (!editorTest) return;
    setIsNewMode(true);
    setSelectedCode(null);
    setEditorTest({
      ...editorTest,
      code: `${editorTest.code}_copy`,
      name_ru: `${editorTest.name_ru} (копия)`,
      name_lat: editorTest.name_lat ? `${editorTest.name_lat} (copy)` : '',
      templates_count: 0
    });
    setStatusMessage({ type: 'success', text: 'Создан дубликат теста. Задайте уникальный код и сохраните.' });
  };

  const handleSave = async () => {
    if (!editorTest) return;
    if (!editorTest.code.trim()) {
      setStatusMessage({ type: 'error', text: 'Укажите уникальный код теста (например, lachman, cozen).' });
      return;
    }
    if (!editorTest.name_ru.trim()) {
      setStatusMessage({ type: 'error', text: 'Укажите наименование теста на русском языке.' });
      return;
    }
    if (!editorTest.methodology.trim()) {
      setStatusMessage({ type: 'error', text: 'Заполните методику и пошаговую технику проведения теста.' });
      return;
    }
    if (!editorTest.positive_criteria.trim()) {
      setStatusMessage({ type: 'error', text: 'Укажите критерий положительного результата.' });
      return;
    }

    setSaving(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const payload = {
        ...editorTest,
        code: editorTest.code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
        sensitivity_specificity: `Se: ${editorTest.sensitivity_pct ?? '?'}%, Sp: ${editorTest.specificity_pct ?? '?'}%`
      };

      const url = isNewMode
        ? '/api/ortho/tests/catalog'
        : `/api/ortho/tests/catalog/${encodeURIComponent(selectedCode || editorTest.code)}`;
      const method = isNewMode ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: isNewMode ? 'Тест успешно добавлен в клинический справочник' : 'Изменения теста успешно сохранены'
        });
        setIsNewMode(false);
        setSelectedCode(payload.code);
        await fetchTests();
        if (onCatalogChanged) onCatalogChanged();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Ошибка при сохранении теста' });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: 'Сетевая ошибка: ' + e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (force = false) => {
    if (!selectedCode) return;
    try {
      const res = await fetch(`/api/ortho/tests/catalog/${encodeURIComponent(selectedCode)}?force=${force}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirmOpen(false);
        setStatusMessage({
          type: 'success',
          text: data.message || 'Тест успешно удален/деактивирован'
        });
        setSelectedCode(null);
        setEditorTest(null);
        await fetchTests();
        if (onCatalogChanged) onCatalogChanged();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Ошибка удаления теста' });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: 'Ошибка удаления: ' + e.message });
    }
  };

  // Filtered List
  const filteredTests = useMemo(() => {
    return tests.filter(t => {
      if (selectedJoint !== 'all' && t.joint_category !== selectedJoint) return false;
      if (selectedTestType !== 'all' && (t.test_type || 'provocative') !== selectedTestType) return false;
      if (onlySupplemented && !t.is_supplemented) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inRu = (t.name_ru || '').toLowerCase().includes(q);
        const inLat = (t.name_lat || '').toLowerCase().includes(q);
        const inTarget = (t.target_structure || '').toLowerCase().includes(q);
        const inCode = (t.code || '').toLowerCase().includes(q);
        const inMeth = (t.methodology || '').toLowerCase().includes(q);
        if (!inRu && !inLat && !inTarget && !inCode && !inMeth) return false;
      }
      return true;
    });
  }, [tests, selectedJoint, selectedTestType, onlySupplemented, searchQuery]);

  const jointCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tests.length };
    tests.forEach(t => {
      counts[t.joint_category] = (counts[t.joint_category] || 0) + 1;
    });
    return counts;
  }, [tests]);

  return (
    <Box>
      <Grid container spacing={2}>
        {/* LEFT MASTER PANEL: Tests List & Filters */}
        <Grid size={{ xs: 12, md: 4.5, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: 'calc(100vh - 170px)',
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
              placeholder="Поиск по тесту, автору, структуре..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                }
              }}
              sx={{ mb: 1.5 }}
            />

            {/* Joint Category Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {JOINT_OPTIONS.map(j => {
                const count = jointCounts[j.key] || 0;
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
                    sx={{
                      fontSize: '0.74rem',
                      fontWeight: isSelected ? 700 : 500,
                      borderColor: isSelected ? 'transparent' : '#CBD5E1'
                    }}
                  />
                );
              })}
            </Box>

            {/* Biomechanical Type & Supplemented Filters */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 0.5, p: 0.75, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                <Chip
                  label="Все биомех."
                  size="small"
                  clickable
                  variant={selectedTestType === 'all' ? 'filled' : 'outlined'}
                  color={selectedTestType === 'all' ? 'primary' : 'default'}
                  onClick={() => setSelectedTestType('all')}
                  sx={{ fontSize: '0.68rem', height: 22 }}
                />
                {Object.entries(TEST_TYPE_CONFIG).map(([k, v]) => (
                  <Chip
                    key={k}
                    label={v.short}
                    size="small"
                    clickable
                    variant={selectedTestType === k ? 'filled' : 'outlined'}
                    onClick={() => setSelectedTestType(k)}
                    sx={{
                      fontSize: '0.68rem',
                      height: 22,
                      bgcolor: selectedTestType === k ? v.color : 'transparent',
                      color: selectedTestType === k ? '#FFFFFF' : v.color,
                      borderColor: v.color,
                      fontWeight: selectedTestType === k ? 700 : 500
                    }}
                  />
                ))}
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={onlySupplemented}
                    onChange={(e) => setOnlySupplemented(e.target.checked)}
                    color="warning"
                  />
                }
                label={<Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#B45309' }}>[ДОПОЛНЕНО]</Typography>}
                sx={{ m: 0 }}
              />
            </Box>

            {/* Master Header & Create Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pb: 1, borderBottom: '1px solid #F1F5F9' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                Тестов в каталоге: {filteredTests.length}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<MenuBookIcon sx={{ fontSize: 16 }} />}
                  onClick={() => window.open('/guide?section=section-ortho-tests-registry', '_blank')}
                  sx={{
                    color: '#0284C7',
                    borderColor: '#BAE6FD',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 0.3,
                    px: 1,
                    '&:hover': { bgcolor: '#F0F9FF', borderColor: '#0284C7' }
                  }}
                >
                  Гид 39 тестов
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleStartCreateNew}
                  sx={{
                    bgcolor: '#0F3C64',
                    '&:hover': { bgcolor: '#156C9C' },
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 0.4
                  }}
                >
                  Новый тест
                </Button>
              </Box>
            </Box>

            {/* Scrollable Tests List */}
            <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : filteredTests.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: '#94A3B8' }}>
                  <HealingIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2">Тесты не найдены</Typography>
                </Box>
              ) : (
                filteredTests.map(t => {
                  const isSelected = !isNewMode && selectedCode === t.code;
                  const typeConf = TEST_TYPE_CONFIG[t.test_type || 'provocative'];
                  return (
                    <Box
                      key={t.code}
                      onClick={() => selectTest(t)}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: isSelected ? '#0284C7' : '#E2E8F0',
                        bgcolor: isSelected ? '#F0F9FF' : '#FFFFFF',
                        boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                        opacity: t.is_active ? 1 : 0.6,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: isSelected ? '#0284C7' : '#94A3B8',
                          bgcolor: isSelected ? '#F0F9FF' : '#F8FAFC'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', lineHeight: 1.25 }}>
                            {t.name_ru}
                          </Typography>
                          {t.name_lat && (
                            <Typography sx={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#64748B', mt: 0.2 }}>
                              {t.name_lat}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {typeConf && (
                            <Chip
                              label={typeConf.short}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                bgcolor: typeConf.bg,
                                color: typeConf.color,
                                border: `1px solid ${typeConf.color}40`
                              }}
                            />
                          )}
                          {Boolean(t.is_supplemented) && (
                            <Chip
                              label="ДОПОЛНЕНО"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                bgcolor: '#FEF3C7',
                                color: '#92400E',
                                border: '1px solid #FCD34D'
                              }}
                            />
                          )}
                          {t.is_active === 0 ? (
                            <Chip label="Архив" size="small" color="default" sx={{ height: 18, fontSize: '0.65rem' }} />
                          ) : (
                            <Chip
                              label={t.joint_category}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: '#F1F5F9',
                                color: '#334155'
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {t.target_structure && (
                        <Typography sx={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 600, mt: 0.6 }}>
                          🎯 {t.target_structure}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, pt: 0.75, borderTop: '1px dashed #F1F5F9' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccuracyIcon sx={{ fontSize: 13, color: '#059669' }} />
                          <Typography sx={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                            {t.sensitivity_pct ? `Se: ${t.sensitivity_pct}%` : ''} {t.specificity_pct ? `Sp: ${t.specificity_pct}%` : ''}
                          </Typography>
                        </Box>

                        <Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>
                          В шаблонах: <strong>{t.templates_count ?? 0}</strong>
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Paper>
        </Grid>

        {/* RIGHT DETAIL / EDITOR PANEL */}
        <Grid size={{ xs: 12, md: 7.5, lg: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              height: 'calc(100vh - 170px)',
              overflowY: 'auto',
              borderRadius: 2,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF'
            }}
          >
            {editorTest ? (
              <Box>
                {/* Header with Title and Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2, pb: 1.5, borderBottom: '1px solid #E2E8F0' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HealingIcon sx={{ color: '#0284C7', fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.15rem' }}>
                        {isNewMode ? 'Создание нового ортопедического теста' : editorTest.name_ru}
                      </Typography>
                    </Box>
                    {!isNewMode && (
                      <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'monospace' }}>
                        Код: <strong>{editorTest.code}</strong> • Шаблонов: <strong>{editorTest.templates_count ?? 0}</strong>
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!isNewMode && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DuplicateIcon />}
                        onClick={handleDuplicate}
                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                      >
                        Дублировать
                      </Button>
                    )}

                    {!isNewMode && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteConfirmOpen(true)}
                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                      >
                        Удалить
                      </Button>
                    )}

                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={saving}
                      sx={{
                        bgcolor: '#0F3C64',
                        '&:hover': { bgcolor: '#156C9C' },
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        px: 2
                      }}
                    >
                      {saving ? <CircularProgress size={18} color="inherit" /> : 'Сохранить изменения'}
                    </Button>
                  </Box>
                </Box>

                {/* Notifications */}
                {statusMessage.text && (
                  <Alert
                    severity={statusMessage.type as any}
                    onClose={() => setStatusMessage({ type: '', text: '' })}
                    sx={{ mb: 2 }}
                  >
                    {statusMessage.text}
                  </Alert>
                )}

                {/* SECTION 1: Основные параметры */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RuleIcon sx={{ fontSize: 18, color: '#0284C7' }} />
                  1. Идентификация и классификация теста
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Системный код (Slug)"
                      fullWidth
                      size="small"
                      required
                      value={editorTest.code}
                      disabled={!isNewMode}
                      onChange={(e) => setEditorTest({ ...editorTest, code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_') })}
                      helperText={isNewMode ? "Только a-z, 0-9, _ (например, lachman, cozen)" : "Уникальный ключ теста в базе"}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Сустав / Зона</InputLabel>
                      <Select
                        label="Сустав / Зона"
                        value={editorTest.joint_category}
                        onChange={(e) => setEditorTest({ ...editorTest, joint_category: e.target.value })}
                      >
                        {JOINT_OPTIONS.filter(j => j.key !== 'all').map(j => (
                          <MenuItem key={j.key} value={j.key}>
                            {j.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Тип методики / Механизм</InputLabel>
                      <Select
                        label="Тип методики / Механизм"
                        value={editorTest.icon_type || 'joint_stress'}
                        onChange={(e) => setEditorTest({ ...editorTest, icon_type: e.target.value })}
                      >
                        {ICON_TYPE_OPTIONS.map(opt => (
                          <MenuItem key={opt.key} value={opt.key}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Наименование теста (русское)"
                      fullWidth
                      size="small"
                      required
                      value={editorTest.name_ru}
                      onChange={(e) => setEditorTest({ ...editorTest, name_ru: e.target.value })}
                      placeholder="Например: Тест Лахмана"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Международное наименование (латынь / англ.)"
                      fullWidth
                      size="small"
                      value={editorTest.name_lat}
                      onChange={(e) => setEditorTest({ ...editorTest, name_lat: e.target.value })}
                      placeholder="Например: Lachman test"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      label="Анатомический субстрат / Повреждаемая структура"
                      fullWidth
                      size="small"
                      value={editorTest.target_structure}
                      onChange={(e) => setEditorTest({ ...editorTest, target_structure: e.target.value })}
                      placeholder="Например: Передняя крестообразная связка (ПКС)"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Биомеханический тип теста</InputLabel>
                      <Select
                        label="Биомеханический тип теста"
                        value={editorTest.test_type || 'provocative'}
                        onChange={(e) => setEditorTest({ ...editorTest, test_type: e.target.value })}
                      >
                        <MenuItem value="provocative">Провокационный (боль / стресс)</MenuItem>
                        <MenuItem value="relocation">Релокационный / вправление / стабилизация</MenuItem>
                        <MenuItem value="neurodynamic">Нейродинамический (натяжение нерва)</MenuItem>
                        <MenuItem value="multifactor_cluster">Многофакторный кластер тестов</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(editorTest.is_supplemented)}
                          onChange={(e) => setEditorTest({ ...editorTest, is_supplemented: e.target.checked ? 1 : 0 })}
                          color="warning"
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#B45309' }}>Дополнен EBM доказательной базой [ДОПОЛНЕНО]</Typography>}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      label="Порядок"
                      type="number"
                      fullWidth
                      size="small"
                      value={editorTest.sort_order}
                      onChange={(e) => setEditorTest({ ...editorTest, sort_order: Number(e.target.value) })}
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editorTest.is_active === 1}
                          onChange={(e) => setEditorTest({ ...editorTest, is_active: e.target.checked ? 1 : 0 })}
                          color="success"
                        />
                      }
                      label={editorTest.is_active === 1 ? 'Активен' : 'Архив'}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* SECTION 2: Диагностическая точность (Evidence-Based Medicine) */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccuracyIcon sx={{ fontSize: 18, color: '#059669' }} />
                  2. Диагностическая точность (Evidence-Based Medicine)
                </Typography>

                <Paper sx={{ p: 2, mb: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369A1' }}>
                          Чувствительность (Sensitivity, Se): {editorTest.sensitivity_pct ?? 0}%
                        </Typography>
                        <Chip
                          label={
                            (editorTest.sensitivity_pct ?? 0) >= 85 ? 'Высокая' :
                            (editorTest.sensitivity_pct ?? 0) >= 70 ? 'Умеренная' : 'Низкая'
                          }
                          size="small"
                          color={(editorTest.sensitivity_pct ?? 0) >= 80 ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                        />
                      </Box>
                      <Slider
                        value={editorTest.sensitivity_pct ?? 80}
                        min={30}
                        max={100}
                        step={1}
                        onChange={(_, val) => setEditorTest({ ...editorTest, sensitivity_pct: val as number })}
                        sx={{ color: '#0284C7' }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#7C3AED' }}>
                          Специфичность (Specificity, Sp): {editorTest.specificity_pct ?? 0}%
                        </Typography>
                        <Chip
                          label={
                            (editorTest.specificity_pct ?? 0) >= 90 ? 'Очень высокая' :
                            (editorTest.specificity_pct ?? 0) >= 80 ? 'Высокая' : 'Умеренная'
                          }
                          size="small"
                          color={(editorTest.specificity_pct ?? 0) >= 85 ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                        />
                      </Box>
                      <Slider
                        value={editorTest.specificity_pct ?? 85}
                        min={30}
                        max={100}
                        step={1}
                        onChange={(_, val) => setEditorTest({ ...editorTest, specificity_pct: val as number })}
                        sx={{ color: '#7C3AED' }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Уровень доказательности методики</InputLabel>
                        <Select
                          label="Уровень доказательности методики"
                          value={editorTest.evidence_level || 'B'}
                          onChange={(e) => setEditorTest({ ...editorTest, evidence_level: e.target.value })}
                        >
                          {EVIDENCE_LEVEL_OPTIONS.map(opt => (
                            <MenuItem key={opt.key} value={opt.key}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>

                <Divider sx={{ my: 2 }} />

                {/* SECTION 3: Клиническая методика и критерии оценки */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HealingIcon sx={{ fontSize: 18, color: '#D97706' }} />
                  3. Пошаговая биомеханика и гид для врача (On-Screen Guide)
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="1. Исходное положение пациента и углы сустава (Patient Position)"
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      value={editorTest.patient_position || ''}
                      onChange={(e) => setEditorTest({ ...editorTest, patient_position: e.target.value })}
                      placeholder="Например: Лежа на спине, коленный сустав согнут под углом 20–30°, расслабление квадрицепса..."
                      helperText="Блок шага №1 в интерактивном окне врача."
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="2. Расположение рук врача и стабилизация (Doctor Hand Placement)"
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      value={editorTest.doctor_hand_placement || ''}
                      onChange={(e) => setEditorTest({ ...editorTest, doctor_hand_placement: e.target.value })}
                      placeholder="Например: Проксимальная рука охватывает дистальный отдел бедра, дистальная — верхнюю треть голени..."
                      helperText="Блок шага №2 (точки захвата и противоупора)."
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="3. Вектор нагрузки и динамика теста (Applied Force Direction)"
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      value={editorTest.applied_force_direction || ''}
                      onChange={(e) => setEditorTest({ ...editorTest, applied_force_direction: e.target.value })}
                      placeholder="Например: Быстрое упругое трансляционное смещение голени кпереди..."
                      helperText="Блок шага №3 (направление стресс-нагрузки)."
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Критерий положительного отклика (+) (Positive Criteria)"
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      required
                      value={editorTest.positive_criteria}
                      onChange={(e) => setEditorTest({ ...editorTest, positive_criteria: e.target.value })}
                      placeholder="Например: Отсутствие жесткой конечной точки (soft end-point), патологический люфт > 3 мм..."
                      helperText="Выделяется красным индикатором в окне осмотра."
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Клиническая интерпретация и нозологии (Clinical Interpretation)"
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      value={editorTest.clinical_interpretation || ''}
                      onChange={(e) => setEditorTest({ ...editorTest, clinical_interpretation: e.target.value })}
                      placeholder="Например: Разрыв передней крестообразной связки (ПКС), повреждение передне-латерального комплекса..."
                      helperText="Нозологическая привязка и синдромы."
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Дифференциальный диагноз и ложные результаты (False Positive / Pitfalls)"
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      value={editorTest.false_positive_factors || ''}
                      onChange={(e) => setEditorTest({ ...editorTest, false_positive_factors: e.target.value })}
                      placeholder="Например: Рефлекторный мышечный спазм подколенных сгибателей (hamstrings guard), сопутствующий разрыв ЗКС..."
                      helperText="Предупреждение о типичных ошибках и мышечном дефансе."
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Сводное текстовое описание методики (для кратких протоколов)"
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      required
                      value={editorTest.methodology}
                      onChange={(e) => setEditorTest({ ...editorTest, methodology: e.target.value })}
                      placeholder="Краткое описание методики в одну строку..."
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* SECTION 4: Интерактивный предпросмотр в карточке сустава (Live ARM Preview) */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PreviewIcon sx={{ fontSize: 18, color: '#0284C7' }} />
                  4. Интерактивный предпросмотр в карточке сустава (АРМ Врача)
                </Typography>

                <Paper
                  sx={{
                    p: 2.5,
                    mb: 2,
                    bgcolor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block' }}>
                        Элемент переключателя в модуле «JointExamCard»:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                        Проверьте, как выглядит тест и обучающее модальное окно для врача в реальном осмотре.
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PreviewIcon />}
                      onClick={() => setPreviewInfoOpen(true)}
                      sx={{
                        bgcolor: '#0284C7',
                        '&:hover': { bgcolor: '#0369A1' },
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.82rem'
                      }}
                    >
                      Открыть гид для врача (Live UX Guide)
                    </Button>
                  </Box>

                  <Box
                    sx={{
                      maxWidth: 440,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.25,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: previewTestState === 'positive' ? '#FCA5A5' : '#E2E8F0',
                      bgcolor: previewTestState === 'positive' ? '#FEF2F2' : '#FFFFFF',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <FormControlLabel
                      sx={{ mr: 0.5, flex: 1, m: 0 }}
                      control={
                        <Switch
                          size="small"
                          checked={previewTestState === 'positive'}
                          onChange={(e) => setPreviewTestState(e.target.checked ? 'positive' : 'negative')}
                          color="error"
                        />
                      }
                      label={
                        <Box sx={{ ml: 0.5 }}>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: previewTestState === 'positive' ? '#991B1B' : '#1E293B', lineHeight: 1.25 }}>
                            {editorTest.name_ru || 'Наименование теста'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: previewTestState === 'positive' ? '#DC2626' : '#64748B', fontWeight: previewTestState === 'positive' ? 700 : 500 }}>
                            {previewTestState === 'positive' ? 'Положительный (+)' : 'Отрицательный (-)'}
                          </Typography>
                        </Box>
                      }
                    />

                    <Tooltip title="Нажмите, чтобы увидеть интерактивный гид по методике">
                      <IconButton
                        size="small"
                        onClick={() => setPreviewInfoOpen(true)}
                        sx={{ color: '#0284C7', p: 0.5, '&:hover': { bgcolor: '#E0F2FE' } }}
                      >
                        <InfoIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {previewTestState === 'positive' && (
                    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: '#FEF2F2', border: '1px solid #FECACA', maxWidth: 440 }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#991B1B' }}>
                        Критерий положительного результата:
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: '#7F1D1D', mt: 0.3 }}>
                        {editorTest.positive_criteria || 'Не указан'}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            ) : (
              <Box sx={{ p: 6, textAlign: 'center', color: '#94A3B8' }}>
                <HealingIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748B' }}>
                  Выберите ортопедический тест из списка слева
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  или нажмите кнопку «Новый тест» для внесения валидированной методики в клинический справочник
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* On-Screen Clinical Test Guidance Modal (Identical to ARM Workstation) */}
      <OrthoTestGuidanceModal
        open={previewInfoOpen}
        onClose={() => setPreviewInfoOpen(false)}
        test={editorTest}
        currentResult={previewTestState}
        onSetResult={(res) => setPreviewTestState(res as 'positive' | 'negative')}
      />

      {/* Delete / Deactivate Confirm Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#991B1B' }}>
          Подтверждение удаления теста
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Вы уверены, что хотите удалить тест <strong>«{editorTest?.name_ru}»</strong>?
          </Typography>
          {(editorTest?.templates_count ?? 0) > 0 && (
            <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
              Данный тест привязан к <strong>{editorTest?.templates_count}</strong> клиническим шаблонам.
              При обычном удалении тест будет деактивирован (перемещен в архив) с сохранением целостности шаблонов.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC' }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ fontWeight: 600 }}>
            Отмена
          </Button>
          {(editorTest?.templates_count ?? 0) > 0 ? (
            <>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => handleDelete(false)}
                sx={{ fontWeight: 700 }}
              >
                Деактивировать (Архив)
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDelete(true)}
                sx={{ fontWeight: 700 }}
              >
                Удалить принудительно
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDelete(true)}
              sx={{ fontWeight: 700 }}
            >
              Удалить
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
