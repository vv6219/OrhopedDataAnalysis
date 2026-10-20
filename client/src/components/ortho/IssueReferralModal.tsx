import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Grid,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BusinessIcon from '@mui/icons-material/Business';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArticleIcon from '@mui/icons-material/Article';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useReactToPrint } from 'react-to-print';

import OrthoReferralPrintTemplate from '../reports/OrthoReferralPrintTemplate';
import type { OrthoReferralData } from '../reports/OrthoReferralPrintTemplate';
import SickLeavePrintTemplate, { type SickLeaveData } from '../reports/SickLeavePrintTemplate';
import PeReleasePrintTemplate, { type PeReleaseData } from '../reports/PeReleasePrintTemplate';
import { exportReferralToDocx } from '../../utils/referralDocxExport';
import LatexText from './LatexText';
import { resolveClinicalProtocolText, resolveItemPreparation } from '../../utils/clinicalProtocolResolver';
import { COMMON_PRINT_PAGE_STYLE } from '../../utils/printStyles';

interface Performer {
  id: number;
  name: string;
  is_internal: number | boolean;
  category: string;
  address?: string;
  contact_phone?: string;
  description?: string;
}

interface IssueReferralModalProps {
  open: boolean;
  onClose: () => void;
  patient: {
    id?: number;
    fullName: string;
    birthDate?: string;
    gender?: string;
    phone?: string;
    cardNum?: string;
  } | null;
  protocolId?: number | null;
  appointmentId?: string | number | null;
  doctorName?: string;
  defaultMkbCode?: string;
  defaultDiagnosis?: string;
  targetJoint?: string;
  targetSide?: string;
  anamnesisSummary?: string;
  availablePrescriptions?: any[];
  activeDiagnostics?: any[];
  onReferralIssued?: (referral: any) => void;
}

