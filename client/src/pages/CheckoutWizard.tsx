import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/apiConfig';
import { 
  Typography, Box, Paper, Button, Stepper, Step, StepLabel, 
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Tooltip, Autocomplete, Chip, CircularProgress, Alert, Divider, IconButton,
  RadioGroup, FormControlLabel, Radio, FormControl, FormLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel,
  Switch
} from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import { VisitReportTemplate, type VisitReportMaterial } from '../components/VisitReportTemplate';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonIcon from '@mui/icons-material/Person';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
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
import EventIcon from '@mui/icons-material/Event';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReplayIcon from '@mui/icons-material/Replay';
import UsbIcon from '@mui/icons-material/Usb';
import SpeedIcon from '@mui/icons-material/Speed';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { useFiscal } from '../context/FiscalContext';
import { usePos } from '../context/PosContext';
import { PosSlipPrintTemplate } from './PosTestWizard';

const steps = ['Выбор пациента и сервисов', 'Назначение сотрудников', 'Расход материалов', 'Расчет и оплата'];

interface OperationItem {
  id: number;
  name: string;
  price: number;
}

export interface SelectedOperationItem extends OperationItem {
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface PatientItem {
  id: number;
  full_name?: string;
  surname?: string;
  name?: string;
  patron?: string;
  brief_name?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  sphone?: string;
  contact_phone?: string;
  contact?: string;
  mednum?: number | string;
  bdate?: string;
  age?: number;
  sex_display?: string;
  city?: string;
  address?: string;
  email?: string;
  dms_insurer?: string;
}

interface StaffItem {
  id: number;
  full_name: string;
  role: string;
  specialization?: string;
}

interface MaterialRow extends VisitReportMaterial {
  standard_qty: number;
  operation_id?: number;
  operation_name?: string;
  row_id: string;
}

export default function CheckoutWizard() {
  const [searchParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const hasAppliedPrefillRef = useRef(false);

  // Visit Date State
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Loaded Catalog Data from Server
  const [operationsList, setOperationsList] = useState<OperationItem[]>([]);
  const [patientsList, setPatientsList] = useState<PatientItem[]>([]);
  const [defaultPatients, setDefaultPatients] = useState<PatientItem[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearching, setPatientSearching] = useState(false);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [warehouseMaterials, setWarehouseMaterials] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);
  const [customPatientName, setCustomPatientName] = useState('');
  const [selectedOperations, setSelectedOperations] = useState<SelectedOperationItem[]>([]);
  const [pendingOperation, setPendingOperation] = useState<OperationItem | null>(null);

  // Staff State
  const [selectedDoctor, setSelectedDoctor] = useState<StaffItem | null>(null);
  const [selectedNurse, setSelectedNurse] = useState<StaffItem | null>(null);
  const [visitNotes, setVisitNotes] = useState('');

  // Materials State (Dynamic BOM for the chosen operation)
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [actualMaterials, setActualMaterials] = useState<MaterialRow[]>([]);
  const [selectedAddMaterial, setSelectedAddMaterial] = useState<any | null>(null);
  const [targetServiceForAdd, setTargetServiceForAdd] = useState<number | 'general'>('general');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [submittingTransaction, setSubmittingTransaction] = useState(false);
  const [savedTransactionResult, setSavedTransactionResult] = useState<any | null>(null);

  // Fiscal Registration State (ККТ АТОЛ 91Ф 54-ФЗ)
  const {
    fiscalStatus: globalFiscalStatus,
    refreshFiscalStatus,
    setMockMode: setGlobalMockMode,
    testConnection: testGlobalConnection
  } = useFiscal();

  // POS Acquiring Terminal State (Альфа-Банк Arcus-2)
  const {
    posStatus,
    setMockMode: setGlobalPosMockMode,
    testHost: testGlobalPosHost
  } = usePos();

  const [fiscalize, setFiscalize] = useState(true);
  const [patientContact, setPatientContact] = useState('');
  const [fiscalStatus, setFiscalStatus] = useState<any | null>(globalFiscalStatus || null);
  const [reprintingFiscal, setReprintingFiscal] = useState(false);
  const [switchingFiscalMode, setSwitchingFiscalMode] = useState(false);
  const [testingFiscalConnection, setTestingFiscalConnection] = useState(false);
  const [fiscalTestDialogOpen, setFiscalTestDialogOpen] = useState(false);
  const [fiscalTestResult, setFiscalTestResult] = useState<any | null>(null);

  // POS State
  const [switchingPosMode, setSwitchingPosMode] = useState(false);
  const [testingPosHost, setTestingPosHost] = useState(false);
  const [posSlipDialogOpen, setPosSlipDialogOpen] = useState(false);
  const [activePosSlipTx, setActivePosSlipTx] = useState<any | null>(null);
  const printSlipRef = useRef<HTMLDivElement>(null);

  const handlePrintPosSlip = useReactToPrint({
    contentRef: printSlipRef,
    documentTitle: `AlfaBank_Slip_${savedTransactionResult?.posPayment?.rrn || 'Auth'}`
  });

  useEffect(() => {
    if (globalFiscalStatus) {
      setFiscalStatus(globalFiscalStatus);
    }
  }, [globalFiscalStatus]);

  const fetchFiscalStatus = async () => {
    try {
      await refreshFiscalStatus();
    } catch {
      // fallback silent
    }
  };

  const handleTogglePosMode = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIsMock = !event.target.checked;
    setSwitchingPosMode(true);
    try {
      await setGlobalPosMockMode(newIsMock);
    } catch (err: any) {
      alert('Ошибка переключения режима эквайринга: ' + (err.message || err));
    } finally {
      setSwitchingPosMode(false);
    }
  };

  const handleTestPosHost = async () => {
    setTestingPosHost(true);
    try {
      const res = await testGlobalPosHost();
      if (res.success) {
        alert(`Связь с процессингом Альфа-Банка подтверждена!\nКод ответа: ${res.responseCode || '00'}\nТерминал: ${posStatus?.terminalId || 'ALFA_770192'}\nРежим: ${posStatus?.isMockMode ? 'Эмуляция (Mock)' : 'Физический терминал'}`);
      } else {
        alert('Ошибка связи с банком: ' + (res.error || res.message || 'Нет ответа от хоста'));
      }
    } catch (err: any) {
      alert('Сбой проверки связи с банком: ' + err.message);
    } finally {
      setTestingPosHost(false);
    }
  };

