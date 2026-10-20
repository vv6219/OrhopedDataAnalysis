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
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TimerIcon from '@mui/icons-material/Timer';
import RepeatIcon from '@mui/icons-material/Repeat';
import LatexText from './LatexText';

export interface LfkItem {
  id: number;
  code: string;
  name: string;
  short_name?: string;
  exercise_type: string;
  target_joint: string;
  target_muscle_group: string;
  kinetic_chain: string;
  default_phase: string;
  default_stage_step: string;
  standard_dosage: string;
  tempo_formula: string;
  equipment_tags: string;
  technique_description: string;
  contraindications_notes: string;
  servdict_id?: number | null;
  servdict_name?: string;
  servdict_price?: number | null;
}

const JOINT_LABELS: Record<string, { label: string; color: string }> = {
  all: { label: 'Все зоны', color: '#047857' },
  knee: { label: 'Коленный сустав', color: '#156C9C' },
  foot_ankle: { label: 'Стопа и голеностоп', color: '#00838F' },
  shoulder: { label: 'Плечевой сустав', color: '#6A1B9A' },
  hip: { label: 'Тазобедренный', color: '#2E7D32' },
  spine: { label: 'Позвоночник и кор', color: '#455A64' },
  elbow: { label: 'Локтевой', color: '#E65100' },
  wrist_hand: { label: 'Кисть и пальцы', color: '#AD1457' },
  general: { label: 'Общая кинезиотерапия', color: '#047857' }
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  isometric: { label: 'Изометрия (ISOM)', color: '#2563EB' },
  ckc_closed_chain: { label: 'Замкнутая цепь (CKC)', color: '#059669' },
  okc_open_chain: { label: 'Открытая цепь (OKC)', color: '#D97706' },
  eccentric_hsr: { label: 'Эксцентрика / HSR', color: '#DC2626' },
  neurodynamics: { label: 'Нейродинамика', color: '#7C3AED' },
  stretching_pir: { label: 'Стретчинг / ПИР', color: '#0284C7' },
  drainage_pump: { label: 'Мышечная помпа', color: '#475569' }
};

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  'Phase 1': { label: 'Фаза I (Острая)', color: '#DC2626' },
  'Phase 2': { label: 'Фаза II (Подострая)', color: '#D97706' },
  'Phase 3': { label: 'Фаза III (Функциональная)', color: '#059669' }
};

