import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import ArticleIcon from '@mui/icons-material/Article';
import BadgeIcon from '@mui/icons-material/Badge';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import LockIcon from '@mui/icons-material/Lock';
import { useReactToPrint } from 'react-to-print';

import { API_BASE_URL } from '../../config/apiConfig';
import { COMMON_PRINT_PAGE_STYLE } from '../../utils/printStyles';
import { useAuth } from '../../context/AuthContext';
import { isElementPermitted } from '../../utils/permissionUtils';
import OrthoReferralPrintTemplate from '../reports/OrthoReferralPrintTemplate';
import SickLeavePrintTemplate from '../reports/SickLeavePrintTemplate';
import PeReleasePrintTemplate from '../reports/PeReleasePrintTemplate';
import PatientExtractPrintTemplate from '../reports/PatientExtractPrintTemplate';
import PatientMedicalCardPrintTemplate from '../reports/PatientMedicalCardPrintTemplate';
import PatientConsentPrintTemplate from '../reports/PatientConsentPrintTemplate';
import PatientMemoPrintTemplate from '../reports/PatientMemoPrintTemplate';
import { FitToFlyPrintTemplate } from '../reports/FitToFlyPrintTemplate';
import { SportsAdmissionPrintTemplate } from '../reports/SportsAdmissionPrintTemplate';
import { IssuePatientDocumentModal } from './IssuePatientDocumentModal';
import { exportReferralToDocx } from '../../utils/referralDocxExport';
import { stripProtocolXml } from '../../utils/protocolXmlParser';

export type DocumentCategoryType = 'all' | 'referrals' | 'certificates' | 'extracts' | 'medical_card' | 'other';

export interface PatientDocItem {
  id: string;
  category: 'referrals' | 'certificates' | 'extracts' | 'medical_card' | 'other';
  title: string;
  formCode: string;
  subtitle: string;
  date: string;
  doctorName: string;
  badgeText: string;
  badgeColor: 'primary' | 'success' | 'warning' | 'info' | 'secondary' | 'default' | 'error';
  detailsSnippet?: string;
  sourceData: any;
  printType: 'referral' | 'sick_leave' | 'pe_release' | 'extract' | 'medical_card' | 'consent' | 'memo' | 'fit_to_fly' | 'sports_admission';
  requiredPermission?: string;
}

interface PatientDocumentsPrintTabProps {
  initialPatientId?: string | number | null;
  onNavigateToProtocolsTab: (patientId?: number) => void;
  onOpenIssueReferralModal?: (patient: any, protocol?: any) => void;
}

