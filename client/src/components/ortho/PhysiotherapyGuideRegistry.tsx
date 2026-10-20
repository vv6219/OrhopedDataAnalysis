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
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import BiotechIcon from '@mui/icons-material/Biotech';
import BoltIcon from '@mui/icons-material/Bolt';
import LatexText from './LatexText';

export interface PhysiotherapyItem {
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
  biophysical_profile?: string;
  apparatus_examples?: string;
  evidence_level?: string;
  modality_tag?: string;
}

const MODALITY_LABELS: Record<string, { label: string; color: string }> = {
  all: { label: 'Все модальности', color: '#1E40AF' },
  shockwave: { label: 'УВТ (Ударно-волновая)', color: '#D97706' },
  laser: { label: 'HILT Лазер высокой интенсивности', color: '#DC2626' },
  sis_magnet: { label: 'SIS (Супериндуктивная система)', color: '#2563EB' },
  tecar: { label: 'TECAR Диатермия', color: '#7C3AED' },
  cryo: { label: 'Криотерапия Game Ready', color: '#0284C7' },
  tens_nmes: { label: 'TENS / NMES Электростимуляция', color: '#059669' },
  traction: { label: 'Тракционная терапия', color: '#475569' },
  cpm: { label: 'CPM Пассивная разработка', color: '#0D9488' }
};

