import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
import { 
  Typography, Box, Paper, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip, Chip
} from '@mui/material';
import { 
  DataGrid, 
  type GridColDef, 
  type GridRenderCellParams, 
  type GridFilterModel,
  GridFooterContainer, 
  GridPagination, 
  getGridStringOperators 
} from '@mui/x-data-grid';
import CustomToolbar from '../components/CustomToolbar';
import { ruRU } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import TuneIcon from '@mui/icons-material/Tune';

const customStringOperators = getGridStringOperators().map((operator) => {
  if (operator.value === 'contains') {
    return {
      ...operator,
      getApplyFilterFn: (filterItem: any) => {
        if (!filterItem.value) return null;
        const normalizedSearch = filterItem.value.toLowerCase().replace(/[-_ \[\]]+/g, ' ').trim();
        return (value: any) => {
          if (value == null) return false;
          const normalizedCell = String(value).toLowerCase().replace(/[-_ \[\]]+/g, ' ');
          return normalizedCell.includes(normalizedSearch);
        };
      },
    };
  }
  return operator;
});

interface ParametersFooterProps {
  totalCount?: number;
}

function ParametersGridFooter({ totalCount = 0 }: ParametersFooterProps) {
  return (
    <GridFooterContainer sx={{ p: 1.5, borderTop: '2px solid #E2E8F0', bgcolor: '#F8FAFC', flexWrap: 'wrap', gap: 2 }}>
      <Box sx={{ px: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
          Всего параметров в выборке: {totalCount}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1 }} />
      <GridPagination />
    </GridFooterContainer>
  );
}

