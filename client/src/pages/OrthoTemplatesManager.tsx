import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CloneIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Biotech as BiotechIcon,
  LocalHospital as HospitalIcon,
  Visibility as PreviewIcon,
  Healing as HealingIcon,
  Straighten as RomIcon,
  Psychology as BrainIcon,
  Article as ArticleIcon,
  MenuBook as ManualIcon,
  Layers as LayersIcon,
  Clear as ClearIcon,
  Star as StarIcon,
  FilterList as FilterListIcon,
  FitnessCenter as FitnessIcon,
  Shield as ShieldIcon,
  MedicalServices as MedicalServicesIcon,
  Print as PrintIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningAmberIcon,
  Block as BlockIcon,
  Bolt as BoltIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useNavigate } from 'react-router-dom';
import DiagnosticMethodsCatalogManager from '../components/ortho/DiagnosticMethodsCatalogManager';
import OrthopedicTestsCatalogManager from '../components/ortho/OrthopedicTestsCatalogManager';
import DiagnosticMethodGuidanceModal from '../components/ortho/DiagnosticMethodGuidanceModal';
import TreatmentGuidanceModal from '../components/ortho/TreatmentGuidanceModal';
import type { TreatmentItem, TreatmentCategory } from '../components/ortho/TreatmentGuidanceModal';
import LatexText, { cleanLatexText } from '../components/ortho/LatexText';

export interface TreatmentCatalogItem {
  code: string;
  name: string;
  category: TreatmentCategory;
  subcategory?: string;
  target_joint: string;
  service_scope: 'internal' | 'external';
  priority_level: string;
  dosage_or_regimen?: string;
  regimen_standard?: string;
  description?: string;
  technique_details?: string;
  patient_preparation?: string;
  post_procedure_care?: string;
  clinical_indications?: string;
  contraindications?: string;
  servdict_id?: number | null;
  servdict_code?: string | null;
  servdict_price?: number | null;
  servdict_name?: string | null;
  modality_tag?: string;
  evidence_level?: string;
  apparatus_examples?: string;
  biophysical_profile?: string;
  cdss_contraindication_tags?: string;
}

export interface TemplateTreatmentRelItem {
  id?: number;
  item_code: string;
  category: TreatmentCategory;
  priority_level: string;
  service_scope: 'internal' | 'external';
  dosage_or_regimen?: string;
  regimen_standard?: string;
  sort_order: number;
  name?: string;
  subcategory?: string;
  target_joint?: string;
  description?: string;
  technique_details?: string;
  patient_preparation?: string;
  post_procedure_care?: string;
  clinical_indications?: string;
  contraindications?: string;
  servdict_id?: number | null;
  servdict_code?: string | null;
  servdict_price?: number | null;
  servdict_name?: string | null;
  ebm_priority?: 'P1' | 'P2' | 'P3' | 'P0-STOP' | 'STOP' | string;
  line_order?: number;
  target_anatomical_landmark?: string | null;
  exact_dosimetry?: string | null;
  navigation_type?: 'us_guided' | 'c_arm' | 'landmark' | 'none' | string;
  anatomical_access?: string | null;
  drug_class?: string | null;
  is_stop_warning?: number | boolean;
  stop_rationale?: string | null;
  weight_bearing_mode?: 'NWB' | 'TTWB' | 'PWB' | 'WBAT' | 'FWB' | 'N/A' | string;
  device_type_iso?: string | null;
  hinge_settings?: string | null;
  wearing_regimen?: string | null;
  modality_tag?: string;
  evidence_level?: string;
  apparatus_examples?: string;
  biophysical_profile?: string;
  cdss_contraindication_tags?: string;
}

interface OrthoTestCatalogItem {
  code: string;
  name_ru: string;
  name_lat: string;
  joint_category: string;
  target_structure: string;
  methodology: string;
  positive_criteria: string;
  sensitivity_specificity?: string;
  icon_type?: string;
}

interface DiagnosticMethodCatalogItem {
  code: string;
  name: string;
  modality: string;
  target_joint: string;
  servdict_id?: number | null;
  clinical_indications?: string;
  protocol_phrase: string;
  priority_level: string;
  servdict_price?: number | null;
  servdict_name?: string | null;
  description?: string | null;
  technique_details?: string | null;
  patient_preparation?: string | null;
  diagnostic_criteria?: string | null;
  contraindications?: string | null;
}

interface TemplateTestItem {
  id?: number;
  test_code: string;
  expected_result: string;
  is_mandatory: number;
  sort_order: number;
  priority_level?: string;
  test_type_tag?: string;
  test_type?: string;
  is_supplemented?: number | boolean;
  name_ru?: string;
  name_lat?: string;
  target_structure?: string;
  methodology?: string;
  positive_criteria?: string;
  sensitivity_specificity?: string;
  sensitivity_pct?: number;
  specificity_pct?: number;
  evidence_level?: string;
}

interface TemplateDiagnosticItem {
  id?: number;
  diagnostic_code: string;
  urgency: string;
  default_side: string;
  is_primary: number;
  sort_order: number;
  priority_level?: string;
  name?: string;
  modality?: string;
  target_joint?: string;
  servdict_price?: number | null;
  protocol_phrase?: string;
  clinical_indications?: string | null;
  description?: string | null;
  technique_details?: string | null;
  patient_preparation?: string | null;
  diagnostic_criteria?: string | null;
  contraindications?: string | null;
}

interface PrescriptionItem {
  category: string;
  title: string;
  unit_price: number;
  quantity: number;
  service_id?: number;
}

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

const TEST_TYPE_LABELS: Record<string, { label: string; short: string; color: string; bg: string }> = {
  provocative: { label: 'Провокационный (боль/стресс)', short: 'Провокац.', color: '#DC2626', bg: '#FEF2F2' },
  relocation: { label: 'Релокационный / вправление', short: 'Релокац.', color: '#2563EB', bg: '#EFF6FF' },
  neurodynamic: { label: 'Нейродинамический (натяжение)', short: 'Нейродин.', color: '#D97706', bg: '#FFFBEB' },
  multifactor_cluster: { label: 'Многофакторный кластер', short: 'Кластер', color: '#7C3AED', bg: '#F5F3FF' }
};

const DIAG_MODALITIES_MAP: Record<string, { label: string; short: string; color: string; bg: string }> = {
  all: { label: 'Все модальности', short: 'Все модальности', color: '#0F3C64', bg: '#F1F5F9' },
  xray: { label: 'Рентгенография (X-Ray)', short: 'Рентген', color: '#0284C7', bg: '#F0F9FF' },
  mri: { label: 'МРТ томография', short: 'МРТ', color: '#7C3AED', bg: '#F5F3FF' },
  ultrasound: { label: 'УЗИ / Сонография', short: 'УЗИ', color: '#059669', bg: '#ECFDF5' },
  ct: { label: 'КТ / МСКТ томография', short: 'КТ', color: '#D97706', bg: '#FFFBEB' },
  lab: { label: 'Лабораторные анализы', short: 'Лаборатория', color: '#DC2626', bg: '#FEF2F2' },
  enmg: { label: 'ЭНМГ / Нейромиография', short: 'ЭНМГ', color: '#4B5563', bg: '#F3F4F6' },
  bone_scan: { label: 'Денситометрия (DEXA)', short: 'DEXA', color: '#4F46E5', bg: '#EEF2FF' },
  plantography: { label: 'Подометрия / Плантография', short: 'Подометрия', color: '#0891B2', bg: '#ECFEFF' },
  functional: { label: 'Функциональные пробы', short: 'Функц. пробы', color: '#0D9488', bg: '#F0FDFA' },
  arthroscopy: { label: 'Артроскопия (диагн.)', short: 'Артроскопия', color: '#9333EA', bg: '#FAF5FF' }
};

