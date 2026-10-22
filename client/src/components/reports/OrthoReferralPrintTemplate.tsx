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
import LatexText from '../ortho/LatexText';
import { resolveClinicalProtocolText, resolveItemPreparation, resolveAggregatedPreparation } from '../../utils/clinicalProtocolResolver';

export interface OrthoReferralItemData {
  id?: number | string;
  domain: string;
  service_code?: string;
  item_title: string;
  item_details?: string;
  formula_latex?: string;
  preparation_notes?: string;
}

export interface OrthoReferralData {
  id?: number | string;
  referral_number: string;
  issue_date: string;
  valid_days: number;
  expires_at: string;
  doctor_name: string;
  doctor_specialization?: string;
  
  // Performer from DB
  performer_id: number;
  performer_name: string;
  performer_is_internal: boolean | number;
  performer_address?: string;

  // Patient
  patient: {
    id?: number;
    fullName: string;
    birthDate?: string;
    gender?: string;
    phone?: string;
    cardNum?: string;
  };

  // Clinical
  icd10_code: string;
  icd10_name?: string;
  clinical_diagnosis: string;
  target_joint?: string;
  target_side?: string;
  anamnesis_summary?: string;
  preparation_instructions?: string;
  special_notes?: string;
  
  items: OrthoReferralItemData[];
  verification_hash?: string;
  status?: string;
}

interface OrthoReferralPrintTemplateProps {
  data: OrthoReferralData;
}

