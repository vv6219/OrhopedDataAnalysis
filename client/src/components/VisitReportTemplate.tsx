import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

export interface VisitReportMaterial {
  material_id: number;
  material_name: string;
  unit_of_measure: string;
  current_unit_cost: number;
  actual_qty: number;
  operation_id?: number;
  operation_name?: string;
}

export interface VisitReportOperationItem {
  id: number;
  name: string;
  price: number;
  quantity?: number;
  subtotal?: number;
}

export interface VisitReportProps {
  patientName: string;
  patientPhone?: string;
  operationName?: string;
  operationPrice?: number;
  operations?: VisitReportOperationItem[];
  doctorName?: string;
  nurseName?: string;
  materials: VisitReportMaterial[];
  paymentMethod?: string;
  notes?: string;
  transactionDate?: Date | string;
  transactionId?: number | string;
}

export const VisitReportTemplate = React.forwardRef<HTMLDivElement, VisitReportProps>(
  (
    {
      patientName,
      patientPhone,
      operationName = '',
      operationPrice = 0,
      operations,
      doctorName,
      nurseName,
      materials,
      paymentMethod,
      notes,
      transactionDate,
      transactionId
    },
    ref
  ) => {
    const dateObj = transactionDate ? new Date(transactionDate) : new Date();
    const dateStr = dateObj.toLocaleDateString('ru-RU');
    const timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const totalMaterialsCost = materials.reduce(
      (sum, m) => sum + (m.actual_qty * m.current_unit_cost),
      0
    );

    const totalOperationsPrice = operations && operations.length > 0
      ? operations.reduce((sum, o) => sum + (o.subtotal !== undefined ? o.subtotal : (o.price * (o.quantity || 1))), 0)
      : operationPrice;

    const netProfit = totalOperationsPrice - totalMaterialsCost;
    const marginPercent = totalOperationsPrice > 0 ? ((netProfit / totalOperationsPrice) * 100).toFixed(1) : '0';

    const getPaymentMethodText = (method?: string) => {
      switch (method) {
        case 'card':
          return 'Банковская карта';
        case 'cash':
          return 'Наличные';
        case 'sbp':
          return 'СБП / QR-код';
        case 'invoice':
          return 'Безналичный расчет';
        default:
          return method || 'Банковская карта';
      }
    };

    return (
      <Box
        ref={ref}
        sx={{
          p: { xs: 2, sm: 2.5 },
          width: '100%',
          maxWidth: '820px',
          mx: 'auto',
          bgcolor: '#FFFFFF',
          color: '#1A2027',
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          boxSizing: 'border-box',
          '@media print': {
            p: '2mm 4mm !important',
            maxWidth: '100% !important',
            width: '100% !important',
            boxShadow: 'none !important'
          }
        }}
      >
        {/* EMBEDDED PRINT STYLES */}
        <style type="text/css">
          {`
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 8mm 10mm;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-page-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
          `}
        </style>

        {/* CLINIC HEADER (Compact & Elegant) */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #0F3C64',
            pb: 1.5,
            mb: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <img
              src="/MainLogoTransparent.png"
              alt="Центр Ортопедии и Травматологии"
              style={{ width: 50, height: 50, objectFit: 'contain' }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: '#0F3C64',
                  lineHeight: 1.15,
                  letterSpacing: '-0.3px',
                  fontSize: '1.05rem'
                }}
              >
                Центр Ортопедии и Травматологии
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#156C9C', lineHeight: 1.2, fontSize: '0.85rem' }}>
                Клиника доктора Добрушкина
              </Typography>
              <Typography variant="caption" sx={{ color: '#4A5568', display: 'block', fontSize: '0.72rem' }}>
                г. Сочи
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: '#0F3C64',
                textTransform: 'uppercase',
                fontSize: '0.88rem',
                letterSpacing: '0.5px'
              }}
            >
              Протокол визита и калькуляция
            </Typography>
            <Typography variant="body2" sx={{ color: '#4A5568', mt: 0.25, fontWeight: 600, fontSize: '0.8rem' }}>
              Акт № {transactionId ? `VZ-${transactionId}` : 'ПРЕДПРОСМОТР'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontSize: '0.72rem' }}>
              Дата: {dateStr} {timeStr}
            </Typography>
          </Box>
        </Box>

        {/* PATIENT & STAFF DETAILS CARD */}
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            mb: 1.5,
            bgcolor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 1.5
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.9fr', gap: 1.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', fontWeight: 700, display: 'block', fontSize: '0.68rem' }}>
                Пациент (ЭМК):
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '0.85rem' }}>
                {patientName || 'Не указан'}
              </Typography>
              {patientPhone && (
                <Typography variant="caption" sx={{ color: '#4A5568', fontSize: '0.72rem', display: 'block' }}>
                  Тел: {patientPhone}
                </Typography>
              )}
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', fontWeight: 700, display: 'block', fontSize: '0.68rem' }}>
                Ответственные сотрудники:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '0.85rem' }}>
                Врач: {doctorName || 'Добрушкин Александр Моисеевич'}
              </Typography>
              {nurseName && (
                <Typography variant="caption" sx={{ color: '#4A5568', display: 'block', fontSize: '0.72rem' }}>
                  Ассистент: {nurseName}
                </Typography>
              )}
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', fontWeight: 700, display: 'block', fontSize: '0.68rem' }}>
                Форма оплаты:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '0.85rem' }}>
                {getPaymentMethodText(paymentMethod)}
              </Typography>
            </Box>
          </Box>

          {notes && (
            <Box sx={{ mt: 1, pt: 0.75, borderTop: '1px dashed #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: '#718096', fontWeight: 700, fontSize: '0.68rem', mr: 0.5 }}>
                Клинические отметки:
              </Typography>
              <Typography variant="caption" sx={{ color: '#2D3748', fontStyle: 'italic', fontSize: '0.72rem' }}>
                {notes}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* SERVICE SECTION (Single or Multi-Operation) */}
        <Box sx={{ mb: 1.5, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          {operations && operations.length > 1 ? (
            <Box sx={{ bgcolor: '#F0F4F8', p: 1.5, borderRadius: 1.5, borderLeft: '4px solid #0F3C64' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: '#0F3C64', fontSize: '0.72rem' }}>
                  Оказанные сервисы ({operations.length}):
                </Typography>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: '#718096', fontSize: '0.68rem' }}>
                  Итого по прайсу: <strong style={{ color: '#0F3C64', fontSize: '0.85rem' }}>{totalOperationsPrice.toLocaleString('ru-RU')} ₽</strong>
                </Typography>
              </Box>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #CBD5E1', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#E2E8F0' }}>
                    <TableRow>
                      <TableCell sx={{ py: 0.5, fontWeight: 700, fontSize: '0.72rem', color: '#0F3C64', width: 40 }}>№</TableCell>
                      <TableCell sx={{ py: 0.5, fontWeight: 700, fontSize: '0.72rem', color: '#0F3C64' }}>Наименование сервиса</TableCell>
                      <TableCell align="right" sx={{ py: 0.5, fontWeight: 700, fontSize: '0.72rem', color: '#0F3C64', width: 90 }}>Цена (₽)</TableCell>
                      <TableCell align="center" sx={{ py: 0.5, fontWeight: 700, fontSize: '0.72rem', color: '#0F3C64', width: 60 }}>Кол-во</TableCell>
                      <TableCell align="right" sx={{ py: 0.5, fontWeight: 700, fontSize: '0.72rem', color: '#0F3C64', width: 100 }}>Сумма (₽)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {operations.map((op, idx) => (
                      <TableRow key={op.id || idx}>
                        <TableCell sx={{ py: 0.5, fontSize: '0.75rem', color: '#64748B' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 600, color: '#1E293B' }}>{op.name}</TableCell>
                        <TableCell align="right" sx={{ py: 0.5, fontSize: '0.75rem' }}>{op.price.toLocaleString('ru-RU')} ₽</TableCell>
                        <TableCell align="center" sx={{ py: 0.5, fontSize: '0.75rem' }}>{op.quantity || 1}</TableCell>
                        <TableCell align="right" sx={{ py: 0.5, fontSize: '0.78rem', fontWeight: 700, color: '#0F3C64' }}>
                          {(op.subtotal !== undefined ? op.subtotal : (op.price * (op.quantity || 1))).toLocaleString('ru-RU')} ₽
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box
              sx={{
                bgcolor: '#F0F4F8',
                px: 1.5,
                py: 0.85,
                borderRadius: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: '4px solid #0F3C64'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: '#718096', fontSize: '0.68rem' }}>
                  Сервис:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.92rem' }}>
                  {operations && operations[0] ? operations[0].name : (operationName || 'Сервис не выбран')}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: '#718096', fontSize: '0.68rem' }}>
                  Стоимость по прайсу:
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1rem' }}>
                  {totalOperationsPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* MATERIALS SPECIFICATION TABLE */}
        <Box sx={{ mb: 1.5, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64', mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px', fontSize: '0.72rem' }}>
            Спецификация фактически списанных материалов и медикаментов:
          </Typography>

          {materials.length > 0 ? (
            materials.some(m => m.operation_name || m.operation_id) ? (
              // Grouped by service first, then grand total
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Array.from(new Set(materials.map(m => m.operation_name || 'Общие материалы'))).map(serviceTitle => {
                  const items = materials.filter(m => (m.operation_name || 'Общие материалы') === serviceTitle);
                  const serviceCost = items.reduce((sum, m) => sum + (m.actual_qty * m.current_unit_cost), 0);

                  return (
                    <Box key={serviceTitle} sx={{ mb: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3, px: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#156C9C', fontSize: '0.72rem' }}>
                          Сервис: {serviceTitle}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '0.72rem' }}>
                          Себестоимость материалов сервиса: {serviceCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                        </Typography>
                      </Box>
                      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 1 }}>
                        <Table size="small" sx={{ '& td, & th': { py: 0.35, px: 0.8, fontSize: '0.74rem' } }}>
                          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Наименование материала</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Ед. изм.</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>Кол-во</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>Цена за ед.</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>Сумма расхода</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {items.map((m, idx) => (
                              <TableRow key={idx}>
                                <TableCell sx={{ fontWeight: 600 }}>{m.material_name}</TableCell>
                                <TableCell>{m.unit_of_measure}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>{m.actual_qty}</TableCell>
                                <TableCell align="right">
                                  {m.current_unit_cost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                  {(m.actual_qty * m.current_unit_cost).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  );
                })}

                {/* Grand total row across all services */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 0.8, bgcolor: '#F1F5F9', borderRadius: 1, border: '1px solid #CBD5E1', mt: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.8rem' }}>
                    Итого себестоимость материалов (все сервисы): <span style={{ color: '#C53030' }}>{totalMaterialsCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽</span>
                  </Typography>
                </Box>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 1.5 }}>
                <Table size="small" sx={{ '& td, & th': { py: 0.4, px: 1, fontSize: '0.78rem' } }}>
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Наименование материала</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Ед. изм.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>Кол-во</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>Цена за ед.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>Сумма расхода</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {materials.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 600 }}>{m.material_name}</TableCell>
                        <TableCell>{m.unit_of_measure}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{m.actual_qty}</TableCell>
                        <TableCell align="right">
                          {m.current_unit_cost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {(m.actual_qty * m.current_unit_cost).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell colSpan={4} align="right" sx={{ fontWeight: 700 }}>
                        Итого себестоимость материалов:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#C53030' }}>
                        {totalMaterialsCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : (
            <Typography variant="body2" sx={{ color: '#718096', fontStyle: 'italic', p: 1, bgcolor: '#F8FAFC', borderRadius: 1.5, fontSize: '0.78rem' }}>
              Расходные материалы со склада в рамках данного сервиса не списывались.
            </Typography>
          )}
        </Box>

        {/* UNIFIED FINANCIAL TOTALS & SIGNATURES BLOCK (Guaranteed to stay on the same page) */}
        <Box
          className="no-page-break"
          sx={{
            borderTop: '2px solid #0F3C64',
            pt: 1.5,
            mt: 1.5,
            pageBreakInside: 'avoid',
            breakInside: 'avoid'
          }}
        >
          {/* Row: Consent Confirmation (Left) & Financial Breakdown (Right) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 2.5, alignItems: 'stretch' }}>
            {/* Left: Patient Acceptance & Protocol Statement */}
            <Box
              sx={{
                bgcolor: '#F8FAFC',
                p: 1.25,
                borderRadius: 1.5,
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                Подтверждение пациента:
              </Typography>
              <Typography variant="caption" sx={{ color: '#4A5568', lineHeight: 1.35, display: 'block', fontSize: '0.72rem' }}>
                Сервисы оказаны в полном объеме, качественно и в установленный срок. С калькуляцией материалов и итоговой стоимостью ознакомлен(а) и согласен(на), претензий к клинике не имею.
              </Typography>
            </Box>

            {/* Right: Detailed Breakdown & Grand Total */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography variant="caption" sx={{ color: '#4A5568', fontSize: '0.75rem' }}>Сумма сервисов:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  {totalOperationsPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography variant="caption" sx={{ color: '#4A5568', fontSize: '0.75rem' }}>Себестоимость материалов:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#C53030', fontSize: '0.75rem' }}>
                  - {totalMaterialsCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="caption" sx={{ color: '#276749', fontWeight: 600, fontSize: '0.75rem' }}>
                  Маржинальный доход ({marginPercent}%):
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#276749', fontSize: '0.75rem' }}>
                  {netProfit.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: '#F0F4F8',
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: '1px solid #CBD5E0'
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.82rem' }}>
                  ИТОГ К ОПЛАТЕ:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.05rem' }}>
                  {operationPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* SIGNATURES ROW: Compact, clean, immediately following totals */}
          <Box sx={{ mt: 2, pt: 1, display: 'flex', justifyContent: 'space-between', gap: 4 }}>
            <Box sx={{ width: '48%', borderTop: '1px solid #2D3748', pt: 0.5, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1A2027', fontSize: '0.78rem', lineHeight: 1.2 }}>
                Врач: {doctorName || 'Добрушкин Александр Моисеевич'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.68rem', display: 'block' }}>
                (подпись / печать врача)
              </Typography>
            </Box>

            <Box sx={{ width: '48%', borderTop: '1px solid #2D3748', pt: 0.5, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1A2027', fontSize: '0.78rem', lineHeight: 1.2 }}>
                Пациент: {patientName || '_______________________'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.68rem', display: 'block' }}>
                (подпись пациента, согласие с объемом и стоимостью)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
);
