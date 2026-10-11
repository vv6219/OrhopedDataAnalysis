import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import { Box, Button, Tooltip } from '@mui/material';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import PrintIcon from '@mui/icons-material/Print';

export interface ServicesBiGridToolbarProps {
  onResetFilters?: () => void;
  onPrint?: () => void;
  [key: string]: any;
}

export function ServicesBiGridToolbar({
  onResetFilters,
  onPrint
}: ServicesBiGridToolbarProps) {
  return (
    <GridToolbarContainer
      sx={{
        p: 1.5,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 1.5,
        borderBottom: '1px solid #E2E8F0',
        bgcolor: '#F8FAFC'
      }}
    >
      {/* Left Action Buttons */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        {onPrint && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={onPrint}
            sx={{
              borderColor: '#0F3C64',
              color: '#0F3C64',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: '#F0F9FF', borderColor: '#0A2540' }
            }}
          >
            Печать реестра (PDF)
          </Button>
        )}

        {onResetFilters && (
          <Tooltip title="Сбросить все фильтры и сортировку">
            <Button
              variant="text"
              size="small"
              startIcon={<FilterAltOffIcon />}
              onClick={onResetFilters}
              sx={{ color: '#64748B', textTransform: 'none', fontWeight: 500 }}
            >
              Сбросить фильтры
            </Button>
          </Tooltip>
        )}
      </Box>

      {/* Right DataGrid Built-in Tools */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
          '& .MuiButton-root': {
            color: '#475569',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8125rem'
          }
        }}
      >
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
        <Box sx={{ minWidth: 260 }}>
          <GridToolbarQuickFilter debounceMs={300} />
        </Box>
      </Box>
    </GridToolbarContainer>
  );
}
