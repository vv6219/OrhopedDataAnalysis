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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

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

  useEffect(() => {
    if (activeTab === 0) {
      fetchAccruals();
    }
  }, [activeTab, viewMode]);

  const toggleRowExpand = (rowId: number) => {
    setExpandedRowIds(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const formatCurrency = (val: number) => {
    return Math.round(val || 0).toLocaleString('ru-RU') + ' ₽';
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

  // Prepare and trigger PDF Print
  const handlePrint = async () => {
    if (selectedIdsArray.length === 0) return;

    let printItems: any[] = [];
    let staffName = 'Медицинский персонал клиники';
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

    let headers = ['ID', 'Дата', 'Пациент', 'Операция', 'Выручка (руб)', 'Расходники*1.15', 'Маржа (руб)'];
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

  // Delete accrual handler
  const handleDeleteAccrual = async (accrualId: number) => {
    if (!confirm('Вы уверены, что хотите аннулировать данное начисление?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/accruals/${accrualId}`, { method: 'DELETE' });
      if (res.ok) {
        setSnackbarMessage('Начисление успешно аннулировано');
        fetchAccruals();
      }
    } catch (err: any) {
      alert('Ошибка при удалении: ' + err.message);
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
      headerName: 'Медицинская услуга / операция',
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
      headerName: 'Медицинская услуга',
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
      field: 'status',
      headerName: 'Статус',
      flex: 1,
      minWidth: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        let label = 'Начислено';
        let color: 'default' | 'info' | 'success' | 'warning' = 'info';
        if (params.value === 'approved') { label = 'Утверждено'; color = 'warning'; }
        if (params.value === 'paid') { label = 'Выплачено'; color = 'success'; }
        if (params.value === 'in_sheet') { label = 'В ведомости'; color = 'info'; }
        return <Chip size="small" label={label} color={color} variant="outlined" />;
      }
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
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
            color="error"
            onClick={() => handleDeleteAccrual(params.row.id)}
            title="Аннулировать"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Header Card */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              Расчет выплат медицинскому персоналу
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Индивидуальное вознаграждение врачей и операционных медсестер на базе маржинального дохода процедур
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AutoFixHighIcon />}
            onClick={() => setActiveTab(1)}
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
          <Tab icon={<AutoFixHighIcon />} iconPosition="start" label="Мастер расчета (Wizard)" />
          <Tab icon={<BarChartIcon />} iconPosition="start" label="BI Аналитика выплат" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Схемы и персональные ставки" />
        </Tabs>
      </Paper>

      {/* TAB 0: DATAGRID REGISTRY */}
      {activeTab === 0 && (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
          {/* View Mode Toggle Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64', mr: 1 }}>
                Разрез отображения:
              </Typography>
              <Chip
                label="По процедурам (Бригадный вид)"
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
              Всего строк: <strong>{accruals.length}</strong>
            </Typography>
          </Box>

          {/* MUI X DataGrid with Strict grid-improvements Standards */}
          <DataGrid
            autoHeight
            showToolbar
            rows={accruals}
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
                onResetFilters: () => fetchAccruals(),
                onOpenWizard: () => setActiveTab(1),
                onPrint: handlePrint,
                onExportCsv: handleExportCsv,
                onBulkApprove: handleBulkApprove,
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

      {/* TAB 1: WIZARD */}
      {activeTab === 1 && (
        <PayoutCalculationWizard
          onCalculationCommitted={() => {
            fetchAccruals();
            setActiveTab(0);
          }}
          onCancel={() => setActiveTab(0)}
        />
      )}

      {/* TAB 2: BI DASHBOARD */}
      {activeTab === 2 && (
        <PayoutBiDashboard />
      )}

      {/* TAB 3: SCHEMES & RATES */}
      {activeTab === 3 && (
        <PayoutSchemeEditor />
      )}

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
              Процедура: <strong>{editingAccrual.operation_name}</strong>
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
                <MenuItem value="paid">Выплачено</MenuItem>
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
