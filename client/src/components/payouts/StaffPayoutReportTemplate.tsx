import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Divider } from '@mui/material';

export interface PayoutReportItem {
  accrual_id: number;
  service_date: string;
  role_in_procedure: string;
  patient_name: string;
  operation_name: string;
  revenue: number;
  materials_cost: number;
  material_cost_factor: number;
  margin_base: number;
  payout_percent: number;
  calculated_payout: number;
  applied_min_guarantee?: number;
  manual_adjustment?: number;
  final_payout: number;
  notes?: string;
}

export interface PayoutReportData {
  sheet_number: string;
  staff_name: string;
  staff_role: string;
  specialization?: string;
  period_start: string;
  period_end: string;
  total_operations_count: number;
  total_margin_base: number;
  total_payout_amount: number;
  tax_rate_percent?: number;
  payout_account_info?: string;
  items: PayoutReportItem[];
}

interface StaffPayoutReportTemplateProps {
  data: PayoutReportData | null;
}

export const StaffPayoutReportTemplate = React.forwardRef<HTMLDivElement, StaffPayoutReportTemplateProps>(
  ({ data }, ref) => {
    if (!data) return null;

    const formatCurrency = (val: number) => {
      return (val || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
    };

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      return dateStr.slice(0, 10);
    };

    const totalRevenue = data.items.reduce((sum, it) => sum + (it.revenue || 0), 0);
    const totalMaterials = data.items.reduce((sum, it) => sum + ((it.materials_cost || 0) * (it.material_cost_factor || 1.15)), 0);
    const taxAmount = data.tax_rate_percent ? (data.total_payout_amount * data.tax_rate_percent) / 100 : 0;
    const netPayout = data.total_payout_amount - taxAmount;

    return (
      <Box
        ref={ref}
        sx={{
          p: 4,
          width: '100%',
          bgcolor: 'white',
          color: 'black',
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          '@media print': {
            p: 2,
          }
        }}
      >
        {/* Header with clinic logo and official requisites */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0F3C64', pb: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img
              src="/MainLogoTransparent.png"
              alt="Логотип Центра Ортопедии"
              style={{ width: 64, height: 64, objectFit: 'contain' }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.1 }}>
                Центр Ортопедии и Травматологии Добрушкина
              </Typography>
              <Typography variant="caption" sx={{ color: '#4A5568', display: 'block', mt: 0.3 }}>
                г. Сочи, ул. Транспортная 65, 3 этаж • Тел: +7 (862) 267-00-00 • orthoped-sochi.ru
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              ВЕДОМОСТЬ ВЫПЛАТ
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#156C9C' }}>
              № {data.sheet_number}
            </Typography>
            <Typography variant="caption" sx={{ color: '#718096' }}>
              Дата составления: {new Date().toLocaleDateString('ru-RU')}
            </Typography>
          </Box>
        </Box>

        {/* Document Title & Employee Credentials */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center', color: '#0F3C64', mb: 1 }}>
            РАСЧЕТНЫЙ ЛИСТОК И АКТ НАЧИСЛЕНИЯ ВОЗНАГРАЖДЕНИЯ
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', color: '#4A5568', mb: 2 }}>
            Расчетный период: с <strong>{formatDate(data.period_start)}</strong> по <strong>{formatDate(data.period_end)}</strong>
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <Typography variant="body2">
              <strong>Сотрудник (ФИО):</strong> {data.staff_name}
            </Typography>
            <Typography variant="body2">
              <strong>Должность / Роль:</strong> {data.staff_role} {data.specialization ? `(${data.specialization})` : ''}
            </Typography>
            <Typography variant="body2">
              <strong>Количество сервисов:</strong> {data.total_operations_count} сервисов
            </Typography>
            <Typography variant="body2">
              <strong>Реквизиты для выплат:</strong> {data.payout_account_info || 'Основной лицевой счет сотрудника'}
            </Typography>
          </Box>
        </Box>

        {/* Detailed Table of Services */}
        <Table sx={{ border: '1px solid #E2E8F0', mb: 3, '& th': { bgcolor: '#F1F5F9', fontWeight: 700, fontSize: '0.78rem', p: 1 }, '& td': { fontSize: '0.75rem', p: 1, borderBottom: '1px solid #E2E8F0' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '4%' }}>№</TableCell>
              <TableCell sx={{ width: '10%' }}>Дата</TableCell>
              <TableCell sx={{ width: '18%' }}>Пациент (ЭМК)</TableCell>
              <TableCell sx={{ width: '26%' }}>Сервис</TableCell>
              <TableCell align="right" sx={{ width: '10%' }}>Выручка</TableCell>
              <TableCell align="right" sx={{ width: '11%' }}>Расходники*1.15</TableCell>
              <TableCell align="right" sx={{ width: '10%' }}>Маржа</TableCell>
              <TableCell align="center" sx={{ width: '6%' }}>Ставка</TableCell>
              <TableCell align="right" sx={{ width: '11%' }}>Выплата</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((it, idx) => (
              <TableRow key={it.accrual_id || idx} sx={{ pageBreakInside: 'avoid' }}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{formatDate(it.service_date)}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{it.patient_name}</TableCell>
                <TableCell>{it.operation_name}</TableCell>
                <TableCell align="right">{formatCurrency(it.revenue)}</TableCell>
                <TableCell align="right">{formatCurrency((it.materials_cost || 0) * (it.material_cost_factor || 1.15))}</TableCell>
                <TableCell align="right">{formatCurrency(it.margin_base)}</TableCell>
                <TableCell align="center">
                  <strong>{it.payout_percent}%</strong>
                  {it.applied_min_guarantee ? ' (мин)' : ''}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  {formatCurrency(it.final_payout)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Grouped Totals and Signatures Container (pageBreakInside: 'avoid' is CRITICAL) */}
        <Box sx={{ pageBreakInside: 'avoid', breakInside: 'avoid', mt: 2 }}>
          {/* Summary Box */}
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #CBD5E1', mb: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 1.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Общая выручка от сервисов:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{formatCurrency(totalRevenue)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Списано расходных материалов:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{formatCurrency(totalMaterials)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Совокупная маржинальная база:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#156C9C' }}>{formatCurrency(data.total_margin_base)}</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Налог / Удержания ({data.tax_rate_percent || 0}%): <strong>{formatCurrency(taxAmount)}</strong>
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                  ИТОГО К ВЫПЛАТЕ СОТРУДНИКУ: {formatCurrency(netPayout)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  (Сумма начислений до удержаний: {formatCurrency(data.total_payout_amount)})
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Signatures Block */}
          <Box sx={{ mt: 3, pt: 1, borderTop: '1px dashed #CBD5E1' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 3 }}>
                  Руководитель клиники / Главный врач:
                </Typography>
                <Typography variant="body2" sx={{ borderBottom: '1px solid black', pb: 0.5 }}>
                  / Добрушкин А.М. /
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 3 }}>
                  Главный бухгалтер клиники:
                </Typography>
                <Typography variant="body2" sx={{ borderBottom: '1px solid black', pb: 0.5 }}>
                  / ____________________ /
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 3 }}>
                  С расчетом ознакомлен, вознаграждение получил:
                </Typography>
                <Typography variant="body2" sx={{ borderBottom: '1px solid black', pb: 0.5 }}>
                  / {data.staff_name} /
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
);

StaffPayoutReportTemplate.displayName = 'StaffPayoutReportTemplate';
