import { forwardRef } from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

export interface PatientConsentData {
  documentNumber: string;
  issueDate: string;
  patient: {
    fullName: string;
    birthDate?: string;
    cardNum?: string;
    address?: string;
    phone?: string;
  };
  doctorName: string;
  doctorSpecialization?: string;
  interventionType: string; // e.g. "внутрисуставное введение лекарственных препаратов (PRP-терапия / гиалуроновая кислота / блокада)"
  targetJoint?: string;
  targetSide?: string;
  clinicalDiagnosis?: string;
}

interface PatientConsentPrintTemplateProps {
  data: PatientConsentData;
}

export const PatientConsentPrintTemplate = forwardRef<HTMLDivElement, PatientConsentPrintTemplateProps>(
  ({ data }, ref) => {
    const formattedBirthDate = data.patient.birthDate
      ? new Date(data.patient.birthDate).toLocaleDateString('ru-RU')
      : '—';

    const formattedDate = data.issueDate
      ? new Date(data.issueDate).toLocaleDateString('ru-RU')
      : new Date().toLocaleDateString('ru-RU');

    const qrValue = `https://clinic-dobrushkin.ru/verify/consent/${encodeURIComponent(data.documentNumber)}?d=${encodeURIComponent(formattedDate)}`;

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
                В соответствии со ст. 20 Федерального закона от 21.11.2011 № 323-ФЗ
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
              fontSize: '1.2rem',
              letterSpacing: '-0.3px',
              textTransform: 'uppercase'
            }}
          >
            ИНФОРМИРОВАННОЕ ДОБРОВОЛЬНОЕ СОГЛАСИЕ
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
            на медицинское вмешательство и ортопедические манипуляции № {data.documentNumber}
          </Typography>
        </Box>

        {/* BODY */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#F8FAFC', borderRadius: 1.5, borderColor: '#CBD5E1' }}>
          <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.5 }}>
            Я, <b>{data.patient.fullName}</b>, дата рождения <b>{formattedBirthDate}</b>, проживающий(ая) по адресу: {data.patient.address || 'г. Сочи'},
            пациент медицинской карты № <b>{data.patient.cardNum || '—'}</b>, даю информированное добровольное согласие на проведение:
          </Typography>
          <Box sx={{ p: 1, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 1, my: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#1E40AF' }}>
              Вид вмешательства / процедуры: {data.interventionType || 'Внутрисуставная инъекция лекарственных препаратов / блокада / PRP-терапия'}
            </Typography>
            {data.targetJoint && (
              <Typography variant="body2" sx={{ color: '#1E3A8A', mt: 0.3 }}>
                Анатомическая область / сторона: <b>{data.targetJoint} {data.targetSide ? `(${data.targetSide})` : ''}</b>
              </Typography>
            )}
            {data.clinicalDiagnosis && (
              <Typography variant="body2" sx={{ color: '#1E3A8A', mt: 0.3 }}>
                Диагноз: <b>{data.clinicalDiagnosis}</b>
              </Typography>
            )}
          </Box>
        </Paper>

        <Box sx={{ fontSize: '0.86rem', color: '#334155', mb: 2, '& p': { mb: 1 } }}>
          <Typography variant="body2" sx={{ mb: 1, fontSize: '0.86rem' }}>
            1. Мне в доступной форме разъяснены цели, методы оказания медицинской помощи, связанный с ними риск, возможные варианты медицинских вмешательств, их последствия и ожидаемые результаты.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, fontSize: '0.86rem' }}>
            2. Я предупрежден(а) о возможных осложнениях (болезненность в месте инъекции, гематома, аллергическая реакция, синовит) и обязуюсь строго соблюдать назначенный врачом двигательный режим и рекомендации.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, fontSize: '0.86rem' }}>
            3. Я подтверждаю, что сообщил(а) врачу достоверные сведения о состоянии своего здоровья, перенесенных заболеваниях, аллергических реакциях на лекарственные препараты, наличии имплантов и кардиостимулятора.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, fontSize: '0.86rem' }}>
            4. Мне предоставлена возможность задать любые интересующие меня вопросы по поводу предстоящего лечения и получить исчерпывающие ответы врача.
          </Typography>
        </Box>

        {/* SIGNATURES */}
        <Box
          sx={{
            mt: 4,
            pt: 2,
            borderTop: '1.5px solid #CBD5E1',
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important'
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1 }}>
                Пациент (или законный представитель):
              </Typography>
              <Box sx={{ borderBottom: '1px solid #1E293B', height: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                (подпись / расшифровка: {data.patient.fullName})
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1 }}>
                Врач, проводивший консультирование:
              </Typography>
              <Box sx={{ borderBottom: '1px solid #1E293B', height: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                (подпись врача: {data.doctorName || 'Добрушкин А.М.'})
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
              Дата оформления согласия: {formattedDate} • Центр Ортопедии и Травматологии Добрушкина
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
);

PatientConsentPrintTemplate.displayName = 'PatientConsentPrintTemplate';
export default PatientConsentPrintTemplate;
