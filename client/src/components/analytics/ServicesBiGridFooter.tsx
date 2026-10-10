import { Box, Typography } from '@mui/material';
import { GridFooterContainer, GridPagination } from '@mui/x-data-grid';

export interface ServicesBiGridFooterProps {
  totalCount: number;
  totalRevenue: number;
  totalBom: number;
  totalStaffPayout: number;
  totalClinicProfit: number;
  avgMarginPct: number;
  [key: string]: any;
}

export function ServicesBiGridFooter({
  totalCount,
  totalRevenue,
  totalBom,
  totalStaffPayout,
  totalClinicProfit,
  avgMarginPct
}: ServicesBiGridFooterProps) {
  const formatCurrency = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0 ₽';
    return Math.round(Number(val)).toLocaleString('ru-RU') + ' ₽';
  };

  return (
    <GridFooterContainer
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 0,
        bgcolor: '#F8FAFC',
        borderTop: '2px solid #CBD5E1',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12
      }}
    >
      {/* Accounting Summary Band */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 1.5,
          bgcolor: '#F1F5F9',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
            ИТОГО ПО ВЫБОРКЕ:
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            {totalCount} позиций
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
              Валовая выручка:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              {formatCurrency(totalRevenue)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
              Расходники BOM (1.15):
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
              {formatCurrency(totalBom)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
              Выплаты сотрудникам (ФОТ):
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#7C3AED' }}>
              {formatCurrency(totalStaffPayout)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
              Чистая прибыль клиники:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
              {formatCurrency(totalClinicProfit)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
              Рентабельность клиники:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0284C7' }}>
              {avgMarginPct.toFixed(1)}%
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Standard MUI Pagination */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', px: 2, py: 0.5 }}>
        <GridPagination />
      </Box>
    </GridFooterContainer>
  );
}
