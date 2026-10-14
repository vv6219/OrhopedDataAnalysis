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
  Alert
} from '@mui/material';
import {
  Biotech as BiotechIcon,
  Add as AddIcon,
  CheckCircle as AddedIcon,
  OpenInNew as ExternalIcon,
  AttachMoney as CashIcon
} from '@mui/icons-material';

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
}

interface DiagnosticRecommendationsCardProps {
  jointCategory: string;
  templateDiagnostics?: Array<{
    diagnostic_code: string;
    urgency?: string;
    name?: string;
    servdict_price?: number | null;
    protocol_phrase?: string;
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

export default function DiagnosticRecommendationsCard({
  jointCategory,
  templateDiagnostics,
  existingPrescriptions = [],
  onAddPrescription,
  onAppendRecommendationText
}: DiagnosticRecommendationsCardProps) {
  const [catalog, setCatalog] = useState<DiagnosticCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleAddDiagnostic = (item: DiagnosticCatalogItem) => {
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

  const isAlreadyPrescribed = (item: DiagnosticCatalogItem) => {
    return existingPrescriptions.some(p =>
      (item.servdict_id && p.service_id === item.servdict_id) ||
      p.title.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(p.title.toLowerCase())
    );
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BiotechIcon sx={{ color: '#0F3C64', fontSize: 22 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F3C64' }}>
            План аппаратного и функционального обследования:
          </Typography>
        </Box>
        <Chip
          label={`${relevantItems.length} рекомендовано`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20 }}
        />
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
        <Grid container spacing={1.5}>
          {relevantItems.map((item) => {
            const added = isAlreadyPrescribed(item);
            const style = getModalityColor(item.modality);
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={item.code}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.2,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: added ? '#86EFAC' : style.border,
                    bgcolor: added ? '#F0FDF4' : style.bg,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 1,
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      borderColor: '#0F3C64'
                    }
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
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

                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.3, mb: 0.5 }}>
                      {item.name}
                    </Typography>

                    <Tooltip title={item.protocol_phrase} arrow placement="top">
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.2
                        }}
                      >
                        «{item.protocol_phrase}»
                      </Typography>
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
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      py: 0.3
                    }}
                  >
                    {added ? 'В плане приёма' : item.servdict_price ? '+ Назначить и в кассу' : '+ Добавить в протокол'}
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Paper>
  );
}
