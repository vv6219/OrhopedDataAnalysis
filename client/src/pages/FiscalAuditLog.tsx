import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Chip, IconButton,
  TextField, MenuItem, Select, FormControl, InputLabel, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import { API_BASE_URL } from '../config/apiConfig';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

export interface FiscalAuditItem {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  event_type: string;
  receipt_id: number | null;
  transaction_id: number | null;
  device_port: string;
  duration_ms: number;
  properties_json: string | null;
  properties?: any;
  exception_details: string | null;
}

// Module-level stable Custom Toolbar for DataGrid (per grid-improvements skill)
function FiscalAuditCustomToolbar({ onResetFilters }: { onResetFilters?: () => void }) {
  return (
    <GridToolbarContainer sx={{ p: 1.5, gap: 1, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      {onResetFilters && (
        <Button
          size="small"
          startIcon={<FilterAltOffIcon />}
          onClick={onResetFilters}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
        >
          Сбросить фильтры
        </Button>
      )}
      <Box sx={{ ml: 'auto', width: 260 }}>
        <GridToolbarQuickFilter debounceMs={300} />
      </Box>
    </GridToolbarContainer>
  );
}

// Module-level stable Custom Footer displaying accounting totals (per grid-improvements skill)
function FiscalAuditCustomFooter({
  totalCount,
  infoCount,
  errorCount,
  avgDuration
}: {
  totalCount: number;
  infoCount: number;
  errorCount: number;
  avgDuration: number;
}) {
  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        borderTop: '1px solid #E2E8F0',
        bgcolor: '#F8FAFC'
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
          Всего записей аудита: {totalCount}
        </Typography>
        <Chip size="small" label={`Инфо: ${infoCount}`} sx={{ bgcolor: '#DEF7EC', color: '#03543F', fontWeight: 600 }} />
        {errorCount > 0 && (
          <Chip size="small" label={`Ошибок: ${errorCount}`} sx={{ bgcolor: '#FDE8E8', color: '#9B1C1C', fontWeight: 600 }} />
        )}
      </Box>
      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
        Среднее время операции ККТ: <b>{avgDuration} мс</b> • Хранилище: SQLite (таблица fiscal_audit_logs)
      </Typography>
    </Box>
  );
}

export default function FiscalAuditLog() {
  const [logs, setLogs] = useState<FiscalAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<FiscalAuditItem | null>(null);

  // Filter Bar state
  const [levelFilter, setLevelFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [daemonFilter, setDaemonFilter] = useState('all'); // 'all', 'live', 'test_only'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fiscal/audit-logs?limit=300`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err: any) {
      console.error('Error fetching fiscal audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleResetFilters = () => {
    setLevelFilter('all');
    setEventTypeFilter('all');
    setDaemonFilter('all');
    setSearchQuery('');
  };

  // Filtered rows
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (levelFilter !== 'all' && (log.level?.toLowerCase() || '') !== levelFilter.toLowerCase()) {
        return false;
      }
      if (eventTypeFilter !== 'all' && log.event_type !== eventTypeFilter) {
        return false;
      }
      const isDaemon = (log.message && log.message.includes('[TEST_DAEMON]')) ||
                       (log.properties_json && log.properties_json.includes('[TEST_DAEMON]'));
      if (daemonFilter === 'live' && isDaemon) return false;
      if (daemonFilter === 'test_only' && !isDaemon) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const msgMatch = log.message?.toLowerCase().includes(q);
        const propsMatch = log.properties_json?.toLowerCase().includes(q);
        const eventMatch = log.event_type?.toLowerCase().includes(q);
        const rcptMatch = String(log.receipt_id || '').includes(q);
        if (!msgMatch && !propsMatch && !eventMatch && !rcptMatch) return false;
      }

      return true;
    });
  }, [logs, levelFilter, eventTypeFilter, daemonFilter, searchQuery]);

  // Accounting aggregates for footer & KPI cards
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const info = filteredLogs.filter(l => l.level === 'Information').length;
    const error = filteredLogs.filter(l => l.level === 'Error' || l.level === 'Fatal').length;
    const warns = filteredLogs.filter(l => l.level === 'Warning').length;
    const totalDur = filteredLogs.reduce((acc, l) => acc + (l.duration_ms || 0), 0);
    const avgDur = total > 0 ? Math.round(totalDur / total) : 0;
    const fiscalCompletes = filteredLogs.filter(l => l.event_type === 'fiscal_complete').length;

    return { total, info, error, warns, avgDur, fiscalCompletes };
  }, [filteredLogs]);

  // DataGrid Columns definition
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
          #{params.value}
        </Typography>
      )
    },
    {
      field: 'timestamp',
      headerName: 'Время',
      width: 170,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#4A5568', fontSize: '0.82rem' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'level',
      headerName: 'Уровень',
      width: 130,
      renderCell: (params) => {
        const val = params.value as string;
        let bg = '#EDF2F7';
        let tc = '#4A5568';
        if (val === 'Information') { bg = '#EBF8FF'; tc = '#2B6CB0'; }
        else if (val === 'Warning') { bg = '#FEFCBF'; tc = '#B7791F'; }
        else if (val === 'Error' || val === 'Fatal') { bg = '#FED7D7'; tc = '#9B2C2C'; }
        else if (val === 'Debug') { bg = '#F7FAFC'; tc = '#718096'; }

        return (
          <Chip
            size="small"
            label={val}
            sx={{ fontWeight: 700, bgcolor: bg, color: tc, fontSize: '0.75rem' }}
          />
        );
      }
    },
    {
      field: 'event_type',
      headerName: 'Событие Serilog',
      width: 180,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          sx={{
            fontWeight: 600,
            bgcolor: '#F1F5F9',
            color: '#334155',
            fontSize: '0.75rem',
            border: '1px solid #CBD5E1'
          }}
        />
      )
    },
    {
      field: 'message',
      headerName: 'Сообщение операции ККТ',
      flex: 3,
      minWidth: 320,
      renderCell: (params) => {
        const isDaemon = params.value?.includes('[TEST_DAEMON]');
        return (
          <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
            {isDaemon && (
              <Chip
                size="small"
                label="[TEST_DAEMON]"
                sx={{ mr: 1, bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700, height: 20, fontSize: '0.7rem' }}
              />
            )}
            <Typography variant="body2" sx={{ display: 'inline', color: '#1A202C' }}>
              {params.value}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'receipt_id',
      headerName: 'Чек №',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: params.value ? 700 : 400, color: params.value ? '#0F3C64' : '#A0AEC0' }}>
          {params.value ? `#${params.value}` : '—'}
        </Typography>
      )
    },
    {
      field: 'duration_ms',
      headerName: 'Длительность',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: params.value > 100 ? '#D69E2E' : '#4A5568' }}>
          {params.value > 0 ? `${params.value} мс` : '—'}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Детали',
      width: 90,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={() => setSelectedLog(params.row)} sx={{ color: '#0F3C64' }}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
      )
    }
  ], []);

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: { xs: 1, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ReceiptLongIcon sx={{ fontSize: 36, color: '#0F3C64' }} />
            Журнал аудита ККТ «АТОЛ 91Ф» (Serilog)
          </Typography>
          <Typography variant="body1" sx={{ color: '#718096', mt: 0.5 }}>
            Структурированный аудит всех фискальных транзакций, сбросов ошибок и событий драйвера ККТ по 54-ФЗ
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchLogs}
            disabled={loading}
            sx={{ borderColor: '#CBD5E1', color: '#0F3C64', fontWeight: 600 }}
          >
            Обновить логи
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Всего событий</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', mt: 0.5 }}>{stats.total}</Typography>
            <Typography variant="caption" sx={{ color: '#A0AEC0' }}>в текущей выборке</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Успешных фискализаций</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#2F855A', mt: 0.5 }}>{stats.fiscalCompletes}</Typography>
            <Typography variant="caption" sx={{ color: '#38A169' }}>закрыто в ФН</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Ошибок / Предупреждений</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: stats.error > 0 ? '#E53E3E' : '#718096', mt: 0.5 }}>
              {stats.error + stats.warns}
            </Typography>
            <Typography variant="caption" sx={{ color: '#A0AEC0' }}>{stats.error} ошибок, {stats.warns} предупр.</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Среднее время чека</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#2B6CB0', mt: 0.5 }}>{stats.avgDur} мс</Typography>
            <Typography variant="caption" sx={{ color: '#A0AEC0' }}>длительность цикла</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Состояние ККТ</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#22543D', mt: 1 }}>
              Эмуляция (COM3)
            </Typography>
            <Typography variant="caption" sx={{ color: '#38A169' }}>Смена №14 открыта</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Advanced Filter Bar */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.5fr 1fr 1fr 1fr auto' }, gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            label="Поиск по сообщениям и свойствам"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Введите текст ошибки, тег 1008, номер чека..."
          />

          <FormControl size="small">
            <InputLabel>Уровень логирования</InputLabel>
            <Select value={levelFilter} label="Уровень логирования" onChange={(e) => setLevelFilter(e.target.value)}>
              <MenuItem value="all">Все уровни</MenuItem>
              <MenuItem value="Information">Information</MenuItem>
              <MenuItem value="Debug">Debug</MenuItem>
              <MenuItem value="Warning">Warning</MenuItem>
              <MenuItem value="Error">Error / Fatal</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Тип события</InputLabel>
            <Select value={eventTypeFilter} label="Тип события" onChange={(e) => setEventTypeFilter(e.target.value)}>
              <MenuItem value="all">Все события</MenuItem>
              <MenuItem value="fiscal_complete">fiscal_complete (Фискализация)</MenuItem>
              <MenuItem value="receipt_open">receipt_open (Открытие)</MenuItem>
              <MenuItem value="item_registered">item_registered (Позиция)</MenuItem>
              <MenuItem value="payment_registered">payment_registered (Оплата)</MenuItem>
              <MenuItem value="state_recovery">state_recovery (Сброс)</MenuItem>
              <MenuItem value="paper_error">paper_error (Ошибка ленты)</MenuItem>
              <MenuItem value="fn_error">fn_error (Сбой ФН)</MenuItem>
              <MenuItem value="repeat_print">repeat_print (Копия)</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Фильтр данных</InputLabel>
            <Select value={daemonFilter} label="Фильтр данных" onChange={(e) => setDaemonFilter(e.target.value)}>
              <MenuItem value="all">Все данные (Боевые + Тест)</MenuItem>
              <MenuItem value="live">Только боевые данные</MenuItem>
              <MenuItem value="test_only">Только [TEST_DAEMON]</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="medium"
            startIcon={<FilterAltOffIcon />}
            onClick={handleResetFilters}
            sx={{ borderColor: '#CBD5E1', color: '#64748B', fontWeight: 600, height: 40 }}
          >
            Сброс
          </Button>
        </Box>
      </Paper>

      {/* Main DataGrid Table (strictly follows grid-improvements skill) */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <DataGrid
          autoHeight
          showToolbar
          rows={filteredLogs}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
            sorting: { sortModel: [{ field: 'id', sort: 'desc' }] }
          }}
          getRowHeight={() => 'auto'}
          slots={{
            toolbar: () => <FiscalAuditCustomToolbar onResetFilters={handleResetFilters} />,
            footer: () => (
              <FiscalAuditCustomFooter
                totalCount={stats.total}
                infoCount={stats.info}
                errorCount={stats.error}
                avgDuration={stats.avgDur}
              />
            )
          }}
          sx={{
            width: '100%',
            border: 'none',
            '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' },
            '& .MuiDataGrid-columnHeaders': {
              position: 'sticky',
              top: 0,
              zIndex: 1,
              bgcolor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              fontWeight: 800
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'rgba(15, 60, 100, 0.02)'
            }
          }}
        />
      </Paper>

      {/* Detail Inspector Dialog */}
      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PointOfSaleIcon sx={{ color: '#0F3C64' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              Детали записи аудита #{selectedLog?.id}
            </Typography>
          </Box>
          <IconButton onClick={() => setSelectedLog(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ mt: 1 }}>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Время события:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedLog.timestamp}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Уровень:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedLog.level}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Тип события:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedLog.event_type}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Чек ID:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedLog.receipt_id ? `#${selectedLog.receipt_id}` : 'Нет'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Транзакция ID:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedLog.transaction_id ? `#${selectedLog.transaction_id}` : 'Нет'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Порт устройства:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedLog.device_port || 'COM3'}</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Сообщение:</Typography>
                <Paper sx={{ p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Typography variant="body2">{selectedLog.message}</Typography>
                </Paper>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Структурированный контекст Serilog (JSON):</Typography>
                <Paper sx={{ p: 1.5, bgcolor: '#0F172A', color: '#38BDF8', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.8rem', overflow: 'auto' }}>
                  <pre style={{ margin: 0 }}>
                    {selectedLog.properties_json ? JSON.stringify(JSON.parse(selectedLog.properties_json), null, 2) : 'Пусто'}
                  </pre>
                </Paper>
              </Box>

              {selectedLog.exception_details && (
                <Box>
                  <Typography variant="caption" sx={{ color: '#E53E3E', fontWeight: 600 }}>Исключение / Stack trace:</Typography>
                  <Paper sx={{ p: 1.5, bgcolor: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.75rem', overflow: 'auto' }}>
                    <pre style={{ margin: 0 }}>{selectedLog.exception_details}</pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedLog(null)} variant="contained" sx={{ bgcolor: '#0F3C64' }}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
