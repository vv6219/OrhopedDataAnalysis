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
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import BiotechIcon from '@mui/icons-material/Biotech';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LatexText from './LatexText';

export interface ManipulationItem {
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
  ebm_priority?: string;
  navigation_type?: string;
  anatomical_access?: string;
  drug_class?: string;
  is_stop_warning?: number | boolean;
  stop_rationale?: string;
  cdss_contraindication_tags?: string;
}

const JOINT_LABELS: Record<string, { label: string; color: string }> = {
  all: { label: 'Все зоны', color: '#0F766E' },
  knee: { label: 'Коленный', color: '#156C9C' },
  shoulder: { label: 'Плечевой', color: '#6A1B9A' },
  hip: { label: 'Тазобедренный', color: '#2E7D32' },
  ankle: { label: 'Стопа и голеностоп', color: '#00838F' },
  elbow: { label: 'Локтевой', color: '#E65100' },
  wrist: { label: 'Кисть и запястье', color: '#AD1457' },
  spine: { label: 'Позвоночник', color: '#455A64' },
  general: { label: 'Общие инъекции', color: '#0F766E' }
};

const SUBCATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  injection_prp: { label: 'PRP Cortexil', color: '#B45309' },
  injection_ha: { label: 'Гиалуроновая кислота (ГК)', color: '#2563EB' },
  blockade: { label: 'Лечебные блокады', color: '#DC2626' },
  puncture: { label: 'Пункция сустава', color: '#059669' },
  taping: { label: 'Кинезиотейпирование', color: '#7C3AED' },
  reduction: { label: 'Вправление вывиха', color: '#D97706' },
  medication: { label: 'Медикаментозная терапия', color: '#475569' },
  rehab: { label: 'Прочее', color: '#64748B' }
};

