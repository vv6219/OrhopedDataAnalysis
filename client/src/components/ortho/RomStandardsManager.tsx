import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import {
  Straighten as RomIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  HealthAndSafety as ShieldIcon,
  Speed as MeterIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { ROM_CONFIGS, END_FEEL_OPTIONS } from './romStandardsData';
import type { JointRomConfig } from './romStandardsData';
import ClinicalGuidanceModal from './ClinicalGuidanceModal';
import LatexText from './LatexText';

export default function RomStandardsManager() {
  const [selectedJointKey, setSelectedJointKey] = useState<string>('knee');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [guidanceModalOpen, setGuidanceModalOpen] = useState(false);

  const jointKeys = useMemo(() => Object.keys(ROM_CONFIGS), []);

  const filteredJoints = useMemo(() => {
    if (!searchQuery.trim()) return jointKeys;
    const q = searchQuery.toLowerCase().trim();
    return jointKeys.filter(k => {
      const cfg = ROM_CONFIGS[k];
      if (cfg.titleRu.toLowerCase().includes(q) || cfg.titleLat.toLowerCase().includes(q)) return true;
      return cfg.axes.some(a => 
        a.labelRu.toLowerCase().includes(q) || 
        a.labelLat.toLowerCase().includes(q) || 
        (a.clinicalNote && a.clinicalNote.toLowerCase().includes(q))
      );
    });
  }, [jointKeys, searchQuery]);

  const currentConfig: JointRomConfig = ROM_CONFIGS[selectedJointKey] || ROM_CONFIGS.knee;

  const handleCopySftr = (jointTitle: string, axes: any[]) => {
    const text = `${jointTitle} (SFTR Neutral-0 нормы):\n` +
      axes.map(a => `• ${a.labelRu} (${a.labelLat}): ${a.normText} [${a.clinicalNote || ''}]`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedKey(selectedJointKey);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Top Banner / Toolbar */}
      <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#EFF6FF', color: '#1E40AF', display: 'flex' }}>
              <RomIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2 }}>
                Стандарты гониометрии суставов (ROM / SFTR Neutral-0)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Анатомический справочник активных и пассивных амплитуд, дефицитов движения и конечного упора (End-Feel) для 10 суставов
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<MenuBookIcon />}
              onClick={() => setGuidanceModalOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#0284C7', borderColor: '#BAE6FD', '&:hover': { bgcolor: '#F0F9FF', borderColor: '#0284C7' } }}
            >
              Клинический гид
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={copiedKey === selectedJointKey ? <CheckIcon color="success" /> : <CopyIcon />}
              onClick={() => handleCopySftr(currentConfig.titleRu, currentConfig.axes)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {copiedKey === selectedJointKey ? 'Скопировано!' : 'Копировать нормы SFTR'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Split Grid */}
      <Grid container spacing={2} sx={{ flexGrow: 1, minHeight: 0, height: 'calc(100% - 90px)' }}>
        {/* Left Column: Joints List */}
        <Grid size={{ xs: 12, md: 4, lg: 3.5 }} sx={{ height: '100%', minHeight: 0 }}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Поиск сустава, оси, угла..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: searchQuery ? (
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ) : undefined
                }
              }}
              sx={{ mb: 1.5 }}
            />

            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
              АНАТОМИЧЕСКИЕ ОБЛАСТИ ({filteredJoints.length} из {jointKeys.length})
            </Typography>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
              {filteredJoints.map((k) => {
                const cfg = ROM_CONFIGS[k];
                const isSelected = selectedJointKey === k;
                return (
                  <Card
                    key={k}
                    variant="outlined"
                    onClick={() => setSelectedJointKey(k)}
                    sx={{
                      mb: 1.25,
                      cursor: 'pointer',
                      borderRadius: 1.5,
                      borderLeft: `5px solid ${cfg.iconColor || '#0284C7'}`,
                      borderColor: isSelected ? '#0284C7' : '#E2E8F0',
                      bgcolor: isSelected ? '#F0F9FF' : '#FFFFFF',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: '#0284C7',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: '12px !important' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isSelected ? '#0369A1' : '#1E293B', lineHeight: 1.3 }}>
                          {cfg.titleRu}
                        </Typography>
                        <Chip
                          label={`${cfg.axes.length} осей`}
                          size="small"
                          sx={{
                            fontSize: '0.65rem',
                            height: 18,
                            fontWeight: 700,
                            bgcolor: isSelected ? '#BAE6FD' : '#F1F5F9',
                            color: isSelected ? '#0369A1' : '#475569'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#64748B', display: 'block', mb: 0.5 }}>
                        {cfg.titleLat}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {cfg.axes.slice(0, 2).map((a, i) => (
                          <Chip
                            key={i}
                            label={`${a.labelRu.split(' ')[0]}: ${a.normText}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.62rem', height: 18, borderColor: '#CBD5E1' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Detailed Reference & Clinical Values */}
        <Grid size={{ xs: 12, md: 8, lg: 8.5 }} sx={{ height: '100%', minHeight: 0 }}>
          <Paper sx={{ p: 2.5, height: '100%', overflowY: 'auto', borderRadius: 2, border: '1px solid #E2E8F0' }}>
            {/* Joint Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5, mb: 2, borderBottom: '2px solid #E2E8F0', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                    {currentConfig.titleRu}
                  </Typography>
                  <Chip
                    label={currentConfig.category}
                    size="small"
                    sx={{ bgcolor: currentConfig.iconColor, color: '#FFF', fontWeight: 800, fontSize: '0.7rem' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#64748B' }}>
                  {currentConfig.titleLat} — Международный протокол Neutral-0 (SFTR)
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  icon={<MeterIcon sx={{ fontSize: 16 }} />}
                  label={`${currentConfig.axes.length} тестовых осей`}
                  size="small"
                  sx={{ bgcolor: '#F0F9FF', color: '#0369A1', fontWeight: 700, border: '1px solid #BAE6FD' }}
                />
              </Box>
            </Box>

            {/* Axes Table */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E293B', mb: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <RomIcon fontSize="small" color="primary" /> Анатомические оси движения и референсные физиологические нормы
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>Ось движения (SFTR)</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>Латинский термин</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>Физиологическая норма</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>Клиническое значение / Патология</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentConfig.axes.map((axis) => (
                    <TableRow key={axis.key} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#1E293B' }}>
                        {axis.labelRu}
                        {axis.isDeficit && (
                          <Chip label="Дефицит" size="small" sx={{ ml: 1, height: 18, fontSize: '0.62rem', bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 800 }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontStyle: 'italic', color: '#64748B', fontSize: '0.78rem' }}>
                        {axis.labelLat}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={axis.normText}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: axis.isDeficit ? '#FEF2F2' : '#ECFDF5',
                            color: axis.isDeficit ? '#DC2626' : '#047857',
                            border: `1px solid ${axis.isDeficit ? '#FCA5A5' : '#A7F3D0'}`
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: '#334155' }}>
                        <LatexText text={axis.clinicalNote || 'Стандартная амплитуда сустава'} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Presets Grid: Normal vs Mild vs Severe */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E293B', mb: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <MeterIcon fontSize="small" color="primary" /> Градации контрактур и клинические пресеты
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#15803D', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    🟢 Норма (Физиологическая)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Полный объем без ограничения и дефицита
                  </Typography>
                  <Box sx={{ fontSize: '0.78rem' }}>
                    {Object.entries(currentConfig.defaultNorm || {}).map(([k, v]) => (
                      <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25, borderBottom: '1px dashed #DCFCE7' }}>
                        <span style={{ color: '#475569' }}>{k}:</span>
                        <strong style={{ color: '#15803D' }}>{v}°</strong>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#B45309', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    🟡 Умеренная контрактура
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Артроз II ст. / постиммобилизационная тугоподвижность
                  </Typography>
                  <Box sx={{ fontSize: '0.78rem' }}>
                    {Object.entries(currentConfig.defaultMild || {}).map(([k, v]) => (
                      <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25, borderBottom: '1px dashed #FEF3C7' }}>
                        <span style={{ color: '#475569' }}>{k}:</span>
                        <strong style={{ color: '#B45309' }}>{v}°</strong>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#B91C1C', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    🔴 Выраженная контрактура
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Артроз III ст., фиброз капсулы, тяжелый дефицит
                  </Typography>
                  <Box sx={{ fontSize: '0.78rem' }}>
                    {Object.entries(currentConfig.defaultSevere || {}).map(([k, v]) => (
                      <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25, borderBottom: '1px dashed #FEE2E2' }}>
                        <span style={{ color: '#475569' }}>{k}:</span>
                        <strong style={{ color: '#B91C1C' }}>{v}°</strong>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* End Feel Reference Section */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E293B', mb: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <ShieldIcon fontSize="small" color="primary" /> Характер конечного упора (End-Feel по Cyriax)
            </Typography>

            <Grid container spacing={1.5}>
              {END_FEEL_OPTIONS.map((ef) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={ef.code}>
                  <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1.5, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <span style={{ fontSize: '1.2rem' }}>{ef.icon}</span>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: ef.color, lineHeight: 1.2 }}>
                          {ef.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.68rem' }}>
                          {ef.sub}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', lineHeight: 1.4 }}>
                      <LatexText text={ef.desc} />
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Clinical Guidance Modal for ROM */}
      <ClinicalGuidanceModal
        open={guidanceModalOpen}
        onClose={() => setGuidanceModalOpen(false)}
        initialSection="rom"
      />
    </Box>
  );
}
