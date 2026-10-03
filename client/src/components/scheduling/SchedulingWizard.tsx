import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  TextField,
  Autocomplete,
  CircularProgress,
  Chip,
  Paper,
  Tabs,
  Tab,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Tooltip,
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import TelegramIcon from '@mui/icons-material/Telegram';
import SecurityIcon from '@mui/icons-material/Security';
import ChatIcon from '@mui/icons-material/Chat';
import SmsIcon from '@mui/icons-material/Sms';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BadgeIcon from '@mui/icons-material/Badge';
import type { PatientSearchResult, Doctor, TimeSlot, UrgencyLevel } from './SchedulingTypes';

interface SchedulingWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newAppointmentId: number) => void;
  initialDoctorId?: number;
  initialDate?: string;
  initialStartTime?: string;
}

const JOINT_AREAS = [
  { id: 'knee', label: 'Коленный сустав', icon: '🦴', hint: 'Артроз, повреждения менисков, ПКС, синовит' },
  { id: 'hip', label: 'Тазобедренный сустав', icon: '🦵', hint: 'Коксартроз, трохантерит, импинджмент' },
  { id: 'shoulder', label: 'Плечевой сустав', icon: '💪', hint: 'Плечелопаточный периартрит, импинджмент-синдром' },
  { id: 'ankle', label: 'Стопа и голеностоп', icon: '🦶', hint: 'Плантарный фасциит, стельки Formthotics, растяжения' },
  { id: 'spine', label: 'Позвоночник', icon: '🧘', hint: 'Дорсопатия, радикулопатия, подбор корсета ТРИВЕС' },
  { id: 'hand', label: 'Кисть и лучезапястный', icon: '✋', hint: 'Туннельный синдром, теносиновит де Кервена, контрактуры' }
];

const CLINICAL_PROCEDURES = [
  { id: 2, name: 'Врач ортопед-травматолог плановый, первичный прием', price: 3000, duration: 30, joint: 'all' },
  { id: 5, name: 'Врач ортопед-травматолог плановый, повторный прием', price: 2700, duration: 30, joint: 'all' },
  { id: 10, name: 'Контроль УЗИ при проведении внутрисуставной инъекции', price: 1500, duration: 30, joint: 'knee' },
  { id: 8, name: 'УЗИ мягких тканей и суставов', price: 1500, duration: 30, joint: 'all' },
  { id: 11, name: 'PRP-терапия Cortexil (плазмотерапия сустава)', price: 6500, duration: 45, joint: 'knee' },
  { id: 12, name: 'Моделирование ортопедических стелек Formthotics', price: 7200, duration: 45, joint: 'ankle' },
  { id: 13, name: 'Лечебно-медикаментозная блокада под УЗИ-навигацией', price: 4200, duration: 30, joint: 'hip' }
];

const STEPS = [
  'Идентификация пациента',
  'Сустав и услуга',
  'Врач и слот',
  'Клинический чек-лист',
  'Омниканальное уведомление'
];

