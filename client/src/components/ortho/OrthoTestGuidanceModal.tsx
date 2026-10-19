import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Biotech as BiotechIcon,
  AccessibilityNew as AccessibilityNewIcon,
  PanTool as PanToolIcon,
  TrendingFlat as TrendingFlatIcon,
  WarningAmber as WarningAmberIcon,
  LocalHospital as LocalHospitalIcon,
  HelpOutlined as HelpOutlineIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutlined as ErrorOutlineIcon
} from '@mui/icons-material';
import LatexText from './LatexText';
import ClinicalGuidanceModal from './ClinicalGuidanceModal';

export interface OrthoTestGuidanceModalProps {
  open: boolean;
  onClose: () => void;
  test: {
    code: string;
    name_ru?: string;
    name?: string;
    name_lat?: string;
    joint_category?: string;
    target_joint?: string;
    target_structure?: string;
    methodology?: string;
    technique_description?: string;
    positive_criteria?: string;
    positive_criterion?: string;
    sensitivity_specificity?: string | null;
    sensitivity_pct?: number | null;
    specificity_pct?: number | null;
    evidence_level?: string | null;
    patient_position?: string | null;
    doctor_hand_placement?: string | null;
    applied_force_direction?: string | null;
    false_positive_factors?: string | null;
    clinical_interpretation?: string | null;
    illustration_key?: string | null;
  } | null;
  currentResult?: string;
  onSetResult?: (result: string) => void;
  readOnly?: boolean;
}

const JOINT_LABELS: Record<string, string> = {
  knee: 'Коленный сустав',
  hip: 'Тазобедренный сустав',
  shoulder: 'Плечевой сустав',
  elbow: 'Локтевой сустав',
  wrist: 'Лучезапястный сустав и кисть',
  ankle: 'Голеностопный сустав и стопа',
  spine: 'Позвоночник и спина'
};

