import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import type { JointExamState } from '../ortho/JointExamCard';
import { parseProtocolContent } from '../../utils/protocolXmlParser';
import LatexText from '../ortho/LatexText';

export interface OrthoPrescriptionItem {
  id?: string | number;
  serviceId?: number;
  serviceCode?: string;
  code?: string;
  name: string;
  title?: string;
  category?: string;
  quantity?: number;
  price?: number;
  unitPrice?: number;
  dosage_notes?: string;
  [key: string]: any;
}

export interface OrthoProtocolData {
  protocolNumber?: string | number;
  visitDate?: string | Date;
  doctorName?: string;
  doctorRole?: string;
  doctorSpecialization?: string;
  patient: {
    id?: number;
    fullName: string;
    birthDate?: string;
    gender?: string;
    phone?: string;
    cardNum?: string;
  };
  complaints: string;
  anamnesis: string;
  anamnesisVitae?: string;
  objectiveStatus?: string;
  specialStudies?: string;
  performedManipulations?: string;
  activeSectionsMask?: Record<string, boolean> | string;
  vasScore: number;
  gait?: string;
  posture?: string;
  jointExams: JointExamState[];
  icdCode?: string;
  icdName?: string;
  clinicalDiagnosis: string;
  recommendations: string;
  prescriptions: OrthoPrescriptionItem[];
  systemicStatus?: {
    bloodPressure?: string;
    heartRate?: number;
    spo2?: number;
    allergies?: string;
  };
  diagnosticsData?: string;
  performedProcedures?: Array<{ procedureName: string; targetJoint?: string }>;
  physioProtocol?: Array<{ modality: string; targetZone?: string; sessionsCount?: number; parameters?: string }>;
  orthoticsPrescriptions?: Array<{ deviceType: string; wearRegime?: string }>;
  nextVisitDate?: string;
  isSigned?: boolean;
  signedAt?: string;
  signatureHash?: string;
}

export interface OrthoProtocolPrintTemplateProps {
  data: OrthoProtocolData;
  highlightedPartition?: number | null;
}

