import React from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Divider } from '@mui/material';

export interface ServicesBiReportData {
  summary: {
    totalRevenue: number;
    totalBom: number;
    bomPercent: number;
    totalMarginBase: number;
    totalDoctorPayout: number;
    totalNursePayout: number;
    totalStaffPayouts: number;
    staffPayoutPercent: number;
    totalClinicProfit: number;
    clinicProfitMargin: number;
    operationsCount: number;
    avgTicket: number;
  };
  rows: Array<{
    code: string;
    name: string;
    category: string;
    volume: number;
    totalRevenue: number;
    totalBom: number;
    totalStaffPayout: number;
    clinicProfit: number;
    marginPct: number;
  }>;
  generatedDate: string;
  filterPeriod: string;
}

export const ServicesBiReportTemplate = React.forwardRef<HTMLDivElement, { data: ServicesBiReportData | null }>(
  ({ data }, ref) => {
    if (!data) return null;

    const formatCurrency = (val: number) => {
      if (val === undefined || val === null || isNaN(val)) return '0 ₽';
      return Math.round(Number(val)).toLocaleString('ru-RU') + ' ₽';
    };

    return (
      <Box
        ref={ref}
        sx={{
          p: 4,
          width: '100%',
          bgcolor: 'white',
          color: 'black',
          fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              Центр Ортопедии и Травматологии Добрушкина
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              г. Сочи, Курортный проспект • Аналитический департамент
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              Дата формирования: {data.generatedDate}
            </Typography>
            <Typography variant="caption" sx={{ color: '#0F3C64', fontWeight: 600 }}>
              Период: {data.filterPeriod}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1E293B', textAlign: 'center' }}>
          АНАЛИТИЧЕСКИЙ ОТЧЕТ: ВЫПЛАТЫ, ДОХОДЫ И UNIT-ЭКОНОМИКА СЕРВИСОВ
        </Typography>

        {/* Executive Summary Table */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#0F3C64' }}>
            1. Сводные финансовые показатели клиники:
          </Typography>
          <Table size="small" sx={{ border: '1px solid #CBD5E1' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                <TableCell sx={{ fontWeight: 700 }}>Показатель</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Значение</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Доля / %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Валовая выручка</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(data.summary.totalRevenue)}</TableCell>
                <TableCell align="right">100.0%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Себестоимость расходных материалов BOM (1.15)</TableCell>
                <TableCell align="right" sx={{ color: '#B45309', fontWeight: 600 }}>{formatCurrency(data.summary.totalBom)}</TableCell>
                <TableCell align="right">{data.summary.bomPercent}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Маржинальная база</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(data.summary.totalMarginBase)}</TableCell>
                <TableCell align="right">{(100 - data.summary.bomPercent).toFixed(1)}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Выплаты врачам и медицинским сестрам (ФОТ)</TableCell>
                <TableCell align="right" sx={{ color: '#6D28D9', fontWeight: 600 }}>{formatCurrency(data.summary.totalStaffPayouts)}</TableCell>
                <TableCell align="right">{data.summary.staffPayoutPercent}% от маржи</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#F0FDF4' }}>
                <TableCell sx={{ fontWeight: 700, color: '#15803D' }}>Чистая прибыль клиники (Net Profit)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#15803D' }}>{formatCurrency(data.summary.totalClinicProfit)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#15803D' }}>{data.summary.clinicProfitMargin}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Количество выполненных манипуляций</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{data.summary.operationsCount} проц.</TableCell>
                <TableCell align="right">Ср. чек: {formatCurrency(data.summary.avgTicket)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {/* Detailed Table */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#0F3C64' }}>
            2. Реестр ключевых манипуляций:
          </Typography>
          <Table size="small" sx={{ border: '1px solid #CBD5E1' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Код</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Наименование сервиса</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Кол-во</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Выручка</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>BOM (1.15)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>ФОТ</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Прибыль</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Маржа %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.rows.slice(0, 30).map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{r.code}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{r.name}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{r.volume}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatCurrency(r.totalRevenue)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatCurrency(r.totalBom)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatCurrency(r.totalStaffPayout)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>
                    {formatCurrency(r.clinicProfit)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{r.marginPct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Footer & Signatures Block */}
        <Box sx={{ pageBreakInside: 'avoid', breakInside: 'avoid', mt: 3, pt: 2, borderTop: '2px solid #CBD5E1' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Главный врач: ____________________ / Добрушкин А. М. /
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Финансовый директор: ____________________ / /
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: '#94A3B8', textAlign: 'center', display: 'block' }}>
            Документ сгенерирован автоматически аналитическим комплексом ОртоERP • Конфиденциально
          </Typography>
        </Box>
      </Box>
    );
  }
);