const TEST_PRIORITY_TIERS = [
  { key: 'high', label: 'Tier 1: Высокий (Обязательный скрининг)', short: 'Tier 1: Скрининг', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
  { key: 'medium', label: 'Tier 2: Средний (Верификация диагноза)', short: 'Tier 2: Верификация', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' },
  { key: 'low', label: 'Tier 3: Низкий (Экспертный / дифференциальный)', short: 'Tier 3: Экспертный', color: '#2563EB', bg: '#EFF6FF', border: '#93C5FD' }
];

const DIAG_PRIORITY_TIERS = [
  { key: 'high', label: 'Tier 1: Высокий (Базовый стандарт / Первая линия)', short: 'Tier 1: Базовый', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
  { key: 'medium', label: 'Tier 2: Средний (Верификация / Вторая линия)', short: 'Tier 2: Верификация', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' },
  { key: 'low', label: 'Tier 3: Низкий (Экспертный / Предоперационный)', short: 'Tier 3: Экспертный', color: '#2563EB', bg: '#EFF6FF', border: '#93C5FD' }
];

export interface RomAxisDef {
  key: string;
  labelRu: string;
  labelLat: string;
  normMin: number;
  normMax: number;
  unit: string;
  normText: string;
  isDeficit?: boolean;
  clinicalNote?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P0-STOP' | string;
  cutoff_condition?: string;
}

export const END_FEEL_OPTIONS = [
  { code: 'EF_BONY', label: 'Костный', sub: 'Hard bony', icon: '🦴', color: '#475569', desc: 'Твердый упор («кость о кость»). Остеофиты артроза, анкилоз.' },
  { code: 'EF_CAPS', label: 'Капсульный', sub: 'Firm leathery', icon: '🛡️', color: '#D97706', desc: 'Плотное капсулярное натяжение. Адгезивный капсулит, фиброз, артроз.' },
  { code: 'EF_SPRING', label: 'Пружинящий', sub: 'Springy rebound', icon: '🌀', color: '#EA580C', desc: 'Упругий блок. Блокада мениска («ручка лейки»), свободное тело, Кёниг.' },
  { code: 'EF_SPASM', label: 'Мышечный дефанс', sub: 'Muscle spasm', icon: '⚡', color: '#DC2626', desc: 'Рефлекторная остановка движения спазмированными мышцами от острой боли.' },
  { code: 'EF_EMPTY', label: '«Пустой» упор', sub: 'Empty pain', icon: '⚠️', color: '#9333EA', desc: 'Движение прервано пациентом из-за резкой боли до достижения упора.' },
  { code: 'EF_MUSHI', label: 'Ватный упор', sub: 'Soft / Mushy', icon: '🌊', color: '#0284C7', desc: 'Отсутствие конечной точки упора при стресс-пробе. Полный разрыв связок.' }
];

export function getRomPriorityBadge(priority?: string): { label: string; bg: string; color: string; border: string } {
  switch (priority) {
    case 'P0-STOP':
      return { label: '🚨 P0-STOP Ограничение', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' };
    case 'P1':
      return { label: '⭐ P1 Критический', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' };
    case 'P3':
      return { label: '🔍 P3 Дифференциал', bg: '#F0FDFA', color: '#0D9488', border: '#99F6E4' };
    default:
      return { label: '🎯 P2 Функция', bg: '#F0F9FF', color: '#0284C7', border: '#BAE6FD' };
  }
}

export function getManipPriorityBadge(priority?: string): { label: string; bg: string; color: string; border: string; icon: string } {
  switch (priority) {
    case 'P0-STOP':
      return { label: 'P0-STOP ЗАПРЕТ МИС', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', icon: '🚨' };
    case 'P1':
      return { label: 'P1 ЗОЛОТОЙ СТАНДАРТ / УРГЕНТНАЯ', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', icon: '⭐' };
    case 'P3':
      return { label: 'P3 АДЪЮВАНТНЫЕ ПОСОБИЯ / ПИР', bg: '#F0FDFA', color: '#0D9488', border: '#99F6E4', icon: '🔍' };
    default:
      return { label: 'P2 ТАРГЕТНАЯ ИНТЕРВЕНЦИЯ / ОРТОБИОЛОГИЯ', bg: '#F0F9FF', color: '#0284C7', border: '#BAE6FD', icon: '🎯' };
  }
}

export function getOrthoticsPriorityBadge(priority?: string): { label: string; bg: string; color: string; border: string; icon: string } {
  switch (priority) {
    case 'P0-STOP':
    case 'P0-CONTRA':
      return { label: 'P0-STOP КАТЕГОРИЧЕСКИЙ ЗАПРЕТ', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', icon: '🚨' };
    case 'P1':
      return { label: 'P1 СТРУКТУРНО-СПАСАЮЩАЯ / ОБЯЗАТЕЛЬНАЯ', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', icon: '⭐' };
    case 'P3':
      return { label: 'P3 АДАПТИВНО-ПРОФИЛАКТИЧЕСКАЯ', bg: '#F0FDFA', color: '#0D9488', border: '#99F6E4', icon: '🔍' };
    default:
      return { label: 'P2 ФУНКЦИОНАЛЬНОЕ ОРТЕЗИРОВАНИЕ', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', icon: '🛡️' };
  }
}

export function getWeightBearingBadge(mode?: string): { label: string; fullTitle: string; bg: string; color: string; border: string; icon: string } {
  switch (mode) {
    case 'NWB':
      return { label: 'NWB (0% массы)', fullTitle: 'Non-Weight Bearing: Строгая разгрузка без опоры (0%)', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', icon: '🚫' };
    case 'TTWB':
      return { label: 'TTWB (5–10% массы)', fullTitle: 'Toe-Touch Weight Bearing: Касание носком для баланса (5-10%)', bg: '#FFF7ED', color: '#EA580C', border: '#FDBA74', icon: '🦶' };
    case 'PWB':
      return { label: 'PWB (20–50% массы)', fullTitle: 'Partial Weight Bearing: Частичная опора на костылях (20-50%)', bg: '#FEF9C3', color: '#CA8A04', border: '#FDE047', icon: '⚖️' };
    case 'WBAT':
      return { label: 'WBAT (по переносимости)', fullTitle: 'Weight Bearing As Tolerated: Опора по переносимости боли', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', icon: '🚶' };
    case 'FWB':
      return { label: 'FWB (100% полная опора)', fullTitle: 'Full Weight Bearing: Полная свободная опора (100%)', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', icon: '✅' };
    default:
      return { label: 'N/A (верхняя кон./позвоночник)', fullTitle: 'Осевая нагрузка не лимитирована или не применима', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', icon: 'ℹ️' };
  }
}

export interface JointRomConfig {
  category: string;
  titleRu: string;
  titleLat: string;
  iconColor: string;
  axes: RomAxisDef[];
  defaultNorm: Record<string, any>;
  defaultMild: Record<string, any>;
  defaultSevere: Record<string, any>;
}

export const ROM_CONFIGS: Record<string, JointRomConfig> = {
  knee: {
    category: 'knee',
    titleRu: 'Коленный сустав',
    titleLat: 'Articulatio genus',
    iconColor: '#0284C7',
    axes: [
      { key: 'flexion_active', labelRu: 'Активное сгибание', labelLat: 'Flexio activa', normMin: 130, normMax: 145, unit: '°', normText: '130°–145°', clinicalNote: 'Функциональный предел активной флексии' },
      { key: 'flexion_passive', labelRu: 'Пассивное сгибание', labelLat: 'Flexio passiva', normMin: 140, normMax: 150, unit: '°', normText: '140°–150°', clinicalNote: 'Тест мягкотканого упора в крайних углах' },
      { key: 'extension_deficit', labelRu: 'Дефицит разгибания', labelLat: 'Deficit extensionis', normMin: 0, normMax: 0, unit: '°', normText: '0° (норма)', isDeficit: true, clinicalNote: 'Маркер сгибательной контрактуры или блока мениска' }
    ],
    defaultNorm: { flexion_active: 135, flexion_passive: 140, extension_deficit: 0 },
    defaultMild: { flexion_active: 120, flexion_passive: 125, extension_deficit: 0 },
    defaultSevere: { flexion_active: 90, flexion_passive: 95, extension_deficit: 15 }
  },
  shoulder: {
    category: 'shoulder',
    titleRu: 'Плечевой сустав и пояс',
    titleLat: 'Articulatio humeri',
    iconColor: '#9333EA',
    axes: [
      { key: 'abduction', labelRu: 'Отведение во фронтальной пл.', labelLat: 'Abductio', normMin: 160, normMax: 180, unit: '°', normText: '160°–180°', clinicalNote: 'Болезненная дуга Дауборна 70°–120°' },
      { key: 'flexion_active', labelRu: 'Элевация / Сгибание вперед', labelLat: 'Anteversio / Elevatio', normMin: 160, normMax: 180, unit: '°', normText: '160°–180°', clinicalNote: 'Лопаточно-плечевой ритм' },
      { key: 'external_rotation', labelRu: 'Наружная ротация', labelLat: 'Rotatio externa', normMin: 60, normMax: 90, unit: '°', normText: '60°–90°', clinicalNote: 'Ранний маркер замороженного плеча / манжеты' },
      { key: 'internal_rotation', labelRu: 'Внутренняя ротация', labelLat: 'Rotatio interna', normMin: 60, normMax: 80, unit: '°', normText: '60°–80°', clinicalNote: 'Ориентир: заведение кисти за спину до Th7–Th10' },
      { key: 'extension_deficit', labelRu: 'Ретракция / Дефицит', labelLat: 'Deficit extensionis', normMin: 0, normMax: 10, unit: '°', normText: '0°–10°', isDeficit: true, clinicalNote: 'Капсулярная ретракция заднего отдела' }
    ],
    defaultNorm: { abduction: 170, flexion_active: 170, external_rotation: 75, internal_rotation: 75, extension_deficit: 0 },
    defaultMild: { abduction: 150, flexion_active: 160, external_rotation: 65, internal_rotation: 65, extension_deficit: 0 },
    defaultSevere: { abduction: 75, flexion_active: 85, external_rotation: 15, internal_rotation: 25, extension_deficit: 20 }
  },
  hip: {
    category: 'hip',
    titleRu: 'Тазобедренный сустав',
    titleLat: 'Articulatio coxae',
    iconColor: '#16A34A',
    axes: [
      { key: 'flexion_active', labelRu: 'Сгибание бедра', labelLat: 'Flexio', normMin: 115, normMax: 125, unit: '°', normText: '115°–125°', clinicalNote: 'Сгибание до контакта бедра с животом' },
      { key: 'abduction', labelRu: 'Отведение бедра', labelLat: 'Abductio', normMin: 40, normMax: 45, unit: '°', normText: '40°–45°', clinicalNote: 'Амплитуда отведения при фиксированном тазе' },
      { key: 'internal_rotation', labelRu: 'Внутренняя ротация (артроз)', labelLat: 'Rotatio interna', normMin: 30, normMax: 35, unit: '°', normText: '30°–35°', clinicalNote: 'Главный ранний маркер коксартроза / FAI!' },
      { key: 'external_rotation', labelRu: 'Наружная ротация', labelLat: 'Rotatio externa', normMin: 40, normMax: 45, unit: '°', normText: '40°–45°', clinicalNote: 'Ротация бедра наружу при сгибании 90°' },
      { key: 'extension_deficit', labelRu: 'Дефицит разгибания', labelLat: 'Deficit extensionis', normMin: 0, normMax: 0, unit: '°', normText: '0° (норма)', isDeficit: true, clinicalNote: 'Сгибательная контрактура бедра (тест Томаса)' }
    ],
    defaultNorm: { flexion_active: 120, abduction: 45, internal_rotation: 35, external_rotation: 45, extension_deficit: 0 },
    defaultMild: { flexion_active: 110, abduction: 35, internal_rotation: 20, external_rotation: 35, extension_deficit: 0 },
    defaultSevere: { flexion_active: 70, abduction: 15, internal_rotation: 5, external_rotation: 15, extension_deficit: 15 }
  },
  ankle: {
    category: 'ankle',
    titleRu: 'Голеностопный сустав и стопа',
    titleLat: 'Articulatio talocruralis',
    iconColor: '#0D9488',
    axes: [
      { key: 'dorsal_flexion', labelRu: 'Тыльное сгибание (дорсифлексия)', labelLat: 'Dorsiflexio', normMin: 20, normMax: 25, unit: '°', normText: '20°–25°', clinicalNote: 'Ограничено при ригидности ахиллова сухожилия' },
      { key: 'plantar_flexion', labelRu: 'Подошвенное сгибание', labelLat: 'Plantarflexio', normMin: 45, normMax: 50, unit: '°', normText: '45°–50°', clinicalNote: 'Функция икроножно-камбаловидного комплекса' },
      { key: 'supination', labelRu: 'Супинация / Инверсия стопы', labelLat: 'Supinatio / Inversio', normMin: 30, normMax: 35, unit: '°', normText: '30°–35°', clinicalNote: 'Амплитуда подтаранного сустава' },
      { key: 'pronation', labelRu: 'Пронация / Эверсия стопы', labelLat: 'Pronatio / Eversio', normMin: 15, normMax: 20, unit: '°', normText: '15°–20°', clinicalNote: 'Стабильность малоберцовых сухожилий' }
    ],
    defaultNorm: { dorsal_flexion: 20, plantar_flexion: 45, supination: 30, pronation: 15 },
    defaultMild: { dorsal_flexion: 15, plantar_flexion: 40, supination: 25, pronation: 15 },
    defaultSevere: { dorsal_flexion: 5, plantar_flexion: 20, supination: 10, pronation: 8 }
  },
  foot_mtp: {
    category: 'foot_mtp',
    titleRu: 'I плюснефаланговый сустав и стопа',
    titleLat: 'Articulatio metatarsophalangea I',
    iconColor: '#059669',
    axes: [
      { key: 'mtp1_dorsiflexion', labelRu: 'Разгибание I ПФС (I палец)', labelLat: 'Extensio MTP-1', normMin: 65, normMax: 70, unit: '°', normText: '65°–70°', clinicalNote: 'Критично при Hallux Valgus / Hallux Rigidus / Подагре' },
      { key: 'mtp1_plantarflexion', labelRu: 'Сгибание I ПФС', labelLat: 'Flexio MTP-1', normMin: 35, normMax: 45, unit: '°', normText: '35°–45°', clinicalNote: 'Функция короткого сгибателя большого пальца' },
      { key: 'dorsal_flexion', labelRu: 'Тыльное сгибание голеностопа', labelLat: 'Dorsiflexio', normMin: 20, normMax: 25, unit: '°', normText: '20°–25°', clinicalNote: 'Общая дорсифлексия стопы' },
      { key: 'plantar_flexion', labelRu: 'Подошвенное сгибание', labelLat: 'Plantarflexio', normMin: 45, normMax: 50, unit: '°', normText: '45°–50°', clinicalNote: 'Толчковая фаза шага' }
    ],
    defaultNorm: { mtp1_dorsiflexion: 65, mtp1_plantarflexion: 35, dorsal_flexion: 20, plantar_flexion: 45 },
    defaultMild: { mtp1_dorsiflexion: 40, mtp1_plantarflexion: 25, dorsal_flexion: 15, plantar_flexion: 40 },
    defaultSevere: { mtp1_dorsiflexion: 20, mtp1_plantarflexion: 15, dorsal_flexion: 10, plantar_flexion: 30 }
  },
  elbow: {
    category: 'elbow',
    titleRu: 'Локтевой сустав',
    titleLat: 'Articulatio cubiti',
    iconColor: '#EA580C',
    axes: [
      { key: 'flexion_active', labelRu: 'Сгибание в локтевом суставе', labelLat: 'Flexio', normMin: 140, normMax: 150, unit: '°', normText: '140°–150°', clinicalNote: 'Рабочая амплитуда самообслуживания (≥120°)' },
      { key: 'extension_deficit', labelRu: 'Дефицит разгибания', labelLat: 'Deficit extensionis', normMin: 0, normMax: 0, unit: '°', normText: '0° (норма)', isDeficit: true, clinicalNote: 'Посттравматическая сгибательная контрактура' },
      { key: 'supination', labelRu: 'Супинация предплечья', labelLat: 'Supinatio', normMin: 85, normMax: 90, unit: '°', normText: '85°–90°', clinicalNote: 'Ротация ладонью вверх' },
      { key: 'pronation', labelRu: 'Пронация предплечья', labelLat: 'Pronatio', normMin: 85, normMax: 90, unit: '°', normText: '85°–90°', clinicalNote: 'Ротация ладонью вниз' }
    ],
    defaultNorm: { flexion_active: 145, extension_deficit: 0, supination: 85, pronation: 85 },
    defaultMild: { flexion_active: 135, extension_deficit: 0, supination: 85, pronation: 85 },
    defaultSevere: { flexion_active: 105, extension_deficit: 15, supination: 65, pronation: 70 }
  },
  wrist: {
    category: 'wrist',
    titleRu: 'Лучезапястный сустав и кисть',
    titleLat: 'Articulatio radiocarpalis',
    iconColor: '#DB2777',
    axes: [
      { key: 'palmar_flexion', labelRu: 'Ладонное сгибание', labelLat: 'Palmarflexio', normMin: 70, normMax: 80, unit: '°', normText: '70°–80°', clinicalNote: 'Провокация Фалена при карпальном синдроме' },
      { key: 'dorsal_flexion', labelRu: 'Тыльное разгибание', labelLat: 'Dorsiflexio', normMin: 65, normMax: 75, unit: '°', normText: '65°–75°', clinicalNote: 'Необходимо для сильного захвата кисти' },
      { key: 'radial_deviation', labelRu: 'Лучевое отведение', labelLat: 'Deviatio radialis', normMin: 20, normMax: 25, unit: '°', normText: '20°–25°', clinicalNote: 'Отвод кисти в сторону I пальца' },
      { key: 'ulnar_deviation', labelRu: 'Локтевое отведение', labelLat: 'Deviatio ulnaris', normMin: 30, normMax: 35, unit: '°', normText: '30°–35°', clinicalNote: 'Провокация де Кервена (тест Финкельштейна)' }
    ],
    defaultNorm: { palmar_flexion: 75, dorsal_flexion: 70, radial_deviation: 20, ulnar_deviation: 30 },
    defaultMild: { palmar_flexion: 65, dorsal_flexion: 60, radial_deviation: 20, ulnar_deviation: 25 },
    defaultSevere: { palmar_flexion: 45, dorsal_flexion: 45, radial_deviation: 15, ulnar_deviation: 20 }
  },
  spine: {
    category: 'spine',
    titleRu: 'Позвоночный столб',
    titleLat: 'Columna vertebralis',
    iconColor: '#475569',
    axes: [
      { key: 'schober_cm', labelRu: 'Проба Шобера (прирост длины)', labelLat: 'Schober index', normMin: 5.0, normMax: 7.0, unit: 'см', normText: '≥ 5.0 см', clinicalNote: 'Критерий анкилозирующего спондилита (болезнь Бехтерева)' },
      { key: 'lumbar_flexion', labelRu: 'Сгибание поясницы (Flexio)', labelLat: 'Flexio lumbalis', normMin: 80, normMax: 90, unit: '°', normText: '80°–90°', clinicalNote: 'Расстояние пальцы-пол (норма: 0–5 см)' },
      { key: 'lumbar_extension', labelRu: 'Разгибание (Extensio)', labelLat: 'Extensio', normMin: 25, normMax: 30, unit: '°', normText: '25°–30°', clinicalNote: 'Ограничено при фасеточном синдроме' },
      { key: 'lateral_flexion_left', labelRu: 'Боковой наклон влево', labelLat: 'Lateroflexio sin.', normMin: 25, normMax: 35, unit: '°', normText: '25°–35°', clinicalNote: 'Фронтальная подвижность' },
      { key: 'lateral_flexion_right', labelRu: 'Боковой наклон вправо', labelLat: 'Lateroflexio dex.', normMin: 25, normMax: 35, unit: '°', normText: '25°–35°', clinicalNote: 'Фронтальная подвижность' },
      { key: 'cervical_flexion', labelRu: 'Сгибание шейного отдела', labelLat: 'Flexio cervicalis', normMin: 40, normMax: 45, unit: '°', normText: '40°–45°', clinicalNote: 'Расстояние подбородок-грудина (норма: 0 см)' },
      { key: 'cervical_rotation', labelRu: 'Ротация шейного отдела', labelLat: 'Rotatio cervicalis', normMin: 70, normMax: 80, unit: '°', normText: '70°–80°', clinicalNote: 'Поворот головы в каждую сторону' }
    ],
    defaultNorm: { schober_cm: 5.0, lumbar_flexion: 85, lumbar_extension: 25, lateral_flexion_left: 30, lateral_flexion_right: 30, cervical_flexion: 45, cervical_rotation: 75 },
    defaultMild: { schober_cm: 4.0, lumbar_flexion: 70, lumbar_extension: 15, lateral_flexion_left: 20, lateral_flexion_right: 20, cervical_flexion: 35, cervical_rotation: 60 },
    defaultSevere: { schober_cm: 2.0, lumbar_flexion: 35, lumbar_extension: 5, lateral_flexion_left: 10, lateral_flexion_right: 10, cervical_flexion: 20, cervical_rotation: 30 }
  },
  systemic_hypermobile: {
    category: 'systemic_hypermobile',
    titleRu: 'Гипермобильность суставов',
    titleLat: 'Hypermobilitas articularis',
    iconColor: '#7C3AED',
    axes: [
      { key: 'beighton_score', labelRu: 'Шкала Бейтона (баллы)', labelLat: 'Beighton score', normMin: 0, normMax: 3, unit: 'баллов', normText: '0–3 баллов', clinicalNote: '≥ 4 баллов указывает на генерализованную гипермобильность' },
      { key: 'knee_hyperextension', labelRu: 'Переразгибание коленей', labelLat: 'Genu recurvatum', normMin: 0, normMax: 0, unit: '°', normText: '0° (гипер >10°)', isDeficit: true, clinicalNote: 'Рекурвация коленных суставов' },
      { key: 'elbow_hyperextension', labelRu: 'Переразгибание локтей', labelLat: 'Cubitus recurvatus', normMin: 0, normMax: 0, unit: '°', normText: '0° (гипер >10°)', isDeficit: true, clinicalNote: 'Рекурвация локтевых суставов' }
    ],
    defaultNorm: { beighton_score: 1, knee_hyperextension: 0, elbow_hyperextension: 0 },
    defaultMild: { beighton_score: 4, knee_hyperextension: 5, elbow_hyperextension: 5 },
    defaultSevere: { beighton_score: 8, knee_hyperextension: 15, elbow_hyperextension: 15 }
  }
};

export function resolveRomConfig(template: { joint_name?: string; title?: string; rom_norm_preset?: any }): JointRomConfig {
  const romPreset = template?.rom_norm_preset || {};
  let category = romPreset.joint_category;

  if (!category || category === 'general' || category === 'systemic_general') {
    const title = (template?.title || '').toLowerCase();
    const jName = (template?.joint_name || '').toLowerCase();

    if (jName === 'knee' || /колен|тэкс|мениск|пкс|зкс|пателл|осгуд|гоффа|синдинг|блаунт/i.test(title)) {
      category = 'knee';
    } else if (jName === 'shoulder' || /плеч|акс|ключиц|ротатор|манжет|латарже|банкарт|субакромиал|tsa|rsa/i.test(title)) {
      category = 'shoulder';
    } else if (jName === 'hip' || /тазобедр|тбс|кокс|тэтс|пертес|юэгбк|scfe|вертлуж|fai/i.test(title)) {
      category = 'hip';
    } else if (jName === 'ankle' || /стоп|голеностоп|ахилл|пятк|север|келер|фрейберг|hallux|вальгус стоп|плоскостоп|косолапост|подагр|подошвен|плантар/i.test(title)) {
      category = /hallux|подагр|первого пальц|сесамоид/i.test(title) ? 'foot_mtp' : 'ankle';
    } else if (jName === 'elbow' || /локт|эпикондил|олекранон|лучев.*кост.*локт|няни/i.test(title)) {
      category = 'elbow';
    } else if (jName === 'wrist' || /кист|запяст|лучезапяст|дистальн.*радиус|карпал|туннел|де кёрвен|vlp|пальц|дюпюитрен/i.test(title)) {
      category = 'wrist';
    } else if (jName === 'spine' || /позвоноч|дискэктоми|спондилодез|tlif|plif|шейн|пояснич|дорсопат|сколиоз|бехтерев|кривоше/i.test(title)) {
      category = 'spine';
    } else if (/гипермобильн|элерс/i.test(title)) {
      category = 'systemic_hypermobile';
    } else {
      category = jName || 'knee';
    }
  }

  return ROM_CONFIGS[category] || ROM_CONFIGS['knee'];
}

export function evaluateRomAxisStatus(axis: RomAxisDef, val: number | undefined): { text: string; color: string; isAbnormal: boolean } {
  if (val === undefined || val === null || isNaN(val)) {
    return { text: 'Не исследовано', color: '#64748B', isAbnormal: false };
  }
  if (axis.isDeficit) {
    if (val === 0) return { text: 'Норма (дефицит 0°)', color: '#16A34A', isAbnormal: false };
    if (val <= 5) return { text: `Минимальный дефицит (${val}°)`, color: '#D97706', isAbnormal: true };
    return { text: `Контрактура / Дефицит (${val}°)!`, color: '#DC2626', isAbnormal: true };
  }
  if (val >= axis.normMin) {
    return { text: 'В пределах нормы', color: '#16A34A', isAbnormal: false };
  }
  const deficit = axis.normMin - val;
  if (deficit <= 15) {
    return { text: `Легкое ограничение (-${deficit}${axis.unit})`, color: '#0284C7', isAbnormal: true };
  }
  if (deficit <= 35) {
    return { text: `Умеренное ограничение (-${deficit}${axis.unit})`, color: '#D97706', isAbnormal: true };
  }
  return { text: `Выраженный дефицит (-${deficit}${axis.unit})`, color: '#DC2626', isAbnormal: true };
}

export function computeSftrFormula(category: string, rom: any): string {
  if (!rom) return 'Neutral-0: норма';
  if (rom.sftr_notation) return rom.sftr_notation;

  switch (category) {
    case 'knee':
      return `S: 0-${rom.extension_deficit ?? 0}-${rom.flexion_active ?? 135}°`;
    case 'shoulder':
      return `S: ${rom.extension_deficit ?? 40}-0-${rom.flexion_active ?? 170}°, F: ${rom.abduction ?? 170}-0-0°, R: ${rom.external_rotation ?? 70}-0-${rom.internal_rotation ?? 70}°`;
    case 'hip':
      return `S: ${rom.extension_deficit ?? 0}-0-${rom.flexion_active ?? 115}°, F: ${rom.abduction ?? 40}-0-20°, R: ${rom.external_rotation ?? 40}-0-${rom.internal_rotation ?? 30}°`;
    case 'ankle':
    case 'foot':
      return `S: ${rom.dorsal_flexion ?? 20}-0-${rom.plantar_flexion ?? 45}°, R: ${rom.supination ?? 30}-0-${rom.pronation ?? 15}°`;
    case 'foot_mtp':
      return `MTP-1: ${rom.mtp1_dorsiflexion ?? 65}-0-15°, S: ${rom.dorsal_flexion ?? 20}-0-${rom.plantar_flexion ?? 45}°`;
    case 'elbow':
      return `S: 0-${rom.extension_deficit ?? 0}-${rom.flexion_active ?? 140}°, R: ${rom.supination ?? 85}-0-${rom.pronation ?? 85}°`;
    case 'wrist':
      return `S: ${rom.dorsal_flexion ?? 70}-0-${rom.palmar_flexion ?? 75}°, F: ${rom.radial_deviation ?? 20}-0-${rom.ulnar_deviation ?? 30}°`;
    case 'spine':
      return `Шобер: +${rom.schober_cm ?? 5} см, S: ${rom.lumbar_extension ?? 25}-0-${rom.lumbar_flexion ?? 80}°`;
    case 'systemic_hypermobile':
      return `Beighton: ${rom.beighton_score ?? 0}/9 баллов`;
    default:
      return 'Neutral-0: функциональный объем';
  }
}

export function getRomSeverityBadge(rom: any): { label: string; color: string; bg: string; border: string } {
  const level = rom?.severity_level;
  if (level === 'severe') {
    return { label: 'Тяжелая контрактура / Блок', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' };
  }
  if (level === 'moderate') {
    return { label: 'Умеренная контрактура / Ограничение', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' };
  }
  if (level === 'mild') {
    return { label: 'Легкое ограничение / Болевая дуга', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' };
  }
  if (level === 'hypermobile') {
    return { label: 'Синдром гипермобильности', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' };
  }
  return { label: 'Анатомическая норма (100% ROM)', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' };
}

export function formatRomClinicalSummary(rom: any, template: { joint_name?: string; title?: string }): string {
  if (!rom) return 'Гониометрия (ROM Neutral-0): объем движений физиологический, без контрактур.';
  const cfg = resolveRomConfig({ ...template, rom_norm_preset: rom });
  const sftr = computeSftrFormula(cfg.category, rom);
  const endFeelText = rom.end_feel_expected ? ` Конечное ощущение упора (End-Feel): ${rom.end_feel_label || rom.end_feel_expected}.` : '';
  const stopWarn = rom.cdss_stop_warning ? `\n  ! CDSS ОГРАНИЧЕНИЕ БЕЗОПАСНОСТИ [P0-STOP]: ${rom.cdss_stop_warning}` : '';
  const note = rom.clinical_interpretation || 'В пределах функциональной нормы.';
  return `Гониометрия (Neutral-0 ROM, ${cfg.titleRu}): [${sftr}].${endFeelText}\n  ${note}${stopWarn}`;
}

interface FullTemplate {
  id?: number;
  title: string;
  joint_name: string;
  default_mkb_code?: string;
  category?: string;
  cluster_id?: string;
  cluster_name?: string;
  stage_or_severity?: string;
  clinical_tags?: string | string[];
  default_side?: string;
  complaints_template?: string;
  anamnesis_template?: string;
  objective_template?: string;
  anamnesis_vitae_template?: string;
  objective_status_template?: string;
  special_studies_template?: string;
  performed_manipulations_template?: string;
  default_sections_mask?: string | Record<string, boolean>;
  recommendations_template?: string;
  rom_norm_preset?: any;
  rom_priority?: 'P1' | 'P2' | 'P3' | 'P0-STOP' | string;
  rom_sftr_preview?: string;
  rom_end_feel?: string;
  rom_has_stop_warning?: number | boolean;
  manipulations_priority?: 'P1' | 'P2' | 'P3' | 'P0-STOP' | string;
  manipulations_summary?: string;
  manipulations_has_stop?: number | boolean;
  manipulations_stop_rationale?: string;
  orthotics_priority?: 'P1' | 'P2' | 'P3' | 'P0-STOP' | string;
  orthotics_weight_bearing?: 'NWB' | 'TTWB' | 'PWB' | 'WBAT' | 'FWB' | 'N/A' | string;
  orthotics_summary?: string;
  orthotics_has_stop?: number | boolean;
  orthotics_stop_rationale?: string;
  template_json?: any;
  tests: TemplateTestItem[];
  diagnostics: TemplateDiagnosticItem[];
  manipulations: TemplateTreatmentRelItem[];
  physiotherapy: TemplateTreatmentRelItem[];
  orthotics: TemplateTreatmentRelItem[];
  prescriptions?: PrescriptionItem[];
  is_custom?: boolean | number;
  author_doctor_name?: string;
}

const JOINT_OPTIONS = [
  { key: 'all', label: 'Все суставы', color: '#0F3C64' },
  { key: 'knee', label: 'Коленный', color: '#156C9C' },
  { key: 'elbow', label: 'Локтевой', color: '#E65100' },
  { key: 'shoulder', label: 'Плечевой', color: '#6A1B9A' },
  { key: 'hip', label: 'Тазобедренный', color: '#2E7D32' },
  { key: 'ankle', label: 'Стопа/Голеностоп', color: '#00838F' },
  { key: 'wrist', label: 'Кисть/Запястье', color: '#AD1457' },
  { key: 'spine', label: 'Позвоночник', color: '#455A64' },
  { key: 'general', label: 'Общие / Системные', color: '#4F46E5' }
];

export default function OrthoTemplatesManager() {
  const navigate = useNavigate();

  // Mode: Templates vs Diagnostic Methods Catalog vs Orthopedic Tests Catalog
  const [viewMode, setViewMode] = useState<'templates' | 'diagnostics' | 'tests'>('templates');

  // Master List State
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJointFilter, setSelectedJointFilter] = useState('all');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState('all');
  const [onlyCustomFilter, setOnlyCustomFilter] = useState(false);
  const [groupByCluster, setGroupByCluster] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Detail Form State
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<FullTemplate | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  // Quick Filter States for Tab 1 (ROM Goniometry)
  const [romPriorityFilter, setRomPriorityFilter] = useState<'all' | 'P1' | 'P2' | 'P3'>('all');
  const [copiedSftr, setCopiedSftr] = useState(false);
  const [copiedRomSummary, setCopiedRomSummary] = useState(false);

  // Quick Filter States for Tab 2 (Tests) & Tab 3 (Diagnostics)
  const [testTypeFilter, setTestTypeFilter] = useState<string>('all');
  const [testEbmFilter, setTestEbmFilter] = useState<'all' | 'supplemented' | 'level_a' | 'level_b'>('all');
  const [diagModalityFilter, setDiagModalityFilter] = useState<string>('all');

  // Quick Filter States for Treatments Tabs
  const [manipFilter, setManipFilter] = useState<string>('all');
  const [manipPriorityFilter, setManipPriorityFilter] = useState<'all' | 'P1' | 'P2' | 'P3' | 'P0-STOP'>('all');
  const [manipDrugFilter, setManipDrugFilter] = useState<string>('all');
  const [manipNavFilter, setManipNavFilter] = useState<string>('all');
  const [copiedManipProtocol, setCopiedManipProtocol] = useState(false);
  const [physioFilter, setPhysioFilter] = useState<string>('all');
  const [orthoFilter, setOrthoFilter] = useState<string>('all');
  const [orthoPriorityFilter, setOrthoPriorityFilter] = useState<'all' | 'P1' | 'P2' | 'P3' | 'P0-STOP'>('all');
  const [orthoWbFilter, setOrthoWbFilter] = useState<string>('all');
  const [copiedOrthoProtocol, setCopiedOrthoProtocol] = useState(false);

  // Modality counts for Tab 3 Diagnostics
  const diagModalityCounts = useMemo(() => {
    if (!currentTemplate || !currentTemplate.diagnostics) return {};
    const counts: Record<string, number> = { all: currentTemplate.diagnostics.length };
    currentTemplate.diagnostics.forEach(d => {
      const mod = (d.modality || 'other').toLowerCase();
      counts[mod] = (counts[mod] || 0) + 1;
    });
    return counts;
  }, [currentTemplate]);

  // Biomechanics & EBM counts for Tab 2 Orthopedic Tests
  const testCounts = useMemo(() => {
    if (!currentTemplate || !currentTemplate.tests) {
      return {
        total: 0,
        types: {} as Record<string, number>,
        supplemented: 0,
        levelA: 0,
        levelB: 0
      };
    }
    const types: Record<string, number> = {};
    let supplemented = 0;
    let levelA = 0;
    let levelB = 0;

    currentTemplate.tests.forEach(t => {
      const typeKey = (t.test_type_tag || t.test_type || 'provocative').toLowerCase();
      types[typeKey] = (types[typeKey] || 0) + 1;
      if (t.is_supplemented === 1 || t.is_supplemented === true) {
        supplemented++;
      }
      const ev = (t.evidence_level || '').toUpperCase();
      if (ev === 'A') levelA++;
      if (ev === 'B') levelB++;
    });

    return {
      total: currentTemplate.tests.length,
      types,
      supplemented,
      levelA,
      levelB
    };
  }, [currentTemplate]);

  // Catalogs Cache
  const [testCatalog, setTestCatalog] = useState<OrthoTestCatalogItem[]>([]);
  const [diagCatalog, setDiagCatalog] = useState<DiagnosticMethodCatalogItem[]>([]);
  const [manipCatalog, setManipCatalog] = useState<TreatmentCatalogItem[]>([]);
  const [physioCatalog, setPhysioCatalog] = useState<TreatmentCatalogItem[]>([]);
  const [orthoticsCatalog, setOrthoticsCatalog] = useState<TreatmentCatalogItem[]>([]);

  // Dialogs
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [manipModalOpen, setManipModalOpen] = useState(false);
  const [physioModalOpen, setPhysioModalOpen] = useState(false);
  const [orthoticsModalOpen, setOrthoticsModalOpen] = useState(false);

  const [methodInfoModal, setMethodInfoModal] = useState<OrthoTestCatalogItem | null>(null);
  const [diagInfoModal, setDiagInfoModal] = useState<DiagnosticMethodCatalogItem | null>(null);

  // Treatment Guidance Modal
  const [treatmentModalItem, setTreatmentModalItem] = useState<TreatmentItem | null>(null);
  const [treatmentModalCategory, setTreatmentModalCategory] = useState<TreatmentCategory>('manipulation');

  // Protocol Preview State & Print Ref
  const protocolPrintRef = useRef<HTMLDivElement>(null);
  const [copiedProtocol, setCopiedProtocol] = useState(false);

  const handlePrintProtocol = useReactToPrint({
    contentRef: protocolPrintRef,
    documentTitle: currentTemplate ? `Клинический_протокол_${currentTemplate.default_mkb_code || 'МКБ'}_${currentTemplate.title.replace(/\s+/g, '_')}` : 'Клинический_протокол',
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 10mm 12mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
  });

  // Load Catalogs on Mount
  useEffect(() => {
    fetchCatalogs();
    fetchTemplates();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const [testsRes, diagsRes, manRes, physRes, orthRes] = await Promise.all([
        fetch('/api/ortho/tests/catalog'),
        fetch('/api/ortho/diagnostics/catalog'),
        fetch('/api/ortho/treatments/manipulations'),
        fetch('/api/ortho/treatments/physiotherapy'),
        fetch('/api/ortho/treatments/orthotics')
      ]);
      const testsData = await testsRes.json();
      const diagsData = await diagsRes.json();
      const manData = await manRes.json();
      const physData = await physRes.json();
      const orthData = await orthRes.json();

      if (testsData.success) setTestCatalog(testsData.tests || []);
      if (diagsData.success) setDiagCatalog(diagsData.diagnostics || []);
      if (manData.success) setManipCatalog(manData.manipulations || manData.items || []);
      if (physData.success) setPhysioCatalog(physData.physiotherapy || physData.items || []);
      if (orthData.success) setOrthoticsCatalog(orthData.orthotics || orthData.items || []);
    } catch (e) {
      console.error('Failed to load catalogs:', e);
    }
  };

  const fetchTemplates = async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/ortho/templates/detailed');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
        if (data.templates && data.templates.length > 0 && !selectedTemplateId) {
          loadTemplateDetail(data.templates[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setLoadingList(false);
    }
  };

  const loadTemplateDetail = async (id: number) => {
    setLoadingDetail(true);
    setSelectedTemplateId(id);
    setSaveStatus({ type: '', message: '' });
    try {
      const res = await fetch(`/api/ortho/templates/${id}/full`);
      const data = await res.json();
      if (data.success && data.template) {
        const t = data.template;
        let parsedJson: any = {};
        try {
          parsedJson = typeof t.template_json === 'string' ? JSON.parse(t.template_json) : t.template_json;
        } catch {
          parsedJson = {};
        }

        let parsedRom: any = {};
        try {
          parsedRom = typeof t.rom_norm_preset === 'string' ? JSON.parse(t.rom_norm_preset) : t.rom_norm_preset;
        } catch {
          parsedRom = parsedJson.rom || {};
        }

        setCurrentTemplate({
          id: t.id,
          title: t.title,
          joint_name: t.joint_name || 'knee',
          default_mkb_code: t.default_mkb_code || '',
          category: t.category || 'Дегенеративно-дистрофические заболевания',
          cluster_id: t.cluster_id || 'cluster_knee',
          cluster_name: t.cluster_name || '',
          stage_or_severity: t.stage_or_severity || '',
          clinical_tags: t.clinical_tags || '',
          default_side: t.default_side || 'right',
          complaints_template: t.complaints_template || parsedJson.complaints || '',
          anamnesis_template: t.anamnesis_template || parsedJson.anamnesis || '',
          objective_template: t.objective_template || parsedJson.objective || '',
          anamnesis_vitae_template: t.anamnesis_vitae_template || parsedJson.anamnesis_vitae || '',
          objective_status_template: t.objective_status_template || parsedJson.objective_status || '',
          special_studies_template: t.special_studies_template || parsedJson.special_studies || '',
          performed_manipulations_template: t.performed_manipulations_template || parsedJson.performed_manipulations || '',
          default_sections_mask: t.default_sections_mask || parsedJson.default_sections_mask || '',
          recommendations_template: t.recommendations_template || (parsedJson.recommendations || ''),
          rom_norm_preset: parsedRom,
          rom_priority: t.rom_priority || parsedRom.priority || 'P2',
          rom_sftr_preview: t.rom_sftr_preview || parsedRom.sftr_notation || '',
          rom_end_feel: t.rom_end_feel || parsedRom.end_feel_expected || 'EF_CAPS',
          rom_has_stop_warning: t.rom_has_stop_warning ?? (parsedRom.priority === 'P0-STOP' ? 1 : 0),
          tests: t.tests || [],
          diagnostics: t.diagnostics || [],
          manipulations: (t.manipulations || []).map((m: any) => ({ ...m, item_code: m.item_code || m.manipulation_code || m.code })),
          physiotherapy: (t.physiotherapy || []).map((p: any) => ({ ...p, item_code: p.item_code || p.physiotherapy_code || p.code })),
          orthotics: (t.orthotics || []).map((o: any) => ({ ...o, item_code: o.item_code || o.orthotics_code || o.code })),
          prescriptions: parsedJson.prescriptions || [],
          is_custom: Boolean(t.is_custom),
          author_doctor_name: t.author_doctor_name || ''
        });
      }
    } catch (e) {
      console.error('Failed to load template detail:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateNew = () => {
    const targetClusterId = selectedClusterFilter !== 'all' ? selectedClusterFilter : 'cluster_knee';
    const foundCluster = MASTER_CLUSTERS.find(c => c.id === targetClusterId);
    const defaultJoint = foundCluster && foundCluster.joint_affinity !== 'all' && foundCluster.joint_affinity !== 'general'
      ? foundCluster.joint_affinity
      : 'knee';

    const newTpl: FullTemplate = {
      title: 'Новый клинический шаблон',
      joint_name: selectedJointFilter !== 'all' ? selectedJointFilter : defaultJoint,
      default_mkb_code: 'M17.1',
      category: 'Дегенеративно-дистрофические заболевания',
      cluster_id: targetClusterId,
      cluster_name: foundCluster?.name_ru || '1. Коленный сустав',
      stage_or_severity: '',
      clinical_tags: '',
      default_side: 'right',
      complaints_template: '',
      anamnesis_template: '',
      objective_template: '',
      anamnesis_vitae_template: '',
      objective_status_template: '',
      special_studies_template: '',
      performed_manipulations_template: '',
      default_sections_mask: '',
      recommendations_template: '',
      rom_norm_preset: { flexion_active: 130, flexion_passive: 140, extension_deficit: 0 },
      tests: [],
      diagnostics: [],
      manipulations: [],
      physiotherapy: [],
      orthotics: [],
      prescriptions: [],
      is_custom: false,
      author_doctor_name: ''
    };
    setSelectedTemplateId(null);
    setCurrentTemplate(newTpl);
    setActiveTab(0);
    setSaveStatus({ type: '', message: '' });
    setTestTypeFilter('all');
    setTestEbmFilter('all');
    setDiagModalityFilter('all');
    setManipFilter('all');
    setPhysioFilter('all');
    setOrthoFilter('all');
  };

  const handleSave = async () => {
    if (!currentTemplate) return;
    try {
      const payload = {
        title: currentTemplate.title,
        joint_name: currentTemplate.joint_name,
        default_mkb_code: currentTemplate.default_mkb_code,
        category: currentTemplate.category,
        cluster_id: currentTemplate.cluster_id,
        cluster_name: currentTemplate.cluster_name,
        stage_or_severity: currentTemplate.stage_or_severity,
        clinical_tags: currentTemplate.clinical_tags,
        default_side: currentTemplate.default_side,
        complaints_template: currentTemplate.complaints_template,
        anamnesis_template: currentTemplate.anamnesis_template,
        objective_template: currentTemplate.objective_template,
        anamnesis_vitae_template: currentTemplate.anamnesis_vitae_template,
        objective_status_template: currentTemplate.objective_status_template,
        special_studies_template: currentTemplate.special_studies_template,
        performed_manipulations_template: currentTemplate.performed_manipulations_template,
        default_sections_mask: currentTemplate.default_sections_mask,
        rom_norm_preset: currentTemplate.rom_norm_preset,
        rom_priority: (currentTemplate as any).rom_priority || currentTemplate.rom_norm_preset?.priority || 'P2',
        rom_sftr_preview: (currentTemplate as any).rom_sftr_preview || currentTemplate.rom_norm_preset?.sftr_notation || '',
        rom_end_feel: (currentTemplate as any).rom_end_feel || currentTemplate.rom_norm_preset?.end_feel_expected || 'EF_CAPS',
        rom_has_stop_warning: (currentTemplate as any).rom_has_stop_warning ?? (currentTemplate.rom_norm_preset?.priority === 'P0-STOP' ? 1 : 0),
        manipulations_priority: currentTemplate.manipulations_priority || 'P2',
        manipulations_summary: currentTemplate.manipulations_summary || '',
        manipulations_has_stop: currentTemplate.manipulations_has_stop ? 1 : 0,
        manipulations_stop_rationale: currentTemplate.manipulations_stop_rationale || '',
        orthotics_priority: currentTemplate.orthotics_priority || 'P2',
        orthotics_weight_bearing: currentTemplate.orthotics_weight_bearing || 'WBAT',
        orthotics_summary: currentTemplate.orthotics_summary || '',
        orthotics_has_stop: currentTemplate.orthotics_has_stop ? 1 : 0,
        orthotics_stop_rationale: currentTemplate.orthotics_stop_rationale || '',
        recommendations_template: currentTemplate.recommendations_template,
        is_custom: currentTemplate.is_custom ? 1 : 0,
        author_doctor_name: currentTemplate.author_doctor_name || null,
        template_json: {
          complaints: currentTemplate.complaints_template,
          anamnesis: currentTemplate.anamnesis_template,
          anamnesis_vitae: currentTemplate.anamnesis_vitae_template,
          objective: currentTemplate.objective_template,
          objective_status: currentTemplate.objective_status_template,
          special_studies: currentTemplate.special_studies_template,
          performed_manipulations: currentTemplate.performed_manipulations_template,
          rom: currentTemplate.rom_norm_preset,
          prescriptions: currentTemplate.prescriptions
        },
        tests: currentTemplate.tests,
        diagnostics: currentTemplate.diagnostics,
        manipulations: currentTemplate.manipulations,
        physiotherapy: currentTemplate.physiotherapy,
        orthotics: currentTemplate.orthotics
      };

      let url = '/api/ortho/templates';
      let method = 'POST';

      if (currentTemplate.id) {
        url = `/api/ortho/templates/${currentTemplate.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setSaveStatus({ type: 'success', message: 'Шаблон успешно сохранен в базе данных!' });
        await fetchTemplates();
        if (data.id) {
          loadTemplateDetail(data.id);
        }
      } else {
        setSaveStatus({ type: 'error', message: data.error || 'Ошибка при сохранении' });
      }
    } catch (e: any) {
      setSaveStatus({ type: 'error', message: e.message || 'Ошибка сети' });
    }
  };

  const handleClone = async () => {
    if (!currentTemplate?.id) return;
    try {
      const res = await fetch(`/api/ortho/templates/${currentTemplate.id}/clone`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSaveStatus({ type: 'success', message: 'Шаблон успешно дублирован!' });
        await fetchTemplates();
        if (data.id) {
          loadTemplateDetail(data.id);
        }
      }
    } catch (e: any) {
      setSaveStatus({ type: 'error', message: e.message || 'Ошибка при клонировании' });
    }
  };

  const handleDelete = async () => {
    if (!currentTemplate?.id) return;
    if (!window.confirm(`Вы уверены, что хотите переместить шаблон "${currentTemplate.title}" в архив?`)) return;

    try {
      const res = await fetch(`/api/ortho/templates/${currentTemplate.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSaveStatus({ type: 'success', message: 'Шаблон перемещен в архив' });
        await fetchTemplates();
      }
    } catch (e: any) {
      setSaveStatus({ type: 'error', message: e.message || 'Ошибка удаления' });
    }
  };

  // Tests handlers
  const handleAddTestToTemplate = (test: OrthoTestCatalogItem) => {
    if (!currentTemplate) return;
    if (currentTemplate.tests.some(t => t.test_code === test.code)) return;

    const newTest: TemplateTestItem = {
      test_code: test.code,
      expected_result: 'positive',
      is_mandatory: 1,
      sort_order: (currentTemplate.tests.length + 1) * 10,
      priority_level: 'medium',
      test_type_tag: (test as any).test_type || 'provocative',
      test_type: (test as any).test_type || 'provocative',
      is_supplemented: (test as any).is_supplemented ? 1 : 0,
      name_ru: test.name_ru,
      name_lat: test.name_lat,
      target_structure: test.target_structure,
      methodology: test.methodology,
      positive_criteria: test.positive_criteria,
      sensitivity_specificity: test.sensitivity_specificity
    };

    setCurrentTemplate({
      ...currentTemplate,
      tests: [...currentTemplate.tests, newTest]
    });
    setTestModalOpen(false);
  };

  const handleRemoveTest = (testCode: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      tests: currentTemplate.tests.filter(t => t.test_code !== testCode)
    });
  };

  const handleUpdateTestExpected = (testCode: string, expected: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      tests: currentTemplate.tests.map(t => t.test_code === testCode ? { ...t, expected_result: expected } : t)
    });
  };

  const handleUpdateTestPriority = (testCode: string, priority: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      tests: currentTemplate.tests.map(t => t.test_code === testCode ? { ...t, priority_level: priority } : t)
    });
  };

  const handleToggleTestMandatory = (testCode: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      tests: currentTemplate.tests.map(t => t.test_code === testCode ? { ...t, is_mandatory: t.is_mandatory ? 0 : 1 } : t)
    });
  };

  const handleSetAllTestsNormal = () => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      tests: currentTemplate.tests.map(t => ({ ...t, expected_result: 'negative' }))
    });
  };

  // Diagnostics handlers
  const handleAddDiagToTemplate = (diag: DiagnosticMethodCatalogItem) => {
    if (!currentTemplate) return;
    if (currentTemplate.diagnostics.some(d => d.diagnostic_code === diag.code)) return;

    const newDiag: TemplateDiagnosticItem = {
      diagnostic_code: diag.code,
      urgency: 'routine',
      default_side: currentTemplate.default_side || 'affected',
      is_primary: 1,
      sort_order: (currentTemplate.diagnostics.length + 1) * 10,
      priority_level: diag.priority_level || 'medium',
      name: diag.name,
      modality: diag.modality,
      servdict_price: diag.servdict_price,
      protocol_phrase: diag.protocol_phrase
    };

    setCurrentTemplate({
      ...currentTemplate,
      diagnostics: [...currentTemplate.diagnostics, newDiag]
    });
    setDiagModalOpen(false);
  };

  const handleRemoveDiag = (diagCode: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      diagnostics: currentTemplate.diagnostics.filter(d => d.diagnostic_code !== diagCode)
    });
  };

  const handleUpdateDiagPriority = (diagCode: string, priority: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      diagnostics: currentTemplate.diagnostics.map(d => d.diagnostic_code === diagCode ? { ...d, priority_level: priority } : d)
    });
  };

  // Treatments Handlers (Manipulations, Physiotherapy, Orthotics)
  const handleAddTreatmentItem = (item: TreatmentCatalogItem, category: TreatmentCategory, ebmPriority: 'P1' | 'P2' = 'P1') => {
    if (!currentTemplate) return;
    const targetKey = category === 'manipulation' ? 'manipulations' : category === 'physiotherapy' ? 'physiotherapy' : 'orthotics';
    if (currentTemplate[targetKey]?.some(i => i.item_code === item.code)) return;

    const newItem: TemplateTreatmentRelItem = {
      item_code: item.code,
      category,
      priority_level: item.service_scope === 'internal' ? 'high' : (item.priority_level || 'medium'),
      service_scope: item.service_scope,
      dosage_or_regimen: item.dosage_or_regimen,
      regimen_standard: item.regimen_standard,
      sort_order: ((currentTemplate[targetKey]?.length || 0) + 1) * 10,
      name: item.name,
      subcategory: item.subcategory,
      target_joint: item.target_joint,
      description: item.description,
      technique_details: item.technique_details,
      patient_preparation: item.patient_preparation,
      post_procedure_care: item.post_procedure_care,
      clinical_indications: item.clinical_indications,
      contraindications: item.contraindications,
      servdict_id: item.servdict_id,
      servdict_code: item.servdict_code,
      servdict_price: item.servdict_price,
      servdict_name: item.servdict_name,
      ebm_priority: ebmPriority,
      modality_tag: item.modality_tag,
      evidence_level: item.evidence_level,
      apparatus_examples: item.apparatus_examples,
      biophysical_profile: item.biophysical_profile,
      cdss_contraindication_tags: item.cdss_contraindication_tags,
      exact_dosimetry: item.dosage_or_regimen || item.regimen_standard
    };

    setCurrentTemplate({
      ...currentTemplate,
      [targetKey]: [...(currentTemplate[targetKey] || []), newItem]
    });

    if (category === 'manipulation') setManipModalOpen(false);
    else if (category === 'physiotherapy') setPhysioModalOpen(false);
    else setOrthoticsModalOpen(false);
  };

  const handleRemoveTreatmentItem = (itemCode: string, category: TreatmentCategory) => {
    if (!currentTemplate) return;
    const targetKey = category === 'manipulation' ? 'manipulations' : category === 'physiotherapy' ? 'physiotherapy' : 'orthotics';
    setCurrentTemplate({
      ...currentTemplate,
      [targetKey]: (currentTemplate[targetKey] || []).filter(i => i.item_code !== itemCode)
    });
  };

  const handleUpdateTreatmentPriority = (itemCode: string, category: TreatmentCategory, priority: string) => {
    if (!currentTemplate) return;
    const targetKey = category === 'manipulation' ? 'manipulations' : category === 'physiotherapy' ? 'physiotherapy' : 'orthotics';
    setCurrentTemplate({
      ...currentTemplate,
      [targetKey]: (currentTemplate[targetKey] || []).map(i => i.item_code === itemCode ? { ...i, priority_level: priority } : i)
    });
  };

  const handleUpdatePhysioEbmPriority = (itemCode: string, ebmPriority: 'P1' | 'P2') => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      physiotherapy: (currentTemplate.physiotherapy || []).map(p =>
        p.item_code === itemCode ? { ...p, ebm_priority: ebmPriority } : p
      )
    });
  };

  // Cluster counts map
  const clusterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    templates.forEach(t => {
      if (t.cluster_id) {
        counts[t.cluster_id] = (counts[t.cluster_id] || 0) + 1;
      }
    });
    return counts;
  }, [templates]);

  // Joint counts map
  const jointCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    templates.forEach(t => {
      if (t.joint_name) {
        counts[t.joint_name] = (counts[t.joint_name] || 0) + 1;
      }
    });
    return counts;
  }, [templates]);

  // Filtered Templates for Left Master Panel
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const isCustom = t.is_custom === 1 || t.is_custom === true || t.category === 'Кастомизированный шаблон';
      if (onlyCustomFilter && !isCustom) return false;

      const matchCluster = selectedClusterFilter === 'all' || t.cluster_id === selectedClusterFilter;
      const matchJoint = selectedJointFilter === 'all' || t.joint_name === selectedJointFilter;
      const query = searchQuery.trim().toLowerCase();

      const isCustomKeyword = ['кастом', 'custom', 'автор'].some(k => query.includes(k));
      if (isCustomKeyword && isCustom) return matchCluster && matchJoint;

      const matchSearch = !query ||
        (t.title && t.title.toLowerCase().includes(query)) ||
        (t.default_mkb_code && t.default_mkb_code.toLowerCase().includes(query)) ||
        (t.stage_or_severity && t.stage_or_severity.toLowerCase().includes(query)) ||
        (t.cluster_name && t.cluster_name.toLowerCase().includes(query)) ||
        (t.author_doctor_name && t.author_doctor_name.toLowerCase().includes(query)) ||
        (t.category && t.category.toLowerCase().includes(query)) ||
        (t.clinical_tags && JSON.stringify(t.clinical_tags).toLowerCase().includes(query));

      return matchCluster && matchJoint && matchSearch;
    });
  }, [templates, selectedClusterFilter, selectedJointFilter, searchQuery, onlyCustomFilter]);

  // Grouped templates for Cluster-Accordion view
  const groupedTemplates = useMemo(() => {
    if (!groupByCluster) return null;
    const groups: { cluster: MasterCluster; items: any[] }[] = [];
    MASTER_CLUSTERS.filter(c => c.id !== 'all').forEach(cluster => {
      const items = filteredTemplates.filter(t => t.cluster_id === cluster.id);
      if (items.length > 0) {
        groups.push({ cluster, items });
      }
    });
    const unclustered = filteredTemplates.filter(t => !t.cluster_id || !MASTER_CLUSTERS.some(c => c.id === t.cluster_id));
    if (unclustered.length > 0) {
      groups.push({
        cluster: { id: 'other', code: 'OTHER', name_ru: 'Прочие нозологии', joint_affinity: 'all', badge_color: '#64748B', sort_order: 999 },
        items: unclustered
      });
    }
    return groups;
  }, [filteredTemplates, groupByCluster]);

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, height: 'calc(100vh - 75px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Banner Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/ortho-workstation')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            В АРМ Врача
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
              <BrainIcon color="primary" /> Справочник клинических шаблонов и протоколов 2.0
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Управление эталонными нозологиями, ортопедическими тестами и пресетами аппаратного обследования
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            size="small"
            onChange={(_, val) => val && setViewMode(val)}
            sx={{ bgcolor: '#F1F5F9', p: 0.3, borderRadius: 2 }}
          >
            <ToggleButton
              value="templates"
              sx={{
                fontWeight: 700,
                px: 2,
                py: 0.6,
                textTransform: 'none',
                fontSize: '0.82rem',
                border: 'none',
                borderRadius: '6px !important',
                '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#0F3C64', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              }}
            >
              <ArticleIcon sx={{ fontSize: 18, mr: 0.75 }} /> Шаблоны протоколов ({templates.length})
            </ToggleButton>
            <ToggleButton
              value="diagnostics"
              sx={{
                fontWeight: 700,
                px: 2,
                py: 0.6,
                textTransform: 'none',
                fontSize: '0.82rem',
                border: 'none',
                borderRadius: '6px !important',
                '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#0284C7', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              }}
            >
              <BiotechIcon sx={{ fontSize: 18, mr: 0.75 }} /> Методы диагностики ({diagCatalog.length})
            </ToggleButton>
            <ToggleButton
              value="tests"
              sx={{
                fontWeight: 700,
                px: 2,
                py: 0.6,
                textTransform: 'none',
                fontSize: '0.82rem',
                border: 'none',
                borderRadius: '6px !important',
                '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#166534', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              }}
            >
              <HealingIcon sx={{ fontSize: 18, mr: 0.75 }} /> Ортопедические тесты ({testCatalog.length})
            </ToggleButton>
          </ToggleButtonGroup>

          {viewMode === 'templates' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              sx={{ fontWeight: 600, textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              Создать шаблон
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { fetchCatalogs(); fetchTemplates(); }}
            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
          >
            Обновить
          </Button>

          <Button
            variant="contained"
            startIcon={<ManualIcon />}
            onClick={() => navigate('/guide?section=section-ortho-templates')}
            sx={{
              bgcolor: '#0F3C64',
              '&:hover': { bgcolor: '#156C9C' },
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              whiteSpace: 'nowrap'
            }}
          >
            Инструкция к справочнику
          </Button>
        </Box>
      </Box>

      {viewMode === 'diagnostics' ? (
        <DiagnosticMethodsCatalogManager onCatalogChanged={() => { fetchCatalogs(); fetchTemplates(); }} />
      ) : viewMode === 'tests' ? (
        <OrthopedicTestsCatalogManager onCatalogChanged={() => { fetchCatalogs(); fetchTemplates(); }} />
      ) : (
        <>
          {/* Notifications */}
          {saveStatus.message && (
            <Alert
              severity={saveStatus.type as any}
              onClose={() => setSaveStatus({ type: '', message: '' })}
              sx={{ mb: 2 }}
            >
              {saveStatus.message}
            </Alert>
          )}

          {/* Master Clusters Selection Bar - Multi-Resolution Responsive Layout */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.65,
              mb: 1.25,
              p: { xs: 0.85, md: 1 },
              bgcolor: '#FFFFFF',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              border: '1px solid #E2E8F0',
              flexShrink: 0
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
              const isSelected = selectedClusterFilter === c.id;
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
                  onClick={() => setSelectedClusterFilter(c.id)}
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

          {/* Master-Detail Split Grid */}
          <Grid container spacing={2} sx={{ flexGrow: 1, minHeight: 0, height: 'calc(100% - 100px)' }}>
            {/* LEFT MASTER PANEL: Templates Tree / List */}
            <Grid size={{ xs: 12, md: 4, lg: 3.5 }} sx={{ height: '100%', minHeight: 0 }}>
              <Paper sx={{ p: 1.75, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                {/* Search Input */}
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Поиск по названию, МКБ, стадии..."
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

                {/* Joint Filter Badges with counted numbers */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.25 }}>
                  {JOINT_OPTIONS.map(j => {
                    const count = jointCounts[j.key] || 0;
                    const isSelected = selectedJointFilter === j.key;
                    return (
                      <Chip
                        key={j.key}
                        label={`${j.label} (${count})`}
                        size="small"
                        clickable
                        color={isSelected ? 'primary' : 'default'}
                        variant={isSelected ? 'filled' : 'outlined'}
                        onClick={() => setSelectedJointFilter(j.key)}
                        sx={{
                          fontSize: '0.7rem',
                          height: 22,
                          fontWeight: isSelected ? 700 : 500,
                          borderColor: isSelected ? 'transparent' : '#CBD5E1'
                        }}
                      />
                    );
                  })}
                </Box>

                {/* Header Controls: Count, Custom Filter & Group toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pb: 0.75, borderBottom: '1px solid #E2E8F0', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
                    Найдено: <b>{filteredTemplates.length}</b> из {templates.length}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      icon={<StarIcon sx={{ fontSize: '13px !important', color: onlyCustomFilter ? '#FFF !important' : '#D97706 !important' }} />}
                      label="⭐ Только кастом"
                      size="small"
                      clickable
                      onClick={() => setOnlyCustomFilter(prev => !prev)}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        height: 22,
                        bgcolor: onlyCustomFilter ? '#D97706' : '#FEF3C7',
                        color: onlyCustomFilter ? '#FFFFFF' : '#92400E',
                        border: '1px solid #F59E0B',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: onlyCustomFilter ? '#B45309' : '#FDE68A' }
                      }}
                    />
                    <Button
                      size="small"
                      variant="text"
                      startIcon={groupByCluster ? <ArticleIcon sx={{ fontSize: 14 }} /> : <LayersIcon sx={{ fontSize: 14 }} />}
                      onClick={() => setGroupByCluster(prev => !prev)}
                      sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0, px: 0.75, fontWeight: 700 }}
                    >
                      {groupByCluster ? 'Списком' : 'По кластерам'}
                    </Button>
                  </Box>
                </Box>

                {/* Templates List */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
                  {loadingList ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : filteredTemplates.length === 0 ? (
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {onlyCustomFilter ? 'Кастомизированные авторские шаблоны не найдены' : 'Шаблоны не найдены'}
                      </Typography>
                      {(selectedClusterFilter !== 'all' || selectedJointFilter !== 'all' || searchQuery || onlyCustomFilter) && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedClusterFilter('all');
                            setSelectedJointFilter('all');
                            setSearchQuery('');
                            setOnlyCustomFilter(false);
                          }}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          Сбросить фильтры
                        </Button>
                      )}
                    </Box>
                  ) : groupByCluster && groupedTemplates ? (
                    groupedTemplates.map(grp => (
                      <Box key={grp.cluster.id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 0.5 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: grp.cluster.badge_color }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {grp.cluster.name_ru}
                          </Typography>
                          <Chip
                            label={grp.items.length}
                            size="small"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#F1F5F9' }}
                          />
                        </Box>
                        {grp.items.map(t => {
                          const isSelected = selectedTemplateId === t.id;
                          const cluster = MASTER_CLUSTERS.find(c => c.id === t.cluster_id) || grp.cluster;
                          const clusterColor = cluster?.badge_color || '#94A3B8';
                          const isCustom = t.is_custom === 1 || t.is_custom === true || t.category === 'Кастомизированный шаблон';

                          return (
                            <Card
                              key={t.id}
                              variant="outlined"
                              onClick={() => loadTemplateDetail(t.id)}
                              sx={{
                                mb: 1,
                                cursor: 'pointer',
                                borderRadius: 1.5,
                                borderColor: isSelected ? '#156C9C' : isCustom ? '#FCD34D' : '#E2E8F0',
                                borderLeft: `4px solid ${isCustom ? '#F59E0B' : clusterColor}`,
                                borderWidth: isSelected ? 2 : 1,
                                bgcolor: isSelected ? '#F0F7FF' : isCustom ? '#FFFDF5' : '#FFFFFF',
                                transition: 'all 0.15s ease-in-out',
                                '&:hover': {
                                  borderColor: isCustom ? '#F59E0B' : '#156C9C',
                                  transform: 'translateY(-1px)',
                                  boxShadow: isCustom ? '0 2px 8px rgba(245,158,11,0.15)' : '0 2px 8px rgba(0,0,0,0.06)'
                                }
                              }}
                            >
                              <CardContent sx={{ p: '10px !important' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {isCustom && (
                                      <Chip
                                        icon={<StarIcon sx={{ fontSize: '11px !important', color: '#B45309 !important' }} />}
                                        label="Авторский"
                                        size="small"
                                        sx={{
                                          bgcolor: '#FEF3C7',
                                          color: '#92400E',
                                          fontSize: '0.62rem',
                                          fontWeight: 800,
                                          height: 18,
                                          borderRadius: '4px',
                                          border: '1px solid #FCD34D'
                                        }}
                                      />
                                    )}
                                    <Chip
                                      label={cluster?.code || 'CL'}
                                      size="small"
                                      sx={{
                                        bgcolor: clusterColor,
                                        color: '#fff',
                                        fontSize: '0.62rem',
                                        fontWeight: 800,
                                        height: 18,
                                        borderRadius: '4px'
                                      }}
                                    />
                                    <Chip
                                      label={t.default_mkb_code || 'Без МКБ'}
                                      size="small"
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: '0.68rem',
                                        height: 18,
                                        bgcolor: isSelected ? '#156C9C' : '#F1F5F9',
                                        color: isSelected ? '#fff' : '#334155'
                                      }}
                                    />
                                  </Box>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                    {t.joint_name}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.3, lineHeight: 1.3 }}>
                                  <LatexText text={t.title} />
                                </Typography>
                                {isCustom && t.author_doctor_name && (
                                  <Typography variant="caption" sx={{ display: 'block', color: '#B45309', fontWeight: 600, mb: 0.3, fontSize: '0.68rem' }}>
                                    ⭐ Автор: {t.author_doctor_name}
                                  </Typography>
                                )}
                                {t.stage_or_severity && (
                                  <Typography variant="caption" sx={{ display: 'block', color: '#0284C7', fontWeight: 600, mb: 0.5, fontSize: '0.68rem' }}>
                                    <LatexText text={t.stage_or_severity} />
                                  </Typography>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Chip
                                      label={`${t.tests_count || 0} тестов`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.62rem', height: 18, borderColor: '#CBD5E1' }}
                                    />
                                    <Chip
                                      label={`${t.diagnostics_count || 0} диагн.`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.62rem', height: 18, borderColor: '#CBD5E1' }}
                                    />
                                    {(t.manipulations_count > 0 || t.physiotherapy_count > 0 || t.orthotics_count > 0) && (
                                      <Chip
                                        label={`${(t.manipulations_count || 0) + (t.physiotherapy_count || 0) + (t.orthotics_count || 0)} назн.`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: '0.62rem', height: 18, borderColor: '#5EEAD4', color: '#0F766E', bgcolor: '#F0FDFA' }}
                                      />
                                    )}
                                  </Box>
                                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                                    #{t.id}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Box>
                    ))
                  ) : (
                    filteredTemplates.map(t => {
                      const isSelected = selectedTemplateId === t.id;
                      const cluster = MASTER_CLUSTERS.find(c => c.id === t.cluster_id);
                      const clusterColor = cluster?.badge_color || '#94A3B8';
                      const isCustom = t.is_custom === 1 || t.is_custom === true || t.category === 'Кастомизированный шаблон';

                      return (
                        <Card
                          key={t.id}
                          variant="outlined"
                          onClick={() => loadTemplateDetail(t.id)}
                          sx={{
                            mb: 1,
                            cursor: 'pointer',
                            borderRadius: 1.5,
                            borderColor: isSelected ? '#156C9C' : isCustom ? '#FCD34D' : '#E2E8F0',
                            borderLeft: `4px solid ${isCustom ? '#F59E0B' : clusterColor}`,
                            borderWidth: isSelected ? 2 : 1,
                            bgcolor: isSelected ? '#F0F7FF' : isCustom ? '#FFFDF5' : '#FFFFFF',
                            transition: 'all 0.15s ease-in-out',
                            '&:hover': {
                              borderColor: isCustom ? '#F59E0B' : '#156C9C',
                              transform: 'translateY(-1px)',
                              boxShadow: isCustom ? '0 2px 8px rgba(245,158,11,0.15)' : '0 2px 8px rgba(0,0,0,0.06)'
                            }
                          }}
                        >
                          <CardContent sx={{ p: '10px !important' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {isCustom && (
                                  <Chip
                                    icon={<StarIcon sx={{ fontSize: '11px !important', color: '#B45309 !important' }} />}
                                    label="Авторский"
                                    size="small"
                                    sx={{
                                      bgcolor: '#FEF3C7',
                                      color: '#92400E',
                                      fontSize: '0.62rem',
                                      fontWeight: 800,
                                      height: 18,
                                      borderRadius: '4px',
                                      border: '1px solid #FCD34D'
                                    }}
                                  />
                                )}
                                <Chip
                                  label={cluster?.code || 'CL'}
                                  size="small"
                                  sx={{
                                    bgcolor: clusterColor,
                                    color: '#fff',
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    height: 18,
                                    borderRadius: '4px'
                                  }}
                                />
                                <Chip
                                  label={t.default_mkb_code || 'Без МКБ'}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.68rem',
                                    height: 18,
                                    bgcolor: isSelected ? '#156C9C' : '#F1F5F9',
                                    color: isSelected ? '#fff' : '#334155'
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                {t.joint_name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.3, lineHeight: 1.3 }}>
                              <LatexText text={t.title} />
                            </Typography>
                            {isCustom && t.author_doctor_name && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#B45309', fontWeight: 600, mb: 0.3, fontSize: '0.68rem' }}>
                                ⭐ Автор: {t.author_doctor_name}
                              </Typography>
                            )}
                            {t.stage_or_severity && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#0284C7', fontWeight: 600, mb: 0.5, fontSize: '0.68rem' }}>
                                <LatexText text={t.stage_or_severity} />
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Chip
                                  label={`${t.tests_count || 0} тестов`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.62rem', height: 18, borderColor: '#CBD5E1' }}
                                />
                                <Chip
                                  label={`${t.diagnostics_count || 0} диагн.`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.62rem', height: 18, borderColor: '#CBD5E1' }}
                                />
                                {(t.manipulations_count > 0 || t.physiotherapy_count > 0 || t.orthotics_count > 0) && (
                                  <Chip
                                    label={`${(t.manipulations_count || 0) + (t.physiotherapy_count || 0) + (t.orthotics_count || 0)} назн.`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.62rem', height: 18, borderColor: '#5EEAD4', color: '#0F766E', bgcolor: '#F0FDFA' }}
                                  />
                                )}
                              </Box>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                                #{t.id}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </Box>
              </Paper>
            </Grid>

        {/* RIGHT DETAIL PANEL: Editor & Live Preview */}
        <Grid size={{ xs: 12, md: 8, lg: 8.5 }} sx={{ height: '100%', minHeight: 0 }}>
          <Paper
            sx={{
              p: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 3 }
            }}
          >
            {loadingDetail ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : !currentTemplate ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="h6" color="text.secondary">
                  Выберите шаблон слева или нажмите «Создать шаблон»
                </Typography>
              </Box>
            ) : (
              <>
                {/* Header Action Bar */}
                <Box
                  sx={{
                    position: 'sticky',
                    top: -20,
                    zIndex: 10,
                    bgcolor: '#FFFFFF',
                    pt: 0.5,
                    pb: 1.5,
                    mb: 2,
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      {currentTemplate.id ? `Редактирование: ${currentTemplate.title}` : 'Новый клинический шаблон'}
                    </Typography>
                    {(currentTemplate.is_custom || currentTemplate.category === 'Кастомизированный шаблон') && (
                      <Chip
                        icon={<StarIcon sx={{ fontSize: '13px !important', color: '#B45309 !important' }} />}
                        label="⭐ Авторский кастом"
                        size="small"
                        sx={{
                          bgcolor: '#FEF3C7',
                          color: '#92400E',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          border: '1px solid #FCD34D'
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {currentTemplate.id && (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CloneIcon />}
                          onClick={handleClone}
                          sx={{ textTransform: 'none' }}
                        >
                          Клонировать
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={handleDelete}
                          sx={{ textTransform: 'none' }}
                        >
                          В архив
                        </Button>
                      </>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      sx={{ fontWeight: 700, textTransform: 'none', px: 2.5 }}
                    >
                      Сохранить шаблон
                    </Button>
                  </Box>
                </Box>

                {/* Primary Metadata Form */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Название клинического шаблона"
                      size="small"
                      fullWidth
                      required
                      value={currentTemplate.title}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, title: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Клинический кластер (1 из 10)</InputLabel>
                      <Select
                        label="Клинический кластер (1 из 10)"
                        value={currentTemplate.cluster_id || 'cluster_knee'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = MASTER_CLUSTERS.find(c => c.id === val);
                          setCurrentTemplate({
                            ...currentTemplate,
                            cluster_id: val,
                            cluster_name: found ? found.name_ru : currentTemplate.cluster_name
                          });
                        }}
                      >
                        {MASTER_CLUSTERS.filter(c => c.id !== 'all').map(c => (
                          <MenuItem key={c.id} value={c.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.badge_color, flexShrink: 0 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name_ru}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>[{c.code}]</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Анатомический сустав</InputLabel>
                      <Select
                        label="Анатомический сустав"
                        value={currentTemplate.joint_name}
                        onChange={(e) => setCurrentTemplate({ ...currentTemplate, joint_name: e.target.value })}
                      >
                        <MenuItem value="knee">Коленный сустав (Knee)</MenuItem>
                        <MenuItem value="elbow">Локтевой сустав (Elbow)</MenuItem>
                        <MenuItem value="shoulder">Плечевой сустав (Shoulder)</MenuItem>
                        <MenuItem value="hip">Тазобедренный сустав (Hip)</MenuItem>
                        <MenuItem value="ankle">Стопа и голеностоп (Ankle/Foot)</MenuItem>
                        <MenuItem value="wrist">Лучезапястный и кисть (Wrist/Hand)</MenuItem>
                        <MenuItem value="spine">Позвоночник (Spine)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Код МКБ-10"
                      size="small"
                      fullWidth
                      value={currentTemplate.default_mkb_code || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, default_mkb_code: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Сторона по умолчанию</InputLabel>
                      <Select
                        label="Сторона по умолчанию"
                        value={currentTemplate.default_side || 'right'}
                        onChange={(e) => setCurrentTemplate({ ...currentTemplate, default_side: e.target.value })}
                      >
                        <MenuItem value="right">Правая (Right)</MenuItem>
                        <MenuItem value="left">Левая (Left)</MenuItem>
                        <MenuItem value="bilateral">Двусторонний процесс</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Стадия / Степень / Фаза"
                      size="small"
                      fullWidth
                      placeholder="Напр. II стадия, подострое"
                      value={currentTemplate.stage_or_severity || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, stage_or_severity: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Клиническая категория / Нозологическая группа"
                      size="small"
                      fullWidth
                      value={currentTemplate.category || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, category: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Автор протокола (Врач)"
                      size="small"
                      fullWidth
                      placeholder="Напр. Иванов И.И."
                      value={currentTemplate.author_doctor_name || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, author_doctor_name: e.target.value })}
                      helperText={currentTemplate.is_custom ? '⭐ Кастомизированный авторский шаблон' : ''}
                    />
                  </Grid>
                </Grid>

                {/* Tabs Bar */}
                <Box
                  sx={{
                    position: 'sticky',
                    top: 40,
                    zIndex: 9,
                    bgcolor: '#FFFFFF',
                    borderBottom: '2px solid #E2E8F0',
                    mb: 2.5,
                    flexShrink: 0
                  }}
                >
                  <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    variant="standard"
                    sx={{
                      minHeight: 40,
                      width: '100%',
                      '& .MuiTabs-indicator': {
                        display: 'none'
                      },
                      '& .MuiTabs-scroller': {
                        overflow: 'visible !important'
                      },
                      '& .MuiTabs-flexContainer': {
                        display: 'flex',
                        flexWrap: 'wrap',
                        width: '100%',
                        gap: 0.75
                      },
                      '& .MuiTab-root': {
                        flex: {
                          xs: '1 1 calc(50% - 6px)',
                          sm: '1 1 calc(25% - 6px)',
                          lg: '1 1 0px'
                        },
                        minWidth: 0,
                        maxWidth: 'none',
                        minHeight: 38,
                        p: { xs: 0.5, sm: 0.75 },
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: { xs: '0.73rem', sm: '0.75rem', xl: '0.78rem' },
                        borderRadius: 1.5,
                        border: '1px solid #E2E8F0',
                        bgcolor: '#F8FAFC',
                        color: '#475569',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': {
                          color: '#0F3C64',
                          bgcolor: '#F1F5F9',
                          borderColor: '#CBD5E1'
                        },
                        '&.Mui-selected': {
                          color: '#0284C7',
                          bgcolor: '#F0F9FF',
                          borderColor: '#38BDF8',
                          borderWidth: '1.5px',
                          fontWeight: 800,
                          boxShadow: '0 1px 4px rgba(2, 132, 199, 0.12)'
                        }
                      }
                    }}
                  >
                    {[
                      {
                        index: 0,
                        shortCaption: '1. Жалобы',
                        fullTitle: '1. Жалобы и Объективный статус',
                        description: 'Жалобы пациента, Anamnesis morbi, Anamnesis vitae, общий соматический статус (Status praesens) и локальный статус (Status localis).',
                        icon: <HospitalIcon sx={{ fontSize: 16 }} />
                      },
                      {
                        index: 1,
                        shortCaption: '2. ROM',
                        fullTitle: '2. Гониометрия объема движений (ROM / SFTR)',
                        description: 'Гониометрия активных и пассивных углов по системе Neutral-0, сгибательные/разгибательные контрактуры, дефицит движения и клиническая оценка.',
                        icon: <RomIcon sx={{ fontSize: 16 }} />
                      },
                      {
                        index: 2,
                        shortCaption: '3. Тесты',
                        badgeCount: currentTemplate.tests.length,
                        fullTitle: '3. Специальные ортопедические тесты',
                        description: 'Клинические провокационные тесты: Tier 1 (патогномоничные), Tier 2 (верификация), Tier 3 (экспертные) с оценкой чувствительности и специфичности.',
                        icon: <HealingIcon sx={{ fontSize: 16 }} />
                      },
                      {
                        index: 3,
                        shortCaption: '4. Диагностика',
                        badgeCount: currentTemplate.diagnostics.length,
                        fullTitle: '4. План обследования (Инструментальная и лабораторная диагностика)',
                        description: 'Рентгенография, МРТ, КТ, УЗИ суставов, лабораторные анализы, критерии назначения и сопоставление с прайсом клиники.',
                        icon: <BiotechIcon sx={{ fontSize: 16 }} />
                      },
                      {
                        index: 4,
                        shortCaption: '5. Манипуляции',
                        badgeCount: currentTemplate.manipulations?.length || 0,
                        fullTitle: '5. Лечебные манипуляции и инъекционная терапия',
                        description: 'Лечебно-медикаментозные блокады, пункции суставов, параартикулярные инъекции, гиалуроновая кислота, PRP-терапия и кинезиотейпирование.',
                        icon: <MedicalServicesIcon sx={{ fontSize: 16 }} />
                      },
                      {
                        index: 5,
                        shortCaption: '6. Физиотерапия',
                        badgeCount: currentTemplate.physiotherapy?.length || 0,
                        fullTitle: '6. Физиотерапия и аппаратное восстановительное лечение',
                        description: '1-я линия EBM (P1 патогенетический максимум), 2-я линия (P2 адъювантная), точная биофизическая дозировка, аппараты и CDSS STOP Red Flags.',
                        icon: <FitnessIcon sx={{ fontSize: 16 }} />
                      },
                      {
                        index: 6,
                        shortCaption: '7. Ортезирование',
                        badgeCount: currentTemplate.orthotics?.length || 0,
                        fullTitle: '7. Ортопедические изделия и разгрузка',
                        description: 'Шарнирные ортезы, жесткие туторы, мягкие бандажи, индивидуальные ортопедические стельки, разгрузочные костыли/трости и схема ношения.',
                        icon: <ShieldIcon sx={{ fontSize: 16 }} />
                      },
                      {
                        index: 7,
                        shortCaption: '8. Протокол A4',
                        fullTitle: '8. Предпросмотр эталонного протокола осмотра (A4)',
                        description: 'Финальный клинический протокол для амбулаторной медкарты (ЭМК), печать официального бланка на листе A4 и экспорт очищенного текста.',
                        icon: <PreviewIcon sx={{ fontSize: 16 }} />
                      }
                    ].map((tab) => (
                      <Tab
                        key={tab.index}
                        label={
                          <Tooltip
                            title={
                              <Box sx={{ p: 0.75, maxWidth: 320 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#FFFFFF', mb: 0.35, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {tab.fullTitle}
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: '#E2E8F0', lineHeight: 1.45 }}>
                                  {tab.description}
                                </Typography>
                              </Box>
                            }
                            arrow
                            placement="bottom"
                            enterDelay={150}
                            leaveDelay={100}
                          >
                            <Box
                              sx={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 0.5,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden'
                              }}
                            >
                              {tab.icon}
                              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {tab.shortCaption}
                              </Box>
                              {tab.badgeCount !== undefined && (
                                <Chip
                                  label={tab.badgeCount}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    minWidth: 18,
                                    fontSize: '0.64rem',
                                    fontWeight: 800,
                                    px: 0.3,
                                    bgcolor: activeTab === tab.index ? '#0284C7' : '#E2E8F0',
                                    color: activeTab === tab.index ? '#FFFFFF' : '#475569',
                                    transition: 'all 0.15s ease'
                                  }}
                                />
                              )}
                            </Box>
                          </Tooltip>
                        }
                      />
                    ))}
                  </Tabs>
                </Box>

                {/* TAB 0: Complaints, Anamnesis & Objective */}
                {activeTab === 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, pb: 4 }}>
                    <TextField
                      label="Жалобы"
                      multiline
                      minRows={2.5}
                      fullWidth
                      value={currentTemplate.complaints_template || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, complaints_template: e.target.value })}
                      placeholder="Боль по передней поверхности колена при нагрузке, спуске по лестнице..."
                    />
                    <TextField
                      label="Анамнез заболевания (Anamnesis morbi)"
                      multiline
                      minRows={2.5}
                      fullWidth
                      value={currentTemplate.anamnesis_template || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, anamnesis_template: e.target.value })}
                      placeholder="Боли нарастали в течение 3 месяцев после физической нагрузки..."
                    />
                    <TextField
                      label="Анамнез жизни (Anamnesis vitae)"
                      multiline
                      minRows={2.5}
                      fullWidth
                      value={currentTemplate.anamnesis_vitae_template || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, anamnesis_vitae_template: e.target.value })}
                      placeholder="Аллергологический статус, сопутствующие заболевания, перенесенные вмешательства..."
                    />
                    <TextField
                      label="Общий объективный статус (Status praesens)"
                      multiline
                      minRows={2.5}
                      fullWidth
                      value={currentTemplate.objective_status_template || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, objective_status_template: e.target.value })}
                      placeholder="Общее состояние, телосложение, гемодинамика, кожные покровы, периферические отеки..."
                    />
                    <TextField
                      label="Объективный локальный ортопедический статус (Status localis)"
                      multiline
                      minRows={3}
                      fullWidth
                      value={currentTemplate.objective_template || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, objective_template: e.target.value })}
                      placeholder="Умеренный отек, болезненность суставной щели, деформация оси..."
                    />
                    <TextField
                      label="Специальные методы исследования (МРТ, КТ, рентген, УЗИ, анализы)"
                      multiline
                      minRows={2.5}
                      fullWidth
                      value={currentTemplate.special_studies_template || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, special_studies_template: e.target.value })}
                      placeholder="Рентгенологические критерии, МРТ-заключение, сонография, лабораторные маркеры..."
                    />
                    <TextField
                      label="Выполненные манипуляции на приеме (блокады, пункции, инъекции)"
                      multiline
                      minRows={2.5}
                      fullWidth
                      value={currentTemplate.performed_manipulations_template || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, performed_manipulations_template: e.target.value })}
                      placeholder="Внутрисуставная пункция, блокада ГКС, введение гиалуроновой кислоты/PRP, повязка..."
                    />
                    <TextField
                      label="Рекомендации и консервативное лечение"
                      multiline
                      minRows={3}
                      fullWidth
                      value={currentTemplate.recommendations_template || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, recommendations_template: e.target.value })}
                      placeholder="Ограничение ударных нагрузок, эластичное бинтование, гимнастика..."
                    />
                  </Box>
                )}

                {/* TAB 1: ROM Goniometry */}
                {activeTab === 1 && (() => {
                  const jointRomCfg = resolveRomConfig(currentTemplate);
                  const romData = currentTemplate.rom_norm_preset || {};
                  const sftr = computeSftrFormula(jointRomCfg.category, romData);
                  const severity = getRomSeverityBadge(romData);
                  const priorityBadge = getRomPriorityBadge(romData.priority || currentTemplate.rom_priority || 'P2');
                  const hasStopWarning = Boolean(romData.cdss_stop_warning || currentTemplate.rom_has_stop_warning === 1 || priorityBadge.code === 'P0-STOP');

                  const handleUpdateRomField = (fieldKey: string, value: any) => {
                    const updatedRom = {
                      ...currentTemplate.rom_norm_preset,
                      joint_category: jointRomCfg.category,
                      [fieldKey]: value
                    };
                    setCurrentTemplate({
                      ...currentTemplate,
                      rom_norm_preset: updatedRom
                    });
                  };

                  const handleMicroStep = (fieldKey: string, delta: number, minVal: number = -30, maxVal: number = 180) => {
                    const currentVal = Number(romData[fieldKey]) || 0;
                    const nextVal = Math.min(maxVal, Math.max(minVal, currentVal + delta));
                    handleUpdateRomField(fieldKey, nextVal);
                  };

                  const handleApplyPreset = (presetType: 'norm' | 'mild' | 'severe') => {
                    let sourceVals: Record<string, any> = {};
                    let severityLevel = 'normal';
                    let interp = '';

                    if (presetType === 'norm') {
                      sourceVals = jointRomCfg.defaultNorm;
                      severityLevel = 'normal';
                      interp = `Анатомический объем движений сустава (${jointRomCfg.titleRu}) сохранен в полном объеме, дефицита нет.`;
                    } else if (presetType === 'mild') {
                      sourceVals = jointRomCfg.defaultMild;
                      severityLevel = 'mild';
                      interp = `Легкое болевое ограничение крайних углов биомеханики сустава (${jointRomCfg.titleRu}), функциональный диапазон достаточен.`;
                    } else {
                      sourceVals = jointRomCfg.defaultSevere;
                      severityLevel = 'severe';
                      interp = `Выраженное ограничение подвижности / контрактура сустава (${jointRomCfg.titleRu}) со стойким функциональным дефицитом.`;
                    }

                    const newRom = {
                      ...currentTemplate.rom_norm_preset,
                      joint_category: jointRomCfg.category,
                      ...sourceVals,
                      severity_level: severityLevel,
                      clinical_interpretation: interp
                    };
                    newRom.sftr_notation = computeSftrFormula(jointRomCfg.category, newRom);

                    setCurrentTemplate({
                      ...currentTemplate,
                      rom_norm_preset: newRom
                    });
                  };

                  // Active vs Passive Lag Calculation
                  const flexAct = romData.flexion_active !== undefined ? Number(romData.flexion_active) : undefined;
                  const flexPass = romData.flexion_passive !== undefined ? Number(romData.flexion_passive) : undefined;
                  const hasLagData = flexAct !== undefined && flexPass !== undefined;
                  const flexionLag = hasLagData ? Math.max(0, (flexPass || 0) - (flexAct || 0)) : 0;

                  // Filter axes by romPriorityFilter
                  const filteredAxes = jointRomCfg.axes.filter((axis) => {
                    if (romPriorityFilter === 'ALL') return true;
                    return (axis.priority || 'P2') === romPriorityFilter;
                  });

                  return (
                    <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                      {/* Top Header Card with Fast Copy Pills */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          mb: 2,
                          borderRadius: 2,
                          bgcolor: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 1.5
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 46,
                              height: 46,
                              borderRadius: 2,
                              bgcolor: `${jointRomCfg.iconColor}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: jointRomCfg.iconColor
                            }}
                          >
                            <RomIcon sx={{ fontSize: 30 }} />
                          </Box>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                                {jointRomCfg.titleRu}
                              </Typography>
                              <Chip
                                label={jointRomCfg.titleLat}
                                size="small"
                                sx={{ fontStyle: 'italic', fontSize: '0.72rem', height: 20, bgcolor: '#F1F5F9', color: '#475569' }}
                              />
                              {/* Clinical Priority Badge */}
                              <Chip
                                icon={priorityBadge.code === 'P0-STOP' ? <LockIcon sx={{ fontSize: '0.9rem !important', color: `${priorityBadge.color} !important` }} /> : <BoltIcon sx={{ fontSize: '0.9rem !important', color: `${priorityBadge.color} !important` }} />}
                                label={priorityBadge.label}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: '0.72rem',
                                  height: 22,
                                  bgcolor: priorityBadge.bg,
                                  color: priorityBadge.color,
                                  border: `1px solid ${priorityBadge.border}`
                                }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              Стандарт клинической гониометрии Neutral-0 (SFTR система АТОР / AAOS) • Шаблон #{currentTemplate.id}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          {/* SFTR Pill with Click-to-Copy */}
                          <Tooltip title={copiedSftr ? "Скопировано в буфер обмена!" : "Нажмите, чтобы скопировать SFTR формулу"} arrow>
                            <Chip
                              icon={<ContentCopyIcon sx={{ fontSize: '0.9rem !important', color: '#FFFFFF !important' }} />}
                              label={`SFTR: ${sftr}`}
                              onClick={() => {
                                navigator.clipboard.writeText(sftr);
                                setCopiedSftr(true);
                                setTimeout(() => setCopiedSftr(false), 2000);
                              }}
                              sx={{
                                fontWeight: 800,
                                bgcolor: copiedSftr ? '#16A34A' : '#0F3C64',
                                color: '#FFFFFF',
                                fontSize: '0.82rem',
                                height: 30,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': { bgcolor: '#0A2540' }
                              }}
                            />
                          </Tooltip>

                          {/* Severity Badge */}
                          <Chip
                            label={severity.label}
                            sx={{
                              fontWeight: 700,
                              bgcolor: severity.bg,
                              color: severity.color,
                              border: `1px solid ${severity.border}`,
                              fontSize: '0.75rem',
                              height: 30
                            }}
                          />

                          {/* Fast Clinical Summary Copy button */}
                          <Tooltip title={copiedRomSummary ? "Клиническая сводка скопирована!" : "Скопировать полную сводку ROM для Status Localis"} arrow>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ContentCopyIcon />}
                              onClick={() => {
                                const summary = formatRomClinicalSummary(romData, currentTemplate);
                                navigator.clipboard.writeText(summary);
                                setCopiedRomSummary(true);
                                setTimeout(() => setCopiedRomSummary(false), 2000);
                              }}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                color: copiedRomSummary ? '#16A34A' : '#0F3C64',
                                borderColor: copiedRomSummary ? '#86EFAC' : '#CBD5E1',
                                bgcolor: copiedRomSummary ? '#F0FDF4' : '#F8FAFC',
                                height: 30,
                                '&:hover': { bgcolor: '#F1F5F9' }
                              }}
                            >
                              {copiedRomSummary ? 'Скопировано!' : 'Сводка ROM'}
                            </Button>
                          </Tooltip>
                        </Box>
                      </Paper>

                      {/* CDSS Red Flag STOP Warning Banner */}
                      {hasStopWarning && (
                        <Alert
                          severity="error"
                          variant="filled"
                          icon={<LockIcon fontSize="inherit" />}
                          sx={{
                            mb: 2,
                            borderRadius: 2,
                            bgcolor: '#991B1B',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 14px rgba(185, 28, 28, 0.3)',
                            '& .MuiAlert-icon': { color: '#FECACA' }
                          }}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 900, letterSpacing: 0.5, color: '#FEF2F2' }}>
                                CDSS STOP RED FLAG / КЛИНИЧЕСКИЙ СТОП-СИГНАЛ БЕЗОПАСНОСТИ:
                              </Typography>
                              <Chip
                                label="P0-STOP"
                                size="small"
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 900, bgcolor: '#FEE2E2', color: '#991B1B' }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#FEE2E2', lineHeight: 1.45 }}>
                              {romData.cdss_stop_warning || 'Категорически запрещены форсированные движения, пассивная редрессация и осевая нагрузка до хирургической стабилизации или консолидации повреждения!'}
                            </Typography>
                          </Box>
                        </Alert>
                      )}

                      {/* Quick Presets Toolbar & Priority Filter */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        {/* Priority Filter Chips */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', mr: 0.5 }}>
                            Оси движения:
                          </Typography>
                          {[
                            { id: 'ALL', label: `Все (${jointRomCfg.axes.length})` },
                            { id: 'P1', label: `⭐ P1 Критические (${jointRomCfg.axes.filter(a => (a.priority || 'P2') === 'P1').length})` },
                            { id: 'P2', label: `🎯 P2 Функциональные (${jointRomCfg.axes.filter(a => (a.priority || 'P2') === 'P2').length})` },
                            { id: 'P3', label: `🔍 P3 Дифференц. (${jointRomCfg.axes.filter(a => (a.priority || 'P2') === 'P3').length})` }
                          ].map(f => (
                            <Chip
                              key={f.id}
                              label={f.label}
                              size="small"
                              clickable
                              onClick={() => setRomPriorityFilter(f.id as any)}
                              sx={{
                                fontSize: '0.72rem',
                                fontWeight: romPriorityFilter === f.id ? 800 : 600,
                                bgcolor: romPriorityFilter === f.id ? '#0F3C64' : '#FFFFFF',
                                color: romPriorityFilter === f.id ? '#FFFFFF' : '#475569',
                                border: `1px solid ${romPriorityFilter === f.id ? '#0F3C64' : '#CBD5E1'}`,
                                height: 24,
                                '&:hover': { bgcolor: romPriorityFilter === f.id ? '#0A2540' : '#F1F5F9' }
                              }}
                            />
                          ))}
                        </Box>

                        {/* Presets Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleApplyPreset('norm')}
                            startIcon={<CheckCircleIcon />}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              color: '#16A34A',
                              borderColor: '#86EFAC',
                              bgcolor: '#F0FDF4',
                              height: 28,
                              '&:hover': { bgcolor: '#DCFCE7', borderColor: '#4ADE80' }
                            }}
                          >
                            Анатомическая норма (100%)
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleApplyPreset('mild')}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              color: '#0284C7',
                              borderColor: '#BAE6FD',
                              bgcolor: '#F0F9FF',
                              height: 28,
                              '&:hover': { bgcolor: '#E0F2FE', borderColor: '#38BDF8' }
                            }}
                          >
                            Умеренное ограничение
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleApplyPreset('severe')}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              color: '#DC2626',
                              borderColor: '#FCA5A5',
                              bgcolor: '#FEF2F2',
                              height: 28,
                              '&:hover': { bgcolor: '#FEE2E2', borderColor: '#F87171' }
                            }}
                          >
                            Контрактура / Ригидность
                          </Button>
                        </Box>
                      </Box>

                      {/* Biomechanical Axes Grid */}
                      <Grid container spacing={2} sx={{ mb: 2.5 }}>
                        {filteredAxes.map((axis) => {
                          const currentVal = romData[axis.key];
                          const status = evaluateRomAxisStatus(axis, currentVal);
                          const axisPriority = axis.priority || 'P2';
                          const pBadge = getRomPriorityBadge(axisPriority);

                          // Visual Range Progress Calculation
                          const normMax = axis.normMax || 150;
                          const numVal = currentVal !== undefined && currentVal !== '' ? Number(currentVal) : 0;
                          const progressPct = axis.isDeficit
                            ? Math.max(0, 100 - (numVal / 30) * 100)
                            : Math.min(100, Math.max(0, Math.round((numVal / (normMax || 1)) * 100)));

                          // Determine progress bar color
                          let progressColor = '#16A34A'; // green
                          if (status.isAbnormal) {
                            progressColor = (axis.isDeficit && numVal > 15) || (!axis.isDeficit && progressPct < 60)
                              ? '#DC2626'
                              : '#D97706';
                          }

                          return (
                            <Grid key={axis.key} size={{ xs: 12, sm: 6, md: 4 }}>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 1.75,
                                  borderRadius: 2,
                                  border: status.isAbnormal ? `1.5px solid ${status.color}` : '1px solid #CBD5E1',
                                  bgcolor: '#FFFFFF',
                                  transition: 'all 0.2s ease',
                                  boxShadow: status.isAbnormal ? `0 2px 10px ${status.color}25` : '0 1px 3px rgba(0,0,0,0.04)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  minHeight: 180
                                }}
                              >
                                <Box>
                                  {/* Axis Header */}
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                                    <Box sx={{ flex: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                                          {axis.labelRu}
                                        </Typography>
                                        <Chip
                                          label={pBadge.code}
                                          size="small"
                                          sx={{
                                            height: 16,
                                            fontSize: '0.62rem',
                                            fontWeight: 900,
                                            bgcolor: pBadge.bg,
                                            color: pBadge.color,
                                            border: `1px solid ${pBadge.border}`
                                          }}
                                        />
                                      </Box>
                                      <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.7rem' }}>
                                        {axis.labelLat}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={<Box component="span">Норма: <LatexText text={axis.normText} /></Box>}
                                      size="small"
                                      sx={{
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        bgcolor: '#F1F5F9',
                                        color: '#334155',
                                        height: 22,
                                        flexShrink: 0
                                      }}
                                    />
                                  </Box>

                                  {/* Input Field with Micro-steppers */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.25 }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleMicroStep(axis.key, axis.isDeficit ? -2 : -5)}
                                      sx={{
                                        minWidth: 32,
                                        width: 32,
                                        height: 36,
                                        p: 0,
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        borderColor: '#CBD5E1',
                                        color: '#475569',
                                        bgcolor: '#F8FAFC'
                                      }}
                                    >
                                      {axis.isDeficit ? '-2°' : '-5°'}
                                    </Button>

                                    <TextField
                                      type="number"
                                      size="small"
                                      fullWidth
                                      value={currentVal ?? ''}
                                      onChange={(e) => handleUpdateRomField(axis.key, e.target.value === '' ? '' : Number(e.target.value))}
                                      slotProps={{
                                        input: {
                                          endAdornment: (
                                            <Typography sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.85rem', ml: 0.5 }}>
                                              {axis.unit}
                                            </Typography>
                                          )
                                        }
                                      }}
                                      sx={{
                                        '& .MuiOutlinedInput-input': {
                                          fontWeight: 800,
                                          fontSize: '1rem',
                                          textAlign: 'center',
                                          color: status.isAbnormal ? status.color : '#0F3C64'
                                        }
                                      }}
                                    />

                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleMicroStep(axis.key, axis.isDeficit ? 2 : 5)}
                                      sx={{
                                        minWidth: 32,
                                        width: 32,
                                        height: 36,
                                        p: 0,
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        borderColor: '#CBD5E1',
                                        color: '#475569',
                                        bgcolor: '#F8FAFC'
                                      }}
                                    >
                                      {axis.isDeficit ? '+2°' : '+5°'}
                                    </Button>
                                  </Box>

                                  {/* Visual Range Progress Gauge */}
                                  <Box sx={{ mt: 1.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>
                                        {axis.isDeficit ? 'Дефицит разгибания' : `Диапазон: ${progressPct}% от нормы`}
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontWeight: 800, color: status.color, fontSize: '0.7rem' }}>
                                        {status.text}
                                      </Typography>
                                    </Box>
                                    <LinearProgress
                                      variant="determinate"
                                      value={progressPct}
                                      sx={{
                                        height: 6,
                                        borderRadius: 3,
                                        bgcolor: '#E2E8F0',
                                        '& .MuiLinearProgress-bar': {
                                          bgcolor: progressColor,
                                          borderRadius: 3
                                        }
                                      }}
                                    />
                                  </Box>
                                </Box>

                                {/* Clinical Footnote & Cutoff Alert */}
                                <Box sx={{ mt: 1.25, pt: 1, borderTop: '1px solid #F1F5F9' }}>
                                  {axis.cutoff_condition && status.isAbnormal && (
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#DC2626', fontSize: '0.68rem', display: 'block', mb: 0.25 }}>
                                      ⚡ Cutoff: {axis.cutoff_condition}
                                    </Typography>
                                  )}
                                  {axis.clinicalNote && (
                                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem', display: 'block' }}>
                                      <LatexText text={axis.clinicalNote} />
                                    </Typography>
                                  )}
                                </Box>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>

                      {/* AROM vs PROM Dissociation Bar (Active vs Passive Lag) */}
                      {hasLagData && (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            mb: 2.5,
                            borderRadius: 2,
                            bgcolor: flexionLag <= 5 ? '#F0FDF4' : flexionLag <= 15 ? '#FFFBEB' : '#FEF2F2',
                            border: `1.5px solid ${flexionLag <= 5 ? '#86EFAC' : flexionLag <= 15 ? '#FCD34D' : '#FCA5A5'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 1.5
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: flexionLag <= 5 ? '#DCFCE7' : flexionLag <= 15 ? '#FEF3C7' : '#FEE2E2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: flexionLag <= 5 ? '#16A34A' : flexionLag <= 15 ? '#D97706' : '#DC2626'
                              }}
                            >
                              <BoltIcon sx={{ fontSize: 22 }} />
                            </Box>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                  Диссоциация активного и пассивного движения (AROM vs PROM Lag):
                                </Typography>
                                <Chip
                                  label={`Δ = ${flexionLag}°`}
                                  size="small"
                                  sx={{
                                    fontWeight: 900,
                                    fontSize: '0.78rem',
                                    bgcolor: flexionLag <= 5 ? '#16A34A' : flexionLag <= 15 ? '#D97706' : '#DC2626',
                                    color: '#FFFFFF'
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.75rem' }}>
                                {flexionLag <= 5
                                  ? 'Физиологический лаг (≤ 5°): суставная капсула и сухожильно-мышечный аппарат работают синхронно.'
                                  : flexionLag <= 15
                                  ? 'Умеренная диссоциация (6°-15°): артрогенное мышечное торможение (AMI) или болевой спазм агонистов.'
                                  : 'КРИТИЧЕСКИЙ РАЗРЫВ AROM / PROM (> 15°): подозрение на структурный дефект / разрыв сухожилия или неврологический дефицит!'}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={`Активное (AROM): ${flexAct}°`} size="small" sx={{ fontWeight: 700, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1' }} />
                            <Chip label={`Пассивное (PROM): ${flexPass}°`} size="small" sx={{ fontWeight: 700, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1' }} />
                          </Box>
                        </Paper>
                      )}

                      {/* Cyriax End-Feel Matrix */}
                      <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                              Конечный упор движения по Цириаксу (Cyriax End-Feel):
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              Тактильное ощущение в крайней точке пассивного движения сустава
                            </Typography>
                          </Box>
                          {romData.end_feel_expected && (
                            <Chip
                              label={`Выбран: ${romData.end_feel_expected}`}
                              size="small"
                              sx={{ fontWeight: 800, bgcolor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
                            />
                          )}
                        </Box>

                        <Grid container spacing={1}>
                          {END_FEEL_OPTIONS.map((opt) => {
                            const isSelected = romData.end_feel_expected === opt.id || romData.end_feel_expected === opt.label;
                            return (
                              <Grid key={opt.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card
                                  variant="outlined"
                                  onClick={() => handleUpdateRomField('end_feel_expected', opt.id)}
                                  sx={{
                                    p: 1.25,
                                    cursor: 'pointer',
                                    borderRadius: 1.5,
                                    transition: 'all 0.15s ease',
                                    borderColor: isSelected ? '#0284C7' : '#E2E8F0',
                                    bgcolor: isSelected ? '#F0F9FF' : '#FFFFFF',
                                    borderWidth: isSelected ? '2px' : '1px',
                                    '&:hover': { borderColor: '#0284C7', bgcolor: '#F8FAFC' }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.82rem', color: isSelected ? '#0369A1' : '#0F172A' }}>
                                      {opt.label}
                                    </Typography>
                                    {opt.isPathological ? (
                                      <Chip label="Патология" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#FEE2E2', color: '#B91C1C' }} />
                                    ) : (
                                      <Chip label="Норма" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }} />
                                    )}
                                  </Box>
                                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem', display: 'block', lineHeight: 1.3 }}>
                                    {opt.description}
                                  </Typography>
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Paper>

                      {/* Special Measurements & Cutoffs Text (if present) */}
                      {(romData.special_measurements || romData.cutoffs_text) && (
                        <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1 }}>
                            Специальные антропометрические измерения и клинические пороги:
                          </Typography>
                          <Grid container spacing={2}>
                            {romData.special_measurements && (
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Box sx={{ p: 1.25, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px solid #CBD5E1' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                                    Специфические замеры (окружности / Schober / Ott / FFD):
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#1E293B' }}>
                                    {typeof romData.special_measurements === 'object'
                                      ? JSON.stringify(romData.special_measurements, null, 2)
                                      : String(romData.special_measurements)}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                            {romData.cutoffs_text && (
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Box sx={{ p: 1.25, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px solid #CBD5E1' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                                    Клинические пороги и критерии тяжести:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#1E293B' }}>
                                    {romData.cutoffs_text}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </Paper>
                      )}

                      {/* Clinical Interpretation & SFTR Formula Card */}
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                            Клиническое заключение и формула SFTR для протокола:
                          </Typography>
                          <Chip
                            label={<Box component="span">Формула SFTR: <LatexText text={sftr} /></Box>}
                            size="small"
                            sx={{ fontWeight: 700, bgcolor: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD' }}
                          />
                        </Box>
                        <TextField
                          multiline
                          rows={2.5}
                          fullWidth
                          size="small"
                          label="Клиническое описание гониометрии (вставляется в Status Localis)"
                          value={romData.clinical_interpretation || ''}
                          onChange={(e) => handleUpdateRomField('clinical_interpretation', e.target.value)}
                          placeholder="Опишите характер ограничения, конечный упор, дефицит разгибания или болезненную дугу..."
                          sx={{ bgcolor: '#F8FAFC' }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Формула Neutral-0, конечный упор и заключение автоматически переносятся в раздел 4 итогового протокола A4.
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              onClick={() => {
                                const autoFormula = computeSftrFormula(jointRomCfg.category, romData);
                                handleUpdateRomField('sftr_notation', autoFormula);
                              }}
                              sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              Пересчитать SFTR
                            </Button>
                          </Box>
                        </Box>
                      </Paper>
                    </Box>
                  );
                })()}

                {/* TAB 2: Orthopedic Tests */}
                {activeTab === 2 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                          Специальные ортопедические тесты шаблона ({currentTemplate.tests.length})
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          3 уровня приоритета EBM: Tier 1 (скрининг), Tier 2 (верификация), Tier 3 (экспертный)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleSetAllTestsNormal}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Все в норму (-)
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => setTestModalOpen(true)}
                          sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0F3C64', '&:hover': { bgcolor: '#156C9C' } }}
                        >
                          Добавить тест из каталога
                        </Button>
                      </Box>
                    </Box>

                    {/* Quick Filter Bar for Orthopedic Tests: Тип биомеханики / EBM */}
                    {currentTemplate.tests.length > 0 && (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.25,
                          px: 1.75,
                          mb: 2.25,
                          borderRadius: 2,
                          bgcolor: '#F8FAFC',
                          borderColor: '#E2E8F0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        {/* Row 1: Biomechanics Types */}
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mr: 0.5, minWidth: 155 }}>
                            <FilterListIcon sx={{ fontSize: 18, color: '#64748B' }} />
                            <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Биомеханика:
                            </Typography>
                          </Box>

                          <Chip
                            label={`Все типы (${currentTemplate.tests.length})`}
                            size="small"
                            clickable
                            onClick={() => setTestTypeFilter('all')}
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              height: 26,
                              bgcolor: testTypeFilter === 'all' ? '#0F3C64' : '#FFFFFF',
                              color: testTypeFilter === 'all' ? '#FFFFFF' : '#334155',
                              border: testTypeFilter === 'all' ? '1px solid #0F3C64' : '1px solid #CBD5E1',
                              '&:hover': {
                                bgcolor: testTypeFilter === 'all' ? '#156C9C' : '#F1F5F9'
                              }
                            }}
                          />

                          {Object.entries(TEST_TYPE_LABELS).map(([key, info]) => {
                            const count = testCounts.types[key] || 0;
                            if (count === 0 && testTypeFilter !== key) return null;
                            const isSelected = testTypeFilter === key;
                            return (
                              <Chip
                                key={key}
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                    <span>{info.label}</span>
                                    <span
                                      style={{
                                        backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : info.color + '20',
                                        color: isSelected ? '#FFFFFF' : info.color,
                                        padding: '1px 5px',
                                        borderRadius: 8,
                                        fontSize: '0.68rem',
                                        fontWeight: 800
                                      }}
                                    >
                                      {count}
                                    </span>
                                  </Box>
                                }
                                size="small"
                                clickable
                                onClick={() => setTestTypeFilter(isSelected ? 'all' : key)}
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  height: 26,
                                  bgcolor: isSelected ? info.color : info.bg,
                                  color: isSelected ? '#FFFFFF' : info.color,
                                  border: isSelected ? `1px solid ${info.color}` : `1px solid ${info.color}40`,
                                  '&:hover': {
                                    bgcolor: isSelected ? info.color : info.bg
                                  }
                                }}
                              />
                            );
                          })}
                        </Box>

                        {/* Row 2: EBM Criteria */}
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, pt: 0.75, borderTop: '1px dashed #E2E8F0' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mr: 0.5, minWidth: 155 }}>
                            <StarIcon sx={{ fontSize: 17, color: '#D97706' }} />
                            <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              EBM критерий:
                            </Typography>
                          </Box>

                          <Chip
                            label="Все EBM тесты"
                            size="small"
                            clickable
                            onClick={() => setTestEbmFilter('all')}
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              height: 26,
                              bgcolor: testEbmFilter === 'all' ? '#475569' : '#FFFFFF',
                              color: testEbmFilter === 'all' ? '#FFFFFF' : '#334155',
                              border: testEbmFilter === 'all' ? '1px solid #475569' : '1px solid #CBD5E1',
                              '&:hover': {
                                bgcolor: testEbmFilter === 'all' ? '#334155' : '#F1F5F9'
                              }
                            }}
                          />

                          {testCounts.supplemented > 0 && (
                            <Chip
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                  <span>⭐ Только EBM [ДОПОЛНЕНО]</span>
                                  <span
                                    style={{
                                      backgroundColor: testEbmFilter === 'supplemented' ? 'rgba(255,255,255,0.3)' : '#0284C720',
                                      color: testEbmFilter === 'supplemented' ? '#FFFFFF' : '#0284C7',
                                      padding: '1px 5px',
                                      borderRadius: 8,
                                      fontSize: '0.68rem',
                                      fontWeight: 800
                                    }}
                                  >
                                    {testCounts.supplemented}
                                  </span>
                                </Box>
                              }
                              size="small"
                              clickable
                              onClick={() => setTestEbmFilter(testEbmFilter === 'supplemented' ? 'all' : 'supplemented')}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                height: 26,
                                bgcolor: testEbmFilter === 'supplemented' ? '#0284C7' : '#F0F9FF',
                                color: testEbmFilter === 'supplemented' ? '#FFFFFF' : '#0284C7',
                                border: testEbmFilter === 'supplemented' ? '1px solid #0284C7' : '1px solid #BAE6FD',
                                '&:hover': {
                                  bgcolor: testEbmFilter === 'supplemented' ? '#0369A1' : '#E0F2FE'
                                }
                              }}
                            />
                          )}

                          {testCounts.levelA > 0 && (
                            <Chip
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                  <span>EBM Уровень A (Высокая точность)</span>
                                  <span
                                    style={{
                                      backgroundColor: testEbmFilter === 'level_a' ? 'rgba(255,255,255,0.3)' : '#16A34A20',
                                      color: testEbmFilter === 'level_a' ? '#FFFFFF' : '#16A34A',
                                      padding: '1px 5px',
                                      borderRadius: 8,
                                      fontSize: '0.68rem',
                                      fontWeight: 800
                                    }}
                                  >
                                    {testCounts.levelA}
                                  </span>
                                </Box>
                              }
                              size="small"
                              clickable
                              onClick={() => setTestEbmFilter(testEbmFilter === 'level_a' ? 'all' : 'level_a')}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                height: 26,
                                bgcolor: testEbmFilter === 'level_a' ? '#16A34A' : '#F0FDF4',
                                color: testEbmFilter === 'level_a' ? '#FFFFFF' : '#16A34A',
                                border: testEbmFilter === 'level_a' ? '1px solid #16A34A' : '1px solid #BBF7D0',
                                '&:hover': {
                                  bgcolor: testEbmFilter === 'level_a' ? '#15803D' : '#DCFCE7'
                                }
                              }}
                            />
                          )}

                          {testCounts.levelB > 0 && (
                            <Chip
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                  <span>EBM Уровень B (Умеренная точность)</span>
                                  <span
                                    style={{
                                      backgroundColor: testEbmFilter === 'level_b' ? 'rgba(255,255,255,0.3)' : '#2563EB20',
                                      color: testEbmFilter === 'level_b' ? '#FFFFFF' : '#2563EB',
                                      padding: '1px 5px',
                                      borderRadius: 8,
                                      fontSize: '0.68rem',
                                      fontWeight: 800
                                    }}
                                  >
                                    {testCounts.levelB}
                                  </span>
                                </Box>
                              }
                              size="small"
                              clickable
                              onClick={() => setTestEbmFilter(testEbmFilter === 'level_b' ? 'all' : 'level_b')}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                height: 26,
                                bgcolor: testEbmFilter === 'level_b' ? '#2563EB' : '#EFF6FF',
                                color: testEbmFilter === 'level_b' ? '#FFFFFF' : '#2563EB',
                                border: testEbmFilter === 'level_b' ? '1px solid #2563EB' : '1px solid #BFDBFE',
                                '&:hover': {
                                  bgcolor: testEbmFilter === 'level_b' ? '#1D4ED8' : '#DBEAFE'
                                }
                              }}
                            />
                          )}

                          {(testTypeFilter !== 'all' || testEbmFilter !== 'all') && (
                            <Button
                              size="small"
                              startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
                              onClick={() => {
                                setTestTypeFilter('all');
                                setTestEbmFilter('all');
                              }}
                              sx={{
                                ml: 'auto',
                                fontSize: '0.72rem',
                                textTransform: 'none',
                                color: '#64748B',
                                py: 0.25,
                                px: 1,
                                height: 24
                              }}
                            >
                              Сбросить фильтры
                            </Button>
                          )}
                        </Box>
                      </Paper>
                    )}

                    {currentTemplate.tests.length === 0 ? (
                      <Alert severity="info">В данном шаблоне нет привязанных ортопедических тестов. Нажмите «Добавить тест из каталога».</Alert>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {TEST_PRIORITY_TIERS.map(tier => {
                          const allTierTests = currentTemplate.tests.filter(t => (t.priority_level || 'medium') === tier.key);
                          const isFilterActive = testTypeFilter !== 'all' || testEbmFilter !== 'all';
                          const tierTests = allTierTests.filter(t => {
                            if (testTypeFilter !== 'all') {
                              const typeTag = (t.test_type_tag || t.test_type || 'provocative').toLowerCase();
                              if (typeTag !== testTypeFilter.toLowerCase()) return false;
                            }
                            if (testEbmFilter === 'supplemented') {
                              if (!(t.is_supplemented === 1 || t.is_supplemented === true)) return false;
                            } else if (testEbmFilter === 'level_a') {
                              if ((t.evidence_level || '').toUpperCase() !== 'A') return false;
                            } else if (testEbmFilter === 'level_b') {
                              if ((t.evidence_level || '').toUpperCase() !== 'B') return false;
                            }
                            return true;
                          });

                          return (
                            <Paper
                              key={tier.key}
                              variant="outlined"
                              sx={{
                                borderRadius: 2,
                                overflow: 'hidden',
                                borderColor: tier.border,
                                bgcolor: '#FFFFFF'
                              }}
                            >
                              {/* Tier Header */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 1.25,
                                  px: 2,
                                  bgcolor: tier.bg,
                                  borderBottom: `1px solid ${tier.border}`
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                  <Chip
                                    label={tier.short}
                                    size="small"
                                    sx={{
                                      fontWeight: 800,
                                      fontSize: '0.72rem',
                                      color: '#FFFFFF',
                                      bgcolor: tier.color,
                                      height: 22
                                    }}
                                  />
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E293B' }}>
                                    {tier.label}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={isFilterActive ? `Тестов: ${tierTests.length} из ${allTierTests.length}` : `Тестов: ${tierTests.length}`}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    bgcolor: '#FFFFFF',
                                    border: `1px solid ${tier.border}`,
                                    color: tier.color,
                                    height: 22
                                  }}
                                />
                              </Box>

                              {tierTests.length === 0 ? (
                                <Box sx={{ p: 2, textAlign: 'center', color: '#94A3B8' }}>
                                  <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                                    {isFilterActive
                                      ? 'Нет тестов с выбранными фильтрами биомеханики / EBM в данном уровне'
                                      : 'Нет тестов данного уровня в шаблоне'}
                                  </Typography>
                                </Box>
                              ) : (
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Тест / Проба</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Тип биомеханики / EBM</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 140 }}>Приоритет</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 160 }}>Ожидаемый результат</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 110 }}>Критичность</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 50 }} align="center">Инфо</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 50 }} align="center">Удалить</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {tierTests.map((t) => {
                                        const typeTag = t.test_type_tag || t.test_type || 'provocative';
                                        const typeInfo = TEST_TYPE_LABELS[typeTag];
                                        return (
                                          <TableRow key={t.test_code} hover>
                                            <TableCell>
                                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                                <LatexText text={t.name_ru || t.test_code} />
                                              </Typography>
                                              {t.name_lat && (
                                                <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#64748B', display: 'block' }}>
                                                  {t.name_lat}
                                                </Typography>
                                              )}
                                              {t.target_structure && (
                                                <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600 }}>
                                                  🎯 <LatexText text={t.target_structure} />
                                                </Typography>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                                                {typeInfo && (
                                                  <Chip
                                                    label={typeInfo.short}
                                                    size="small"
                                                    sx={{
                                                      height: 18,
                                                      fontSize: '0.62rem',
                                                      fontWeight: 700,
                                                      bgcolor: typeInfo.bg,
                                                      color: typeInfo.color,
                                                      border: `1px solid ${typeInfo.color}40`
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
                                                {(t.sensitivity_pct || t.specificity_pct) && (
                                                  <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>
                                                    {t.sensitivity_pct ? `Se:${t.sensitivity_pct}%` : ''} {t.specificity_pct ? `Sp:${t.specificity_pct}%` : ''}
                                                  </Typography>
                                                )}
                                              </Box>
                                            </TableCell>
                                            <TableCell>
                                              <Select
                                                size="small"
                                                value={t.priority_level || 'medium'}
                                                onChange={(e) => handleUpdateTestPriority(t.test_code, e.target.value)}
                                                sx={{ fontSize: '0.75rem', fontWeight: 700, height: 30 }}
                                              >
                                                <MenuItem value="high">Tier 1: Высокий</MenuItem>
                                                <MenuItem value="medium">Tier 2: Средний</MenuItem>
                                                <MenuItem value="low">Tier 3: Низкий</MenuItem>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select
                                                size="small"
                                                value={t.expected_result}
                                                onChange={(e) => handleUpdateTestExpected(t.test_code, e.target.value)}
                                                sx={{
                                                  fontSize: '0.78rem',
                                                  fontWeight: 700,
                                                  height: 30,
                                                  color: t.expected_result === 'positive' || t.expected_result.includes('positive') ? '#DC2626' : '#16A34A'
                                                }}
                                              >
                                                <MenuItem value="positive">Положительный (+)</MenuItem>
                                                <MenuItem value="negative">Отрицательный (-)</MenuItem>
                                                <MenuItem value="positive_medial">Положительный мед. (+)</MenuItem>
                                                <MenuItem value="positive_lateral">Положительный лат. (+)</MenuItem>
                                                <MenuItem value="not_tested">Не исследовался</MenuItem>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <FormControlLabel
                                                control={
                                                  <Switch
                                                    size="small"
                                                    checked={Boolean(t.is_mandatory)}
                                                    onChange={() => handleToggleTestMandatory(t.test_code)}
                                                  />
                                                }
                                                label={<Typography variant="caption" sx={{ fontSize: '0.72rem' }}>{t.is_mandatory ? 'Критичен' : 'Факульт.'}</Typography>}
                                              />
                                            </TableCell>
                                            <TableCell align="center">
                                              <IconButton
                                                size="small"
                                                color="info"
                                                onClick={() => {
                                                  const catalogItem = testCatalog.find(tc => tc.code === t.test_code);
                                                  if (catalogItem) setMethodInfoModal(catalogItem);
                                                }}
                                              >
                                                <InfoIcon fontSize="small" />
                                              </IconButton>
                                            </TableCell>
                                            <TableCell align="center">
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleRemoveTest(t.test_code)}
                                              >
                                                <DeleteIcon fontSize="small" />
                                              </IconButton>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              )}
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                )}

                {/* TAB 3: Diagnostics Presets */}
                {activeTab === 3 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                          Рекомендованный план обследования ({currentTemplate.diagnostics.length})
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          3 уровня стандартов: Tier 1 (базовый стандарт), Tier 2 (верификация), Tier 3 (экспертный)
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setDiagModalOpen(true)}
                        sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0F3C64', '&:hover': { bgcolor: '#156C9C' } }}
                      >
                        Добавить метод обследования
                      </Button>
                    </Box>

                    {/* Quick Filter Bar for Diagnostics: Модальность */}
                    {currentTemplate.diagnostics.length > 0 && (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.25,
                          px: 1.75,
                          mb: 2.25,
                          borderRadius: 2,
                          bgcolor: '#F8FAFC',
                          borderColor: '#E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 1
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mr: 0.5 }}>
                          <FilterListIcon sx={{ fontSize: 18, color: '#64748B' }} />
                          <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Модальность:
                          </Typography>
                        </Box>

                        <Chip
                          label={`Все модальности (${currentTemplate.diagnostics.length})`}
                          size="small"
                          clickable
                          onClick={() => setDiagModalityFilter('all')}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            height: 26,
                            bgcolor: diagModalityFilter === 'all' ? '#0F3C64' : '#FFFFFF',
                            color: diagModalityFilter === 'all' ? '#FFFFFF' : '#334155',
                            border: diagModalityFilter === 'all' ? '1px solid #0F3C64' : '1px solid #CBD5E1',
                            '&:hover': {
                              bgcolor: diagModalityFilter === 'all' ? '#156C9C' : '#F1F5F9'
                            }
                          }}
                        />

                        {Object.entries(DIAG_MODALITIES_MAP)
                          .filter(([key]) => key !== 'all' && (diagModalityCounts[key] || 0) > 0)
                          .map(([key, info]) => {
                            const count = diagModalityCounts[key] || 0;
                            const isSelected = diagModalityFilter === key;
                            return (
                              <Chip
                                key={key}
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                    <span>{info.short}</span>
                                    <span
                                      style={{
                                        backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : info.color + '20',
                                        color: isSelected ? '#FFFFFF' : info.color,
                                        padding: '1px 5px',
                                        borderRadius: 8,
                                        fontSize: '0.68rem',
                                        fontWeight: 800
                                      }}
                                    >
                                      {count}
                                    </span>
                                  </Box>
                                }
                                size="small"
                                clickable
                                onClick={() => setDiagModalityFilter(isSelected ? 'all' : key)}
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  height: 26,
                                  bgcolor: isSelected ? info.color : info.bg,
                                  color: isSelected ? '#FFFFFF' : info.color,
                                  border: isSelected ? `1px solid ${info.color}` : `1px solid ${info.color}40`,
                                  '&:hover': {
                                    bgcolor: isSelected ? info.color : `${info.bg}`
                                  }
                                }}
                              />
                            );
                          })}

                        {diagModalityFilter !== 'all' && (
                          <Button
                            size="small"
                            startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
                            onClick={() => setDiagModalityFilter('all')}
                            sx={{
                              ml: 'auto',
                              fontSize: '0.72rem',
                              textTransform: 'none',
                              color: '#64748B',
                              py: 0.25,
                              px: 1,
                              height: 24
                            }}
                          >
                            Сбросить фильтр
                          </Button>
                        )}
                      </Paper>
                    )}

                    {currentTemplate.diagnostics.length === 0 ? (
                      <Alert severity="info">В данном шаблоне не назначены методы обследования. Нажмите «Добавить метод обследования».</Alert>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {DIAG_PRIORITY_TIERS.map(tier => {
                          const allTierDiags = currentTemplate.diagnostics.filter(d => (d.priority_level || 'medium') === tier.key);
                          const isFilterActive = diagModalityFilter !== 'all';
                          const tierDiags = allTierDiags.filter(d => {
                            if (diagModalityFilter === 'all') return true;
                            return (d.modality || '').toLowerCase() === diagModalityFilter.toLowerCase();
                          });

                          return (
                            <Paper
                              key={tier.key}
                              variant="outlined"
                              sx={{
                                borderRadius: 2,
                                overflow: 'hidden',
                                borderColor: tier.border,
                                bgcolor: '#FFFFFF'
                              }}
                            >
                              {/* Tier Header */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 1.25,
                                  px: 2,
                                  bgcolor: tier.bg,
                                  borderBottom: `1px solid ${tier.border}`
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                  <Chip
                                    label={tier.short}
                                    size="small"
                                    sx={{
                                      fontWeight: 800,
                                      fontSize: '0.72rem',
                                      color: '#FFFFFF',
                                      bgcolor: tier.color,
                                      height: 22
                                    }}
                                  />
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E293B' }}>
                                    {tier.label}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={isFilterActive ? `Методов: ${tierDiags.length} из ${allTierDiags.length}` : `Методов: ${tierDiags.length}`}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    bgcolor: '#FFFFFF',
                                    border: `1px solid ${tier.border}`,
                                    color: tier.color,
                                    height: 22
                                  }}
                                />
                              </Box>

                              {tierDiags.length === 0 ? (
                                <Box sx={{ p: 2, textAlign: 'center', color: '#94A3B8' }}>
                                  <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                                    {isFilterActive
                                      ? `Нет методов модальности «${DIAG_MODALITIES_MAP[diagModalityFilter]?.short || diagModalityFilter.toUpperCase()}» в данном уровне`
                                      : 'Нет методов данного уровня в шаблоне'}
                                  </Typography>
                                </Box>
                              ) : (
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Метод обследования</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Модальность</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 140 }}>Приоритет</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Связанная услуга клиники</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 120 }}>Срочность</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 45 }} align="center">Инфо</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 50 }} align="center">Удалить</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {tierDiags.map((d) => (
                                        <TableRow key={d.diagnostic_code} hover>
                                          <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                              <LatexText text={d.name || d.diagnostic_code} />
                                            </Typography>
                                            {d.protocol_phrase && (
                                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                «<LatexText text={d.protocol_phrase} />»
                                              </Typography>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <Chip
                                              label={d.modality?.toUpperCase() || 'ДИАГН'}
                                              size="small"
                                              sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Select
                                              size="small"
                                              value={d.priority_level || 'medium'}
                                              onChange={(e) => handleUpdateDiagPriority(d.diagnostic_code, e.target.value)}
                                              sx={{ fontSize: '0.75rem', fontWeight: 700, height: 30 }}
                                            >
                                              <MenuItem value="high">Tier 1: Высокий</MenuItem>
                                              <MenuItem value="medium">Tier 2: Средний</MenuItem>
                                              <MenuItem value="low">Tier 3: Низкий</MenuItem>
                                            </Select>
                                          </TableCell>
                                          <TableCell>
                                            {d.servdict_price ? (
                                              <Chip
                                                label={`${d.servdict_price.toLocaleString('ru-RU')} ₽ (в кассу)`}
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                                sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                                              />
                                            ) : (
                                              <Typography variant="caption" color="text.secondary">
                                                Внешнее направление
                                              </Typography>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <Chip
                                              label={d.urgency === 'cito' ? 'CITO (Экстренно)' : 'Планово'}
                                              size="small"
                                              color={d.urgency === 'cito' ? 'error' : 'default'}
                                              sx={{ fontSize: '0.7rem' }}
                                            />
                                          </TableCell>
                                          <TableCell align="center">
                                            <IconButton
                                              size="small"
                                              color="info"
                                              title="Подробное клиническое описание метода диагностики"
                                              onClick={() => {
                                                const catalogItem = diagCatalog.find(dc => dc.code === d.diagnostic_code);
                                                if (catalogItem) {
                                                  setDiagInfoModal(catalogItem);
                                                } else {
                                                  setDiagInfoModal({
                                                    code: d.diagnostic_code,
                                                    name: d.name || d.diagnostic_code,
                                                    modality: d.modality || 'xray',
                                                    target_joint: d.target_joint || currentTemplate.joint_name || 'general',
                                                    protocol_phrase: d.protocol_phrase || d.name || '',
                                                    priority_level: d.priority_level || 'medium',
                                                    servdict_price: d.servdict_price,
                                                    description: d.description,
                                                    technique_details: d.technique_details,
                                                    patient_preparation: d.patient_preparation,
                                                    diagnostic_criteria: d.diagnostic_criteria,
                                                    contraindications: d.contraindications,
                                                    clinical_indications: d.clinical_indications
                                                  });
                                                }
                                              }}
                                            >
                                              <InfoIcon fontSize="small" />
                                            </IconButton>
                                          </TableCell>
                                          <TableCell align="center">
                                            <IconButton
                                              size="small"
                                              color="error"
                                              onClick={() => handleRemoveDiag(d.diagnostic_code)}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              )}
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                )}

                {/* TAB 4: Manipulations & Injections */}
                {activeTab === 4 && (
                  <Box>
                    {(() => {
                      const allM = currentTemplate.manipulations || [];
                      const stopWarnings = allM.filter(m => m.is_stop_warning === 1 || m.is_stop_warning === true || m.ebm_priority === 'P0-STOP' || m.ebm_priority === 'STOP');
                      const nonStop = allM.filter(m => !(m.is_stop_warning === 1 || m.is_stop_warning === true || m.ebm_priority === 'P0-STOP' || m.ebm_priority === 'STOP'));

                      const p1Count = nonStop.filter(m => m.ebm_priority === 'P1').length;
                      const p2Count = nonStop.filter(m => m.ebm_priority === 'P2' || !m.ebm_priority).length;
                      const p3Count = nonStop.filter(m => m.ebm_priority === 'P3').length;
                      const stopCount = stopWarnings.length;

                      const intCount = allM.filter(m => m.service_scope === 'internal').length;
                      const extCount = allM.filter(m => m.service_scope === 'external').length;
                      const totalPrice = allM.reduce((sum, m) => sum + (m.servdict_price || 0), 0);

                      // Helper to detect drug class & modality
                      const getManipDrugClass = (m: TemplateTreatmentRelItem) => {
                        const tag = (m.drug_class || m.subcategory || m.item_code || '').toLowerCase();
                        const text = ((m.name || '') + ' ' + (m.dosage_or_regimen || '')).toLowerCase();
                        if (tag.includes('prp') || text.includes('prp') || text.includes('плазм') || text.includes('ортобиолог')) return 'prp';
                        if (tag.includes('ha') || tag.includes('hyal') || text.includes('гиалурон') || text.includes('вискосупп')) return 'ha';
                        if (tag.includes('gcs') || tag.includes('corticosteroid') || text.includes('гкс') || text.includes('дипроспан') || text.includes('бетаметазон') || text.includes('кеналог')) return 'gcs';
                        if (tag.includes('punct') || text.includes('пункци') || text.includes('артроцентез') || text.includes('аспираци') || text.includes('гемартроз')) return 'punct';
                        if (tag.includes('barb') || tag.includes('needling') || text.includes('барботаж') || text.includes('нидлинг') || text.includes('гидродилат')) return 'barb';
                        if (tag.includes('reduction') || text.includes('вправлен') || text.includes('понсети') || text.includes('репозици') || text.includes('редрессац') || text.includes('пир')) return 'reduction';
                        if (tag.includes('osteo') || text.includes('деносумаб') || text.includes('золедронов') || text.includes('остеопороз')) return 'osteo';
                        return 'other';
                      };

                      const getManipNavType = (m: TemplateTreatmentRelItem) => {
                        const nav = (m.navigation_type || '').toLowerCase();
                        const text = ((m.name || '') + ' ' + (m.technique_details || '')).toLowerCase();
                        if (nav === 'c_arm' || text.includes('эоп') || text.includes('рентген') || text.includes('c-arm') || text.includes('кт')) return 'c_arm';
                        if (nav === 'landmark' || text.includes('пальпатор') || text.includes('ориентир') || text.includes('гиперпронац') || text.includes('понсети')) return 'landmark';
                        if (nav === 'none') return 'none';
                        return 'us_guided';
                      };

                      const prpCount = allM.filter(m => getManipDrugClass(m) === 'prp').length;
                      const haCount = allM.filter(m => getManipDrugClass(m) === 'ha').length;
                      const gcsCount = allM.filter(m => getManipDrugClass(m) === 'gcs').length;
                      const punctCount = allM.filter(m => getManipDrugClass(m) === 'punct').length;
                      const barbCount = allM.filter(m => getManipDrugClass(m) === 'barb').length;
                      const redCount = allM.filter(m => getManipDrugClass(m) === 'reduction').length;
                      const osteoCount = allM.filter(m => getManipDrugClass(m) === 'osteo').length;

                      const usCount = allM.filter(m => getManipNavType(m) === 'us_guided').length;
                      const carmCount = allM.filter(m => getManipNavType(m) === 'c_arm').length;
                      const landCount = allM.filter(m => getManipNavType(m) === 'landmark').length;

                      // Filter function
                      const matchItemFilter = (m: TemplateTreatmentRelItem) => {
                        // Scope filter
                        if (manipFilter === 'internal' && m.service_scope !== 'internal') return false;
                        if (manipFilter === 'external' && m.service_scope !== 'external') return false;

                        // Priority filter
                        if (manipPriorityFilter === 'P1' && m.ebm_priority !== 'P1') return false;
                        if (manipPriorityFilter === 'P2' && (m.ebm_priority !== 'P2' && m.ebm_priority)) return false;
                        if (manipPriorityFilter === 'P3' && m.ebm_priority !== 'P3') return false;
                        if (manipPriorityFilter === 'P0-STOP' && !m.is_stop_warning && m.ebm_priority !== 'P0-STOP') return false;

                        // Drug filter
                        if (manipDrugFilter !== 'all' && getManipDrugClass(m) !== manipDrugFilter) return false;

                        // Nav filter
                        if (manipNavFilter !== 'all' && getManipNavType(m) !== manipNavFilter) return false;

                        return true;
                      };

                      const filteredP1 = nonStop.filter(m => m.ebm_priority === 'P1' && matchItemFilter(m));
                      const filteredP2 = nonStop.filter(m => (m.ebm_priority === 'P2' || !m.ebm_priority) && matchItemFilter(m));
                      const filteredP3 = nonStop.filter(m => m.ebm_priority === 'P3' && matchItemFilter(m));
                      const filteredStop = stopWarnings.filter(m => matchItemFilter(m));

                      const tmplPri = currentTemplate.manipulations_priority || 'P2';
                      const badge = getManipPriorityBadge(tmplPri);

                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* 1. Header Card */}
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2.5,
                              border: '1.5px solid #CCFBF1',
                              bgcolor: '#F0FDFA',
                              boxShadow: '0 2px 10px rgba(13, 148, 136, 0.05)'
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MedicalServicesIcon sx={{ color: '#0D9488' }} />
                                    5. Лечебно-диагностические манипуляции и инъекции
                                  </Typography>
                                  <Chip
                                    label={`${badge.icon} ${badge.label}`}
                                    size="small"
                                    sx={{
                                      bgcolor: badge.bg,
                                      color: badge.color,
                                      border: `1px solid ${badge.border}`,
                                      fontWeight: 800,
                                      fontSize: '0.72rem'
                                    }}
                                  />
                                </Box>
                                <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 600, display: 'block', mt: 0.5 }}>
                                  Артроцентез, пункции, вискосупплементация (ГК), ортобиология (PRP), таргетные блокады, нидлинг и малоинвазивные пособия
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={copiedManipProtocol ? <CheckCircleIcon sx={{ color: '#16A34A' }} /> : <ContentCopyIcon />}
                                  onClick={() => {
                                    const note = currentTemplate.performed_manipulations_template || currentTemplate.manipulations_summary || 'Манипуляции выполнены в асептических условиях под УЗ-навигацией.';
                                    navigator.clipboard.writeText(cleanLatexText(note));
                                    setCopiedManipProtocol(true);
                                    setTimeout(() => setCopiedManipProtocol(false), 2500);
                                  }}
                                  sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#99F6E4', color: '#0F766E', bgcolor: '#FFFFFF' }}
                                >
                                  {copiedManipProtocol ? 'Протокол скопирован!' : 'Скопировать протокол манипуляций'}
                                </Button>

                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => setManipModalOpen(true)}
                                  sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' }, textTransform: 'none', fontWeight: 700 }}
                                >
                                  + Добавить манипуляцию
                                </Button>
                              </Box>
                            </Box>

                            {/* Procedure Metrics Strip */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1.5, pt: 1.5, borderTop: '1px dashed #99F6E4' }}>
                              <Chip
                                label={`Всего: ${allM.length}`}
                                size="small"
                                sx={{ bgcolor: '#FFFFFF', fontWeight: 800, color: '#0F766E', border: '1px solid #99F6E4' }}
                              />
                              <Chip
                                label={`⭐ P1 Ургентные: ${p1Count}`}
                                size="small"
                                sx={{ bgcolor: '#FEF2F2', fontWeight: 800, color: '#DC2626', border: '1px solid #FCA5A5' }}
                              />
                              <Chip
                                label={`🎯 P2 Таргетные: ${p2Count}`}
                                size="small"
                                sx={{ bgcolor: '#F0F9FF', fontWeight: 800, color: '#0284C7', border: '1px solid #BAE6FD' }}
                              />
                              {p3Count > 0 && (
                                <Chip
                                  label={`🔍 P3 Адъювантные: ${p3Count}`}
                                  size="small"
                                  sx={{ bgcolor: '#ECFDF5', fontWeight: 800, color: '#059669', border: '1px solid #A7F3D0' }}
                                />
                              )}
                              <Chip
                                label={`🏥 В клинике: ${intCount}`}
                                size="small"
                                sx={{ bgcolor: '#CCFBF1', fontWeight: 800, color: '#0F766E' }}
                              />
                              {totalPrice > 0 && (
                                <Chip
                                  label={`💰 Прайс клиники: ${totalPrice.toLocaleString('ru-RU')} ₽`}
                                  size="small"
                                  sx={{ bgcolor: '#DCFCE7', fontWeight: 800, color: '#15803D', border: '1px solid #86EFAC' }}
                                />
                              )}
                              {(currentTemplate.manipulations_has_stop === 1 || stopWarnings.length > 0) && (
                                <Chip
                                  icon={<WarningAmberIcon sx={{ fontSize: '15px !important', color: '#DC2626 !important' }} />}
                                  label="🚨 CDSS STOP Активен"
                                  size="small"
                                  sx={{ bgcolor: '#FEE2E2', fontWeight: 900, color: '#B91C1C', border: '1px solid #F87171' }}
                                />
                              )}
                            </Box>
                          </Paper>

                          {/* 2. CDSS Red Flag STOP Warning Alert Card */}
                          {(currentTemplate.manipulations_has_stop === 1 || stopWarnings.length > 0 || currentTemplate.manipulations_stop_rationale) && (
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2,
                                bgcolor: '#FEF2F2',
                                borderColor: '#EF4444',
                                borderWidth: '2px',
                                borderRadius: 2.5,
                                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.08)'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <WarningAmberIcon sx={{ color: '#DC2626', fontSize: 26 }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    🚨 Клинические противопоказания и ограничения безопасности СППВР (P0-STOP)
                                  </Typography>
                                </Box>
                                <Chip
                                  icon={<BlockIcon sx={{ fontSize: '14px !important', color: '#FFF !important' }} />}
                                  label="CDSS STOP LOCK"
                                  size="small"
                                  sx={{ bgcolor: '#DC2626', color: '#FFF', fontWeight: 900, fontSize: '0.68rem', height: 22 }}
                                />
                              </Box>
                              <Box sx={{ pl: 4 }}>
                                <Typography variant="body2" sx={{ color: '#991B1B', fontWeight: 700, lineHeight: 1.6 }}>
                                  <LatexText text={currentTemplate.manipulations_stop_rationale || stopWarnings[0]?.stop_rationale || 'Противопоказано введение инвазивных препаратов в силовые сухожилия или в сустав при некупированном воспалении.'} />
                                </Typography>
                              </Box>
                            </Paper>
                          )}

                          {/* 3. Multi-tier Filter Toolbar */}
                          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: 2 }}>
                            {/* Row 1: Priority & Scope */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 0.5 }}>
                                <FilterListIcon sx={{ fontSize: 16, color: '#0D9488' }} />
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>
                                  Приоритет:
                                </Typography>
                              </Box>
                              <Chip
                                label={`Все (${allM.length})`}
                                size="small"
                                onClick={() => { setManipFilter('all'); setManipPriorityFilter('all'); }}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: (manipFilter === 'all' && manipPriorityFilter === 'all') ? '#0D9488' : '#F1F5F9',
                                  color: (manipFilter === 'all' && manipPriorityFilter === 'all') ? '#FFFFFF' : '#334155'
                                }}
                              />
                              <Chip
                                label={`⭐ Tier 1: Золотой стандарт (${p1Count})`}
                                size="small"
                                onClick={() => setManipPriorityFilter(manipPriorityFilter === 'P1' ? 'all' : 'P1')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: manipPriorityFilter === 'P1' ? '#DC2626' : '#FEF2F2',
                                  color: manipPriorityFilter === 'P1' ? '#FFFFFF' : '#DC2626',
                                  border: '1px solid #FCA5A5'
                                }}
                              />
                              <Chip
                                label={`🎯 Tier 2: Таргетная терапия (${p2Count})`}
                                size="small"
                                onClick={() => setManipPriorityFilter(manipPriorityFilter === 'P2' ? 'all' : 'P2')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: manipPriorityFilter === 'P2' ? '#0284C7' : '#F0F9FF',
                                  color: manipPriorityFilter === 'P2' ? '#FFFFFF' : '#0284C7',
                                  border: '1px solid #BAE6FD'
                                }}
                              />
                              {p3Count > 0 && (
                                <Chip
                                  label={`🔍 Tier 3: Адъювантные (${p3Count})`}
                                  size="small"
                                  onClick={() => setManipPriorityFilter(manipPriorityFilter === 'P3' ? 'all' : 'P3')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: manipPriorityFilter === 'P3' ? '#0D9488' : '#F0FDFA',
                                    color: manipPriorityFilter === 'P3' ? '#FFFFFF' : '#0D9488',
                                    border: '1px solid #99F6E4'
                                  }}
                                />
                              )}
                              {stopCount > 0 && (
                                <Chip
                                  label={`🚨 P0-STOP Ограничения (${stopCount})`}
                                  size="small"
                                  onClick={() => setManipPriorityFilter(manipPriorityFilter === 'P0-STOP' ? 'all' : 'P0-STOP')}
                                  sx={{
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    bgcolor: manipPriorityFilter === 'P0-STOP' ? '#B91C1C' : '#FEF2F2',
                                    color: manipPriorityFilter === 'P0-STOP' ? '#FFFFFF' : '#B91C1C',
                                    border: '1px solid #F87171'
                                  }}
                                />
                              )}
                              <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                                <Chip
                                  label={`🏥 Клиника (${intCount})`}
                                  size="small"
                                  onClick={() => setManipFilter(manipFilter === 'internal' ? 'all' : 'internal')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: manipFilter === 'internal' ? '#0D9488' : '#CCFBF1',
                                    color: manipFilter === 'internal' ? '#FFFFFF' : '#0F766E'
                                  }}
                                />
                                {extCount > 0 && (
                                  <Chip
                                    label={`🌐 Внешние (${extCount})`}
                                    size="small"
                                    onClick={() => setManipFilter(manipFilter === 'external' ? 'all' : 'external')}
                                    sx={{
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      bgcolor: manipFilter === 'external' ? '#64748B' : '#F1F5F9',
                                      color: manipFilter === 'external' ? '#FFFFFF' : '#475569'
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>

                            {/* Row 2: Drug Class / Type */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1, pt: 1, borderTop: '1px dashed #E2E8F0' }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase', minWidth: 65 }}>
                                Препарат:
                              </Typography>
                              <Chip
                                label="Все классы"
                                size="small"
                                onClick={() => setManipDrugFilter('all')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: manipDrugFilter === 'all' ? '#0F3C64' : '#F8FAFC',
                                  color: manipDrugFilter === 'all' ? '#FFFFFF' : '#475569'
                                }}
                              />
                              {prpCount > 0 && (
                                <Chip
                                  label={`🧪 PRP / Плазма (${prpCount})`}
                                  size="small"
                                  onClick={() => setManipDrugFilter(manipDrugFilter === 'prp' ? 'all' : 'prp')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: manipDrugFilter === 'prp' ? '#0D9488' : '#F0FDFA',
                                    color: manipDrugFilter === 'prp' ? '#FFFFFF' : '#0F766E',
                                    border: '1px solid #99F6E4'
                                  }}
                                />
                              )}
                              {haCount > 0 && (
                                <Chip
                                  label={`💧 Гиалуроновая к-та (${haCount})`}
                                  size="small"
                                  onClick={() => setManipDrugFilter(manipDrugFilter === 'ha' ? 'all' : 'ha')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: manipDrugFilter === 'ha' ? '#0284C7' : '#F0F9FF',
                                    color: manipDrugFilter === 'ha' ? '#FFFFFF' : '#0284C7',
                                    border: '1px solid #BAE6FD'
                                  }}
                                />
                              )}
                              {gcsCount > 0 && (
                                <Chip
                                  label={`💉 ГКС блокады (${gcsCount})`}
                                  size="small"
                                  onClick={() => setManipDrugFilter(manipDrugFilter === 'gcs' ? 'all' : 'gcs')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: manipDrugFilter === 'gcs' ? '#D97706' : '#FFFBEB',
                                    color: manipDrugFilter === 'gcs' ? '#FFFFFF' : '#B45309',
                                    border: '1px solid #FCD34D'
                                  }}
                                />
                              )}
                              {punctCount > 0 && (
                                <Chip
                                  label={`🩸 Артроцентез / Пункция (${punctCount})`}
                                  size="small"
                                  onClick={() => setManipDrugFilter(manipDrugFilter === 'punct' ? 'all' : 'punct')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: manipDrugFilter === 'punct' ? '#DC2626' : '#FEF2F2',
                                    color: manipDrugFilter === 'punct' ? '#FFFFFF' : '#B91C1C',
                                    border: '1px solid #FCA5A5'
                                  }}
                                />
                              )}
                              {barbCount > 0 && (
                                <Chip
                                  label={`🌀 Нидлинг / Барботаж (${barbCount})`}
                                  size="small"
                                  onClick={() => setManipDrugFilter(manipDrugFilter === 'barb' ? 'all' : 'barb')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: manipDrugFilter === 'barb' ? '#7C3AED' : '#F5F3FF',
                                    color: manipDrugFilter === 'barb' ? '#FFFFFF' : '#7C3AED',
                                    border: '1px solid #DDD6FE'
                                  }}
                                />
                              )}
                              {redCount > 0 && (
                                <Chip
                                  label={`🤲 Репозиция / Понсети (${redCount})`}
                                  size="small"
                                  onClick={() => setManipDrugFilter(manipDrugFilter === 'reduction' ? 'all' : 'reduction')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: manipDrugFilter === 'reduction' ? '#16A34A' : '#F0FDF4',
                                    color: manipDrugFilter === 'reduction' ? '#FFFFFF' : '#15803D',
                                    border: '1px solid #BBF7D0'
                                  }}
                                />
                              )}
                              {osteoCount > 0 && (
                                <Chip
                                  label={`🦴 Антирезорбтивная (${osteoCount})`}
                                  size="small"
                                  onClick={() => setManipDrugFilter(manipDrugFilter === 'osteo' ? 'all' : 'osteo')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: manipDrugFilter === 'osteo' ? '#4F46E5' : '#EEF2FF',
                                    color: manipDrugFilter === 'osteo' ? '#FFFFFF' : '#4F46E5',
                                    border: '1px solid #C7D2FE'
                                  }}
                                />
                              )}
                            </Box>

                            {/* Row 3: Navigation Type */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', pt: 1, borderTop: '1px dashed #E2E8F0' }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase', minWidth: 65 }}>
                                Навигация:
                              </Typography>
                              <Chip
                                label="Все типы"
                                size="small"
                                onClick={() => setManipNavFilter('all')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: manipNavFilter === 'all' ? '#0F3C64' : '#F8FAFC',
                                  color: manipNavFilter === 'all' ? '#FFFFFF' : '#475569'
                                }}
                              />
                              <Chip
                                label={`📡 УЗ-навигация (US-guided) (${usCount})`}
                                size="small"
                                onClick={() => setManipNavFilter(manipNavFilter === 'us_guided' ? 'all' : 'us_guided')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: manipNavFilter === 'us_guided' ? '#0D9488' : '#CCFBF1',
                                  color: manipNavFilter === 'us_guided' ? '#FFFFFF' : '#0F766E'
                                }}
                              />
                              {carmCount > 0 && (
                                <Chip
                                  label={`📺 C-arm (ЭОП) (${carmCount})`}
                                  size="small"
                                  onClick={() => setManipNavFilter(manipNavFilter === 'c_arm' ? 'all' : 'c_arm')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: manipNavFilter === 'c_arm' ? '#7C3AED' : '#F5F3FF',
                                    color: manipNavFilter === 'c_arm' ? '#FFFFFF' : '#7C3AED'
                                  }}
                                />
                              )}
                              {landCount > 0 && (
                                <Chip
                                  label={`✋ Анатомические ориентиры (${landCount})`}
                                  size="small"
                                  onClick={() => setManipNavFilter(manipNavFilter === 'landmark' ? 'all' : 'landmark')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: manipNavFilter === 'landmark' ? '#475569' : '#F1F5F9',
                                    color: manipNavFilter === 'landmark' ? '#FFFFFF' : '#334155'
                                  }}
                                />
                              )}
                            </Box>
                          </Paper>

                          {/* 4. Procedure Note Generator Box (Протокол врача) */}
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              bgcolor: '#F8FAFC',
                              borderColor: '#CBD5E1',
                              borderRadius: 2
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <ArticleIcon sx={{ fontSize: 18, color: '#0D9488' }} />
                                Протокол выполненной манипуляции (дневник в медицинскую карту):
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() => {
                                    const defaultNote = currentTemplate.manipulations_summary ? `В асептических условиях под ультразвуковой навигацией (US-guided) выполнена процедура: ${cleanLatexText(currentTemplate.manipulations_summary).split('<br>')[0]}. Осложнений нет, пациент перенес процедуру удовлетворительно.` : 'В асептических условиях под УЗ-навигацией выполнена манипуляция.';
                                    setCurrentTemplate({ ...currentTemplate, performed_manipulations_template: defaultNote });
                                  }}
                                  sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, color: '#0D9488' }}
                                >
                                  🔄 Сгенерировать по стандарту
                                </Button>
                              </Box>
                            </Box>
                            <TextField
                              fullWidth
                              multiline
                              minRows={2}
                              maxRows={5}
                              size="small"
                              placeholder="Опишите технику, навигацию, использованный препарат и реакцию пациента..."
                              value={currentTemplate.performed_manipulations_template || ''}
                              onChange={(e) => setCurrentTemplate({ ...currentTemplate, performed_manipulations_template: e.target.value })}
                              sx={{
                                bgcolor: '#FFFFFF',
                                '& .MuiOutlinedInput-root': { fontSize: '0.85rem', lineHeight: 1.5 }
                              }}
                            />
                          </Paper>

                          {/* 5. Rich Manipulation Cards Rendered in Tiers */}
                          {allM.length === 0 ? (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                              В данном шаблоне нет назначенных манипуляций. Нажмите <strong>«+ Добавить манипуляцию»</strong> для назначения из клинического каталога.
                            </Alert>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                              {/* RENDER HELPER FUNCTION FOR A GROUP OF MANIPULATIONS */}
                              {[
                                { title: '⭐ [P1] ЗОЛОТОЙ СТАНДАРТ И УРГЕНТНЫЕ МАНИПУЛЯЦИИ (CURATIVE / EMERGENCY DIAGNOSTIC)', items: filteredP1, color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
                                { title: '🎯 [P2] ТАРГЕТНАЯ ИНТЕРВЕНЦИОННАЯ ТЕРАПИЯ И ОРТОБИОЛОГИЯ (TARGETED INTERVENTIONAL)', items: filteredP2, color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
                                { title: '🔍 [P3] ВСПОМОГАТЕЛЬНЫЕ МЯГКОТКАННЫЕ И МАНУАЛЬНЫЕ ПОСОБИЯ (ADJUVANT / MANUAL)', items: filteredP3, color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4' },
                                { title: '🚨 [P0-STOP] ОГРАНИЧЕНИЯ БЕЗОПАСНОСТИ И ПРОТИВОПОКАЗАНИЯ СППВР', items: filteredStop, color: '#B91C1C', bg: '#FEF2F2', border: '#F87171' }
                              ].map((tierGroup) => {
                                if (tierGroup.items.length === 0) return null;

                                return (
                                  <Box key={tierGroup.title}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: tierGroup.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {tierGroup.title}
                                      </Typography>
                                      <Chip
                                        label={`${tierGroup.items.length}`}
                                        size="small"
                                        sx={{ bgcolor: tierGroup.bg, color: tierGroup.color, border: `1px solid ${tierGroup.border}`, fontWeight: 800, height: 20 }}
                                      />
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                                      {tierGroup.items.map((m) => {
                                        const catItem = manipCatalog.find(mc => mc.code === m.item_code);
                                        const isInternal = m.service_scope === 'internal';
                                        const drugClass = getManipDrugClass(m);
                                        const navType = getManipNavType(m);

                                        return (
                                          <Card
                                            key={m.item_code}
                                            variant="outlined"
                                            sx={{
                                              p: 2,
                                              borderRadius: 2,
                                              bgcolor: m.is_stop_warning ? '#FFF5F5' : '#FFFFFF',
                                              borderColor: m.is_stop_warning ? '#F87171' : '#E2E8F0',
                                              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                              '&:hover': { borderColor: '#0D9488', boxShadow: '0 3px 12px rgba(13,148,136,0.08)' }
                                            }}
                                          >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                                              {/* Left Title & Badges */}
                                              <Box sx={{ flex: 1, minWidth: 280 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.75 }}>
                                                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                                    <LatexText text={m.name || catItem?.name || m.item_code} />
                                                  </Typography>

                                                  {/* Priority Badge */}
                                                  {m.ebm_priority && (
                                                    <Chip
                                                      label={m.ebm_priority === 'P1' ? '⭐ P1 ЗОЛОТОЙ СТАНДАРТ' : m.ebm_priority === 'P3' ? '🔍 P3 АДЪЮВАНТ' : m.ebm_priority === 'P0-STOP' ? '🚨 P0-STOP ЗАПРЕТ' : '🎯 P2 ТАРГЕТНАЯ'}
                                                      size="small"
                                                      sx={{
                                                        fontWeight: 800,
                                                        fontSize: '0.68rem',
                                                        height: 20,
                                                        bgcolor: m.ebm_priority === 'P1' ? '#FEF2F2' : m.ebm_priority === 'P3' ? '#F0FDFA' : m.ebm_priority === 'P0-STOP' ? '#FEF2F2' : '#F0F9FF',
                                                        color: m.ebm_priority === 'P1' ? '#DC2626' : m.ebm_priority === 'P3' ? '#0D9488' : m.ebm_priority === 'P0-STOP' ? '#DC2626' : '#0284C7',
                                                        border: `1px solid ${m.ebm_priority === 'P1' ? '#FCA5A5' : m.ebm_priority === 'P3' ? '#99F6E4' : m.ebm_priority === 'P0-STOP' ? '#F87171' : '#BAE6FD'}`
                                                      }}
                                                    />
                                                  )}

                                                  {/* Navigation Badge */}
                                                  <Chip
                                                    label={navType === 'us_guided' ? '📡 УЗ-навигация (US-guided)' : navType === 'c_arm' ? '📺 C-arm (ЭОП)' : '✋ Анатомические ориентиры'}
                                                    size="small"
                                                    sx={{
                                                      fontWeight: 700,
                                                      fontSize: '0.68rem',
                                                      height: 20,
                                                      bgcolor: navType === 'us_guided' ? '#CCFBF1' : navType === 'c_arm' ? '#EDE9FE' : '#F1F5F9',
                                                      color: navType === 'us_guided' ? '#0F766E' : navType === 'c_arm' ? '#6D28D9' : '#475569'
                                                    }}
                                                  />

                                                  {/* Scope Chip */}
                                                  <Chip
                                                    label={isInternal ? '🏥 ВНУТРЕННЯЯ' : '🌐 ВНЕШНЯЯ'}
                                                    size="small"
                                                    sx={{
                                                      fontWeight: 800,
                                                      fontSize: '0.65rem',
                                                      height: 20,
                                                      bgcolor: isInternal ? '#CCFBF1' : '#F1F5F9',
                                                      color: isInternal ? '#0F766E' : '#475569'
                                                    }}
                                                  />

                                                  {/* Price Chip */}
                                                  {m.servdict_price ? (
                                                    <Chip
                                                      label={`${m.servdict_price.toLocaleString('ru-RU')} ₽ (в кассу)`}
                                                      size="small"
                                                      color="success"
                                                      variant="outlined"
                                                      sx={{ fontWeight: 800, fontSize: '0.7rem', height: 20 }}
                                                    />
                                                  ) : (
                                                    <Chip
                                                      label="Без оплаты / Внешнее"
                                                      size="small"
                                                      sx={{ fontSize: '0.65rem', height: 20, color: '#64748B' }}
                                                    />
                                                  )}
                                                </Box>

                                                {/* Anatomical Access & Drug Class Specs */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
                                                  {(m.anatomical_access || catItem?.anatomical_access) && (
                                                    <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                      📍 Доступ: {m.anatomical_access || catItem?.anatomical_access}
                                                    </Typography>
                                                  )}
                                                  {m.subcategory && (
                                                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                                                      Категория: {m.subcategory.toUpperCase()}
                                                    </Typography>
                                                  )}
                                                </Box>

                                                {/* Clinical Regimen / Technique */}
                                                <Box sx={{ bgcolor: '#F8FAFC', p: 1, borderRadius: 1.5, borderLeft: '3px solid #0D9488', mb: 0.5 }}>
                                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.25 }}>
                                                    Клинический регламент и дозировка:
                                                  </Typography>
                                                  <Typography variant="body2" sx={{ color: '#1E293B', fontSize: '0.82rem', lineHeight: 1.45 }}>
                                                    <LatexText text={m.dosage_or_regimen || m.regimen_standard || catItem?.dosage_or_regimen || catItem?.regimen_standard || 'По назначению врача в асептических условиях'} />
                                                  </Typography>
                                                </Box>

                                                {/* Stop rationale if present on this item */}
                                                {m.stop_rationale && (
                                                  <Typography variant="caption" sx={{ color: '#B91C1C', fontWeight: 700, display: 'block', mt: 0.5 }}>
                                                    ⚠️ {m.stop_rationale}
                                                  </Typography>
                                                )}
                                              </Box>

                                              {/* Right Actions */}
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Select
                                                  size="small"
                                                  value={m.priority_level || (isInternal ? 'high' : 'medium')}
                                                  onChange={(e) => handleUpdateTreatmentPriority(m.item_code, 'manipulation', e.target.value)}
                                                  sx={{ fontSize: '0.75rem', fontWeight: 700, height: 30, minWidth: 120 }}
                                                >
                                                  <MenuItem value="high">Tier 1: Высокий ⭐</MenuItem>
                                                  <MenuItem value="medium">Tier 2: Средний</MenuItem>
                                                  <MenuItem value="low">Tier 3: Низкий</MenuItem>
                                                </Select>

                                                <IconButton
                                                  size="small"
                                                  color="info"
                                                  title="Подробный клинический регламент, методика и EBM"
                                                  onClick={() => {
                                                    setTreatmentModalItem((catItem as any) || (m as any));
                                                    setTreatmentModalCategory('manipulation');
                                                  }}
                                                >
                                                  <InfoIcon fontSize="small" />
                                                </IconButton>

                                                <IconButton
                                                  size="small"
                                                  color="error"
                                                  onClick={() => handleRemoveTreatmentItem(m.item_code, 'manipulation')}
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                              </Box>
                                            </Box>
                                          </Card>
                                        );
                                      })}
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                        </Box>
                      );
                    })()}
                  </Box>
                )}

                {/* TAB 5: Physiotherapy & Hardware Treatment */}
                {activeTab === 5 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FitnessIcon sx={{ color: '#7C3AED' }} />
                          6. Физиотерапия и аппаратное восстановительное лечение
                          <Chip
                            label={`${(currentTemplate.physiotherapy || []).filter(p => !p.is_stop_warning && p.ebm_priority !== 'STOP').length} назн.`}
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#EDE9FE', color: '#6D28D9' }}
                          />
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Клиническая доказательная физиотерапия: 1-я линия EBM (патогенетический максимум), 2-я линия (адъювантная) и CDSS контроль безопасности
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setPhysioModalOpen(true)}
                        sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, textTransform: 'none', fontWeight: 700 }}
                      >
                        + Добавить физиотерапию
                      </Button>
                    </Box>

                    {(() => {
                      const allP = currentTemplate.physiotherapy || [];
                      const stopWarnings = allP.filter(p => p.is_stop_warning === 1 || p.is_stop_warning === true || p.ebm_priority === 'STOP');
                      const nonStop = allP.filter(p => !p.is_stop_warning && p.ebm_priority !== 'STOP');

                      const p1Count = nonStop.filter(p => p.ebm_priority === 'P1').length;
                      const p2Count = nonStop.filter(p => p.ebm_priority !== 'P1').length;
                      const intCount = nonStop.filter(p => p.service_scope === 'internal').length;

                      const uvtCount = nonStop.filter(p => {
                        const tag = (p.modality_tag || p.subcategory || p.item_code).toLowerCase();
                        return tag.includes('shockwave') || tag.includes('eswt') || tag.includes('увт');
                      }).length;

                      const laserCount = nonStop.filter(p => {
                        const tag = (p.modality_tag || p.subcategory || p.item_code).toLowerCase();
                        return tag.includes('laser') || tag.includes('hilt') || tag.includes('mls') || tag.includes('лазер');
                      }).length;

                      const magnetCount = nonStop.filter(p => {
                        const tag = (p.modality_tag || p.subcategory || p.item_code).toLowerCase();
                        return tag.includes('magnet') || tag.includes('sis') || tag.includes('pemf') || tag.includes('пемп');
                      }).length;

                      const tecarCount = nonStop.filter(p => {
                        const tag = (p.modality_tag || p.subcategory || p.item_code).toLowerCase();
                        return tag.includes('tecar') || tag.includes('текар') || tag.includes('диатерми');
                      }).length;

                      const nmesCount = nonStop.filter(p => {
                        const tag = (p.modality_tag || p.subcategory || p.item_code).toLowerCase();
                        return tag.includes('nmes') || tag.includes('vtes') || tag.includes('втэс') || tag.includes('миостимул') || tag.includes('tens') || tag.includes('смт');
                      }).length;

                      const cryoCount = nonStop.filter(p => {
                        const tag = (p.modality_tag || p.subcategory || p.item_code).toLowerCase();
                        return tag.includes('cryo') || tag.includes('крио');
                      }).length;

                      const cpmCount = nonStop.filter(p => {
                        const tag = (p.modality_tag || p.subcategory || p.item_code).toLowerCase();
                        return tag.includes('cpm') || tag.includes('artro') || tag.includes('механо');
                      }).length;

                      const tractionCount = nonStop.filter(p => {
                        const tag = (p.modality_tag || p.subcategory || p.item_code).toLowerCase();
                        return tag.includes('traction') || tag.includes('тракци') || tag.includes('вытяжен');
                      }).length;

                      const bosCount = nonStop.filter(p => {
                        const tag = (p.modality_tag || p.subcategory || p.item_code).toLowerCase();
                        return tag.includes('biofeedback') || tag.includes('бос') || tag.includes('стабило');
                      }).length;

                      // Helper filter function
                      const matchItemFilter = (p: TemplateTreatmentRelItem) => {
                        if (physioFilter === 'all') return true;
                        if (physioFilter === 'p1') return p.ebm_priority === 'P1';
                        if (physioFilter === 'p2') return p.ebm_priority !== 'P1';
                        if (physioFilter === 'internal') return p.service_scope === 'internal';
                        const tag = (p.modality_tag || p.subcategory || p.item_code).toLowerCase();
                        if (physioFilter === 'uvt') return tag.includes('shockwave') || tag.includes('eswt') || tag.includes('увт');
                        if (physioFilter === 'laser') return tag.includes('laser') || tag.includes('hilt') || tag.includes('mls') || tag.includes('лазер');
                        if (physioFilter === 'magnet') return tag.includes('magnet') || tag.includes('sis') || tag.includes('pemf') || tag.includes('пемп');
                        if (physioFilter === 'tecar') return tag.includes('tecar') || tag.includes('текар') || tag.includes('диатерми');
                        if (physioFilter === 'nmes') return tag.includes('nmes') || tag.includes('vtes') || tag.includes('втэс') || tag.includes('миостимул') || tag.includes('tens') || tag.includes('смт');
                        if (physioFilter === 'cryo') return tag.includes('cryo') || tag.includes('крио');
                        if (physioFilter === 'cpm') return tag.includes('cpm') || tag.includes('artro') || tag.includes('механо');
                        if (physioFilter === 'traction') return tag.includes('traction') || tag.includes('тракци') || tag.includes('вытяжен');
                        if (physioFilter === 'biofeedback') return tag.includes('biofeedback') || tag.includes('бос') || tag.includes('стабило');
                        return true;
                      };

                      const filteredP1 = nonStop.filter(p => p.ebm_priority === 'P1' && matchItemFilter(p));
                      const filteredP2 = nonStop.filter(p => p.ebm_priority !== 'P1' && matchItemFilter(p));

                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* 1. CDSS STOP Warning Red Flag Alert */}
                          {stopWarnings.length > 0 && (
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2,
                                bgcolor: '#FEF2F2',
                                borderColor: '#EF4444',
                                borderWidth: '2px',
                                borderRadius: 2.5,
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <WarningAmberIcon sx={{ color: '#DC2626', fontSize: 26 }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    🚨 Клинические противопоказания и ограничения безопасности СППВР (Red Flags)
                                  </Typography>
                                </Box>
                                <Chip
                                  icon={<BlockIcon sx={{ fontSize: '14px !important', color: '#FFF !important' }} />}
                                  label="CDSS STOP LOCK"
                                  size="small"
                                  sx={{ bgcolor: '#DC2626', color: '#FFF', fontWeight: 900, fontSize: '0.68rem', height: 22 }}
                                />
                              </Box>
                              {stopWarnings.map((sw) => (
                                <Box key={sw.id || sw.item_code} sx={{ pl: 4 }}>
                                  <Typography variant="body2" sx={{ color: '#991B1B', fontWeight: 700, lineHeight: 1.55 }}>
                                    <LatexText text={sw.exact_dosimetry || sw.dosage_or_regimen || sw.stop_rationale || 'Противопоказано применение высокоинтенсивных факторов в острой фазе.'} />
                                  </Typography>
                                </Box>
                              ))}
                            </Paper>
                          )}

                          {/* 2. Modality & Priority Quick Filter Chips */}
                          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#FAF5FF', borderColor: '#DDD6FE', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                                <FilterListIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase' }}>
                                  Быстрый фильтр:
                                </Typography>
                              </Box>
                              <Chip
                                label={`Все (${nonStop.length})`}
                                size="small"
                                onClick={() => setPhysioFilter('all')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: physioFilter === 'all' ? '#7C3AED' : '#FFFFFF',
                                  color: physioFilter === 'all' ? '#FFFFFF' : '#334155',
                                  border: physioFilter === 'all' ? 'none' : '1px solid #CBD5E1'
                                }}
                              />
                              <Chip
                                label={`⭐ 1-я линия P1 (${p1Count})`}
                                size="small"
                                onClick={() => setPhysioFilter('p1')}
                                sx={{
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  bgcolor: physioFilter === 'p1' ? '#7C3AED' : '#FFFFFF',
                                  color: physioFilter === 'p1' ? '#FFFFFF' : '#6D28D9',
                                  border: physioFilter === 'p1' ? 'none' : '1.5px solid #C4B5FD'
                                }}
                              />
                              <Chip
                                label={`🎯 2-я линия P2 (${p2Count})`}
                                size="small"
                                onClick={() => setPhysioFilter('p2')}
                                sx={{
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  bgcolor: physioFilter === 'p2' ? '#0284C7' : '#FFFFFF',
                                  color: physioFilter === 'p2' ? '#FFFFFF' : '#0284C7',
                                  border: physioFilter === 'p2' ? 'none' : '1.5px solid #BAE6FD'
                                }}
                              />
                              <Chip
                                label={`🏥 Внутренние (${intCount})`}
                                size="small"
                                onClick={() => setPhysioFilter('internal')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: physioFilter === 'internal' ? '#0F766E' : '#FFFFFF',
                                  color: physioFilter === 'internal' ? '#FFFFFF' : '#0F766E',
                                  border: physioFilter === 'internal' ? 'none' : '1px solid #99F6E4'
                                }}
                              />
                              {uvtCount > 0 && (
                                <Chip
                                  label={`УВТ Фокус/Радиал (${uvtCount})`}
                                  size="small"
                                  onClick={() => setPhysioFilter('uvt')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: physioFilter === 'uvt' ? '#7C3AED' : '#FFFFFF',
                                    color: physioFilter === 'uvt' ? '#FFFFFF' : '#334155',
                                    border: physioFilter === 'uvt' ? 'none' : '1px solid #CBD5E1'
                                  }}
                                />
                              )}
                              {laserCount > 0 && (
                                <Chip
                                  label={`HILT/MLS Лазер (${laserCount})`}
                                  size="small"
                                  onClick={() => setPhysioFilter('laser')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: physioFilter === 'laser' ? '#7C3AED' : '#FFFFFF',
                                    color: physioFilter === 'laser' ? '#FFFFFF' : '#334155',
                                    border: physioFilter === 'laser' ? 'none' : '1px solid #CBD5E1'
                                  }}
                                />
                              )}
                              {magnetCount > 0 && (
                                <Chip
                                  label={`SIS/ПЕМП Магнит (${magnetCount})`}
                                  size="small"
                                  onClick={() => setPhysioFilter('magnet')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: physioFilter === 'magnet' ? '#7C3AED' : '#FFFFFF',
                                    color: physioFilter === 'magnet' ? '#FFFFFF' : '#334155',
                                    border: physioFilter === 'magnet' ? 'none' : '1px solid #CBD5E1'
                                  }}
                                />
                              )}
                              {tecarCount > 0 && (
                                <Chip
                                  label={`TECAR (${tecarCount})`}
                                  size="small"
                                  onClick={() => setPhysioFilter('tecar')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: physioFilter === 'tecar' ? '#7C3AED' : '#FFFFFF',
                                    color: physioFilter === 'tecar' ? '#FFFFFF' : '#334155',
                                    border: physioFilter === 'tecar' ? 'none' : '1px solid #CBD5E1'
                                  }}
                                />
                              )}
                              {nmesCount > 0 && (
                                <Chip
                                  label={`Миостимуляция / ВТЭС (${nmesCount})`}
                                  size="small"
                                  onClick={() => setPhysioFilter('nmes')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: physioFilter === 'nmes' ? '#7C3AED' : '#FFFFFF',
                                    color: physioFilter === 'nmes' ? '#FFFFFF' : '#334155',
                                    border: physioFilter === 'nmes' ? 'none' : '1px solid #CBD5E1'
                                  }}
                                />
                              )}
                              {cryoCount > 0 && (
                                <Chip
                                  label={`Криотерапия (${cryoCount})`}
                                  size="small"
                                  onClick={() => setPhysioFilter('cryo')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: physioFilter === 'cryo' ? '#7C3AED' : '#FFFFFF',
                                    color: physioFilter === 'cryo' ? '#FFFFFF' : '#334155',
                                    border: physioFilter === 'cryo' ? 'none' : '1px solid #CBD5E1'
                                  }}
                                />
                              )}
                              {cpmCount > 0 && (
                                <Chip
                                  label={`CPM Механотерапия (${cpmCount})`}
                                  size="small"
                                  onClick={() => setPhysioFilter('cpm')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: physioFilter === 'cpm' ? '#7C3AED' : '#FFFFFF',
                                    color: physioFilter === 'cpm' ? '#FFFFFF' : '#334155',
                                    border: physioFilter === 'cpm' ? 'none' : '1px solid #CBD5E1'
                                  }}
                                />
                              )}
                              {tractionCount > 0 && (
                                <Chip
                                  label={`Тракция (${tractionCount})`}
                                  size="small"
                                  onClick={() => setPhysioFilter('traction')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: physioFilter === 'traction' ? '#7C3AED' : '#FFFFFF',
                                    color: physioFilter === 'traction' ? '#FFFFFF' : '#334155',
                                    border: physioFilter === 'traction' ? 'none' : '1px solid #CBD5E1'
                                  }}
                                />
                              )}
                              {bosCount > 0 && (
                                <Chip
                                  label={`БОС / Стабилометрия (${bosCount})`}
                                  size="small"
                                  onClick={() => setPhysioFilter('biofeedback')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: physioFilter === 'biofeedback' ? '#7C3AED' : '#FFFFFF',
                                    color: physioFilter === 'biofeedback' ? '#FFFFFF' : '#334155',
                                    border: physioFilter === 'biofeedback' ? 'none' : '1px solid #CBD5E1'
                                  }}
                                />
                              )}
                            </Box>
                          </Paper>

                          {/* Helper render table row */}
                          {(() => {
                            const renderPhysioTable = (items: TemplateTreatmentRelItem[], isP1: boolean) => {
                              if (items.length === 0) {
                                return (
                                  <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      В категории <strong>{isP1 ? '1-й линии (P1)' : '2-й линии (P2)'}</strong> нет назначенных процедур по выбранному фильтру.
                                    </Typography>
                                  </Box>
                                );
                              }

                              return (
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: isP1 ? '#DDD6FE' : '#BAE6FD' }}>
                                  <Table size="small">
                                    <TableHead sx={{ bgcolor: isP1 ? '#F5F3FF' : '#F0F9FF' }}>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: isP1 ? '#6D28D9' : '#0369A1', width: 280 }}>
                                          Метод физиотерапии & Оборудование
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: isP1 ? '#6D28D9' : '#0369A1', width: 140 }}>
                                          Линия EBM
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: isP1 ? '#6D28D9' : '#0369A1', width: 120 }}>
                                          База / Охват
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: isP1 ? '#6D28D9' : '#0369A1', width: 140 }}>
                                          Прайс клиники
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: isP1 ? '#6D28D9' : '#0369A1' }}>
                                          Точная дозировка & Регламент
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: isP1 ? '#6D28D9' : '#0369A1', width: 50 }} align="center">
                                          Инфо (i)
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: isP1 ? '#6D28D9' : '#0369A1', width: 50 }} align="center">
                                          Удалить
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {items.map((p) => {
                                        const catItem = physioCatalog.find(pc => pc.code === p.item_code);
                                        const isInternal = p.service_scope === 'internal';
                                        const evLevel = p.evidence_level || catItem?.evidence_level || '1A';
                                        const apparatus = p.apparatus_examples || catItem?.apparatus_examples;

                                        return (
                                          <TableRow key={p.item_code} hover sx={{ '&:hover': { bgcolor: isP1 ? '#FAF5FF' : '#F0F9FF' } }}>
                                            <TableCell>
                                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                                                <LatexText text={p.name || catItem?.name || p.item_code} />
                                              </Typography>
                                              {apparatus && (
                                                <Typography variant="caption" sx={{ color: '#6D28D9', display: 'block', mt: 0.25, fontWeight: 600 }}>
                                                  Аппарат: {apparatus}
                                                </Typography>
                                              )}
                                              {p.subcategory && (
                                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>
                                                  Модальность: {p.subcategory.toUpperCase()}
                                                </Typography>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                <Select
                                                  size="small"
                                                  value={p.ebm_priority === 'P1' ? 'P1' : 'P2'}
                                                  onChange={(e) => handleUpdatePhysioEbmPriority(p.item_code, e.target.value as 'P1' | 'P2')}
                                                  sx={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: 800,
                                                    height: 26,
                                                    bgcolor: p.ebm_priority === 'P1' ? '#EDE9FE' : '#E0F2FE',
                                                    color: p.ebm_priority === 'P1' ? '#6D28D9' : '#0369A1',
                                                    borderRadius: 1.5
                                                  }}
                                                >
                                                  <MenuItem value="P1" sx={{ fontWeight: 700, color: '#6D28D9' }}>⭐ P1: 1-я линия</MenuItem>
                                                  <MenuItem value="P2" sx={{ fontWeight: 700, color: '#0369A1' }}>🎯 P2: 2-я линия</MenuItem>
                                                </Select>
                                                <Chip
                                                  label={`Level ${evLevel}`}
                                                  size="small"
                                                  sx={{
                                                    fontSize: '0.65rem',
                                                    height: 18,
                                                    fontWeight: 800,
                                                    bgcolor: '#FEF3C7',
                                                    color: '#B45309',
                                                    alignSelf: 'flex-start'
                                                  }}
                                                />
                                              </Box>
                                            </TableCell>
                                            <TableCell>
                                              <Chip
                                                label={isInternal ? '🏥 ВНУТРЕННЯЯ' : '🌐 ВНЕШНЯЯ'}
                                                size="small"
                                                sx={{
                                                  fontWeight: 800,
                                                  fontSize: '0.68rem',
                                                  height: 22,
                                                  bgcolor: isInternal ? '#EDE9FE' : '#F1F5F9',
                                                  color: isInternal ? '#6D28D9' : '#475569',
                                                  border: isInternal ? '1px solid #C4B5FD' : '1px solid #CBD5E1'
                                                }}
                                              />
                                            </TableCell>
                                            <TableCell>
                                              {p.servdict_price ? (
                                                <Chip
                                                  label={`${p.servdict_price.toLocaleString('ru-RU')} ₽ (в кассу)`}
                                                  size="small"
                                                  color="success"
                                                  variant="outlined"
                                                  sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                                                />
                                              ) : (
                                                <Typography variant="caption" color="text.secondary">
                                                  Внешнее направление
                                                </Typography>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.4 }}>
                                                <LatexText text={p.exact_dosimetry || p.dosage_or_regimen || p.regimen_standard || catItem?.dosage_or_regimen || 'По назначению врача'} />
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                              <IconButton
                                                size="small"
                                                color="info"
                                                title="Подробный клинический регламент, методика и EBM"
                                                onClick={() => {
                                                  setTreatmentModalItem({
                                                    ...((catItem as any) || {}),
                                                    ...(p as any),
                                                    evidence_level: evLevel,
                                                    apparatus_examples: apparatus
                                                  });
                                                  setTreatmentModalCategory('physiotherapy');
                                                }}
                                              >
                                                <InfoIcon fontSize="small" />
                                              </IconButton>
                                            </TableCell>
                                            <TableCell align="center">
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleRemoveTreatmentItem(p.item_code, 'physiotherapy')}
                                              >
                                                <DeleteIcon fontSize="small" />
                                              </IconButton>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              );
                            };

                            return (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Section P1: First Line EBM */}
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <StarIcon sx={{ color: '#7C3AED', fontSize: 22 }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                      ⭐ Приоритет P1: Базовая патогенетическая физиотерапия (1-я линия EBM)
                                    </Typography>
                                    <Chip label={`${filteredP1.length}`} size="small" sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontWeight: 900 }} />
                                  </Box>
                                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.25 }}>
                                    Методы с наивысшим доказательным уровнем (1A / 1B), воздействующие непосредственно на ключевой патогенез нозологии.
                                  </Typography>
                                  {renderPhysioTable(filteredP1, true)}
                                </Box>

                                {/* Section P2: Second Line Adjuvant */}
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <HealingIcon sx={{ color: '#0284C7', fontSize: 22 }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                      🎯 Приоритет P2: Адъювантная и поддерживающая терапия (2-я линия)
                                    </Typography>
                                    <Chip label={`${filteredP2.length}`} size="small" sx={{ bgcolor: '#E0F2FE', color: '#0284C7', fontWeight: 900 }} />
                                  </Box>
                                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.25 }}>
                                    Синергичные методики, миорелаксация, лимфодренаж, электростимуляция и функциональная реабилитация.
                                  </Typography>
                                  {renderPhysioTable(filteredP2, false)}
                                </Box>
                              </Box>
                            );
                          })()}
                        </Box>
                      );
                    })()}
                  </Box>
                )}

                {/* TAB 6: Orthotics & External Support */}
                {activeTab === 6 && (
                  <Box>
                    {/* Header Card with EBM Priority & Weight Bearing Badges */}
                    {(() => {
                      const allO = currentTemplate.orthotics || [];
                      const stopWarnings = allO.filter(o => o.is_stop_warning === 1 || o.is_stop_warning === true || o.ebm_priority === 'P0-STOP' || o.ebm_priority === 'P0-CONTRA');
                      const nonStop = allO.filter(o => !(o.is_stop_warning === 1 || o.is_stop_warning === true || o.ebm_priority === 'P0-STOP' || o.ebm_priority === 'P0-CONTRA'));
                      const tmplPri = currentTemplate.orthotics_priority || 'P2';
                      const priBadge = getOrthoticsPriorityBadge(tmplPri);
                      const wbMode = currentTemplate.orthotics_weight_bearing || (nonStop[0]?.weight_bearing_mode) || 'WBAT';
                      const wbBadge = getWeightBearingBadge(wbMode);

                      const p1Count = nonStop.filter(o => o.ebm_priority === 'P1').length;
                      const p2Count = nonStop.filter(o => o.ebm_priority === 'P2' || !o.ebm_priority).length;
                      const p3Count = nonStop.filter(o => o.ebm_priority === 'P3').length;
                      const intCount = nonStop.filter(o => o.service_scope === 'internal').length;

                      return (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            mb: 2.5,
                            borderRadius: 2.5,
                            bgcolor: '#F0FDF4',
                            borderColor: '#BBF7D0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5 }}>
                            <Box sx={{ flex: 1, minWidth: 280 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <ShieldIcon sx={{ color: '#059669', fontSize: 24 }} />
                                  7. Ортопедические изделия, ортезирование и режимы разгрузки
                                </Typography>
                                <Chip
                                  label={`${priBadge.icon} ${priBadge.label}`}
                                  size="small"
                                  sx={{
                                    fontWeight: 900,
                                    fontSize: '0.72rem',
                                    bgcolor: priBadge.bg,
                                    color: priBadge.color,
                                    border: `1px solid ${priBadge.border}`
                                  }}
                                />
                                <Tooltip title={wbBadge.fullTitle} arrow>
                                  <Chip
                                    label={`${wbBadge.icon} ${wbBadge.label}`}
                                    size="small"
                                    sx={{
                                      fontWeight: 900,
                                      fontSize: '0.72rem',
                                      bgcolor: wbBadge.bg,
                                      color: wbBadge.color,
                                      border: `1px solid ${wbBadge.border}`
                                    }}
                                  />
                                </Tooltip>
                              </Box>
                              <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.45 }}>
                                Стандарт биомеханического ортезирования (ISO 8549, AO Trauma, AAOS): 1-я линия (P1 структурно-спасающая иммобилизация), 2-я линия (P2 функциональная коррекция оси) и шкала осевой нагрузки (NWB/TTWB/PWB/WBAT/FWB).
                              </Typography>
                              {currentTemplate.orthotics_summary && (
                                <Box sx={{ mt: 1, p: 1, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px solid #DCFCE7' }}>
                                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600, display: 'block' }}>
                                    <strong>Клинический регламент разгрузки:</strong> <LatexText text={currentTemplate.orthotics_summary} />
                                  </Typography>
                                </Box>
                              )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => setOrthoticsModalOpen(true)}
                                sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                              >
                                + Добавить ортез / стельки
                              </Button>
                            </Box>
                          </Box>

                          {/* Metric Chips Row */}
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5, pt: 1.25, borderTop: '1px solid #DCFCE7' }}>
                            <Chip label={`Всего изделий: ${nonStop.length}`} size="small" sx={{ fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }} />
                            <Chip label={`🏥 В кассу клиники: ${intCount}`} size="small" sx={{ fontWeight: 800, bgcolor: '#D1FAE5', color: '#047857' }} />
                            {p1Count > 0 && <Chip label={`⭐ P1 Обязательные: ${p1Count}`} size="small" sx={{ fontWeight: 800, bgcolor: '#FEF2F2', color: '#DC2626' }} />}
                            {p2Count > 0 && <Chip label={`🎯 P2 Функциональные: ${p2Count}`} size="small" sx={{ fontWeight: 800, bgcolor: '#F0F9FF', color: '#0284C7' }} />}
                            {p3Count > 0 && <Chip label={`🔍 P3 Адаптивные: ${p3Count}`} size="small" sx={{ fontWeight: 800, bgcolor: '#F0FDFA', color: '#0D9488' }} />}
                            {stopWarnings.length > 0 && (
                              <Chip
                                icon={<WarningAmberIcon sx={{ fontSize: '14px !important', color: '#DC2626' }} />}
                                label={`🚨 CDSS Запреты: ${stopWarnings.length}`}
                                size="small"
                                sx={{ fontWeight: 900, bgcolor: '#FEE2E2', color: '#B91C1C', border: '1px solid #F87171' }}
                              />
                            )}
                          </Box>
                        </Paper>
                      );
                    })()}

                    {/* CDSS STOP Red Flag Warning Alert Banner */}
                    {(() => {
                      const allO = currentTemplate.orthotics || [];
                      const stopW = allO.filter(o => o.is_stop_warning === 1 || o.is_stop_warning === true || o.ebm_priority === 'P0-STOP' || o.ebm_priority === 'P0-CONTRA');
                      const hasStop = currentTemplate.orthotics_has_stop === 1 || Boolean(currentTemplate.orthotics_stop_rationale) || stopW.length > 0;
                      if (!hasStop) return null;

                      const rationale = currentTemplate.orthotics_stop_rationale || stopW[0]?.stop_rationale || 'Ограничение нерациональной иммобилизации или преждевременной осевой нагрузки.';

                      return (
                        <Alert
                          severity="error"
                          icon={<LockIcon sx={{ color: '#DC2626' }} />}
                          sx={{
                            mb: 2.5,
                            borderRadius: 2,
                            border: '1.5px solid #EF4444',
                            bgcolor: '#FEF2F2',
                            '& .MuiAlert-message': { width: '100%' }
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#991B1B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            CDSS STOP LOCK: КЛИНИЧЕСКИЙ ЗАПРЕТ ОПАСНОЙ ИММОБИЛИЗАЦИИ ИЛИ НАГРУЗКИ [P0-STOP / P0-CONTRA]
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#7F1D1D', mt: 0.5, fontWeight: 600 }}>
                            <LatexText text={rationale} />
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#991B1B', display: 'block', mt: 0.5 }}>
                            Программный контроль СППВР МИС: защищает пациента от вторичного смещения отломков, асептического некроза головки, атрофических контрактур и компрессионных нейропатий.
                          </Typography>
                        </Alert>
                      );
                    })()}

                    {/* Multi-Tier Filter Toolbar */}
                    {(() => {
                      const allO = currentTemplate.orthotics || [];
                      const nonStop = allO.filter(o => !(o.is_stop_warning === 1 || o.is_stop_warning === true || o.ebm_priority === 'P0-STOP' || o.ebm_priority === 'P0-CONTRA'));
                      const stopWarnings = allO.filter(o => o.is_stop_warning === 1 || o.is_stop_warning === true || o.ebm_priority === 'P0-STOP' || o.ebm_priority === 'P0-CONTRA');

                      return (
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 2.5, bgcolor: '#F8FAFC', borderRadius: 2, borderColor: '#CBD5E1' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/* Line 1: EBM Priority Filter */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', textTransform: 'uppercase', minWidth: 110 }}>
                                Приоритет EBM:
                              </Typography>
                              <Chip
                                label={`Все (${allO.length})`}
                                size="small"
                                onClick={() => setOrthoPriorityFilter('all')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: orthoPriorityFilter === 'all' ? '#0F3C64' : '#FFFFFF',
                                  color: orthoPriorityFilter === 'all' ? '#FFFFFF' : '#334155',
                                  border: orthoPriorityFilter === 'all' ? 'none' : '1px solid #CBD5E1'
                                }}
                              />
                              <Chip
                                label={`⭐ P1 Критический (${nonStop.filter(o => o.ebm_priority === 'P1').length})`}
                                size="small"
                                onClick={() => setOrthoPriorityFilter('P1')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: orthoPriorityFilter === 'P1' ? '#DC2626' : '#FFFFFF',
                                  color: orthoPriorityFilter === 'P1' ? '#FFFFFF' : '#DC2626',
                                  border: orthoPriorityFilter === 'P1' ? 'none' : '1px solid #FCA5A5'
                                }}
                              />
                              <Chip
                                label={`🎯 P2 Функция (${nonStop.filter(o => o.ebm_priority === 'P2' || !o.ebm_priority).length})`}
                                size="small"
                                onClick={() => setOrthoPriorityFilter('P2')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: orthoPriorityFilter === 'P2' ? '#059669' : '#FFFFFF',
                                  color: orthoPriorityFilter === 'P2' ? '#FFFFFF' : '#059669',
                                  border: orthoPriorityFilter === 'P2' ? 'none' : '1px solid #A7F3D0'
                                }}
                              />
                              <Chip
                                label={`🔍 P3 Адаптив (${nonStop.filter(o => o.ebm_priority === 'P3').length})`}
                                size="small"
                                onClick={() => setOrthoPriorityFilter('P3')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: orthoPriorityFilter === 'P3' ? '#0D9488' : '#FFFFFF',
                                  color: orthoPriorityFilter === 'P3' ? '#FFFFFF' : '#0D9488',
                                  border: orthoPriorityFilter === 'P3' ? 'none' : '1px solid #99F6E4'
                                }}
                              />
                              {stopWarnings.length > 0 && (
                                <Chip
                                  label={`🚨 P0-STOP Запреты (${stopWarnings.length})`}
                                  size="small"
                                  onClick={() => setOrthoPriorityFilter('P0-STOP')}
                                  sx={{
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    bgcolor: orthoPriorityFilter === 'P0-STOP' ? '#991B1B' : '#FFFFFF',
                                    color: orthoPriorityFilter === 'P0-STOP' ? '#FFFFFF' : '#991B1B',
                                    border: orthoPriorityFilter === 'P0-STOP' ? 'none' : '1px solid #FCA5A5'
                                  }}
                                />
                              )}
                            </Box>

                            {/* Line 2: Category Filter */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', textTransform: 'uppercase', minWidth: 110 }}>
                                Категория:
                              </Typography>
                              <Chip
                                label="Все категории"
                                size="small"
                                onClick={() => setOrthoFilter('all')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: orthoFilter === 'all' ? '#059669' : '#FFFFFF',
                                  color: orthoFilter === 'all' ? '#FFFFFF' : '#334155',
                                  border: orthoFilter === 'all' ? 'none' : '1px solid #CBD5E1'
                                }}
                              />
                              <Chip
                                label="🏥 В кассу клиники"
                                size="small"
                                onClick={() => setOrthoFilter('internal')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: orthoFilter === 'internal' ? '#059669' : '#FFFFFF',
                                  color: orthoFilter === 'internal' ? '#FFFFFF' : '#047857',
                                  border: orthoFilter === 'internal' ? 'none' : '1px solid #A7F3D0'
                                }}
                              />
                              <Chip
                                label="Стельки Formthotics"
                                size="small"
                                onClick={() => setOrthoFilter('insole')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: orthoFilter === 'insole' ? '#059669' : '#FFFFFF',
                                  color: orthoFilter === 'insole' ? '#FFFFFF' : '#334155',
                                  border: orthoFilter === 'insole' ? 'none' : '1px solid #CBD5E1'
                                }}
                              />
                              <Chip
                                label="Брейсы и Туторы"
                                size="small"
                                onClick={() => setOrthoFilter('brace')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: orthoFilter === 'brace' ? '#059669' : '#FFFFFF',
                                  color: orthoFilter === 'brace' ? '#FFFFFF' : '#334155',
                                  border: orthoFilter === 'brace' ? 'none' : '1px solid #CBD5E1'
                                }}
                              />
                              <Chip
                                label="TurboCast иммобилизация"
                                size="small"
                                onClick={() => setOrthoFilter('turbo')}
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  bgcolor: orthoFilter === 'turbo' ? '#059669' : '#FFFFFF',
                                  color: orthoFilter === 'turbo' ? '#FFFFFF' : '#334155',
                                  border: orthoFilter === 'turbo' ? 'none' : '1px solid #CBD5E1'
                                }}
                              />
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })()}

                    {/* Grouped EBM Sections or Table */}
                    {(() => {
                      const allO = currentTemplate.orthotics || [];

                      const filteredO = allO.filter(o => {
                        // Priority filter
                        if (orthoPriorityFilter !== 'all') {
                          if (orthoPriorityFilter === 'P0-STOP') {
                            const isStop = o.is_stop_warning === 1 || o.is_stop_warning === true || o.ebm_priority === 'P0-STOP' || o.ebm_priority === 'P0-CONTRA';
                            if (!isStop) return false;
                          } else {
                            if (o.ebm_priority !== orthoPriorityFilter) return false;
                          }
                        }

                        // Category filter
                        if (orthoFilter === 'internal') {
                          if (o.service_scope !== 'internal') return false;
                        } else if (orthoFilter === 'insole') {
                          const isIns = o.subcategory === 'insole' || o.item_code.includes('formthotics') || o.item_code.includes('insole');
                          if (!isIns) return false;
                        } else if (orthoFilter === 'brace') {
                          const isBrace = o.subcategory === 'brace' || o.item_code.includes('brace') || o.item_code.includes('tutor');
                          if (!isBrace) return false;
                        } else if (orthoFilter === 'turbo') {
                          const isTurbo = o.subcategory === 'turbocast' || o.item_code.includes('turbo');
                          if (!isTurbo) return false;
                        }

                        return true;
                      });

                      if (allO.length === 0) {
                        return (
                          <Alert severity="info" sx={{ borderRadius: 2 }}>
                            В данном шаблоне нет назначенных ортопедических изделий. Нажмите <strong>«+ Добавить ортез / стельки»</strong> для назначения из клинического каталога.
                          </Alert>
                        );
                      }

                      // Split into tiers
                      const stopItems = filteredO.filter(o => o.is_stop_warning === 1 || o.is_stop_warning === true || o.ebm_priority === 'P0-STOP' || o.ebm_priority === 'P0-CONTRA');
                      const p1Items = filteredO.filter(o => o.ebm_priority === 'P1' && !(o.is_stop_warning === 1 || o.is_stop_warning === true));
                      const p2Items = filteredO.filter(o => (o.ebm_priority === 'P2' || !o.ebm_priority) && !(o.is_stop_warning === 1 || o.is_stop_warning === true));
                      const p3Items = filteredO.filter(o => o.ebm_priority === 'P3' && !(o.is_stop_warning === 1 || o.is_stop_warning === true));

                      const renderOrthoticsTable = (items: TemplateTreatmentRelItem[], tierBadge: { label: string; color: string; bg: string; icon: string }) => {
                        if (items.length === 0) return null;
                        return (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: tierBadge.color, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span>{tierBadge.icon}</span> {tierBadge.label}
                              </Typography>
                              <Chip label={`${items.length}`} size="small" sx={{ bgcolor: tierBadge.bg, color: tierBadge.color, fontWeight: 900 }} />
                            </Box>
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#E2E8F0' }}>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Ортопедическое изделие</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#334155', width: 110 }}>ISO Класс</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#334155', width: 140 }}>Осевая опора</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#334155', width: 160 }}>Настройка шарнира</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Режим ношения</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#334155', width: 130 }}>Прайс (касса)</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#334155', width: 50 }} align="center">Инфо</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#334155', width: 50 }} align="center">Удалить</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {items.map((o) => {
                                    const catItem = orthoticsCatalog.find(oc => oc.code === o.item_code);
                                    const isInternal = o.service_scope === 'internal';
                                    const isStop = o.is_stop_warning === 1 || o.is_stop_warning === true || o.ebm_priority === 'P0-STOP' || o.ebm_priority === 'P0-CONTRA';
                                    const wb = getWeightBearingBadge(o.weight_bearing_mode);

                                    return (
                                      <TableRow key={o.item_code} hover sx={{ bgcolor: isStop ? '#FEF2F2' : undefined }}>
                                        <TableCell>
                                          <Typography variant="body2" sx={{ fontWeight: 700, color: isStop ? '#B91C1C' : '#0F172A' }}>
                                            <LatexText text={o.name || catItem?.name || o.item_code} />
                                          </Typography>
                                          {isStop && o.stop_rationale && (
                                            <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 700, display: 'block', mt: 0.25 }}>
                                              🛑 Запрет: <LatexText text={o.stop_rationale} />
                                            </Typography>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={o.device_type_iso || o.subcategory?.toUpperCase() || 'FO'}
                                            size="small"
                                            sx={{
                                              fontWeight: 900,
                                              fontSize: '0.68rem',
                                              height: 22,
                                              bgcolor: '#EFF6FF',
                                              color: '#1D4ED8',
                                              border: '1px solid #BFDBFE'
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Tooltip title={wb.fullTitle} arrow>
                                            <Chip
                                              label={`${wb.icon} ${wb.label}`}
                                              size="small"
                                              sx={{
                                                fontWeight: 800,
                                                fontSize: '0.68rem',
                                                height: 22,
                                                bgcolor: wb.bg,
                                                color: wb.color,
                                                border: `1px solid ${wb.border}`
                                              }}
                                            />
                                          </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369A1' }}>
                                            <LatexText text={o.hinge_settings || 'Стандарт'} />
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                                            <LatexText text={o.wearing_regimen || o.dosage_or_regimen || o.regimen_standard || catItem?.dosage_or_regimen || 'По назначению врача'} />
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          {o.servdict_price ? (
                                            <Chip
                                              label={`${o.servdict_price.toLocaleString('ru-RU')} ₽`}
                                              size="small"
                                              color="success"
                                              variant="outlined"
                                              sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                                            />
                                          ) : (
                                            <Typography variant="caption" color="text.secondary">
                                              Внешнее
                                            </Typography>
                                          )}
                                        </TableCell>
                                        <TableCell align="center">
                                          <IconButton
                                            size="small"
                                            color="info"
                                            title="Подробный клинический регламент, методика и EBM"
                                            onClick={() => {
                                              setTreatmentModalItem((catItem as any) || (o as any));
                                              setTreatmentModalCategory('orthotics');
                                            }}
                                          >
                                            <InfoIcon fontSize="small" />
                                          </IconButton>
                                        </TableCell>
                                        <TableCell align="center">
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveTreatmentItem(o.item_code, 'orthotics')}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        );
                      };

                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {stopItems.length > 0 && renderOrthoticsTable(stopItems, { label: 'P0-STOP: Ограничения безопасности и запреты', color: '#DC2626', bg: '#FEF2F2', icon: '🚨' })}
                          {p1Items.length > 0 && renderOrthoticsTable(p1Items, { label: 'P1: Структурно-спасающая иммобилизация и обязательная разгрузка', color: '#DC2626', bg: '#FEF2F2', icon: '⭐' })}
                          {p2Items.length > 0 && renderOrthoticsTable(p2Items, { label: 'P2: Функциональное ортезирование и коррекция оси', color: '#059669', bg: '#ECFDF5', icon: '🎯' })}
                          {p3Items.length > 0 && renderOrthoticsTable(p3Items, { label: 'P3: Адаптивно-профилактическая поддержка и бандажи', color: '#0D9488', bg: '#F0FDFA', icon: '🔍' })}
                        </Box>
                      );
                    })()}

                    {/* Generator Box for Orthopedic Offloading Note */}
                    {(() => {
                      const allO = currentTemplate.orthotics || [];
                      const nonStop = allO.filter(o => !(o.is_stop_warning === 1 || o.is_stop_warning === true || o.ebm_priority === 'P0-STOP' || o.ebm_priority === 'P0-CONTRA'));
                      const stopW = allO.filter(o => o.is_stop_warning === 1 || o.is_stop_warning === true || o.ebm_priority === 'P0-STOP' || o.ebm_priority === 'P0-CONTRA');
                      const wbMode = currentTemplate.orthotics_weight_bearing || (nonStop[0]?.weight_bearing_mode) || 'WBAT';
                      const wbBadge = getWeightBearingBadge(wbMode);

                      let noteLines = [`Режим осевой нагрузки: ${wbBadge.fullTitle}.`];
                      if (currentTemplate.orthotics_has_stop === 1 || stopW.length > 0) {
                        noteLines.push(`[CDSS Red Flag] ${currentTemplate.orthotics_stop_rationale || stopW[0]?.stop_rationale || 'Соблюдение запрета нерациональной нагрузки/иммобилизации.'}`);
                      }
                      if (nonStop.length > 0) {
                        noteLines.push(`Назначенные ортопедические изделия:`);
                        nonStop.forEach((o, i) => {
                          const hinge = o.hinge_settings ? ` (шарнир: ${o.hinge_settings})` : '';
                          const regimen = o.wearing_regimen || o.dosage_or_regimen ? ` — ${o.wearing_regimen || o.dosage_or_regimen}` : '';
                          noteLines.push(`  ${i + 1}. [${o.ebm_priority || 'P2'}] ${o.name || o.item_code}${hinge}${regimen}`);
                        });
                      }
                      const generatedText = noteLines.join('\n');

                      return (
                        <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: 2, bgcolor: '#F8FAFC', borderColor: '#CBD5E1' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <BrainIcon sx={{ color: '#059669', fontSize: 20 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase' }}>
                                Генератор заключения по ортезированию и разгрузке (для медкарты)
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={copiedOrthoProtocol ? <CheckCircleIcon sx={{ color: '#16A34A' }} /> : <ContentCopyIcon />}
                              onClick={() => {
                                navigator.clipboard.writeText(cleanLatexText(generatedText));
                                setCopiedOrthoProtocol(true);
                                setTimeout(() => setCopiedOrthoProtocol(false), 2500);
                              }}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                borderColor: copiedOrthoProtocol ? '#16A34A' : '#CBD5E1',
                                color: copiedOrthoProtocol ? '#16A34A' : '#334155'
                              }}
                            >
                              {copiedOrthoProtocol ? 'Скопировано!' : 'Копировать регламент'}
                            </Button>
                          </Box>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              bgcolor: '#FFFFFF',
                              borderRadius: 1.5,
                              fontFamily: 'monospace',
                              fontSize: '0.82rem',
                              color: '#1E293B',
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.5
                            }}
                          >
                            <LatexText text={generatedText} />
                          </Paper>
                        </Paper>
                      );
                    })()}
                  </Box>
                )}

                {/* TAB 7: Live Protocol Preview */}
                {activeTab === 7 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Top Action Bar */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: 2,
                        flexWrap: 'wrap',
                        gap: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ArticleIcon sx={{ color: '#0F3C64', fontSize: 24 }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                            Предпросмотр клинического протокола первичного осмотра
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Формат для электронной медкарты (ЭМК), печати на бланке и экспорта
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={copiedProtocol ? <CheckCircleIcon sx={{ color: '#16A34A' }} /> : <ContentCopyIcon />}
                          onClick={() => {
                            const fullText = [
                              'ЦЕНТР ОРТОПЕДИИ И МЕДИЦИНСКОЙ РЕАБИЛИТАЦИИ',
                              'ПРОТОКОЛ ПЕРВИЧНОГО ПРИЕМА ВРАЧА ТРАВМАТОЛОГА-ОРТОПЕДА',
                              '----------------------------------------------------------------',
                              `Диагноз: [${currentTemplate.default_mkb_code || ''}] ${currentTemplate.title} (${currentTemplate.default_side === 'right' ? 'справа' : currentTemplate.default_side === 'left' ? 'слева' : 'двусторонний'})`,
                              currentTemplate.stage_or_severity ? `Стадия: ${currentTemplate.stage_or_severity}` : '',
                              '',
                              '1. ЖАЛОБЫ:',
                              currentTemplate.complaints_template || 'Не указаны',
                              '',
                              '2. АНАМНЕЗ ЗАБОЛЕВАНИЯ (Anamnesis morbi):',
                              currentTemplate.anamnesis_template || 'Не указан',
                              currentTemplate.anamnesis_vitae_template ? `\nАнамнез жизни (Anamnesis vitae):\n${currentTemplate.anamnesis_vitae_template}` : '',
                              '',
                              '3. ОБЪЕКТИВНЫЙ СТАТУС (Status praesens):',
                              currentTemplate.objective_status_template || 'Состояние удовлетворительное.',
                              '',
                              '4. ЛОКАЛЬНЫЙ ОРТОПЕДИЧЕСКИЙ СТАТУС (Status localis):',
                              currentTemplate.objective_template || 'Без особенностей.',
                              formatRomClinicalSummary(currentTemplate.rom_norm_preset, currentTemplate),
                              '',
                              '5. СПЕЦИАЛЬНЫЕ ОРТОПЕДИЧЕСКИЕ ТЕСТЫ:',
                              ...(currentTemplate.tests || []).map(t => `- ${t.name_ru || t.test_code}: ${t.expected_result === 'positive' ? 'ПОЛОЖИТЕЛЬНЫЙ (+)' : t.expected_result === 'negative' ? 'ОТРИЦАТЕЛЬНЫЙ (-)' : t.expected_result}`),
                              '',
                              '6. ПЛАН ДОПОЛНИТЕЛЬНОГО ОБСЛЕДОВАНИЯ:',
                              ...(currentTemplate.diagnostics || []).map(d => `- ${d.protocol_phrase || d.name || d.diagnostic_code}`),
                              '',
                              '7. НАЗНАЧЕННОЕ ЛЕЧЕНИЕ И МАНИПУЛЯЦИИ:',
                              ...(function() {
                                const res: string[] = ['-- Лечебно-диагностические манипуляции и инъекционная терапия:'];
                                if (currentTemplate.manipulations_has_stop === 1 || currentTemplate.manipulations_stop_rationale) {
                                  res.push(`  ! CDSS ОГРАНИЧЕНИЕ / ПРОТИВОПОКАЗАНИЕ [P0-STOP]: ${cleanLatexText(currentTemplate.manipulations_stop_rationale || 'Противопоказания')}`);
                                }
                                const manList = currentTemplate.manipulations || [];
                                const p1 = manList.filter(m => m.ebm_priority === 'P1');
                                const p2 = manList.filter(m => m.ebm_priority === 'P2' || (!m.ebm_priority && !m.is_stop_warning));
                                const p3 = manList.filter(m => m.ebm_priority === 'P3');
                                if (p1.length > 0) {
                                  res.push('  [1-я линия / Золотой стандарт и неотложные P1]:');
                                  p1.forEach(m => res.push(`    - ${m.name || m.item_code} (${m.navigation_type === 'us_guided' ? 'US-guided' : m.navigation_type === 'c_arm' ? 'C-arm' : 'пальпаторно'}): ${m.dosage_or_regimen || m.regimen_standard || 'По регламенту'}`));
                                }
                                if (p2.length > 0) {
                                  res.push('  [2-я линия / Таргетная терапия и ортобиология P2]:');
                                  p2.forEach(m => res.push(`    - ${m.name || m.item_code} (${m.navigation_type === 'us_guided' ? 'US-guided' : m.navigation_type === 'c_arm' ? 'C-arm' : 'пальпаторно'}): ${m.dosage_or_regimen || m.regimen_standard || 'По регламенту'}`));
                                }
                                if (p3.length > 0) {
                                  res.push('  [3-я линия / Вспомогательные пособия и ПИР P3]:');
                                  p3.forEach(m => res.push(`    - ${m.name || m.item_code}: ${m.dosage_or_regimen || m.regimen_standard || 'По регламенту'}`));
                                }
                                if (currentTemplate.performed_manipulations_template) {
                                  res.push(`  [Протокол выполненной манипуляции]: ${cleanLatexText(currentTemplate.performed_manipulations_template)}`);
                                }
                                return res;
                              })(),
                              ...(function() {
                                const physList = currentTemplate.physiotherapy || [];
                                if (physList.length === 0) return [];
                                const stopW = physList.filter(p => p.is_stop_warning === 1 || p.is_stop_warning === true || p.item_code === 'phys_cdss_stop' || p.ebm_priority === 'STOP');
                                const nonStop = physList.filter(p => !(p.is_stop_warning === 1 || p.is_stop_warning === true || p.item_code === 'phys_cdss_stop' || p.ebm_priority === 'STOP'));
                                const p1 = nonStop.filter(p => p.ebm_priority === 'P1');
                                const p2 = nonStop.filter(p => p.ebm_priority !== 'P1');
                                const res: string[] = ['\n-- Физиотерапия и аппаратное восстановительное лечение:'];
                                if (stopW.length > 0) {
                                  stopW.forEach(sw => {
                                    res.push(`  ! CDSS ОГРАНИЧЕНИЕ / ПРЕДУПРЕЖДЕНИЕ [STOP]: ${sw.exact_dosimetry || sw.dosage_or_regimen || sw.stop_rationale || 'Противопоказания'}`);
                                  });
                                }
                                if (p1.length > 0) {
                                  res.push('  [1-я линия / EBM Патогенетический оптимум P1]:');
                                  p1.forEach(p => {
                                    const dos = p.exact_dosimetry || p.dosage_or_regimen || 'Курсовое лечение';
                                    const zone = p.target_anatomical_landmark ? ` [Зона: ${p.target_anatomical_landmark}]` : '';
                                    res.push(`    - ${p.name || p.item_code}${zone}: ${dos}`);
                                  });
                                }
                                if (p2.length > 0) {
                                  res.push('  [2-я линия / Адъювантная терапия P2]:');
                                  p2.forEach(p => {
                                    const dos = p.exact_dosimetry || p.dosage_or_regimen || 'По показаниям';
                                    const zone = p.target_anatomical_landmark ? ` [Зона: ${p.target_anatomical_landmark}]` : '';
                                    res.push(`    - ${p.name || p.item_code}${zone}: ${dos}`);
                                  });
                                }
                                return res;
                              })(),
                              ...(() => {
                                const orthList = currentTemplate.orthotics || [];
                                if (orthList.length === 0 && !currentTemplate.orthotics_weight_bearing) return [];
                                const res: string[] = ['7. ОРТОПЕДИЧЕСКИЕ ИЗДЕЛИЯ, ОРТЕЗИРОВАНИЕ И РАЗГРУЗКА:'];
                                if (currentTemplate.orthotics_weight_bearing) {
                                  const wbMap: Record<string, string> = {
                                    'NWB': '0% нагрузки (Non-Weight Bearing, строгий костыльный режим)',
                                    'TTWB': '5-10% нагрузки (Toe-Touch Weight Bearing, прикосновение носком)',
                                    'PWB': '20-50% нагрузки (Partial Weight Bearing, частичная разгрузка)',
                                    'WBAT': 'Нагрузка по переносимости боли (Weight Bearing As Tolerated)',
                                    'FWB': '100% полная нагрузка (Full Weight Bearing)',
                                    'N/A': 'Не применимо к осевой нагрузке'
                                  };
                                  res.push(`  - Режим осевой нагрузки: ${wbMap[currentTemplate.orthotics_weight_bearing] || currentTemplate.orthotics_weight_bearing}`);
                                }
                                if (currentTemplate.orthotics_has_stop === 1 || currentTemplate.orthotics_stop_rationale) {
                                  res.push(`  - [ВНИМАНИЕ! КЛИНИЧЕСКИЙ CDSS STOP]: ${currentTemplate.orthotics_stop_rationale || 'Иммобилизация противопоказана'}`);
                                }
                                const p1 = orthList.filter(o => o.ebm_priority === 'P1' && o.is_stop_warning !== 1);
                                const p2 = orthList.filter(o => o.ebm_priority === 'P2' && o.is_stop_warning !== 1);
                                const p3 = orthList.filter(o => (!o.ebm_priority || o.ebm_priority === 'P3') && o.is_stop_warning !== 1);

                                if (p1.length > 0) {
                                  res.push('  [Обязательное / Структуросберегающее ортезирование P1]:');
                                  p1.forEach(o => {
                                    const reg = o.wearing_regimen || o.dosage_or_regimen || 'Постоянное ношение при нагрузке';
                                    const iso = o.device_type_iso ? ` [${o.device_type_iso}]` : '';
                                    const hng = o.hinge_settings ? ` (Шарнир: ${o.hinge_settings})` : '';
                                    res.push(`    - ${o.name || o.item_code}${iso}: ${reg}${hng}`);
                                  });
                                }
                                if (p2.length > 0) {
                                  res.push('  [Функциональная биомеханическая коррекция P2]:');
                                  p2.forEach(o => {
                                    const reg = o.wearing_regimen || o.dosage_or_regimen || 'Ношение при активности';
                                    const iso = o.device_type_iso ? ` [${o.device_type_iso}]` : '';
                                    const hng = o.hinge_settings ? ` (Шарнир: ${o.hinge_settings})` : '';
                                    res.push(`    - ${o.name || o.item_code}${iso}: ${reg}${hng}`);
                                  });
                                }
                                if (p3.length > 0) {
                                  res.push('  [Профилактическое / Поддерживающее ортезирование P3]:');
                                  p3.forEach(o => {
                                    const reg = o.wearing_regimen || o.dosage_or_regimen || 'По потребности';
                                    const iso = o.device_type_iso ? ` [${o.device_type_iso}]` : '';
                                    const hng = o.hinge_settings ? ` (Шарнир: ${o.hinge_settings})` : '';
                                    res.push(`    - ${o.name || o.item_code}${iso}: ${reg}${hng}`);
                                  });
                                }
                                return res;
                              })(),
                              '',
                              '8. ОБЩИЕ РЕКОМЕНДАЦИИ И РЕЖИМ:',
                              currentTemplate.recommendations_template || 'Охранительный двигательный режим.'
                            ].filter(Boolean).join('\n');

                            navigator.clipboard.writeText(cleanLatexText(fullText));
                            setCopiedProtocol(true);
                            setTimeout(() => setCopiedProtocol(false), 2500);
                          }}
                          sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#CBD5E1' }}
                        >
                          {copiedProtocol ? 'Скопировано!' : 'Копировать текст'}
                        </Button>

                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PrintIcon />}
                          onClick={() => handlePrintProtocol()}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: '#0F3C64',
                            '&:hover': { bgcolor: '#0B2C4B' }
                          }}
                        >
                          Печать бланка A4
                        </Button>
                      </Box>
                    </Paper>

                    {/* Printable Paper Canvas */}
                    <Paper
                      ref={protocolPrintRef}
                      elevation={2}
                      sx={{
                        p: { xs: 2.5, sm: 4 },
                        border: '1px solid #CBD5E1',
                        borderRadius: 2,
                        bgcolor: '#FFFFFF',
                        maxWidth: '900px',
                        mx: 'auto',
                        width: '100%',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        fontFamily: '"Times New Roman", Times, serif',
                        color: '#0F172A'
                      }}
                    >
                      {/* Clinical Document Header */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '2.5px solid #0F3C64',
                          pb: 1.5,
                          mb: 2.5
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '8px',
                              bgcolor: '#0F3C64',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <HospitalIcon sx={{ fontSize: 28 }} />
                          </Box>
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 900,
                                fontSize: '1.05rem',
                                color: '#0F3C64',
                                letterSpacing: '0.04em',
                                lineHeight: 1.2
                              }}
                            >
                              ЦЕНТР ОРТОПЕДИИ И МЕДИЦИНСКОЙ РЕАБИЛИТАЦИИ
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '0.8rem',
                                color: '#475569',
                                fontWeight: 600,
                                letterSpacing: '0.02em'
                              }}
                            >
                              Клинический протокол первичного приема врача травматолога-ортопеда
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={`Шаблон #${currentTemplate.id || 'NEW'}`}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: '0.7rem', height: 20, bgcolor: '#F1F5F9', mb: 0.5 }}
                          />
                          <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {new Date().toLocaleDateString('ru-RU')}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Diagnosis & Classification Highlight Card */}
                      <Box
                        sx={{
                          p: 1.75,
                          mb: 2.5,
                          borderRadius: '8px',
                          bgcolor: '#F8FAFC',
                          border: '1.5px solid #E2E8F0',
                          borderLeft: '5px solid #0F3C64'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Chip
                            label={currentTemplate.default_mkb_code || 'МКБ-10'}
                            size="small"
                            sx={{
                              bgcolor: '#0F3C64',
                              color: '#FFF',
                              fontWeight: 900,
                              fontSize: '0.75rem',
                              height: 22
                            }}
                          />
                          <Typography sx={{ fontWeight: 800, fontSize: '1.02rem', color: '#0F172A' }}>
                            <LatexText text={currentTemplate.title} />
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.75 }}>
                          <Typography sx={{ fontSize: '0.82rem', color: '#334155' }}>
                            <strong>Локализация процесса:</strong>{' '}
                            {currentTemplate.default_side === 'right' ? 'Справа' : currentTemplate.default_side === 'left' ? 'Слева' : 'Двусторонний'} (Сустав: {currentTemplate.joint_name?.toUpperCase()})
                          </Typography>
                          {currentTemplate.stage_or_severity && (
                            <Typography sx={{ fontSize: '0.82rem', color: '#0284C7', fontWeight: 700 }}>
                              <strong>Стадия/Степень:</strong> <LatexText text={currentTemplate.stage_or_severity} />
                            </Typography>
                          )}
                          {currentTemplate.cluster_name && (
                            <Typography sx={{ fontSize: '0.82rem', color: '#64748B' }}>
                              <strong>Кластер:</strong> {currentTemplate.cluster_name}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* 1. Complaints */}
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F3C64', textTransform: 'uppercase', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span>1. Жалобы при первичном обращении:</span>
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#1E293B', pl: 1, borderLeft: '2px solid #E2E8F0' }}>
                          <LatexText text={currentTemplate.complaints_template || 'Активных жалоб не предъявляет.'} />
                        </Typography>
                      </Box>

                      {/* 2. Anamnesis Morbi & Vitae */}
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F3C64', textTransform: 'uppercase', mb: 0.5 }}>
                          2. Анамнез заболевания (Anamnesis morbi):
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#1E293B', pl: 1, borderLeft: '2px solid #E2E8F0', mb: 1 }}>
                          <LatexText text={currentTemplate.anamnesis_template || 'Заболевание развивалось постепенно, связь с травмой отрицает.'} />
                        </Typography>

                        {currentTemplate.anamnesis_vitae_template && (
                          <Box sx={{ pl: 1, borderLeft: '2px solid #E2E8F0', mt: 0.5 }}>
                            <Typography sx={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>
                              <strong>Анамнез жизни (Anamnesis vitae):</strong> <LatexText text={currentTemplate.anamnesis_vitae_template} />
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* 3. Objective Status */}
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F3C64', textTransform: 'uppercase', mb: 0.5 }}>
                          3. Общий и локальный объективный статус (Status localis):
                        </Typography>
                        {currentTemplate.objective_status_template && (
                          <Typography sx={{ fontSize: '0.85rem', color: '#475569', mb: 0.75, pl: 1, borderLeft: '2px solid #E2E8F0' }}>
                            <strong>Общий статус:</strong> <LatexText text={currentTemplate.objective_status_template} />
                          </Typography>
                        )}
                        <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#1E293B', pl: 1, borderLeft: '2px solid #E2E8F0' }}>
                          <LatexText text={currentTemplate.objective_template || 'Контуры сустава сглажены, пальпация по суставной щели умеренно болезненна. Осевая нагрузка умеренно дискомфортна.'} />
                        </Typography>
                      </Box>

                      {/* 4. Biomechanics & ROM Table */}
                      {(() => {
                        const jointRomCfg = resolveRomConfig(currentTemplate);
                        const romData = currentTemplate.rom_norm_preset || {};
                        const sftr = computeSftrFormula(jointRomCfg.category, romData);
                        const severity = getRomSeverityBadge(romData);
                        const priorityBadge = getRomPriorityBadge(romData.priority || currentTemplate.rom_priority || 'P2');
                        const hasStopWarning = Boolean(romData.cdss_stop_warning || currentTemplate.rom_has_stop_warning === 1 || priorityBadge.code === 'P0-STOP');
                        const endFeel = romData.end_feel_expected || currentTemplate.rom_end_feel;

                        // Lag evaluation
                        const flexAct = romData.flexion_active !== undefined ? Number(romData.flexion_active) : undefined;
                        const flexPass = romData.flexion_passive !== undefined ? Number(romData.flexion_passive) : undefined;
                        const hasLag = flexAct !== undefined && flexPass !== undefined;
                        const lagVal = hasLag ? Math.max(0, (flexPass || 0) - (flexAct || 0)) : 0;

                        return (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, flexWrap: 'wrap', gap: 1 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F3C64', textTransform: 'uppercase' }}>
                                4. Биомеханика и гониометрия (ROM Neutral-0): {jointRomCfg.titleRu}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Chip
                                  label={`Neutral-0: ${sftr}`}
                                  size="small"
                                  sx={{ fontWeight: 800, bgcolor: '#0F3C64', color: '#FFFFFF', fontSize: '0.72rem', height: 22 }}
                                />
                                <Chip
                                  label={priorityBadge.label}
                                  size="small"
                                  sx={{
                                    fontWeight: 800,
                                    bgcolor: priorityBadge.bg,
                                    color: priorityBadge.color,
                                    border: `1px solid ${priorityBadge.border}`,
                                    fontSize: '0.7rem',
                                    height: 22
                                  }}
                                />
                                <Chip
                                  label={severity.label}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    bgcolor: severity.bg,
                                    color: severity.color,
                                    border: `1px solid ${severity.border}`,
                                    fontSize: '0.7rem',
                                    height: 22
                                  }}
                                />
                                {endFeel && (
                                  <Chip
                                    label={`End-Feel: ${endFeel}`}
                                    size="small"
                                    sx={{
                                      fontWeight: 700,
                                      bgcolor: '#EFF6FF',
                                      color: '#1D4ED8',
                                      border: '1px solid #BFDBFE',
                                      fontSize: '0.68rem',
                                      height: 22
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>

                            {/* CDSS STOP Red Flag Alert Box in Official Protocol */}
                            {hasStopWarning && (
                              <Box sx={{ mb: 1, p: 1, bgcolor: '#FEF2F2', border: '1.5px solid #EF4444', borderRadius: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                  <LockIcon sx={{ color: '#DC2626', fontSize: 16 }} />
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#B91C1C', textTransform: 'uppercase' }}>
                                    CDSS STOP WARNING / КЛИНИЧЕСКИЙ СТОП-СИГНАЛ БЕЗОПАСНОСТИ [P0-STOP]:
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.78rem', color: '#991B1B', fontWeight: 600, pl: 2.8 }}>
                                  {romData.cdss_stop_warning || 'Категорически запрещены форсированные движения, пассивная редрессация и нагрузка до стабилизации повреждения!'}
                                </Typography>
                              </Box>
                            )}

                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, borderColor: '#CBD5E1', mb: 1 }}>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F3C64' }}>Параметр биомеханики (SFTR)</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F3C64' }}>Норматив</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F3C64' }}>Значение по шаблону</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F3C64' }}>Клиническая оценка</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {jointRomCfg.axes.map((axis) => {
                                    const val = romData[axis.key];
                                    const status = evaluateRomAxisStatus(axis, val);
                                    const aBadge = getRomPriorityBadge(axis.priority || 'P2');
                                    return (
                                      <TableRow key={axis.key}>
                                        <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Chip label={aBadge.code} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 900, bgcolor: aBadge.bg, color: aBadge.color, border: `1px solid ${aBadge.border}` }} />
                                            <span>{axis.labelRu}</span>
                                            <Typography component="span" sx={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>({axis.labelLat})</Typography>
                                          </Box>
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontSize: '0.82rem', color: '#475569' }}>
                                          <LatexText text={axis.normText} />
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontSize: '0.82rem', fontWeight: 800, color: status.isAbnormal ? status.color : '#0F3C64' }}>
                                          {val !== undefined && val !== null && val !== '' ? `${val}${axis.unit}` : '—'}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.82rem', fontWeight: status.isAbnormal ? 700 : 500, color: status.color }}>
                                          {status.text}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>

                            {/* Dissociation Lag Note if calculated */}
                            {hasLag && (
                              <Typography sx={{ fontSize: '0.78rem', color: lagVal <= 5 ? '#15803D' : lagVal <= 15 ? '#B45309' : '#B91C1C', bgcolor: lagVal <= 5 ? '#F0FDF4' : lagVal <= 15 ? '#FFFBEB' : '#FEF2F2', p: 0.75, borderRadius: 1, borderLeft: `3px solid ${lagVal <= 5 ? '#22C55E' : lagVal <= 15 ? '#F59E0B' : '#EF4444'}`, mb: 0.75 }}>
                                <strong>Диссоциация активного/пассивного движения (AROM vs PROM Lag):</strong> Δ = {lagVal}° {lagVal <= 5 ? '(в пределах нормы)' : lagVal <= 15 ? '(умеренная диссоциация / мышечное торможение AMI)' : '(выраженный лаг — подозрение на повреждение сухожилий/парез)'}.
                              </Typography>
                            )}

                            {romData.clinical_interpretation && (
                              <Typography sx={{ fontSize: '0.82rem', color: '#334155', bgcolor: '#F1F5F9', p: 1, borderRadius: 1, borderLeft: '3px solid #0284C7', mt: 0.5 }}>
                                <strong>Клиническое заключение:</strong> <LatexText text={romData.clinical_interpretation} />
                              </Typography>
                            )}
                          </Box>
                        );
                      })()}

                      {/* 5. Orthopedic Tests */}
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F3C64', textTransform: 'uppercase', mb: 0.5 }}>
                          5. Результаты специализированных ортопедических тестов:
                        </Typography>
                        {(!currentTemplate.tests || currentTemplate.tests.length === 0) ? (
                          <Typography sx={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic', pl: 1 }}>
                            Специфические нагрузочные тесты интактны.
                          </Typography>
                        ) : (
                          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, borderColor: '#CBD5E1' }}>
                            <Table size="small">
                              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F3C64' }}>Тест / Проба</TableCell>
                                  <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F3C64' }}>Анатомическая мишень</TableCell>
                                  <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F3C64' }}>Уровень EBM</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F3C64', width: 140 }}>Результат</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {currentTemplate.tests.map((t) => {
                                  const isPos = t.expected_result === 'positive';
                                  return (
                                    <TableRow key={t.test_code} hover>
                                      <TableCell>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                                          <LatexText text={t.name_ru || t.test_code} />
                                        </Typography>
                                        {t.name_lat && (
                                          <Typography sx={{ fontSize: '0.72rem', fontStyle: 'italic', color: '#64748B' }}>
                                            {t.name_lat}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: '0.8rem', color: '#334155' }}>
                                        <LatexText text={t.target_structure || 'Суставная капсула / связки'} />
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={t.evidence_level ? `Level ${t.evidence_level}` : 'Стандарт'}
                                          size="small"
                                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#F1F5F9' }}
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          label={isPos ? 'ПОЛОЖИТЕЛЬНЫЙ (+)' : 'ОТРИЦАТЕЛЬНЫЙ (-)'}
                                          size="small"
                                          sx={{
                                            fontWeight: 800,
                                            fontSize: '0.7rem',
                                            height: 22,
                                            bgcolor: isPos ? '#FEF2F2' : '#F0FDF4',
                                            color: isPos ? '#DC2626' : '#16A34A',
                                            border: `1px solid ${isPos ? '#FCA5A5' : '#86EFAC'}`
                                          }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>

                      {/* 6. Diagnostics Plan */}
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F3C64', textTransform: 'uppercase', mb: 0.5 }}>
                          6. Рекомендованный план обследования (инструментальная и лабораторная диагностика):
                        </Typography>
                        {(!currentTemplate.diagnostics || currentTemplate.diagnostics.length === 0) ? (
                          <Typography sx={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic', pl: 1 }}>
                            Дополнительное инструментальное обследование не требуется.
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, pl: 1 }}>
                            {currentTemplate.diagnostics.map((d, idx) => (
                              <Box key={d.diagnostic_code} sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F3C64', minWidth: 20 }}>
                                  {idx + 1}.
                                </Typography>
                                <Box sx={{ flex: 1 }}>
                                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
                                    <LatexText text={d.protocol_phrase || d.name || d.diagnostic_code} />
                                  </Typography>
                                </Box>
                                <Chip
                                  label={d.modality?.toUpperCase() || 'ДИАГН'}
                                  size="small"
                                  sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700, bgcolor: '#F1F5F9' }}
                                />
                                {d.servdict_price ? (
                                  <Chip
                                    label={`${d.servdict_price.toLocaleString('ru-RU')} ₽`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontSize: '0.65rem', height: 18, fontWeight: 800 }}
                                  />
                                ) : (
                                  <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>Внешнее</Typography>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>

                      {/* 7. Prescribed Treatments (Manipulations, Physiotherapy, Orthotics) */}
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F3C64', textTransform: 'uppercase', mb: 0.5 }}>
                          7. Комплексный план лечения и назначенные медицинские услуги:
                        </Typography>

                        {/* Manipulations Section */}
                        {currentTemplate.manipulations && currentTemplate.manipulations.length > 0 && (() => {
                          const manList = currentTemplate.manipulations;
                          const stopW = manList.filter(m => m.is_stop_warning === 1 || m.is_stop_warning === true || m.ebm_priority === 'P0-STOP' || m.ebm_priority === 'STOP');
                          const nonStop = manList.filter(m => !(m.is_stop_warning === 1 || m.is_stop_warning === true || m.ebm_priority === 'P0-STOP' || m.ebm_priority === 'STOP'));
                          const p1Items = nonStop.filter(m => m.ebm_priority === 'P1');
                          const p2Items = nonStop.filter(m => m.ebm_priority === 'P2' || !m.ebm_priority);
                          const p3Items = nonStop.filter(m => m.ebm_priority === 'P3');

                          const tmplPri = currentTemplate.manipulations_priority || 'P2';
                          const badge = getManipPriorityBadge(tmplPri);

                          return (
                            <Box sx={{ mb: 1.5, p: 1.25, bgcolor: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F766E', textTransform: 'uppercase' }}>
                                    Лечебно-медикаментозные манипуляции и инъекционная терапия:
                                  </Typography>
                                  <Chip
                                    label={`${badge.icon} ${badge.label}`}
                                    size="small"
                                    sx={{
                                      fontSize: '0.62rem',
                                      height: 18,
                                      fontWeight: 800,
                                      bgcolor: badge.bg,
                                      color: badge.color,
                                      border: `1px solid ${badge.border}`
                                    }}
                                  />
                                </Box>
                                <Chip
                                  label={`Всего: ${nonStop.length} назн.`}
                                  size="small"
                                  sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700, bgcolor: '#CCFBF1', color: '#0F766E' }}
                                />
                              </Box>

                              {/* CDSS STOP alert box if present */}
                              {(currentTemplate.manipulations_has_stop === 1 || currentTemplate.manipulations_stop_rationale || stopW.length > 0) && (
                                <Box sx={{ mb: 1, p: 1, bgcolor: '#FEF2F2', border: '1.5px solid #EF4444', borderRadius: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                    <WarningAmberIcon sx={{ color: '#DC2626', fontSize: 18 }} />
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#B91C1C', textTransform: 'uppercase' }}>
                                      CDSS STOP WARNING / Безопасность и противопоказания [P0-STOP]:
                                    </Typography>
                                  </Box>
                                  <Typography sx={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: 600, pl: 3 }}>
                                    <LatexText text={currentTemplate.manipulations_stop_rationale || stopW[0]?.stop_rationale || 'Противопоказано введение препаратов в силовые сухожилия или сустав при остром воспалении.'} />
                                  </Typography>
                                </Box>
                              )}

                              {/* P1: Gold Standard / Emergency */}
                              {p1Items.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', mb: 0.25 }}>
                                    ⭐ 1-я линия / Золотой стандарт и неотложные манипуляции (P1):
                                  </Typography>
                                  {p1Items.map((m, idx) => (
                                    <Box key={m.item_code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.25, borderBottom: '1px dashed #CCFBF1' }}>
                                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>
                                        {idx + 1}. <LatexText text={m.name || m.item_code} /> {m.navigation_type === 'us_guided' ? '(US-guided)' : m.navigation_type === 'c_arm' ? '(C-arm)' : ''} — <span style={{ color: '#475569', fontWeight: 'normal' }}><LatexText text={m.dosage_or_regimen || 'По клиническому регламенту'} /></span>
                                      </Typography>
                                      {m.servdict_price ? (
                                        <Chip
                                          label={`${m.servdict_price.toLocaleString('ru-RU')} ₽`}
                                          size="small"
                                          sx={{ fontSize: '0.65rem', height: 18, fontWeight: 800, bgcolor: '#CCFBF1', color: '#0F766E' }}
                                        />
                                      ) : null}
                                    </Box>
                                  ))}
                                </Box>
                              )}

                              {/* P2: Targeted / Second line */}
                              {p2Items.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', mb: 0.25 }}>
                                    🎯 2-я линия / Таргетная терапия и ортобиология (P2):
                                  </Typography>
                                  {p2Items.map((m, idx) => (
                                    <Box key={m.item_code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.25, borderBottom: '1px dashed #CCFBF1' }}>
                                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>
                                        {idx + 1}. <LatexText text={m.name || m.item_code} /> {m.navigation_type === 'us_guided' ? '(US-guided)' : m.navigation_type === 'c_arm' ? '(C-arm)' : ''} — <span style={{ color: '#475569', fontWeight: 'normal' }}><LatexText text={m.dosage_or_regimen || 'По клиническому регламенту'} /></span>
                                      </Typography>
                                      {m.servdict_price ? (
                                        <Chip
                                          label={`${m.servdict_price.toLocaleString('ru-RU')} ₽`}
                                          size="small"
                                          sx={{ fontSize: '0.65rem', height: 18, fontWeight: 800, bgcolor: '#CCFBF1', color: '#0F766E' }}
                                        />
                                      ) : null}
                                    </Box>
                                  ))}
                                </Box>
                              )}

                              {/* P3: Adjuvant / Manual */}
                              {p3Items.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#0D9488', textTransform: 'uppercase', mb: 0.25 }}>
                                    🔍 3-я линия / Вспомогательные мягкотканные пособия и ПИР (P3):
                                  </Typography>
                                  {p3Items.map((m, idx) => (
                                    <Box key={m.item_code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.25, borderBottom: '1px dashed #CCFBF1' }}>
                                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>
                                        {idx + 1}. <LatexText text={m.name || m.item_code} /> — <span style={{ color: '#475569', fontWeight: 'normal' }}><LatexText text={m.dosage_or_regimen || 'По клиническому регламенту'} /></span>
                                      </Typography>
                                      {m.servdict_price ? (
                                        <Chip
                                          label={`${m.servdict_price.toLocaleString('ru-RU')} ₽`}
                                          size="small"
                                          sx={{ fontSize: '0.65rem', height: 18, fontWeight: 800, bgcolor: '#CCFBF1', color: '#0F766E' }}
                                        />
                                      ) : null}
                                    </Box>
                                  ))}
                                </Box>
                              )}

                              {/* Procedure Note if filled */}
                              {currentTemplate.performed_manipulations_template && (
                                <Box sx={{ mt: 1, p: 1, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 1 }}>
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', mb: 0.25 }}>
                                    Протокол выполненной процедуры (дневник врача):
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.8rem', color: '#334155', fontStyle: 'italic' }}>
                                    <LatexText text={currentTemplate.performed_manipulations_template} />
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          );
                        })()}

                        {/* Physiotherapy Section */}
                        {currentTemplate.physiotherapy && currentTemplate.physiotherapy.length > 0 && (() => {
                          const physList = currentTemplate.physiotherapy;
                          const stopW = physList.filter(p => p.is_stop_warning === 1 || p.is_stop_warning === true || p.item_code === 'phys_cdss_stop' || p.ebm_priority === 'STOP');
                          const nonStop = physList.filter(p => !(p.is_stop_warning === 1 || p.is_stop_warning === true || p.item_code === 'phys_cdss_stop' || p.ebm_priority === 'STOP'));
                          const p1Items = nonStop.filter(p => p.ebm_priority === 'P1');
                          const p2Items = nonStop.filter(p => p.ebm_priority !== 'P1');

                          return (
                            <Box sx={{ mb: 1.5, p: 1.25, bgcolor: '#FAF5FF', border: '1px solid #DDD6FE', borderRadius: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#6D28D9', textTransform: 'uppercase' }}>
                                  Курс физиотерапии и аппаратного восстановительного лечения:
                                </Typography>
                                <Chip
                                  label={`Всего: ${nonStop.length} назн.`}
                                  size="small"
                                  sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700, bgcolor: '#EDE9FE', color: '#6D28D9' }}
                                />
                              </Box>

                              {/* CDSS STOP alert box if present */}
                              {stopW.length > 0 && (
                                <Box sx={{ mb: 1, p: 1, bgcolor: '#FEF2F2', border: '1.5px solid #EF4444', borderRadius: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                    <WarningAmberIcon sx={{ color: '#DC2626', fontSize: 18 }} />
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#B91C1C', textTransform: 'uppercase' }}>
                                      CDSS STOP WARNING / Безопасность и противопоказания:
                                    </Typography>
                                  </Box>
                                  {stopW.map((sw, sIdx) => (
                                    <Typography key={sIdx} sx={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: 600, pl: 3 }}>
                                      <LatexText text={sw.exact_dosimetry || sw.dosage_or_regimen || sw.stop_rationale || ''} />
                                    </Typography>
                                  ))}
                                </Box>
                              )}

                              {/* P1 Section */}
                              {p1Items.length > 0 && (
                                <Box sx={{ mb: p2Items.length > 0 ? 1 : 0 }}>
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', mb: 0.4 }}>
                                    ⭐ 1-я линия / Патогенетический оптимум (EBM Высокий уровень доказательности):
                                  </Typography>
                                  {p1Items.map((p, idx) => (
                                    <Box key={p.item_code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 0.35, borderBottom: '1px dashed #EDE9FE' }}>
                                      <Box sx={{ flex: 1, pr: 1 }}>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B' }}>
                                          {idx + 1}. <LatexText text={p.name || p.item_code} />
                                          {p.evidence_level && (
                                            <Chip label={p.evidence_level} size="small" sx={{ ml: 1, height: 16, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }} />
                                          )}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.78rem', color: '#475569', mt: 0.2 }}>
                                          <LatexText text={p.exact_dosimetry || p.dosage_or_regimen || 'Курсовое лечение 5-10 сеансов'} />
                                          {p.target_anatomical_landmark && (
                                            <span style={{ color: '#6366F1', fontWeight: 600 }}> ({p.target_anatomical_landmark})</span>
                                          )}
                                        </Typography>
                                      </Box>
                                      {p.servdict_price ? (
                                        <Chip
                                          label={`${p.servdict_price.toLocaleString('ru-RU')} ₽`}
                                          size="small"
                                          sx={{ fontSize: '0.68rem', height: 18, fontWeight: 800, bgcolor: '#EDE9FE', color: '#6D28D9' }}
                                        />
                                      ) : null}
                                    </Box>
                                  ))}
                                </Box>
                              )}

                              {/* P2 Section */}
                              {p2Items.length > 0 && (
                                <Box>
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', mb: 0.4, mt: p1Items.length > 0 ? 0.8 : 0 }}>
                                    🎯 2-я линия / Адъювантная физиотерапия и симптоматический контроль:
                                  </Typography>
                                  {p2Items.map((p, idx) => (
                                    <Box key={p.item_code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 0.35, borderBottom: '1px dashed #E0F2FE' }}>
                                      <Box sx={{ flex: 1, pr: 1 }}>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B' }}>
                                          {idx + 1}. <LatexText text={p.name || p.item_code} />
                                          {p.evidence_level && (
                                            <Chip label={p.evidence_level} size="small" sx={{ ml: 1, height: 16, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#E0F2FE', color: '#0369A1' }} />
                                          )}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.78rem', color: '#475569', mt: 0.2 }}>
                                          <LatexText text={p.exact_dosimetry || p.dosage_or_regimen || 'По показаниям'} />
                                          {p.target_anatomical_landmark && (
                                            <span style={{ color: '#0284C7', fontWeight: 600 }}> ({p.target_anatomical_landmark})</span>
                                          )}
                                        </Typography>
                                      </Box>
                                      {p.servdict_price ? (
                                        <Chip
                                          label={`${p.servdict_price.toLocaleString('ru-RU')} ₽`}
                                          size="small"
                                          sx={{ fontSize: '0.68rem', height: 18, fontWeight: 800, bgcolor: '#E0F2FE', color: '#0284C7' }}
                                        />
                                      ) : null}
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          );
                        })()}

                        {/* Orthotics Section */}
                        {(() => {
                          const orthList = currentTemplate.orthotics || [];
                          if (orthList.length === 0 && !currentTemplate.orthotics_weight_bearing) return null;

                          const stopItems = orthList.filter(o => o.is_stop_warning === 1 || o.ebm_priority === 'P0-STOP' || o.ebm_priority === 'P0-CONTRA');
                          const p1Items = orthList.filter(o => o.ebm_priority === 'P1' && o.is_stop_warning !== 1);
                          const p2Items = orthList.filter(o => o.ebm_priority === 'P2' && o.is_stop_warning !== 1);
                          const p3Items = orthList.filter(o => (!o.ebm_priority || o.ebm_priority === 'P3') && o.is_stop_warning !== 1 && o.ebm_priority !== 'P0-STOP' && o.ebm_priority !== 'P0-CONTRA');

                          return (
                            <Box sx={{ mb: 1.5, p: 1.25, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 1.5 }}>
                              {/* Header & Badges */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#166534', textTransform: 'uppercase' }}>
                                  7. Ортопедические изделия, индивидуальное ортезирование и разгрузка:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                  {currentTemplate.orthotics_weight_bearing && (
                                    getWeightBearingBadge(currentTemplate.orthotics_weight_bearing)
                                  )}
                                  {currentTemplate.orthotics_priority && (
                                    getOrthoticsPriorityBadge(currentTemplate.orthotics_priority)
                                  )}
                                </Box>
                              </Box>

                              {/* CDSS Red Flag / STOP alert banner */}
                              {(currentTemplate.orthotics_has_stop === 1 || stopItems.length > 0) && (
                                <Box sx={{ mb: 1, p: 1, bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <WarningAmberIcon sx={{ color: '#DC2626', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                                  <Box>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#991B1B' }}>
                                      КЛИНИЧЕСКИЙ CDSS STOP / ПРЕДУПРЕЖДЕНИЕ:
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.76rem', color: '#B91C1C', lineHeight: 1.35 }}>
                                      {currentTemplate.orthotics_stop_rationale || stopItems[0]?.stop_rationale || 'Иммобилизация противопоказана или ограничена.'}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}

                              {/* P1 Section: Mandatory / Structural-Saving */}
                              {p1Items.length > 0 && (
                                <Box sx={{ mb: (p2Items.length > 0 || p3Items.length > 0) ? 1 : 0 }}>
                                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', mb: 0.4 }}>
                                    🛡️ Обязательное / Структуросберегающее ортезирование (P1):
                                  </Typography>
                                  {p1Items.map((o, idx) => (
                                    <Box key={o.item_code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 0.35, borderBottom: '1px dashed #DCFCE7' }}>
                                      <Box sx={{ flex: 1, pr: 1 }}>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B' }}>
                                          {idx + 1}. <LatexText text={o.name || o.item_code} />
                                          {o.device_type_iso && (
                                            <Chip label={o.device_type_iso} size="small" sx={{ ml: 1, height: 16, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#FEE2E2', color: '#991B1B' }} />
                                          )}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.78rem', color: '#475569', mt: 0.2 }}>
                                          <LatexText text={o.wearing_regimen || o.dosage_or_regimen || 'Постоянное ношение при осевой нагрузке'} />
                                          {o.hinge_settings && (
                                            <span style={{ color: '#059669', fontWeight: 600 }}> (Углы шарнира: {o.hinge_settings})</span>
                                          )}
                                        </Typography>
                                      </Box>
                                      {o.servdict_price ? (
                                        <Chip
                                          label={`${o.servdict_price.toLocaleString('ru-RU')} ₽`}
                                          size="small"
                                          sx={{ fontSize: '0.68rem', height: 18, fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }}
                                        />
                                      ) : null}
                                    </Box>
                                  ))}
                                </Box>
                              )}

                              {/* P2 Section: Functional / Biomechanical */}
                              {p2Items.length > 0 && (
                                <Box sx={{ mb: p3Items.length > 0 ? 1 : 0 }}>
                                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', mb: 0.4, mt: p1Items.length > 0 ? 0.8 : 0 }}>
                                    🎯 Функциональная коррекция и разгрузка (P2):
                                  </Typography>
                                  {p2Items.map((o, idx) => (
                                    <Box key={o.item_code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 0.35, borderBottom: '1px dashed #DCFCE7' }}>
                                      <Box sx={{ flex: 1, pr: 1 }}>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B' }}>
                                          {idx + 1}. <LatexText text={o.name || o.item_code} />
                                          {o.device_type_iso && (
                                            <Chip label={o.device_type_iso} size="small" sx={{ ml: 1, height: 16, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#E0F2FE', color: '#0369A1' }} />
                                          )}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.78rem', color: '#475569', mt: 0.2 }}>
                                          <LatexText text={o.wearing_regimen || o.dosage_or_regimen || 'Ношение в период двигательной активности'} />
                                          {o.hinge_settings && (
                                            <span style={{ color: '#0284C7', fontWeight: 600 }}> (Углы шарнира: {o.hinge_settings})</span>
                                          )}
                                        </Typography>
                                      </Box>
                                      {o.servdict_price ? (
                                        <Chip
                                          label={`${o.servdict_price.toLocaleString('ru-RU')} ₽`}
                                          size="small"
                                          sx={{ fontSize: '0.68rem', height: 18, fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }}
                                        />
                                      ) : null}
                                    </Box>
                                  ))}
                                </Box>
                              )}

                              {/* P3 Section: Prophylactic / Ergonomic */}
                              {p3Items.length > 0 && (
                                <Box>
                                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', mb: 0.4, mt: (p1Items.length > 0 || p2Items.length > 0) ? 0.8 : 0 }}>
                                    🌿 Профилактическое / Поддерживающее ортезирование (P3):
                                  </Typography>
                                  {p3Items.map((o, idx) => (
                                    <Box key={o.item_code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 0.35, borderBottom: '1px dashed #DCFCE7' }}>
                                      <Box sx={{ flex: 1, pr: 1 }}>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B' }}>
                                          {idx + 1}. <LatexText text={o.name || o.item_code} />
                                          {o.device_type_iso && (
                                            <Chip label={o.device_type_iso} size="small" sx={{ ml: 1, height: 16, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#F1F5F9', color: '#475569' }} />
                                          )}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.78rem', color: '#475569', mt: 0.2 }}>
                                          <LatexText text={o.wearing_regimen || o.dosage_or_regimen || 'По потребности'} />
                                          {o.hinge_settings && (
                                            <span style={{ color: '#475569', fontWeight: 600 }}> (Углы шарнира: {o.hinge_settings})</span>
                                          )}
                                        </Typography>
                                      </Box>
                                      {o.servdict_price ? (
                                        <Chip
                                          label={`${o.servdict_price.toLocaleString('ru-RU')} ₽`}
                                          size="small"
                                          sx={{ fontSize: '0.68rem', height: 18, fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }}
                                        />
                                      ) : null}
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          );
                        })()}

                        {/* Financial Calculator Summary for internal services */}
                        {(() => {
                          const allItems = [
                            ...(currentTemplate.manipulations || []).map(m => ({ price: m.servdict_price || 0, scope: m.service_scope })),
                            ...(currentTemplate.physiotherapy || []).map(p => ({ price: p.servdict_price || 0, scope: p.service_scope })),
                            ...(currentTemplate.orthotics || []).map(o => ({ price: o.servdict_price || 0, scope: o.service_scope }))
                          ];
                          const internalTotal = allItems.filter(i => i.scope === 'internal').reduce((acc, curr) => acc + curr.price, 0);

                          if (internalTotal === 0) return null;

                          return (
                            <Box sx={{ mt: 1, p: 1, bgcolor: '#F8FAFC', borderRadius: 1, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontSize: '0.8rem', color: '#475569' }}>
                                Итого расчетная стоимость базового пакета клиники:
                              </Typography>
                              <Typography sx={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F3C64' }}>
                                {internalTotal.toLocaleString('ru-RU')} ₽
                              </Typography>
                            </Box>
                          );
                        })()}
                      </Box>

                      {/* 8. Recommendations & General Guidance */}
                      <Box sx={{ mb: 3 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F3C64', textTransform: 'uppercase', mb: 0.5 }}>
                          8. Общий двигательный режим и фармакотерапия:
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#1E293B', pl: 1, borderLeft: '2px solid #E2E8F0' }}>
                          <LatexText text={currentTemplate.recommendations_template || '1. Охранительный двигательный режим, исключение ударных осевых нагрузок и бега.\n2. При болях — НПВП коротким курсом под прикрытием гастропротекторов.\n3. Контрольный осмотр ортопеда через 14-21 день после завершения первого этапа терапии.'} />
                        </Typography>
                      </Box>

                      {/* Doctor Signature Block */}
                      <Box
                        sx={{
                          mt: 4,
                          pt: 2,
                          borderTop: '1px solid #CBD5E1',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end'
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: '0.8rem', color: '#64748B' }}>
                            Врач травматолог-ортопед:
                          </Typography>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                            {currentTemplate.author_doctor_name || 'Добрушкин А.М.'}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center', minWidth: 200 }}>
                          <Box sx={{ borderBottom: '1px solid #0F172A', height: 26, mb: 0.5 }} />
                          <Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>
                            (подпись, личная печать врача)
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
        </>
      )}

      {/* MODAL: Select Orthopedic Test from Catalog */}
      <Dialog
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64' }}>
          Добавить ортопедический тест из клинического каталога
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Отображаются валидированные тесты для анатомической зоны: <strong>{currentTemplate?.joint_name?.toUpperCase()}</strong>
            </Typography>
          </Box>
          <Grid container spacing={1.5}>
            {testCatalog
              .filter(tc => !currentTemplate?.tests.some(t => t.test_code === tc.code))
              .map(tc => {
                const isMatchingJoint = tc.joint_category === currentTemplate?.joint_name;
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={tc.code}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderColor: isMatchingJoint ? '#0284C7' : '#E2E8F0',
                        bgcolor: isMatchingJoint ? '#F0F9FF' : '#FFF'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          <LatexText text={tc.name_ru} />
                        </Typography>
                        <Chip
                          label={tc.sensitivity_specificity || tc.joint_category}
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mb: 0.5, color: 'text.secondary' }}>
                        {tc.name_lat}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#334155' }}>
                        <LatexText text={tc.target_structure} />
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setMethodInfoModal(tc)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          Методика (i)
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAddTestToTemplate(tc)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          Добавить в шаблон
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestModalOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: Select Diagnostic Method from Catalog */}
      <Dialog
        open={diagModalOpen}
        onClose={() => setDiagModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64' }}>
          Добавить метод инструментальной и функциональной диагностики
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={1.5}>
            {diagCatalog
              .filter(dc => !currentTemplate?.diagnostics.some(d => d.diagnostic_code === dc.code))
              .map(dc => {
                const isMatchingJoint = dc.target_joint === currentTemplate?.joint_name || dc.target_joint === 'general';
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={dc.code}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderColor: isMatchingJoint ? '#0D9488' : '#E2E8F0',
                        bgcolor: isMatchingJoint ? '#F0FDFA' : '#FFF'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          <LatexText text={dc.name} />
                        </Typography>
                        <Chip
                          label={dc.modality?.toUpperCase()}
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#334155' }}>
                        <LatexText text={dc.protocol_phrase} />
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {dc.servdict_price ? (
                          <Chip
                            label={`${dc.servdict_price.toLocaleString('ru-RU')} ₽`}
                            size="small"
                            color="success"
                            sx={{ fontWeight: 700 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">Внешнее направление</Typography>
                        )}
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          onClick={() => handleAddDiagToTemplate(dc)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          Назначить в шаблон
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiagModalOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: Test Methodology Info (i) */}
      <Dialog
        open={Boolean(methodInfoModal)}
        onClose={() => setMethodInfoModal(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', pb: 1 }}>
          <LatexText text={methodInfoModal?.name_ru} />
          <Typography variant="subtitle2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {methodInfoModal?.name_lat}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Анатомическая структура-мишень:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                <LatexText text={methodInfoModal?.target_structure} />
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Пошаговая методика проведения:
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.5, color: '#1E293B' }}>
                <LatexText text={methodInfoModal?.methodology} />
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Критерии положительной реакции теста:
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.5, color: '#B91C1C', fontWeight: 600 }}>
                <LatexText text={methodInfoModal?.positive_criteria} />
              </Typography>
            </Box>

            {methodInfoModal?.sensitivity_specificity && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                  Доказательные показатели точности:
                </Typography>
                <Chip
                  label={<LatexText text={methodInfoModal.sensitivity_specificity} />}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mt: 0.5, fontWeight: 700 }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMethodInfoModal(null)} variant="contained">
            Понятно
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diagnostic Method Detailed Guidance Modal */}
      <DiagnosticMethodGuidanceModal
        open={Boolean(diagInfoModal)}
        onClose={() => setDiagInfoModal(null)}
        diagnostic={diagInfoModal}
        readOnly={true}
      />

      {/* Treatment Guidance Modal (i) */}
      <TreatmentGuidanceModal
        open={Boolean(treatmentModalItem)}
        onClose={() => setTreatmentModalItem(null)}
        treatment={treatmentModalItem}
        category={treatmentModalCategory}
        readOnly={true}
      />

      {/* MODAL: Select Manipulation from Catalog */}
      <Dialog
        open={manipModalOpen}
        onClose={() => setManipModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicalServicesIcon sx={{ color: '#0D9488' }} />
          Добавить лечебно-диагностическую манипуляцию / инъекцию
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={1.5}>
            {manipCatalog
              .filter(mc => !currentTemplate?.manipulations?.some(m => m.item_code === mc.code))
              .map(mc => {
                const isMatchingJoint = mc.target_joint === currentTemplate?.joint_name || mc.target_joint === 'general';
                const isInternal = mc.service_scope === 'internal';
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={mc.code}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderColor: isMatchingJoint ? (isInternal ? '#0D9488' : '#0284C7') : (isInternal ? '#99F6E4' : '#CBD5E1'),
                        bgcolor: isInternal ? '#F0FDFA' : (isMatchingJoint ? '#F8FAFC' : '#FFF'),
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          <LatexText text={mc.name} />
                        </Typography>
                        <Chip
                          label={isInternal ? '🏥 ВНУТРЕННЯЯ' : '🌐 ВНЕШНЯЯ'}
                          size="small"
                          sx={{
                            fontSize: '0.65rem',
                            height: 20,
                            fontWeight: 800,
                            bgcolor: isInternal ? '#CCFBF1' : '#F1F5F9',
                            color: isInternal ? '#0F766E' : '#475569'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#0D9488', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        {mc.subcategory?.toUpperCase()} • {mc.target_joint?.toUpperCase()}
                      </Typography>
                      {mc.dosage_or_regimen && (
                        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#334155' }}>
                          <LatexText text={mc.dosage_or_regimen} />
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        {mc.servdict_price ? (
                          <Chip
                            label={`${mc.servdict_price.toLocaleString('ru-RU')} ₽`}
                            size="small"
                            color="success"
                            sx={{ fontWeight: 800 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">Внешнее направление</Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setTreatmentModalItem(mc as any);
                              setTreatmentModalCategory('manipulation');
                            }}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                          >
                            Регламент (i)
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleAddTreatmentItem(mc, 'manipulation')}
                            sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' }, textTransform: 'none', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            В шаблон
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManipModalOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: Select Physiotherapy from Catalog */}
      <Dialog
        open={physioModalOpen}
        onClose={() => setPhysioModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FitnessIcon sx={{ color: '#7C3AED' }} />
          Добавить курс физиотерапии и аппаратного лечения
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={1.5}>
            {physioCatalog
              .filter(pc => !currentTemplate?.physiotherapy?.some(p => p.item_code === pc.code))
              .map(pc => {
                const isInternal = pc.service_scope === 'internal';
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={pc.code}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderColor: isInternal ? '#7C3AED' : '#CBD5E1',
                        bgcolor: isInternal ? '#FAF5FF' : '#FFF',
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          <LatexText text={pc.name} />
                        </Typography>
                        <Chip
                          label={isInternal ? '🏥 ВНУТРЕННЯЯ' : '🌐 ВНЕШНЯЯ'}
                          size="small"
                          sx={{
                            fontSize: '0.65rem',
                            height: 20,
                            fontWeight: 800,
                            bgcolor: isInternal ? '#EDE9FE' : '#F1F5F9',
                            color: isInternal ? '#6D28D9' : '#475569'
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                        {pc.evidence_level && (
                          <Chip
                            label={`Level ${pc.evidence_level}`}
                            size="small"
                            sx={{ fontSize: '0.65rem', height: 18, fontWeight: 800, bgcolor: '#FEF3C7', color: '#B45309' }}
                          />
                        )}
                        {pc.apparatus_examples && (
                          <Chip
                            label={pc.apparatus_examples.split(',')[0]}
                            size="small"
                            sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700, bgcolor: '#EDE9FE', color: '#6D28D9' }}
                          />
                        )}
                      </Box>
                      {pc.dosage_or_regimen && (
                        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#334155' }}>
                          <LatexText text={pc.dosage_or_regimen} />
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, flexWrap: 'wrap', gap: 0.75 }}>
                        {pc.servdict_price ? (
                          <Chip
                            label={`${pc.servdict_price.toLocaleString('ru-RU')} ₽`}
                            size="small"
                            color="success"
                            sx={{ fontWeight: 800 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">Внешнее направление</Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setTreatmentModalItem(pc as any);
                              setTreatmentModalCategory('physiotherapy');
                            }}
                            sx={{ textTransform: 'none', fontSize: '0.72rem', px: 1 }}
                          >
                            Регламент (i)
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleAddTreatmentItem(pc, 'physiotherapy', 'P1')}
                            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, textTransform: 'none', fontSize: '0.72rem', fontWeight: 800, px: 1 }}
                          >
                            + P1 (1-я)
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleAddTreatmentItem(pc, 'physiotherapy', 'P2')}
                            sx={{ bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' }, textTransform: 'none', fontSize: '0.72rem', fontWeight: 800, px: 1 }}
                          >
                            + P2 (2-я)
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhysioModalOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: Select Orthotics from Catalog */}
      <Dialog
        open={orthoticsModalOpen}
        onClose={() => setOrthoticsModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldIcon sx={{ color: '#059669' }} />
          Добавить ортопедическое изделие, ортез или стельки
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={1.5}>
            {orthoticsCatalog
              .filter(oc => !currentTemplate?.orthotics?.some(o => o.item_code === oc.code))
              .map(oc => {
                const isInternal = oc.service_scope === 'internal';
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={oc.code}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderColor: isInternal ? '#059669' : '#CBD5E1',
                        bgcolor: isInternal ? '#ECFDF5' : '#FFF',
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          <LatexText text={oc.name} />
                        </Typography>
                        <Chip
                          label={isInternal ? '🏥 ВНУТРЕННЯЯ' : '🌐 ВНЕШНЯЯ'}
                          size="small"
                          sx={{
                            fontSize: '0.65rem',
                            height: 20,
                            fontWeight: 800,
                            bgcolor: isInternal ? '#D1FAE5' : '#F1F5F9',
                            color: isInternal ? '#047857' : '#475569'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        {oc.subcategory?.toUpperCase()} • {oc.target_joint?.toUpperCase()}
                      </Typography>
                      {oc.dosage_or_regimen && (
                        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#334155' }}>
                          <LatexText text={oc.dosage_or_regimen} />
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        {oc.servdict_price ? (
                          <Chip
                            label={`${oc.servdict_price.toLocaleString('ru-RU')} ₽`}
                            size="small"
                            color="success"
                            sx={{ fontWeight: 800 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">Внешнее направление</Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setTreatmentModalItem(oc as any);
                              setTreatmentModalCategory('orthotics');
                            }}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                          >
                            Регламент (i)
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleAddTreatmentItem(oc, 'orthotics')}
                            sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, textTransform: 'none', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            В шаблон
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrthoticsModalOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
