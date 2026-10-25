import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RefreshIcon from '@mui/icons-material/Refresh';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SchoolIcon from '@mui/icons-material/School';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BadgeIcon from '@mui/icons-material/Badge';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../context/AuthContext';
import { isElementPermitted } from '../../utils/permissionUtils';

// Printable Templates & Types
import { FitToFlyPrintTemplate } from '../reports/FitToFlyPrintTemplate';
import type { FitToFlyData } from '../reports/FitToFlyPrintTemplate';
import { SportsAdmissionPrintTemplate } from '../reports/SportsAdmissionPrintTemplate';
import type { SportsAdmissionData } from '../reports/SportsAdmissionPrintTemplate';
import { SickLeavePrintTemplate } from '../reports/SickLeavePrintTemplate';
import type { SickLeaveData } from '../reports/SickLeavePrintTemplate';
import { PeReleasePrintTemplate } from '../reports/PeReleasePrintTemplate';
import type { PeReleaseData } from '../reports/PeReleasePrintTemplate';
import { PatientExtractPrintTemplate } from '../reports/PatientExtractPrintTemplate';
import type { PatientExtractData } from '../reports/PatientExtractPrintTemplate';
import { PatientMedicalCardPrintTemplate } from '../reports/PatientMedicalCardPrintTemplate';
import type { PatientMedicalCardData } from '../reports/PatientMedicalCardPrintTemplate';
import { PatientConsentPrintTemplate } from '../reports/PatientConsentPrintTemplate';
import type { PatientConsentData } from '../reports/PatientConsentPrintTemplate';
import { PatientMemoPrintTemplate } from '../reports/PatientMemoPrintTemplate';
import type { PatientMemoData } from '../reports/PatientMemoPrintTemplate';

