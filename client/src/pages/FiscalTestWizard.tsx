import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, CircularProgress, Alert, Chip,
  Divider, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, IconButton, Collapse
} from '@mui/material';
import { API_BASE_URL } from '../config/apiConfig';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

export default function FiscalTestWizard() {
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<any | null>(null);
  const [wizardResults, setWizardResults] = useState<any | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fiscal/test-data/status`);
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err: any) {
      console.error('Error fetching fiscal test status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check URL search params for auto-action
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'seed') {
      handleCreateData();
    } else if (action === 'purge') {
      handleRemoveData();
    } else if (action === 'run-test') {
      handleRunWizard();
    }
  }, []);

  const handleCreateData = async () => {
    setLoading(true);
    setAlertInfo(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fiscal/test-data/create`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAlertInfo({ type: 'success', message: data.message });
        await fetchStatus();
      } else {
        setAlertInfo({ type: 'error', message: data.error || 'Ошибка при генерации данных' });
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveData = async () => {
    setLoading(true);
    setAlertInfo(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fiscal/test-data/remove`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAlertInfo({ type: 'info', message: data.message });
        setWizardResults(null);
        await fetchStatus();
      } else {
        setAlertInfo({ type: 'error', message: data.error || 'Ошибка при удалении данных' });
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRunWizard = async () => {
    setLoading(true);
    setAlertInfo(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fiscal/test-data/run-wizard`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setWizardResults(data);
        setAlertInfo({
          type: data.success ? 'success' : 'error',
          message: `Тестовый мастер завершен: ${data.passedCount} из ${data.totalTests} проверок успешно пройдены за ${data.totalDurationMs} мс`
        });
        await fetchStatus();
      } else {
        setAlertInfo({ type: 'error', message: data.error || 'Ошибка при выполнении мастера' });
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = (format: 'json' | 'csv') => {
    window.open(`${API_BASE_URL}/api/fiscal/test-data/export?format=${format}`, '_blank');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: { xs: 1, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PointOfSaleIcon sx={{ fontSize: 36, color: '#0F3C64' }} />
            Мастер тестов ККТ «АТОЛ 91Ф» [TEST_DAEMON]
          </Typography>
          <Typography variant="body1" sx={{ color: '#718096', mt: 0.5 }}>
            Автономный контур верификации фискализации, эмуляции сбоев ленты и сквозного аудита Serilog по 54-ФЗ
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Обновить статус">
            <IconButton onClick={fetchStatus} sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alert Notification */}
      {alertInfo && (
        <Alert severity={alertInfo.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setAlertInfo(null)}>
          {alertInfo.message}
        </Alert>
      )}

      {/* KPI Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FFFFFF' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>
              Тестовых чеков в БД
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', mt: 0.5 }}>
              {statusData?.testReceiptsCount || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#A0AEC0' }}>
              с маркером [TEST_DAEMON]
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FFFFFF' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>
              Записей аудита Serilog
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#2B6CB0', mt: 0.5 }}>
              {statusData?.testAuditLogsCount || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#A0AEC0' }}>
              в таблице fiscal_audit_logs
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FFFFFF' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>
              Режим фискального ядра
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#2F855A', mt: 1 }}>
              Эмуляция (Mock)
            </Typography>
            <Typography variant="caption" sx={{ color: '#38A169' }}>
              🟢 COM3 • Готова к тестам
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FFFFFF' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>
              Статус последнего теста
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: wizardResults?.success ? '#22543D' : '#718096', mt: 1 }}>
              {wizardResults ? `${wizardResults.passedCount}/${wizardResults.totalTests} пройдено` : 'Готов к запуску'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#A0AEC0' }}>
              {wizardResults ? `Время: ${wizardResults.totalDurationMs} мс` : '5 сквозных сценариев'}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Action Buttons Toolbar */}
      <Paper sx={{ p: 2.5, mb: 4, borderRadius: 3, border: '1px solid #E2E8F0', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PlayCircleFilledWhiteIcon />}
          onClick={handleRunWizard}
          disabled={loading}
          sx={{ bgcolor: '#0F3C64', px: 3, py: 1.2, fontWeight: 700 }}
        >
          Запустить мастер тестирования (5 тестов)
        </Button>

        <Button
          variant="contained"
          startIcon={<AddCircleIcon />}
          onClick={handleCreateData}
          disabled={loading}
          sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, px: 2.5, py: 1.2, fontWeight: 700 }}
        >
          Создать тестовые данные [TEST_DAEMON]
        </Button>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteForeverIcon />}
          onClick={handleRemoveData}
          disabled={loading}
          sx={{ px: 2.5, py: 1.2, fontWeight: 700 }}
        >
          Удалить тестовые данные [TEST_DAEMON]
        </Button>

        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportData('json')}
            sx={{ borderColor: '#CBD5E1', color: '#4A5568', textTransform: 'none', fontWeight: 600 }}
          >
            Экспорт JSON
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportData('csv')}
            sx={{ borderColor: '#CBD5E1', color: '#4A5568', textTransform: 'none', fontWeight: 600 }}
          >
            Экспорт CSV
          </Button>
        </Box>
      </Paper>

      {/* Test Scenarios Stepper / Cards */}
      {wizardResults && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #C6F6D5', bgcolor: '#F0FFF4' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon sx={{ color: '#276749', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#22543D' }}>
                Результаты выполнения мастера тестирования
              </Typography>
            </Box>
            <Chip
              label={`${wizardResults.passedCount} из ${wizardResults.totalTests} успешно`}
              color="success"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
            {wizardResults.scenarios.map((s: any) => {
              const isExp = expandedScenario === s.code;
              return (
                <Paper
                  key={s.code}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: s.status === 'passed' ? '1px solid #9AE6B4' : '1px solid #FEB2B2',
                    bgcolor: '#FFFFFF'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedScenario(isExp ? null : s.code)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {s.status === 'passed' ? (
                        <CheckCircleIcon sx={{ color: '#38A169', fontSize: 20 }} />
                      ) : (
                        <ErrorIcon sx={{ color: '#E53E3E', fontSize: 20 }} />
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                          {s.code}: {s.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#718096' }}>
                          {s.description}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Chip
                        size="small"
                        label={`${s.durationMs} мс`}
                        sx={{ bgcolor: '#EDF2F7', fontWeight: 600, fontSize: '0.75rem' }}
                      />
                      <Chip
                        size="small"
                        label={s.status === 'passed' ? 'Пройден' : 'Ошибка'}
                        color={s.status === 'passed' ? 'success' : 'error'}
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      />
                      {isExp ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </Box>
                  </Box>

                  <Collapse in={isExp}>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #EDF2F7', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      <pre style={{ margin: 0 }}>{JSON.stringify(s.details || s.errorMessage, null, 2)}</pre>
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* Recent [TEST_DAEMON] Receipts Table */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptLongIcon />
          Фискальные чеки [TEST_DAEMON] в базе данных ({statusData?.recentTestReceipts?.length || 0})
        </Typography>

        {(!statusData?.recentTestReceipts || statusData.recentTestReceipts.length === 0) ? (
          <Box sx={{ p: 4, textAlign: 'center', color: '#718096' }}>
            <Typography variant="body2">Тестовые данные [TEST_DAEMON] отсутствуют в базе данных.</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddCircleIcon />}
              onClick={handleCreateData}
              sx={{ mt: 1.5, fontWeight: 700 }}
            >
              Создать набор тестовых данных
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Тег 1008 (Контакт)</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Оплата</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64', textAlign: 'right' }}>Сумма (₽)</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Номер ФД</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>ФПД</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Смена / Чек</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Статус</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Дата</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statusData.recentTestReceipts.map((r: any) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>#{r.id}</TableCell>
                    <TableCell sx={{ maxWidth: 220, wordBreak: 'break-all' }}>{r.patient_contact}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          r.payment_type === 'card' ? 'Карта' :
                          r.payment_type === 'cash' ? 'Наличные' :
                          r.payment_type === 'sbp' ? 'СБП' : 'Безнал'
                        }
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>
                      ₽{Number(r.total_amount).toLocaleString('ru-RU')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>
                      {r.fiscal_document_number ? `№${r.fiscal_document_number}` : '—'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {r.fiscal_sign || '—'}
                    </TableCell>
                    <TableCell>
                      #{r.shift_number || 14} / #{r.receipt_number || 1}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          r.status === 'fiscalized' ? '🟢 В ФН' :
                          r.status === 'paper_error' ? '⚠️ Бумага' : r.status
                        }
                        color={
                          r.status === 'fiscalized' ? 'success' :
                          r.status === 'paper_error' ? 'warning' : 'default'
                        }
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: '#718096' }}>
                      {r.created_at}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
