import React from 'react';
import { Box, Typography, Divider, Grid } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

export interface PeReleaseData {
  documentNumber: string; // e.g. '095-2026-00384'
  issueDate: string; // e.g. '2026-10-20'
  clinicName?: string;
  clinicAddress?: string;
  clinicOgrn?: string;
  clinicLicense?: string;
  clinicPhone?: string;
  patient: {
    fullName: string;
    birthDate?: string;
    gender?: number | string; // 1: male, 2: female
    phone?: string;
    cardNum?: number | string;
  };
  institutionName?: string; // Название школы, колледжа, лицея, ВУЗа
  icd10Code?: string; // e.g. 'M19.9', 'S83.5'
  clinicalDiagnosis?: string;
  hideDiagnosis?: boolean; // по требованию (врачебная тайна)
  absenceStartDate: string;
  absenceEndDate: string;
  
  // PE Release period options
  leavePeriodBlank: boolean; // If true: leaves blank underlined field for doctor handwriting
  peStartDate?: string;
  peEndDate?: string;
  peDurationText?: string; // e.g. '1 месяц', '3 месяца', 'на I полугодие'
  peGroup: 'special_a' | 'special_b' | 'preparatory' | 'full_exemption';
  peSpecialRecommendations?: string;
  returnToStudiesDate: string;

  doctorName?: string;
  doctorSpecialty?: string;
  verificationHash?: string;
}

interface PeReleasePrintTemplateProps {
  data: PeReleaseData;
}

const PE_GROUP_LABELS: Record<string, string> = {
  special_a: 'Специальная медицинская группа «А» (лечебная физкультура, щадящий режим)',
  special_b: 'Специальная медицинская группа «Б» (теоретический курс, существенные ограничения)',
  preparatory: 'Подготовительная группа (без сдачи спортивных нормативов)',
  full_exemption: 'Полное освобождение от занятий физической культурой и сдачи спортивных нормативов'
};

const formatDateRu = (dateStr?: string) => {
  if (!dateStr) return '«____» ________________ 202___ г.';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  return `«${day}» ${monthName} ${year} г.`;
};

