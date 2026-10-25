import { forwardRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

export interface PatientExtractData {
  documentNumber: string;
  issueDate: string;
  patient: {
    id?: number;
    fullName: string;
    birthDate?: string;
    gender?: string;
    phone?: string;
    cardNum?: string;
    address?: string;
  };
  doctorName: string;
  doctorSpecialization?: string;
  icd10Code: string;
  icd10Name?: string;
  clinicalDiagnosis: string;
  complaints?: string;
  anamnesis?: string;
  objectiveStatus?: string;
  performedManipulations?: string;
  prescriptionsSummary?: string;
  recommendations?: string;
  regimeNotes?: string;
  nextVisitDate?: string;
}

interface PatientExtractPrintTemplateProps {
  data: PatientExtractData;
}

export const PatientExtractPrintTemplate = forwardRef<HTMLDivElement, PatientExtractPrintTemplateProps>(
  ({ data }, ref) => {
    const formattedBirthDate = data.patient.birthDate
      ? new Date(data.patient.birthDate).toLocaleDateString('ru-RU')
      : '—';

    const formattedIssueDate = data.issueDate
      ? new Date(data.issueDate).toLocaleDateString('ru-RU')
      : new Date().toLocaleDateString('ru-RU');

    const qrValue = `https://clinic-dobrushkin.ru/verify/extract/${encodeURIComponent(data.documentNumber)}?d=${encodeURIComponent(formattedIssueDate)}`;

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
          fontSize: '12pt',
          lineHeight: 1.45,
          boxSizing: 'border-box'
        }}
      >
        {/* 1. CLINIC HEADER */}
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
                Специализированная травматолого-ортопедическая помощь экспертного уровня
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

        {/* 2. DOCUMENT TITLE */}
        <Box sx={{ textAlign: 'center', mb: 2.5 }}>
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
            ВЫПИСНОЙ ЭПИКРИЗ / МЕДИЦИНСКОЕ ЗАКЛЮЧЕНИЕ
          </Typography>
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}>
            из амбулаторной карты пациента № {data.documentNumber} • Дата: {formattedIssueDate}
          </Typography>
        </Box>

        {/* 3. PATIENT DEMOGRAPHICS */}
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 2,
            borderColor: '#CBD5E1',
            bgcolor: '#F8FAFC',
            borderRadius: 1.5,
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important'
          }}
        >
          <TableContainer>
            <Table size="small" sx={{ '& td': { border: 'none', py: 0.4, px: 0.8 } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ width: '22%', fontWeight: 700, color: '#475569', fontSize: '0.84rem' }}>
                    Пациент (ФИО):
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.94rem' }}>
                    {data.patient.fullName}
                  </TableCell>
                  <TableCell sx={{ width: '20%', fontWeight: 700, color: '#475569', fontSize: '0.84rem' }}>
                    Дата рождения:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem' }}>
                    {formattedBirthDate}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.84rem' }}>
                    № Медкарты:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>
                    {data.patient.cardNum || data.patient.id || '—'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.84rem' }}>
                    Контактный телефон:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem' }}>
                    {data.patient.phone || '—'}
                  </TableCell>
                </TableRow>
                {data.patient.address && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.84rem' }}>
                      Адрес проживания:
                    </TableCell>
                    <TableCell colSpan={3} sx={{ color: '#334155', fontSize: '0.85rem' }}>
                      {data.patient.address}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 4. DIAGNOSIS (ICD-10) */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2,
            bgcolor: '#F0F9FF',
            border: '1.5px solid #7DD3FC',
            borderRadius: 1.5,
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.6 }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0369A1', fontSize: '0.86rem' }}>
              КЛИНИЧЕСКИЙ ДИАГНОЗ:
            </Typography>
            {data.icd10Code && (
              <Chip
                label={data.icd10Code}
                size="small"
                sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 800, fontSize: '0.78rem' }}
              />
            )}
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.94rem' }}>
            {data.clinicalDiagnosis || 'Клинический диагноз уточняется'}
          </Typography>
          {data.icd10Name && (
            <Typography variant="caption" sx={{ color: '#0369A1', display: 'block', mt: 0.3, fontStyle: 'italic' }}>
              {data.icd10Name}
            </Typography>
          )}
        </Paper>

        {/* 5. ANAMNESIS & CLINICAL COURSE */}
        {(data.complaints || data.anamnesis) && (
          <Box sx={{ mb: 2, pageBreakInside: 'avoid !important', breakInside: 'avoid !important' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 0.5, textTransform: 'uppercase', fontSize: '0.82rem' }}>
              1. Жалобы и анамнез заболевания:
            </Typography>
            {data.complaints && (
              <Typography variant="body2" sx={{ color: '#334155', mb: 0.5 }}>
                <b>Жалобы:</b> {data.complaints}
              </Typography>
            )}
            {data.anamnesis && (
              <Typography variant="body2" sx={{ color: '#334155' }}>
                <b>Анамнез:</b> {data.anamnesis}
              </Typography>
            )}
          </Box>
        )}

        {/* 6. OBJECTIVE STATUS & MANIPULATIONS */}
        {(data.objectiveStatus || data.performedManipulations) && (
          <Box sx={{ mb: 2, pageBreakInside: 'avoid !important', breakInside: 'avoid !important' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 0.5, textTransform: 'uppercase', fontSize: '0.82rem' }}>
              2. Данные объективного осмотра и проведенное лечение:
            </Typography>
            {data.objectiveStatus && (
              <Typography variant="body2" sx={{ color: '#334155', mb: 0.5 }}>
                <b>Объективный статус:</b> {data.objectiveStatus}
              </Typography>
            )}
            {data.performedManipulations && (
              <Typography variant="body2" sx={{ color: '#334155' }}>
                <b>Проведенные манипуляции / процедуры:</b> {data.performedManipulations}
              </Typography>
            )}
          </Box>
        )}

        {/* 7. PRESCRIPTIONS & RECOMMENDATIONS */}
        {(data.prescriptionsSummary || data.recommendations) && (
          <Box sx={{ mb: 2, pageBreakInside: 'avoid !important', breakInside: 'avoid !important' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 0.5, textTransform: 'uppercase', fontSize: '0.82rem' }}>
              3. Назначения и лечебные рекомендации:
            </Typography>
            {data.prescriptionsSummary && (
              <Typography variant="body2" sx={{ color: '#334155', mb: 0.5 }}>
                <b>Назначенные медицинские услуги / препараты:</b> {data.prescriptionsSummary}
              </Typography>
            )}
            {data.recommendations && (
              <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-line' }}>
                {data.recommendations}
              </Typography>
            )}
            {data.regimeNotes && (
              <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
                <b>Двигательный режим:</b> {data.regimeNotes}
              </Typography>
            )}
            {data.nextVisitDate && (
              <Typography variant="body2" sx={{ color: '#0369A1', fontWeight: 700, mt: 0.5 }}>
                Рекомендован повторный осмотр: {new Date(data.nextVisitDate).toLocaleDateString('ru-RU')}
              </Typography>
            )}
          </Box>
        )}

        {/* 8. FOOTER & DOCTOR SIGNATURE (Unified block to avoid page break per report-generation skill) */}
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
                Лечащий врач:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B', mt: 0.3 }}>
                {data.doctorName || 'Добрушкин А.М.'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                {data.doctorSpecialization || 'Врач травматолог-ортопед'}
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', minWidth: '220px' }}>
              <Box sx={{ borderBottom: '1px solid #1E293B', height: 35, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                (подпись и личная печать врача)
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', minWidth: '130px' }}>
              <Box
                sx={{
                  border: '1.5px dashed #94A3B8',
                  borderRadius: '50%',
                  width: 65,
                  height: 65,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  color: '#94A3B8',
                  fontSize: '0.68rem',
                  fontWeight: 700
                }}
              >
                М. П.
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem' }}>
              Документ сформирован в Медицинской Информационной Системе Центра Ортопедии Добрушкина. Дата формирования: {new Date().toLocaleString('ru-RU')}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
);

PatientExtractPrintTemplate.displayName = 'PatientExtractPrintTemplate';
export default PatientExtractPrintTemplate;