export const PhysiotherapyGuideRegistry: React.FC = () => {
  const [items, setItems] = useState<PhysiotherapyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    fetch('/api/ortho/treatments/physiotherapy')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.physiotherapy)) {
          setItems(data.physiotherapy);
        }
      })
      .catch((err) => console.error('Failed to fetch physiotherapy catalog:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const modalityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach((p) => {
      const sub = p.subcategory || 'other';
      counts[sub] = (counts[sub] || 0) + 1;
    });
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((p) => {
      const matchMod = selectedModality === 'all' || p.subcategory === selectedModality;
      if (!matchMod) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.technique_details && p.technique_details.toLowerCase().includes(q)) ||
        (p.apparatus_examples && p.apparatus_examples.toLowerCase().includes(q)) ||
        (p.clinical_indications && p.clinical_indications.toLowerCase().includes(q)) ||
        (p.servdict_name && p.servdict_name.toLowerCase().includes(q))
      );
    });
  }, [items, selectedModality, searchQuery]);

  const handleToggleExpand = (code: string, nextExpanded?: boolean) => {
    setExpandedCodes((prev) => ({
      ...prev,
      [code]: nextExpanded !== undefined ? nextExpanded : !prev[code]
    }));
  };

  const handleExpandAll = () => {
    const map: Record<string, boolean> = {};
    filteredItems.forEach((p) => { map[p.code] = true; });
    startTransition(() => { setExpandedCodes(map); });
  };

  const handleCollapseAll = () => {
    startTransition(() => { setExpandedCodes({}); });
  };

  const handleResetFilters = () => {
    setSelectedModality('all');
    setSearchQuery('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          bgcolor: '#1E3A8A',
          color: '#FFFFFF',
          borderRadius: 2.5,
          border: '1px solid #172554',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ maxWidth: 880 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <FitnessCenterIcon sx={{ color: '#93C5FD', fontSize: 24 }} />
            <Typography variant="overline" sx={{ color: '#BFDBFE', fontWeight: 800, letterSpacing: 1.2 }}>
              ВЫСОКОИНТЕНСИВНАЯ АППАРАТНАЯ ФИЗИОТЕРАПИЯ • EBM СТАНДАРТЫ
            </Typography>
            {loading && <CircularProgress size={16} sx={{ color: '#93C5FD', ml: 1 }} />}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
            Каталог аппаратной физиотерапии ({items.length} методов)
          </Typography>
          <Typography variant="body2" sx={{ color: '#DBEAFE', mt: 0.5, lineHeight: 1.5 }}>
            <LatexText text="Физиотерапевтические комплексы доказательного уровня 1A/1B: лазер высокой интенсивности HILT ($1064\text{ нм}$, до $3\text{ кВт}$), супериндуктивная магнитная система SIS ($B \ge 2.5\text{--}3.0\text{ Тл}$), радиальная и фокусированная УВТ, TECAR-диатермия и аппаратная криокомпрессия Game Ready." />
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
              color: '#BFDBFE',
              borderColor: 'rgba(255,255,255,0.2)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              '&:hover': { borderColor: '#BFDBFE', bgcolor: 'rgba(255,255,255,0.05)' }
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
              placeholder="Поиск по HILT, SIS, УВТ, TECAR, BTL, Storz..."
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
              {Object.entries(MODALITY_LABELS).map(([k, meta]) => {
                const count = modalityCounts[k] || 0;
                if (k !== 'all' && count === 0) return null;
                const isSelected = selectedModality === k;
                return (
                  <Chip
                    key={k}
                    label={`${meta.label} (${count})`}
                    onClick={() => setSelectedModality(k)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      bgcolor: isSelected ? meta.color : 'transparent',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      borderColor: meta.color,
                      '&:hover': { bgcolor: isSelected ? meta.color : 'rgba(30, 64, 175, 0.06)' }
                    }}
                  />
                );
              })}
              {(selectedModality !== 'all' || searchQuery) && (
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
          </Grid>
        </Grid>
      </Paper>

      {/* Summary count */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
          Отображено методов: <strong>{filteredItems.length}</strong> из {items.length}
        </Typography>
        <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 600 }}>
          Все методики соответствуют клиническим протоколам Ассоциации травматологов-ортопедов России (АТОР)
        </Typography>
      </Box>

      {/* Accordion list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {filteredItems.map((item, index) => {
          const isExpanded = Boolean(expandedCodes[item.code]);
          const modMeta = MODALITY_LABELS[item.subcategory] || MODALITY_LABELS.all;

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
                  bgcolor: isExpanded ? '#EFF6FF' : '#FFFFFF',
                  px: 2,
                  py: 1,
                  borderBottom: isExpanded ? '1px solid #DBEAFE' : 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 300 }}>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      sx={{ bgcolor: '#DBEAFE', color: '#1E40AF', fontWeight: 800, height: 22, fontSize: '0.72rem' }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#1E3A8A', fontSize: '0.98rem', lineHeight: 1.25 }}>
                        <LatexText text={item.name} />
                      </Typography>
                      {item.apparatus_examples && (
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                          <BoltIcon sx={{ fontSize: 13, color: '#2563EB' }} />
                          Аппараты: {item.apparatus_examples}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={modMeta.label}
                      size="small"
                      sx={{ bgcolor: `${modMeta.color}15`, color: modMeta.color, fontWeight: 700, fontSize: '0.74rem' }}
                    />
                    {item.evidence_level && (
                      <Chip
                        label={`Уровень ${item.evidence_level}`}
                        size="small"
                        sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: '0.72rem' }}
                      />
                    )}
                    {item.servdict_price !== undefined && item.servdict_price !== null ? (
                      <Chip
                        icon={<PointOfSaleIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${item.servdict_price.toLocaleString('ru-RU')} ₽`}
                        size="small"
                        sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: '0.74rem' }}
                      />
                    ) : (
                      <Chip label="В составе курса" size="small" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontSize: '0.72rem' }} />
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
                        <LocalHospitalIcon sx={{ color: '#1E40AF', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>
                          Биофизический механизм и клинические показания
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6, pl: 3.2, fontSize: '0.88rem' }}>
                        <LatexText text={item.description || item.clinical_indications} />
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Biophysical & Technique Details */}
                  {item.technique_details && (
                    <Grid size={{ xs: 12 }}>
                      <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #BAE6FD', borderLeft: '4px solid #0284C7', borderRadius: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <BiotechIcon sx={{ color: '#0284C7', fontSize: 18 }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369A1', textTransform: 'uppercase' }}>
                            Параметры воздействия и физическая дозировка
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#1E293B', lineHeight: 1.6, pl: 3.2, fontSize: '0.88rem' }}>
                          <LatexText text={item.technique_details} />
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Regimen */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 1.5, height: '100%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                        Курсовой протокол:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.5, fontSize: '0.86rem' }}>
                        <LatexText text={item.regimen_standard || '5–10 процедур через день'} />
                      </Typography>
                      {item.patient_preparation && (
                        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #E2E8F0' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#B45309', textTransform: 'uppercase', display: 'block' }}>
                            Подготовка к сеансу:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#78350F', fontSize: '0.84rem', mt: 0.3 }}>
                            <LatexText text={item.patient_preparation} />
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Contraindications */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 1.5, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <WarningAmberIcon sx={{ color: '#D97706', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                          Противопоказания и ограничения (Красные флаги)
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#78350F', lineHeight: 1.5, pl: 3.2, fontSize: '0.85rem' }}>
                        <LatexText text={item.contraindications || 'ЭКС/кардиостимулятор в зоне поля, онкопатология, беременность, свежий флеботромбоз.'} />
                      </Typography>
                      {item.post_procedure_care && (
                        <Box sx={{ mt: 1, pl: 3.2 }}>
                          <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 700 }}>
                            Постпроцедурный уход: <LatexText text={item.post_procedure_care} />
                          </Typography>
                        </Box>
                      )}
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
                        Номенклатура: <strong>{item.servdict_code || 'А17.*'}</strong>
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

export default PhysiotherapyGuideRegistry;
