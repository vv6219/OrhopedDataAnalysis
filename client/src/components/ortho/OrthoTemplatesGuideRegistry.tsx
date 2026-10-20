import { useState, useMemo, useEffect, useRef, startTransition } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';
import BiotechIcon from '@mui/icons-material/Biotech';
import HealingIcon from '@mui/icons-material/Healing';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import LayersIcon from '@mui/icons-material/Layers';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ShieldIcon from '@mui/icons-material/Shield';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import StraightenIcon from '@mui/icons-material/Straighten';
import LatexText from './LatexText';
import { MASTER_CLUSTERS } from '../../pages/OrthoTemplatesManager';

export interface ClinicalTemplateDetail {
  id: number;
  title: string;
  jointCategory: string;
  mkbCode: string;
  category: string;
  cluster_id?: string;
  cluster_name?: string;
  stage_or_severity?: string;
  side: string;
  complaints: string;
  objective: string;
  recommendations: string;
  anamnesis_morbi?: string;
  rom: Record<string, number> | null;
  tests: Array<{
    code: string;
    name: string;
    expected: string;
    mandatory: number;
    evidence_level?: string;
    sensitivity_pct?: number;
    specificity_pct?: number;
    priority_level?: string;
  }>;
  diagnostics: Array<{
    code: string;
    name: string;
    modality: string;
    urgency: string;
    is_primary: number;
    servdict_price?: number;
    servdict_name?: string;
  }>;
  manipulations?: Array<{
    code: string;
    name: string;
    subcategory?: string;
    ebm_priority?: string;
    dosage_or_regimen?: string;
    is_stop_warning?: boolean | number;
    stop_rationale?: string;
    navigation_type?: string;
    servdict_price?: number;
  }>;
  physiotherapy?: Array<{
    code: string;
    name: string;
    modality_tag?: string;
    ebm_priority?: string;
    exact_dosimetry?: string;
    dosage_or_regimen?: string;
    servdict_price?: number;
  }>;
  orthotics?: Array<{
    code: string;
    name: string;
    weight_bearing_mode?: string;
    ebm_priority?: string;
    wearing_regimen?: string;
    device_type_iso?: string;
    servdict_price?: number;
  }>;
  lfk?: Array<{
    code: string;
    name: string;
    phase_number?: number;
    phase_name?: string;
    stage_step?: string;
    dosage_prescription?: string;
    kinetic_chain?: string;
    pain_threshold_zone?: string;
    tempo_and_hold?: string;
  }>;
  tests_count?: number;
  diagnostics_count?: number;
  manipulations_count?: number;
  physiotherapy_count?: number;
  orthotics_count?: number;
  lfk_count?: number;
}

export const CLINICAL_TEMPLATES_FALLBACK: ClinicalTemplateDetail[] = [
  {
    id: 5,
    title: 'Первичный гонартроз II стадии с реактивным синовитом',
    jointCategory: 'knee',
    mkbCode: 'M17.1',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'II стадия по Kellgren-Lawrence',
    side: 'right',
    complaints: 'Боль по внутренней поверхности коленного сустава при физической нагрузке, спуске по лестнице и в начале ходьбы («стартовые боли»). Чувство распирания и припухлость в области заворотов.',
    objective: 'Умеренный genu varum. Синовит II степени. Пальпация медиальной суставной щели и гусиной лапки резко болезненна. Крепитация при сгибании.',
    recommendations: 'Разгрузка сустава тростью при длительной ходьбе, индивидуальные ортопедические стельки с разгрузкой медиального компартмента, курс PRP и физиотерапии.',
    rom: { flexion_active: 110, flexion_passive: 120, extension_deficit: -5 },
    tests: [],
    diagnostics: [],
    tests_count: 5,
    diagnostics_count: 3,
    manipulations_count: 2,
    physiotherapy_count: 3,
    orthotics_count: 2,
    lfk_count: 2
  },
  {
    id: 9,
    title: 'Субакромиальный импинджмент-синдром плеча',
    jointCategory: 'shoulder',
    mkbCode: 'M75.1',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс',
    stage_or_severity: 'Стадия II по Neer (фиброз и тендинит)',
    side: 'right',
    complaints: 'Боль по наружной поверхности плеча при отведении руки в диапазоне 60–120° («дуга болезненного отведения»). Ночная боль при сне на больном плече.',
    objective: 'Пальпация субакромиальной зоны болезненна. Пробы Нира и Хокинса положительны. Атрофии дельтовидной мышцы нет.',
    recommendations: 'Исключить движения руки выше уровня плеча, курс высокоинтенсивного лазера HILT и ударно-волновой терапии УВТ.',
    rom: { abduction: 90, flexion_active: 100, flexion_passive: 160, rotation_ext: 45, rotation_int: 50 },
    tests: [],
    diagnostics: [],
    tests_count: 5,
    diagnostics_count: 3,
    manipulations_count: 2,
    physiotherapy_count: 3,
    orthotics_count: 1,
    lfk_count: 2
  }
];

