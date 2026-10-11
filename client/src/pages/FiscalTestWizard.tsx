import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, CircularProgress, Alert, Chip,
  Divider, Card, CardContent, Tooltip, IconButton, Collapse,
  Dialog, DialogTitle, DialogContent, DialogActions
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
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { API_BASE_URL } from '../config/apiConfig';

// Icons
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
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';

export interface FiscalReceiptRecord {
  id: number;
  transaction_id: number | null;
  visit_id: number | null;
  patient_id: number | null;
  patient_contact: string | null;
  receipt_type: string;
  payment_type: string;
  total_amount: number;
  tax_type: number;
  payment_subject_type: number;
  payment_method_type: number;
  fiscal_document_number: number | null;
  fiscal_sign: string | null;
  fiscal_drive_number: string | null;
  shift_number: number | null;
  receipt_number: number | null;
  kkt_reg_number: string | null;
  status: string;
  is_fiscalized: number;
  is_printed: number;
  error_message: string | null;
  device_model: string | null;
  port: string | null;
  items_json: string | null;
  created_at: string;
  fiscalized_at: string | null;
}

// Module-level stable Custom Toolbar for DataGrid (per grid-improvements skill)
function FiscalTestGridToolbar() {
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

// Module-level Printable Fiscal Receipt Slip Component (per report-generation skill)
export const FiscalReceiptSlip = React.forwardRef<HTMLDivElement, { receipt: FiscalReceiptRecord | null; fiscalInfo?: any }>(
  ({ receipt, fiscalInfo }, ref) => {
    if (!receipt) return null;

    const orgName = fiscalInfo?.orgName || (receipt as any)?.org_name || 'ИЧП Добрушкин А.М.';
    const clinicSubname = fiscalInfo?.clinicSubname || (receipt as any)?.clinic_subname || 'Центр Ортопедии и Травматологии';
    const orgAddress = fiscalInfo?.orgAddress || (receipt as any)?.org_address || 'г. Сочи, ул. Транспортная 65';
    const orgInn = fiscalInfo?.orgInn || (receipt as any)?.org_inn || '450107060083';
    const orgOgrnip = fiscalInfo?.orgOgrnip || (receipt as any)?.org_ogrnip || '323237500208220';
    const fnsSite = fiscalInfo?.fnsSite || (receipt as any)?.fns_site || 'www.nalog.gov.ru';
    const taxRegime = fiscalInfo?.taxRegime || 'СНО: УСН (пп. 2 п. 2 ст. 149 НК РФ — мед. услуги без НДС)';

    let parsedItems: any[] = [];
    if (receipt.items_json) {
      try {
        parsedItems = JSON.parse(receipt.items_json);
      } catch {
        parsedItems = [];
      }
    }
    if (parsedItems.length === 0) {
      parsedItems = [
        {
          name: 'Медицинские услуги центра ортопедии (комплексный прием)',
          qty: 1,
          quantity: 1,
          price: receipt.total_amount,
          unit_price: receipt.total_amount,
          subtotal: receipt.total_amount
        }
      ];
    }

    const paymentLabel =
      receipt.payment_type === 'card' ? 'Безналичными (Банковская карта)' :
      receipt.payment_type === 'cash' ? 'Наличными средствами' :
      receipt.payment_type === 'sbp' ? 'СБП (Система быстрых платежей / QR-код)' : 'Безналичный расчет';

    // 54-FZ QR code fiscal payload
    const dateFormatted = receipt.created_at ? receipt.created_at.replace(/[- :]/g, '').slice(0, 12) : '202610111200';
    const qrPayload = `t=${dateFormatted}&s=${Number(receipt.total_amount).toFixed(2)}&fn=${receipt.fiscal_drive_number || '9960440301984210'}&i=${receipt.fiscal_document_number || '2001'}&fp=${receipt.fiscal_sign || '1234567890'}&n=1`;

    return (
      <Box
        ref={ref}
        sx={{
          width: '100%',
          maxWidth: '420px',
          mx: 'auto',
          p: 3,
          bgcolor: '#FFFFFF',
          color: '#1A2027',
          fontFamily: '"Courier New", Courier, monospace, sans-serif',
          fontSize: '13px',
          lineHeight: 1.4,
          border: '1px dashed #CBD5E0',
          borderRadius: 1,
          '@media print': {
            border: 'none',
            p: 2,
            maxWidth: '100%'
          }
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {orgName}
          </Typography>
          {clinicSubname && (
            <Typography sx={{ fontWeight: 700, fontSize: '13px' }}>
              {clinicSubname}
            </Typography>
          )}
          <Typography sx={{ fontSize: '11px', color: '#4A5568' }}>
            {orgAddress}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#4A5568' }}>
            ИНН: {orgInn} • ОГРНИП: {orgOgrnip}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#4A5568' }}>
            {taxRegime}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#4A5568' }}>
            Сайт ФНС: {fnsSite}
          </Typography>
        </Box>

        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

        {/* Document Meta */}
        <Box sx={{ mb: 1.5, fontSize: '12px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>КАССОВЫЙ ЧЕК №{receipt.receipt_number || 1}</strong>
            <strong>ПРИХОД</strong>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Смена №: {receipt.shift_number || 14}</span>
            <span>Чек за смену: №{receipt.receipt_number || 1}</span>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Дата / Время:</span>
            <span>{receipt.created_at}</span>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Кассир:</span>
            <span>Администратор клиники</span>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Место расчетов:</span>
            <span>Касса №1 (АТОЛ 91Ф)</span>
          </Box>
          {receipt.patient_contact && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <span>Покупатель (Тег 1008):</span>
              <strong style={{ fontSize: '11px' }}>{receipt.patient_contact}</strong>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

        {/* Items Section */}
        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '12px', mb: 0.5 }}>
            УСЛУГИ / ПРЕДМЕТ РАСЧЕТА:
          </Typography>

          {parsedItems.map((item, idx) => {
            const qty = Number(item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1)) || 1;
            const price = Number(item.price !== undefined ? item.price : (item.unit_price !== undefined ? item.unit_price : receipt.total_amount)) || 0;
            const subtotal = Number(item.subtotal !== undefined ? item.subtotal : (qty * price)) || 0;

            return (
              <Box key={idx} sx={{ mb: 1, fontSize: '12px' }}>
                <Box sx={{ fontWeight: 600 }}>
                  {idx + 1}. {item.name || 'Медицинская услуга'}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#4A5568' }}>
                  <span>
                    {qty.toFixed(3)} шт. x ₽{price.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontWeight: 700, color: '#1A2027' }}>
                    = ₽{subtotal.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </span>
                </Box>
                <Box sx={{ fontSize: '11px', color: '#718096' }}>
                  Ставка НДС: {fiscalInfo?.taxRegime || 'Без НДС (ст. 149 НК РФ)'} • УСЛУГА • ПОЛНЫЙ РАСЧЕТ
                </Box>
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

        {/* Totals & Payments */}
        <Box sx={{ mb: 1.5, fontSize: '13px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900 }}>
            <span>ИТОГ:</span>
            <span>₽{Number(receipt.total_amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</span>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4A5568', mt: 0.5 }}>
            <span>{fiscalInfo?.taxType === 6 || fiscalInfo?.taxType === undefined ? 'В Т.Ч. СУММА БЕЗ НДС:' : `В Т.Ч. СУММА (${fiscalInfo?.taxRegimeName || fiscalInfo?.taxRegime || 'НДС'}):`}</span>
            <span>₽{Number(receipt.total_amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</span>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, mt: 0.5 }}>
            <span>ОПЛАТА: {paymentLabel}:</span>
            <span>₽{Number(receipt.total_amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</span>
          </Box>
        </Box>

        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

        {/* 54-FZ Fiscal Attributes */}
        <Box sx={{ fontSize: '11px', color: '#4A5568', mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Модель ККТ:</span>
            <strong>{receipt.device_model || 'АТОЛ 91Ф'} ({receipt.port || 'COM3'})</strong>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>РН ККТ:</span>
            <strong>{receipt.kkt_reg_number || '0004928103049182'}</strong>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>ФН №:</span>
            <strong>{receipt.fiscal_drive_number || '9960440301984210'}</strong>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>ФД №:</span>
            <strong>{receipt.fiscal_document_number || '—'}</strong>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>ФПД:</span>
            <strong style={{ letterSpacing: '1px' }}>{receipt.fiscal_sign || '—'}</strong>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>ФФД ККТ:</span>
            <span>1.2 / 1.05</span>
          </Box>
        </Box>

        {/* Fiscal QR Code */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
          <QRCodeSVG value={qrPayload} size={110} level="M" />
          <Typography sx={{ fontSize: '10px', color: '#718096', mt: 1, textAlign: 'center' }}>
            Проверка чека в мобильном приложении ФНС России
          </Typography>
          {Boolean((receipt.patient_contact && receipt.patient_contact.includes('[TEST_DAEMON]')) || fiscalInfo?.isMockMode) && (
            <Typography sx={{ fontSize: '10px', color: '#2B6CB0', fontWeight: 700, textAlign: 'center' }}>
              КОНТУР ТЕСТИРОВАНИЯ [TEST_DAEMON]
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

        <Box sx={{ textAlign: 'center', fontSize: '11px', color: '#718096' }}>
          Спасибо за обращение в {clinicSubname || orgName || 'Центр Ортопедии'}!
          <br />
          Будьте здоровы!
        </Box>
      </Box>
    );
  }
);

FiscalReceiptSlip.displayName = 'FiscalReceiptSlip';

export default function FiscalTestWizard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<any | null>(null);
  const [fiscalStatus, setFiscalStatus] = useState<any | null>(null);
  const [wizardResults, setWizardResults] = useState<any | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  // Receipt Preview & Print Dialog State
  const [previewReceipt, setPreviewReceipt] = useState<FiscalReceiptRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const printSlipRef = useRef<HTMLDivElement>(null);

  const handlePrintSlip = useReactToPrint({
    contentRef: printSlipRef,
    documentTitle: `Фискальный_чек_${previewReceipt?.fiscal_document_number || previewReceipt?.id || 'АТОЛ91Ф'}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 4mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
  });

  const fetchStatus = async () => {
    try {
      const [resTest, resStatus] = await Promise.all([
        fetch(`${API_BASE_URL}/api/fiscal/test-data/status`),
        fetch(`${API_BASE_URL}/api/fiscal/status`)
      ]);
      if (resTest.ok) {
        const data = await resTest.json();
        setStatusData(data);
      }
      if (resStatus.ok) {
        const status = await resStatus.json();
        setFiscalStatus(status);
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

  const handleOpenPreview = (receipt: FiscalReceiptRecord) => {
    setPreviewReceipt(receipt);
    setPreviewOpen(true);
  };

  const handleDirectPrint = (receipt: FiscalReceiptRecord) => {
    setPreviewReceipt(receipt);
    setTimeout(() => {
      handlePrintSlip();
    }, 150);
  };

  // Filter and accounting totals calculation for footer
  const receipts: FiscalReceiptRecord[] = statusData?.recentTestReceipts || [];

  const totals = useMemo(() => {
    const totalCount = receipts.length;
    let totalSum = 0;
    let cardSum = 0;
    let cashSum = 0;
    let sbpSum = 0;

    receipts.forEach(r => {
      const val = Number(r.total_amount) || 0;
      totalSum += val;
      if (r.payment_type === 'card') cardSum += val;
      else if (r.payment_type === 'cash') cashSum += val;
      else if (r.payment_type === 'sbp') sbpSum += val;
    });

    return { totalCount, totalSum, cardSum, cashSum, sbpSum };
  }, [receipts]);

  // DataGrid Columns definition
  const columns: GridColDef<FiscalReceiptRecord>[] = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 75,
      type: 'number',
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
          #{params.value}
        </Typography>
      )
    },
    {
      field: 'patient_contact',
      headerName: 'Тег 1008 (Контакт)',
      flex: 1.4,
      minWidth: 160,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3, py: 1 }}>
          {params.value || '—'}
        </Typography>
      )
    },
    {
      field: 'payment_type',
      headerName: 'Способ оплаты',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const val = params.value;
        const label =
          val === 'card' ? 'Карта' :
          val === 'cash' ? 'Наличные' :
          val === 'sbp' ? 'СБП (QR)' : 'Безнал';
        const color =
          val === 'card' ? 'primary' :
          val === 'cash' ? 'success' :
          val === 'sbp' ? 'secondary' : 'default';

        return <Chip size="small" label={label} color={color} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />;
      }
    },
    {
      field: 'total_amount',
      headerName: 'Сумма (₽)',
      type: 'number',
      flex: 1,
      minWidth: 110,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1B4D3E' }}>
          ₽{Number(params.value).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      field: 'fiscal_document_number',
      headerName: 'Номер ФД',
      flex: 0.9,
      minWidth: 100,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
          {params.value ? `№${params.value}` : '—'}
        </Typography>
      )
    },
    {
      field: 'fiscal_sign',
      headerName: 'ФПД',
      flex: 1.1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#4A5568' }}>
          {params.value || '—'}
        </Typography>
      )
    },
    {
      field: 'shift_number',
      headerName: 'Смена / Чек',
      flex: 0.9,
      minWidth: 100,
      valueGetter: (_, row) => `Смена ${row.shift_number || 14} / #${row.receipt_number || 1}`,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: '#4A5568', fontWeight: 600 }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Статус',
      flex: 1.1,
      minWidth: 125,
      renderCell: (params) => {
        const val = params.value;
        const isFisc = val === 'fiscalized';
        const isPaper = val === 'paper_error';

        return (
          <Chip
            size="small"
            label={isFisc ? '🟢 Записан в ФН' : isPaper ? '⚠️ Сбой бумаги' : val}
            color={isFisc ? 'success' : isPaper ? 'warning' : 'default'}
            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
          />
        );
      }
    },
    {
      field: 'created_at',
      headerName: 'Дата и время',
      flex: 1.1,
      minWidth: 130,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: '#718096', fontWeight: 500 }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 120,
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Предпросмотр фискального чека">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPreview(params.row);
              }}
              sx={{ bgcolor: '#EBF8FF', '&:hover': { bgcolor: '#BEE3F8' } }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Печать / Экспорт в PDF">
            <IconButton
              size="small"
              color="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleDirectPrint(params.row);
              }}
              sx={{ bgcolor: '#FAF5FF', '&:hover': { bgcolor: '#E9D8FD' } }}
            >
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ], []);

  return (
    <Box sx={{ width: '100%', maxWidth: 1300, mx: 'auto', p: { xs: 1, md: 3 } }}>
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

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<TuneIcon />}
            onClick={() => navigate('/admin/fiscal-settings')}
            sx={{ fontWeight: 700, borderColor: '#0F3C64', color: '#0F3C64' }}
          >
            Параметры ККТ (БД)
          </Button>

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

      {/* Active Profile Banner */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #BEE3F8', bgcolor: '#EBF8FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            label={fiscalStatus?.isMockMode ? 'MOCK РЕЖИМ' : 'HARDWARE ККТ'}
            color={fiscalStatus?.isMockMode ? 'primary' : 'warning'}
            size="small"
            sx={{ fontWeight: 800 }}
          />
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#2B6CB0' }}>
            Активный профиль из БД: «{fiscalStatus?.profileName || 'Основной профиль (АТОЛ 91Ф)'}»
          </Typography>
          <Typography variant="caption" sx={{ color: '#4A5568' }}>
            • Порт: <strong>{fiscalStatus?.port || 'COM3'}</strong> ({fiscalStatus?.baudRate || 115200} бод) • ФН: {fiscalStatus?.fnNumber || '9960440301984210'} • Смена №{fiscalStatus?.shiftNumber || 14}
          </Typography>
        </Box>

        <Button
          size="small"
          variant="text"
          startIcon={<TuneIcon />}
          onClick={() => navigate('/admin/fiscal-settings')}
          sx={{ fontWeight: 700, color: '#2B6CB0' }}
        >
          Изменить параметры
        </Button>
      </Paper>

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
            <Typography variant="h6" sx={{ fontWeight: 800, color: fiscalStatus?.isMockMode ? '#2F855A' : '#C53030', mt: 1 }}>
              {fiscalStatus?.isMockMode ? 'Эмуляция (Mock)' : 'Физический ККТ'}
            </Typography>
            <Typography variant="caption" sx={{ color: fiscalStatus?.isMockMode ? '#38A169' : '#E53E3E' }}>
              {fiscalStatus?.isMockMode ? `🟢 ${fiscalStatus?.port || 'COM3'} • Готова к тестам` : `🔴 ${fiscalStatus?.port || 'COM3'} • Оборудование`}
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
          Запустить мастер тестирования (6 сценариев)
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

        <Button
          variant="outlined"
          startIcon={<ReceiptLongIcon />}
          onClick={() => navigate('/admin/fiscal-shifts')}
          sx={{ borderColor: '#0F3C64', color: '#0F3C64', px: 2, py: 1.2, fontWeight: 700, textTransform: 'none' }}
        >
          Журнал смен ККТ
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

      {/* [TEST_DAEMON] Receipts DataGrid (per grid-improvements standard) */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptLongIcon sx={{ color: '#0F3C64' }} />
              Фискальные чеки [TEST_DAEMON] в базе данных ({receipts.length})
            </Typography>
            <Typography variant="caption" sx={{ color: '#718096' }}>
              Интерактивная таблица с полнотекстовым поиском, сортировкой по всем столбцам, предпросмотром чека и печатью PDF
            </Typography>
          </Box>

          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchStatus}
            sx={{ fontWeight: 600, borderColor: '#CBD5E1', color: '#0F3C64' }}
            variant="outlined"
          >
            Обновить чеки
          </Button>
        </Box>

        {receipts.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center', color: '#718096', border: '1px dashed #CBD5E0', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              Тестовые фискальные данные [TEST_DAEMON] отсутствуют в базе данных SQLite.
            </Typography>
            <Typography variant="body2" sx={{ color: '#A0AEC0', mb: 2 }}>
              Нажмите кнопку ниже, чтобы сгенерировать 6 изолированных чеков и записи аудита Serilog.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={handleCreateData}
              sx={{ bgcolor: '#16A34A', fontWeight: 700 }}
            >
              Создать набор тестовых данных
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              width: '100%',
              '& .MuiDataGrid-root': {
                border: '1px solid #E2E8F0',
                borderRadius: 2
              },
              '& .MuiDataGrid-virtualScroller': {
                overflowX: 'hidden'
              },
              '& .MuiDataGrid-columnHeaders': {
                position: 'sticky',
                top: 0,
                zIndex: 1,
                bgcolor: '#F8FAFC',
                fontWeight: 800,
                color: '#0F3C64',
                borderBottom: '2px solid #E2E8F0'
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center'
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: '#F8FAFC'
              }
            }}
          >
            <DataGrid
              autoHeight
              showToolbar
              rows={receipts}
              columns={columns}
              getRowHeight={() => 'auto'}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
                sorting: { sortModel: [{ field: 'id', sort: 'desc' }] }
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              slots={{
                toolbar: FiscalTestGridToolbar
              }}
              disableRowSelectionOnClick
            />

            {/* Accounting Totals Footer Bar (per grid-improvements requirement) */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mt: 1.5,
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  Всего чеков в выборке: <strong>{totals.totalCount}</strong>
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ height: 18, my: 'auto' }} />
                <Typography variant="body2" sx={{ color: '#4A5568' }}>
                  Карта: <strong>₽{totals.cardSum.toLocaleString('ru-RU')}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: '#4A5568' }}>
                  Наличные: <strong>₽{totals.cashSum.toLocaleString('ru-RU')}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: '#4A5568' }}>
                  СБП: <strong>₽{totals.sbpSum.toLocaleString('ru-RU')}</strong>
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4A5568' }}>
                  ИТОГОВАЯ ВЫРУЧКА:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#1B4D3E' }}>
                  ₽{totals.totalSum.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>

      {/* Hidden container for print-to-pdf rendering (per report-generation skill) */}
      <Box sx={{ display: 'none' }}>
        <FiscalReceiptSlip ref={printSlipRef} receipt={previewReceipt} fiscalInfo={fiscalStatus} />
      </Box>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptLongIcon sx={{ color: '#0F3C64' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              Предпросмотр фискального чека #{previewReceipt?.id}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setPreviewOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'center', py: 3 }}>
          <FiscalReceiptSlip receipt={previewReceipt} fiscalInfo={fiscalStatus} />
        </DialogContent>

        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => setPreviewOpen(false)} sx={{ fontWeight: 600, color: '#64748B' }}>
            Закрыть
          </Button>

          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => handlePrintSlip()}
            sx={{ bgcolor: '#0F3C64', px: 3, fontWeight: 700 }}
          >
            Печать / Экспорт в PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
