import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Slider,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Autocomplete,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  InputAdornment,
  Card,
  CardActionArea,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel,
  Badge
} from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import HistoryIcon from '@mui/icons-material/History';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PersonIcon from '@mui/icons-material/Person';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';
import LayersIcon from '@mui/icons-material/Layers';
import { API_BASE_URL } from '../config/apiConfig';
import BodyHomunculus, { JOINT_TO_CLUSTER } from '../components/ortho/BodyHomunculus';
import type { JointAreaId, JointExamSummary } from '../components/ortho/BodyHomunculus';
import JointExamCard from '../components/ortho/JointExamCard';
import type { JointExamState } from '../components/ortho/JointExamCard';
import PatientMediaHub from '../components/ortho/PatientMediaHub';
import type { MediaItem } from '../components/ortho/PatientMediaHub';
import DiagnosticRecommendationsCard from '../components/ortho/DiagnosticRecommendationsCard';
import ScienceIcon from '@mui/icons-material/Science';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import PrintIcon from '@mui/icons-material/Print';
import HealingIcon from '@mui/icons-material/Healing';
import BiotechIcon from '@mui/icons-material/Biotech';
import StarIcon from '@mui/icons-material/Star';
import StraightenIcon from '@mui/icons-material/Straighten';
import FitnessIcon from '@mui/icons-material/FitnessCenter';
import ShieldIcon from '@mui/icons-material/Shield';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import BoltIcon from '@mui/icons-material/Bolt';
import { OrthoSandwichCard } from '../components/ortho/OrthoSandwichCard';
import LatexText from '../components/ortho/LatexText';
import OrthoProtocolPreview from '../components/ortho/OrthoProtocolPreview';
import IssueReferralModal from '../components/ortho/IssueReferralModal';
import type { OrthoProtocolData, OrthoPrescriptionItem } from '../components/reports/OrthoProtocolPrintTemplate';
import { parseProtocolContent } from '../utils/protocolXmlParser';
import { getWeightBearingBadge } from './OrthoTemplatesManager';

export interface MasterCluster {
  id: string;
  code: string;
  name_ru: string;
  joint_affinity: string;
  badge_color: string;
  sort_order: number;
}

export const MASTER_CLUSTERS: MasterCluster[] = [
  { id: 'all', code: 'ALL', name_ru: 'Все кластеры', joint_affinity: 'all', badge_color: '#0F3C64', sort_order: 0 },
  { id: 'cluster_knee', code: 'KNEE', name_ru: '1. Коленный сустав', joint_affinity: 'knee', badge_color: '#0284C7', sort_order: 10 },
  { id: 'cluster_shoulder', code: 'SHOULDER', name_ru: '2. Плечевой пояс', joint_affinity: 'shoulder', badge_color: '#9333EA', sort_order: 20 },
  { id: 'cluster_hip_pelvis', code: 'HIP_PELVIS', name_ru: '3. Таз и ТБС', joint_affinity: 'hip', badge_color: '#16A34A', sort_order: 30 },
  { id: 'cluster_foot_ankle', code: 'FOOT_ANKLE', name_ru: '4. Стопа и голеностоп', joint_affinity: 'ankle', badge_color: '#0D9488', sort_order: 40 },
  { id: 'cluster_elbow', code: 'ELBOW', name_ru: '5. Локтевой сустав', joint_affinity: 'elbow', badge_color: '#EA580C', sort_order: 50 },
  { id: 'cluster_wrist_hand', code: 'WRIST_HAND', name_ru: '6. Кисть и запястье', joint_affinity: 'wrist', badge_color: '#DB2777', sort_order: 60 },
  { id: 'cluster_spine', code: 'SPINE', name_ru: '7. Позвоночник и торакс', joint_affinity: 'spine', badge_color: '#475569', sort_order: 70 },
  { id: 'cluster_pediatric', code: 'PEDIATRIC', name_ru: '8. Детская ортопедия', joint_affinity: 'general', badge_color: '#D97706', sort_order: 80 },
  { id: 'cluster_systemic', code: 'SYSTEMIC', name_ru: '9. Системные синдромы', joint_affinity: 'general', badge_color: '#4F46E5', sort_order: 90 },
  { id: 'cluster_postop', code: 'POSTOP', name_ru: '10. Постоперационный контроль', joint_affinity: 'general', badge_color: '#059669', sort_order: 100 },
  { id: 'cluster_author', code: 'AUTHOR', name_ru: '11. Авторские протоколы', joint_affinity: 'general', badge_color: '#0D9488', sort_order: 110 }
];

// Common ICD-10 Orthopedic options for quick autocomplete
const COMMON_MKB10 = [
  { code: 'M17.0', name: 'Первичный гонартроз двусторонний' },
  { code: 'M17.1', name: 'Другой первичный гонартроз (односторонний)' },
  { code: 'M17.2', name: 'Посттравматический гонартроз двусторонний' },
  { code: 'M17.3', name: 'Другой посттравматический гонартроз' },
  { code: 'M16.0', name: 'Первичный коксартроз двусторонний' },
  { code: 'M16.1', name: 'Другой первичный коксартроз (односторонний)' },
  { code: 'M23.2', name: 'Поражение мениска в результате старого разрыва или травмы' },
  { code: 'M75.1', name: 'Синдром сдавления ротатора плеча (импинджмент)' },
  { code: 'M75.2', name: 'Тендинит двуглавой мышцы плеча' },
  { code: 'M77.1', name: 'Латеральный эпикондилит («локоть теннисиста»)' },
  { code: 'M77.0', name: 'Медиальный эпикондилит («локоть гольфиста»)' },
  { code: 'M70.2', name: 'Бурсит локтевого отростка (олекранона)' },
  { code: 'M19.0', name: 'Первичный артроз других суставов (в т.ч. локтевого)' },
  { code: 'G56.2', name: 'Поражение локтевого нерва (синдром кубитального канала)' },
  { code: 'S53.4', name: 'Растяжение и перенапряжение связок локтевого сустава' },
  { code: 'M77.3', name: 'Пяточная шпора (плантарный фасциит)' },
  { code: 'M54.5', name: 'Боль внизу спины (люмбалгия)' },
  { code: 'M54.4', name: 'Люмбаго с ишиасом' },
  { code: 'S83.5', name: 'Растяжение, разрыв крестообразной связки коленного сустава' },
  { code: 'M20.1', name: 'Наружное искривление первого пальца (Hallux valgus)' },
  { code: 'M19.9', name: 'Артроз неуточненный' }
];

export const INITIAL_LFK_PHASE_1: OrthoPrescriptionItem = {
  id: 'lfk_phase_1',
  code: 'LFK-PHASE-1',
  name: 'Курс ЛФК: Фаза I: Острая / Мобилизация (0–2 недели)',
  title: 'Курс ЛФК: Фаза I: Острая / Мобилизация (0–2 недели)',
  category: 'lfk',
  quantity: 1,
  price: 0,
  unitPrice: 0,
  dosage_notes: 'Щадящие изометрические сокращения (1RM <= 30%), пассивный ROM в безболезненном секторе. Контроль боли по Silbernagel: ВАШ <= 2.'
};

export const INITIAL_RECOMMENDATIONS = `1. Охранительный двигательный режим, исключение осевых ударных нагрузок.
2. Ношение разгрузочного ортеза при ходьбе.
3. Курс ЛФК и кинезиотерапии:

ПРОГРАММА ЛФК И КИНЕЗИОТЕРАПИИ:
Фаза I: Острая / Мобилизация (0–2 недели):
  • Цель: Купирование боли и отека, щадящие изометрические сокращения ($1RM \\le 30\\%$) с фиксацией 6 сек, пассивный ROM в безболезненном секторе.
  • Изометрическое напряжение мышц-стабилизаторов: 3 подхода по 10 повторений с удержанием 6 сек
  • Пассивный безболезненный ROM: мобилизация сустава 2–3 раза в день
  • Лимфодренажные упражнения и криотерапия в возвышенном положении`;

export const getLfkPhaseConfig = (phaseNum: number, lfkList: any[] = []) => {
  const phaseExercises = Array.isArray(lfkList)
    ? lfkList.filter((ex: any) => (ex.phase_number || 1) === phaseNum && !ex.is_stop_warning && ex.is_stop_warning !== 1)
    : [];

  const defaultPhases: Record<number, { title: string; short: string; sub: string; duration: string; goal: string; exercises: string[]; dosageNotes: string }> = {
    1: {
      title: 'Фаза I: Острая / Мобилизация (0–2 недели)',
      short: 'Фаза I',
      sub: 'Острая / Мобилизация',
      duration: '$0\\text{–}2$ нед.',
      goal: 'Купирование боли и отека, щадящие изометрические сокращения ($1RM \\le 30\\%$) с фиксацией 6 сек, пассивный ROM в безболезненном секторе.',
      exercises: [
        'Изометрическое напряжение мышц-стабилизаторов: 3 подхода по 10 повторений с удержанием 6 сек',
        'Пассивный безболезненный ROM: мобилизация сустава 2–3 раза в день',
        'Лимфодренажные упражнения и криотерапия в возвышенном положении'
      ],
      dosageNotes: 'Щадящие изометрические сокращения (1RM <= 30%), пассивный ROM. Мониторинг боли по Silbernagel: ВАШ <= 2.'
    },
    2: {
      title: 'Фаза II: Баланс и Амплитуда (2–6 недель)',
      short: 'Фаза II',
      sub: 'Баланс и Амплитуда',
      duration: '$2\\text{–}6$ нед.',
      goal: 'Восстановление полного активного объема движений ($100\\%$), упражнения закрытой кинематической цепи (CKC), тренировка проприоцепции, темп $3\\text{–}0\\text{–}3$.',
      exercises: [
        'Упражнения закрытой кинематической цепи (CKC): мини-приседания, жим платформы',
        'Проприоцептивный баланс-тренинг на нестабильной платформе: 3x30 сек',
        'Динамическая мобилизация и активный стретчинг в темпе 3-0-3'
      ],
      dosageNotes: 'Активный ROM 100%, CKC упражнения, проприоцепция (темп 3-0-3). Допустимая нагрузка: ВАШ <= 5.'
    },
    3: {
      title: 'Фаза III: Сила и Функция (6+ недель)',
      short: 'Фаза III',
      sub: 'Сила и Функция',
      duration: '$6+$ нед.',
      goal: 'Эксцентрическая переподготовка ($1RM \\ge 80\\%$), силовая выносливость, возврат к полной бытовой и спортивной активности.',
      exercises: [
        'Эксцентрические упражнения с прогрессирующим сопротивлением (1RM >= 80%)',
        'Низкоинтенсивная плиометрика и прыжковая переподготовка',
        'Специфический функционально-двигательный паттерн и кардионагрузка'
      ],
      dosageNotes: 'Эксцентрическая силовая переподготовка (1RM >= 80%), плиометрика, функциональный возврат.'
    }
  };

  const def = defaultPhases[phaseNum] || {
    title: `Фаза ${phaseNum}`,
    short: `Фаза ${phaseNum}`,
    sub: `Фаза ${phaseNum}`,
    duration: '',
    goal: 'Комплекс упражнений и кинезиотерапии',
    exercises: [],
    dosageNotes: `Курс кинезиотерапии (Фаза ${phaseNum})`
  };

  if (phaseExercises.length > 0) {
    const customTitle = phaseExercises[0]?.phase_name || def.title;
    const customGoal = phaseExercises[0]?.biomechanical_goal || def.goal;
    const customExercises = phaseExercises.map((ex: any) => {
      const exTitle = ex.exercise_name_override || ex.name || ex.short_name || ex.lfk_code;
      const dosage = ex.dosage_prescription || ex.standard_dosage || '';
      const tempo = ex.tempo_and_hold ? ` [темп: ${ex.tempo_and_hold}]` : '';
      const goal = ex.biomechanical_goal ? ` — цель: ${ex.biomechanical_goal}` : '';
      return `${exTitle}${dosage ? ': ' + dosage : ''}${tempo}${goal}`;
    });
    const customDosageNotes = phaseExercises
      .slice(0, 3)
      .map((ex: any) => `${ex.exercise_name_override || ex.name || ex.short_name}: ${ex.dosage_prescription || ex.standard_dosage || 'по схеме'}`)
      .join('; ');

    return {
      title: customTitle,
      short: def.short,
      sub: def.sub,
      duration: def.duration,
      goal: customGoal,
      exercises: customExercises,
      dosageNotes: customDosageNotes || def.dosageNotes
    };
  }

  return def;
};

export const createLfkPrescriptionItem = (phaseNum: number, lfkList: any[] = []): OrthoPrescriptionItem => {
  const cfg = getLfkPhaseConfig(phaseNum, lfkList);
  return {
    id: `lfk_phase_${phaseNum}`,
    code: `LFK-PHASE-${phaseNum}`,
    name: `Курс ЛФК: ${cfg.title}`,
    title: `Курс ЛФК: ${cfg.title}`,
    category: 'lfk',
    quantity: 1,
    price: 0,
    unitPrice: 0,
    dosage_notes: cfg.dosageNotes
  };
};