const getDomainBadge = (domain: string) => {
  switch (domain.toLowerCase()) {
    case 'diagnostics':
    case 'diagnostic':
      return { label: 'Диагностика', color: '#0369A1', bg: '#E0F2FE', border: '#BAE6FD' };
    case 'manipulation':
      return { label: 'Манипуляция', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
    case 'surgery':
      return { label: 'Операция', color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA' };
    case 'physio':
    case 'physiotherapy':
      return { label: 'Физиотерапия', color: '#6D28D9', bg: '#EDE9FE', border: '#DDD6FE' };
    case 'orthotics':
      return { label: 'Ортезирование', color: '#0F766E', bg: '#CCFBF1', border: '#99F6E4' };
    case 'lfk':
      return { label: 'ЛФК', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' };
    default:
      return { label: 'Процедура', color: '#334155', bg: '#F1F5F9', border: '#CBD5E1' };
  }
};

const OrthoReferralPrintTemplate = forwardRef<HTMLDivElement, OrthoReferralPrintTemplateProps>(
  ({ data }, ref) => {
    const isInternal = Boolean(Number(data.performer_is_internal) === 1);
    const issueDateFormatted = data.issue_date
      ? new Date(data.issue_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : new Date().toLocaleDateString('ru-RU');

    const expireDateFormatted = data.expires_at
      ? new Date(data.expires_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';

    const qrVerificationUrl = `https://dobrushkin-ortho.ru/verify/referral?num=${encodeURIComponent(data.referral_number)}&hash=${encodeURIComponent(data.verification_hash || '')}`;

    return (
      <Box
        ref={ref}
        sx={{
          width: '100%',
          maxWidth: '820px',
          margin: '0 auto',
          p: '16mm 14mm',
          bgcolor: '#FFFFFF',
          color: '#0F172A',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: 1.4,
          boxSizing: 'border-box',
          '@media print': {
            p: '8mm 10mm',
            maxWidth: '100%'
          }
        }}
      >
        {/* 1. CLINIC LETTERHEAD */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #0F3C64',
            pb: 1.5,
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/MainLogoTransparent.png"
              alt="Логотип Центра"
              sx={{ width: 62, height: 62, objectFit: 'contain' }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: '#0F3C64',
                  fontSize: '1.18rem',
                  letterSpacing: '-0.2px',
                  textTransform: 'uppercase',
                  lineHeight: 1.15
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

          {/* QR Code & Document Num */}
          <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <QRCodeSVG value={qrVerificationUrl} size={54} level="M" />
            <Typography variant="caption" sx={{ fontSize: '0.66rem', color: '#64748B', mt: 0.3, letterSpacing: '0.5px' }}>
              QR ВЕРИФИКАЦИЯ
            </Typography>
          </Box>
        </Box>

        {/* 2. DOCUMENT TITLE & NUMBER */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: '#0F3C64',
              fontSize: '1.28rem',
              letterSpacing: '-0.3px',
              textTransform: 'uppercase'
            }}
          >
            НАПРАВЛЕНИЕ № {data.referral_number}
          </Typography>
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}>
            на диагностическое исследование / медицинскую процедуру / хирургическое вмешательство
          </Typography>
        </Box>

        {/* 3. PROMINENT VALIDITY BANNER (90 ДНЕЙ) */}
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            mb: 2,
            bgcolor: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            borderRadius: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: '#16A34A',
                boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.2)'
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#166534', fontSize: '0.88rem' }}>
              Срок действия направления: {data.valid_days || 90} календарных дней
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#166534', fontSize: '0.88rem' }}>
              Действительно по: {expireDateFormatted} включительно
            </Typography>
            <Typography variant="caption" sx={{ color: '#15803D', display: 'block', fontSize: '0.72rem' }}>
              Дата выписки: {issueDateFormatted}
            </Typography>
          </Box>
        </Paper>

        {/* 4. PERFORMER (ОРГАНИЗАЦИЯ-ИСПОЛНИТЕЛЬ ИЗ БД) */}
        <Paper
          variant="outlined"
          className="print-section"
          sx={{
            p: 1.25,
            mb: 2,
            borderColor: isInternal ? '#BBF7D0' : '#CBD5E1',
            bgcolor: isInternal ? '#F8FAFC' : '#FAFBFD',
            borderRadius: 1.5,
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Chip
                label={isInternal ? 'Внутренний исполнитель Центра' : 'Внешняя медицинская организация'}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  fontWeight: 800,
                  bgcolor: isInternal ? '#DCFCE7' : '#EFF6FF',
                  color: isInternal ? '#15803D' : '#1D4ED8',
                  border: `1px solid ${isInternal ? '#86EFAC' : '#BFDBFE'}`
                }}
              />
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Куда направляется пациент:
              </Typography>
            </Box>
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.94rem' }}>
            {data.performer_name}
          </Typography>
          {data.performer_address && (
            <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.2 }}>
              Адрес / маршрутизация: {data.performer_address}
            </Typography>
          )}
        </Paper>

        {/* 5. PATIENT INFORMATION */}
        <Paper
          variant="outlined"
          className="print-section"
          sx={{
            p: 1.25,
            mb: 2,
            borderColor: '#CBD5E1',
            bgcolor: '#F8FAFC',
            borderRadius: 1.5,
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important'
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontSize: '0.86rem' }}>
                <Box component="span" sx={{ fontWeight: 700, color: '#475569' }}>Пациент: </Box>
                <Box component="span" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '0.96rem' }}>
                  {data.patient?.fullName}
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3 }}>
                Дата рождения: {data.patient?.birthDate || 'Не указана'}
                {data.patient?.gender ? ` • Пол: ${data.patient.gender}` : ''}
                {data.patient?.phone ? ` • Тел: ${data.patient.phone}` : ''}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>
                <Box component="span" sx={{ fontWeight: 700, color: '#475569' }}>Амб. карта №: </Box>
                <Box component="span" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                  {data.patient?.cardNum || `MED-${data.patient?.id || 'NEW'}`}
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3 }}>
                Лечащий врач: Добрушкин А.М
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* 6. CLINICAL CONTEXT & DIAGNOSIS */}
        <Box
          className="print-section"
          sx={{
            mb: 2,
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important'
          }}
        >
          <Typography
            variant="subtitle2"
            className="print-heading"
            sx={{
              fontWeight: 800,
              color: '#0F3C64',
              borderBottom: '1px solid #E2E8F0',
              pb: 0.4,
              mb: 0.8,
              pageBreakAfter: 'avoid !important',
              breakAfter: 'avoid !important'
            }}
          >
            Клинический диагноз и цель направления
          </Typography>
          <Box sx={{ pl: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
              <Chip
                label={`МКБ-10: ${data.icd10_code}`}
                size="small"
                sx={{
                  bgcolor: '#0F3C64',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  height: 20
                }}
              />
              {data.icd10_name && (
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.86rem' }}>
                  {data.icd10_name}
                </Typography>
              )}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem', lineHeight: 1.45 }}>
              <LatexText text={data.clinical_diagnosis} />
            </Typography>

            {data.anamnesis_summary && (
              <Typography variant="body2" sx={{ fontSize: '0.84rem', color: '#475569', mt: 0.5, lineHeight: 1.4 }}>
                <Box component="span" sx={{ fontWeight: 700, color: '#334155' }}>Клиническое обоснование: </Box>
                <LatexText text={data.anamnesis_summary} />
              </Typography>
            )}

            {(data.target_joint || data.target_side) && (
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3 }}>
                Анатомическая зона: {data.target_joint || 'Сустав'} ({data.target_side === 'left' ? 'Левая сторона' : data.target_side === 'right' ? 'Правая сторона' : 'Двустороннее поражение'})
              </Typography>
            )}
          </Box>
        </Box>

        {/* 7. PRESCRIBED ITEMS TABLE */}
        <Box
          className="print-section"
          sx={{
            mb: 2,
            pageBreakInside: (data.items?.length || 0) <= 3 ? 'avoid !important' : 'auto',
            breakInside: (data.items?.length || 0) <= 3 ? 'avoid !important' : 'auto'
          }}
        >
          <Typography
            variant="subtitle2"
            className="print-heading"
            sx={{
              fontWeight: 800,
              color: '#0F3C64',
              borderBottom: '1px solid #E2E8F0',
              pb: 0.4,
              mb: 0.8,
              pageBreakAfter: 'avoid !important',
              breakAfter: 'avoid !important'
            }}
          >
            {data.items?.length === 1
              ? 'Назначенное исследование / процедура'
              : `Перечень назначаемых процедур / исследований / операций (${data.items?.length || 0})`}
          </Typography>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderColor: '#CBD5E1',
              overflow: 'visible !important',
              pageBreakInside: 'auto',
              breakInside: 'auto'
            }}
          >
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F1F5F9', display: 'table-header-group !important' }}>
                <TableRow sx={{ pageBreakInside: 'avoid !important', breakInside: 'avoid !important' }}>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', py: 0.6, width: 36 }}>№</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', py: 0.6 }}>Наименование назначения</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', py: 0.6, width: 110 }} align="center">Профиль</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem', py: 0.6 }}>Клинические параметры и протокол</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items && data.items.length > 0 ? (
                  data.items.map((item, idx) => {
                    const badge = getDomainBadge(item.domain);
                    return (
                      <TableRow key={idx} sx={{ pageBreakInside: 'avoid !important', breakInside: 'avoid !important' }}>
                        <TableCell sx={{ fontSize: '0.8rem', py: 0.6, fontWeight: 700 }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontSize: '0.84rem', py: 0.6 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                            {item.item_title}
                          </Typography>
                          {item.service_code && (
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                              Код: {item.service_code}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0.6 }}>
                          <Chip
                            label={badge.label}
                            size="small"
                            sx={{
                              height: 19,
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              bgcolor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', py: 0.6 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#1E293B', lineHeight: 1.35 }}>
                            <LatexText text={resolveClinicalProtocolText(item, {
                              targetJoint: data.target_joint,
                              targetSide: data.target_side,
                              diagnosis: data.clinical_diagnosis
                            })} />
                          </Typography>
                          {item.formula_latex && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#047857', fontWeight: 600, mt: 0.3 }}>
                              <LatexText text={item.formula_latex} />
                            </Typography>
                          )}
                          {(() => {
                            const prep = resolveItemPreparation(item);
                            return prep ? (
                              <Box sx={{ mt: 0.5, p: '3px 8px', bgcolor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 1 }}>
                                <Typography variant="caption" sx={{ color: '#92400E', fontSize: '0.74rem', lineHeight: 1.35, display: 'block' }}>
                                  <strong style={{ color: '#78350F' }}>Подготовка:</strong> <LatexText text={prep} />
                                </Typography>
                              </Box>
                            ) : null;
                          })()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow sx={{ pageBreakInside: 'avoid !important', breakInside: 'avoid !important' }}>
                    <TableCell colSpan={4} align="center" sx={{ py: 1.5, color: '#64748B', fontSize: '0.82rem' }}>
                      Позиции назначения не выбраны
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* 8. PREPARATION INSTRUCTIONS (ИЗВЛЕЧЕНО ИЗ КАТАЛОГОВ БД / КЛИНИЧЕСКИЙ СТАНДАРТ) */}
        {(() => {
          const aggregatedMemo = resolveAggregatedPreparation(data.items, data.preparation_instructions);
          if (!aggregatedMemo || !aggregatedMemo.trim()) return null;
          return (
            <Paper
              variant="outlined"
              className="print-section"
              sx={{
                p: 1.5,
                mb: 2,
                bgcolor: '#FFFBEB',
                borderColor: '#FDE68A',
                borderRadius: 1.5,
                pageBreakInside: 'avoid !important',
                breakInside: 'avoid !important'
              }}
            >
              <Typography
                variant="subtitle2"
                className="print-heading"
                sx={{
                  fontWeight: 800,
                  color: '#92400E',
                  fontSize: '0.86rem',
                  mb: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  pageBreakAfter: 'avoid !important',
                  breakAfter: 'avoid !important'
                }}
              >
                Памятка пациенту по подготовке к процедурам (из клинического стандарта Центра):
              </Typography>
              <Typography
                variant="body2"
                component="div"
                sx={{
                  fontSize: '0.8rem',
                  color: '#78350F',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-line'
                }}
              >
                <LatexText text={aggregatedMemo} />
              </Typography>
            </Paper>
          );
        })()}

        {data.special_notes && (
          <Box
            className="print-section"
            sx={{
              mb: 1.5,
              pageBreakInside: 'avoid !important',
              breakInside: 'avoid !important'
            }}
          >
            <Typography
              variant="caption"
              className="print-heading"
              sx={{
                fontWeight: 700,
                color: '#475569',
                display: 'block',
                pageBreakAfter: 'avoid !important',
                breakAfter: 'avoid !important'
              }}
            >
              Особые клинические отметки:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#1E293B' }}>
              {data.special_notes}
            </Typography>
          </Box>
        )}

        {/* 9. SIGNATURES & STAMP (PAGE-BREAK AVOID CONTAINER) */}
        <Box
          className="print-section"
          sx={{
            mt: 2.5,
            pt: 1.5,
            borderTop: '1px solid #CBD5E1',
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important',
            position: 'relative'
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 2, alignItems: 'flex-start' }}>
            {/* Left: Doctor block with signature and overlay stamp */}
            <Box sx={{ position: 'relative' }}>
              <Typography variant="body2" sx={{ fontSize: '0.86rem', color: '#0F172A', fontWeight: 700 }}>
                Лечащий врач: {data.doctor_name || 'Врач травматолог-ортопед'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                {data.doctor_specialization || 'Врач травматолог-ортопед'}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.84rem', color: '#334155' }}>
                  Подпись: ______________________
                </Typography>
              </Box>

              {/* Clinic Authentic Stamp Overlay */}
              <Box
                component="img"
                src="/StampInvertDarkTransparent.png"
                alt="Печать клиники"
                sx={{
                  position: 'absolute',
                  top: -8,
                  left: 140,
                  width: 140,
                  height: 140,
                  objectFit: 'contain',
                  opacity: 0.88,
                  pointerEvents: 'none',
                  transform: 'rotate(-5deg)'
                }}
              />
            </Box>

            {/* Right: Patient acknowledgement & verification */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 0.5 }}>
                С условиями подготовки и сроком действия 90 дней ознакомлен:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.84rem', color: '#334155', mt: 2 }}>
                Подпись пациента: ____________________
              </Typography>
              {data.verification_hash && (
                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.64rem', display: 'block', mt: 1 }}>
                  ХЭШ: {data.verification_hash}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem' }}>
              Документ сформирован в Системе «Центр Ортопедии и Травматологии Добрушкина».
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem' }}>
              Отметка об исполнении: Дата: «___» ________ 202_ г. / Подпись исполнителя: ________
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
);

OrthoReferralPrintTemplate.displayName = 'OrthoReferralPrintTemplate';

export default OrthoReferralPrintTemplate;