const BASE_JOINT_LABELS: Record<string, string> = {
  all: 'Все суставы',
  knee: 'Коленный',
  shoulder: 'Плечевой',
  elbow: 'Локтевой',
  hip: 'Тазобедренный',
  ankle: 'Стопа и голеностоп',
  wrist: 'Кисть и запястье',
  spine: 'Позвоночник'
};

const SIDE_LABELS: Record<string, string> = {
  right: 'Правая сторона',
  left: 'Левая сторона',
  bilateral: 'Двустороннее',
  affected: 'Пораженная сторона'
};

export default function OrthoTemplatesGuideRegistry() {
  const navigate = useNavigate();
  const [registryTemplates, setRegistryTemplates] = useState<ClinicalTemplateDetail[]>(CLINICAL_TEMPLATES_FALLBACK);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [selectedJoint, setSelectedJoint] = useState<string>('all');
  const [selectedTreatmentFilter, setSelectedTreatmentFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch('/api/ortho/templates/detailed?with_details=1')
      .then(r => r.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.templates) && data.templates.length > 0) {
          const mapped: ClinicalTemplateDetail[] = data.templates.map((t: any) => {
            let parsedRom = null;
            try {
              parsedRom = typeof t.rom_norm_preset === 'string' ? JSON.parse(t.rom_norm_preset) : t.rom_norm_preset;
            } catch {}
            return {
              id: t.id,
              title: t.title,
              jointCategory: t.jointCategory || t.joint_name || 'knee',
              mkbCode: t.mkbCode || t.default_mkb_code || '',
              category: t.category || '',
              cluster_id: t.cluster_id || '',
              cluster_name: t.cluster_name || '',
              stage_or_severity: t.stage_or_severity || '',
              side: t.side || t.default_side || 'right',
              complaints: t.complaints || t.complaints_template || '',
              objective: t.objective || t.objective_template || '',
              recommendations: t.recommendations || t.recommendations_template || '',
              anamnesis_morbi: t.anamnesis_morbi || t.anamnesis_template || '',
              rom: t.rom || parsedRom,
              tests: t.tests || [],
              diagnostics: t.diagnostics || [],
              manipulations: t.manipulations || undefined,
              physiotherapy: t.physiotherapy || undefined,
              orthotics: t.orthotics || undefined,
              lfk: t.lfk || undefined,
              tests_count: t.tests_count ?? (t.tests ? t.tests.length : 0),
              diagnostics_count: t.diagnostics_count ?? (t.diagnostics ? t.diagnostics.length : 0),
              manipulations_count: t.manipulations_count ?? 0,
              physiotherapy_count: t.physiotherapy_count ?? 0,
              orthotics_count: t.orthotics_count ?? 0,
              lfk_count: t.lfk_count ?? 0
            };
          });
          setRegistryTemplates(mapped);
        }
      })
      .catch(err => {
        console.error('Failed to fetch full templates for guide:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const clusterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: registryTemplates.length };
    registryTemplates.forEach(t => {
      if (t.cluster_id) {
        counts[t.cluster_id] = (counts[t.cluster_id] || 0) + 1;
      }
    });
    return counts;
  }, [registryTemplates]);

  const jointCounts = useMemo(() => {
    const counts: Record<string, number> = { all: registryTemplates.length };
    registryTemplates.forEach(t => {
      if (t.jointCategory) {
        counts[t.jointCategory] = (counts[t.jointCategory] || 0) + 1;
      }
    });
    return counts;
  }, [registryTemplates]);

  const filtered = useMemo(() => {
    return registryTemplates.filter((t) => {
      const matchCluster = selectedCluster === 'all' || t.cluster_id === selectedCluster;
      const matchJoint = selectedJoint === 'all' || t.jointCategory === selectedJoint;
      if (!matchCluster || !matchJoint) return false;

      if (selectedTreatmentFilter === 'manipulations' && (t.manipulations_count || 0) === 0) return false;
      if (selectedTreatmentFilter === 'physio' && (t.physiotherapy_count || 0) === 0) return false;
      if (selectedTreatmentFilter === 'orthotics' && (t.orthotics_count || 0) === 0) return false;
      if (selectedTreatmentFilter === 'lfk' && (t.lfk_count || 0) === 0) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const testsStr = (t.tests || []).map((x) => x.name + ' ' + x.code).join(' ').toLowerCase();
      const diagsStr = (t.diagnostics || []).map((x) => x.name + ' ' + x.code).join(' ').toLowerCase();
      const manStr = (t.manipulations || []).map((x) => x.name + ' ' + x.code).join(' ').toLowerCase();
      const physStr = (t.physiotherapy || []).map((x) => x.name + ' ' + x.code).join(' ').toLowerCase();
      const orthStr = (t.orthotics || []).map((x) => x.name + ' ' + x.code).join(' ').toLowerCase();
      const lfkStr = (t.lfk || []).map((x) => x.name + ' ' + x.code).join(' ').toLowerCase();

      return (
        t.title.toLowerCase().includes(q) ||
        t.mkbCode.toLowerCase().includes(q) ||
        (t.stage_or_severity && t.stage_or_severity.toLowerCase().includes(q)) ||
        (t.cluster_name && t.cluster_name.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q) ||
        t.complaints.toLowerCase().includes(q) ||
        t.objective.toLowerCase().includes(q) ||
        t.recommendations.toLowerCase().includes(q) ||
        testsStr.includes(q) ||
        diagsStr.includes(q) ||
        manStr.includes(q) ||
        physStr.includes(q) ||
        orthStr.includes(q) ||
        lfkStr.includes(q)
      );
    });
  }, [registryTemplates, search, selectedCluster, selectedJoint, selectedTreatmentFilter]);

  const loadingDetailsRef = useRef<Set<number>>(new Set());

  const loadTemplateDetails = async (id: number) => {
    const target = registryTemplates.find(t => t.id === id);
    if (!target) return;
    if (target.manipulations !== undefined) return;
    if (loadingDetailsRef.current.has(id)) return;

    loadingDetailsRef.current.add(id);
    try {
      const res = await fetch(`/api/ortho/templates/${id}/full`);
      const d = await res.json();
      if (d.success && d.template) {
        setRegistryTemplates(prev => prev.map(item => item.id === id ? {
          ...item,
          complaints: d.template.complaints_template || item.complaints,
          objective: d.template.objective_template || item.objective,
          recommendations: d.template.recommendations_template || item.recommendations,
          anamnesis_morbi: d.template.anamnesis_template || item.anamnesis_morbi,
          tests: (d.template.tests || []).map((tt: any) => ({
            code: tt.test_code,
            name: tt.name_ru || tt.name_lat || tt.test_code,
            expected: tt.expected_result,
            mandatory: tt.is_mandatory,
            evidence_level: tt.evidence_level,
            sensitivity_pct: tt.sensitivity_pct,
            specificity_pct: tt.specificity_pct,
            priority_level: tt.priority_level
          })),
          diagnostics: (d.template.diagnostics || []).map((dd: any) => ({
            code: dd.diagnostic_code,
            name: dd.name || dd.diagnostic_code,
            modality: dd.modality || '',
            urgency: dd.urgency || 'routine',
            is_primary: dd.is_primary || 1,
            servdict_price: dd.servdict_price,
            servdict_name: dd.servdict_name
          })),
          manipulations: (d.template.manipulations || []).map((mm: any) => ({
            code: mm.manipulation_code,
            name: mm.name || mm.manipulation_code,
            subcategory: mm.subcategory,
            ebm_priority: mm.ebm_priority,
            dosage_or_regimen: mm.dosage_or_regimen,
            is_stop_warning: mm.is_stop_warning,
            stop_rationale: mm.stop_rationale,
            navigation_type: mm.navigation_type,
            servdict_price: mm.servdict_price
          })),
          physiotherapy: (d.template.physiotherapy || []).map((pp: any) => ({
            code: pp.physiotherapy_code,
            name: pp.name || pp.physiotherapy_code,
            modality_tag: pp.modality_tag,
            ebm_priority: pp.ebm_priority,
            exact_dosimetry: pp.exact_dosimetry,
            dosage_or_regimen: pp.dosage_or_regimen,
            servdict_price: pp.servdict_price
          })),
          orthotics: (d.template.orthotics || []).map((oo: any) => ({
            code: oo.orthotics_code,
            name: oo.name || oo.orthotics_code,
            weight_bearing_mode: oo.weight_bearing_mode,
            ebm_priority: oo.ebm_priority,
            wearing_regimen: oo.wearing_regimen,
            device_type_iso: oo.device_type_iso,
            servdict_price: oo.servdict_price
          })),
          lfk: (d.template.lfk || []).map((ll: any) => ({
            code: ll.lfk_code,
            name: ll.name || ll.lfk_code,
            phase_number: ll.phase_number,
            phase_name: ll.phase_name,
            stage_step: ll.stage_step,
            dosage_prescription: ll.dosage_prescription,
            kinetic_chain: ll.kinetic_chain,
            pain_threshold_zone: ll.pain_threshold_zone,
            tempo_and_hold: ll.tempo_and_hold
          }))
        } : item));
      }
    } catch (e) {
      console.error('Failed to lazy load template detail:', e);
    } finally {
      loadingDetailsRef.current.delete(id);
    }
  };

  const handleToggle = (id: number, nextExpanded?: boolean) => {
    setExpanded((prev) => {
      const isNowExpanded = nextExpanded !== undefined ? nextExpanded : !prev[id];
      if (isNowExpanded) {
        loadTemplateDetails(id);
      }
      return { ...prev, [id]: isNowExpanded };
    });
  };

  const expandAll = () => {
    const next: Record<number, boolean> = {};
    filtered.forEach((t) => { next[t.id] = true; });
    startTransition(() => {
      setExpanded(next);
    });
    // Pre-load details for visible batch of templates
    filtered.slice(0, 15).forEach((t) => {
      if (t.manipulations === undefined) {
        loadTemplateDetails(t.id);
      }
    });
  };

  const collapseAll = () => {
    startTransition(() => {
      setExpanded({});
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Top Banner and Summary */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 2.5,
          border: '1px solid #BAE6FD',
          bgcolor: '#F0F9FF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0369A1', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleIcon sx={{ color: '#0284C7' }} />
            Эталонный реестр: {registryTemplates.length} структурированных клинических протоколов (11 Кластеров)
          </Typography>
          <Typography variant="body2" sx={{ color: '#0284C7', mt: 0.5 }}>
            Корпоративная база доказательной ортопедии МИС «ОртоERP»: классификация по 11 клиническим кластерам и МКБ-10, готовые формулировки жалоб и объективного статуса, Neutral-0 нормы ROM, профильные доказательные тесты, план аппаратной диагностики и 4 подсистемы восстановительного лечения (манипуляции, физио, ортезы, ЛФК).
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<OpenInNewIcon />}
            onClick={() => navigate('/ortho-templates')}
            sx={{ bgcolor: '#0284C7', textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
          >
            Справочник шаблонов 2.0
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MedicalServicesIcon />}
            onClick={() => navigate('/ortho-workstation')}
            sx={{ borderColor: '#0284C7', color: '#0284C7', textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
          >
            АРМ врача
          </Button>
        </Box>
      </Paper>

      {/* Cluster Master Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.65,
          p: 1.25,
          bgcolor: '#FFFFFF',
          borderRadius: 2,
          border: '1px solid #E2E8F0'
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.6,
            px: 1,
            py: 0.35,
            bgcolor: '#F1F5F9',
            borderRadius: 1.5,
            border: '1px solid #CBD5E1',
            flexShrink: 0,
            height: 28
          }}
        >
          <LayersIcon sx={{ fontSize: 16, color: '#0F3C64' }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: '#0F3C64',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: '0.7rem'
            }}
          >
            Кластеры:
          </Typography>
        </Box>

        {MASTER_CLUSTERS.map(c => {
          const isSelected = selectedCluster === c.id;
          const count = clusterCounts[c.id] || 0;
          return (
            <Chip
              key={c.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  {c.id !== 'all' && (
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: isSelected ? '#FFFFFF' : c.badge_color, flexShrink: 0 }} />
                  )}
                  <span>{c.name_ru}</span>
                  <span
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                      padding: '1px 5px',
                      borderRadius: 10,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      lineHeight: 1.2
                    }}
                  >
                    {count}
                  </span>
                </Box>
              }
              clickable
              size="small"
              onClick={() => setSelectedCluster(c.id)}
              sx={{
                fontWeight: isSelected ? 800 : 600,
                fontSize: '0.74rem',
                height: 28,
                px: 0.4,
                color: isSelected ? '#FFFFFF' : '#334155',
                bgcolor: isSelected ? c.badge_color : '#F8FAFC',
                border: `1px solid ${isSelected ? c.badge_color : '#E2E8F0'}`,
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                  bgcolor: isSelected ? c.badge_color : '#E2E8F0',
                  borderColor: isSelected ? c.badge_color : '#CBD5E1'
                }
              }}
            />
          );
        })}
      </Box>

      {/* Joint Tabs Filter */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {Object.entries(BASE_JOINT_LABELS).map(([key, label]) => {
          const isSelected = selectedJoint === key;
          const count = jointCounts[key] || 0;
          return (
            <Chip
              key={key}
              label={`${label} (${count})`}
              onClick={() => setSelectedJoint(key)}
              sx={{
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                bgcolor: isSelected ? '#0F3C64' : '#F1F5F9',
                color: isSelected ? '#FFFFFF' : '#475569',
                border: isSelected ? '1px solid #0F3C64' : '1px solid #CBD5E1',
                '&:hover': {
                  bgcolor: isSelected ? '#156C9C' : '#E2E8F0'
                }
              }}
            />
          );
        })}
      </Box>

      {/* Treatment Modality Filter Bar */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
          Терапия:
        </Typography>
        {[
          { id: 'all', label: 'Все программы' },
          { id: 'manipulations', label: '💉 С манипуляциями / PRP' },
          { id: 'physio', label: '⚡ С физиотерапией' },
          { id: 'orthotics', label: '🛡️ С ортезированием' },
          { id: 'lfk', label: '🏃 С ЛФК' }
        ].map((btn) => (
          <Chip
            key={btn.id}
            size="small"
            label={btn.label}
            onClick={() => setSelectedTreatmentFilter(btn.id)}
            sx={{
              fontWeight: selectedTreatmentFilter === btn.id ? 800 : 500,
              bgcolor: selectedTreatmentFilter === btn.id ? '#0F766E' : '#F8FAFC',
              color: selectedTreatmentFilter === btn.id ? '#FFFFFF' : '#334155',
              border: `1px solid ${selectedTreatmentFilter === btn.id ? '#0F766E' : '#E2E8F0'}`,
              cursor: 'pointer',
              '&:hover': { bgcolor: selectedTreatmentFilter === btn.id ? '#0F766E' : '#F1F5F9' }
            }}
          />
        ))}
      </Box>

      {/* Search and Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Поиск по нозологии, коду МКБ-10, тестам, МРТ/УЗИ, PRP, физио, ортезам, ЛФК..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              )
            }
          }}
        />
        <Button
          size="small"
          variant="outlined"
          startIcon={<UnfoldMoreIcon />}
          onClick={expandAll}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#0F3C64', borderColor: '#CBD5E1' }}
        >
          Развернуть все
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<UnfoldLessIcon />}
          onClick={collapseAll}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#CBD5E1' }}
        >
          Свернуть все
        </Button>
      </Box>

      {/* Templates List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress size={36} />
          </Box>
        ) : filtered.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary">
              Шаблоны не найдены по заданным критериям фильтрации
            </Typography>
            {(selectedCluster !== 'all' || selectedJoint !== 'all' || selectedTreatmentFilter !== 'all' || search) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSelectedCluster('all');
                  setSelectedJoint('all');
                  setSelectedTreatmentFilter('all');
                  setSearch('');
                }}
                sx={{ mt: 1.5, textTransform: 'none' }}
              >
                Сбросить фильтры
              </Button>
            )}
          </Paper>
        ) : (
          filtered.map((t) => {
            const isExp = !!expanded[t.id];
            const cluster = MASTER_CLUSTERS.find(c => c.id === t.cluster_id);
            const clusterColor = cluster?.badge_color || '#0F3C64';
            return (
              <Accordion
                key={t.id}
                expanded={isExp}
                onChange={(_, nextExpanded) => handleToggle(t.id, nextExpanded)}
                slotProps={{ transition: { unmountOnExit: true } }}
                sx={{
                  border: '1px solid #CBD5E1',
                  borderLeft: `5px solid ${clusterColor}`,
                  borderRadius: '10px !important',
                  overflow: 'hidden',
                  boxShadow: isExp ? '0 4px 12px rgba(15, 60, 100, 0.08)' : 'none',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#0F3C64' }} />}
                  sx={{
                    bgcolor: isExp ? '#F8FAFC' : '#FFFFFF',
                    px: 2.5,
                    py: 1,
                    borderBottom: isExp ? '1px solid #E2E8F0' : 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', flexWrap: 'wrap' }}>
                    {cluster && (
                      <Chip
                        size="small"
                        label={cluster.code}
                        sx={{
                          bgcolor: clusterColor,
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          height: 24,
                          borderRadius: '4px'
                        }}
                      />
                    )}
                    <Chip
                      size="small"
                      label={t.mkbCode || 'Без МКБ'}
                      sx={{
                        fontWeight: 800,
                        bgcolor: '#0F3C64',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        height: 24
                      }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', flexGrow: 1, minWidth: 220 }}>
                      <LatexText text={t.title} />
                    </Typography>
                    {t.stage_or_severity && (
                      <Chip
                        size="small"
                        label={t.stage_or_severity}
                        variant="outlined"
                        sx={{ fontWeight: 600, color: '#0284C7', borderColor: '#BAE6FD', bgcolor: '#F0F9FF', fontSize: '0.72rem' }}
                      />
                    )}
                    <Chip
                      size="small"
                      label={t.category}
                      variant="outlined"
                      sx={{ fontWeight: 600, color: '#475569', borderColor: '#E2E8F0', bgcolor: '#F8FAFC', fontSize: '0.72rem' }}
                    />
                    <Chip
                      size="small"
                      label={SIDE_LABELS[t.side] || t.side}
                      sx={{ fontWeight: 600, color: '#475569', bgcolor: '#F1F5F9', fontSize: '0.72rem' }}
                    />

                    {/* Feature Badges */}
                    {(t.tests_count ?? t.tests.length) > 0 && (
                      <Chip
                        size="small"
                        icon={<HealingIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${t.tests_count ?? t.tests.length} тестов`}
                        sx={{ fontWeight: 700, color: '#166534', bgcolor: '#DCFCE7', fontSize: '0.72rem' }}
                      />
                    )}
                    {(t.diagnostics_count ?? t.diagnostics.length) > 0 && (
                      <Chip
                        size="small"
                        icon={<BiotechIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${t.diagnostics_count ?? t.diagnostics.length} исслед.`}
                        sx={{ fontWeight: 700, color: '#9333EA', bgcolor: '#F3E8FF', fontSize: '0.72rem' }}
                      />
                    )}
                    {(t.manipulations_count ?? 0) > 0 && (
                      <Chip
                        size="small"
                        icon={<MedicalServicesIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${t.manipulations_count} манипул.`}
                        sx={{ fontWeight: 700, color: '#0F766E', bgcolor: '#CCFBF1', fontSize: '0.72rem' }}
                      />
                    )}
                    {(t.physiotherapy_count ?? 0) > 0 && (
                      <Chip
                        size="small"
                        icon={<FitnessCenterIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${t.physiotherapy_count} физио`}
                        sx={{ fontWeight: 700, color: '#1D4ED8', bgcolor: '#DBEAFE', fontSize: '0.72rem' }}
                      />
                    )}
                    {(t.orthotics_count ?? 0) > 0 && (
                      <Chip
                        size="small"
                        icon={<ShieldIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${t.orthotics_count} ортез`}
                        sx={{ fontWeight: 700, color: '#6D28D9', bgcolor: '#EDE9FE', fontSize: '0.72rem' }}
                      />
                    )}
                    {(t.lfk_count ?? 0) > 0 && (
                      <Chip
                        size="small"
                        icon={<DirectionsRunIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${t.lfk_count} ЛФК`}
                        sx={{ fontWeight: 700, color: '#047857', bgcolor: '#D1FAE5', fontSize: '0.72rem' }}
                      />
                    )}
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 2.5, bgcolor: '#FFFFFF' }}>
                  <Grid container spacing={2.5}>
                    {/* Left Column: Clinical Text Presets */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                            Стандартные жалобы пациента:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#1E293B', mt: 0.5, lineHeight: 1.6, bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                            {t.complaints}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                            Локальный статус (Status Localis):
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#1E293B', mt: 0.5, lineHeight: 1.6, bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                            {t.objective}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                            Рекомендации, режим и план лечения:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#1E293B', mt: 0.5, lineHeight: 1.6, bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                            {t.recommendations}
                          </Typography>
                        </Box>

                        {/* ROM Norms (Neutral-0) */}
                        {t.rom && (
                          <Box sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <StraightenIcon fontSize="small" sx={{ color: '#0284C7' }} />
                              Физиологические нормы ROM (Neutral-0):
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {Object.entries(t.rom).map(([k, v]) => (
                                <Chip
                                  key={k}
                                  size="small"
                                  label={`${k}: ${v}°`}
                                  sx={{ fontWeight: 700, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F3C64' }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    {/* Right Column: Tests, Diagnostics & 4 Treatment Subsystems */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                        {/* Profile Tests */}
                        <Box sx={{ p: 1.5, border: '1px solid #DCFCE7', borderRadius: 2, bgcolor: '#F0FDF4' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <HealingIcon fontSize="small" sx={{ color: '#166534' }} /> Профильные ортопедические тесты (доказательная медицина):
                          </Typography>
                          {t.tests.length === 0 ? (
                            <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                              {t.tests_count ? `Загрузка ${t.tests_count} тестов...` : 'Базовый общеклинический осмотр'}
                            </Typography>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                              {t.tests.map((tt) => (
                                <Box key={tt.code} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534' }}>
                                    • <LatexText text={tt.name} />
                                    {tt.sensitivity_pct ? ` (Se ${tt.sensitivity_pct}%, Sp ${tt.specificity_pct}%)` : ''}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={tt.expected === 'positive' ? 'Ожидается (+)' : tt.expected}
                                    sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700, bgcolor: '#BBF7D0', color: '#14532D' }}
                                  />
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>

                        {/* Profile Diagnostics */}
                        <Box sx={{ p: 1.5, border: '1px solid #F3E8FF', borderRadius: 2, bgcolor: '#FAF5FF' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#7E22CE', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <BiotechIcon fontSize="small" sx={{ color: '#7E22CE' }} /> План инструментального обследования:
                          </Typography>
                          {t.diagnostics.length === 0 ? (
                            <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                              {t.diagnostics_count ? `Загрузка ${t.diagnostics_count} исследований...` : 'По клиническим показаниям'}
                            </Typography>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                              {t.diagnostics.map((dd) => (
                                <Box key={dd.code} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B21A8' }}>
                                    • <LatexText text={dd.name} /> {dd.servdict_price ? `(${dd.servdict_price.toLocaleString('ru-RU')} ₽)` : ''}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={dd.modality.toUpperCase()}
                                    sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700, bgcolor: '#E9D5FF', color: '#581C87' }}
                                  />
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>

                        {/* Manipulations & Injections */}
                        {(t.manipulations_count ?? 0) > 0 && (
                          <Box sx={{ p: 1.5, border: '1px solid #CCFBF1', borderRadius: 2, bgcolor: '#F0FDFA' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <MedicalServicesIcon fontSize="small" sx={{ color: '#0F766E' }} /> Лечебные манипуляции и инъекции (PRP / Блокады):
                            </Typography>
                            {!t.manipulations || t.manipulations.length === 0 ? (
                              <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                                Загрузка {t.manipulations_count} манипуляций...
                              </Typography>
                            ) : (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                                {t.manipulations.map((mm) => (
                                  <Box key={mm.code} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#134E4A' }}>
                                      • <LatexText text={mm.name} /> {mm.dosage_or_regimen ? <span>— <LatexText text={mm.dosage_or_regimen} /></span> : ''}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={mm.ebm_priority || 'EBM'}
                                      sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700, bgcolor: '#99F6E4', color: '#115E59' }}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* Physiotherapy */}
                        {(t.physiotherapy_count ?? 0) > 0 && (
                          <Box sx={{ p: 1.5, border: '1px solid #DBEAFE', borderRadius: 2, bgcolor: '#EFF6FF' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <FitnessCenterIcon fontSize="small" sx={{ color: '#1E40AF' }} /> Аппаратная физиотерапия (EBM стандарты):
                            </Typography>
                            {!t.physiotherapy || t.physiotherapy.length === 0 ? (
                              <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                                Загрузка {t.physiotherapy_count} методов физиотерапии...
                              </Typography>
                            ) : (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                                {t.physiotherapy.map((pp) => (
                                  <Box key={pp.code} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                                      • <LatexText text={pp.name} /> {pp.exact_dosimetry ? <span>(<LatexText text={pp.exact_dosimetry} />)</span> : ''}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={pp.ebm_priority || 'P1'}
                                      sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700, bgcolor: '#BFDBFE', color: '#1E40AF' }}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* Orthotics & Biomechanics */}
                        {(t.orthotics_count ?? 0) > 0 && (
                          <Box sx={{ p: 1.5, border: '1px solid #EDE9FE', borderRadius: 2, bgcolor: '#F5F3FF' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <ShieldIcon fontSize="small" sx={{ color: '#6D28D9' }} /> Ортезирование и средства разгрузки:
                            </Typography>
                            {!t.orthotics || t.orthotics.length === 0 ? (
                              <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                                Загрузка {t.orthotics_count} ортезов...
                              </Typography>
                            ) : (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                                {t.orthotics.map((oo) => (
                                  <Box key={oo.code} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#4C1D95' }}>
                                      • <LatexText text={oo.name} /> {oo.wearing_regimen ? <span>[<LatexText text={oo.wearing_regimen} />]</span> : ''}
                                    </Typography>
                                    {oo.weight_bearing_mode && (
                                      <Chip
                                        size="small"
                                        label={<LatexText text={oo.weight_bearing_mode} />}
                                        sx={{ height: 20, fontSize: '0.72rem', fontWeight: 800, bgcolor: '#DDD6FE', color: '#5B21B6' }}
                                      />
                                    )}
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* Exercise Therapy LFK */}
                        {(t.lfk_count ?? 0) > 0 && (
                          <Box sx={{ p: 1.5, border: '1px solid #D1FAE5', borderRadius: 2, bgcolor: '#ECFDF5' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#047857', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <DirectionsRunIcon fontSize="small" sx={{ color: '#047857' }} /> Кинезиотерапия и ЛФК:
                            </Typography>
                            {!t.lfk || t.lfk.length === 0 ? (
                              <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                                Загрузка {t.lfk_count} комплексов ЛФК...
                              </Typography>
                            ) : (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                                {t.lfk.map((ll) => (
                                  <Box key={ll.code} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#064E3B' }}>
                                      • <LatexText text={ll.name} /> {ll.stage_step ? <span>— <LatexText text={ll.stage_step} /></span> : ''}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={ll.kinetic_chain || 'ЛФК'}
                                      sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700, bgcolor: '#A7F3D0', color: '#065F46' }}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })
        )}
      </Box>
    </Box>
  );
}
