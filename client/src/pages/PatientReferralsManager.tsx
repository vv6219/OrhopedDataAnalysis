import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import type { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import HistoryIcon from '@mui/icons-material/History';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useReactToPrint } from 'react-to-print';

import OrthoReferralPrintTemplate from '../components/reports/OrthoReferralPrintTemplate';
import type { OrthoReferralData } from '../components/reports/OrthoReferralPrintTemplate';
import { exportReferralToDocx } from '../utils/referralDocxExport';
import LatexText from '../components/ortho/LatexText';
import { resolveClinicalProtocolText } from '../utils/clinicalProtocolResolver';
import { COMMON_PRINT_PAGE_STYLE } from '../utils/printStyles';
import { useAuth } from '../context/AuthContext';

interface ReferralRow {
  id: number;
  referral_number: string;
  patient_id: number;
  appointment_id?: number;
  protocol_id?: number;
  doctor_name: string;
  issue_date: string;
  valid_days: number;
  expires_at: string;
  performer_id: number;
  performer_name: string;
  performer_is_internal: number | boolean;
  performer_address?: string;
  icd10_code: string;
  icd10_name?: string;
  clinical_diagnosis: string;
  target_joint?: string;
  target_side?: string;
  anamnesis_summary?: string;
  preparation_instructions?: string;
  special_notes?: string;
  status: 'issued' | 'in_progress' | 'completed' | 'cancelled';
  verification_hash?: string;
  printed_count: number;
  items_count?: number;
  patient_name?: string;
  patient_birth_date?: string;
  patient_phone?: string;
}

// Module-level custom toolbar complying strictly with grid-improvements skill
interface ReferralsToolbarProps {
  onResetFilters: () => void;
  selectedCount?: number;
  totalCount?: number;
  onBulkPrint?: () => void;
  onBulkDocx?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  bulkLoading?: boolean;
}

function CustomReferralsToolbar({
  onResetFilters,
  selectedCount = 0,
  totalCount = 0,
  onBulkPrint,
  onBulkDocx,
  onSelectAll,
  onDeselectAll,
  bulkLoading = false
}: ReferralsToolbarProps) {
  return (
    <GridToolbarContainer
      sx={{
        p: 1.5,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #E2E8F0',
        bgcolor: '#F8FAFC'
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport
          printOptions={{ disableToolbarButton: true }}
          csvOptions={{ fileName: `Реестр_направлений_${new Date().toISOString().slice(0, 10)}`, utf8WithBom: true }}
        />
        <Button
          size="small"
          startIcon={<FilterAltOffIcon />}
          onClick={onResetFilters}
          sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600 }}
        >
          Сбросить фильтры
        </Button>

        {/* Quick Select All / Deselect All for print list */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, ml: { xs: 0, sm: 0.5 }, bgcolor: '#FFFFFF', px: 1, py: 0.3, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
          <Button
            size="small"
            onClick={onSelectAll}
            disabled={totalCount === 0 || selectedCount === totalCount}
            sx={{ textTransform: 'none', color: '#0F3C64', fontWeight: 700, fontSize: '0.8rem', p: 0.3 }}
          >
            Выбрать все
          </Button>
          <Typography variant="caption" sx={{ color: '#CBD5E1' }}>|</Typography>
          <Button
            size="small"
            onClick={onDeselectAll}
            disabled={selectedCount === 0}
            sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600, fontSize: '0.8rem', p: 0.3 }}
          >
            Снять все
          </Button>
        </Box>

        {selectedCount > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: { xs: 0, md: 1 } }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={onBulkPrint}
              disabled={bulkLoading}
              sx={{
                bgcolor: '#0F3C64',
                color: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.82rem',
                borderRadius: 1.5,
                boxShadow: '0 2px 6px rgba(15, 60, 100, 0.2)',
                '&:hover': { bgcolor: '#0B2D4B' }
              }}
            >
              Печать выбранных ({selectedCount} бланков)
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={onBulkDocx}
              disabled={bulkLoading}
              sx={{
                borderColor: '#1D4ED8',
                color: '#1D4ED8',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.82rem',
                borderRadius: 1.5,
                '&:hover': { bgcolor: '#EFF6FF' }
              }}
            >
              Word ({selectedCount} док.)
            </Button>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          minWidth: 260,
          '& .MuiInputBase-root': {
            bgcolor: '#FFFFFF',
            borderRadius: 1.5,
            fontSize: '0.85rem'
          }
        }}
      >
        <GridToolbarQuickFilter debounceMs={300} />
      </Box>
    </GridToolbarContainer>
  );
}

