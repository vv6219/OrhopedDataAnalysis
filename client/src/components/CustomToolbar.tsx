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

export default function CustomToolbar() {
  const apiRef = useGridApiContext();

  const handleClearFilters = () => {
    if (apiRef && apiRef.current && apiRef.current.setFilterModel) {
      apiRef.current.setFilterModel({ items: [], quickFilterValues: [] });
    }
  };

  return (
    <GridToolbarContainer sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #e0e0e0', mb: 1 }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
        <Tooltip title="Сбросить все активные фильтры" arrow>
          <Button size="small" startIcon={<FilterAltOffIcon />} onClick={handleClearFilters} color="primary" sx={{ cursor: 'pointer' }}>
            Сбросить фильтры
          </Button>
        </Tooltip>
      </Box>
      <GridToolbarQuickFilter debounceMs={500} />
    </GridToolbarContainer>
  );
}