export const ManipulationsGuideRegistry: React.FC = () => {
  const [items, setItems] = useState<ManipulationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedJoint, setSelectedJoint] = useState<string>('all');
  const [selectedSubcat, setSelectedSubcat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    fetch('/api/ortho/treatments/manipulations')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.manipulations)) {
          setItems(data.manipulations);
        }
      })
      .catch((err) => console.error('Failed to fetch manipulations catalog:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const jointCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach((m) => {
      const j = m.target_joint || 'general';
      counts[j] = (counts[j] || 0) + 1;
    });
    return counts;
  }, [items]);

  const subcatCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach((m) => {
      if (m.subcategory) {
        counts[m.subcategory] = (counts[m.subcategory] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((m) => {
      const matchJoint = selectedJoint === 'all' || m.target_joint === selectedJoint || (selectedJoint === 'general' && m.target_joint === 'general');
      if (!matchJoint) return false;

      const matchSubcat = selectedSubcat === 'all' || m.subcategory === selectedSubcat;
      if (!matchSubcat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.technique_details && m.technique_details.toLowerCase().includes(q)) ||
        (m.clinical_indications && m.clinical_indications.toLowerCase().includes(q)) ||
        (m.anatomical_access && m.anatomical_access.toLowerCase().includes(q)) ||
        (m.servdict_name && m.servdict_name.toLowerCase().includes(q))
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
    filteredItems.forEach((m) => { map[m.code] = true; });
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
          bgcolor: '#0F766E',
          color: '#FFFFFF',
          borderRadius: 2.5,
          border: '1px solid #115E59',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ maxWidth: 880 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <MedicalServicesIcon sx={{ color: '#5EEAD4', fontSize: 24 }} />
            <Typography variant="overline" sx={{ color: '#CCFBF1', fontWeight: 800, letterSpacing: 1.2 }}>
              ИНЪЕКЦИОННАЯ ОРТОПЕДИЯ • МАНИПУЛЯЦИИ И БЛОКАДЫ
            </Typography>
            {loading && <CircularProgress size={16} sx={{ color: '#5EEAD4', ml: 1 }} />}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
            Каталог лечебных манипуляций и инъекционных блокад ({items.length} процедур)
          </Typography>
          <Typography variant="body2" sx={{ color: '#E6FFFA', mt: 0.5, lineHeight: 1.5 }}>
            Стандарты локальной инъекционной терапии: обогащенная аутоплазма PRP Cortexil (10/20 мл), пролонгированная вискосупплементация гиалуроновой кислотой, прицельные блокады под ультразвуковой навигацией (US-guided) и пункции суставов с интеграцией в прейскурант servdict.
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
              color: '#CCFBF1',
              borderColor: 'rgba(255,255,255,0.2)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              '&:hover': { borderColor: '#CCFBF1', bgcolor: 'rgba(255,255,255,0.05)' }
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
              placeholder="Поиск по PRP, блокаде, пункции, гиалуронату..."
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
                      '&:hover': { bgcolor: isSelected ? meta.color : 'rgba(15, 118, 110, 0.06)' }
                    }}
                  />
                );
              })}
            </Box>
          </Grid>
        </Grid>

        {/* Subcategories row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, pt: 1, borderTop: '1px solid #F1F5F9' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', mr: 0.5 }}>
            Тип манипуляции:
          </Typography>
          <Chip
            label={`Все (${items.length})`}
            size="small"
            onClick={() => setSelectedSubcat('all')}
            variant={selectedSubcat === 'all' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700, fontSize: '0.74rem', bgcolor: selectedSubcat === 'all' ? '#0F766E' : 'transparent', color: selectedSubcat === 'all' ? '#FFF' : '#475569' }}
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
          Отображено манипуляций: <strong>{filteredItems.length}</strong> из {items.length}
        </Typography>
        <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 600 }}>
          Все манипуляции тарифицированы по номенклатуре Минздрава и интегрированы с АТОЛ 91Ф
        </Typography>
      </Box>

      {/* Accordion list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {filteredItems.map((item, index) => {
          const isExpanded = Boolean(expandedCodes[item.code]);
          const subcatMeta = SUBCATEGORY_LABELS[item.subcategory] || SUBCATEGORY_LABELS.rehab;
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
                  bgcolor: isExpanded ? '#F0FDFA' : '#FFFFFF',
                  px: 2,
                  py: 1,
                  borderBottom: isExpanded ? '1px solid #CCFBF1' : 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 300 }}>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      sx={{ bgcolor: '#CCFBF1', color: '#0F766E', fontWeight: 800, height: 22, fontSize: '0.72rem' }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#0F766E', fontSize: '0.98rem', lineHeight: 1.25 }}>
                        <LatexText text={item.name} />
                      </Typography>
                      {item.anatomical_access && (
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                          <MyLocationIcon sx={{ fontSize: 13, color: '#0F766E' }} />
                          {item.anatomical_access}
                        </Typography>
                      )}
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
                    {item.navigation_type === 'us_guided' && (
                      <Chip
                        label="US-guided (УЗИ)"
                        size="small"
                        sx={{ bgcolor: '#DBEAFE', color: '#1E40AF', fontWeight: 800, fontSize: '0.72rem' }}
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
                      <Chip label="В составе приема" size="small" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontSize: '0.72rem' }} />
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
                        <LocalHospitalIcon sx={{ color: '#0F766E', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>
                          Клиническое назначение и показания
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
                          <BiotechIcon sx={{ color: '#0284C7', fontSize: 18 }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369A1', textTransform: 'uppercase' }}>
                            Технологический регламент и протокол проведения
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#1E293B', lineHeight: 1.6, pl: 3.2, fontSize: '0.88rem' }}>
                          <LatexText text={item.technique_details} />
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Regimen & Preparation */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 1.5, height: '100%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                        Курс и схема лечения:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.5, fontSize: '0.86rem' }}>
                        <LatexText text={item.regimen_standard || 'По назначению лечащего врача'} />
                      </Typography>
                      {item.patient_preparation && (
                        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #E2E8F0' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#B45309', textTransform: 'uppercase', display: 'block' }}>
                            Подготовка пациента:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#78350F', fontSize: '0.84rem', mt: 0.3 }}>
                            <LatexText text={item.patient_preparation} />
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Post-Care & Contraindications */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 1.5, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <WarningAmberIcon sx={{ color: '#D97706', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                          Противопоказания и режим после процедуры
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#78350F', lineHeight: 1.5, pl: 3.2, fontSize: '0.85rem' }}>
                        <strong>Противопоказания:</strong> <LatexText text={item.contraindications || 'Индивидуальная непереносимость, активная инфекция кожи.'} /><br />
                        {item.post_procedure_care && (
                          <span style={{ display: 'block', marginTop: '6px' }}>
                            <strong>Охранительный режим:</strong> <LatexText text={item.post_procedure_care} />
                          </span>
                        )}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Billing Bar */}
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, pt: 1, borderTop: '1px solid #E2E8F0', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                        Код: <code>{item.code}</code>
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>•</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                        Номенклатура: <strong>{item.servdict_code || 'А11.04.*'}</strong>
                      </Typography>
                      {item.servdict_name && (
                        <>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>•</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Услуга: <strong>{item.servdict_name}</strong>
                          </Typography>
                        </>
                      )}
                      {item.ebm_priority && (
                        <>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>•</Typography>
                          <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 700 }}>
                            Линия EBM: {item.ebm_priority}
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

export default ManipulationsGuideRegistry;