export const OrthoTestGuidanceModal: React.FC<OrthoTestGuidanceModalProps> = ({
  open,
  onClose,
  test,
  currentResult,
  onSetResult,
  readOnly = false
}) => {
  if (!test) {
    return <ClinicalGuidanceModal open={open} onClose={onClose} initialSection="tests" />;
  }

  const displayName = test.name_ru || test.name || test.code;
  const jointName = JOINT_LABELS[test.joint_category || test.target_joint || ''] || test.joint_category || 'Сустав';
  const targetStructure = test.target_structure || 'Анатомические структуры сустава';
  
  // Granular guidance with graceful fallbacks
  const patientPos = test.patient_position || test.methodology || test.technique_description || 'Положение пациента в соответствии со стандартной клинической методикой.';
  const handPlacement = test.doctor_hand_placement || 'Врач выполняет двуручную стабилизацию сегмента конечности и суставной щели.';
  const forceDir = test.applied_force_direction || 'Дозированная компрессия, тракция или стресс-тестирование связочного аппарата.';
  const positiveCrit = test.positive_criteria || test.positive_criterion || 'Возникновение локального болевого синдрома, щелчка, патологической подвижности.';
  const clinInterp = test.clinical_interpretation || `Поражение или функциональная несостоятельность: ${targetStructure}`;
  const falsePositives = test.false_positive_factors || 'Рефлекторный мышечный спазм, контрактура, иррадиация из смежных сегментов.';

  const isPositive = currentResult === 'positive' || currentResult === 'positive_medial' || currentResult === 'positive_lateral';

  const handleApplyResult = (res: string) => {
    if (onSetResult) {
      onSetResult(res);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(15, 60, 100, 0.22)',
            overflow: 'hidden',
            border: '1px solid #CBD5E1'
          }
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: '#0F3C64',
          color: '#FFFFFF',
          p: 2.5,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          borderBottom: '2px solid #0284C7'
        }}
      >
        <Box sx={{ pr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <BiotechIcon sx={{ color: '#38BDF8', fontSize: 24 }} />
            <Typography variant="overline" sx={{ color: '#BAE6FD', fontWeight: 800, letterSpacing: 1.2 }}>
              КЛИНИЧЕСКИЙ ГИД • {jointName.toUpperCase()}
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
            <LatexText text={displayName} />
          </Typography>
          {test.name_lat && (
            <Typography variant="subtitle2" sx={{ color: '#93C5FD', fontStyle: 'italic', mt: 0.2 }}>
              {test.name_lat}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#E0F2FE',
            bgcolor: 'rgba(255,255,255,0.1)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
          }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Main Body */}
      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
        <Stack spacing={2.5}>
          {/* Target Structure & Evidence Stats Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5
            }}
          >
            <Box sx={{ minWidth: 240, flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                Анатомический субстрат теста:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                <LatexText text={targetStructure} />
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              {test.sensitivity_pct != null && (
                <Chip
                  label={`Чувствительность (Se): ${test.sensitivity_pct}%`}
                  size="small"
                  sx={{
                    bgcolor: '#DCFCE7',
                    color: '#166534',
                    fontWeight: 700,
                    border: '1px solid #86EFAC',
                    fontSize: '0.8rem'
                  }}
                />
              )}
              {test.specificity_pct != null && (
                <Chip
                  label={`Специфичность (Sp): ${test.specificity_pct}%`}
                  size="small"
                  sx={{
                    bgcolor: '#E0F2FE',
                    color: '#0369A1',
                    fontWeight: 700,
                    border: '1px solid #7DD3FC',
                    fontSize: '0.8rem'
                  }}
                />
              )}
              {test.evidence_level && (
                <Chip
                  label={`Доказательность: Класс ${test.evidence_level}`}
                  size="small"
                  sx={{
                    bgcolor: '#F3E8FF',
                    color: '#6B21A8',
                    fontWeight: 700,
                    border: '1px solid #D8B4FE',
                    fontSize: '0.8rem'
                  }}
                />
              )}
            </Box>
          </Paper>

          {/* 3-Step Execution Protocol Cards */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, color: '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#0284C7'
                }}
              />
              ПРОТОКОЛ ВЫПОЛНЕНИЯ ТЕСТА (ПОШАГОВЫЙ АЛГОРИТМ ДЛЯ ВРАЧА)
            </Typography>

            <Stack spacing={1.5}>
              {/* Step 1: Patient Position */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #BAE6FD',
                  borderLeft: '5px solid #0284C7'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
                  <AccessibilityNewIcon sx={{ color: '#0284C7', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369A1' }}>
                    1. ИСХОДНОЕ ПОЛОЖЕНИЕ ПАЦИЕНТА И УГЛЫ СУСТАВА
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#1E293B', lineHeight: 1.6, pl: 3.7 }}>
                  <LatexText text={patientPos} />
                </Typography>
              </Paper>

              {/* Step 2: Hand Placement & Stabilization */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #BFDBFE',
                  borderLeft: '5px solid #2563EB'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
                  <PanToolIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1D4ED8' }}>
                    2. ТОЧКИ ЗАХВАТА И СТАБИЛИЗАЦИИ РУКАМИ ВРАЧА
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#1E293B', lineHeight: 1.6, pl: 3.7 }}>
                  <LatexText text={handPlacement} />
                </Typography>
              </Paper>

              {/* Step 3: Vector & Force Dynamics */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #FED7AA',
                  borderLeft: '5px solid #F59E0B'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
                  <TrendingFlatIcon sx={{ color: '#D97706', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#B45309' }}>
                    3. ВЕКТОР НАГРУЗКИ И ДИНАМИКА ТЕСТА
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#1E293B', lineHeight: 1.6, pl: 3.7 }}>
                  <LatexText text={forceDir} />
                </Typography>
              </Paper>
            </Stack>
          </Box>

          {/* Clinical Interpretation & Diagnostic Criteria Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {/* Positive Criteria (Red Alert) */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderLeft: '5px solid #DC2626'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                <WarningAmberIcon sx={{ color: '#DC2626', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#991B1B' }}>
                  ПОЛОЖИТЕЛЬНЫЙ ОТКЛИК (+)
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#7F1D1D', fontWeight: 600, lineHeight: 1.5 }}>
                <LatexText text={positiveCrit} />
              </Typography>
            </Paper>

            {/* Clinical Interpretation / Diagnoses (Indigo) */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#EEF2FF',
                border: '1px solid #C7D2FE',
                borderLeft: '5px solid #4F46E5'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                <LocalHospitalIcon sx={{ color: '#4F46E5', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#3730A3' }}>
                  КЛИНИЧЕСКАЯ ИНТЕРПРЕТАЦИЯ
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#312E81', lineHeight: 1.5 }}>
                <LatexText text={clinInterp} />
              </Typography>
            </Paper>
          </Box>

          {/* False Positive / Pitfalls Warning */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#FFFBEB',
              border: '1px solid #FDE68A',
              display: 'flex',
              gap: 1.5
            }}
          >
            <HelpOutlineIcon sx={{ color: '#D97706', fontSize: 22, mt: 0.2 }} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                Дифференциальный диагноз и ложные результаты:
              </Typography>
              <Typography variant="body2" sx={{ color: '#78350F', mt: 0.3, lineHeight: 1.5 }}>
                <LatexText text={falsePositives} />
              </Typography>
            </Box>
          </Paper>
        </Stack>
      </DialogContent>

      <Divider />

      {/* Footer / Direct Action Buttons */}
      <DialogActions
        sx={{
          p: 2.5,
          bgcolor: '#F1F5F9',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        {/* Left: Current State Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
            Текущий результат:
          </Typography>
          <Chip
            size="small"
            icon={isPositive ? <ErrorOutlineIcon /> : <CheckCircleIcon />}
            label={isPositive ? 'Положительный (+)' : 'Отрицательный (-)'}
            sx={{
              fontWeight: 800,
              bgcolor: isPositive ? '#FEE2E2' : '#DCFCE7',
              color: isPositive ? '#991B1B' : '#166534',
              border: '1px solid',
              borderColor: isPositive ? '#F87171' : '#86EFAC'
            }}
          />
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {!readOnly && onSetResult && (
            <>
              <Button
                variant={!isPositive ? 'contained' : 'outlined'}
                onClick={() => handleApplyResult('negative')}
                startIcon={<CheckCircleIcon />}
                sx={{
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: !isPositive ? '#166534' : 'transparent',
                  borderColor: '#166534',
                  color: !isPositive ? '#FFFFFF' : '#166534',
                  '&:hover': {
                    bgcolor: !isPositive ? '#14532D' : '#F0FDF4'
                  }
                }}
              >
                Отметить: Отрицательный (-)
              </Button>
              <Button
                variant={isPositive ? 'contained' : 'outlined'}
                onClick={() => handleApplyResult('positive')}
                startIcon={<WarningAmberIcon />}
                sx={{
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: isPositive ? '#DC2626' : 'transparent',
                  borderColor: '#DC2626',
                  color: isPositive ? '#FFFFFF' : '#DC2626',
                  '&:hover': {
                    bgcolor: isPositive ? '#B91C1C' : '#FEF2F2'
                  }
                }}
              >
                Отметить: Положительный (+)
              </Button>
            </>
          )}

          <Button
            onClick={onClose}
            variant="text"
            sx={{ fontWeight: 700, textTransform: 'none', color: '#475569' }}
          >
            Закрыть
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default OrthoTestGuidanceModal;
