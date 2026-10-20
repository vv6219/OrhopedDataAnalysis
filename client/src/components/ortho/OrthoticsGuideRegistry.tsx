import React, { useState, useEffect, useMemo, startTransition } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShieldIcon from '@mui/icons-material/Shield';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import StraightenIcon from '@mui/icons-material/Straighten';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import LatexText from './LatexText';

export interface OrthoticsItem {
  code: string;
  name: string;
  subcategory: string;
  target_joint: string;
  service_scope: string;
  default_priority: string;
  description: string;
  technique_details: string;
  regimen_standard: string;
  patient_preparation: string;
  post_procedure_care: string;
  clinical_indications: string;
  contraindications: string;
  servdict_id?: number | null;
  servdict_code?: string;
  servdict_name?: string;
  servdict_price?: number | null;
}

const JOINT_LABELS: Record<string, { label: string; color: string }> = {
  all: { label: 'Все зоны', color: '#6D28D9' },
  ankle: { label: 'Стопа и стельки', color: '#00838F' },
  knee: { label: 'Коленный сустав', color: '#156C9C' },
  spine: { label: 'Позвоночник и корсеты', color: '#455A64' },
  shoulder: { label: 'Плечевой пояс', color: '#6A1B9A' },
  hip: { label: 'Тазобедренный', color: '#2E7D32' },
  wrist: { label: 'Кисть и лучезапястный', color: '#AD1457' },
  general: { label: 'Общие средства опоры', color: '#6D28D9' }
};

const SUBCATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  insole: { label: 'Стельки Formthotics', color: '#047857' },
  brace_hinged: { label: 'Шарнирные брейсы (ROM)', color: '#2563EB' },
  brace_rigid: { label: 'Жесткие ортезы', color: '#B45309' },
  tutor_rigid: { label: 'Туторы', color: '#DC2626' },
  corset_tlso: { label: 'Корсеты TLSO / Шено', color: '#6D28D9' },
  corset_lso: { label: 'Поясничные бандажи LSO', color: '#475569' },
  sling: { label: 'Отводящие шины и повязки', color: '#7C3AED' },
  crutches: { label: 'Костыли (NWB/PWB)', color: '#D97706' },
  turbocast: { label: 'Турбокаст термопластик', color: '#0284C7' }
};

