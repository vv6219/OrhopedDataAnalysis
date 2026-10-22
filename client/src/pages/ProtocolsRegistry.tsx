import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Alert,
  Snackbar,
  InputAdornment,
  Tabs,
  Tab,
  Menu,
  Checkbox,
  FormControlLabel
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
import type { GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import EditNoteIcon from '@mui/icons-material/EditNote';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import LockIcon from '@mui/icons-material/Lock';
import UndoIcon from '@mui/icons-material/Undo';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import { useReactToPrint } from 'react-to-print';
import { API_BASE_URL } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';
import OrthoProtocolPrintTemplate from '../components/reports/OrthoProtocolPrintTemplate';
import type { OrthoProtocolData } from '../components/reports/OrthoProtocolPrintTemplate';
import OrthoReferralPrintTemplate, { type OrthoReferralData } from '../components/reports/OrthoReferralPrintTemplate';
import IssueReferralModal from '../components/ortho/IssueReferralModal';
import { parseProtocolContent, stripProtocolXml } from '../utils/protocolXmlParser';

export interface ProtocolRow {
  id: number;
  docn?: number;
  doctor_name?: string;
  pt_id: number;
  vdate: string;
  title: string;
  content: string;
  protocol_json?: string;
  status: 'draft' | 'signed' | 'revoked';
  vas_score?: number;
  primary_joint?: string;
  side?: string;
  is_signed?: number;
  signed_at?: string;
  signature_hash?: string;
  revocation_reason?: string;
  patient_name: string;
  patient_bdate?: string;
  patient_age?: number;
  patient_mednum?: string | number;
  patient_phone?: string;
  mkb_code?: string;
  mkb_name?: string;
  prescriptions_count?: number;
  total_prescriptions_amount?: number;
  referrals_count?: number;
  granted_doctors?: string;
  granted_doctor_ids?: string;
  is_owner?: boolean;
  is_granted?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_return_to_draft?: boolean;
  can_grant_access?: boolean;
}

// Module-level stable Custom Toolbar (per grid-improvements skill)
function ProtocolsCustomToolbar() {
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

// Module-level stable Custom Footer displaying accounting totals (per grid-improvements skill)
function ProtocolsCustomFooter({
  totalCount,
  signedCount,
  draftCount,
  revokedCount,
  totalPrescriptionsSum,
  selectedStatus,
  onFilterDrafts
}: {
  totalCount: number;
  signedCount: number;
  draftCount: number;
  revokedCount: number;
  totalPrescriptionsSum: number;
  selectedStatus?: string;
  onFilterDrafts?: () => void;
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
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
          Протоколов в выборке: {totalCount.toLocaleString('ru-RU')}
        </Typography>
        <Chip
          size="small"
          label={`Подписано ЭЦП: ${signedCount}`}
          sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }}
        />
        <Tooltip title="Нажмите, чтобы отфильтровать только черновики для завершения приема">
          <Chip
            size="small"
            clickable={Boolean(onFilterDrafts)}
            onClick={onFilterDrafts}
            icon={<MedicalServicesIcon sx={{ fontSize: '13px !important', color: selectedStatus === 'draft' ? '#FFFFFF !important' : '#92400E !important' }} />}
            label={`Черновиков: ${draftCount}`}
            sx={{
              bgcolor: selectedStatus === 'draft' ? '#D97706' : '#FEF3C7',
              color: selectedStatus === 'draft' ? '#FFFFFF' : '#92400E',
              fontWeight: 800,
              cursor: onFilterDrafts ? 'pointer' : 'default',
              border: '1px solid',
              borderColor: selectedStatus === 'draft' ? '#B45309' : '#FCD34D',
              boxShadow: selectedStatus === 'draft' ? '0 2px 5px rgba(217, 119, 6, 0.3)' : 'none',
              '&:hover': onFilterDrafts ? { bgcolor: selectedStatus === 'draft' ? '#B45309' : '#FDE68A' } : {}
            }}
          />
        </Tooltip>
        {revokedCount > 0 && (
          <Chip
            size="small"
            label={`Аннулировано: ${revokedCount}`}
            sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 700 }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
          Сумма назначений:
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
          {totalPrescriptionsSum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
        </Typography>
      </Box>
    </Box>
  );
}

export default function ProtocolsRegistry() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, hasPermission } = useAuth();

  const isSysadmin = hasPermission('sysadmin') || currentUser?.role === 'sysadmin';
  const isAdministrator = hasPermission('administrator') || currentUser?.role === 'admin' || currentUser?.role === 'administrator';

  // Registry state
  const [rows, setRows] = useState<ProtocolRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Doctors list for filtering and access grant
  const [doctorsList, setDoctorsList] = useState<Array<{ id: number; full_name: string; specialization?: string }>>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedJoint, setSelectedJoint] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [patientIdFilter, setPatientIdFilter] = useState(searchParams.get('patientId') || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Drawer Inspector State
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPrescriptions, setDrawerPrescriptions] = useState<any[]>([]);

  // Grant Access Dialog State (Administrator / Sysadmin)
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantProtocol, setGrantProtocol] = useState<ProtocolRow | null>(null);
  const [targetDoctorId, setTargetDoctorId] = useState<number | ''>('');
  const [grantReason, setGrantReason] = useState('');
  const [grantConfirmed, setGrantConfirmed] = useState(false);
  const [grantLoading, setGrantLoading] = useState(false);

  // Return to Draft Dialog State (Sysadmin only)
  const [returnDraftModalOpen, setReturnDraftModalOpen] = useState(false);
  const [protocolToReturn, setProtocolToReturn] = useState<ProtocolRow | null>(null);
  const [returnDraftReason, setReturnDraftReason] = useState('Исправление клинических данных');
  const [returnDraftLoading, setReturnDraftLoading] = useState(false);

  // Print Menu & Bundled Referrals State
  const [printMenuAnchor, setPrintMenuAnchor] = useState<null | HTMLElement>(null);
  const [printTargetRow, setPrintTargetRow] = useState<ProtocolRow | null>(null);
  const [bundledReferrals, setBundledReferrals] = useState<OrthoReferralData[]>([]);
  const [printWithReferrals, setPrintWithReferrals] = useState(false);

  // Load doctors catalog for filters & grant
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/ortho/doctors`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.doctors)) {
          setDoctorsList(d.doctors);
        }
      })
      .catch((err) => console.error('Error fetching doctors:', err));
  }, []);

  useEffect(() => {
    if (!selectedProtocol) {
      setDrawerPrescriptions([]);
      return;
    }
    let parsedJson: any = null;
    if (selectedProtocol.protocol_json) {
      try {
        parsedJson = JSON.parse(selectedProtocol.protocol_json);
      } catch (e) {
        // ignore
      }
    }
    if (parsedJson?.prescriptions && parsedJson.prescriptions.length > 0) {
      setDrawerPrescriptions(parsedJson.prescriptions);
    } else {
      fetch(`/api/ortho/prescriptions/${selectedProtocol.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.prescriptions)) {
            setDrawerPrescriptions(
              data.prescriptions.map((p: any) => ({
                name: p.title || p.name || 'Медицинская услуга',
                title: p.title || p.name || 'Медицинская услуга',
                code: p.service_code || p.code,
                quantity: p.quantity || 1,
                price: p.unit_price ?? p.price ?? 0,
                dosage_notes: p.category || ''
              }))
            );
          } else {
            setDrawerPrescriptions([]);
          }
        })
        .catch(() => setDrawerPrescriptions([]));
    }
  }, [selectedProtocol]);

  // Revoke Dialog State
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [protocolToRevoke, setProtocolToRevoke] = useState<ProtocolRow | null>(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  // Referral Issuance Modal State
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [referralModalProtocol, setReferralModalProtocol] = useState<ProtocolRow | null>(null);
  const [referralPrescriptions, setReferralPrescriptions] = useState<any[]>([]);

  const handleOpenReferralModal = async (row: ProtocolRow) => {
    setReferralModalProtocol(row);
    let parsedJson: any = null;
    if (row.protocol_json) {
      try {
        parsedJson = JSON.parse(row.protocol_json);
      } catch {
        // ignore
      }
    }

    if (parsedJson?.prescriptions && parsedJson.prescriptions.length > 0) {
      setReferralPrescriptions(parsedJson.prescriptions);
      setReferralModalOpen(true);
    } else {
      try {
        const res = await fetch(`/api/ortho/prescriptions/${row.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.prescriptions) && data.prescriptions.length > 0) {
          setReferralPrescriptions(
            data.prescriptions.map((p: any) => ({
              name: p.title || p.name || 'Медицинская услуга',
              title: p.title || p.name || 'Медицинская услуга',
              code: p.service_code || p.code,
              quantity: p.quantity || 1,
              price: p.unit_price ?? p.price ?? 0,
              dosage_notes: p.category || ''
            }))
          );
        } else {
          setReferralPrescriptions([]);
        }
      } catch {
        setReferralPrescriptions([]);
      }
      setReferralModalOpen(true);
    }
  };

  // Print ref for Drawer & Direct Print
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Протокол_${selectedProtocol?.patient_name || 'Пациент'}_${selectedProtocol?.id}`,
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

  // Fetch Protocols with FTS5, Filters, and RBAC
  const fetchProtocols = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        pageSize: String(pageSize),
        sortBy: 'vdate',
        sortOrder: 'DESC'
      });

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedJoint) params.append('joint', selectedJoint);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedDoctorId) params.append('doctorId', selectedDoctorId);
      if (patientIdFilter) params.append('patientId', patientIdFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`${API_BASE_URL}/api/ortho/registry?${params.toString()}`);
      if (!res.ok) throw new Error('Ошибка загрузки реестра протоколов');
      const data = await res.json();

      if (data.success) {
        setRows(data.rows || []);
        setTotalRows(data.total || 0);
      }
    } catch (err: any) {
      console.error('Error fetching registry:', err);
      setToastMessage(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, selectedJoint, selectedStatus, selectedDoctorId, patientIdFilter, startDate, endDate]);

  useEffect(() => {
    fetchProtocols();
  }, [fetchProtocols]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedJoint('');
    setSelectedStatus('');
    setSelectedDoctorId('');
    setPatientIdFilter('');
    setStartDate('');
    setEndDate('');
    setPage(0);
    setSearchParams({});
  };

  // Revoke / Delete protocol action
  const handleConfirmRevoke = async () => {
    if (!protocolToRevoke) return;
    setRevoking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ortho/protocols/${protocolToRevoke.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setToastMessage(data.message || 'Протокол успешно аннулирован');
      setRevokeDialogOpen(false);
      setProtocolToRevoke(null);
      setRevocationReason('');
      fetchProtocols();
    } catch (err: any) {
      setToastMessage(`Ошибка аннулирования: ${err.message}`);
    } finally {
      setRevoking(false);
    }
  };

  // Grant Access action (Admin / Sysadmin)
  const handleConfirmGrantAccess = async () => {
    if (!grantProtocol || !targetDoctorId || !grantReason.trim() || !grantConfirmed) return;
    setGrantLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ortho/protocols/${grantProtocol.id}/grant-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: targetDoctorId,
          reason: grantReason.trim()
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setToastMessage(data.message || 'Доступ врачу успешно предоставлен');
      setGrantModalOpen(false);
      setGrantProtocol(null);
      setTargetDoctorId('');
      setGrantReason('');
      setGrantConfirmed(false);
      fetchProtocols();
    } catch (err: any) {
      setToastMessage(`Ошибка: ${err.message}`);
    } finally {
      setGrantLoading(false);
    }
  };

  // Return to Draft action (Sysadmin only)
  const handleConfirmReturnToDraft = async () => {
    if (!protocolToReturn) return;
    setReturnDraftLoading(true);
    try {
      const token = localStorage.getItem('ortho_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/ortho/return-to-draft`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          protocolId: protocolToReturn.id,
          reason: returnDraftReason.trim() || 'Возврат для редактирования системным администратором'
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Ошибка сервера (${res.status})`);
      }

      setToastMessage(data.message || 'Протокол успешно возвращен в статус «Черновик»');
      setReturnDraftModalOpen(false);
      setProtocolToReturn(null);
      setReturnDraftReason('Исправление клинических данных');
      fetchProtocols();
    } catch (err: any) {
      setToastMessage(`Ошибка: ${err.message}`);
    } finally {
      setReturnDraftLoading(false);
    }
  };

  // Print Protocol Only
  const handlePrintProtocolOnly = (row: ProtocolRow) => {
    setPrintMenuAnchor(null);
    setPrintWithReferrals(false);
    setSelectedProtocol(row);
    setBundledReferrals([]);
    setTimeout(() => {
      handlePrintTrigger();
      fetch(`${API_BASE_URL}/api/ortho/protocols/${row.id}/log-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withReferrals: false })
      }).catch(() => {});
    }, 150);
  };

  // Print Protocol with bundled Referrals
  const handlePrintProtocolWithReferrals = async (row: ProtocolRow) => {
    setPrintMenuAnchor(null);
    setSelectedProtocol(row);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ortho/protocols/${row.id}/referrals`);
      const data = await res.json();
      if (data.success && Array.isArray(data.rows) && data.rows.length > 0) {
        setBundledReferrals(
          data.rows.map((r: any) => ({
            id: r.id,
            referral_number: r.referral_number,
            issue_date: r.issue_date,
            valid_days: r.valid_days,
            expires_at: r.expires_at,
            doctor_name: r.doctor_name,
            performer_id: r.performer_id,
            performer_name: r.performer_name,
            performer_is_internal: r.performer_is_internal,
            performer_address: r.performer_address,
            patient: {
              id: r.patient_id,
              fullName: r.patient_name || row.patient_name,
              birthDate: r.patient_birth_date || row.patient_bdate,
              phone: r.patient_phone || row.patient_phone,
              cardNum: String(row.patient_mednum || '')
            },
            icd10_code: r.icd10_code,
            icd10_name: r.icd10_name,
            clinical_diagnosis: r.clinical_diagnosis,
            target_joint: r.target_joint,
            target_side: r.target_side,
            anamnesis_summary: r.anamnesis_summary,
            preparation_instructions: r.preparation_instructions,
            special_notes: r.special_notes,
            items: r.items || []
          }))
        );
        setPrintWithReferrals(true);
      } else {
        setBundledReferrals([]);
        setPrintWithReferrals(false);
        setToastMessage('У данного протокола нет прикрепленных направлений. Печатается стандартный протокол.');
      }
    } catch {
      setBundledReferrals([]);
      setPrintWithReferrals(false);
    }
    setTimeout(() => {
      handlePrintTrigger();
      fetch(`${API_BASE_URL}/api/ortho/protocols/${row.id}/log-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withReferrals: true })
      }).catch(() => {});
    }, 200);
  };

  // Format Assembled Print Data for Drawer
  const assembledDrawerData: OrthoProtocolData | null = useMemo(() => {
    if (!selectedProtocol) return null;
    let parsedJson: any = {};
    if (selectedProtocol.protocol_json) {
      try {
        parsedJson = JSON.parse(selectedProtocol.protocol_json);
      } catch (e) {
        // ignore
      }
    }
    const parsedXml = parseProtocolContent(selectedProtocol.content);

    return {
      protocolNumber: selectedProtocol.id,
      visitDate: selectedProtocol.vdate,
      doctorName: selectedProtocol.doctor_name || '',
      doctorRole: (selectedProtocol as any).doctor_role,
      doctorSpecialization: (selectedProtocol as any).doctor_specialization,
      patient: {
        id: selectedProtocol.pt_id,
        fullName: selectedProtocol.patient_name,
        birthDate: selectedProtocol.patient_bdate,
        cardNum: String(selectedProtocol.patient_mednum || ''),
        phone: selectedProtocol.patient_phone
      },
      complaints: parsedJson.complaints || parsedXml.complaints || selectedProtocol.title || '',
      anamnesis: parsedJson.anamnesis || parsedXml.anamnesis || '',
      vasScore: selectedProtocol.vas_score || parsedJson.vasScore || 0,
      gait: parsedJson.gait || 'Свободная, физиологическая',
      posture: parsedJson.posture || parsedXml.objective || '',
      jointExams: parsedJson.jointExams || (parsedJson.jointArea ? [{
        jointArea: parsedJson.jointArea,
        side: parsedJson.side || 'right',
        axis: 'norm',
        effusion: 0,
        rom: parsedJson.rom || { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 },
        tests: parsedJson.tests || {}
      }] : []),
      icdCode: selectedProtocol.mkb_code || parsedXml.mkb || undefined,
      icdName: selectedProtocol.mkb_name,
      clinicalDiagnosis: parsedJson.clinicalDiagnosis || parsedXml.diagnosis || (parsedXml.isXml ? '' : selectedProtocol.content),
      recommendations: parsedJson.recommendations || parsedXml.recommendations || (parsedXml.performed ? 'Выполнено:\n' + parsedXml.performed : ''),
      prescriptions: drawerPrescriptions,
      isSigned: selectedProtocol.status === 'signed',
      signedAt: selectedProtocol.signed_at,
      signatureHash: selectedProtocol.signature_hash
    };
  }, [selectedProtocol, drawerPrescriptions]);

  // Totals calculations for Footer (per grid-improvements)
  const totals = useMemo(() => {
    let signed = 0;
    let draft = 0;
    let revoked = 0;
    let sumAmount = 0;

    rows.forEach((r) => {
      if (r.status === 'signed') signed++;
      else if (r.status === 'revoked') revoked++;
      else draft++;

      sumAmount += Number(r.total_prescriptions_amount || 0);
    });

    return {
      totalCount: totalRows,
      signedCount: signed,
      draftCount: draft,
      revokedCount: revoked,
      totalPrescriptionsSum: sumAmount
    };
  }, [rows, totalRows]);

  // DataGrid Columns Definition
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'vdate',
      headerName: 'Дата приема',
      width: 125,
      renderCell: (params) => {
        const d = params.value ? new Date(params.value) : null;
        return (
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64', py: 1 }}>
            {d ? d.toLocaleDateString('ru-RU') : '—'}
          </Typography>
        );
      }
    },
    {
      field: 'patient_name',
      headerName: 'Пациент',
      flex: 1.8,
      minWidth: 200,
      renderCell: (params) => {
        const row = params.row as ProtocolRow;
        return (
          <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#1E293B' }}>
              {row.patient_name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              {row.patient_bdate ? `Рожд.: ${row.patient_bdate} ` : ''}
              {row.patient_phone ? `• Тел: ${row.patient_phone}` : ''}
              {row.patient_mednum ? ` • Карта: #${row.patient_mednum}` : ''}
            </Typography>
            {row.status === 'draft' && (
              <Tooltip title={`Нажмите для перехода в АРМ врача: ${row.patient_name} (протокол #${row.id})`}>
                <Chip
                  icon={<MedicalServicesIcon sx={{ fontSize: '12px !important', color: '#92400E !important' }} />}
                  label="Черновик приема • В АРМ"
                  size="small"
                  clickable
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/ortho-workstation?protocolId=${row.id}&patientId=${row.pt_id}`);
                  }}
                  sx={{
                    mt: 0.5,
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    bgcolor: '#FEF3C7',
                    color: '#92400E',
                    border: '1px solid #FCD34D',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: '#FDE68A',
                      borderColor: '#F59E0B',
                      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)'
                    }
                  }}
                />
              </Tooltip>
            )}
          </Box>
        );
      }
    },
    {
      field: 'doctor_name',
      headerName: 'Врач / Доступ',
      flex: 1.4,
      minWidth: 160,
      renderCell: (params) => {
        const row = params.row as ProtocolRow;
        const grantedList = row.granted_doctors ? row.granted_doctors.split('|||').filter(Boolean) : [];
        return (
          <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              {row.doctor_name || 'Врач клиники'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.3 }}>
              {row.is_owner && (
                <Chip
                  size="small"
                  label="Автор"
                  sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontSize: '0.68rem', height: 18, fontWeight: 700 }}
                />
              )}
              {row.is_granted && (
                <Chip
                  size="small"
                  label="Вам открыт доступ"
                  sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontSize: '0.68rem', height: 18, fontWeight: 700 }}
                />
              )}
              {grantedList.length > 0 && (
                <Tooltip title={`Доступ предоставлен врачам: ${grantedList.join(', ')}`}>
                  <Chip
                    size="small"
                    label={`+${grantedList.length} врачам доступ`}
                    sx={{ bgcolor: '#F1F5F9', color: '#475569', fontSize: '0.68rem', height: 18 }}
                  />
                </Tooltip>
              )}
            </Box>
          </Box>
        );
      }
    },
    {
      field: 'primary_joint',
      headerName: 'Сустав / Сторона',
      width: 160,
      renderCell: (params) => {
        const val = params.value;
        const side = (params.row as ProtocolRow).side;
        if (!val) return <Typography variant="caption" sx={{ color: '#94A3B8' }}>—</Typography>;
        return (
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0369A1' }}>
              {val}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              {side === 'left' ? 'Слева' : side === 'right' ? 'Справа' : 'Двусторонний'}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'vas_score',
      headerName: 'ВАШ',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const score = Number(params.value ?? 0);
        return (
          <Box sx={{ py: 1 }}>
            <Chip
              size="small"
              label={`${score}/10`}
              sx={{
                fontWeight: 800,
                fontSize: '0.75rem',
                bgcolor: score >= 7 ? '#FEE2E2' : score >= 4 ? '#FEF3C7' : '#DCFCE7',
                color: score >= 7 ? '#991B1B' : score >= 4 ? '#92400E' : '#166534'
              }}
            />
          </Box>
        );
      }
    },
    {
      field: 'mkb_code',
      headerName: 'Диагноз / Протокол',
      flex: 1.6,
      minWidth: 180,
      renderCell: (params) => {
        const row = params.row as ProtocolRow;
        const cleanSnippet = stripProtocolXml(row.content, 95);
        return (
          <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 1 }}>
            {row.mkb_code && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.4 }}>
                {row.mkb_code.split(',').map((c) => (
                  <Chip
                    key={c.trim()}
                    size="small"
                    label={c.trim()}
                    sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 700, fontSize: '0.72rem' }}
                  />
                ))}
              </Box>
            )}
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>
              {row.mkb_name || row.title || 'Осмотр травматолога-ортопеда'}
            </Typography>
            {cleanSnippet && (
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3, fontStyle: 'italic', fontSize: '0.73rem' }}>
                {cleanSnippet}
              </Typography>
            )}
          </Box>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Статус',
      width: 155,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const st = params.value;
        const row = params.row as ProtocolRow;
        if (st === 'signed') {
          return (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
              label="Подписан ЭЦП"
              size="small"
              color="success"
              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
            />
          );
        }
        if (st === 'revoked') {
          return (
            <Chip
              icon={<BlockIcon sx={{ fontSize: 16 }} />}
              label="Аннулирован"
              size="small"
              color="error"
              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
            />
          );
        }
        return (
          <Tooltip title={`Перейти в АРМ врача и продолжить оформление черновика (${row.patient_name || 'Пациент'})`}>
            <Chip
              icon={<MedicalServicesIcon sx={{ fontSize: '14px !important', color: '#92400E !important' }} />}
              label="Черновик • В АРМ"
              size="small"
              clickable
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/ortho-workstation?protocolId=${row.id}&patientId=${row.pt_id}`);
              }}
              sx={{
                bgcolor: '#FEF3C7',
                color: '#92400E',
                fontWeight: 800,
                fontSize: '0.72rem',
                border: '1px solid #FCD34D',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#FDE68A',
                  borderColor: '#F59E0B',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
                  transform: 'translateY(-1px)'
                }
              }}
            />
          </Tooltip>
        );
      }
    },
    {
      field: 'total_prescriptions_amount',
      headerName: 'Назначения, ₽',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const amt = Number(params.value || 0);
        const count = (params.row as ProtocolRow).prescriptions_count || 0;
        return (
          <Box sx={{ py: 1, textAlign: 'right' }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: amt > 0 ? '#0F3C64' : '#94A3B8' }}>
              {amt > 0 ? amt.toLocaleString('ru-RU') + ' ₽' : '—'}
            </Typography>
            {count > 0 && (
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Позиций: {count}
              </Typography>
            )}
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 290,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const row = params.row as ProtocolRow;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, py: 1, alignItems: 'center', justifyContent: 'center' }}>
            {/* Direct button to ARM Workstation for Drafts */}
            {row.status === 'draft' ? (
              <Tooltip title={`Продолжить прием в АРМ Врача: ${row.patient_name} (Протокол #${row.id})`}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<MedicalServicesIcon sx={{ fontSize: '15px !important' }} />}
                  onClick={() => navigate(`/ortho-workstation?protocolId=${row.id}&patientId=${row.pt_id}`)}
                  sx={{
                    bgcolor: '#0F3C64',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    py: 0.35,
                    px: 1.1,
                    minWidth: 'auto',
                    textTransform: 'none',
                    borderRadius: 1.5,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 3px rgba(15, 60, 100, 0.25)',
                    '&:hover': {
                      bgcolor: '#0284C7',
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)'
                    }
                  }}
                >
                  В АРМ
                </Button>
              </Tooltip>
            ) : row.can_edit ? (
              <Tooltip title="Редактировать подписанный протокол (права sysadmin)">
                <IconButton
                  size="small"
                  onClick={() => navigate(`/ortho-workstation?protocolId=${row.id}&patientId=${row.pt_id}`)}
                  sx={{ color: '#7C3AED' }}
                >
                  <EditNoteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Протокол подписан ЭЦП (readonly). Изменения разрешены только системному администратору (sysadmin)">
                <span>
                  <IconButton size="small" disabled sx={{ color: '#94A3B8' }}>
                    <LockIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* Quick view */}
            <Tooltip title="Быстрый просмотр протокола">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedProtocol(row);
                  setDrawerOpen(true);
                }}
                sx={{ color: '#0284C7' }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Print Menu Trigger */}
            <Tooltip title="Печать протокола / Печать с направлениями">
              <IconButton
                size="small"
                onClick={(e) => {
                  setPrintTargetRow(row);
                  setPrintMenuAnchor(e.currentTarget);
                }}
                sx={{ color: '#059669' }}
              >
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Issue Referral */}
            <Tooltip title="Выписать / Печать Направления для пациента (на бланке Центра, 90 дней)">
              <IconButton
                size="small"
                onClick={() => handleOpenReferralModal(row)}
                sx={{ color: '#0F766E' }}
              >
                <AssignmentIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Grant Access (Admin / Sysadmin) */}
            {row.can_grant_access && (
              <Tooltip title="Предоставить доступ врачу к этому протоколу">
                <IconButton
                  size="small"
                  onClick={() => {
                    setGrantProtocol(row);
                    setTargetDoctorId('');
                    setGrantReason('Клинический консилиум / совместное ведение');
                    setGrantConfirmed(false);
                    setGrantModalOpen(true);
                  }}
                  sx={{ color: '#D97706' }}
                >
                  <PersonAddAlt1Icon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Return to Draft (Sysadmin only for signed) */}
            {isSysadmin && row.status === 'signed' && (
              <Tooltip title="Снять подпись ЭЦП и вернуть в Черновик (права sysadmin)">
                <IconButton
                  size="small"
                  onClick={() => {
                    setProtocolToReturn(row);
                    setReturnDraftReason('Исправление клинических данных системным администратором');
                    setReturnDraftModalOpen(true);
                  }}
                  sx={{ color: '#DC2626' }}
                >
                  <UndoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Delete / Revoke */}
            {row.can_delete && (
              <Tooltip title={row.status === 'signed' ? 'Аннулировать подписанный протокол (sysadmin)' : 'Удалить черновик протокола'}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setProtocolToRevoke(row);
                    setRevokeDialogOpen(true);
                  }}
                  sx={{ color: '#EF4444' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    }
  ], [navigate, isSysadmin]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* HEADER BANNER */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.3px' }}>
            Реестр Протоколов и направлений пациентов
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.3 }}>
            Полнотекстовый поиск FTS5 по 32 881 историческим протоколам, клиническая аналитика, RBAC и управление ЭЦП
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<MedicalServicesIcon />}
            onClick={() => navigate('/ortho-workstation/new')}
            sx={{ bgcolor: '#0F3C64', '&:hover': { bgcolor: '#0A2A47' }, fontWeight: 700, px: 2.5 }}
          >
            Новый приём в АРМ
          </Button>
        </Box>
      </Box>

      {/* DUAL NAVIGATION TABS */}
      <Paper elevation={0} sx={{ mb: 2.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2, px: 2, pt: 1 }}>
        <Tabs
          value={0}
          onChange={(_, val) => {
            if (val === 1) navigate('/patient-referrals');
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

      {/* QUICK FILTER BAR */}
      <Paper sx={{ p: 2, mb: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: isAdministrator || isSysadmin ? '2fr 1fr 1fr 1fr 1fr 1fr auto' : '2fr 1fr 1fr 1fr 1fr auto'
            },
            gap: 1.5,
            alignItems: 'center'
          }}
        >
          <TextField
            size="small"
            placeholder="Полнотекстовый поиск FTS5 (ФИО, диагноз, жалобы, мениск, связка)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#0F3C64' }} />
                  </InputAdornment>
                )
              }
            }}
          />

          {(isAdministrator || isSysadmin) && (
            <FormControl size="small">
              <InputLabel>Врач-автор</InputLabel>
              <Select
                label="Врач-автор"
                value={selectedDoctorId}
                onChange={(e) => {
                  setSelectedDoctorId(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Все врачи</MenuItem>
                {doctorsList.map((doc) => (
                  <MenuItem key={doc.id} value={String(doc.id)}>
                    {doc.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl size="small">
            <InputLabel>Локализация</InputLabel>
            <Select
              label="Локализация"
              value={selectedJoint}
              onChange={(e) => setSelectedJoint(e.target.value)}
            >
              <MenuItem value="">Все суставы</MenuItem>
              <MenuItem value="knee">Коленный сустав</MenuItem>
              <MenuItem value="hip">Тазобедренный сустав</MenuItem>
              <MenuItem value="shoulder">Плечевой сустав</MenuItem>
              <MenuItem value="foot">Голеностоп и стопа</MenuItem>
              <MenuItem value="spine">Позвоночник</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Статус ЭЦП</InputLabel>
            <Select
              label="Статус ЭЦП"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="">Все статусы</MenuItem>
              <MenuItem value="signed">Подписан ЭЦП</MenuItem>
              <MenuItem value="draft">Черновик</MenuItem>
              <MenuItem value="revoked">Аннулирован</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="date"
            label="С даты"
            slotProps={{ inputLabel: { shrink: true } }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <TextField
            size="small"
            type="date"
            label="По дату"
            slotProps={{ inputLabel: { shrink: true } }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <Button
            variant={selectedStatus === 'draft' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<MedicalServicesIcon sx={{ fontSize: '16px !important' }} />}
            onClick={() => {
              setSelectedStatus((prev) => (prev === 'draft' ? '' : 'draft'));
              setPage(0);
            }}
            sx={{
              fontWeight: 800,
              color: selectedStatus === 'draft' ? '#FFFFFF' : '#92400E',
              bgcolor: selectedStatus === 'draft' ? '#D97706' : '#FEF3C7',
              borderColor: '#FCD34D',
              height: 40,
              textTransform: 'none',
              boxShadow: selectedStatus === 'draft' ? '0 2px 6px rgba(217, 119, 6, 0.3)' : 'none',
              '&:hover': {
                bgcolor: selectedStatus === 'draft' ? '#B45309' : '#FDE68A',
                borderColor: '#F59E0B'
              }
            }}
          >
            Черновики {totals.draftCount > 0 ? `(${totals.draftCount})` : ''}
          </Button>

          {patientIdFilter && (
            <Chip
              label={`Пациент ID: ${patientIdFilter}`}
              size="small"
              onDelete={() => {
                setPatientIdFilter('');
                setPage(0);
              }}
              sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700 }}
            />
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterAltOffIcon />}
            onClick={handleResetFilters}
            sx={{ fontWeight: 600, color: '#64748B', borderColor: '#CBD5E1', height: 40 }}
          >
            Сброс
          </Button>
        </Box>
      </Paper>

      {/* DATAGRID (Strictly compliant with grid-improvements skill) */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #E2E8F0',
          borderRadius: 2,
          overflow: 'hidden',
          width: '100%'
        }}
      >
        <DataGrid
          autoHeight
          showToolbar
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={totalRows}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          getRowHeight={() => 'auto'}
          onRowDoubleClick={(params) => {
            const row = params.row as ProtocolRow;
            navigate(`/ortho-workstation?protocolId=${row.id}&patientId=${row.pt_id}`);
          }}
          slots={{
            toolbar: ProtocolsCustomToolbar,
            footer: () => (
              <ProtocolsCustomFooter
                totalCount={totals.totalCount}
                signedCount={totals.signedCount}
                draftCount={totals.draftCount}
                revokedCount={totals.revokedCount}
                totalPrescriptionsSum={totals.totalPrescriptionsSum}
                selectedStatus={selectedStatus}
                onFilterDrafts={() => {
                  setSelectedStatus((prev) => (prev === 'draft' ? '' : 'draft'));
                  setPage(0);
                }}
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
              fontWeight: 800,
              color: '#0F3C64',
              borderBottom: '2px solid #CBD5E1'
            },
            '& .MuiDataGrid-cell': {
              alignItems: 'flex-start',
              borderBottom: '1px solid #F1F5F9'
            },
            '& .MuiDataGrid-row': {
              cursor: 'pointer'
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: '#F8FAFC'
            }
          }}
        />
      </Paper>

      {/* DRAWER PROTOCOL INSPECTOR */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: { width: { xs: '100%', md: '860px' }, p: 3, bgcolor: '#F8FAFC' }
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              Протокол осмотра #{selectedProtocol?.id}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Пациент: {selectedProtocol?.patient_name} • Дата: {selectedProtocol?.vdate}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {selectedProtocol && (
              <Button
                variant="contained"
                size="small"
                startIcon={<MedicalServicesIcon />}
                onClick={() => {
                  navigate(`/ortho-workstation?protocolId=${selectedProtocol.id}&patientId=${selectedProtocol.pt_id}`);
                }}
                sx={{
                  bgcolor: selectedProtocol.status === 'draft' ? '#D97706' : '#0F3C64',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  textTransform: 'none',
                  boxShadow: selectedProtocol.status === 'draft' ? '0 2px 6px rgba(217, 119, 6, 0.3)' : 'none',
                  '&:hover': {
                    bgcolor: selectedProtocol.status === 'draft' ? '#B45309' : '#0284C7'
                  }
                }}
              >
                {selectedProtocol.status === 'draft' ? 'Продолжить в АРМ врача' : 'Открыть в АРМ врача'}
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<AssignmentIcon />}
              onClick={() => {
                if (selectedProtocol) {
                  handleOpenReferralModal(selectedProtocol);
                }
              }}
              sx={{
                borderColor: '#0284C7',
                color: '#0284C7',
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: '#FFFFFF',
                '&:hover': { bgcolor: '#F0F9FF', borderColor: '#0369A1' }
              }}
            >
              Печать Направления
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={handlePrintTrigger}
              sx={{ bgcolor: '#0F3C64', fontWeight: 700 }}
            >
              Печать A4
            </Button>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {selectedProtocol?.status === 'draft' && (
          <Alert
            severity="warning"
            icon={<EditNoteIcon sx={{ fontSize: 22 }} />}
            action={
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                onClick={() => navigate(`/ortho-workstation?protocolId=${selectedProtocol.id}&patientId=${selectedProtocol.pt_id}`)}
                sx={{ fontWeight: 800, textTransform: 'none', borderColor: '#D97706', bgcolor: '#FEF3C7' }}
              >
                Перейти в АРМ врача →
              </Button>
            }
            sx={{ mb: 2, borderRadius: 2, fontWeight: 600, border: '1px solid #FCD34D' }}
          >
            Данный протокол сохранен в статусе <b>«Черновик»</b>. Пациент: <b>{selectedProtocol.patient_name}</b>. Нажмите для перехода в АРМ врача с автоматическим позиционированием на пациенте.
          </Alert>
        )}

        {assembledDrawerData && (
          <Paper sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: 2 }}>
            <OrthoProtocolPrintTemplate data={assembledDrawerData} />
          </Paper>
        )}
      </Drawer>

      {/* PRINT MENU */}
      <Menu
        anchorEl={printMenuAnchor}
        open={Boolean(printMenuAnchor)}
        onClose={() => setPrintMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            if (printTargetRow) handlePrintProtocolOnly(printTargetRow);
          }}
        >
          <PrintIcon fontSize="small" sx={{ mr: 1.5, color: '#0F3C64' }} />
          Печать протокола (A4)
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (printTargetRow) handlePrintProtocolWithReferrals(printTargetRow);
          }}
        >
          <AssignmentIcon fontSize="small" sx={{ mr: 1.5, color: '#0F766E' }} />
          Печать протокола с направлениями (пакет)
        </MenuItem>
      </Menu>

      {/* GRANT ACCESS DIALOG (Administrator / Sysadmin) */}
      <Dialog open={grantModalOpen} onClose={() => setGrantModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64' }}>
          Предоставление доступа к протоколу #{grantProtocol?.id}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
            Пациент: <b>{grantProtocol?.patient_name}</b> • Автор: <b>{grantProtocol?.doctor_name || 'Врач клиники'}</b>
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Предоставление доступа позволяет коллеге-врачу открывать данный протокол в АРМ и знакомиться с историей пациента. Действие строго фиксируется в журнале аудита Serilog в соответствии с 323-ФЗ.
          </Alert>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Выберите врача-коллегу</InputLabel>
            <Select
              label="Выберите врача-коллегу"
              value={targetDoctorId}
              onChange={(e) => setTargetDoctorId(Number(e.target.value))}
            >
              {doctorsList
                .filter((d) => d.id !== grantProtocol?.docn)
                .map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.full_name} {d.specialization ? `(${d.specialization})` : ''}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Клиническое обоснование предоставления доступа"
            placeholder="Клинический консилиум, совместное ведение, замена лечащего врача..."
            value={grantReason}
            onChange={(e) => setGrantReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={grantConfirmed}
                onChange={(e) => setGrantConfirmed(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                Подтверждаю предоставление доступа в рамках 323-ФЗ и клинической необходимости
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGrantModalOpen(false)} disabled={grantLoading}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmGrantAccess}
            disabled={grantLoading || !targetDoctorId || !grantReason.trim() || !grantConfirmed}
            sx={{ bgcolor: '#0F3C64', fontWeight: 700 }}
          >
            {grantLoading ? 'Сохранение...' : 'Предоставить доступ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* RETURN TO DRAFT DIALOG (Sysadmin only) */}
      <Dialog open={returnDraftModalOpen} onClose={() => setReturnDraftModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#DC2626' }}>
          Снятие ЭЦП и возврат в «Черновик» протокола #{protocolToReturn?.id}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <b>Внимание!</b> Протокол был подписан усиленной ЭЦП. Снятие статуса подписи и возвращение протокола в редактируемый черновик разрешено исключительно <b>системному администратору (sysadmin)</b>. Это действие будет занесено в защищённый журнал аудита Serilog.
          </Alert>
          <TextField
            fullWidth
            size="small"
            label="Обоснование снятия ЭЦП и возврата в черновик"
            placeholder="Исправление ошибочных клинических данных системным администратором..."
            multiline
            minRows={2}
            value={returnDraftReason}
            onChange={(e) => setReturnDraftReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReturnDraftModalOpen(false)} disabled={returnDraftLoading}>
            Отмена
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReturnToDraft}
            disabled={returnDraftLoading || !returnDraftReason.trim()}
            sx={{ fontWeight: 700 }}
          >
            {returnDraftLoading ? 'Возврат...' : 'Снять ЭЦП и вернуть в черновик'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* REVOCATION DIALOG */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#991B1B' }}>
          Аннулирование протокола осмотра #{protocolToRevoke?.id}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Аннулирование протокола необратимо фиксируется в журнале аудита Serilog. Протокол сохраняется в базе данных с пометкой «Аннулирован» и причиной отзыва.
          </Alert>
          <TextField
            fullWidth
            size="small"
            label="Клиническая причина аннулирования"
            placeholder="Например: Ошибка при вводе данных другого пациента, повторный осмотр..."
            multiline
            minRows={3}
            value={revocationReason}
            onChange={(e) => setRevocationReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRevokeDialogOpen(false)} disabled={revoking}>
            Отмена
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmRevoke}
            disabled={revoking}
            sx={{ fontWeight: 700 }}
          >
            {revoking ? 'Аннулирование...' : 'Подтвердить аннулирование'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ISSUE REFERRAL MODAL */}
      {referralModalProtocol && (
        <IssueReferralModal
          open={referralModalOpen}
          onClose={() => {
            setReferralModalOpen(false);
            setReferralModalProtocol(null);
          }}
          patient={{
            id: referralModalProtocol.pt_id,
            fullName: referralModalProtocol.patient_name,
            birthDate: referralModalProtocol.patient_bdate,
            phone: referralModalProtocol.patient_phone,
            cardNum: String(referralModalProtocol.patient_mednum || '')
          }}
          protocolId={referralModalProtocol.id}
          doctorName={referralModalProtocol.doctor_name || ''}
          defaultMkbCode={referralModalProtocol.mkb_code || 'M17.1'}
          defaultDiagnosis={referralModalProtocol.mkb_name || referralModalProtocol.title || ''}
          targetJoint={referralModalProtocol.primary_joint || ''}
          targetSide={referralModalProtocol.side === 'left' ? 'Левая' : referralModalProtocol.side === 'right' ? 'Правая' : ''}
          anamnesisSummary={referralModalProtocol.title || ''}
          availablePrescriptions={referralPrescriptions}
          onReferralIssued={(ref) => {
            setToastMessage(`Направление ${ref.referral_number} успешно выписано на бланке Центра`);
          }}
        />
      )}

      {/* HIDDEN PRINT CONTAINER (Protocol + Bundled Referrals) */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {assembledDrawerData && (
            <OrthoProtocolPrintTemplate data={assembledDrawerData} />
          )}
          {printWithReferrals && bundledReferrals.length > 0 && bundledReferrals.map((ref) => (
            <div key={ref.id} style={{ pageBreakBefore: 'always', marginTop: '24px' }}>
              <OrthoReferralPrintTemplate data={ref} />
            </div>
          ))}
        </div>
      </div>

      {/* SNACKBAR */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />
    </Box>
  );
}
