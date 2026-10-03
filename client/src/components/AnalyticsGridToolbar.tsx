import { Box, Button, Tooltip } from '@mui/material';
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
  useGridApiContext
} from '@mui/x-data-grid';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

interface AnalyticsGridToolbarProps {
  onClearCustomSearch?: () => void;
  [key: string]: any;
}

export default function AnalyticsGridToolbar(props: AnalyticsGridToolbarProps) {
  const { onClearCustomSearch } = props || {};
  const apiRef = useGridApiContext();

  const handleClearFilters = () => {
    if (apiRef && apiRef.current && apiRef.current.setFilterModel) {
      apiRef.current.setFilterModel({ items: [], quickFilterValues: [] });
    }
    if (onClearCustomSearch) {
      onClearCustomSearch();
    }
  };

  return (
    <GridToolbarContainer
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1.5,
        p: 1.5,
        borderBottom: '1px solid #E2E8F0',
        bgcolor: '#F8FAFC'
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
        <Tooltip title="Сбросить все внутренние фильтры и условия поиска таблицы" arrow>
          <Button
            size="small"
            startIcon={<FilterAltOffIcon />}
            onClick={handleClearFilters}
            color="primary"
            sx={{ fontWeight: 600, cursor: 'pointer' }}
          >
            Сбросить фильтры
          </Button>
        </Tooltip>
      </Box>

      <Tooltip title="Полнотекстовый живой поиск по всем столбцам таблицы одновременно" arrow>
        <Box
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: '8px',
              bgcolor: '#FFFFFF',
              px: 1,
              py: 0.2,
              border: '1px solid #CBD5E1'
            }
          }}
        >
          <GridToolbarQuickFilter debounceMs={300} />
        </Box>
      </Tooltip>
    </GridToolbarContainer>
  );
}