  const handleToggleFiscalMode = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIsMockMode = !event.target.checked;
    setSwitchingFiscalMode(true);
    try {
      await setGlobalMockMode(newIsMockMode, undefined, 'Регистратура (Оформление визита)');
    } catch (err: any) {
      console.error('Error toggling fiscal mode:', err);
    } finally {
      setSwitchingFiscalMode(false);
    }
  };

  const handleTestFiscalConnection = async () => {
    setTestingFiscalConnection(true);
    setFiscalTestDialogOpen(true);
    setFiscalTestResult(null);
    try {
      const data = await testGlobalConnection();
      setFiscalTestResult(data);
    } catch (err: any) {
      setFiscalTestResult({
        success: false,
        isMockMode: fiscalStatus?.isMockMode ?? true,
        modeLabel: fiscalStatus?.isMockMode ? 'Эмулятор ККТ (Mock)' : 'Реальное оборудование (COM-порт)',
        deviceModel: fiscalStatus?.deviceModel || 'АТОЛ 91Ф',
        port: fiscalStatus?.port || 'COM3',
        baudRate: fiscalStatus?.baudRate || 115200,
        latencyMs: 0,
        message: `Ошибка сетевого запроса: ${err.message}`,
        error: err.message
      });
    } finally {
      setTestingFiscalConnection(false);
    }
  };

  const handleSwitchToMockInDialog = async () => {
    setSwitchingFiscalMode(true);
    try {
      await setGlobalMockMode(true, undefined, 'Регистратура (Оформление визита)');
      await handleTestFiscalConnection();
    } catch (err: any) {
      console.error('Error switching to mock in dialog:', err);
    } finally {
      setSwitchingFiscalMode(false);
    }
  };

  useEffect(() => {
    if (selectedPatient) {
      const contact = selectedPatient.phone || selectedPatient.contact_phone || selectedPatient.email || selectedPatient.sphone || '';
      if (contact) {
        setPatientContact(contact);
      }
    }
  }, [selectedPatient]);

  useEffect(() => {
    fetchFiscalStatus();
  }, []);

  // PDF Report & Preview State
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Протокол_визита_${selectedPatient?.last_name || selectedPatient?.lastName || selectedPatient?.surname || 'пациента'}_${selectedOperations[0]?.name || 'процедура'}`,
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
          fetch(`${API_BASE_URL}/api/operations`),
          fetch(`${API_BASE_URL}/api/patients`),
          fetch(`${API_BASE_URL}/api/staff`),
          fetch(`${API_BASE_URL}/api/materials`)
        ]);

        let loadedOps: any[] = [];
        let loadedPatients: any[] = [];

        if (opsRes.ok) {
          loadedOps = await opsRes.json();
          setOperationsList(loadedOps);
        }

        if (patientsRes.ok) {
          loadedPatients = await patientsRes.json();
          setPatientsList(loadedPatients);
          setDefaultPatients(loadedPatients);
        }

        let loadedStaff: any[] = [];
        if (staffRes.ok) {
          loadedStaff = await staffRes.json();
          setStaffList(loadedStaff);
          const doc = loadedStaff.find((s: StaffItem) => s.role.toLowerCase().includes('врач') || s.role.toLowerCase().includes('ортопед')) || loadedStaff[0];
          const nurse = loadedStaff.find((s: StaffItem) => s.role.toLowerCase().includes('медсестра') || s.role.toLowerCase().includes('сестра')) || loadedStaff[1];
          if (doc) setSelectedDoctor(doc);
          if (nurse) setSelectedNurse(nurse);
        }

        if (matRes.ok) {
          const matData = await matRes.json();
          setWarehouseMaterials(matData);
        }

        // Check for prefill from Ortho Workstation via sessionStorage or URL params
        const prefillStr = sessionStorage.getItem('ortho_checkout_prefill');
        let prefill: any = null;
        if (prefillStr) {
          try {
            prefill = JSON.parse(prefillStr);
          } catch (e) {
            console.error('Error parsing ortho_checkout_prefill:', e);
          }
        }

        const urlPatientId = searchParams.get('patientId');
        const urlPatientName = searchParams.get('patientName');
        const urlProtocolId = searchParams.get('protocolId');
        const urlAppointmentId = searchParams.get('appointmentId');

        // Multi-source recovery: If prefill is empty or has no items, try loading prescriptions from backend
        if ((!prefill || !prefill.items || prefill.items.length === 0) && (urlProtocolId || urlAppointmentId)) {
          try {
            if (urlProtocolId) {
              const prescRes = await fetch(`${API_BASE_URL}/api/ortho/prescriptions/${urlProtocolId}`);
              if (prescRes.ok) {
                const prescData = await prescRes.json();
                if (prescData.prescriptions && prescData.prescriptions.length > 0) {
                  prefill = {
                    ...(prefill || {}),
                    protocolId: urlProtocolId,
                    items: prescData.prescriptions
                  };
                }
              }
            } else if (urlAppointmentId) {
              const ctxRes = await fetch(`${API_BASE_URL}/api/ortho/context?appointmentId=${urlAppointmentId}`);
              if (ctxRes.ok) {
                const ctxData = await ctxRes.json();
                if (ctxData.currentPrescriptions && ctxData.currentPrescriptions.length > 0) {
                  prefill = {
                    ...(prefill || {}),
                    appointmentId: urlAppointmentId,
                    patientId: ctxData.patient?.id,
                    patientName: ctxData.patient?.full_name,
                    doctorId: ctxData.doctor?.id,
                    items: ctxData.currentPrescriptions
                  };
                }
              }
            }
          } catch (recoveryErr) {
            console.warn('Could not auto-recover prescriptions from protocol API:', recoveryErr);
          }
        }

        const targetPatientId = prefill?.patientId || (urlPatientId ? Number(urlPatientId) : null);
        const targetPatientName = prefill?.patientName || urlPatientName;

        let patientPrefillApplied = false;
        let operationsPrefillApplied = false;

        if (targetPatientId) {
          let matchPt = loadedPatients.find((p: any) => p.id === Number(targetPatientId));
          if (!matchPt) {
            try {
              const ptRes = await fetch(`${API_BASE_URL}/api/patients/${targetPatientId}`);
              if (ptRes.ok) {
                matchPt = await ptRes.json();
              }
            } catch (err) {
              console.error('Error fetching patient by target ID:', err);
            }
          }

          if (matchPt) {
            setSelectedPatient(matchPt);
            // Ensure this target patient is prominently placed at index 0 of all options lists
            setPatientsList(prev => [matchPt, ...prev.filter(p => p.id !== matchPt.id)]);
            setDefaultPatients(prev => [matchPt, ...prev.filter(p => p.id !== matchPt.id)]);
            const contact = matchPt.phone || matchPt.sphone || matchPt.contact_phone || matchPt.email || '';
            if (contact) setPatientContact(contact);
            patientPrefillApplied = true;
          } else if (targetPatientName) {
            const stubPt: PatientItem = {
              id: Number(targetPatientId),
              full_name: targetPatientName,
              surname: targetPatientName
            };
            setSelectedPatient(stubPt);
            setPatientsList(prev => [stubPt, ...prev]);
            setDefaultPatients(prev => [stubPt, ...prev]);
            patientPrefillApplied = true;
          }
        }

        const candidateItems = (prefill?.items && Array.isArray(prefill.items) && prefill.items.length > 0)
          ? prefill.items
          : null;

        if (candidateItems && candidateItems.length > 0) {
          const normalize = (s: string) => (s || '').toLowerCase().replace(/[\s()\-_.,/]/g, '');
          const mapped = candidateItems.map((it: any, i: number) => {
            const itemPrice = Number(it.price ?? it.unitPrice ?? it.unit_price ?? 0);
            const itemQty = Number(it.quantity || 1);
            const itName = (it.name || it.title || '').trim();
            const itCode = (it.code || it.service_code || it.serviceCode || '').trim();
            const rawId = it.id || it.serviceId || it.service_id;

            // Match against loadedOps to link real materials (BOM), margin, and official service id
            let matchedOp: any = null;
            if (rawId && loadedOps.some((o: any) => o.id === Number(rawId))) {
              matchedOp = loadedOps.find((o: any) => o.id === Number(rawId));
            } else if (itCode && loadedOps.some((o: any) => o.code && String(o.code).trim() === itCode)) {
              matchedOp = loadedOps.find((o: any) => o.code && String(o.code).trim() === itCode);
            } else if (itName) {
              const normIt = normalize(itName);
              const exactMatches = loadedOps.filter((o: any) => normalize(o.name || '') === normIt);
              if (exactMatches.length === 1) {
                matchedOp = exactMatches[0];
              } else if (exactMatches.length > 1) {
                matchedOp = exactMatches.find((o: any) => Number(o.price) === itemPrice) || exactMatches[0];
              } else {
                const partialMatches = loadedOps.filter((o: any) => {
                  const normO = normalize(o.name || '');
                  return (normO.length > 3 && normIt.length > 3) && (normO.includes(normIt) || normIt.includes(normO));
                });
                if (partialMatches.length > 0) {
                  matchedOp = partialMatches.find((o: any) => Number(o.price) === itemPrice) || partialMatches[0];
                }
              }
            }

            if (matchedOp) {
              const finalPrice = itemPrice > 0 ? itemPrice : Number(matchedOp.price || 0);
              return {
                id: matchedOp.id,
                name: matchedOp.name,
                code: matchedOp.code || itCode || '',
                price: finalPrice,
                unit_price: finalPrice,
                quantity: itemQty,
                subtotal: finalPrice * itemQty,
                materials_count: matchedOp.materials_count,
                margin: matchedOp.margin
              };
            }

            return {
              id: rawId ? Number(rawId) : (99000 + i),
              name: itName || 'Медицинская услуга',
              code: itCode,
              price: itemPrice,
              unit_price: itemPrice,
              quantity: itemQty,
              subtotal: itemPrice * itemQty
            };
          });

          setSelectedOperations(mapped);
          operationsPrefillApplied = true;
          hasAppliedPrefillRef.current = true;
        }

        const targetDoctorId = prefill?.doctorId || searchParams.get('doctorId');
        if (targetDoctorId && loadedStaff.length > 0) {
          const matchedDoc = loadedStaff.find((s: StaffItem) => s.id === Number(targetDoctorId));
          if (matchedDoc) {
            setSelectedDoctor(matchedDoc);
          }
        }

        // Only fall back to defaults if respective item was NOT prefilled and state is empty
        if (!patientPrefillApplied && loadedPatients.length > 0) {
          setSelectedPatient(prev => prev || loadedPatients[0]);
        }

        if (!operationsPrefillApplied && !hasAppliedPrefillRef.current && loadedOps.length > 0) {
          setSelectedOperations(prev => (prev.length > 0 ? prev : [
            { ...loadedOps[0], quantity: 1, unit_price: loadedOps[0].price, subtotal: loadedOps[0].price }
          ]));
        }
      } catch (err) {
        console.error('Error fetching master data for wizard', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchMasterData();
  }, [searchParams]);

  // Multi-operation management handlers
  const handleAddOperation = (op: OperationItem) => {
    setSelectedOperations(prev => {
      const idx = prev.findIndex(item => item.id === op.id);
      if (idx >= 0) {
        const next = [...prev];
        const newQty = next[idx].quantity + 1;
        next[idx] = { ...next[idx], quantity: newQty, subtotal: newQty * next[idx].unit_price };
        return next;
      }
      return [...prev, { ...op, quantity: 1, unit_price: op.price, subtotal: op.price }];
    });
  };

  const handleRemoveOperation = (opId: number) => {
    setSelectedOperations(prev => prev.filter(item => item.id !== opId));
  };

  const handleOperationQtyChange = (opId: number, qty: number) => {
    const validQty = isNaN(qty) || qty < 1 ? 1 : Math.floor(qty);
    setSelectedOperations(prev => prev.map(item => {
      if (item.id === opId) {
        return { ...item, quantity: validQty, subtotal: validQty * item.unit_price };
      }
      return item;
    }));
  };

  // 2. Fetch template materials (BOM) for ALL selected operations separated by each service
  useEffect(() => {
    if (selectedOperations.length === 0) {
      setActualMaterials([]);
      return;
    }

    let isMounted = true;
    const fetchCombinedBOM = async () => {
      setMaterialsLoading(true);
      try {
        const promises = selectedOperations.map(op => 
          fetch(`${API_BASE_URL}/api/operations/${op.id}/materials`)
            .then(res => res.ok ? res.json() : [])
            .then(data => ({ op, materials: data }))
            .catch(() => ({ op, materials: [] }))
        );

        const results = await Promise.all(promises);
        if (!isMounted) return;

        const newRows: MaterialRow[] = [];
        results.forEach(({ op, materials }) => {
          materials.forEach((b: any) => {
            const matId = b.material_id;
            const unitCost = Number(b.current_unit_cost) || 0;
            const stdQtyPerOp = Number(b.quantity) || 1;
            const totalStdQty = stdQtyPerOp * op.quantity;

            newRows.push({
              row_id: `${op.id}_${matId}`,
              material_id: matId,
              material_name: b.material_name,
              unit_of_measure: b.unit_of_measure || 'шт',
              current_unit_cost: unitCost,
              standard_qty: totalStdQty,
              actual_qty: totalStdQty,
              operation_id: op.id,
              operation_name: op.name
            });
          });
        });

        setActualMaterials(prev => {
          // Keep custom added warehouse materials (operation_id === 0 or custom added)
          const customExtra = prev.filter(p => !selectedOperations.some(o => o.id === p.operation_id));
          // Preserve any modifications made to actual_qty
          const prevQtyMap = new Map(prev.map(p => [p.row_id, p.actual_qty]));
          const merged = newRows.map(r => {
            if (prevQtyMap.has(r.row_id)) {
              return { ...r, actual_qty: prevQtyMap.get(r.row_id)! };
            }
            return r;
          });
          return [...merged, ...customExtra];
        });
      } catch (e) {
        console.error('Failed to fetch combined BOM', e);
      } finally {
        if (isMounted) setMaterialsLoading(false);
      }
    };

    fetchCombinedBOM();
    return () => { isMounted = false; };
  }, [selectedOperations]);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleQtyChange = (row_id: string, newQty: number) => {
    const validQty = isNaN(newQty) || newQty < 0 ? 0 : newQty;
    setActualMaterials(prev => prev.map(m => 
      m.row_id === row_id ? { ...m, actual_qty: validQty } : m
    ));
  };

  const handleRemoveMaterial = (row_id: string) => {
    setActualMaterials(prev => prev.filter(m => m.row_id !== row_id));
  };

  const handleAddWarehouseMaterial = (targetOpId?: number) => {
    if (!selectedAddMaterial) return;
    const resolvedOpId = targetOpId !== undefined ? targetOpId : (targetServiceForAdd === 'general' ? 0 : targetServiceForAdd);
    const opObj = selectedOperations.find(o => o.id === resolvedOpId);
    const opName = opObj ? opObj.name : 'Дополнительные материалы';
    const rowId = `${resolvedOpId}_${selectedAddMaterial.id}_${Date.now()}`;

    setActualMaterials(prev => [
      ...prev,
      {
        row_id: rowId,
        material_id: selectedAddMaterial.id,
        material_name: selectedAddMaterial.material_name,
        unit_of_measure: selectedAddMaterial.unit_of_measure || 'шт',
        current_unit_cost: Number(selectedAddMaterial.current_unit_cost) || 0,
        standard_qty: 0,
        actual_qty: 1,
        operation_id: resolvedOpId,
        operation_name: opName
      }
    ]);
    setSelectedAddMaterial(null);
  };

  const calculateTotalCost = () => {
    return actualMaterials.reduce((acc, curr) => acc + (curr.actual_qty * curr.current_unit_cost), 0);
  };

  const getServiceMaterialsCost = (opId: number) => {
    return actualMaterials
      .filter(m => m.operation_id === opId)
      .reduce((sum, m) => sum + (m.actual_qty * m.current_unit_cost), 0);
  };

  // Debounced server search across all 61k patients in the database
  useEffect(() => {
    if (!patientSearchTerm || patientSearchTerm.trim().length < 2) {
      if (defaultPatients.length > 0) {
        setPatientsList(() => {
          if (selectedPatient && !defaultPatients.some(p => p.id === selectedPatient.id)) {
            return [selectedPatient, ...defaultPatients];
          }
          return defaultPatients;
        });
      }
      return;
    }

    const timer = setTimeout(async () => {
      setPatientSearching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/patients?limit=50&search=${encodeURIComponent(patientSearchTerm.trim())}`);
        if (res.ok) {
          const results: PatientItem[] = await res.json();
          setPatientsList(() => {
            if (selectedPatient && !results.some(p => p.id === selectedPatient.id)) {
              return [selectedPatient, ...results];
            }
            return results;
          });
        }
      } catch (err) {
        console.error('Error searching patients:', err);
      } finally {
        setPatientSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [patientSearchTerm, defaultPatients, selectedPatient]);

  const getPatientDisplayName = (p: PatientItem | null) => {
    if (!p) return customPatientName || '';
    const fullName = p.full_name || [p.surname || p.last_name || p.lastName, p.name || p.first_name || p.firstName, p.patron].filter(Boolean).join(' ') || p.brief_name || 'Пациент';
    const mednumStr = p.mednum ? ` (ЭМК №${p.mednum})` : '';
    const phone = p.phone || p.sphone || p.contact_phone || p.contact || '';
    const phoneStr = phone ? ` • ${phone}` : '';
    return `${fullName}${mednumStr}${phoneStr}`.trim();
  };

  // Full-text substring filter across any patient fields
  const filterPatientOptions = (options: PatientItem[], state: { inputValue: string }) => {
    const rawInput = state.inputValue.trim();
    if (!rawInput) return options.slice(0, 100);

    const normalizedTokens = rawInput
      .toLowerCase()
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(Boolean);

    return options.filter((p) => {
      const fieldValues: string[] = [
        p.full_name,
        p.surname,
        p.name,
        p.patron,
        p.brief_name,
        p.first_name,
        p.last_name,
        p.firstName,
        p.lastName,
        p.phone,
        p.sphone,
        p.contact_phone,
        p.contact,
        p.mednum !== undefined && p.mednum !== null ? String(p.mednum) : '',
        p.bdate,
        p.city,
        p.address,
        p.email,
        p.dms_insurer
      ]
        .filter(Boolean)
        .map(v => String(v).toLowerCase());

      const combinedText = fieldValues.join(' ');
      const punctuationFreeText = combinedText.replace(/[[\]_\\-]/g, ' ');

      return normalizedTokens.every((token) => {
        if (fieldValues.some(f => f.includes(token))) return true;
        if (combinedText.includes(token)) return true;
        const cleanTok = token.replace(/[[\]_\\-]/g, ' ').trim();
        if (cleanTok && punctuationFreeText.includes(cleanTok)) return true;
        const noPunctTok = token.replace(/[^a-z0-9а-яё]/gi, '');
        const noPunctCombined = combinedText.replace(/[^a-z0-9а-яё]/gi, '');
        if (noPunctTok && noPunctCombined.includes(noPunctTok)) return true;

        return false;
      });
    });
  };

  const totalBilledPrice = selectedOperations.reduce((sum, o) => sum + o.subtotal, 0);
  const totalMaterialsCost = calculateTotalCost();
  const totalNetProfit = totalBilledPrice - totalMaterialsCost;
  const marginPercent = totalBilledPrice > 0 ? ((totalNetProfit / totalBilledPrice) * 100).toFixed(1) : '0';

  const handleCompleteTransaction = async () => {
    if (selectedOperations.length === 0) return;
    setSubmittingTransaction(true);

    let posPaymentData: any = null;

    if (paymentMethod === 'card') {
      try {
        const txUuid = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const posPayload = {
          amount: totalBilledPrice,
          transaction_uuid: txUuid,
          patient_name: getPatientDisplayName(selectedPatient),
          patient_contact: patientContact,
          patient_id: selectedPatient?.id || null
        };
        const posRes = await fetch(`${API_BASE_URL}/api/pos/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(posPayload)
        });
        const posJson = await posRes.json();
        if (!posRes.ok || !posJson.success) {
          alert('Отказ банковского терминала Альфа-Банка: ' + (posJson.error || posJson.message || 'Ошибка авторизации карты'));
          setSubmittingTransaction(false);
          return;
        }
        posPaymentData = posJson.transaction || posJson;
      } catch (err: any) {
        alert('Сбой связи с POS-терминалом Альфа-Банка: ' + err.message);
        setSubmittingTransaction(false);
        return;
      }
    }

    const payload = {
      patient_id: selectedPatient?.id || 1,
      doctor_id: selectedDoctor?.id,
      nurse_id: selectedNurse?.id,
      transaction_date: visitDate ? `${visitDate}T${new Date().toTimeString().split(' ')[0]}` : new Date().toISOString(),
      billed_price: totalBilledPrice,
      calculated_cost: totalMaterialsCost,
      net_profit: totalNetProfit,
      notes: visitNotes || `Сервисы: ${selectedOperations.map(o => `${o.name} (x${o.quantity})`).join(', ')}. Врач: ${selectedDoctor?.full_name || 'Н/Д'}. Оплата: ${paymentMethod === 'card' ? 'Банковская карта (Альфа-Банк)' : paymentMethod}`,
      operations: selectedOperations.map(o => ({
        operation_id: o.id,
        quantity: o.quantity,
        unit_price: o.unit_price,
        subtotal: o.subtotal,
        name: o.name
      })),
      materials: actualMaterials.map(m => ({
        material_id: m.material_id,
        quantity_used: m.actual_qty,
        actual_cost_at_time: m.current_unit_cost
      })),
      fiscalize,
      patient_contact: patientContact,
      payment_type: paymentMethod,
      pos_rrn: posPaymentData?.rrn || null,
      pos_transaction_uuid: posPaymentData?.transaction_uuid || posPaymentData?.transactionUuid || null,
      pos_auth_code: posPaymentData?.auth_code || posPaymentData?.authCode || null,
      pos_card_type: posPaymentData?.card_type || posPaymentData?.cardType || 'MIR',
      pos_masked_pan: posPaymentData?.masked_pan || posPaymentData?.maskedPan || '4276********1094',
      pos_slip_text: posPaymentData?.slip_text || posPaymentData?.slipText || null
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const result = await res.json();
        if (!result.posPayment && posPaymentData) {
          result.posPayment = {
            id: posPaymentData.id,
            transaction_uuid: posPaymentData.transaction_uuid || posPaymentData.transactionUuid,
            rrn: posPaymentData.rrn,
            authCode: posPaymentData.auth_code || posPaymentData.authCode,
            cardType: posPaymentData.card_type || posPaymentData.cardType || 'MIR',
            maskedPan: posPaymentData.masked_pan || posPaymentData.maskedPan || '4276********1094',
            slipText: posPaymentData.slip_text || posPaymentData.slipText
          };
        }
        setSavedTransactionResult(result);
        setActiveStep(steps.length);
        hasAppliedPrefillRef.current = false;
        sessionStorage.removeItem('ortho_checkout_prefill');
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
    setVisitDate(new Date().toISOString().slice(0, 10));
    hasAppliedPrefillRef.current = false;
    sessionStorage.removeItem('ortho_checkout_prefill');
    setSelectedOperations(operationsList.length > 0 ? [{ ...operationsList[0], quantity: 1, unit_price: operationsList[0].price, subtotal: operationsList[0].price }] : []);
    setActualMaterials([]);
    setSavedTransactionResult(null);
    setVisitNotes('');
    setPatientContact(selectedPatient?.phone || selectedPatient?.contact_phone || selectedPatient?.email || '');
  };

  if (loadingInitial) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress size={48} sx={{ color: '#0F3C64' }} />
        <Typography variant="body1" sx={{ color: '#4A5568' }}>
          Загрузка каталога сервисов и базы пациентов...
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
                getOptionLabel={(p) => (typeof p === 'string' ? p : getPatientDisplayName(p))}
                value={selectedPatient}
                loading={patientSearching}
                filterOptions={filterPatientOptions}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === 'input') {
                    setPatientSearchTerm(newInputValue);
                  } else if (reason === 'clear') {
                    setPatientSearchTerm('');
                  }
                }}
                onChange={(_, val) => setSelectedPatient(val)}
                noOptionsText="Пациенты не найдены. Введите данные нового пациента ниже"
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', py: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                          {option.full_name || `${option.surname || ''} ${option.name || ''}`.trim() || option.brief_name || 'Без имени'}
                        </Typography>
                        {option.mednum && (
                          <Chip
                            size="small"
                            label={`ЭМК №${option.mednum}`}
                            sx={{ height: 20, fontSize: '0.72rem', bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.3, color: '#64748B', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                        {(option.phone || option.sphone || option.contact_phone) && (
                          <span>📞 {option.phone || option.sphone || option.contact_phone}</span>
                        )}
                        {option.bdate && <span>🎂 {option.bdate} ({option.age || '—'} лет)</span>}
                        {option.city && <span>📍 {option.city}</span>}
                        {option.address && <span>🏠 {option.address}</span>}
                      </Box>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Поиск пациента по любым полям (ФИО, ЭМК, телефон, город, адрес)"
                    placeholder="Например: test_daemon, Петров, 99001, Сочи..."
                    helperText="Полнотекстовый поиск по всей базе пациентов по любой подстроке и полям"
                    fullWidth
                    slotProps={{
                      ...params.slotProps,
                      input: {
                        ...params.slotProps?.input,
                        endAdornment: (
                          <>
                            {patientSearching ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.slotProps?.input?.endAdornment}
                          </>
                        )
                      }
                    }}
                  />
                )}
              />

              {/* Informative Selected Patient Confirmation Card */}
              {selectedPatient && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mt: 2,
                    bgcolor: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PersonIcon sx={{ color: '#0284C7', fontSize: 32 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369A1' }}>
                        {selectedPatient.full_name || `${selectedPatient.surname || ''} ${selectedPatient.name || ''}`.trim() || 'Пациент'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#0284C7', display: 'block' }}>
                        {selectedPatient.mednum ? `ЭМК №${selectedPatient.mednum} • ` : ''}
                        📞 {selectedPatient.phone || selectedPatient.sphone || selectedPatient.contact_phone || 'Телефон не указан'}
                        {selectedPatient.city ? ` • 📍 ${selectedPatient.city}` : ''}
                        {selectedPatient.bdate ? ` • 🎂 ${selectedPatient.bdate}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    size="small"
                    label="Пациент выбран"
                    color="primary"
                    variant="filled"
                    sx={{ fontWeight: 700, bgcolor: '#0284C7' }}
                  />
                </Paper>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: selectedPatient ? '1fr' : '2fr 1fr' }, gap: 2, mt: 2 }}>
                {!selectedPatient && (
                  <TextField
                    fullWidth
                    label="Новый пациент (ФИО)"
                    placeholder="Иванов Иван Иванович"
                    value={customPatientName}
                    onChange={(e) => setCustomPatientName(e.target.value)}
                  />
                )}
                <TextField
                  fullWidth
                  type="date"
                  label="Дата оформления визита"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Дата оказания сервисов пациенту"
                />
              </Box>
            </Paper>

            {/* Service Section: Multi-Service Selection */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalHospitalIcon /> 2. Выберите сервисы из Каталога сервисов ({operationsList.length})
                </Typography>
                {selectedOperations.length > 0 && (
                  <Chip
                    color="primary"
                    sx={{ fontWeight: 700, bgcolor: '#0F3C64' }}
                    label={`Выбрано: ${selectedOperations.length} • Итого: ₽${totalBilledPrice.toLocaleString('ru-RU')}`}
                  />
                )}
              </Box>

              <Typography variant="body2" sx={{ color: '#718096', mb: 2 }}>
                Доступны все официальные сервисы клиники. Вы можете добавить несколько сервисов в один визит (например: Консультация + Инъекция/PRP).
              </Typography>

              {/* Autocomplete selector for adding service */}
              <Autocomplete
                options={operationsList}
                getOptionLabel={(op) => `${op.name} — ₽${op.price.toLocaleString('ru-RU')}`}
                value={pendingOperation}
                onChange={(_, val) => {
                  if (val) {
                    handleAddOperation(val);
                    setPendingOperation(null);
                  }
                }}
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
                    label="Поиск и добавление сервиса в визит"
                    placeholder="Начните вводить название (например: Первичный прием, PRP, УЗИ)..."
                    helperText="Выберите сервис из списка — он добавится в перечень сервисов визита"
                    fullWidth
                  />
                )}
              />

              {/* List / Table of Selected Services */}
              {selectedOperations.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ mt: 2.5, border: '1px solid #CBD5E1', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#EDF2F7' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: '#0F3C64', width: 40 }}>№</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Наименование сервиса</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64', width: 130 }}>Цена по прайсу</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#0F3C64', width: 130 }}>Кол-во</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64', width: 130 }}>Сумма</TableCell>
                        <TableCell align="center" sx={{ width: 50 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOperations.map((op, idx) => (
                        <TableRow key={op.id} hover>
                          <TableCell sx={{ color: '#718096', fontWeight: 600 }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>
                            {op.name}
                            <Typography variant="caption" sx={{ display: 'block', color: '#64748B' }}>
                              Код сервиса #{op.id}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            ₽{op.price.toLocaleString('ru-RU')}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: '#FFFFFF', border: '1px solid #CBD5E0', borderRadius: 1, px: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleOperationQtyChange(op.id, op.quantity - 1)}
                                disabled={op.quantity <= 1}
                                sx={{ p: 0.3 }}
                              >
                                -
                              </IconButton>
                              <Typography sx={{ fontWeight: 700, minWidth: 24, textAlign: 'center', fontSize: '0.9rem' }}>
                                {op.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleOperationQtyChange(op.id, op.quantity + 1)}
                                sx={{ p: 0.3 }}
                              >
                                +
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                            ₽{op.subtotal.toLocaleString('ru-RU')}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleRemoveOperation(op.id)} sx={{ color: '#E53E3E' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell colSpan={4} align="right" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '0.95rem' }}>
                          Итоговая стоимость сервисов:
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: '#156C9C', fontSize: '1.05rem' }}>
                          ₽{totalBilledPrice.toLocaleString('ru-RU')}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                  Пожалуйста, выберите хотя бы один сервис для оформления визита.
                </Alert>
              )}
            </Paper>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedicalServicesIcon /> Назначение ответственных сотрудников
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
            {/* 1. TOP HEADER & VISIT DATE (show дата first) */}
            <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #CBD5E1', bgcolor: '#F8FAFC' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ p: 1, bgcolor: '#0F3C64', color: '#FFFFFF', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EventIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                      Расход материалов и себестоимость визита
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Детализация списания по технологическим картам (BOM) раздельно для каждого сервиса
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <TextField
                    type="date"
                    size="small"
                    label="Дата визита"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 170, bgcolor: '#FFFFFF', borderRadius: 1 }}
                  />
                  <Chip
                    color="primary"
                    sx={{ fontWeight: 700, bgcolor: '#0F3C64', py: 2 }}
                    label={`Пациент: ${selectedPatient?.full_name || customPatientName || 'Не выбран'}`}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip
                  variant="outlined"
                  size="small"
                  label={`Сервисов в визите: ${selectedOperations.length} поз.`}
                  sx={{ fontWeight: 700, borderColor: '#CBD5E1', color: '#0F3C64' }}
                />
                <Chip
                  size="small"
                  label={`Выручка по прейскуранту: ₽${totalBilledPrice.toLocaleString('ru-RU')}`}
                  sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700 }}
                />
                <Chip
                  size="small"
                  label={`Себестоимость материалов (BOM): ₽${totalMaterialsCost.toLocaleString('ru-RU')}`}
                  sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 700 }}
                />
                <Chip
                  size="small"
                  label={`Маржа визита: ₽${totalNetProfit.toLocaleString('ru-RU')} (${marginPercent}%)`}
                  sx={{ bgcolor: totalNetProfit >= 0 ? '#F0FFF4' : '#FFF5F5', color: totalNetProfit >= 0 ? '#166534' : '#991B1B', fontWeight: 700 }}
                />
              </Box>
            </Paper>

            {/* 2. MATERIALS SEPARATED BY EACH SERVICE (separate by each сервис) */}
            {materialsLoading ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <CircularProgress size={36} sx={{ color: '#0F3C64' }} />
                <Typography variant="body2" sx={{ mt: 1.5, color: '#64748B', fontWeight: 600 }}>
                  Загрузка технологических карт (BOM) для выбранных сервисов...
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {selectedOperations.map((op, idx) => {
                    const opMaterials = actualMaterials.filter(m => m.operation_id === op.id);
                    const opMatsCost = opMaterials.reduce((sum, m) => sum + (m.actual_qty * m.current_unit_cost), 0);
                    const opMargin = op.subtotal - opMatsCost;
                    const opMarginPct = op.subtotal > 0 ? Math.round((opMargin / op.subtotal) * 100) : 0;

                    return (
                      <Paper
                        key={op.id}
                        sx={{
                          p: 2.5,
                          borderRadius: 2.5,
                          border: '1px solid #CBD5E1',
                          bgcolor: '#FFFFFF',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                        }}
                      >
                        {/* Service Card Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={`Сервис №${idx + 1}`}
                              size="small"
                              sx={{ bgcolor: '#0F3C64', color: '#FFFFFF', fontWeight: 800 }}
                            />
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                              {op.name}
                            </Typography>
                            <Chip
                              variant="outlined"
                              size="small"
                              label={`Кол-во: ${op.quantity} шт.`}
                              sx={{ fontWeight: 600, borderColor: '#94A3B8' }}
                            />
                            <Chip
                              size="small"
                              label={`Прейскурант: ₽${op.subtotal.toLocaleString('ru-RU')}`}
                              sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700 }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={`Себестоимость материалов сервиса: ₽${opMatsCost.toLocaleString('ru-RU')}`}
                              sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 800, border: '1px solid #FECACA' }}
                            />
                            <Chip
                              label={`Маржа сервиса: ₽${opMargin.toLocaleString('ru-RU')} (${opMarginPct}%)`}
                              sx={{
                                bgcolor: opMargin >= 0 ? '#F0FFF4' : '#FFF5F5',
                                color: opMargin >= 0 ? '#166534' : '#991B1B',
                                fontWeight: 700
                              }}
                            />
                          </Box>
                        </Box>

                        {/* Table for this service's materials */}
                        {opMaterials.length === 0 ? (
                          <Alert severity="info" sx={{ mb: 1, borderRadius: 2 }}>
                            Для сервиса «{op.name}» в технологической карте (BOM) расходные материалы не заданы. Вы можете добавить материал со склада ниже.
                          </Alert>
                        ) : (
                          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #E2E8F0', mb: 1 }}>
                            <Table size="small">
                              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64', width: 40 }}>№</TableCell>
                                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Наименование расходного материала</TableCell>
                                  <TableCell sx={{ fontWeight: 700, color: '#0F3C64', width: 90 }}>Ед. изм.</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64', width: 120 }}>Цена за ед.</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64', width: 110 }}>Норма (BOM)</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: '#0F3C64', width: 130 }}>Факт. списание</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64', width: 130 }}>Сумма расхода (₽)</TableCell>
                                  <TableCell align="center" sx={{ width: 50 }}></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {opMaterials.map((row, matIdx) => (
                                  <TableRow key={row.row_id} hover>
                                    <TableCell sx={{ color: '#64748B' }}>{matIdx + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>{row.material_name}</TableCell>
                                    <TableCell>{row.unit_of_measure}</TableCell>
                                    <TableCell align="right">₽{row.current_unit_cost.toLocaleString('ru-RU')}</TableCell>
                                    <TableCell align="right" sx={{ color: '#64748B' }}>
                                      {row.standard_qty} {row.unit_of_measure}
                                    </TableCell>
                                    <TableCell align="center">
                                      <TextField
                                        type="number"
                                        size="small"
                                        value={row.actual_qty}
                                        onChange={(e) => handleQtyChange(row.row_id, Number(e.target.value))}
                                        slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                                        sx={{ width: 85 }}
                                      />
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                                      ₽{(row.actual_qty * row.current_unit_cost).toLocaleString('ru-RU')}
                                    </TableCell>
                                    <TableCell align="center">
                                      <IconButton size="small" onClick={() => handleRemoveMaterial(row.row_id)} sx={{ color: '#DC2626' }}>
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                                  <TableCell colSpan={6} align="right" sx={{ fontWeight: 700, color: '#334155' }}>
                                    Итого себестоимость материалов для «{op.name}»:
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 800, color: '#DC2626', fontSize: '0.95rem' }}>
                                    ₽{opMatsCost.toLocaleString('ru-RU')}
                                  </TableCell>
                                  <TableCell />
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Paper>
                    );
                  })}

                  {/* Optional unassigned extra materials */}
                  {actualMaterials.filter(m => m.operation_id === 0).length > 0 && (
                    <Paper sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #CBD5E1', bgcolor: '#FFFFFF' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5 }}>
                        Дополнительные материалы визита (общее списание со склада)
                      </Typography>
                      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, color: '#0F3C64', width: 40 }}>№</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Наименование материала</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: '#0F3C64', width: 90 }}>Ед. изм.</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64', width: 120 }}>Цена за ед.</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, color: '#0F3C64', width: 130 }}>Факт. списание</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64', width: 130 }}>Сумма расхода (₽)</TableCell>
                              <TableCell align="center" sx={{ width: 50 }}></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {actualMaterials.filter(m => m.operation_id === 0).map((row, idx) => (
                              <TableRow key={row.row_id} hover>
                                <TableCell sx={{ color: '#64748B' }}>{idx + 1}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{row.material_name}</TableCell>
                                <TableCell>{row.unit_of_measure}</TableCell>
                                <TableCell align="right">₽{row.current_unit_cost.toLocaleString('ru-RU')}</TableCell>
                                <TableCell align="center">
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={row.actual_qty}
                                    onChange={(e) => handleQtyChange(row.row_id, Number(e.target.value))}
                                    slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                                    sx={{ width: 85 }}
                                  />
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                                  ₽{(row.actual_qty * row.current_unit_cost).toLocaleString('ru-RU')}
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton size="small" onClick={() => handleRemoveMaterial(row.row_id)} sx={{ color: '#DC2626' }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  )}
                </Box>

                {/* Add Material from Warehouse bar */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px dashed #CBD5E0', flexWrap: 'wrap' }}>
                  <Autocomplete
                    sx={{ flexGrow: 1, minWidth: 260 }}
                    size="small"
                    options={warehouseMaterials}
                    getOptionLabel={(m) => `${m.material_name} (${m.current_unit_cost} ₽/${m.unit_of_measure})`}
                    value={selectedAddMaterial}
                    onChange={(_, val) => setSelectedAddMaterial(val)}
                    renderInput={(params) => (
                      <TextField {...params} label="Добавить расходный материал со склада" placeholder="Выберите материал..." />
                    )}
                  />

                  <FormControl size="small" sx={{ width: { xs: '100%', sm: 220 } }}>
                    <InputLabel id="target-service-label">Привязать к сервису</InputLabel>
                    <Select
                      labelId="target-service-label"
                      label="Привязать к сервису"
                      value={targetServiceForAdd}
                      onChange={(e) => setTargetServiceForAdd(e.target.value as any)}
                    >
                      <MenuItem value="general">Общие расходники</MenuItem>
                      {selectedOperations.map((op, i) => (
                        <MenuItem key={op.id} value={op.id}>
                          #{i + 1} {op.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddWarehouseMaterial()}
                    disabled={!selectedAddMaterial}
                    sx={{ whiteSpace: 'nowrap', bgcolor: '#0F3C64', fontWeight: 700 }}
                  >
                    Добавить расход
                  </Button>
                </Box>

                {/* 3. GRAND TOTAL FOR ALL SERVICES (and after total for all services) */}
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '2px solid #0F3C64',
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 4px 16px rgba(15, 60, 100, 0.08)'
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', mb: 2 }}>
                    Итоговый финансовый свод себестоимости по всем сервисам визита
                  </Typography>

                  {/* Summary Comparison Table */}
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, mb: 3 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: '#0F3C64', width: 40 }}>№</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Сервис</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: '#0F3C64', width: 90 }}>Кол-во</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64', width: 140 }}>Выручка по прайсу</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64', width: 170 }}>Себестоимость материалов</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64', width: 140 }}>Валовая прибыль</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: '#0F3C64', width: 130 }}>Рентабельность</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOperations.map((op, idx) => {
                          const opMatsCost = getServiceMaterialsCost(op.id);
                          const opProfit = op.subtotal - opMatsCost;
                          const opPct = op.subtotal > 0 ? ((opProfit / op.subtotal) * 100).toFixed(1) : '0';

                          return (
                            <TableRow key={op.id} hover>
                              <TableCell sx={{ color: '#64748B' }}>{idx + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{op.name}</TableCell>
                              <TableCell align="center">{op.quantity} шт.</TableCell>
                              <TableCell align="right">₽{op.subtotal.toLocaleString('ru-RU')}</TableCell>
                              <TableCell align="right" sx={{ color: '#DC2626', fontWeight: 600 }}>
                                ₽{opMatsCost.toLocaleString('ru-RU')}
                              </TableCell>
                              <TableCell align="right" sx={{ color: opProfit >= 0 ? '#166534' : '#991B1B', fontWeight: 700 }}>
                                ₽{opProfit.toLocaleString('ru-RU')}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={`${opPct}%`}
                                  sx={{
                                    bgcolor: opProfit >= 0 ? '#F0FFF4' : '#FEF2F2',
                                    color: opProfit >= 0 ? '#166534' : '#991B1B',
                                    fontWeight: 700
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {/* Additional unassigned materials row if any */}
                        {actualMaterials.filter(m => m.operation_id === 0).length > 0 && (
                          <TableRow hover>
                            <TableCell sx={{ color: '#64748B' }}>—</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#64748B' }}>Дополнительные общие материалы</TableCell>
                            <TableCell align="center">—</TableCell>
                            <TableCell align="right">0 ₽</TableCell>
                            <TableCell align="right" sx={{ color: '#DC2626', fontWeight: 600 }}>
                              ₽{actualMaterials.filter(m => m.operation_id === 0).reduce((s, m) => s + (m.actual_qty * m.current_unit_cost), 0).toLocaleString('ru-RU')}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#991B1B', fontWeight: 700 }}>
                              -₽{actualMaterials.filter(m => m.operation_id === 0).reduce((s, m) => s + (m.actual_qty * m.current_unit_cost), 0).toLocaleString('ru-RU')}
                            </TableCell>
                            <TableCell align="center">—</TableCell>
                          </TableRow>
                        )}

                        {/* Grand Total Row */}
                        <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                          <TableCell colSpan={2} sx={{ fontWeight: 800, color: '#0F3C64' }}>
                            ИТОГО ПО ВИЗИТУ ({selectedOperations.length} сервисов):
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800 }}>
                            {selectedOperations.reduce((s, o) => s + o.quantity, 0)} шт.
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.95rem' }}>
                            ₽{totalBilledPrice.toLocaleString('ru-RU')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#DC2626', fontSize: '0.95rem' }}>
                            ₽{totalMaterialsCost.toLocaleString('ru-RU')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: totalNetProfit >= 0 ? '#166534' : '#991B1B', fontSize: '1.05rem' }}>
                            ₽{totalNetProfit.toLocaleString('ru-RU')}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${marginPercent}%`}
                              sx={{
                                bgcolor: totalNetProfit >= 0 ? '#166534' : '#DC2626',
                                color: '#FFFFFF',
                                fontWeight: 800
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* 4 Financial Stat Tiles */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                        ВЫРУЧКА СЕРВИСОВ
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', mt: 0.5 }}>
                        ₽{totalBilledPrice.toLocaleString('ru-RU')}
                      </Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 700, display: 'block' }}>
                        СЕБЕСТОИМОСТЬ МАТЕРИАЛОВ
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#DC2626', mt: 0.5 }}>
                        ₽{totalMaterialsCost.toLocaleString('ru-RU')}
                      </Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#F0FFF4', border: '1px solid #BBF7D0', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block' }}>
                        ВАЛОВАЯ МАРЖА
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#166534', mt: 0.5 }}>
                        ₽{totalNetProfit.toLocaleString('ru-RU')}
                      </Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 700, display: 'block' }}>
                        РЕНТАБЕЛЬНОСТЬ ВИЗИТА
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#1D4ED8', mt: 0.5 }}>
                        {marginPercent}%
                      </Typography>
                    </Paper>
                  </Box>
                </Paper>
              </>
            )}
          </Box>
        );

      case 3:
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

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', fontWeight: 700 }}>
                    Дата визита
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                    📅 {visitDate ? new Date(visitDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Сегодня'}
                  </Typography>
                </Box>

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
                    Ответственные сотрудники
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedDoctor?.full_name || 'Не назначен'} {selectedNurse ? `(Ассистент: ${selectedNurse.full_name})` : ''}
                  </Typography>
                </Box>
              </Box>

              {/* List of Services */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#718096', textTransform: 'uppercase', fontWeight: 700, mb: 1, display: 'block' }}>
                  Выбранные сервисы ({selectedOperations.length}):
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: '#0F3C64' }}>Сервис</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>Цена</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#0F3C64' }}>Кол-во</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>Сумма</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOperations.map((op) => (
                        <TableRow key={op.id}>
                          <TableCell sx={{ fontWeight: 600 }}>{op.name}</TableCell>
                          <TableCell align="right">₽{op.price.toLocaleString('ru-RU')}</TableCell>
                          <TableCell align="center">{op.quantity}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>₽{op.subtotal.toLocaleString('ru-RU')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Financial Calculation Breakdown */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, my: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#4A5568' }}>
                    Общая стоимость сервисов для пациента (по прайсу):
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    ₽{totalBilledPrice.toLocaleString('ru-RU')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#E53E3E' }}>
                    Себестоимость фактически списанных материалов ({actualMaterials.length} поз.):
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#E53E3E' }}>
                    - ₽{totalMaterialsCost.toLocaleString('ru-RU')}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#F0FFF4', borderRadius: 2, border: '1px solid #C6F6D5' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#276749' }}>
                      Расчетный маржинальный доход:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#38A169', fontWeight: 600 }}>
                      Рентабельность визита: {marginPercent}%
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#22543D' }}>
                    ₽{totalNetProfit.toLocaleString('ru-RU')}
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

              {/* Alfa-Bank POS Acquiring Card (Arcus-2) */}
              {paymentMethod === 'card' && (
                <Paper sx={{ p: 2.5, mt: 3, borderRadius: 2.5, border: '1px solid #CBD5E1', bgcolor: '#F0F9FF' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CreditCardIcon sx={{ color: '#0284C7', fontSize: 32 }} />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                          Эквайринг «АО «АЛЬФА-БАНК»» (Терминал {posStatus?.terminalId || 'ALFA_770192'})
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Протокол: {posStatus?.driverType || 'Arcus-2'} • Безналичная оплата банковскими картами и QR СБП
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      {/* Switch: Эмулятор POS / Реальный терминал */}
                      <Tooltip title="Переключение режима эквайринга: программная эмуляция (Mock) или физический POS-терминал">
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={!posStatus?.isMockMode}
                              onChange={handleTogglePosMode}
                              disabled={switchingPosMode}
                              color="primary"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: !posStatus?.isMockMode ? '#0284C7' : '#0F3C64' }}>
                                {!posStatus?.isMockMode ? 'Реальный POS (COM/IP)' : 'Эмулятор POS (Mock)'}
                              </Typography>
                              {switchingPosMode && <CircularProgress size={12} />}
                            </Box>
                          }
                          sx={{ mr: 0, bgcolor: '#FFFFFF', px: 1, py: 0.3, borderRadius: 1.5, border: '1px solid #BAE6FD' }}
                        />
                      </Tooltip>

                      {/* Button: Проверить связь с хостом */}
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={testingPosHost ? <CircularProgress size={14} /> : <SpeedIcon sx={{ fontSize: 16, color: '#0284C7' }} />}
                        onClick={handleTestPosHost}
                        disabled={testingPosHost}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          borderColor: '#0284C7',
                          color: '#0284C7',
                          bgcolor: '#FFFFFF',
                          borderRadius: 1.5,
                          py: 0.5,
                          px: 1.3
                        }}
                      >
                        Ping хоста
                      </Button>
                    </Box>
                  </Box>

                  {/* Sub-row with status chip and terminal parameters */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={
                        posStatus?.isMockMode
                          ? '🟡 Эмулятор терминала (Mock • Мгновенная авторизация)'
                          : (posStatus?.hardware?.isHardwareReady || posStatus?.status === 'Ready'
                              ? `🟢 Реальный терминал: ${posStatus?.port || 'COM4'} (${posStatus?.baudRate || 115200} бод) • Готов к приёму карт`
                              : `🔴 Реальный терминал: ${posStatus?.port || 'COM4'} • Нет связи`)
                      }
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        bgcolor: posStatus?.isMockMode ? '#FEF3C7' : ((posStatus?.hardware?.isHardwareReady || posStatus?.status === 'Ready') ? '#ECFDF5' : '#FEE2E2'),
                        color: posStatus?.isMockMode ? '#92400E' : ((posStatus?.hardware?.isHardwareReady || posStatus?.status === 'Ready') ? '#065F46' : '#991B1B'),
                        border: '1px solid',
                        borderColor: posStatus?.isMockMode ? '#FCD34D' : ((posStatus?.hardware?.isHardwareReady || posStatus?.status === 'Ready') ? '#A7F3D0' : '#FCA5A5')
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      TID: <b>{posStatus?.terminalId || 'ALFA_770192'}</b> • MID: <b>{posStatus?.merchantId || 'MERCH_884102'}</b> • СБП QR: <b>{posStatus?.enableSbpQr ? 'Включен' : 'Отключен'}</b> • Банк: <b>АО «АЛЬФА-БАНК»</b>
                    </Typography>
                  </Box>

                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#0369A1' }}>
                    💡 При нажатии «Завершить транзакцию и оплатить» терминал запросит вставку/прикладывание карты или сканирование QR-кода СБП.
                  </Typography>
                </Paper>
              )}

              {/* Fiscal Registration Card (ККТ АТОЛ 91Ф) */}
              <Paper sx={{ p: 2.5, mt: 3, borderRadius: 2.5, border: '1px solid #CBD5E1', bgcolor: '#F8FAFC' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PointOfSaleIcon sx={{ color: '#0F3C64', fontSize: 32 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                        Фискализация на ККТ «АТОЛ 91Ф» (54-ФЗ)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        ФФД 1.05 / 1.2 • Формирование фискального чека прихода и передача в ОФД
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    {/* Switch: Эмулятор ККТ / Реальное соединение */}
                    <Tooltip title="Переключение режима фискализации: программная эмуляция (Mock) или физический COM-порт ККТ">
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={!fiscalStatus?.isMockMode}
                            onChange={handleToggleFiscalMode}
                            disabled={switchingFiscalMode}
                            color="warning"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: !fiscalStatus?.isMockMode ? '#D97706' : '#0F3C64' }}>
                              {!fiscalStatus?.isMockMode ? 'Реальное подключение (COM)' : 'Эмулятор ККТ (Mock)'}
                            </Typography>
                            {switchingFiscalMode && <CircularProgress size={12} />}
                          </Box>
                        }
                        sx={{ mr: 0, bgcolor: '#FFFFFF', px: 1, py: 0.3, borderRadius: 1.5, border: '1px solid #E2E8F0' }}
                      />
                    </Tooltip>

                    {/* Button: Проверить связь */}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={testingFiscalConnection ? <CircularProgress size={14} /> : <UsbIcon sx={{ fontSize: 16, color: '#D97706' }} />}
                      onClick={handleTestFiscalConnection}
                      disabled={testingFiscalConnection}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        borderColor: '#0F3C64',
                        color: '#0F3C64',
                        bgcolor: '#FFFFFF',
                        borderRadius: 1.5,
                        py: 0.5,
                        px: 1.3
                      }}
                    >
                      Проверить связь
                    </Button>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={fiscalize}
                          onChange={(e) => setFiscalize(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64' }}>Пробить чек</Typography>}
                      sx={{ mr: 0 }}
                    />
                  </Box>
                </Box>

                {/* Sub-row with status chip and device parameters */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label={
                      fiscalStatus?.isMockMode
                        ? `🟡 Эмулятор ККТ (Тестовый контур • Смена №${fiscalStatus?.shiftNumber || 14})`
                        : (fiscalStatus?.online
                            ? `🟢 Реальная ККТ: ${fiscalStatus?.deviceModel || 'АТОЛ 91Ф'} (${fiscalStatus?.port || 'COM3'}) • Готова • Смена №${fiscalStatus?.shiftNumber || 14}`
                            : `🔴 Реальная ККТ: ${fiscalStatus?.port || 'COM3'} • Нет связи (Оборудование не подключено)`)
                    }
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      bgcolor: fiscalStatus?.isMockMode ? '#FEF3C7' : (fiscalStatus?.online ? '#ECFDF5' : '#FEE2E2'),
                      color: fiscalStatus?.isMockMode ? '#92400E' : (fiscalStatus?.online ? '#065F46' : '#991B1B'),
                      border: '1px solid',
                      borderColor: fiscalStatus?.isMockMode ? '#FCD34D' : (fiscalStatus?.online ? '#A7F3D0' : '#FCA5A5')
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Порт: <strong>{fiscalStatus?.port || 'COM3'}</strong> ({fiscalStatus?.baudRate || 115200} бод) • ФН: {fiscalStatus?.isMockMode ? fiscalStatus?.fnNumber : (fiscalStatus?.online ? fiscalStatus?.fnNumber : '—')} • РН ККТ: {fiscalStatus?.isMockMode ? fiscalStatus?.kktRegNumber : (fiscalStatus?.online ? fiscalStatus?.kktRegNumber : '—')}
                  </Typography>
                </Box>

                {fiscalize && (
                  <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px dashed #CBD5E1' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, gap: 2, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Тег 1008 ФФД (Телефон или Email покупателя)"
                        value={patientContact}
                        onChange={(e) => setPatientContact(e.target.value)}
                        placeholder="+7 (988) 123-45-67 или patient@example.com"
                        helperText="Для отправки электронного кассового чека покупателю по SMS или Email"
                        sx={{ bgcolor: '#FFFFFF', borderRadius: 1 }}
                      />

                      <Box sx={{ p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#1E40AF', mb: 0.5 }}>
                          Юридические параметры чека (54-ФЗ):
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#1E3A8A' }}>
                          • Ставка: <b>Без НДС</b> (пп. 2 п. 2 ст. 149 НК РФ — медицинские сервисы)
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#1E3A8A' }}>
                          • Предмет расчета: <b>Сервис</b> (тег 1212 = 4) • Способ: <b>Полный расчет</b> (тег 1214 = 4)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Paper>
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
        Пошаговый мастер регистрации оказанных сервисов из официального Каталога сервисов с расчетом списания материалов и генерацией печатного PDF протокола.
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

          {/* Fiscal Receipt Details Display */}
          {savedTransactionResult?.fiscalReceipt && (
            <Paper sx={{ 
              p: 3, 
              my: 3, 
              maxWidth: 720, 
              mx: 'auto', 
              borderRadius: 3, 
              border: savedTransactionResult.fiscalReceipt.status === 'failed' ? '1px solid #FEB2B2' : '1px solid #9AE6B4', 
              bgcolor: savedTransactionResult.fiscalReceipt.status === 'failed' ? '#FFF5F5' : '#FFFFFF',
              textAlign: 'left',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PointOfSaleIcon sx={{ color: savedTransactionResult.fiscalReceipt.status === 'failed' ? '#E53E3E' : '#2F855A', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      Фискальный чек ККТ «АТОЛ 91Ф» (54-ФЗ)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Медицинские сервисы • Без НДС (пп. 2 п. 2 ст. 149 НК РФ)
                    </Typography>
                  </Box>
                </Box>
                <Chip 
                  label={savedTransactionResult.fiscalReceipt.status === 'fiscalized' ? "🟢 Фискализирован в ФН" : "⚠️ Требуется внимание"}
                  size="small"
                  sx={{ 
                    fontWeight: 700, 
                    bgcolor: savedTransactionResult.fiscalReceipt.status === 'fiscalized' ? '#C6F6D5' : '#FED7D7', 
                    color: savedTransactionResult.fiscalReceipt.status === 'fiscalized' ? '#22543D' : '#9B2C2C' 
                  }}
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: '#F7FAFC', borderRadius: 2, border: '1px solid #EDF2F7' }}>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Номер ФД (тег 1040)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    №{savedTransactionResult.fiscalReceipt.fiscalDocumentNumber || '—'}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: '#F7FAFC', borderRadius: 2, border: '1px solid #EDF2F7' }}>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>ФПД (тег 1077)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: 0.5 }}>
                    {savedTransactionResult.fiscalReceipt.fiscalSign || '—'}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: '#F7FAFC', borderRadius: 2, border: '1px solid #EDF2F7' }}>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Смена № (тег 1038)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    #{savedTransactionResult.fiscalReceipt.shiftNumber || '14'}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: '#F7FAFC', borderRadius: 2, border: '1px solid #EDF2F7' }}>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Чек за смену (тег 1042)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    #{savedTransactionResult.fiscalReceipt.receiptNumber || '1'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#718096' }}>
                  РН ККТ: <b>{savedTransactionResult.fiscalReceipt.kktRegNumber || '0004928103049182'}</b> • ФН: <b>{savedTransactionResult.fiscalReceipt.fiscalDriveNumber || '9960440301984210'}</b>
                </Typography>
                {savedTransactionResult.fiscalReceipt.receiptId && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={reprintingFiscal ? <CircularProgress size={14} /> : <ReplayIcon />}
                    onClick={async () => {
                      setReprintingFiscal(true);
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/fiscal/repeat-print`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ receipt_id: savedTransactionResult.fiscalReceipt.receiptId })
                        });
                        const repData = await res.json();
                        alert(repData.message || 'Копия чека отправлена на печать');
                      } catch (err: any) {
                        alert('Ошибка повторной печати: ' + err.message);
                      } finally {
                        setReprintingFiscal(false);
                      }
                    }}
                    disabled={reprintingFiscal}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    Повторить печать чека
                  </Button>
                )}
              </Box>
            </Paper>
          )}

          {/* POS Authorization Slip Card (Альфа-Банк) */}
          {savedTransactionResult?.posPayment && (
            <Paper sx={{ 
              p: 3, 
              my: 3, 
              maxWidth: 720, 
              mx: 'auto', 
              borderRadius: 3, 
              border: '1px solid #BAE6FD', 
              bgcolor: '#F0F9FF',
              textAlign: 'left',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CreditCardIcon sx={{ color: '#0284C7', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      Банковский слип-чек авторизации (АО «АЛЬФА-БАНК»)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Эквайринг • Безналичная оплата картой
                    </Typography>
                  </Box>
                </Box>
                <Chip 
                  label="🟢 Одобрено банком (Код 00)"
                  size="small"
                  sx={{ 
                    fontWeight: 700, 
                    bgcolor: '#C6F6D5', 
                    color: '#22543D' 
                  }}
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>RRN авторизации</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    №{savedTransactionResult.posPayment.rrn || '—'}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Код авторизации</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', letterSpacing: 0.5 }}>
                    {savedTransactionResult.posPayment.authCode || '—'}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Платёжная система</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    {savedTransactionResult.posPayment.cardType || 'MIR'}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Номер карты (PAN)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.9rem' }}>
                    {savedTransactionResult.posPayment.maskedPan || '•••• 1094'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Терминал: <b>{posStatus?.terminalId || 'ALFA_770192'}</b> • Процессинг: <b>АО «АЛЬФА-БАНК»</b>
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={() => {
                    setActivePosSlipTx({
                      id: savedTransactionResult.posPayment.id || 1,
                      transaction_uuid: savedTransactionResult.posPayment.transaction_uuid || 'tx_0',
                      operation_type: 'pay',
                      amount: totalBilledPrice,
                      terminal_id: posStatus?.terminalId || 'ALFA_770192',
                      merchant_id: posStatus?.merchantId || 'MERCH_884102',
                      rrn: savedTransactionResult.posPayment.rrn,
                      auth_code: savedTransactionResult.posPayment.authCode,
                      card_type: savedTransactionResult.posPayment.cardType,
                      masked_pan: savedTransactionResult.posPayment.maskedPan,
                      status: 'authorized',
                      is_mock: posStatus?.isMockMode ? 1 : 0,
                      slip_text: savedTransactionResult.posPayment.slipText,
                      created_at: new Date().toISOString(),
                      authorized_at: new Date().toISOString()
                    });
                    setPosSlipDialogOpen(true);
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', color: '#0284C7', borderColor: '#0284C7' }}
                >
                  Просмотреть / Распечатать слип-чек
                </Button>
              </Box>
            </Paper>
          )}

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
                disabled={activeStep === 0 && selectedOperations.length === 0}
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
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#F8FAFC',
              borderRadius: 3,
              height: { xs: '95vh', sm: '90vh' },
              maxHeight: { xs: '95vh', sm: '90vh' },
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }
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
            px: 3,
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: '#FEF2F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626'
              }}
            >
              <PictureAsPdfIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '1.05rem', lineHeight: 1.2 }}>
                Предварительный просмотр печатного протокола (PDF)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Формат A4 • Протокол визита и калькуляция расхода материалов
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={() => handlePrintTrigger()}
              sx={{ bgcolor: '#0F3C64', fontWeight: 700, px: 2, '&:hover': { bgcolor: '#082540' } }}
            >
              Печать / Сохранить в PDF
            </Button>
            <IconButton size="small" onClick={() => setPdfPreviewOpen(false)} sx={{ color: '#64748B' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: { xs: 1.5, sm: 2, md: 3 },
            bgcolor: '#F1F5F9',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            '&::-webkit-scrollbar': {
              width: '10px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#E2E8F0',
              borderRadius: '5px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#94A3B8',
              borderRadius: '5px',
              border: '2px solid #E2E8F0',
              '&:hover': {
                background: '#64748B',
              },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: '#94A3B8 #E2E8F0',
          }}
        >
          <Paper
            elevation={4}
            sx={{
              width: '100%',
              maxWidth: '850px',
              bgcolor: '#FFFFFF',
              borderRadius: 2,
              my: 1,
              mb: 4,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E2E8F0'
            }}
          >
            <VisitReportTemplate
              patientName={getPatientDisplayName(selectedPatient)}
              patientPhone={selectedPatient?.contact_phone || selectedPatient?.contact || selectedPatient?.phone || selectedPatient?.sphone || ''}
              operations={selectedOperations}
              operationName={selectedOperations.map(o => o.name).join(', ')}
              operationPrice={totalBilledPrice}
              doctorName={selectedDoctor?.full_name}
              nurseName={selectedNurse?.full_name}
              materials={actualMaterials}
              paymentMethod={paymentMethod}
              notes={visitNotes}
              transactionDate={visitDate ? new Date(visitDate + 'T12:00:00') : new Date()}
              transactionId={savedTransactionResult?.transactionId || 'ПРЕДПРОСМОТР'}
            />
          </Paper>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 1.5,
            bgcolor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
            💡 Документ оптимизирован для печати на 1 листе формата A4
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              onClick={() => setPdfPreviewOpen(false)}
              variant="outlined"
              size="small"
              sx={{ color: '#64748B', borderColor: '#CBD5E1', fontWeight: 600 }}
            >
              Закрыть
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={() => handlePrintTrigger()}
              sx={{ bgcolor: '#0F3C64', fontWeight: 700, px: 2.5, '&:hover': { bgcolor: '#082540' } }}
            >
              Печать / Сохранить в PDF
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Fiscal Test Connection Dialog */}
      <Dialog
        open={fiscalTestDialogOpen}
        onClose={() => setFiscalTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <SpeedIcon sx={{ color: fiscalTestResult?.success ? '#16A34A' : '#DC2626' }} />
          Результаты проверки связи с ККТ «АТОЛ 91Ф»
        </DialogTitle>

        <DialogContent dividers>
          {testingFiscalConnection ? (
            <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={42} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F3C64' }}>
                Опрос состояния ККТ и порта...
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Проверка COM-порта {fiscalStatus?.port || 'COM3'}, отклика фискального накопителя и очереди
              </Typography>
            </Box>
          ) : fiscalTestResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert
                severity={fiscalTestResult.success ? 'success' : 'error'}
                icon={fiscalTestResult.success ? <CheckCircleIcon fontSize="inherit" /> : <ErrorIcon fontSize="inherit" />}
                sx={{ borderRadius: 2 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {fiscalTestResult.success ? 'Связь с ККТ успешно установлена!' : 'Ошибка подключения к оборудованию!'}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  {fiscalTestResult.message}
                </Typography>
              </Alert>

              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64', mb: 1.5 }}>
                  Диагностические параметры оборудования
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, fontSize: '0.82rem' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Режим работы:</Typography>
                    <Typography sx={{ fontWeight: 700, color: fiscalTestResult.isMockMode ? '#0F3C64' : '#D97706' }}>
                      {fiscalTestResult.modeLabel}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Время отклика (Latency):</Typography>
                    <Typography sx={{ fontWeight: 700, color: fiscalTestResult.success ? '#16A34A' : '#DC2626' }}>
                      {fiscalTestResult.latencyMs} мс
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Модель и порт:</Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      {fiscalTestResult.deviceModel} ({fiscalTestResult.port}, {fiscalTestResult.baudRate} бод)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Состояние ленты:</Typography>
                    <Typography sx={{ fontWeight: 700, color: fiscalTestResult.success ? '#16A34A' : '#DC2626' }}>
                      {fiscalTestResult.paperStatusLabel || (fiscalTestResult.success ? 'В норме (OK)' : 'Нет связи')}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Фискальный накопитель (ФН):</Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      №{fiscalTestResult.fnNumber || '—'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Регистрационный номер ККТ:</Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      РН {fiscalTestResult.kktRegNumber || '—'}
                    </Typography>
                  </Box>

                  {fiscalTestResult.portDeviceName && (
                    <Box sx={{ gridColumn: '1 / -1', pt: 1, borderTop: '1px dashed #CBD5E1' }}>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>Устройство в системе Windows на порту {fiscalTestResult.port}:</Typography>
                      <Typography sx={{ fontWeight: 700, color: fiscalTestResult.success ? '#16A34A' : '#DC2626' }}>
                        {fiscalTestResult.portDeviceName}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Advanced Technical Diagnostics & Troubleshooting Box */}
              {!fiscalTestResult.success && (
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#92400E', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorIcon sx={{ fontSize: 18, color: '#D97706' }} />
                    Расширенная техническая диагностика и рекомендации
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: '0.8rem', color: '#451A03' }}>
                    <Box sx={{ p: 1.2, bgcolor: '#FEF3C7', borderRadius: 1.5, border: '1px solid #FCD34D' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#B45309', mb: 0.3 }}>
                        1. Причина сбоя аппаратного контура:
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        В операционной системе Windows к порту <strong>{fiscalTestResult.port}</strong> привязано устройство <strong>«{fiscalTestResult.portDeviceName || 'Неизвестно'}»</strong> (служба Bluetooth/Модем), а не физический кассовый аппарат <strong>«{fiscalTestResult.deviceModel}»</strong>.
                      </Typography>
                    </Box>

                    <Box sx={{ p: 1.2, bgcolor: '#FEF3C7', borderRadius: 1.5, border: '1px solid #FCD34D' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#B45309', mb: 0.3 }}>
                        2. Как подключить физическую ККТ «АТОЛ 91Ф»:
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        • Подключите кассу кабелем USB к компьютеру и включите питание (клавиша [C]).
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        • Переведите аппарат в режим фискального регистратора (ФР) в меню кассы.
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        • Откройте <em>Диспетчер устройств Windows (devmgmt.msc)</em> → <em>Порты (COM и LPT)</em> и проверьте порт драйвера <code>ATOL USB VCP</code>.
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350F' }}>
                        • Укажите найденный номер порта в настройках профиля оборудования.
                      </Typography>
                    </Box>

                    <Box sx={{ p: 1.2, bgcolor: '#EFF6FF', borderRadius: 1.5, border: '1px solid #BFDBFE' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#1E40AF', mb: 0.3 }}>
                        3. Работа без физической кассы (программная эмуляция):
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#1E3A8A' }}>
                        Для работы визитов и финансовых отчетов без подключенного аппарата нажмите кнопку <strong>«Включить «Эмулятор ККТ»»</strong> ниже. Все операции 54-ФЗ будут симулироваться виртуальным драйвером.
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )}
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {fiscalTestResult && !fiscalTestResult.success && !fiscalTestResult.isMockMode && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleSwitchToMockInDialog}
                disabled={switchingFiscalMode || testingFiscalConnection}
                sx={{ fontWeight: 700 }}
              >
                Включить «Эмулятор ККТ»
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={handleTestFiscalConnection}
              disabled={testingFiscalConnection}
              startIcon={<RefreshIcon />}
              sx={{ fontWeight: 700 }}
            >
              Повторить тест
            </Button>

            <Button
              variant="contained"
              onClick={() => setFiscalTestDialogOpen(false)}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Закрыть
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Alfa-Bank POS Slip Preview & Print Modal */}
      <Dialog open={posSlipDialogOpen} onClose={() => setPosSlipDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Банковский слип-чек</span>
          <IconButton size="small" onClick={() => setPosSlipDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#F8FAFC', p: 2 }}>
          <Box sx={{ bgcolor: '#FFFFFF', p: 1, borderRadius: 2, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <PosSlipPrintTemplate ref={printSlipRef} tx={activePosSlipTx} posInfo={posStatus} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => setPosSlipDialogOpen(false)}>Закрыть</Button>
          <Button
            variant="contained"
            onClick={() => handlePrintPosSlip()}
            startIcon={<PrintIcon />}
            sx={{ bgcolor: '#0F3C64', fontWeight: 700 }}
          >
            Печать на принтер (57мм)
          </Button>
        </DialogActions>
      </Dialog>

      {/* HIDDEN PRINT CONTAINER (for react-to-print) */}
      <Box sx={{ display: 'none' }}>
        <VisitReportTemplate
          ref={printRef}
          patientName={getPatientDisplayName(selectedPatient)}
          patientPhone={selectedPatient?.contact_phone || selectedPatient?.contact || selectedPatient?.phone || selectedPatient?.sphone || ''}
          operations={selectedOperations}
          operationName={selectedOperations.map(o => o.name).join(', ')}
          operationPrice={totalBilledPrice}
          doctorName={selectedDoctor?.full_name}
          nurseName={selectedNurse?.full_name}
          materials={actualMaterials}
          paymentMethod={paymentMethod}
          notes={visitNotes}
          transactionDate={visitDate ? new Date(visitDate + 'T12:00:00') : new Date()}
          transactionId={savedTransactionResult?.transactionId}
        />
      </Box>
    </Box>
  );
}