// Module-level custom footer displaying accounting totals and breakdown
interface ReferralsFooterProps {
  totalCount: number;
  issuedCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  internalCount: number;
  externalCount: number;
}

function CustomReferralsFooter({
  totalCount,
  issuedCount,
  inProgressCount,
  completedCount,
  cancelledCount,
  internalCount,
  externalCount
}: ReferralsFooterProps) {
  return (
    <Box
      sx={{
        p: 1.75,
        px: 2.5,
        borderTop: '2px solid #CBD5E1',
        bgcolor: '#F8FAFC',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
          Всего в выборке: {totalCount}
        </Typography>
        <Divider orientation="vertical" flexItem sx={{ height: 18, my: 'auto' }} />
        <Chip size="small" label={`Действующих: ${issuedCount + inProgressCount}`} sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700 }} />
        <Chip size="small" label={`Исполнено: ${completedCount}`} sx={{ bgcolor: '#F0FDF4', color: '#15803D', fontWeight: 700 }} />
        {cancelledCount > 0 && (
          <Chip size="small" label={`Аннулировано: ${cancelledCount}`} sx={{ bgcolor: '#FEF2F2', color: '#B91C1C', fontWeight: 700 }} />
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
          Маршрутизация:
        </Typography>
        <Chip size="small" variant="outlined" label={`Внутренние: ${internalCount}`} sx={{ fontWeight: 700, borderColor: '#15803D', color: '#15803D' }} />
        <Chip size="small" variant="outlined" label={`Внешние: ${externalCount}`} sx={{ fontWeight: 700, borderColor: '#B45309', color: '#B45309' }} />
      </Box>
    </Box>
  );
}

// Helper to convert DB referral record to OrthoReferralData
function mapReferralToPrintData(ref: any): OrthoReferralData {
  return {
    id: ref.id,
    referral_number: ref.referral_number,
    issue_date: ref.issue_date,
    valid_days: ref.valid_days || 90,
    expires_at: ref.expires_at,
    doctor_name: ref.doctor_name || '',
    doctor_specialization: ref.doctor_specialization || '',
    performer_id: ref.performer_id,
    performer_name: ref.performer_name,
    performer_is_internal: ref.performer_is_internal,
    performer_address: ref.performer_address,
    patient: {
      id: ref.patient_id,
      fullName: ref.patient_name || 'Пациент',
      birthDate: ref.patient_birth_date,
      phone: ref.patient_phone
    },
    icd10_code: ref.icd10_code,
    clinical_diagnosis: ref.clinical_diagnosis,
    target_joint: ref.target_joint,
    target_side: ref.target_side,
    anamnesis_summary: ref.anamnesis_summary,
    preparation_instructions: ref.preparation_instructions,
    special_notes: ref.special_notes,
    verification_hash: ref.verification_hash,
    items: ref.items || []
  };
}

export default function PatientReferralsManager() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const operatorName = currentUser?.fullName || 'Сотрудник клиники';
  const queryPatientId = searchParams.get('patientId');

  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [performerFilter, setPerformerFilter] = useState('');

  // Selected for Drawer & Audit
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Status Change Dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetStatusReferral, setTargetStatusReferral] = useState<ReferralRow | null>(null);
  const [newStatusValue, setNewStatusValue] = useState<'issued' | 'in_progress' | 'completed' | 'cancelled'>('completed');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Multi-selection state for batch printing & export
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const selectedIdsArray = useMemo(() => {
    if (Array.isArray(selectedRowIds)) return selectedRowIds;
    if (selectedRowIds && (selectedRowIds as any).ids instanceof Set) return Array.from((selectedRowIds as any).ids);
    return [];
  }, [selectedRowIds]);

  // Printing hidden state
  const printComponentRef = useRef<HTMLDivElement>(null);
  const [printDataList, setPrintDataList] = useState<OrthoReferralData[]>([]);
  const [pendingPrintTrigger, setPendingPrintTrigger] = useState<number | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: printDataList.length === 1
      ? `Направление_${printDataList[0]?.referral_number || ''}_${printDataList[0]?.patient?.fullName || 'Пациент'}`
      : `Направления_${printDataList.length}_бланков`,
    pageStyle: COMMON_PRINT_PAGE_STYLE
  });

  useEffect(() => {
    if (printDataList.length > 0 && pendingPrintTrigger) {
      handlePrint();
      setPendingPrintTrigger(null);
    }
  }, [printDataList, pendingPrintTrigger, handlePrint]);

  // Fetch referrals list
  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/ortho/referrals';
      if (queryPatientId) {
        url = `/api/ortho/referrals/patient/${queryPatientId}`;
      } else {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.append('search', searchTerm.trim());
        if (statusFilter) params.append('status', statusFilter);
        if (performerFilter !== '') params.append('is_internal', performerFilter);
        if (params.toString()) url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.referrals)) {
        setRows(data.referrals);
      } else {
        setRows([]);
      }
    } catch (err: any) {
      console.error('Failed to load referrals:', err);
      setToastMessage(`Ошибка загрузки направлений: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [queryPatientId, searchTerm, statusFilter, performerFilter]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Load single referral details for Drawer
  const handleOpenDrawer = async (row: ReferralRow) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setSelectedReferral(null);
    try {
      const res = await fetch(`/api/ortho/referrals/${row.id}`);
      const data = await res.json();
      if (data.success && data.referral) {
        setSelectedReferral(data.referral);
      } else {
        setSelectedReferral(row);
      }
    } catch (err) {
      console.error('Failed to load referral details:', err);
      setSelectedReferral(row);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Quick Print from row
  const handleRowPrint = async (row: ReferralRow) => {
    try {
      const res = await fetch(`/api/ortho/referrals/${row.id}`);
      const data = await res.json();
      if (!data.success || !data.referral) throw new Error('Не удалось получить данные направления');

      const formatted = mapReferralToPrintData(data.referral);
      setPrintDataList([formatted]);
      setPendingPrintTrigger(Date.now());

      // Audit print
      fetch(`/api/ortho/referrals/${row.id}/audit-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performed_by_name: operatorName, format: 'pdf', notes: 'Повторная печать из реестра' })
      }).catch(e => console.error(e));

      setToastMessage(`Бланк направления ${row.referral_number} отправлен на печать`);
    } catch (err: any) {
      setToastMessage(`Ошибка печати: ${err.message}`);
    }
  };

  // Quick Word export from row
  const handleRowExportDocx = async (row: ReferralRow) => {
    try {
      const res = await fetch(`/api/ortho/referrals/${row.id}`);
      const data = await res.json();
      if (!data.success || !data.referral) throw new Error('Не удалось получить данные направления');

      const formatted = mapReferralToPrintData(data.referral);
      await exportReferralToDocx(formatted);

      // Audit export
      fetch(`/api/ortho/referrals/${row.id}/audit-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performed_by_name: operatorName, format: 'docx', notes: 'Экспорт DOCX из реестра' })
      }).catch(e => console.error(e));

      setToastMessage(`Документ Word (.docx) направления ${row.referral_number} успешно сформирован`);
    } catch (err: any) {
      setToastMessage(`Ошибка экспорта DOCX: ${err.message}`);
    }
  };

  // Bulk Print: prints each selected referral as an individual document with page break
  const handleBulkPrint = async () => {
    const ids = selectedIdsArray;
    if (ids.length === 0) return;

    setBulkProcessing(true);
    setToastMessage(`Подготовка ${ids.length} бланков к печати...`);
    try {
      const list: OrthoReferralData[] = [];
      for (const id of ids) {
        const res = await fetch(`/api/ortho/referrals/${id}`);
        const data = await res.json();
        if (data.success && data.referral) {
          list.push(mapReferralToPrintData(data.referral));

          // Audit
          fetch(`/api/ortho/referrals/${id}/audit-print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ performed_by_name: operatorName, format: 'pdf', notes: 'Групповая печать бланков из реестра' })
          }).catch(e => console.error(e));
        }
      }

      if (list.length === 0) {
        throw new Error('Не удалось загрузить данные выбранных направлений');
      }

      setPrintDataList(list);
      setPendingPrintTrigger(Date.now());
      setToastMessage(`Отправлено на печать: ${list.length} отдельных бланков`);
    } catch (err: any) {
      console.error('Bulk print error:', err);
      setToastMessage(`Ошибка групповой печати: ${err.message}`);
    } finally {
      setBulkProcessing(false);
    }
  };

  // Bulk Word (.docx) Export: exports all selected into separate sections in Word
  const handleBulkDocx = async () => {
    const ids = selectedIdsArray;
    if (ids.length === 0) return;

    setBulkProcessing(true);
    setToastMessage(`Формирование Word документа для ${ids.length} направлений...`);
    try {
      const list: OrthoReferralData[] = [];
      for (const id of ids) {
        const res = await fetch(`/api/ortho/referrals/${id}`);
        const data = await res.json();
        if (data.success && data.referral) {
          list.push(mapReferralToPrintData(data.referral));

          // Audit
          fetch(`/api/ortho/referrals/${id}/audit-print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ performed_by_name: operatorName, format: 'docx', notes: 'Групповой экспорт в Word из реестра' })
          }).catch(e => console.error(e));
        }
      }

      if (list.length === 0) {
        throw new Error('Не удалось загрузить данные выбранных направлений');
      }

      await exportReferralToDocx(list);
      setToastMessage(`Успешно экспортировано ${list.length} направлений в Word`);
    } catch (err: any) {
      console.error('Bulk docx export error:', err);
      setToastMessage(`Ошибка экспорта в Word: ${err.message}`);
    } finally {
      setBulkProcessing(false);
    }
  };

  // Open Status Change Dialog
  const handleOpenStatusDialog = (row: ReferralRow) => {
    setTargetStatusReferral(row);
    setNewStatusValue(row.status === 'issued' ? 'completed' : 'cancelled');
    setStatusChangeReason('');
    setStatusDialogOpen(true);
  };

  // Confirm Status Change
  const handleConfirmStatusChange = async () => {
    if (!targetStatusReferral) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/ortho/referrals/${targetStatusReferral.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatusValue,
          reason: statusChangeReason.trim(),
          performed_by: operatorName
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Ошибка смены статуса');

      setToastMessage(data.message || 'Статус успешно обновлен');
      setStatusDialogOpen(false);
      fetchReferrals();
      if (selectedReferral && selectedReferral.id === targetStatusReferral.id) {
        handleOpenDrawer(targetStatusReferral);
      }
    } catch (err: any) {
      setToastMessage(`Ошибка: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPerformerFilter('');
  };

  const handleSelectAllRows = () => {
    setSelectedRowIds({ type: 'include', ids: new Set(rows.map(r => r.id)) });
  };

  const handleDeselectAllRows = () => {
    setSelectedRowIds({ type: 'include', ids: new Set() });
  };

  // Calculate remaining days from 90
  const getDaysLeftBadge = (expiresAtStr: string) => {
    if (!expiresAtStr) return null;
    const expDate = new Date(expiresAtStr);
    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return (
        <Chip
          size="small"
          label="Срок истек"
          sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 800, fontSize: '0.72rem' }}
        />
      );
    } else if (diffDays <= 15) {
      return (
        <Chip
          size="small"
          label={`Истекает (${diffDays} дн.)`}
          sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '0.72rem' }}
        />
      );
    } else {
      return (
        <Chip
          size="small"
          label={`Осталось ${diffDays} дн.`}
          sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700, fontSize: '0.72rem' }}
        />
      );
    }
  };

  // Status Chip helper
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'issued':
        return <Chip size="small" label="Выписано" sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 800 }} />;
      case 'in_progress':
        return <Chip size="small" label="В процессе" sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 800 }} />;
      case 'completed':
        return <Chip size="small" label="Исполнено" sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800 }} />;
      case 'cancelled':
        return <Chip size="small" label="Аннулировано" sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 800 }} />;
      default:
        return <Chip size="small" label={status} />;
    }
  };

  // Aggregated totals
  const totalCount = rows.length;
  const issuedCount = rows.filter(r => r.status === 'issued').length;
  const inProgressCount = rows.filter(r => r.status === 'in_progress').length;
  const completedCount = rows.filter(r => r.status === 'completed').length;
  const cancelledCount = rows.filter(r => r.status === 'cancelled').length;
  const internalCount = rows.filter(r => Number(r.performer_is_internal) === 1).length;
  const externalCount = rows.filter(r => Number(r.performer_is_internal) === 0).length;

  // DataGrid Columns
  const columns: GridColDef<ReferralRow>[] = useMemo(() => [
    {
      field: 'referral_number',
      headerName: 'Номер / Дата',
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => (
        <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
            {params.row.referral_number}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            от {params.row.issue_date ? new Date(params.row.issue_date).toLocaleDateString('ru-RU') : '—'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'expires_at',
      headerName: 'Срок действия (90 дн.)',
      flex: 1.3,
      minWidth: 160,
      renderCell: (params) => (
        <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
            {getDaysLeftBadge(params.row.expires_at)}
          </Box>
          <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
            до {params.row.expires_at ? new Date(params.row.expires_at).toLocaleDateString('ru-RU') : '—'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'patient_name',
      headerName: 'Пациент',
      flex: 1.6,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
            {params.row.patient_name || `Пациент #${params.row.patient_id}`}
          </Typography>
          {params.row.patient_phone && (
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              Тел: {params.row.patient_phone}
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: 'performer_name',
      headerName: 'Исполнитель / Куда',
      flex: 1.6,
      minWidth: 190,
      renderCell: (params) => {
        const isInternal = Boolean(Number(params.row.performer_is_internal) === 1);
        return (
          <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
              <Chip
                size="small"
                label={isInternal ? 'Внутренний' : 'Внешний'}
                sx={{
                  height: 18,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  bgcolor: isInternal ? '#DCFCE7' : '#FEF3C7',
                  color: isInternal ? '#166534' : '#92400E'
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
              {params.row.performer_name}
            </Typography>
            {params.row.performer_address && (
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                {params.row.performer_address}
              </Typography>
            )}
          </Box>
        );
      }
    },
    {
      field: 'clinical_diagnosis',
      headerName: 'Клинический диагноз',
      flex: 2,
      minWidth: 220,
      renderCell: (params) => (
        <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.2 }}>
            <Chip
              size="small"
              label={params.row.icd10_code || 'МКБ-10'}
              sx={{ height: 18, fontSize: '0.7rem', fontWeight: 800, bgcolor: '#E0F2FE', color: '#0369A1' }}
            />
            {params.row.target_joint && (
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                {params.row.target_joint}
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.84rem' }}>
            {params.row.clinical_diagnosis}
          </Typography>
        </Box>
      )
    },
    {
      field: 'items_count',
      headerName: 'Позиций',
      flex: 0.8,
      minWidth: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.row.items_count || 1}
          sx={{ fontWeight: 700, bgcolor: '#F1F5F9', color: '#334155' }}
        />
      )
    },
    {
      field: 'status',
      headerName: 'Статус',
      flex: 1.1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => getStatusChip(params.row.status)
    },
    {
      field: 'actions',
      headerName: 'Действия',
      flex: 1.8,
      minWidth: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.5 }}>
          <Tooltip title="Быстрая печать официального бланка (PDF)">
            <IconButton size="small" onClick={() => handleRowPrint(params.row)} sx={{ color: '#0F3C64' }}>
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Скачать в формате Microsoft Word (.docx)">
            <IconButton size="small" onClick={() => handleRowExportDocx(params.row)} sx={{ color: '#1D4ED8' }}>
              <DescriptionIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Сменить статус (Исполнено / Аннулировано)">
            <IconButton size="small" onClick={() => handleOpenStatusDialog(params.row)} sx={{ color: '#15803D' }}>
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Подробная информация и аудит-лог">
            <IconButton size="small" onClick={() => handleOpenDrawer(params.row)} sx={{ color: '#475569' }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ], []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* 1. TOP HEADER */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 2.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#F1F5F9' }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AssignmentIcon sx={{ color: '#0F3C64', fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F3C64', letterSpacing: '-0.3px' }}>
                Реестр Протоколов и направлений пациентов
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
              Центр Ортопедии и Травматологии Добрушкина • Контроль 90-дневного срока действия, многоформатный экспорт и аудит-лог
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate('/ortho-workstation')}
            sx={{
              bgcolor: '#0F3C64',
              color: '#FFFFFF',
              fontWeight: 800,
              textTransform: 'none',
              px: 2.5,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(15, 60, 100, 0.25)',
              '&:hover': { bgcolor: '#0B2D4B' }
            }}
          >
            АРМ врача (Новый прием)
          </Button>
        </Box>
      </Paper>

      {/* DUAL NAVIGATION TABS */}
      <Paper elevation={0} sx={{ mb: 2.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2, px: 2, pt: 1 }}>
        <Tabs
          value={1}
          onChange={(_, val) => {
            if (val === 0) navigate('/protocols-registry');
          }}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            label="1. Протоколы приёмов (АРМ Врача)"
            icon={<DescriptionIcon />}
            iconPosition="start"
            sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }}
          />
          <Tab
            label="2. Направления пациентов (90 дней)"
            icon={<AssignmentIcon />}
            iconPosition="start"
            sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }}
          />
        </Tabs>
      </Paper>

      {/* 2. STATS OVERVIEW CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Всего направлений
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F3C64', mt: 0.5 }}>
              {totalCount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569' }}>
              в текущей выборке
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
              Действующих (Срок 90 дн.)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#15803D', mt: 0.5 }}>
              {issuedCount + inProgressCount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#166534' }}>
              активны для прохождения
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Внутренние процедуры
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0284C7', mt: 0.5 }}>
              {internalCount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569' }}>
              кабинеты и ЛФК Центра
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Внешние направления
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#D97706', mt: 0.5 }}>
              {externalCount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569' }}>
              МРТ, КТ, стационары, КДЛ
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 3. MAIN DATA GRID CONTAINER */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 2.5,
          overflow: 'hidden',
          width: '100%',
          '& .MuiDataGrid-virtualScroller': { overflowX: 'hidden' },
          '& .MuiDataGrid-columnHeaders': {
            position: 'sticky',
            top: 0,
            zIndex: 1,
            bgcolor: '#F8FAFC',
            borderBottom: '2px solid #E2E8F0'
          }
        }}
      >
        <DataGrid
          autoHeight
          showToolbar
          rows={rows}
          columns={columns}
          loading={loading}
          checkboxSelection
          rowSelectionModel={selectedRowIds}
          onRowSelectionModelChange={(newModel) => setSelectedRowIds(newModel)}
          getRowHeight={() => 'auto'}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
            sorting: { sortModel: [{ field: 'referral_number', sort: 'desc' }] }
          }}
          slots={{
            toolbar: CustomReferralsToolbar as any,
            footer: CustomReferralsFooter as any
          }}
          slotProps={{
            toolbar: {
              onResetFilters: handleResetFilters,
              selectedCount: selectedIdsArray.length,
              totalCount: rows.length,
              onBulkPrint: handleBulkPrint,
              onBulkDocx: handleBulkDocx,
              onSelectAll: handleSelectAllRows,
              onDeselectAll: handleDeselectAllRows,
              bulkLoading: bulkProcessing
            } as any,
            footer: {
              totalCount,
              issuedCount,
              inProgressCount,
              completedCount,
              cancelledCount,
              internalCount,
              externalCount
            } as any
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderColor: '#F1F5F9',
              alignItems: 'flex-start',
              pt: 0.5
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: '#F8FAFC'
            }
          }}
        />
      </Paper>

      {/* 4. DETAILS & AUDIT TRAIL DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: { width: { xs: '100%', md: 620 }, p: 3, bgcolor: '#FFFFFF' }
          }
        }}
      >
        {selectedReferral ? (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '1px solid #E2E8F0' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                  {selectedReferral.referral_number}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Выписано: {selectedReferral.issue_date} • Действительно 90 дней
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={() => handleRowPrint(selectedReferral)}
                  sx={{ bgcolor: '#0F3C64', textTransform: 'none', fontWeight: 700 }}
                >
                  Печать PDF
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DescriptionIcon />}
                  onClick={() => handleRowExportDocx(selectedReferral)}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Word (.docx)
                </Button>
              </Box>
            </Box>

            {/* Validity Alert */}
            <Box sx={{ mb: 2.5 }}>
              {getDaysLeftBadge(selectedReferral.expires_at)}
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#15803D', mt: 0.8 }}>
                Срок действия: {selectedReferral.valid_days || 90} дней (до {selectedReferral.expires_at ? new Date(selectedReferral.expires_at).toLocaleDateString('ru-RU') : '—'})
              </Typography>
            </Box>

            {/* Patient & Diagnosis */}
            <Paper elevation={0} sx={{ p: 2, mb: 2.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1 }}>
                Информация о пациенте и диагнозе
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {selectedReferral.patient_name || selectedReferral.patient?.fullName || 'Пациент'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
                Дата рожд.: {selectedReferral.patient_birth_date || '—'} | Тел: {selectedReferral.patient_phone || '—'}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ color: '#334155' }}>
                <b>Диагноз:</b> [{selectedReferral.icd10_code}] {selectedReferral.clinical_diagnosis}
              </Typography>
              {selectedReferral.target_joint && (
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                  <b>Локализация:</b> {selectedReferral.target_joint} ({selectedReferral.target_side || 'сторона'})
                </Typography>
              )}
            </Paper>

            {/* Performer Details */}
            <Paper elevation={0} sx={{ p: 2, mb: 2.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1 }}>
                Исполнитель
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                {selectedReferral.performer_name}
              </Typography>
              <Chip
                size="small"
                label={Number(selectedReferral.performer_is_internal) === 1 ? 'Внутреннее подразделение Центра' : 'Внешняя организация'}
                sx={{
                  mt: 0.5,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  bgcolor: Number(selectedReferral.performer_is_internal) === 1 ? '#DCFCE7' : '#FEF3C7',
                  color: Number(selectedReferral.performer_is_internal) === 1 ? '#166534' : '#92400E'
                }}
              />
              {selectedReferral.performer_address && (
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                  Адрес: {selectedReferral.performer_address}
                </Typography>
              )}
            </Paper>

            {/* Prescribed Items Table */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1 }}>
              Назначенные исследования и процедуры
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', mb: 2.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>№</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Наименование</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Детали / Формула</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(selectedReferral.items || []).map((it: any, idx: number) => (
                    <TableRow key={it.id || idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{it.item_title}</Typography>
                        {it.service_code && <Chip size="small" label={it.service_code} sx={{ height: 18, fontSize: '0.68rem', mt: 0.3 }} />}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block', color: '#1E293B' }}>
                          {resolveClinicalProtocolText(it, {
                            targetJoint: selectedReferral.target_joint,
                            targetSide: selectedReferral.target_side,
                            diagnosis: selectedReferral.clinical_diagnosis
                          })}
                        </Typography>
                        {it.formula_latex && (
                          <Box sx={{ mt: 0.3, p: 0.4, bgcolor: '#FFFFFF', borderRadius: 1 }}>
                            <LatexText text={it.formula_latex} />
                          </Box>
                        )}
                        {it.preparation_notes && (
                          <Typography variant="caption" sx={{ color: '#B45309', display: 'block', mt: 0.3 }}>
                            <b>Подготовка:</b> {it.preparation_notes}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Audit Trail */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon sx={{ fontSize: 20 }} />
              Аудит-лог и история операций
            </Typography>
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              {(selectedReferral.audit_log || []).length === 0 ? (
                <Typography variant="caption" sx={{ color: '#64748B' }}>Нет записей аудита</Typography>
              ) : (
                (selectedReferral.audit_log || []).map((log: any) => (
                  <Box key={log.id} sx={{ mb: 1, pb: 1, borderBottom: '1px dashed #CBD5E1' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip size="small" label={log.action_type} sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }} />
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {log.created_at ? new Date(log.created_at).toLocaleString('ru-RU') : '—'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#334155', display: 'block', mt: 0.3 }}>
                      Выполнил: <b>{log.performed_by_name}</b>
                    </Typography>
                  </Box>
                ))
              )}
            </Paper>
          </Box>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              {drawerLoading ? 'Загрузка данных направления и аудит-лога...' : 'Направление не найдено'}
            </Typography>
          </Box>
        )}
      </Drawer>

      {/* 5. STATUS CHANGE DIALOG */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', pb: 1 }}>
          Изменение статуса направления
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#334155' }}>
            Направление: <b>{targetStatusReferral?.referral_number}</b> ({targetStatusReferral?.patient_name})
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Новый статус</InputLabel>
            <Select
              label="Новый статус"
              value={newStatusValue}
              onChange={(e) => setNewStatusValue(e.target.value as any)}
            >
              <MenuItem value="issued">Выписано (Активно)</MenuItem>
              <MenuItem value="in_progress">В процессе выполнения</MenuItem>
              <MenuItem value="completed">Исполнено (Услуги оказаны)</MenuItem>
              <MenuItem value="cancelled">Аннулировано</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            label="Причина изменения / Комментарий"
            value={statusChangeReason}
            onChange={(e) => setStatusChangeReason(e.target.value)}
            placeholder="Процедура выполнена в полном объеме..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setStatusDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmStatusChange}
            disabled={updatingStatus}
            sx={{ bgcolor: '#0F3C64', textTransform: 'none', fontWeight: 700 }}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6. HIDDEN PRINT COMPONENT */}
      <Box sx={{ display: 'none' }}>
        {printDataList.length > 0 && (
          <div ref={printComponentRef}>
            {printDataList.map((data, idx) => (
              <Box
                key={data.id || idx}
                className="page-break"
                sx={{
                  pageBreakAfter: idx < printDataList.length - 1 ? 'always' : 'auto',
                  breakAfter: idx < printDataList.length - 1 ? 'page' : 'auto'
                }}
              >
                <OrthoReferralPrintTemplate data={data} />
              </Box>
            ))}
          </div>
        )}
      </Box>

      {/* TOAST SNACKBAR */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />
    </Box>
  );
}
