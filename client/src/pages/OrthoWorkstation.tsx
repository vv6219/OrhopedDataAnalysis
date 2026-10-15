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
  { id: 'all', code: 'ALL', name_ru: 'Все кластеры (100)', joint_affinity: 'all', badge_color: '#0F3C64', sort_order: 0 },
  { id: 'cluster_knee', code: 'KNEE', name_ru: '1. Коленный сустав', joint_affinity: 'knee', badge_color: '#0284C7', sort_order: 10 },
  { id: 'cluster_shoulder', code: 'SHOULDER', name_ru: '2. Плечевой пояс', joint_affinity: 'shoulder', badge_color: '#9333EA', sort_order: 20 },
  { id: 'cluster_hip_pelvis', code: 'HIP_PELVIS', name_ru: '3. Таз и ТБС', joint_affinity: 'hip', badge_color: '#16A34A', sort_order: 30 },
  { id: 'cluster_foot_ankle', code: 'FOOT_ANKLE', name_ru: '4. Стопа и голеностоп', joint_affinity: 'ankle', badge_color: '#0D9488', sort_order: 40 },
  { id: 'cluster_elbow', code: 'ELBOW', name_ru: '5. Локтевой сустав', joint_affinity: 'elbow', badge_color: '#EA580C', sort_order: 50 },
  { id: 'cluster_wrist_hand', code: 'WRIST_HAND', name_ru: '6. Кисть и запястье', joint_affinity: 'wrist', badge_color: '#DB2777', sort_order: 60 },
  { id: 'cluster_spine', code: 'SPINE', name_ru: '7. Позвоночник и торакс', joint_affinity: 'spine', badge_color: '#475569', sort_order: 70 },
  { id: 'cluster_pediatric', code: 'PEDIATRIC', name_ru: '8. Детская ортопедия', joint_affinity: 'general', badge_color: '#D97706', sort_order: 80 },
  { id: 'cluster_systemic', code: 'SYSTEMIC', name_ru: '9. Системные синдромы', joint_affinity: 'general', badge_color: '#4F46E5', sort_order: 90 },
  { id: 'cluster_postop', code: 'POSTOP', name_ru: '10. Постоперационные протоколы', joint_affinity: 'general', badge_color: '#059669', sort_order: 100 }
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
  const [vasScore, setVasScore] = useState<number>(4);
  const [gait] = useState('Свободная, физиологическая, без хромоты.');
  const [posture] = useState('Осанка правильная, физиологические изгибы сохранены.');

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

  // Complete reset of all 4 clinical exam cards & workstation state
  const resetAllCardsState = () => {
    setProtocolId(null);
    setIsSigned(false);
    setSignedAt(undefined);
    setSignatureHash(undefined);
    setComplaints('');
    setAnamnesis('');
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
    // Card 4: План лечения, манипуляции и назначенные услуги клиники
    setRecommendations('1. Охранительный двигательный режим, исключение осевых ударных нагрузок.\n2. Ношение разгрузочного ортеза при ходьбе.\n3. Курс ЛФК и кинезиотерапии.');
    setPendingService(null);
    setPrescriptions([]);
    setActiveTemplateDiagnostics([]);
    setMediaList([]);
    setBiomechanicsHistory([]);
    setRightPanelTab(0);
    setCurrentSelectedTemplate(null);
  };

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

        // Card 1: Hydrate clinical narrative
        setComplaints(parsedJson?.complaints || parsedXml.complaints || cp.title || '');
        setAnamnesis(parsedJson?.anamnesis || parsedXml.anamnesis || '');
        setRecommendations(
          parsedJson?.recommendations ||
          parsedXml.recommendations ||
          (parsedXml.performed ? 'Выполнено:\n' + parsedXml.performed : '') ||
          '1. Охранительный двигательный режим, исключение осевых ударных нагрузок.\n2. Ношение разгрузочного ортеза при ходьбе.\n3. Курс ЛФК и кинезиотерапии.'
        );

        // Card 2: Joint exam & Homunculus
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

        // Card 4: Hydrate prescriptions from parsedJson or fallback to backend currentPrescriptions
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

        // Card 3: Diagnosis
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
        // Card 4: Clean slate for prescriptions & recommendations
        setRecommendations('1. Охранительный двигательный режим, исключение осевых ударных нагрузок.\n2. Ношение разгрузочного ортеза при ходьбе.\n3. Курс ЛФК и кинезиотерапии.');
        setPendingService(null);
        setPrescriptions([]);
        // Narrative defaults
        setComplaints('Боль в правом коленном суставе при физической нагрузке и спуске по лестнице, стартовая скованность.');
        setAnamnesis('Считает себя больным около 6 месяцев. Связывает с повышенной нагрузкой. Ранее консервативно не лечился.');
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

  // Filter templates by selected cluster and search query
  const filteredTemplates = useMemo(() => {
    return templates.filter((tmpl) => {
      // 1. Cluster filter
      if (selectedClusterId && selectedClusterId !== 'all') {
        const clusterCode = selectedClusterId.replace('cluster_', '').toUpperCase();
        const tmplCluster = String(tmpl.cluster_id || tmpl.cluster || tmpl.category || '').toUpperCase();
        const tmplJoint = String(tmpl.joint_name || '').toLowerCase();
        
        let match = false;
        if (tmpl.cluster_id === selectedClusterId) {
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

      // 2. Search query filter
      if (protocolSearchQuery.trim()) {
        const q = protocolSearchQuery.toLowerCase();
        const titleMatch = (tmpl.title || '').toLowerCase().includes(q);
        const codeMatch = (tmpl.default_mkb_code || tmpl.mkb_code || '').toLowerCase().includes(q);
        const jointMatch = (tmpl.joint_name || '').toLowerCase().includes(q);
        return titleMatch || codeMatch || jointMatch;
      }

      return true;
    });
  }, [templates, selectedClusterId, protocolSearchQuery]);

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
        if (parsed.recommendations || parsed.performed) {
          const combinedRec = [
            parsed.recommendations,
            parsed.performed ? `Выполнено:\n${parsed.performed}` : ''
          ].filter(Boolean).join('\n\n');
          setRecommendations(combinedRec);
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
                if (t.recommendations_template) setRecommendations(t.recommendations_template);

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
            Справочник протоколов (100)
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
          {/* 1. Жалобы, Анамнез, ВАШ */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedicalServicesIcon sx={{ fontSize: 20 }} /> 1. Жалобы, анамнез и интенсивность боли
            </Typography>

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
                  placeholder="Боль, ограничение движений, отек, хруст..."
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Анамнез заболевания (Anamnesis morbi)"
                  multiline
                  minRows={2}
                  value={anamnesis}
                  onChange={(e) => setAnamnesis(e.target.value)}
                  placeholder="Длительность, связь с травмой, проводимое ранее лечение..."
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
          </Paper>

          {/* 2. 2D HOMUNCULUS & ANATOMICAL SELECTION */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                2. Анатомическая карта (2D Гомункулус)
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AssignmentIcon sx={{ fontSize: 16 }} />}
                onClick={() => {
                  if (selectedJoint && JOINT_TO_CLUSTER[selectedJoint]) {
                    setSelectedClusterId(JOINT_TO_CLUSTER[selectedJoint].clusterId);
                  }
                  setProtocolDialogOpen(true);
                }}
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderColor: '#0284C7',
                  color: '#0284C7',
                  textTransform: 'none'
                }}
              >
                Протоколы кластера ({filteredTemplates.length})
              </Button>
            </Box>

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

          {/* 3. JOINT EXAMINATION CARD (ROM, AXIS, EFFUSION, TESTS) */}
          <Box sx={{ mb: 2 }}>
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
          </Box>

          {/* DIAGNOSTIC RECOMMENDATIONS CARD (Methods, X-Ray, MRI, US, Labs with 1-click add to prescriptions) */}
          <Box sx={{ mb: 2 }}>
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
                setRecommendations((prev) => {
                  if (prev.includes(phrase)) return prev;
                  return prev ? `${prev}\n- ${phrase}` : `- ${phrase}`;
                });
                setToastMessage('Рекомендация добавлена в текст плана лечения');
              }}
            />
          </Box>

          {/* 4. DIAGNOSIS (ICD-10 + EXPANDED CLINICAL) */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5 }}>
              3. Клинический диагноз
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
                  placeholder="Стадия по Kellgren-Lawrence, сопутствующие деформации, функциональный класс..."
                />
              </Grid>
            </Grid>
          </Paper>

          {/* 5. RECOMMENDATIONS & SERVICES PRESCRIPTIONS */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5 }}>
              4. План лечения, манипуляции и назначенные услуги клиники
            </Typography>

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
          </Paper>
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
          {/* LEVEL 1: CLUSTER SELECTOR PILLS */}
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
            Уровень 1: Выберите анатомический или нозологический кластер
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2.5 }}>
            {MASTER_CLUSTERS.map((cl) => {
              const isSelected = selectedClusterId === cl.id;
              return (
                <Chip
                  key={cl.id}
                  label={cl.name_ru}
                  size="small"
                  onClick={() => setSelectedClusterId(cl.id)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    bgcolor: isSelected ? cl.badge_color : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#334155',
                    border: `1px solid ${isSelected ? cl.badge_color : '#CBD5E1'}`,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: isSelected ? cl.badge_color : '#E2E8F0'
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
              placeholder="Поиск по диагнозу, МКБ-10 или симптому..."
              value={protocolSearchQuery}
              onChange={(e) => setProtocolSearchQuery(e.target.value)}
              sx={{ width: 320 }}
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
                  return (
                    <Grid size={{ xs: 12, sm: 6 }} key={tmpl.id || tmpl.rawId || tmpl.title}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          borderColor: isCurrent ? '#0284C7' : '#E2E8F0',
                          bgcolor: isCurrent ? '#F0F9FF' : '#FFFFFF',
                          transition: 'all 0.15s ease-in-out',
                          '&:hover': {
                            borderColor: '#0284C7',
                            boxShadow: '0 4px 12px rgba(2,132,199,0.1)'
                          }
                        }}
                      >
                        <CardActionArea onClick={() => handleApplyTemplate(tmpl)} sx={{ p: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64', lineHeight: 1.3 }}>
                              {tmpl.title}
                            </Typography>
                            <Chip
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
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
                            Локализация: <b>{tmpl.joint_name || 'Опорно-двигательный аппарат'}</b>
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                              size="small"
                              variant={isCurrent ? 'contained' : 'outlined'}
                              color="primary"
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
                  В данном кластере нет протоколов, соответствующих запросу. Попробуйте выбрать «Все кластеры» или очистить поиск.
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
    </Box>
  );
}