export const OrthoProtocolPrintTemplate = React.forwardRef<HTMLDivElement, OrthoProtocolPrintTemplateProps>(
  ({ data, highlightedPartition }, ref) => {
    const dateObj = data.visitDate ? new Date(data.visitDate) : new Date();
    const dateStr = dateObj.toLocaleDateString('ru-RU');
    const timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Defensive parsing of historical XML content if present
    const parsedDiagObj = data.clinicalDiagnosis && data.clinicalDiagnosis.includes('<item') ? parseProtocolContent(data.clinicalDiagnosis) : null;
    const cleanDiagnosis = parsedDiagObj ? (parsedDiagObj.diagnosis || parsedDiagObj.formattedFullText) : data.clinicalDiagnosis;
    const cleanComplaints = data.complaints && data.complaints.includes('<item') ? parseProtocolContent(data.complaints).complaints || data.complaints : data.complaints;
    const cleanAnamnesis = data.anamnesis && data.anamnesis.includes('<item') ? parseProtocolContent(data.anamnesis).anamnesis || data.anamnesis : data.anamnesis;

    const totalServicesCost = data.prescriptions?.reduce(
      (sum, p) => sum + ((p.price || 0) * (p.quantity || 1)),
      0
    ) || 0;

    const getAxisLabel = (axis: string) => {
      if (axis === 'valgus') return 'Вальгусная (X-образная)';
      if (axis === 'varus') return 'Варусная (O-образная)';
      return 'Правильная, физиологическая';
    };

    const getEffusionLabel = (grade: number) => {
      if (grade === 1) return 'I ст. (незначительный, сглаженность контуров)';
      if (grade === 2) return 'II ст. (умеренный, баллотирование надколенника)';
      if (grade === 3) return 'III ст. (выраженный напряженный выпот)';
      return 'Отсутствует (0)';
    };

    const getSideLabel = (side: string) => {
      if (side === 'left') return 'Слева';
      if (side === 'right') return 'Справа';
      return 'С обеих сторон (Bilateral)';
    };

    const getJointTitle = (jointArea: string) => {
      const map: Record<string, string> = {
        'knee_r': 'Правый коленный сустав',
        'knee_l': 'Левый коленный сустав',
        'knee_right': 'Правый коленный сустав',
        'knee_left': 'Левый коленный сустав',
        'hip_r': 'Правый тазобедренный сустав',
        'hip_l': 'Левый тазобедренный сустав',
        'hip_right': 'Правый тазобедренный сустав',
        'hip_left': 'Левый тазобедренный сустав',
        'shoulder_r': 'Правый плечевой сустав',
        'shoulder_l': 'Левый плечевой сустав',
        'shoulder_right': 'Правый плечевой сустав',
        'shoulder_left': 'Левый плечевой сустав',
        'elbow_r': 'Правый локтевой сустав',
        'elbow_l': 'Левый локтевой сустав',
        'elbow_right': 'Правый локтевой сустав',
        'elbow_left': 'Левый локтевой сустав',
        'wrist_r': 'Правый лучезапястный сустав и кисть',
        'wrist_l': 'Левый лучезапястный сустав и кисть',
        'wrist_right': 'Правый лучезапястный сустав и кисть',
        'wrist_left': 'Левый лучезапястный сустав и кисть',
        'foot_r': 'Правая стопа и голеностоп',
        'foot_l': 'Левая стопа и голеностоп',
        'foot_right': 'Правый голеностопный сустав и стопа',
        'foot_left': 'Левый голеностопный сустав и стопа',
        'spine_c': 'Шейный отдел позвоночника',
        'spine_th': 'Грудной отдел позвоночника',
        'spine_l': 'Пояснично-крестцовый отдел позвоночника',
        'spine_cervical': 'Шейный отдел позвоночника',
        'spine_thoracic': 'Грудной отдел позвоночника',
        'spine_lumbar': 'Пояснично-крестцовый отдел позвоночника'
      };
      return map[jointArea] || jointArea;
    };

    const getTestLabel = (testKey: string, result: string) => {
      const names: Record<string, string> = {
        // Knee
        lachman: 'Тест Лахмана (Lachman)',
        anterior_drawer: 'Передний выдвижной ящик',
        posterior_drawer: 'Задний выдвижной ящик',
        pivot_shift: 'Pivot-Shift тест',
        mcmurray: 'Тест МакМюррея (McMurray)',
        appley: 'Тест Эпли (Apley)',
        patella_ballottement: 'Баллотирование надколенника',
        patella_grind: 'Симптом скольжения надколенника',
        patella_apprehension: 'Тест тревоги надколенника',
        // Elbow
        cozen: 'Тест Козена (латеральный эпикондилит)',
        mill: 'Тест Милля (натяжение разгибателей)',
        golfer: 'Тест локтя гольфиста (медиальный эпикондилит)',
        tinel_cubital: 'Симптом Тиннеля (кубитальный канал)',
        valgus_stress_elbow: 'Вальгус-стресс тест локтя (UCL)',
        varus_stress_elbow: 'Варус-стресс тест локтя (LCL)',
        // Shoulder
        neer: 'Тест Нира (Neer)',
        hawkins: 'Тест Хокинса (Hawkins)',
        speed: 'Тест Спида (Speed)',
        yergason: 'Тест Йергасона (Yergason)',
        empty_can: 'Тест "Пустой банки" (Jobe)',
        empty_can_jobe: 'Тест Джобса (Jobe)',
        drop_arm: 'Тест падающей руки (Drop arm)',
        apprehension: 'Тест предчувствия вывиха (Apprehension)',
        // Hip
        faber: 'Тест FABER (Патрика)',
        fadir: 'Тест FADIR',
        thomas: 'Тест Томаса',
        trendelenburg: 'Симптом Тренделенбурга',
        // Wrist
        phalen: 'Тест Фалена (карпальный канал)',
        tinel_wrist: 'Симптом Тиннеля на запястье',
        finkelstein: 'Тест Финкельштейна (де Кервен)',
        piano_key: 'Симптом клавиши пианино (DRUJ)',
        // Ankle
        anterior_drawer_ankle: 'Передний ящик голеностопа',
        talar_tilt: 'Наклон таранной кости',
        thompson: 'Тест Томпсона (ахилл)',
        windlass: 'Тест Виндласса (плантарная фасция)',
        // Spine
        lasegue: 'Симптом Ласега (Lasegue)',
        wassermann: 'Симптом Вассермана',
        adams: 'Проба Адамса (сколиоз)',
        risser_sign: 'Тест Риссера (костная зрелость)',
        radicular: 'Корешковый синдром',
        spurling: 'Тест Сперлинга (Spurling)',
        schober: 'Тест Шобера'
      };

      const resultNames: Record<string, string> = {
        negative: 'Отрицательный (-)',
        positive: 'Положительный (+)',
        positive_medial: 'Полож. медиально (+)',
        positive_lateral: 'Полож. латерально (+)'
      };

      return `${names[testKey] || testKey}: ${resultNames[result] || result}`;
    };

    return (
      <Box
        ref={ref}
        sx={{
          p: { xs: 2, sm: 3 },
          width: '100%',
          maxWidth: '840px',
          mx: 'auto',
          bgcolor: '#FFFFFF',
          color: '#1A2027',
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          boxSizing: 'border-box',
          '@media print': {
            p: '2mm 4mm !important',
            maxWidth: '100% !important',
            width: '100% !important',
            boxShadow: 'none !important'
          }
        }}
      >
        {/* CLINIC HEADER */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2.5px solid #0F3C64',
            pb: 1.5,
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <img
              src="/MainLogoTransparent.png"
              alt="Центр Ортопедии и Травматологии"
              style={{ width: 56, height: 56, objectFit: 'contain' }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: '#0F3C64',
                  lineHeight: 1.15,
                  fontSize: '1.15rem'
                }}
              >
                Центр Ортопедии и Травматологии
              </Typography>
              <Typography variant="caption" sx={{ color: '#4A5568', display: 'block', fontSize: '0.78rem' }}>
                г. Сочи • Тел. +7 (862) 295-00-55
              </Typography>
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.72rem' }}>
                Лицензия на осуществление медицинской деятельности ЛО-23-01-014522
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontSize: '0.75rem' }}>
              Дата и время приема:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1A2027', fontSize: '0.88rem' }}>
              {dateStr} {timeStr}
            </Typography>
            {data.protocolNumber && (
              <Typography variant="caption" sx={{ color: '#0F3C64', fontWeight: 600, display: 'block' }}>
                Протокол № {data.protocolNumber}
              </Typography>
            )}
          </Box>
        </Box>

        {/* REPORT TITLE */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#0F3C64',
              letterSpacing: '-0.2px',
              fontSize: '1.25rem',
              textTransform: 'uppercase'
            }}
          >
            Протокол консультативного приема травматолога-ортопеда
          </Typography>
        </Box>

        {/* PATIENT & DOCTOR INFO CARD */}
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 2,
            bgcolor: '#F8FAFC',
            borderColor: '#CBD5E1',
            borderRadius: 1.5
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontSize: '0.86rem' }}>
                <Box component="span" sx={{ fontWeight: 700, color: '#475569' }}>Пациент: </Box>
                <Box component="span" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.94rem' }}>
                  {data.patient?.fullName}
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3 }}>
                Дата рождения: {data.patient?.birthDate || 'Не указана'}
                {data.patient?.gender ? ` • Пол: ${data.patient.gender}` : ''}
                {data.patient?.phone ? ` • Тел: ${data.patient.phone}` : ''}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontSize: '0.86rem' }}>
                <Box component="span" sx={{ fontWeight: 700, color: '#475569' }}>Врач: </Box>
                <Box component="span" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  {data.doctorName || 'Врач травматолог-ортопед'}
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3 }}>
                {data.doctorSpecialization || data.doctorRole || 'Врач травматолог-ортопед'}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {(() => {
          const getPartitionSx = (pNum: number) => ({
            mb: 2,
            p: 1.25,
            borderRadius: 1.5,
            transition: 'all 0.3s ease-in-out',
            bgcolor: highlightedPartition === pNum ? '#F0F9FF' : 'transparent',
            border: highlightedPartition === pNum ? '2px solid #0284C7' : '1px solid transparent',
            boxShadow: highlightedPartition === pNum ? '0 0 14px rgba(2, 132, 199, 0.28)' : 'none',
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important'
          });

          const renderSyncBadge = (pNum: number) => {
            if (highlightedPartition !== pNum) return null;
            return (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: '#0284C7',
                  color: '#FFFFFF',
                  px: 1,
                  py: 0.2,
                  borderRadius: 1,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  float: 'right',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                }}
              >
                ● Синхронизировано из шаблона [Секция #{pNum}]
              </Box>
            );
          };

          const manipulationsPrescriptions = data.prescriptions?.filter(p => p.category === 'manipulation' || p.category === 'манипуляция') || [];
          const physioPrescriptions = data.prescriptions?.filter(p => p.category === 'physio' || p.category === 'физиотерапия') || [];
          const orthoticsPrescriptions = data.prescriptions?.filter(p => p.category === 'orthotics' || p.category === 'ортопедия') || [];
          const lfkPrescriptions = data.prescriptions?.filter(p => p.category === 'lfk' || p.category === 'ЛФК') || [];
          const diagnosticsPrescriptions = data.prescriptions?.filter(p => p.category === 'diagnostics' || p.category === 'диагностика') || [];

          return (
            <>
              {/* 1. ЖАЛОБЫ, АНАМНЕЗ И СОМАТИЧЕСКИЙ СТАТУС */}
              <Box
                id="protocol-partition-1"
                className="print-section"
                sx={getPartitionSx(1)}
              >
                {renderSyncBadge(1)}
                <Typography
                  variant="subtitle2"
                  className="print-heading"
                  sx={{
                    fontWeight: 800,
                    color: '#0F3C64',
                    borderBottom: '1px solid #E2E8F0',
                    pb: 0.4,
                    mb: 1,
                    pageBreakAfter: 'avoid !important',
                    breakAfter: 'avoid !important'
                  }}
                >
                  1. Жалобы, анамнез и соматический статус
                </Typography>
                <Box sx={{ pl: 1 }}>
                  {/* 1.1 Complaints & VAS */}
                  <Typography variant="body2" sx={{ mb: 0.8, fontSize: '0.86rem', lineHeight: 1.45 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: '#334155' }}>1.1. Жалобы при обращении: </Box>
                    <LatexText text={cleanComplaints || 'Жалоб активно не предъявляет.'} />
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, pl: 2 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                      Интенсивность боли по ВАШ (0-10):
                    </Typography>
                    <Chip
                      label={`${data.vasScore || 0} / 10 баллов`}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        bgcolor: (data.vasScore || 0) >= 7 ? '#FEE2E2' : (data.vasScore || 0) >= 4 ? '#FEF3C7' : '#DCFCE7',
                        color: (data.vasScore || 0) >= 7 ? '#991B1B' : (data.vasScore || 0) >= 4 ? '#92400E' : '#166534',
                        border: '1px solid currentColor'
                      }}
                    />
                  </Box>

                  {/* 1.2 Anamnesis morbi */}
                  {cleanAnamnesis && (
                    <Box sx={{ mb: 0.8 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                        <Box component="span" sx={{ fontWeight: 700, color: '#334155' }}>1.2. Анамнез заболевания (Anamnesis morbi): </Box>
                        <LatexText text={cleanAnamnesis} />
                      </Typography>
                    </Box>
                  )}

                  {/* 1.3 Anamnesis vitae */}
                  {data.anamnesisVitae && (
                    <Box sx={{ mb: 0.8 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                        <Box component="span" sx={{ fontWeight: 700, color: '#334155' }}>1.3. Анамнез жизни и аллергоанамнез (Anamnesis vitae): </Box>
                        <LatexText text={data.anamnesisVitae} />
                      </Typography>
                    </Box>
                  )}

                  {/* 1.4 Objective status */}
                  {data.objectiveStatus && (
                    <Box sx={{ mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                        <Box component="span" sx={{ fontWeight: 700, color: '#334155' }}>1.4. Общий соматический статус (Status praesens): </Box>
                        <LatexText text={data.objectiveStatus} />
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* 2. ОРТОПЕДИЧЕСКИЙ СТАТУС (STATUS LOCALIS) */}
              <Box
                id="protocol-partition-2"
                className="print-section"
                sx={getPartitionSx(2)}
              >
                {renderSyncBadge(2)}
                <Typography
                  variant="subtitle2"
                  className="print-heading"
                  sx={{
                    fontWeight: 800,
                    color: '#0F3C64',
                    borderBottom: '1px solid #E2E8F0',
                    pb: 0.4,
                    mb: 1,
                    pageBreakAfter: 'avoid !important',
                    breakAfter: 'avoid !important'
                  }}
                >
                  2. Ортопедический статус (Status Localis)
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.45, mb: 0.5 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: '#334155' }}>2.1. Походка: </Box>
                    {data.gait || 'Свободная, физиологическая, без хромоты, без дополнительной опоры.'}
                  </Typography>
                  {data.posture && (
                    <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.45, mb: 0.8, pl: 2 }}>
                      <Box component="span" sx={{ fontWeight: 700, color: '#334155' }}>Осанка: </Box>
                      {data.posture}
                    </Typography>
                  )}

                  <Box sx={{ mt: 0.8 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.4 }}>
                      2.2. Локальный ортопедический статус (Status localis):
                    </Typography>
                    {data.jointExams && data.jointExams.length > 0 ? (
                      data.jointExams.map((exam, idx) => (
                        <Box key={idx} sx={{ p: 1, mb: 0.8, bgcolor: '#FAFBFD', borderRadius: 1, border: '1px solid #E2E8F0' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369A1', fontSize: '0.86rem' }}>
                            {getJointTitle(exam.jointArea)} ({getSideLabel(exam.side)})
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Ось: <b>{getAxisLabel(exam.axis)}</b> • Синовит/выпот: <b>{getEffusionLabel(exam.effusion)}</b>
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.84rem' }}>
                        Локальный суставной статус: деформаций и отека не выявлено, контуры суставов сохранены.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* 3. АМПЛИТУДА ДВИЖЕНИЙ (ROM SFTR NEUTRAL-0) */}
              <Box
                id="protocol-partition-3"
                className="print-section"
                sx={getPartitionSx(3)}
              >
                {renderSyncBadge(3)}
                <Typography
                  variant="subtitle2"
                  className="print-heading"
                  sx={{
                    fontWeight: 800,
                    color: '#0F3C64',
                    borderBottom: '1px solid #E2E8F0',
                    pb: 0.4,
                    mb: 1,
                    pageBreakAfter: 'avoid !important',
                    breakAfter: 'avoid !important'
                  }}
                >
                  3. Амплитуда движений (SFTR Neutral-0 ROM)
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.4 }}>
                    3.1. Гониометрия Neutral-0 (SFTR) и дефицит амплитуды:
                  </Typography>
                  {data.jointExams && data.jointExams.length > 0 ? (
                    data.jointExams.map((exam, idx) => (
                      <Box key={idx} sx={{ p: 1, mb: 0.8, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #EEF2F6' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369A1', display: 'block', mb: 0.3 }}>
                          {getJointTitle(exam.jointArea)}:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#1E293B' }}>
                          • Сгибание активное: <b>{exam.rom?.flexion_active ?? 140}°</b> (пассивное: <b>{exam.rom?.flexion_passive ?? 140}°</b>)
                          {exam.rom?.extension_deficit !== undefined && exam.rom.extension_deficit > 0
                            ? ` • Дефицит разгибания: ${exam.rom.extension_deficit}°`
                            : ' • Разгибание: полное (0°)'}
                          {exam.rom?.internal_rotation !== undefined && ` • Внутр. ротация: ${exam.rom.internal_rotation}°`}
                          {exam.rom?.external_rotation !== undefined && ` • Наруж. ротация: ${exam.rom.external_rotation}°`}
                          {exam.rom?.abduction !== undefined && ` • Отведение: ${exam.rom.abduction}°`}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.84rem' }}>
                      Движения во всех плоскостях в физиологическом объеме Neutral-0 (без дефицита разгибания).
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* 4. ПАНЕЛЬ ВАЛИДИРОВАННЫХ ОРТОПЕДИЧЕСКИХ ТЕСТОВ */}
              <Box
                id="protocol-partition-4"
                className="print-section"
                sx={getPartitionSx(4)}
              >
                {renderSyncBadge(4)}
                <Typography
                  variant="subtitle2"
                  className="print-heading"
                  sx={{
                    fontWeight: 800,
                    color: '#0F3C64',
                    borderBottom: '1px solid #E2E8F0',
                    pb: 0.4,
                    mb: 1,
                    pageBreakAfter: 'avoid !important',
                    breakAfter: 'avoid !important'
                  }}
                >
                  4. Панель валидированных ортопедических тестов (Sn, Sp, LR+)
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.4 }}>
                    4.1. Результаты валидированных тестов (Sn, Sp, LR+):
                  </Typography>
                  {data.jointExams && data.jointExams.some(e => e.tests && Object.keys(e.tests).length > 0) ? (
                    data.jointExams.map((exam, idx) => {
                      if (!exam.tests || Object.keys(exam.tests).length === 0) return null;
                      return (
                        <Box key={idx} sx={{ mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.4 }}>
                            {getJointTitle(exam.jointArea)}:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                            {Object.entries(exam.tests).map(([tKey, tRes]) => (
                              <Typography
                                key={tKey}
                                variant="caption"
                                sx={{
                                  fontSize: '0.78rem',
                                  color: tRes !== 'negative' ? '#B91C1C' : '#334155',
                                  fontWeight: tRes !== 'negative' ? 700 : 500,
                                  bgcolor: tRes !== 'negative' ? '#FEF2F2' : '#F1F5F9',
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 0.75,
                                  border: `1px solid ${tRes !== 'negative' ? '#FECACA' : '#E2E8F0'}`
                                }}
                              >
                                {getTestLabel(tKey, tRes)}: <b>{tRes === 'negative' ? 'отрицательный (-)' : 'положительный (+)'}</b>
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.84rem' }}>
                      Специфические нагрузочные и стресс-тесты: клинически значимой нестабильности и менисковых/сухожильных симптомов не выявлено (-).
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* 5. ИНСТРУМЕНТАЛЬНАЯ И ЛАБОРАТОРНАЯ ДИАГНОСТИКА */}
              <Box
                id="protocol-partition-5"
                className="print-section"
                sx={getPartitionSx(5)}
              >
                {renderSyncBadge(5)}
                <Typography
                  variant="subtitle2"
                  className="print-heading"
                  sx={{
                    fontWeight: 800,
                    color: '#0F3C64',
                    borderBottom: '1px solid #E2E8F0',
                    pb: 0.4,
                    mb: 1,
                    pageBreakAfter: 'avoid !important',
                    breakAfter: 'avoid !important'
                  }}
                >
                  5. Инструментальная и лабораторная диагностика
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.4 }}>
                    5.1. Данные выполненных инструментальных исследований:
                  </Typography>
                  {data.specialStudies ? (
                    <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.45, whiteSpace: 'pre-line', mb: 0.8 }}>
                      <LatexText text={data.specialStudies} />
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.84rem', mb: 0.8 }}>
                      Данные предварительных рентгенограмм, МРТ и лабораторных анализов изучены и внесены в карту.
                    </Typography>
                  )}
                  {diagnosticsPrescriptions.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.3 }}>
                        5.2. Назначенная инструментальная и лабораторная диагностика:
                      </Typography>
                      {diagnosticsPrescriptions.map((dp, dIdx) => (
                        <Typography key={dIdx} variant="body2" sx={{ fontSize: '0.82rem', pl: 1 }}>
                          • {dp.name || dp.title}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* 6. КЛИНИЧЕСКИЙ ДИАГНОЗ И МКБ-10 */}
              <Box
                id="protocol-partition-6"
                className="print-section"
                sx={getPartitionSx(6)}
              >
                {renderSyncBadge(6)}
                <Typography
                  variant="subtitle2"
                  className="print-heading"
                  sx={{
                    fontWeight: 800,
                    color: '#0F3C64',
                    borderBottom: '1px solid #E2E8F0',
                    pb: 0.4,
                    mb: 1,
                    pageBreakAfter: 'avoid !important',
                    breakAfter: 'avoid !important'
                  }}
                >
                  6. Клинический диагноз и МКБ-10
                </Typography>
                <Box sx={{ pl: 1 }}>
                  {data.icdCode && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                        6.1. Код диагноза:
                      </Typography>
                      <Chip
                        label={`МКБ-10: ${data.icdCode}`}
                        size="small"
                        sx={{ fontWeight: 800, bgcolor: '#0284C7', color: '#FFFFFF', fontSize: '0.78rem' }}
                      />
                      {data.icdName && (
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontSize: '0.84rem' }}>
                          <LatexText text={data.icdName} />
                        </Typography>
                      )}
                    </Box>
                  )}
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.2 }}>
                      6.2. Развернутый клинический диагноз:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem', lineHeight: 1.45 }}>
                      <LatexText text={cleanDiagnosis || 'Клинический диагноз устанавливается.'} />
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* 7. ВЫПОЛНЕННЫЕ МАНИПУЛЯЦИИ И ИНЪЕКЦИОННАЯ ТЕРАПИЯ */}
              <Box
                id="protocol-partition-7"
                className="print-section"
                sx={getPartitionSx(7)}
              >
                {renderSyncBadge(7)}
                <Typography
                  variant="subtitle2"
                  className="print-heading"
                  sx={{
                    fontWeight: 800,
                    color: '#0F3C64',
                    borderBottom: '1px solid #E2E8F0',
                    pb: 0.4,
                    mb: 1,
                    pageBreakAfter: 'avoid !important',
                    breakAfter: 'avoid !important'
                  }}
                >
                  7. Выполненные манипуляции и инъекционная терапия
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.4 }}>
                    7.1. Протокол выполненных манипуляций на приёме:
                  </Typography>
                  {data.performedManipulations ? (
                    <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.45, whiteSpace: 'pre-line', mb: 0.8 }}>
                      <LatexText text={data.performedManipulations} />
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.84rem', mb: 0.8 }}>
                      Лечебно-медикаментозные блокады и пункции на текущем приеме: по клиническим показаниям.
                    </Typography>
                  )}
                  {manipulationsPrescriptions.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369A1', display: 'block', mb: 0.3 }}>
                        7.2. Назначено к выполнению:
                      </Typography>
                      {manipulationsPrescriptions.map((mp, mIdx) => (
                        <Typography key={mIdx} variant="body2" sx={{ fontSize: '0.82rem', pl: 1 }}>
                          • {mp.name || mp.title} {mp.dosage_notes ? `(${mp.dosage_notes})` : ''} — {mp.quantity || 1} проц.
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* 8. ФИЗИОТЕРАПИЯ И АППАРАТНАЯ БИОМЕХАНИЧЕСКАЯ ТЕРАПИЯ */}
              <Box
                id="protocol-partition-8"
                className="print-section"
                sx={getPartitionSx(8)}
              >
                {renderSyncBadge(8)}
                <Typography
                  variant="subtitle2"
                  className="print-heading"
                  sx={{
                    fontWeight: 800,
                    color: '#0F3C64',
                    borderBottom: '1px solid #E2E8F0',
                    pb: 0.4,
                    mb: 1,
                    pageBreakAfter: 'avoid !important',
                    breakAfter: 'avoid !important'
                  }}
                >
                  8. Физиотерапия и аппаратная биомеханическая терапия
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.4 }}>
                    8.1. Назначенные курсы доказательной физиотерапии (EBM P1 / P2):
                  </Typography>
                  {physioPrescriptions.length > 0 ? (
                    <Box>
                      {physioPrescriptions.map((pp, pIdx) => (
                        <Typography key={pIdx} variant="body2" sx={{ fontSize: '0.84rem', mb: 0.4 }}>
                          • <b>{pp.name || pp.title}</b>: {pp.quantity || 1} сеансов {pp.dosage_notes ? `— ${pp.dosage_notes}` : ''}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.84rem' }}>
                      Курс аппаратной терапии (HILT лазер, SIS магнитотерапия, УВТ) определяется фазой воспаления.
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* 9. ОРТОПЕДИЧЕСКИЕ ИЗДЕЛИЯ И РАЗГРУЗКА СУСТАВОВ */}
              <Box
                id="protocol-partition-9"
                className="print-section"
                sx={getPartitionSx(9)}
              >
                {renderSyncBadge(9)}
                <Typography
                  variant="subtitle2"
                  className="print-heading"
                  sx={{
                    fontWeight: 800,
                    color: '#0F3C64',
                    borderBottom: '1px solid #E2E8F0',
                    pb: 0.4,
                    mb: 1,
                    pageBreakAfter: 'avoid !important',
                    breakAfter: 'avoid !important'
                  }}
                >
                  9. Ортопедические изделия и разгрузка суставов
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.4 }}>
                    9.1. Назначенные ортопедические изделия и средства разгрузки:
                  </Typography>
                  {orthoticsPrescriptions.length > 0 ? (
                    <Box>
                      {orthoticsPrescriptions.map((op, oIdx) => (
                        <Typography key={oIdx} variant="body2" sx={{ fontSize: '0.84rem', mb: 0.4 }}>
                          • <b>{op.name || op.title}</b> {op.dosage_notes ? `— ${op.dosage_notes}` : ''}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.84rem' }}>
                      Ортопедический режим: физиологическая нагрузка, подбор ортезов/стелек по показаниям.
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* 10. ЛЕЧЕБНАЯ ФИЗКУЛЬТУРА (ЛФК), РЕАБИЛИТАЦИЯ И НАЗНАЧЕНИЯ */}
              <Box
                id="protocol-partition-10"
                className="print-section"
                sx={getPartitionSx(10)}
              >
                {renderSyncBadge(10)}
                <Typography
                  variant="subtitle2"
                  className="print-heading"
                  sx={{
                    fontWeight: 800,
                    color: '#0F3C64',
                    borderBottom: '1px solid #E2E8F0',
                    pb: 0.4,
                    mb: 1,
                    pageBreakAfter: 'avoid !important',
                    breakAfter: 'avoid !important'
                  }}
                >
                  10. Лечебная физкультура (ЛФК), реабилитация и рекомендации
                </Typography>
                <Box sx={{ pl: 1 }}>
                  {lfkPrescriptions.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#047857', display: 'block', mb: 0.3 }}>
                        10.1. Комплексы лечебной физкультуры (ЛФК) и кинезиотерапии:
                      </Typography>
                      {lfkPrescriptions.map((lp, lIdx) => (
                        <Typography key={lIdx} variant="body2" sx={{ fontSize: '0.82rem', pl: 1 }}>
                          • {lp.name || lp.title} {lp.dosage_notes ? `— ${lp.dosage_notes}` : ''}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {data.recommendations && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.3 }}>
                        10.2. Рекомендации, медикаментозное лечение и охранительный режим:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                        <LatexText text={data.recommendations} />
                      </Typography>
                    </Box>
                  )}

                  {/* Complete Prescribed Services Table */}
                  {data.prescriptions && data.prescriptions.length > 0 && (
                    <Box sx={{ mt: 1.5, mb: 1.5 }}>
                      <Typography variant="caption" className="print-heading" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5, pageBreakAfter: 'avoid !important', breakAfter: 'avoid !important' }}>
                        10.3. Сводный реестр назначенных медицинских услуг и процедур:
                      </Typography>
                      <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{
                          borderColor: '#E2E8F0',
                          overflow: 'visible !important',
                          pageBreakInside: 'auto',
                          breakInside: 'auto'
                        }}
                      >
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#F1F5F9', display: 'table-header-group !important' }}>
                            <TableRow sx={{ pageBreakInside: 'avoid !important', breakInside: 'avoid !important' }}>
                              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', py: 0.5 }}>№</TableCell>
                              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', py: 0.5 }}>Наименование услуги / манипуляции</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem', py: 0.5 }}>Кол-во</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem', py: 0.5 }}>Стоимость, руб.</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.prescriptions.map((presc, pIdx) => {
                              const isLfk = presc.category === 'lfk' || presc.category === 'ЛФК';
                              const itemPrice = Number(presc.price ?? (presc as any).unitPrice ?? (presc as any).unit_price ?? 0);
                              const itemQty = Number(presc.quantity || 1);
                              return (
                                <TableRow key={pIdx} sx={{ pageBreakInside: 'avoid !important', breakInside: 'avoid !important' }}>
                                  <TableCell sx={{ fontSize: '0.78rem', py: 0.5 }}>{pIdx + 1}</TableCell>
                                  <TableCell sx={{ fontSize: '0.82rem', py: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.2 }}>
                                      {isLfk && (
                                        <Chip
                                          label="ЛФК"
                                          size="small"
                                          sx={{
                                            fontSize: '0.65rem',
                                            height: 18,
                                            bgcolor: '#ECFDF5',
                                            color: '#047857',
                                            border: '1px solid #A7F3D0',
                                            fontWeight: 800
                                          }}
                                        />
                                      )}
                                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                        {presc.name || (presc as any).title || 'Медицинская услуга'}
                                      </Typography>
                                    </Box>
                                    {presc.dosage_notes && (
                                      <Typography variant="caption" sx={{ color: '#475569', display: 'block', pl: isLfk ? 0.5 : 0 }}>
                                        <LatexText text={presc.dosage_notes} />
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: '0.82rem', py: 0.5 }}>
                                    {itemQty}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 600, py: 0.5 }}>
                                    {itemPrice === 0 && isLfk ? (
                                      <Box component="span" sx={{ color: '#047857', fontWeight: 700, fontSize: '0.75rem' }}>
                                        Включено в план
                                      </Box>
                                    ) : (
                                      `${(itemPrice * itemQty).toLocaleString('ru-RU', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })} ₽`
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  {data.nextVisitDate && (
                    <Typography variant="body2" sx={{ fontSize: '0.84rem', color: '#1E293B', mt: 1 }}>
                      <Box component="span" sx={{ fontWeight: 700, color: '#475569' }}>Повторный осмотр: </Box>
                      {data.nextVisitDate}
                    </Typography>
                  )}
                </Box>
              </Box>
            </>
          );
        })()}

        {/* 5. MANDATORY UNIFIED TOTALS & SIGNATURES BLOCK (CRITICAL SKILL RULE) */}
        <Box
          className="no-page-break"
          sx={{
            mt: 2.5,
            pt: 1.5,
            borderTop: '2px solid #0F3C64',
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important'
          }}
        >
          {totalServicesCost > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                Итого к оплате по назначениям:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.1rem' }}>
                {totalServicesCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, pt: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.84rem', mb: 3 }}>
                Врач травматолог-ортопед:
              </Typography>
              <Box sx={{ borderBottom: '1px solid #1A2027', pb: 0.2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#475569' }}>
                  / {data.doctorName || 'Врач травматолог-ортопед'} /
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  подпись
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                М.П. (личная печать врача)
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.84rem', mb: 3 }}>
                Пациент (законный представитель):
              </Typography>
              <Box sx={{ borderBottom: '1px solid #1A2027', pb: 0.2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#475569' }}>
                  / {data.patient?.fullName} /
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  подпись
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                С диагнозом, планом обследования и лечения ознакомлен(а) и согласен(на)
              </Typography>
            </Box>
          </Box>

          {data.isSigned && (
            <Box sx={{ mt: 1.5, p: 1, bgcolor: '#F0FDF4', border: '1px dashed #86EFAC', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block' }}>
                ✔ Протокол подписан усиленной квалифицированной электронной подписью (ЭЦП)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem', display: 'block' }}>
                Дата подписания: {data.signedAt || `${dateStr} ${timeStr}`} | Хэш: {data.signatureHash || 'SHA256:7a4c9b...'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  }
);

OrthoProtocolPrintTemplate.displayName = 'OrthoProtocolPrintTemplate';
export default OrthoProtocolPrintTemplate;
