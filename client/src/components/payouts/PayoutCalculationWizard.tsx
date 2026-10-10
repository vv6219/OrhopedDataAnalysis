import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Tooltip,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CalculateIcon from '@mui/icons-material/Calculate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import { API_BASE_URL } from '../../config/apiConfig';

interface UnbilledService {
  source_type: string;
  source_id: number;
  dedup_hash: string;
  service_date: string;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  primary_doctor_id: number;
  doctor_name: string;
  operation_id: number;
  operation_name: string;
  revenue: number;
  catalog_price: number;
  materials_cost: number;
  material_cost_factor: number;
  margin_base: number;
  is_locked?: number;
  locked_by_user?: string | null;
}

interface CalculatedPreviewItem extends UnbilledService {
  doctor_id: number;
  doctor_rate: number;
  doctor_payout: number;
  doctor_applied_min: boolean;
  nurse_id: number;
  nurse_rate: number;
  nurse_payout: number;
  nurse_applied_min: boolean;
  total_payout: number;
  clinic_profit: number;
  brigade_total_pct: number;
}

interface PreviewSummary {
  operationsCount: number;
  totalRevenue: number;
  totalMaterialsCost: number;
  materialCostFactor: number;
  totalMarginBase: number;
  totalDoctorPayout: number;
  totalNursePayout: number;
  totalStaffPayouts: number;
  totalClinicProfit: number;
  effectiveFotPercentage: number;
  isExceedingCap: boolean;
}

interface StaffOption {
  id: number;
  full_name: string;
  role: string;
}

interface PayoutCalculationWizardProps {
  onCalculationCommitted: () => void;
  onCancel?: () => void;
}

const steps = [
  'Параметры смены и бригада',
  'Выбор визитов и сервисов',
  'Калькулятор и доли бригады',
  'Утверждение начисления'
];

