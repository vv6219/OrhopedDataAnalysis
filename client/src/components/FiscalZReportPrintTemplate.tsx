import React from 'react';
import { Box, Typography, Divider, Table, TableBody, TableCell, TableRow } from '@mui/material';

export interface FiscalZReportData {
  mnemonicCode: string;
  shiftNumber: number;
  zReportNumber?: number;
  fiscalDocumentNumber?: number;
  fiscalSign?: string;
  openedAt: string;
  openedBy: string;
  closedAt?: string;
  closedBy?: string;
  durationMinutes?: number;
  deviceModel?: string;
  fnNumber?: string;
  kktRegNumber?: string;
  orgName?: string;
  orgInn?: string;
  orgAddress?: string;
  totals: {
    receiptsCount: number;
    returnsCount?: number;
    totalIncome: number;
    cashIncome: number;
    cardIncome: number;
    sbpIncome: number;
    totalReturns?: number;
    expectedCash: number;
    actualCash?: number;
    cashDifference?: number;
  };
  receivedBy?: string;
  notes?: string;
}

export interface FiscalZReportPrintTemplateProps {
  data: FiscalZReportData;
  isThermalFormat?: boolean; // true = 80mm receipt strip, false = A4 official document
}

export const FiscalZReportPrintTemplate = React.forwardRef<HTMLDivElement, FiscalZReportPrintTemplateProps>(
  ({ data, isThermalFormat = true }, ref) => {
    const {
      mnemonicCode,
      shiftNumber,
      zReportNumber = shiftNumber,
      fiscalDocumentNumber = '—',
      fiscalSign = '—',
      openedAt,
      openedBy,
      closedAt = new Date().toISOString(),
      closedBy = openedBy,
      durationMinutes = 0,
      deviceModel = 'АТОЛ 91Ф',
      fnNumber = '9960440301984210',
      kktRegNumber = '0004928103049182',
      orgName = 'ИЧП Добрушкин А.М.',
      orgInn = '450107060083',
      orgAddress = 'г. Сочи, ул. Транспортная 65',
      totals,
      receivedBy,
      notes
    } = data;

    const formatCurrency = (val: number = 0) =>
      Number(val).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';

    if (isThermalFormat) {
      // 80mm Thermal Receipt Strip View
      return (
        <Box
          ref={ref}
          sx={{
            width: '320px',
            margin: '0 auto',
            padding: '16px 12px',
            bgcolor: '#FFFFFF',
            color: '#000000',
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '12px',
            lineHeight: 1.35,
            boxShadow: 'none',
            '@media print': {
              width: '100%',
              margin: 0,
              padding: '4px'
            }
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '13px', textTransform: 'uppercase' }}>
              {orgName}
            </Typography>
            <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>
              Центр Ортопедии и Травматологии
            </Typography>
            <Typography sx={{ fontSize: '10px' }}>{orgAddress}</Typography>
            <Typography sx={{ fontSize: '10px' }}>ИНН: {orgInn}</Typography>
          </Box>

          <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000000' }} />

          {/* Title */}
          <Box sx={{ textAlign: 'center', my: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.5px' }}>
              ОТЧЕТ О ЗАКРЫТИИ СМЕНЫ
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '12px' }}>
              Z-ОТЧЕТ № {zReportNumber}
            </Typography>
            <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>
              Смена: {mnemonicCode}
            </Typography>
          </Box>

          <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000000' }} />

          {/* Timing & Operators */}
          <Box sx={{ my: 1, fontSize: '11px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ОТКРЫТИЕ:</span>
              <span>{openedAt}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>КАССИР ОТКР.:</span>
              <span>{openedBy}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <span>ЗАКРЫТИЕ:</span>
              <span>{closedAt}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>КАССИР ЗАКР.:</span>
              <span>{closedBy}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ДЛИТЕЛЬНОСТЬ:</span>
              <span>{durationMinutes} мин ({Number(durationMinutes / 60).toFixed(1)} ч)</span>
            </Box>
          </Box>

          <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000000' }} />

          {/* Operational Counters */}
          <Box sx={{ my: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '11px', mb: 0.5 }}>СЧЕТЧИКИ ОПЕРАЦИЙ:</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ЧЕКОВ ПРИХОДА:</span>
              <span style={{ fontWeight: 700 }}>{totals.receiptsCount}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ЧЕКОВ ВОЗВРАТА:</span>
              <span style={{ fontWeight: 700 }}>{totals.returnsCount || 0}</span>
            </Box>
          </Box>

          <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000000' }} />

          {/* Financial Totals */}
          <Box sx={{ my: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '12px', mb: 0.5 }}>ФИНАНСОВЫЙ ИТОГ:</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>НАЛИЧНЫМИ:</span>
              <span>{formatCurrency(totals.cashIncome)}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>БЕЗНАЛИЧНЫМИ (ЭК):</span>
              <span>{formatCurrency(totals.cardIncome)}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>СБП (QR-КОД):</span>
              <span>{formatCurrency(totals.sbpIncome)}</span>
            </Box>
            {Boolean(totals.totalReturns) && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#B91C1C' }}>
                <span>ВОЗВРАТЫ:</span>
                <span>-{formatCurrency(totals.totalReturns)}</span>
              </Box>
            )}
            <Divider sx={{ my: 0.5, borderColor: '#000000' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
              <span>ИТОГО ВЫРУЧКА:</span>
              <span>{formatCurrency(totals.totalIncome)}</span>
            </Box>
          </Box>

          <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000000' }} />

          {/* Cash Drawer Reconciliation */}
          <Box sx={{ my: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '11px', mb: 0.5 }}>СВЕРКА КАССОВОГО ЯЩИКА:</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>РАСЧЕТНЫЙ ОСТАТОК:</span>
              <span>{formatCurrency(totals.expectedCash)}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>ФАКТИЧЕСКИ В КАССЕ:</span>
              <span>{formatCurrency(totals.actualCash !== undefined ? totals.actualCash : totals.expectedCash)}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800 }}>
              <span>РАСХОЖДЕНИЕ:</span>
              <span>
                {totals.cashDifference === 0
                  ? '0.00 ₽ (СХОДИТСЯ)'
                  : `${totals.cashDifference! > 0 ? '+' : ''}${formatCurrency(totals.cashDifference)}`}
              </span>
            </Box>
            {notes && (
              <Typography sx={{ fontSize: '10px', fontStyle: 'italic', mt: 0.5 }}>
                Прим.: {notes}
              </Typography>
            )}
          </Box>

          <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000000' }} />

          {/* KKT Fiscal Footprint */}
          <Box sx={{ my: 1, fontSize: '10px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ККТ: {deviceModel}</span>
              <span>ЗН: 0010670001029</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>РН ККТ (тег 1037):</span>
              <span>{kktRegNumber}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ФН (тег 1041):</span>
              <span>{fnNumber}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ФД (тег 1040):</span>
              <span style={{ fontWeight: 700 }}>{fiscalDocumentNumber}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ФПД (тег 1077):</span>
              <span style={{ fontWeight: 700 }}>{fiscalSign}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>СНО (тег 1055):</span>
              <span>УСН Доходы</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>САЙТ ФНС:</span>
              <span>www.nalog.gov.ru</span>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2, pt: 1, pb: 2.5, borderTop: '1px solid #000000' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '11px' }}>СМЕНА ЗАКРЫТА</Typography>
            <Typography sx={{ fontSize: '10px' }}>СПАСИБО ЗА РАБОТУ!</Typography>
          </Box>
        </Box>
      );
    }

    // A4 Official Document Layout
    return (
      <Box
        ref={ref}
        sx={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm 15mm',
          margin: '0 auto',
          bgcolor: '#FFFFFF',
          color: '#1E293B',
          fontFamily: '"Inter", "Arial", sans-serif',
          fontSize: '13px',
          lineHeight: 1.5,
          boxSizing: 'border-box',
          '@media print': {
            width: '100%',
            padding: '10mm',
            margin: 0
          }
        }}
      >
        {/* Document Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.3px' }}>
              {orgName}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#156C9C' }}>
              Центр Ортопедии и Травматологии доктора Добрушкина
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              {orgAddress} • ИНН {orgInn} • ККТ {deviceModel}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Форма 54-ФЗ / АКТ-ККТ
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Смена {mnemonicCode}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Title */}
        <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', mb: 0.5, color: '#0F3C64' }}>
          АКТ О ЗАКРЫТИИ КАССОВОЙ СМЕНЫ
        </Typography>
        <Typography variant="subtitle1" sx={{ textAlign: 'center', fontWeight: 600, color: '#475569', mb: 3 }}>
          Фискальный отчет с гашением (Z-отчет № {zReportNumber}) за {closedAt ? closedAt.slice(0, 10) : openedAt.slice(0, 10)}
        </Typography>

        {/* Passport / Shift Info Table */}
        <Table sx={{ mb: 3, border: '1px solid #E2E8F0' }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#F8FAFC', width: '25%' }}>Мнемонический код:</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0F3C64', width: '25%' }}>{mnemonicCode}</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#F8FAFC', width: '25%' }}>Номер смены в ФН:</TableCell>
              <TableCell sx={{ width: '25%' }}>№ {shiftNumber}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#F8FAFC' }}>Время открытия:</TableCell>
              <TableCell>{openedAt} ({openedBy})</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#F8FAFC' }}>Время закрытия:</TableCell>
              <TableCell>{closedAt} ({closedBy})</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#F8FAFC' }}>РН ККТ / Номер ФН:</TableCell>
              <TableCell>{kktRegNumber} / {fnNumber}</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#F8FAFC' }}>Фискальный документ / ФПД:</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>ФД №{fiscalDocumentNumber} (ФПД: {fiscalSign})</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {/* Financial Results Table */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#0F3C64' }}>
          1. Финансовые результаты смены
        </Typography>
        <Table sx={{ mb: 3, border: '1px solid #CBD5E1' }}>
          <TableBody>
            <TableRow sx={{ bgcolor: '#F1F5F9' }}>
              <TableCell sx={{ fontWeight: 700 }}>Показатель выручки</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Количество операций</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Сумма (₽)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Оплата наличными денежными средствами</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>—</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totals.cashIncome)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Безналичная оплата (Эквайринг, банковские карты)</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>—</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totals.cardIncome)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Система быстрых платежей (СБП по QR-коду)</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>—</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totals.sbpIncome)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: '#DC2626' }}>Возвраты прихода за смену</TableCell>
              <TableCell sx={{ textAlign: 'center', color: '#DC2626' }}>{totals.returnsCount || 0}</TableCell>
              <TableCell sx={{ textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>
                -{formatCurrency(totals.totalReturns || 0)}
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: '#E2E8F0' }}>
              <TableCell sx={{ fontWeight: 800, fontSize: '14px', color: '#0F3C64' }}>ИТОГО ВЫРУЧКА ЗА СМЕНУ:</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'center', fontSize: '14px' }}>{totals.receiptsCount} чеков</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'right', fontSize: '15px', color: '#0F3C64' }}>
                {formatCurrency(totals.totalIncome)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {/* Cash Drawer Reconciliation */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#0F3C64' }}>
          2. Сверка денежной наличности в кассе (Кассовая дисциплина)
        </Typography>
        <Table sx={{ mb: 4, border: '1px solid #CBD5E1' }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ width: '60%' }}>Расчетная сумма наличных к сдаче в кассу:</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(totals.expectedCash)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Фактически пересчитанная сумма в денежном ящике:</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>
                {formatCurrency(totals.actualCash !== undefined ? totals.actualCash : totals.expectedCash)}
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: totals.cashDifference === 0 ? '#F0FDF4' : '#FEF2F2' }}>
              <TableCell sx={{ fontWeight: 700 }}>Результат сверки (Расхождение):</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: totals.cashDifference === 0 ? '#16A34A' : '#DC2626' }}>
                {totals.cashDifference === 0
                  ? '0.00 ₽ (Касса сошлась идеально)'
                  : `${totals.cashDifference! > 0 ? 'Излишек +' : 'Недостача '}${formatCurrency(totals.cashDifference)}`}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {/* Signatures Block */}
        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between', px: 2 }}>
          <Box sx={{ width: '42%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 3 }}>
              Смену сдал (Кассир / Администратор):
            </Typography>
            <Box sx={{ borderBottom: '1px solid #000000', mb: 0.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#64748B' }}>Подпись</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>/ {closedBy} /</Typography>
            </Box>
          </Box>

          <Box sx={{ width: '42%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 3 }}>
              Выручку принял (Главный бухгалтер):
            </Typography>
            <Box sx={{ borderBottom: '1px solid #000000', mb: 0.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#64748B' }}>Подпись</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>/ {receivedBy || 'Главный бухгалтер'} /</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
);
