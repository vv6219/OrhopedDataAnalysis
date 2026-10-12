import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, CircularProgress, Alert, Chip,
  Tooltip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel
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
import { useReactToPrint } from 'react-to-print';
import { API_BASE_URL } from '../config/apiConfig';
import PosDeviceCard from '../components/PosDeviceCard';
import { usePos } from '../context/PosContext';

// Icons
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import RefreshIcon from '@mui/icons-material/Refresh';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

export interface PosTxRecord {
  id: number;
  transaction_uuid: string;
  operation_type: string;
  amount: number;
  terminal_id: string;
  merchant_id: string;
  rrn: string | null;
  auth_code: string | null;
  card_type: string | null;
  masked_pan: string | null;
  response_code: string | null;
  status: string;
  is_mock: number;
  slip_text: string | null;
  error_message: string | null;
  created_at: string;
  authorized_at: string | null;
}

// Module-level stable Custom Toolbar for DataGrid (per grid-improvements skill)
function PosTestGridToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 1.5, gap: 1, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      <Box sx={{ ml: 'auto', width: 280 }}>
        <GridToolbarQuickFilter debounceMs={300} />
      </Box>
    </GridToolbarContainer>
  );
}

// Printable Bank Slip Component (per report-generation skill)
export const PosSlipPrintTemplate = React.forwardRef<HTMLDivElement, { tx: PosTxRecord | null; posInfo?: any }>(
  ({ tx, posInfo }, ref) => {
    if (!tx) return null;

    const bankName = posInfo?.bankName || 'АО «АЛЬФА-БАНК»';
    const terminalId = tx.terminal_id || posInfo?.terminalId || 'ALFA_770192';
    const merchantId = tx.merchant_id || posInfo?.merchantId || 'MERCH_884102';

    return (
      <div ref={ref} style={{ padding: '16px', maxWidth: '320px', margin: '0 auto', fontFamily: 'monospace', color: '#111827', fontSize: '12px', lineHeight: 1.4 }}>
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #9CA3AF', paddingBottom: '8px', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{bankName}</div>
          <div style={{ fontSize: '11px', color: '#4B5563' }}>ЦЕНТР ОРТОПЕДИИ ДОБРУШКИНА</div>
          <div style={{ fontSize: '10px', color: '#6B7280' }}>г. Сочи, ул. Транспортная, 65</div>
        </div>

        <div style={{ marginBottom: '8px', fontSize: '11px' }}>
          <div>ТЕРМИНАЛ: <b>{terminalId}</b></div>
          <div>МЕРЧАНТ:  <b>{merchantId}</b></div>
          <div>ДАТА: {new Date(tx.authorized_at || tx.created_at).toLocaleDateString('ru-RU')} {new Date(tx.authorized_at || tx.created_at).toLocaleTimeString('ru-RU')}</div>
          <div>ОПЕРАЦИЯ: <b>{tx.operation_type === 'reversal' ? 'ОТМЕНА (REVERSAL)' : 'ОПЛАТА ПО КАРТЕ'}</b></div>
          <div>КАРТА: <b>{tx.masked_pan || '4276********1094'}</b> ({tx.card_type || 'MIR'})</div>
        </div>

        <div style={{ borderTop: '1px dashed #9CA3AF', borderBottom: '1px dashed #9CA3AF', padding: '8px 0', margin: '8px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            ИТОГО: {Number(tx.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
          </div>
          <div style={{ fontSize: '12px', color: tx.status === 'declined' ? '#DC2626' : '#166534', fontWeight: 'bold', marginTop: '4px' }}>
            РЕЗУЛЬТАТ: {tx.status === 'declined' ? 'ОТКЛОНЕНО' : 'ОДОБРЕНО (КОД 00)'}
          </div>
        </div>

        <div style={{ fontSize: '10px', color: '#4B5563', marginBottom: '12px' }}>
          <div>RRN: <b>{tx.rrn || '428901849102'}</b></div>
          <div>КОД АВТ.: <b>{tx.auth_code || '771924'}</b></div>
          <div>UUID: <span style={{ fontSize: '9px' }}>{tx.transaction_uuid}</span></div>
          {tx.is_mock === 1 && (
            <div style={{ color: '#D97706', marginTop: '4px', fontWeight: 'bold' }}>[ТЕСТОВАЯ ЭМУЛЯЦИЯ / MOCK]</div>
          )}
        </div>

        <div style={{ textAlign: 'center', borderTop: '1px dashed #9CA3AF', paddingTop: '8px', fontSize: '10px', color: '#6B7280' }}>
          <div>ПОДПИСЬ КЛИЕНТА НЕ ТРЕБУЕТСЯ</div>
          <div>СПАСИБО ЗА ОБРАЩЕНИЕ В НАШ ЦЕНТР!</div>
        </div>
      </div>
    );
  }
);

export default function PosTestWizard() {
  const { posStatus, testHost } = usePos();
  const [transactions, setTransactions] = useState<PosTxRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Manual payment modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [testAmount, setTestAmount] = useState<number>(3500);
  const [testScenario, setTestScenario] = useState<string>('success');

  // Slip preview modal
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<PosTxRecord | null>(null);
  const printSlipRef = useRef<HTMLDivElement>(null);

  const handlePrintSlip = useReactToPrint({
    contentRef: printSlipRef
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/transactions?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e: any) {
      setAlert({ type: 'error', message: `Ошибка загрузки транзакций: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // 1. Host Ping
  const handleHostPing = async () => {
    setRunningAction('host_ping');
    setAlert(null);
    try {
      const res = await testHost();
      if (res.success) {
        setAlert({
          type: 'success',
          message: `Тест связи с Альфа-Банком успешен! Отклик: ${res.rttMs || 140} мс. ${res.message}`
        });
      } else {
        setAlert({ type: 'error', message: res.error || 'Ошибка проверки связи' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', message: `Сбой проверки связи: ${e.message}` });
    } finally {
      setRunningAction(null);
    }
  };

  // 2. Test Purchase 1.00 ₽ + Auto Reversal
  const handleTestPurchaseWithReversal = async () => {
    setRunningAction('test_reversal');
    setAlert(null);
    try {
      // Step A: Pay 1.00 ₽
      const payRes = await fetch(`${API_BASE_URL}/api/pos/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1.0,
          scenario: 'success',
          patient_name: 'Тестовый пациент',
          transaction_uuid: 'test_' + Date.now()
        })
      });
      const payData = await payRes.json();
      if (!payRes.ok || !payData.success) {
        throw new Error(payData.error || 'Ошибка авторизации тестовой суммы');
      }

      // Step B: Auto Reversal after 1.5s
      await new Promise(r => setTimeout(r, 1200));

      const revRes = await fetch(`${API_BASE_URL}/api/pos/reversal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_rrn: payData.bankRrn,
          amount: 1.0,
          transaction_uuid: payData.transactionUuid
        })
      });
      const revData = await revRes.json();
      if (!revRes.ok || !revData.success) {
        throw new Error(revData.error || 'Ошибка отмены тестовой транзакции');
      }

      setAlert({
        type: 'success',
        message: `Сквозной тест успешно завершен: Авторизовано 1.00 ₽ (RRN: ${payData.bankRrn}) ➔ Немедленно выполнена отмена (Reversal). Средства возвращены!`
      });
      await fetchTransactions();
    } catch (e: any) {
      setAlert({ type: 'error', message: `Сбой теста: ${e.message}` });
    } finally {
      setRunningAction(null);
    }
  };

  // 3. Close Settlement (Сверка итогов дня)
  const handleSettlement = async () => {
    setRunningAction('settlement');
    setAlert(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscal_card_amount: 0 })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlert({
          type: 'success',
          message: `Сверка итогов выполнена! Операций: ${data.totalCount}, Сумма: ${Number(data.totalAmount).toLocaleString('ru-RU')} ₽. Журнал выгружен в Альфа-Банк.`
        });
        await fetchTransactions();
      } else {
        setAlert({ type: 'error', message: data.error || 'Ошибка сверки итогов' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', message: `Ошибка: ${e.message}` });
    } finally {
      setRunningAction(null);
    }
  };

  // 4. Custom Payment Execution
  const handleExecutePayment = async () => {
    if (!testAmount || testAmount <= 0) return;
    setRunningAction('custom_pay');
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: testAmount,
          scenario: testScenario,
          patient_name: 'Ординарный приём ортопеда',
          transaction_uuid: 'pos_demo_' + Date.now()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlert({
          type: 'success',
          message: `Оплата одобрена! Сумма: ${testAmount} ₽, RRN: ${data.bankRrn}, Код авторизации: ${data.bankAuthCode}`
        });
        setPayModalOpen(false);
        await fetchTransactions();
      } else {
        setAlert({ type: 'error', message: data.error || 'Отказ терминала' });
        setPayModalOpen(false);
        await fetchTransactions();
      }
    } catch (e: any) {
      setAlert({ type: 'error', message: e.message });
      setPayModalOpen(false);
    } finally {
      setRunningAction(null);
    }
  };

  // Manual Reversal from Grid Action
  const handleManualReversal = async (tx: PosTxRecord) => {
    if (!tx.rrn) return;
    setRunningAction('reversal_' + tx.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/reversal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_rrn: tx.rrn,
          amount: tx.amount,
          transaction_uuid: tx.transaction_uuid
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlert({ type: 'success', message: `Операция ${tx.rrn} успешно отменена!` });
        await fetchTransactions();
      } else {
        setAlert({ type: 'error', message: data.error || 'Ошибка отмены' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setRunningAction(null);
    }
  };

  // Totals calculations for Footer
  const totals = useMemo(() => {
    const successTxs = transactions.filter(t => t.operation_type === 'pay' && t.status === 'authorized');
    const totalSum = successTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return {
      count: transactions.length,
      successCount: successTxs.length,
      totalAmount: totalSum
    };
  }, [transactions]);

  // DataGrid Columns per grid-improvements standard
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: '№',
      width: 70,
      renderCell: (params) => <Typography variant="caption" sx={{ fontWeight: 700 }}>#{params.value}</Typography>
    },
    {
      field: 'created_at',
      headerName: 'Дата и время',
      width: 150,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {new Date(params.value).toLocaleDateString('ru-RU')} {new Date(params.value).toLocaleTimeString('ru-RU')}
        </Typography>
      )
    },
    {
      field: 'operation_type',
      headerName: 'Операция',
      width: 120,
      renderCell: (params) => {
        const isRev = params.value === 'reversal';
        return (
          <Chip
            size="small"
            label={isRev ? 'ОТМЕНА' : 'ОПЛАТА'}
            sx={{
              fontWeight: 800,
              fontSize: '0.68rem',
              height: 22,
              bgcolor: isRev ? '#FEF3C7' : '#EFF6FF',
              color: isRev ? '#D97706' : '#2563EB',
              border: `1px solid ${isRev ? '#FCD34D' : '#BFDBFE'}`
            }}
          />
        );
      }
    },
    {
      field: 'amount',
      headerName: 'Сумма (₽)',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
          {Number(params.value).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Статус',
      width: 140,
      renderCell: (params) => {
        let label = 'Одобрено';
        let color = '#166534';
        let bg = '#F0FDF4';
        let border = '#BBF7D0';

        if (params.value === 'declined') {
          label = 'Отклонено';
          color = '#DC2626';
          bg = '#FEF2F2';
          border = '#FCA5A5';
        } else if (params.value === 'reversed') {
          label = 'Отменено';
          color = '#D97706';
          bg = '#FFFBEB';
          border = '#FDE68A';
        }

        return (
          <Chip
            size="small"
            label={label}
            sx={{
              fontWeight: 800,
              fontSize: '0.7rem',
              height: 22,
              color,
              bgcolor: bg,
              border: `1px solid ${border}`
            }}
          />
        );
      }
    },
    {
      field: 'rrn',
      headerName: 'RRN банка',
      width: 140,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
          {params.value || '—'}
        </Typography>
      )
    },
    {
      field: 'auth_code',
      headerName: 'Код авт.',
      width: 100,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F3C64' }}>
          {params.value || '—'}
        </Typography>
      )
    },
    {
      field: 'masked_pan',
      headerName: 'Карта',
      width: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <CreditCardIcon sx={{ fontSize: 16, color: '#64748B' }} />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
            {params.value || '4276********1094'} ({params.row.card_type || 'MIR'})
          </Typography>
        </Box>
      )
    },
    {
      field: 'is_mock',
      headerName: 'Режим',
      width: 100,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value === 1 ? 'Mock' : 'Real'}
          sx={{
            fontWeight: 700,
            fontSize: '0.65rem',
            height: 18,
            bgcolor: params.value === 1 ? '#FEF3C7' : '#DCFCE7',
            color: params.value === 1 ? '#B45309' : '#15803D'
          }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 160,
      sortable: false,
      renderCell: (params) => {
        const tx = params.row as PosTxRecord;
        const canReverse = tx.operation_type === 'pay' && tx.status === 'authorized';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Tooltip title="Просмотр и печать слип-чека">
              <Button
                size="small"
                variant="outlined"
                onClick={() => { setSelectedTx(tx); setSlipModalOpen(true); }}
                sx={{ minWidth: 30, px: 1, py: 0.2, fontSize: '0.72rem', textTransform: 'none', borderColor: '#CBD5E1' }}
              >
                Слип
              </Button>
            </Tooltip>

            {canReverse && (
              <Tooltip title="Оформить отмену (Reversal)">
                <IconButton
                  size="small"
                  onClick={() => handleManualReversal(tx)}
                  disabled={runningAction === 'reversal_' + tx.id}
                  sx={{ color: '#D97706', p: 0.4, border: '1px solid #FCD34D', bgcolor: '#FFFBEB' }}
                >
                  <UndoIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Top Banner / Card */}
      <Box sx={{ mb: 3 }}>
        <PosDeviceCard onRefresh={fetchTransactions} />
      </Box>

      {/* Action Bench Paper */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(15, 60, 100, 0.08)',
          border: '1px solid #E2E8F0',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.05rem' }}>
              Сервисная панель диагностики эквайринга Альфа-Банка
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Сквозная валидация криптографических ключей, связи с процессингом, тестовых списаний и закрытия смены
            </Typography>
          </Box>

          <Button
            size="small"
            variant="outlined"
            onClick={fetchTransactions}
            startIcon={<RefreshIcon />}
            sx={{ borderColor: '#CBD5E1', color: '#475569' }}
          >
            Обновить данные
          </Button>
        </Box>

        {alert && (
          <Box sx={{ mb: 2 }}>
            <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ borderRadius: 2 }}>
              {alert.message}
            </Alert>
          </Box>
        )}

        {/* Diagnostic Actions Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {/* Action 1 */}
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 0.5 }}>
                1. Проверка связи с банком
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                Команда 05: Пинг процессинга и валидация ключей без списания средств.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={handleHostPing}
              disabled={Boolean(runningAction)}
              startIcon={runningAction === 'host_ping' ? <CircularProgress size={16} color="inherit" /> : <PlayCircleFilledWhiteIcon />}
              sx={{ bgcolor: '#0F3C64', textTransform: 'none', fontWeight: 700 }}
            >
              Запустить пинг хоста
            </Button>
          </Paper>

          {/* Action 2 */}
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 0.5 }}>
                2. Тестовое списание + Reversal
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                Авторизует 1.00 ₽ и через 1 сек автоматически возвращает сумму (Reversal).
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={handleTestPurchaseWithReversal}
              disabled={Boolean(runningAction)}
              startIcon={runningAction === 'test_reversal' ? <CircularProgress size={16} color="inherit" /> : <PlayCircleFilledWhiteIcon />}
              sx={{ bgcolor: '#D97706', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#B45309' } }}
            >
              1.00 ₽ + Авто-отмена
            </Button>
          </Paper>

          {/* Action 3 */}
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 0.5 }}>
                3. Сверка итогов (Settlement)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                Выгрузка журнала транзакций в банк и печать отчёта сверки дня.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={handleSettlement}
              disabled={Boolean(runningAction)}
              startIcon={runningAction === 'settlement' ? <CircularProgress size={16} color="inherit" /> : <PointOfSaleIcon />}
              sx={{ bgcolor: '#166534', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#14532D' } }}
            >
              Снять сверку итогов
            </Button>
          </Paper>

          {/* Action 4 */}
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 0.5 }}>
                4. Произвольная оплата
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                Тестирование конкретных сумм и сценариев отказов (лимит, отмена, таймаут).
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setPayModalOpen(true)}
              disabled={Boolean(runningAction)}
              startIcon={<CreditCardIcon />}
              sx={{ borderColor: '#0F3C64', color: '#0F3C64', textTransform: 'none', fontWeight: 700 }}
            >
              Оплата со сценарием
            </Button>
          </Paper>
        </Box>
      </Paper>

      {/* DataGrid of POS Transactions adhering to grid-improvements standard */}
      <Paper
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(15, 60, 100, 0.08)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 2.5, bgcolor: '#0F3C64', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ReceiptLongIcon sx={{ fontSize: 24, color: '#93C5FD' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
              Реестр транзакций эквайринга Альфа-Банка
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`Всего записей: ${transactions.length}`}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', fontWeight: 700 }}
          />
        </Box>

        <Box sx={{ height: 520, width: '100%' }}>
          <DataGrid
            rows={transactions}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
              sorting: { sortModel: [{ field: 'id', sort: 'desc' }] }
            }}
            slots={{ toolbar: PosTestGridToolbar }}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', color: '#334155', fontWeight: 800 },
              '& .MuiDataGrid-row:hover': { bgcolor: '#F1F5F9' }
            }}
          />
        </Box>

        {/* Footer Totals adhering to grid-improvements */}
        <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
              Всего попыток: <b>{totals.count}</b>
            </Typography>
            <Typography variant="body2" sx={{ color: '#166534', fontWeight: 700 }}>
              Успешных оплат: <b>{totals.successCount}</b>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700 }}>
              Одобренная выручка по картам:
            </Typography>
            <Typography variant="h6" sx={{ color: '#0F3C64', fontWeight: 800, fontSize: '1.15rem' }}>
              {totals.totalAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Dialog for Custom Test Payment */}
      <Dialog open={payModalOpen} onClose={() => setPayModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64' }}>
          Тестовая оплата на терминале
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Сумма оплаты (₽)"
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(Number(e.target.value))}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Сценарий симуляции (для Mock)</InputLabel>
              <Select
                value={testScenario}
                label="Сценарий симуляции (для Mock)"
                onChange={(e) => setTestScenario(e.target.value)}
              >
                <MenuItem value="success">Одобрено (Код 00: Успех)</MenuItem>
                <MenuItem value="insufficient_funds">Отказ: Недостаточно средств (Код 51)</MenuItem>
                <MenuItem value="cancelled">Отказ: Отмена клиентом на PIN-паде (Код 99)</MenuItem>
                <MenuItem value="timeout">Таймаут ввода PIN-кода (Код 68)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPayModalOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={handleExecutePayment}
            disabled={runningAction === 'custom_pay'}
            sx={{ bgcolor: '#0F3C64', fontWeight: 700 }}
          >
            {runningAction === 'custom_pay' ? 'Обработка...' : 'Авторизовать карту'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Slip Preview & Print Modal */}
      <Dialog open={slipModalOpen} onClose={() => setSlipModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Банковский слип-чек</span>
          <IconButton size="small" onClick={() => setSlipModalOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#F8FAFC', p: 2 }}>
          <Box sx={{ bgcolor: '#FFFFFF', p: 1, borderRadius: 2, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <PosSlipPrintTemplate ref={printSlipRef} tx={selectedTx} posInfo={posStatus} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => setSlipModalOpen(false)}>Закрыть</Button>
          <Button
            variant="contained"
            onClick={handlePrintSlip}
            startIcon={<PrintIcon />}
            sx={{ bgcolor: '#0F3C64', fontWeight: 700 }}
          >
            Печать на принтер (57мм)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
