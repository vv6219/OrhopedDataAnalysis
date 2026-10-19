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
  Grid
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
import { useReactToPrint } from 'react-to-print';

import OrthoReferralPrintTemplate from '../reports/OrthoReferralPrintTemplate';
import type { OrthoReferralData } from '../reports/OrthoReferralPrintTemplate';
import { exportReferralToDocx } from '../../utils/referralDocxExport';
import LatexText from './LatexText';

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

  // Print template hidden state & ref
  const printComponentRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<OrthoReferralData | null>(null);
  const [pendingPrintTrigger, setPendingPrintTrigger] = useState<number | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: printData ? `Направление_${printData.referral_number}_${printData.patient?.fullName || 'Пациент'}` : 'Направление',
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
  });

  // Trigger print after state updates with printData
  useEffect(() => {
    if (printData && pendingPrintTrigger) {
      handlePrint();
      setPendingPrintTrigger(null);
    }
  }, [printData, pendingPrintTrigger, handlePrint]);

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
        const diagDetails = (typeof diag.clinical_objective === 'string' && diag.clinical_objective.trim())
          ? diag.clinical_objective.trim()
          : (typeof diag.target_anatomical_zone === 'string' && diag.target_anatomical_zone.trim()
              ? diag.target_anatomical_zone.trim()
              : '');

        const prepNotes = typeof diag.patient_preparation === 'string' ? diag.patient_preparation : '';
        const diagTitle = typeof diag.method_name === 'string' ? diag.method_name : (typeof diag.name === 'string' ? diag.name : 'Диагностическое исследование');
        const sCode = typeof diag.method_code === 'string' ? diag.method_code : (typeof diag.code === 'string' ? diag.code : '');

        initialItems.push({
          id: `diag_${diag.id || idx}`,
          domain: 'diagnostics',
          service_code: sCode,
          item_title: diagTitle,
          item_details: diagDetails,
          preparation_notes: prepNotes,
          selected: true
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

        let prescDetails = '';
        if (typeof presc.dosage_notes === 'string' && presc.dosage_notes.trim()) {
          prescDetails = presc.dosage_notes.trim();
        } else if (typeof presc.details === 'string' && presc.details.trim()) {
          prescDetails = presc.details.trim();
        } else if (presc.details && typeof presc.details === 'object') {
          if (typeof presc.details.notes === 'string') prescDetails = presc.details.notes;
          else if (typeof presc.details.text === 'string') prescDetails = presc.details.text;
          else if (typeof presc.details.protocol === 'string') prescDetails = presc.details.protocol;
        }

        const prescTitle = typeof presc.name === 'string' ? presc.name : (typeof presc.title === 'string' ? presc.title : 'Медицинская процедура');
        const prescCode = typeof presc.code === 'string' ? presc.code : (typeof presc.serviceCode === 'string' ? presc.serviceCode : (typeof presc.service_code === 'string' ? presc.service_code : ''));
        const prescFormula = typeof presc.formula_latex === 'string' ? presc.formula_latex : '';
        const prescPrep = typeof presc.preparation_notes === 'string' ? presc.preparation_notes : '';

        initialItems.push({
          id: `presc_${presc.id || idx}`,
          domain: domain,
          service_code: prescCode,
          item_title: prescTitle,
          item_details: prescDetails,
          formula_latex: prescFormula,
          preparation_notes: prescPrep,
          selected: true
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

  // Add custom item
  const handleAddCustomItem = () => {
    if (!customItemTitle.trim()) return;
    const newItem: SelectableItem = {
      id: `custom_${Date.now()}`,
      domain: customItemDomain,
      item_title: customItemTitle.trim(),
      item_details: customItemDetails.trim() || undefined,
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
        items: selectedItems.map(it => ({
          domain: it.domain,
          service_code: it.service_code,
          item_title: it.item_title,
          item_details: it.item_details,
          formula_latex: it.formula_latex,
          preparation_notes: it.preparation_notes
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

      const issued = resData.referral;
      const completeData: OrthoReferralData = {
        id: issued.id,
        referral_number: issued.referral_number,
        issue_date: issued.issue_date,
        valid_days: issued.valid_days,
        expires_at: issued.expires_at,
        doctor_name: 'Добрушкин А.М',
        performer_id: issued.performer_id,
        performer_name: issued.performer_name,
        performer_is_internal: issued.performer_is_internal,
        performer_address: issued.performer_address || selectedPerformer?.address,
        patient: {
          id: patient.id,
          fullName: patient.fullName,
          birthDate: patient.birthDate,
          gender: patient.gender,
          phone: patient.phone,
          cardNum: patient.cardNum
        },
        icd10_code: issued.icd10_code,
        clinical_diagnosis: issued.clinical_diagnosis,
        target_joint: issued.target_joint,
        target_side: issued.target_side,
        anamnesis_summary: issued.anamnesis_summary,
        preparation_instructions: issued.preparation_instructions,
        special_notes: issued.special_notes,
        verification_hash: issued.verification_hash,
        items: issued.items || selectedItems
      };

      setPrintData(completeData);
      setSuccessMessage(`Направление ${issued.referral_number} успешно выписано и зарегистрировано в реестре`);

      if (onReferralIssued) {
        onReferralIssued(issued);
      }

      // Handle specific action
      if (action === 'print') {
        setPendingPrintTrigger(Date.now());
        // Record print audit
        fetch(`/api/ortho/referrals/${issued.id}/audit-print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            performed_by_name: 'Добрушкин А.М',
            export_format: 'pdf',
            notes: 'Печать официального бланка из АРМ врача'
          })
        }).catch(err => console.error('Audit print log error:', err));
      } else if (action === 'docx') {
        await exportReferralToDocx(completeData);
        // Record docx audit
        fetch(`/api/ortho/referrals/${issued.id}/audit-print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            performed_by_name: 'Добрушкин А.М',
            export_format: 'docx',
            notes: 'Экспорт направления в формат Microsoft Word (.docx)'
          })
        }).catch(err => console.error('Audit docx log error:', err));
      }

      return completeData;
    } catch (err: any) {
      console.error('Issue referral error:', err);
      setErrorMessage(err.message || 'Ошибка сохранения направления');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = items.filter(i => i.selected).length;

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
                Выписка официального направления
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalHospitalIcon sx={{ fontSize: 20, color: '#0F3C64' }} />
                  Состав направления (выберите процедуры и исследования)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Выбрано элементов: <b>{selectedCount}</b> из {items.length}
                </Typography>
              </Box>
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
                            {item.item_details}
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
                            <b>Подготовка:</b> {item.preparation_notes}
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
              Скачать Word (.docx)
            </Button>

            <Button
              variant="contained"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PrintIcon />}
              onClick={() => issueReferral('print')}
              disabled={submitting || selectedCount === 0}
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
              Печать бланка (PDF)
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* HIDDEN PRINT COMPONENT FOR REACT-TO-PRINT */}
      <Box sx={{ display: 'none' }}>
        {printData && (
          <div ref={printComponentRef}>
            <OrthoReferralPrintTemplate data={printData} />
          </div>
        )}
      </Box>
    </>
  );
}
