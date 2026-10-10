import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridRowSelectionModel
} from '@mui/x-data-grid';
import { ruRU } from '@mui/x-data-grid/locales';
import { useReactToPrint } from 'react-to-print';

// Icons
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckIcon from '@mui/icons-material/Check';

// Subcomponents
import { PayoutGridToolbar } from '../components/payouts/PayoutGridToolbar';
import { PayoutGridFooter } from '../components/payouts/PayoutGridFooter';
import { PayoutCalculationWizard } from '../components/payouts/PayoutCalculationWizard';
import { PayoutBiDashboard } from '../components/payouts/PayoutBiDashboard';
import { PayoutSchemeEditor } from '../components/payouts/PayoutSchemeEditor';
import { StaffPayoutReportTemplate, type PayoutReportData } from '../components/payouts/StaffPayoutReportTemplate';

import { API_BASE_URL } from '../config/apiConfig';

export default function StaffPayouts() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'procedures' | 'staff'>('procedures');

  // Grid Data & Loading
  const [accruals, setAccruals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });

  // Expanded rows for Procedure View (Master-detail BOM / Brigade)
  const [expandedRowIds, setExpandedRowIds] = useState<Record<number, boolean>>({});

  // Edit Accrual Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAccrual, setEditingAccrual] = useState<any | null>(null);

  // Notification
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // Sheets Registry State
  const [sheets, setSheets] = useState<any[]>([]);
  const [sheetsLoading, setSheetsLoading] = useState(false);

  // Status Filter for Accruals
  const [statusFilter, setStatusFilter] = useState<'all' | 'accrued' | 'approved' | 'in_sheet' | 'paid' | 'storno'>('all');

  // Sheet Creation Dialog State
  const [sheetDialogOpen, setSheetDialogOpen] = useState(false);
  const [sheetNotes, setSheetNotes] = useState('');
  const [creatingSheet, setCreatingSheet] = useState(false);

  // Sheet Payment Order Dialog
  const [payOrderDialogOpen, setPayOrderDialogOpen] = useState(false);
  const [targetSheetForPay, setTargetSheetForPay] = useState<any | null>(null);
  const [paymentOrderNum, setPaymentOrderNum] = useState('');

  // Print Template State
  const printRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<PayoutReportData | null>(null);

  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Расчетная_ведомость_выплат_${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
  });

  const fetchAccruals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/accruals?view=${viewMode}`);
      if (res.ok) {
        const json = await res.json();
        setAccruals(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load accruals', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSheets = async () => {
    setSheetsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/sheets`);
      if (res.ok) {
        const json = await res.json();
        setSheets(json.sheets || []);
      }
    } catch (err) {
      console.error('Failed to load sheets', err);
    } finally {
      setSheetsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 0) {
      fetchAccruals();
    } else if (activeTab === 1) {
      fetchSheets();
    }
  }, [activeTab, viewMode]);

  const toggleRowExpand = (rowId: number) => {
    setExpandedRowIds(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0 ₽';
    const num = Number(val);
    const hasFraction = Math.abs(num % 1) > 0.001;
    return num.toLocaleString('ru-RU', {
      minimumFractionDigits: hasFraction ? 1 : 0,
      maximumFractionDigits: 2
    }) + ' ₽';
  };

  // Convert row selection to array of IDs
  const selectedIdsArray = useMemo(() => {
    if (!selectedRowIds) return [];
    if (Array.isArray(selectedRowIds)) return selectedRowIds;
    if (selectedRowIds.ids instanceof Set) return Array.from(selectedRowIds.ids);
    return [];
  }, [selectedRowIds]);

  // Bulk Approve handler
  const handleBulkApprove = async () => {
    if (selectedIdsArray.length === 0) return;
    try {
      let idsToApprove: number[] = [];
      if (viewMode === 'staff') {
        idsToApprove = selectedIdsArray.map(Number);
      } else {
        // Collect all accrual_ids from selected procedures
        selectedIdsArray.forEach(procId => {
          const proc = accruals.find(a => a.id === procId);
          if (proc && Array.isArray(proc.brigade_details)) {
            proc.brigade_details.forEach((b: any) => {
              if (b.accrual_id) idsToApprove.push(b.accrual_id);
            });
          }
        });
      }

      if (idsToApprove.length === 0) return;

      const res = await fetch(`${API_BASE_URL}/api/payouts/accruals/bulk-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accrualIds: idsToApprove })
      });

      if (res.ok) {
        setSnackbarMessage(`Успешно утверждено начислений: ${idsToApprove.length}`);
        fetchAccruals();
      }
    } catch (err: any) {
      alert('Ошибка при утверждении: ' + err.message);
    }
  };

  // Bulk Annul handler
  const handleBulkAnnul = async () => {
    if (selectedIdsArray.length === 0) return;
    if (!confirm(`Аннулировать выбранные начисления (${selectedIdsArray.length} шт.)?`)) return;
    try {
      let idsToAnnul: number[] = [];
      if (viewMode === 'staff') {
        idsToAnnul = selectedIdsArray.map(Number);
      } else {
        selectedIdsArray.forEach(procId => {
          const proc = accruals.find(a => a.id === procId);
          if (proc && Array.isArray(proc.brigade_details)) {
            proc.brigade_details.forEach((b: any) => {
              if (b.accrual_id) idsToAnnul.push(b.accrual_id);
            });
          }
        });
      }

      if (idsToAnnul.length === 0) return;

      const res = await fetch(`${API_BASE_URL}/api/payouts/accruals/bulk-annul`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accrualIds: idsToAnnul })
      });

      if (res.ok) {
        setSnackbarMessage(`Успешно аннулировано начислений: ${idsToAnnul.length}`);
        fetchAccruals();
      }
    } catch (err: any) {
      alert('Ошибка при аннулировании: ' + err.message);
    }
  };

  // Bulk Mark as Paid handler
  const handleBulkPay = async () => {
    if (selectedIdsArray.length === 0) return;
    if (!confirm(`Отметить как выплаченные (${selectedIdsArray.length} начислений)?`)) return;
    try {
      let idsToPay: number[] = [];
      if (viewMode === 'staff') {
        idsToPay = selectedIdsArray.map(Number);
      } else {
        selectedIdsArray.forEach(procId => {
          const proc = accruals.find(a => a.id === procId);
          if (proc && Array.isArray(proc.brigade_details)) {
            proc.brigade_details.forEach((b: any) => {
              if (b.accrual_id) idsToPay.push(b.accrual_id);
            });
          }
        });
      }

      if (idsToPay.length === 0) return;

      const res = await fetch(`${API_BASE_URL}/api/payouts/accruals/bulk-pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accrualIds: idsToPay })
      });

      if (res.ok) {
        setSnackbarMessage(`Успешно отмечено как выплачено: ${idsToPay.length}`);
        fetchAccruals();
      }
    } catch (err: any) {
      alert('Ошибка при выплате: ' + err.message);
    }
  };

  // Open Create Sheet Dialog
  const handleOpenCreateSheet = () => {
    if (selectedIdsArray.length === 0) return;
    setSheetNotes('');
    setSheetDialogOpen(true);
  };

  // Confirm Sheet Creation
  const handleConfirmCreateSheet = async () => {
    try {
      setCreatingSheet(true);
      let idsToInclude: number[] = [];
      if (viewMode === 'staff') {
        idsToInclude = selectedIdsArray.map(Number);
      } else {
        selectedIdsArray.forEach(procId => {
          const proc = accruals.find(a => a.id === procId);
          if (proc && Array.isArray(proc.brigade_details)) {
            proc.brigade_details.forEach((b: any) => {
              if (b.accrual_id) idsToInclude.push(b.accrual_id);
            });
          }
        });
      }

      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(`${API_BASE_URL}/api/payouts/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: today.slice(0, 7) + '-01',
          period_end: today,
          accrual_ids: idsToInclude,
          notes: sheetNotes
        })
      });

      if (res.ok) {
        const json = await res.json();
        setSheetDialogOpen(false);
        const countCreated = json.sheets?.length || 1;
        setSnackbarMessage(`Ведомость успешно сформирована (${countCreated > 1 ? `создано ${countCreated} ведомостей` : json.sheetNumber})`);
        fetchAccruals();
        fetchSheets();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Ошибка: ' + (err.error || res.statusText));
      }
    } catch (err: any) {
      alert('Ошибка при создании ведомости: ' + err.message);
    } finally {
      setCreatingSheet(false);
    }
  };

  // Sheet status update (Approve / Pay)
  const handleUpdateSheetStatus = async (sheetId: number, status: 'approved' | 'paid', paymentOrder?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/sheets/${sheetId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approved_by: 'Администратор клиники',
          payment_order_number: paymentOrder
        })
      });
      if (res.ok) {
        setSnackbarMessage(status === 'paid' ? 'Ведомость выплачена' : 'Ведомость утверждена');
        fetchSheets();
        fetchAccruals();
      }
    } catch (err: any) {
      alert('Ошибка при обновлении ведомости: ' + err.message);
    }
  };

  // Print full Sheet
  const handlePrintSheet = async (sheetId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/sheets/${sheetId}`);
      if (res.ok) {
        const data = await res.json();
        const sh = data.sheet;
        const itms = data.items || [];
        setPrintData({
          sheet_number: sh.sheet_number,
          staff_name: sh.staff_name,
          staff_role: sh.staff_role,
          specialization: sh.specialization,
          period_start: sh.period_start,
          period_end: sh.period_end,
          total_operations_count: sh.total_operations_count,
          total_margin_base: sh.total_margin_base,
          total_payout_amount: sh.total_payout_amount,
          tax_rate_percent: sh.tax_rate_percent,
          payout_account_info: sh.payout_account_info,
          items: itms.map((i: any) => ({
            accrual_id: i.accrual_id,
            service_date: i.service_date,
            role_in_procedure: i.role_in_procedure,
            patient_name: i.patient_name,
            operation_name: i.operation_name,
            revenue: i.revenue,
            materials_cost: i.materials_cost,
            material_cost_factor: i.material_cost_factor,
            margin_base: i.margin_base,
            payout_percent: i.payout_percent,
            calculated_payout: i.calculated_payout,
            applied_min_guarantee: i.applied_min_guarantee,
            manual_adjustment: i.manual_adjustment,
            final_payout: i.final_payout,
            notes: i.notes
          }))
        });

        setTimeout(() => {
          handlePrintTrigger();
        }, 150);
      }
    } catch (err: any) {
      alert('Ошибка при загрузке ведомости для печати: ' + err.message);
    }
  };

  // Counts for status filter tabs
  const statusCounts = useMemo(() => {
    const counts = { all: accruals.length, accrued: 0, approved: 0, in_sheet: 0, paid: 0, storno: 0 };
    accruals.forEach(a => {
      if (a.status === 'accrued') counts.accrued++;
      else if (a.status === 'approved') counts.approved++;
      else if (a.status === 'in_sheet') counts.in_sheet++;
      else if (a.status === 'paid') counts.paid++;
      else if (a.status === 'storno' || a.status === 'cancelled') counts.storno++;
    });
    return counts;
  }, [accruals]);

  const filteredAccruals = useMemo(() => {
    if (statusFilter === 'all') return accruals;
    return accruals.filter(a => {
      if (statusFilter === 'storno') return a.status === 'storno' || a.status === 'cancelled';
      return a.status === statusFilter;
    });
  }, [accruals, statusFilter]);

  // Prepare and trigger PDF Print
  const handlePrint = async () => {
    if (selectedIdsArray.length === 0) return;

    let printItems: any[] = [];
    let staffName = 'Сотрудники клиники';
    let staffRole = 'Врач / Операционная медсестра';

    if (viewMode === 'staff') {
      const selectedAccruals = accruals.filter(a => selectedIdsArray.includes(a.id));
      if (selectedAccruals.length > 0) {
        staffName = selectedAccruals[0].staff_name || staffName;
        staffRole = selectedAccruals[0].role_in_procedure || staffRole;
      }
      printItems = selectedAccruals.map(a => ({
        accrual_id: a.id,
        service_date: a.service_date,
        role_in_procedure: a.role_in_procedure,
        patient_name: a.patient_name,
        operation_name: a.operation_name,
        revenue: a.revenue,
        materials_cost: a.materials_cost,
        material_cost_factor: a.material_cost_factor,
        margin_base: a.margin_base,
        payout_percent: a.payout_percent,
        calculated_payout: a.calculated_payout,
        applied_min_guarantee: a.applied_min_guarantee,
        manual_adjustment: a.manual_adjustment,
        final_payout: a.final_payout,
        notes: a.notes
      }));
    } else {
      const selectedProcedures = accruals.filter(p => selectedIdsArray.includes(p.id));
      selectedProcedures.forEach(proc => {
        if (Array.isArray(proc.brigade_details)) {
          proc.brigade_details.forEach((b: any) => {
            printItems.push({
              accrual_id: b.accrual_id,
              service_date: proc.service_date,
              role_in_procedure: b.role,
              patient_name: proc.patient_name,
              operation_name: proc.operation_name,
              revenue: proc.revenue,
              materials_cost: proc.materials_cost,
              material_cost_factor: proc.material_cost_factor,
              margin_base: proc.margin_base,
              payout_percent: b.percent,
              calculated_payout: b.payout,
              final_payout: b.payout,
              notes: proc.notes
            });
          });
        }
      });
    }

    const totalMargin = printItems.reduce((sum, it) => sum + (it.margin_base || 0), 0);
    const totalPayout = printItems.reduce((sum, it) => sum + (it.final_payout || 0), 0);

    const reportPayload: PayoutReportData = {
      sheet_number: `ВЫП-${new Date().toISOString().slice(0, 7)}-ПЕЧ`,
      staff_name: staffName,
      staff_role: staffRole,
      period_start: printItems.length > 0 ? printItems[0].service_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      period_end: new Date().toISOString().slice(0, 10),
      total_operations_count: printItems.length,
      total_margin_base: totalMargin,
      total_payout_amount: totalPayout,
      tax_rate_percent: 13,
      items: printItems
    };

    setPrintData(reportPayload);

    setTimeout(() => {
      handlePrintTrigger();
    }, 150);
  };

  // Export to Excel (CSV with UTF-8 BOM)
  const handleExportCsv = () => {
    if (accruals.length === 0) return;

    let headers = ['ID', 'Дата', 'Пациент', 'Сервис', 'Выручка (руб)', 'Расходники*1.15', 'Маржа (руб)'];
    if (viewMode === 'staff') {
      headers.push('Сотрудник', 'Роль', 'Ставка (%)', 'Выплата (руб)', 'Статус');
    } else {
      headers.push('Выплаты бригаде (руб)', 'Остаток клиники (руб)', 'Состав бригады');
    }

    const rows = accruals.map(r => {
      const common = [
        r.id,
        `"${r.service_date ? r.service_date.slice(0, 10) : ''}"`,
        `"${(r.patient_name || '').replace(/"/g, '""')}"`,
        `"${(r.operation_name || '').replace(/"/g, '""')}"`,
        r.revenue || 0,
        Math.round((r.materials_cost || 0) * (r.material_cost_factor || 1.15)),
        r.margin_base || 0
      ];

      if (viewMode === 'staff') {
        return [
          ...common,
          `"${(r.staff_name || '').replace(/"/g, '""')}"`,
          `"${r.role_in_procedure || ''}"`,
          r.payout_percent || 0,
          r.final_payout || 0,
          r.status || ''
        ].join(';');
      } else {
        const brigadeStr = (r.brigade_details || []).map((b: any) => `${b.staff_name} (${b.percent}% = ${b.payout}₽)`).join(', ');
        return [
          ...common,
          r.total_staff_payouts || 0,
          r.clinic_profit || 0,
          `"${brigadeStr.replace(/"/g, '""')}"`
        ].join(';');
      }
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Выплаты_сотрудникам_${viewMode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Annul / Cancel accrual handler
  const handleToggleAnnulAccrual = async (accrualId: number, isCurrentlyCancelled: boolean) => {
    const actionText = isCurrentlyCancelled ? 'восстановить данное начисление' : 'аннулировать данное начисление';
    if (!confirm(`Вы уверены, что хотите ${actionText}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/accruals/${accrualId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setSnackbarMessage(data.status === 'cancelled' ? 'Начисление успешно аннулировано' : 'Начисление успешно восстановлено');
        fetchAccruals();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert('Ошибка: ' + (errData.error || res.statusText));
      }
    } catch (err: any) {
      alert('Ошибка при изменении статуса: ' + err.message);
    }
  };

  // Save edited accrual
  const handleSaveEditAccrual = async () => {
    if (!editingAccrual) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/accruals/${editingAccrual.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payout_percent: editingAccrual.payout_percent,
          manual_adjustment: editingAccrual.manual_adjustment,
          status: editingAccrual.status,
          notes: editingAccrual.notes
        })
      });
      if (res.ok) {
        setEditDialogOpen(false);
        setSnackbarMessage('Начисление успешно обновлено');
        fetchAccruals();
      }
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  // Accounting totals calculations for footer
  const gridTotals = useMemo(() => {
    let rev = 0;
    let mat = 0;
    let mar = 0;
    let pay = 0;
    let clProf = 0;

    accruals.forEach(it => {
      rev += Number(it.revenue || 0);
      mat += Number(it.materials_cost || 0) * Number(it.material_cost_factor || 1.15);
      mar += Number(it.margin_base || 0);
      if (viewMode === 'staff') {
        pay += Number(it.final_payout || 0);
      } else {
        pay += Number(it.total_staff_payouts || 0);
        clProf += Number(it.clinic_profit || 0);
      }
    });

    return {
      totalCount: accruals.length,
      totalRevenue: rev,
      totalMaterials: mat,
      totalMargin: mar,
      totalPayout: pay,
      totalClinicProfit: clProf
    };
  }, [accruals, viewMode]);

  // COLUMNS: Procedure-Centric Brigade View
  const procedureColumns: GridColDef[] = [
    {
      field: 'expand',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isExpanded = Boolean(expandedRowIds[params.row.id]);
        return (
          <IconButton size="small" onClick={() => toggleRowExpand(params.row.id)}>
            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        );
      }
    },
    {
      field: 'service_date',
      headerName: 'Дата визита',
      flex: 1,
      minWidth: 110,
      renderCell: (params) => params.value ? params.value.slice(0, 10) : '—'
    },
    {
      field: 'patient_name',
      headerName: 'Пациент (ЭМК)',
      flex: 1.5,
      minWidth: 160,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F3C64', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'operation_name',
      headerName: 'Сервис',
      flex: 2,
      minWidth: 220,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'revenue',
      headerName: 'Выручка',
      flex: 1,
      minWidth: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => formatCurrency(params.value)
    },
    {
      field: 'materials_cost',
      headerName: 'Расходники*1.15',
      flex: 1.1,
      minWidth: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#D97706' }}>
          {formatCurrency((params.value || 0) * (params.row.material_cost_factor || 1.15))}
        </Typography>
      )
    },
    {
      field: 'margin_base',
      headerName: 'Маржа базы',
      flex: 1.1,
      minWidth: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#156C9C' }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'brigade_details',
      headerName: 'Бригада исполнителей',
      flex: 2.2,
      minWidth: 240,
      renderCell: (params) => {
        const details = params.value || [];
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.8 }}>
            {details.map((b: any, idx: number) => (
              <Chip
                key={idx}
                size="small"
                label={`${b.role === 'Врач' ? '👨‍⚕️' : '👩‍⚕️'} ${b.staff_name.split(' ')[0]}: ${b.percent}% (${formatCurrency(b.payout)})`}
                sx={{
                  bgcolor: b.role === 'Врач' ? '#E0F2FE' : '#F1F5F9',
                  color: b.role === 'Врач' ? '#0369A1' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.72rem'
                }}
              />
            ))}
          </Box>
        );
      }
    },
    {
      field: 'total_staff_payouts',
      headerName: 'ФОТ бригады',
      flex: 1.1,
      minWidth: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'clinic_profit',
      headerName: 'Остаток клиники',
      flex: 1.1,
      minWidth: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: params.value >= 0 ? '#16A34A' : '#DC2626' }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    }
  ];

  // COLUMNS: Staff-Centric Flat View
  const staffColumns: GridColDef[] = [
    {
      field: 'service_date',
      headerName: 'Дата визита',
      flex: 1,
      minWidth: 110,
      renderCell: (params) => params.value ? params.value.slice(0, 10) : '—'
    },
    {
      field: 'staff_name',
      headerName: 'Сотрудник / Специалист',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'role_in_procedure',
      headerName: 'Роль',
      flex: 1,
      minWidth: 110,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          sx={{
            bgcolor: params.value === 'Врач' ? '#DBEAFE' : '#EDE9FE',
            color: params.value === 'Врач' ? '#1E40AF' : '#6D28D9',
            fontWeight: 600
          }}
        />
      )
    },
    {
      field: 'patient_name',
      headerName: 'Пациент (ЭМК)',
      flex: 1.4,
      minWidth: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'operation_name',
      headerName: 'Сервис',
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'margin_base',
      headerName: 'Маржа базы',
      flex: 1.1,
      minWidth: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => formatCurrency(params.value)
    },
    {
      field: 'payout_percent',
      headerName: 'Ставка',
      flex: 0.8,
      minWidth: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <strong>{params.value}%</strong>
    },
    {
      field: 'final_payout',
      headerName: 'Выплата (₽)',
      flex: 1.2,
      minWidth: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', bgcolor: '#F1F5F9', px: 1, py: 0.3, borderRadius: 1 }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'sheet_number',
      headerName: 'Ведомость',
      flex: 1.2,
      minWidth: 150,
      renderCell: (params) => params.value ? (
        <Chip
          size="small"
          icon={<ReceiptLongIcon style={{ fontSize: 16 }} />}
          label={params.value}
          sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, border: '1px solid #BFDBFE' }}
        />
      ) : (
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>—</Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Статус',
      flex: 1.1,
      minWidth: 135,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        let label = 'Начислено';
        let color: 'default' | 'info' | 'success' | 'warning' | 'error' = 'info';
        if (params.value === 'approved') { label = 'Утверждено'; color = 'warning'; }
        if (params.value === 'in_sheet') { label = 'В ведомости'; color = 'primary'; }
        if (params.value === 'paid') { label = 'Выплачено'; color = 'success'; }
        if (params.value === 'storno' || params.value === 'cancelled' || params.value === 'annulled') {
          label = 'Аннулировано';
          color = 'error';
        }
        const isAnnulled = params.value === 'storno' || params.value === 'cancelled';
        return (
          <Chip
            size="small"
            label={label}
            color={color}
            variant={isAnnulled ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700 }}
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 105,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isCancelled = params.row.status === 'storno' || params.row.status === 'cancelled';
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                setEditingAccrual(params.row);
                setEditDialogOpen(true);
              }}
              title="Редактировать"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color={isCancelled ? "warning" : "error"}
              onClick={() => handleToggleAnnulAccrual(params.row.id, isCancelled)}
              title={isCancelled ? "Восстановить начисление" : "Аннулировать"}
            >
              {isCancelled ? <RestoreIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
            </IconButton>
          </Box>
        );
      }
    }
  ];

  // COLUMNS: Sheets Tab DataGrid
  const sheetColumns: GridColDef[] = [
    {
      field: 'sheet_number',
      headerName: 'Номер ведомости',
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptLongIcon sx={{ color: '#0284C7', fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'staff_name',
      headerName: 'Сотрудник / Специалист',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
            {params.value}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            {params.row.specialization || params.row.staff_role || 'Специалист'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'period',
      headerName: 'Период',
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_, row) => `${row.period_start || ''} — ${row.period_end || ''}`,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#334155' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'total_operations_count',
      headerName: 'Операций',
      flex: 0.8,
      minWidth: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <strong>{params.value || 0}</strong>
    },
    {
      field: 'total_margin_base',
      headerName: 'Маржа базы',
      flex: 1.1,
      minWidth: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => formatCurrency(params.value)
    },
    {
      field: 'total_payout_amount',
      headerName: 'К выплате (₽)',
      flex: 1.2,
      minWidth: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', bgcolor: '#F0FDF4', px: 1, py: 0.4, borderRadius: 1 }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Статус',
      flex: 1.1,
      minWidth: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        let label = 'Черновик';
        let color: 'default' | 'info' | 'success' | 'warning' = 'default';
        if (params.value === 'approved') { label = 'Утверждена'; color = 'warning'; }
        if (params.value === 'paid') { label = 'Выплачена'; color = 'success'; }
        return (
          <Chip
            size="small"
            label={label}
            color={color}
            variant={params.value === 'paid' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700 }}
          />
        );
      }
    },
    {
      field: 'payment_order_number',
      headerName: 'ПП / Выплата',
      flex: 1.1,
      minWidth: 130,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: params.value ? '#16A34A' : '#94A3B8', fontWeight: params.value ? 700 : 400 }}>
          {params.value || 'Не выплачено'}
        </Typography>
      )
    },
    {
      field: 'sheet_actions',
      headerName: 'Действия',
      flex: 1.4,
      minWidth: 170,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const sh = params.row;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            {sh.status === 'draft' && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleUpdateSheetStatus(sh.id, 'approved')}
                sx={{ fontSize: '0.72rem', py: 0.2, px: 0.8 }}
              >
                Утвердить
              </Button>
            )}
            {sh.status !== 'paid' && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<PaymentsIcon />}
                onClick={() => {
                  setTargetSheetForPay(sh);
                  setPaymentOrderNum(`ПП-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);
                  setPayOrderDialogOpen(true);
                }}
                sx={{ fontSize: '0.72rem', py: 0.2, px: 0.8 }}
              >
                Выплатить
              </Button>
            )}
            <IconButton
              size="small"
              color="primary"
              onClick={() => handlePrintSheet(sh.id)}
              title="Печать ведомости"
            >
              <PrintIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Header Card */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              Расчет выплат сотрудникам
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Индивидуальное вознаграждение врачей и операционных медсестер на базе маржинального дохода сервисов
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AutoFixHighIcon />}
            onClick={() => setActiveTab(2)}
            sx={{
              bgcolor: '#0F3C64',
              fontWeight: 700,
              px: 3,
              '&:hover': { bgcolor: '#156C9C' }
            }}
          >
            Оформить расчет (Wizard)
          </Button>
        </Box>

        {/* Navigation Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            borderBottom: '1px solid #E2E8F0',
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' }
          }}
        >
          <Tab icon={<AccountBalanceWalletIcon />} iconPosition="start" label="Реестр начислений (DataGrid)" />
          <Tab icon={<ReceiptLongIcon />} iconPosition="start" label={`Ведомости выплат (${sheets.length})`} />
          <Tab icon={<AutoFixHighIcon />} iconPosition="start" label="Мастер расчета (Wizard)" />
          <Tab icon={<BarChartIcon />} iconPosition="start" label="BI Аналитика выплат" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Схемы и персональные ставки" />
        </Tabs>
      </Paper>

      {/* TAB 0: DATAGRID REGISTRY */}
      {activeTab === 0 && (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
          {/* View Mode Toggle Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64', mr: 1 }}>
                Разрез отображения:
              </Typography>
              <Chip
                label="По сервисам (Бригадный вид)"
                color={viewMode === 'procedures' ? 'primary' : 'default'}
                onClick={() => setViewMode('procedures')}
                sx={{ fontWeight: 600, cursor: 'pointer', bgcolor: viewMode === 'procedures' ? '#0F3C64' : undefined }}
              />
              <Chip
                label="По сотрудникам (Персональный вид)"
                color={viewMode === 'staff' ? 'primary' : 'default'}
                onClick={() => setViewMode('staff')}
                sx={{ fontWeight: 600, cursor: 'pointer', bgcolor: viewMode === 'staff' ? '#0F3C64' : undefined }}
              />
            </Box>

            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Отображается: <strong>{filteredAccruals.length}</strong> из <strong>{accruals.length}</strong>
            </Typography>
          </Box>

          {/* Quick Status Filter Pills Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64', mr: 0.5 }}>
              Статус:
            </Typography>
            <Chip
              label={`Все (${statusCounts.all})`}
              size="small"
              color={statusFilter === 'all' ? 'primary' : 'default'}
              variant={statusFilter === 'all' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('all')}
              sx={{ fontWeight: 600, cursor: 'pointer', ...(statusFilter === 'all' ? { bgcolor: '#0F3C64' } : {}) }}
            />
            <Chip
              label={`Начислено (${statusCounts.accrued})`}
              size="small"
              color={statusFilter === 'accrued' ? 'info' : 'default'}
              variant={statusFilter === 'accrued' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('accrued')}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            />
            <Chip
              label={`Утверждено (${statusCounts.approved})`}
              size="small"
              color={statusFilter === 'approved' ? 'warning' : 'default'}
              variant={statusFilter === 'approved' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('approved')}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            />
            <Chip
              label={`В ведомости (${statusCounts.in_sheet})`}
              size="small"
              color={statusFilter === 'in_sheet' ? 'primary' : 'default'}
              variant={statusFilter === 'in_sheet' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('in_sheet')}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            />
            <Chip
              label={`Выплачено (${statusCounts.paid})`}
              size="small"
              color={statusFilter === 'paid' ? 'success' : 'default'}
              variant={statusFilter === 'paid' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('paid')}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            />
            <Chip
              label={`Аннулировано (${statusCounts.storno})`}
              size="small"
              color={statusFilter === 'storno' ? 'error' : 'default'}
              variant={statusFilter === 'storno' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('storno')}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            />
          </Box>

          {/* MUI X DataGrid with Strict grid-improvements Standards */}
          <DataGrid
            autoHeight
            showToolbar
            rows={filteredAccruals}
            columns={viewMode === 'procedures' ? procedureColumns : staffColumns}
            loading={loading}
            checkboxSelection
            rowSelectionModel={selectedRowIds}
            onRowSelectionModelChange={(newModel) => setSelectedRowIds(newModel)}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } }
            }}
            localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
            getRowHeight={() => 'auto'}
            slots={{
              toolbar: PayoutGridToolbar as any,
              footer: PayoutGridFooter as any
            }}
            slotProps={{
              toolbar: {
                onResetFilters: () => {
                  setStatusFilter('all');
                  fetchAccruals();
                },
                onOpenWizard: () => setActiveTab(2),
                onPrint: handlePrint,
                onExportCsv: handleExportCsv,
                onBulkApprove: handleBulkApprove,
                onBulkCreateSheet: handleOpenCreateSheet,
                onBulkPay: handleBulkPay,
                onBulkAnnul: handleBulkAnnul,
                selectedCount: selectedIdsArray.length
              } as any,
              footer: {
                totalCount: gridTotals.totalCount,
                totalRevenue: gridTotals.totalRevenue,
                totalMaterials: gridTotals.totalMaterials,
                totalMargin: gridTotals.totalMargin,
                totalPayout: gridTotals.totalPayout,
                totalClinicProfit: gridTotals.totalClinicProfit,
                viewMode
              } as any
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
                color: '#0F3C64',
                fontWeight: 700
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center'
              }
            }}
          />
        </Paper>
      )}

      {/* TAB 1: SHEETS REGISTRY */}
      {activeTab === 1 && (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Реестр ведомостей выплат (Payroll Sheets)
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Официальные сводные документы клиники для бухгалтерии и выдачи вознаграждения
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ReceiptLongIcon />}
              onClick={fetchSheets}
              size="small"
              sx={{ fontWeight: 600 }}
            >
              Обновить реестр
            </Button>
          </Box>

          <DataGrid
            autoHeight
            rows={sheets}
            columns={sheetColumns}
            loading={sheetsLoading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } }
            }}
            localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
            getRowHeight={() => 'auto'}
            sx={{
              width: '100%',
              border: 'none',
              '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' },
              '& .MuiDataGrid-columnHeaders': {
                position: 'sticky',
                top: 0,
                zIndex: 1,
                bgcolor: '#F8FAFC',
                color: '#0F3C64',
                fontWeight: 700
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center'
              }
            }}
          />
        </Paper>
      )}

      {/* TAB 2: WIZARD */}
      {activeTab === 2 && (
        <PayoutCalculationWizard
          onCalculationCommitted={() => {
            fetchAccruals();
            setActiveTab(0);
          }}
          onCancel={() => setActiveTab(0)}
        />
      )}

      {/* TAB 3: BI DASHBOARD */}
      {activeTab === 3 && (
        <PayoutBiDashboard />
      )}

      {/* TAB 4: SCHEMES & RATES */}
      {activeTab === 4 && (
        <PayoutSchemeEditor />
      )}

      {/* DIALOG: CREATE PAYOUT SHEET */}
      <Dialog open={sheetDialogOpen} onClose={() => setSheetDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptLongIcon sx={{ color: '#0284C7' }} />
          Формирование ведомости
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Выбрано строк к включению в ведомость: <strong>{selectedIdsArray.length}</strong>.
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Если выбрано несколько специалистов, система автоматически создаст персональную расчетную ведомость для каждого из них.
          </Typography>
          <TextField
            label="Примечание / назначение ведомости"
            fullWidth
            multiline
            rows={2}
            value={sheetNotes}
            onChange={(e) => setSheetNotes(e.target.value)}
            placeholder="Например: Выплата за первую декаду текущего месяца"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSheetDialogOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={handleConfirmCreateSheet}
            disabled={creatingSheet}
            sx={{ bgcolor: '#0284C7', fontWeight: 600, '&:hover': { bgcolor: '#0369A1' } }}
          >
            {creatingSheet ? 'Формирование...' : 'Сформировать ведомость'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: CONFIRM PAYMENT ORDER */}
      <Dialog open={payOrderDialogOpen} onClose={() => setPayOrderDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentsIcon sx={{ color: '#16A34A' }} />
          Отметка о выплате
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {targetSheetForPay && (
            <>
              <Typography variant="body2" sx={{ color: '#334155' }}>
                Ведомость: <strong>{targetSheetForPay.sheet_number}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155' }}>
                Сотрудник: <strong>{targetSheetForPay.staff_name}</strong>
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                Сумма к выплате: {formatCurrency(targetSheetForPay.total_payout_amount)}
              </Typography>
            </>
          )}
          <TextField
            label="Номер платежного поручения / кассового ордера"
            fullWidth
            value={paymentOrderNum}
            onChange={(e) => setPaymentOrderNum(e.target.value)}
            placeholder="ПП-123456 от 10.10.2026"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPayOrderDialogOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              if (targetSheetForPay) {
                handleUpdateSheetStatus(targetSheetForPay.id, 'paid', paymentOrderNum);
                setPayOrderDialogOpen(false);
              }
            }}
            sx={{ fontWeight: 600 }}
          >
            Подтвердить выплату
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT ACCRUAL DIALOG */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F3C64' }}>
          Корректировка начисления №{editingAccrual?.id}
        </DialogTitle>
        {editingAccrual && (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Typography variant="body2" sx={{ color: '#4A5568' }}>
              Сотрудник: <strong>{editingAccrual.staff_name}</strong> ({editingAccrual.role_in_procedure})
            </Typography>
            <Typography variant="body2" sx={{ color: '#4A5568' }}>
              Сервис: <strong>{editingAccrual.operation_name}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: '#156C9C' }}>
              Маржинальная база: <strong>{formatCurrency(editingAccrual.margin_base)}</strong>
            </Typography>

            <TextField
              label="Процент выплаты (%)"
              type="number"
              fullWidth
              value={editingAccrual.payout_percent}
              onChange={e => setEditingAccrual({ ...editingAccrual, payout_percent: Number(e.target.value) })}
            />

            <TextField
              label="Ручная корректировка / премия (+/- руб)"
              type="number"
              fullWidth
              value={editingAccrual.manual_adjustment || 0}
              onChange={e => setEditingAccrual({ ...editingAccrual, manual_adjustment: Number(e.target.value) })}
            />

            <FormControl fullWidth>
              <InputLabel id="accrual-status-label">Статус начисления</InputLabel>
              <Select
                labelId="accrual-status-label"
                label="Статус начисления"
                value={editingAccrual.status || 'accrued'}
                onChange={e => setEditingAccrual({ ...editingAccrual, status: e.target.value })}
              >
                <MenuItem value="accrued">Начислено</MenuItem>
                <MenuItem value="approved">Утверждено</MenuItem>
                <MenuItem value="in_sheet">В ведомости</MenuItem>
                <MenuItem value="paid">Выплачено</MenuItem>
                <MenuItem value="storno">Аннулировано</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Заметки и обоснование корректировки"
              multiline
              rows={2}
              fullWidth
              value={editingAccrual.notes || ''}
              onChange={e => setEditingAccrual({ ...editingAccrual, notes: e.target.value })}
            />
          </DialogContent>
        )}
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveEditAccrual} sx={{ bgcolor: '#0F3C64' }}>
            Сохранить изменения
          </Button>
        </DialogActions>
      </Dialog>

      {/* HIDDEN PRINT CONTAINER (Conforms to report-generation skill) */}
      <Box sx={{ display: 'none' }}>
        <StaffPayoutReportTemplate ref={printRef} data={printData} />
      </Box>

      {/* SNACKBAR NOTIFICATION */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
      />
    </Box>
  );
}
