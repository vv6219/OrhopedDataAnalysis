import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  InputAdornment
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
import CloseIcon from '@mui/icons-material/Close';
import { useReactToPrint } from 'react-to-print';
import { API_BASE_URL } from '../config/apiConfig';
import OrthoProtocolPrintTemplate from '../components/reports/OrthoProtocolPrintTemplate';
import type { OrthoProtocolData } from '../components/reports/OrthoProtocolPrintTemplate';
import { parseProtocolContent, stripProtocolXml } from '../utils/protocolXmlParser';

export interface ProtocolRow {
  id: number;
  docn?: number;
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
  totalPrescriptionsSum
}: {
  totalCount: number;
  signedCount: number;
  draftCount: number;
  revokedCount: number;
  totalPrescriptionsSum: number;
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
        <Chip
          size="small"
          label={`Черновиков: ${draftCount}`}
          sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}
        />
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

  // Registry state
  const [rows, setRows] = useState<ProtocolRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJoint, setSelectedJoint] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Drawer Inspector State
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Revoke Dialog State
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [protocolToRevoke, setProtocolToRevoke] = useState<ProtocolRow | null>(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  // Print ref for Drawer Preview
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

  // Fetch Protocols with FTS5 and Filters
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
  }, [page, pageSize, searchTerm, selectedJoint, selectedStatus, startDate, endDate]);

  useEffect(() => {
    fetchProtocols();
  }, [fetchProtocols]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedJoint('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  // Revoke protocol action
  const handleConfirmRevoke = async () => {
    if (!protocolToRevoke) return;
    setRevoking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ortho/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolId: protocolToRevoke.id,
          reason: revocationReason.trim() || 'Аннулировано врачом'
        })
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
      doctorName: 'Добрушкин В.И.',
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
      prescriptions: parsedJson.prescriptions || [],
      isSigned: selectedProtocol.status === 'signed',
      signedAt: selectedProtocol.signed_at,
      signatureHash: selectedProtocol.signature_hash
    };
  }, [selectedProtocol]);

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
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const st = params.value;
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
          <Chip
            label="Черновик"
            size="small"
            sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '0.72rem' }}
          />
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
      width: 160,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const row = params.row as ProtocolRow;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, py: 1 }}>
            <Tooltip title="Открыть в АРМ Врача">
              <IconButton
                size="small"
                onClick={() => navigate(`/ortho-workstation?protocolId=${row.id}&patientId=${row.pt_id}`)}
                sx={{ color: '#0F3C64' }}
              >
                <EditNoteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Быстрый просмотр и печать">
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
            {row.status === 'signed' && (
              <Tooltip title="Аннулировать протокол">
                <IconButton
                  size="small"
                  onClick={() => {
                    setProtocolToRevoke(row);
                    setRevokeDialogOpen(true);
                  }}
                  sx={{ color: '#DC2626' }}
                >
                  <BlockIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    }
  ], [navigate]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* HEADER BANNER */}
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.3px' }}>
            Реестр протоколов осмотра травматолога-ортопеда
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.3 }}>
            Полнотекстовый поиск FTS5 по 32 881 историческим протоколам, клиническая аналитика и управление ЭЦП
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

      {/* QUICK FILTER BAR */}
      <Paper sx={{ p: 2, mb: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr 1fr 1fr auto' }, gap: 1.5, alignItems: 'center' }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1, borderBottom: '1px solid #E2E8F0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
              Протокол осмотра #{selectedProtocol?.id}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Пациент: {selectedProtocol?.patient_name} • Дата: {selectedProtocol?.vdate}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
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

        {assembledDrawerData && (
          <Paper sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: 2 }}>
            <OrthoProtocolPrintTemplate ref={printRef} data={assembledDrawerData} />
          </Paper>
        )}
      </Drawer>

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
