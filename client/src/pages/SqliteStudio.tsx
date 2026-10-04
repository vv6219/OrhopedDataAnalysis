import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  Snackbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import StorageIcon from '@mui/icons-material/Storage';
import TableChartIcon from '@mui/icons-material/TableChart';
import TerminalIcon from '@mui/icons-material/Terminal';
import SchemaIcon from '@mui/icons-material/Schema';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CodeIcon from '@mui/icons-material/Code';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HistoryIcon from '@mui/icons-material/History';
import KeyIcon from '@mui/icons-material/Key';

interface TableMeta {
  name: string;
  sql: string;
  rowCount: number;
  columns: {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }[];
}

interface DbStats {
  dbName: string;
  dbPath: string;
  fileSizeBytes: number;
  sqliteVersion: string;
  integrity: string;
  tableCount: number;
}

export default function SqliteStudio() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableSearch, setTableSearch] = useState('');
  const [currentTab, setCurrentTab] = useState(0); // 0: Data, 1: SQL Console, 2: Schema / DDL

  // Table Data State
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<GridColDef[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loadingData, setLoadingData] = useState(false);

  // SQL Console State
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM operations LIMIT 50;');
  const [queryExecuting, setQueryExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([
    'SELECT * FROM operations LIMIT 50;',
    'SELECT * FROM materials_catalog LIMIT 50;',
    'PRAGMA integrity_check;'
  ]);

  // Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isNewRow, setIsNewRow] = useState(false);
  const [editingRow, setEditingRow] = useState<any>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<any>(null);

  // Notifications
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchTables();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/db/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch DB stats', e);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/db/tables`);
      if (res.ok) {
        const data: TableMeta[] = await res.json();
        setTables(data);
        if (data.length > 0 && !selectedTable) {
          const defaultTable = data.find(t => t.name === 'operations') || data[0];
          setSelectedTable(defaultTable.name);
          loadTableData(defaultTable.name);
        }
      }
    } catch (e) {
      console.error('Failed to fetch DB tables', e);
    }
  };

  const loadTableData = async (tableName: string) => {
    setLoadingData(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/db/tables/${tableName}/data?pageSize=1000`);
      if (res.ok) {
        const data = await res.json();
        setTotalRows(data.total);

        // Generate columns
        const cols: GridColDef[] = data.columns.map((col: any) => ({
          field: col.name,
          headerName: col.name + (col.pk ? ' (PK)' : ''),
          flex: 1,
          minWidth: 130,
          editable: false,
          renderCell: (params: any) => {
            const val = params.value;
            if (val === null || val === undefined) {
              return <span style={{ color: '#A0AEC0', fontStyle: 'italic' }}>NULL</span>;
            }
            if (typeof val === 'number') {
              return <span style={{ fontWeight: 600 }}>{val.toLocaleString('ru-RU')}</span>;
            }
            return String(val);
          }
        }));

        // Action Column
        cols.push({
          field: '__actions',
          type: 'actions',
          headerName: 'Действия',
          width: 100,
          getActions: (params: any) => [
            <GridActionsCellItem
              icon={
                <Tooltip title="Редактировать запись">
                  <EditIcon sx={{ color: '#0F3C64', fontSize: 18 }} />
                </Tooltip>
              }
              label="Edit"
              onClick={() => handleOpenEditDialog(params.row, false)}
            />,
            <GridActionsCellItem
              icon={
                <Tooltip title="Удалить запись">
                  <DeleteIcon sx={{ color: '#E53E3E', fontSize: 18 }} />
                </Tooltip>
              }
              label="Delete"
              onClick={() => {
                setRowToDelete(params.row);
                setDeleteConfirmOpen(true);
              }}
            />
          ]
        });

        setTableColumns(cols);
        setTableRows(data.rows);
      }
    } catch (e) {
      console.error('Failed to load table data', e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSelectTable = (name: string) => {
    setSelectedTable(name);
    loadTableData(name);
    if (currentTab === 1) {
      setSqlQuery(`SELECT * FROM ${name} LIMIT 50;`);
    }
  };

  const handleExecuteSql = async () => {
    if (!sqlQuery.trim()) return;
    setQueryExecuting(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/db/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setQueryError(data.error || 'Ошибка при выполнении SQL запроса');
      } else {
        setQueryResult(data);
        if (!queryHistory.includes(sqlQuery)) {
          setQueryHistory(prev => [sqlQuery, ...prev.slice(0, 15)]);
        }
        // If mutation, refresh tables and current table data
        if (data.type === 'mutation') {
          fetchTables();
          if (selectedTable) loadTableData(selectedTable);
        }
      }
    } catch (e: any) {
      setQueryError(e.message || 'Сетевая ошибка при выполнении запроса');
    } finally {
      setQueryExecuting(false);
    }
  };

  const handleOpenEditDialog = (row: any, isNew: boolean) => {
    setIsNewRow(isNew);
    if (isNew) {
      const emptyRow: any = {};
      const activeMeta = tables.find(t => t.name === selectedTable);
      activeMeta?.columns.forEach(c => {
        if (!c.pk) emptyRow[c.name] = '';
      });
      setEditingRow(emptyRow);
    } else {
      setEditingRow({ ...row });
    }
    setEditDialogOpen(true);
  };

  const handleSaveRow = async () => {
    try {
      const activeMeta = tables.find(t => t.name === selectedTable);
      if (!activeMeta) return;

      const pkCol = activeMeta.columns.find(c => c.pk)?.name || 'id';
      const rowId = editingRow[pkCol] || editingRow._rowid;

      let url = `${API_BASE_URL}/api/db/tables/${selectedTable}/row`;
      let method = 'POST';

      if (!isNewRow) {
        url = `${API_BASE_URL}/api/db/tables/${selectedTable}/row/${rowId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRow)
      });

      if (res.ok) {
        setSnackbarMessage(isNewRow ? 'Запись успешно добавлена' : 'Запись обновлена');
        setEditDialogOpen(false);
        loadTableData(selectedTable);
        fetchTables();
      } else {
        const err = await res.json();
        alert('Ошибка при сохранении: ' + (err.error || 'Неизвестная ошибка'));
      }
    } catch (e: any) {
      alert('Ошибка при отправке: ' + e.message);
    }
  };

  const handleDeleteRow = async () => {
    if (!rowToDelete) return;
    try {
      const activeMeta = tables.find(t => t.name === selectedTable);
      const pkCol = activeMeta?.columns.find(c => c.pk)?.name || 'id';
      const rowId = rowToDelete[pkCol] || rowToDelete._rowid;

      const res = await fetch(`${API_BASE_URL}/api/db/tables/${selectedTable}/row/${rowId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSnackbarMessage('Запись удалена');
        setDeleteConfirmOpen(false);
        setRowToDelete(null);
        loadTableData(selectedTable);
        fetchTables();
      } else {
        const err = await res.json();
        alert('Ошибка удаления: ' + (err.error || 'Неизвестная ошибка'));
      }
    } catch (e: any) {
      alert('Ошибка сети: ' + e.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage('Скопировано в буфер обмена');
  };

  const activeTableMeta = tables.find(t => t.name === selectedTable);
  const filteredTables = tables.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()));

  // Format file size
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ width: '100%', minHeight: 'calc(100vh - 100px)' }}>
      {/* Top Banner / Hero Card */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #0F3C64 0%, #156C9C 100%)',
          color: '#FFFFFF',
          borderRadius: 3,
          boxShadow: '0 8px 32px 0 rgba(15, 60, 100, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <StorageIcon sx={{ fontSize: 32, color: '#63B3ED' }} />
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>
                SQLite Studio & Database Manager
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 700 }}>
              Интерактивная среда инспекции, администрирования схемы и выполнения прямых SQL запросов к базе данных ERP клиники.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNewIcon />}
              onClick={() => window.open(`${API_BASE_URL}/api-docs`, '_blank')}
              sx={{
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.4)',
                '&:hover': { borderColor: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              Swagger REST API
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => {
                fetchStats();
                fetchTables();
                if (selectedTable) loadTableData(selectedTable);
                setSnackbarMessage('Данные БД обновлены');
              }}
              sx={{
                bgcolor: '#FFFFFF',
                color: '#0F3C64',
                fontWeight: 700,
                '&:hover': { bgcolor: '#F7FAFC' }
              }}
            >
              Обновить схему
            </Button>
          </Box>
        </Box>

        {/* Database Quick Stats Strip */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
          <Chip
            icon={<CheckCircleIcon style={{ color: '#48BB78' }} />}
            label={`Статус: ${stats?.integrity === 'ok' ? 'Целостность OK' : stats?.integrity || 'Активна'}`}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', fontWeight: 600 }}
          />
          <Chip
            label={`SQLite: v${stats?.sqliteVersion || '3.x'}`}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', fontWeight: 600 }}
          />
          <Chip
            label={`Таблиц: ${stats?.tableCount || tables.length}`}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', fontWeight: 600 }}
          />
          <Chip
            label={`Размер: ${formatBytes(stats?.fileSizeBytes || 0)}`}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', fontWeight: 600 }}
          />
          <Chip
            label="Файл: db/orthopedic_data_center.sqlite"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)', color: 'rgba(255, 255, 255, 0.9)', fontStyle: 'italic' }}
          />
        </Box>
      </Paper>

      {/* Main Split Layout: Left Table Selector + Right Tabs Container */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 3 }}>
        {/* Left Column: Tables Navigator */}
        <Paper sx={{ p: 2, borderRadius: 3, height: 'fit-content', border: '1px solid #E2E8F0' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableChartIcon fontSize="small" /> Таблицы базы данных ({tables.length})
          </Typography>

          <TextField
            fullWidth
            size="small"
            placeholder="Поиск таблицы..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, mb: 1.5 }
              }
            }}
          />

          <List sx={{ maxHeight: '600px', overflowY: 'auto', p: 0 }}>
            {filteredTables.map((tbl) => {
              const isSelected = selectedTable === tbl.name;
              return (
                <ListItemButton
                  key={tbl.name}
                  onClick={() => handleSelectTable(tbl.name)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    bgcolor: isSelected ? 'rgba(15, 60, 100, 0.08)' : 'transparent',
                    borderLeft: isSelected ? '4px solid #0F3C64' : '4px solid transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: 'rgba(15, 60, 100, 0.05)' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <TableChartIcon sx={{ fontSize: 18, color: isSelected ? '#0F3C64' : '#718096' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? '#0F3C64' : '#2D3748',
                            fontSize: '0.85rem'
                          }}
                        >
                          {tbl.name}
                        </Typography>
                        <Chip
                          label={tbl.rowCount.toLocaleString()}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: isSelected ? '#0F3C64' : '#EDF2F7',
                            color: isSelected ? '#FFFFFF' : '#4A5568',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    }
                  />
                </ListItemButton>
              );
            })}
            {filteredTables.length === 0 && (
              <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                Таблицы не найдены
              </Typography>
            )}
          </List>
        </Paper>

        {/* Right Column: Tabs (Data / SQL Console / Schema) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#F8FAFC', px: 2 }}>
              <Tabs
                value={currentTab}
                onChange={(_, val) => setCurrentTab(val)}
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', py: 2 }
                }}
              >
                <Tab icon={<TableChartIcon fontSize="small" />} iconPosition="start" label="Таблица и Данные" />
                <Tab icon={<TerminalIcon fontSize="small" />} iconPosition="start" label="SQL Консоль" />
                <Tab icon={<SchemaIcon fontSize="small" />} iconPosition="start" label="Структура и DDL" />
              </Tabs>
            </Box>

            {/* TAB 0: Data Viewer Grid */}
            {currentTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                      {selectedTable || 'Выберите таблицу'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Всего записей: {totalRows.toLocaleString()} | Колонок: {activeTableMeta?.columns.length || 0}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={() => selectedTable && loadTableData(selectedTable)}
                    >
                      Обновить
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenEditDialog({}, true)}
                      sx={{ bgcolor: '#0F3C64', '&:hover': { bgcolor: '#082540' } }}
                    >
                      Добавить запись
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ height: 600, width: '100%', position: 'relative' }}>
                  {loadingData && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(255, 255, 255, 0.7)',
                        zIndex: 10
                      }}
                    >
                      <CircularProgress size={40} />
                    </Box>
                  )}
                  <DataGrid
                    rows={tableRows}
                    columns={tableColumns}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25, page: 0 } },
                    }}
                    slots={{
                      toolbar: () => (
                        <GridToolbarContainer sx={{ p: 1, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <GridToolbarColumnsButton />
                            <GridToolbarFilterButton />
                            <GridToolbarDensitySelector />
                            <GridToolbarExport />
                          </Box>
                          <GridToolbarQuickFilter debounceMs={400} />
                        </GridToolbarContainer>
                      )
                    }}
                    disableRowSelectionOnClick
                    density="compact"
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #E2E8F0',
                      '& .MuiDataGrid-columnHeaders': {
                        bgcolor: '#F1F5F9',
                        fontWeight: 700,
                        color: '#0F3C64'
                      }
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* TAB 1: SQL Console */}
            {currentTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
                  Интерактивный редактор SQL запросов
                </Typography>

                {/* Quick Templates */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ alignSelf: 'center', color: 'text.secondary', fontWeight: 600 }}>
                    Шаблоны:
                  </Typography>
                  <Chip
                    size="small"
                    label={`SELECT * FROM ${selectedTable || 'operations'} LIMIT 50`}
                    onClick={() => setSqlQuery(`SELECT * FROM ${selectedTable || 'operations'} LIMIT 50;`)}
                    clickable
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    size="small"
                    label={`COUNT(${selectedTable || 'operations'})`}
                    onClick={() => setSqlQuery(`SELECT COUNT(*) AS total_rows FROM ${selectedTable || 'operations'};`)}
                    clickable
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    size="small"
                    label="PRAGMA integrity_check"
                    onClick={() => setSqlQuery('PRAGMA integrity_check;')}
                    clickable
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    size="small"
                    label="sqlite_master (Схема всех таблиц)"
                    onClick={() => setSqlQuery("SELECT name, type, sql FROM sqlite_master WHERE type='table';")}
                    clickable
                    sx={{ cursor: 'pointer' }}
                  />
                </Box>

                {/* Monospace Code Input */}
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: '#0B1929',
                    borderRadius: 2,
                    border: '1px solid #1E3A5F',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                    mb: 2
                  }}
                >
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.ctrlKey && e.key === 'Enter') {
                        e.preventDefault();
                        handleExecuteSql();
                      }
                    }}
                    placeholder="Введите SQL запрос (например: SELECT * FROM operations WHERE price > 5000)..."
                    variant="standard"
                    slotProps={{
                      input: {
                        disableUnderline: true,
                        sx: {
                          color: '#63B3ED',
                          fontFamily: '"Fira Code", "Courier New", monospace',
                          fontSize: '0.95rem',
                          lineHeight: 1.5
                        }
                      }
                    }}
                  />
                </Paper>

                {/* Query Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Подсказка: нажмите <b>Ctrl + Enter</b> для быстрого запуска запроса
                  </Typography>

                  <Button
                    variant="contained"
                    startIcon={queryExecuting ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                    onClick={handleExecuteSql}
                    disabled={queryExecuting || !sqlQuery.trim()}
                    sx={{
                      bgcolor: '#0F3C64',
                      fontWeight: 700,
                      px: 3,
                      '&:hover': { bgcolor: '#082540' }
                    }}
                  >
                    {queryExecuting ? 'Выполняется...' : 'Выполнить запрос'}
                  </Button>
                </Box>

                {/* Error Banner */}
                {queryError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {queryError}
                  </Alert>
                )}

                {/* Query Result Stats */}
                {queryResult && (
                  <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Alert
                      severity="success"
                      icon={<CheckCircleIcon />}
                      sx={{ flexGrow: 1, py: 0.5, borderRadius: 2 }}
                    >
                      {queryResult.type === 'select' ? (
                        <span>
                          Запрос выполнен успешно: возвращено <b>{queryResult.rowCount}</b> строк за{' '}
                          <b>{queryResult.executionTimeMs} мс</b>
                        </span>
                      ) : (
                        <span>
                          Команда выполнена успешно: затронуто <b>{queryResult.changes}</b> строк (ID: {queryResult.lastID || 'N/A'}) за{' '}
                          <b>{queryResult.executionTimeMs} мс</b>
                        </span>
                      )}
                    </Alert>
                  </Box>
                )}

                {/* Query Result Grid */}
                {queryResult && queryResult.type === 'select' && (
                  <Box sx={{ height: 400, width: '100%' }}>
                    <DataGrid
                      rows={queryResult.rows}
                      columns={queryResult.columns.map((c: any) => ({
                        field: c.field,
                        headerName: c.headerName,
                        flex: 1,
                        minWidth: 120,
                        renderCell: (params: any) => {
                          const val = params.value;
                          if (val === null || val === undefined) {
                            return <span style={{ color: '#A0AEC0', fontStyle: 'italic' }}>NULL</span>;
                          }
                          return String(val);
                        }
                      }))}
                      pageSizeOptions={[10, 25, 50]}
                      initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                      density="compact"
                      slots={{
                        toolbar: () => (
                          <GridToolbarContainer sx={{ p: 1, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <GridToolbarExport />
                            </Box>
                            <GridToolbarQuickFilter debounceMs={300} />
                          </GridToolbarContainer>
                        )
                      }}
                      sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}
                    />
                  </Box>
                )}

                {/* Query History */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4A5568', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <HistoryIcon fontSize="small" /> Недавние запросы сессии
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {queryHistory.map((q, idx) => (
                      <Paper
                        key={idx}
                        onClick={() => setSqlQuery(q)}
                        sx={{
                          p: 1,
                          px: 1.5,
                          cursor: 'pointer',
                          bgcolor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          color: '#2D3748',
                          borderRadius: 1.5,
                          '&:hover': { bgcolor: '#EDF2F7', borderColor: '#CBD5E0' }
                        }}
                      >
                        {q}
                      </Paper>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}

            {/* TAB 2: Schema & DDL */}
            {currentTab === 2 && activeTableMeta && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                    Схема таблицы `{activeTableMeta.name}`
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => copyToClipboard(activeTableMeta.sql || '')}
                  >
                    Копировать DDL
                  </Button>
                </Box>

                {/* Columns Definition List */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4A5568', mb: 1 }}>
                  Поля и типы данных ({activeTableMeta.columns.length})
                </Typography>

                <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '80px 2fr 1fr 1fr 1fr', p: 1.5, bgcolor: '#F1F5F9', fontWeight: 700, color: '#0F3C64', fontSize: '0.85rem' }}>
                    <Box>CID</Box>
                    <Box>Имя поля</Box>
                    <Box>Тип данных</Box>
                    <Box>Ключ</Box>
                    <Box>Обязательное</Box>
                  </Box>
                  <Divider />
                  {activeTableMeta.columns.map((col) => (
                    <Box
                      key={col.cid}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '80px 2fr 1fr 1fr 1fr',
                        p: 1.5,
                        alignItems: 'center',
                        borderBottom: '1px solid #EDF2F7',
                        fontSize: '0.85rem',
                        '&:hover': { bgcolor: '#F8FAFC' }
                      }}
                    >
                      <Box sx={{ color: 'text.secondary' }}>#{col.cid}</Box>
                      <Box sx={{ fontWeight: 600, color: '#2D3748', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {col.pk === 1 && <KeyIcon sx={{ fontSize: 16, color: '#D69E2E' }} />}
                        {col.name}
                      </Box>
                      <Box>
                        <Chip label={col.type || 'TEXT'} size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                      </Box>
                      <Box>
                        {col.pk === 1 ? (
                          <Chip label="PRIMARY KEY" size="small" color="primary" sx={{ fontSize: '0.7rem', height: 20 }} />
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>-</Typography>
                        )}
                      </Box>
                      <Box>
                        {col.notnull === 1 ? (
                          <Typography variant="caption" sx={{ color: '#E53E3E', fontWeight: 600 }}>NOT NULL</Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>NULL</Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Paper>

                {/* DDL Code Block */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4A5568', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CodeIcon fontSize="small" /> Исходный DDL (CREATE TABLE)
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: '#0B1929',
                    color: '#63B3ED',
                    borderRadius: 2,
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '0.85rem',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {activeTableMeta.sql || 'DDL отсутствует'}
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Row Edit / Insert Modal Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F3C64' }}>
          {isNewRow ? `Добавить запись в \`${selectedTable}\`` : `Редактировать запись в \`${selectedTable}\``}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activeTableMeta?.columns.map((col) => {
            const isPk = col.pk === 1;
            if (isNewRow && isPk) {
              return null; // Skip PK on insert for autoincrement
            }
            return (
              <TextField
                key={col.name}
                label={`${col.name} (${col.type || 'TEXT'})`}
                value={editingRow[col.name] !== undefined ? editingRow[col.name] : ''}
                disabled={!isNewRow && isPk}
                onChange={(e) => setEditingRow({ ...editingRow, [col.name]: e.target.value })}
                fullWidth
                size="small"
                required={col.notnull === 1}
              />
            );
          })}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">
            Отмена
          </Button>
          <Button onClick={handleSaveRow} variant="contained" sx={{ bgcolor: '#0F3C64' }}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: '#E53E3E' }}>
          Подтверждение удаления
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Вы уверены, что хотите удалить выбранную запись из таблицы <b>{selectedTable}</b>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Отмена
          </Button>
          <Button onClick={handleDeleteRow} variant="contained" color="error">
            Удалить запись
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Snackbar */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