const calculateAge = (birthDateStr?: string) => {
  if (!birthDateStr) return '';
  const b = new Date(birthDateStr);
  if (isNaN(b.getTime())) return '';
  const diff = Date.now() - b.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export const PeReleasePrintTemplate: React.FC<PeReleasePrintTemplateProps> = ({ data }) => {
  const clinicName = data.clinicName || 'ЦЕНТР ОРТОПЕДИИ И ТРАВМАТОЛОГИИ ДОБРУШКИНА';
  const clinicAddress = data.clinicAddress || 'г. Сочи, ул. Навагинская, д. 9Д';
  const clinicLicense = data.clinicLicense || 'ЛО-23-01-014522';
  const clinicPhone = data.clinicPhone || '+7 (862) 295-00-55';
  const doctorName = data.doctorName || 'Добрушкин А.М';
  const doctorSpecialty = data.doctorSpecialty || 'Врач травматолог-ортопед';
  const patientAge = calculateAge(data.patient.birthDate);

  const qrPayload = JSON.stringify({
    form: '095/у',
    num: data.documentNumber,
    date: data.issueDate,
    patient: data.patient.fullName,
    doctor: doctorName,
    clinic: clinicName,
    blank_pe: data.leavePeriodBlank ? 1 : 0
  });

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '210mm',
        minHeight: '297mm',
        mx: 'auto',
        p: '10mm 14mm',
        bgcolor: '#FFFFFF',
        color: '#0F172A',
        fontFamily: '"Times New Roman", Times, serif',
        position: 'relative',
        boxSizing: 'border-box',
        '@media print': {
          p: '6mm 10mm',
          width: '100%',
          minHeight: 'auto',
          pageBreakAfter: 'always !important',
          breakAfter: 'page !important'
        }
      }}
    >
      {/* OUTER AUTHENTIC MEDICAL CERTIFICATE BORDER */}
      <Box
        sx={{
          border: '2px solid #0F172A',
          p: 2.5,
          position: 'relative',
          bgcolor: '#FFFFFF'
        }}
      >
        {/* INNER DECORATIVE THIN LINE */}
        <Box
          className="print-section"
          sx={{
            border: '1px solid #64748B',
            p: 2,
            position: 'relative',
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important'
          }}
        >
          {/* 1. TOP HEADER SECTION */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* Left: Healthcare Facility Details */}
            <Grid size={{ xs: 7 }}>
              <Box sx={{ borderBottom: '1px solid #CBD5E1', pb: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B' }}>
                  Министерство здравоохранения РФ
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F3C64', lineHeight: 1.25 }}>
                  {clinicName}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.74rem', color: '#334155', mt: 0.3 }}>
                  {clinicAddress} • Тел: {clinicPhone}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.72rem', color: '#64748B' }}>
                  Лицензия на осуществление медицинской деятельности: № {clinicLicense}
                </Typography>
              </Box>
            </Grid>

            {/* Right: Soviet/Russian Standard Regulatory Box */}
            <Grid size={{ xs: 5 }}>
              <Box sx={{ textAlign: 'right', pl: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.72rem', color: '#64748B' }}>
                  Код формы по ОКУД <b>3108805</b>
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.72rem', color: '#64748B' }}>
                  Код учреждения по ОКПО <b>48291034</b>
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, mt: 0.5, color: '#0F172A' }}>
                  Медицинская документация
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: '0.9rem', color: '#0F3C64' }}>
                  Форма № 095/у
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.68rem', color: '#475569', lineHeight: 1.15 }}>
                  Утверждена приказом Минздрава СССР<br />
                  от 04.10.1980 г. № 1030
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* 2. TITLE SECTION */}
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, fontSize: '1.25rem', color: '#0F3C64', letterSpacing: 0.5 }}>
              СПРАВКА № {data.documentNumber}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', color: '#1E293B', mt: 0.5, lineHeight: 1.3 }}>
              о временной нетрудоспособности студента, учащегося техникума, училища,<br />
              о болезни, карантине и других причинах отсутствия ребенка, посещающего школу, детское дошкольное учреждение
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#B45309', mt: 0.4 }}>
              (с освобождением от занятий физической культурой)
            </Typography>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: '#0F172A', borderWidth: 1 }} />

          {/* 3. CERTIFICATE BODY & PATIENT DATA */}
          <Box sx={{ fontSize: '0.92rem', lineHeight: 2.1, color: '#0F172A' }}>
            {/* Issue Date */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
              <Typography component="span" sx={{ fontWeight: 700, minWidth: 140 }}>
                Дата выдачи:
              </Typography>
              <Typography component="span" sx={{ borderBottom: '1px dotted #0F172A', flexGrow: 1, px: 1, fontWeight: 700 }}>
                {formatDateRu(data.issueDate)}
              </Typography>
            </Box>

            {/* Patient Full Name */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
              <Typography component="span" sx={{ fontWeight: 700, minWidth: 140 }}>
                Выдана:
              </Typography>
              <Typography component="span" sx={{ borderBottom: '1px dotted #0F172A', flexGrow: 1, px: 1, fontWeight: 800, fontSize: '1rem', color: '#0F3C64' }}>
                {data.patient.fullName}
              </Typography>
            </Box>

            {/* Birth Date & Age */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
              <Typography component="span" sx={{ fontWeight: 700, minWidth: 140 }}>
                Дата рождения:
              </Typography>
              <Typography component="span" sx={{ borderBottom: '1px dotted #0F172A', flexGrow: 1, px: 1 }}>
                {data.patient.birthDate ? `${formatDateRu(data.patient.birthDate)}` : '«____» ________________ 202___ г.'}
                {patientAge ? ` (полных лет: ${patientAge})` : ''}
                {data.patient.cardNum ? ` • Амб. карта: № ${data.patient.cardNum}` : ''}
              </Typography>
            </Box>

            {/* Educational Institution */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
              <Typography component="span" sx={{ fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, pr: 1 }}>
                Название учебного заведения, школы:
              </Typography>
              <Typography
                component="span"
                sx={{
                  borderBottom: '1px dotted #0F172A',
                  flexGrow: 1,
                  px: 1,
                  minWidth: 0,
                  fontWeight: data.institutionName ? 700 : 400
                }}
              >
                {data.institutionName || '\u00A0'}
              </Typography>
            </Box>

            {/* Diagnosis */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
              <Typography component="span" sx={{ fontWeight: 700, minWidth: 170 }}>
                Диагноз заболевания:
              </Typography>
              <Typography component="span" sx={{ borderBottom: '1px dotted #0F172A', flexGrow: 1, px: 1, fontWeight: 700 }}>
                {data.hideDiagnosis
                  ? 'Заболевание (по требованию пациента ст. 13 Федерального закона № 323-ФЗ)'
                  : `${data.icd10Code ? `[МКБ-10: ${data.icd10Code}] ` : ''}${data.clinicalDiagnosis || 'Травматолого-ортопедическая патология опорно-двигательного аппарата'}`}
              </Typography>
            </Box>

            {/* Contact with infection */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
              <Typography component="span" sx={{ fontWeight: 700, minWidth: 320 }}>
                Наличие контакта с инфекционными больными:
              </Typography>
              <Typography component="span" sx={{ borderBottom: '1px dotted #0F172A', flexGrow: 1, px: 1, fontWeight: 700, color: '#15803D' }}>
                НЕ ИМЕЛ(А) (со слов пациента и по данным анамнеза)
              </Typography>
            </Box>

            {/* General study absence period */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
              <Typography component="span" sx={{ fontWeight: 700, minWidth: 260 }}>
                Освобожден(а) от учебных занятий:
              </Typography>
              <Typography component="span" sx={{ borderBottom: '1px dotted #0F172A', flexGrow: 1, px: 1 }}>
                с {formatDateRu(data.absenceStartDate)} по {formatDateRu(data.absenceEndDate)} включительно
              </Typography>
            </Box>
          </Box>

          {/* 4. OFFICIAL PE EXEMPTION SECTION (KEY HIGHLIGHT) */}
          <Box
            sx={{
              mt: 2,
              mb: 2,
              p: 2,
              border: '2px dashed #0F3C64',
              borderRadius: 1,
              bgcolor: '#F8FAFC'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 900, fontSize: '0.98rem', color: '#0F3C64', textAlign: 'center', mb: 1, textTransform: 'uppercase' }}>
              Освобождение от уроков физической культуры и сдачи нормативов
            </Typography>

            <Typography variant="body2" sx={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#0F172A' }}>
              По состоянию здоровья и клиническим показаниям пациент <b>освобождается</b> от практических занятий физической культурой, выполнения нормативов ГТО, спортивных соревнований и повышенных физических нагрузок:
            </Typography>

            {/* Conditional PE Duration: Doctor entered VS Blank for handwriting */}
            {data.leavePeriodBlank ? (
              // BLANK FOR HANDWRITING (с линией для заполнения от руки)
              <Box sx={{ my: 1.5, p: 1.5, border: '1px solid #CBD5E1', bgcolor: '#FFFFFF', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                  <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.92rem', minWidth: 150 }}>
                    Срок освобождения:
                  </Typography>
                  <Typography component="span" sx={{ borderBottom: '1.5px solid #0F172A', flexGrow: 1, px: 1, fontFamily: 'monospace', fontSize: '1rem' }}>
                    с  « _____ » __________________ 202___ г.   по   « _____ » __________________ 202___ г.
                  </Typography>
                </Box>
                <Box sx={{ borderBottom: '1.5px solid #0F172A', width: '100%', height: 26, mb: 0.5 }} />
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', fontStyle: 'italic', color: '#64748B', fontSize: '0.74rem' }}>
                  (срок освобождения, допустимый двигательный режим и ограничения заполняются лечащим врачом от руки)
                </Typography>
              </Box>
            ) : (
              // DOCTOR ENTERED PERIOD
              <Box sx={{ my: 1.5, p: 1.5, border: '1px solid #0F3C64', bgcolor: '#F0FDF4', borderRadius: 1 }}>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.92rem', color: '#0F172A' }}>
                      <b>Срок освобождения:</b> с <b>{formatDateRu(data.peStartDate || data.absenceStartDate)}</b> по <b>{formatDateRu(data.peEndDate || data.absenceEndDate)}</b> включительно
                      {data.peDurationText && <span style={{ color: '#166534', fontWeight: 800 }}> ({data.peDurationText})</span>}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Recommended Medical PE Group */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.86rem', color: '#1E293B' }}>
                Рекомендуемая медицинская группа для занятий физкультурой:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#B45309', mt: 0.2 }}>
                • {PE_GROUP_LABELS[data.peGroup] || PE_GROUP_LABELS.full_exemption}
              </Typography>
            </Box>

            {data.peSpecialRecommendations && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#475569' }}>
                  Особые рекомендации врача-ортопеда:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.84rem', color: '#334155' }}>
                  {data.peSpecialRecommendations}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Return to Studies */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1.5, mb: 2 }}>
            <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.95rem', minWidth: 220, color: '#0F3C64' }}>
              Приступить к занятиям:
            </Typography>
            <Typography component="span" sx={{ borderBottom: '1px dotted #0F172A', flexGrow: 1, px: 1, fontWeight: 800, fontSize: '0.95rem' }}>
              {formatDateRu(data.returnToStudiesDate)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: '#CBD5E1' }} />

          {/* 5. STAMP AND SIGNATURE SECTION */}
          <Grid container spacing={2} sx={{ mt: 1, alignItems: 'center' }}>
            {/* Left: QR Verification */}
            <Grid size={{ xs: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <QRCodeSVG value={qrPayload} size={82} level="M" />
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.66rem', color: '#64748B', mt: 0.4 }}>
                  Электронная верификация<br />№ {data.documentNumber}
                </Typography>
              </Box>
            </Grid>

            {/* Middle: Official Stamp Boxes */}
            <Grid size={{ xs: 5 }}>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                {/* Triangular Stamp */}
                <Box
                  sx={{
                    width: 95,
                    height: 80,
                    border: '1.5px dashed #3B82F6',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    p: 0.5
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#1D4ED8', lineHeight: 1.1 }}>
                    М.П.<br />
                    Для справок<br />
                    и больничных<br />
                    листов
                  </Typography>
                </Box>

                {/* Circular Clinic Seal */}
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    border: '1.5px dashed #94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    p: 0.5
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748B', lineHeight: 1.1 }}>
                    Печать<br />медицинской<br />организации
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Right: Doctor Signature & Personal Seal */}
            <Grid size={{ xs: 4 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.74rem', color: '#475569' }}>
                  {doctorSpecialty}:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', mt: 0.5 }}>
                  {doctorName}
                </Typography>
                <Box sx={{ borderBottom: '1px solid #0F172A', width: 140, ml: 'auto', mt: 1.5, mb: 0.5 }} />
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.68rem', color: '#64748B' }}>
                  (подпись и личная печать врача)
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* 6. BOTTOM LEGAL NOTE */}
          <Box sx={{ mt: 2.5, pt: 1, borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748B', lineHeight: 1.2 }}>
              Справка формы 095/у действительна при наличии прямоугольного штампа учреждения, треугольной печати «Для справок и больничных листов» и личной печати/подписи лечащего врача. Выдана в соответствии с Приказом Минздрава СССР от 04.10.1980 г. № 1030.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PeReleasePrintTemplate;
