import { Box, Typography, Divider, Tooltip } from '@mui/material';
import { GridFooterContainer, GridPagination } from '@mui/x-data-grid';

export interface PatientsTotalsData {
  totalCount: number;
  maleCount: number;
  femaleCount: number;
  dmsCount: number;
  totalVisits: number;
}

interface PatientsGridFooterProps {
  totals?: PatientsTotalsData;
}

export default function PatientsGridFooter({ totals }: PatientsGridFooterProps) {
  const safeTotals = totals || {
    totalCount: 0,
    maleCount: 0,
    femaleCount: 0,
    dmsCount: 0,
    totalVisits: 0
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
      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Tooltip title="Общее количество электронных медицинских карт пациентов в текущей выборке" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, cursor: 'help' }}>
            Пациентов в выборке: <strong style={{ color: '#0F3C64' }}>{safeTotals.totalCount}</strong>
          </Typography>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 18, my: 'auto' }} />

        <Tooltip title="Демографическое распределение по полу" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, cursor: 'help' }}>
            Мужчин: <strong style={{ color: '#2B6CB0' }}>{safeTotals.maleCount}</strong> / Женщин: <strong style={{ color: '#C53030' }}>{safeTotals.femaleCount}</strong>
          </Typography>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 18, my: 'auto' }} />

        <Tooltip title="Количество пациентов, обслуживаемых по программам добровольного медицинского страхования (ДМС)" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, cursor: 'help' }}>
            Полис ДМС: <strong style={{ color: '#2F855A' }}>{safeTotals.dmsCount}</strong>
          </Typography>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ height: 18, my: 'auto' }} />

        <Tooltip title="Суммарное число обращений и посещений клиники всеми пациентами в выборке" arrow>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, cursor: 'help' }}>
            Всего визитов: <strong style={{ color: '#B7791F' }}>{safeTotals.totalVisits.toLocaleString('ru-RU')}</strong>
          </Typography>
        </Tooltip>
      </Box>
      <GridPagination />
    </GridFooterContainer>
  );
}
