import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Switch,
  Divider,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GoniometerInput from './GoniometerInput';
import type { RomValues } from './GoniometerInput';
import type { JointAreaId } from './BodyHomunculus';
import OrthoTestGuidanceModal from './OrthoTestGuidanceModal';
import LatexText from './LatexText';
import { API_BASE_URL } from '../../config/apiConfig';

const TEST_TYPE_CONFIG: Record<string, { label: string; short: string; color: string; bg: string }> = {
  provocative: { label: 'Провокационный (боль/стресс)', short: 'Провокац.', color: '#DC2626', bg: '#FEF2F2' },
  relocation: { label: 'Релокационный / вправление', short: 'Релокац.', color: '#2563EB', bg: '#EFF6FF' },
  neurodynamic: { label: 'Нейродинамический (натяжение)', short: 'Нейродин.', color: '#D97706', bg: '#FFFBEB' },
  multifactor_cluster: { label: 'Многофакторный кластер', short: 'Кластер', color: '#7C3AED', bg: '#F5F3FF' }
};

export type { RomValues };

export interface JointExamState {
  jointArea: JointAreaId;
  side: 'right' | 'left' | 'bilateral';
  axis: 'norm' | 'valgus' | 'varus';
  effusion: number; // 0, 1, 2, 3
  rom: RomValues;
  tests: Record<string, 'negative' | 'positive' | 'positive_medial' | 'positive_lateral' | string>;
  palpationPoints?: string[];
  isNormPreset?: boolean;
}

export type JointCategory = 'knee' | 'shoulder' | 'elbow' | 'hip' | 'ankle' | 'wrist' | 'spine';

interface JointExamCardProps {
  jointArea: JointAreaId;
  state: JointExamState;
  onChange: (newState: JointExamState) => void;
  previousVisitDelta?: {
    date: string;
    romDelta: string;
    vasDelta: string;
  };
  mode?: 'all' | 'rom_only' | 'tests_only';
}

