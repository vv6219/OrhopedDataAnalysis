import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

export interface SickLeaveData {
  documentNumber: string; // 12-digit number e.g. '001 234 567 891'
  isDuplicate?: boolean;
  issueDate: string; // e.g. '2026-10-20'
  clinicName?: string;
  clinicAddress?: string;
  clinicOgrn?: string;
  clinicLicense?: string;
  patient: {
    fullName: string;
    birthDate?: string;
    gender?: number | string; // 1: male, 2: female
    phone?: string;
    snils?: string;
    cardNum?: number | string;
  };
  reasonCode: string; // '02' (травма), '01' (заболевание), '10' (манипуляции)
  reasonTitle: string; // 'Травма'
  employerName: string; // Место работы
  workType: 'main' | 'part_time'; // Основное / По совместительству
  startDate: string; // С какого числа
  endDate: string; // По какое число
  returnToWorkDate: string; // Приступить к работе с
  doctorName?: string; // 'Добрушкин А.М'
  doctorSpecialty?: string; // 'Врач травматолог-ортопед'
  icd10Code?: string;
  clinicalDiagnosis?: string;
  officialNotice?: string;
}

interface SickLeavePrintTemplateProps {
  data: SickLeaveData;
}

// Character cell renderer imitating standard Russian official blank grid
const LetterCells: React.FC<{ text: string; maxLen?: number; cellWidth?: number; height?: number }> = ({
  text,
  maxLen = 30,
  cellWidth = 14,
  height = 18
}) => {
  const chars = (text || '').toUpperCase().padEnd(maxLen, ' ').slice(0, maxLen).split('');
  return (
    <Box sx={{ display: 'inline-flex', flexWrap: 'nowrap', border: '1px solid #94A3B8', bgcolor: '#FFFFFF' }}>
      {chars.map((ch, idx) => (
        <Box
          key={idx}
          sx={{
            width: cellWidth,
            height: height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.72rem',
            fontWeight: 800,
            fontFamily: 'Courier New, monospace',
            color: '#0F172A',
            borderRight: idx < chars.length - 1 ? '1px solid #CBD5E1' : 'none',
            bgcolor: ch.trim() ? '#F8FAFC' : '#FFFFFF'
          }}
        >
          {ch}
        </Box>
      ))}
    </Box>
  );
};

