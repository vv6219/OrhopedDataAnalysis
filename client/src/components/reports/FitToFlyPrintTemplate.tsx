import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

export interface FitToFlyData {
  documentNumber: string; // e.g. 'АВИА-2026-000001'
  issueDate: string; // e.g. '2026-10-25'
  validUntil?: string; // e.g. '2026-11-25'
  patient: {
    fullName: string;
    fullNameEn?: string;
    birthDate?: string;
    gender?: string | number; // 1: М / Male, 2: Ж / Female
    passportNumber?: string;
  };
  destination?: string; // Маршрут / Авиакомпания e.g. 'Сочи - Москва (Аэрофлот)'
  clinicalDiagnosis: string;
  clinicalDiagnosisEn?: string;
  icd10Code?: string;
  specialRequirements?: string; // Дополнительные условия: фиксация бандажом, трость, костыли
  specialRequirementsEn?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorSpecialtyEn?: string;
  verificationHash?: string;
  isDuplicate?: boolean;
}

interface FitToFlyPrintTemplateProps {
  data: FitToFlyData;
}

export const FitToFlyPrintTemplate = React.forwardRef<HTMLDivElement, FitToFlyPrintTemplateProps>(
  ({ data }, ref) => {
    const isFemale = data.patient.gender === 2 || data.patient.gender === 'female' || data.patient.gender === 'Ж';
    const sexLabel = isFemale ? 'Женский / Female' : 'Мужской / Male';
    const verifyUrl = `${window.location.origin}/verify/doc/${encodeURIComponent(data.documentNumber)}?hash=${data.verificationHash || 'valid'}`;

    return (
      <Box
        ref={ref}
        sx={{
          width: '210mm',
          minHeight: '297mm',
          padding: '16mm 20mm',
          margin: '0 auto',
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          fontFamily: '"Times New Roman", Times, serif',
          boxSizing: 'border-box',
          position: 'relative',
          '@media print': {
            width: '210mm',
            minHeight: '297mm',
            padding: '15mm 18mm',
            margin: 0,
            boxShadow: 'none',
            pageBreakInside: 'avoid',
            '@page': {
              size: 'A4 portrait',
              margin: '0mm'
            }
          }
        }}
      >
        {/* DUPLICATE WATERMARK IF RE-PRINTED */}
        {data.isDuplicate && (
          <Box
            sx={{
              position: 'absolute',
              top: '40%',
              left: '20%',
              transform: 'rotate(-30deg)',
              fontSize: '4.5rem',
              fontWeight: 900,
              color: 'rgba(239, 68, 68, 0.12)',
              border: '4px dashed rgba(239, 68, 68, 0.2)',
              padding: '8px 24px',
              borderRadius: '8px',
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            ДУБЛИКАТ / DUPLICATE
          </Box>
        )}

        {/* TOP CLINIC HEADER */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0284C7', pb: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src="/MainLogoTransparent.png"
              alt="Логотип клиники"
              sx={{ width: 64, height: 64, objectFit: 'contain' }}
              onError={(e: any) => {
                e.target.style.display = 'none';
              }}
            />
            <Box>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Центр Ортопедии и Травматологии Добрушкина
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#475569' }}>
                DOBRUSHKIN ORTHOPEDICS & TRAUMATOLOGY CLINICAL CENTER
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
                Лицензия № ЛО-23-01-014522 • г. Сочи, ул. Навагинская, 9Д • Тел: +7 (862) 295-00-55
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>
              Штамп медицинской организации /
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8' }}>
              Hospital / Clinic Official Stamp
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#0F172A', mt: 0.5 }}>
              Для авиакомпании / Air Carrier
            </Typography>
          </Box>
        </Box>

        {/* TITLE */}
        <Box sx={{ textAlign: 'center', my: 2.5 }}>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', color: '#0F172A', letterSpacing: '0.05em' }}>
            Медицинская справка
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
            о состоянии здоровья и отсутствии противопоказаний к перелету
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#0284C7', mt: 0.5 }}>
            MEDICAL CERTIFICATE / FIT TO FLY
          </Typography>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', px: 2, py: 0.5, borderRadius: '4px', mt: 1 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#0369A1' }}>
              № {data.documentNumber}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#475569' }}>
              от {data.issueDate} г.
            </Typography>
          </Box>
        </Box>

        {/* CONTENT FIELDS TABLE */}
        <Box sx={{ border: '1px solid #CBD5E1', borderRadius: '4px', overflow: 'hidden', mb: 2.5 }}>
          {/* Row: Patient name */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
            <Box sx={{ width: '38%', p: 1, borderRight: '1px solid #E2E8F0' }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                1. Выдана пациенту(ке):
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>
                Patient's full name:
              </Typography>
            </Box>
            <Box sx={{ width: '62%', p: 1, bgcolor: '#FFFFFF' }}>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                {data.patient.fullName}
              </Typography>
              {data.patient.fullNameEn && (
                <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic' }}>
                  {data.patient.fullNameEn}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Row: DOB & Sex */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
            <Box sx={{ width: '38%', p: 1, borderRight: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                2. Дата рождения и пол:
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>
                Date of birth & sex:
              </Typography>
            </Box>
            <Box sx={{ width: '62%', p: 1, display: 'flex', gap: 4 }}>
              <Typography sx={{ fontSize: '0.85rem' }}>
                <strong>Дата:</strong> {data.patient.birthDate || '—'}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>
                <strong>Пол / Sex:</strong> {sexLabel}
              </Typography>
            </Box>
          </Box>

          {/* Row: Passport */}
          {data.patient.passportNumber && (
            <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
              <Box sx={{ width: '38%', p: 1, borderRight: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  3. Паспортные данные:
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>
                  ID / Passport No.:
                </Typography>
              </Box>
              <Box sx={{ width: '62%', p: 1 }}>
                <Typography sx={{ fontSize: '0.85rem' }}>
                  {data.patient.passportNumber}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Row: Flight destination */}
          {data.destination && (
            <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
              <Box sx={{ width: '38%', p: 1, borderRight: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  4. Маршрут / Авиакомпания:
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>
                  Flight route / Carrier:
                </Typography>
              </Box>
              <Box sx={{ width: '62%', p: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {data.destination}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Row: Diagnosis */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
            <Box sx={{ width: '38%', p: 1, borderRight: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                5. Клинический диагноз:
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>
                Diagnosis (ICD-10):
              </Typography>
            </Box>
            <Box sx={{ width: '62%', p: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {data.icd10Code && `[${data.icd10Code}] `}{data.clinicalDiagnosis || 'Травматолого-ортопедический профиль'}
              </Typography>
              {data.clinicalDiagnosisEn && (
                <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' }}>
                  {data.clinicalDiagnosisEn}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Row: Special requirements */}
          <Box sx={{ display: 'flex' }}>
            <Box sx={{ width: '38%', p: 1, borderRight: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                6. Дополнительные условия:
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>
                Special requirements / Mobility:
              </Typography>
            </Box>
            <Box sx={{ width: '62%', p: 1 }}>
              <Typography sx={{ fontSize: '0.82rem' }}>
                {data.specialRequirements || 'Специальных медицинских условий и кислородной поддержки на борту не требуется.'}
              </Typography>
              {data.specialRequirementsEn && (
                <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' }}>
                  {data.specialRequirementsEn}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* OFFICIAL CONCLUSION BOX (BILINGUAL VERBATIM FROM DOCX) */}
        <Box
          sx={{
            border: '2px solid #0369A1',
            borderRadius: '6px',
            bgcolor: '#F0F9FF',
            p: 2,
            mb: 3
          }}
        >
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#0C4A6E', textTransform: 'uppercase', mb: 0.5 }}>
            ЗАКЛЮЧЕНИЕ / CONCLUSION:
          </Typography>
          <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.5, color: '#0F172A', mb: 1 }}>
            По состоянию здоровья <strong>противопоказаний к транспортировке воздушным транспортом (перелету) не имеет</strong>. Перелет разрешен.
          </Typography>
          <Divider sx={{ borderColor: '#BAE6FD', my: 1 }} />
          <Typography sx={{ fontSize: '0.88rem', fontStyle: 'italic', lineHeight: 1.5, color: '#0369A1' }}>
            No medical contraindications for air travel. <strong>The patient is fit to fly.</strong>
          </Typography>
          {data.validUntil && (
            <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 1 }}>
              Справка действительна до / Certificate valid until: <strong>{data.validUntil}</strong>
            </Typography>
          )}
        </Box>

        {/* SIGNATURES & STAMP SECTION */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box sx={{ width: '58%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, width: 140 }}>
                Лечащий врач / Doctor:
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>
                {data.doctorName || 'Добрушкин А.М.'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.82rem', color: '#64748B', width: 140 }}>
                Специальность / Specialty:
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#334155' }}>
                {data.doctorSpecialty || 'Врач травматолог-ортопед'} / {data.doctorSpecialtyEn || 'Orthopedic Surgeon'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontSize: '0.82rem', color: '#64748B', width: 140 }}>
                Подпись / Signature:
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                ___________________
              </Typography>
            </Box>

            <Box sx={{ mt: 2.5 }}>
              <Box sx={{ width: 110, height: 48, border: '1px dashed #94A3B8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  М.П. / Stamp
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* QR CODE VERIFICATION BOX */}
          <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, bgcolor: '#F8FAFC', p: 1.5, border: '1px solid #E2E8F0', borderRadius: '4px' }}>
            <QRCodeSVG value={verifyUrl} size={64} level="M" />
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#334155' }}>
              QR-проверка подлинности
            </Typography>
            <Typography sx={{ fontSize: '0.55rem', color: '#64748B', fontFamily: 'monospace' }}>
              {data.verificationHash ? data.verificationHash.slice(0, 16) : data.documentNumber}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
);