export default function JointExamCard({
  jointArea,
  state,
  onChange,
  previousVisitDelta,
  mode = 'all'
}: JointExamCardProps) {
  const getJointCategory = (id: JointAreaId): JointCategory => {
    if (id.startsWith('knee')) return 'knee';
    if (id.startsWith('shoulder')) return 'shoulder';
    if (id.startsWith('elbow')) return 'elbow';
    if (id.startsWith('hip')) return 'hip';
    if (id.startsWith('wrist')) return 'wrist';
    if (id.startsWith('foot')) return 'ankle';
    if (id.startsWith('spine')) return 'spine';
    return 'knee';
  };

  const category = getJointCategory(jointArea);

  const getCategoryTitle = (cat: JointCategory, id: JointAreaId) => {
    const side = id.endsWith('_l') ? ' (левый)' : id.endsWith('_r') ? ' (правый)' : '';
    switch (cat) {
      case 'elbow': return `Локтевой сустав${side}`;
      case 'knee': return `Коленный сустав${side}`;
      case 'shoulder': return `Плечевой сустав${side}`;
      case 'hip': return `Тазобедренный сустав${side}`;
      case 'ankle': return `Сустав стопы / голеностоп${side}`;
      case 'wrist': return `Лучезапястный сустав и кисть${side}`;
      case 'spine': return 'Позвоночник';
      default: return 'Сустав';
    }
  };

  const getTier1Title = (cat: JointCategory) => {
    switch (cat) {
      case 'ankle':
        return "Обязательный первичный скрининг по Оттавским правилам голеностопного сустава и стопы (Stiell's Ottawa Ankle & Foot Rules — OAR, $Sn = 98\\text{–}99.6\\%$, $Sp = 40\\%$):";
      case 'knee':
        return "Обязательный первичный скрининг по Оттавским правилам коленного сустава (Ottawa Knee Rules, $Sn = 98.5\\text{–}100\\%$):";
      case 'shoulder':
        return "Обязательный первичный скрининг субакромиального импинджмента (Park Cluster, $Sn = 75\\%$, $Sp = 95\\%$):";
      case 'hip':
        return "Обязательный первичный скрининг патологии тазобедренного сустава (Tier 1 Screening, $Sn \\ge 90\\%$):";
      case 'elbow':
        return "Обязательный первичный скрининг эпикондилита и нестабильности (Tier 1 Screening, $Sn \\ge 90\\%$):";
      case 'wrist':
        return "Обязательный первичный скрининг туннельных и связочных синдромов (Tier 1 Screening, $Sn \\ge 90\\%$):";
      case 'spine':
        return "Обязательный первичный скрининг корешкового синдрома и Red Flags (Tier 1 Screening, $Sn \\ge 95\\%$):";
      default:
        return "Обязательный первичный скрининг патологии сустава (Tier 1: Red Flags, $Sn \\ge 90\\text{–}98\\%$):";
    }
  };

  // Quick "Norm by default"
  const handleSetNorm = () => {
    let defaultRom: RomValues = { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 };
    let defaultTests: Record<string, string> = {};

    if (category === 'knee') {
      defaultRom = { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 };
      defaultTests = {
        lachman: 'negative',
        anterior_drawer: 'negative',
        posterior_drawer: 'negative',
        pivot_shift: 'negative',
        mcmurray: 'negative',
        appley: 'negative',
        patella_ballottement: 'negative'
      };
    } else if (category === 'elbow') {
      defaultRom = { flexion_active: 145, flexion_passive: 150, extension_deficit: 0, rotation_ext: 85, rotation_int: 85 };
      defaultTests = {
        cozen: 'negative',
        mill: 'negative',
        golfer: 'negative',
        tinel_cubital: 'negative',
        valgus_stress_elbow: 'negative',
        varus_stress_elbow: 'negative'
      };
    } else if (category === 'shoulder') {
      defaultRom = { flexion_active: 170, flexion_passive: 170, extension_deficit: 0, rotation_ext: 60, rotation_int: 60 };
      defaultTests = {
        neer: 'negative',
        hawkins: 'negative',
        empty_can_jobe: 'negative',
        drop_arm: 'negative',
        apprehension: 'negative'
      };
    } else if (category === 'hip') {
      defaultRom = { flexion_active: 120, flexion_passive: 125, extension_deficit: 0, rotation_ext: 45, rotation_int: 40 };
      defaultTests = {
        faber: 'negative',
        fadir: 'negative',
        thomas: 'negative',
        trendelenburg: 'negative'
      };
    } else if (category === 'wrist') {
      defaultRom = { flexion_active: 75, flexion_passive: 80, extension_deficit: 0 };
      defaultTests = {
        phalen: 'negative',
        tinel_wrist: 'negative',
        finkelstein: 'negative',
        piano_key: 'negative'
      };
    } else if (category === 'ankle') {
      defaultRom = { flexion_active: 45, flexion_passive: 45, extension_deficit: 0 };
      defaultTests = {
        anterior_drawer_ankle: 'negative',
        talar_tilt: 'negative',
        thompson: 'negative',
        windlass: 'negative'
      };
    } else if (category === 'spine') {
      defaultRom = { flexion_active: 90, flexion_passive: 90, extension_deficit: 0 };
      defaultTests = {
        lasegue: 'negative',
        wassermann: 'negative',
        adams: 'negative',
        radicular: 'negative'
      };
    }

    setTier1Expanded(false);
    setTier2Expanded(false);
    setTier3Expanded(false);
    onChange({
      ...state,
      axis: 'norm',
      effusion: 0,
      rom: defaultRom,
      tests: defaultTests,
      isNormPreset: true
    });
  };

  // Test Catalog State & Methodology Dialog
  const [testCatalog, setTestCatalog] = useState<Record<string, any>>({});
  const [selectedTestDetail, setSelectedTestDetail] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/ortho/tests/catalog`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.tests)) {
          const map: Record<string, any> = {};
          d.tests.forEach((t: any) => {
            map[t.code] = t;
          });
          setTestCatalog(map);
        }
      })
      .catch((err) => console.error('Failed to load test catalog in JointExamCard:', err));
  }, []);

  const jointCatalogTests = useMemo(() => {
    return Object.values(testCatalog).filter((t: any) => t.joint_category === category || t.target_joint === category);
  }, [testCatalog, category]);

  const getTestTier = (t: any): 'high' | 'medium' | 'low' => {
    if (t.priority_level === 'high' || t.priority_level === 'tier1') return 'high';
    if (t.priority_level === 'medium' || t.priority_level === 'tier2') return 'medium';
    if (t.priority_level === 'low' || t.priority_level === 'tier3') return 'low';
    if ((t.sensitivity_pct && t.sensitivity_pct >= 90) || t.test_type === 'multifactor_cluster') return 'high';
    if (t.specificity_pct && t.specificity_pct >= 85) return 'medium';
    return 'low';
  };

  const tier1Tests = useMemo(() => {
    return jointCatalogTests.filter((t: any) => getTestTier(t) === 'high');
  }, [jointCatalogTests]);

  const tier2Tests = useMemo(() => {
    return jointCatalogTests.filter((t: any) => getTestTier(t) === 'medium');
  }, [jointCatalogTests]);

  const tier3Tests = useMemo(() => {
    return jointCatalogTests.filter((t: any) => getTestTier(t) === 'low');
  }, [jointCatalogTests]);

  const sortTestsByPositive = (tests: any[]) => {
    return [...tests].sort((a, b) => {
      const aPos = state.tests[a.code] === 'positive' || state.tests[a.code] === 'positive_medial' || state.tests[a.code] === 'positive_lateral';
      const bPos = state.tests[b.code] === 'positive' || state.tests[b.code] === 'positive_medial' || state.tests[b.code] === 'positive_lateral';
      if (aPos && !bPos) return -1;
      if (!aPos && bPos) return 1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  };

  const hasPositiveTier1 = useMemo(() => {
    return tier1Tests.some((t: any) => {
      const val = state.tests[t.code];
      return val === 'positive' || val === 'positive_medial' || val === 'positive_lateral';
    });
  }, [tier1Tests, state.tests]);

  const hasPositiveTier2 = useMemo(() => {
    return tier2Tests.some((t: any) => {
      const val = state.tests[t.code];
      return val === 'positive' || val === 'positive_medial' || val === 'positive_lateral';
    });
  }, [tier2Tests, state.tests]);

  const hasPositiveTier3 = useMemo(() => {
    return tier3Tests.some((t: any) => {
      const val = state.tests[t.code];
      return val === 'positive' || val === 'positive_medial' || val === 'positive_lateral';
    });
  }, [tier3Tests, state.tests]);

  const tier1PositiveCount = useMemo(() => {
    return tier1Tests.filter((t: any) => {
      const val = state.tests[t.code];
      return val === 'positive' || val === 'positive_medial' || val === 'positive_lateral';
    }).length;
  }, [tier1Tests, state.tests]);

  const tier2PositiveCount = useMemo(() => {
    return tier2Tests.filter((t: any) => {
      const val = state.tests[t.code];
      return val === 'positive' || val === 'positive_medial' || val === 'positive_lateral';
    }).length;
  }, [tier2Tests, state.tests]);

  const tier3PositiveCount = useMemo(() => {
    return tier3Tests.filter((t: any) => {
      const val = state.tests[t.code];
      return val === 'positive' || val === 'positive_medial' || val === 'positive_lateral';
    }).length;
  }, [tier3Tests, state.tests]);

  // Accordion states: Inactive tiers are collapsed by default on load for all tiers!
  const [tier1Expanded, setTier1Expanded] = useState<boolean>(false);
  const [tier2Expanded, setTier2Expanded] = useState<boolean>(false);
  const [tier3Expanded, setTier3Expanded] = useState<boolean>(false);

  // Sync accordion expansion on joint change: collapse inactive for all tiers
  useEffect(() => {
    setTier1Expanded(false);
    setTier2Expanded(false);
    setTier3Expanded(false);
  }, [jointArea]);

  const handleSetTier1Normal = () => {
    const updated = { ...state.tests };
    tier1Tests.forEach((t: any) => {
      updated[t.code] = 'negative';
    });
    setTier1Expanded(false);
    onChange({
      ...state,
      tests: updated
    });
  };

  const handleTestToggle = (testKey: string) => {
    const currentVal = state.tests[testKey] || 'negative';
    const nextVal = currentVal === 'negative' ? 'positive' : 'negative';
    if (nextVal === 'positive') {
      if (tier1Tests.some((t: any) => t.code === testKey)) {
        setTier1Expanded(true);
      } else if (tier2Tests.some((t: any) => t.code === testKey)) {
        setTier2Expanded(true);
      } else if (tier3Tests.some((t: any) => t.code === testKey)) {
        setTier3Expanded(true);
      }
    }
    onChange({
      ...state,
      tests: { ...state.tests, [testKey]: nextVal }
    });
  };

  const renderTestItem = (testKey: string, defaultLabel: string) => {
    const catItem = testCatalog[testKey];
    const isPositive = state.tests[testKey] === 'positive' || state.tests[testKey] === 'positive_medial' || state.tests[testKey] === 'positive_lateral';
    const displayName = catItem ? (catItem.name_ru || catItem.name) : defaultLabel;
    const typeTag = catItem?.test_type || catItem?.test_type_tag;
    const typeConf = typeTag ? TEST_TYPE_CONFIG[typeTag] : null;

    return (
      <Grid size={{ xs: 12, sm: 6 }} key={testKey}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.25,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: isPositive ? '#FCA5A5' : '#E2E8F0',
            bgcolor: isPositive ? '#FEF2F2' : '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
        >
          <FormControlLabel
            sx={{ mr: 0.5, flex: 1, m: 0 }}
            control={
              <Switch
                size="small"
                checked={isPositive}
                onChange={() => handleTestToggle(testKey)}
                color="error"
              />
            }
            label={
              <Box sx={{ ml: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: 0.25 }}>
                  <Typography component="div" sx={{ fontSize: '0.82rem', fontWeight: 700, color: isPositive ? '#991B1B' : '#1E293B', lineHeight: 1.25 }}>
                    <LatexText text={displayName} />
                  </Typography>
                  {typeConf && (
                    <Chip
                      label={typeConf.short}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        bgcolor: typeConf.bg,
                        color: typeConf.color,
                        border: `1px solid ${typeConf.color}30`
                      }}
                    />
                  )}
                  {Boolean(catItem?.is_supplemented) && (
                    <Chip
                      label="ДОПОЛНЕНО"
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        bgcolor: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FCD34D'
                      }}
                    />
                  )}
                </Box>
                {catItem?.name_lat && (
                  <Typography component="div" sx={{ fontSize: '0.68rem', fontStyle: 'italic', color: '#64748B' }}>
                    <LatexText text={catItem.name_lat} />
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                  <Typography sx={{ fontSize: '0.72rem', color: isPositive ? '#DC2626' : '#16A34A', fontWeight: 700 }}>
                    {isPositive ? 'Положительный (+)' : 'Отрицательный (-)'}
                  </Typography>
                  {(catItem?.sensitivity_pct || catItem?.specificity_pct) && (
                    <Typography component="div" sx={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>
                      <LatexText
                        text={`${catItem.sensitivity_pct ? `$Sn = ${catItem.sensitivity_pct}\\%$` : ''}${catItem.sensitivity_pct && catItem.specificity_pct ? ', ' : ''}${catItem.specificity_pct ? `$Sp = ${catItem.specificity_pct}\\%$` : ''}`.trim()}
                      />
                    </Typography>
                  )}
                </Box>
              </Box>
            }
          />
          {catItem && (
            <Tooltip title="Методика теста, анатомический субстрат, чувствительность и специфичность">
              <IconButton
                size="small"
                onClick={() => setSelectedTestDetail(catItem)}
                sx={{ color: '#0284C7', p: 0.5, '&:hover': { bgcolor: '#E0F2FE' } }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Grid>
    );
  };

  const positiveTestsEntries = useMemo(() => {
    return Object.entries(state.tests).filter(
      ([_, val]) => val === 'positive' || val === 'positive_medial' || val === 'positive_lateral'
    );
  }, [state.tests]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: mode !== 'all' ? 1 : 2.5,
        bgcolor: mode !== 'all' ? 'transparent' : '#FFFFFF',
        border: mode !== 'all' ? 'none' : '1px solid #E2E8F0',
        borderRadius: 2
      }}
    >
      {/* Header with Quick Norm Button (only if mode === 'all') */}
      {mode === 'all' && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '1.05rem' }}>
              Локальный статус: {getCategoryTitle(category, jointArea)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Осмотр, пальпация, гониометрия и клинические тесты
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={handleSetNorm}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              px: 2,
              py: 0.6,
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)'
            }}
          >
            Всё в пределах нормы (F2)
          </Button>
        </Box>
      )}

      {/* ROM SECTION (rendered if mode is 'all' or 'rom_only') */}
      {(mode === 'all' || mode === 'rom_only') && (
        <>
          {mode === 'rom_only' && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                {getCategoryTitle(category, jointArea)} • SFTR Neutral-0
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                onClick={handleSetNorm}
                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, py: 0.3 }}
              >
                Физиологическая норма (ROM)
              </Button>
            </Box>
          )}

          {/* Previous Visit Delta Badge if present */}
          {previousVisitDelta && (
            <Box sx={{ mb: 2, p: 1, bgcolor: '#F0FDF4', borderRadius: 1.5, border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip label="Динамика к прошлому приему" size="small" color="success" sx={{ fontSize: '0.7rem' }} />
              <Typography sx={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                {previousVisitDelta.date}: ROM {previousVisitDelta.romDelta} | ВАШ {previousVisitDelta.vasDelta}
              </Typography>
            </Box>
          )}

          {/* Section 1: Axis & Effusion */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.75 }}>
                Ось сустава / деформация:
              </Typography>
              <ToggleButtonGroup
                value={state.axis}
                exclusive
                onChange={(_, val) => val && onChange({ ...state, axis: val })}
                size="small"
                fullWidth
              >
                <ToggleButton value="norm">Прямая (норма)</ToggleButton>
                <ToggleButton value="valgus">Вальгус</ToggleButton>
                <ToggleButton value="varus">Варус</ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.75 }}>
                Выпот / синовит сустава:
              </Typography>
              <ToggleButtonGroup
                value={state.effusion}
                exclusive
                onChange={(_, val) => val !== null && onChange({ ...state, effusion: Number(val) })}
                size="small"
                fullWidth
              >
                <ToggleButton value={0}>0 (нет)</ToggleButton>
                <ToggleButton value={1}>I (малый)</ToggleButton>
                <ToggleButton value={2}>II (умеренный)</ToggleButton>
                <ToggleButton value={3}>III (выраженный)</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>

          {/* Section 2: ROM Goniometer */}
          <Box sx={{ mb: mode === 'all' ? 2.5 : 0 }}>
            <GoniometerInput
              values={state.rom}
              onChange={(newRom) => onChange({ ...state, rom: newRom })}
              jointType={category}
            />
          </Box>
        </>
      )}

      {mode === 'all' && <Divider sx={{ my: 2 }} />}

      {/* TESTS SECTION (rendered if mode is 'all' or 'tests_only') */}
      {(mode === 'all' || mode === 'tests_only') && (
        <Box>
          {/* Active Positive Tests Highlight Banner */}
          {positiveTestsEntries.length > 0 && (
            <Box
              sx={{
                mb: 2,
                p: 1.25,
                bgcolor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: 2,
                boxShadow: '0 1px 4px rgba(239, 68, 68, 0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`Положительных: ${positiveTestsEntries.length}`}
                    size="small"
                    color="error"
                    sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                  />
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#991B1B' }}>
                    Патологические провокационные знаки:
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#7F1D1D', fontStyle: 'italic' }}>
                  Нажмите на крестик для сброса в норму (-)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {positiveTestsEntries.map(([code]) => {
                  const catItem = testCatalog[code];
                  return (
                    <Chip
                      key={code}
                      label={<LatexText text={catItem?.name_ru || catItem?.name || code} />}
                      size="small"
                      onDelete={() => handleTestToggle(code)}
                      sx={{
                        bgcolor: '#FEE2E2',
                        color: '#991B1B',
                        fontWeight: 700,
                        border: '1px solid #F87171',
                        fontSize: '0.75rem'
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                Специальные ортопедические тесты (3-уровневая EBM система):
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                <LatexText text="Tier 1 ($Sn \ge 95\%$, Red Flags), Tier 2 (верификация, $Sp \ge 85\text{–}95\%$), Tier 3 (экспертный, $LR+ > 5.0$, $LR- < 0.2$)" />
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => {
                  const anyInactiveExpanded = (!hasPositiveTier1 && tier1Expanded) || (!hasPositiveTier2 && tier2Expanded) || (!hasPositiveTier3 && tier3Expanded);
                  if (anyInactiveExpanded) {
                    setTier1Expanded(hasPositiveTier1);
                    setTier2Expanded(hasPositiveTier2);
                    setTier3Expanded(hasPositiveTier3);
                  } else {
                    setTier1Expanded(true);
                    setTier2Expanded(true);
                    setTier3Expanded(true);
                  }
                }}
                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, borderColor: '#CBD5E1', color: '#475569' }}
              >
                {((!hasPositiveTier1 && tier1Expanded) || (!hasPositiveTier2 && tier2Expanded) || (!hasPositiveTier3 && tier3Expanded))
                  ? 'Свернуть неактивные'
                  : 'Развернуть все тесты'}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="success"
                onClick={handleSetTier1Normal}
                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700 }}
              >
                Все тесты Tier 1 в норме (-)
              </Button>
            </Box>
          </Box>

        {/* Tier 1: Обязательный первичный скрининг (Accordion, collapses when inactive) */}
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 1.5,
            borderRadius: 2,
            borderColor: hasPositiveTier1 ? '#FCA5A5' : '#E2E8F0',
            bgcolor: hasPositiveTier1 ? '#FEF2F2' : (tier1Expanded ? '#FFF5F5' : '#FAFAFA'),
            transition: 'all 0.2s ease'
          }}
        >
          <Box
            onClick={() => setTier1Expanded(prev => !prev)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="Tier 1: Скрининг" size="small" sx={{ bgcolor: '#DC2626', color: '#FFF', fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
              <Typography component="div" sx={{ fontWeight: 800, fontSize: '0.82rem', color: hasPositiveTier1 ? '#991B1B' : '#334155' }}>
                <LatexText text={`${getTier1Title(category)} (${tier1Tests.length > 0 ? tier1Tests.length : (jointCatalogTests.length > 0 ? jointCatalogTests.length : 'базовые')})`} />
              </Typography>
              {hasPositiveTier1 ? (
                <Chip
                  label={`Обнаружено: ${tier1PositiveCount} (+)`}
                  size="small"
                  color="error"
                  sx={{ height: 20, fontSize: '0.66rem', fontWeight: 800 }}
                />
              ) : (
                <Chip
                  label="Неактивен / В норме (-)"
                  size="small"
                  sx={{
                    bgcolor: '#ECFDF5',
                    color: '#047857',
                    border: '1px solid #A7F3D0',
                    height: 20,
                    fontSize: '0.66rem',
                    fontWeight: 700
                  }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: { xs: 'none', sm: 'inline' } }}>
                {tier1Expanded ? 'Свернуть' : 'Раскрыть'}
              </Typography>
              <IconButton size="small">
                {tier1Expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
          </Box>
          <Collapse in={tier1Expanded}>
            <Box sx={{ pt: 1.5 }}>
              <Grid container spacing={1.25}>
                {tier1Tests.length > 0
                  ? sortTestsByPositive(tier1Tests).map((t: any) => renderTestItem(t.code, t.name || t.name_ru))
                  : jointCatalogTests.length > 0
                    ? sortTestsByPositive(jointCatalogTests).map((t: any) => renderTestItem(t.code, t.name || t.name_ru))
                    : (
                      // Fallback hardcoded list if catalog is loading
                      <>
                        {category === 'knee' && (
                          <>
                            {renderTestItem('lachman', 'Тест Лахмана (Lachman test)')}
                            {renderTestItem('anterior_drawer', 'Передний «выдвижной ящик»')}
                            {renderTestItem('posterior_drawer', 'Задний «выдвижной ящик»')}
                            {renderTestItem('pivot_shift', 'Pivot-shift тест')}
                            {renderTestItem('mcmurray', 'Тест Мак-Мюррея (мениски)')}
                            {renderTestItem('appley', 'Тест Эпли (компрессионный)')}
                          </>
                        )}
                        {category === 'elbow' && (
                          <>
                            {renderTestItem('cozen', 'Тест Козена (латеральный эпикондилит)')}
                            {renderTestItem('mill', 'Тест Милля (растяжение разгибателей)')}
                            {renderTestItem('tinel_cubital', 'Симптом Тиннеля (кубитальный канал)')}
                          </>
                        )}
                        {category === 'shoulder' && (
                          <>
                            {renderTestItem('neer', 'Импиджмент-тест Нира (Neer)')}
                            {renderTestItem('hawkins', 'Тест Хокинса-Кеннеди')}
                            {renderTestItem('empty_can_jobe', 'Тест Джобса (надостная м.)')}
                            {renderTestItem('drop_arm', 'Тест падающей руки')}
                          </>
                        )}
                        {category === 'hip' && (
                          <>
                            {renderTestItem('faber', 'Тест FABER / Патрика (ТБС / КПС)')}
                            {renderTestItem('fadir', 'Тест FADIR (импинджмент / губа)')}
                            {renderTestItem('thomas', 'Тест Томаса')}
                          </>
                        )}
                        {category === 'wrist' && (
                          <>
                            {renderTestItem('phalen', 'Тест Фалена (карпальный канал)')}
                            {renderTestItem('tinel_wrist', 'Симптом Тиннеля на запястье')}
                            {renderTestItem('finkelstein', 'Тест Финкельштейна')}
                          </>
                        )}
                        {category === 'spine' && (
                          <>
                            {renderTestItem('lasegue', 'Симптом Ласега (Lasegue test)')}
                            {renderTestItem('bragard', 'Тест Брагарда')}
                            {renderTestItem('slump', 'Slump-тест')}
                          </>
                        )}
                        {category === 'ankle' && (
                          <>
                            {renderTestItem('anterior_drawer_ankle', 'Передний выдвижной ящик')}
                            {renderTestItem('talar_tilt', 'Тест наклона таранной кости')}
                            {renderTestItem('thompson', 'Тест Томпсона')}
                          </>
                        )}
                      </>
                    )
                }
              </Grid>
            </Box>
          </Collapse>
        </Paper>

        {/* Tier 2: Верификация диагноза (Collapsible accordion, auto-expands on positive Tier 1 or positive Tier 2) */}
        {tier2Tests.length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              mb: 1.5,
              borderRadius: 2,
              borderColor: hasPositiveTier2 ? '#F59E0B' : (hasPositiveTier1 ? '#FCD34D' : '#E2E8F0'),
              bgcolor: hasPositiveTier2 ? '#FFFBEB' : (tier2Expanded ? '#FEFCE8' : '#FAFAFA'),
              transition: 'all 0.2s ease'
            }}
          >
            <Box
              onClick={() => setTier2Expanded(prev => !prev)}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="Tier 2: Верификация" size="small" sx={{ bgcolor: '#D97706', color: '#FFF', fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
                <Typography component="div" sx={{ fontWeight: 800, fontSize: '0.82rem', color: hasPositiveTier2 ? '#92400E' : '#334155' }}>
                  <LatexText text={`Тесты подтверждения и верификации диагноза (Tier 2: верификация, $Sp \\ge 85\\text{–}95\\%$): (${tier2Tests.length})`} />
                </Typography>
                {hasPositiveTier2 ? (
                  <Chip
                    label={`Обнаружено: ${tier2PositiveCount} (+)`}
                    size="small"
                    sx={{ bgcolor: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B', height: 20, fontSize: '0.66rem', fontWeight: 800 }}
                  />
                ) : hasPositiveTier1 ? (
                  <Chip label="Рекомендовано по (+) Tier 1" size="small" color="error" sx={{ height: 20, fontSize: '0.64rem', fontWeight: 700 }} />
                ) : (
                  <Chip
                    label="Неактивен / В норме (-)"
                    size="small"
                    sx={{ bgcolor: '#F1F5F9', color: '#64748B', height: 20, fontSize: '0.66rem', fontWeight: 600 }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', display: { xs: 'none', sm: 'inline' } }}>
                  {tier2Expanded ? 'Свернуть' : 'Раскрыть'}
                </Typography>
                <IconButton size="small">
                  {tier2Expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>
            </Box>
            <Collapse in={tier2Expanded}>
              <Box sx={{ pt: 1.5 }}>
                <Grid container spacing={1.25}>
                  {sortTestsByPositive(tier2Tests).map((t: any) => renderTestItem(t.code, t.name || t.name_ru))}
                </Grid>
              </Box>
            </Collapse>
          </Paper>
        )}

        {/* Tier 3: Экспертный дифференциальный уровень (Collapsible accordion) */}
        {tier3Tests.length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              borderColor: hasPositiveTier3 ? '#60A5FA' : '#E2E8F0',
              bgcolor: hasPositiveTier3 ? '#EFF6FF' : (tier3Expanded ? '#F0F9FF' : '#FAFAFA'),
              transition: 'all 0.2s ease'
            }}
          >
            <Box
              onClick={() => setTier3Expanded(prev => !prev)}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="Tier 3: Экспертный" size="small" sx={{ bgcolor: '#2563EB', color: '#FFF', fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
                <Typography component="div" sx={{ fontWeight: 800, fontSize: '0.82rem', color: hasPositiveTier3 ? '#1E40AF' : '#334155' }}>
                  <LatexText text={`Специализированные и экспертные пробы (Tier 3: экспертный уровень, $LR+ > 5.0$, $LR- < 0.2$): (${tier3Tests.length})`} />
                </Typography>
                {hasPositiveTier3 ? (
                  <Chip
                    label={`Обнаружено: ${tier3PositiveCount} (+)`}
                    size="small"
                    sx={{ bgcolor: '#DBEAFE', color: '#1E40AF', border: '1px solid #60A5FA', height: 20, fontSize: '0.66rem', fontWeight: 800 }}
                  />
                ) : (
                  <Chip
                    label="Неактивен / В норме (-)"
                    size="small"
                    sx={{ bgcolor: '#F1F5F9', color: '#64748B', height: 20, fontSize: '0.66rem', fontWeight: 600 }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', display: { xs: 'none', sm: 'inline' } }}>
                  {tier3Expanded ? 'Свернуть' : 'Раскрыть'}
                </Typography>
                <IconButton size="small">
                  {tier3Expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>
            </Box>
            <Collapse in={tier3Expanded}>
              <Box sx={{ pt: 1.5 }}>
                <Grid container spacing={1.25}>
                  {sortTestsByPositive(tier3Tests).map((t: any) => renderTestItem(t.code, t.name || t.name_ru))}
                </Grid>
              </Box>
            </Collapse>
          </Paper>
        )}
      </Box>
      )}

      {/* ON-SCREEN CLINICAL TEST GUIDANCE MODAL */}
      <OrthoTestGuidanceModal
        open={Boolean(selectedTestDetail)}
        onClose={() => setSelectedTestDetail(null)}
        test={selectedTestDetail}
        currentResult={selectedTestDetail ? (state.tests[selectedTestDetail.code] || 'negative') : 'negative'}
        onSetResult={(newResult) => {
          if (selectedTestDetail) {
            if (newResult !== 'negative') {
              if (tier1Tests.some((t: any) => t.code === selectedTestDetail.code)) {
                setTier1Expanded(true);
              } else if (tier2Tests.some((t: any) => t.code === selectedTestDetail.code)) {
                setTier2Expanded(true);
              } else if (tier3Tests.some((t: any) => t.code === selectedTestDetail.code)) {
                setTier3Expanded(true);
              }
            }
            onChange({
              ...state,
              tests: { ...state.tests, [selectedTestDetail.code]: newResult }
            });
          }
        }}
      />
    </Paper>
  );
}