export const SickLeavePrintTemplate: React.FC<SickLeavePrintTemplateProps> = ({ data }) => {
  const clinicName = data.clinicName || 'Центр Ортопедии и Травматологии Добрушкина';
  const clinicAddress = data.clinicAddress || 'г. Сочи, ул. Навагинская, д. 9Д';
  const clinicOgrn = data.clinicOgrn || '1192375051234';
  const doctorName = data.doctorName || 'Добрушкин А.М';
  const doctorSpecialty = data.doctorSpecialty || 'Врач травматолог-ортопед';
  const noticeText = data.officialNotice ||
    'Медицинское учреждение выдает листок нетрудоспособности работнику при временной нетрудоспособности. Документ подтверждает право на получение пособия по нетрудоспособности. Листок нетрудоспособности используется работодателем для расчета и выплаты пособия.';

  const parseDateParts = (dStr: string) => {
    if (!dStr) return { day: '  ', month: '  ', year: '    ' };
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return { day: '  ', month: '  ', year: '    ' };
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return { day, month, year };
  };

  const issueParts = parseDateParts(data.issueDate);
  const birthParts = parseDateParts(data.patient.birthDate || '');
  const startParts = parseDateParts(data.startDate);
  const endParts = parseDateParts(data.endDate);
  const returnParts = parseDateParts(data.returnToWorkDate);

  const qrPayload = `LN:${data.documentNumber}|PAT:${data.patient.fullName}|D:${data.doctorName}|EXP:${data.endDate}`;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '8mm 10mm',
        bgcolor: '#FFFFFF',
        color: '#0F172A',
        fontFamily: '"Roboto", "Arial", sans-serif',
        boxSizing: 'border-box',
        '@media print': {
          padding: '6mm 8mm',
          width: '100%',
          boxShadow: 'none'
        }
      }}
    >
      {/* ===================== PAGE 1: ЛИСТОК НЕТРУДОСПОСОБНОСТИ ===================== */}
      <Box
        sx={{
          border: '2px solid #0F3C64',
          borderRadius: '4px',
          p: 1.5,
          bgcolor: '#FAFDFE',
          position: 'relative'
        }}
      >
        {/* TOP BAR: BARCODE & BLANK INFO */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F3C64', letterSpacing: '1px', fontSize: '1.25rem', lineHeight: 1.1 }}>
              ЛИСТОК НЕТРУДОСПОСОБНОСТИ
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>
              Форма утверждена Приказом Минздравсоцразвития России № 347н / ЭЛН
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, border: '1px solid #0F3C64', bgcolor: !data.isDuplicate ? '#0F3C64' : '#FFF' }} />
                <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 700 }}>первичный</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, border: '1px solid #0F3C64', bgcolor: data.isDuplicate ? '#0F3C64' : '#FFF' }} />
                <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>дубликат</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, ml: 1 }}>
            <Box sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
              <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748B', display: 'block', whiteSpace: 'nowrap', fontWeight: 600 }}>
                № ЛИСТКА НЕТРУДОСПОСОБНОСТИ:
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: '#0F3C64',
                  letterSpacing: '2px',
                  fontFamily: 'Courier New, monospace',
                  fontSize: '1.1rem',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2
                }}
              >
                {data.documentNumber}
              </Typography>
            </Box>
            <Box sx={{ flexShrink: 0 }}>
              <QRCodeSVG value={qrPayload} size={50} level="M" />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: '#0F3C64', borderWidth: '1px', mb: 1 }} />

        {/* SECTION: MEDICAL ORGANIZATION */}
        <Box sx={{ mb: 1, bgcolor: '#FFFFFF', p: 1, border: '1px solid #E2E8F0', borderRadius: '3px' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', fontSize: '0.68rem', display: 'block', mb: 0.3 }}>
            ЗАПОЛНЯЕТСЯ ВРАЧОМ МЕДИЦИНСКОЙ ОРГАНИЗАЦИИ
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.4 }}>
            <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#475569', minWidth: 160 }}>
              Медицинская организация:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem' }}>
              {clinicName}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.4 }}>
            <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#475569', minWidth: 160 }}>
              Адрес медицинской организации:
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.78rem' }}>
              {clinicAddress} • Лицензия ЛО-23-01-014522
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, mt: 0.5, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#475569' }}>ОГРН:</Typography>
              <LetterCells text={clinicOgrn} maxLen={13} cellWidth={11} height={16} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#475569' }}>Дата выдачи:</Typography>
              <LetterCells text={`${issueParts.day}.${issueParts.month}.${issueParts.year}`} maxLen={10} cellWidth={11} height={16} />
            </Box>
          </Box>
        </Box>

        {/* SECTION: PATIENT DATA */}
        <Box sx={{ mb: 1, bgcolor: '#FFFFFF', p: 1, border: '1px solid #E2E8F0', borderRadius: '3px' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.68rem', textTransform: 'uppercase', display: 'block', mb: 0.4 }}>
            Данные нетрудоспособного гражданина
          </Typography>

          <Box sx={{ mb: 0.6 }}>
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>
              ФИО нетрудоспособного:
            </Typography>
            <LetterCells text={data.patient.fullName} maxLen={38} cellWidth={12} height={17} />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#475569' }}>Дата рождения:</Typography>
              <LetterCells text={`${birthParts.day}.${birthParts.month}.${birthParts.year}`} maxLen={10} cellWidth={11} height={16} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#475569' }}>Пол:</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Box sx={{ width: 11, height: 11, border: '1px solid #0F3C64', bgcolor: Number(data.patient.gender) === 1 ? '#0F3C64' : '#FFF' }} />
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>М</Typography>
                <Box sx={{ width: 11, height: 11, border: '1px solid #0F3C64', bgcolor: Number(data.patient.gender) === 2 ? '#0F3C64' : '#FFF', ml: 0.5 }} />
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Ж</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#475569' }}>Причина нетрудоспособности (код):</Typography>
              <LetterCells text={data.reasonCode} maxLen={2} cellWidth={13} height={16} />
              <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#0F3C64' }}>
                — {data.reasonTitle}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* SECTION: EMPLOYER */}
        <Box sx={{ mb: 1, bgcolor: '#FFFFFF', p: 1, border: '1px solid #E2E8F0', borderRadius: '3px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.68rem', textTransform: 'uppercase' }}>
              Место работы (наименование организации)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <Box sx={{ width: 10, height: 10, border: '1px solid #0F3C64', bgcolor: data.workType === 'main' ? '#0F3C64' : '#FFF' }} />
                <Typography variant="caption" sx={{ fontSize: '0.68rem' }}>Основное</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <Box sx={{ width: 10, height: 10, border: '1px solid #0F3C64', bgcolor: data.workType === 'part_time' ? '#0F3C64' : '#FFF' }} />
                <Typography variant="caption" sx={{ fontSize: '0.68rem' }}>По совместительству</Typography>
              </Box>
            </Box>
          </Box>
          <LetterCells text={data.employerName || 'ПО МЕСТУ ТРЕБОВАНИЯ'} maxLen={38} cellWidth={12} height={17} />
        </Box>

        {/* SECTION: ОСВОБОЖДЕНИЕ ОТ РАБОТЫ (TABLE) */}
        <Box
          className="print-section"
          sx={{
            mb: 1,
            bgcolor: '#FFFFFF',
            border: '1.5px solid #0F3C64',
            borderRadius: '3px',
            overflow: 'hidden',
            pageBreakInside: 'avoid !important',
            breakInside: 'avoid !important'
          }}
        >
          <Box sx={{ bgcolor: '#0F3C64', color: '#FFFFFF', py: 0.4, px: 1, textAlign: 'center' }}>
            <Typography variant="caption" className="print-heading" sx={{ fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.72rem', pageBreakAfter: 'avoid !important', breakAfter: 'avoid !important' }}>
              ТАБЛИЦА: ОСВОБОЖДЕНИЕ ОТ РАБОТЫ
            </Typography>
          </Box>

          <Box
            component="table"
            sx={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.72rem',
              '& thead': {
                display: 'table-header-group !important'
              },
              '& tr': {
                pageBreakInside: 'avoid !important',
                breakInside: 'avoid !important'
              },
              '& th, & td': {
                border: '1px solid #CBD5E1',
                p: '4px 6px',
                textAlign: 'center'
              },
              '& th': {
                bgcolor: '#F1F5F9',
                fontWeight: 800,
                color: '#1E293B',
                fontSize: '0.68rem'
              }
            }}
          >
            <thead>
              <tr>
                <th style={{ width: '18%' }}>С какого числа</th>
                <th style={{ width: '18%' }}>По какое число</th>
                <th style={{ width: '28%' }}>Должность врача</th>
                <th style={{ width: '22%' }}>Фамилия и инициалы врача</th>
                <th style={{ width: '14%' }}>Подпись врача</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 800, color: '#0F3C64' }}>
                  {startParts.day}.{startParts.month}.{startParts.year}
                </td>
                <td style={{ fontWeight: 800, color: '#0F3C64' }}>
                  {endParts.day}.{endParts.month}.{endParts.year}
                </td>
                <td>{doctorSpecialty}</td>
                <td style={{ fontWeight: 800 }}>{doctorName}</td>
                <td style={{ height: 26, fontStyle: 'italic', color: '#64748B' }}>[ Подпись ]</td>
              </tr>
              {/* Empty reserve row */}
              <tr style={{ color: '#94A3B8' }}>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td style={{ height: 22 }}></td>
              </tr>
            </tbody>
          </Box>
        </Box>

        {/* RETURN TO WORK & CLINIC STAMP */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 0.8, bgcolor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '3px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 900, color: '#166534', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              ПРИСТУПИТЬ К РАБОТЕ С:
            </Typography>
            <LetterCells text={`${returnParts.day}.${returnParts.month}.${returnParts.year}`} maxLen={10} cellWidth={12} height={17} />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#166534', fontWeight: 700 }}>
              М.П. Медицинской организации
            </Typography>
          </Box>
        </Box>

        {/* EMPLOYER SECTION SUMMARY (OUTLINE) */}
        <Box sx={{ p: 0.8, bgcolor: '#FFFFFF', border: '1px dashed #94A3B8', borderRadius: '3px', mb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', fontSize: '0.66rem', textTransform: 'uppercase', display: 'block', mb: 0.3 }}>
            ЗАПОЛНЯЕТСЯ РАБОТОДАТЕЛЕМ (СТРАХОВАТЕЛЕМ)
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', display: 'block' }}>
            Регистрационный № страхователя • СНИЛС нетрудоспособного • Страховой стаж: ____ лет ____ мес. • Сумма пособия за счет средств работодателя / СФР
          </Typography>
        </Box>

        {/* STUB / TEAR-OFF LINE */}
        <Box sx={{ display: 'flex', alignItems: 'center', my: 1.5, width: '100%' }}>
          <Box sx={{ flex: 1, borderBottom: '1.5px dashed #475569' }} />
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              color: '#334155',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '1px',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>✂</span> ЛИНИЯ ОТРЕЗА • КОРЕШОК ЛИСТКА НЕТРУДОСПОСОБНОСТИ
          </Typography>
          <Box sx={{ flex: 1, borderBottom: '1.5px dashed #475569' }} />
        </Box>

        {/* STUB DETAILS */}
        <Box sx={{ p: 1.2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '3px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8, gap: 1, whiteSpace: 'nowrap' }}>
            <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F3C64', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
              КОРЕШОК ЛИСТКА НЕТРУДОСПОСОБНОСТИ № <span style={{ fontFamily: 'Courier New, monospace', fontWeight: 900, letterSpacing: '1px' }}>{data.documentNumber}</span>
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748B', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
              Остается в медицинской организации
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr',
              columnGap: 2.5,
              rowGap: 0.5,
              fontSize: '0.72rem',
              color: '#334155'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#64748B', flexShrink: 0 }}>
                Пациент:
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.74rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {data.patient.fullName}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, whiteSpace: 'nowrap' }}>
              <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#64748B', flexShrink: 0 }}>
                Дата выдачи:
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.74rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                {issueParts.day}.{issueParts.month}.{issueParts.year}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#64748B', flexShrink: 0 }}>
                Врач:
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.74rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                {doctorName}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, whiteSpace: 'nowrap' }}>
              <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#64748B', flexShrink: 0 }}>
                Расписка получателя:
              </Typography>
              <Box sx={{ flexGrow: 1, borderBottom: '1px solid #94A3B8', height: 12, minWidth: 60 }} />
              <Typography variant="caption" sx={{ fontSize: '0.64rem', color: '#94A3B8', fontStyle: 'italic', flexShrink: 0 }}>
                (подпись)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ===================== PAGE 2: ИНФОРМАЦИЯ И ПРАВОВЫЕ ОСНОВАНИЯ ===================== */}
      <Box
        className="page-break"
        sx={{
          pageBreakBefore: 'always !important',
          breakBefore: 'page !important',
          mt: 4,
          pt: 2,
          border: '1px solid #CBD5E1',
          borderRadius: '4px',
          p: 2,
          bgcolor: '#FFFFFF'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F3C64', textAlign: 'center', mb: 1, fontSize: '1rem', textTransform: 'uppercase' }}>
          ИНФОРМАЦИЯ ПО ЗАПОЛНЕНИЮ БЛАНКА И ПРАВОВЫЕ ОСНОВАНИЯ ВЫДАЧИ
        </Typography>

        {/* PROMINENT USER NOTICE BLOCK */}
        <Box
          sx={{
            p: 1.8,
            mb: 2,
            bgcolor: '#EFF6FF',
            border: '1.5px solid #3B82F6',
            borderRadius: '4px'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1D4ED8', mb: 0.5 }}>
            📌 Официальное назначение документа:
          </Typography>
          <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 600, lineHeight: 1.5, fontSize: '0.86rem' }}>
            {noticeText}
          </Typography>
        </Box>

        {/* CODES TABLE (FROM USER IMAGE 2) */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 0.8, fontSize: '0.82rem' }}>
          Коды причин нетрудоспособности (согласно Приказу Минздравсоцразвития России № 347н / 1089н):
        </Typography>

        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.74rem',
            mb: 2,
            '& th, & td': {
              border: '1px solid #E2E8F0',
              p: '5px 8px'
            },
            '& th': {
              bgcolor: '#F8FAFC',
              fontWeight: 800,
              color: '#0F3C64'
            }
          }}
        >
          <thead>
            <tr>
              <th style={{ width: '12%', textAlign: 'center' }}>Код</th>
              <th style={{ width: '48%' }}>Причина нетрудоспособности</th>
              <th style={{ width: '40%' }}>Клинический комментарий</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: data.reasonCode === '02' ? '#FEF3C7' : 'transparent' }}>
              <td style={{ textAlign: 'center', fontWeight: 900, color: '#B45309' }}>02</td>
              <td><b>Травма</b></td>
              <td>Основной код для травматолого-ортопедического приема при бытовых, спортивных травмах, переломах и вывихах</td>
            </tr>
            <tr style={{ backgroundColor: data.reasonCode === '01' ? '#FEF3C7' : 'transparent' }}>
              <td style={{ textAlign: 'center', fontWeight: 900 }}>01</td>
              <td><b>Заболевание</b></td>
              <td>Обострения хронических артрозов, спондилоартритов, дорсопатий и дегенеративных процессов</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 700 }}>04</td>
              <td>Несчастный случай на производстве или его последствия</td>
              <td>Требуется оформление Акта формы Н-1</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 700 }}>06</td>
              <td>Протезирование в стационаре</td>
              <td>Эндопротезирование суставов, артропластика</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 700 }}>10</td>
              <td>Иное состояние (проведение манипуляций и др.)</td>
              <td>Амбулаторные инвазивные манипуляции, блокады, артроскопические ревизии</td>
            </tr>
          </tbody>
        </Box>

        {/* RULES OF FILLING SUMMARY */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 0.5, fontSize: '0.82rem' }}>
          Правила оформления и предоставления:
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 0.4, lineHeight: 1.4, fontSize: '0.74rem' }}>
          • В строке «Причина нетрудоспособности» в первых двух клетках указывается соответствующий двухзначный код (напр., 02 — травма).
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 0.4, lineHeight: 1.4, fontSize: '0.74rem' }}>
          • Таблица «ОСВОБОЖДЕНИЕ ОТ РАБОТЫ» заполняется лечащим врачом с указанием специальности («Врач травматолог-ортопед»), инициалов лечащего врача и заверяется личной подписью и печатью медицинской организации.
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 0.4, lineHeight: 1.4, fontSize: '0.74rem' }}>
          • В строке «Приступить к работе с» проставляется дата следующего дня после окончания периода временной нетрудоспособности.
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        {/* FOOTER DOCTOR SIGNATURE */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              Выдано медицинской организацией:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              {clinicName}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              Врач травматолог-ортопед:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              {doctorName} ________________ (подпись)
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SickLeavePrintTemplate;
