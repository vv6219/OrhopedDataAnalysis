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
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Biotech as BiotechIcon,
  MedicalServices as MedicalServicesIcon,
  WarningAmber as WarningAmberIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Layers as LayersIcon,
  MenuBook as CriteriaIcon,
  AccessTime as PrepIcon,
  AttachMoney as CashIcon,
  AddShoppingCart as AddCartIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  ViewAgenda as TabViewIcon,
  ViewHeadline as FullViewIcon
} from '@mui/icons-material';
import LatexText, { cleanLatexText } from './LatexText';
import ClinicalGuidanceModal from './ClinicalGuidanceModal';

export interface DiagnosticMethodItem {
  code: string;
  name: string;
  modality?: string;
  target_joint?: string;
  servdict_id?: number | null;
  clinical_indications?: string | null;
  protocol_phrase?: string;
  priority_level?: string;
  servdict_price?: number | null;
  servdict_name?: string | null;
  description?: string | null;
  technique_details?: string | null;
  patient_preparation?: string | null;
  diagnostic_criteria?: string | null;
  contraindications?: string | null;
  urgency?: string;
}

export interface DiagnosticMethodGuidanceModalProps {
  open: boolean;
  onClose: () => void;
  diagnostic: DiagnosticMethodItem | null;
  onAssign?: (diagnostic: DiagnosticMethodItem) => void;
  assignButtonText?: string;
  readOnly?: boolean;
}

const MODALITY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  mri: { label: 'МРТ (Магнитно-резонансная томография)', color: '#7C3AED', bg: '#F5F3FF' },
  xray: { label: 'Рентгенография (Спецпроекции)', color: '#0284C7', bg: '#F0F9FF' },
  ultrasound: { label: 'УЗИ / Сонография', color: '#059669', bg: '#ECFDF5' },
  ct: { label: 'МСКТ (Компьютерная томография)', color: '#D97706', bg: '#FFFBEB' },
  lab: { label: 'Лабораторная диагностика', color: '#DC2626', bg: '#FEF2F2' },
  enmg: { label: 'ЭНМГ (Электронейромиография)', color: '#4B5563', bg: '#F3F4F6' },
  bone_scan: { label: 'Остеоденситометрия (DEXA) / Сцинтиграфия', color: '#4F46E5', bg: '#EEF2FF' },
  plantography: { label: 'Плантография / Подометрия', color: '#0891B2', bg: '#ECFEFF' },
  arthroscopy: { label: 'Диагностическая артроскопия', color: '#BE185D', bg: '#FDF2F8' },
  functional: { label: 'Функциональная диагностика / Блокада', color: '#0D9488', bg: '#F0FDFA' }
};

const JOINT_LABELS: Record<string, string> = {
  knee: 'Коленный сустав',
  shoulder: 'Плечевой сустав',
  hip: 'Тазобедренный сустав и таз',
  ankle: 'Стопа и голеностопный сустав',
  elbow: 'Локтевой сустав',
  wrist: 'Лучезапястный сустав и кисть',
  spine: 'Позвоночник и торакс',
  general: 'Общая / Системная'
};

const TIER_MAP: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: 'Tier 1: Базовый стандарт (1-я линия)', color: '#DC2626', bg: '#FEF2F2' },
  medium: { label: 'Tier 2: Верификация диагноза (2-я линия)', color: '#D97706', bg: '#FFFBEB' },
  low: { label: 'Tier 3: Экспертный / Предоперационный', color: '#2563EB', bg: '#EFF6FF' }
};