export default function IssueReferralModal({
  open,
  onClose,
  patient,
  protocolId,
  appointmentId,
  doctorName = 'Добрушкин А.М',
  defaultMkbCode = '',
  defaultDiagnosis = '',
  targetJoint = '',
  targetSide = '',
  anamnesisSummary = '',
  availablePrescriptions = [],
  activeDiagnostics = [],
  onReferralIssued
}: IssueReferralModalProps) {
  const [loadingPerformers, setLoadingPerformers] = useState(false);
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [selectedPerformerId, setSelectedPerformerId] = useState<number | string>('');
  const [customPerformerName, setCustomPerformerName] = useState('');
  
  // Validity days (defaults to 90 days per strict clinical requirement)
  const [validDays, setValidDays] = useState<number>(90);
  
  // Diagnosis & Justification
  const [icd10Code, setIcd10Code] = useState(defaultMkbCode);
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState(defaultDiagnosis);
  const [jointZone, setJointZone] = useState(targetJoint);
  const [jointSide, setJointSide] = useState(targetSide);
  const [justification, setJustification] = useState(anamnesisSummary);
  const [specialNotes, setSpecialNotes] = useState('');

  // Items selection state
  interface SelectableItem {
    id: string;
    domain: string;
    service_code?: string;
    item_title: string;
    item_details?: string;
    formula_latex?: string;
    preparation_notes?: string;
    selected: boolean;
  }

  const [items, setItems] = useState<SelectableItem[]>([]);
  const [isAddingCustomItem, setIsAddingCustomItem] = useState(false);
  const [customItemTitle, setCustomItemTitle] = useState('');
  const [customItemDomain, setCustomItemDomain] = useState('diagnostics');
  const [customItemDetails, setCustomItemDetails] = useState('');

  // Status & processing
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Output Mode: separate document per item vs combined single document
  const [outputMode, setOutputMode] = useState<'separate' | 'combined'>('separate');

  // Additional Printable Documents list (extensible architecture)
  interface AdditionalPrintableDoc {
    id: string;
    title: string;
    formCode: string;
    description: string;
    selected: boolean;
    category: 'disability' | 'certificate' | 'extract';
    data: any;
  }

  const generateSickLeaveNum = () => {
    const p1 = String(Math.floor(100 + Math.random() * 900));
    const p2 = String(Math.floor(100 + Math.random() * 900));
    const p3 = String(Math.floor(100 + Math.random() * 900));
    return `001 ${p1} ${p2} ${p3}`;
  };

  const generateForm095Num = () => {
    const year = new Date().getFullYear();
    const num = String(Math.floor(100 + Math.random() * 900));
    return `095-${year}-${num}`;
  };

  const getFutureDateStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const [additionalDocs, setAdditionalDocs] = useState<AdditionalPrintableDoc[]>([
    {
      id: 'sick_leave',
      title: 'Листок нетрудоспособности (больничный лист)',
      formCode: 'Форма № 347н / ЭЛН',
      description: 'Медицинское учреждение выдает листок нетрудоспособности работнику при временной нетрудоспособности. Документ подтверждает право на получение пособия по нетрудоспособности. Листок нетрудоспособности используется работодателем для расчета и выплаты пособия.',
      selected: false,
      category: 'disability',
      data: {
        reasonCode: '02',
        reasonTitle: 'Травма (ортопедия / травматология)',
        employerName: '',
        workType: 'main',
        durationDays: 14,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: getFutureDateStr(14),
        returnToWorkDate: getFutureDateStr(15),
        documentNumber: generateSickLeaveNum(),
        isDuplicate: false
      }
    },
    {
      id: 'pe_release_095u',
      title: 'Справка об освобождении от физкультуры',
      formCode: 'Форма № 095/у',
      description: 'Справка о временной нетрудоспособности студента, учащегося техникума, училища, о болезни ребенка, посещающего школу, детское дошкольное учреждение по форме 095/у, утвержденной приказом Минздрава СССР от 04.10.80 № 1030 «Об утверждении форм первичной медицинской документации учреждений здравоохранения». Срок освобождения от физкультуры вводится врачом либо оставляется пустым полем для заполнения от руки.',
      selected: false,
      category: 'certificate',
      data: {
        documentNumber: generateForm095Num(),
        institutionName: '',
        absenceStartDate: new Date().toISOString().slice(0, 10),
        absenceEndDate: getFutureDateStr(14),
        leavePeriodBlank: false, // "срок освобождения вводит врач либо оставляется пустым полем для заполнения от руки"
        peStartDate: new Date().toISOString().slice(0, 10),
        peEndDate: getFutureDateStr(30),
        peDurationPreset: '1_month',
        peDurationText: '1 месяц',
        peGroup: 'full_exemption',
        hideDiagnosis: false,
        peSpecialRecommendations: 'Исключить осевые и прыжковые нагрузки, бег, сдачу спортивных нормативов. Рекомендован щадящий двигательный режим.',
        returnToStudiesDate: getFutureDateStr(15)
      }
    }
  ]);

  const [expandedDocIds, setExpandedDocIds] = useState<Record<string, boolean>>({ sick_leave: true, pe_release_095u: true });

  const handleToggleAdditionalDoc = (id: string) => {
    setAdditionalDocs(prev => prev.map(doc => {
      if (doc.id === id) {
        const nextSelected = !doc.selected;
        if (nextSelected) {
          setExpandedDocIds(exp => ({ ...exp, [id]: true }));
        }
        return { ...doc, selected: nextSelected };
      }
      return doc;
    }));
  };

  const handleUpdateAdditionalDocData = (id: string, updates: Partial<any>) => {
    setAdditionalDocs(prev => prev.map(doc => {
      if (doc.id === id) {
        return { ...doc, data: { ...doc.data, ...updates } };
      }
      return doc;
    }));
  };

  const handleSelectAllAdditionalDocs = () => {
    setAdditionalDocs(prev => prev.map(doc => ({ ...doc, selected: true })));
  };

  const handleDeselectAllAdditionalDocs = () => {
    setAdditionalDocs(prev => prev.map(doc => ({ ...doc, selected: false })));
  };

  // Print template hidden state & ref
  const printComponentRef = useRef<HTMLDivElement>(null);
  const [printDataList, setPrintDataList] = useState<OrthoReferralData[]>([]);
  const [pendingPrintTrigger, setPendingPrintTrigger] = useState<number | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: (() => {
      const pName = patient?.fullName || 'Пациент';
      const refCount = printDataList.length;
      const addCount = additionalDocs.filter(d => d.selected).length;
      const hasSickLeave = additionalDocs.some(d => d.id === 'sick_leave' && d.selected);
      const hasPeRelease = additionalDocs.some(d => d.id === 'pe_release_095u' && d.selected);

      if (refCount > 0 && addCount > 0) return `Документы_${pName}_${refCount}_направлений_и_справки`;
      if (refCount === 1) return `Направление_${printDataList[0]?.referral_number || ''}_${pName}`;
      if (refCount > 1) return `Направления_${pName}_${refCount}_бланков`;
      if (hasSickLeave && hasPeRelease) return `Больничный_и_справка_095у_${pName}`;
      if (hasPeRelease) return `Справка_095у_освобождение_от_физкультуры_${pName}`;
      if (hasSickLeave) return `Листок_нетрудоспособности_${pName}`;
      return `Документы_${pName}`;
    })(),
    pageStyle: COMMON_PRINT_PAGE_STYLE
  });

  // Trigger print after state updates with printDataList or additional documents
  useEffect(() => {
    const hasReferralsToPrint = printDataList.length > 0;
    const hasAdditionalToPrint = additionalDocs.some(d => d.selected);
    if ((hasReferralsToPrint || hasAdditionalToPrint) && pendingPrintTrigger) {
      handlePrint();
      setPendingPrintTrigger(null);
    }
  }, [printDataList, additionalDocs, pendingPrintTrigger, handlePrint]);

  // Load Performers from DB on open
  useEffect(() => {
    if (open) {
      setIcd10Code(typeof defaultMkbCode === 'string' ? defaultMkbCode : (defaultMkbCode ? String(defaultMkbCode) : ''));
      setClinicalDiagnosis(typeof defaultDiagnosis === 'string' ? defaultDiagnosis : (defaultDiagnosis ? String(defaultDiagnosis) : ''));
      setJointZone(typeof targetJoint === 'string' ? targetJoint : (targetJoint ? String(targetJoint) : ''));
      setJointSide(typeof targetSide === 'string' ? targetSide : (targetSide ? String(targetSide) : ''));
      setJustification(typeof anamnesisSummary === 'string' ? anamnesisSummary : (anamnesisSummary ? String(anamnesisSummary) : ''));
      setErrorMessage(null);
      setSuccessMessage(null);

      // On load start with additional documents (e.g. Form 095/u, sick leave) unchecked
      setAdditionalDocs(prev => prev.map(doc => ({ ...doc, selected: false })));

      // Load DB Performers
      setLoadingPerformers(true);
      fetch('/api/ortho/referrals/performers')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.performers)) {
            setPerformers(data.performers);
            // Default to internal procedure room if available
            const defaultPerf = data.performers.find((p: Performer) => p.is_internal) || data.performers[0];
            if (defaultPerf) {
              setSelectedPerformerId(defaultPerf.id);
            }
          }
        })
        .catch(err => {
          console.error('Failed to load performers:', err);
          setErrorMessage('Не удалось загрузить реестр исполнителей из базы данных');
        })
        .finally(() => setLoadingPerformers(false));

      // Build selectable items list from workstation prescriptions and diagnostics
      const initialItems: SelectableItem[] = [];

      // 1. Diagnostics from active template
      activeDiagnostics.forEach((diag, idx) => {
        const rawDiagDetails = (typeof diag.clinical_objective === 'string' && diag.clinical_objective.trim())
          ? diag.clinical_objective.trim()
          : (typeof diag.target_anatomical_zone === 'string' && diag.target_anatomical_zone.trim()
              ? diag.target_anatomical_zone.trim()
              : '');

        const diagTitle = typeof diag.method_name === 'string' ? diag.method_name : (typeof diag.name === 'string' ? diag.name : 'Диагностическое исследование');
        const sCode = typeof diag.method_code === 'string' ? diag.method_code : (typeof diag.code === 'string' ? diag.code : '');

        const prepNotes = resolveItemPreparation({
          item_title: diagTitle,
          service_code: sCode,
          domain: 'diagnostics',
          patient_preparation: typeof diag.patient_preparation === 'string' ? diag.patient_preparation : ''
        });

        const diagDetails = resolveClinicalProtocolText({
          item_title: diagTitle,
          service_code: sCode,
          domain: 'diagnostics',
          item_details: rawDiagDetails,
          regimen_standard: diag.protocol_phrase,
          technique_details: diag.technique_details,
          description: diag.description,
          patient_preparation: prepNotes
        }, {
          targetJoint,
          targetSide,
          diagnosis: defaultDiagnosis
        });

        initialItems.push({
          id: `diag_${diag.id || idx}`,
          domain: 'diagnostics',
          service_code: sCode,
          item_title: diagTitle,
          item_details: diagDetails,
          preparation_notes: prepNotes,
          selected: false
        });
      });

      // 2. Prescriptions from recommendations
      availablePrescriptions.forEach((presc, idx) => {
        let domain = 'manipulation';
        if (presc.category === 'lfk') domain = 'lfk';
        else if (presc.category === 'physio') domain = 'physio';
        else if (presc.category === 'orthotics') domain = 'orthotics';
        else if (presc.category === 'surgery') domain = 'surgery';
        else if (presc.category === 'diagnostic') domain = 'diagnostics';

        let rawPrescDetails = '';
        if (typeof presc.dosage_notes === 'string' && presc.dosage_notes.trim()) {
          rawPrescDetails = presc.dosage_notes.trim();
        } else if (typeof presc.details === 'string' && presc.details.trim()) {
          rawPrescDetails = presc.details.trim();
        } else if (presc.details && typeof presc.details === 'object') {
          if (typeof presc.details.notes === 'string') rawPrescDetails = presc.details.notes;
          else if (typeof presc.details.text === 'string') rawPrescDetails = presc.details.text;
          else if (typeof presc.details.protocol === 'string') rawPrescDetails = presc.details.protocol;
        }

        const prescTitle = typeof presc.name === 'string' ? presc.name : (typeof presc.title === 'string' ? presc.title : 'Медицинская процедура');
        const prescCode = typeof presc.code === 'string' ? presc.code : (typeof presc.serviceCode === 'string' ? presc.serviceCode : (typeof presc.service_code === 'string' ? presc.service_code : ''));
        const prescFormula = typeof presc.formula_latex === 'string' ? presc.formula_latex : '';
        const rawPrescPrep = typeof presc.preparation_notes === 'string' ? presc.preparation_notes : '';
        const prescPrep = resolveItemPreparation({
          item_title: prescTitle,
          service_code: prescCode,
          domain: domain,
          patient_preparation: rawPrescPrep
        });

        const prescDetails = resolveClinicalProtocolText({
          item_title: prescTitle,
          service_code: prescCode,
          domain: domain,
          item_details: rawPrescDetails,
          regimen_standard: presc.regimen_standard,
          technique_details: presc.technique_details,
          description: presc.description,
          patient_preparation: prescPrep
        }, {
          targetJoint,
          targetSide,
          diagnosis: defaultDiagnosis
        });

        initialItems.push({
          id: `presc_${presc.id || idx}`,
          domain: domain,
          service_code: prescCode,
          item_title: prescTitle,
          item_details: prescDetails,
          formula_latex: prescFormula,
          preparation_notes: prescPrep,
          selected: false
        });
      });

      setItems(initialItems);
    }
  }, [open, defaultMkbCode, defaultDiagnosis, targetJoint, targetSide, anamnesisSummary, availablePrescriptions, activeDiagnostics]);

  const selectedPerformer = performers.find(p => p.id === Number(selectedPerformerId));
  const isInternalPerformer = selectedPerformer ? Boolean(Number(selectedPerformer.is_internal) === 1) : false;

  // Toggle item selection
  const handleToggleItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  // Select all items
  const handleSelectAllItems = () => {
    setItems(prev => prev.map(item => ({ ...item, selected: true })));
  };

  // Deselect all items
  const handleDeselectAllItems = () => {
    setItems(prev => prev.map(item => ({ ...item, selected: false })));
  };

  // Toggle master select/deselect
  const handleToggleSelectAll = () => {
    if (items.length > 0 && selectedCount === items.length) {
      handleDeselectAllItems();
    } else {
      handleSelectAllItems();
    }
  };

  // Add custom item
  const handleAddCustomItem = () => {
    if (!customItemTitle.trim()) return;
    const resolvedDetails = customItemDetails.trim() || resolveClinicalProtocolText({
      item_title: customItemTitle.trim(),
      domain: customItemDomain
    }, {
      targetJoint,
      targetSide,
      diagnosis: clinicalDiagnosis
    });

    const newItem: SelectableItem = {
      id: `custom_${Date.now()}`,
      domain: customItemDomain,
      item_title: customItemTitle.trim(),
      item_details: resolvedDetails,
      selected: true
    };
    setItems(prev => [...prev, newItem]);
    setCustomItemTitle('');
    setCustomItemDetails('');
    setIsAddingCustomItem(false);
  };

  // Expiry date calculation
  const calculateExpiryDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + (days || 90));
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Submit and Issue Referral
  const issueReferral = async (action: 'print' | 'docx' | 'save'): Promise<OrthoReferralData | null> => {
    if (!patient || !patient.fullName) {
      setErrorMessage('Не выбран пациент для выписки направления');
      return null;
    }

    const selectedItems = items.filter(it => it.selected);
    const selectedAdditional = additionalDocs.filter(it => it.selected);

    // If only additional documents are selected (no referral items) and user clicked print:
    if (selectedItems.length === 0 && selectedAdditional.length > 0) {
      if (action === 'print') {
        setPendingPrintTrigger(Date.now());
        setSuccessMessage(`Сформировано для печати: ${selectedAdditional.map(d => d.title).join(', ')}`);
        return null;
      }
    }

    if (selectedItems.length === 0) {
      setErrorMessage('Выберите хотя бы одну процедуру, операцию или исследование для включения в направление');
      return null;
    }

    if (!selectedPerformer && !customPerformerName.trim()) {
      setErrorMessage('Укажите исполнителя (подразделение Центра или внешнюю медицинскую организацию)');
      return null;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const isSeparate = outputMode === 'separate';
      const payload = {
        patient_id: patient.id || null,
        appointment_id: appointmentId || null,
        protocol_id: protocolId || null,
        performer_id: selectedPerformer ? selectedPerformer.id : null,
        custom_performer_name: selectedPerformer ? undefined : customPerformerName.trim(),
        doctor_name: doctorName || 'Добрушкин А.М', // Strict clinical requirement
        icd10_code: icd10Code || 'M19.9',
        icd10_name: clinicalDiagnosis || 'Ортопедическая патология',
        clinical_diagnosis: clinicalDiagnosis || 'Ортопедическая патология',
        target_joint: jointZone || undefined,
        target_side: jointSide || undefined,
        anamnesis_summary: justification || undefined,
        special_notes: specialNotes || undefined,
        valid_days: validDays || 90,
        separate_documents: isSeparate,
        items: selectedItems.map(it => ({
          domain: it.domain,
          service_code: typeof it.service_code === 'string' ? it.service_code : '',
          item_title: typeof it.item_title === 'string' ? it.item_title : '',
          item_details: typeof it.item_details === 'string' ? it.item_details : '',
          formula_latex: typeof it.formula_latex === 'string' ? it.formula_latex : '',
          preparation_notes: typeof it.preparation_notes === 'string' ? it.preparation_notes : ''
        }))
      };

      const res = await fetch('/api/ortho/referrals/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Ошибка при выписке направления');
      }

      const rawList: any[] = (resData.referrals && resData.referrals.length > 0)
        ? resData.referrals
        : [resData.referral];

      const completedList: OrthoReferralData[] = rawList.map(ref => ({
        id: ref.id,
        referral_number: ref.referral_number,
        issue_date: ref.issue_date,
        valid_days: ref.valid_days,
        expires_at: ref.expires_at,
        doctor_name: 'Добрушкин А.М',
        performer_id: ref.performer_id,
        performer_name: ref.performer_name,
        performer_is_internal: ref.performer_is_internal,
        performer_address: ref.performer_address || selectedPerformer?.address,
        patient: {
          id: patient.id,
          fullName: patient.fullName,
          birthDate: patient.birthDate,
          gender: patient.gender,
          phone: patient.phone,
          cardNum: patient.cardNum
        },
        icd10_code: ref.icd10_code,
        clinical_diagnosis: ref.clinical_diagnosis,
        target_joint: ref.target_joint,
        target_side: ref.target_side,
        anamnesis_summary: ref.anamnesis_summary,
        preparation_instructions: ref.preparation_instructions,
        special_notes: ref.special_notes,
        verification_hash: ref.verification_hash,
        items: ref.items && ref.items.length > 0 ? ref.items : selectedItems
      }));

      setPrintDataList(completedList);

      const successNotice = completedList.length > 1
        ? `Успешно выписано ${completedList.length} отдельных официальных бланков (${completedList.map(r => r.referral_number).join(', ')})`
        : `Направление №${completedList[0].referral_number} успешно выписано`;
      setSuccessMessage(successNotice);

      if (onReferralIssued) {
        completedList.forEach(r => onReferralIssued(r));
      }

      // Handle specific action
      if (action === 'print') {
        setPendingPrintTrigger(Date.now());
        // Record print audit
        completedList.forEach(r => {
          fetch(`/api/ortho/referrals/${r.id}/audit-print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              performed_by_name: 'Добрушкин А.М',
              export_format: 'pdf',
              notes: 'Печать официального бланка из АРМ врача'
            })
          }).catch(err => console.error('Audit print log error:', err));
        });
      } else if (action === 'docx') {
        await exportReferralToDocx(completedList);
        // Record docx audit
        completedList.forEach(r => {
          fetch(`/api/ortho/referrals/${r.id}/audit-print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              performed_by_name: 'Добрушкин А.М',
              export_format: 'docx',
              notes: 'Экспорт направления в формат Microsoft Word (.docx)'
            })
          }).catch(err => console.error('Audit docx log error:', err));
        });
      }

      return completedList[0];
    } catch (err: any) {
      console.error('Issue referral error:', err);
      setErrorMessage(err.message || 'Ошибка сохранения направления');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = items.filter(i => i.selected).length;
  const selectedAdditionalCount = additionalDocs.filter(d => d.selected).length;

  return (
    <>
      <Dialog
        open={open}
        onClose={submitting ? undefined : onClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2.5,
              boxShadow: '0 20px 45px rgba(15, 60, 100, 0.25)',
              maxHeight: '92vh'
            }
          }
        }}
      >
        {/* MODAL HEADER */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#0F3C64',
            color: '#FFFFFF',
            py: 1.8,
            px: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                p: 0.8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AssignmentIcon sx={{ color: '#FFFFFF', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>
                Выписки официальных направлений
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem' }}>
                Центр Ортопедии и Травматологии Добрушкина • Срок действия: 90 календарных дней
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} disabled={submitting} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, bgcolor: '#F8FAFC' }}>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2.5 }} onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          {/* 1. PATIENT & CLINICAL DIAGNOSIS CARD */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Пациент
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', mt: 0.2 }}>
                  {patient?.fullName || 'Пациент не выбран'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                  Дата рождения: <b>{patient?.birthDate || '—'}</b> | Телефон: <b>{patient?.phone || '—'}</b>
                </Typography>
              </Box>
              <Chip
                icon={<VerifiedUserIcon sx={{ fontSize: 16 }} />}
                label="Врач: Добрушкин А.М"
                size="small"
                sx={{
                  bgcolor: '#EFF6FF',
                  color: '#1D4ED8',
                  fontWeight: 700,
                  border: '1px solid #BFDBFE'
                }}
              />
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Код МКБ-10"
                  value={icd10Code}
                  onChange={e => setIcd10Code(e.target.value)}
                  placeholder="M17.1"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Клинический диагноз"
                  value={clinicalDiagnosis}
                  onChange={e => setClinicalDiagnosis(e.target.value)}
                  placeholder="Первичный гонартроз односторонний..."
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Целевой сустав / Анатомическая зона"
                  value={jointZone}
                  onChange={e => setJointZone(e.target.value)}
                  placeholder="Коленный сустав"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Сторона поражения"
                  value={jointSide}
                  onChange={e => setJointSide(e.target.value)}
                  placeholder="Правая / Левая / Двусторонний"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Клиническое обоснование / Показания к назначению"
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="Стойкий болевой синдром (ВАШ 5 баллов), ограничение амплитуды..."
                />
              </Grid>
            </Grid>
          </Paper>

          {/* 2. PERFORMER (WHERE TO ROUTE) & VALIDITY CARD */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon sx={{ fontSize: 20, color: '#0F3C64' }} />
              Исполнитель и срок действия направления
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="performer-select-label">Куда направляется пациент (Исполнитель)</InputLabel>
                  <Select
                    labelId="performer-select-label"
                    label="Куда направляется пациент (Исполнитель)"
                    value={selectedPerformerId}
                    onChange={e => setSelectedPerformerId(e.target.value)}
                    disabled={loadingPerformers}
                  >
                    <ListSubheader sx={{ fontWeight: 800, color: '#15803D', bgcolor: '#F0FDF4', lineHeight: '32px' }}>
                      🏢 Внутренние подразделения Центра Добрушкина
                    </ListSubheader>
                    {performers.filter(p => Number(p.is_internal) === 1).map(p => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name} {p.address ? `(${p.address})` : ''}
                      </MenuItem>
                    ))}

                    <ListSubheader sx={{ fontWeight: 800, color: '#B45309', bgcolor: '#FEF3C7', lineHeight: '32px' }}>
                      🏥 Внешние аккредитованные центры и стационары
                    </ListSubheader>
                    {performers.filter(p => Number(p.is_internal) === 0).map(p => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name} {p.address ? `(${p.address})` : ''}
                      </MenuItem>
                    ))}

                    <Divider />
                    <MenuItem value="custom" sx={{ fontStyle: 'italic', color: '#0F3C64', fontWeight: 600 }}>
                      ✏️ Другая организация (ввести название вручную)...
                    </MenuItem>
                  </Select>
                </FormControl>

                {selectedPerformerId === 'custom' && (
                  <TextField
                    fullWidth
                    size="small"
                    label="Наименование сторонней медицинской организации"
                    placeholder="напр., ФГБУ «НМИЦ ТО им. Н.Н. Приорова»..."
                    value={customPerformerName}
                    onChange={e => setCustomPerformerName(e.target.value)}
                    sx={{ mt: 1.5 }}
                  />
                )}

                {selectedPerformer && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      size="small"
                      label={isInternalPerformer ? 'Внутреннее подразделение Центра' : 'Внешняя медицинская организация'}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        bgcolor: isInternalPerformer ? '#DCFCE7' : '#FEF3C7',
                        color: isInternalPerformer ? '#166534' : '#92400E'
                      }}
                    />
                    {selectedPerformer.address && (
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Адрес/кабинет: {selectedPerformer.address}
                      </Typography>
                    )}
                  </Box>
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Срок действия (дней)"
                  value={validDays}
                  onChange={e => setValidDays(Math.max(1, parseInt(e.target.value) || 90))}
                  helperText={`Действительно до: ${calculateExpiryDate(validDays)}`}
                />
              </Grid>
            </Grid>

            {/* Prominent Validity Alert */}
            <Box
              sx={{
                mt: 1.5,
                p: 1.25,
                bgcolor: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.2
              }}
            >
              <AccessTimeIcon sx={{ color: '#16A34A', fontSize: 22 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#15803D', fontSize: '0.88rem' }}>
                  Срок действия направления: {validDays} календарных дней
                </Typography>
                <Typography variant="caption" sx={{ color: '#166534', display: 'block' }}>
                  Действительно по <b>{calculateExpiryDate(validDays)}</b> включительно. Принимается во всех специализированных подразделениях.
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* FORMAT OF ISSUANCE: SEPARATE DOCS VS COMBINED */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2,
              bgcolor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArticleIcon sx={{ fontSize: 20, color: '#0F3C64' }} />
                  Формат выписки и печати направлений
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.8rem' }}>
                  {outputMode === 'separate'
                    ? `Каждая выбранная позиция (${selectedCount}) оформляется отдельным официальным бланком с индивидуальным номером`
                    : `Все выбранные позиции (${selectedCount}) будут объединены в единый сводный бланк направления`}
                </Typography>
              </Box>

              <ToggleButtonGroup
                value={outputMode}
                exclusive
                onChange={(_, val) => { if (val) setOutputMode(val); }}
                size="small"
                sx={{ bgcolor: '#F1F5F9' }}
              >
                <ToggleButton
                  value="separate"
                  sx={{
                    px: 1.8,
                    py: 0.6,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    '&.Mui-selected': {
                      bgcolor: '#0F3C64 !important',
                      color: '#FFFFFF !important'
                    }
                  }}
                >
                  📄 Отдельными бланками ({selectedCount})
                </ToggleButton>
                <ToggleButton
                  value="combined"
                  sx={{
                    px: 1.8,
                    py: 0.6,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    '&.Mui-selected': {
                      bgcolor: '#0F3C64 !important',
                      color: '#FFFFFF !important'
                    }
                  }}
                >
                  📋 Единым сводным
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Paper>

          {/* 3. SELECTABLE ITEMS LIST (DIAGNOSTICS, PROCEDURES, SURGERY) */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {items.length > 0 && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={items.length > 0 && selectedCount === items.length}
                        indeterminate={selectedCount > 0 && selectedCount < items.length}
                        onChange={handleToggleSelectAll}
                        sx={{ color: '#0F3C64', '&.Mui-checked': { color: '#0F3C64' }, '&.MuiCheckbox-indeterminate': { color: '#0F3C64' }, p: 0.5 }}
                      />
                    }
                    label=""
                    sx={{ mr: 0 }}
                  />
                )}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalHospitalIcon sx={{ fontSize: 20, color: '#0F3C64' }} />
                    Состав направления (выберите процедуры и исследования для печати)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Выбрано элементов для печати: <b>{selectedCount}</b> из {items.length}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {items.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 0.5 }}>
                    <Button
                      size="small"
                      onClick={handleSelectAllItems}
                      disabled={selectedCount === items.length}
                      sx={{ textTransform: 'none', fontSize: '0.78rem', py: 0.2, px: 0.8, fontWeight: 700, color: '#0F3C64' }}
                    >
                      Выбрать все
                    </Button>
                    <Typography variant="caption" sx={{ color: '#CBD5E1' }}>|</Typography>
                    <Button
                      size="small"
                      onClick={handleDeselectAllItems}
                      disabled={selectedCount === 0}
                      sx={{ textTransform: 'none', fontSize: '0.78rem', py: 0.2, px: 0.8, fontWeight: 700, color: '#64748B' }}
                    >
                      Снять все
                    </Button>
                  </Box>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddCircleIcon />}
                  onClick={() => setIsAddingCustomItem(true)}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Добавить пункт
                </Button>
              </Box>
            </Box>

            {/* Custom Item Form */}
            {isAddingCustomItem && (
              <Box sx={{ p: 1.5, mb: 2, bgcolor: '#F1F5F9', borderRadius: 1.5, border: '1px solid #CBD5E1' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 1 }}>
                  Добавить произвольное исследование / манипуляцию:
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Категория / Домен</InputLabel>
                      <Select
                        label="Категория / Домен"
                        value={customItemDomain}
                        onChange={e => setCustomItemDomain(e.target.value)}
                      >
                        <MenuItem value="diagnostics">Диагностика (МРТ, КТ, УЗИ, КДЛ)</MenuItem>
                        <MenuItem value="manipulation">Манипуляция (блокада, пункция, PRP)</MenuItem>
                        <MenuItem value="surgery">Хирургия / Операция</MenuItem>
                        <MenuItem value="physio">Физиотерапия</MenuItem>
                        <MenuItem value="orthotics">Ортезирование</MenuItem>
                        <MenuItem value="lfk">ЛФК и реабилитация</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Наименование исследования / процедуры"
                      value={customItemTitle}
                      onChange={e => setCustomItemTitle(e.target.value)}
                      placeholder="МРТ коленного сустава на томографе 1.5T..."
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Параметры, протокол и клинические детали"
                      value={customItemDetails}
                      onChange={e => setCustomItemDetails(e.target.value)}
                      placeholder="Аксиальные, сагиттальные и коронарные срезы..."
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button size="small" onClick={() => setIsAddingCustomItem(false)} sx={{ textTransform: 'none' }}>
                      Отмена
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleAddCustomItem}
                      disabled={!customItemTitle.trim()}
                      sx={{ textTransform: 'none', bgcolor: '#0F3C64' }}
                    >
                      Добавить в направление
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Items Checklist */}
            {items.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 1.5 }}>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  В текущем приеме нет назначенных процедур. Нажмите кнопку «Добавить пункт», чтобы выписать направление вручную.
                </Typography>
              </Box>
            ) : (
              <FormGroup>
                {items.map((item, idx) => (
                  <Paper
                    key={item.id}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      border: '1px solid',
                      borderColor: item.selected ? '#0F3C64' : '#E2E8F0',
                      bgcolor: item.selected ? '#F8FAFC' : '#FFFFFF',
                      borderRadius: 1.5,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={item.selected}
                            onChange={() => handleToggleItem(item.id)}
                            sx={{ color: '#0F3C64', '&.Mui-checked': { color: '#0F3C64' } }}
                          />
                        }
                        label=""
                        sx={{ mr: 0, mt: -0.5 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: item.selected ? '#0F3C64' : '#475569' }}>
                            {idx + 1}. {item.item_title}
                          </Typography>
                          {item.service_code && (
                            <Chip size="small" label={item.service_code} sx={{ fontSize: '0.7rem', height: 20 }} />
                          )}
                          <Chip
                            size="small"
                            label={item.domain}
                            sx={{
                              fontSize: '0.68rem',
                              height: 18,
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              bgcolor: '#E2E8F0',
                              color: '#334155'
                            }}
                          />
                        </Box>

                        {item.item_details && typeof item.item_details === 'string' && (
                          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.84rem', mt: 0.5 }}>
                            <LatexText text={item.item_details} />
                          </Typography>
                        )}

                        {item.formula_latex && (
                          <Box sx={{ mt: 0.5, p: 0.6, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px dashed #CBD5E1' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64', mr: 0.8 }}>
                              Протокол:
                            </Typography>
                            <LatexText text={item.formula_latex} />
                          </Box>
                        )}

                        {item.preparation_notes && (
                          <Typography variant="caption" sx={{ color: '#B45309', display: 'block', mt: 0.4 }}>
                            <b>Подготовка:</b> <LatexText text={item.preparation_notes} />
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </FormGroup>
            )}

            {/* Special Doctor Notes */}
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              sx={{ mt: 2 }}
              label="Особые отметки и указания врача для исполнителя"
              value={specialNotes}
              onChange={e => setSpecialNotes(e.target.value)}
              placeholder="Результаты обследования предоставить на повторный консультативный прием..."
            />
          </Paper>

          {/* 4. ADDITIONAL PRINTABLE DOCUMENTS LIST (EXTENSIBLE ARCHITECTURE) */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mt: 2.5,
              borderRadius: 2,
              bgcolor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NoteAddIcon sx={{ fontSize: 20, color: '#0F3C64' }} />
                  Сопутствующие и дополнительные документы для печати
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Выбрано дополнительных документов: <b>{selectedAdditionalCount}</b> из {additionalDocs.length}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Button
                  size="small"
                  onClick={handleSelectAllAdditionalDocs}
                  disabled={selectedAdditionalCount === additionalDocs.length}
                  sx={{ textTransform: 'none', fontSize: '0.78rem', py: 0.2, px: 0.8, fontWeight: 700, color: '#0F3C64' }}
                >
                  Выбрать все
                </Button>
                <Typography variant="caption" sx={{ color: '#CBD5E1' }}>|</Typography>
                <Button
                  size="small"
                  onClick={handleDeselectAllAdditionalDocs}
                  disabled={selectedAdditionalCount === 0}
                  sx={{ textTransform: 'none', fontSize: '0.78rem', py: 0.2, px: 0.8, fontWeight: 700, color: '#64748B' }}
                >
                  Снять все
                </Button>
              </Box>
            </Box>

            {/* List of Additional Documents */}
            {additionalDocs.map(doc => {
              const isExpanded = Boolean(expandedDocIds[doc.id]);
              return (
                <Paper
                  key={doc.id}
                  elevation={0}
                  sx={{
                    p: 1.8,
                    mb: 1.5,
                    border: '1.5px solid',
                    borderColor: doc.selected ? '#0284C7' : '#E2E8F0',
                    bgcolor: doc.selected ? '#F8FAFC' : '#FFFFFF',
                    borderRadius: 2,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Top line with Checkbox, Title and Badge */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={doc.selected}
                            onChange={() => handleToggleAdditionalDoc(doc.id)}
                            sx={{ color: '#0F3C64', '&.Mui-checked': { color: '#0284C7' }, p: 0.3 }}
                          />
                        }
                        label=""
                        sx={{ mr: 0, mt: -0.2 }}
                      />
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: doc.selected ? '#0F3C64' : '#334155', fontSize: '0.95rem' }}>
                            {doc.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={doc.formCode}
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              bgcolor: '#E0F2FE',
                              color: '#0369A1'
                            }}
                          />
                          {doc.selected && (
                            <Chip
                              size="small"
                              label="Включено в печать"
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                bgcolor: '#DCFCE7',
                                color: '#166534'
                              }}
                            />
                          )}
                        </Box>

                        {/* Official Notice text required by user */}
                        <Box sx={{ mt: 0.8, p: 1.2, bgcolor: '#F0F9FF', borderLeft: '3px solid #0284C7', borderRadius: '2px' }}>
                          <Typography variant="body2" sx={{ color: '#0C4A6E', fontSize: '0.82rem', lineHeight: 1.45, fontStyle: 'italic' }}>
                            «{doc.description}»
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {doc.selected && (
                      <IconButton
                        size="small"
                        onClick={() => setExpandedDocIds(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                        sx={{ color: '#64748B' }}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    )}
                  </Box>

                  {/* Config Form when selected and expanded */}
                  {doc.selected && isExpanded && doc.id === 'sick_leave' && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #CBD5E1' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                        Параметры листка нетрудоспособности:
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Причина нетрудоспособности (код)</InputLabel>
                            <Select
                              label="Причина нетрудоспособности (код)"
                              value={doc.data.reasonCode}
                              onChange={e => {
                                const code = e.target.value;
                                let title = 'Травма';
                                if (code === '01') title = 'Заболевание';
                                else if (code === '04') title = 'Несчастный случай на производстве';
                                else if (code === '10') title = 'Иное состояние (проведение манипуляций)';
                                handleUpdateAdditionalDocData(doc.id, { reasonCode: code, reasonTitle: title });
                              }}
                            >
                              <MenuItem value="02"><b>[02] Травма</b> (бытовая, спортивная, ушиб, перелом)</MenuItem>
                              <MenuItem value="01"><b>[01] Заболевание</b> (обострение артроза, дорсопатия)</MenuItem>
                              <MenuItem value="10"><b>[10] Иное состояние</b> (манипуляции, блокады, PRP)</MenuItem>
                              <MenuItem value="04"><b>[04] Несчастный случай на производстве</b></MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Место работы (наименование работодателя)"
                            value={doc.data.employerName}
                            onChange={e => handleUpdateAdditionalDocData(doc.id, { employerName: e.target.value })}
                            placeholder="ООО «Олимп», по месту требования..."
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Освобождение от работы С"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={doc.data.startDate}
                            onChange={e => {
                              const s = e.target.value;
                              const dur = doc.data.durationDays || 14;
                              const sDate = new Date(s);
                              const eDate = new Date(s);
                              eDate.setDate(sDate.getDate() + dur);
                              const rDate = new Date(s);
                              rDate.setDate(sDate.getDate() + dur + 1);
                              handleUpdateAdditionalDocData(doc.id, {
                                startDate: s,
                                endDate: eDate.toISOString().slice(0, 10),
                                returnToWorkDate: rDate.toISOString().slice(0, 10)
                              });
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="По какое число включительно"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={doc.data.endDate}
                            onChange={e => {
                              const endVal = e.target.value;
                              const eDate = new Date(endVal);
                              const rDate = new Date(endVal);
                              rDate.setDate(eDate.getDate() + 1);
                              handleUpdateAdditionalDocData(doc.id, {
                                endDate: endVal,
                                returnToWorkDate: rDate.toISOString().slice(0, 10)
                              });
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Приступить к работе С"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={doc.data.returnToWorkDate}
                            onChange={e => handleUpdateAdditionalDocData(doc.id, { returnToWorkDate: e.target.value })}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Вид занятости</InputLabel>
                            <Select
                              label="Вид занятости"
                              value={doc.data.workType}
                              onChange={e => handleUpdateAdditionalDocData(doc.id, { workType: e.target.value })}
                            >
                              <MenuItem value="main">Основное место работы</MenuItem>
                              <MenuItem value="part_time">По совместительству</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Номер бланка листка"
                              value={doc.data.documentNumber}
                              onChange={e => handleUpdateAdditionalDocData(doc.id, { documentNumber: e.target.value })}
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleUpdateAdditionalDocData(doc.id, { documentNumber: generateSickLeaveNum() })}
                              sx={{ minWidth: 40, p: 0.8 }}
                              title="Сгенерировать новый номер"
                            >
                              <RefreshIcon fontSize="small" />
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Config Form for Form 095/u (Physical Education Release) */}
                  {doc.selected && isExpanded && doc.id === 'pe_release_095u' && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #CBD5E1' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                        Параметры справки об освобождении от физкультуры (Форма 095/у):
                      </Typography>

                      {/* KEY HIGHLIGHT: Blank handwriting vs Doctor entered */}
                      <Box
                        sx={{
                          p: 1.5,
                          mb: 2,
                          bgcolor: doc.data.leavePeriodBlank ? '#FFFBEB' : '#F0FDF4',
                          border: '1.5px solid',
                          borderColor: doc.data.leavePeriodBlank ? '#F59E0B' : '#86EFAC',
                          borderRadius: 1.5
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={Boolean(doc.data.leavePeriodBlank)}
                              onChange={e => handleUpdateAdditionalDocData(doc.id, { leavePeriodBlank: e.target.checked })}
                              sx={{ color: '#D97706', '&.Mui-checked': { color: '#B45309' } }}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#92400E' }}>
                                Оставить поле срока освобождения пустым для заполнения от руки
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#78350F', display: 'block' }}>
                                При включении: на бланке печатается пустая линия с надписью «(срок освобождения и допустимый режим заполняются лечащим врачом от руки)».
                              </Typography>
                            </Box>
                          }
                        />

                        {/* Presets and Dates if NOT blank */}
                        {!doc.data.leavePeriodBlank && (
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed #E2E8F0' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534', display: 'block', mb: 0.8 }}>
                              Быстрый выбор срока освобождения:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5 }}>
                              {[
                                { label: '14 дней', days: 14, text: '14 календарных дней' },
                                { label: '1 месяц', days: 30, text: '1 месяц' },
                                { label: '3 месяца', days: 90, text: '3 месяца (на период реабилитации)' },
                                { label: '6 месяцев', days: 180, text: '6 месяцев (после травмы/операции)' },
                                { label: 'Учебная четверть', days: 60, text: 'на период учебной четверти' },
                                { label: 'Семестр', days: 120, text: 'на период учебного семестра' }
                              ].map(preset => (
                                <Chip
                                  key={preset.label}
                                  label={preset.label}
                                  size="small"
                                  onClick={() => {
                                    const s = doc.data.peStartDate || new Date().toISOString().slice(0, 10);
                                    const sDate = new Date(s);
                                    const eDate = new Date(s);
                                    eDate.setDate(sDate.getDate() + preset.days);
                                    handleUpdateAdditionalDocData(doc.id, {
                                      peDurationPreset: preset.label,
                                      peDurationText: preset.text,
                                      peStartDate: s,
                                      peEndDate: eDate.toISOString().slice(0, 10)
                                    });
                                  }}
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.74rem',
                                    cursor: 'pointer',
                                    bgcolor: doc.data.peDurationPreset === preset.label ? '#16A34A' : '#E2E8F0',
                                    color: doc.data.peDurationPreset === preset.label ? '#FFFFFF' : '#334155',
                                    '&:hover': { bgcolor: '#86EFAC' }
                                  }}
                                />
                              ))}
                            </Box>

                            <Grid container spacing={1.5}>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="date"
                                  label="Освобождение от физкультуры С"
                                  slotProps={{ inputLabel: { shrink: true } }}
                                  value={doc.data.peStartDate}
                                  onChange={e => handleUpdateAdditionalDocData(doc.id, { peStartDate: e.target.value })}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="date"
                                  label="Освобождение от физкультуры ПО"
                                  slotProps={{ inputLabel: { shrink: true } }}
                                  value={doc.data.peEndDate}
                                  onChange={e => handleUpdateAdditionalDocData(doc.id, { peEndDate: e.target.value })}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Срок прописью"
                                  value={doc.data.peDurationText}
                                  onChange={e => handleUpdateAdditionalDocData(doc.id, { peDurationText: e.target.value })}
                                  placeholder="напр. 1 месяц, 3 месяца..."
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        )}
                      </Box>

                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Учебное заведение / Школа / ВУЗ"
                            value={doc.data.institutionName}
                            onChange={e => handleUpdateAdditionalDocData(doc.id, { institutionName: e.target.value })}
                            placeholder="МБОУ СОШ № 8, Гимназия № 1, Сочинский колледж..."
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Рекомендуемая группа физкультуры</InputLabel>
                            <Select
                              label="Рекомендуемая группа физкультуры"
                              value={doc.data.peGroup}
                              onChange={e => handleUpdateAdditionalDocData(doc.id, { peGroup: e.target.value })}
                            >
                              <MenuItem value="full_exemption"><b>Полное освобождение</b> от физкультуры и нормативов</MenuItem>
                              <MenuItem value="special_a"><b>Специальная «А»</b> (ЛФК, щадящий режим)</MenuItem>
                              <MenuItem value="special_b"><b>Специальная «Б»</b> (теоретический зачет)</MenuItem>
                              <MenuItem value="preparatory"><b>Подготовительная</b> (без сдачи спортивных нормативов)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Освобожден от учебных занятий С"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={doc.data.absenceStartDate}
                            onChange={e => handleUpdateAdditionalDocData(doc.id, { absenceStartDate: e.target.value })}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Освобожден от занятий ПО"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={doc.data.absenceEndDate}
                            onChange={e => handleUpdateAdditionalDocData(doc.id, { absenceEndDate: e.target.value })}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Приступить к занятиям С"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={doc.data.returnToStudiesDate}
                            onChange={e => handleUpdateAdditionalDocData(doc.id, { returnToStudiesDate: e.target.value })}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 8 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Особые рекомендации врача-ортопеда"
                            value={doc.data.peSpecialRecommendations}
                            onChange={e => handleUpdateAdditionalDocData(doc.id, { peSpecialRecommendations: e.target.value })}
                            placeholder="Исключить осевые и прыжковые нагрузки, бег..."
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Номер справки 095/у"
                              value={doc.data.documentNumber}
                              onChange={e => handleUpdateAdditionalDocData(doc.id, { documentNumber: e.target.value })}
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleUpdateAdditionalDocData(doc.id, { documentNumber: generateForm095Num() })}
                              sx={{ minWidth: 40, p: 0.8 }}
                              title="Сгенерировать новый номер"
                            >
                              <RefreshIcon fontSize="small" />
                            </Button>
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={Boolean(doc.data.hideDiagnosis)}
                                onChange={e => handleUpdateAdditionalDocData(doc.id, { hideDiagnosis: e.target.checked })}
                              />
                            }
                            label={
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                Скрыть формулировку клинического диагноза в бланке (врачебная тайна по требованию пациента ст. 13 323-ФЗ)
                              </Typography>
                            }
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Paper>
        </DialogContent>

        {/* MODAL FOOTER ACTIONS */}
        <DialogActions sx={{ p: 2.5, bgcolor: '#F1F5F9', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
          <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600 }}>
            Закрыть
          </Button>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={submitting ? <CircularProgress size={18} /> : <SaveIcon />}
              onClick={() => issueReferral('save')}
              disabled={submitting || selectedCount === 0}
              sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#0F3C64', color: '#0F3C64' }}
            >
              Сохранить в реестр
            </Button>

            <Button
              variant="outlined"
              startIcon={submitting ? <CircularProgress size={18} /> : <DescriptionIcon />}
              onClick={() => issueReferral('docx')}
              disabled={submitting || selectedCount === 0}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderColor: '#1D4ED8',
                color: '#1D4ED8',
                '&:hover': { bgcolor: '#EFF6FF' }
              }}
            >
              {selectedCount > 1 && outputMode === 'separate' ? `Word (${selectedCount} док.)` : 'Word (.docx)'}
            </Button>

            <Button
              variant="contained"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PrintIcon />}
              onClick={() => issueReferral('print')}
              disabled={submitting || (selectedCount === 0 && selectedAdditionalCount === 0)}
              sx={{
                textTransform: 'none',
                fontWeight: 800,
                bgcolor: '#0F3C64',
                color: '#FFFFFF',
                px: 2.5,
                boxShadow: '0 4px 12px rgba(15, 60, 100, 0.25)',
                '&:hover': { bgcolor: '#0B2D4B' }
              }}
            >
              {selectedAdditionalCount > 0
                ? (selectedCount > 0
                    ? `Печать (${selectedCount > 1 && outputMode === 'separate' ? `${selectedCount} бл.` : '1 напр.'} + ${selectedAdditionalCount} доп. док.) (PDF)`
                    : `Печать сопутствующих документов (${selectedAdditionalCount}) (PDF)`)
                : (selectedCount > 1 && outputMode === 'separate'
                    ? `Печать ${selectedCount} бланков (PDF)`
                    : 'Печать бланка (PDF)')}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* HIDDEN PRINT COMPONENT FOR REACT-TO-PRINT */}
      <Box sx={{ display: 'none' }}>
        <div ref={printComponentRef}>
          {/* 1. Referrals list (each with page break) */}
          {printDataList.map((r, idx) => (
            <Box
              key={r.id || idx}
              className="page-break"
              sx={{
                pageBreakAfter: 'always !important',
                breakAfter: 'page !important'
              }}
            >
              <OrthoReferralPrintTemplate data={r} />
            </Box>
          ))}

          {/* 2. Additional printable documents (Sick leave certificate, Form 095/u, etc.) */}
          {additionalDocs.filter(d => d.selected).map(doc => {
            if (doc.id === 'sick_leave') {
              const slData: SickLeaveData = {
                documentNumber: doc.data.documentNumber,
                isDuplicate: doc.data.isDuplicate,
                issueDate: doc.data.startDate,
                patient: {
                  fullName: patient?.fullName || 'Пациент',
                  birthDate: patient?.birthDate,
                  gender: patient?.gender,
                  phone: patient?.phone,
                  cardNum: patient?.cardNum
                },
                reasonCode: doc.data.reasonCode || '02',
                reasonTitle: doc.data.reasonTitle || 'Травма (ортопедия / травматология)',
                employerName: doc.data.employerName || 'По месту требования',
                workType: doc.data.workType || 'main',
                startDate: doc.data.startDate,
                endDate: doc.data.endDate,
                returnToWorkDate: doc.data.returnToWorkDate,
                doctorName: doctorName || 'Добрушкин А.М',
                doctorSpecialty: 'Врач травматолог-ортопед',
                officialNotice: doc.description,
                icd10Code: icd10Code,
                clinicalDiagnosis: clinicalDiagnosis
              };
              return (
                <Box
                  key={doc.id}
                  className="page-break"
                  sx={{
                    pageBreakAfter: 'always !important',
                    breakAfter: 'page !important'
                  }}
                >
                  <SickLeavePrintTemplate data={slData} />
                </Box>
              );
            }

            if (doc.id === 'pe_release_095u') {
              const peData: PeReleaseData = {
                documentNumber: doc.data.documentNumber,
                issueDate: doc.data.absenceStartDate || new Date().toISOString().slice(0, 10),
                patient: {
                  fullName: patient?.fullName || 'Пациент',
                  birthDate: patient?.birthDate,
                  gender: patient?.gender,
                  phone: patient?.phone,
                  cardNum: patient?.cardNum
                },
                institutionName: doc.data.institutionName || '',
                icd10Code: icd10Code,
                clinicalDiagnosis: clinicalDiagnosis,
                hideDiagnosis: doc.data.hideDiagnosis,
                absenceStartDate: doc.data.absenceStartDate,
                absenceEndDate: doc.data.absenceEndDate,
                leavePeriodBlank: Boolean(doc.data.leavePeriodBlank),
                peStartDate: doc.data.peStartDate,
                peEndDate: doc.data.peEndDate,
                peDurationText: doc.data.peDurationText,
                peGroup: doc.data.peGroup || 'full_exemption',
                peSpecialRecommendations: doc.data.peSpecialRecommendations,
                returnToStudiesDate: doc.data.returnToStudiesDate,
                doctorName: doctorName || 'Добрушкин А.М',
                doctorSpecialty: 'Врач травматолог-ортопед'
              };
              return (
                <Box
                  key={doc.id}
                  className="page-break"
                  sx={{
                    pageBreakAfter: 'always !important',
                    breakAfter: 'page !important'
                  }}
                >
                  <PeReleasePrintTemplate data={peData} />
                </Box>
              );
            }
            return null;
          })}
        </div>
      </Box>
    </>
  );
}
