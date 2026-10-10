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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        <GridToolbarColumnsButton
          slotProps={{
            button: {
              size: 'small',
              sx: { color: '#475569', textTransform: 'none', fontWeight: 600 }
            }
          }}
        />
        <GridToolbarFilterButton
          slotProps={{
            button: {
              size: 'small',
              sx: { color: '#475569', textTransform: 'none', fontWeight: 600 }
            }
          }}
        />
        <GridToolbarDensitySelector
          slotProps={{
            button: {
              size: 'small',
              sx: { color: '#475569', textTransform: 'none', fontWeight: 600 }
            }
          }}
        />
        <GridToolbarExport
          slotProps={{
            button: {
              size: 'small',
              sx: { color: '#475569', textTransform: 'none', fontWeight: 600 }
            }
          }}
        />
        <GridToolbarQuickFilter
          debounceMs={300}
          placeholder="Поиск по названию или коду..."
          sx={{
            minWidth: 260,
            '& .MuiInputBase-root': {
              fontSize: '0.875rem',
              bgcolor: 'white',
              borderRadius: 1.5,
              px: 1,
              py: 0.25,
              border: '1px solid #CBD5E1'
            }
          }}
        />
      </Box>
    </GridToolbarContainer>
  );
}