export const DiagnosticMethodGuidanceModal: React.FC<DiagnosticMethodGuidanceModalProps> = ({
  open,
  onClose,
  diagnostic,
  onAssign,
  assignButtonText = 'Добавить в протокол и назначения',
  readOnly = false
}) => {
  const [modalTab, setModalTab] = React.useState<number>(0);
  const [copiedPhrase, setCopiedPhrase] = React.useState<boolean>(false);
  const [viewMode, setViewMode] = React.useState<'tabs' | 'scroll'>('tabs');

  if (!diagnostic) {
    return <ClinicalGuidanceModal open={open} onClose={onClose} initialSection="diagnostics" />;
  }

  const modalityInfo = MODALITY_MAP[diagnostic.modality || 'xray'] || {
    label: diagnostic.modality?.toUpperCase() || 'ДИАГНОСТИКА',
    color: '#0F3C64',
    bg: '#F1F5F9'
  };

  const jointLabel = JOINT_LABELS[diagnostic.target_joint || ''] || diagnostic.target_joint || 'Общий стандарт';
  const tierInfo = TIER_MAP[diagnostic.priority_level || 'medium'] || TIER_MAP.medium;

  const handleCopyPhrase = () => {
    if (!diagnostic.protocol_phrase) return;
    navigator.clipboard.writeText(cleanLatexText(diagnostic.protocol_phrase));
    setCopiedPhrase(true);
    setTimeout(() => setCopiedPhrase(false), 2000);
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
            boxShadow: '0 24px 48px rgba(15, 60, 100, 0.25)',
            overflow: 'hidden',
            border: '1px solid #CBD5E1',
            maxHeight: '90vh'
          }
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: '#0F3C64',
          color: '#FFFFFF',
          p: 2.25,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          position: 'relative',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pr: 5 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            <Chip
              label={modalityInfo.label}
              size="small"
              sx={{
                bgcolor: '#FFFFFF',
                color: modalityInfo.color,
                fontWeight: 800,
                fontSize: '0.72rem',
                border: `1px solid ${modalityInfo.color}`
              }}
            />
            <Chip
              label={jointLabel}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.72rem'
              }}
            />
            <Chip
              label={tierInfo.label}
              size="small"
              sx={{
                bgcolor: tierInfo.color,
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.72rem'
              }}
            />
            {diagnostic.urgency === 'cito' && (
              <Chip
                label="CITO (Экстренно)"
                size="small"
                sx={{
                  bgcolor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}
              />
            )}
          </Stack>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, fontSize: '1.25rem' }}>
          <LatexText text={diagnostic.name} />
        </Typography>

        {diagnostic.protocol_phrase && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(255,255,255,0.1)', p: 1, px: 1.5, borderRadius: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#BAE6FD', fontStyle: 'italic', pr: 1 }}>
              Направление: «<LatexText text={diagnostic.protocol_phrase} />»
            </Typography>
            <Tooltip title={copiedPhrase ? "Скопировано в буфер!" : "Скопировать точную формулировку"}>
              <Button
                size="small"
                variant="contained"
                onClick={handleCopyPhrase}
                startIcon={copiedPhrase ? <CheckIcon sx={{ fontSize: 14 }} /> : <CopyIcon sx={{ fontSize: 14 }} />}
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  bgcolor: copiedPhrase ? '#16A34A' : 'rgba(255,255,255,0.25)',
                  color: '#FFFFFF',
                  py: 0.25,
                  px: 1,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: copiedPhrase ? '#15803D' : 'rgba(255,255,255,0.35)' }
                }}
              >
                {copiedPhrase ? 'Скопировано!' : 'Скопировать'}
              </Button>
            </Tooltip>
          </Box>
        )}

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: '#FFFFFF',
            bgcolor: 'rgba(255,255,255,0.1)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
          }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* View Switcher & Navigation Tabs */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
        <Tabs
          value={viewMode === 'tabs' ? modalTab : false}
          onChange={(_, val) => {
            setViewMode('tabs');
            setModalTab(val);
          }}
          sx={{
            minHeight: 42,
            '& .MuiTab-root': {
              minHeight: 42,
              py: 0.5,
              px: 1.75,
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'none',
              color: '#64748B',
              '&.Mui-selected': {
                color: '#0F3C64',
                fontWeight: 800
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              bgcolor: '#0284C7'
            }
          }}
        >
          <Tab icon={<BiotechIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="1. Обзор и показания" />
          <Tab icon={<LayersIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="2. Методика и подготовка" />
          <Tab icon={<CriteriaIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="3. Критерии EBM и риски" />
        </Tabs>

        <Tooltip title={viewMode === 'tabs' ? "Показать все разделы одним свитком" : "Переключить на пошаговые вкладки"}>
          <Button
            size="small"
            variant="text"
            startIcon={viewMode === 'tabs' ? <FullViewIcon sx={{ fontSize: 16 }} /> : <TabViewIcon sx={{ fontSize: 16 }} />}
            onClick={() => setViewMode(viewMode === 'tabs' ? 'scroll' : 'tabs')}
            sx={{ textTransform: 'none', fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}
          >
            {viewMode === 'tabs' ? 'Свитком' : 'Вкладками'}
          </Button>
        </Tooltip>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 2.75, bgcolor: '#F8FAFC' }}>
        <Stack spacing={2.25}>
          {/* TAB 0: OVERVIEW & CLINICAL INDICATIONS */}
          {(viewMode === 'scroll' || modalTab === 0) && (
            <>
              {/* Section 1: Clinical Description */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BiotechIcon sx={{ color: '#0F3C64', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    Клиническое назначение и сущность метода
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6, textAlign: 'justify' }}>
                  <LatexText text={diagnostic.description || 'Клиническое назначение и физические параметры исследования в соответствии со стандартом оказания специализированной помощи.'} />
                </Typography>
              </Paper>

              {/* Section 2: Clinical Indications */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <MedicalServicesIcon sx={{ color: '#0284C7', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0284C7' }}>
                    Показания к исследованию
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                  <LatexText text={diagnostic.clinical_indications || diagnostic.protocol_phrase || 'Верификация диагноза, исключение сопутствующей патологии, стадирование процесса.'} />
                </Typography>
              </Paper>

              {/* Section 7: Linked Clinic Service (if applicable) */}
              {diagnostic.servdict_price ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#ECFDF5',
                    borderColor: '#A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                      <CashIcon sx={{ color: '#059669', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065F46' }}>
                        Связанная услуга клиники в прейскуранте (Внутренняя услуга)
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#047857', fontWeight: 600 }}>
                      <LatexText text={diagnostic.servdict_name || diagnostic.name} />
                    </Typography>
                  </Box>
                  <Chip
                    label={`${diagnostic.servdict_price.toLocaleString('ru-RU')} ₽`}
                    sx={{
                      bgcolor: '#059669',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      height: 32,
                      px: 1
                    }}
                  />
                </Paper>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#F8FAFC',
                    borderColor: '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <AssignmentIcon sx={{ color: '#64748B', fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Внешнее диагностическое направление (исследование выполняется на базе внешнего диагностического центра или лаборатории).
                  </Typography>
                </Paper>
              )}
            </>
          )}

          {/* TAB 1: TECHNIQUE & PREPARATION */}
          {(viewMode === 'scroll' || modalTab === 1) && (
            <>
              {/* Section 3: Technique & Projections */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#F0F9FF',
                  borderColor: '#BAE6FD'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LayersIcon sx={{ color: '#0369A1', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369A1' }}>
                    Методика проведения, укладки и протоколы сканирования
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#0C4A6E', lineHeight: 1.6 }}>
                  <LatexText text={diagnostic.technique_details || 'Стандартизированная методика сканирования в ортопедических укладках с соблюдением требований к толщине среза и импульсным последовательностям.'} />
                </Typography>
              </Paper>

              {/* Section 4: Patient Preparation */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PrepIcon sx={{ color: '#D97706', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#D97706' }}>
                    Подготовка пациента
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                  <LatexText text={diagnostic.patient_preparation || 'Специальной предварительной подготовки не требуется. Снятие металлических предметов перед исследованием.'} />
                </Typography>
              </Paper>
            </>
          )}

          {/* TAB 2: CRITERIA EBM & RISKS */}
          {(viewMode === 'scroll' || modalTab === 2) && (
            <>
              {/* Section 5: Diagnostic Criteria & Scales */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#F0FDF4',
                  borderColor: '#BBF7D0'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CriteriaIcon sx={{ color: '#15803D', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#15803D' }}>
                    Диагностические критерии и валидированные шкалы (EBM)
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#14532D', lineHeight: 1.6 }}>
                  <LatexText text={diagnostic.diagnostic_criteria || 'Оценка по международным классификациям и клиническим рекомендациям.'} />
                </Typography>
              </Paper>

              {/* Section 6: Contraindications */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#FEF2F2',
                  borderColor: '#FECACA'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningAmberIcon sx={{ color: '#B91C1C', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#B91C1C' }}>
                    Противопоказания и клинические ограничения
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#7F1D1D', lineHeight: 1.6 }}>
                  <LatexText text={diagnostic.contraindications || 'Абсолютные: кардиостимуляторы (МРТ), беременность (рентген/КТ). Относительные: выраженная клаустрофобия, масса тела выше предела гентри.'} />
                </Typography>
              </Paper>
            </>
          )}
        </Stack>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ p: 2, px: 3, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
          Код метода: {diagnostic.code}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Закрыть
          </Button>
          {!readOnly && onAssign && (
            <Button
              variant="contained"
              onClick={() => {
                onAssign(diagnostic);
                onClose();
              }}
              startIcon={<AddCartIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: '#0F3C64',
                '&:hover': { bgcolor: '#156C9C' }
              }}
            >
              {assignButtonText}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default DiagnosticMethodGuidanceModal;