export default function Parameters() {
  const [parameters, setParameters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Search State
  const [quickSearch, setQuickSearch] = useState<string>('');
  const searchTimeoutRef = useRef<any>(null);

  const fetchParameters = async (search = quickSearch) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/parameters-admin`;
      if (search && search.trim()) {
        url += `?search=${encodeURIComponent(search.trim())}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setParameters(data);
      }
    } catch (err) {
      console.error('Error fetching parameters:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchParameters();
  }, []);

  const handleOpen = (item = null) => {
    setEditingItem(item || { id: '', param_name: '', param_value: '' });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    const isEditing = !!parameters.find(p => p.id === editingItem.id);
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing 
      ? `${API_BASE_URL}/api/parameters-admin/${editingItem.id}` 
      : `${API_BASE_URL}/api/parameters-admin`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          param_name: editingItem.param_name,
          param_value: editingItem.param_value
        })
      });
      const data = await response.json();
      
      if (isEditing) {
        setParameters(parameters.map(p => p.id === data.id ? data : p));
      } else {
        setParameters([...parameters, data]);
      }
    } catch (err) {
      console.error('Failed to save parameter', err);
    }
    handleClose();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить системный параметр «${id}»?`)) return;
    try {
      await fetch(`${API_BASE_URL}/api/parameters-admin/${id}`, { method: 'DELETE' });
      setParameters(parameters.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete parameter', err);
    }
  };

  const columns: GridColDef[] = [
    { 
      field: 'param_name', 
      headerName: 'Имя параметра', 
      flex: 2, 
      minWidth: 260,
      filterOperators: customStringOperators,
      getApplyQuickFilterFn: (value) => {
        if (!value) return null;
        const normalizedSearch = value.toLowerCase().replace(/[-_ \[\]]+/g, ' ').trim();
        const searchWords = normalizedSearch.split(/\s+/).filter(Boolean);
        return (cellValue) => {
          if (cellValue == null) return false;
          const normalizedCell = String(cellValue).toLowerCase().replace(/[-_ \[\]]+/g, ' ');
          return searchWords.every((word: string) => normalizedCell.includes(word));
        };
      },
      renderCell: (params: GridRenderCellParams) => {
        const val = String(params.value || '');
        const isDaemon = val.includes('[TEST_DAEMON]');
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.8 }}>
            <Typography variant="body2" sx={{ fontWeight: isDaemon ? 700 : 600, color: isDaemon ? '#0F3C64' : '#1E293B', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>
              {val}
            </Typography>
            {isDaemon && (
              <Chip
                label="TEST_DAEMON"
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#EBF8FF', color: '#2B6CB0', fontWeight: 700, border: '1px solid #BEE3F8' }}
              />
            )}
          </Box>
        );
      }
    },
    { 
      field: 'param_value', 
      headerName: 'Значение', 
      flex: 1.5, 
      minWidth: 160,
      getApplyQuickFilterFn: (value) => {
        if (!value) return null;
        const searchStr = value.trim().toLowerCase();
        return (cellValue) => {
          if (cellValue == null) return false;
          return String(cellValue).toLowerCase().includes(searchStr);
        };
      },
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 0.8 }}>
          {params.value != null ? String(params.value) : '—'}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Действия',
      sortable: false,
      filterable: false,
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Редактировать значение параметра" arrow enterDelay={200}>
            <IconButton size="small" color="primary" onClick={() => handleOpen(params.row)} sx={{ cursor: 'pointer' }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить параметр из базы" arrow enterDelay={200}>
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id as string)} sx={{ cursor: 'pointer' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1440px', margin: '0 auto', gap: 3, pb: 6 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px' }}>
            Параметры расчетов
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Системные коэффициенты расчета маржи, наценки на материалы и параметры клиники
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Chip
            icon={<TuneIcon sx={{ fontSize: '15px !important' }} />}
            label={quickSearch ? `Найдено: ${parameters.length} параметров` : `Всего: ${parameters.length} параметров`}
            size="small"
            sx={{ bgcolor: '#F0F6FA', color: '#0F3C64', fontWeight: 600, border: '1px solid #D6E4F0' }}
          />
          <Tooltip title="Обновить список параметров из базы" arrow enterDelay={200}>
            <IconButton
              onClick={() => fetchParameters()}
              disabled={loading}
              sx={{ border: '1px solid #CBD5E1', borderRadius: 2, p: 0.8, bgcolor: '#FFFFFF' }}
            >
              <RefreshIcon fontSize="small" sx={{ color: '#0F3C64' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Добавить новый системный параметр" arrow enterDelay={200}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => handleOpen()} 
              sx={{ 
                bgcolor: '#0F3C64', 
                textTransform: 'none', 
                fontWeight: 700, 
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#0A2744' } 
              }}
            >
              Добавить параметр
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Grid Paper */}
      <Paper elevation={0} sx={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 2.5, overflow: 'hidden' }}>
        <DataGrid
          autoHeight
          showToolbar
          loading={loading}
          rows={parameters}
          columns={columns}
          onFilterModelChange={(model: GridFilterModel) => {
            const searchStr = (model.quickFilterValues || []).join(' ').trim();
            if (searchStr !== quickSearch) {
              setQuickSearch(searchStr);
              if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
              }
              searchTimeoutRef.current = setTimeout(() => {
                fetchParameters(searchStr);
              }, 300);
            }
          }}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 25 },
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          columnHeaderHeight={52}
          localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            border: 0,
            '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#F8FAFC',
              color: '#0F3C64',
              fontWeight: 700,
              borderBottom: '2px solid #E2E8F0'
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #EDF2F7',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center'
            },
            '& .MuiDataGrid-row': {
              minHeight: '48px !important'
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'rgba(15, 60, 100, 0.04)'
            }
          }}
          slots={{ 
            toolbar: CustomToolbar,
            footer: ParametersGridFooter as any
          }}
          slotProps={{
            toolbar: { 
              showQuickFilter: true, 
              quickFilterProps: { debounceMs: 400 } 
            },
            footer: { totalCount: parameters.length } as any
          }}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64' }}>
          {editingItem?.id ? 'Редактировать параметр' : 'Новый параметр'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth margin="normal" label="Имя параметра"
            value={editingItem?.param_name || ''}
            disabled={!!editingItem?.id}
            onChange={(e) => setEditingItem({...editingItem, param_name: e.target.value})}
          />
          <TextField
            fullWidth margin="normal" label="Значение"
            value={editingItem?.param_value ?? ''}
            onChange={(e) => setEditingItem({...editingItem, param_value: e.target.value})}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} sx={{ cursor: 'pointer', color: '#64748B' }}>Отмена</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#0F3C64', fontWeight: 700, '&:hover': { bgcolor: '#0A2744' } }}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