export const LfkGuideRegistry: React.FC = () => {
  const [items, setItems] = useState<LfkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedJoint, setSelectedJoint] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    fetch('/api/ortho/treatments/lfk')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.lfk)) {
          setItems(data.lfk);
        }
      })
      .catch((err) => console.error('Failed to fetch lfk catalog:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const jointCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach((l) => {
      const j = l.target_joint || 'general';
      counts[j] = (counts[j] || 0) + 1;
    });
    return counts;
  }, [items]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach((l) => {
      if (l.exercise_type) {
        counts[l.exercise_type] = (counts[l.exercise_type] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((l) => {
      const matchJoint = selectedJoint === 'all' || l.target_joint === selectedJoint;
      if (!matchJoint) return false;

      const matchType = selectedType === 'all' || l.exercise_type === selectedType;
      if (!matchType) return false;

      const matchPhase = selectedPhase === 'all' || l.default_phase === selectedPhase;
      if (!matchPhase) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        (l.short_name && l.short_name.toLowerCase().includes(q)) ||
        (l.technique_description && l.technique_description.toLowerCase().includes(q)) ||
        (l.target_muscle_group && l.target_muscle_group.toLowerCase().includes(q)) ||
        (l.equipment_tags && l.equipment_tags.toLowerCase().includes(q))
      );
    });
  }, [items, selectedJoint, selectedType, selectedPhase, searchQuery]);

  const handleToggleExpand = (code: string, nextExpanded?: boolean) => {
    setExpandedCodes((prev) => ({
      ...prev,
      [code]: nextExpanded !== undefined ? nextExpanded : !prev[code]
    }));
  };

  const handleExpandAll = () => {
    const map: Record<string, boolean> = {};
    filteredItems.forEach((l) => { map[l.code] = true; });
    startTransition(() => { setExpandedCodes(map); });
  };

  const handleCollapseAll = () => {
    startTransition(() => { setExpandedCodes({}); });
  };

  const handleResetFilters = () => {
    setSelectedJoint('all');
    setSelectedType('all');
    setSelectedPhase('all');
    setSearchQuery('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          bgcolor: '#065F46',
          color: '#FFFFFF',
          borderRadius: 2.5,
          border: '1px solid #064E3B',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ maxWidth: 880 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <DirectionsRunIcon sx={{ color: '#6EE7B7', fontSize: 24 }} />
            <Typography variant="overline" sx={{ color: '#D1FAE5', fontWeight: 800, letterSpacing: 1.2 }}>
              ЛЕЧЕБНАЯ ФИЗКУЛЬТУРА • КИНЕЗИОТЕРАПИЯ ПО SILBERNAGEL
            </Typography>
            {loading && <CircularProgress size={16} sx={{ color: '#6EE7B7', ml: 1 }} />}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
            Каталог лечебной физкультуры и кинезиотерапии ЛФК ({items.length} комплексов)
          </Typography>
          <Typography variant="body2" sx={{ color: '#ECFDF5', mt: 0.5, lineHeight: 1.5 }}>
            Стандартизированные трехфазные комплексы ЛФК с контролем боли по шкале Silbernagel Pain Monitoring Model: изометрическая стабилизация (Quad Sets), замкнутые кинетические цепи (CKC), эксцентрические нагрузки высокой интенсивности (HSR/Alfredson) и нейродинамические тракты с точной формулой темпа и дозировки.
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
              color: '#D1FAE5',
              borderColor: 'rgba(255,255,255,0.2)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              '&:hover': { borderColor: '#D1FAE5', bgcolor: 'rgba(255,255,255,0.05)' }
            }}
          >
            Свернуть все
          </Button>
        </Box>
      </Paper>

      {/* Filter toolbar */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid #CBD5E1', borderRadius: 2, bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Row 1: Search and Joint */}
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по упражнению, VMO, изометрии, CKC, фазе..."
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
                      '&:hover': { bgcolor: isSelected ? meta.color : 'rgba(4, 120, 87, 0.06)' }
                    }}
                  />
                );
              })}
            </Box>
          </Grid>
        </Grid>

        {/* Row 2: Exercise Type & Phases */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, pt: 1, borderTop: '1px solid #F1F5F9' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.8 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', mr: 0.5 }}>
              Тип биомеханики:
            </Typography>
            <Chip
              label={`Все (${items.length})`}
              size="small"
              onClick={() => setSelectedType('all')}
              variant={selectedType === 'all' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, fontSize: '0.74rem', bgcolor: selectedType === 'all' ? '#065F46' : 'transparent', color: selectedType === 'all' ? '#FFF' : '#475569' }}
            />
            {Object.entries(TYPE_LABELS).map(([k, meta]) => {
              const c = typeCounts[k] || 0;
              if (c === 0) return null;
              const isSelected = selectedType === k;
              return (
                <Chip
                  key={k}
                  label={`${meta.label} (${c})`}
                  size="small"
                  onClick={() => setSelectedType(k)}
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
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.8 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', mr: 0.5 }}>
              Фаза:
            </Typography>
            {['all', 'Phase 1', 'Phase 2', 'Phase 3'].map((ph) => {
              const isSelected = selectedPhase === ph;
              const label = ph === 'all' ? 'Все фазы' : PHASE_LABELS[ph]?.label || ph;
              return (
                <Chip
                  key={ph}
                  label={label}
                  size="small"
                  onClick={() => setSelectedPhase(ph)}
                  variant={isSelected ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 700, fontSize: '0.74rem', bgcolor: isSelected ? '#065F46' : 'transparent', color: isSelected ? '#FFF' : '#475569' }}
                />
              );
            })}
            {(selectedJoint !== 'all' || selectedType !== 'all' || selectedPhase !== 'all' || searchQuery) && (
              <Button
                size="small"
                variant="text"
                onClick={handleResetFilters}
                startIcon={<FilterAltOffIcon sx={{ fontSize: 16 }} />}
                sx={{ textTransform: 'none', color: '#DC2626', fontWeight: 700, fontSize: '0.75rem', ml: 1 }}
              >
                Сбросить
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Summary count */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
          Отображено комплексов: <strong>{filteredItems.length}</strong> из {items.length}
        </Typography>
        <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 600 }}>
          Все упражнения калиброваны по шкале допустимой боли Silbernagel (VAS ≤ 5)
        </Typography>
      </Box>

      {/* Accordion list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {filteredItems.map((item, index) => {
          const isExpanded = Boolean(expandedCodes[item.code]);
          const typeMeta = TYPE_LABELS[item.exercise_type] || { label: item.exercise_type, color: '#059669' };
          const jointMeta = JOINT_LABELS[item.target_joint] || JOINT_LABELS.general;
          const phaseMeta = PHASE_LABELS[item.default_phase] || { label: item.default_phase, color: '#059669' };

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
                  bgcolor: isExpanded ? '#ECFDF5' : '#FFFFFF',
                  px: 2,
                  py: 1,
                  borderBottom: isExpanded ? '1px solid #A7F3D0' : 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 300 }}>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      sx={{ bgcolor: '#A7F3D0', color: '#065F46', fontWeight: 800, height: 22, fontSize: '0.72rem' }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#064E3B', fontSize: '0.98rem', lineHeight: 1.25 }}>
                        <LatexText text={item.name} />
                      </Typography>
                      {item.target_muscle_group && (
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                          <FitnessCenterIcon sx={{ fontSize: 13, color: '#059669' }} />
                          Целевые мышцы: {item.target_muscle_group}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={phaseMeta.label}
                      size="small"
                      sx={{ bgcolor: `${phaseMeta.color}15`, color: phaseMeta.color, fontWeight: 800, fontSize: '0.72rem' }}
                    />
                    <Chip
                      label={typeMeta.label}
                      size="small"
                      sx={{ bgcolor: `${typeMeta.color}15`, color: typeMeta.color, fontWeight: 700, fontSize: '0.74rem' }}
                    />
                    <Chip
                      label={jointMeta.label}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.74rem', borderColor: jointMeta.color, color: jointMeta.color }}
                    />
                    {item.kinetic_chain && (
                      <Chip
                        label={`Цепь: ${item.kinetic_chain}`}
                        size="small"
                        sx={{ bgcolor: '#F1F5F9', color: '#334155', fontWeight: 700, fontSize: '0.72rem' }}
                      />
                    )}
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 2.5, bgcolor: '#FAFAFA' }}>
                <Grid container spacing={2}>
                  {/* Technique Description */}
                  <Grid size={{ xs: 12 }}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #BAE6FD', borderLeft: '4px solid #0284C7', borderRadius: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <DirectionsRunIcon sx={{ color: '#0284C7', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369A1', textTransform: 'uppercase' }}>
                          Техника выполнения и биомеханика движения
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#1E293B', lineHeight: 1.6, pl: 3.2, fontSize: '0.88rem' }}>
                        <LatexText text={item.technique_description} />
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Dosage & Tempo */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 1.5, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <RepeatIcon sx={{ color: '#059669', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                          Дозировка и прогрессия нагрузки:
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.5, pl: 3.2, fontSize: '0.86rem' }}>
                        <LatexText text={item.standard_dosage} />
                      </Typography>

                      {item.tempo_formula && (
                        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #E2E8F0', pl: 3.2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.2 }}>
                            <TimerIcon sx={{ color: '#D97706', fontSize: 16 }} />
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>
                              Формула темпа и выдержки:
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#78350F', fontSize: '0.84rem' }}>
                            <LatexText text={item.tempo_formula} />
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Contraindications & Equipment */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 1.5, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <WarningAmberIcon sx={{ color: '#D97706', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                          Ограничения и сигналы STOP (ВАШ &gt; 5)
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#78350F', lineHeight: 1.5, pl: 3.2, fontSize: '0.85rem' }}>
                        <LatexText text={item.contraindications_notes || 'Не выполнять через острую стреляющую боль, суставной блок или отек.'} />
                      </Typography>

                      {item.equipment_tags && (
                        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #FDE68A', pl: 3.2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block' }}>
                            Инвентарь и оборудование:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.84rem', mt: 0.2 }}>
                            {item.equipment_tags}
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
                        Ступень: <strong>{item.default_stage_step}</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>•</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                        Реабилитационный этап: <strong>{phaseMeta.label}</strong>
                      </Typography>
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

export default LfkGuideRegistry;
