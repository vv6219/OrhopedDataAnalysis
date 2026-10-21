import { Box, Typography, Divider, Tooltip } from '@mui/material';
import { GridFooterContainer, GridPagination } from '@mui/x-data-grid';

export interface UsersTotalsData {
  totalCount: number;
  activeCount: number;
  blockedCount: number;
  linkedCount: number;
  permanentCount: number;
}

interface UsersGridFooterProps {
  totals?: UsersTotalsData;
}

export default function UsersGridFooter({ totals }: UsersGridFooterProps) {
  const safeTotals = totals || {
    totalCount: 0,
    activeCount: 0,
    blockedCount: 0,
    linkedCount: 0,
    permanentCount: 0
  };

  return (
    <GridFooterContainer
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 2,
        bgcolor: '#F8FAFC',
        borderTop: '2px solid #E2E8F0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.04)'
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Tooltip title="Общее количество учетных записей пользователей в текущей выборке" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, cursor: 'help' }}>
            Пользователей в выборке: <strong style={{ color: '#0F3C64' }}>{safeTotals.totalCount}</strong>
          </Typography>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 18, my: 'auto' }} />

        <Tooltip title="Количество активных и заблокированных пользователей" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, cursor: 'help' }}>
            Активных: <strong style={{ color: '#166534' }}>{safeTotals.activeCount}</strong> / Заблокировано: <strong style={{ color: '#92400E' }}>{safeTotals.blockedCount}</strong>
          </Typography>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 18, my: 'auto' }} />

        <Tooltip title="Пользователи, привязанные к физическим сотрудникам (Staff)" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, cursor: 'help' }}>
            Связаны со staff: <strong style={{ color: '#0369A1' }}>{safeTotals.linkedCount}</strong>
          </Typography>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 18, my: 'auto' }} />

        <Tooltip title="Учетные записи с бессрочным действием" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, cursor: 'help' }}>
            Бессрочные: <strong style={{ color: '#475569' }}>{safeTotals.permanentCount}</strong>
          </Typography>
        </Tooltip>
      </Box>
      <GridPagination />
    </GridFooterContainer>
  );
}
