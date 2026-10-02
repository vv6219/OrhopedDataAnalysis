import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, Button, Stepper, Step, StepLabel, 
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Tooltip, Autocomplete, Chip, CircularProgress, Alert, Divider, IconButton,
  RadioGroup, FormControlLabel, Radio, FormControl, FormLabel, Card, CardContent,
  Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import { VisitReportTemplate, type VisitReportMaterial } from '../components/VisitReportTemplate';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonIcon from '@mui/icons-material/Person';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import InventoryIcon from '@mui/icons-material/Inventory';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

const steps = ['Выбор пациента и процедуры', 'Назначение персонала', 'Расход материалов', 'Расчет и оплата'];

interface OperationItem {
  id: number;
  name: string;
  price: number;
}

interface PatientItem {
  id: number;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  contact_phone?: string;
  contact?: string;
}

interface StaffItem {
  id: number;
  full_name: string;
  role: string;
  specialization?: string;
}

interface MaterialRow extends VisitReportMaterial {
  standard_qty: number;
}

export default function CheckoutWizard() {
  const [activeStep, setActiveStep] = useState(0);

  // Loaded Catalog Data from Server
  const [operationsList, setOperationsList] = useState<OperationItem[]>([]);
  const [patientsList, setPatientsList] = useState<PatientItem[]>([]);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [warehouseMaterials, setWarehouseMaterials] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);
  const [customPatientName, setCustomPatientName] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<OperationItem | null>(null);

  // Staff State
  const [selectedDoctor, setSelectedDoctor] = useState<StaffItem | null>(null);
  const [selectedNurse, setSelectedNurse] = useState<StaffItem | null>(null);
  const [visitNotes, setVisitNotes] = useState('');

  // Materials State (Dynamic BOM for the chosen operation)
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [actualMaterials, setActualMaterials] = useState<MaterialRow[]>([]);
  const [selectedAddMaterial, setSelectedAddMaterial] = useState<any | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [submittingTransaction, setSubmittingTransaction] = useState(false);
  const [savedTransactionResult, setSavedTransactionResult] = useState<any | null>(null);

  // PDF Report & Preview State
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Протокол_визита_${selectedPatient?.last_name || selectedPatient?.lastName || 'пациента'}_${selectedOperation?.name || 'процедура'}`,
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

  // 1. Fetch real master data from backend
  useEffect(() => {
    const fetchMasterData = async () => {
      setLoadingInitial(true);
      try {
        const [opsRes, patientsRes, staffRes, matRes] = await Promise.all([
          fetch('http://localhost:5000/api/operations'),
          fetch('http://localhost:5000/api/patients'),
          fetch('http://localhost:5000/api/staff'),
          fetch('http://localhost:5000/api/materials')
        ]);

        if (opsRes.ok) {
          const opsData = await opsRes.json();
          setOperationsList(opsData);
        }

        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          setPatientsList(patientsData);
          if (patientsData.length > 0) {
            setSelectedPatient(patientsData[0]);
          }
        }

        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaffList(staffData);
          const doc = staffData.find((s: StaffItem) => s.role.toLowerCase().includes('врач') || s.role.toLowerCase().includes('ортопед')) || staffData[0];
          const nurse = staffData.find((s: StaffItem) => s.role.toLowerCase().includes('медсестра') || s.role.toLowerCase().includes('сестра')) || staffData[1];
          if (doc) setSelectedDoctor(doc);
          if (nurse) setSelectedNurse(nurse);
        }

        if (matRes.ok) {
          const matData = await matRes.json();
          setWarehouseMaterials(matData);
        }
      } catch (err) {
        console.error('Error fetching master data for wizard', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchMasterData();
  }, []);

  // 2. When operation changes, fetch its real template materials (BOM)
  useEffect(() => {
    if (!selectedOperation) {
      setActualMaterials([]);
      return;
    }

    const fetchOperationBOM = async () => {
      setMaterialsLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/operations/${selectedOperation.id}/materials`);
        if (res.ok) {
          const bomData = await res.json();
          if (bomData && bomData.length > 0) {
            const mappedRows: MaterialRow[] = bomData.map((b: any) => ({
              material_id: b.material_id,
              material_name: b.material_name,
              unit_of_measure: b.unit_of_measure || 'шт',
              current_unit_cost: Number(b.current_unit_cost) || 0,
              standard_qty: Number(b.quantity) || 1,
              actual_qty: Number(b.quantity) || 1
            }));
            setActualMaterials(mappedRows);
          } else {
            setActualMaterials([]);
          }
        }
      } catch (e) {
        console.error('Failed to fetch operation BOM', e);
      } finally {
        setMaterialsLoading(false);
      }
    };

    fetchOperationBOM();
  }, [selectedOperation]);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleQtyChange = (material_id: number, newQty: number) => {
    const validQty = isNaN(newQty) || newQty < 0 ? 0 : newQty;
    setActualMaterials(actualMaterials.map(m => 
      m.material_id === material_id ? { ...m, actual_qty: validQty } : m
    ));
  };

  const handleRemoveMaterial = (material_id: number) => {
    setActualMaterials(actualMaterials.filter(m => m.material_id !== material_id));
  };

  const handleAddWarehouseMaterial = () => {
    if (!selectedAddMaterial) return;
    const exists = actualMaterials.find(m => m.material_id === selectedAddMaterial.id);
    if (exists) {
      setActualMaterials(actualMaterials.map(m => 
        m.material_id === selectedAddMaterial.id ? { ...m, actual_qty: m.actual_qty + 1 } : m
      ));
    } else {
      setActualMaterials([
        ...actualMaterials,
        {
          material_id: selectedAddMaterial.id,
          material_name: selectedAddMaterial.material_name,
          unit_of_measure: selectedAddMaterial.unit_of_measure || 'шт',
          current_unit_cost: Number(selectedAddMaterial.current_unit_cost) || 0,
          standard_qty: 0,
          actual_qty: 1
        }
      ]);
    }
    setSelectedAddMaterial(null);
  };

  const calculateTotalCost = () => {
    return actualMaterials.reduce((acc, curr) => acc + (curr.actual_qty * curr.current_unit_cost), 0);
  };

  const getPatientDisplayName = (p: PatientItem | null) => {
    if (!p) return customPatientName || 'Пациент не указан';
    const first = p.first_name || p.firstName || '';
    const last = p.last_name || p.lastName || '';
    const phone = p.contact_phone || p.contact || '';
    return `${last} ${first}`.trim() + (phone ? ` (${phone})` : '');
  };

  const handleCompleteTransaction = async () => {
    if (!selectedOperation) return;
    setSubmittingTransaction(true);

    const billed_price = selectedOperation.price || 0;
    const calculated_cost = calculateTotalCost();
    const net_profit = billed_price - calculated_cost;

    const payload = {
      patient_id: selectedPatient?.id || 1,
      operation_id: selectedOperation.id,
      billed_price,
      calculated_cost,
      net_profit,
      notes: visitNotes || `Процедура: ${selectedOperation.name}. Врач: ${selectedDoctor?.full_name || 'Н/Д'}. Оплата: ${paymentMethod}`,
      materials: actualMaterials.map(m => ({
        material_id: m.material_id,
        quantity_used: m.actual_qty,
        actual_cost_at_time: m.current_unit_cost
      }))
    };

    try {
      const res = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const result = await res.json();
        setSavedTransactionResult(result);
        setActiveStep(steps.length);
      } else {
        const err = await res.json();
        alert('Ошибка при сохранении визита: ' + (err.error || 'Ошибка сервера'));
      }
    } catch (e: any) {
      alert('Сетевая ошибка: ' + e.message);
    } finally {
      setSubmittingTransaction(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedOperation(null);
    setActualMaterials([]);
    setSavedTransactionResult(null);
    setVisitNotes('');
  };

  if (loadingInitial) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress size={48} sx={{ color: '#0F3C64' }} />
        <Typography variant="body1" sx={{ color: '#4A5568' }}>
          Загрузка каталога операций и базы пациентов...
        </Typography>
      </Box>
    );
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Patient Section */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon /> 1. Выберите пациента (ЭМК)
              </Typography>

              <Autocomplete
                options={patientsList}
                getOptionLabel={(p) => getPatientDisplayName(p)}
                value={selectedPatient}
                onChange={(_, val) => setSelectedPatient(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Поиск пациента по ФИО или телефону"
                    placeholder="Начните вводить фамилию..."
                    helperText="Выберите существующего пациента из картотеки или введите новое имя ниже"
                    fullWidth
                  />
                )}
              />

              {!selectedPatient && (
                <TextField
                  sx={{ mt: 2 }}
                  fullWidth
                  label="Новый пациент (ФИО)"
                  placeholder="Иванов Иван Иванович"
                  value={customPatientName}
                  onChange={(e) => setCustomPatientName(e.target.value)}
                />
              )}
            </Paper>

            {/* Procedure Section: REAL Operations Catalog */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalHospitalIcon /> 2. Выберите процедуру из Каталога операций ({operationsList.length})
              </Typography>

              <Typography variant="body2" sx={{ color: '#718096', mb: 2 }}>
                Доступны все официальные процедуры клиники с утвержденным прайсом и технологическими картами расхода.
              </Typography>

              <Autocomplete
                options={operationsList}
                getOptionLabel={(op) => `${op.name} — ₽${op.price.toLocaleString('ru-RU')}`}
                value={selectedOperation}
                onChange={(_, val) => setSelectedOperation(val)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', py: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#2D3748' }}>
                        {option.name}
                      </Typography>
                      <Chip
                        label={`₽${option.price.toLocaleString('ru-RU')}`}
                        size="small"
                        sx={{ bgcolor: '#E2E8F0', fontWeight: 700, color: '#0F3C64', ml: 1 }}
                      />
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Поиск процедуры в Каталоге операций"
                    placeholder="Введите название процедуры (например: Инъекция, Артроскопия, PRP, Турбокаст)..."
                    fullWidth
                  />
                )}
              />

              {selectedOperation && (
                <Card sx={{ mt: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E0', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', fontWeight: 700 }}>
                          Выбранная процедура (Код #{selectedOperation.id})
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                          {selectedOperation.name}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: '#718096' }}>Стоимость по прайсу</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#156C9C' }}>
                          ₽{selectedOperation.price.toLocaleString('ru-RU')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Paper>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedicalServicesIcon /> Назначение ответственного медперсонала
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Autocomplete
                  options={staffList}
                  getOptionLabel={(s) => `${s.full_name} (${s.role})`}
                  value={selectedDoctor}
                  onChange={(_, val) => setSelectedDoctor(val)}
                  renderInput={(params) => (
                    <TextField {...params} label="Лечащий врач (Ортопед / Хирург)" fullWidth />
                  )}
                />

                <Autocomplete
                  options={staffList}
                  getOptionLabel={(s) => `${s.full_name} (${s.role})`}
                  value={selectedNurse}
                  onChange={(_, val) => setSelectedNurse(val)}
                  renderInput={(params) => (
                    <TextField {...params} label="Ассистирующая медсестра" fullWidth />
                  )}
                />
              </Box>

              <TextField
                sx={{ mt: 3 }}
                fullWidth
                multiline
                rows={3}
                label="Клинические заметки / Жалобы / Анамнез визита"
                placeholder="Укажите особенности проведения манипуляции, диагноз или рекомендации..."
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
              />
            </Paper>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon /> Расход материалов для: {selectedOperation?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    Спецификация списания со склада на основании технологической карты (BOM)
                  </Typography>
                </Box>

                <Typography variant="h6" sx={{ color: '#E53E3E', fontWeight: 800 }}>
                  Себестоимость материалов: ₽{calculateTotalCost().toLocaleString('ru-RU')}
                </Typography>
              </Box>

              {materialsLoading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" sx={{ mt: 1, color: '#718096' }}>Загрузка шаблона расхода материалов...</Typography>
                </Box>
              ) : (
                <>
                  {actualMaterials.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                      Для выбранной процедуры технологическая карта расхода материалов еще не заполнена в справочнике. Вы можете добавить фактически использованные со склада материалы ниже.
                    </Alert>
                  ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #E2E8F0', mb: 3 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Наименование материала</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Себестоимость (₽)</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Норма (BOM)</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#0F3C64', width: 140 }}>Факт. расход</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>Сумма расхода (₽)</TableCell>
                            <TableCell align="center" sx={{ width: 60 }}></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {actualMaterials.map((row) => (
                            <TableRow key={row.material_id} hover>
                              <TableCell sx={{ fontWeight: 600 }}>{row.material_name}</TableCell>
                              <TableCell>₽{row.current_unit_cost.toLocaleString('ru-RU')} / {row.unit_of_measure}</TableCell>
                              <TableCell sx={{ color: '#718096' }}>{row.standard_qty} {row.unit_of_measure}</TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={row.actual_qty}
                                  onChange={(e) => handleQtyChange(row.material_id, Number(e.target.value))}
                                  inputProps={{ min: 0, step: 0.1 }}
                                  sx={{ width: 100 }}
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#2D3748' }}>
                                ₽{(row.actual_qty * row.current_unit_cost).toLocaleString('ru-RU')}
                              </TableCell>
                              <TableCell align="center">
                                <IconButton size="small" onClick={() => handleRemoveMaterial(row.material_id)} sx={{ color: '#E53E3E' }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                            <TableCell colSpan={4} align="right" sx={{ fontWeight: 700 }}>
                              Итоговая сумма списания материалов:
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: '#E53E3E', fontSize: '1rem' }}>
                              ₽{calculateTotalCost().toLocaleString('ru-RU')}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {/* Add Extra Material from Warehouse */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px dashed #CBD5E0' }}>
                    <Autocomplete
                      sx={{ flexGrow: 1 }}
                      size="small"
                      options={warehouseMaterials}
                      getOptionLabel={(m) => `${m.material_name} (${m.current_unit_cost} ₽/${m.unit_of_measure})`}
                      value={selectedAddMaterial}
                      onChange={(_, val) => setSelectedAddMaterial(val)}
                      renderInput={(params) => (
                        <TextField {...params} label="Дополнительный материал со склада" placeholder="Выберите материал..." />
                      )}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddWarehouseMaterial}
                      disabled={!selectedAddMaterial}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Добавить расход
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
          </Box>
        );

      case 3:
        const billed = selectedOperation ? selectedOperation.price : 0;
        const matCost = calculateTotalCost();
        const profit = billed - matCost;
        const marginPercent = billed > 0 ? ((profit / billed) * 100).toFixed(1) : '0';

        return (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0', maxWidth: 850, mx: 'auto', width: '100%' }}>
              
              {/* Card Header with PDF Report Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PriceCheckIcon sx={{ fontSize: 32, color: '#0F3C64' }} />
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    Итог визита и финансовый расчет
                  </Typography>
                </Box>

                {/* PDF Output Actions */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Открыть предварительный просмотр печатной формы A4" arrow>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setPdfPreviewOpen(true)}
                      sx={{
                        borderColor: '#0F3C64',
                        color: '#0F3C64',
                        fontWeight: 700,
                        '&:hover': { bgcolor: 'rgba(15, 60, 100, 0.05)' }
                      }}
                    >
                      Предпросмотр PDF
                    </Button>
                  </Tooltip>

                  <Tooltip title="Сформировать и отправить на печать / сохранить в PDF" arrow>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PrintIcon />}
                      onClick={() => handlePrintTrigger()}
                      sx={{
                        bgcolor: '#0F3C64',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#082540' }
                      }}
                    >
                      Печать / PDF
                    </Button>
                  </Tooltip>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', fontWeight: 700 }}>
                    Пациент (ЭМК)
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {getPatientDisplayName(selectedPatient)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', fontWeight: 700 }}>
                    Лечащий персонал
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedDoctor?.full_name || 'Не назначен'} {selectedNurse ? `(Ассистент: ${selectedNurse.full_name})` : ''}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', fontWeight: 700 }}>
                  Процедура из Каталога операций
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                  {selectedOperation?.name}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Financial Calculation Breakdown */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, my: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#4A5568' }}>
                    Стоимость услуги для пациента (по прайсу):
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    ₽{billed.toLocaleString('ru-RU')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#E53E3E' }}>
                    Себестоимость фактически списанных материалов ({actualMaterials.length} поз.):
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#E53E3E' }}>
                    - ₽{matCost.toLocaleString('ru-RU')}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#F0FFF4', borderRadius: 2, border: '1px solid #C6F6D5' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#276749' }}>
                      Расчетный маржинальный доход:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#38A169', fontWeight: 600 }}>
                      Рентабельность процедуры: {marginPercent}%
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#22543D' }}>
                    ₽{profit.toLocaleString('ru-RU')}
                  </Typography>
                </Box>
              </Box>

              {/* Payment Method Selector */}
              <FormControl component="fieldset" sx={{ mt: 2 }}>
                <FormLabel component="legend" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '0.9rem' }}>
                  Способ оплаты
                </FormLabel>
                <RadioGroup row value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <FormControlLabel value="card" control={<Radio />} label="Банковская карта" />
                  <FormControlLabel value="cash" control={<Radio />} label="Наличные" />
                  <FormControlLabel value="sbp" control={<Radio />} label="СБП / QR-код" />
                  <FormControlLabel value="invoice" control={<Radio />} label="Безналичный счет (Юр. лицо)" />
                </RadioGroup>
              </FormControl>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: '-0.5px', mb: 1 }}>
        Оформление визита пациента
      </Typography>
      <Typography variant="body1" sx={{ color: '#718096', mb: 3 }}>
        Пошаговый мастер регистрации проведенных процедур из официального Каталога операций с расчетом списания материалов и генерацией печатного PDF протокола.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { fontWeight: 600 } }}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Completion Step */}
      {activeStep === steps.length ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #C6F6D5', bgcolor: '#F0FFF4' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: '#38A169', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#22543D', mb: 1 }}>
            Визит успешно оформлен!
          </Typography>
          <Typography variant="body1" sx={{ color: '#276749', mb: 3, maxWidth: 600, mx: 'auto' }}>
            Транзакция #{savedTransactionResult?.transactionId || 'OK'} зафиксирована в базе данных. Списание материалов и начисление стоимости привязаны к электронной карте пациента.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => handlePrintTrigger()}
              sx={{
                borderColor: '#0F3C64',
                color: '#0F3C64',
                fontWeight: 700,
                px: 3,
                py: 1.2,
                '&:hover': { bgcolor: 'rgba(15, 60, 100, 0.05)' }
              }}
            >
              Распечатать PDF протокол
            </Button>
            <Button
              variant="contained"
              onClick={handleReset}
              sx={{ bgcolor: '#0F3C64', fontWeight: 700, px: 4, py: 1.2, '&:hover': { bgcolor: '#082540' } }}
            >
              Оформить новый визит
            </Button>
          </Box>
        </Paper>
      ) : (
        <Box>
          {getStepContent(activeStep)}

          {/* Stepper Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, pt: 2, borderTop: '1px solid #E2E8F0' }}>
            <Button
              variant="outlined"
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              sx={{ fontWeight: 600 }}
            >
              Назад
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleCompleteTransaction}
                disabled={submittingTransaction}
                startIcon={submittingTransaction ? <CircularProgress size={18} color="inherit" /> : <PaymentIcon />}
                sx={{
                  bgcolor: '#38A169',
                  fontWeight: 800,
                  px: 4,
                  py: 1.2,
                  '&:hover': { bgcolor: '#2F855A' }
                }}
              >
                {submittingTransaction ? 'Сохранение...' : 'Завершить транзакцию и оплатить'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={activeStep === 0 && !selectedOperation}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: '#0F3C64',
                  fontWeight: 700,
                  px: 4,
                  py: 1.2,
                  '&:hover': { bgcolor: '#082540' }
                }}
              >
                Далее
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* PDF PREVIEW MODAL DIALOG */}
      <Dialog
        open={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { bgcolor: '#F1F5F9', borderRadius: 3, maxHeight: '90vh' }
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            py: 1.5,
            px: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PictureAsPdfIcon sx={{ color: '#E53E3E' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.05rem' }}>
              Предварительный просмотр печатного протокола (PDF)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={() => handlePrintTrigger()}
              sx={{ bgcolor: '#0F3C64', fontWeight: 700, '&:hover': { bgcolor: '#082540' } }}
            >
              Печать / Сохранить в PDF
            </Button>
            <IconButton size="small" onClick={() => setPdfPreviewOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, md: 3 }, display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
          <Paper
            elevation={3}
            sx={{
              width: '100%',
              maxWidth: '850px',
              bgcolor: '#FFFFFF',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
            }}
          >
            <VisitReportTemplate
              patientName={getPatientDisplayName(selectedPatient)}
              patientPhone={selectedPatient?.contact_phone || selectedPatient?.contact || ''}
              operationName={selectedOperation?.name || ''}
              operationPrice={selectedOperation?.price || 0}
              doctorName={selectedDoctor?.full_name}
              nurseName={selectedNurse?.full_name}
              materials={actualMaterials}
              paymentMethod={paymentMethod}
              notes={visitNotes}
              transactionDate={new Date()}
              transactionId={savedTransactionResult?.transactionId || 'ПРЕДПРОСМОТР'}
            />
          </Paper>
        </DialogContent>
      </Dialog>

      {/* HIDDEN PRINT CONTAINER (for react-to-print) */}
      <Box sx={{ display: 'none' }}>
        <VisitReportTemplate
          ref={printRef}
          patientName={getPatientDisplayName(selectedPatient)}
          patientPhone={selectedPatient?.contact_phone || selectedPatient?.contact || ''}
          operationName={selectedOperation?.name || ''}
          operationPrice={selectedOperation?.price || 0}
          doctorName={selectedDoctor?.full_name}
          nurseName={selectedNurse?.full_name}
          materials={actualMaterials}
          paymentMethod={paymentMethod}
          notes={visitNotes}
          transactionDate={new Date()}
          transactionId={savedTransactionResult?.transactionId}
        />
      </Box>
    </Box>
  );
}
