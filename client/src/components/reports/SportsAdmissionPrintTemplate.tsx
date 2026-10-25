import React from 'react';
import { Box, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

export interface SportsAdmissionData {
  documentNumber: string; // e.g. 'СПОРТ-2026-000001'
  issueDate: string; // e.g. '2026-10-25'
  validUntil: string; // e.g. '2027-04-25'
  patient: {
    fullName: string;
    birthDate?: string;
    gender?: string | number; // 1: Мужской, 2: Женский
    snils?: string;
    omsPolicy?: string;
    address?: string;
  };
  sportDiscipline: string; // e.g. 'Плавание', 'Легкая атлетика', 'Горнолыжный спорт'
  sportEventStage: 'training_and_competition' | 'gto_only' | 'training_only'; // Тренировки и соревнования / ГТО
  examResultsSummary?: string; // e.g. 'ЭКГ в покое и с нагрузкой: вариант нормы. Проба Руфье 4.2 (отлично). Суставы и позвоночник без патологической подвижности.'
  restrictionsSummary?: string; // Ограничения при наличии
  doctorName?: string;
  doctorSpecialty?: string;
  verificationHash?: string;
  isDuplicate?: boolean;
}

interface SportsAdmissionPrintTemplateProps {
  data: SportsAdmissionData;
}

export const SportsAdmissionPrintTemplate = React.forwardRef<HTMLDivElement, SportsAdmissionPrintTemplateProps>(
  ({ data }, ref) => {
    const isFemale = data.patient.gender === 2 || data.patient.gender === 'female' || data.patient.gender === 'Ж';
    const sexLabel = isFemale ? 'Женский' : 'Мужской';
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
        {/* DUPLICATE WATERMARK */}
        {data.isDuplicate && (
          <Box
            sx={{
              position: 'absolute',
              top: '40%',
              left: '25%',
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
            ДУБЛИКАТ
          </Box>
        )}

        {/* CLINIC HEADER */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #16A34A', pb: 1.5, mb: 2 }}>
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
              <Typography sx={{ fontSize: '0.78rem', color: '#475569' }}>
                Отделение спортивной травматологии, ортопедии и реабилитации
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
                Лицензия № ЛО-23-01-014522 • г. Сочи, ул. Навагинская, 9Д • Тел: +7 (862) 295-00-55
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right', maxWidth: 220 }}>
            <Typography sx={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.2 }}>
              В соответствии с Приказом Минздрава России от 23 октября 2020 г. <strong>№ 1144н</strong>
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#64748B', mt: 0.5 }}>
              Приложение № 1
            </Typography>
          </Box>
        </Box>

        {/* TITLE */}
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', color: '#0F172A', letterSpacing: '0.03em' }}>
            МЕДИЦИНСКОЕ ЗАКЛЮЧЕНИЕ
          </Typography>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155', maxWidth: 650, margin: '0 auto', lineHeight: 1.3 }}>
            о допуске к участию в физкультурных и спортивных мероприятиях, тренировочных мероприятиях и к выполнению нормативов ГТО
          </Typography>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', px: 2, py: 0.5, borderRadius: '4px', mt: 1 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#15803D' }}>
              № {data.documentNumber}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#475569' }}>
              от {data.issueDate} г.
            </Typography>
          </Box>
        </Box>

        {/* PATIENT DETAILS TABLE */}
        <Box sx={{ border: '1px solid #CBD5E1', borderRadius: '4px', overflow: 'hidden', mb: 2 }}>
          <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
            <Box sx={{ width: '35%', p: 1, borderRight: '1px solid #E2E8F0' }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                1. Выдано (ФИО):
              </Typography>
            </Box>
            <Box sx={{ width: '65%', p: 1, bgcolor: '#FFFFFF' }}>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                {data.patient.fullName}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
            <Box sx={{ width: '35%', p: 1, borderRight: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                2. Дата рождения и пол:
              </Typography>
            </Box>
            <Box sx={{ width: '65%', p: 1, display: 'flex', gap: 4 }}>
              <Typography sx={{ fontSize: '0.85rem' }}>
                <strong>Дата:</strong> {data.patient.birthDate || '—'}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>
                <strong>Пол:</strong> {sexLabel}
              </Typography>
            </Box>
          </Box>

          {data.patient.snils && (
            <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
              <Box sx={{ width: '35%', p: 1, borderRight: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  3. СНИЛС:
                </Typography>
              </Box>
              <Box sx={{ width: '65%', p: 1 }}>
                <Typography sx={{ fontSize: '0.85rem' }}>
                  {data.patient.snils}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
            <Box sx={{ width: '35%', p: 1, borderRight: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                4. Вид спорта / дисциплина:
              </Typography>
            </Box>
            <Box sx={{ width: '65%', p: 1 }}>
              <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: '#15803D' }}>
                {data.sportDiscipline || 'Общая физическая культура / Спортивная секция'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
            <Box sx={{ width: '35%', p: 1, borderRight: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                5. Данные обследований:
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
                (ЭКГ, ортопедический статус)
              </Typography>
            </Box>
            <Box sx={{ width: '65%', p: 1 }}>
              <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
                {data.examResultsSummary || 'ЭКГ с нагрузочной пробой — синусовый ритм, без нарушений проводимости и ишемии. Опорно-двигательный аппарат: оси конечностей правильные, деформаций нет, объем движений в суставах полный.'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* OFFICIAL CONCLUSION (VERBATIM FROM ORDER 1144N) */}
        <Box
          sx={{
            border: '2px solid #16A34A',
            borderRadius: '6px',
            bgcolor: '#F0FDF4',
            p: 2,
            mb: 2.5
          }}
        >
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', mb: 0.5 }}>
            ЗАКЛЮЧЕНИЕ:
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.5, color: '#0F172A' }}>
            <strong>Допущен(а)</strong> к тренировочным мероприятиям и участию в спортивных соревнованиях
            {data.sportEventStage === 'gto_only' ? ' и к сдаче нормативов комплекса ГТО' : ''} по виду спорта{' '}
            <span style={{ textDecoration: 'underline', fontWeight: 800 }}>{data.sportDiscipline}</span>{' '}
            на срок <strong>до {data.validUntil}</strong>.
          </Typography>
          {data.restrictionsSummary && (
            <Typography sx={{ fontSize: '0.82rem', color: '#B45309', mt: 1 }}>
              <strong>Особые условия / ограничения:</strong> {data.restrictionsSummary}
            </Typography>
          )}
        </Box>

        {/* CLINICAL NOTE */}
        <Typography sx={{ fontSize: '0.72rem', color: '#64748B', mb: 3 }}>
          Заключение выдано в соответствии с Порядком организации оказания медицинской помощи лицам, занимающимся физической культурой и спортом (Приказ МЗ РФ № 1144н). Действительно для предъявления в спортивные секции, клубы, федерации и оргкомитеты соревнований.
        </Typography>

        {/* SIGNATURES & STAMP */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box sx={{ width: '60%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, width: 150 }}>
                Врач по спорт. медицине:
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>
                {data.doctorName || 'Добрушкин А.М.'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.82rem', color: '#64748B', width: 150 }}>
                Специальность:
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#334155' }}>
                {data.doctorSpecialty || 'Врач травматолог-ортопед, спортивная медицина'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontSize: '0.82rem', color: '#64748B', width: 150 }}>
                Подпись врача:
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                ___________________
              </Typography>
            </Box>

            <Box sx={{ mt: 2.5 }}>
              <Box sx={{ width: 110, height: 48, border: '1px dashed #94A3B8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  М.П. Клиники
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* QR VERIFICATION */}
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
