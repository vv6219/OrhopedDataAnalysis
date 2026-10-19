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
  Healing as HealingIcon,
  MedicalServices as MedicalServicesIcon,
  WarningAmber as WarningAmberIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Layers as LayersIcon,
  AccessTime as PrepIcon,
  AttachMoney as CashIcon,
  AddShoppingCart as AddCartIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  ViewAgenda as TabViewIcon,
  ViewHeadline as FullViewIcon,
  Star as StarIcon,
  Shield as ShieldIcon,
  FitnessCenter as FitnessIcon
} from '@mui/icons-material';
import LatexText, { cleanLatexText } from './LatexText';
import ClinicalGuidanceModal from './ClinicalGuidanceModal';

export type TreatmentCategory = 'manipulation' | 'physiotherapy' | 'orthotics' | 'lfk';

export interface TreatmentItem {
  code: string;
  name: string;
  category?: TreatmentCategory;
  subcategory?: string;
  target_joint?: string;
  service_scope?: 'internal' | 'external';
  priority_level?: string;
  dosage_or_regimen?: string;
  regimen_standard?: string;
  description?: string;
  technique_details?: string;
  patient_preparation?: string;
  post_procedure_care?: string;
  clinical_indications?: string;
  contraindications?: string;
  servdict_id?: number | null;
  servdict_code?: string | null;
  servdict_price?: number | null;
  servdict_name?: string | null;
  evidence_level?: string;
  modality_tag?: string;
  apparatus_examples?: string;
  biophysical_profile?: string;
  ebm_priority?: string;
  exact_dosimetry?: string;
  is_stop_warning?: number | boolean;
  stop_rationale?: string;
}

export interface TreatmentGuidanceModalProps {
  open: boolean;
  onClose: () => void;
  treatment?: TreatmentItem | null;
  category?: TreatmentCategory;
  title?: string;
  onAssign?: (treatment: TreatmentItem) => void;
  assignButtonText?: string;
  readOnly?: boolean;
}

const CATEGORY_THEMES: Record<TreatmentCategory, { headerBg: string; title: string; icon: React.ReactNode }> = {
  manipulation: {
    headerBg: 'linear-gradient(135deg, #0F766E 0%, #0E7490 100%)',
    title: 'Лечебная манипуляция / Инъекционная терапия',
    icon: <HealingIcon sx={{ fontSize: 22 }} />
  },
  physiotherapy: {
    headerBg: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
    title: 'Аппаратная физиотерапия и восстановительное лечение',
    icon: <BiotechIcon sx={{ fontSize: 22 }} />
  },
  orthotics: {
    headerBg: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
    title: 'Ортопедическое изделие, ортез и разгрузка',
    icon: <FitnessIcon sx={{ fontSize: 22 }} />
  },
  lfk: {
    headerBg: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
    title: 'Лечебная физкультура и кинезиотерапия',
    icon: <FitnessIcon sx={{ fontSize: 22 }} />
  }
};

const JOINT_LABELS: Record<string, string> = {
  knee: 'Коленный сустав',
  shoulder: 'Плечевой сустав',
  hip: 'Тазобедренный сустав и таз',
  ankle: 'Стопа и голеностоп',
  elbow: 'Локтевой сустав',
  wrist: 'Кисть и запястье',
  spine: 'Позвоночник и торакс',
  general: 'Общая ортопедия'
};

