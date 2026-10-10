import { Box, Typography, Divider } from '@mui/material';
import { GridFooterContainer, GridPagination } from '@mui/x-data-grid';

export interface PayoutGridFooterProps {
  totalCount: number;
  totalRevenue: number;
  totalMaterials: number;
  totalMargin: number;
  totalPayout: number;
  totalClinicProfit: number;
  viewMode?: 'procedures' | 'staff';
  [key: string]: any;
}

export function PayoutGridFooter({
  totalCount,
  totalRevenue,
  totalMaterials,
  totalMargin,
  totalPayout,
  totalClinicProfit,
  viewMode = 'procedures'
}: PayoutGridFooterProps) {
  const formatCurrency = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0 ₽';
    const num = Number(val);
    const hasFraction = Math.abs(num % 1) > 0.001;
    return num.toLocaleString('ru-RU', {
      minimumFractionDigits: hasFraction ? 1 : 0,
      maximumFractionDigits: 2
    }) + ' ₽';
  };

  const fotPercentage = totalMargin > 0 ? ((totalPayout / totalMargin) * 100).toFixed(1) : '0.0';

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
          bgcolor: '#EDF2F7',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
            ИТОГИ ВЫБОРКИ:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#4A5568' }}>
            {viewMode === 'procedures' ? 'Сервисов:' : 'Начислений:'} <strong>{totalCount}</strong>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 1.5, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Выручка:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1A2027' }}>
              {formatCurrency(totalRevenue)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Расходники*1.15:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
              {formatCurrency(totalMaterials)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Маржа:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#156C9C' }}>
              {formatCurrency(totalMargin)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Выплаты сотрудникам (ФОТ):</Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', bgcolor: '#E2E8F0', px: 1, py: 0.2, borderRadius: 1 }}>
              {formatCurrency(totalPayout)} ({fotPercentage}%)
            </Typography>
          </Box>

          {viewMode === 'procedures' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#64748B' }}>Остаток клиники:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: totalClinicProfit >= 0 ? '#16A34A' : '#DC2626' }}>
                {formatCurrency(totalClinicProfit)}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ width: '100%' }} />

      {/* Pagination Controls */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', px: 2 }}>
        <GridPagination />
      </Box>
    </GridFooterContainer>
  );
}
