import { Box, Typography, Divider, Tooltip } from '@mui/material';
import { GridFooterContainer, GridPagination } from '@mui/x-data-grid';

export interface PermissionsTotalsData {
  totalCount: number;
  systemCount: number;
  customCount: number;
  totalAssignments: number;
}

interface PermissionsGridFooterProps {
  totals?: PermissionsTotalsData;
}

export default function PermissionsGridFooter({ totals }: PermissionsGridFooterProps) {
  const safeTotals = totals || {
    totalCount: 0,
    systemCount: 0,
    customCount: 0,
    totalAssignments: 0
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
        <Tooltip title="Общее число зарегистрированных типов прав доступа" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, cursor: 'help' }}>
            Всего разрешений: <strong style={{ color: '#7C3AED' }}>{safeTotals.totalCount}</strong>
          </Typography>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 18, my: 'auto' }} />

        <Tooltip title="Системные (защищенные) и пользовательские права" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, cursor: 'help' }}>
            Системных: <strong style={{ color: '#0369A1' }}>{safeTotals.systemCount}</strong> / Пользовательских: <strong style={{ color: '#166534' }}>{safeTotals.customCount}</strong>
          </Typography>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 18, my: 'auto' }} />

        <Tooltip title="Суммарное количество назначений прав пользователям" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, cursor: 'help' }}>
            Всего назначений: <strong style={{ color: '#0F3C64' }}>{safeTotals.totalAssignments}</strong>
          </Typography>
        </Tooltip>
      </Box>
      <GridPagination />
    </GridFooterContainer>
  );
}
