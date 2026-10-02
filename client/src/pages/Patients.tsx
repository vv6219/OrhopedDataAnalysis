import React from 'react';
import { Typography, Box, Button, Tooltip, Paper } from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import CustomToolbar from '../components/CustomToolbar';
import { ruRU } from '@mui/x-data-grid/locales';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'firstName', headerName: 'Имя', flex: 1 },
  { field: 'lastName', headerName: 'Фамилия', flex: 1 },
  { field: 'contact', headerName: 'Контакты', flex: 1 },
  { field: 'lastVisit', headerName: 'Последний визит', width: 180 },
  {
    field: 'actions',
    headerName: 'Действия',
    sortable: false,
    filterable: false,
    width: 150,
    renderCell: (params: GridRenderCellParams) => (
      <Tooltip title="Открыть медицинскую карту пациента" arrow>
        <Button size="small" variant="outlined" sx={{ cursor: 'pointer' }}>
          Просмотр ЭМК
        </Button>
      </Tooltip>
    ),
  },
];

const rows = [
  { id: 1, firstName: 'Исторический', lastName: 'Пациент', contact: 'Н/Д', lastVisit: '2026-09-29' },
  { id: 2, firstName: 'Иван', lastName: 'Иванов', contact: '+7 (999) 123-45-67', lastVisit: '2026-09-30' },
  { id: 3, firstName: 'Мария', lastName: 'Смирнова', contact: '+7 (999) 987-65-43', lastVisit: '2026-10-01' },
];

export default function Patients() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', width: '95%', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Пациенты (ЭМК)
        </Typography>
        <Tooltip title="Зарегистрировать нового пациента в системе" arrow>
          <Button variant="contained" color="primary" sx={{ cursor: 'pointer' }}>Добавить пациента</Button>
        </Tooltip>
      </Box>
      
      <Paper sx={{ flexGrow: 1, width: '100%', minHeight: 400 }}>
        <DataGrid
          rows={rows}
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
          slots={{ toolbar: CustomToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
        />
      </Paper>
    </Box>
  );
}
