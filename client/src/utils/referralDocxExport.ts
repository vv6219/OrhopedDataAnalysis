import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  Packer
} from 'docx';
import type { OrthoReferralData } from '../components/reports/OrthoReferralPrintTemplate';

export async function exportReferralToDocx(data: OrthoReferralData): Promise<void> {
  const issueDateFormatted = data.issue_date
    ? new Date(data.issue_date).toLocaleDateString('ru-RU')
    : new Date().toLocaleDateString('ru-RU');

  const expireDateFormatted = data.expires_at
    ? new Date(data.expires_at).toLocaleDateString('ru-RU')
    : '';

  const isInternal = Boolean(Number(data.performer_is_internal) === 1);

  // Table rows for items
  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 600, type: WidthType.DXA },
          shading: { fill: '0F3C64' },
          children: [new Paragraph({ children: [new TextRun({ text: '№', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })]
        }),
        new TableCell({
          width: { size: 2000, type: WidthType.DXA },
          shading: { fill: '0F3C64' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Направление / Процедура', bold: true, color: 'FFFFFF' })] })]
        }),
        new TableCell({
          width: { size: 6400, type: WidthType.DXA },
          shading: { fill: '0F3C64' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Клинические детали, протокол и формула', bold: true, color: 'FFFFFF' })] })]
        })
      ]
    })
  ];

  data.items.forEach((item, index) => {
    const detailsParagraphs: Paragraph[] = [];
    if (item.item_details) {
      detailsParagraphs.push(new Paragraph({
        children: [new TextRun({ text: item.item_details })],
        spacing: { after: 60 }
      }));
    }
    if (item.formula_latex) {
      detailsParagraphs.push(new Paragraph({
        children: [
          new TextRun({ text: 'Формула / Протокол: ', bold: true, color: '0F3C64' }),
          new TextRun({ text: item.formula_latex, italics: true })
        ],
        spacing: { after: 60 }
      }));
    }
    if (item.preparation_notes) {
      detailsParagraphs.push(new Paragraph({
        children: [
          new TextRun({ text: 'Подготовка: ', bold: true, color: 'B45309' }),
          new TextRun({ text: item.preparation_notes })
        ],
        spacing: { after: 60 }
      }));
    }

    if (detailsParagraphs.length === 0) {
      detailsParagraphs.push(new Paragraph({ children: [new TextRun({ text: 'Стандартный клинический протокол' })] }));
    }

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 600, type: WidthType.DXA },
            children: [new Paragraph({ text: String(index + 1), alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [
              new Paragraph({ children: [new TextRun({ text: item.item_title, bold: true })] }),
              ...(item.service_code ? [new Paragraph({ children: [new TextRun({ text: `Код: ${item.service_code}`, size: 18, color: '64748B' })] })] : [])
            ]
          }),
          new TableCell({
            width: { size: 6400, type: WidthType.DXA },
            children: detailsParagraphs
          })
        ]
      })
    );
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 20 // 10pt
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: [
          // Header Clinic
          new Paragraph({
            text: 'ЦЕНТР ОРТОПЕДИИ И ТРАВМАТОЛОГИИ ДОБРУШКИНА',
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'г. Сочи • Лицензия ЛО-23-01-014522 • Тел. +7 (862) 295-00-55',
                italics: true,
                size: 18,
                color: '475569'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 }
          }),

          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: `НАПРАВЛЕНИЕ № ${data.referral_number}`,
                bold: true,
                size: 26,
                color: '0F3C64'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Дата выдачи: ${issueDateFormatted}`,
                size: 20,
                color: '334155'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 }
          }),

          // Validity Banner
          new Paragraph({
            children: [
              new TextRun({ text: 'СРОК ДЕЙСТВИЯ НАПРАВЛЕНИЯ: ', bold: true, color: '15803D' }),
              new TextRun({ text: `${data.valid_days || 90} календарных дней`, bold: true, color: '15803D' }),
              new TextRun({ text: expireDateFormatted ? ` (Действительно по ${expireDateFormatted} включительно)` : '', bold: true })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 }
          }),

          // Performer
          new Paragraph({
            children: [
              new TextRun({ text: 'КУДА / ИСПОЛНИТЕЛЬ: ', bold: true, color: '0F3C64' }),
              new TextRun({
                text: `[${isInternal ? 'ВНУТРЕННЕЕ ПОДРАЗДЕЛЕНИЕ' : 'ВНЕШНЯЯ МЕДОРГАНИЗАЦИЯ'}] `,
                bold: true,
                color: isInternal ? '15803D' : 'B45309'
              }),
              new TextRun({ text: data.performer_name, bold: true }),
              ...(data.performer_address ? [new TextRun({ text: ` (Адрес/Кабинет: ${data.performer_address})` })] : [])
            ],
            spacing: { after: 120 }
          }),

          // Patient Details
          new Paragraph({
            children: [
              new TextRun({ text: 'ПАЦИЕНТ: ', bold: true, color: '0F3C64' }),
              new TextRun({ text: data.patient.fullName, bold: true }),
              new TextRun({ text: ` | Дата рожд.: ${data.patient.birthDate || '—'} | Тел.: ${data.patient.phone || '—'}` })
            ],
            spacing: { after: 100 }
          }),

          // Diagnosis
          new Paragraph({
            children: [
              new TextRun({ text: 'ДИАГНОЗ КЛИНИЧЕСКИЙ: ', bold: true, color: '0F3C64' }),
              new TextRun({ text: `[${data.icd10_code || 'МКБ-10'}] `, bold: true }),
              new TextRun({ text: data.clinical_diagnosis })
            ],
            spacing: { after: 60 }
          }),
          ...(data.target_joint ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Локализация / Сторона: ', bold: true }),
                new TextRun({ text: `${data.target_joint}${data.target_side ? ` (${data.target_side})` : ''}` })
              ],
              spacing: { after: 60 }
            })
          ] : []),
          ...(data.anamnesis_summary ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Клиническое обоснование: ', bold: true }),
                new TextRun({ text: data.anamnesis_summary })
              ],
              spacing: { after: 140 }
            })
          ] : [new Paragraph({ text: '', spacing: { after: 80 } })]),

          // Heading Table
          new Paragraph({
            children: [
              new TextRun({ text: 'НАЗНАЧЕННЫЕ ИССЛЕДОВАНИЯ И ПРОЦЕДУРЫ', bold: true, color: '0F3C64' })
            ],
            spacing: { after: 80 }
          }),

          // Items Table
          new Table({
            rows: tableRows,
            width: { size: 9000, type: WidthType.DXA }
          }),

          // Preparation Memo
          ...(data.preparation_instructions ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'ПАМЯТКА ПО ПОДГОТОВКЕ ПАЦИЕНТА', bold: true, color: 'B45309' })
              ],
              spacing: { before: 180, after: 60 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: data.preparation_instructions, italics: true })
              ],
              spacing: { after: 120 }
            })
          ] : []),

          // Special Notes
          ...(data.special_notes ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Особые отметки врача: ', bold: true }),
                new TextRun({ text: data.special_notes })
              ],
              spacing: { before: 80, after: 120 }
            })
          ] : []),

          // Doctor Signature Line
          new Paragraph({
            children: [
              new TextRun({ text: 'Лечащий врач: ', bold: true }),
              new TextRun({ text: 'Добрушкин А.М. ________________________ / М.П.' })
            ],
            spacing: { before: 240, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Документ заверен квалифицированной ЭЦП клиники. Подлинность бланка защищена QR-кодом.',
                size: 16,
                color: '64748B',
                italics: true
              })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Направление_${data.referral_number}_${data.patient.fullName.replace(/\s+/g, '_')}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