export const PatientDocumentsKpiTab: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const isSysadmin = hasPermission('sysadmin') || isElementPermitted('protocols_registry', 'print_sick_leave', currentUser?.permissionCodes);

  const [kpiData, setKpiData] = useState<any>(null);
  const [loadingKpi, setLoadingKpi] = useState<boolean>(true);

  // Registry table state
  const [documents, setDocuments] = useState<any[]>([]);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Reprint / Preview modal
  const [selectedDocForPrint, setSelectedDocForPrint] = useState<any | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const printComponentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: selectedDocForPrint ? `${selectedDocForPrint.document_number}_${selectedDocForPrint.patient_name}` : 'Document'
  });

  const fetchKpi = useCallback(async () => {
    setLoadingKpi(true);
    try {
      const params = new URLSearchParams();
      if (selectedDoctor !== 'all') params.append('doctor_name', selectedDoctor);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const res = await fetch(`/api/ortho/patient-documents/kpi?${params.toString()}`);
      if (!res.ok) {
        console.warn('KPI fetch returned non-ok status:', res.status);
        return;
      }
      const data = await res.json();
      if (data?.success) {
        setKpiData(data);
      }
    } catch (e) {
      console.error('Failed to fetch document KPI:', e);
    } finally {
      setLoadingKpi(false);
    }
  }, [selectedDoctor, dateFrom, dateTo]);

  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', String(rowsPerPage));
      params.append('offset', String(page * rowsPerPage));
      if (selectedDocType !== 'all') params.append('document_type', selectedDocType);
      if (selectedDoctor !== 'all') params.append('doctor_name', selectedDoctor);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/ortho/patient-documents?${params.toString()}`);
      if (!res.ok) {
        console.warn('Documents fetch returned non-ok status:', res.status);
        return;
      }
      const data = await res.json();
      if (data?.success) {
        setDocuments(data.rows || []);
        setTotalDocs(data.total || 0);
      }
    } catch (e) {
      console.error('Failed to fetch documents registry:', e);
    } finally {
      setLoadingDocs(false);
    }
  }, [page, rowsPerPage, selectedDocType, selectedDoctor, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    fetchKpi();
  }, [fetchKpi]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Log reprint in Serilog and increment counter
  const triggerReprint = async (doc: any) => {
    const isSickLeave =
      doc.document_type === 'sick_leave' ||
      doc.document_type === 'disability' ||
      doc.document_type === 'certificate' ||
      doc.form_code === '095/у' ||
      doc.form_code === '347н / ЭЛН' ||
      (doc.title && doc.title.toLowerCase().includes('нетрудоспособност')) ||
      (doc.title && doc.title.toLowerCase().includes('больничный'));

    if (isSickLeave && !isSysadmin) {
      alert('Печать листка нетрудоспособности (больничного листа) разрешена исключительно системному администратору (sysadmin)');
      return;
    }

    setSelectedDocForPrint(doc);
    setPreviewOpen(true);

    try {
      await fetch(`/api/ortho/patient-documents/${doc.id}/log-print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      fetchDocuments();
      fetchKpi();
    } catch (e) {
      console.error('Failed to log reprint:', e);
    }
  };

  const overview = kpiData?.overview || {
    total_issued: 0,
    issued_today: 0,
    issued_this_month: 0,
    reprints_count: 0,
    unique_patients: 0
  };

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'referral':
        return <LocalHospitalIcon sx={{ color: '#0284C7', fontSize: 18 }} />;
      case 'certificate':
        return <SchoolIcon sx={{ color: '#D97706', fontSize: 18 }} />;
      case 'pe_release':
        return <FitnessCenterIcon sx={{ color: '#0D9488', fontSize: 18 }} />;
      case 'fit_to_fly':
        return <FlightTakeoffIcon sx={{ color: '#0284C7', fontSize: 18 }} />;
      case 'sports_admission':
        return <FitnessCenterIcon sx={{ color: '#16A34A', fontSize: 18 }} />;
      case 'extract':
        return <DescriptionIcon sx={{ color: '#9333EA', fontSize: 18 }} />;
      case 'card':
        return <BadgeIcon sx={{ color: '#475569', fontSize: 18 }} />;
      case 'consent':
        return <AssignmentIcon sx={{ color: '#DC2626', fontSize: 18 }} />;
      case 'memo':
        return <InfoOutlinedIcon sx={{ color: '#059669', fontSize: 18 }} />;
      default:
        return <DescriptionIcon sx={{ color: '#64748B', fontSize: 18 }} />;
    }
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. TOP STATS BAR / SUMMARY KPI CARDS */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(5, 1fr)'
          },
          gap: 2
        }}
      >
        <Card sx={{ bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1', textTransform: 'uppercase' }}>
              Всего выдано
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 0.5 }}>
              {overview.total_issued}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
              Официально зарегистрировано
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
              Выдано за месяц
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 0.5 }}>
              {overview.issued_this_month}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
              Текущий календарный месяц
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase' }}>
              Выдано сегодня
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 0.5 }}>
              {overview.issued_today}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
              За текущие сутки
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '8px' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#7E22CE', textTransform: 'uppercase' }}>
              Пациентов охвачено
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 0.5 }}>
              {overview.unique_patients}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
              Уникальных пациентов
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>
              Дубликаты / Копии
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', my: 0.5 }}>
              {overview.reprints_count}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
              Повторные распечатки
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 2. BREAKDOWN BY CATEGORY & DOCTORS */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        {/* Categories Distribution */}
        <Paper sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', mb: 2 }}>
            Распределение по типам документов
          </Typography>
          {loadingKpi ? (
            <LinearProgress />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {(kpiData?.by_type || []).map((t: any) => {
                const pct = overview.total_issued > 0 ? Math.round((t.count / overview.total_issued) * 100) : 0;
                return (
                  <Box key={t.document_type}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getDocTypeIcon(t.document_type)}
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                          {t.title || t.document_type}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F3C64' }}>
                        {t.count} ({pct}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9' }}
                    />
                  </Box>
                );
              })}
              {(!kpiData?.by_type || kpiData.by_type.length === 0) && (
                <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', py: 2, textAlign: 'center' }}>
                  Нет данных для отображения
                </Typography>
              )}
            </Box>
          )}
        </Paper>

        {/* Top Issuing Doctors */}
        <Paper sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', mb: 2 }}>
            ТОП врачей по выдаче документов
          </Typography>
          {loadingKpi ? (
            <LinearProgress />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Врач / Специалист</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Выдано документов</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Пациентов</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(kpiData?.by_doctor || []).map((d: any, idx: number) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{d.doctor_name || 'Добрушкин А.М.'}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284C7' }}>
                        {d.count}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.82rem' }}>
                        {d.patients_count}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!kpiData?.by_doctor || kpiData.by_doctor.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ color: '#94A3B8', py: 2 }}>
                        Данные отсутствуют
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* 3. MASTER REGISTER OF ISSUED DOCUMENTS (TABLE) */}
      <Paper sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon color="primary" />
            <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              Журнал регистрации выданных пациентам документов
            </Typography>
            <Chip label={`Всего: ${totalDocs}`} size="small" sx={{ fontWeight: 700, bgcolor: '#E0F2FE', color: '#0369A1' }} />
          </Box>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchKpi();
              fetchDocuments();
            }}
          >
            Обновить
          </Button>
        </Box>

        {/* Filter Controls Bar */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
          <TextField
            size="small"
            placeholder="Поиск по номеру, ФИО, учреждению..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Тип документа</InputLabel>
            <Select
              value={selectedDocType}
              label="Тип документа"
              onChange={(e) => setSelectedDocType(e.target.value)}
            >
              <MenuItem value="all">Все типы</MenuItem>
              <MenuItem value="referral">Направление (057/у)</MenuItem>
              <MenuItem value="certificate">Справка (095/у)</MenuItem>
              <MenuItem value="pe_release">Освобождение от физ-ры</MenuItem>
              <MenuItem value="fit_to_fly">Fit to Fly (Перелет)</MenuItem>
              <MenuItem value="sports_admission">Заключение 1144н (Спорт)</MenuItem>
              <MenuItem value="extract">Выписка (027/у)</MenuItem>
              <MenuItem value="card">Медкарта (025/у)</MenuItem>
              <MenuItem value="consent">ИДС (323-ФЗ)</MenuItem>
              <MenuItem value="memo">Памятка пациенту</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Врач</InputLabel>
            <Select
              value={selectedDoctor}
              label="Врач"
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              <MenuItem value="all">Все врачи</MenuItem>
              {(kpiData?.by_doctor || []).map((d: any, idx: number) => (
                <MenuItem key={idx} value={d.doctor_name}>{d.doctor_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="С даты"
            type="date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <TextField
            label="По дату"
            type="date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </Box>

        {/* Register Table with Sticky Header */}
        <TableContainer sx={{ maxHeight: 520, border: '1px solid #E2E8F0', borderRadius: '4px' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#F8FAFC', fontWeight: 800, fontSize: '0.78rem' } }}>
                <TableCell>Регистрационный №</TableCell>
                <TableCell>Дата и время</TableCell>
                <TableCell>Тип документа</TableCell>
                <TableCell>Пациент</TableCell>
                <TableCell>Диагноз (МКБ-10)</TableCell>
                <TableCell>Выдавший врач</TableCell>
                <TableCell>Организация назначения</TableCell>
                <TableCell align="center">Печать</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingDocs ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                    Зарегистрированных документов не найдено
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc: any) => (
                  <TableRow key={doc.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#0284C7', fontSize: '0.82rem' }}>
                      {doc.document_number}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', color: '#475569' }}>
                      {doc.issue_date}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getDocTypeIcon(doc.document_type)}
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {doc.title || doc.document_type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                      {doc.patient_name}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', color: '#334155' }}>
                      {doc.icd10_code ? `[${doc.icd10_code}] ` : ''}{doc.clinical_diagnosis || '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {doc.doctor_name || doc.issued_by_name || 'Добрушкин А.М.'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', color: '#64748B' }}>
                      {doc.recipient_organization || 'По месту требования'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`Экз: ${doc.printed_count || 1}`}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          bgcolor: (doc.printed_count || 1) > 1 ? '#FEF3C7' : '#F1F5F9',
                          color: (doc.printed_count || 1) > 1 ? '#B45309' : '#475569'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {(() => {
                        const isSickLeave =
                          doc.document_type === 'sick_leave' ||
                          doc.document_type === 'disability' ||
                          doc.document_type === 'certificate' ||
                          doc.form_code === '095/у' ||
                          doc.form_code === '347н / ЭЛН' ||
                          (doc.title && doc.title.toLowerCase().includes('нетрудоспособност')) ||
                          (doc.title && doc.title.toLowerCase().includes('больничный'));
                        const isRestricted = isSickLeave && !isSysadmin;
                        return (
                          <Tooltip title={isRestricted ? 'Повторная печать листка нетрудоспособности (больничного листа) разрешена только системному администратору (sysadmin)' : 'Повторная печать (Дубликат)'}>
                            <span>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={isRestricted}
                                startIcon={isRestricted ? <LockIcon sx={{ fontSize: '13px !important', color: '#DC2626 !important' }} /> : <PrintIcon />}
                                onClick={() => triggerReprint(doc)}
                                sx={{
                                  fontSize: '0.72rem',
                                  py: 0.2,
                                  px: 1,
                                  ...(isRestricted ? { borderColor: '#FECACA', color: '#DC2626' } : {})
                                }}
                              >
                                {isRestricted ? 'Только sysadmin' : 'Печать'}
                              </Button>
                            </span>
                          </Tooltip>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination & Accounting Totals Footer */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5, pt: 1, borderTop: '1px solid #E2E8F0' }}>
          <Typography sx={{ fontSize: '0.78rem', color: '#64748B' }}>
            Всего в выборке: <strong>{totalDocs}</strong> документов
          </Typography>
          <TablePagination
            component="div"
            count={totalDocs}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Строк на странице:"
          />
        </Box>
      </Paper>

      {/* 4. REPRINT / PREVIEW DIALOG */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { bgcolor: '#F1F5F9' } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PrintIcon color="primary" />
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 800 }}>
              Печать зарегистрированного документа: {selectedDocForPrint?.document_number}
            </Typography>
            {selectedDocForPrint?.printed_count > 1 && (
              <Chip label="ДУБЛИКАТ" color="warning" size="small" sx={{ fontWeight: 800 }} />
            )}
          </Box>
          <CloseIcon sx={{ cursor: 'pointer' }} onClick={() => setPreviewOpen(false)} />
        </DialogTitle>

        <DialogContent sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          {selectedDocForPrint && (
            <Box sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)', bgcolor: '#FFFFFF' }}>
              {(() => {
                let parsedData: any = {};
                try {
                  parsedData = typeof selectedDocForPrint.document_data_json === 'string'
                    ? JSON.parse(selectedDocForPrint.document_data_json)
                    : (selectedDocForPrint.document_data_json || {});
                } catch {
                  parsedData = {};
                }

                const docType = selectedDocForPrint.document_type;
                const isDup = (selectedDocForPrint.printed_count || 1) > 1;

                if (docType === 'fit_to_fly') {
                  const ftfData: FitToFlyData = {
                    documentNumber: selectedDocForPrint.document_number,
                    issueDate: selectedDocForPrint.issue_date?.substring(0, 10) || new Date().toISOString().substring(0, 10),
                    validUntil: selectedDocForPrint.valid_until || parsedData.validUntil,
                    patient: {
                      fullName: selectedDocForPrint.patient_name,
                      fullNameEn: parsedData.fullNameEn,
                      birthDate: parsedData.patientDetails?.birthDate,
                      gender: parsedData.patientDetails?.gender,
                      passportNumber: parsedData.patientDetails?.passportNumber
                    },
                    destination: selectedDocForPrint.recipient_organization || parsedData.destinationRoute,
                    clinicalDiagnosis: selectedDocForPrint.clinical_diagnosis,
                    icd10Code: selectedDocForPrint.icd10_code,
                    specialRequirements: parsedData.specialRequirements,
                    doctorName: selectedDocForPrint.doctor_name,
                    verificationHash: selectedDocForPrint.verification_hash,
                    isDuplicate: isDup
                  };
                  return <FitToFlyPrintTemplate ref={printComponentRef} data={ftfData} />;
                }

                if (docType === 'sports_admission') {
                  const saData: SportsAdmissionData = {
                    documentNumber: selectedDocForPrint.document_number,
                    issueDate: selectedDocForPrint.issue_date?.substring(0, 10) || new Date().toISOString().substring(0, 10),
                    validUntil: selectedDocForPrint.valid_until || parsedData.validUntil || '2027-04-25',
                    patient: {
                      fullName: selectedDocForPrint.patient_name,
                      birthDate: parsedData.patientDetails?.birthDate,
                      gender: parsedData.patientDetails?.gender,
                      snils: parsedData.patientDetails?.snils
                    },
                    sportDiscipline: parsedData.sportDiscipline || 'Плавание / Общая физическая культура',
                    sportEventStage: parsedData.sportStage || 'training_and_competition',
                    examResultsSummary: parsedData.examResults,
                    doctorName: selectedDocForPrint.doctor_name,
                    verificationHash: selectedDocForPrint.verification_hash,
                    isDuplicate: isDup
                  };
                  return <SportsAdmissionPrintTemplate ref={printComponentRef} data={saData} />;
                }

                if (docType === 'pe_release') {
                  const peData: PeReleaseData = {
                    documentNumber: selectedDocForPrint.document_number,
                    issueDate: selectedDocForPrint.issue_date?.substring(0, 10) || new Date().toISOString().substring(0, 10),
                    patient: {
                      fullName: selectedDocForPrint.patient_name,
                      birthDate: parsedData.patientDetails?.birthDate,
                      gender: parsedData.patientDetails?.gender
                    },
                    institutionName: selectedDocForPrint.recipient_organization || 'Школа / Гимназия / ВУЗ',
                    absenceStartDate: parsedData.startDate || selectedDocForPrint.issue_date?.substring(0, 10),
                    absenceEndDate: parsedData.endDate || selectedDocForPrint.valid_until || '2026-11-30',
                    returnToStudiesDate: parsedData.endDate || selectedDocForPrint.valid_until || '2026-12-01',
                    leavePeriodBlank: false,
                    peStartDate: parsedData.startDate || selectedDocForPrint.issue_date?.substring(0, 10),
                    peEndDate: parsedData.endDate || selectedDocForPrint.valid_until || '2026-11-30',
                    peGroup: 'special_b',
                    icd10Code: selectedDocForPrint.icd10_code,
                    clinicalDiagnosis: selectedDocForPrint.clinical_diagnosis,
                    doctorName: selectedDocForPrint.doctor_name,
                    verificationHash: selectedDocForPrint.verification_hash
                  };
                  return (
                    <div ref={printComponentRef}>
                      <PeReleasePrintTemplate data={peData} />
                    </div>
                  );
                }

                if (docType === 'extract') {
                  const extData: PatientExtractData = {
                    documentNumber: selectedDocForPrint.document_number,
                    issueDate: selectedDocForPrint.issue_date?.substring(0, 10) || new Date().toISOString().substring(0, 10),
                    patient: {
                      fullName: selectedDocForPrint.patient_name,
                      birthDate: parsedData.patientDetails?.birthDate,
                      gender: parsedData.patientDetails?.gender,
                      address: parsedData.patientDetails?.address,
                      phone: parsedData.patientDetails?.phone
                    },
                    doctorName: selectedDocForPrint.doctor_name,
                    icd10Code: selectedDocForPrint.icd10_code || 'M17.0',
                    clinicalDiagnosis: selectedDocForPrint.clinical_diagnosis,
                    anamnesis: 'Пациент находился под амбулаторным наблюдением травматолога-ортопеда.',
                    performedManipulations: 'Проведен курс комплексной консервативной терапии, локальной инъекционной терапии, ЛФК.',
                    recommendations: 'Ортопедический режим, разгрузка сустава, ЛФК, повторный осмотр через 3 месяца.'
                  };
                  return <PatientExtractPrintTemplate ref={printComponentRef} data={extData} />;
                }

                if (docType === 'card') {
                  const cardData: PatientMedicalCardData = {
                    patient: {
                      id: selectedDocForPrint.patient_id || 1,
                      fullName: selectedDocForPrint.patient_name,
                      birthDate: parsedData.patientDetails?.birthDate,
                      gender: parsedData.patientDetails?.gender,
                      address: parsedData.patientDetails?.address,
                      phone: parsedData.patientDetails?.phone
                    },
                    protocolsHistory: [],
                    totalVisitsCount: 1,
                    doctorName: selectedDocForPrint.doctor_name
                  };
                  return <PatientMedicalCardPrintTemplate ref={printComponentRef} data={cardData} />;
                }

                if (docType === 'consent') {
                  const consentData: PatientConsentData = {
                    documentNumber: selectedDocForPrint.document_number,
                    issueDate: selectedDocForPrint.issue_date?.substring(0, 10) || new Date().toISOString().substring(0, 10),
                    patient: {
                      fullName: selectedDocForPrint.patient_name,
                      birthDate: parsedData.patientDetails?.birthDate,
                      address: parsedData.patientDetails?.address,
                      phone: parsedData.patientDetails?.phone
                    },
                    doctorName: selectedDocForPrint.doctor_name,
                    interventionType: parsedData.procedureName || 'Внутрисуставное введение лекарственных препаратов',
                    targetJoint: 'Коленный сустав',
                    clinicalDiagnosis: selectedDocForPrint.clinical_diagnosis
                  };
                  return <PatientConsentPrintTemplate ref={printComponentRef} data={consentData} />;
                }

                if (docType === 'memo') {
                  const memoData: PatientMemoData = {
                    documentNumber: selectedDocForPrint.document_number,
                    issueDate: selectedDocForPrint.issue_date?.substring(0, 10) || new Date().toISOString().substring(0, 10),
                    patient: {
                      fullName: selectedDocForPrint.patient_name,
                      phone: parsedData.patientDetails?.phone
                    },
                    doctorName: selectedDocForPrint.doctor_name,
                    studyType: parsedData.examTypeMemo || 'МРТ / КТ / УЗИ суставов',
                    preparationSteps: (parsedData.memoInstructions || '').split('\n').filter(Boolean),
                    regimeRecommendations: [
                      'Исключить ударные нагрузки на сустав (бег, прыжки, подъем тяжестей более 5 кг).',
                      'Носить назначенную ортопедическую поддержку при ходьбе.',
                      'Выполнять комплекс изометрической гимнастики (ЛФК).'
                    ]
                  };
                  return <PatientMemoPrintTemplate ref={printComponentRef} data={memoData} />;
                }

                // Default: 095/у
                const sickData: SickLeaveData = {
                  documentNumber: selectedDocForPrint.document_number,
                  issueDate: selectedDocForPrint.issue_date?.substring(0, 10) || new Date().toISOString().substring(0, 10),
                  patient: {
                    fullName: selectedDocForPrint.patient_name,
                    birthDate: parsedData.patientDetails?.birthDate,
                    gender: parsedData.patientDetails?.gender
                  },
                  reasonCode: '02',
                  reasonTitle: 'Травма / Ортопедическое заболевание',
                  employerName: selectedDocForPrint.recipient_organization || 'По месту учебы / работы',
                  workType: 'main',
                  startDate: parsedData.startDate || selectedDocForPrint.issue_date?.substring(0, 10),
                  endDate: parsedData.endDate || selectedDocForPrint.valid_until || '2026-11-15',
                  returnToWorkDate: parsedData.endDate || selectedDocForPrint.valid_until || '2026-11-16',
                  doctorName: selectedDocForPrint.doctor_name,
                  icd10Code: selectedDocForPrint.icd10_code,
                  clinicalDiagnosis: selectedDocForPrint.clinical_diagnosis,
                  isDuplicate: isDup
                };
                return <SickLeavePrintTemplate data={sickData} />;
              })()}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setPreviewOpen(false)}>
            Закрыть
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => handlePrint()}
            sx={{ fontWeight: 700, px: 3 }}
          >
            Печать на принтере (A4)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
