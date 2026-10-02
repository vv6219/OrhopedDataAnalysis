import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams, GridFooterContainer, GridPagination, getGridStringOperators } from '@mui/x-data-grid';
import CustomToolbar from '../components/CustomToolbar';
import { ruRU } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const customStringOperators = getGridStringOperators().map((operator) => {
  if (operator.value === 'contains') {
    return {
      ...operator,
      getApplyFilterFn: (filterItem) => {
        if (!filterItem.value) return null;
        const normalizedSearch = filterItem.value.replace(/[- ]+/g, '').toLowerCase();
        return (value) => {
          if (value == null) return false;
          const normalizedCell = String(value).replace(/[- ]+/g, '').toLowerCase();
          return normalizedCell.includes(normalizedSearch);
        };
      },
    };
  }
  return operator;
});

export default function Inventory() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/materials')
      .then(res => res.json())
      .then(data => setMaterials(data))
      .catch(err => console.error('Error fetching materials:', err));
  }, []);

  const handleOpen = (item = null) => {
    setEditingItem(item || { id: Date.now(), material_name: '', unit_of_measure: '', current_unit_cost: 0 });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    const isEditing = !!materials.find(m => m.id === editingItem.id);
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `http://localhost:5000/api/materials/${editingItem.id}` : 'http://localhost:5000/api/materials';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });
      const data = await response.json();
      
      if (isEditing) {
        setMaterials(materials.map(m => m.id === data.id ? data : m));
      } else {
        setMaterials([...materials, data]);
      }
    } catch (err) {
      console.error('Failed to save', err);
    }
    handleClose();
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/api/materials/${id}`, { method: 'DELETE' });
      setMaterials(materials.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { 
      field: 'material_name', 
      headerName: 'Название материала', 
      flex: 2, 
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
    { field: 'unit_of_measure', headerName: 'Ед. измерения', flex: 1, minWidth: 120 },
    { 
      field: 'current_unit_cost', 
      headerName: 'Стоимость единицы (₽)', 
      flex: 1, minWidth: 150, 
      type: 'number',
      valueFormatter: (value) => `${value ? value.toLocaleString() : 0}`
    },
    { 
      field: 'package_cost', 
      headerName: 'Стоимость упаковки (₽)', 
      flex: 1, minWidth: 150, 
      type: 'number',
      valueFormatter: (value) => `${value ? value.toLocaleString() : 0}`
    },
    {
      field: 'actions',
      headerName: 'Действия',
      sortable: false,
      filterable: false,
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Редактировать материал" arrow>
            <IconButton color="primary" onClick={() => handleOpen(params.row)} sx={{ cursor: 'pointer' }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить материал" arrow>
            <IconButton color="error" onClick={() => handleDelete(params.row.id)} sx={{ cursor: 'pointer' }}>
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
        <Typography variant="h4">Склад материалов</Typography>
        <Tooltip title="Добавить новый медицинский материал на склад" arrow>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ cursor: 'pointer' }}>
            Добавить материал
          </Button>
        </Tooltip>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <DataGrid
          autoHeight
          rows={materials}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          columnHeaderHeight={60}
          localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            border: 0,
            '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' },
            '& .MuiDataGrid-columnHeader': {
              alignItems: 'flex-start',
            },
            '& .MuiDataGrid-columnHeaderTitleContainer': {
              alignItems: 'flex-start',
              paddingTop: '8px',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              whiteSpace: 'normal',
              lineHeight: '1.2rem',
              fontWeight: 600,
            }
          }}
          slots={{ 
            toolbar: CustomToolbar,
            footer: () => (
              <GridFooterContainer>
                <Box sx={{ px: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Всего материалов: {materials.length}
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <GridPagination />
              </GridFooterContainer>
            )
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem?.material_name ? 'Редактировать материал' : 'Новый материал'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth margin="normal" label="Название материала"
            value={editingItem?.material_name || ''}
            onChange={(e) => setEditingItem({...editingItem, material_name: e.target.value})}
          />
          <TextField
            fullWidth margin="normal" label="Ед. измерения (например, шт, мл, уп)"
            value={editingItem?.unit_of_measure || ''}
            onChange={(e) => setEditingItem({...editingItem, unit_of_measure: e.target.value})}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth margin="normal" label="Стоимость единицы (₽)" type="number"
              value={editingItem?.current_unit_cost || ''}
              onChange={(e) => setEditingItem({...editingItem, current_unit_cost: Number(e.target.value)})}
            />
            <TextField
              fullWidth margin="normal" label="Стоимость упаковки (₽)" type="number"
              value={editingItem?.package_cost || ''}
              onChange={(e) => setEditingItem({...editingItem, package_cost: Number(e.target.value)})}
            />
          </Box>
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