export default function SchedulingWizard({
  open,
  onClose,
  onSuccess,
  initialDoctorId,
  initialDate,
  initialStartTime
}: SchedulingWizardProps) {
  const [activeStep, setActiveStep] = useState(0);

  // Step 1: Patient
  const [patientMode, setPatientMode] = useState<'search' | 'create'>('search');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientOptions, setPatientOptions] = useState<PatientSearchResult[]>([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);

  // New Patient Form
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('+7 ');
  const [newPatientBdate, setNewPatientBdate] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientSex, setNewPatientSex] = useState<'Мужской' | 'Женский'>('Мужской');
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);

  // Step 2: Joint & Procedure
  const [selectedJoint, setSelectedJoint] = useState('knee');
  const [selectedOperationId, setSelectedOperationId] = useState<number>(2);
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('routine');
  const [customDuration, setCustomDuration] = useState<number>(30);

  // Step 3: Doctor, Date & Slot
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(initialDoctorId || 2);
  const [appointmentDate, setAppointmentDate] = useState<string>(
    initialDate || new Date().toISOString().slice(0, 10)
  );
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>(initialStartTime || '10:00');

  // Step 4: Clinical Checklist & Notes
  const [chkMri, setChkMri] = useState(true);
  const [chkHydration, setChkHydration] = useState(false);
  const [chkShoes, setChkShoes] = useState(false);
  const [chkAnticoagulants, setChkAnticoagulants] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Step 5: Notification channel
  const [notifChannel, setNotifChannel] = useState<'telegram' | 'max' | 'whatsapp' | 'sms'>('telegram');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch doctors on mount
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/scheduling/doctors')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.doctors) {
          setDoctors(data.doctors);
        }
      })
      .catch((err) => console.error('Error fetching doctors:', err));
  }, []);

  // Fetch slots whenever doctor, date or duration changes
  useEffect(() => {
    if (selectedDoctorId && appointmentDate) {
      setSlotsLoading(true);
      fetch(
        `http://127.0.0.1:5000/api/scheduling/available-slots?doctorId=${selectedDoctorId}&date=${appointmentDate}&duration=${customDuration}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.slots) {
            setSlots(data.slots);
            // If current selected slot is no longer available, pick first available
            const match = data.slots.find((s: TimeSlot) => s.time === selectedSlotTime && s.isAvailable);
            if (!match) {
              const firstAvail = data.slots.find((s: TimeSlot) => s.isAvailable);
              if (firstAvail) setSelectedSlotTime(firstAvail.time);
            }
          }
        })
        .catch((err) => console.error('Error fetching slots:', err))
        .finally(() => setSlotsLoading(false));
    }
  }, [selectedDoctorId, appointmentDate, customDuration]);

  // Debounced patient search over 61k DB
  useEffect(() => {
    if (patientSearchTerm.trim().length < 2) {
      setPatientOptions([]);
      return;
    }
    const timer = setTimeout(() => {
      setPatientSearching(true);
      fetch(`http://127.0.0.1:5000/api/scheduling/patients/search?q=${encodeURIComponent(patientSearchTerm)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.patients) {
            setPatientOptions(data.patients);
          }
        })
        .catch((err) => console.error('Error searching patients:', err))
        .finally(() => setPatientSearching(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [patientSearchTerm]);

  // Quick Create Patient
  const handleQuickCreatePatient = async () => {
    if (!newPatientName.trim()) {
      setFormError('Укажите ФИО пациента');
      return;
    }
    setQuickCreateLoading(true);
    setFormError(null);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/scheduling/patients/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newPatientName,
          sphone: newPatientPhone,
          bdate: newPatientBdate,
          age: Number(newPatientAge) || 0,
          sex_display: newPatientSex
        })
      });
      const data = await res.json();
      if (data.success && data.patient) {
        setSelectedPatient(data.patient);
        setPatientMode('search');
        setActiveStep(1); // proceed to next step
      } else {
        setFormError(data.error || 'Ошибка создания карты пациента');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Сетевая ошибка';
      setFormError(message);
    } finally {
      setQuickCreateLoading(false);
    }
  };

  // Final submit appointment
  const handleSaveAppointment = async () => {
    if (!selectedPatient) {
      setFormError('Выберите пациента на шаге 1');
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const checklistText = [
      chkMri ? 'Снимки МРТ/КТ с собой' : '',
      chkHydration ? 'Водный баланс перед PRP' : '',
      chkShoes ? 'Закрытая обувь для стелек' : '',
      chkAnticoagulants ? 'Контроль антикоагулянтов' : ''
    ]
      .filter(Boolean)
      .join('; ');

    const fullNotes = [clinicalNotes, checklistText ? `[Чек-лист: ${checklistText}]` : '']
      .filter(Boolean)
      .join(' | ');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/scheduling/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          doctor_id: selectedDoctorId,
          operation_id: selectedOperationId,
          appointment_date: appointmentDate,
          start_time: selectedSlotTime,
          duration_minutes: customDuration,
          room_number: selectedDoctorId === 2 ? 'Кабинет №1 (Добрушкин)' : 'Кабинет №2 (Петров)',
          joint_area: selectedJoint,
          urgency_level: urgencyLevel,
          notes: fullNotes,
          notification_channel: notifChannel
        })
      });
      const data = await res.json();
      if (data.success && data.appointmentId) {
        onSuccess(data.appointmentId);
      } else {
        setFormError(data.error || 'Не удалось создать запись');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Сетевая ошибка';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOpObj = CLINICAL_PROCEDURES.find((p) => p.id === selectedOperationId);
  const selectedDocObj = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            boxShadow: '0 24px 48px rgba(15, 60, 100, 0.16)',
            overflow: 'hidden'
          }
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: '#0F3C64',
          color: '#FFFFFF',
          py: 2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MedicalServicesIcon sx={{ fontSize: 26, color: '#38BDF8' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Мастер предварительной записи (Scheduling Wizard 2.0)
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Центр Ортопедии и Травматологии Добрушкина · Сочи, ул. Транспортная 65, 3 этаж
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Закрыть мастер" arrow>
          <IconButton onClick={onClose} sx={{ color: '#FFFFFF' }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      {/* Stepper */}
      <Box sx={{ bgcolor: '#F8FAFC', px: 3, py: 2, borderBottom: '1px solid #E2E8F0' }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label, index) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: '0.8rem',
                    fontWeight: activeStep === index ? 700 : 500,
                    color: activeStep === index ? '#0F3C64' : '#64748B'
                  },
                  '& .Mui-active': { color: '#0F3C64' },
                  '& .Mui-completed': { color: '#16A34A' }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content Area */}
      <DialogContent sx={{ p: 3, minHeight: 380 }}>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        )}

        {/* ----------------- STEP 0: PATIENT SELECTION ----------------- */}
        {activeStep === 0 && (
          <Box>
            <Tabs
              value={patientMode}
              onChange={(_, val) => setPatientMode(val)}
              sx={{
                mb: 2.5,
                borderBottom: '1px solid #E2E8F0',
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }
              }}
            >
              <Tab
                icon={<PersonSearchIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                value="search"
                label="Поиск в картотеке (61k пациентов)"
              />
              <Tab
                icon={<PersonAddIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                value="create"
                label="Быстрая регистрация нового пациента"
              />
            </Tabs>

            {patientMode === 'search' ? (
              <Box>
                <Autocomplete
                  options={patientOptions}
                  getOptionLabel={(option) =>
                    `${option.full_name} (${option.age || '—'} лет, карта №${option.mednum})`
                  }
                  loading={patientSearching}
                  onInputChange={(_, value) => setPatientSearchTerm(value)}
                  onChange={(_, value) => setSelectedPatient(value)}
                  value={selectedPatient}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Введите ФИО, телефон или номер карты ЭМК"
                      placeholder="Например: Добрушкин, 189-13-62 или 1054"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {patientSearching ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps?.endAdornment}
                          </>
                        )
                      }}
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                {selectedPatient ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: '#F0F9FF',
                      borderColor: '#BAE6FD',
                      borderRadius: '12px'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0369A1' }}>
                        {selectedPatient.full_name}
                      </Typography>
                      <Chip
                        icon={<BadgeIcon />}
                        label={`ЭМК № ${selectedPatient.mednum}`}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, color: '#334155', fontSize: '0.875rem' }}>
                      <Typography variant="body2">
                        <strong>Возраст:</strong> {selectedPatient.age ? `${selectedPatient.age} лет` : '—'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Телефон:</strong> {selectedPatient.sphone || 'Не указан'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Полис ДМС:</strong> {selectedPatient.dms_insurer || 'Физическое лицо'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Всего визитов:</strong> {selectedPatient.total_visits || 0}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Последний визит:</strong> {selectedPatient.last_visit_date || 'Впервые'}
                      </Typography>
                    </Box>
                  </Paper>
                ) : (
                  <Typography variant="body2" sx={{ color: '#64748B', textAlign: 'center', py: 4 }}>
                    Начните ввод фамилии или телефона для мгновенного поиска по клинической базе пациентов.
                  </Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="ФИО пациента полностью *"
                  placeholder="Иванов Иван Иванович"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  fullWidth
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Мобильный телефон *"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    sx={{ flex: 1.5 }}
                  />
                  <TextField
                    label="Дата рождения"
                    type="date"
                    value={newPatientBdate}
                    onChange={(e) => setNewPatientBdate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Возраст (лет)"
                    type="number"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(e.target.value)}
                    sx={{ width: 110 }}
                  />
                </Box>
                <RadioGroup
                  row
                  value={newPatientSex}
                  onChange={(e) => setNewPatientSex(e.target.value as 'Мужской' | 'Женский')}
                >
                  <FormControlLabel value="Мужской" control={<Radio />} label="Мужской" />
                  <FormControlLabel value="Женский" control={<Radio />} label="Женский" />
                </RadioGroup>
                <Button
                  variant="contained"
                  onClick={handleQuickCreatePatient}
                  disabled={quickCreateLoading}
                  sx={{ alignSelf: 'flex-start', bgcolor: '#0F3C64' }}
                >
                  {quickCreateLoading ? 'Создание ЭМК...' : 'Сохранить карту и продолжить'}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* ----------------- STEP 1: JOINT & PROCEDURE ----------------- */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              1. Выберите анатомическую зону поражения:
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gap: 1.5,
                mb: 3
              }}
            >
              {JOINT_AREAS.map((j) => {
                const isSelected = selectedJoint === j.id;
                return (
                  <Paper
                    key={j.id}
                    onClick={() => setSelectedJoint(j.id)}
                    elevation={isSelected ? 3 : 0}
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: isSelected ? '#0F3C64' : '#E2E8F0',
                      bgcolor: isSelected ? '#F0F9FF' : '#FFFFFF',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover': { borderColor: '#0F3C64', transform: 'translateY(-2px)' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 24 }}>{j.icon}</Typography>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                          {j.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.2 }}>
                          {j.hint}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              2. Выберите медицинскую услугу из прейскуранта:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {CLINICAL_PROCEDURES.map((p) => {
                const isSelected = selectedOperationId === p.id;
                return (
                  <Paper
                    key={p.id}
                    onClick={() => {
                      setSelectedOperationId(p.id);
                      setCustomDuration(p.duration);
                    }}
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isSelected ? '#0F3C64' : '#E2E8F0',
                      bgcolor: isSelected ? '#EFF6FF' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      '&:hover': { bgcolor: '#F8FAFC' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Radio checked={isSelected} sx={{ p: 0 }} />
                      <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, color: '#1E293B' }}>
                        {p.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={`${p.duration} мин`}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', minWidth: 70 }}>
                        {p.price.toLocaleString('ru-RU')} ₽
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                Срочность обращения:
              </Typography>
              <Chip
                label="Плановый приём"
                color={urgencyLevel === 'routine' ? 'primary' : 'default'}
                onClick={() => setUrgencyLevel('routine')}
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label="Острая боль / Травма"
                color={urgencyLevel === 'urgent' ? 'error' : 'default'}
                onClick={() => setUrgencyLevel('urgent')}
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label="Послеоперационный"
                color={urgencyLevel === 'post_op' ? 'secondary' : 'default'}
                onClick={() => setUrgencyLevel('post_op')}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Box>
        )}

        {/* ----------------- STEP 2: DOCTOR & TIME SLOT ----------------- */}
        {activeStep === 2 && (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              {/* Doctor picker */}
              <Box sx={{ flex: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
                  Лечащий врач:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {doctors.map((doc) => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <Paper
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          borderRadius: '10px',
                          border: '2px solid',
                          borderColor: isSelected ? '#0F3C64' : '#E2E8F0',
                          bgcolor: isSelected ? '#F0F9FF' : '#FFFFFF',
                          '&:hover': { borderColor: '#0F3C64' }
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                          {doc.full_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                          {doc.role} · {doc.roomNumber}
                        </Typography>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>

              {/* Date Picker */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
                  Дата приёма:
                </Typography>
                <TextField
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setAppointmentDate(new Date().toISOString().slice(0, 10))}
                  sx={{ mt: 1, textTransform: 'none' }}
                >
                  Сегодня
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    setAppointmentDate(d.toISOString().slice(0, 10));
                  }}
                  sx={{ mt: 1, ml: 1, textTransform: 'none' }}
                >
                  Завтра
                </Button>
              </Box>
            </Box>

            {/* Slots Grid */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              Доступные слоты приёма (длительность {customDuration} мин):
            </Typography>

            {slotsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(4, 1fr)', sm: 'repeat(6, 1fr)', md: 'repeat(8, 1fr)' },
                  gap: 1,
                  maxHeight: 180,
                  overflowY: 'auto',
                  p: 1,
                  bgcolor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0'
                }}
              >
                {slots.map((slot) => {
                  const isSelected = selectedSlotTime === slot.time;
                  let bg = '#FFFFFF';
                  let color = '#0F3C64';
                  let border = '1px solid #CBD5E1';
                  let cursor = 'pointer';

                  if (!slot.isAvailable) {
                    if (slot.isBuffer) {
                      bg = '#FEF3C7';
                      color = '#92400E';
                      cursor = 'not-allowed';
                    } else {
                      bg = '#FEE2E2';
                      color = '#991B1B';
                      cursor = 'not-allowed';
                    }
                  } else if (isSelected) {
                    bg = '#0F3C64';
                    color = '#FFFFFF';
                    border = '1px solid #0F3C64';
                  }

                  return (
                    <Tooltip
                      key={slot.time}
                      title={
                        !slot.isAvailable
                          ? slot.isBuffer
                            ? 'Санобработка / Буфер 15 мин'
                            : 'Занято другим пациентом'
                          : `Свободно: ${slot.time} — ${slot.endTime}`
                      }
                      arrow
                    >
                      <Box
                        onClick={() => {
                          if (slot.isAvailable) setSelectedSlotTime(slot.time);
                        }}
                        sx={{
                          py: 0.75,
                          px: 1,
                          textAlign: 'center',
                          borderRadius: '8px',
                          bgcolor: bg,
                          color: color,
                          border: border,
                          cursor: cursor,
                          fontWeight: isSelected ? 700 : 600,
                          fontSize: '0.85rem',
                          transition: 'all 0.1s ease',
                          '&:hover': slot.isAvailable ? { transform: 'scale(1.05)' } : {}
                        }}
                      >
                        {slot.time}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* ----------------- STEP 3: CLINICAL CHECKLIST ----------------- */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              Клинический чек-лист администратора регистратуры:
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
              Отметьте предупреждения, проговорённые пациенту во время телефонного звонка или очного приёма:
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', mb: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={<Checkbox checked={chkMri} onChange={(e) => setChkMri(e.target.checked)} />}
                  label="Пациент предупреждён взять имеющиеся снимки МРТ, КТ или рентгенограммы сустава"
                />
                <FormControlLabel
                  control={<Checkbox checked={chkHydration} onChange={(e) => setChkHydration(e.target.checked)} />}
                  label="Перед процедурой PRP/плазмотерапии: соблюдён водный баланс (1-1.5 л воды), исключена жирная пища"
                />
                <FormControlLabel
                  control={<Checkbox checked={chkShoes} onChange={(e) => setChkShoes(e.target.checked)} />}
                  label="Перед изготовлением ортопедических стелек: взять повседневную закрытую обувь"
                />
                <FormControlLabel
                  control={
                    <Checkbox checked={chkAnticoagulants} onChange={(e) => setChkAnticoagulants(e.target.checked)} />
                  }
                  label="Проверено отсутствие приёма прямых антикоагулянтов в день инвазивной манипуляции"
                />
              </Box>
            </Paper>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              Клинические жалобы / Примечание при записи:
            </Typography>
            <TextField
              placeholder="Например: Острая боль в правом колене после беговой тренировки, хруст при разгибании."
              multiline
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              fullWidth
            />
          </Box>
        )}

        {/* ----------------- STEP 4: OMNICHANNEL NOTIFICATION ----------------- */}
        {activeStep === 4 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              Канал отправки подтверждения и электронного талона:
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
              <Chip
                icon={<TelegramIcon />}
                label="Telegram"
                color={notifChannel === 'telegram' ? 'primary' : 'default'}
                onClick={() => setNotifChannel('telegram')}
                sx={{ fontWeight: 600, cursor: 'pointer' }}
              />
              <Chip
                icon={<SecurityIcon />}
                label="MAX Messenger"
                color={notifChannel === 'max' ? 'primary' : 'default'}
                onClick={() => setNotifChannel('max')}
                sx={{ fontWeight: 600, cursor: 'pointer' }}
              />
              <Chip
                icon={<ChatIcon />}
                label="WhatsApp"
                color={notifChannel === 'whatsapp' ? 'primary' : 'default'}
                onClick={() => setNotifChannel('whatsapp')}
                sx={{ fontWeight: 600, cursor: 'pointer' }}
              />
              <Chip
                icon={<SmsIcon />}
                label="SMS"
                color={notifChannel === 'sms' ? 'primary' : 'default'}
                onClick={() => setNotifChannel('sms')}
                sx={{ fontWeight: 600, cursor: 'pointer' }}
              />
            </Box>

            {/* Live Message Preview */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>
              Живой макет сообщения (как увидит пациент в {notifChannel.toUpperCase()}):
            </Typography>

            <Paper
              sx={{
                p: 2,
                borderRadius: '14px',
                bgcolor: notifChannel === 'telegram' ? '#EFF6FF' : notifChannel === 'max' ? '#F0FDF4' : '#F8FAFC',
                border: '1px solid',
                borderColor:
                  notifChannel === 'telegram' ? '#BFDBFE' : notifChannel === 'max' ? '#BBF7D0' : '#E2E8F0',
                maxWidth: 480,
                mb: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {notifChannel === 'telegram' ? (
                  <TelegramIcon sx={{ color: '#2563EB' }} />
                ) : notifChannel === 'max' ? (
                  <SecurityIcon sx={{ color: '#16A34A' }} />
                ) : (
                  <MedicalServicesIcon sx={{ color: '#0F3C64' }} />
                )}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  Центр Ортопедии Добрушкина
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#1E293B', mb: 2 }}>
                Здравствуйте, <strong>{selectedPatient?.full_name}</strong>!{'\n'}
                Вы записаны на приём: <strong>{appointmentDate}</strong> в <strong>{selectedSlotTime}</strong>.{'\n'}
                Врач: <strong>{selectedDocObj?.full_name}</strong> ({selectedDocObj?.roomNumber}).{'\n'}
                Услуга: {selectedOpObj?.name}.{'\n'}
                Стоимость: <strong>{selectedOpObj?.price.toLocaleString('ru-RU')} ₽</strong>.{'\n'}
                Адрес клиники: г. Сочи, ул. Транспортная 65, 3 этаж.
              </Typography>

              {/* Interactive buttons mockup */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  sx={{
                    bgcolor: '#16A34A',
                    fontSize: '0.75rem',
                    py: 0.5,
                    px: 1.5,
                    '&:hover': { bgcolor: '#15803D' }
                  }}
                >
                  ✅ Подтверждаю
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5 }}
                >
                  🔄 Перенести
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5 }}
                >
                  ❌ Отменить
                </Button>
              </Box>
            </Paper>

            <Divider sx={{ my: 2 }} />

            {/* Summary card */}
            <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Итоговый бланк бронирования:
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155' }}>
                Пациент: <strong>{selectedPatient?.full_name}</strong> (карта №{selectedPatient?.mednum}) · Врач:{' '}
                <strong>{selectedDocObj?.full_name}</strong> · Время: <strong>{selectedSlotTime}</strong> (
                {customDuration} мин) · Услуга: {selectedOpObj?.name}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Footer Navigation */}
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose} sx={{ color: '#64748B' }}>
          Отмена
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep((prev) => prev - 1)} sx={{ mr: 1, color: '#0F3C64' }}>
            Назад
          </Button>
        )}
        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="contained"
            onClick={() => {
              if (activeStep === 0 && !selectedPatient) {
                setFormError('Пожалуйста, выберите пациента из базы или зарегистрируйте нового');
                return;
              }
              setFormError(null);
              setActiveStep((prev) => prev + 1);
            }}
            sx={{ bgcolor: '#0F3C64' }}
          >
            Далее
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleSaveAppointment}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutlinedIcon />}
            sx={{ px: 3, fontWeight: 700 }}
          >
            {submitting ? 'Запись в базу...' : 'Записать пациента и отправить уведомление'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
