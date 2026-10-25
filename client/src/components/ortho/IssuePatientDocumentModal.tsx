import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Chip,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BadgeIcon from '@mui/icons-material/Badge';
import PrintIcon from '@mui/icons-material/Print';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../../context/AuthContext';
import { isElementPermitted } from '../../utils/permissionUtils';

export interface IssuePatientDocumentModalProps {
  open: boolean;
  onClose: () => void;
  patientId: number | null;
  patientName: string;
  patientData?: any;
  protocolId?: number | null;
  appointmentId?: number | null;
  defaultDiagnosis?: string;
  defaultIcd10?: string;
  doctorName?: string;
  onDocumentIssued: (doc: any) => void;
}

export const DOCUMENT_TYPE_CONFIGS = [
  {
    type: 'referral',
    formCode: '057/у-04',
    title: 'Направление на обследование/госпитализацию (Форма № 057/у-04)',
    shortTitle: 'Направление 057/у',
    icon: <LocalHospitalIcon color="primary" />,
    badgeColor: '#0284C7'
  },
  {
    type: 'sick_leave',
    formCode: '347н / ЭЛН',
    title: 'Листок нетрудоспособности (больничный лист) (Форма № 347н)',
    shortTitle: 'Больничный лист',
    icon: <LocalHospitalIcon color="error" />,
    badgeColor: '#EF4444',
    requiredPermission: 'sysadmin'
  },
  {
    type: 'certificate',
    formCode: '095/у',
    title: 'Справка о временной нетрудоспособности учащегося (Форма № 095/у)',
    shortTitle: 'Справка 095/у',
    icon: <SchoolIcon color="warning" />,
    badgeColor: '#D97706',
    requiredPermission: 'sysadmin'
  },
  {
    type: 'pe_release',
    formCode: 'pe-release',
    title: 'Справка об освобождении от занятий физической культурой',
    shortTitle: 'Освобождение от физкультуры',
    icon: <FitnessCenterIcon color="info" />,
    badgeColor: '#0D9488'
  },
  {
    type: 'fit_to_fly',
    formCode: 'fit-to-fly',
    title: 'Справка для авиаперелета (Medical Certificate / Fit to Fly)',
    shortTitle: 'Fit to Fly (Перелет)',
    icon: <FlightTakeoffIcon sx={{ color: '#0284C7' }} />,
    badgeColor: '#0284C7'
  },
  {
    type: 'sports_admission',
    formCode: '1144н',
    title: 'Медицинское заключение о допуске к спорту / ГТО (Приказ № 1144н)',
    shortTitle: 'Заключение 1144н (Спорт)',
    icon: <FitnessCenterIcon sx={{ color: '#16A34A' }} />,
    badgeColor: '#16A34A'
  },
  {
    type: 'extract',
    formCode: '027/у',
    title: 'Выписка из медицинской карты амбулаторного больного (Форма № 027/у)',
    shortTitle: 'Выписка 027/у',
    icon: <DescriptionIcon sx={{ color: '#9333EA' }} />,
    badgeColor: '#9333EA'
  },
  {
    type: 'card',
    formCode: '025/у',
    title: 'Титульный лист амбулаторной медицинской карты (Форма № 025/у)',
    shortTitle: 'Медкарта 025/у',
    icon: <BadgeIcon sx={{ color: '#475569' }} />,
    badgeColor: '#475569'
  },
  {
    type: 'consent',
    formCode: 'ids-323',
    title: 'Информированное добровольное согласие (ИДС, ст. 20 323-ФЗ)',
    shortTitle: 'ИДС 323-ФЗ',
    icon: <AssignmentIcon sx={{ color: '#DC2626' }} />,
    badgeColor: '#DC2626'
  },
  {
    type: 'memo',
    formCode: 'memo-prep',
    title: 'Памятка пациенту (подготовка к МРТ/КТ/УЗИ и двигательный режим)',
    shortTitle: 'Памятка пациенту',
    icon: <InfoOutlinedIcon sx={{ color: '#059669' }} />,
    badgeColor: '#059669'
  }
];