export default function OrthoWorkstation() {
  const { appointmentId } = useParams<{ appointmentId?: string }>();
  const [searchParams] = useSearchParams();
  const queryProtocolId = searchParams.get('protocolId');
  const queryPatientId = searchParams.get('patientId');
  const navigate = useNavigate();

  // Loading & State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Loaded Backend Context
  const [contextData, setContextData] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [biomechanicsHistory, setBiomechanicsHistory] = useState<any[]>([]);

  // Patient quick search in header
  const [patientSearchOptions, setPatientSearchOptions] = useState<any[]>([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);

  // Right Panel Tab: 0 = Preview, 1 = Media Hub, 2 = Biomechanics History
  const [rightPanelTab, setRightPanelTab] = useState(0);

  // Clinical Exam State
  const [protocolId, setProtocolId] = useState<number | null>(null);
  const [complaints, setComplaints] = useState('');
  const [anamnesis, setAnamnesis] = useState('');
  const [anamnesisVitae, setAnamnesisVitae] = useState('');
  const [objectiveStatus, setObjectiveStatus] = useState('');
  const [specialStudies, setSpecialStudies] = useState('');
  const [performedManipulations, setPerformedManipulations] = useState('');
  const [vasScore, setVasScore] = useState<number>(4);
  const [gait] = useState('Свободная, физиологическая, без хромоты.');
  const [posture] = useState('Осанка правильная, физиологические изгибы сохранены.');

  // Weight-bearing & orthotics / lfk UI states
  const [weightBearingMode, setWeightBearingMode] = useState<string>('FWB');
  const [lfkPhaseTab, setLfkPhaseTab] = useState<number>(1);
  const [activeLfkPhases, setActiveLfkPhases] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false
  });
  const [templateLfkData, setTemplateLfkData] = useState<any[]>([]);

  // 8 Clinical Domains Accordion Expanded state (Active/Chosen/Data present = Expanded, physiological norm/unselected = Collapsed)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    domain1_complaints: true,
    domain2_rom: true,
    domain3_tests: true,
    domain4_diagnostics: true,
    domain5_manipulations: true,
    domain6_physiotherapy: true,
    domain7_orthotics: true,
    domain8_lfk: true,
    complaints: true,
    anamnesis_morbi: true,
    anamnesis_vitae: true,
    objective_status: true,
    status_localis: true,
    functional_tests: true,
    special_studies: true,
    diagnosis: true,
    performed_manipulations: true,
    recommendations: true
  });

  // 8 Clinical Domains Active / Selective print filter state
  const [activeSections, setActiveSections] = useState<Record<string, boolean>>({
    domain1_complaints: true,
    domain2_rom: true,
    domain3_tests: true,
    domain4_diagnostics: true,
    domain5_manipulations: true,
    domain6_physiotherapy: true,
    domain7_orthotics: true,
    domain8_lfk: true,
    complaints: true,
    anamnesis_morbi: true,
    anamnesis_vitae: true,
    objective_status: true,
    status_localis: true,
    functional_tests: true,
    special_studies: true,
    diagnosis: true,
    performed_manipulations: true,
    recommendations: true
  });

  const handleToggleExpand = (secKey: string) => {
    setExpandedSections((prev) => ({ ...prev, [secKey]: !prev[secKey] }));
  };

  const handleExpandAll = () => {
    setExpandedSections({
      domain1_complaints: true,
      domain2_rom: true,
      domain3_tests: true,
      domain4_diagnostics: true,
      domain5_manipulations: true,
      domain6_physiotherapy: true,
      domain7_orthotics: true,
      domain8_lfk: true,
      complaints: true,
      anamnesis_morbi: true,
      anamnesis_vitae: true,
      objective_status: true,
      status_localis: true,
      functional_tests: true,
      special_studies: true,
      diagnosis: true,
      performed_manipulations: true,
      recommendations: true
    });
  };

  const handleCollapseAll = () => {
    setExpandedSections({
      domain1_complaints: false,
      domain2_rom: false,
      domain3_tests: false,
      domain4_diagnostics: false,
      domain5_manipulations: false,
      domain6_physiotherapy: false,
      domain7_orthotics: false,
      domain8_lfk: false,
      complaints: false,
      anamnesis_morbi: false,
      anamnesis_vitae: false,
      objective_status: false,
      status_localis: false,
      functional_tests: false,
      special_studies: false,
      diagnosis: false,
      performed_manipulations: false,
      recommendations: false
    });
  };

  const handleSmartFocus = () => {
    const hasDomain1 = Boolean(complaints.trim() || anamnesis.trim() || clinicalDiagnosis.trim() || vasScore > 0);
    const romDeficit = currentJointState.rom?.extension_deficit || 0;
    const effusion = currentJointState.effusion || 0;
    const isRomPathology = romDeficit > 0 || effusion > 0 || (currentJointState.rom?.flexion_active !== undefined && currentJointState.rom.flexion_active < 130);
    const hasPositiveTest = Object.values(currentJointState.tests || {}).some(
      (v) => v === 'positive' || v === 'positive_medial' || v === 'positive_lateral'
    );
    const hasDiagnostics = Boolean(
      activeTemplateDiagnostics.length > 0 ||
      specialStudies.trim() ||
      prescriptions.some((p) => p.category === 'diagnostic' || p.category === 'Диагностика')
    );
    const hasManipulations = Boolean(
      performedManipulations.trim() ||
      prescriptions.some((p) => p.category === 'manipulation')
    );
    const hasPhysio = prescriptions.some((p) => p.category === 'physio');
    const hasOrthotics = Boolean(
      prescriptions.some((p) => p.category === 'orthotics') ||
      weightBearingMode !== 'FWB'
    );
    const hasLfk = Boolean(
      recommendations.toLowerCase().includes('лфк') ||
      recommendations.toLowerCase().includes('кинезио') ||
      prescriptions.some((p) => p.category === 'lfk')
    );

    setExpandedSections({
      domain1_complaints: hasDomain1,
      domain2_rom: isRomPathology,
      domain3_tests: hasPositiveTest,
      domain4_diagnostics: hasDiagnostics,
      domain5_manipulations: hasManipulations,
      domain6_physiotherapy: hasPhysio,
      domain7_orthotics: hasOrthotics,
      domain8_lfk: hasLfk,
      complaints: hasDomain1,
      anamnesis_morbi: hasDomain1,
      anamnesis_vitae: hasDomain1,
      objective_status: hasDomain1,
      status_localis: hasDomain1,
      functional_tests: isRomPathology || hasPositiveTest,
      special_studies: hasDiagnostics,
      diagnosis: hasDomain1,
      performed_manipulations: hasManipulations,
      recommendations: hasLfk || hasPhysio || hasOrthotics
    });
    setToastMessage('Режим Smart Focus: развернуты только активные разделы с данными');
  };

  const handleToggleActive = (secKey: string, active: boolean) => {
    setActiveSections((prev) => {
      const updated = { ...prev, [secKey]: active };
      if (secKey === 'domain1_complaints') {
        updated.complaints = active;
        updated.anamnesis_morbi = active;
        updated.anamnesis_vitae = active;
        updated.objective_status = active;
        updated.status_localis = active;
        updated.diagnosis = active;
      } else if (secKey === 'domain2_rom') {
        updated.functional_tests = active || Boolean(prev.domain3_tests);
      } else if (secKey === 'domain3_tests') {
        updated.functional_tests = active || Boolean(prev.domain2_rom);
      } else if (secKey === 'domain4_diagnostics') {
        updated.special_studies = active;
      } else if (secKey === 'domain5_manipulations') {
        updated.performed_manipulations = active;
      } else if (secKey === 'domain6_physiotherapy' || secKey === 'domain7_orthotics' || secKey === 'domain8_lfk') {
        updated.recommendations = active || Boolean(prev.domain6_physiotherapy) || Boolean(prev.domain7_orthotics) || Boolean(prev.domain8_lfk);
      }
      return updated;
    });
  };

  // Selected joint on Homunculus & Exam states per joint
  const [selectedJoint, setSelectedJoint] = useState<JointAreaId>('knee_r');
  const [jointExamsMap, setJointExamsMap] = useState<Record<string, JointExamState>>({
    knee_r: {
      jointArea: 'knee_r',
      side: 'right',
      axis: 'norm',
      effusion: 0,
      rom: { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 },
      tests: { lachman: 'negative', anterior_drawer: 'negative', mcmurray: 'negative' }
    }
  });

  // Diagnosis
  const [selectedMkb, setSelectedMkb] = useState<{ code: string; name: string } | null>(COMMON_MKB10[0]);
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');

  // Treatment & Recommendations
  const [recommendations, setRecommendations] = useState(INITIAL_RECOMMENDATIONS);
  const [prescriptions, setPrescriptions] = useState<OrthoPrescriptionItem[]>([INITIAL_LFK_PHASE_1]);
  const [pendingService, setPendingService] = useState<any | null>(null);
  const [activeTemplateDiagnostics, setActiveTemplateDiagnostics] = useState<any[]>([]);

  // E-Sign info
  const [isSigned, setIsSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string | undefined>(undefined);
  const [signatureHash, setSignatureHash] = useState<string | undefined>(undefined);

  // Flow State: 2-level cluster & protocol selection
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>('all');
  const [protocolDialogOpen, setProtocolDialogOpen] = useState(false);
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [protocolSearchQuery, setProtocolSearchQuery] = useState('');
  const [currentSelectedTemplate, setCurrentSelectedTemplate] = useState<any | null>(null);

  // Custom Template Creation State (Save as customized template to Cluster)
  const [saveCustomDialogOpen, setSaveCustomDialogOpen] = useState(false);
  const [customTplTitle, setCustomTplTitle] = useState('');
  const [customTplClusterId, setCustomTplClusterId] = useState('cluster_knee');
  const [customTplMkbCode, setCustomTplMkbCode] = useState('');
  const [customTplCategory, setCustomTplCategory] = useState('Кастомизированный шаблон');
  const [customTplTags, setCustomTplTags] = useState('custom, авторский');
  const [customTplDoctorName, setCustomTplDoctorName] = useState('');
  const [savingCustomTpl, setSavingCustomTpl] = useState(false);

  // Filter only custom templates in protocol dialog
  const [filterOnlyCustom, setFilterOnlyCustom] = useState(false);

  // Referral Issuance Modal
  const [issueReferralModalOpen, setIssueReferralModalOpen] = useState(false);

  // Fast Patient Autocomplete search
  const handleSearchPatients = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setPatientSearchOptions([]);
      return;
    }
    setPatientSearchLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/patients?search=${encodeURIComponent(query.trim())}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setPatientSearchOptions(data.patients || data.rows || (Array.isArray(data) ? data : []));
      }
    } catch (e) {
      console.error('Patient search error:', e);
    } finally {
      setPatientSearchLoading(false);
    }
  };

  // Complete reset of all clinical exam cards & workstation state
  const resetAllCardsState = () => {
    setProtocolId(null);
    setIsSigned(false);
    setSignedAt(undefined);
    setSignatureHash(undefined);
    setComplaints('');
    setAnamnesis('');
    setAnamnesisVitae('');
    setObjectiveStatus('');
    setSpecialStudies('');
    setPerformedManipulations('');
    setVasScore(4);
    setSelectedJoint('knee_r');
    setJointExamsMap({
      knee_r: {
        jointArea: 'knee_r',
        side: 'right',
        axis: 'norm',
        effusion: 0,
        rom: { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 },
        tests: { lachman: 'negative', anterior_drawer: 'negative', mcmurray: 'negative' }
      }
    });
    setSelectedMkb(null);
    setClinicalDiagnosis('');
    setRecommendations(INITIAL_RECOMMENDATIONS);
    setPendingService(null);
    setPrescriptions([INITIAL_LFK_PHASE_1]);
    setActiveTemplateDiagnostics([]);
    setMediaList([]);
    setBiomechanicsHistory([]);
    setRightPanelTab(0);
    setCurrentSelectedTemplate(null);
    setWeightBearingMode('FWB');
    setLfkPhaseTab(1);
    setActiveLfkPhases({ 1: true, 2: false, 3: false });
    setTemplateLfkData([]);
    setActiveSections({
      domain1_complaints: true,
      domain2_rom: true,
      domain3_tests: true,
      domain4_diagnostics: true,
      domain5_manipulations: true,
      domain6_physiotherapy: true,
      domain7_orthotics: true,
      domain8_lfk: true,
      complaints: true,
      anamnesis_morbi: true,
      anamnesis_vitae: true,
      objective_status: true,
      status_localis: true,
      functional_tests: true,
      special_studies: true,
      diagnosis: true,
      performed_manipulations: true,
      recommendations: true
    });
    setExpandedSections({
      domain1_complaints: true,
      domain2_rom: true,
      domain3_tests: true,
      domain4_diagnostics: true,
      domain5_manipulations: true,
      domain6_physiotherapy: true,
      domain7_orthotics: true,
      domain8_lfk: true,
      complaints: true,
      anamnesis_morbi: true,
      anamnesis_vitae: true,
      objective_status: true,
      status_localis: true,
      functional_tests: true,
      special_studies: true,
      diagnosis: true,
      performed_manipulations: true,
      recommendations: true
    });
  };

  const printSectionsCount = useMemo(() => {
    let count = 0;
    if (activeSections.domain1_complaints && (complaints.trim() || anamnesis.trim() || clinicalDiagnosis.trim() || selectedMkb)) count++;
    if (activeSections.domain2_rom) count++;
    if (activeSections.domain3_tests) count++;
    if (activeSections.domain4_diagnostics && (specialStudies.trim() || activeTemplateDiagnostics.length > 0 || prescriptions.some(p => p.category === 'diagnostic'))) count++;
    if (activeSections.domain5_manipulations && (performedManipulations.trim() || prescriptions.some(p => p.category === 'manipulation'))) count++;
    if (activeSections.domain6_physiotherapy && prescriptions.some(p => p.category === 'physio')) count++;
    if (activeSections.domain7_orthotics && (prescriptions.some(p => p.category === 'orthotics') || weightBearingMode !== 'FWB')) count++;
    if (activeSections.domain8_lfk && (recommendations.trim() || prescriptions.some(p => p.category === 'lfk'))) count++;
    return count;
  }, [
    activeSections,
    complaints,
    anamnesis,
    clinicalDiagnosis,
    selectedMkb,
    specialStudies,
    activeTemplateDiagnostics,
    performedManipulations,
    prescriptions,
    weightBearingMode,
    recommendations
  ]);

  // Fetch Appointment & Patient Context
  const fetchContext = async () => {
    setLoading(true);
    setError(null);
    resetAllCardsState();
    try {
      let url = `${API_BASE_URL}/api/ortho/context`;
      const qParams = new URLSearchParams();
      if (queryProtocolId) qParams.append('protocolId', queryProtocolId);
      if (queryPatientId) qParams.append('patientId', queryPatientId);

      const hasDirectTarget = (appointmentId && appointmentId !== 'new') || Boolean(queryPatientId) || Boolean(queryProtocolId);

      if (appointmentId && appointmentId !== 'new') {
        url = `${API_BASE_URL}/api/ortho/context/${appointmentId}`;
      } else if (qParams.toString()) {
        url = `${API_BASE_URL}/api/ortho/context?${qParams.toString()}`;
      } else {
        // CLEAN SLATE MODE: If user entered /ortho-workstation without patient key, load catalogs without sample patient
        url = `${API_BASE_URL}/api/ortho/context/2`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Ошибка загрузки контекста приема`);
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Не удалось получить данные приема');
      }

      // If entered cleanly without a patient key, set patient to null so doctor chooses patient first
      if (!hasDirectTarget) {
        setContextData({
          ...data,
          patient: null,
          appointment: null,
          currentProtocol: null
        });
      } else {
        setContextData(data);
      }

      setTemplates(data.templates || []);
      setServicesCatalog(data.services || data.servicesList || []);
      setMediaList(data.mediaAttachments || []);
      setBiomechanicsHistory(data.biomechanicsHistory || []);

      // If current protocol exists, hydrate state
      if (data.currentProtocol) {
        const cp = data.currentProtocol;
        setProtocolId(cp.id);
        setIsSigned(cp.is_signed === 1);
        setSignedAt(cp.signed_at || undefined);
        setSignatureHash(cp.signature_hash || undefined);

        let parsedJson: any = null;
        if (cp.protocol_json) {
          try {
            parsedJson = JSON.parse(cp.protocol_json);
          } catch (e) {
            console.error('Error parsing protocol_json:', e);
          }
        }

        const parsedXml = parseProtocolContent(cp.content);

        // Hydrate clinical narrative
        setComplaints(parsedJson?.complaints || parsedXml.complaints || cp.title || '');
        setAnamnesis(parsedJson?.anamnesis || parsedXml.anamnesis || '');
        setAnamnesisVitae(cp.anamnesis_vitae || parsedJson?.anamnesis_vitae || '');
        setObjectiveStatus(cp.objective_status || parsedJson?.objective_status || '');
        setSpecialStudies(cp.special_studies || parsedJson?.special_studies || '');
        setPerformedManipulations(cp.performed_manipulations || parsedJson?.performed_manipulations || '');

        if (cp.active_sections_mask || parsedJson?.active_sections_mask) {
          try {
            const rawMask = cp.active_sections_mask || parsedJson?.active_sections_mask;
            const parsedMask = typeof rawMask === 'string' ? JSON.parse(rawMask) : rawMask;
            if (parsedMask && typeof parsedMask === 'object') {
              setActiveSections((prev) => ({ ...prev, ...parsedMask }));
            }
          } catch {}
        }

        setRecommendations(
          parsedJson?.recommendations ||
          parsedXml.recommendations ||
          (parsedXml.performed ? 'Выполнено:\n' + parsedXml.performed : '') ||
          '1. Охранительный двигательный режим, исключение осевых ударных нагрузок.\n2. Ношение разгрузочного ортеза при ходьбе.\n3. Курс ЛФК и кинезиотерапии.'
        );

        // Joint exam & Homunculus
        if (parsedJson) {
          if (parsedJson.vasScore !== undefined) setVasScore(parsedJson.vasScore);
          if (parsedJson.jointArea) setSelectedJoint(parsedJson.jointArea as JointAreaId);
          if (parsedJson.rom || parsedJson.tests) {
            const targetArea: JointAreaId = (parsedJson.jointArea as JointAreaId) || 'knee_r';
            setJointExamsMap((prev) => ({
              ...prev,
              [targetArea]: {
                jointArea: targetArea,
                side: parsedJson.side || 'right',
                axis: 'norm',
                effusion: 0,
                rom: parsedJson.rom || { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 },
                tests: parsedJson.tests || {}
              }
            }));
          }
        } else if (cp.vas_score !== undefined && cp.vas_score !== null) {
          setVasScore(cp.vas_score);
        }

        // Hydrate prescriptions from parsedJson or fallback to backend currentPrescriptions
        if (parsedJson?.prescriptions && Array.isArray(parsedJson.prescriptions) && parsedJson.prescriptions.length > 0) {
          const loaded = parsedJson.prescriptions.map((p: any, i: number) => ({
            id: p.id || `presc-${i}`,
            category: p.category || 'service',
            title: p.title || p.name || 'Медицинская услуга',
            name: p.name || p.title || 'Медицинская услуга',
            serviceId: p.serviceId || p.service_id,
            serviceCode: p.code || p.serviceCode || p.service_code || '',
            code: p.code || p.serviceCode || p.service_code || '',
            unitPrice: Number(p.price ?? p.unitPrice ?? p.unit_price ?? 0),
            price: Number(p.price ?? p.unitPrice ?? p.unit_price ?? 0),
            quantity: Number(p.quantity || 1),
            dosage_notes: p.dosage_notes || p.dosageNotes || '',
            details: typeof p.details_json === 'string' ? JSON.parse(p.details_json || '{}') : (p.details || {})
          }));
          setPrescriptions(loaded);

          const hasP1 = loaded.some((p: any) => p.id === 'lfk_phase_1' || (p.category === 'lfk' && (p.name || p.title || '').includes('Фаза I')));
          const hasP2 = loaded.some((p: any) => p.id === 'lfk_phase_2' || (p.category === 'lfk' && (p.name || p.title || '').includes('Фаза II')));
          const hasP3 = loaded.some((p: any) => p.id === 'lfk_phase_3' || (p.category === 'lfk' && (p.name || p.title || '').includes('Фаза III')));
          setActiveLfkPhases({
            1: Boolean(hasP1),
            2: Boolean(hasP2),
            3: Boolean(hasP3)
          });
        } else if (data.currentPrescriptions && Array.isArray(data.currentPrescriptions) && data.currentPrescriptions.length > 0) {
          const loaded = data.currentPrescriptions.map((p: any) => ({
            id: `presc-${p.id}`,
            category: p.category || 'service',
            title: p.title || p.name || 'Медицинская услуга',
            name: p.name || p.title || 'Медицинская услуга',
            serviceId: p.service_id,
            serviceCode: p.service_code,
            code: p.service_code,
            unitPrice: Number(p.unit_price ?? p.price ?? 0),
            price: Number(p.unit_price ?? p.price ?? 0),
            quantity: Number(p.quantity || 1),
            dosage_notes: p.dosage_notes || '',
            details: typeof p.details_json === 'string' ? JSON.parse(p.details_json || '{}') : (p.details_json || {})
          }));
          setPrescriptions(loaded);

          const hasP1 = loaded.some((p: any) => p.id === 'lfk_phase_1' || (p.category === 'lfk' && (p.name || p.title || '').includes('Фаза I')));
          const hasP2 = loaded.some((p: any) => p.id === 'lfk_phase_2' || (p.category === 'lfk' && (p.name || p.title || '').includes('Фаза II')));
          const hasP3 = loaded.some((p: any) => p.id === 'lfk_phase_3' || (p.category === 'lfk' && (p.name || p.title || '').includes('Фаза III')));
          setActiveLfkPhases({
            1: Boolean(hasP1),
            2: Boolean(hasP2),
            3: Boolean(hasP3)
          });
        } else {
          setPrescriptions([]);
          setActiveLfkPhases({ 1: false, 2: false, 3: false });
        }

        // Diagnosis
        const diagText = parsedJson?.clinicalDiagnosis || parsedXml.diagnosis || (parsedXml.isXml ? '' : cp.content) || '';
        setClinicalDiagnosis(diagText);

        const mkbCode = cp.mkb_code || parsedXml.mkb;
        if (mkbCode) {
          setSelectedMkb({ code: mkbCode, name: cp.mkb_name || '' });
        } else {
          setSelectedMkb(null);
        }

        if (cp.title) {
          setCurrentSelectedTemplate({
            title: cp.title,
            id: cp.template_id || cp.id
          });
        }
      } else {
        // Fresh exam initialization for new/switched patient without existing protocol
        setProtocolId(null);
        setIsSigned(false);
        setSignedAt(undefined);
        setSignatureHash(undefined);
        setSelectedMkb(null);
        setVasScore(4);
        setSelectedJoint('knee_r');
        setJointExamsMap({
          knee_r: {
            jointArea: 'knee_r',
            side: 'right',
            axis: 'norm',
            effusion: 0,
            rom: { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 },
            tests: { lachman: 'negative', anterior_drawer: 'negative', mcmurray: 'negative' }
          }
        });
        setRecommendations('1. Охранительный двигательный режим, исключение осевых ударных нагрузок.\n2. Ношение разгрузочного ортеза при ходьбе.\n3. Курс ЛФК и кинезиотерапии.');
        setPendingService(null);
        setPrescriptions([]);
        setComplaints('Боль в правом коленном суставе при физической нагрузке и спуске по лестнице, стартовая скованность.');
        setAnamnesis('Считает себя больным около 6 месяцев. Связывает с повышенной нагрузкой. Ранее консервативно не лечился.');
        setAnamnesisVitae('Аллергоанамнез не отягощен. Хронические заболевания: ГБ I ст. Операций на опорно-двигательном аппарате в анамнезе нет.');
        setObjectiveStatus('Общее состояние удовлетворительное. Нормостенического телосложения. Кожные покровы физиологической окраски, чистые. Периферических отеков нет.');
        setSpecialStudies('Рентгенография правого коленного сустава в 2-х проекциях: сужение суставной щели преимущественно в медиальном отделе, субхондральный остеосклероз, краевые остеофиты мыщелков бедренной и большеберцовой костей.');
        setPerformedManipulations('Внутрисуставная эвакуация синовиального выпота правого коленного сустава (получено 15 мл серозной синовиальной жидкости). Введение пролонгированного ГКС под УЗИ-контролем.');
        setClinicalDiagnosis('Первичный двусторонний гонартроз II стадии (Kellgren-Lawrence). Застарелое повреждение внутреннего мениска правого коленного сустава. Болевой синдром (ВАШ 4).');
      }
    } catch (err: any) {
      console.error('Error fetching ortho context:', err);
      setError(err.message || 'Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, [appointmentId, queryProtocolId, queryPatientId]);

  // Helper to map template to accurate JointAreaId
  const resolveJointArea = (jointName?: string, title?: string, content?: string, defaultSide?: string): JointAreaId => {
    const isLeft = defaultSide === 'left' || /лев|слева/i.test(`${title || ''} ${content || ''}`);
    const sideSuffix = isLeft ? '_l' : '_r';

    if (jointName) {
      const jn = String(jointName).toLowerCase().trim();
      if (jn.endsWith('_r') || jn.endsWith('_l') || jn.endsWith('_c') || jn.endsWith('_th')) {
        return jn as JointAreaId;
      }
      if (jn === 'elbow') return `elbow${sideSuffix}` as JointAreaId;
      if (jn === 'shoulder') return `shoulder${sideSuffix}` as JointAreaId;
      if (jn === 'hip') return `hip${sideSuffix}` as JointAreaId;
      if (jn === 'ankle' || jn === 'foot') return `foot${sideSuffix}` as JointAreaId;
      if (jn === 'wrist') return `wrist${sideSuffix}` as JointAreaId;
      if (jn === 'spine') return 'spine_l';
      return `${jn}${sideSuffix}` as JointAreaId;
    }
    const text = ((title || '') + ' ' + (content || '')).toLowerCase();
    if (/локт|эпикондил|олекранон/.test(text)) return `elbow${sideSuffix}` as JointAreaId;
    if (/колен|гонартроз|мениск|patell/.test(text)) return `knee${sideSuffix}` as JointAreaId;
    if (/плеч|акромион|ротатор/.test(text)) return `shoulder${sideSuffix}` as JointAreaId;
    if (/тазобедр|коксартроз|вертлуж/.test(text)) return `hip${sideSuffix}` as JointAreaId;
    if (/стоп|голеностоп|пятк|фасциит|ахилл/.test(text)) return `foot${sideSuffix}` as JointAreaId;
    if (/позвоноч|спин|люмбалг|диск|шеин|грудн/.test(text)) return 'spine_l';
    if (/кист|лучезап|запяст|карпал/.test(text)) return `wrist${sideSuffix}` as JointAreaId;
    return `knee${sideSuffix}` as JointAreaId;
  };

  // Helper to extract custom template status and author name uniformly
  const getTemplateCustomInfo = (tmpl: any) => {
    let isCustom = Boolean(tmpl?.is_custom) || tmpl?.category === 'Кастомизированный шаблон';
    let author = tmpl?.author_doctor_name || '';
    let clusterId = tmpl?.cluster_id || '';

    if (!isCustom && tmpl?.clinical_tags) {
      const tagsStr = typeof tmpl.clinical_tags === 'string' ? tmpl.clinical_tags : JSON.stringify(tmpl.clinical_tags);
      if (/custom|кастом|автор/i.test(tagsStr)) {
        isCustom = true;
      }
    }

    if (tmpl?.template_json) {
      try {
        const parsed = typeof tmpl.template_json === 'string' ? JSON.parse(tmpl.template_json) : tmpl.template_json;
        if (parsed?.is_custom) isCustom = true;
        if (parsed?.author_doctor_name && !author) author = parsed.author_doctor_name;
        if (parsed?.cluster_id && !clusterId) clusterId = parsed.cluster_id;
        if (parsed?.category === 'Кастомизированный шаблон') isCustom = true;
      } catch {
        // ignore parse errors
      }
    }

    return { isCustom, author, clusterId };
  };

  // Filter templates by selected cluster, custom toggle, and search query
  const filteredTemplates = useMemo(() => {
    return templates.filter((tmpl) => {
      const { isCustom, author, clusterId } = getTemplateCustomInfo(tmpl);

      // 0. Only custom filter
      if (filterOnlyCustom && !isCustom) {
        return false;
      }

      // 1. Cluster filter
      if (selectedClusterId && selectedClusterId !== 'all') {
        const effectiveClusterId = tmpl.cluster_id || clusterId;
        const clusterCode = selectedClusterId.replace('cluster_', '').toUpperCase();
        const tmplCluster = String(effectiveClusterId || tmpl.cluster || tmpl.category || '').toUpperCase();
        const tmplJoint = String(tmpl.joint_name || '').toLowerCase();
        
        let match = false;
        if (effectiveClusterId === selectedClusterId) {
          match = true;
        } else if (tmplCluster.includes(clusterCode)) {
          match = true;
        } else {
          // Fallback to joint name check
          if (selectedClusterId === 'cluster_knee' && /колен|гонартроз|мениск|patell/.test(tmplJoint + ' ' + tmpl.title)) match = true;
          if (selectedClusterId === 'cluster_shoulder' && /плеч|акромион|ротатор/.test(tmplJoint + ' ' + tmpl.title)) match = true;
          if (selectedClusterId === 'cluster_hip_pelvis' && /тазобедр|коксартроз|вертлуж/.test(tmplJoint + ' ' + tmpl.title)) match = true;
          if (selectedClusterId === 'cluster_foot_ankle' && /стоп|голеностоп|пятк|фасциит|ахилл/.test(tmplJoint + ' ' + tmpl.title)) match = true;
          if (selectedClusterId === 'cluster_elbow' && /локт|эпикондил|олекранон/.test(tmplJoint + ' ' + tmpl.title)) match = true;
          if (selectedClusterId === 'cluster_wrist_hand' && /кист|лучезап|запяст|карпал/.test(tmplJoint + ' ' + tmpl.title)) match = true;
          if (selectedClusterId === 'cluster_spine' && /позвоноч|спин|люмбалг|диск|шеин|грудн/.test(tmplJoint + ' ' + tmpl.title)) match = true;
          if (selectedClusterId === 'cluster_pediatric' && /детск|врожден|дисплаз/.test(tmpl.title)) match = true;
          if (selectedClusterId === 'cluster_systemic' && /систем|ревмат|остеопороз/.test(tmpl.title)) match = true;
          if (selectedClusterId === 'cluster_postop' && /постоперац|реабилитац|эндопротез/.test(tmpl.title)) match = true;
        }
        if (!match) return false;
      }

      // 2. Search query filter (matches title, mkb, joint, category, author, tags)
      if (protocolSearchQuery.trim()) {
        const q = protocolSearchQuery.toLowerCase();
        const isCustomKey = ['кастом', 'custom', 'автор'].some(k => q.includes(k));
        if (isCustomKey && isCustom) {
          return true;
        }

        const titleMatch = (tmpl.title || '').toLowerCase().includes(q);
        const codeMatch = (tmpl.default_mkb_code || tmpl.mkb_code || '').toLowerCase().includes(q);
        const jointMatch = (tmpl.joint_name || '').toLowerCase().includes(q);
        const tagsMatch = tmpl.clinical_tags ? JSON.stringify(tmpl.clinical_tags).toLowerCase().includes(q) : false;
        const authorMatch = (author || tmpl.author_doctor_name || '').toLowerCase().includes(q);
        const categoryMatch = (tmpl.category || '').toLowerCase().includes(q);

        return titleMatch || codeMatch || jointMatch || tagsMatch || authorMatch || categoryMatch;
      }

      return true;
    });
  }, [templates, selectedClusterId, protocolSearchQuery, filterOnlyCustom]);

  // Cluster counts map for protocol dialog
  const clusterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const orthoList = templates.filter(t => t.source === 'biomechanics' || (t.id && String(t.id).startsWith('ortho-')));
    const listToCount = orthoList.length > 0 ? orthoList : templates;
    counts['all'] = listToCount.length > 0 ? listToCount.length : 180;

    MASTER_CLUSTERS.forEach(cl => {
      if (cl.id !== 'all') {
        const clusterCode = cl.id.replace('cluster_', '').toUpperCase();
        counts[cl.id] = listToCount.filter(t => {
          const effectiveClusterId = t.cluster_id || t.template_json?.cluster_id;
          const tmplCluster = String(effectiveClusterId || t.cluster || t.category || '').toUpperCase();
          const tmplJoint = String(t.joint_name || '').toLowerCase();
          if (effectiveClusterId === cl.id || tmplCluster.includes(clusterCode)) return true;
          if (cl.id === 'cluster_knee' && /колен|гонартроз|мениск|patell/.test(tmplJoint + ' ' + t.title)) return true;
          if (cl.id === 'cluster_shoulder' && /плеч|акромион|ротатор/.test(tmplJoint + ' ' + t.title)) return true;
          if (cl.id === 'cluster_hip_pelvis' && /тазобедр|коксартроз|вертлуж/.test(tmplJoint + ' ' + t.title)) return true;
          if (cl.id === 'cluster_foot_ankle' && /стоп|голеностоп|ахилл|пяточ/.test(tmplJoint + ' ' + t.title)) return true;
          if (cl.id === 'cluster_elbow' && /локт|эпикондил|олекранон/.test(tmplJoint + ' ' + t.title)) return true;
          if (cl.id === 'cluster_wrist_hand' && /кист|запяст|лучезапяст|туннел/.test(tmplJoint + ' ' + t.title)) return true;
          if (cl.id === 'cluster_spine' && /позвоноч|дорсопат|спондило|грыж|сколиоз/.test(tmplJoint + ' ' + t.title)) return true;
          if (cl.id === 'cluster_pediatric' && /детск|педиатри|дисплази|врожден/.test(tmplJoint + ' ' + t.title)) return true;
          if (cl.id === 'cluster_systemic' && /системн|остеопороз|ревматоид|подагр|фибромиал/.test(tmplJoint + ' ' + t.title)) return true;
          if (cl.id === 'cluster_postop' && /постоперац|реабилит|эндопротез|артроскопи/.test(tmplJoint + ' ' + t.title)) return true;
          if (cl.id === 'cluster_author' && /автор|кастом/.test(tmplJoint + ' ' + t.title)) return true;
          return false;
        }).length;
      }
    });

    return counts;
  }, [templates]);

  // Open Save as Customized Template Dialog
  const handleOpenSaveCustomTemplate = () => {
    const clusterForJoint = JOINT_TO_CLUSTER[selectedJoint]?.clusterId || 'cluster_knee';
    setCustomTplClusterId(clusterForJoint);

    const mkbCode = selectedMkb?.code || '';
    const diagnosis = clinicalDiagnosis || '';
    const baseTitle = currentSelectedTemplate?.title
      ? `${currentSelectedTemplate.title} (авторский)`
      : mkbCode
      ? `Протокол ${mkbCode} — ${diagnosis || 'Осмотр'}`
      : 'Индивидуальный клинический протокол';
    setCustomTplTitle(baseTitle);

    setCustomTplMkbCode(mkbCode || currentSelectedTemplate?.default_mkb_code || currentSelectedTemplate?.mkb_code || '');
    setCustomTplCategory('Кастомизированный шаблон');
    setCustomTplTags('custom, авторский');

    const doctorName = contextData?.doctor?.full_name || contextData?.appointment?.doctor_name || 'Добрушкин Александр Моисеевич';
    setCustomTplDoctorName(doctorName);

    setSaveCustomDialogOpen(true);
  };

  // Execute Save as Customized Template to Database
  const handleSaveCustomTemplate = async () => {
    if (!customTplTitle.trim()) {
      setToastMessage('Укажите наименование кастомизированного шаблона');
      return;
    }

    setSavingCustomTpl(true);
    try {
      const selectedClusterObj = MASTER_CLUSTERS.find((c) => c.id === customTplClusterId);
      const parsedTags = customTplTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      // Convert tests map to relational array format expected by backend
      const testsArray = Object.entries(currentJointState.tests || {}).map(([code, result]) => ({
        test_code: code,
        expected_result: result,
        is_mandatory: 1
      }));

      const payload = {
        title: customTplTitle.trim(),
        joint_name: selectedJoint.split('_')[0],
        cluster_id: customTplClusterId,
        cluster_name: selectedClusterObj?.name_ru || customTplClusterId,
        default_mkb_code: customTplMkbCode.trim(),
        category: customTplCategory.trim() || 'Кастомизированный шаблон',
        author_doctor_name: customTplDoctorName.trim() || 'Врач травматолог-ортопед',
        is_custom: 1,
        clinical_tags: parsedTags,
        default_side: selectedJoint.endsWith('_l') ? 'left' : 'right',
        complaints_template: complaints,
        anamnesis_template: anamnesis,
        anamnesis_vitae_template: anamnesisVitae,
        objective_template: objectiveStatus,
        objective_status_template: objectiveStatus,
        special_studies_template: specialStudies,
        performed_manipulations_template: performedManipulations,
        recommendations_template: recommendations,
        default_sections_mask: activeSections,
        rom_norm_preset: currentJointState.rom || null,
        tests: testsArray,
        diagnostics: activeTemplateDiagnostics || [],
        template_json: {
          is_custom: 1,
          author_doctor_name: customTplDoctorName.trim() || 'Врач травматолог-ортопед',
          category: customTplCategory.trim() || 'Кастомизированный шаблон',
          cluster_id: customTplClusterId,
          cluster_name: selectedClusterObj?.name_ru || customTplClusterId,
          complaints,
          anamnesis,
          anamnesis_vitae: anamnesisVitae,
          objective: objectiveStatus,
          objective_status: objectiveStatus,
          special_studies: specialStudies,
          performed_manipulations: performedManipulations,
          recommendations,
          rom: currentJointState.rom || null,
          tests: currentJointState.tests || {},
          diagnostics: activeTemplateDiagnostics || []
        }
      };

      const res = await fetch(`${API_BASE_URL}/api/ortho/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        let errMsg = `Ошибка сервера (${res.status})`;
        try {
          const errObj = JSON.parse(text);
          if (errObj.error) errMsg = errObj.error;
        } catch {
          if (text) errMsg = `${errMsg}: ${text.slice(0, 100)}`;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Ошибка при сохранении кастомизированного шаблона');
      }

      // Reload templates list so new custom template appears immediately in search/dialog
      const tRes = await fetch(`${API_BASE_URL}/api/ortho/templates`);
      if (tRes.ok) {
        const tData = await tRes.json();
        if (tData.templates) {
          setTemplates(tData.templates);
          const found = tData.templates.find(
            (t: any) => t.rawId === data.id || t.id === `ortho-${data.id}`
          );
          if (found) {
            setCurrentSelectedTemplate(found);
          }
        }
      }

      setSaveCustomDialogOpen(false);
      setToastMessage(
        `Кастомизированный шаблон "${customTplTitle.trim()}" успешно сохранен в кластер "${selectedClusterObj?.name_ru || ''}"!`
      );
    } catch (err: any) {
      console.error('Error saving custom template:', err);
      setToastMessage(err.message || 'Не удалось сохранить шаблон');
    } finally {
      setSavingCustomTpl(false);
    }
  };

  // Current Joint State
  const currentJointState: JointExamState = useMemo(() => {
    if (jointExamsMap[selectedJoint]) {
      return jointExamsMap[selectedJoint];
    }

    const isElbow = selectedJoint.startsWith('elbow');
    const isShoulder = selectedJoint.startsWith('shoulder');
    const isHip = selectedJoint.startsWith('hip');
    const isFoot = selectedJoint.startsWith('foot');
    const isWrist = selectedJoint.startsWith('wrist');
    const isSpine = selectedJoint.startsWith('spine');

    let defaultRom = { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 };
    let defaultTests: Record<string, string> = {
      lachman: 'negative',
      anterior_drawer: 'negative',
      mcmurray: 'negative',
      patella_ballottement: 'negative'
    };

    if (isElbow) {
      defaultRom = { flexion_active: 145, flexion_passive: 150, extension_deficit: 0 };
      defaultTests = {
        cozen: 'negative',
        mill: 'negative',
        golfer: 'negative',
        tinel_cubital: 'negative',
        valgus_stress_elbow: 'negative',
        varus_stress_elbow: 'negative'
      };
    } else if (isShoulder) {
      defaultRom = { flexion_active: 170, flexion_passive: 170, extension_deficit: 0 };
      defaultTests = { neer: 'negative', hawkins: 'negative', empty_can_jobe: 'negative' };
    } else if (isHip) {
      defaultRom = { flexion_active: 120, flexion_passive: 125, extension_deficit: 0 };
      defaultTests = { faber: 'negative', fadir: 'negative', thomas: 'negative', trendelenburg: 'negative' };
    } else if (isWrist) {
      defaultRom = { flexion_active: 75, flexion_passive: 80, extension_deficit: 0 };
      defaultTests = { phalen: 'negative', tinel_wrist: 'negative', finkelstein: 'negative', piano_key: 'negative' };
    } else if (isFoot) {
      defaultRom = { flexion_active: 45, flexion_passive: 45, extension_deficit: 0 };
      defaultTests = { windlass: 'negative', thompson: 'negative' };
    } else if (isSpine) {
      defaultRom = { flexion_active: 90, flexion_passive: 90, extension_deficit: 0 };
      defaultTests = { lasegue: 'negative', adams: 'negative' };
    }

    return {
      jointArea: selectedJoint,
      side: selectedJoint.endsWith('_l') ? 'left' : 'right',
      axis: 'norm',
      effusion: 0,
      rom: defaultRom,
      tests: defaultTests
    };
  }, [jointExamsMap, selectedJoint]);

  const handleJointExamChange = (newState: JointExamState) => {
    setJointExamsMap((prev) => ({
      ...prev,
      [selectedJoint]: newState
    }));
  };

  // Homunculus Exam Summary
  const homunculusExamSummary = useMemo(() => {
    const summary: Partial<Record<JointAreaId, JointExamSummary>> = {};
    const mediaCount = mediaList.filter((m) => m.joint_area === selectedJoint).length;
    summary[selectedJoint] = {
      status: vasScore >= 7 ? 'severe' : vasScore >= 4 ? 'warning' : 'normal',
      mediaCount
    };
    return summary;
  }, [selectedJoint, vasScore, mediaList]);

  // Synchronize LFK program text inside recommendations based on active phases
  const updateLfkRecommendations = (phasesMap: Record<number, boolean>, lfkList: any[] = templateLfkData) => {
    setRecommendations((prev) => {
      const lfkHeader = 'ПРОГРАММА ЛФК И КИНЕЗИОТЕРАПИИ:';
      let baseText = prev;
      const lfkIdx = baseText.indexOf(lfkHeader);
      if (lfkIdx !== -1) {
        baseText = baseText.substring(0, lfkIdx).trim();
      }

      const activeNums = [1, 2, 3].filter((n) => phasesMap[n]);
      if (activeNums.length === 0) {
        return baseText;
      }

      const lfkReportLines: string[] = ['ПРОГРАММА ЛФК И КИНЕЗИОТЕРАПИИ:'];
      activeNums.forEach((num) => {
        const cfg = getLfkPhaseConfig(num, lfkList);
        lfkReportLines.push(`${cfg.title}:`);
        if (cfg.exercises && cfg.exercises.length > 0) {
          cfg.exercises.forEach((exLine) => lfkReportLines.push(`  • ${exLine}`));
        } else {
          lfkReportLines.push(`  • ${cfg.goal}`);
        }
      });

      const lfkBlock = lfkReportLines.join('\n');
      return baseText ? `${baseText}\n\n${lfkBlock}` : lfkBlock;
    });
  };

  // Toggle individual LFK phase on/off with slider: includes/excludes from prescriptions and recommendations
  const handleToggleLfkPhase = (phaseNum: number, checked: boolean) => {
    const newPhases = { ...activeLfkPhases, [phaseNum]: checked };
    setActiveLfkPhases(newPhases);

    setPrescriptions((prev) => {
      const phaseId = `lfk_phase_${phaseNum}`;
      if (checked) {
        if (prev.some((p) => p.id === phaseId)) {
          return prev;
        }
        return [...prev, createLfkPrescriptionItem(phaseNum, templateLfkData)];
      } else {
        return prev.filter((p) => p.id !== phaseId);
      }
    });

    updateLfkRecommendations(newPhases, templateLfkData);
    const roman = phaseNum === 1 ? 'I' : phaseNum === 2 ? 'II' : 'III';
    setToastMessage(checked ? `Фаза ${roman} ЛФК включена в «Назначенные»` : `Фаза ${roman} ЛФК исключена из «Назначенных»`);
  };

  // Fast Clinical Template Fill (ortho_templates + protdict)
  const handleApplyTemplate = async (tmpl: any) => {
    try {
      // If the user already selected a joint that matches the template's target category, preserve the chosen side!
      let matchingArea: JointAreaId;
      const currentBase = selectedJoint.split('_')[0];
      const tmplBase = (tmpl.joint_name || '').toLowerCase();
      if (tmplBase && (currentBase === tmplBase || (tmplBase === 'ankle' && currentBase === 'foot') || (tmplBase === 'foot' && currentBase === 'ankle'))) {
        matchingArea = selectedJoint;
      } else {
        matchingArea = resolveJointArea(tmpl.joint_name, tmpl.title, tmpl.content, tmpl.default_side);
        setSelectedJoint(matchingArea);
      }

      if (tmpl.source === 'protdict' || tmpl.content) {
        // CLINICAL PROTOCOL TEMPLATE (Firebird protdict)
        const parsed = parseProtocolContent(tmpl.content);
        if (parsed.complaints) setComplaints(parsed.complaints);
        if (parsed.anamnesis) setAnamnesis(parsed.anamnesis);
        if (parsed.diagnosis) setClinicalDiagnosis(parsed.diagnosis);
        if (parsed.performed) setPerformedManipulations(parsed.performed);
        if (parsed.recommendations) {
          setRecommendations(parsed.recommendations);
        }

        const effectiveMkb = tmpl.default_mkb_code || parsed.mkb;
        if (effectiveMkb) {
          const found = COMMON_MKB10.find((m) => m.code === effectiveMkb);
          if (found) setSelectedMkb(found);
          else setSelectedMkb({ code: effectiveMkb, name: tmpl.title });
        }
        setActiveTemplateDiagnostics([]);
      } else {
        // BIOMECHANICS & KNOWLEDGE BASE 2.0 TEMPLATE (ortho_templates)
        const parsed = typeof tmpl.template_json === 'string' ? JSON.parse(tmpl.template_json) : (tmpl.template_json || {});
        
        // Populate clinical fields (either from top-level columns or from template_json)
        const complaintsText = tmpl.complaints_template || parsed.complaints;
        if (complaintsText) setComplaints(complaintsText);

        const anamnesisText = tmpl.anamnesis_template || parsed.anamnesis;
        if (anamnesisText) setAnamnesis(anamnesisText);

        const anamnesisVitaeText = tmpl.anamnesis_vitae_template || tmpl.anamnesis_vitae || parsed.anamnesis_vitae;
        if (anamnesisVitaeText) setAnamnesisVitae(anamnesisVitaeText);

        const objectiveStatusText = tmpl.objective_status_template || tmpl.objective_status || parsed.objective_status;
        if (objectiveStatusText) setObjectiveStatus(objectiveStatusText);

        const specialStudiesText = tmpl.special_studies_template || tmpl.special_studies || parsed.special_studies;
        if (specialStudiesText) setSpecialStudies(specialStudiesText);

        const performedManipulationsText = tmpl.performed_manipulations_template || tmpl.performed_manipulations || parsed.performed_manipulations;
        if (performedManipulationsText) setPerformedManipulations(performedManipulationsText);

        const sectionsMask = tmpl.default_sections_mask || parsed.active_sections_mask;
        if (sectionsMask) {
          try {
            const parsedMask = typeof sectionsMask === 'string' ? JSON.parse(sectionsMask) : sectionsMask;
            if (parsedMask && typeof parsedMask === 'object') {
              setActiveSections((prev) => ({ ...prev, ...parsedMask }));
            }
          } catch {}
        }

        if (parsed.vas !== undefined) setVasScore(parsed.vas);

        const effectiveMkb = tmpl.default_mkb_code || parsed.default_mkb_code;
        if (effectiveMkb) {
          const found = COMMON_MKB10.find((m) => m.code === effectiveMkb);
          if (found) setSelectedMkb(found);
          else setSelectedMkb({ code: effectiveMkb, name: tmpl.title });
        }
        
        if (parsed.clinicalDiagnosis) setClinicalDiagnosis(parsed.clinicalDiagnosis);
        else if (tmpl.title) setClinicalDiagnosis(tmpl.title);

        const recsText = tmpl.recommendations_template || parsed.recommendations;
        if (recsText) setRecommendations(recsText);

        if (parsed.prescriptions) {
          setPrescriptions(
            parsed.prescriptions.map((p: any, i: number) => ({
              id: p.id || `tpl-presc-${i}`,
              category: p.category || 'manipulation',
              title: p.title || p.name || 'Медицинская услуга',
              name: p.name || p.title || 'Медицинская услуга',
              code: p.code || '',
              unitPrice: Number(p.price ?? p.unitPrice ?? p.unit_price ?? 0),
              price: Number(p.price ?? p.unitPrice ?? p.unit_price ?? 0),
              quantity: Number(p.quantity || 1),
              details: p.details || {}
            }))
          );
        }

        let examRom = parsed.rom || { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 };
        let examTests = parsed.tests || {};
        let diagList: any[] = [];
        const treatmentPrescriptions: any[] = [];
        let lfkItemsCount = 0;

        // Fetch deep relational diagnostics, tests, treatments and LFK from Knowledge Base 2.0 API
        if (tmpl.rawId) {
          try {
            const fullRes = await fetch(`${API_BASE_URL}/api/ortho/templates/${tmpl.rawId}/full`);
            if (fullRes.ok) {
              const fullData = await fullRes.json();
              if (fullData.success && fullData.template) {
                const t = fullData.template;
                if (t.complaints_template) setComplaints(t.complaints_template);
                if (t.anamnesis_template) setAnamnesis(t.anamnesis_template);
                if (t.anamnesis_vitae_template) setAnamnesisVitae(t.anamnesis_vitae_template);
                if (t.objective_status_template) setObjectiveStatus(t.objective_status_template);
                if (t.special_studies_template) setSpecialStudies(t.special_studies_template);
                if (t.performed_manipulations_template) setPerformedManipulations(t.performed_manipulations_template);
                if (t.default_sections_mask) {
                  try {
                    const parsedM = typeof t.default_sections_mask === 'string' ? JSON.parse(t.default_sections_mask) : t.default_sections_mask;
                    if (parsedM && typeof parsedM === 'object') {
                      setActiveSections((prev) => ({ ...prev, ...parsedM }));
                    }
                  } catch {}
                }
                if (t.recommendations_template) setRecommendations(t.recommendations_template);

                if (t.rom_norm_preset) {
                  try {
                    examRom = typeof t.rom_norm_preset === 'string' ? JSON.parse(t.rom_norm_preset) : t.rom_norm_preset;
                  } catch {}
                }

                // Hydrate diagnostics (support both diagnostics and diagnosticMethods keys)
                diagList = Array.isArray(t.diagnostics)
                  ? t.diagnostics
                  : Array.isArray(t.diagnosticMethods)
                  ? t.diagnosticMethods
                  : [];
                if (diagList.length > 0) {
                  setActiveTemplateDiagnostics(diagList);
                }

                if (Array.isArray(t.tests) && t.tests.length > 0) {
                  const testsFromDb: Record<string, string> = { ...examTests };
                  t.tests.forEach((testRel: any) => {
                    if (testRel.test_code) {
                      testsFromDb[testRel.test_code] = testRel.expected_result || 'positive';
                    }
                  });
                  examTests = testsFromDb;
                }

                // Hydrate treatments from relational tables if available (High priority internal services & prescriptions)
                if (Array.isArray(t.manipulations) && t.manipulations.length > 0) {
                  t.manipulations.forEach((m: any, idx: number) => {
                    treatmentPrescriptions.push({
                      id: `tpl-man-${m.id || m.item_code || idx}`,
                      category: 'manipulation',
                      title: m.name || m.item_code,
                      name: m.name || m.item_code,
                      code: m.item_code || '',
                      serviceCode: m.servdict_code || '',
                      unitPrice: Number(m.servdict_price || 0),
                      price: Number(m.servdict_price || 0),
                      quantity: 1,
                      serviceId: m.servdict_id || undefined,
                      details: {
                        scope: m.service_scope || 'internal',
                        priority: m.priority_level || 'high',
                        regimen: m.dosage_or_regimen || m.regimen_standard || ''
                      }
                    });
                  });
                }

                if (Array.isArray(t.physiotherapy) && t.physiotherapy.length > 0) {
                  t.physiotherapy.forEach((p: any, idx: number) => {
                    treatmentPrescriptions.push({
                      id: `tpl-phys-${p.id || p.item_code || idx}`,
                      category: 'physio',
                      title: p.name || p.item_code,
                      name: p.name || p.item_code,
                      code: p.item_code || '',
                      serviceCode: p.servdict_code || '',
                      unitPrice: Number(p.servdict_price || 0),
                      price: Number(p.servdict_price || 0),
                      quantity: 1,
                      serviceId: p.servdict_id || undefined,
                      details: {
                        scope: p.service_scope || 'internal',
                        priority: p.priority_level || 'high',
                        regimen: p.dosage_or_regimen || p.regimen_standard || ''
                      }
                    });
                  });
                }

                if (Array.isArray(t.orthotics) && t.orthotics.length > 0) {
                  t.orthotics.forEach((o: any, idx: number) => {
                    treatmentPrescriptions.push({
                      id: `tpl-orth-${o.id || o.item_code || idx}`,
                      category: 'orthotics',
                      title: o.name || o.item_code,
                      name: o.name || o.item_code,
                      code: o.item_code || '',
                      serviceCode: o.servdict_code || '',
                      unitPrice: Number(o.servdict_price || 0),
                      price: Number(o.servdict_price || 0),
                      quantity: 1,
                      serviceId: o.servdict_id || undefined,
                      details: {
                        scope: o.service_scope || 'internal',
                        priority: o.priority_level || 'high',
                        regimen: o.dosage_or_regimen || o.regimen_standard || ''
                      }
                    });
                  });
                }

                if (treatmentPrescriptions.length > 0) {
                  setPrescriptions((prev) => {
                    const combined = [...treatmentPrescriptions];
                    // keep non-conflicting existing
                    prev.forEach((existing) => {
                      if (!combined.some((c) => (c.name || c.title) === (existing.name || existing.title))) {
                        combined.push(existing);
                      }
                    });
                    return combined;
                  });
                }

                // Hydrate LFK exercise complex from relational table
                if (Array.isArray(t.lfk) && t.lfk.length > 0) {
                  lfkItemsCount = t.lfk.length;
                  setTemplateLfkData(t.lfk);
                  const initialPhases: Record<number, boolean> = { 1: true, 2: false, 3: false };
                  setActiveLfkPhases(initialPhases);

                  // Create separate prescription for Phase 1
                  const lfkItem1 = createLfkPrescriptionItem(1, t.lfk);
                  setPrescriptions((prev) => {
                    const withoutLfk = prev.filter((p) => typeof p.id !== 'string' || !p.id.startsWith('lfk_phase_'));
                    return [...withoutLfk, lfkItem1];
                  });

                  updateLfkRecommendations(initialPhases, t.lfk);
                }
              }
            }
          } catch (err) {
            console.error('Error fetching full template relations:', err);
          }
        }

        // Expand relevant cards so doctor immediately sees populated data
        setExpandedSections((prev) => ({
          ...prev,
          domain1_complaints: true,
          domain2_rom: true,
          domain3_tests: Boolean(Object.keys(examTests).length > 0),
          domain4_diagnostics: Boolean(diagList.length > 0 || specialStudiesText),
          domain5_manipulations: Boolean(treatmentPrescriptions.some((p) => p.category === 'manipulation') || performedManipulationsText),
          domain6_physiotherapy: Boolean(treatmentPrescriptions.some((p) => p.category === 'physio')),
          domain7_orthotics: Boolean(treatmentPrescriptions.some((p) => p.category === 'orthotics')),
          domain8_lfk: Boolean(lfkItemsCount > 0 || recsText),
          complaints: true,
          anamnesis_morbi: true,
          functional_tests: true,
          special_studies: Boolean(diagList.length > 0 || specialStudiesText),
          diagnosis: true,
          recommendations: true
        }));

        setJointExamsMap((prev) => ({
          ...prev,
          [matchingArea]: {
            jointArea: matchingArea,
            side: matchingArea.endsWith('_l') ? 'left' : 'right',
            axis: parsed.axis || 'norm',
            effusion: parsed.effusion || 0,
            rom: examRom,
            tests: examTests
          }
        }));

        const loadedParts: string[] = [];
        if (complaintsText) loadedParts.push('статус');
        if (examRom) loadedParts.push('ROM');
        if (Object.keys(examTests).length) loadedParts.push(`тесты (${Object.keys(examTests).length})`);
        if (diagList.length) loadedParts.push(`диагностика (${diagList.length})`);
        if (treatmentPrescriptions.length) loadedParts.push(`назначения (${treatmentPrescriptions.length})`);
        if (lfkItemsCount) loadedParts.push(`ЛФК (${lfkItemsCount})`);
        const detailsStr = loadedParts.length ? ` [${loadedParts.join(' • ')}]` : '';

        setCurrentSelectedTemplate(tmpl);
        setProtocolDialogOpen(false);
        setToastMessage(`Шаблон «${tmpl.title}» успешно применён${detailsStr}`);
        return;
      }
      setCurrentSelectedTemplate(tmpl);
      setProtocolDialogOpen(false);
      setToastMessage(`Шаблон «${tmpl.title}» успешно применён`);
    } catch (e: any) {
      console.error('Error applying template:', e);
      setToastMessage('Ошибка применения шаблона');
    }
  };

  // Add Prescribed Service from Catalog
  const handleAddService = () => {
    if (!pendingService) return;
    const exists = prescriptions.find((p) => (p.name || (p as any).title) === pendingService.name);
    if (exists) {
      setPrescriptions((prev) =>
        prev.map((p) => ((p.name || (p as any).title) === pendingService.name ? { ...p, quantity: (p.quantity || 1) + 1 } : p))
      );
    } else {
      setPrescriptions((prev) => [
        ...prev,
        {
          id: `serv-${pendingService.id || Date.now()}`,
          code: pendingService.code || '',
          serviceCode: pendingService.code || '',
          name: pendingService.name,
          title: pendingService.name,
          category: pendingService.kind || 'Ортопедия',
          quantity: 1,
          price: Number(pendingService.price || 0),
          unitPrice: Number(pendingService.price || 0),
          serviceId: pendingService.id
        }
      ]);
    }
    setPendingService(null);
  };

  const handleRemovePrescription = (idx: number) => {
    setPrescriptions((prev) => {
      const item = prev[idx];
      if (item && item.id && typeof item.id === 'string' && item.id.startsWith('lfk_phase_')) {
        const pNum = Number(item.id.replace('lfk_phase_', ''));
        if (pNum >= 1 && pNum <= 3) {
          const newPhases = { ...activeLfkPhases, [pNum]: false };
          setActiveLfkPhases(newPhases);
          updateLfkRecommendations(newPhases, templateLfkData);
        }
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Assemble full protocol data for Live Preview & Reports
  const assembledProtocolData: OrthoProtocolData = useMemo(() => {
    const pt = contextData?.patient || {};
    const appt = contextData?.appointment || {};

    return {
      protocolNumber: protocolId || `DRAFT-${appt.id || 'NEW'}`,
      visitDate: appt.appointment_date || new Date().toISOString(),
      doctorName: appt.doctor_name || contextData?.doctor?.full_name || 'Добрушкин Александр Моисеевич',
      patient: {
        id: pt.id,
        fullName: pt.full_name || 'Пациент не выбран',
        birthDate: pt.bdate,
        gender: pt.sex === 1 ? 'Мужской' : pt.sex === 2 ? 'Женский' : undefined,
        phone: pt.phone || pt.sphone,
        cardNum: pt.mednum ? String(pt.mednum) : undefined
      },
      complaints,
      anamnesis,
      anamnesisVitae,
      objectiveStatus,
      specialStudies,
      performedManipulations,
      activeSectionsMask: activeSections,
      vasScore,
      gait,
      posture,
      jointExams: Object.values(jointExamsMap),
      icdCode: selectedMkb?.code,
      icdName: selectedMkb?.name,
      clinicalDiagnosis,
      recommendations,
      prescriptions,
      isSigned,
      signedAt,
      signatureHash
    };
  }, [
    contextData,
    protocolId,
    complaints,
    anamnesis,
    anamnesisVitae,
    objectiveStatus,
    specialStudies,
    performedManipulations,
    activeSections,
    vasScore,
    gait,
    posture,
    jointExamsMap,
    selectedMkb,
    clinicalDiagnosis,
    recommendations,
    prescriptions,
    isSigned,
    signedAt,
    signatureHash
  ]);

  // Save Protocol (Draft or Signed)
  const handleSaveProtocol = async (status: 'draft' | 'signed') => {
    if (!contextData?.patient?.id) {
      setToastMessage('Ошибка: пациент не определен');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        protocolId,
        appointmentId: contextData?.appointment?.id,
        patientId: contextData.patient.id,
        doctorId: contextData.appointment?.doctor_id || 1,
        jointArea: selectedJoint,
        side: currentJointState.side,
        vasScore,
        rom: currentJointState.rom,
        tests: currentJointState.tests,
        complaints,
        anamnesis,
        anamnesis_vitae: anamnesisVitae,
        objective_status: objectiveStatus,
        special_studies: specialStudies,
        performed_manipulations: performedManipulations,
        active_sections_mask: activeSections,
        recommendations,
        gait,
        posture,
        diagnosis: selectedMkb
          ? {
              mkb_code: selectedMkb.code,
              mkb_name: selectedMkb.name,
              diagnosis_type: 'clinical'
            }
          : undefined,
        prescriptions: prescriptions.map((p) => {
          const itemPrice = Number(p.price ?? (p as any).unitPrice ?? (p as any).unit_price ?? 0);
          const itemQty = Number(p.quantity || 1);
          return {
            serviceId: (p as any).serviceId || null,
            serviceCode: p.code || (p as any).serviceCode || '',
            code: p.code || (p as any).serviceCode || '',
            title: p.name || (p as any).title || 'Медицинская услуга',
            name: p.name || (p as any).title || 'Медицинская услуга',
            category: p.category || 'Ортопедия',
            quantity: itemQty,
            unitPrice: itemPrice,
            unit_price: itemPrice,
            price: itemPrice,
            total_price: itemPrice * itemQty,
            dosage_notes: (p as any).dosage_notes || ''
          };
        }),
        contentText: clinicalDiagnosis,
        status
      };

      const res = await fetch(`${API_BASE_URL}/api/ortho/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Ошибка при сохранении протокола');
      }

      setProtocolId(data.protocolId);
      if (status === 'signed') {
        setIsSigned(true);
        setSignedAt(new Date().toLocaleString('ru-RU'));
        setSignatureHash(data.signatureHash);
      }

      setToastMessage(status === 'signed' ? '✔ Протокол осмотра успешно подписан ЭЦП' : 'Черновик протокола сохранён');
      return data.protocolId;
    } catch (err: any) {
      console.error('Error saving protocol:', err);
      setToastMessage(`Ошибка сохранения: ${err.message}`);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Transfer to Cashier Checkout
  const handleTransferToCashier = async () => {
    try {
      setSaving(true);
      let currentProtocolId = protocolId;
      // Always save current protocol state & prescriptions to DB so database protocol matches cashier calculation
      const saveStatus = isSigned ? 'signed' : 'draft';
      const savedId = await handleSaveProtocol(saveStatus);
      if (savedId) {
        currentProtocolId = savedId;
      }

      const targetPt = contextData?.patient;
      const targetDoctor = contextData?.doctor || contextData?.appointment?.doctor;

      const itemsToTransfer = prescriptions.map((p) => {
        const itemPrice = Number(p.price ?? (p as any).unitPrice ?? (p as any).unit_price ?? 0);
        const pAny = p as any;
        const itemQty = Number(p.quantity || 1);
        const rawId = pAny.serviceId || (typeof pAny.id === 'number' ? pAny.id : (typeof pAny.id === 'string' && pAny.id.startsWith('serv-') ? Number(pAny.id.replace('serv-', '')) : undefined));
        return {
          id: rawId && !isNaN(rawId) ? Number(rawId) : undefined,
          serviceId: rawId && !isNaN(rawId) ? Number(rawId) : undefined,
          title: p.name || (p as any).title || 'Медицинская услуга',
          name: p.name || (p as any).title || 'Медицинская услуга',
          price: itemPrice,
          unitPrice: itemPrice,
          unit_price: itemPrice,
          quantity: itemQty,
          code: p.code || (p as any).serviceCode || '',
          category: p.category || 'Ортопедия'
        };
      });

      const payload = {
        appointmentId: contextData?.appointment?.id,
        protocolId: currentProtocolId,
        patientId: targetPt?.id,
        patientName: targetPt?.full_name || [targetPt?.surname, targetPt?.name, targetPt?.patron].filter(Boolean).join(' ') || 'Пациент',
        doctorId: targetDoctor?.id || contextData?.appointment?.doctor_id,
        doctorName: targetDoctor?.full_name,
        items: itemsToTransfer
      };

      const res = await fetch(`${API_BASE_URL}/api/ortho/transfer-to-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.checkoutPrefill) {
        sessionStorage.setItem('ortho_checkout_prefill', JSON.stringify(data.checkoutPrefill));
        setToastMessage('Назначения переданы в кассу! Переход в оформление визита...');
        const qParams = new URLSearchParams();
        if (payload.patientId) qParams.set('patientId', String(payload.patientId));
        if (payload.appointmentId) qParams.set('appointmentId', String(payload.appointmentId));
        if (currentProtocolId) qParams.set('protocolId', String(currentProtocolId));
        const redirectUrl = qParams.toString() ? `/checkout?${qParams.toString()}` : '/checkout';
        setTimeout(() => {
          navigate(redirectUrl);
        }, 300);
      } else {
        throw new Error(data.error || 'Не удалось передать в кассу');
      }
    } catch (err: any) {
      console.error('Transfer to checkout error:', err);
      setToastMessage(`Ошибка передачи в кассу: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={48} sx={{ color: '#0F3C64' }} />
        <Typography variant="body1" sx={{ color: '#475569', fontWeight: 600 }}>
          Загрузка медицинского профиля и биомеханики пациента...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/protocols-registry')}>
          К реестру протоколов
        </Button>
      </Box>
    );
  }

  const patient = contextData?.patient || {};
  const appointment = contextData?.appointment || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden', bgcolor: '#F1F5F9' }}>
      {/* TOP HEADER / PATIENT BANNER */}
      <Paper
        elevation={1}
        sx={{
          px: 2.5,
          py: 1,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: '1 1 auto', minWidth: 0, flexWrap: 'wrap' }}>
          <Tooltip title="Назад в расписание / реестр">
            <IconButton size="small" onClick={() => navigate('/protocols-registry')}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              {contextData?.patient?.id ? (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.15rem' }}>
                    {patient.full_name || 'Пациент'}
                  </Typography>
                  <Chip
                    label={`№ карты: ${patient.mednum || 'б/н'}`}
                    size="small"
                    sx={{ bgcolor: '#E2E8F0', fontWeight: 700, fontSize: '0.75rem' }}
                  />
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<SwapHorizIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setPatientDialogOpen(true)}
                    sx={{ textTransform: 'none', fontWeight: 700, color: '#0284C7', py: 0, px: 0.8 }}
                  >
                    Сменить
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  startIcon={<PersonSearchIcon />}
                  onClick={() => setPatientDialogOpen(true)}
                  sx={{ fontWeight: 800, textTransform: 'none', px: 2 }}
                >
                  ⚠️ Пациент не выбран — Нажмите для выбора
                </Button>
              )}

              {/* Protocol status badge & changer */}
              {currentSelectedTemplate ? (
                <Tooltip title="Нажмите для смены протокола" arrow placement="bottom">
                  <Chip
                    icon={<AssignmentIcon sx={{ fontSize: 16 }} />}
                    label={
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <span>Протокол:</span>
                        <LatexText text={currentSelectedTemplate.title} />
                      </Box>
                    }
                    color="primary"
                    variant="outlined"
                    size="small"
                    onClick={() => setProtocolDialogOpen(true)}
                    onDelete={() => setProtocolDialogOpen(true)}
                    deleteIcon={<SwapHorizIcon />}
                    sx={{
                      fontWeight: 700,
                      cursor: 'pointer',
                      height: 'auto',
                      minHeight: 28,
                      py: 0.35,
                      px: 0.5,
                      maxWidth: 'none',
                      whiteSpace: 'normal',
                      '& .MuiChip-label': {
                        whiteSpace: 'normal',
                        overflow: 'visible',
                        textOverflow: 'clip',
                        display: 'inline-flex',
                        alignItems: 'center',
                        lineHeight: 1.3,
                        py: 0.2
                      }
                    }}
                  />
                </Tooltip>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<LayersIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setProtocolDialogOpen(true)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: '#CBD5E1',
                    color: '#475569',
                    fontSize: '0.78rem'
                  }}
                >
                  Выбрать протокол (2 уровня)
                </Button>
              )}

              {isSigned && (
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                  label="Подписан ЭЦП"
                  size="small"
                  color="success"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', gap: 2, mt: 0.2 }}>
              {contextData?.patient?.id ? (
                <>
                  <span>Дата рожд.: <b>{patient.bdate || '—'}</b> ({patient.age || '—'} лет)</span>
                  <span>Пол: <b>{patient.sex === 1 ? 'М' : patient.sex === 2 ? 'Ж' : '—'}</b></span>
                  <span>Тел: <b>{patient.sphone || patient.phone || '—'}</b></span>
                </>
              ) : (
                <span style={{ color: '#D97706', fontWeight: 600 }}>Новый визит: выберите пациента и клинический протокол для автоматического заполнения.</span>
              )}
              <span>Врач: <b>{appointment.doctor_name || contextData?.doctor?.full_name || 'Добрушкин Александр Моисеевич'}</b></span>
            </Typography>
          </Box>
        </Box>

        {/* PATIENT SEARCH, FAST CLINICAL TEMPLATES & ACTION BUTTONS */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LayersIcon />}
            onClick={() => setProtocolDialogOpen(true)}
            sx={{
              fontWeight: 700,
              borderColor: '#0284C7',
              color: '#0284C7',
              whiteSpace: 'nowrap',
              textTransform: 'none'
            }}
          >
            Справочник протоколов ({clusterCounts['all'] || 180})
          </Button>

          <Tooltip title="Открыть Справочник клинических шаблонов 2.0 (CRUD, ортопедические тесты, методы диагностики)">
            <Button
              variant="outlined"
              size="small"
              startIcon={<ScienceIcon />}
              onClick={() => navigate('/ortho-templates-manager')}
              sx={{
                fontWeight: 700,
                borderColor: '#64748B',
                color: '#64748B',
                whiteSpace: 'nowrap',
                textTransform: 'none',
                '&:hover': { bgcolor: '#F8FAFC' }
              }}
            >
              Конструктор 2.0
            </Button>
          </Tooltip>

          <Tooltip
            title="Сохранить текущие заполненные данные приема в Кластер как Кастомизированный (авторский) шаблон"
            enterDelay={500}
            leaveDelay={0}
            disableInteractive
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<StarIcon sx={{ color: '#F59E0B' }} />}
              onClick={handleOpenSaveCustomTemplate}
              sx={{
                fontWeight: 700,
                borderColor: '#F59E0B',
                color: '#B45309',
                whiteSpace: 'nowrap',
                textTransform: 'none',
                bgcolor: '#FFFBEB',
                '&:hover': { bgcolor: '#FEF3C7', borderColor: '#D97706' }
              }}
            >
              ⭐ В шаблон
            </Button>
          </Tooltip>

          <Button
            variant="outlined"
            size="small"
            startIcon={<SaveIcon />}
            onClick={() => handleSaveProtocol('draft')}
            disabled={saving}
            sx={{ fontWeight: 700 }}
          >
            Черновик
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<LockIcon />}
            onClick={() => handleSaveProtocol('signed')}
            disabled={saving}
            sx={{ bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' }, fontWeight: 700 }}
          >
            {isSigned ? 'Обновить (ЭЦП)' : 'Подписать (ЭЦП)'}
          </Button>

          <Button
            variant="contained"
            size="small"
            color="success"
            startIcon={<PointOfSaleIcon />}
            onClick={handleTransferToCashier}
            disabled={saving || prescriptions.length === 0}
            sx={{ fontWeight: 800, px: 2 }}
          >
            В кассу ({prescriptions.reduce((s, p) => s + ((p.price ?? (p as any).unitPrice ?? (p as any).unit_price) || 0) * (p.quantity || 1), 0).toLocaleString('ru-RU')} ₽)
          </Button>

          <Badge
            badgeContent={prescriptions.length + (activeTemplateDiagnostics?.length || 0)}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: '#0284C7',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.72rem'
              }
            }}
          >
            <Button
              variant="contained"
              size="small"
              startIcon={<AssignmentIcon />}
              onClick={() => setIssueReferralModalOpen(true)}
              disabled={!contextData?.patient?.id}
              sx={{
                bgcolor: '#0F3C64',
                color: '#FFFFFF',
                fontWeight: 800,
                textTransform: 'none',
                px: 1.8,
                boxShadow: '0 4px 10px rgba(15, 60, 100, 0.2)',
                '&:hover': { bgcolor: '#0B2D4B' }
              }}
            >
              Направление
            </Button>
          </Badge>

          <Tooltip title="Открыть Реестр направлений (контроль 90 дней, аудит, повторная печать бланков)">
            <Button
              variant="outlined"
              size="small"
              startIcon={<DescriptionIcon />}
              onClick={() => navigate(contextData?.patient?.id ? `/patient-referrals?patientId=${contextData.patient.id}` : '/patient-referrals')}
              sx={{
                borderColor: '#CBD5E1',
                color: '#475569',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { bgcolor: '#F8FAFC' }
              }}
            >
              Реестр
            </Button>
          </Tooltip>
        </Box>
      </Paper>

      {/* WORKSTATION SPLIT SCREEN BODY */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT COLUMN: INTERACTIVE CLINICAL EXAM (55% Width) */}
        <Box sx={{ flex: '0 0 55%', overflowY: 'auto', p: 2, borderRight: '1px solid #CBD5E1' }}>
          {/* SANDWICH TOP TOOLBAR: EXPAND/COLLAPSE ALL + SMART FOCUS + PRINT STATUS BADGE */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              p: 1.25,
              bgcolor: '#F8FAFC',
              borderRadius: 2,
              border: '1px solid #E2E8F0',
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', mr: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Разделы приема (8 доменов):
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<UnfoldMoreIcon sx={{ fontSize: 16 }} />}
                onClick={handleExpandAll}
                sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', py: 0.3, px: 1 }}
              >
                Развернуть все
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<UnfoldLessIcon sx={{ fontSize: 16 }} />}
                onClick={handleCollapseAll}
                sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', py: 0.3, px: 1, color: '#64748B', borderColor: '#CBD5E1' }}
              >
                Свернуть все
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<BoltIcon sx={{ fontSize: 16 }} />}
                onClick={handleSmartFocus}
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'none',
                  py: 0.3,
                  px: 1.2,
                  bgcolor: '#0F3C64',
                  '&:hover': { bgcolor: '#0A2540' },
                  boxShadow: '0 2px 6px rgba(15, 60, 100, 0.25)'
                }}
              >
                Smart Focus (Только активные)
              </Button>
            </Box>

            <Tooltip title="Разделы, отмеченные галочкой и содержащие данные, войдут в официальный протокол и распечатку. Деактивированные разделы не печатаются.">
              <Chip
                icon={<PrintIcon sx={{ fontSize: '0.95rem !important' }} />}
                label={`В печать: ${printSectionsCount} из 8 доменов`}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  bgcolor: printSectionsCount > 0 ? '#E0F2FE' : '#F1F5F9',
                  color: printSectionsCount > 0 ? '#0369A1' : '#64748B',
                  border: '1px solid',
                  borderColor: printSectionsCount > 0 ? '#BAE6FD' : '#E2E8F0'
                }}
              />
            </Tooltip>
          </Box>

          {/* 1. ЖАЛОБЫ, АНАМНЕЗ И КЛИНИЧЕСКИЙ СТАТУС */}
          <OrthoSandwichCard
            id="domain1_complaints"
            title="1. Жалобы, анамнез и клинический статус"
            subtitle="Жалобы, интенсивность боли (ВАШ), Anamnesis morbi/vitae, Status praesens, 2D Гомункулус и диагноз МКБ-10"
            icon={<ArticleIcon sx={{ fontSize: 20 }} />}
            accentColor="#0F3C64"
            expanded={Boolean(expandedSections.domain1_complaints ?? expandedSections.complaints)}
            onToggleExpand={() => handleToggleExpand('domain1_complaints')}
            isActive={Boolean(activeSections.domain1_complaints ?? activeSections.complaints)}
            onToggleActive={(act) => handleToggleActive('domain1_complaints', act)}
            hasContent={Boolean(complaints.trim() || clinicalDiagnosis.trim() || anamnesis.trim() || selectedMkb)}
            previewSnippet={
              (selectedMkb?.code ? `[${selectedMkb.code}] ` : '') +
              (complaints.trim() ? complaints.slice(0, 80) : 'Жалобы и статус внесены') +
              (complaints.length > 80 ? '...' : '')
            }
            headerActions={
              <Button
                size="small"
                variant="outlined"
                startIcon={<AssignmentIcon sx={{ fontSize: 15 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedJoint && JOINT_TO_CLUSTER[selectedJoint]) {
                    setSelectedClusterId(JOINT_TO_CLUSTER[selectedJoint].clusterId);
                  }
                  setProtocolDialogOpen(true);
                }}
                sx={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  borderColor: '#0284C7',
                  color: '#0284C7',
                  textTransform: 'none',
                  py: 0.2
                }}
              >
                Протоколы ({filteredTemplates.length})
              </Button>
            }
          >
            {/* 1.1 Complaints & VAS */}
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}>
              1.1. Жалобы при обращении и интенсивность боли (ВАШ)
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Жалобы при обращении"
                  multiline
                  minRows={2}
                  value={complaints}
                  onChange={(e) => setComplaints(e.target.value)}
                  placeholder="Боль, ограничение движений, отек, хруст, ощущение нестабильности..."
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                      Визуально-аналоговая шкала боли (ВАШ 0-10):
                    </Typography>
                    <Chip
                      label={`${vasScore} / 10 баллов`}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        bgcolor: vasScore >= 7 ? '#FEE2E2' : vasScore >= 4 ? '#FEF3C7' : '#DCFCE7',
                        color: vasScore >= 7 ? '#991B1B' : vasScore >= 4 ? '#92400E' : '#166534'
                      }}
                    />
                  </Box>
                  <Slider
                    value={vasScore}
                    min={0}
                    max={10}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    onChange={(_, val) => setVasScore(val as number)}
                    sx={{
                      color: vasScore >= 7 ? '#DC2626' : vasScore >= 4 ? '#D97706' : '#16A34A',
                      height: 6
                    }}
                  />
                </Box>
              </Grid>
            </Grid>

            {/* 1.2 Anamnesis */}
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}>
              1.2. Анамнез заболевания и жизни
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Анамнез заболевания (Anamnesis morbi)"
                  multiline
                  minRows={2}
                  value={anamnesis}
                  onChange={(e) => setAnamnesis(e.target.value)}
                  placeholder="Длительность заболевания, связь с травмой, проводимое ранее консервативное лечение..."
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 0.8, mb: 1, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label="+ Аллергоанамнез не отягощен"
                    onClick={() => setAnamnesisVitae((prev) => (prev ? `${prev} Аллергоанамнез не отягощен.` : 'Аллергоанамнез не отягощен.'))}
                    sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
                  />
                  <Chip
                    size="small"
                    label="+ Хронические соматические отрицает"
                    onClick={() => setAnamnesisVitae((prev) => (prev ? `${prev} Хронические заболевания отрицает.` : 'Хронические соматические заболевания отрицает.'))}
                    sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
                  />
                  <Chip
                    size="small"
                    label="+ Операций на суставах не было"
                    onClick={() => setAnamnesisVitae((prev) => (prev ? `${prev} Операций на опорно-двигательном аппарате в анамнезе нет.` : 'Операций на опорно-двигательном аппарате в анамнезе нет.'))}
                    sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
                  />
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Анамнез жизни (Anamnesis vitae)"
                  multiline
                  minRows={2}
                  value={anamnesisVitae}
                  onChange={(e) => setAnamnesisVitae(e.target.value)}
                  placeholder="Аллергологический статус, сопутствующие соматические патологии..."
                />
              </Grid>
            </Grid>

            {/* 1.3 Objective status & 2D Homunculus */}
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}>
              1.3. Общий и локальный ортопедический статус (2D Гомункулус)
            </Typography>
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 0.8, mb: 1, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label="+ Состояние удовл., нормостеник"
                  onClick={() => setObjectiveStatus((prev) => (prev ? `${prev} Состояние удовлетворительное. Нормостеник.` : 'Общее состояние удовлетворительное. Нормостенического телосложения.'))}
                  sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
                />
                <Chip
                  size="small"
                  label="+ Кожные покровы физиологические, чистые"
                  onClick={() => setObjectiveStatus((prev) => (prev ? `${prev} Кожные покровы физиологической окраски, чистые.` : 'Кожные покровы физиологической окраски, чистые.'))}
                  sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
                />
                <Chip
                  size="small"
                  label="+ Периферических отеков нет"
                  onClick={() => setObjectiveStatus((prev) => (prev ? `${prev} Периферических отеков нет.` : 'Периферических отеков нет.'))}
                  sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
                />
              </Box>
              <TextField
                fullWidth
                size="small"
                label="Общий объективный статус (Status praesens)"
                multiline
                minRows={2}
                value={objectiveStatus}
                onChange={(e) => setObjectiveStatus(e.target.value)}
                placeholder="Общее самочувствие, телосложение, гемодинамика, кожные покровы..."
                sx={{ mb: 2 }}
              />
            </Box>

            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#FAFBFD', borderColor: '#E2E8F0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
                Анатомическая интерактивная карта (2D Гомункулус):
              </Typography>
              <BodyHomunculus
                selectedJoint={selectedJoint}
                onSelectJoint={(j) => setSelectedJoint(j)}
                examData={homunculusExamSummary}
                selectedClusterId={selectedClusterId}
                onSelectCluster={(clusterId, side) => {
                  setSelectedClusterId(clusterId);
                  if (side && side !== 'axial') {
                    setJointExamsMap((prev) => {
                      const cur = prev[selectedJoint] || currentJointState;
                      return {
                        ...prev,
                        [selectedJoint]: {
                          ...cur,
                          side
                        }
                      };
                    });
                  }
                }}
                showClusterQuickFilters={true}
              />
            </Paper>

            {/* 1.4 Clinical Diagnosis */}
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}>
              1.4. Клинический диагноз (МКБ-10)
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  size="small"
                  options={COMMON_MKB10}
                  getOptionLabel={(o) => `${o.code} — ${o.name}`}
                  value={selectedMkb}
                  onChange={(_, val) => {
                    setSelectedMkb(val);
                    if (val) {
                      const code = val.code;
                      if (code.startsWith('M77.1') || code.startsWith('M77.0') || code.startsWith('M70.2') || code.startsWith('G56.2') || code.startsWith('S53')) {
                        setSelectedJoint((prev) => (prev.startsWith('elbow') ? prev : 'elbow_r'));
                      } else if (code.startsWith('M17') || code.startsWith('M23') || code.startsWith('S83')) {
                        setSelectedJoint((prev) => (prev.startsWith('knee') ? prev : 'knee_r'));
                      } else if (code.startsWith('M75')) {
                        setSelectedJoint((prev) => (prev.startsWith('shoulder') ? prev : 'shoulder_r'));
                      } else if (code.startsWith('M16')) {
                        setSelectedJoint((prev) => (prev.startsWith('hip') ? prev : 'hip_r'));
                      } else if (code.startsWith('M77.3') || code.startsWith('M20.1')) {
                        setSelectedJoint((prev) => (prev.startsWith('foot') ? prev : 'foot_r'));
                      } else if (code.startsWith('M54')) {
                        setSelectedJoint((prev) => (prev.startsWith('spine') ? prev : 'spine_l'));
                      }
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label="Код по МКБ-10" />}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Развернутый клинический диагноз"
                  multiline
                  minRows={2}
                  value={clinicalDiagnosis}
                  onChange={(e) => setClinicalDiagnosis(e.target.value)}
                  placeholder="Стадия, сопутствующие деформации, функциональный класс..."
                />
              </Grid>
            </Grid>
          </OrthoSandwichCard>

          {/* 2. ROM (ГОНИОМЕТРИЯ SFTR NEUTRAL-0) */}
          <OrthoSandwichCard
            id="domain2_rom"
            title="2. ROM (Гониометрия объёма движений SFTR Neutral-0)"
            subtitle="Амплитуда движений по системе Neutral-0, ось конечности, выпот и синовит сустава"
            icon={<StraightenIcon sx={{ fontSize: 20 }} />}
            accentColor="#0369A1"
            expanded={Boolean(expandedSections.domain2_rom ?? expandedSections.functional_tests)}
            onToggleExpand={() => handleToggleExpand('domain2_rom')}
            isActive={Boolean(activeSections.domain2_rom ?? activeSections.functional_tests)}
            onToggleActive={(act) => handleToggleActive('domain2_rom', act)}
            hasContent={true}
            badge={
              (currentJointState.rom?.extension_deficit || 0) > 0 || (currentJointState.effusion || 0) > 0 ? (
                <Chip
                  label={`Дефицит: ${currentJointState.rom?.extension_deficit || 0}°, Выпот: ${currentJointState.effusion || 0}`}
                  size="small"
                  sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #FCD34D' }}
                />
              ) : (
                <Chip
                  label="Физиологическая норма"
                  size="small"
                  sx={{ bgcolor: '#ECFDF5', color: '#047857', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #A7F3D0' }}
                />
              )
            }
            previewSnippet={
              currentJointState.rom
                ? `Сгибание: ${currentJointState.rom.flexion_active}°, Дефицит: ${currentJointState.rom.extension_deficit || 0}°, Выпот: ${currentJointState.effusion || 0}`
                : 'Данные гониометрии'
            }
          >
            <JointExamCard
              jointArea={selectedJoint}
              state={currentJointState}
              onChange={handleJointExamChange}
              mode="rom_only"
              previousVisitDelta={
                contextData?.lastProtocol
                  ? {
                      date: contextData.lastProtocol.vdate || 'Предыдущий визит',
                      romDelta: '+10° сгибание',
                      vasDelta: '-2 балла ВАШ'
                    }
                  : undefined
              }
            />
          </OrthoSandwichCard>

          {/* 3. РЕЕСТР СПЕЦИАЛЬНЫХ ОРТОПЕДИЧЕСКИХ ТЕСТОВ */}
          <OrthoSandwichCard
            id="domain3_tests"
            title="3. Реестр специальных ортопедических тестов ($Sn$, $Sp$, $LR+$)"
            subtitle="Клинические провокационные пробы: Tier 1 ($Sn \ge 95\%$), Tier 2 ($Sp \ge 90\%$), Tier 3 ($LR+ > 5.0$)"
            icon={<HealingIcon sx={{ fontSize: 20 }} />}
            accentColor="#15803D"
            expanded={Boolean(expandedSections.domain3_tests ?? expandedSections.functional_tests)}
            onToggleExpand={() => handleToggleExpand('domain3_tests')}
            isActive={Boolean(activeSections.domain3_tests ?? activeSections.functional_tests)}
            onToggleActive={(act) => handleToggleActive('domain3_tests', act)}
            hasContent={true}
            badge={
              (() => {
                const posCount = Object.values(currentJointState.tests || {}).filter(
                  (v) => v === 'positive' || v === 'positive_medial' || v === 'positive_lateral'
                ).length;
                return posCount > 0 ? (
                  <Chip
                    label={`Положительных: ${posCount} (+)`}
                    size="small"
                    sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #FCA5A5' }}
                  />
                ) : (
                  <Chip
                    label="Все тесты (-) норма"
                    size="small"
                    sx={{ bgcolor: '#ECFDF5', color: '#047857', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #A7F3D0' }}
                  />
                );
              })()
            }
            previewSnippet={
              `${Object.values(currentJointState.tests || {}).filter(v => v !== 'negative').length} полож. (+) из ${Object.keys(currentJointState.tests || {}).length} тестов`
            }
          >
            <JointExamCard
              jointArea={selectedJoint}
              state={currentJointState}
              onChange={handleJointExamChange}
              mode="tests_only"
            />
          </OrthoSandwichCard>

          {/* 4. ИНСТРУМЕНТАЛЬНАЯ И ЛАБОРАТОРНАЯ ДИАГНОСТИКА */}
          <OrthoSandwichCard
            id="domain4_diagnostics"
            title="4. Инструментальная и лабораторная диагностика"
            subtitle="Рентгенография, МРТ ($B_0 \ge 1.5\text{ Тл}$), КТ ($3\text{D}$), УЗИ суставов, лабораторные анализы ($[CRP] < 5\text{ мг/л}$), ЭНМГ"
            icon={<BiotechIcon sx={{ fontSize: 20 }} />}
            accentColor="#0284C7"
            expanded={Boolean(expandedSections.domain4_diagnostics ?? expandedSections.special_studies)}
            onToggleExpand={() => handleToggleExpand('domain4_diagnostics')}
            isActive={Boolean(activeSections.domain4_diagnostics ?? activeSections.special_studies)}
            onToggleActive={(act) => handleToggleActive('domain4_diagnostics', act)}
            hasContent={Boolean(specialStudies.trim() || activeTemplateDiagnostics.length > 0)}
            badge={
              activeTemplateDiagnostics.length > 0 ? (
                <Chip
                  label={`${activeTemplateDiagnostics.length} иссл. в шаблоне`}
                  size="small"
                  sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #BAE6FD' }}
                />
              ) : undefined
            }
            previewSnippet={
              specialStudies.trim()
                ? specialStudies.slice(0, 90) + (specialStudies.length > 90 ? '...' : '')
                : `${activeTemplateDiagnostics.length} исследований назначено`
            }
          >
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Данные специальных методов исследования (МРТ, КТ, рентген, УЗИ, лабораторные анализы)"
                multiline
                minRows={3}
                value={specialStudies}
                onChange={(e) => setSpecialStudies(e.target.value)}
                placeholder="Результаты рентгенографии, МРТ сустава, сонографии, клинических и биохимических анализов..."
              />
            </Box>

            <DiagnosticRecommendationsCard
              jointCategory={selectedJoint.split('_')[0] === 'foot' ? 'ankle' : selectedJoint.split('_')[0]}
              templateDiagnostics={activeTemplateDiagnostics}
              existingPrescriptions={prescriptions.map((p) => ({
                title: p.name || (p as any).title || '',
                service_id: (p as any).serviceId || (p as any).service_id,
                unit_price: Number(p.price ?? (p as any).unitPrice ?? (p as any).unit_price ?? 0)
              }))}
              onAddPrescription={(newPresc) => {
                const exists = prescriptions.find((p) => (p.name || (p as any).title) === newPresc.title);
                if (exists) {
                  setPrescriptions((prev) =>
                    prev.map((p) =>
                      (p.name || (p as any).title) === newPresc.title
                        ? { ...p, quantity: (p.quantity || 1) + 1 }
                        : p
                    )
                  );
                } else {
                  setPrescriptions((prev) => [
                    ...prev,
                    {
                      id: `serv-${newPresc.service_id || Date.now()}`,
                      code: '',
                      serviceCode: '',
                      name: newPresc.title,
                      title: newPresc.title,
                      category: newPresc.category || 'diagnostic',
                      quantity: newPresc.quantity || 1,
                      price: newPresc.unit_price,
                      unitPrice: newPresc.unit_price,
                      serviceId: newPresc.service_id
                    }
                  ]);
                }
                setToastMessage(`Добавлено в назначения: ${newPresc.title} (${newPresc.unit_price} ₽)`);
              }}
              onAppendRecommendationText={(phrase) => {
                setSpecialStudies((prev) => {
                  if (prev.includes(phrase)) return prev;
                  return prev ? `${prev}\n• ${phrase}` : `• ${phrase}`;
                });
                setToastMessage('Назначение исследования добавлено в протокол');
              }}
            />
          </OrthoSandwichCard>

          {/* 5. ЛЕЧЕБНЫЕ МАНИПУЛЯЦИИ И ИНЪЕКЦИОННАЯ ТЕРАПИЯ */}
          <OrthoSandwichCard
            id="domain5_manipulations"
            title="5. Лечебные манипуляции и инъекционная терапия"
            subtitle="Внутрисуставные блокады ($0.5\%$), пункции ($V = 2\text{–}40\text{ мл}$), гиалуронат ($MW \ge 2.4\text{–}3.0\text{ МДа}$), PRP ($[PLT] \ge 1.0 \times 10^6/\mu\text{л}$)"
            icon={<MedicalServicesIcon sx={{ fontSize: 20 }} />}
            accentColor="#0F766E"
            expanded={Boolean(expandedSections.domain5_manipulations ?? expandedSections.performed_manipulations)}
            onToggleExpand={() => handleToggleExpand('domain5_manipulations')}
            isActive={Boolean(activeSections.domain5_manipulations ?? activeSections.performed_manipulations)}
            onToggleActive={(act) => handleToggleActive('domain5_manipulations', act)}
            hasContent={Boolean(performedManipulations.trim() || prescriptions.some((p) => p.category === 'manipulation'))}
            badge={
              prescriptions.filter((p) => p.category === 'manipulation').length > 0 ? (
                <Chip
                  label={`${prescriptions.filter((p) => p.category === 'manipulation').length} в кассу`}
                  size="small"
                  sx={{ bgcolor: '#CCFBF1', color: '#0F766E', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #99F6E4' }}
                />
              ) : undefined
            }
            previewSnippet={
              performedManipulations.trim()
                ? performedManipulations.slice(0, 90) + (performedManipulations.length > 90 ? '...' : '')
                : 'Манипуляции не выполнялись'
            }
          >
            <Box sx={{ display: 'flex', gap: 0.8, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label={<LatexText text="+ Пункция сустава ($V = 5\text{–}40\text{ мл}$)" />}
                onClick={() => setPerformedManipulations((prev) => (prev ? `${prev}\n• Выполнена пункция сустава, эвакуация синовиального выпота.` : 'Выполнена пункция сустава, эвакуация синовиального выпота.'))}
                sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
              />
              <Chip
                size="small"
                label={<LatexText text="+ Внутрисуставная блокада ГКС ($0.5\%\text{ р-р}$)" />}
                onClick={() => setPerformedManipulations((prev) => (prev ? `${prev}\n• Внутрисуставное введение раствора пролонгированного ГКС с местным анестетиком.` : 'Внутрисуставное введение раствора пролонгированного ГКС с местным анестетиком.'))}
                sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
              />
              <Chip
                size="small"
                label={<LatexText text="+ Введение гиалуроната ($MW \ge 2.4\text{–}3.0\text{ МДа}$)" />}
                onClick={() => setPerformedManipulations((prev) => (prev ? `${prev}\n• Внутрисуставное введение препарата высокомолекулярного гиалуроната натрия.` : 'Внутрисуставное введение препарата высокомолекулярного гиалуроната натрия.'))}
                sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
              />
              <Chip
                size="small"
                label={<LatexText text="+ PRP-терапия ($[PLT] \ge 1.0 \times 10^6/\mu\text{л}$)" />}
                onClick={() => setPerformedManipulations((prev) => (prev ? `${prev}\n• Внутрисуставное введение аутологичной обогащенной тромбоцитами плазмы (PRP).` : 'Внутрисуставное введение аутологичной обогащенной тромбоцитами плазмы (PRP).'))}
                sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
              />
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Протокол выполненных манипуляций на приёме"
              multiline
              minRows={2}
              value={performedManipulations}
              onChange={(e) => setPerformedManipulations(e.target.value)}
              placeholder="Протокол пункции, объем эвакуированной жидкости, введенный препарат, дозировка, переносимость..."
              sx={{ mb: 2 }}
            />

            {/* Manipulations Prescriptions */}
            {prescriptions.filter((p) => p.category === 'manipulation').length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
                  Назначенные / включенные манипуляции:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {prescriptions
                    .filter((p) => p.category === 'manipulation')
                    .map((p, i) => (
                      <Chip
                        key={i}
                        label={`${p.name || (p as any).title} (${p.price} ₽)`}
                        size="small"
                        color="success"
                        onDelete={() => {
                          const idx = prescriptions.findIndex((x) => x.id === p.id);
                          if (idx >= 0) handleRemovePrescription(idx);
                        }}
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      />
                    ))}
                </Box>
              </Box>
            )}
          </OrthoSandwichCard>

          {/* 6. ФИЗИОТЕРАПИЯ И АППАРАТНОЕ ВОССТАНОВИТЕЛЬНОЕ ЛЕЧЕНИЕ */}
          <OrthoSandwichCard
            id="domain6_physiotherapy"
            title="6. Физиотерапия и аппаратное восстановительное лечение"
            subtitle="1-я линия EBM: HILT ($E = 2.5\text{–}4.0\text{ Дж/см}^2$), УВТ ($P = 2.0\text{–}3.5\text{ бар}$, $f = 10\text{–}15\text{ Гц}$), SIS ($B \ge 2.5\text{ Тл}$), TECAR ($f = 448\text{ кГц}$), Крио ($T = -30^\circ\text{C}$)"
            icon={<FitnessIcon sx={{ fontSize: 20 }} />}
            accentColor="#1D4ED8"
            expanded={Boolean(expandedSections.domain6_physiotherapy)}
            onToggleExpand={() => handleToggleExpand('domain6_physiotherapy')}
            isActive={Boolean(activeSections.domain6_physiotherapy)}
            onToggleActive={(act) => handleToggleActive('domain6_physiotherapy', act)}
            hasContent={prescriptions.some((p) => p.category === 'physio')}
            badge={
              prescriptions.filter((p) => p.category === 'physio').length > 0 ? (
                <Chip
                  label={`${prescriptions.filter((p) => p.category === 'physio').length} курс(а)`}
                  size="small"
                  sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #93C5FD' }}
                />
              ) : undefined
            }
            previewSnippet={
              prescriptions.some((p) => p.category === 'physio')
                ? prescriptions
                    .filter((p) => p.category === 'physio')
                    .map((p) => p.name || (p as any).title)
                    .join(' • ')
                : 'Аппаратная физиотерапия не назначена'
            }
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
              Быстрое назначение доказательных курсов физиотерапии (EBM P1 / P2):
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.8, mb: 2, flexWrap: 'wrap' }}>
              {[
                { title: 'HILT-лазер ($E = 2.5\\text{–}4.0\\text{ Дж/см}^2$, курс 7)', rawTitle: 'HILT-лазер высокой интенсивности (курс 7 сеансов)', price: 3200 },
                { title: 'Фокусированная УВТ ($P = 2.0\\text{–}3.5\\text{ бар}$, $f = 12\\text{ Гц}$, курс 5)', rawTitle: 'Фокусированная УВТ сустава (курс 5 сеансов)', price: 3500 },
                { title: 'Магнит SIS ($B = 2.5\\text{ Тл}$, курс 10)', rawTitle: 'Высокоинтенсивный магнит SIS (курс 10 сеансов)', price: 2800 },
                { title: 'Радиочастотная TECAR ($f = 448\\text{ кГц}$, курс 6)', rawTitle: 'Радиочастотная TECAR-терапия (курс 6 сеансов)', price: 3000 },
                { title: 'Локальная криотерапия ($T = -30^\\circ\\text{C}$, курс 5)', rawTitle: 'Локальная воздушная криотерапия -30°C (курс 5 сеансов)', price: 1800 }
              ].map((item, idx) => (
                <Chip
                  key={idx}
                  size="small"
                  label={<LatexText text={`+ ${item.title}`} />}
                  onClick={() => {
                    setPrescriptions((prev) => [
                      ...prev,
                      {
                        id: `physio-quick-${Date.now()}-${idx}`,
                        code: '',
                        serviceCode: '',
                        name: item.rawTitle,
                        title: item.rawTitle,
                        category: 'physio',
                        quantity: 1,
                        price: item.price,
                        unitPrice: item.price
                      }
                    ]);
                    setRecommendations((prev) => {
                      if (prev.includes(item.rawTitle)) return prev;
                      return prev ? `${prev}\n• Физиотерапия: ${item.rawTitle}.` : `• Физиотерапия: ${item.rawTitle}.`;
                    });
                    setToastMessage(`Назначен курс: ${item.rawTitle}`);
                  }}
                  sx={{ cursor: 'pointer', fontSize: '0.74rem', bgcolor: '#EFF6FF', borderColor: '#BFDBFE', border: '1px solid' }}
                />
              ))}
            </Box>

            {prescriptions.filter((p) => p.category === 'physio').length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
                  Назначенные физиотерапевтические процедуры:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {prescriptions
                    .filter((p) => p.category === 'physio')
                    .map((p, i) => (
                      <Chip
                        key={i}
                        label={`${p.name || (p as any).title} (${p.price} ₽)`}
                        size="small"
                        color="primary"
                        onDelete={() => {
                          const idx = prescriptions.findIndex((x) => x.id === p.id);
                          if (idx >= 0) handleRemovePrescription(idx);
                        }}
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      />
                    ))}
                </Box>
              </Box>
            )}
          </OrthoSandwichCard>

          {/* 7. ОРТЕЗИРОВАНИЕ (ОРТОПЕДИЧЕСКИЕ ИЗДЕЛИЯ И РАЗГРУЗКА) */}
          <OrthoSandwichCard
            id="domain7_orthotics"
            title="7. Ортопедические изделия и средства разгрузки"
            subtitle="Шарнирные ортезы ($\text{Flex} \le 90^\circ$, $\text{Ext} = 0^\circ$), туторы, режимы осевой нагрузки ($NWB = 0\%$, $TTWB = 5\text{–}10\%$, $PWB = 20\text{–}50\%$, $FWB = 100\%$)"
            icon={<ShieldIcon sx={{ fontSize: 20 }} />}
            accentColor="#7C3AED"
            expanded={Boolean(expandedSections.domain7_orthotics)}
            onToggleExpand={() => handleToggleExpand('domain7_orthotics')}
            isActive={Boolean(activeSections.domain7_orthotics)}
            onToggleActive={(act) => handleToggleActive('domain7_orthotics', act)}
            hasContent={Boolean(prescriptions.some((p) => p.category === 'orthotics') || weightBearingMode !== 'FWB')}
            badge={
              (() => {
                const b = getWeightBearingBadge(weightBearingMode);
                return (
                  <Chip
                    label={b.label}
                    size="small"
                    sx={{ bgcolor: b.bg, color: b.color, fontWeight: 800, fontSize: '0.72rem', border: `1px solid ${b.border}` }}
                  />
                );
              })()
            }
            previewSnippet={
              `${getWeightBearingBadge(weightBearingMode).label} • ${
                prescriptions.some((p) => p.category === 'orthotics')
                  ? prescriptions
                      .filter((p) => p.category === 'orthotics')
                      .map((p) => p.name || (p as any).title)
                      .join(' • ')
                  : 'Без ортеза'
              }`
            }
          >
            {/* Weight Bearing Mode Selector */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.75 }}>
                Режим осевой весовой нагрузки на конечность:
              </Typography>
              <ToggleButtonGroup
                value={weightBearingMode}
                exclusive
                onChange={(_e, val: string | null) => val && setWeightBearingMode(val)}
                size="small"
                fullWidth
              >
                <ToggleButton value="NWB" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>
                  <LatexText text="$\text{NWB} (0\%)$" />
                </ToggleButton>
                <ToggleButton value="TTWB" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>
                  <LatexText text="$\text{TTWB} (5\text{–}10\%)$" />
                </ToggleButton>
                <ToggleButton value="PWB" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>
                  <LatexText text="$\text{PWB} (20\text{–}50\%)$" />
                </ToggleButton>
                <ToggleButton value="WBAT" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>
                  <LatexText text="$\text{WBAT}$ (по боли)" />
                </ToggleButton>
                <ToggleButton value="FWB" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>
                  <LatexText text="$\text{FWB} (100\%)$" />
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                {getWeightBearingBadge(weightBearingMode).fullTitle}
              </Typography>
            </Box>

            {/* Quick Orthotics Prescription Chips */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
              Быстрое назначение ортопедических изделий:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.8, mb: 2, flexWrap: 'wrap' }}>
              {[
                { title: 'Шарнирный ортез с фиксацией ($\\text{Flex} \\le 90^\\circ$, $\\text{Ext} = 0^\\circ$)', rawTitle: 'Шарнирный регулируемый ортез с фиксацией углов', price: 9500 },
                { title: 'Жесткий иммобилизационный тутор ($0^\\circ$)', rawTitle: 'Жесткий иммобилизационный тутор', price: 6800 },
                { title: 'Бандаж сустава неопреновый с ребрами жесткости', rawTitle: 'Бандаж сустава неопреновый с ребрами жесткости', price: 3400 },
                { title: 'Индивидуальные каркасные ортопедические стельки', rawTitle: 'Индивидуальные каркасные ортопедические стельки', price: 5500 },
                { title: 'Локтевые костыли с опорой (разгрузка $100\\%$)', rawTitle: 'Локтевые / подмышечные костыли с опорой', price: 2200 }
              ].map((item, idx) => (
                <Chip
                  key={idx}
                  size="small"
                  label={<LatexText text={`+ ${item.title}`} />}
                  onClick={() => {
                    setPrescriptions((prev) => [
                      ...prev,
                      {
                        id: `orthotics-quick-${Date.now()}-${idx}`,
                        code: '',
                        serviceCode: '',
                        name: item.rawTitle,
                        title: item.rawTitle,
                        category: 'orthotics',
                        quantity: 1,
                        price: item.price,
                        unitPrice: item.price
                      }
                    ]);
                    setRecommendations((prev) => {
                      if (prev.includes(item.rawTitle)) return prev;
                      return prev ? `${prev}\n• Ортезирование: ${item.rawTitle}.` : `• Ортезирование: ${item.rawTitle}.`;
                    });
                    setToastMessage(`Назначено ортопедическое изделие: ${item.rawTitle}`);
                  }}
                  sx={{ cursor: 'pointer', fontSize: '0.74rem', bgcolor: '#F5F3FF', borderColor: '#DDD6FE', border: '1px solid' }}
                />
              ))}
            </Box>

            {prescriptions.filter((p) => p.category === 'orthotics').length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
                  Назначенные изделия и разгрузка:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {prescriptions
                    .filter((p) => p.category === 'orthotics')
                    .map((p, i) => (
                      <Chip
                        key={i}
                        label={`${p.name || (p as any).title} (${p.price} ₽)`}
                        size="small"
                        sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontWeight: 700, fontSize: '0.75rem', border: '1px solid #C4B5FD' }}
                        onDelete={() => {
                          const idx = prescriptions.findIndex((x) => x.id === p.id);
                          if (idx >= 0) handleRemovePrescription(idx);
                        }}
                      />
                    ))}
                </Box>
              </Box>
            )}
          </OrthoSandwichCard>

          {/* 8. ЛЕЧЕБНАЯ ФИЗКУЛЬТУРА (ЛФК) И КИНЕЗИОТЕРАПИЯ */}
          <OrthoSandwichCard
            id="domain8_lfk"
            title="8. Лечебная физкультура (ЛФК) и кинезиотерапия"
            subtitle="Поэтапные комплексы (Фазы I–III), биомеханические цели, мониторинг боли по Silbernagel ($\text{ВАШ} \le 2$, $3 \le \text{ВАШ} \le 5$, $\text{ВАШ} \ge 6$)"
            icon={<DirectionsRunIcon sx={{ fontSize: 20 }} />}
            accentColor="#047857"
            expanded={Boolean(expandedSections.domain8_lfk ?? expandedSections.recommendations)}
            onToggleExpand={() => handleToggleExpand('domain8_lfk')}
            isActive={Boolean(activeSections.domain8_lfk ?? activeSections.recommendations)}
            onToggleActive={(act) => handleToggleActive('domain8_lfk', act)}
            hasContent={Boolean(recommendations.trim() || prescriptions.length > 0)}
            badge={
              (() => {
                const activeList = [1, 2, 3].filter((n) => activeLfkPhases[n]);
                if (activeList.length === 0) {
                  return (
                    <Chip
                      label="ЛФК не назначено"
                      size="small"
                      sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 700, fontSize: '0.72rem', border: '1px solid #CBD5E1' }}
                    />
                  );
                }
                const roman = activeList.map((n) => (n === 1 ? 'I' : n === 2 ? 'II' : 'III')).join(', ');
                return (
                  <Chip
                    label={`Назначено: Фаза ${roman}`}
                    size="small"
                    sx={{ bgcolor: '#ECFDF5', color: '#047857', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #A7F3D0' }}
                  />
                );
              })()
            }
            previewSnippet={`${recommendations.slice(0, 60)}... (${prescriptions.length} назначений всего)`}
          >
            {/* Silbernagel Pain Scale Monitoring Bar */}
            <Box sx={{ p: 1.5, mb: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 0.5 }}>
                Контроль допустимой боли при выполнении ЛФК (Модель Silbernagel Pain-Monitoring):
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ flex: 2, p: 0.6, bgcolor: '#DCFCE7', borderRadius: 1, textAlign: 'center', border: '1px solid #86EFAC' }}>
                  <Typography component="div" sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534' }}>
                    <LatexText text="$\text{ВАШ} \le 2$: Безопасная зона (OK)" />
                  </Typography>
                </Box>
                <Box sx={{ flex: 3, p: 0.6, bgcolor: '#FEF3C7', borderRadius: 1, textAlign: 'center', border: '1px solid #FCD34D' }}>
                  <Typography component="div" sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E' }}>
                    <LatexText text="$3 \le \text{ВАШ} \le 5$: Допустимая нагрузка" />
                  </Typography>
                </Box>
                <Box sx={{ flex: 5, p: 0.6, bgcolor: '#FEE2E2', borderRadius: 1, textAlign: 'center', border: '1px solid #FCA5A5' }}>
                  <Typography component="div" sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#991B1B' }}>
                    <LatexText text="$\text{ВАШ} \ge 6$: Опасная зона (СТОП)" />
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                Боль не должна нарастать на следующее утро или вызывать рефлекторный спазм / отек.
              </Typography>
            </Box>

            {/* Phased Rehab Selection with On/Off Slider Switches */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E293B', display: 'block', mb: 1 }}>
                Поэтапный выбор фаз реабилитации (ползунок «ВКЛ / ВЫКЛ» включает каждую фазу отдельной строкой в Назначенные услуги и Протокол приема):
              </Typography>

              {/* 3-Column Phase Cards with Sliders */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5, mb: 1.5 }}>
                {[1, 2, 3].map((pNum) => {
                  const isChecked = Boolean(activeLfkPhases[pNum]);
                  const isSelected = lfkPhaseTab === pNum;
                  const roman = pNum === 1 ? 'I' : pNum === 2 ? 'II' : 'III';
                  const duration = pNum === 1 ? '$0\\text{–}2$ нед.' : pNum === 2 ? '$2\\text{–}6$ нед.' : '$6+$ нед.';
                  const subTitle = pNum === 1 ? 'Острая / Мобилизация' : pNum === 2 ? 'Баланс и Амплитуда' : 'Сила и Функция';

                  return (
                    <Paper
                      key={pNum}
                      variant="outlined"
                      onClick={() => setLfkPhaseTab(pNum)}
                      sx={{
                        p: 1.25,
                        cursor: 'pointer',
                        borderRadius: 2,
                        transition: 'all 0.2s ease-in-out',
                        bgcolor: isChecked ? '#F0FDF4' : isSelected ? '#F8FAFC' : '#FFFFFF',
                        borderColor: isChecked ? '#86EFAC' : isSelected ? '#047857' : '#E2E8F0',
                        boxShadow: isSelected ? '0 0 0 2px rgba(4, 120, 87, 0.25)' : 'none',
                        '&:hover': {
                          borderColor: isChecked ? '#4ADE80' : '#94A3B8',
                          bgcolor: isChecked ? '#DCFCE7' : '#F1F5F9'
                        }
                      }}
                    >
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: isChecked ? '#166534' : '#1E293B' }}>
                              Фаза {roman}
                            </Typography>
                            <Chip
                              label={<LatexText text={duration} />}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                bgcolor: isChecked ? '#DCFCE7' : '#F1F5F9',
                                color: isChecked ? '#15803D' : '#475569'
                              }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ color: isChecked ? '#15803D' : '#64748B', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>
                            {subTitle}
                          </Typography>
                        </Box>
                        <Chip
                          label={isChecked ? 'В Назначенных' : 'Не назначено'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            bgcolor: isChecked ? '#16A34A' : '#E2E8F0',
                            color: isChecked ? '#FFFFFF' : '#64748B'
                          }}
                        />
                      </Box>

                      {/* On/Off Slider Switch */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 0.6,
                          px: 1,
                          bgcolor: isChecked ? '#DCFCE7' : '#F8FAFC',
                          borderRadius: 1.5,
                          border: `1px solid ${isChecked ? '#BBF7D0' : '#E2E8F0'}`
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem', color: isChecked ? '#166534' : '#64748B' }}>
                          {isChecked ? 'ВКЛЮЧЕНО' : 'ОТКЛЮЧЕНО'}
                        </Typography>
                        <Switch
                          size="small"
                          checked={isChecked}
                          onChange={(e) => handleToggleLfkPhase(pNum, e.target.checked)}
                          color="success"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#16A34A' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#16A34A' }
                          }}
                        />
                      </Box>
                    </Paper>
                  );
                })}
              </Box>

              {/* Detailed Inspector for Selected Phase Tab */}
              {(() => {
                const currentCfg = getLfkPhaseConfig(lfkPhaseTab, templateLfkData);
                const isCurrentActive = Boolean(activeLfkPhases[lfkPhaseTab]);
                const currentRoman = lfkPhaseTab === 1 ? 'I' : lfkPhaseTab === 2 ? 'II' : 'III';

                return (
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: isCurrentActive ? '#F0FDF4' : '#F8FAFC',
                      borderRadius: 2,
                      border: `1.5px solid ${isCurrentActive ? '#86EFAC' : '#CBD5E1'}`,
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {/* Phase Master Toggle Bar */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1.25,
                        pb: 1,
                        borderBottom: `1px solid ${isCurrentActive ? '#BBF7D0' : '#E2E8F0'}`
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isCurrentActive}
                            onChange={(e) => handleToggleLfkPhase(lfkPhaseTab, e.target.checked)}
                            color="success"
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: '#16A34A' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#16A34A' }
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.84rem', color: isCurrentActive ? '#166534' : '#334155' }}>
                              Фаза {currentRoman}: {isCurrentActive ? 'Включена в Назначенные услуги протокола' : 'Не назначена'}
                            </Typography>
                            <Chip
                              label={isCurrentActive ? '✓ Включено отдельной позицией' : 'Нажмите ползунок для включения'}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                bgcolor: isCurrentActive ? '#DCFCE7' : '#E2E8F0',
                                color: isCurrentActive ? '#15803D' : '#64748B'
                              }}
                            />
                          </Box>
                        }
                        sx={{ m: 0 }}
                      />
                    </Box>

                    {/* Biomechanical Goal */}
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 0.3 }}>
                        Биомеханическая цель и параметры нагрузки:
                      </Typography>
                      <Typography component="div" sx={{ fontSize: '0.78rem', color: '#1E293B', lineHeight: 1.45 }}>
                        <LatexText text={currentCfg.goal} />
                      </Typography>
                    </Box>

                    {/* Exercise List */}
                    {currentCfg.exercises && currentCfg.exercises.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 0.5 }}>
                          Упражнения и дозировка комплекса ({currentCfg.exercises.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {currentCfg.exercises.map((exText, eIdx) => (
                            <Box
                              key={eIdx}
                              sx={{
                                p: 0.7,
                                px: 1,
                                bgcolor: isCurrentActive ? '#FFFFFF' : '#F1F5F9',
                                borderRadius: 1,
                                border: `1px solid ${isCurrentActive ? '#BBF7D0' : '#E2E8F0'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.8
                              }}
                            >
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: isCurrentActive ? '#16A34A' : '#94A3B8',
                                  flexShrink: 0
                                }}
                              />
                              <Typography component="div" sx={{ fontSize: '0.76rem', color: '#1E293B', fontWeight: 600 }}>
                                <LatexText text={exText} />
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                );
              })()}
            </Box>

            <TextField
              fullWidth
              size="small"
              label="План рекомендаций, режим и медикаментозное лечение"
              multiline
              minRows={3}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Service selector from servdict for consultations / extra appointments */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <Autocomplete
                size="small"
                sx={{ flex: 1 }}
                options={servicesCatalog}
                getOptionLabel={(s) => `${s.name} (${s.price} ₽)`}
                value={pendingService}
                onChange={(_, val) => setPendingService(val)}
                renderInput={(params) => <TextField {...params} placeholder="Добавить услугу клиники / консультацию..." />}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddService}
                disabled={!pendingService}
                sx={{ bgcolor: '#0284C7', fontWeight: 700 }}
              >
                Добавить
              </Button>
            </Box>

            {/* Prescribed Services Table */}
            {prescriptions.length > 0 && (
              <TableContainer component={Paper} variant="outlined" sx={{ borderColor: '#E2E8F0' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Все назначения приема</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Категория</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Кол-во</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Стоимость</TableCell>
                      <TableCell align="center" sx={{ width: 40 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prescriptions.map((p, idx) => {
                      const isLfk = p.category === 'lfk' || p.category === 'ЛФК';
                      const itemPrice = Number(p.price ?? (p as any).unitPrice ?? (p as any).unit_price ?? 0);
                      const itemQty = Number(p.quantity || 1);
                      return (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              {isLfk && (
                                <Chip
                                  label="ЛФК"
                                  size="small"
                                  sx={{ fontSize: '0.65rem', height: 18, bgcolor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 800 }}
                                />
                              )}
                              <span>{p.name || (p as any).title}</span>
                            </Box>
                            {p.dosage_notes && (
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.2 }}>
                                <LatexText text={p.dosage_notes} />
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={isLfk ? 'ЛФК' : (p.category || 'услуга')}
                              size="small"
                              sx={{
                                fontSize: '0.68rem',
                                height: 18,
                                fontWeight: 700,
                                bgcolor: isLfk ? '#DCFCE7' : undefined,
                                color: isLfk ? '#15803D' : undefined
                              }}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.82rem' }}>{itemQty}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                            {itemPrice === 0 && isLfk ? (
                              <Box component="span" sx={{ color: '#047857', fontWeight: 700, fontSize: '0.75rem' }}>
                                Включено в план
                              </Box>
                            ) : (
                              `${(itemPrice * itemQty).toLocaleString('ru-RU')} ₽`
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="error" onClick={() => handleRemovePrescription(idx)}>
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {prescriptions.length > 0 && (
              <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AssignmentIcon />}
                  onClick={() => setIssueReferralModalOpen(true)}
                  disabled={!contextData?.patient?.id}
                  sx={{
                    borderColor: '#0F3C64',
                    color: '#0F3C64',
                    fontWeight: 800,
                    textTransform: 'none',
                    bgcolor: '#F8FAFC',
                    '&:hover': { bgcolor: '#F0F9FF', borderColor: '#0284C7' }
                  }}
                >
                  Выписать официальное направление на бланке Центра (90 дней)
                </Button>
              </Box>
            )}
          </OrthoSandwichCard>
        </Box>

        {/* RIGHT COLUMN: PREVIEW & MEDIA HUB TABS (45% Width) */}
        <Box sx={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
          {/* TAB HEADER */}
          <Paper elevation={0} sx={{ borderBottom: '1px solid #E2E8F0' }}>
            <Tabs
              value={rightPanelTab}
              onChange={(_, val) => setRightPanelTab(val)}
              sx={{ minHeight: 44, '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 700 } }}
            >
              <Tab icon={<ArticleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Протокол & Экспорт" />
              <Tab
                icon={<PhotoCameraIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Медиатека (${mediaList.length})`}
              />
              <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Динамика ROM" />
            </Tabs>
          </Paper>

          {/* TAB 0: MULTI-FORMAT PROTOCOL PREVIEW */}
          {rightPanelTab === 0 && (
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <OrthoProtocolPreview
                data={assembledProtocolData}
                onSign={() => handleSaveProtocol('signed')}
                onTransferToCashier={handleTransferToCashier}
                isSubmitting={saving}
              />
            </Box>
          )}

          {/* TAB 1: PATIENT MEDIA HUB (LIGHTBOX, UPLOAD, DICOM/X-RAY) */}
          {rightPanelTab === 1 && (
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              <PatientMediaHub
                patientId={contextData?.patient?.id || 1}
                protocolId={protocolId}
                selectedJoint={selectedJoint}
                mediaList={mediaList}
                onRefreshMedia={fetchContext}
              />
            </Box>
          )}

          {/* TAB 2: BIOMECHANICS & ROM HISTORY */}
          {rightPanelTab === 2 && (
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon /> Динамика углов амплитуды (ROM) и боли (ВАШ)
              </Typography>

              {biomechanicsHistory.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ borderColor: '#E2E8F0' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Дата</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Сустав</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Сгибание (акт/пас)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Дефицит разг.</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>ВАШ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {biomechanicsHistory.map((b, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{b.recorded_date}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{b.joint_name} ({b.side})</TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
                            {b.flexion_active || 140}° / {b.flexion_passive || 140}°
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.8rem', color: b.extension_deficit > 0 ? '#B91C1C' : '#334155' }}>
                            {b.extension_deficit || 0}°
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            {b.vas_score}/10
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  История биомеханических измерений для данного пациента пока отсутствует. Первые данные будут сохранены при подписании протокола.
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* SNACKBAR NOTIFICATIONS */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />

      {/* 1. PATIENT SELECTION DIALOG */}
      <Dialog
        open={patientDialogOpen}
        onClose={() => setPatientDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonSearchIcon /> Выбор пациента для приема
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
            Найдите пациента по ФИО, номеру карты или телефону, чтобы загрузить его историю и привязать новый протокол:
          </Typography>

          <Autocomplete
            fullWidth
            options={patientSearchOptions}
            loading={patientSearchLoading}
            getOptionLabel={(p) => (typeof p === 'string' ? p : `${p.full_name || ''} ${p.bdate ? `(${p.bdate})` : ''} ${p.mednum ? `[№ карты: ${p.mednum}]` : ''}`)}
            onInputChange={(_, val) => handleSearchPatients(val)}
            onChange={(_, selectedPatient) => {
              if (selectedPatient?.id) {
                resetAllCardsState();
                setPatientDialogOpen(false);
                setToastMessage(`Пациент ${selectedPatient.full_name || ''} выбран!`);
                navigate(`/ortho-workstation?patientId=${selectedPatient.id}`);
              }
            }}
            noOptionsText="Введите минимум 2 буквы для поиска"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Поиск пациента (ФИО / № карты / телефон)"
                autoFocus
                placeholder="Например: Иванов..."
                slotProps={{
                  ...params.slotProps,
                  input: {
                    ...params.slotProps?.input,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                        {params.slotProps?.input?.startAdornment}
                      </>
                    )
                  }
                }}
              />
            )}
          />

          {contextData?.patient?.id && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Текущий активный пациент: <b>{patient.full_name}</b> (№ карты {patient.mednum || 'б/н'}). При выборе нового пациента текущие несохраненные данные будут сброшены.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPatientDialogOpen(false)} sx={{ fontWeight: 700 }}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. TWO-LEVEL CLINICAL PROTOCOL SELECTION DIALOG (CLUSTER -> PROTOCOL) */}
      <Dialog
        open={protocolDialogOpen}
        onClose={() => setProtocolDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LayersIcon color="primary" /> Справочник клинических протоколов 2.0
          </Box>
          <Chip
            label={`Найдено: ${filteredTemplates.length} из ${templates.length}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {/* LEVEL 1: CLUSTER SELECTOR PILLS & CUSTOM FILTER */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Уровень 1: Выберите анатомический или нозологический кластер
            </Typography>
            <Chip
              icon={<StarIcon sx={{ fontSize: '14px !important', color: filterOnlyCustom ? '#FFF !important' : '#D97706 !important' }} />}
              label="⭐ Только кастомизированные"
              clickable
              onClick={() => setFilterOnlyCustom(prev => !prev)}
              sx={{
                fontWeight: 800,
                fontSize: '0.74rem',
                bgcolor: filterOnlyCustom ? '#D97706' : '#FEF3C7',
                color: filterOnlyCustom ? '#FFFFFF' : '#92400E',
                border: '1px solid #F59E0B',
                cursor: 'pointer',
                '&:hover': { bgcolor: filterOnlyCustom ? '#B45309' : '#FDE68A' }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 0.65, flexWrap: 'wrap', mb: 2.5 }}>
            {MASTER_CLUSTERS.map((cl) => {
              const isSelected = selectedClusterId === cl.id;
              const count = clusterCounts[cl.id] || (cl.id === 'all' ? 180 : 0);
              return (
                <Chip
                  key={cl.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      {cl.id !== 'all' && (
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: isSelected ? '#FFFFFF' : cl.badge_color, flexShrink: 0 }} />
                      )}
                      <span>{cl.name_ru}</span>
                      <span
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.06)',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          padding: '0 5px',
                          borderRadius: 8,
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          lineHeight: '15px',
                          height: 15,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        {count}
                      </span>
                    </Box>
                  }
                  size="small"
                  onClick={() => setSelectedClusterId(cl.id)}
                  sx={{
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '0.74rem',
                    height: 28,
                    bgcolor: isSelected ? cl.badge_color : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#334155',
                    border: `1px solid ${isSelected ? cl.badge_color : '#CBD5E1'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': {
                      bgcolor: isSelected ? cl.badge_color : '#E2E8F0',
                      borderColor: isSelected ? cl.badge_color : '#94A3B8'
                    }
                  }}
                />
              );
            })}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* LEVEL 2: SEARCH & PROTOCOL CARDS */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Уровень 2: Нозологии и клинические протоколы ({filteredTemplates.length})
            </Typography>
            <TextField
              size="small"
              placeholder="Поиск по диагнозу, МКБ-10, тегам, автору..."
              value={protocolSearchQuery}
              onChange={(e) => setProtocolSearchQuery(e.target.value)}
              sx={{ width: 340 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Box>

          <Box sx={{ maxHeight: 380, overflowY: 'auto', pr: 0.5 }}>
            {filteredTemplates.length > 0 ? (
              <Grid container spacing={1.5}>
                {filteredTemplates.map((tmpl) => {
                  const effectiveMkb = tmpl.default_mkb_code || tmpl.mkb_code || '—';
                  const isCurrent = currentSelectedTemplate?.title === tmpl.title;
                  const { isCustom, author: customAuthor, clusterId } = getTemplateCustomInfo(tmpl);
                  const clusterObj = MASTER_CLUSTERS.find(c => c.id === (tmpl.cluster_id || clusterId));
                  const severity = tmpl.stage_or_severity || '';

                  const testsCount = Number(tmpl.tests_count || 0);
                  const diagsCount = Number(tmpl.diagnostics_count || 0);
                  const manCount = Number(tmpl.manipulations_count || 0);
                  const physCount = Number(tmpl.physiotherapy_count || 0);
                  const orthCount = Number(tmpl.orthotics_count || 0);
                  const lfkCount = Number(tmpl.lfk_count || 0);
                  const totalTreatments = manCount + physCount + orthCount;

                  const previewText = [
                    tmpl.complaints_template ? `Жалобы: ${tmpl.complaints_template.slice(0, 120)}...` : '',
                    tmpl.recommendations_template ? `Рекомендации: ${tmpl.recommendations_template.slice(0, 120)}...` : ''
                  ].filter(Boolean).join('\n\n');

                  return (
                    <Grid size={{ xs: 12, sm: 6 }} key={tmpl.id || tmpl.rawId || tmpl.title}>
                      <Tooltip
                        title={
                          previewText ? (
                            <Box sx={{ p: 0.5, maxWidth: 320 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#BAE6FD', mb: 0.5 }}>
                                {tmpl.title}
                              </Typography>
                              <Typography sx={{ fontSize: '0.72rem', color: '#E2E8F0', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                                {previewText}
                              </Typography>
                            </Box>
                          ) : ''
                        }
                        arrow
                        enterDelay={600}
                        placement="top"
                      >
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            borderColor: isCurrent ? '#0284C7' : isCustom ? '#FCD34D' : '#E2E8F0',
                            bgcolor: isCurrent ? '#F0F9FF' : isCustom ? '#FFFDF5' : '#FFFFFF',
                            transition: 'all 0.15s ease-in-out',
                            '&:hover': {
                              borderColor: isCustom ? '#F59E0B' : '#0284C7',
                              boxShadow: isCustom ? '0 4px 12px rgba(245,158,11,0.12)' : '0 4px 12px rgba(2,132,199,0.1)'
                            }
                          }}
                        >
                          <CardActionArea onClick={() => handleApplyTemplate(tmpl)} sx={{ p: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64', lineHeight: 1.3 }}>
                                {tmpl.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                {isCustom && (
                                  <Chip
                                    key="chip-custom-author"
                                    icon={<StarIcon sx={{ fontSize: '11px !important', color: '#B45309 !important' }} />}
                                    label="Авторский"
                                    size="small"
                                    sx={{
                                      bgcolor: '#FEF3C7',
                                      color: '#92400E',
                                      fontWeight: 800,
                                      fontSize: '0.68rem',
                                      height: 20,
                                      border: '1px solid #FCD34D'
                                    }}
                                  />
                                )}
                                <Chip
                                  key="chip-mkb"
                                  label={effectiveMkb}
                                  size="small"
                                  sx={{
                                    fontWeight: 800,
                                    fontSize: '0.72rem',
                                    bgcolor: '#E0F2FE',
                                    color: '#0369A1',
                                    height: 20
                                  }}
                                />
                              </Box>
                            </Box>

                            {/* Cluster and Severity Badges */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.75 }}>
                              {clusterObj && clusterObj.id !== 'all' && (
                                <Chip
                                  label={clusterObj.name_ru}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.64rem',
                                    fontWeight: 700,
                                    bgcolor: `${clusterObj.badge_color}14`,
                                    color: clusterObj.badge_color,
                                    border: `1px solid ${clusterObj.badge_color}33`
                                  }}
                                />
                              )}
                              {severity && (
                                <Chip
                                  label={severity}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.64rem',
                                    fontWeight: 700,
                                    bgcolor: '#F1F5F9',
                                    color: '#475569'
                                  }}
                                />
                              )}
                            </Box>

                            {/* Clinical Domain Inclusion Indicators */}
                            {(testsCount > 0 || diagsCount > 0 || totalTreatments > 0 || lfkCount > 0) && (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mb: 1 }}>
                                {testsCount > 0 && (
                                  <Box component="span" sx={{ fontSize: '0.66rem', fontWeight: 700, bgcolor: '#ECFDF5', color: '#047857', px: 0.6, py: 0.1, borderRadius: 1, border: '1px solid #A7F3D0' }}>
                                    Тесты: {testsCount}
                                  </Box>
                                )}
                                {diagsCount > 0 && (
                                  <Box component="span" sx={{ fontSize: '0.66rem', fontWeight: 700, bgcolor: '#EFF6FF', color: '#1D4ED8', px: 0.6, py: 0.1, borderRadius: 1, border: '1px solid #BFDBFE' }}>
                                    Диагн: {diagsCount}
                                  </Box>
                                )}
                                {totalTreatments > 0 && (
                                  <Box component="span" sx={{ fontSize: '0.66rem', fontWeight: 700, bgcolor: '#F0FDFA', color: '#0F766E', px: 0.6, py: 0.1, borderRadius: 1, border: '1px solid #99F6E4' }}>
                                    Назнач: {totalTreatments}
                                  </Box>
                                )}
                                {lfkCount > 0 && (
                                  <Box component="span" sx={{ fontSize: '0.66rem', fontWeight: 700, bgcolor: '#FEF3C7', color: '#B45309', px: 0.6, py: 0.1, borderRadius: 1, border: '1px solid #FDE68A' }}>
                                    ЛФК: {lfkCount}
                                  </Box>
                                )}
                              </Box>
                            )}

                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: isCustom && customAuthor ? 0.3 : 1 }}>
                              Локализация: <b>{tmpl.joint_name || 'Опорно-двигательный аппарат'}</b>
                            </Typography>
                            {isCustom && customAuthor && (
                              <Typography key="custom-author-label" variant="caption" sx={{ color: '#B45309', display: 'block', mb: 1, fontSize: '0.72rem', fontWeight: 600 }}>
                                ⭐ Автор: {customAuthor}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Button
                                size="small"
                                variant={isCurrent ? 'contained' : 'outlined'}
                                color={isCustom ? 'secondary' : 'primary'}
                                sx={{ fontSize: '0.72rem', fontWeight: 700, py: 0.2, textTransform: 'none' }}
                              >
                                {isCurrent ? '✓ Применён' : 'Применить в прием'}
                              </Button>
                            </Box>
                          </CardActionArea>
                        </Card>
                      </Tooltip>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                  {filterOnlyCustom
                    ? 'В данном кластере нет кастомизированных шаблонов. Вы можете сохранить текущий прием нажав «⭐ В шаблон» в панели управления.'
                    : 'В данном кластере нет протоколов, соответствующих запросу. Попробуйте выбрать «Все кластеры» или очистить поиск.'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, justifyContent: 'space-between' }}>
          <Button
            startIcon={<ScienceIcon />}
            onClick={() => {
              setProtocolDialogOpen(false);
              navigate('/ortho-templates-manager');
            }}
            sx={{ fontWeight: 700, color: '#64748B', textTransform: 'none' }}
          >
            Управление шаблонами 2.0
          </Button>
          <Button variant="outlined" onClick={() => setProtocolDialogOpen(false)} sx={{ fontWeight: 700 }}>
            Отмена
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3. SAVE CUSTOMIZED TEMPLATE TO CLUSTER DIALOG */}
      <Dialog
        open={saveCustomDialogOpen}
        onClose={() => !savingCustomTpl && setSaveCustomDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon sx={{ color: '#F59E0B' }} /> Сохранить в Кластер как кастомизированный шаблон
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Шаблон будет сохранен в выбранный кластер со специальным признаком <b>«Кастомизированный шаблон»</b> (⭐ Авторский) и станет доступен в поиске для всех повторных приемов.
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Наименование шаблона (переименовать)"
              value={customTplTitle}
              onChange={(e) => setCustomTplTitle(e.target.value)}
              fullWidth
              size="small"
              required
              helperText="Введите понятное клиническое название для быстрого поиска"
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField
                  select
                  label="Целевой кластер"
                  value={customTplClusterId}
                  onChange={(e) => setCustomTplClusterId(e.target.value)}
                  fullWidth
                  size="small"
                  slotProps={{ select: { native: true } }}
                >
                  {MASTER_CLUSTERS.filter(c => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_ru}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  label="Код МКБ-10"
                  value={customTplMkbCode}
                  onChange={(e) => setCustomTplMkbCode(e.target.value.toUpperCase())}
                  fullWidth
                  size="small"
                  placeholder="напр. M17.1"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Категория"
                  value={customTplCategory}
                  onChange={(e) => setCustomTplCategory(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Автор протокола"
                  value={customTplDoctorName}
                  onChange={(e) => setCustomTplDoctorName(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            <TextField
              label="Клинические теги для поиска (через запятую)"
              value={customTplTags}
              onChange={(e) => setCustomTplTags(e.target.value)}
              fullWidth
              size="small"
              helperText="По этим тегам шаблон можно будет мгновенно найти в поиске (custom, авторский, блокада, prp...)"
            />

            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
                В шаблон будут включены заполненные данные текущего осмотра:
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                <Chip key="chip-s-complaints" size="small" label={`Жалобы: ${complaints ? '✓ Заполнено' : '—'}`} color={complaints ? 'primary' : 'default'} variant="outlined" />
                <Chip key="chip-s-anamnesis" size="small" label={`Анамнез: ${anamnesis ? '✓ Заполнено' : '—'}`} color={anamnesis ? 'primary' : 'default'} variant="outlined" />
                <Chip key="chip-s-objective" size="small" label={`Объективный статус: ${objectiveStatus ? '✓ Заполнено' : '—'}`} color={objectiveStatus ? 'primary' : 'default'} variant="outlined" />
                <Chip key="chip-s-studies" size="small" label={`Спец. методы: ${specialStudies ? '✓ Заполнено' : '—'}`} color={specialStudies ? 'primary' : 'default'} variant="outlined" />
                <Chip key="chip-s-manip" size="small" label={`Манипуляции: ${performedManipulations ? '✓ Заполнено' : '—'}`} color={performedManipulations ? 'primary' : 'default'} variant="outlined" />
                <Chip key="chip-s-recs" size="small" label={`Рекомендации: ${recommendations ? '✓ Заполнено' : '—'}`} color={recommendations ? 'primary' : 'default'} variant="outlined" />
                <Chip key="chip-s-tests" size="small" label={`Тесты: ${Object.keys(currentJointState.tests || {}).length}`} color="secondary" variant="outlined" />
                <Chip key="chip-s-diag" size="small" label={`Диагностика: ${activeTemplateDiagnostics?.length || 0}`} color="secondary" variant="outlined" />
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={() => setSaveCustomDialogOpen(false)} disabled={savingCustomTpl}>
            Отмена
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={savingCustomTpl ? <CircularProgress size={16} color="inherit" /> : <StarIcon />}
            onClick={handleSaveCustomTemplate}
            disabled={savingCustomTpl || !customTplTitle.trim()}
            sx={{ fontWeight: 800, bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' } }}
          >
            {savingCustomTpl ? 'Сохранение...' : 'Сохранить в Кластер'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 4. ISSUE PATIENT REFERRAL MODAL */}
      <IssueReferralModal
        open={issueReferralModalOpen}
        onClose={() => setIssueReferralModalOpen(false)}
        patient={
          contextData?.patient
            ? {
                id: contextData.patient.id,
                fullName:
                  contextData.patient.full_name ||
                  [contextData.patient.surname, contextData.patient.name, contextData.patient.patron].filter(Boolean).join(' ') ||
                  'Пациент',
                birthDate: contextData.patient.bdate,
                phone: contextData.patient.sphone || contextData.patient.phone,
                cardNum: contextData.patient.mednum,
                gender: contextData.patient.sex === 1 ? 'М' : contextData.patient.sex === 2 ? 'Ж' : ''
              }
            : null
        }
        protocolId={protocolId}
        appointmentId={appointmentId}
        doctorName="Добрушкин А.М"
        defaultMkbCode={selectedMkb?.code || ''}
        defaultDiagnosis={clinicalDiagnosis || selectedMkb?.name || ''}
        targetJoint={selectedJoint ? selectedJoint.replace('_r', ' (правый)').replace('_l', ' (левый)') : ''}
        targetSide={selectedJoint?.includes('_r') ? 'Правая' : selectedJoint?.includes('_l') ? 'Левая' : ''}
        anamnesisSummary={complaints || anamnesis}
        availablePrescriptions={prescriptions}
        activeDiagnostics={activeTemplateDiagnostics}
        onReferralIssued={(ref) => {
          setToastMessage(`Направление ${ref.referral_number} успешно выписано на бланке Центра`);
        }}
      />
    </Box>
  );
}
