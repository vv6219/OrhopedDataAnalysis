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
  TableRow
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
import { API_BASE_URL } from '../config/apiConfig';
import BodyHomunculus from '../components/ortho/BodyHomunculus';
import type { JointAreaId, JointExamSummary } from '../components/ortho/BodyHomunculus';
import JointExamCard from '../components/ortho/JointExamCard';
import type { JointExamState } from '../components/ortho/JointExamCard';
import PatientMediaHub from '../components/ortho/PatientMediaHub';
import type { MediaItem } from '../components/ortho/PatientMediaHub';
import OrthoProtocolPreview from '../components/ortho/OrthoProtocolPreview';
import type { OrthoProtocolData, OrthoPrescriptionItem } from '../components/reports/OrthoProtocolPrintTemplate';
import { parseProtocolContent } from '../utils/protocolXmlParser';

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

  // E-Sign info
  const [isSigned, setIsSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string | undefined>(undefined);
  const [signatureHash, setSignatureHash] = useState<string | undefined>(undefined);

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

  // Fetch Appointment & Patient Context
  const fetchContext = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE_URL}/api/ortho/context`;
      const qParams = new URLSearchParams();
      if (queryProtocolId) qParams.append('protocolId', queryProtocolId);
      if (queryPatientId) qParams.append('patientId', queryPatientId);

      if (appointmentId && appointmentId !== 'new') {
        url = `${API_BASE_URL}/api/ortho/context/${appointmentId}`;
      } else if (qParams.toString()) {
        url = `${API_BASE_URL}/api/ortho/context?${qParams.toString()}`;
      } else {
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

      setContextData(data);
      setTemplates(data.templates || []);
      setServicesCatalog(data.services || data.servicesList || []);
      setMediaList(data.mediaAttachments || []);
      setBiomechanicsHistory(data.biomechanicsHistory || []);

      // If current protocol exists, hydrate state
      if (data.currentProtocol) {
        const cp = data.currentProtocol;
        setProtocolId(cp.id);
        setIsSigned(cp.is_signed === 1);
        setSignedAt(cp.signed_at);
        setSignatureHash(cp.signature_hash);

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
        setRecommendations(
          parsedJson?.recommendations ||
          parsedXml.recommendations ||
          (parsedXml.performed ? 'Выполнено:\n' + parsedXml.performed : '') ||
          '1. Охранительный двигательный режим, исключение осевых ударных нагрузок.\n2. Ношение разгрузочного ортеза при ходьбе.\n3. Курс ЛФК и кинезиотерапии.'
        );

        if (parsedJson) {
          if (parsedJson.vasScore !== undefined) setVasScore(parsedJson.vasScore);
          if (parsedJson.jointArea) setSelectedJoint(parsedJson.jointArea as JointAreaId);
          if (parsedJson.prescriptions) setPrescriptions(parsedJson.prescriptions);
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

        // Diagnosis
        const diagText = parsedJson?.clinicalDiagnosis || parsedXml.diagnosis || (parsedXml.isXml ? '' : cp.content) || '';
        setClinicalDiagnosis(diagText);

        const mkbCode = cp.mkb_code || parsedXml.mkb;
        if (mkbCode) {
          setSelectedMkb({ code: mkbCode, name: cp.mkb_name || '' });
        }
      } else {
        // Default complaints for fresh exam
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

  // Current Joint State
  const currentJointState: JointExamState = useMemo(() => {
    return (
      jointExamsMap[selectedJoint] || {
        jointArea: selectedJoint,
        side: selectedJoint.endsWith('_l') ? 'left' : 'right',
        axis: 'norm',
        effusion: 0,
        rom: { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 },
        tests: {}
      }
    );
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

  // Fast Clinical Template Fill
  const handleApplyTemplate = (tmpl: any) => {
    try {
      const parsed = typeof tmpl.template_json === 'string' ? JSON.parse(tmpl.template_json) : tmpl.template_json;
      if (parsed.complaints) setComplaints(parsed.complaints);
      if (parsed.anamnesis) setAnamnesis(parsed.anamnesis);
      if (parsed.vas) setVasScore(parsed.vas);
      if (tmpl.default_mkb_code) {
        const found = COMMON_MKB10.find((m) => m.code === tmpl.default_mkb_code);
        if (found) setSelectedMkb(found);
        else setSelectedMkb({ code: tmpl.default_mkb_code, name: tmpl.title });
      }
      if (parsed.clinicalDiagnosis) setClinicalDiagnosis(parsed.clinicalDiagnosis);
      if (parsed.recommendations) setRecommendations(parsed.recommendations);
      if (parsed.prescriptions) {
        setPrescriptions(parsed.prescriptions);
      }
      if (tmpl.joint_name) {
        const matchingArea: JointAreaId = (tmpl.joint_name + '_r') as JointAreaId;
        setSelectedJoint(matchingArea);
        if (parsed.rom || parsed.tests) {
          setJointExamsMap((prev) => ({
            ...prev,
            [matchingArea]: {
              jointArea: matchingArea,
              side: 'right',
              axis: parsed.axis || 'norm',
              effusion: parsed.effusion || 0,
              rom: parsed.rom || { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 },
              tests: parsed.tests || {}
            }
          }));
        }
      }
      setToastMessage(`Шаблон «${tmpl.title}» успешно применён`);
    } catch (e: any) {
      console.error('Error applying template:', e);
      setToastMessage('Ошибка применения шаблона');
    }
  };

  // Add Prescribed Service from Catalog
  const handleAddService = () => {
    if (!pendingService) return;
    const exists = prescriptions.find((p) => p.name === pendingService.name);
    if (exists) {
      setPrescriptions((prev) =>
        prev.map((p) => (p.name === pendingService.name ? { ...p, quantity: (p.quantity || 1) + 1 } : p))
      );
    } else {
      setPrescriptions((prev) => [
        ...prev,
        {
          code: pendingService.code,
          name: pendingService.name,
          category: pendingService.kind || 'Ортопедия',
          quantity: 1,
          price: pendingService.price || 0
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
      doctorName: appt.doctor_name || 'Добрушкин В.И.',
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
        prescriptions: prescriptions.map((p) => ({
          service_code: p.code,
          service_name: p.name,
          category: p.category || 'Ортопедия',
          quantity: p.quantity || 1,
          unit_price: p.price || 0,
          total_price: (p.price || 0) * (p.quantity || 1),
          dosage_notes: p.dosage_notes || ''
        })),
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
    } catch (err: any) {
      console.error('Error saving protocol:', err);
      setToastMessage(`Ошибка сохранения: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Transfer to Cashier Checkout
  const handleTransferToCashier = async () => {
    try {
      setSaving(true);
      if (!isSigned) {
        await handleSaveProtocol('draft');
      }

      const payload = {
        appointmentId: contextData?.appointment?.id,
        protocolId,
        patientId: contextData?.patient?.id,
        patientName: contextData?.patient?.full_name,
        items: prescriptions.map((p) => ({
          title: p.name,
          price: p.price || 0,
          quantity: p.quantity || 1,
          code: p.code
        }))
      };

      const res = await fetch(`${API_BASE_URL}/api/ortho/transfer-to-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.checkoutPrefill) {
        sessionStorage.setItem('ortho_checkout_prefill', JSON.stringify(data.checkoutPrefill));
        setToastMessage('Назначения переданы в кассу! Переход в модуль оплаты...');
        setTimeout(() => {
          navigate('/checkout');
        }, 600);
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
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.15rem' }}>
                {patient.full_name || 'Иванов Иван Иванович'}
              </Typography>
              <Chip
                label={`№ карты: ${patient.mednum || 'б/н'}`}
                size="small"
                sx={{ bgcolor: '#E2E8F0', fontWeight: 700, fontSize: '0.75rem' }}
              />
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
              <span>Дата рожд.: <b>{patient.bdate || '—'}</b> ({patient.age || '—'} лет)</span>
              <span>Пол: <b>{patient.sex === 1 ? 'М' : patient.sex === 2 ? 'Ж' : '—'}</b></span>
              <span>Тел: <b>{patient.sphone || patient.phone || '—'}</b></span>
              <span>Врач: <b>{appointment.doctor_name || 'Добрушкин В.И.'}</b></span>
            </Typography>
          </Box>
        </Box>

        {/* PATIENT SEARCH, FAST CLINICAL TEMPLATES & ACTION BUTTONS */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Autocomplete
            size="small"
            sx={{ width: 240 }}
            options={patientSearchOptions}
            loading={patientSearchLoading}
            getOptionLabel={(p) => (typeof p === 'string' ? p : `${p.full_name || ''} ${p.bdate ? `(${p.bdate})` : ''} ${p.mednum ? `[#${p.mednum}]` : ''}`)}
            onInputChange={(_, val) => handleSearchPatients(val)}
            onChange={(_, selectedPatient) => {
              if (selectedPatient?.id) {
                navigate(`/ortho-workstation?patientId=${selectedPatient.id}`);
              }
            }}
            noOptionsText="Введите ФИО или № карты"
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="🔍 Сменить пациента..."
                size="small"
              />
            )}
          />

          {templates.length > 0 && (
            <Autocomplete
              size="small"
              options={templates}
              getOptionLabel={(t) => t.title}
              onChange={(_, val) => val && handleApplyTemplate(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Быстрый шаблон (F4)..."
                  sx={{ width: 200 }}
                />
              )}
            />
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<SaveIcon />}
            onClick={() => handleSaveProtocol('draft')}
            disabled={saving || isSigned}
            sx={{ fontWeight: 700 }}
          >
            Черновик
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<LockIcon />}
            onClick={() => handleSaveProtocol('signed')}
            disabled={saving || isSigned}
            sx={{ bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' }, fontWeight: 700 }}
          >
            Подписать (ЭЦП)
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
            В кассу ({prescriptions.reduce((s, p) => s + (p.price || 0) * (p.quantity || 1), 0).toLocaleString('ru-RU')} ₽)
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
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5 }}>
              2. Анатомическая карта (2D Гомункулус)
            </Typography>

            <BodyHomunculus
              selectedJoint={selectedJoint}
              onSelectJoint={(j) => setSelectedJoint(j)}
              examData={homunculusExamSummary}
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
                  onChange={(_, val) => setSelectedMkb(val)}
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
                    {prescriptions.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.name}</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.82rem' }}>{p.quantity || 1}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                          {((p.price || 0) * (p.quantity || 1)).toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => handleRemovePrescription(idx)}>
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
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
    </Box>
  );
}
