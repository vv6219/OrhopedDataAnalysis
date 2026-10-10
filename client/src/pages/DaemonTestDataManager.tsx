import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Snackbar,
  Divider
} from '@mui/material';

// Icons
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StorageIcon from '@mui/icons-material/Storage';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import LockIcon from '@mui/icons-material/Lock';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import ScienceIcon from '@mui/icons-material/Science';

import { API_BASE_URL } from '../config/apiConfig';

interface DaemonStats {
  accrualsCount: number;
  sheetsCount: number;
  proceduresCount: number;
  locksCount: number;
  schemesCount: number;
  staffCount?: number;
  patientsCount?: number;
  operationsCount?: number;
  materialsCount?: number;
  transactionsCount?: number;
  hasTestData: boolean;
}

interface TestResultItem {
  code: string;
  description: string;
  status: 'PASS' | 'FAIL';
}

export default function DaemonTestDataManager() {
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState<DaemonStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [actionLoading, setActionLoading] = useState<'seed' | 'purge' | 'run-tests' | null>(null);
  const [testResults, setTestResults] = useState<{ passed: number; failed: number; results: TestResultItem[] } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch status of daemon test data
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/daemon/status`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err: any) {
      console.error('Ошибка загрузки статистики демо-данных:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle Action Trigger (Seed / Purge / Run Tests)
  const handleAction = async (action: 'seed' | 'purge' | 'run-tests') => {
    setActionLoading(action);
    try {
      if (action === 'seed') {
        const res = await fetch(`${API_BASE_URL}/api/payouts/daemon/seed`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setSnackbar({ open: true, message: data.message, severity: 'success' });
          fetchStats();
        } else {
          setSnackbar({ open: true, message: data.error || 'Ошибка при генерации', severity: 'error' });
        }
      } else if (action === 'purge') {
        const res = await fetch(`${API_BASE_URL}/api/payouts/daemon/purge`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setSnackbar({ open: true, message: data.message, severity: 'info' });
          setTestResults(null);
          fetchStats();
        } else {
          setSnackbar({ open: true, message: data.error || 'Ошибка при удалении', severity: 'error' });
        }
      } else if (action === 'run-tests') {
        const res = await fetch(`${API_BASE_URL}/api/payouts/daemon/run-tests`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setTestResults(data);
          const msg = data.failed === 0
            ? `Все ${data.passed} проверок потока успешно пройдены [PASS]!`
            : `Тестирование завершено: ${data.passed} успешно, ${data.failed} ошибок.`;
          setSnackbar({
            open: true,
            message: msg,
            severity: data.failed === 0 ? 'success' : 'error'
          });
          fetchStats();
        } else {
          setSnackbar({ open: true, message: data.error || 'Ошибка выполнения тестов', severity: 'error' });
        }
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: 'Сетевая ошибка: ' + err.message, severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  // Check URL query param ?action=seed | purge | run-tests
  useEffect(() => {
    const actionParam = searchParams.get('action');
    if (actionParam === 'seed' || actionParam === 'purge' || actionParam === 'run-tests') {
      handleAction(actionParam);
    }
  }, [searchParams]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Title & Breadcrumbs */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: '#0F3C64',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(15, 60, 100, 0.2)'
            }}
          >
            <SmartToyIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              Управление демо-данными [TEST_DAEMON]
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Административная панель эмуляции, проверки сквозного процесса выплат и верификации расчетов
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchStats}
          disabled={loadingStats}
          sx={{ borderColor: '#CBD5E1', color: '#0F3C64', fontWeight: 600 }}
        >
          Обновить статус
        </Button>
      </Box>

      {/* Live Database Status Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2.5,
          border: '1px solid #E2E8F0',
          bgcolor: '#F8FAFC'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <StorageIcon sx={{ color: '#0F3C64' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Текущее состояние базы данных (маркер [TEST_DAEMON])
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Изолированный контур тестовых записей модуля выплат сотрудникам
              </Typography>
            </Box>
          </Box>

          {stats && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<BadgeIcon />}
                label={`Сотрудников: ${stats.staffCount || 0}`}
                color={stats.staffCount && stats.staffCount > 0 ? 'secondary' : 'default'}
                variant={stats.staffCount && stats.staffCount > 0 ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<PersonIcon />}
                label={`Пациентов: ${stats.patientsCount || 0}`}
                color={stats.patientsCount && stats.patientsCount > 0 ? 'info' : 'default'}
                variant={stats.patientsCount && stats.patientsCount > 0 ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<MedicalServicesIcon />}
                label={`Операций: ${stats.operationsCount || 0}`}
                color={stats.operationsCount && stats.operationsCount > 0 ? 'info' : 'default'}
                variant={stats.operationsCount && stats.operationsCount > 0 ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<ScienceIcon />}
                label={`Материалов: ${stats.materialsCount || 0}`}
                color={stats.materialsCount && stats.materialsCount > 0 ? 'info' : 'default'}
                variant={stats.materialsCount && stats.materialsCount > 0 ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<ReceiptLongIcon />}
                label={`Начислений: ${stats.accrualsCount}`}
                color={stats.accrualsCount > 0 ? 'primary' : 'default'}
                variant={stats.accrualsCount > 0 ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={`Сервисов: ${stats.proceduresCount}`}
                color={stats.proceduresCount > 0 ? 'primary' : 'default'}
                variant={stats.proceduresCount > 0 ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={`Ведомостей: ${stats.sheetsCount}`}
                color={stats.sheetsCount > 0 ? 'success' : 'default'}
                variant={stats.sheetsCount > 0 ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<LockIcon />}
                label={`Soft-Locks: ${stats.locksCount}`}
                color={stats.locksCount > 0 ? 'warning' : 'default'}
                variant={stats.locksCount > 0 ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          )}
        </Box>
      </Paper>

      {/* 3 Main Action Cards: Add / Remove / Run */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Card 1: Add / Seed */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              borderRadius: 3,
              borderColor: '#BBF7D0',
              bgcolor: '#F0FDF4',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              '&:hover': { boxShadow: '0 6px 20px rgba(34, 197, 94, 0.15)', transform: 'translateY(-2px)' }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: '#16A34A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AddCircleIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#166534' }}>
                  1. Заполнить демо-данные
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#374151', mb: 2, lineHeight: 1.6 }}>
                Генерирует тестовый набор начислений за 3 месяца:
                архивный Август (paid), утвержденный Сентябрь (approved) с PRP-терапией и сторно-парой,
                и открытый Октябрь (draft) с мягкой блокировкой.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: '#FFFFFF', p: 1.5, borderRadius: 2, border: '1px solid #DCFCE7' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#166534' }}>
                  • 3 сотрудника Staff (врачи, медсестра) и 3 пациента Patients
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#166534' }}>
                  • 4 сервиса и 4 набора Materials с нормативами
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#166534' }}>
                  • 22 сервиса в 3 ведомостях, 4 нерассчитанных сервиса в очереди
                </Typography>
              </Box>
            </CardContent>

            <Box sx={{ p: 2, pt: 0 }}>
              <Button
                variant="contained"
                fullWidth
                color="success"
                startIcon={actionLoading === 'seed' ? <CircularProgress size={18} color="inherit" /> : <AddCircleIcon />}
                onClick={() => handleAction('seed')}
                disabled={actionLoading !== null}
                sx={{
                  py: 1.2,
                  fontWeight: 700,
                  bgcolor: '#16A34A',
                  '&:hover': { bgcolor: '#15803D' }
                }}
              >
                {actionLoading === 'seed' ? 'Генерация...' : 'Заполнить БД (Seed)'}
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Card 2: Remove / Purge */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              borderRadius: 3,
              borderColor: '#FECACA',
              bgcolor: '#FEF2F2',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              '&:hover': { boxShadow: '0 6px 20px rgba(239, 68, 68, 0.15)', transform: 'translateY(-2px)' }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: '#DC2626',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <DeleteForeverIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#991B1B' }}>
                  2. Удалить демо-данные
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#374151', mb: 2, lineHeight: 1.6 }}>
                Мгновенное удаление всех записей с маркером [TEST_DAEMON] из всех таблиц модуля.
                Гарантирует полную изоляцию и чистоту реальных медицинских и финансовых данных клиники.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: '#FFFFFF', p: 1.5, borderRadius: 2, border: '1px solid #FEE2E2' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#991B1B' }}>
                  • Удаляет только данные с маркером [TEST_DAEMON]
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#991B1B' }}>
                  • Защита рабочих данных: реальные пациенты, приемы, сервисы, материалы и сотрудники клиники не затрагиваются
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#991B1B' }}>
                  • Освобождает все блокировки и полностью очищает тестовый контур
                </Typography>
              </Box>
            </CardContent>

            <Box sx={{ p: 2, pt: 0 }}>
              <Button
                variant="contained"
                fullWidth
                color="error"
                startIcon={actionLoading === 'purge' ? <CircularProgress size={18} color="inherit" /> : <DeleteForeverIcon />}
                onClick={() => handleAction('purge')}
                disabled={actionLoading !== null || !stats?.hasTestData}
                sx={{
                  py: 1.2,
                  fontWeight: 700,
                  bgcolor: '#DC2626',
                  '&:hover': { bgcolor: '#B91C1C' }
                }}
              >
                {actionLoading === 'purge' ? 'Очистка...' : 'Очистить демо-данные (Purge)'}
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Card 3: Run Flow Tests */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              borderRadius: 3,
              borderColor: '#BFDBFE',
              bgcolor: '#EFF6FF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              '&:hover': { boxShadow: '0 6px 20px rgba(59, 130, 246, 0.15)', transform: 'translateY(-2px)' }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: '#2563EB',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PlayCircleFilledWhiteIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E40AF' }}>
                  3. Запуск тестов потока
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#374151', mb: 2, lineHeight: 1.6 }}>
                Запускает программу автоматизированного тестирования FL-01 — FL-14:
                проверка выборки, захвата мягкой блокировки, формул наценки 1.15, фикс-минимумов,
                ACID коммита, дедупликации и финансовой сходимости в BI.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: '#FFFFFF', p: 1.5, borderRadius: 2, border: '1px solid #DBEAFE' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#1E40AF' }}>
                  • 27 автоматизированных проверок
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#1E40AF' }}>
                  • Сквозная верификация формул и БД
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#1E40AF' }}>
                  • Детализированный отчет [PASS / FAIL]
                </Typography>
              </Box>
            </CardContent>

            <Box sx={{ p: 2, pt: 0 }}>
              <Button
                variant="contained"
                fullWidth
                color="primary"
                startIcon={actionLoading === 'run-tests' ? <CircularProgress size={18} color="inherit" /> : <PlayCircleFilledWhiteIcon />}
                onClick={() => handleAction('run-tests')}
                disabled={actionLoading !== null}
                sx={{
                  py: 1.2,
                  fontWeight: 700,
                  bgcolor: '#2563EB',
                  '&:hover': { bgcolor: '#1D4ED8' }
                }}
              >
                {actionLoading === 'run-tests' ? 'Тестирование...' : 'Запустить тесты (Run Tests)'}
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Test Results Section (If Run) */}
      {testResults && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Результаты сквозного тестирования потока (FL-01 — FL-14)
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Сводный протокол автоматизированной валидации бизнес-логики и формул
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                icon={<CheckCircleIcon />}
                label={`Успешно: ${testResults.passed}`}
                color="success"
                sx={{ fontWeight: 700 }}
              />
              {testResults.failed > 0 && (
                <Chip
                  icon={<CancelIcon />}
                  label={`Ошибок: ${testResults.failed}`}
                  color="error"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Box>
          </Box>

          <Alert
            severity={testResults.failed === 0 ? 'success' : 'error'}
            sx={{ mb: 2.5, fontWeight: 600 }}
          >
            {testResults.failed === 0
              ? `Все ${testResults.passed} проверок потока выполнены успешно! Процессы корректно определены, расчеты полностью сходятся.`
              : `Обнаружены сбои (${testResults.failed} проверок не прошли). Требуется анализ.`}
          </Alert>

          <Divider sx={{ mb: 2 }} />

          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, width: 100 }}>Код</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Описание проверки</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 120, textAlign: 'center' }}>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {testResults.results.map((item, idx) => (
                <TableRow
                  key={idx}
                  hover
                  sx={{
                    bgcolor: item.status === 'PASS' ? 'inherit' : 'rgba(239, 68, 68, 0.05)'
                  }}
                >
                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>
                    {item.code}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>
                    {item.description}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip
                      size="small"
                      label={item.status}
                      color={item.status === 'PASS' ? 'success' : 'error'}
                      sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
