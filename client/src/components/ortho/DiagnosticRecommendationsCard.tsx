import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Grid,
  Tooltip,
  CircularProgress,
  Alert,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Biotech as BiotechIcon,
  Add as AddIcon,
  CheckCircle as AddedIcon,
  OpenInNew as ExternalIcon,
  AttachMoney as CashIcon,
  InfoOutlined as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import DiagnosticMethodGuidanceModal from './DiagnosticMethodGuidanceModal';
import LatexText from './LatexText';

interface DiagnosticCatalogItem {
  code: string;
  name: string;
  modality: string;
  target_joint: string;
  servdict_id?: number | null;
  clinical_indications?: string;
  protocol_phrase: string;
  priority_level: string;
  servdict_price?: number | null;
  servdict_name?: string | null;
  description?: string | null;
  technique_details?: string | null;
  patient_preparation?: string | null;
  diagnostic_criteria?: string | null;
  contraindications?: string | null;
  urgency?: string;
}

interface DiagnosticRecommendationsCardProps {
  jointCategory: string;
  templateDiagnostics?: Array<{
    diagnostic_code: string;
    urgency?: string;
    priority_level?: string;
    name?: string;
    servdict_price?: number | null;
    protocol_phrase?: string;
    description?: string | null;
    technique_details?: string | null;
    patient_preparation?: string | null;
    diagnostic_criteria?: string | null;
    contraindications?: string | null;
  }>;
  existingPrescriptions?: Array<{
    title: string;
    service_id?: number;
    unit_price?: number;
  }>;
  onAddPrescription: (prescription: {
    category: string;
    title: string;
    unit_price: number;
    quantity: number;
    service_id?: number;
  }) => void;
  onAppendRecommendationText?: (text: string) => void;
}

