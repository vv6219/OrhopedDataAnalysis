import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip,
  Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams, GridToolbar, GridFooterContainer, GridPagination } from '@mui/x-data-grid';
import { ruRU } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export default function Operations() {
  const [operations, setOperations] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Master-Detail state
  const [selectedOperationId, setSelectedOperationId] = useState<number | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [operationMaterials, setOperationMaterials] = useState<any[]>([]);
  
  // Detail Dialog state
  const [openDetail, setOpenDetail] = useState(false);
  const [editingDetailItem, setEditingDetailItem] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/operations')
      .then(res => res.json())
      .then(data => setOperations(data))
      .catch(err => console.error('Error fetching operations:', err));
      
    // Fetch all materials for the dropdown
    fetch('http://localhost:5000/api/materials')
      .then(res => res.json())
      .then(data => setMaterials(data))
      .catch(err => console.error('Error fetching materials:', err));
  }, []);
  
  // Fetch materials for selected operation
  useEffect(() => {
    if (selectedOperationId) {
      fetch(`http://localhost:5000/api/operations/${selectedOperationId}/materials`)
        .then(res => res.json())
        .then(data => setOperationMaterials(data))
        .catch(err => console.error('Error fetching operation materials:', err));
    } else {
      setOperationMaterials([]);
    }
  }, [selectedOperationId]);

  // Master CRUD handlers
  const handleOpen = (item = null) => {
    setEditingItem(item || { id: Date.now(), name: '', price: 0 });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    const isEditing = !!operations.find(m => m.id === editingItem.id);
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `http://localhost:5000/api/operations/${editingItem.id}` : 'http://localhost:5000/api/operations';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingItem.name,
          price: editingItem.price
        })
      });
      const data = await response.json();
      
      if (isEditing) {
        setOperations(operations.map(m => m.id === data.id ? data : m));
      } else {
        setOperations([...operations, data]);
      }
    } catch (err) {
      console.error('Failed to save', err);
    }
    handleClose();
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/api/operations/${id}`, { method: 'DELETE' });
      setOperations(operations.filter(m => m.id !== id));
      if (selectedOperationId === id) setSelectedOperationId(null);
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };
  
  // Detail CRUD handlers
  const handleOpenDetail = (item = null) => {
    setEditingDetailItem(item || { id: Date.now(), material_id: '', quantity: 1 });
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setEditingDetailItem(null);
  };
  
  const handleSaveDetail = async () => {
    if (!selectedOperationId) return;
    
    const isEditing = !!operationMaterials.find(m => m.id === editingDetailItem.id);
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing 
      ? `http://localhost:5000/api/operations/${selectedOperationId}/materials/${editingDetailItem.id}` 
      : `http://localhost:5000/api/operations/${selectedOperationId}/materials`;
      
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: editingDetailItem.material_id,
          quantity: editingDetailItem.quantity
        })
      });
      
      // Refresh list
      const res = await fetch(`http://localhost:5000/api/operations/${selectedOperationId}/materials`);
      const data = await res.json();
      setOperationMaterials(data);
    } catch (err) {
      console.error('Failed to save detail', err);
    }
    handleCloseDetail();
  };
  
  const handleDeleteDetail = async (omId: number) => {
    if (!selectedOperationId) return;
    try {
      await fetch(`http://localhost:5000/api/operations/${selectedOperationId}/materials/${omId}`, { method: 'DELETE' });
      setOperationMaterials(operationMaterials.filter(m => m.id !== omId));
    } catch (err) {
      console.error('Failed to delete detail', err);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'name', headerName: 'Название процедуры / операции', flex: 1, minWidth: 200 },
    { 
      field: 'price', 
      headerName: 'Стоимость (₽)', 
      width: 150, 
      type: 'number',
      valueFormatter: (value) => `${value ? value.toLocaleString() : 0}`
    },
    {
      field: 'actions',
      headerName: 'Действия',
      sortable: false,
      filterable: false,
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Редактировать операцию" arrow>
            <IconButton color="primary" onClick={(e) => { e.stopPropagation(); handleOpen(params.row); }} sx={{ cursor: 'pointer' }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить операцию" arrow>
            <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDelete(params.row.id); }} sx={{ cursor: 'pointer' }}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
  
  const detailColumns: GridColDef[] = [
    { field: 'material_name', headerName: 'Название материала', flex: 3, minWidth: 200 },
    { field: 'unit_of_measure', headerName: 'Ед. изм.', flex: 1, minWidth: 80 },
    { field: 'quantity', headerName: 'Кол-во', flex: 1, minWidth: 80, type: 'number' },
    { 
      field: 'current_unit_cost', 
      headerName: 'Цена за ед. (₽)', 
      flex: 1, minWidth: 110,
      type: 'number',
      valueFormatter: (value) => `${value ? value.toLocaleString() : 0}`
    },
    {
      field: 'total',
      headerName: 'Сумма (₽)',
      flex: 1, minWidth: 110,
      type: 'number',
      valueGetter: (value, row) => (row.quantity || 0) * (row.current_unit_cost || 0),
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
          <Tooltip title="Редактировать расход" arrow>
            <IconButton color="primary" onClick={() => handleOpenDetail(params.row)} sx={{ cursor: 'pointer' }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить расход" arrow>
            <IconButton color="error" onClick={() => handleDeleteDetail(params.row.id)} sx={{ cursor: 'pointer' }}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
  
  const selectedOperation = operations.find(o => o.id === selectedOperationId);
  const detailTotalItems = operationMaterials.length;
  const detailTotalPrice = operationMaterials.reduce((sum, mat) => sum + ((mat.quantity || 0) * (mat.current_unit_cost || 0)), 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', gap: 4, pb: 4 }}>
      {/* MASTER SECTION */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexShrink: 0 }}>
          <Typography variant="h4">Каталог операций</Typography>
          <Tooltip title="Добавить новую процедуру или операцию" arrow>
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ cursor: 'pointer' }}>
              Добавить операцию
            </Button>
          </Tooltip>
        </Box>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <DataGrid
            autoHeight
            disableColumnMenu
            rows={operations}
            columns={columns}
            onRowClick={(params) => setSelectedOperationId(params.row.id as number)}
            disableMultipleRowSelection
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
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } },
            }}
          />
        </Paper>
      </Box>

      {/* DETAIL SECTION */}
      {selectedOperationId && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center', flexShrink: 0 }}>
            <Typography variant="h5" noWrap sx={{ maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Материалы для: {selectedOperation?.name}
            </Typography>
            <Tooltip title="Добавить расходный материал" arrow>
              <Button variant="outlined" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDetail()} sx={{ cursor: 'pointer' }}>
                Добавить материал
              </Button>
            </Tooltip>
          </Box>
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <DataGrid
              autoHeight
              disableColumnMenu
              rows={operationMaterials}
              columns={detailColumns}
              disableRowSelectionOnClick
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 5 },
                },
              }}
              pageSizeOptions={[5, 10, 25]}
              columnHeaderHeight={60}
              localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
              sx={{
                border: 0,
                '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' },
                '& .MuiDataGrid-columnHeader': { alignItems: 'flex-start' },
                '& .MuiDataGrid-columnHeaderTitleContainer': { alignItems: 'flex-start', paddingTop: '8px' },
                '& .MuiDataGrid-columnHeaderTitle': { whiteSpace: 'normal', lineHeight: '1.2rem', fontWeight: 600 }
              }}
              slots={{
                footer: () => (
                  <GridFooterContainer>
                    <Box sx={{ px: 2, display: 'flex', gap: 3, alignItems: 'center' }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Всего позиций: {detailTotalItems}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold" color="primary">
                        Итого материалов: {detailTotalPrice.toLocaleString()} ₽
                      </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <GridPagination />
                  </GridFooterContainer>
                )
              }}
            />
          </Paper>
        </Box>
      )}

      {/* Add/Edit Master Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem?.name ? 'Редактировать операцию' : 'Новая операция'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth margin="normal" label="Название процедуры / операции"
            value={editingItem?.name || ''}
            onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
          />
          <TextField
            fullWidth margin="normal" label="Стоимость (₽)" type="number"
            value={editingItem?.price || ''}
            onChange={(e) => setEditingItem({...editingItem, price: Number(e.target.value)})}
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
      
      {/* Add/Edit Detail Dialog */}
      <Dialog open={openDetail} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDetailItem?.id && !editingDetailItem?.id.toString().startsWith('17') ? 'Редактировать материал' : 'Добавить материал к операции'}</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth margin="normal">
            <InputLabel id="material-select-label">Материал</InputLabel>
            <Select
              labelId="material-select-label"
              value={editingDetailItem?.material_id || ''}
              label="Материал"
              onChange={(e) => setEditingDetailItem({...editingDetailItem, material_id: e.target.value})}
            >
              {materials.map((mat) => (
                <MenuItem key={mat.id} value={mat.id}>
                  {mat.material_name} ({mat.unit_of_measure}) - {mat.current_unit_cost} ₽
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth margin="normal" label="Количество" type="number"
            value={editingDetailItem?.quantity || ''}
            onChange={(e) => setEditingDetailItem({...editingDetailItem, quantity: Number(e.target.value)})}
          />
        </DialogContent>
        <DialogActions>
          <Tooltip title="Отменить изменения" arrow>
            <Button onClick={handleCloseDetail} sx={{ cursor: 'pointer' }}>Отмена</Button>
          </Tooltip>
          <Tooltip title="Сохранить изменения в базу" arrow>
            <Button onClick={handleSaveDetail} variant="contained" color="primary" sx={{ cursor: 'pointer' }}>Сохранить</Button>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
