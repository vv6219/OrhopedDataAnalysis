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
  CardActionArea
} from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import HistoryIcon from '@mui/icons-material/History';
import ArticleIcon from '@mui/icons-material/Article';
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
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import BiotechIcon from '@mui/icons-material/Biotech';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import StarIcon from '@mui/icons-material/Star';
import { OrthoSandwichCard } from '../components/ortho/OrthoSandwichCard';
import OrthoProtocolPreview from '../components/ortho/OrthoProtocolPreview';
import type { OrthoProtocolData, OrthoPrescriptionItem } from '../components/reports/OrthoProtocolPrintTemplate';
import { parseProtocolContent } from '../utils/protocolXmlParser';

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

  // Sandwich Card Controls: Expanded state (default: all expanded on first load)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
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

  // Sandwich Card Controls: Active / Selective print filter state
  const [activeSections, setActiveSections] = useState<Record<string, boolean>>({
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

  const handleToggleActive = (secKey: string, active: boolean) => {
    setActiveSections((prev) => ({ ...prev, [secKey]: active }));
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
  const [recommendations, setRecommendations] = useState(
    '1. Охранительный двигательный режим, исключение осевых ударных нагрузок.\n2. Ношение разгрузочного ортеза при ходьбе.\n3. Курс ЛФК и кинезиотерапии.'
  );
  const [prescriptions, setPrescriptions] = useState<OrthoPrescriptionItem[]>([]);
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
    setRecommendations('1. Охранительный двигательный режим, исключение осевых ударных нагрузок.\n2. Ношение разгрузочного ортеза при ходьбе.\n3. Курс ЛФК и кинезиотерапии.');
    setPendingService(null);
    setPrescriptions([]);
    setActiveTemplateDiagnostics([]);
    setMediaList([]);
    setBiomechanicsHistory([]);
    setRightPanelTab(0);
    setCurrentSelectedTemplate(null);
    setActiveSections({
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
    if (activeSections.complaints && complaints.trim()) count++;
    if (activeSections.anamnesis_morbi && anamnesis.trim()) count++;
    if (activeSections.anamnesis_vitae && anamnesisVitae.trim()) count++;
    if (activeSections.objective_status && objectiveStatus.trim()) count++;
    if (activeSections.status_localis) count++;
    if (activeSections.functional_tests) count++;
    if (activeSections.special_studies && specialStudies.trim()) count++;
    if (activeSections.diagnosis && (clinicalDiagnosis.trim() || selectedMkb)) count++;
    if (activeSections.performed_manipulations && performedManipulations.trim()) count++;
    if (activeSections.recommendations && (recommendations.trim() || prescriptions.length > 0)) count++;
    return count;
  }, [
    activeSections,
    complaints,
    anamnesis,
    anamnesisVitae,
    objectiveStatus,
    specialStudies,
    clinicalDiagnosis,
    selectedMkb,
    performedManipulations,
    recommendations,
    prescriptions
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
          setPrescriptions(
            parsedJson.prescriptions.map((p: any, i: number) => ({
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
              details: typeof p.details_json === 'string' ? JSON.parse(p.details_json || '{}') : (p.details || {})
            }))
          );
        } else if (data.currentPrescriptions && Array.isArray(data.currentPrescriptions) && data.currentPrescriptions.length > 0) {
          setPrescriptions(
            data.currentPrescriptions.map((p: any) => ({
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
              details: typeof p.details_json === 'string' ? JSON.parse(p.details_json || '{}') : (p.details_json || {})
            }))
          );
        } else {
          setPrescriptions([]);
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
  const resolveJointArea = (jointName?: string, title?: string, content?: string): JointAreaId => {
    if (jointName) {
      const jn = String(jointName).toLowerCase().trim();
      if (jn.endsWith('_r') || jn.endsWith('_l') || jn.endsWith('_c') || jn.endsWith('_th')) {
        return jn as JointAreaId;
      }
      if (jn === 'elbow') return 'elbow_r';
      if (jn === 'shoulder') return 'shoulder_r';
      if (jn === 'hip') return 'hip_r';
      if (jn === 'ankle' || jn === 'foot') return 'foot_r';
      if (jn === 'wrist') return 'wrist_r';
      if (jn === 'spine') return 'spine_l';
      return `${jn}_r` as JointAreaId;
    }
    const text = ((title || '') + ' ' + (content || '')).toLowerCase();
    if (/локт|эпикондил|олекранон/.test(text)) return 'elbow_r';
    if (/колен|гонартроз|мениск|patell/.test(text)) return 'knee_r';
    if (/плеч|акромион|ротатор/.test(text)) return 'shoulder_r';
    if (/тазобедр|коксартроз|вертлуж/.test(text)) return 'hip_r';
    if (/стоп|голеностоп|пятк|фасциит|ахилл/.test(text)) return 'foot_r';
    if (/позвоноч|спин|люмбалг|диск|шеин|грудн/.test(text)) return 'spine_l';
    if (/кист|лучезап|запяст|карпал/.test(text)) return 'wrist_r';
    return 'knee_r';
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

  // Fast Clinical Template Fill (ortho_templates + protdict)
  const handleApplyTemplate = async (tmpl: any) => {
    try {
      const matchingArea = resolveJointArea(tmpl.joint_name, tmpl.title, tmpl.content);
      setSelectedJoint(matchingArea);

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

        // Fetch deep relational diagnostics and tests from Knowledge Base 2.0 API
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

                if (Array.isArray(t.diagnosticMethods)) {
                  setActiveTemplateDiagnostics(t.diagnosticMethods);
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
                const treatmentPrescriptions: any[] = [];
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
              }
            }
          } catch (err) {
            console.error('Error fetching full template relations:', err);
          }
        }

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
    setPrescriptions((prev) => prev.filter((_, i) => i !== idx));
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Назад в расписание / реестр">
            <IconButton size="small" onClick={() => navigate('/protocols-registry')}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                <Chip
                  icon={<AssignmentIcon sx={{ fontSize: 15 }} />}
                  label={`Протокол: ${currentSelectedTemplate.title}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  onClick={() => setProtocolDialogOpen(true)}
                  onDelete={() => setProtocolDialogOpen(true)}
                  deleteIcon={<SwapHorizIcon />}
                  sx={{ fontWeight: 700, cursor: 'pointer', maxWidth: 280 }}
                />
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
        </Box>
      </Paper>

      {/* WORKSTATION SPLIT SCREEN BODY */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT COLUMN: INTERACTIVE CLINICAL EXAM (55% Width) */}
        <Box sx={{ flex: '0 0 55%', overflowY: 'auto', p: 2, borderRight: '1px solid #CBD5E1' }}>
          {/* SANDWICH TOP TOOLBAR: EXPAND/COLLAPSE ALL + PRINT STATUS BADGE */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              p: 1.25,
              bgcolor: '#F8FAFC',
              borderRadius: 2,
              border: '1px solid #E2E8F0'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', mr: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Разделы приема:
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
            </Box>

            <Tooltip title="Разделы, отмеченные галочкой и содержащие текст, войдут в официальный протокол и распечатку. Деактивированные или пустые разделы не печатаются.">
              <Chip
                icon={<PrintIcon sx={{ fontSize: '0.95rem !important' }} />}
                label={`В печать: ${printSectionsCount} из 10`}
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

          {/* 1. Жалобы и ВАШ */}
          <OrthoSandwichCard
            id="complaints"
            title="1. Жалобы при обращении и интенсивность боли (ВАШ)"
            subtitle="Характер боли, триггеры, стартовая скованность, ограничение движений"
            icon={<MedicalServicesIcon sx={{ fontSize: 20 }} />}
            expanded={expandedSections.complaints}
            onToggleExpand={() => handleToggleExpand('complaints')}
            isActive={activeSections.complaints}
            onToggleActive={(act) => handleToggleActive('complaints', act)}
            hasContent={Boolean(complaints.trim())}
            previewSnippet={complaints.slice(0, 90) + (complaints.length > 90 ? '...' : '')}
          >
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Жалобы пациента"
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
          </OrthoSandwichCard>

          {/* 2. Анамнез заболевания */}
          <OrthoSandwichCard
            id="anamnesis_morbi"
            title="2. Анамнез заболевания (Anamnesis morbi)"
            subtitle="Давность симптомов, связь с нагрузкой или травмой, предшествующее лечение"
            icon={<HistoryIcon sx={{ fontSize: 20 }} />}
            expanded={expandedSections.anamnesis_morbi}
            onToggleExpand={() => handleToggleExpand('anamnesis_morbi')}
            isActive={activeSections.anamnesis_morbi}
            onToggleActive={(act) => handleToggleActive('anamnesis_morbi', act)}
            hasContent={Boolean(anamnesis.trim())}
            previewSnippet={anamnesis.slice(0, 90) + (anamnesis.length > 90 ? '...' : '')}
          >
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
          </OrthoSandwichCard>

          {/* 3. Анамнез жизни */}
          <OrthoSandwichCard
            id="anamnesis_vitae"
            title="3. Анамнез жизни (Anamnesis vitae)"
            subtitle="Аллергологический статус, сопутствующие соматические заболевания, перенесенные операции"
            icon={<ContentPasteIcon sx={{ fontSize: 20 }} />}
            expanded={expandedSections.anamnesis_vitae}
            onToggleExpand={() => handleToggleExpand('anamnesis_vitae')}
            isActive={activeSections.anamnesis_vitae}
            onToggleActive={(act) => handleToggleActive('anamnesis_vitae', act)}
            hasContent={Boolean(anamnesisVitae.trim())}
            previewSnippet={anamnesisVitae.slice(0, 90) + (anamnesisVitae.length > 90 ? '...' : '')}
          >
            <Box sx={{ display: 'flex', gap: 0.8, mb: 1.2, flexWrap: 'wrap' }}>
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
              placeholder="Аллергоанамнез, соматические патологии, гемотрансфузии, перенесенные вмешательства..."
            />
          </OrthoSandwichCard>

          {/* 4. Общий объективный статус */}
          <OrthoSandwichCard
            id="objective_status"
            title="4. Общий объективный статус (Status praesens)"
            subtitle="Общее состояние, гемодинамика, кожные покровы, периферические отеки, лимфоузлы"
            icon={<MonitorHeartIcon sx={{ fontSize: 20 }} />}
            expanded={expandedSections.objective_status}
            onToggleExpand={() => handleToggleExpand('objective_status')}
            isActive={activeSections.objective_status}
            onToggleActive={(act) => handleToggleActive('objective_status', act)}
            hasContent={Boolean(objectiveStatus.trim())}
            previewSnippet={objectiveStatus.slice(0, 90) + (objectiveStatus.length > 90 ? '...' : '')}
          >
            <Box sx={{ display: 'flex', gap: 0.8, mb: 1.2, flexWrap: 'wrap' }}>
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
              placeholder="Общее самочувствие, телосложение, гемодинамика, состояние кожных покровов..."
            />
          </OrthoSandwichCard>

          {/* 5. Локальный статус и 2D Гомункулус */}
          <OrthoSandwichCard
            id="status_localis"
            title="5. Локальный ортопедический статус и 2D Гомункулус"
            subtitle="Анатомическая карта тела, выбор сустава, ось конечности, походка, осанка"
            icon={<AccessibilityNewIcon sx={{ fontSize: 20 }} />}
            expanded={expandedSections.status_localis}
            onToggleExpand={() => handleToggleExpand('status_localis')}
            isActive={activeSections.status_localis}
            onToggleActive={(act) => handleToggleActive('status_localis', act)}
            hasContent={true}
            previewSnippet={`${selectedJoint} • ${currentJointState.side === 'left' ? 'Слева' : 'Справа'}`}
            headerActions={
              <Button
                size="small"
                variant="outlined"
                startIcon={<AssignmentIcon sx={{ fontSize: 15 }} />}
                onClick={() => {
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
          </OrthoSandwichCard>

          {/* 6. Биомеханика и функциональные тесты */}
          <OrthoSandwichCard
            id="functional_tests"
            title="6. Биомеханика и функциональные тесты (ROM / Goniometry)"
            subtitle="Амплитуда движений Neutral-0, патологическая подвижность, стабильность связок"
            icon={<BiotechIcon sx={{ fontSize: 20 }} />}
            expanded={expandedSections.functional_tests}
            onToggleExpand={() => handleToggleExpand('functional_tests')}
            isActive={activeSections.functional_tests}
            onToggleActive={(act) => handleToggleActive('functional_tests', act)}
            hasContent={true}
          >
            <JointExamCard
              jointArea={selectedJoint}
              state={currentJointState}
              onChange={handleJointExamChange}
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

          {/* 7. Специальные методы исследования */}
          <OrthoSandwichCard
            id="special_studies"
            title="7. Специальные методы исследования (МРТ, КТ, рентген, УЗИ, анализы)"
            subtitle="Инструментальные заключения, рентгенография, УЗИ-данные, МРТ-картина"
            icon={<ScienceIcon sx={{ fontSize: 20 }} />}
            expanded={expandedSections.special_studies}
            onToggleExpand={() => handleToggleExpand('special_studies')}
            isActive={activeSections.special_studies}
            onToggleActive={(act) => handleToggleActive('special_studies', act)}
            hasContent={Boolean(specialStudies.trim())}
            previewSnippet={specialStudies.slice(0, 90) + (specialStudies.length > 90 ? '...' : '')}
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
                      category: newPresc.category || 'Диагностика',
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

          {/* 8. Клинический диагноз */}
          <OrthoSandwichCard
            id="diagnosis"
            title="8. Клинический диагноз"
            subtitle="Код по МКБ-10 и развернутая клиническая формулировка диагноза"
            icon={<FactCheckIcon sx={{ fontSize: 20 }} />}
            expanded={expandedSections.diagnosis}
            onToggleExpand={() => handleToggleExpand('diagnosis')}
            isActive={activeSections.diagnosis}
            onToggleActive={(act) => handleToggleActive('diagnosis', act)}
            hasContent={Boolean(clinicalDiagnosis.trim() || selectedMkb)}
            previewSnippet={(selectedMkb?.code ? selectedMkb.code + ': ' : '') + clinicalDiagnosis.slice(0, 80)}
          >
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
                  placeholder="Стадия по Kellgren-Lawrence, сопутствующие деформации, функциональный класс..."
                />
              </Grid>
            </Grid>
          </OrthoSandwichCard>

          {/* 9. Выполненные лечебные манипуляции */}
          <OrthoSandwichCard
            id="performed_manipulations"
            title="9. Выполненные манипуляции и процедуры на приеме"
            subtitle="Внутрисуставные блокады, пункции, введение препаратов гиалуроновой кислоты/PRP, повязки"
            icon={<HealingIcon sx={{ fontSize: 20 }} />}
            expanded={expandedSections.performed_manipulations}
            onToggleExpand={() => handleToggleExpand('performed_manipulations')}
            isActive={activeSections.performed_manipulations}
            onToggleActive={(act) => handleToggleActive('performed_manipulations', act)}
            hasContent={Boolean(performedManipulations.trim())}
            previewSnippet={performedManipulations.slice(0, 90) + (performedManipulations.length > 90 ? '...' : '')}
          >
            <Box sx={{ display: 'flex', gap: 0.8, mb: 1.2, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label="+ Пункция сустава"
                onClick={() => setPerformedManipulations((prev) => (prev ? `${prev}\n• Выполнена пункция сустава, эвакуация синовиального выпота.` : 'Выполнена пункция сустава, эвакуация синовиального выпота.'))}
                sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
              />
              <Chip
                size="small"
                label="+ Внутрисуставная блокада ГКС"
                onClick={() => setPerformedManipulations((prev) => (prev ? `${prev}\n• Внутрисуставное введение раствора пролонгированного ГКС с местным анестетиком.` : 'Внутрисуставное введение раствора пролонгированного ГКС с местным анестетиком.'))}
                sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
              />
              <Chip
                size="small"
                label="+ Введение гиалуроновой кислоты"
                onClick={() => setPerformedManipulations((prev) => (prev ? `${prev}\n• Внутрисуставное введение препарата высокомолекулярного гиалуроната натрия.` : 'Внутрисуставное введение препарата высокомолекулярного гиалуроната натрия.'))}
                sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
              />
              <Chip
                size="small"
                label="+ PRP-терапия"
                onClick={() => setPerformedManipulations((prev) => (prev ? `${prev}\n• Внутрисуставное введение аутологичной обогащенной тромбоцитами плазмы (PRP).` : 'Внутрисуставное введение аутологичной обогащенной тромбоцитами плазмы (PRP).'))}
                sx={{ cursor: 'pointer', fontSize: '0.74rem' }}
              />
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Выполненные лечебные манипуляции"
              multiline
              minRows={2}
              value={performedManipulations}
              onChange={(e) => setPerformedManipulations(e.target.value)}
              placeholder="Протокол пункции, объем полученной жидкости, введенный препарат, дозировка, переносимость..."
            />
          </OrthoSandwichCard>

          {/* 10. Рекомендации и план лечения */}
          <OrthoSandwichCard
            id="recommendations"
            title="10. План лечения, рекомендации и назначенные услуги клиники"
            subtitle="Охранительный режим, медикаментозная терапия, услуги клиники"
            icon={<MedicalServicesIcon sx={{ fontSize: 20 }} />}
            expanded={expandedSections.recommendations}
            onToggleExpand={() => handleToggleExpand('recommendations')}
            isActive={activeSections.recommendations}
            onToggleActive={(act) => handleToggleActive('recommendations', act)}
            hasContent={Boolean(recommendations.trim() || prescriptions.length > 0)}
            previewSnippet={`${recommendations.slice(0, 60)}... (${prescriptions.length} услуг)`}
          >
            <TextField
              fullWidth
              size="small"
              label="Общие рекомендации и медикаментозное лечение"
              multiline
              minRows={3}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Service selector from servdict */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <Autocomplete
                size="small"
                sx={{ flex: 1 }}
                options={servicesCatalog}
                getOptionLabel={(s) => `${s.name} (${s.price} ₽)`}
                value={pendingService}
                onChange={(_, val) => setPendingService(val)}
                renderInput={(params) => <TextField {...params} placeholder="Добавить процедуру / блокаду / манипуляцию..." />}
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
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Услуга / манипуляция</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Кол-во</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Стоимость</TableCell>
                      <TableCell align="center" sx={{ width: 40 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prescriptions.map((p, idx) => {
                      const itemPrice = Number(p.price ?? (p as any).unitPrice ?? (p as any).unit_price ?? 0);
                      const itemQty = Number(p.quantity || 1);
                      return (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.name || (p as any).title}</TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.82rem' }}>{itemQty}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                            {(itemPrice * itemQty).toLocaleString('ru-RU')} ₽
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
                  const { isCustom, author: customAuthor } = getTemplateCustomInfo(tmpl);

                  return (
                    <Grid size={{ xs: 12, sm: 6 }} key={tmpl.id || tmpl.rawId || tmpl.title}>
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
    </Box>
  );
}
