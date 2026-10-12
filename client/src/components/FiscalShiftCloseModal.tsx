import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CalculateIcon from '@mui/icons-material/Calculate';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useReactToPrint } from 'react-to-print';
import { FiscalZReportPrintTemplate } from './FiscalZReportPrintTemplate';
import { API_BASE_URL } from '../config/apiConfig';

interface FiscalShiftCloseModalProps {
  open: boolean;
  onClose: () => void;
  onShiftClosed?: () => void;
}

export default function FiscalShiftCloseModal({ open, onClose, onShiftClosed }: FiscalShiftCloseModalProps) {
  const [loading, setLoading] = useState(false);
  const [currentShiftData, setCurrentShiftData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [settleBankAcquiring, setSettleBankAcquiring] = useState(true);

  // Denominations for interactive cash calculator
  const [calcOpen, setCalcOpen] = useState(false);
  const [denominations, setDenominations] = useState<{ [key: string]: number }>({
    '5000': 0,
    '2000': 0,
    '1000': 0,
    '500': 0,
    '200': 0,
    '100': 0,
    'coins': 0
  });

  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [closedResult, setClosedResult] = useState<any | null>(null);

  // Print ref
  const printComponentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `Z_Report_${closedResult?.mnemonicCode || 'Shift'}`
  });

  // Load current shift when modal opens
  useEffect(() => {
    if (open) {
      loadCurrentShift();
      setClosedResult(null);
      setError(null);
      setNotes('');
    }
  }, [open]);

  const loadCurrentShift = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fiscal/shifts/current');
      const data = await res.json();
      if (!data.isOpen || !data.currentShift) {
        setError('Нет активной открытой кассовой смены для закрытия.');
      } else {
        setCurrentShiftData(data.currentShift);
        setActualCashInput(String(data.currentShift.expected_cash || 0));
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки статуса смены');
    } finally {
      setLoading(false);
    }
  };

  // Calculate sum from denominations
  const calculateTotalFromDenominations = (newDenoms: { [key: string]: number }) => {
    let total = 0;
    total += (newDenoms['5000'] || 0) * 5000;
    total += (newDenoms['2000'] || 0) * 2000;
    total += (newDenoms['1000'] || 0) * 1000;
    total += (newDenoms['500'] || 0) * 500;
    total += (newDenoms['200'] || 0) * 200;
    total += (newDenoms['100'] || 0) * 100;
    total += (newDenoms['coins'] || 0);
    return total;
  };

  const handleDenomChange = (denomKey: string, valStr: string) => {
    const val = Math.max(0, parseInt(valStr, 10) || 0);
    const updated = { ...denominations, [denomKey]: val };
    setDenominations(updated);
    const calculatedSum = calculateTotalFromDenominations(updated);
    setActualCashInput(String(calculatedSum));
  };

  const expectedCash = currentShiftData?.expected_cash || 0;
  const parsedActualCash = parseFloat(actualCashInput) || 0;
  const cashDifference = parsedActualCash - expectedCash;

  const handleExecuteCloseShift = async () => {
    if (!currentShiftData) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/fiscal/shifts/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorName: 'Администратор',
          actualCash: parsedActualCash,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка закрытия смены');
      }

      // Execute bank acquiring daily settlement (сверка итогов дня)
      let posSettlementResult: any = null;
      if (settleBankAcquiring) {
        try {
          const posRes = await fetch(`${API_BASE_URL}/api/pos/settlement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fiscal_shift_id: currentShiftData.id,
              fiscal_card_amount: currentShiftData.expected_card || currentShiftData.card_amount || 0
            })
          });
          if (posRes.ok) {
            posSettlementResult = await posRes.json();
          }
        } catch (posErr) {
          console.warn('[FiscalShiftCloseModal] POS settlement warning:', posErr);
        }
      }

      setClosedResult({
        ...data,
        posSettlement: posSettlementResult
      });
      if (onShiftClosed) onShiftClosed();
    } catch (err: any) {
      setError(err.message || 'Сбой закрытия смены');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number = 0) =>
    Number(val).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#0F3C64', color: '#FFFFFF', py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LockIcon sx={{ fontSize: 24, color: '#93C5FD' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {closedResult ? 'Смена успешно закрыта (Z-отчет)' : 'Закрытие кассовой смены и снятие Z-отчета'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#BAE6FD', display: 'block' }}>
              ККТ «АТОЛ 91Ф» • Соответствие требованиям 54-ФЗ
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#FFFFFF' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
        {loading && !currentShiftData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={36} sx={{ color: '#0F3C64' }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* 1. If Shift is Successfully Closed -> Show Z-Report Preview */}
        {closedResult && (
          <Box>
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {closedResult.message}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                Фискальный документ №{closedResult.fiscalDocumentNumber}, ФПД: {closedResult.fiscalSign}.
                Все итоговые счетчики записаны в фискальный накопитель и журнал смен.
              </Typography>
            </Alert>

            {/* Printable Thermal Receipt Card */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Card sx={{ maxWidth: 360, width: '100%', boxShadow: 4, borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#E2E8F0', p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                    ОБРАЗЕЦ ЧЕКОВОЙ ЛЕНТЫ Z-ОТЧЕТА
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    sx={{ bgcolor: '#0F3C64', textTransform: 'none', py: 0.4 }}
                  >
                    Печать
                  </Button>
                </Box>
                <Box sx={{ p: 1, bgcolor: '#FFFFFF' }}>
                  <FiscalZReportPrintTemplate
                    ref={printComponentRef}
                    data={{
                      mnemonicCode: closedResult.mnemonicCode,
                      shiftNumber: closedResult.shift?.shift_number,
                      zReportNumber: closedResult.zReportNumber,
                      fiscalDocumentNumber: closedResult.fiscalDocumentNumber,
                      fiscalSign: closedResult.fiscalSign,
                      openedAt: closedResult.shift?.opened_at,
                      openedBy: closedResult.shift?.opened_by,
                      closedAt: closedResult.shift?.closed_at,
                      closedBy: closedResult.shift?.closed_by,
                      durationMinutes: closedResult.shift?.duration_minutes,
                      totals: {
                        receiptsCount: closedResult.shift?.receipts_count,
                        returnsCount: closedResult.shift?.returns_count,
                        totalIncome: closedResult.shift?.total_income,
                        cashIncome: closedResult.shift?.cash_income,
                        cardIncome: closedResult.shift?.card_income,
                        sbpIncome: closedResult.shift?.sbp_income,
                        totalReturns: closedResult.shift?.total_returns,
                        expectedCash: closedResult.shift?.expected_cash,
                        actualCash: closedResult.shift?.actual_cash,
                        cashDifference: closedResult.shift?.cash_difference
                      },
                      notes: closedResult.shift?.notes
                    }}
                    isThermalFormat={true}
                  />
                </Box>
              </Card>
            </Box>

            {/* Bank Acquiring Settlement Card */}
            {closedResult.posSettlement && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Card sx={{ maxWidth: 360, width: '100%', boxShadow: 4, borderRadius: 2, border: '1px solid #BAE6FD', bgcolor: '#F0F9FF' }}>
                  <Box sx={{ bgcolor: '#0284C7', color: '#FFFFFF', p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CreditCardIcon sx={{ fontSize: 20 }} />
                      <Typography variant="caption" sx={{ fontWeight: 800 }}>
                        СВЕРКА ИТОГОВ АЛЬФА-БАНКА
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={closedResult.posSettlement.status === 'matched' ? '🟢 Сошлось' : '⚠️ Расхождение'}
                      sx={{
                        fontWeight: 700,
                        bgcolor: closedResult.posSettlement.status === 'matched' ? '#DCFCE7' : '#FEE2E2',
                        color: closedResult.posSettlement.status === 'matched' ? '#166534' : '#991B1B'
                      }}
                    />
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="caption" sx={{ display: 'block', color: '#64748B', mb: 1 }}>
                      Терминал: <b>{closedResult.posSettlement.terminalId || 'ALFA_770192'}</b> • Слип: <b>№{closedResult.posSettlement.settlementSequenceNumber || 1}</b>
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#475569' }}>Банк (эквайринг):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        {formatCurrency(closedResult.posSettlement.totalAuthorizedAmount || 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#475569' }}>ККТ (по чекам):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                        {formatCurrency(closedResult.posSettlement.fiscalCardAmount || 0)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Расхождение:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: closedResult.posSettlement.discrepancyAmount === 0 ? '#166534' : '#DC2626' }}>
                        {formatCurrency(closedResult.posSettlement.discrepancyAmount || 0)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        )}

        {/* 2. Wizard Closing Steps if Shift is Currently Open */}
        {!closedResult && currentShiftData && (
          <Box>
            {/* Shift Passport Banner */}
            <Card sx={{ mb: 2.5, borderRadius: 2.5, border: '1px solid #CBD5E1' }}>
              <CardContent sx={{ p: 2, pb: '16px !important', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      {currentShiftData.mnemonic_code}
                    </Typography>
                    <Chip label={`ФН № ${currentShiftData.shift_number}`} size="small" sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700 }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Открыта: {currentShiftData.opened_at} ({currentShiftData.opened_by}) • Длительность: {currentShiftData.hours_running} ч
                  </Typography>
                </Box>

                {currentShiftData.is_expired ? (
                  <Chip
                    icon={<WarningAmberIcon />}
                    label="Смена > 24ч (Блокировка 54-ФЗ)"
                    color="error"
                    sx={{ fontWeight: 700 }}
                  />
                ) : currentShiftData.warning_24h ? (
                  <Chip
                    icon={<WarningAmberIcon />}
                    label="Внимание: смена > 20ч"
                    color="warning"
                    sx={{ fontWeight: 700 }}
                  />
                ) : (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Смена активна"
                    color="success"
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Financial Highlights */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              1. Предварительные итоги выручки (X-отчет без гашения)
            </Typography>

            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                      Общая выручка:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      {formatCurrency(currentShiftData.total_income)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Чеков: {currentShiftData.receipts_count} шт.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <Card sx={{ bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PaymentsIcon sx={{ fontSize: 16, color: '#16A34A' }} />
                      <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                        Наличные:
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#166534' }}>
                      {formatCurrency(currentShiftData.cash_income)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#166534' }}>
                      Остаток: {formatCurrency(expectedCash)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <Card sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CreditCardIcon sx={{ fontSize: 16, color: '#2563EB' }} />
                      <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 600 }}>
                        Банковские карты:
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E40AF' }}>
                      {formatCurrency(currentShiftData.card_income)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#1E40AF' }}>
                      Эквайринг
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <Card sx={{ bgcolor: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <QrCode2Icon sx={{ fontSize: 16, color: '#9333EA' }} />
                      <Typography variant="caption" sx={{ color: '#6B21A8', fontWeight: 600 }}>
                        СБП (QR-код):
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#6B21A8' }}>
                      {formatCurrency(currentShiftData.sbp_income)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B21A8' }}>
                      Мгновенный расчет
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* 2. Cash Reconciliation & Denomination Calculator */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1 }}>
              2. Сверка фактической наличности в кассовом ящике
            </Typography>

            <Card sx={{ p: 2, mb: 2.5, borderRadius: 2.5, border: '1px solid #CBD5E1', bgcolor: '#FFFFFF' }}>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 0.5 }}>
                    Расчетная наличность по фискальным чекам:
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    {formatCurrency(expectedCash)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Фактически пересчитано в кассе (₽)"
                    type="number"
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    helperText="Введите сумму после пересчета денег в ящике"
                    slotProps={{
                      input: {
                        sx: { fontWeight: 700, fontSize: '1.15rem' }
                      }
                    }}
                  />
                </Grid>
              </Grid>

              {/* Denomination Calculator Accordion */}
              <Accordion
                expanded={calcOpen}
                onChange={() => setCalcOpen(!calcOpen)}
                sx={{ mt: 1.5, border: '1px solid #E2E8F0', borderRadius: '8px !important', boxShadow: 'none' }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalculateIcon sx={{ color: '#0F3C64', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                      Купюрный калькулятор (быстрый подсчет пачки банкнот)
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                    Укажите количество банкнот каждого номинала, сумма рассчитается автоматически:
                  </Typography>
                  <Grid container spacing={1.5}>
                    {[
                      { key: '5000', label: '5 000 ₽' },
                      { key: '2000', label: '2 000 ₽' },
                      { key: '1000', label: '1 000 ₽' },
                      { key: '500', label: '500 ₽' },
                      { key: '200', label: '200 ₽' },
                      { key: '100', label: '100 ₽' }
                    ].map((d) => (
                      <Grid size={{ xs: 6, sm: 4 }} key={d.key}>
                        <TextField
                          size="small"
                          fullWidth
                          label={`${d.label} (шт)`}
                          type="number"
                          value={denominations[d.key] || ''}
                          onChange={(e) => handleDenomChange(d.key, e.target.value)}
                        />
                      </Grid>
                    ))}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Монеты / Мелочь (₽)"
                        type="number"
                        value={denominations['coins'] || ''}
                        onChange={(e) => handleDenomChange('coins', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Discrepancy Status Banner */}
              <Box sx={{ mt: 2 }}>
                {cashDifference === 0 ? (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    <strong>Касса сходится идеально (расхождение 0.00 ₽).</strong> Данные готовы к закрытию смены.
                  </Alert>
                ) : cashDifference > 0 ? (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <strong>Обнаружен излишек наличности: +{formatCurrency(cashDifference)}.</strong> Пожалуйста, укажите причину в поле комментария ниже.
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    <strong>Обнаружена недостача наличности: {formatCurrency(cashDifference)}.</strong> Проверьте правильность пересчета или укажите объяснение.
                  </Alert>
                )}
              </Box>

              {/* Settle Bank Acquiring Switch */}
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#F0F9FF', borderRadius: 2, border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CreditCardIcon sx={{ color: '#0284C7' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                      Сверка итогов эквайринга (АО «АЛЬФА-БАНК»)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Автоматическая выгрузка банковского отчета и сопоставление выручки по картам
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settleBankAcquiring}
                      onChange={(e) => setSettleBankAcquiring(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>Сверка дня</Typography>}
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Комментарий кассира / Причина расхождения (необязательно)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mt: 2 }}
              />
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: '#F1F5F9', borderTop: '1px solid #CBD5E1' }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
          {closedResult ? 'Закрыть окно' : 'Отмена'}
        </Button>

        {!closedResult && currentShiftData && (
          <Button
            onClick={handleExecuteCloseShift}
            disabled={loading}
            variant="contained"
            color="error"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
            sx={{
              py: 1.2,
              px: 3,
              fontWeight: 800,
              textTransform: 'none',
              bgcolor: '#DC2626',
              '&:hover': { bgcolor: '#B91C1C' },
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)'
            }}
          >
            {loading ? 'Закрытие смены и печать Z-отчета...' : 'Закрыть смену и снять Z-отчет'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