const DIAG_TIER_CONFIG = [
  { key: 'high', label: 'Tier 1: Базовый стандарт (Первая линия, $Sn \\ge 95\\%$)', short: 'Tier 1: Базовый', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
  { key: 'medium', label: 'Tier 2: Верификация диагноза (Вторая линия, $B_0 \\ge 1.5\\text{ Тл}$)', short: 'Tier 2: Верификация', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' },
  { key: 'low', label: 'Tier 3: Экспертный / Предоперационный ($3\\text{D-КТ}$, $LR+ > 10$)', short: 'Tier 3: Экспертный', color: '#2563EB', bg: '#EFF6FF', border: '#93C5FD' }
];

export default function DiagnosticRecommendationsCard({
  jointCategory,
  templateDiagnostics,
  existingPrescriptions = [],
  onAddPrescription,
  onAppendRecommendationText
}: DiagnosticRecommendationsCardProps) {
  const [catalog, setCatalog] = useState<DiagnosticCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDiagForGuidance, setSelectedDiagForGuidance] = useState<DiagnosticCatalogItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch('/api/ortho/diagnostics/catalog')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success) {
          setCatalog(data.diagnostics || []);
        }
      })
      .catch(err => console.error('Failed to load diagnostics catalog:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Filter recommendations based on active template or active joint
  const relevantItems = useMemo(() => {
    if (templateDiagnostics && templateDiagnostics.length > 0) {
      // First, find matches from template diagnostics
      const templateCodes = new Set(templateDiagnostics.map(d => d.diagnostic_code));
      return catalog.filter(c => templateCodes.has(c.code));
    }
    // Fallback: items for current joint or general
    return catalog.filter(c => c.target_joint === jointCategory || c.target_joint === 'general');
  }, [catalog, templateDiagnostics, jointCategory]);

  const getItemPriority = (item: DiagnosticCatalogItem) => {
    const templMatch = templateDiagnostics?.find(td => td.diagnostic_code === item.code);
    return templMatch?.priority_level || item.priority_level || 'medium';
  };

  const tier1Diags = useMemo(() => {
    return relevantItems.filter(item => getItemPriority(item) === 'high');
  }, [relevantItems, templateDiagnostics]);

  const tier2Diags = useMemo(() => {
    return relevantItems.filter(item => {
      const p = getItemPriority(item);
      return p === 'medium' || (!p && !tier1Diags.some(x => x.code === item.code));
    });
  }, [relevantItems, templateDiagnostics, tier1Diags]);

  const tier3Diags = useMemo(() => {
    return relevantItems.filter(item => getItemPriority(item) === 'low');
  }, [relevantItems, templateDiagnostics]);

  const isAlreadyPrescribed = (item: DiagnosticCatalogItem) => {
    return existingPrescriptions.some(p =>
      (item.servdict_id && p.service_id === item.servdict_id) ||
      p.title.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(p.title.toLowerCase())
    );
  };

  const tier1PrescribedCount = useMemo(() => {
    return tier1Diags.filter(item => isAlreadyPrescribed(item)).length;
  }, [tier1Diags, existingPrescriptions]);

  const tier2PrescribedCount = useMemo(() => {
    return tier2Diags.filter(item => isAlreadyPrescribed(item)).length;
  }, [tier2Diags, existingPrescriptions]);

  const tier3PrescribedCount = useMemo(() => {
    return tier3Diags.filter(item => isAlreadyPrescribed(item)).length;
  }, [tier3Diags, existingPrescriptions]);

  // Accordion states: inactive tiers are collapsed into accordions for all tiers
  const [tier1Expanded, setTier1Expanded] = useState<boolean>(tier1PrescribedCount > 0);
  const [tier2Expanded, setTier2Expanded] = useState<boolean>(tier2PrescribedCount > 0);
  const [tier3Expanded, setTier3Expanded] = useState<boolean>(tier3PrescribedCount > 0);

  // Sync accordion expansion on joint change: collapse inactive for all tiers
  useEffect(() => {
    setTier1Expanded(tier1PrescribedCount > 0);
    setTier2Expanded(tier2PrescribedCount > 0);
    setTier3Expanded(tier3PrescribedCount > 0);
  }, [jointCategory, templateDiagnostics]);

  // Auto-expand only when a tier becomes active (has prescribed items)
  useEffect(() => {
    if (tier1PrescribedCount > 0) setTier1Expanded(true);
  }, [tier1PrescribedCount]);

  useEffect(() => {
    if (tier2PrescribedCount > 0) setTier2Expanded(true);
  }, [tier2PrescribedCount]);

  useEffect(() => {
    if (tier3PrescribedCount > 0) setTier3Expanded(true);
  }, [tier3PrescribedCount]);

  const handleAddDiagnostic = (item: DiagnosticCatalogItem) => {
    if (tier1Diags.some(d => d.code === item.code)) {
      setTier1Expanded(true);
    } else if (tier2Diags.some(d => d.code === item.code)) {
      setTier2Expanded(true);
    } else if (tier3Diags.some(d => d.code === item.code)) {
      setTier3Expanded(true);
    }

    // 1. Add to protocol recommendations text if callback provided
    if (onAppendRecommendationText) {
      onAppendRecommendationText(item.protocol_phrase || item.name);
    }

    // 2. If it has a servdict link and price, add to visit prescriptions table for checkout
    if (item.servdict_id && item.servdict_price) {
      onAddPrescription({
        category: 'manipulation',
        title: item.name,
        unit_price: item.servdict_price,
        quantity: 1,
        service_id: item.servdict_id
      });
    }
  };

  const handleAddAllTier1 = () => {
    setTier1Expanded(true);
    tier1Diags.forEach(item => {
      if (!isAlreadyPrescribed(item)) {
        handleAddDiagnostic(item);
      }
    });
  };

  const getModalityColor = (modality: string) => {
    switch (modality?.toLowerCase()) {
      case 'xray': return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'ultrasound': return { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' };
      case 'mri': return { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' };
      case 'enmg': return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
      case 'plantography': return { bg: '#ECFEFF', text: '#0E7490', border: '#A5F3FC' };
      case 'lab': return { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' };
      default: return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
    }
  };

  const renderTierSection = (
    tierKey: string,
    tierConfig: typeof DIAG_TIER_CONFIG[0],
    items: DiagnosticCatalogItem[],
    isExpanded: boolean,
    onToggle: () => void,
    prescribedCount: number
  ) => {
    if (items.length === 0) return null;
    const hasPrescribed = prescribedCount > 0;

    return (
      <Paper
        key={tierKey}
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 1.5,
          borderRadius: 2,
          borderColor: hasPrescribed ? tierConfig.color : '#E2E8F0',
          bgcolor: hasPrescribed ? tierConfig.bg : (isExpanded ? '#FAFBFD' : '#FAFAFA'),
          transition: 'all 0.2s ease'
        }}
      >
        <Box
          onClick={onToggle}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={tierConfig.short}
              size="small"
              sx={{ bgcolor: tierConfig.color, color: '#FFF', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
            />
            <Typography component="div" sx={{ fontWeight: 800, fontSize: '0.82rem', color: hasPrescribed ? '#0F172A' : '#334155' }}>
              <LatexText text={`${tierConfig.label} (${items.length})`} />
            </Typography>
            {hasPrescribed ? (
              <Chip
                label={`Назначено: ${prescribedCount} из ${items.length}`}
                size="small"
                color="success"
                sx={{ height: 20, fontSize: '0.66rem', fontWeight: 800 }}
              />
            ) : (
              <Chip
                label="Неактивен / Не назначено"
                size="small"
                sx={{
                  bgcolor: '#F1F5F9',
                  color: '#64748B',
                  height: 20,
                  fontSize: '0.66rem',
                  fontWeight: 600
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#64748B', display: { xs: 'none', sm: 'inline' } }}>
              {isExpanded ? 'Свернуть' : 'Раскрыть'}
            </Typography>
            <IconButton size="small">
              {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={isExpanded}>
          <Box sx={{ pt: 1.5 }}>
            <Grid container spacing={1.5} sx={{ alignItems: 'stretch' }}>
              {items.map((item) => {
                const added = isAlreadyPrescribed(item);
                const style = getModalityColor(item.modality);
                return (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={item.code} sx={{ display: 'flex' }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: added ? '#86EFAC' : '#E2E8F0',
                        bgcolor: added ? '#F0FDF4' : '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100%',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          borderColor: '#0F3C64'
                        }
                      }}
                    >
                      <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Chip
                            label={item.modality?.toUpperCase()}
                            size="small"
                            sx={{
                              fontSize: '0.62rem',
                              height: 18,
                              fontWeight: 800,
                              bgcolor: style.text,
                              color: '#FFF'
                            }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDiagForGuidance(item);
                              }}
                              sx={{
                                p: 0.35,
                                color: '#0284C7',
                                bgcolor: '#F0F9FF',
                                border: '1px solid #BAE6FD',
                                '&:hover': { bgcolor: '#E0F2FE', borderColor: '#0284C7' }
                              }}
                              title="Подробное клиническое описание метода диагностики"
                            >
                              <InfoIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            {item.servdict_price ? (
                              <Chip
                                icon={<CashIcon sx={{ fontSize: '14px !important' }} />}
                                label={`${item.servdict_price.toLocaleString('ru-RU')} ₽`}
                                size="small"
                                color="success"
                                sx={{ fontWeight: 700, fontSize: '0.72rem', height: 20 }}
                              />
                            ) : (
                              <Chip
                                icon={<ExternalIcon sx={{ fontSize: '12px !important' }} />}
                                label="Внешнее"
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: 18 }}
                              />
                            )}
                          </Box>
                        </Box>

                        <Typography component="div" variant="body2" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.3, mb: 0.5 }}>
                          <LatexText text={item.name} />
                        </Typography>

                        <Tooltip title={item.protocol_phrase} arrow placement="top">
                          <Box
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.2
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              component="div"
                              sx={{ lineHeight: 1.2 }}
                            >
                              «<LatexText text={item.protocol_phrase} />»
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Box>

                      <Button
                        size="small"
                        variant={added ? 'outlined' : 'contained'}
                        color={added ? 'success' : 'primary'}
                        disabled={added}
                        startIcon={added ? <AddedIcon /> : <AddIcon />}
                        onClick={() => handleAddDiagnostic(item)}
                        sx={{
                          mt: 'auto',
                          width: '100%',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          py: 0.4
                        }}
                      >
                        {added ? 'В плане приёма' : item.servdict_price ? '+ Назначить и в кассу' : '+ Добавить в протокол'}
                      </Button>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Collapse>
      </Paper>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid #E2E8F0',
        bgcolor: '#FFFFFF',
        mb: 2.5
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BiotechIcon sx={{ color: '#0F3C64', fontSize: 22 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
            План аппаратного и функционального обследования:
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => {
              const anyInactiveExpanded = (!tier1PrescribedCount && tier1Expanded) || (!tier2PrescribedCount && tier2Expanded) || (!tier3PrescribedCount && tier3Expanded);
              if (anyInactiveExpanded) {
                setTier1Expanded(tier1PrescribedCount > 0);
                setTier2Expanded(tier2PrescribedCount > 0);
                setTier3Expanded(tier3PrescribedCount > 0);
              } else {
                setTier1Expanded(true);
                setTier2Expanded(true);
                setTier3Expanded(true);
              }
            }}
            sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, borderColor: '#CBD5E1', color: '#475569' }}
          >
            {((!tier1PrescribedCount && tier1Expanded) || (!tier2PrescribedCount && tier2Expanded) || (!tier3PrescribedCount && tier3Expanded))
              ? 'Свернуть неактивные'
              : 'Развернуть все'}
          </Button>
          {tier1Diags.length > 0 && (
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<AddIcon />}
              onClick={handleAddAllTier1}
              sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, py: 0.3 }}
            >
              Добавить все Tier 1 в протокол и кассу
            </Button>
          )}
          <Chip
            label={`${relevantItems.length} рекомендовано`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20 }}
          />
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Кликните по исследованию, чтобы мгновенно включить направление в протокол и добавить услугу в калькуляцию приёма:
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : relevantItems.length === 0 ? (
        <Alert severity="info" sx={{ py: 0.5 }}>
          Для выбранной анатомической зоны нет специфических инструментальных пресетов.
        </Alert>
      ) : (
        <Box>
          {renderTierSection('high', DIAG_TIER_CONFIG[0], tier1Diags, tier1Expanded, () => setTier1Expanded(prev => !prev), tier1PrescribedCount)}
          {renderTierSection('medium', DIAG_TIER_CONFIG[1], tier2Diags, tier2Expanded, () => setTier2Expanded(prev => !prev), tier2PrescribedCount)}
          {renderTierSection('low', DIAG_TIER_CONFIG[2], tier3Diags, tier3Expanded, () => setTier3Expanded(prev => !prev), tier3PrescribedCount)}
        </Box>
      )}

      {/* Full Detailed Guidance Modal */}
      <DiagnosticMethodGuidanceModal
        open={Boolean(selectedDiagForGuidance)}
        onClose={() => setSelectedDiagForGuidance(null)}
        diagnostic={selectedDiagForGuidance}
        onAssign={(diag) => handleAddDiagnostic(diag as any)}
        assignButtonText={selectedDiagForGuidance?.servdict_price ? 'Добавить в назначения и кассу' : 'Добавить в протокол'}
      />
    </Paper>
  );
}