export const OrthoticsGuideRegistry: React.FC = () => {
  const [items, setItems] = useState<OrthoticsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedJoint, setSelectedJoint] = useState<string>('all');
  const [selectedSubcat, setSelectedSubcat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    fetch('/api/ortho/treatments/orthotics')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.orthotics)) {
          setItems(data.orthotics);
        }
      })
      .catch((err) => console.error('Failed to fetch orthotics catalog:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const jointCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach((o) => {
      const j = o.target_joint || 'general';
      counts[j] = (counts[j] || 0) + 1;
    });
    return counts;
  }, [items]);

  const subcatCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach((o) => {
      if (o.subcategory) {
        counts[o.subcategory] = (counts[o.subcategory] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((o) => {
      const matchJoint = selectedJoint === 'all' || o.target_joint === selectedJoint;
      if (!matchJoint) return false;

      const matchSubcat = selectedSubcat === 'all' || o.subcategory === selectedSubcat;
      if (!matchSubcat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q)) ||
        (o.technique_details && o.technique_details.toLowerCase().includes(q)) ||
        (o.clinical_indications && o.clinical_indications.toLowerCase().includes(q)) ||
        (o.servdict_name && o.servdict_name.toLowerCase().includes(q))
      );
    });
  }, [items, selectedJoint, selectedSubcat, searchQuery]);

  const handleToggleExpand = (code: string, nextExpanded?: boolean) => {
    setExpandedCodes((prev) => ({
      ...prev,
      [code]: nextExpanded !== undefined ? nextExpanded : !prev[code]
    }));
  };

  const handleExpandAll = () => {
    const map: Record<string, boolean> = {};
    filteredItems.forEach((o) => { map[o.code] = true; });
    startTransition(() => { setExpandedCodes(map); });
  };

  const handleCollapseAll = () => {
    startTransition(() => { setExpandedCodes({}); });
  };

  const handleResetFilters = () => {
    setSelectedJoint('all');
    setSelectedSubcat('all');
    setSearchQuery('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          bgcolor: '#4C1D95',
          color: '#FFFFFF',
          borderRadius: 2.5,
          border: '1px solid #3B0764',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ maxWidth: 880 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <ShieldIcon sx={{ color: '#C4B5FD', fontSize: 24 }} />
            <Typography variant="overline" sx={{ color: '#DDD6FE', fontWeight: 800, letterSpacing: 1.2 }}>
              БИОМЕХАНИЧЕСКОЕ ОРТЕЗИРОВАНИЕ • РЕЖИМЫ ОСЕВОЙ НАГРУЗКИ NWB–FWB
            </Typography>
            {loading && <CircularProgress size={16} sx={{ color: '#C4B5FD', ml: 1 }} />}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
            Каталог ортезирования и биомеханической разгрузки ({items.length} изделий)
          </Typography>
          <Typography variant="body2" sx={{ color: '#EDE9FE', mt: 0.5, lineHeight: 1.5 }}>
            Международные стандарты разгрузки поврежденных сегментов: изготовление индивидуальных термоформуемых ортезов стопы Formthotics (Новая Зеландия), шарнирные коленные ортезы с регулируемым углом сгибания ROM, жесткие туторы, корсеты Шено и регламенты осевой нагрузки (NWB, TTWB, PWB, WBAT, FWB).
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleExpandAll}
            startIcon={<UnfoldMoreIcon />}
            sx={{
              color: '#FFFFFF',
              borderColor: 'rgba(255,255,255,0.4)',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.08)' }
            }}
          >
            Развернуть все ({filteredItems.length})
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={handleCollapseAll}
            startIcon={<UnfoldLessIcon />}
            sx={{
              color: '#DDD6FE',
              borderColor: 'rgba(255,255,255,0.2)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              '&:hover': { borderColor: '#DDD6FE', bgcolor: 'rgba(255,255,255,0.05)' }
            }}
          >
            Свернуть все
          </Button>
        </Box>
      </Paper>

      {/* Filter toolbar */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid #CBD5E1', borderRadius: 2, bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по Formthotics, брейсу, тутору, корсету, NWB..."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#64748B' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <FilterAltOffIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined
                }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {Object.entries(JOINT_LABELS).map(([k, meta]) => {
                const count = jointCounts[k] || 0;
                const isSelected = selectedJoint === k;
                return (
                  <Chip
                    key={k}
                    label={`${meta.label} (${count})`}
                    onClick={() => setSelectedJoint(k)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      bgcolor: isSelected ? meta.color : 'transparent',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      borderColor: meta.color,
                      '&:hover': { bgcolor: isSelected ? meta.color : 'rgba(109, 40, 217, 0.06)' }
                    }}
                  />
                );
              })}
            </Box>
          </Grid>
        </Grid>

        {/* Subcategories */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, pt: 1, borderTop: '1px solid #F1F5F9' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', mr: 0.5 }}>
            Тип изделия:
          </Typography>
          <Chip
            label={`Все (${items.length})`}
            size="small"
            onClick={() => setSelectedSubcat('all')}
            variant={selectedSubcat === 'all' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700, fontSize: '0.74rem', bgcolor: selectedSubcat === 'all' ? '#4C1D95' : 'transparent', color: selectedSubcat === 'all' ? '#FFF' : '#475569' }}
          />
          {Object.entries(SUBCATEGORY_LABELS).map(([k, meta]) => {
            const c = subcatCounts[k] || 0;
            if (c === 0) return null;
            const isSelected = selectedSubcat === k;
            return (
              <Chip
                key={k}
                label={`${meta.label} (${c})`}
                size="small"
                onClick={() => setSelectedSubcat(k)}
                variant={isSelected ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  bgcolor: isSelected ? meta.color : 'transparent',
                  color: isSelected ? '#FFFFFF' : meta.color,
                  borderColor: meta.color
                }}
              />
            );
          })}
          {(selectedJoint !== 'all' || selectedSubcat !== 'all' || searchQuery) && (
            <Button
              size="small"
              variant="text"
              onClick={handleResetFilters}
              startIcon={<FilterAltOffIcon sx={{ fontSize: 16 }} />}
              sx={{ textTransform: 'none', color: '#DC2626', fontWeight: 700, fontSize: '0.75rem', ml: 'auto' }}
            >
              Сбросить фильтры
            </Button>
          )}
        </Box>
      </Paper>

      {/* Summary count */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
          Отображено изделий: <strong>{filteredItems.length}</strong> из {items.length}
        </Typography>
        <Typography variant="caption" sx={{ color: '#4C1D95', fontWeight: 600 }}>
          Ортезы интегрированы с прейскурантом servdict и складским учетом МИС «ОртоERP»
        </Typography>
      </Box>

      {/* Accordion list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {filteredItems.map((item, index) => {
          const isExpanded = Boolean(expandedCodes[item.code]);
          const subcatMeta = SUBCATEGORY_LABELS[item.subcategory] || { label: item.subcategory, color: '#6D28D9' };
          const jointMeta = JOINT_LABELS[item.target_joint] || JOINT_LABELS.general;

          return (
            <Accordion
              key={item.code}
              expanded={isExpanded}
              onChange={(_, nextExpanded) => handleToggleExpand(item.code, nextExpanded)}
              slotProps={{ transition: { unmountOnExit: true } }}
              elevation={0}
              sx={{
                border: '1px solid #CBD5E1',
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                overflow: 'hidden',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: '#94A3B8' }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: isExpanded ? '#F5F3FF' : '#FFFFFF',
                  px: 2,
                  py: 1,
                  borderBottom: isExpanded ? '1px solid #EDE9FE' : 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 300 }}>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontWeight: 800, height: 22, fontSize: '0.72rem' }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#4C1D95', fontSize: '0.98rem', lineHeight: 1.25 }}>
                        <LatexText text={item.name} />
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={subcatMeta.label}
                      size="small"
                      sx={{ bgcolor: `${subcatMeta.color}15`, color: subcatMeta.color, fontWeight: 700, fontSize: '0.74rem' }}
                    />
                    <Chip
                      label={jointMeta.label}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.74rem', borderColor: jointMeta.color, color: jointMeta.color }}
                    />
                    {item.servdict_price !== undefined && item.servdict_price !== null ? (
                      <Chip
                        icon={<PointOfSaleIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${item.servdict_price.toLocaleString('ru-RU')} ₽`}
                        size="small"
                        sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: '0.74rem' }}
                      />
                    ) : (
                      <Chip label="Подбор в клинике" size="small" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontSize: '0.72rem' }} />
                    )}
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 2.5, bgcolor: '#FAFAFA' }}>
                <Grid container spacing={2}>
                  {/* Description & Clinical Indications */}
                  <Grid size={{ xs: 12 }}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <LocalHospitalIcon sx={{ color: '#6D28D9', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase' }}>
                          Биомеханическое действие и показания
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6, pl: 3.2, fontSize: '0.88rem' }}>
                        <LatexText text={item.description || item.clinical_indications} />
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Technique Details */}
                  {item.technique_details && (
                    <Grid size={{ xs: 12 }}>
                      <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #BAE6FD', borderLeft: '4px solid #0284C7', borderRadius: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <StraightenIcon sx={{ color: '#0284C7', fontSize: 18 }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369A1', textTransform: 'uppercase' }}>
                            Параметры примерки, формовки и углы фиксации
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#1E293B', lineHeight: 1.6, pl: 3.2, fontSize: '0.88rem' }}>
                          <LatexText text={item.technique_details} />
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Regimen & Care */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 1.5, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <AccessibilityNewIcon sx={{ color: '#475569', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                          Режим ношения и осевой нагрузки:
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.5, pl: 3.2, fontSize: '0.86rem' }}>
                        <LatexText text={item.regimen_standard || 'Постоянное или функциональное ношение по схеме врача'} />
                      </Typography>
                      {item.patient_preparation && (
                        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #E2E8F0', pl: 3.2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#B45309', textTransform: 'uppercase', display: 'block' }}>
                            Требования к примерке:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#78350F', fontSize: '0.84rem', mt: 0.3 }}>
                            <LatexText text={item.patient_preparation} />
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Contraindications & Care */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 1.5, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <WarningAmberIcon sx={{ color: '#D97706', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                          Противопоказания и правила ухода
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#78350F', lineHeight: 1.5, pl: 3.2, fontSize: '0.85rem' }}>
                        <strong>Ограничения:</strong> <LatexText text={item.contraindications || 'Открытые язвы кожи, тяжелые нарушения периферического кровотока.'} /><br />
                        {item.post_procedure_care && (
                          <span style={{ display: 'block', marginTop: '6px' }}>
                            <strong>Уход:</strong> <LatexText text={item.post_procedure_care} />
                          </span>
                        )}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Meta Bar */}
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, pt: 1, borderTop: '1px solid #E2E8F0', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                        Код: <code>{item.code}</code>
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>•</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                        Номенклатура: <strong>{item.servdict_code || 'А15.*'}</strong>
                      </Typography>
                      {item.servdict_name && (
                        <>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>•</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Услуга: <strong>{item.servdict_name}</strong>
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
};

export default OrthoticsGuideRegistry;
