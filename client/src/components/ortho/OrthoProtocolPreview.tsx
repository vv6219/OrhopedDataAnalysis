import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import LockIcon from '@mui/icons-material/Lock';
import ArticleIcon from '@mui/icons-material/Article';
import { useReactToPrint } from 'react-to-print';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType
} from 'docx';
import OrthoProtocolPrintTemplate from '../reports/OrthoProtocolPrintTemplate';
import type { OrthoProtocolData } from '../reports/OrthoProtocolPrintTemplate';

interface OrthoProtocolPreviewProps {
  data: OrthoProtocolData;
  onSign?: () => void;
  onTransferToCashier?: () => void;
  isSubmitting?: boolean;
}

export default function OrthoProtocolPreview({
  data,
  onSign,
  onTransferToCashier,
  isSubmitting = false
}: OrthoProtocolPreviewProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Протокол_${data.patient?.fullName || 'Пациент'}_${new Date().toLocaleDateString('ru-RU')}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
  });

  // 1. Text Generator (Monospace clinical note)
  const generatePlainText = (): string => {
    const lines: string[] = [];
    const dateStr = data.visitDate ? new Date(data.visitDate).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU');
    
    lines.push('================================================================');
    lines.push('ЦЕНТР ОРТОПЕДИИ И ТРАВМАТОЛОГИИ — КЛИНИКА ДОКТОРА ДОБРУШКИНА');
    lines.push('г. Сочи • Тел. +7 (862) 295-00-55');
    lines.push('================================================================');
    lines.push(`ПРОТОКОЛ ОСМОТРА ВРАЧА ТРАВМАТОЛОГА-ОРТОПЕДА от ${dateStr}`);
    if (data.protocolNumber) lines.push(`Протокол №: ${data.protocolNumber}`);
    lines.push('');
    lines.push(`Пациент: ${data.patient.fullName}`);
    if (data.patient.birthDate) lines.push(`Дата рождения: ${data.patient.birthDate} (${data.patient.gender || ''})`);
    if (data.patient.phone) lines.push(`Телефон: ${data.patient.phone}`);
    lines.push(`Лечащий врач: ${data.doctorName || 'Добрушкин В.И.'}`);
    lines.push('----------------------------------------------------------------');
    lines.push('1. ЖАЛОБЫ:');
    lines.push(data.complaints || 'Жалоб активно не предъявляет.');
    lines.push('');
    lines.push('2. АНАМНЕЗ:');
    lines.push(data.anamnesis || 'Без особенностей.');
    lines.push(`Интенсивность боли по ВАШ: ${data.vasScore || 0}/10`);
    lines.push('');
    lines.push('3. СТАТУС ЛОКАЛИС (STATUS LOCALIS):');
    lines.push(`Походка: ${data.gait || 'свободная, без дополнительной опоры'}`);
    if (data.posture) lines.push(`Осанка: ${data.posture}`);
    
    if (data.jointExams && data.jointExams.length > 0) {
      data.jointExams.forEach((j) => {
        lines.push(`- Сустав: ${j.jointArea} (${j.side}), Ось: ${j.axis}, Синовит: ст. ${j.effusion}`);
        lines.push(`  ROM: сгиб. акт. ${j.rom?.flexion_active || 140}°, пас. ${j.rom?.flexion_passive || 140}°, дефицит разг. ${j.rom?.extension_deficit || 0}°`);
        if (j.tests && Object.keys(j.tests).length > 0) {
          const testList = Object.entries(j.tests).map(([k, v]) => `${k}: ${v}`).join(', ');
          lines.push(`  Тесты: ${testList}`);
        }
      });
    } else {
      lines.push('Суставы: контуры сохранены, без деформаций, движения в полном объеме.');
    }
    
    lines.push('');
    lines.push('4. КЛИНИЧЕСКИЙ ДИАГНОЗ:');
    if (data.icdCode) lines.push(`МКБ-10: ${data.icdCode} (${data.icdName || ''})`);
    lines.push(data.clinicalDiagnosis || 'Диагноз уточняется.');
    lines.push('');
    lines.push('5. РЕКОМЕНДАЦИИ И НАЗНАЧЕНИЯ:');
    lines.push(data.recommendations || 'Охранительный режим.');
    
    if (data.prescriptions && data.prescriptions.length > 0) {
      lines.push('');
      lines.push('Назначенные манипуляции и услуги:');
      data.prescriptions.forEach((p, idx) => {
        lines.push(`  ${idx + 1}. ${p.name || (p as any).title || 'Медицинская услуга'} - ${p.quantity || 1} шт. (${p.price ?? (p as any).unitPrice ?? (p as any).unit_price ?? 0} руб.)`);
      });
    }
    
    if (data.nextVisitDate) {
      lines.push('');
      lines.push(`Повторный осмотр: ${data.nextVisitDate}`);
    }
    
    lines.push('');
    lines.push('----------------------------------------------------------------');
    lines.push(`Врач травматолог-ортопед: ________________ / ${data.doctorName || 'Добрушкин В.И.'} /`);
    lines.push(`Пациент: ________________ / ${data.patient.fullName} /`);
    if (data.isSigned) {
      lines.push(`[ЭЦП валидна: ${data.signedAt || ''} | ${data.signatureHash || ''}]`);
    }

    return lines.join('\n');
  };

  // 2. Word (.docx) Generator via docx library
  const handleDownloadDocx = async () => {
    try {
      const dateStr = data.visitDate ? new Date(data.visitDate).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU');
      
      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Arial',
                size: 22 // 11pt
              }
            }
          }
        },
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720, // 0.5 inch
                  right: 720,
                  bottom: 720,
                  left: 720
                }
              }
            },
            children: [
              new Paragraph({
                text: 'ЦЕНТР ОРТОПЕДИИ И ТРАВМАТОЛОГИИ — КЛИНИКА ДОКТОРА ДОБРУШКИНА',
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'г. Сочи • Тел. +7 (862) 295-00-55 • Лицензия ЛО-23-01-014522', italics: true, size: 18 })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `ПРОТОКОЛ ПРИЕМА ТРАВМАТОЛОГА-ОРТОПЕДА от ${dateStr}`,
                    bold: true,
                    size: 26,
                    color: '0F3C64'
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Пациент: ', bold: true }),
                  new TextRun({ text: data.patient.fullName, bold: true, size: 24 }),
                  new TextRun({ text: `  (Дата рожд.: ${data.patient.birthDate || '—'}, Тел: ${data.patient.phone || '—'})` })
                ],
                spacing: { after: 120 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Лечащий врач: ', bold: true }),
                  new TextRun({ text: `${data.doctorName || 'Добрушкин В.И.'}, к.м.н., врач травматолог-ортопед` })
                ],
                spacing: { after: 200 }
              }),
              new Paragraph({
                children: [new TextRun({ text: '1. Жалобы и анамнез', bold: true, color: '0F3C64', size: 24 })],
                spacing: { before: 100, after: 80 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Жалобы: ', bold: true }),
                  new TextRun({ text: data.complaints || 'Активных жалоб не предъявляет.' })
                ],
                spacing: { after: 60 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Анамнез заболевания: ', bold: true }),
                  new TextRun({ text: data.anamnesis || 'Без особенностей.' })
                ],
                spacing: { after: 60 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Интенсивность боли по ВАШ (0-10): ', bold: true }),
                  new TextRun({ text: `${data.vasScore || 0} баллов` })
                ],
                spacing: { after: 160 }
              }),
              new Paragraph({
                children: [new TextRun({ text: '2. Ортопедический статус (Status Localis)', bold: true, color: '0F3C64', size: 24 })],
                spacing: { before: 100, after: 80 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Походка: ', bold: true }),
                  new TextRun({ text: data.gait || 'Свободная, без хромоты.' })
                ],
                spacing: { after: 80 }
              }),
              ...(data.jointExams?.map(j => (
                new Paragraph({
                  children: [
                    new TextRun({ text: `• ${j.jointArea} (${j.side}): `, bold: true }),
                    new TextRun({ text: `Ось: ${j.axis}, Выпот/синовит: ст. ${j.effusion}. Амплитуда: сгиб. акт. ${j.rom?.flexion_active || 140}°, пас. ${j.rom?.flexion_passive || 140}°, дефицит разгибания ${j.rom?.extension_deficit || 0}°.` })
                  ],
                  spacing: { after: 60 }
                })
              )) || []),
              new Paragraph({
                children: [new TextRun({ text: '3. Клинический диагноз', bold: true, color: '0F3C64', size: 24 })],
                spacing: { before: 140, after: 80 }
              }),
              new Paragraph({
                children: [
                  data.icdCode ? new TextRun({ text: `[МКБ-10: ${data.icdCode} - ${data.icdName || ''}] `, bold: true, color: '0284C7' }) : new TextRun({ text: '' }),
                  new TextRun({ text: data.clinicalDiagnosis || 'Диагноз уточняется.', bold: true })
                ],
                spacing: { after: 160 }
              }),
              new Paragraph({
                children: [new TextRun({ text: '4. Рекомендации и назначения', bold: true, color: '0F3C64', size: 24 })],
                spacing: { before: 100, after: 80 }
              }),
              new Paragraph({
                children: [new TextRun({ text: data.recommendations || 'Охранительный режим.' })],
                spacing: { after: 140 }
              }),
              ...(data.prescriptions && data.prescriptions.length > 0 ? [
                new Paragraph({
                  children: [new TextRun({ text: 'Назначенные манипуляции и услуги:', bold: true })],
                  spacing: { before: 80, after: 60 }
                }),
                ...data.prescriptions.map((p, pIdx) => new Paragraph({
                  children: [
                    new TextRun({ text: `${pIdx + 1}. ${p.name || (p as any).title || 'Медицинская услуга'} — ${p.quantity || 1} шт. (${Number(p.price ?? (p as any).unitPrice ?? (p as any).unit_price ?? 0).toLocaleString('ru-RU')} руб.)` })
                  ],
                  spacing: { after: 40 }
                }))
              ] : []),
              // Signatures
              new Paragraph({
                children: [
                  new TextRun({ text: `Врач травматолог-ортопед: _________________ / ${data.doctorName || 'Добрушкин В.И.'} /`, bold: true })
                ],
                spacing: { before: 300, after: 120 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Пациент: _________________ / ${data.patient.fullName} /`, bold: true })
                ],
                spacing: { after: 120 }
              })
            ]
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Протокол_${data.patient?.fullName || 'Пациент'}_${dateStr}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToastMessage('Документ Word (.docx) успешно сгенерирован и скачан');
    } catch (err: any) {
      console.error('Docx export error', err);
      setToastMessage(`Ошибка экспорта DOCX: ${err.message || err}`);
    }
  };

  // 3. RTF Generator (Rich Text Format compatible with WordPad & Hospital EHR)
  const handleDownloadRtf = () => {
    try {
      const dateStr = data.visitDate ? new Date(data.visitDate).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU');
      const plain = generatePlainText();
      
      // Convert plain text to RTF with Cyrillic unicode escapes
      const rtfHeader = '{\\rtf1\\ansi\\ansicpg1251\\deff0\\deflang1049{\\fonttbl{\\f0\\fnil\\fcharset204 Arial;}}\n';
      const rtfBody = plain
        .split('\n')
        .map(line => {
          // Escape backslashes and braces
          const escaped = line.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}');
          return escaped + '\\par\n';
        })
        .join('');
      const rtfContent = rtfHeader + rtfBody + '}';

      const blob = new Blob([rtfContent], { type: 'application/rtf;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Протокол_${data.patient?.fullName || 'Пациент'}_${dateStr}.rtf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToastMessage('Документ RTF (.rtf) успешно сгенерирован и скачан');
    } catch (err: any) {
      console.error('RTF export error', err);
      setToastMessage(`Ошибка экспорта RTF: ${err.message || err}`);
    }
  };

  // 4. Copy TXT to Clipboard
  const handleCopyTxt = async () => {
    try {
      const text = generatePlainText();
      await navigator.clipboard.writeText(text);
      setToastMessage('Текст протокола скопирован в буфер обмена');
    } catch (err) {
      setToastMessage('Не удалось скопировать в буфер');
    }
  };

  const totalCost = data.prescriptions?.reduce((sum, p) => sum + (((p.price ?? (p as any).unitPrice ?? (p as any).unit_price) || 0) * (p.quantity || 1)), 0) || 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F8FAFC' }}>
      {/* ACTION BAR */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          bgcolor: '#FFFFFF'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, px: 1.5, textTransform: 'none', fontWeight: 700 } }}
          >
            <Tab icon={<PrintIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="PDF (A4)" />
            <Tab icon={<DescriptionIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Word (.docx)" />
            <Tab icon={<ArticleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="RTF (.rtf)" />
            <Tab icon={<ContentCopyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Текст (TXT)" />
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Quick Format Action */}
          {activeTab === 0 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={handlePrintTrigger}
              sx={{ bgcolor: '#0F3C64', '&:hover': { bgcolor: '#0A2A47' }, fontWeight: 700 }}
            >
              Печать / Сохранить PDF
            </Button>
          )}

          {activeTab === 1 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadDocx}
              sx={{ bgcolor: '#2B579A', '&:hover': { bgcolor: '#1E3E6D' }, fontWeight: 700 }}
            >
              Скачать Word (.docx)
            </Button>
          )}

          {activeTab === 2 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadRtf}
              sx={{ bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' }, fontWeight: 700 }}
            >
              Скачать RTF (.rtf)
            </Button>
          )}

          {activeTab === 3 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyTxt}
              sx={{ bgcolor: '#475569', '&:hover': { bgcolor: '#334155' }, fontWeight: 700 }}
            >
              Копировать TXT
            </Button>
          )}

          {/* Transfer to Checkout Button */}
          {onTransferToCashier && (
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<PointOfSaleIcon />}
              onClick={onTransferToCashier}
              disabled={isSubmitting || totalCost === 0}
              sx={{ fontWeight: 800, px: 2 }}
            >
              В кассу ({totalCost.toLocaleString('ru-RU')} ₽)
            </Button>
          )}

          {/* Electronic Signature */}
          {onSign && (
            <Button
              variant="outlined"
              size="small"
              startIcon={data.isSigned ? <CheckCircleIcon color="success" /> : <LockIcon />}
              onClick={onSign}
              disabled={isSubmitting || data.isSigned}
              sx={{ fontWeight: 700 }}
            >
              {data.isSigned ? 'Подписан ЭЦП' : 'Подписать ЭЦП'}
            </Button>
          )}
        </Box>
      </Paper>

      {/* CONTENT AREA */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {/* TAB 0: PDF A4 PREVIEW */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Paper
              elevation={3}
              sx={{
                width: '100%',
                maxWidth: '860px',
                minHeight: '800px',
                bgcolor: '#FFFFFF',
                borderRadius: 2,
                p: { xs: 1, sm: 2 }
              }}
            >
              <OrthoProtocolPrintTemplate ref={printRef} data={data} />
            </Paper>
          </Box>
        )}

        {/* TAB 1: WORD (.DOCX) PREVIEW */}
        {activeTab === 1 && (
          <Paper sx={{ p: 3, maxWidth: '840px', mx: 'auto', bgcolor: '#FFFFFF' }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Генератор формирует нативный файл <b>.docx</b> (OpenXML), полностью готовый для Microsoft Word, LibreOffice и МойОфис. Нажмите кнопку ниже для сохранения файла на ваш компьютер.
            </Alert>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <DescriptionIcon sx={{ fontSize: 72, color: '#2B579A', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', mb: 1 }}>
                Протокол консультативного приема врача травматолога-ортопеда
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                Пациент: <b>{data.patient?.fullName}</b> • Дата: {new Date().toLocaleDateString('ru-RU')}
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadDocx}
                sx={{ bgcolor: '#2B579A', '&:hover': { bgcolor: '#1E3E6D' }, fontWeight: 700, px: 4 }}
              >
                Скачать Протокол (.docx)
              </Button>
            </Box>
          </Paper>
        )}

        {/* TAB 2: RTF PREVIEW */}
        {activeTab === 2 && (
          <Paper sx={{ p: 3, maxWidth: '840px', mx: 'auto', bgcolor: '#FFFFFF' }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Формат <b>RTF (Rich Text Format)</b> поддерживается любыми медицинскими информационными системами (МИС) и открывается в WordPad на любом компьютере без установки стороннего ПО.
            </Alert>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ArticleIcon sx={{ fontSize: 72, color: '#D97706', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', mb: 1 }}>
                Универсальный документ RTF
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                Пациент: <b>{data.patient?.fullName}</b> • Кодировка Windows-1251
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadRtf}
                sx={{ bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' }, fontWeight: 700, px: 4 }}
              >
                Скачать Протокол (.rtf)
              </Button>
            </Box>
          </Paper>
        )}

        {/* TAB 3: MONOSPACE TXT PREVIEW */}
        {activeTab === 3 && (
          <Paper sx={{ p: 2.5, maxWidth: '840px', mx: 'auto', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155' }}>
                Форматированный текст протокола (TXT / Clipboard)
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyTxt}
                sx={{ fontWeight: 700 }}
              >
                Копировать
              </Button>
            </Box>
            <Box
              component="pre"
              sx={{
                bgcolor: '#0F172A',
                color: '#E2E8F0',
                p: 2,
                borderRadius: 1.5,
                fontSize: '0.82rem',
                fontFamily: 'Consolas, "Fira Code", monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '600px',
                overflowY: 'auto'
              }}
            >
              {generatePlainText()}
            </Box>
          </Paper>
        )}
      </Box>

      {/* SNACKBAR */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />
    </Box>
  );
}