export function PayoutCalculationWizard({ onCalculationCommitted, onCancel }: PayoutCalculationWizardProps) {
  const [activeStep, setActiveStep] = useState(0);

  // Step 1: Shift settings
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st day of current month
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(2); // Добрушкин А.М.
  const [selectedNurseId, setSelectedNurseId] = useState<number>(5); // Кузнецова А.В.
  const [staffList, setStaffList] = useState<StaffOption[]>([]);

  // Step 2: Unbilled services queue
  const [unbilledServices, setUnbilledServices] = useState<UnbilledService[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [loadingUnbilled, setLoadingUnbilled] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [lockToken, setLockToken] = useState<string | null>(null);

  // Step 3: Preview calculation
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewSummary, setPreviewSummary] = useState<PreviewSummary | null>(null);
  const [previewItems, setPreviewItems] = useState<CalculatedPreviewItem[]>([]);
  const [customDoctorPct, setCustomDoctorPct] = useState<number | ''>('');
  const [customNursePct, setCustomNursePct] = useState<number | ''>('');

  // Step 4: Commit
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<any | null>(null);

  // Fetch staff list on mount
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/staff`);
        if (res.ok) {
          const data = await res.json();
          setStaffList(data);
        }
      } catch (err) {
        console.error('Failed to load staff list', err);
      }
    };
    fetchStaff();
  }, []);

  // Fetch unbilled services when entering Step 2 or changing filters
  const fetchUnbilledServices = async () => {
    setLoadingUnbilled(true);
    try {
      let url = `${API_BASE_URL}/api/payouts/unbilled-services?startDate=${startDate}&endDate=${endDate}&limit=300`;
      if (selectedDoctorId) {
        url += `&doctorId=${selectedDoctorId}`;
      }
      if (searchFilter) {
        url += `&search=${encodeURIComponent(searchFilter)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUnbilledServices(data.services || []);
        // By default select all unlocked services
        const initialSelected = new Set<string>();
        (data.services || []).forEach((s: UnbilledService) => {
          if (!s.is_locked) {
            initialSelected.add(s.dedup_hash);
          }
        });
        setSelectedServiceIds(initialSelected);
      }
    } catch (err) {
      console.error('Failed to load unbilled services', err);
    } finally {
      setLoadingUnbilled(false);
    }
  };

  useEffect(() => {
    if (activeStep === 1) {
      fetchUnbilledServices();
    }
  }, [activeStep, startDate, endDate, selectedDoctorId]);

  // Handle service checkbox toggle
  const handleToggleService = (hash: string) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(hash)) {
        next.delete(hash);
      } else {
        next.add(hash);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allHashes = unbilledServices.filter(s => !s.is_locked).map(s => s.dedup_hash);
      setSelectedServiceIds(new Set(allHashes));
    } else {
      setSelectedServiceIds(new Set());
    }
  };

  // Step 2 -> 3: Soft-Lock and Preview Calculation
  const handleGoToPreview = async () => {
    const selectedList = unbilledServices.filter(s => selectedServiceIds.has(s.dedup_hash));
    if (selectedList.length === 0) {
      alert('Пожалуйста, выберите хотя бы один сервис для расчета');
      return;
    }

    setLoadingPreview(true);
    try {
      // 1. Acquire soft lock
      const lockRes = await fetch(`${API_BASE_URL}/api/payouts/lock-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: selectedList.map(s => ({ source_type: s.source_type, source_id: s.source_id })),
          userName: 'Бухгалтер-расчетчик'
        })
      });
      if (lockRes.ok) {
        const lockData = await lockRes.json();
        setLockToken(lockData.lockToken);
      }

      // 2. Calculate preview
      const previewRes = await fetch(`${API_BASE_URL}/api/payouts/preview-calculation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: selectedList,
          brigade: {
            primary_doctor_id: selectedDoctorId,
            nurse_id: selectedNurseId,
            custom_doctor_pct: customDoctorPct !== '' ? Number(customDoctorPct) : undefined,
            custom_nurse_pct: customNursePct !== '' ? Number(customNursePct) : undefined
          }
        })
      });

      if (previewRes.ok) {
        const previewData = await previewRes.json();
        setPreviewSummary(previewData.summary);
        setPreviewItems(previewData.items);
        setActiveStep(2);
      } else {
        const errData = await previewRes.json();
        alert('Ошибка расчета предпросмотра: ' + (errData.error || 'Ошибка сервера'));
      }
    } catch (err: any) {
      alert('Ошибка соединения: ' + err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Re-calculate preview if doctor or nurse percentages are adjusted in Step 3
  const handleRecalculatePreview = async () => {
    if (previewItems.length === 0) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/preview-calculation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: previewItems,
          brigade: {
            primary_doctor_id: selectedDoctorId,
            nurse_id: selectedNurseId,
            custom_doctor_pct: customDoctorPct !== '' ? Number(customDoctorPct) : undefined,
            custom_nurse_pct: customNursePct !== '' ? Number(customNursePct) : undefined
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewSummary(data.summary);
        setPreviewItems(data.items);
      }
    } catch (err) {
      console.error('Failed to recalculate preview', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Step 4: Commit calculation (ACID transaction)
  const handleCommitCalculation = async () => {
    if (previewItems.length === 0) return;
    setCommitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payouts/commit-calculation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculatedItems: previewItems,
          lockToken,
          notes: `Пакетное начисление за период с ${startDate} по ${endDate}`
        })
      });
      if (res.ok) {
        const result = await res.json();
        setCommitResult(result);
        setActiveStep(3);
        onCalculationCommitted();
      } else {
        const err = await res.json();
        alert('Ошибка при фиксации начисления: ' + (err.error || 'Ошибка базы данных'));
      }
    } catch (err: any) {
      alert('Сетевая ошибка: ' + err.message);
    } finally {
      setCommitting(false);
    }
  };

  // Clean up lock if user cancels wizard
  const handleCancelWizard = async () => {
    if (lockToken) {
      try {
        await fetch(`${API_BASE_URL}/api/payouts/unlock-services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lockToken })
        });
      } catch (err) {
        console.error('Failed to unlock services on cancel', err);
      }
    }
    if (onCancel) onCancel();
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

  return (
    <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #CBD5E1', bgcolor: '#FFFFFF' }}>
      {/* Stepper Header */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* STEP 0: SHIFT & BRIGADE SETUP */}
      {activeStep === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Укажите отчетный интервал дат и выберите бригаду смены. Назначенные врач и медсестра применятся ко всем выбранным сервисам.
          </Alert>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Period Selection */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalculateIcon fontSize="small" /> 1. Отчетный период дат
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Дата начала"
                    type="date"
                    size="small"
                    fullWidth
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    label="Дата окончания"
                    type="date"
                    size="small"
                    fullWidth
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Shift Brigade Assignment */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" /> 2. Комплектация смены бригады
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="doctor-select-label">Ведущий врач (хирург/ортопед)</InputLabel>
                    <Select
                      labelId="doctor-select-label"
                      label="Ведущий врач (хирург/ортопед)"
                      value={selectedDoctorId}
                      onChange={e => setSelectedDoctorId(Number(e.target.value))}
                    >
                      {staffList.filter(s => s.role.toLowerCase().includes('врач') || s.role.toLowerCase().includes('хирург') || s.id === 2 || s.id === 4).map(doc => (
                        <MenuItem key={doc.id} value={doc.id}>
                          {doc.full_name} ({doc.role})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth>
                    <InputLabel id="nurse-select-label">Дежурная операционная сестра</InputLabel>
                    <Select
                      labelId="nurse-select-label"
                      label="Дежурная операционная сестра"
                      value={selectedNurseId}
                      onChange={e => setSelectedNurseId(Number(e.target.value))}
                    >
                      {staffList.filter(s => s.role.toLowerCase().includes('сестра') || s.role.toLowerCase().includes('ассистент') || s.id === 5).map(nurse => (
                        <MenuItem key={nurse.id} value={nurse.id}>
                          {nurse.full_name} ({nurse.role})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            {onCancel && (
              <Button variant="outlined" color="inherit" onClick={handleCancelWizard}>
                Отмена
              </Button>
            )}
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => setActiveStep(1)}
              sx={{ bgcolor: '#0F3C64', px: 4 }}
            >
              Далее: Выбор визитов
            </Button>
          </Box>
        </Box>
      )}

      {/* STEP 1: SELECT UNBILLED VISITS */}
      {activeStep === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                Очередь нерассчитанных сервисов
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Выбрано: <strong>{selectedServiceIds.size}</strong> из <strong>{unbilledServices.length}</strong> доступных сервисов
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TextField
                size="small"
                placeholder="Поиск по пациенту или сервису..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                sx={{ width: 260 }}
              />
              <IconButton onClick={fetchUnbilledServices} title="Обновить список" sx={{ color: '#0F3C64' }}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>

          {loadingUnbilled ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#0F3C64' }} />
            </Box>
          ) : unbilledServices.length === 0 ? (
            <Alert severity="success" sx={{ my: 4 }}>
              Все выполненные визиты за выбранный период уже рассчитаны и включены в ведомости!
            </Alert>
          ) : (
            <Box sx={{ maxHeight: 420, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedServiceIds.size > 0 && selectedServiceIds.size < unbilledServices.filter(s => !s.is_locked).length}
                        checked={unbilledServices.length > 0 && selectedServiceIds.size === unbilledServices.filter(s => !s.is_locked).length}
                        onChange={e => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Дата</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Пациент (ЭМК)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Сервис</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Выручка</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Расходники*1.15</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Маржа базы</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Статус</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unbilledServices.map(svc => {
                    const isSelected = selectedServiceIds.has(svc.dedup_hash);
                    const isLocked = Boolean(svc.is_locked);

                    return (
                      <TableRow
                        key={svc.dedup_hash}
                        hover
                        selected={isSelected}
                        sx={{ bgcolor: isLocked ? '#F8FAFC' : 'inherit', opacity: isLocked ? 0.65 : 1 }}
                      >
                        <TableCell padding="checkbox">
                          {isLocked ? (
                            <Tooltip title={`Блокировано: ${svc.locked_by_user || 'коллегой'}`}>
                              <LockIcon fontSize="small" sx={{ color: '#94A3B8', ml: 1 }} />
                            </Tooltip>
                          ) : (
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleToggleService(svc.dedup_hash)}
                            />
                          )}
                        </TableCell>
                        <TableCell>{svc.service_date ? svc.service_date.slice(0, 10) : '—'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{svc.patient_name}</TableCell>
                        <TableCell>{svc.operation_name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(svc.revenue)}</TableCell>
                        <TableCell align="right" sx={{ color: '#D97706' }}>{formatCurrency(svc.materials_cost * svc.material_cost_factor)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#156C9C' }}>{formatCurrency(svc.margin_base)}</TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={svc.source_type === 'transaction' ? 'Кассовый чек' : 'Расписание'}
                            color={svc.source_type === 'transaction' ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => setActiveStep(0)}>
              Назад: Параметры
            </Button>
            <Button
              variant="contained"
              endIcon={loadingPreview ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
              disabled={selectedServiceIds.size === 0 || loadingPreview}
              onClick={handleGoToPreview}
              sx={{ bgcolor: '#0F3C64', px: 4 }}
            >
              Далее: Калькулятор долей ({selectedServiceIds.size})
            </Button>
          </Box>
        </Box>
      )}

      {/* STEP 2: PREVIEW CALCULATION & BRIGADE SHARES */}
      {activeStep === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {previewSummary && (
            <Card sx={{ bgcolor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Сервисов в выборке</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{previewSummary.operationsCount}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Общая выручка</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatCurrency(previewSummary.totalRevenue)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Маржинальная база</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#156C9C' }}>{formatCurrency(previewSummary.totalMarginBase)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Выплаты бригаде (ФОТ)</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      {formatCurrency(previewSummary.totalStaffPayouts)} ({previewSummary.effectiveFotPercentage}%)
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Остаток клиники</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: previewSummary.totalClinicProfit >= 0 ? '#16A34A' : '#DC2626' }}>
                      {formatCurrency(previewSummary.totalClinicProfit)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Rate Adjustment Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F3C64' }}>
              Массовая корректировка процентов бригады:
            </Typography>
            <TextField
              size="small"
              type="number"
              label="Врач %"
              sx={{ width: 120 }}
              value={customDoctorPct}
              onChange={e => setCustomDoctorPct(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <TextField
              size="small"
              type="number"
              label="Медсестра %"
              sx={{ width: 130 }}
              value={customNursePct}
              onChange={e => setCustomNursePct(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Button variant="outlined" size="small" onClick={handleRecalculatePreview} sx={{ fontWeight: 600 }}>
              Применить к расчету
            </Button>
          </Box>

          {/* Detailed Items Table */}
          <Box sx={{ maxHeight: 380, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Дата</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Пациент</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Сервис</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Маржа базы</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Врач (%)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Выплата врачу</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Сестра (%)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Выплата сестре</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Остаток клиники</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewItems.map((item, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{item.service_date ? item.service_date.slice(0, 10) : '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{item.patient_name}</TableCell>
                    <TableCell>{item.operation_name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#156C9C' }}>{formatCurrency(item.margin_base)}</TableCell>
                    <TableCell align="center">
                      <strong>{item.doctor_rate}%</strong>
                      {item.doctor_applied_min && <Chip size="small" label="гарантия" color="warning" sx={{ ml: 0.5, height: 18 }} />}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>{formatCurrency(item.doctor_payout)}</TableCell>
                    <TableCell align="center">
                      <strong>{item.nurse_rate}%</strong>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(item.nurse_payout)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: item.clinic_profit >= 0 ? '#16A34A' : '#DC2626' }}>
                      {formatCurrency(item.clinic_profit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => setActiveStep(1)}>
              Назад: Выбор визитов
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={committing ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              disabled={committing}
              onClick={handleCommitCalculation}
              sx={{ bgcolor: '#0F3C64', px: 4, fontWeight: 700 }}
            >
              Утвердить начисление в реестр
            </Button>
          </Box>
        </Box>
      )}

      {/* STEP 3: COMMIT SUCCESS */}
      {activeStep === 3 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
          <CheckCircleIcon sx={{ fontSize: 72, color: '#16A34A' }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
            Начисление успешно зафиксировано!
          </Typography>
          <Typography variant="body1" sx={{ color: '#4A5568', textAlign: 'center', maxWidth: 600 }}>
            Успешно обработано <strong>{commitResult?.committedProceduresCount || previewItems.length}</strong> сервисов и создано{' '}
            <strong>{commitResult?.createdAccrualsCount}</strong> персональных начислений для участников бригады.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => {
                setActiveStep(0);
                setSelectedServiceIds(new Set());
                setPreviewItems([]);
              }}
              sx={{ bgcolor: '#0F3C64' }}
            >
              Оформить новый расчет
            </Button>
            {onCancel && (
              <Button variant="outlined" onClick={onCancel}>
                Перейти в реестр выплат
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