export const TreatmentGuidanceModal: React.FC<TreatmentGuidanceModalProps> = ({
  open,
  onClose,
  treatment,
  category = 'manipulation',
  onAssign,
  assignButtonText = 'Добавить в назначения',
  readOnly = false
}) => {
  const [modalTab, setModalTab] = React.useState<number>(0);
  const [copiedPhrase, setCopiedPhrase] = React.useState<boolean>(false);
  const [viewMode, setViewMode] = React.useState<'tabs' | 'scroll'>('tabs');

  if (!treatment) {
    const sec = category === 'physiotherapy' ? 'physiotherapy' : category === 'orthotics' ? 'orthotics' : category === 'lfk' ? 'lfk' : 'manipulations';
    return <ClinicalGuidanceModal open={open} onClose={onClose} initialSection={sec} />;
  }

  const actualCategory = treatment.category || category;
  const theme = CATEGORY_THEMES[actualCategory] || CATEGORY_THEMES.manipulation;
  const jointLabel = JOINT_LABELS[treatment.target_joint || ''] || treatment.target_joint || 'Общий стандарт';
  const isInternal = treatment.service_scope === 'internal';

  const copyText = `${treatment.name}: ${treatment.dosage_or_regimen || treatment.regimen_standard || ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanLatexText(copyText));
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
          background: theme.headerBg,
          color: '#FFFFFF',
          p: 2.25,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pr: 5 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            <Chip
              icon={theme.icon as any}
              label={theme.title}
              size="small"
              sx={{
                bgcolor: '#FFFFFF',
                color: '#0F172A',
                fontWeight: 800,
                fontSize: '0.72rem'
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
            {isInternal ? (
              <Chip
                icon={<StarIcon sx={{ fontSize: '14px !important', color: '#FDE047 !important' }} />}
                label="🏥 ВНУТРЕННЯЯ УСЛУГА (HIGH)"
                size="small"
                sx={{
                  bgcolor: '#0F172A',
                  color: '#FDE047',
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  border: '1px solid #FDE047'
                }}
              />
            ) : (
              <Chip
                label="🌐 Внешняя услуга / Партнёр"
                size="small"
                sx={{
                  bgcolor: '#E2E8F0',
                  color: '#334155',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}
              />
            )}
            {treatment.evidence_level && (
              <Chip
                label={`Уровень EBM: ${treatment.evidence_level}`}
                size="small"
                sx={{
                  bgcolor: '#F59E0B',
                  color: '#0F172A',
                  fontWeight: 900,
                  fontSize: '0.72rem'
                }}
              />
            )}
            {treatment.ebm_priority && (
              <Chip
                label={`Приоритет: ${treatment.ebm_priority}`}
                size="small"
                sx={{
                  bgcolor: treatment.ebm_priority === 'P1' ? '#10B981' : treatment.ebm_priority === 'P2' ? '#3B82F6' : '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.72rem'
                }}
              />
            )}
          </Stack>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, fontSize: '1.25rem' }}>
          <LatexText text={treatment.name} />
        </Typography>

        {treatment.apparatus_examples && (
          <Typography variant="caption" sx={{ color: '#E0E7FF', display: 'block', mt: -0.5 }}>
            <strong>Аппаратный комплекс:</strong> {treatment.apparatus_examples}
          </Typography>
        )}

        {/* Prescription Regimen / Dosage with 1-click Copy */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(255,255,255,0.12)', p: 1, px: 1.5, borderRadius: 1.5 }}>
          <Typography variant="caption" sx={{ color: '#F1F5F9', fontStyle: 'italic', pr: 1 }}>
            Регламент: «<LatexText text={treatment.dosage_or_regimen || treatment.regimen_standard || 'В соответствии со стандартом лечения'} />»
          </Typography>
          <Tooltip title={copiedPhrase ? "Скопировано в буфер!" : "Скопировать назначение в протокол"}>
            <Button
              size="small"
              variant="contained"
              onClick={handleCopy}
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

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: '#FFFFFF',
            bgcolor: 'rgba(255,255,255,0.15)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
          }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Sub-Tabs Navigation */}
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
          <Tab icon={<ShieldIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="3. Постуход и риски" />
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
          {/* TAB 0: OVERVIEW, INDICATIONS & CLINIC PRICING */}
          {(viewMode === 'scroll' || modalTab === 0) && (
            <>
              {/* Section 1: Clinical Mechanism & EBM */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BiotechIcon sx={{ color: '#0F3C64', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    Клиническое назначение, биомеханический механизм и EBM
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6, textAlign: 'justify' }}>
                  <LatexText text={treatment.description || 'Клиническое назначение и доказанная эффективность в соответствии с клиническими рекомендациями.'} />
                </Typography>
              </Paper>

              {/* Section 2: Clinical Indications */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <MedicalServicesIcon sx={{ color: '#0284C7', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0284C7' }}>
                    Показания к назначению
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                  <LatexText text={treatment.clinical_indications || 'Остеоартроз, связочная нестабильность, миофасциальный и вертеброгенный болевой синдром.'} />
                </Typography>
              </Paper>

              {/* Section 3: Linked Clinic Service (servdict) */}
              {treatment.servdict_price ? (
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
                        Внутренняя услуга клиники в прейскуранте (HIGH Priority)
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#047857', fontWeight: 600 }}>
                      <LatexText text={treatment.servdict_name || treatment.name} />
                    </Typography>
                    {treatment.servdict_code && (
                      <Typography variant="caption" sx={{ color: '#059669' }}>
                        Код номенклатуры: {treatment.servdict_code}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={`${treatment.servdict_price.toLocaleString('ru-RU')} ₽`}
                    sx={{
                      bgcolor: '#059669',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      height: 34,
                      px: 1.25
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
                    Внешнее медицинское назначение / Партнёрская услуга (выполняется сторонним специализированным центром).
                  </Typography>
                </Paper>
              )}
            </>
          )}

          {/* TAB 1: TECHNIQUE, PARAMETERS & PATIENT PREPARATION */}
          {(viewMode === 'scroll' || modalTab === 1) && (
            <>
              {/* Technique & Parameters */}
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
                    Техника проведения, доступы и параметры оборудования
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#0C4A6E', lineHeight: 1.6 }}>
                  <LatexText text={treatment.technique_details || 'Стандартизированная техника проведения в соответствии с клиническим протоколом.'} />
                </Typography>
              </Paper>

              {/* Regimen & Course Standard */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AssignmentIcon sx={{ color: '#4338CA', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#4338CA' }}>
                    Курсовой регламент и кратность
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                  <LatexText text={treatment.regimen_standard || treatment.dosage_or_regimen || 'Курс подбирается индивидуально лечащим врачом.'} />
                </Typography>
              </Paper>

              {/* Patient Preparation */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PrepIcon sx={{ color: '#D97706', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#D97706' }}>
                    Подготовка пациента к процедуре
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                  <LatexText text={treatment.patient_preparation || 'Специальной подготовки не требуется. Ознакомление с памяткой пациента.'} />
                </Typography>
              </Paper>
            </>
          )}

          {/* TAB 2: POST-PROCEDURE CARE & SAFETY CONTRAINDICATIONS */}
          {(viewMode === 'scroll' || modalTab === 2) && (
            <>
              {/* Post-Procedure Care */}
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
                  <ShieldIcon sx={{ color: '#15803D', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#15803D' }}>
                    Постуход и реабилитационный режим
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#14532D', lineHeight: 1.6 }}>
                  <LatexText text={treatment.post_procedure_care || 'Охранительный режим конечности 24–48 часов, ограничение ударных нагрузок.'} />
                </Typography>
              </Paper>

              {/* Contraindications (Safety EBM) */}
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
                    Противопоказания и клинические ограничения (Safety EBM)
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#7F1D1D', lineHeight: 1.6 }}>
                  <LatexText text={treatment.contraindications || 'Абсолютные: инфекция кожи, сепсис, онкопатология. Относительные: лихорадка, некорригированные коагулопатии.'} />
                </Typography>
              </Paper>
            </>
          )}
        </Stack>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ p: 2, px: 3, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
          Код: {treatment.code}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Закрыть
          </Button>
          {!readOnly && onAssign && (
            <Button
              variant="contained"
              onClick={() => {
                onAssign(treatment);
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

export default TreatmentGuidanceModal;