export default function PatientDocumentsPrintTab({
  initialPatientId,
  onNavigateToProtocolsTab,
  onOpenIssueReferralModal
}: PatientDocumentsPrintTabProps) {
  const { currentUser, hasPermission } = useAuth();
  const isSysadmin = hasPermission('sysadmin') || isElementPermitted('protocols_registry', 'print_sick_leave', currentUser?.permissionCodes);

  // Selected Patient State
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearchOptions, setPatientSearchOptions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Patient Clinical Context & History
  const [loadingContext, setLoadingContext] = useState(false);
  const [patientProtocols, setPatientProtocols] = useState<any[]>([]);
  const [patientReferrals, setPatientReferrals] = useState<any[]>([]);
  const [clinicalProfile, setClinicalProfile] = useState<any>(null);
  const [patientIssuedDocs, setPatientIssuedDocs] = useState<any[]>([]);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  // Filter & Selection State
  const [activeCategory, setActiveCategory] = useState<DocumentCategoryType>('all');
  const [fullTextFilter, setFullTextFilter] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Preview Dialog State
  const [previewDoc, setPreviewDoc] = useState<PatientDocItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Hidden Print Data State
  const [printDoc, setPrintDoc] = useState<PatientDocItem | null>(null);
  const [batchPrintDocs, setBatchPrintDocs] = useState<PatientDocItem[]>([]);
  const printSingleRef = useRef<HTMLDivElement>(null);
  const printBatchRef = useRef<HTMLDivElement>(null);

  // Print single document
  const triggerPrintSingle = useReactToPrint({
    contentRef: printSingleRef,
    documentTitle: printDoc ? `${printDoc.formCode}_${selectedPatient?.fullName || 'Пациент'}` : 'Документ_Пациента',
    pageStyle: COMMON_PRINT_PAGE_STYLE
  });

  // Batch print multiple documents
  const triggerPrintBatch = useReactToPrint({
    contentRef: printBatchRef,
    documentTitle: `Пакет_Документов_${selectedPatient?.fullName || 'Пациент'}_${new Date().toISOString().slice(0, 10)}`,
    pageStyle: COMMON_PRINT_PAGE_STYLE
  });

  // Search Patients Autocomplete
  const handleSearchPatients = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setPatientSearchOptions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ortho/patients/search?q=${encodeURIComponent(query.trim())}&limit=25`);
      const data = await res.json();
      if (data.success && Array.isArray(data.patients)) {
        setPatientSearchOptions(
          data.patients.map((p: any) => ({
            id: p.id,
            fullName: p.full_name || `${p.surname || ''} ${p.name || ''} ${p.patron || ''}`.trim(),
            birthDate: p.bdate,
            age: p.age,
            gender: p.sex_display,
            phone: p.phone || p.sphone,
            cardNum: String(p.mednum || p.id),
            dmsInsurer: p.dms_insurer,
            lastVisitDate: p.last_visit_date,
            totalVisits: p.total_visits
          }))
        );
      }
    } catch (err) {
      console.error('Error searching patients:', err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Fetch Full Context when Patient changes
  const loadPatientData = useCallback(async (patientId: number) => {
    setLoadingContext(true);
    try {
      // 1. Fetch Patient Details & Context
      const ctxRes = await fetch(`${API_BASE_URL}/api/ortho/context?patientId=${patientId}`);
      const ctxData = await ctxRes.json();
      if (ctxData.success) {
        if (ctxData.patient) {
          setSelectedPatient({
            id: ctxData.patient.id,
            fullName: ctxData.patient.fullName || ctxData.patient.full_name,
            birthDate: ctxData.patient.birthDate || ctxData.patient.bdate,
            age: ctxData.patient.age,
            gender: ctxData.patient.gender,
            phone: ctxData.patient.phone,
            cardNum: String(ctxData.patient.cardNum || ctxData.patient.mednum || ctxData.patient.id),
            address: ctxData.patient.address,
            dmsInsurer: ctxData.patient.dmsInsurer
          });
        }
        setClinicalProfile(ctxData.clinicalProfile || null);
      }

      // 2. Fetch Protocols for Patient
      const protoRes = await fetch(`${API_BASE_URL}/api/ortho/registry?patientId=${patientId}&pageSize=100`);
      const protoData = await protoRes.json();
      if (protoData.success) {
        setPatientProtocols(protoData.rows || []);
      }

      // 3. Fetch Referrals for Patient
      const refRes = await fetch(`${API_BASE_URL}/api/ortho/referrals/patient/${patientId}`);
      const refData = await refRes.json();
      if (refData.success) {
        setPatientReferrals(refData.referrals || []);
      }

      // 4. Fetch Formally Issued Documents for Patient
      const issuedRes = await fetch(`${API_BASE_URL}/api/ortho/patient-documents/patient/${patientId}`);
      const issuedData = await issuedRes.json();
      if (issuedData.success) {
        setPatientIssuedDocs(issuedData.documents || []);
      }
    } catch (err) {
      console.error('Error loading patient context:', err);
    } finally {
      setLoadingContext(false);
    }
  }, []);

  // Load initial patient if provided via props
  useEffect(() => {
    if (initialPatientId) {
      loadPatientData(Number(initialPatientId));
    }
  }, [initialPatientId, loadPatientData]);

  // Synthesize Document Catalog from clinical data
  const allDocuments = useMemo<PatientDocItem[]>(() => {
    if (!selectedPatient) return [];
    const docs: PatientDocItem[] = [];

    const latestProtocol = patientProtocols[0] || null;
    const defaultDoctorName = latestProtocol?.doctor_name || 'Добрушкин А.М.';
    const defaultMkb = latestProtocol?.mkb_code || 'M17.1';
    const defaultDiagnosis = latestProtocol?.mkb_name || latestProtocol?.title || 'Первичный гонартроз двусторонний';
    const cleanAnamnesis = latestProtocol ? stripProtocolXml(latestProtocol.content, 220) : '';

    // -------------------------------------------------------------------------
    // 0. ОФИЦИАЛЬНО ЗАРЕГИСТРИРОВАННЫЕ ДОКУМЕНТЫ (Сквозная нумерация и Serilog)
    // -------------------------------------------------------------------------
    if (patientIssuedDocs.length > 0) {
      patientIssuedDocs.forEach((idoc: any) => {
        let parsedData: any = {};
        try {
          parsedData = typeof idoc.document_data_json === 'string'
            ? JSON.parse(idoc.document_data_json)
            : (idoc.document_data_json || {});
        } catch {
          parsedData = {};
        }

        let cat: 'referrals' | 'certificates' | 'extracts' | 'medical_card' | 'other' = 'certificates';
        let pType: any = 'sick_leave';

        if (idoc.document_type === 'referral') {
          cat = 'referrals';
          pType = 'referral';
        } else if (idoc.document_type === 'extract') {
          cat = 'extracts';
          pType = 'extract';
        } else if (idoc.document_type === 'card') {
          cat = 'medical_card';
          pType = 'medical_card';
        } else if (idoc.document_type === 'consent' || idoc.document_type === 'memo') {
          cat = 'other';
          pType = idoc.document_type;
        } else if (idoc.document_type === 'fit_to_fly') {
          cat = 'certificates';
          pType = 'fit_to_fly';
        } else if (idoc.document_type === 'sports_admission') {
          cat = 'certificates';
          pType = 'sports_admission';
        } else if (idoc.document_type === 'pe_release') {
          cat = 'certificates';
          pType = 'pe_release';
        }

        const isDup = (idoc.printed_count || 1) > 1;
        const isSickDoc =
          idoc.document_type === 'sick_leave' ||
          idoc.document_type === 'disability' ||
          idoc.document_type === 'certificate' ||
          idoc.form_code === '095/у' ||
          idoc.form_code === '347н / ЭЛН' ||
          (idoc.title && idoc.title.toLowerCase().includes('нетрудоспособност')) ||
          (idoc.title && idoc.title.toLowerCase().includes('больничный'));

        docs.push({
          id: `issued_${idoc.id}`,
          category: cat,
          title: `${idoc.title} [Зарегистрирован]`,
          formCode: idoc.form_code || idoc.document_number,
          subtitle: `Рег. №: ${idoc.document_number} • Назначение: ${idoc.recipient_organization || 'По месту требования'}`,
          date: idoc.issue_date ? idoc.issue_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
          doctorName: idoc.doctor_name || defaultDoctorName,
          badgeText: idoc.document_number,
          badgeColor: 'success',
          detailsSnippet: `Официальный зарегистрированный документ № ${idoc.document_number}. Распечаток: ${idoc.printed_count || 1}${isDup ? ' (Дубликат)' : ''}. Диагноз: ${idoc.clinical_diagnosis || '—'}.`,
          sourceData: {
            documentNumber: idoc.document_number,
            issueDate: idoc.issue_date ? idoc.issue_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
            validUntil: idoc.valid_until || parsedData.validUntil,
            patient: {
              fullName: selectedPatient.fullName,
              fullNameEn: parsedData.fullNameEn,
              birthDate: selectedPatient.birthDate,
              gender: selectedPatient.gender,
              cardNum: selectedPatient.cardNum,
              phone: selectedPatient.phone,
              address: selectedPatient.address,
              snils: parsedData.patientDetails?.snils || '123-456-789 00',
              passportNumber: parsedData.patientDetails?.passportNumber
            },
            destination: idoc.recipient_organization || parsedData.destinationRoute,
            clinicalDiagnosis: idoc.clinical_diagnosis || defaultDiagnosis,
            icd10Code: idoc.icd10_code || defaultMkb,
            specialRequirements: parsedData.specialRequirements,
            sportDiscipline: parsedData.sportDiscipline,
            sportEventStage: parsedData.sportStage,
            examResultsSummary: parsedData.examResults,
            procedureName: parsedData.procedureName,
            examTypeMemo: parsedData.examTypeMemo,
            instructions: (parsedData.memoInstructions || '').split('\n').filter(Boolean),
            doctorName: idoc.doctor_name || defaultDoctorName,
            verificationHash: idoc.verification_hash,
            isDuplicate: isDup
          },
          printType: pType,
          requiredPermission: isSickDoc ? 'sysadmin' : undefined
        });
      });
    }

    // -------------------------------------------------------------------------
    // 1. НАПРАВЛЕНИЯ (Referrals from DB + Protocols)
    // -------------------------------------------------------------------------
    if (patientReferrals.length > 0) {
      patientReferrals.forEach((ref) => {
        const isInternal = Boolean(ref.performer_is_internal);
        docs.push({
          id: `ref_${ref.id}`,
          category: 'referrals',
          title: `Направление № ${ref.referral_number}`,
          formCode: 'Форма № 057/у-04',
          subtitle: `Исполнитель: ${ref.performer_name || 'Внутренний кабинет'} • Срок: ${ref.valid_days || 90} дней`,
          date: ref.issue_date ? ref.issue_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
          doctorName: ref.doctor_name || defaultDoctorName,
          badgeText: isInternal ? 'Внутреннее' : 'Внешний центр',
          badgeColor: isInternal ? 'success' : 'primary',
          detailsSnippet: `Диагноз: ${ref.clinical_diagnosis || ref.icd10_code || '—'}. Назначено позиций: ${ref.items_count || 1}`,
          sourceData: {
            ...ref,
            patient: {
              fullName: selectedPatient.fullName,
              birthDate: selectedPatient.birthDate,
              gender: selectedPatient.gender,
              phone: selectedPatient.phone,
              cardNum: selectedPatient.cardNum
            },
            items: ref.items || []
          },
          printType: 'referral'
        });
      });
    } else if (latestProtocol) {
      // Suggest issuing referral based on latest protocol
      docs.push({
        id: `ref_suggest_${latestProtocol.id}`,
        category: 'referrals',
        title: `Направление на дообследование (МРТ / КТ / УЗИ)`,
        formCode: 'Форма № 057/у-04',
        subtitle: `По приёму от ${latestProtocol.vdate ? latestProtocol.vdate.slice(0, 10) : '—'}`,
        date: latestProtocol.vdate ? latestProtocol.vdate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        doctorName: latestProtocol.doctor_name || defaultDoctorName,
        badgeText: 'Проект по приему',
        badgeColor: 'warning',
        detailsSnippet: `Рекомендовано по результатам осмотра (${latestProtocol.mkb_code || 'ортопедия'}).`,
        sourceData: {
          referral_number: `РЕФ-${latestProtocol.id}-${new Date().getFullYear()}`,
          issue_date: latestProtocol.vdate || new Date().toISOString().slice(0, 10),
          valid_days: 90,
          expires_at: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
          doctor_name: latestProtocol.doctor_name || defaultDoctorName,
          performer_id: 1,
          performer_name: 'Отделение инструментальной диагностики Центра Ортопедии',
          performer_is_internal: true,
          patient: {
            fullName: selectedPatient.fullName,
            birthDate: selectedPatient.birthDate,
            phone: selectedPatient.phone,
            cardNum: selectedPatient.cardNum
          },
          icd10_code: defaultMkb,
          clinical_diagnosis: defaultDiagnosis,
          items: [
            {
              domain: 'diagnostics',
              service_code: 'A06.04.001',
              item_title: `МРТ ${latestProtocol.primary_joint ? latestProtocol.primary_joint + ' сустава' : 'сустава с контрастным усилением'}`,
              item_details: 'Оценка связочного аппарата, менисков, хрящевого покрытия и субхондральной кости'
            }
          ]
        },
        printType: 'referral'
      });
    }

    // -------------------------------------------------------------------------
    // 2. СПРАВКИ (Certificates: Sick leave + PE release 095/у)
    // -------------------------------------------------------------------------
    docs.push({
      id: `cert_sick_leave`,
      category: 'certificates',
      title: 'Листок нетрудоспособности (больничный лист)',
      formCode: 'Форма № 347н / ЭЛН',
      subtitle: 'Освобождение от работы и выплата пособий по временной нетрудоспособности',
      date: new Date().toISOString().slice(0, 10),
      doctorName: defaultDoctorName,
      badgeText: 'Больничный лист',
      badgeColor: 'error',
      detailsSnippet: `Пациент: ${selectedPatient.fullName}. Диагноз: ${defaultDiagnosis} (${defaultMkb}). Рекомендован охранительный режим.`,
      sourceData: {
        documentNumber: `ЛН-${selectedPatient.id}-${new Date().getFullYear()}`,
        durationDays: 14,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        returnToWorkDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        patient: {
          fullName: selectedPatient.fullName,
          birthDate: selectedPatient.birthDate,
          gender: selectedPatient.gender,
          phone: selectedPatient.phone,
          cardNum: selectedPatient.cardNum
        },
        doctorName: defaultDoctorName,
        doctorSpecialty: 'Врач травматолог-ортопед',
        icd10Code: defaultMkb,
        clinicalDiagnosis: defaultDiagnosis
      },
      printType: 'sick_leave',
      requiredPermission: 'sysadmin'
    });

    docs.push({
      id: `cert_pe_release_095u`,
      category: 'certificates',
      title: 'Справка об освобождении от физкультуры (Форма 095/у)',
      formCode: 'Форма № 095/у',
      subtitle: 'Для школы, техникума, вуза, спортивной секции',
      date: new Date().toISOString().slice(0, 10),
      doctorName: defaultDoctorName,
      badgeText: 'Форма 095/у',
      badgeColor: 'success',
      detailsSnippet: 'Исключить осевые и прыжковые нагрузки, бег, сдачу спортивных нормативов. Щадящий двигательный режим.',
      sourceData: {
        documentNumber: `095-${selectedPatient.id}-${new Date().getFullYear()}`,
        issueDate: new Date().toISOString().slice(0, 10),
        patient: {
          fullName: selectedPatient.fullName,
          birthDate: selectedPatient.birthDate,
          gender: selectedPatient.gender,
          phone: selectedPatient.phone,
          cardNum: selectedPatient.cardNum
        },
        icd10Code: defaultMkb,
        clinicalDiagnosis: defaultDiagnosis,
        absenceStartDate: new Date().toISOString().slice(0, 10),
        absenceEndDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        peStartDate: new Date().toISOString().slice(0, 10),
        peEndDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        peDurationText: '1 месяц',
        peGroup: 'full_exemption',
        peSpecialRecommendations: 'Исключить осевые и прыжковые нагрузки, бег, спортивные соревнования. Рекомендована лечебная гимнастика (ЛФК).',
        returnToStudiesDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        doctorName: defaultDoctorName,
        doctorSpecialty: 'Врач травматолог-ортопед'
      },
      printType: 'pe_release'
    });

    // -------------------------------------------------------------------------
    // 3. ВЫПИСКИ (Extracts & Medical Conclusions)
    // -------------------------------------------------------------------------
    docs.push({
      id: `extract_epicrisis_${latestProtocol?.id || 'gen'}`,
      category: 'extracts',
      title: 'Выписной эпикриз из амбулаторной карты',
      formCode: 'Эпикриз / Выписка',
      subtitle: `По приёму от ${latestProtocol?.vdate ? latestProtocol.vdate.slice(0, 10) : 'текущей даты'}`,
      date: latestProtocol?.vdate ? latestProtocol.vdate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      doctorName: defaultDoctorName,
      badgeText: 'Выписка',
      badgeColor: 'primary',
      detailsSnippet: `Диагноз: ${defaultDiagnosis}. Назначено комплексное ортопедическое лечение и наблюдение.`,
      sourceData: {
        documentNumber: `ВЫП-${selectedPatient.id}-${latestProtocol?.id || 1}`,
        issueDate: latestProtocol?.vdate || new Date().toISOString().slice(0, 10),
        patient: {
          id: selectedPatient.id,
          fullName: selectedPatient.fullName,
          birthDate: selectedPatient.birthDate,
          gender: selectedPatient.gender,
          phone: selectedPatient.phone,
          cardNum: selectedPatient.cardNum,
          address: selectedPatient.address
        },
        doctorName: defaultDoctorName,
        doctorSpecialization: 'Врач травматолог-ортопед высшей категории',
        icd10Code: defaultMkb,
        icd10Name: defaultDiagnosis,
        clinicalDiagnosis: defaultDiagnosis,
        complaints: 'Болевой синдром при нагрузке, ограничение амплитуды движений, утренняя скованность до 20 минут.',
        anamnesis: cleanAnamnesis || 'Считает себя больным в течение нескольких месяцев. Наблюдается в Центре Ортопедии Добрушкина.',
        objectiveStatus: 'Ось конечности правильная. Умеренная пальпаторная болезненность по ходу суставной щели. Объем движений сохранен с умеренной крепитацией.',
        performedManipulations: 'Клиническое тестирование, ортопедический осмотр, составлен индивидуальный план реабилитации.',
        recommendations: '1. Ограничение осевых ударных нагрузок.\n2. Ношение ортопедических стелек индивидуального изготовления.\n3. Курс хондропротекторов и лечебной физкультуры (ЛФК).\n4. Контрольный осмотр через 3 месяца.',
        regimeNotes: 'Щадящий двигательный режим с исключением глубоких приседаний и подъема тяжестей.',
        nextVisitDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
      },
      printType: 'extract'
    });

    docs.push({
      id: `extract_conclusion_${latestProtocol?.id || 'doc'}`,
      category: 'extracts',
      title: 'Консультативное медицинское заключение',
      formCode: 'Форма заключения',
      subtitle: 'Экспертное ортопедическое заключение для смежных специалистов / госпитализации',
      date: new Date().toISOString().slice(0, 10),
      doctorName: defaultDoctorName,
      badgeText: 'Заключение',
      badgeColor: 'info',
      detailsSnippet: `Экспертное мнение врача травматолога-ортопеда. Клинический диагноз: ${defaultDiagnosis}.`,
      sourceData: {
        documentNumber: `ЗАК-${selectedPatient.id}-${new Date().getFullYear()}`,
        issueDate: new Date().toISOString().slice(0, 10),
        patient: {
          id: selectedPatient.id,
          fullName: selectedPatient.fullName,
          birthDate: selectedPatient.birthDate,
          gender: selectedPatient.gender,
          phone: selectedPatient.phone,
          cardNum: selectedPatient.cardNum,
          address: selectedPatient.address
        },
        doctorName: defaultDoctorName,
        doctorSpecialization: 'Врач травматолог-ортопед',
        icd10Code: defaultMkb,
        clinicalDiagnosis: `Заключение ортопеда: ${defaultDiagnosis}. Состояние субкомпенсации.`,
        recommendations: 'Показано проведение консервативного восстановительного лечения в амбулаторных условиях.'
      },
      printType: 'extract'
    });

    // -------------------------------------------------------------------------
    // 4. МЕДИЦИНСКАЯ КАРТА (Medical Card 025/у)
    // -------------------------------------------------------------------------
    docs.push({
      id: `medcard_title_${selectedPatient.id}`,
      category: 'medical_card',
      title: 'Титульный лист амбулаторной карты (Форма № 025/у)',
      formCode: 'Форма № 025/у',
      subtitle: `Паспортная часть, клинический профиль и реестр всех ${patientProtocols.length} приемов`,
      date: new Date().toISOString().slice(0, 10),
      doctorName: defaultDoctorName,
      badgeText: 'Форма 025/у',
      badgeColor: 'primary',
      detailsSnippet: `Пациент: ${selectedPatient.fullName}. Аллергии: ${clinicalProfile?.allergies || 'нет'}. Всего протоколов в базе: ${patientProtocols.length}`,
      sourceData: {
        patient: selectedPatient,
        clinicalProfile: clinicalProfile,
        protocolsHistory: patientProtocols.map(p => ({
          id: p.id,
          vdate: p.vdate,
          doctor_name: p.doctor_name,
          title: p.title,
          mkb_code: p.mkb_code,
          mkb_name: p.mkb_name,
          primary_joint: p.primary_joint,
          vas_score: p.vas_score,
          status: p.status
        })),
        totalVisitsCount: patientProtocols.length,
        doctorName: defaultDoctorName
      },
      printType: 'medical_card'
    });

    // -------------------------------------------------------------------------
    // 5. ПРОЧИЕ ДОКУМЕНТЫ (Consent 323-FZ, Patient Memo, Prescription sheet)
    // -------------------------------------------------------------------------
    docs.push({
      id: `other_consent_${selectedPatient.id}`,
      category: 'other',
      title: 'Информированное добровольное согласие (ИДС 323-ФЗ)',
      formCode: 'ИДС 323-ФЗ',
      subtitle: 'На ортопедические манипуляции, блокады, инъекции PRP / гиалуроновой кислоты',
      date: new Date().toISOString().slice(0, 10),
      doctorName: defaultDoctorName,
      badgeText: 'ИДС 323-ФЗ',
      badgeColor: 'success',
      detailsSnippet: 'Юридическое согласие пациента на проведение инъекционной терапии суставов.',
      sourceData: {
        documentNumber: `ИДС-${selectedPatient.id}-${new Date().getFullYear()}`,
        issueDate: new Date().toISOString().slice(0, 10),
        patient: {
          fullName: selectedPatient.fullName,
          birthDate: selectedPatient.birthDate,
          cardNum: selectedPatient.cardNum,
          address: selectedPatient.address,
          phone: selectedPatient.phone
        },
        doctorName: defaultDoctorName,
        interventionType: 'Внутрисуставное введение лекарственных препаратов (PRP-терапия / гиалуроновая кислота / лечебно-медикаментозная блокада)',
        targetJoint: latestProtocol?.primary_joint ? `${latestProtocol.primary_joint} сустав` : 'коленный сустав',
        targetSide: latestProtocol?.side === 'left' ? 'слева' : 'справа',
        clinicalDiagnosis: defaultDiagnosis
      },
      printType: 'consent'
    });

    docs.push({
      id: `other_memo_${selectedPatient.id}`,
      category: 'other',
      title: 'Памятка пациенту: подготовка к исследованиям и лечебный режим',
      formCode: 'Памятка пациента',
      subtitle: 'Рекомендации по подготовке к МРТ/КТ/УЗИ, двигательный режим, разгрузка суставов',
      date: new Date().toISOString().slice(0, 10),
      doctorName: defaultDoctorName,
      badgeText: 'Памятка',
      badgeColor: 'secondary',
      detailsSnippet: 'Клинические правила подготовки к МРТ/КТ и рекомендации Центра Ортопедии Добрушкина.',
      sourceData: {
        documentNumber: `ПАМ-${selectedPatient.id}`,
        issueDate: new Date().toISOString().slice(0, 10),
        patient: {
          fullName: selectedPatient.fullName,
          birthDate: selectedPatient.birthDate,
          cardNum: selectedPatient.cardNum,
          phone: selectedPatient.phone
        },
        doctorName: defaultDoctorName,
        targetJoint: latestProtocol?.primary_joint || 'Коленный сустав',
        clinicalDiagnosis: defaultDiagnosis,
        studyType: 'МРТ / КТ / УЗИ суставов',
        preparationSteps: [
          'Прибыть в клинику / диагностический центр за 15 минут до назначенного времени исследования.',
          'При себе иметь паспорт, полис (при наличии) и результаты предшествующих обследований (диски МРТ/КТ, рентгенограммы, выписки).',
          'Перед входом в зону МРТ снять все металлические предметы, часы, украшения, оставить мобильный телефон и банковские карты.',
          'При наличии металлических имплантов, клипс или эндопротезов обязательно уведомить врача-рентгенолога и предоставить паспорт изделия.'
        ],
        regimeRecommendations: [
          'Исключить ударные нагрузки на сустав (бег, прыжки, подъем тяжестей более 5 кг).',
          'Носить назначенную ортопедическую поддержку (ортез, бандаж, индивидуальные стельки) при ходьбе.',
          'Выполнять комплекс изометрической гимнастики (ЛФК) без осевой нагрузки 2 раза в день.',
          'При возникновении резкой боли или выраженного отека немедленно связаться с лечащим врачом Центра.'
        ]
      },
      printType: 'memo'
    });

    // Rapid Template: Fit to Fly (Авиаперелет)
    docs.push({
      id: `tmpl_fit_to_fly_${selectedPatient.id}`,
      category: 'certificates',
      title: 'Справка для авиаперелета (Medical Certificate / Fit to Fly)',
      formCode: 'Fit to Fly',
      subtitle: 'Медицинское заключение об отсутствии противопоказаний к перелету (двуязычная: рус/англ)',
      date: new Date().toISOString().slice(0, 10),
      doctorName: defaultDoctorName,
      badgeText: 'Авиаперелет',
      badgeColor: 'info',
      detailsSnippet: 'Заключение о перелете воздушным транспортом. Допуск на борт, правила мобильности.',
      sourceData: {
        documentNumber: `АВИА-2026-${String(selectedPatient.id).padStart(6, '0')}`,
        issueDate: new Date().toISOString().slice(0, 10),
        patient: {
          fullName: selectedPatient.fullName,
          birthDate: selectedPatient.birthDate,
          gender: selectedPatient.gender
        },
        destination: 'Авиакомпания / По месту требования',
        clinicalDiagnosis: defaultDiagnosis,
        icd10Code: defaultMkb,
        specialRequirements: 'Специальной помощи и кислорода на борту не требуется. Пациент стабилен.',
        doctorName: defaultDoctorName
      },
      printType: 'fit_to_fly'
    });

    // Rapid Template: Sports Admission 1144n
    docs.push({
      id: `tmpl_sports_${selectedPatient.id}`,
      category: 'certificates',
      title: 'Медицинское заключение о допуске к спорту / ГТО (Приказ № 1144н)',
      formCode: 'Приказ 1144н',
      subtitle: 'Заключение о допуске к тренировочным мероприятиям, соревнованиям и сдаче нормативов ГТО',
      date: new Date().toISOString().slice(0, 10),
      doctorName: defaultDoctorName,
      badgeText: 'Спорт / ГТО',
      badgeColor: 'success',
      detailsSnippet: 'Официальный бланк заключения спортивной медицины и ортопедии по Приказу МЗ РФ № 1144н.',
      sourceData: {
        documentNumber: `СПОРТ-2026-${String(selectedPatient.id).padStart(6, '0')}`,
        issueDate: new Date().toISOString().slice(0, 10),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        patient: {
          fullName: selectedPatient.fullName,
          birthDate: selectedPatient.birthDate,
          gender: selectedPatient.gender
        },
        sportDiscipline: 'Общая физическая культура / Плавание',
        sportEventStage: 'training_and_competition',
        examResultsSummary: 'ЭКГ: синусовый ритм, без нарушений реполяризации. Нагрузочные тесты отрицательные. Опорно-двигательный аппарат без острых патологий.',
        doctorName: defaultDoctorName
      },
      printType: 'sports_admission'
    });

    return docs;
  }, [selectedPatient, patientProtocols, patientReferrals, patientIssuedDocs, clinicalProfile]);

  // Compute live category counts
  const categoryCounts = useMemo(() => {
    return {
      all: allDocuments.length,
      referrals: allDocuments.filter(d => d.category === 'referrals').length,
      certificates: allDocuments.filter(d => d.category === 'certificates').length,
      extracts: allDocuments.filter(d => d.category === 'extracts').length,
      medical_card: allDocuments.filter(d => d.category === 'medical_card').length,
      other: allDocuments.filter(d => d.category === 'other').length
    };
  }, [allDocuments]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return allDocuments.filter(doc => {
      if (activeCategory !== 'all' && doc.category !== activeCategory) {
        return false;
      }
      if (fullTextFilter.trim()) {
        const q = fullTextFilter.toLowerCase().trim();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesSubtitle = doc.subtitle.toLowerCase().includes(q);
        const matchesForm = doc.formCode.toLowerCase().includes(q);
        const matchesDetails = (doc.detailsSnippet || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubtitle && !matchesForm && !matchesDetails) {
          return false;
        }
      }
      return true;
    });
  }, [allDocuments, activeCategory, fullTextFilter]);

  // Checkbox Selection
  const handleToggleDocSelect = (id: string) => {
    const doc = allDocuments.find(d => d.id === id);
    if (doc?.requiredPermission === 'sysadmin' && !isSysadmin) {
      return;
    }
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredDocuments
      .filter(d => !(d.requiredPermission === 'sysadmin' && !isSysadmin))
      .map(d => d.id);
    setSelectedDocIds(ids);
  };

  const handleClearSelection = () => {
    setSelectedDocIds([]);
  };

  // Print single document handler
  const handlePrintSingle = (doc: PatientDocItem) => {
    if (doc.requiredPermission === 'sysadmin' && !isSysadmin) {
      alert('Печать листка нетрудоспособности (больничного листа) разрешена исключительно системному администратору (sysadmin)');
      return;
    }
    setPrintDoc(doc);
    setTimeout(() => {
      triggerPrintSingle();
    }, 150);
  };

  // Batch Print handler
  const handleBatchPrint = () => {
    const selected = allDocuments
      .filter(d => selectedDocIds.includes(d.id))
      .filter(d => !(d.requiredPermission === 'sysadmin' && !isSysadmin));
    if (selected.length === 0) return;
    setBatchPrintDocs(selected);
    setTimeout(() => {
      triggerPrintBatch();
    }, 200);
  };

  // Preview Dialog handler
  const handleOpenPreview = (doc: PatientDocItem) => {
    if (doc.requiredPermission === 'sysadmin' && !isSysadmin) {
      alert('Просмотр и печать листка нетрудоспособности (больничного листа) разрешены исключительно системному администратору (sysadmin)');
      return;
    }
    setPreviewDoc(doc);
    setPreviewOpen(true);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* 1. PATIENT SELECTOR & QUICK LOOKUP */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: 2,
          border: '1.5px solid #CBD5E1',
          bgcolor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: '#0F3C64',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(15, 60, 100, 0.3)'
              }}
            >
              <FolderSharedIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                Печать документов для пациента
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Пакетная печать направлений, справок (095/у, больничные), выписок, медицинской карты (025/у) и ИДС
              </Typography>
            </Box>
          </Box>

          {selectedPatient && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => onNavigateToProtocolsTab(selectedPatient.id)}
              sx={{
                borderColor: '#0284C7',
                color: '#0284C7',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
                bgcolor: '#F0F9FF',
                '&:hover': { bgcolor: '#E0F2FE', borderColor: '#0369A1' }
              }}
            >
              ← К приёмам в АРМ (Таб 1)
            </Button>
          )}
        </Box>

        {/* Autocomplete Patient Search */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 1.5, alignItems: 'center' }}>
          <Autocomplete
            options={patientSearchOptions}
            getOptionLabel={(option) => `${option.fullName} • ДР: ${option.birthDate ? option.birthDate.slice(0, 10) : '—'} • Карта: #${option.cardNum || option.id} • Тел: ${option.phone || '—'}`}
            filterOptions={(x) => x}
            onInputChange={(_, value) => {
              handleSearchPatients(value);
            }}
            onChange={(_, val) => {
              if (val) {
                loadPatientData(val.id);
              }
            }}
            loading={searchLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Поиск пациента для печати документов (ФИО, № амбулаторной карты, телефон, ID)..."
              />
            )}
          />

          {selectedPatient && (
            <Button
              variant="contained"
              size="small"
              startIcon={<NoteAddIcon />}
              onClick={() => {
                if (onOpenIssueReferralModal) {
                  onOpenIssueReferralModal(selectedPatient, patientProtocols[0] || null);
                }
              }}
              sx={{
                bgcolor: '#0F3C64',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                height: 40,
                px: 2,
                borderRadius: 2,
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#0284C7' }
              }}
            >
              Оформить направление / справку
            </Button>
          )}
        </Box>
      </Paper>

      {/* 2. PATIENT INFO BANNER (IF SELECTED) */}
      {selectedPatient ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 2,
            bgcolor: '#F8FAFC',
            border: '1.5px solid #BAE6FD',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#0284C7',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)'
                }}
              >
                {selectedPatient.fullName ? selectedPatient.fullName[0].toUpperCase() : 'П'}
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F3C64', lineHeight: 1.2 }}>
                    {selectedPatient.fullName}
                  </Typography>
                  <Chip
                    label={`Карта: #${selectedPatient.cardNum || selectedPatient.id}`}
                    size="small"
                    sx={{ bgcolor: '#0F3C64', color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem' }}
                  />
                  {selectedPatient.age && (
                    <Chip
                      label={`${selectedPatient.age} лет`}
                      size="small"
                      sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  )}
                  {selectedPatient.gender && (
                    <Chip
                      label={selectedPatient.gender === 'm' || selectedPatient.gender === 'М' ? 'Мужской' : 'Женский'}
                      size="small"
                      sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3 }}>
                  ДР: {selectedPatient.birthDate ? selectedPatient.birthDate.slice(0, 10) : '—'} • Телефон: {selectedPatient.phone || '—'}
                  {selectedPatient.dmsInsurer ? ` • ДМС: ${selectedPatient.dmsInsurer}` : ''}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<NoteAddIcon sx={{ fontSize: '16px !important' }} />}
                onClick={() => setIssueModalOpen(true)}
                sx={{
                  bgcolor: '#0284C7',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  textTransform: 'none',
                  borderRadius: 1.5,
                  px: 2,
                  '&:hover': { bgcolor: '#0369A1' }
                }}
              >
                Оформить документ +
              </Button>

              <Tooltip title="Перейти к списку приёмов и протоколов данного пациента в АРМ Врача (Таб 1)">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MedicalServicesIcon sx={{ fontSize: '16px !important' }} />}
                  onClick={() => onNavigateToProtocolsTab(selectedPatient.id)}
                  sx={{
                    color: '#0F3C64',
                    borderColor: '#CBD5E1',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 1.5,
                    px: 1.8,
                    '&:hover': { bgcolor: '#F1F5F9' }
                  }}
                >
                  Все приёмы пациента ({patientProtocols.length}) →
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
          Выберите пациента через поиск выше или перейдите из строки протокола в Табе 1 для формирования и пакетной печати документов.
        </Alert>
      )}

      {/* 3. QUICK FILTER WITH LIVE COUNTS BY DOCUMENT TYPE */}
      {selectedPatient && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2.5,
            borderRadius: 2,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          {/* Category Chips with Counts */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', mr: 0.5 }}>
              Тип документа:
            </Typography>

            <Chip
              label={`Все документы (${categoryCounts.all})`}
              clickable
              onClick={() => setActiveCategory('all')}
              color={activeCategory === 'all' ? 'primary' : 'default'}
              variant={activeCategory === 'all' ? 'filled' : 'outlined'}
              icon={<FolderSharedIcon sx={{ fontSize: '15px !important' }} />}
              sx={{ fontWeight: 800, borderRadius: 2 }}
            />

            <Chip
              label={`Направления (${categoryCounts.referrals})`}
              clickable
              onClick={() => setActiveCategory('referrals')}
              color={activeCategory === 'referrals' ? 'primary' : 'default'}
              variant={activeCategory === 'referrals' ? 'filled' : 'outlined'}
              icon={<AssignmentIcon sx={{ fontSize: '15px !important' }} />}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />

            <Chip
              label={`Справки (${categoryCounts.certificates})`}
              clickable
              onClick={() => setActiveCategory('certificates')}
              color={activeCategory === 'certificates' ? 'primary' : 'default'}
              variant={activeCategory === 'certificates' ? 'filled' : 'outlined'}
              icon={<ArticleIcon sx={{ fontSize: '15px !important' }} />}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />

            <Chip
              label={`Выписки (${categoryCounts.extracts})`}
              clickable
              onClick={() => setActiveCategory('extracts')}
              color={activeCategory === 'extracts' ? 'primary' : 'default'}
              variant={activeCategory === 'extracts' ? 'filled' : 'outlined'}
              icon={<NoteAltIcon sx={{ fontSize: '15px !important' }} />}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />

            <Chip
              label={`Медицинская карта (${categoryCounts.medical_card})`}
              clickable
              onClick={() => setActiveCategory('medical_card')}
              color={activeCategory === 'medical_card' ? 'primary' : 'default'}
              variant={activeCategory === 'medical_card' ? 'filled' : 'outlined'}
              icon={<BadgeIcon sx={{ fontSize: '15px !important' }} />}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />

            <Chip
              label={`Прочие документы (${categoryCounts.other})`}
              clickable
              onClick={() => setActiveCategory('other')}
              color={activeCategory === 'other' ? 'primary' : 'default'}
              variant={activeCategory === 'other' ? 'filled' : 'outlined'}
              icon={<VerifiedUserIcon sx={{ fontSize: '15px !important' }} />}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />
          </Box>

          {/* Search inside documents & Batch print button */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
            <TextField
              size="small"
              placeholder="Поиск по документам..."
              value={fullTextFilter}
              onChange={(e) => setFullTextFilter(e.target.value)}
              sx={{ width: 220 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#64748B' }} />
                    </InputAdornment>
                  )
                }
              }}
            />

            {selectedDocIds.length > 0 && (
              <Button
                variant="contained"
                size="small"
                startIcon={<PrintIcon />}
                onClick={handleBatchPrint}
                sx={{
                  bgcolor: '#16A34A',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                  '&:hover': { bgcolor: '#15803D' }
                }}
              >
                Пакетная печать ({selectedDocIds.length})
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* 4. DOCUMENT LIST / GROUPED CARDS */}
      {selectedPatient && (
        <Box sx={{ mb: 3 }}>
          {/* Top selection bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
              Доступно документов: <b>{filteredDocuments.length}</b>
              {selectedDocIds.length > 0 && (
                <span style={{ color: '#16A34A', marginLeft: 8 }}>
                  • Выбрано для пакетной печати: <b>{selectedDocIds.length}</b>
                </span>
              )}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={handleSelectAllFiltered} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Выбрать все
              </Button>
              {selectedDocIds.length > 0 && (
                <Button size="small" onClick={handleClearSelection} color="secondary" sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Снять выбор
                </Button>
              )}
            </Box>
          </Box>

          {loadingContext ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={36} sx={{ color: '#0F3C64' }} />
            </Box>
          ) : filteredDocuments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 600 }}>
                Документы по выбранным критериям не найдены
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
              {filteredDocuments.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                const isRestricted = doc.requiredPermission === 'sysadmin' && !isSysadmin;
                return (
                  <Box key={doc.id} sx={{ height: '100%' }}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        borderColor: isSelected ? '#0284C7' : isRestricted ? '#FECACA' : '#E2E8F0',
                        bgcolor: isSelected ? '#F0F9FF' : isRestricted ? '#FFF5F5' : '#FFFFFF',
                        boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: isRestricted ? '#F87171' : '#0284C7',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                        }
                      }}
                    >
                      <CardContent sx={{ flex: '1 0 auto', pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title={isRestricted ? 'Печать разрешена только системному администратору (sysadmin)' : ''}>
                              <span>
                                <Checkbox
                                  checked={isSelected}
                                  disabled={isRestricted}
                                  onChange={() => handleToggleDocSelect(doc.id)}
                                  size="small"
                                  sx={{ p: 0.5, color: '#0F3C64' }}
                                />
                              </span>
                            </Tooltip>
                            {isRestricted ? (
                              <Tooltip title="Печать справки о временной нетрудоспособности разрешена исключительно системному администратору (sysadmin)">
                                <Chip
                                  icon={<LockIcon sx={{ fontSize: '13px !important', color: '#DC2626 !important' }} />}
                                  label="Только sysadmin"
                                  size="small"
                                  sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22, bgcolor: '#FEE2E2', color: '#DC2626' }}
                                />
                              </Tooltip>
                            ) : (
                              <Chip
                                label={doc.formCode}
                                size="small"
                                color={doc.badgeColor}
                                sx={{ fontWeight: 800, fontSize: '0.72rem', height: 22 }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                            {doc.date}
                          </Typography>
                        </Box>

                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isRestricted ? '#64748B' : '#0F3C64', lineHeight: 1.3, mb: 0.5 }}>
                          {doc.title}
                        </Typography>

                        <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 1, fontWeight: 600 }}>
                          {doc.subtitle}
                        </Typography>

                        {doc.detailsSnippet && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#64748B',
                              fontSize: '0.8rem',
                              lineHeight: 1.4,
                              bgcolor: isSelected ? '#E0F2FE' : '#F8FAFC',
                              p: 1,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: isSelected ? '#BAE6FD' : '#E2E8F0'
                            }}
                          >
                            {doc.detailsSnippet}
                          </Typography>
                        )}
                      </CardContent>

                      <Divider sx={{ borderColor: '#F1F5F9' }} />

                      <CardActions sx={{ p: 1.5, justifyContent: 'space-between', bgcolor: isSelected ? '#F0F9FF' : '#FAFBFD' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title={isRestricted ? 'Просмотр разрешен только системному администратору (sysadmin)' : 'Быстрый предварительный просмотр документа'}>
                            <span>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={isRestricted}
                                startIcon={<VisibilityIcon sx={{ fontSize: '15px !important' }} />}
                                onClick={() => handleOpenPreview(doc)}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  color: '#0F3C64',
                                  borderColor: '#CBD5E1',
                                  bgcolor: '#FFFFFF'
                                }}
                              >
                                Просмотр
                              </Button>
                            </span>
                          </Tooltip>

                          {doc.category === 'referrals' && (
                            <Tooltip title="Экспорт направления в файл Microsoft Word (.docx)">
                              <IconButton
                                size="small"
                                onClick={() => exportReferralToDocx(doc.sourceData)}
                                sx={{ color: '#0284C7', border: '1px solid #CBD5E1', bgcolor: '#FFFFFF' }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>

                        <Tooltip title={isRestricted ? 'Печать разрешена только системному администратору (sysadmin)' : 'Печать A4'}>
                          <span>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={isRestricted}
                              startIcon={<PrintIcon sx={{ fontSize: '15px !important' }} />}
                              onClick={() => handlePrintSingle(doc)}
                              sx={{
                                bgcolor: '#0F3C64',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                px: 1.5,
                                borderRadius: 1.5,
                                '&:hover': { bgcolor: '#0284C7' }
                              }}
                            >
                              Печать A4
                            </Button>
                          </span>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* 5. PREVIEW MODAL */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 2.5, overflow: 'hidden' } }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#0F3C64', color: '#FFFFFF', py: 1.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon sx={{ fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
              Предварительный просмотр: {previewDoc?.title}
            </Typography>
          </Box>
          <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: '#FFFFFF' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2, bgcolor: '#F8FAFC' }}>
          {previewDoc && (
            <Paper elevation={2} sx={{ p: 3, bgcolor: '#FFFFFF', maxWidth: '800px', margin: '0 auto', borderRadius: 1.5 }}>
              {previewDoc.printType === 'referral' && <OrthoReferralPrintTemplate data={previewDoc.sourceData} />}
              {previewDoc.printType === 'sick_leave' && <SickLeavePrintTemplate data={previewDoc.sourceData} />}
              {previewDoc.printType === 'pe_release' && <PeReleasePrintTemplate data={previewDoc.sourceData} />}
              {previewDoc.printType === 'fit_to_fly' && <FitToFlyPrintTemplate data={previewDoc.sourceData} />}
              {previewDoc.printType === 'sports_admission' && <SportsAdmissionPrintTemplate data={previewDoc.sourceData} />}
              {previewDoc.printType === 'extract' && <PatientExtractPrintTemplate data={previewDoc.sourceData} />}
              {previewDoc.printType === 'medical_card' && <PatientMedicalCardPrintTemplate data={previewDoc.sourceData} />}
              {previewDoc.printType === 'consent' && <PatientConsentPrintTemplate data={previewDoc.sourceData} />}
              {previewDoc.printType === 'memo' && <PatientMemoPrintTemplate data={previewDoc.sourceData} />}
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#FFFFFF' }}>
          <Button onClick={() => setPreviewOpen(false)} sx={{ color: '#64748B', fontWeight: 600 }}>
            Закрыть
          </Button>
          {previewDoc && (
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => {
                setPreviewOpen(false);
                handlePrintSingle(previewDoc);
              }}
              sx={{ bgcolor: '#0F3C64', fontWeight: 800, px: 2.5 }}
            >
              Распечатать на принтере (A4)
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 6. HIDDEN CONTAINERS FOR REACT-TO-PRINT (Strict per report-generation skill) */}
      <Box sx={{ display: 'none' }}>
        {/* Single Print Container */}
        <div ref={printSingleRef}>
          {printDoc && (
            <>
              {printDoc.printType === 'referral' && <OrthoReferralPrintTemplate data={printDoc.sourceData} />}
              {printDoc.printType === 'sick_leave' && <SickLeavePrintTemplate data={printDoc.sourceData} />}
              {printDoc.printType === 'pe_release' && <PeReleasePrintTemplate data={printDoc.sourceData} />}
              {printDoc.printType === 'fit_to_fly' && <FitToFlyPrintTemplate data={printDoc.sourceData} />}
              {printDoc.printType === 'sports_admission' && <SportsAdmissionPrintTemplate data={printDoc.sourceData} />}
              {printDoc.printType === 'extract' && <PatientExtractPrintTemplate data={printDoc.sourceData} />}
              {printDoc.printType === 'medical_card' && <PatientMedicalCardPrintTemplate data={printDoc.sourceData} />}
              {printDoc.printType === 'consent' && <PatientConsentPrintTemplate data={printDoc.sourceData} />}
              {printDoc.printType === 'memo' && <PatientMemoPrintTemplate data={printDoc.sourceData} />}
            </>
          )}
        </div>

        {/* Batch Print Container */}
        <div ref={printBatchRef}>
          {batchPrintDocs.map((doc, idx) => (
            <Box
              key={doc.id}
              className="page-break"
              sx={{
                pageBreakAfter: idx < batchPrintDocs.length - 1 ? 'always !important' : 'auto',
                breakAfter: idx < batchPrintDocs.length - 1 ? 'page !important' : 'auto'
              }}
            >
              {doc.printType === 'referral' && <OrthoReferralPrintTemplate data={doc.sourceData} />}
              {doc.printType === 'sick_leave' && <SickLeavePrintTemplate data={doc.sourceData} />}
              {doc.printType === 'pe_release' && <PeReleasePrintTemplate data={doc.sourceData} />}
              {doc.printType === 'fit_to_fly' && <FitToFlyPrintTemplate data={doc.sourceData} />}
              {doc.printType === 'sports_admission' && <SportsAdmissionPrintTemplate data={doc.sourceData} />}
              {doc.printType === 'extract' && <PatientExtractPrintTemplate data={doc.sourceData} />}
              {doc.printType === 'medical_card' && <PatientMedicalCardPrintTemplate data={doc.sourceData} />}
              {doc.printType === 'consent' && <PatientConsentPrintTemplate data={doc.sourceData} />}
              {doc.printType === 'memo' && <PatientMemoPrintTemplate data={doc.sourceData} />}
            </Box>
          ))}
        </div>
      </Box>

      {/* 7. MODAL FOR DOCUMENT ISSUANCE WITH FORMAL REGISTRATION & STRONG NUMBERING */}
      <IssuePatientDocumentModal
        open={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        patientId={selectedPatient ? selectedPatient.id : null}
        patientName={selectedPatient ? selectedPatient.fullName : ''}
        patientData={selectedPatient}
        protocolId={patientProtocols[0]?.id || null}
        appointmentId={patientProtocols[0]?.appointment_id || null}
        defaultDiagnosis={patientProtocols[0]?.mkb_name || patientProtocols[0]?.title || 'Первичный гонартроз двусторонний'}
        defaultIcd10={patientProtocols[0]?.mkb_code || 'M17.1'}
        doctorName={patientProtocols[0]?.doctor_name || 'Добрушкин А.М.'}
        onDocumentIssued={() => {
          if (selectedPatient) {
            loadPatientData(selectedPatient.id);
          }
        }}
      />
    </Box>
  );
}
