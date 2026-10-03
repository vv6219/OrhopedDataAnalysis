import React from 'react';
import { Box, Typography, Divider, Tooltip } from '@mui/material';
import { GridFooterContainer, GridPagination } from '@mui/x-data-grid';

export interface GridTotalsData {
  count: number;
  totalVolume: number;
  totalRev: number;
  totalBom: number;
  totalProfit: number;
  avgMargin: number;
}

interface AnalyticsGridFooterProps {
  totals?: GridTotalsData;
}

export default function AnalyticsGridFooter({ totals }: AnalyticsGridFooterProps) {
  const safeTotals = totals || {
    count: 0,
    totalVolume: 0,
    totalRev: 0,
    totalBom: 0,
    totalProfit: 0,
    avgMargin: 0
  };

  return (
    <GridFooterContainer
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 2,
        bgcolor: '#F8FAFC',
        borderTop: '2px solid #CBD5E1',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}
    >
      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Tooltip title="Количество номенклатурных позиций процедур, удовлетворяющих заданным фильтрам, и суммарное число их проведений пациентам" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, cursor: 'help' }}>
            Услуг в выборке: <strong style={{ color: '#0F3C64' }}>{safeTotals.count}</strong> (выполнено: {safeTotals.totalVolume.toLocaleString('ru-RU')})
          </Typography>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto' }} />

        <Tooltip title="Суммарная выручка клиники по всем услугам, отображаемым в текущем списке" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, cursor: 'help' }}>
            Выручка: <strong style={{ color: '#0F3C64' }}>{Math.round(safeTotals.totalRev).toLocaleString('ru-RU')} ₽</strong>
          </Typography>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto' }} />

        <Tooltip title="Суммарная стоимость медикаментов, имплантов и перевязочных материалов, списанных со склада на эти процедуры" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, cursor: 'help' }}>
            Затраты BOM: <strong style={{ color: '#64748B' }}>{Math.round(safeTotals.totalBom).toLocaleString('ru-RU')} ₽</strong>
          </Typography>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto' }} />

        <Tooltip title="Итоговая валовая прибыль по выборке: Выручка минус Затраты BOM на медикаменты" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, cursor: 'help' }}>
            Валовая прибыль: <strong style={{ color: '#059669' }}>{Math.round(safeTotals.totalProfit).toLocaleString('ru-RU')} ₽</strong>
          </Typography>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto' }} />

        <Tooltip title="Средневзвешенная маржинальность отфильтрованных процедур: (Итого прибыль ÷ Итого выручка) × 100%" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, cursor: 'help' }}>
            Средняя маржа: <strong style={{ color: safeTotals.avgMargin >= 50 ? '#059669' : '#D97706' }}>{safeTotals.avgMargin}%</strong>
          </Typography>
        </Tooltip>
      </Box>
      <GridPagination />
    </GridFooterContainer>
  );
}
