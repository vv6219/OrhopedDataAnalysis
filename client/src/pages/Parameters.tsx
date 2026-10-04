import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
import { 
  Typography, Box, Paper, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams, getGridStringOperators } from '@mui/x-data-grid';
import CustomToolbar from '../components/CustomToolbar';
import { ruRU } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const customStringOperators = getGridStringOperators().map((operator) => {
  if (operator.value === 'contains') {
    return {
      ...operator,
      getApplyFilterFn: (filterItem: any) => {
        if (!filterItem.value) return null;
        const normalizedSearch = filterItem.value.replace(/[- ]+/g, '').toLowerCase();
        return (value: any) => {
          if (value == null) return false;
          const normalizedCell = String(value).replace(/[- ]+/g, '').toLowerCase();
          return normalizedCell.includes(normalizedSearch);
        };
      },
    };
  }
  return operator;
});

export default function Parameters() {
  const [parameters, setParameters] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/parameters-admin`)
      .then(res => res.json())
      .then(data => setParameters(data))
      .catch(err => console.error('Error fetching parameters:', err));
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
    // Determine if editing based on presence of id (which we map to param_name for DataGrid)
    // Actually if the editingItem has an id that matches an existing record, it's PUT.
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
      flex: 1, 
      minWidth: 250,
      filterOperators: customStringOperators,
      getApplyQuickFilterFn: (value) => {
        if (!value) return null;
        const normalizedSearch = value.replace(/[- ]+/g, '').toLowerCase();
        return (cellValue) => {
          if (cellValue == null) return false;
          const normalizedCell = String(cellValue).replace(/[- ]+/g, '').toLowerCase();
          return normalizedCell.includes(normalizedSearch);
        };
      }
    },
    { 
      field: 'param_value', 
      headerName: 'Значение', 
      flex: 1, 
      minWidth: 150,
      type: 'number'
    },
    {
      field: 'actions',
      headerName: 'Действия',
      sortable: false,
      filterable: false,
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Редактировать параметр" arrow>
            <IconButton color="primary" onClick={() => handleOpen(params.row)} sx={{ cursor: 'pointer' }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить параметр" arrow>
            <IconButton color="error" onClick={() => handleDelete(params.row.id as string)} sx={{ cursor: 'pointer' }}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', gap: 4, pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h4">Параметры расчетов</Typography>
        <Tooltip title="Добавить новый параметр" arrow>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ cursor: 'pointer' }}>
            Добавить параметр
          </Button>
        </Tooltip>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <DataGrid
          autoHeight
          rows={parameters}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          columnHeaderHeight={60}
          localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            border: 0,
            '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' },
            '& .MuiDataGrid-columnHeader': { alignItems: 'flex-start' },
            '& .MuiDataGrid-columnHeaderTitleContainer': { alignItems: 'flex-start', paddingTop: '8px' },
            '& .MuiDataGrid-columnHeaderTitle': { whiteSpace: 'normal', lineHeight: '1.2rem', fontWeight: 600 }
          }}
          slots={{ toolbar: CustomToolbar }}
          slotProps={{
            toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } },
          }}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem?.id ? 'Редактировать параметр' : 'Новый параметр'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth margin="normal" label="Имя параметра"
            value={editingItem?.param_name || ''}
            disabled={!!editingItem?.id} // PK shouldn't be edited if it exists
            onChange={(e) => setEditingItem({...editingItem, param_name: e.target.value})}
          />
          <TextField
            fullWidth margin="normal" label="Значение" type="number"
            value={editingItem?.param_value || ''}
            onChange={(e) => setEditingItem({...editingItem, param_value: Number(e.target.value)})}
          />
        </DialogContent>
        <DialogActions>
          <Tooltip title="Отменить изменения" arrow>
            <Button onClick={handleClose} sx={{ cursor: 'pointer' }}>Отмена</Button>
          </Tooltip>
          <Tooltip title="Сохранить изменения в базу" arrow>
            <Button onClick={handleSave} variant="contained" color="primary" sx={{ cursor: 'pointer' }}>Сохранить</Button>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
