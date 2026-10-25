import { forwardRef } from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

export interface PatientMemoData {
  documentNumber: string;
  issueDate: string;
  patient: {
    fullName: string;
    birthDate?: string;
    cardNum?: string;
    phone?: string;
  };
  doctorName: string;
  targetJoint?: string;
  clinicalDiagnosis?: string;
  studyType?: string; // e.g. "МРТ / КТ / УЗИ суставов"
  preparationSteps: string[];
  regimeRecommendations: string[];
}

interface PatientMemoPrintTemplateProps {
  data: PatientMemoData;
}

export const PatientMemoPrintTemplate = forwardRef<HTMLDivElement, PatientMemoPrintTemplateProps>(
  ({ data }, ref) => {
    const formattedDate = data.issueDate
      ? new Date(data.issueDate).toLocaleDateString('ru-RU')
      : new Date().toLocaleDateString('ru-RU');

    const qrValue = `https://clinic-dobrushkin.ru/patients/memo/${encodeURIComponent(data.documentNumber)}`;

    return (
      <Box
        ref={ref}
        sx={{
          p: 3.5,
          width: '100%',
          maxWidth: '820px',
          margin: '0 auto',
          bgcolor: '#FFFFFF',
          color: '#0F172A',
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          fontSize: '11pt',
          lineHeight: 1.45,
          boxSizing: 'border-box'
        }}
      >
        {/* CLINIC HEADER */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #0F3C64',
            pb: 1.5,
            mb: 2.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src="/MainLogoTransparent.png"
              alt="Логотип клиники"
              sx={{ width: 68, height: 68, objectFit: 'contain' }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: '#0F3C64',
                  fontSize: '1.05rem',
                  letterSpacing: '-0.2px',
                  textTransform: 'uppercase',
                  lineHeight: 1.2
                }}
              >
                Центр Ортопедии и Травматологии Добрушкина
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.78rem', mt: 0.3 }}>
                г. Сочи • Лицензия ЛО-23-01-014522 • Тел. +7 (862) 295-00-55
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>
                Памятка пациенту: клинические рекомендации и правила подготовки
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <QRCodeSVG value={qrValue} size={54} level="M" />
            <Typography variant="caption" sx={{ fontSize: '0.66rem', color: '#64748B', mt: 0.3, letterSpacing: '0.5px' }}>
              QR ВЕРИФИКАЦИЯ
            </Typography>
          </Box>
        </Box>

        {/* TITLE */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: '#0F3C64',
              fontSize: '1.25rem',
              letterSpacing: '-0.3px',
              textTransform: 'uppercase'
            }}
          >
            ПАМЯТКА ПАЦИЕНТУ № {data.documentNumber}
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
            по подготовке к обследованиям и соблюдению ортопедического режима
          </Typography>
        </Box>

        {/* PATIENT INFO */}
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: '#F8FAFC', borderRadius: 1.5, borderColor: '#CBD5E1' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2">
              <b>Пациент:</b> {data.patient.fullName} (Карта: {data.patient.cardNum || '—'})
            </Typography>
            <Typography variant="body2">
              <b>Дата выдачи:</b> {formattedDate}
            </Typography>
          </Box>
          {data.clinicalDiagnosis && (
            <Typography variant="body2" sx={{ mt: 0.5, color: '#0369A1' }}>
              <b>Клинический диагноз:</b> {data.clinicalDiagnosis}
            </Typography>
          )}
          {data.targetJoint && (
            <Typography variant="body2" sx={{ mt: 0.3, color: '#334155' }}>
              <b>Область исследования:</b> {data.targetJoint}
            </Typography>
          )}
        </Paper>

        {/* PREPARATION STEPS */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#F0F9FF', border: '1.5px solid #BAE6FD', borderRadius: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0369A1', mb: 1, textTransform: 'uppercase', fontSize: '0.84rem' }}>
            Правила подготовки к исследованию ({data.studyType || 'МРТ / КТ / УЗИ суставов'}):
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, color: '#1E293B', '& li': { mb: 0.8, fontSize: '0.88rem' } }}>
            {data.preparationSteps.map((step, idx) => (
              <li key={idx}>
                <Typography variant="body2" sx={{ fontSize: '0.88rem' }}>{step}</Typography>
              </li>
            ))}
          </Box>
        </Paper>

        {/* REGIME RECOMMENDATIONS */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#92400E', mb: 1, textTransform: 'uppercase', fontSize: '0.84rem' }}>
            Рекомендации по двигательному и ортопедическому режиму:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, color: '#1E293B', '& li': { mb: 0.8, fontSize: '0.88rem' } }}>
            {data.regimeRecommendations.map((rec, idx) => (
              <li key={idx}>
                <Typography variant="body2" sx={{ fontSize: '0.88rem' }}>{rec}</Typography>
              </li>
            ))}
          </Box>
        </Paper>

        {/* EMERGENCY CONTACT & SIGNATURE */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: '1.5px solid #CBD5E1',
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'nowrap' }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                Лечащий врач травматолог-ортопед:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B', mt: 0.3 }}>
                {data.doctorName || 'Добрушкин А.М.'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                Центр Ортопедии и Травматологии Добрушкина • Тел. +7 (862) 295-00-55
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
              <Box sx={{ borderBottom: '1px solid #1E293B', height: 32, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                (подпись врача)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
);

PatientMemoPrintTemplate.displayName = 'PatientMemoPrintTemplate';
export default PatientMemoPrintTemplate;
