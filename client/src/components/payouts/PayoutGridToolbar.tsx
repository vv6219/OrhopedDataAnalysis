import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import { Box, Button, Tooltip } from '@mui/material';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export interface PayoutGridToolbarProps {
  onResetFilters?: () => void;
  onOpenWizard?: () => void;
  onPrint?: () => void;
  onExportCsv?: () => void;
  onBulkApprove?: () => void;
  selectedCount?: number;
  [key: string]: any;
}

export function PayoutGridToolbar({
  onResetFilters,
  onOpenWizard,
  onPrint,
  onExportCsv,
  onBulkApprove,
  selectedCount = 0
}: PayoutGridToolbarProps) {
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
        {onOpenWizard && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddCircleIcon />}
            onClick={onOpenWizard}
            sx={{
              bgcolor: '#0F3C64',
              fontWeight: 600,
              '&:hover': { bgcolor: '#156C9C' }
            }}
          >
            Мастер расчета (Wizard)
          </Button>
        )}

        {selectedCount > 0 && onBulkApprove && (
          <Button
            variant="outlined"
            size="small"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={onBulkApprove}
            sx={{ fontWeight: 600 }}
          >
            Утвердить выбранные ({selectedCount})
          </Button>
        )}

        {onPrint && (
          <Tooltip title={selectedCount === 0 ? "Выберите строки для печати" : "Сформировать печатный бланк PDF"}>
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PrintIcon />}
                onClick={onPrint}
                disabled={selectedCount === 0}
                sx={{ fontWeight: 600, borderColor: '#0F3C64', color: '#0F3C64' }}
              >
                Печать PDF {selectedCount > 0 ? `(${selectedCount})` : ''}
              </Button>
            </span>
          </Tooltip>
        )}

        {onExportCsv && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={onExportCsv}
            sx={{ fontWeight: 600, borderColor: '#4A5568', color: '#4A5568' }}
          >
            Экспорт в Excel (CSV)
          </Button>
        )}

        {/* Standard Grid Toolbar Buttons */}
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />

        {onResetFilters && (
          <Button
            size="small"
            color="secondary"
            startIcon={<FilterAltOffIcon />}
            onClick={onResetFilters}
            sx={{ fontWeight: 500 }}
          >
            Сбросить фильтры
          </Button>
        )}
      </Box>

      {/* Right Quick Filter with Debounce */}
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 260 }}>
        <GridToolbarQuickFilter debounceMs={300} />
      </Box>
    </GridToolbarContainer>
  );
}
