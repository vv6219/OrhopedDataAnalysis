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

export interface OrthoPrescriptionItem {
  id?: string | number;
  serviceId?: number;
  code?: string;
  name: string;
  title?: string;
  category?: string;
  quantity?: number;
  price?: number;
  dosage_notes?: string;
}

export interface OrthoProtocolData {
  protocolNumber?: string | number;
  visitDate?: string | Date;
  doctorName?: string;
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
  vasScore: number;
  gait?: string;
  posture?: string;
  jointExams: JointExamState[];
  icdCode?: string;
  icdName?: string;
  clinicalDiagnosis: string;
  recommendations: string;
  prescriptions: OrthoPrescriptionItem[];
  nextVisitDate?: string;
  isSigned?: boolean;
  signedAt?: string;
  signatureHash?: string;
}

export interface OrthoProtocolPrintTemplateProps {
  data: OrthoProtocolData;
}

export const OrthoProtocolPrintTemplate = React.forwardRef<HTMLDivElement, OrthoProtocolPrintTemplateProps>(
  ({ data }, ref) => {
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
        {/* EMBEDDED PRINT STYLES */}
        <style type="text/css">
          {`
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 8mm 10mm;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-page-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
          `}
        </style>

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
                Клиника доктора Добрушкина • г. Сочи • Тел. +7 (862) 295-00-55
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
                  {data.doctorName || 'Добрушкин Александр Моисеевич'}
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3 }}>
                Врач травматолог-ортопед, к.м.н.
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* 1. COMPLAINTS & ANAMNESIS */}
        <Box sx={{ mb: 2, pageBreakInside: 'avoid' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1px solid #E2E8F0', pb: 0.4, mb: 1 }}>
            1. Жалобы и анамнез заболевания
          </Typography>
          <Box sx={{ pl: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.8, fontSize: '0.86rem', lineHeight: 1.45 }}>
              <Box component="span" sx={{ fontWeight: 700, color: '#334155' }}>Жалобы: </Box>
              {cleanComplaints || 'Жалоб на момент осмотра активно не предъявляет.'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.8, fontSize: '0.86rem', lineHeight: 1.45 }}>
              <Box component="span" sx={{ fontWeight: 700, color: '#334155' }}>Анамнез заболевания (Anamnesis morbi): </Box>
              {cleanAnamnesis || 'Считает себя больным в течение последнего времени, ранее за медпомощью не обращался.'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
              <Typography variant="body2" sx={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155' }}>
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
          </Box>
        </Box>

        {/* 2. ORTHOPEDIC STATUS / STATUS LOCALIS */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1px solid #E2E8F0', pb: 0.4, mb: 1 }}>
            2. Ортопедический статус (Status Localis)
          </Typography>
          
          <Box sx={{ pl: 1, mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.45 }}>
              <Box component="span" sx={{ fontWeight: 700, color: '#334155' }}>Походка: </Box>
              {data.gait || 'Свободная, физиологическая, без хромоты, без дополнительной опоры.'}
            </Typography>
            {data.posture && (
              <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.45, mt: 0.4 }}>
                <Box component="span" sx={{ fontWeight: 700, color: '#334155' }}>Осанка: </Box>
                {data.posture}
              </Typography>
            )}
          </Box>

          {/* JOINTS EXAMINATIONS TABLE/BLOCKS */}
          {data.jointExams && data.jointExams.length > 0 ? (
            data.jointExams.map((exam, idx) => (
              <Paper
                key={idx}
                variant="outlined"
                sx={{
                  p: 1.25,
                  mb: 1.5,
                  borderColor: '#E2E8F0',
                  bgcolor: '#FAFBFD',
                  pageBreakInside: 'avoid'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369A1', fontSize: '0.88rem' }}>
                    {getJointTitle(exam.jointArea)} ({getSideLabel(exam.side)})
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Ось: {getAxisLabel(exam.axis)} • Синовит/выпот: {getEffusionLabel(exam.effusion)}
                  </Typography>
                </Box>

                {/* ROM Goniometry */}
                <Box sx={{ mb: 1, p: 0.75, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #EEF2F6' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.4 }}>
                    Амплитуда движений (Neutral-0 ROM):
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

                {/* Specialized Clinical Tests */}
                {exam.tests && Object.keys(exam.tests).length > 0 && (
                  <Box sx={{ pl: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.3 }}>
                      Специальные клинические тесты:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                          {getTestLabel(tKey, tRes)}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            ))
          ) : (
            <Typography variant="body2" sx={{ pl: 1, color: '#64748B', fontStyle: 'italic', fontSize: '0.85rem' }}>
              Локальный суставной статус: без признаков патологической деформации, отека и ограничения движений.
            </Typography>
          )}
        </Box>

        {/* 3. DIAGNOSIS */}
        <Box sx={{ mb: 2, pageBreakInside: 'avoid' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1px solid #E2E8F0', pb: 0.4, mb: 1 }}>
            3. Клинический диагноз
          </Typography>
          <Box sx={{ pl: 1 }}>
            {data.icdCode && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Chip
                  label={`МКБ-10: ${data.icdCode}`}
                  size="small"
                  sx={{ fontWeight: 800, bgcolor: '#0284C7', color: '#FFFFFF', fontSize: '0.78rem' }}
                />
                {data.icdName && (
                  <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontSize: '0.84rem' }}>
                    {data.icdName}
                  </Typography>
                )}
              </Box>
            )}
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem', lineHeight: 1.45 }}>
              {cleanDiagnosis || 'Диагноз уточняется по результатам инструментального обследования.'}
            </Typography>
          </Box>
        </Box>

        {/* 4. RECOMMENDATIONS & PRESCRIPTIONS */}
        <Box sx={{ mb: 2, pageBreakInside: 'avoid' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', borderBottom: '1px solid #E2E8F0', pb: 0.4, mb: 1 }}>
            4. Рекомендации и план лечения
          </Typography>
          <Box sx={{ pl: 1 }}>
            <Typography variant="body2" sx={{ fontSize: '0.86rem', lineHeight: 1.5, whiteSpace: 'pre-line', mb: 1.5 }}>
              {data.recommendations || 'Охранительный двигательный режим, разгрузка сустава, ЛФК, физиотерапия по согласованию.'}
            </Typography>

            {/* Prescribed Services Table */}
            {data.prescriptions && data.prescriptions.length > 0 && (
              <Box sx={{ mt: 1, mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
                  Назначенные медицинские услуги и манипуляции:
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderColor: '#E2E8F0' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', py: 0.5 }}>№</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', py: 0.5 }}>Наименование услуги / манипуляции</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem', py: 0.5 }}>Кол-во</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem', py: 0.5 }}>Стоимость, руб.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.prescriptions.map((presc, pIdx) => (
                        <TableRow key={pIdx}>
                          <TableCell sx={{ fontSize: '0.78rem', py: 0.5 }}>{pIdx + 1}</TableCell>
                          <TableCell sx={{ fontSize: '0.82rem', py: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                              {presc.name || (presc as any).title || 'Медицинская услуга'}
                            </Typography>
                            {presc.dosage_notes && (
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                {presc.dosage_notes}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.82rem', py: 0.5 }}>
                            {presc.quantity || 1}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 600, py: 0.5 }}>
                            {(((presc.price ?? (presc as any).unitPrice ?? (presc as any).unit_price ?? 0)) * (presc.quantity || 1)).toLocaleString('ru-RU', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
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
                  / {data.doctorName || 'Добрушкин Александр Моисеевич'} /
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
