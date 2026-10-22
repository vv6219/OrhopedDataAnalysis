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
import type { ISectionOptions } from 'docx';
import type { OrthoReferralData } from '../components/reports/OrthoReferralPrintTemplate';
import { resolveClinicalProtocolText, resolveItemPreparation, resolveAggregatedPreparation } from './clinicalProtocolResolver';
import { cleanLatexText } from '../components/ortho/LatexText';

/**
 * Builds a complete independent official referral section for a single referral document.
 */
function createReferralSection(data: OrthoReferralData): ISectionOptions {
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
          width: { size: 2200, type: WidthType.DXA },
          shading: { fill: '0F3C64' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Направление / Процедура', bold: true, color: 'FFFFFF' })] })]
        }),
        new TableCell({
          width: { size: 6200, type: WidthType.DXA },
          shading: { fill: '0F3C64' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Клинические детали, протокол и подготовка', bold: true, color: 'FFFFFF' })] })]
        })
      ]
    })
  ];

  data.items.forEach((item, index) => {
    const detailsParagraphs: Paragraph[] = [];
    const protocolText = resolveClinicalProtocolText(item, {
      targetJoint: data.target_joint,
      targetSide: data.target_side,
      diagnosis: data.clinical_diagnosis
    });

    detailsParagraphs.push(new Paragraph({
      children: [new TextRun({ text: cleanLatexText(protocolText) })],
      spacing: { after: 60 }
    }));

    if (item.formula_latex) {
      detailsParagraphs.push(new Paragraph({
        children: [
          new TextRun({ text: 'Формула / Протокол: ', bold: true, color: '0F3C64' }),
          new TextRun({ text: cleanLatexText(item.formula_latex), italics: true })
        ],
        spacing: { after: 60 }
      }));
    }

    const itemPrep = resolveItemPreparation(item);
    if (itemPrep) {
      detailsParagraphs.push(new Paragraph({
        children: [
          new TextRun({ text: 'Подготовка: ', bold: true, color: 'B45309' }),
          new TextRun({ text: cleanLatexText(itemPrep) })
        ],
        spacing: { after: 60 }
      }));
    }

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 600, type: WidthType.DXA },
            children: [new Paragraph({ text: String(index + 1), alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            children: [
              new Paragraph({ children: [new TextRun({ text: item.item_title, bold: true })] }),
              ...(item.service_code ? [new Paragraph({ children: [new TextRun({ text: `Код: ${item.service_code}`, size: 18, color: '64748B' })] })] : [])
            ]
          }),
          new TableCell({
            width: { size: 6200, type: WidthType.DXA },
            children: detailsParagraphs
          })
        ]
      })
    );
  });

  return {
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
            color: '64748B'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 140 }
      }),

      // Document Title
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
            text: `Дата выдачи: ${issueDateFormatted} • Действительно 90 календарных дней (до ${expireDateFormatted})`,
            bold: true,
            size: 18,
            color: '15803D'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 }
      }),

      // Performer Box
      new Paragraph({
        children: [
          new TextRun({ text: 'КУДА НАПРАВЛЯЕТСЯ ПАЦИЕНТ (ИСПОЛНИТЕЛЬ): ', bold: true, color: '0F3C64' }),
          new TextRun({ text: `${data.performer_name} [${isInternal ? 'Внутреннее подразделение' : 'Внешняя организация'}]`, bold: true })
        ],
        spacing: { after: 40 }
      }),
      ...(data.performer_address ? [
        new Paragraph({
          children: [
            new TextRun({ text: 'Адрес / кабинет: ', bold: true }),
            new TextRun({ text: data.performer_address })
          ],
          spacing: { after: 120 }
        })
      ] : [new Paragraph({ text: '', spacing: { after: 80 } })]),

      // Patient Info
      new Paragraph({
        children: [
          new TextRun({ text: 'ПАЦИЕНТ: ', bold: true, color: '0F3C64' }),
          new TextRun({ text: data.patient.fullName, bold: true, size: 22 })
        ],
        spacing: { after: 40 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Дата рождения: ${data.patient.birthDate || 'Не указана'} ` }),
          new TextRun({ text: data.patient.gender ? `• Пол: ${data.patient.gender} ` : '' }),
          new TextRun({ text: data.patient.phone ? `• Тел: ${data.patient.phone} ` : '' }),
          new TextRun({ text: data.patient.cardNum ? `• Амб. карта: №${data.patient.cardNum}` : '' })
        ],
        spacing: { after: 140 }
      }),

      // Diagnosis
      new Paragraph({
        children: [
          new TextRun({ text: 'КЛИНИЧЕСКИЙ ДИАГНОЗ: ', bold: true, color: '0F3C64' }),
          new TextRun({ text: `[МКБ-10: ${data.icd10_code}${data.icd10_name ? ' - ' + data.icd10_name : ''}] `, bold: true, color: '1D4ED8' }),
          new TextRun({ text: data.clinical_diagnosis, bold: true })
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

      // Items Section Title
      new Paragraph({
        children: [
          new TextRun({
            text: data.items.length === 1 ? 'НАЗНАЧЕННОЕ ИССЛЕДОВАНИЕ / ПРОЦЕДУРА' : 'НАЗНАЧЕННЫЕ ИССЛЕДОВАНИЯ И ПРОЦЕДУРЫ',
            bold: true,
            color: '0F3C64'
          })
        ],
        spacing: { after: 80 }
      }),

      // Items Table
      new Table({
        rows: tableRows,
        width: { size: 9000, type: WidthType.DXA }
      }),

      // Preparation Memo
      ...(() => {
        const aggregatedMemo = resolveAggregatedPreparation(data.items, data.preparation_instructions);
        if (!aggregatedMemo) return [];
        return [
          new Paragraph({
            children: [
              new TextRun({ text: 'ПАМЯТКА ПО ПОДГОТОВКЕ ПАЦИЕНТА (ИЗ КЛИНИЧЕСКОГО СТАНДАРТА ЦЕНТРА)', bold: true, color: 'B45309' })
            ],
            spacing: { before: 180, after: 60 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: cleanLatexText(aggregatedMemo), italics: true })
            ],
            spacing: { after: 120 }
          })
        ];
      })(),

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
          new TextRun({ text: `${data.doctor_name || 'Врач травматолог-ортопед'} ________________________ / М.П.` })
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
  };
}

/**
 * Exports one or multiple referrals to Microsoft Word (.docx).
 * If multiple referrals are provided, each referral is rendered as its own complete,
 * independent official clinical referral document in a separate Section!
 */
export async function exportReferralToDocx(dataOrList: OrthoReferralData | OrthoReferralData[]): Promise<void> {
  const list = Array.isArray(dataOrList) ? dataOrList : [dataOrList];
  if (list.length === 0) return;

  const sections = list.map(ref => createReferralSection(ref));

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
    sections
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  if (list.length === 1) {
    const single = list[0];
    const itemPrefix = single.items?.[0]?.item_title ? `_${single.items[0].item_title.slice(0, 25).replace(/\s+/g, '_')}` : '';
    a.download = `Направление_${single.referral_number}_${single.patient.fullName.replace(/\s+/g, '_')}${itemPrefix}.docx`;
  } else {
    a.download = `Направления_${list[0].patient.fullName.replace(/\s+/g, '_')}_${list.length}_документов.docx`;
  }

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
