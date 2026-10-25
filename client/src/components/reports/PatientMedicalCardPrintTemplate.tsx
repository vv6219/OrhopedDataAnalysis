import { forwardRef } from 'react';
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
import { QRCodeSVG } from 'qrcode.react';

export interface PatientMedicalCardData {
  patient: {
    id: number;
    fullName: string;
    birthDate?: string;
    age?: number;
    gender?: string;
    phone?: string;
    cardNum?: string;
    address?: string;
    dmsInsurer?: string;
  };
  clinicalProfile?: {
    allergies?: string;
    implants_endoprosthetics?: string;
    has_pacemaker?: number | boolean;
    dominant_limb?: string;
    chronic_conditions?: string;
    blood_group?: string;
    ortho_anamnesis_notes?: string;
  };
  protocolsHistory: Array<{
    id: number;
    vdate: string;
    doctor_name?: string;
    title?: string;
    mkb_code?: string;
    mkb_name?: string;
    primary_joint?: string;
    vas_score?: number;
    status?: string;
  }>;
  totalVisitsCount: number;
  lastVisitDate?: string;
  doctorName?: string;
}

interface PatientMedicalCardPrintTemplateProps {
  data: PatientMedicalCardData;
}

export const PatientMedicalCardPrintTemplate = forwardRef<HTMLDivElement, PatientMedicalCardPrintTemplateProps>(
  ({ data }, ref) => {
    const formattedBirthDate = data.patient.birthDate
      ? new Date(data.patient.birthDate).toLocaleDateString('ru-RU')
      : '—';

    const qrValue = `https://clinic-dobrushkin.ru/verify/medcard/${encodeURIComponent(data.patient.cardNum || data.patient.id)}?pt=${data.patient.id}`;

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
          lineHeight: 1.4,
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
                Медицинская документация: Форма № 025/у «Медицинская карта пациента, получающего медицинскую помощь в амбулаторных условиях»
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

        {/* 2. CARD TITLE & NUMBER */}
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
            МЕДИЦИНСКАЯ КАРТА АМБУЛАТОРНОГО ПАЦИЕНТА № {data.patient.cardNum || data.patient.id}
          </Typography>
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}>
            Учетная форма № 025/у • Электронная медицинская карта (ЭМК)
          </Typography>
        </Box>

        {/* 3. PASSPORT DEMOGRAPHICS */}
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
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1, textTransform: 'uppercase', fontSize: '0.82rem' }}>
            I. Паспортная часть и регистрационные данные:
          </Typography>
          <TableContainer>
            <Table size="small" sx={{ '& td': { border: 'none', py: 0.35, px: 0.8 } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ width: '22%', fontWeight: 700, color: '#475569', fontSize: '0.84rem' }}>
                    ФИО Пациента:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.94rem' }}>
                    {data.patient.fullName}
                  </TableCell>
                  <TableCell sx={{ width: '20%', fontWeight: 700, color: '#475569', fontSize: '0.84rem' }}>
                    Дата рождения / Возраст:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem' }}>
                    {formattedBirthDate} ({data.patient.age ? `${data.patient.age} лет` : '—'})
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.84rem' }}>
                    Пол:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem' }}>
                    {data.patient.gender === 'm' || data.patient.gender === 'М' ? 'Мужской' : data.patient.gender === 'f' || data.patient.gender === 'Ж' ? 'Женский' : '—'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.84rem' }}>
                    Контактный телефон:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem' }}>
                    {data.patient.phone || '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.84rem' }}>
                    Адрес проживания:
                  </TableCell>
                  <TableCell colSpan={3} sx={{ color: '#334155', fontSize: '0.85rem' }}>
                    {data.patient.address || 'г. Сочи'}
                  </TableCell>
                </TableRow>
                {data.patient.dmsInsurer && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.84rem' }}>
                      ДМС / Страховая:
                    </TableCell>
                    <TableCell colSpan={3} sx={{ color: '#0369A1', fontWeight: 600, fontSize: '0.85rem' }}>
                      {data.patient.dmsInsurer}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 4. ORTHOPEDIC CLINICAL PASSPORT */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2,
            bgcolor: '#FEF3C7',
            border: '1.5px solid #FCD34D',
            borderRadius: 1.5,
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#92400E', textTransform: 'uppercase', fontSize: '0.84rem' }}>
              II. Ортопедический паспорт и аллергоанамнез пациента:
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small" sx={{ '& td': { border: 'none', py: 0.35, px: 0.8 } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ width: '25%', fontWeight: 700, color: '#78350F', fontSize: '0.84rem' }}>
                    Аллергические реакции:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: data.clinicalProfile?.allergies ? '#DC2626' : '#15803D', fontSize: '0.88rem' }}>
                    {data.clinicalProfile?.allergies || 'Не отягощен (аллергии не зарегистрированы)'}
                  </TableCell>
                  <TableCell sx={{ width: '20%', fontWeight: 700, color: '#78350F', fontSize: '0.84rem' }}>
                    Группа крови / Rh:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem' }}>
                    {data.clinicalProfile?.blood_group || 'Не указана'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#78350F', fontSize: '0.84rem' }}>
                    Импланты / Эндопротезы:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem' }}>
                    {data.clinicalProfile?.implants_endoprosthetics || 'Отсутствуют'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#78350F', fontSize: '0.84rem' }}>
                    Кардиостимулятор:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: data.clinicalProfile?.has_pacemaker ? '#DC2626' : '#15803D', fontSize: '0.88rem' }}>
                    {data.clinicalProfile?.has_pacemaker ? 'ДА (Противопоказание к МРТ)' : 'НЕТ'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#78350F', fontSize: '0.84rem' }}>
                    Ведущая конечность:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem' }}>
                    {data.clinicalProfile?.dominant_limb === 'left' ? 'Левая' : 'Правая'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#78350F', fontSize: '0.84rem' }}>
                    Хронические патологии:
                  </TableCell>
                  <TableCell sx={{ color: '#334155', fontSize: '0.85rem' }}>
                    {data.clinicalProfile?.chronic_conditions || 'Без особенностей'}
                  </TableCell>
                </TableRow>
                {data.clinicalProfile?.ortho_anamnesis_notes && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#78350F', fontSize: '0.84rem' }}>
                      Ортопедический анамнез:
                    </TableCell>
                    <TableCell colSpan={3} sx={{ color: '#334155', fontSize: '0.85rem' }}>
                      {data.clinicalProfile.ortho_anamnesis_notes}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 5. HISTORY OF VISITS & CLINICAL PROTOCOLS */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', fontSize: '0.82rem' }}>
              III. Лист записи клинических приемов и протоколов осмотра ({data.protocolsHistory.length}):
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Всего визитов в клинику: {data.totalVisitsCount || data.protocolsHistory.length}
            </Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, borderColor: '#CBD5E1' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.78rem', py: 0.6 }}>Дата</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.78rem', py: 0.6 }}>Врач-ортопед</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.78rem', py: 0.6 }}>Диагноз / Сустав</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.78rem', py: 0.6 }}>МКБ-10</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.78rem', py: 0.6, textAlign: 'center' }}>ВАШ</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.78rem', py: 0.6, textAlign: 'center' }}>Статус</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.protocolsHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 2, color: '#94A3B8' }}>
                      История приёмов пуста
                    </TableCell>
                  </TableRow>
                ) : (
                  data.protocolsHistory.map((p) => (
                    <TableRow key={p.id} sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600, py: 0.6, whiteSpace: 'nowrap' }}>
                        {p.vdate ? new Date(p.vdate).toLocaleDateString('ru-RU') : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#1E293B', py: 0.6 }}>
                        {p.doctor_name || 'Добрушкин А.М.'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#334155', py: 0.6 }}>
                        {p.mkb_name || p.title || 'Осмотр травматолога-ортопеда'}
                        {p.primary_joint && (
                          <Chip
                            label={p.primary_joint}
                            size="small"
                            sx={{ ml: 0.8, height: 18, fontSize: '0.68rem', bgcolor: '#E0F2FE', color: '#0369A1' }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284C7', py: 0.6 }}>
                        {p.mkb_code || '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', textAlign: 'center', fontWeight: 700, color: p.vas_score && p.vas_score > 5 ? '#DC2626' : '#0F3C64', py: 0.6 }}>
                        {p.vas_score !== undefined ? `${p.vas_score}/10` : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', textAlign: 'center', py: 0.6 }}>
                        {p.status === 'signed' ? (
                          <Chip label="ЭЦП" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }} />
                        ) : p.status === 'draft' ? (
                          <Chip label="Черновик" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }} />
                        ) : (
                          <Chip label={p.status || 'Запись'} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* 6. FOOTER & SIGNATURES */}
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
                Главный врач / Ответственный специалист:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B', mt: 0.3 }}>
                {data.doctorName || 'Добрушкин А.М.'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                Центр Ортопедии и Травматологии
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', minWidth: '220px' }}>
              <Box sx={{ borderBottom: '1px solid #1E293B', height: 35, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                (подпись врача)
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
              Электронная медицинская карта сформирована в соответствии с Приказом Минздрава России от 15.12.2014 № 834н. Дата печати: {new Date().toLocaleString('ru-RU')}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
);

PatientMedicalCardPrintTemplate.displayName = 'PatientMedicalCardPrintTemplate';
export default PatientMedicalCardPrintTemplate;