export const IssuePatientDocumentModal: React.FC<IssuePatientDocumentModalProps> = ({
  open,
  onClose,
  patientId,
  patientName,
  patientData,
  protocolId,
  appointmentId,
  defaultDiagnosis = 'Двусторонний гонартроз II стадии с болевым синдромом',
  defaultIcd10 = 'M17.0',
  doctorName = 'Добрушкин А.М.',
  onDocumentIssued
}) => {
  const { currentUser, hasPermission } = useAuth();
  const isSysadmin =
    hasPermission('sysadmin') ||
    isElementPermitted('protocols_registry', 'issue_sick_leave', currentUser?.permissionCodes) ||
    isElementPermitted('protocols_registry', 'print_sick_leave', currentUser?.permissionCodes);

  const [selectedType, setSelectedType] = useState<string>('referral');
  const [recipientOrg, setRecipientOrg] = useState<string>('');
  const [icd10, setIcd10] = useState<string>(defaultIcd10);
  const [diagnosis, setDiagnosis] = useState<string>(defaultDiagnosis);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  
  // Custom document fields
  const [destinationRoute, setDestinationRoute] = useState<string>('Сочи (AER) — Москва (SVO) / Аэрофлот');
  const [fullNameEn, setFullNameEn] = useState<string>('');
  const [sportDiscipline, setSportDiscipline] = useState<string>('Плавание / Легкая атлетика');
  const [sportStage, setSportStage] = useState<'training_and_competition' | 'gto_only' | 'training_only'>('training_and_competition');
  const [examResults, setExamResults] = useState<string>('ЭКГ: синусовый ритм, без нарушений реполяризации. Проба с физической нагрузкой отрицательная. Суставы стабильны.');
  const [specialRequirements, setSpecialRequirements] = useState<string>('Специальной помощи и кислородной поддержки на борту не требуется. Разрешено перемещение с тростью/бандажом.');
  const [procedureName, setProcedureName] = useState<string>('Внутрисуставная инъекция препарата гиалуроновой кислоты / PRP-терапия');
  const [examTypeMemo, setExamTypeMemo] = useState<string>('МРТ коленного сустава');
  const [memoInstructions, setMemoInstructions] = useState<string>('1. Прибыть за 15 минут до процедуры.\n2. Снять все металлические предметы и украшения.\n3. Взять результаты предыдущих исследований (рентген/МРТ).');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Synchronize defaults on open or change
  useEffect(() => {
    if (open) {
      setIcd10(defaultIcd10 || 'M17.0');
      setDiagnosis(defaultDiagnosis || 'Артроз коленного сустава');
      const today = new Date();
      setStartDate(today.toISOString().substring(0, 10));

      const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      setEndDate(twoWeeks.toISOString().substring(0, 10));

      const threeMonths = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
      setValidUntil(threeMonths.toISOString().substring(0, 10));
    }
  }, [open, defaultIcd10, defaultDiagnosis]);

  const activeConfig = DOCUMENT_TYPE_CONFIGS.find((c) => c.type === selectedType) || DOCUMENT_TYPE_CONFIGS[0];

  const handleIssueAndPrint = async () => {
    if (!patientId || !patientName) {
      setSubmitError('Пациент не выбран');
      return;
    }

    const isRestrictedDoc =
      activeConfig.type === 'certificate' ||
      activeConfig.type === 'sick_leave' ||
      activeConfig.requiredPermission === 'sysadmin';

    if (isRestrictedDoc && !isSysadmin) {
      setSubmitError('Оформление и печать листка нетрудоспособности (больничного листа) разрешена исключительно системному администратору (sysadmin)');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const docPayload = {
      patient_id: patientId,
      patient_name: patientName,
      protocol_id: protocolId || null,
      appointment_id: appointmentId || null,
      document_type: activeConfig.type,
      form_code: activeConfig.formCode,
      title: activeConfig.title,
      valid_until: validUntil || null,
      doctor_name: doctorName || 'Добрушкин А.М.',
      recipient_organization: recipientOrg || (activeConfig.type === 'fit_to_fly' ? 'Авиакомпания' : 'По месту требования'),
      icd10_code: icd10,
      clinical_diagnosis: diagnosis,
      document_data: {
        startDate,
        endDate,
        validUntil,
        destinationRoute,
        fullNameEn,
        sportDiscipline,
        sportStage,
        examResults,
        specialRequirements,
        procedureName,
        examTypeMemo,
        memoInstructions,
        patientDetails: {
          birthDate: patientData?.birthDate || patientData?.birth_date || '1985-06-15',
          gender: patientData?.gender || 1,
          phone: patientData?.phone || '+7 (999) 000-00-00',
          snils: patientData?.snils || '123-456-789 00',
          omsPolicy: patientData?.oms_policy || patientData?.policy || '0000 0000 0000 0000',
          address: patientData?.address || 'г. Сочи, ул. Курортный проспект, д. 10'
        }
      }
    };

    try {
      const res = await fetch('/api/ortho/patient-documents/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(docPayload)
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        const cleanMsg = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        throw new Error(`Ответ сервера (${res.status}): ${cleanMsg.slice(0, 160) || 'Некорректный формат ответа'}`);
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Ошибка сервера (${res.status})`);
      }

      onDocumentIssued(data.document);
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Сбой регистрации документа в базе данных');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DescriptionIcon color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
              Оформление и регистрация официального документа
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Пациент: <strong>{patientName}</strong> (ID: {patientId})
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {/* 1. SELECT DOCUMENT TYPE */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', mb: 1 }}>
            Выберите тип медицинского документа:
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel id="doc-type-select-label">Тип документа</InputLabel>
            <Select
              labelId="doc-type-select-label"
              value={selectedType}
              label="Тип документа"
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {DOCUMENT_TYPE_CONFIGS.map((cfg) => {
                const isRestricted =
                  (cfg.type === 'certificate' ||
                   cfg.type === 'sick_leave' ||
                   cfg.requiredPermission === 'sysadmin') &&
                  !isSysadmin;
                return (
                  <MenuItem key={cfg.type} value={cfg.type} disabled={isRestricted}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {cfg.icon}
                        <Box>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: isRestricted ? '#94A3B8' : 'inherit' }}>
                            {cfg.title}
                          </Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: isRestricted ? '#CBD5E1' : '#64748B' }}>
                            Форма: {cfg.formCode}
                          </Typography>
                        </Box>
                      </Box>
                      {isRestricted && (
                        <Tooltip title="Оформление разрешено только системному администратору (sysadmin)">
                          <Chip
                            icon={<LockIcon sx={{ fontSize: '12px !important', color: '#DC2626 !important' }} />}
                            label="Только sysadmin"
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>

        {/* INFO BANNER ABOUT NUMBERING & AUDIT */}
        <Box sx={{ bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', p: 1.5, borderRadius: '6px', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InfoOutlinedIcon sx={{ color: '#0284C7', fontSize: '1.4rem' }} />
          <Box>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369A1' }}>
              Сквозная официальная нумерация и Serilog-аудит
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>
              Документу будет автоматически присвоен постоянный уникальный регистрационный номер (например,{' '}
              <strong>
                {DOCUMENT_TYPE_CONFIGS.find((c) => c.type === selectedType)?.shortTitle.slice(0, 4).toUpperCase()}-2026-000042
              </strong>
              ) с контрольным хэшем подлинности. Запись будет зафиксирована в журнале аудита Serilog.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* 2. CORE FIELDS (Diagnosis, Dates, Recipient) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 2, mb: 2 }}>
          <TextField
            label="Код по МКБ-10"
            size="small"
            value={icd10}
            onChange={(e) => setIcd10(e.target.value)}
            placeholder="M17.0"
          />
          <TextField
            label="Клинический диагноз"
            size="small"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            fullWidth
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <TextField
            label="Организация / Куда предъявляется"
            size="small"
            value={recipientOrg}
            onChange={(e) => setRecipientOrg(e.target.value)}
            placeholder={
              selectedType === 'fit_to_fly'
                ? 'Авиакомпания (ПАО «Аэрофлот»)'
                : selectedType === 'certificate'
                ? 'Школа № 25 / ВУЗ'
                : selectedType === 'sports_admission'
                ? 'Спортивная школа / Федерация'
                : 'По месту требования'
            }
          />
          <TextField
            label="Срок действия документа (до)"
            type="date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
        </Box>

        {/* 3. DYNAMIC FIELDS ACCORDING TO DOCUMENT TYPE */}
        {selectedType === 'fit_to_fly' && (
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', mb: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', mb: 1.5 }}>
              Специфические параметры авиаперелета (Fit to Fly):
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                label="ФИО на латинице (по паспорту)"
                size="small"
                value={fullNameEn}
                onChange={(e) => setFullNameEn(e.target.value)}
                placeholder="IVANOV IVAN"
              />
              <TextField
                label="Маршрут и рейс"
                size="small"
                value={destinationRoute}
                onChange={(e) => setDestinationRoute(e.target.value)}
                placeholder="Сочи (AER) — Москва (SVO)"
              />
            </Box>
            <TextField
              label="Дополнительные условия / Мобильность"
              size="small"
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        )}

        {selectedType === 'sports_admission' && (
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', mb: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', mb: 1.5 }}>
              Параметры допуска к спорту (Приказ № 1144н):
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                label="Вид спорта"
                size="small"
                value={sportDiscipline}
                onChange={(e) => setSportDiscipline(e.target.value)}
                placeholder="Плавание, горные лыжи, единоборства"
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Уровень допуска</InputLabel>
                <Select
                  value={sportStage}
                  label="Уровень допуска"
                  onChange={(e: any) => setSportStage(e.target.value)}
                >
                  <MenuItem value="training_and_competition">Тренировочные мероприятия и соревнования</MenuItem>
                  <MenuItem value="gto_only">Сдача нормативов комплекса ГТО</MenuItem>
                  <MenuItem value="training_only">Только тренировочный процесс (без соревнований)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Данные обследований (ЭКГ, функциональные тесты)"
              size="small"
              value={examResults}
              onChange={(e) => setExamResults(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        )}

        {(selectedType === 'certificate' || selectedType === 'pe_release') && (
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', mb: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', mb: 1.5 }}>
              Период освобождения от занятий / физкультуры:
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Освобожден(а) с даты"
                type="date"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <TextField
                label="По дату включительно"
                type="date"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Box>
          </Box>
        )}

        {selectedType === 'consent' && (
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', mb: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', mb: 1.5 }}>
              Параметры информированного согласия (ИДС):
            </Typography>
            <TextField
              label="Наименование манипуляции / вмешательства"
              size="small"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              fullWidth
              placeholder="Пункция коленного сустава, введение PRP, гиалуроновой кислоты"
            />
          </Box>
        )}

        {selectedType === 'memo' && (
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', mb: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', mb: 1.5 }}>
              Параметры памятки пациенту:
            </Typography>
            <TextField
              label="Вид планируемого исследования или процедуры"
              size="small"
              value={examTypeMemo}
              onChange={(e) => setExamTypeMemo(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Инструкции и правила подготовки"
              size="small"
              value={memoInstructions}
              onChange={(e) => setMemoInstructions(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Отмена
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleIssueAndPrint}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <PrintIcon />}
          sx={{ fontWeight: 700, px: 3 }}
        >
          {isSubmitting ? 'Регистрация...' : 'Зарегистрировать и распечатать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
