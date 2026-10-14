import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Switch,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GoniometerInput from './GoniometerInput';
import type { RomValues } from './GoniometerInput';
import type { JointAreaId } from './BodyHomunculus';
import OrthoTestGuidanceModal from './OrthoTestGuidanceModal';
import { API_BASE_URL } from '../../config/apiConfig';

export type { RomValues };

export interface JointExamState {
  jointArea: JointAreaId;
  side: 'right' | 'left' | 'bilateral';
  axis: 'norm' | 'valgus' | 'varus';
  effusion: number; // 0, 1, 2, 3
  rom: RomValues;
  tests: Record<string, 'negative' | 'positive' | 'positive_medial' | 'positive_lateral' | string>;
  isNormPreset?: boolean;
}

export type JointCategory = 'knee' | 'shoulder' | 'elbow' | 'hip' | 'ankle' | 'wrist' | 'spine';

interface JointExamCardProps {
  jointArea: JointAreaId;
  state: JointExamState;
  onChange: (newState: JointExamState) => void;
  previousVisitDelta?: {
    date: string;
    romDelta: string;
    vasDelta: string;
  };
}

export default function JointExamCard({
  jointArea,
  state,
  onChange,
  previousVisitDelta
}: JointExamCardProps) {
  const getJointCategory = (id: JointAreaId): JointCategory => {
    if (id.startsWith('knee')) return 'knee';
    if (id.startsWith('shoulder')) return 'shoulder';
    if (id.startsWith('elbow')) return 'elbow';
    if (id.startsWith('hip')) return 'hip';
    if (id.startsWith('wrist')) return 'wrist';
    if (id.startsWith('foot')) return 'ankle';
    if (id.startsWith('spine')) return 'spine';
    return 'knee';
  };

  const category = getJointCategory(jointArea);

  const getCategoryTitle = (cat: JointCategory, id: JointAreaId) => {
    const side = id.endsWith('_l') ? ' (левый)' : id.endsWith('_r') ? ' (правый)' : '';
    switch (cat) {
      case 'elbow': return `Локтевой сустав${side}`;
      case 'knee': return `Коленный сустав${side}`;
      case 'shoulder': return `Плечевой сустав${side}`;
      case 'hip': return `Тазобедренный сустав${side}`;
      case 'ankle': return `Сустав стопы / голеностоп${side}`;
      case 'wrist': return `Лучезапястный сустав и кисть${side}`;
      case 'spine': return 'Позвоночник';
      default: return 'Сустав';
    }
  };

  // Quick "Norm by default"
  const handleSetNorm = () => {
    let defaultRom: RomValues = { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 };
    let defaultTests: Record<string, string> = {};

    if (category === 'knee') {
      defaultRom = { flexion_active: 140, flexion_passive: 140, extension_deficit: 0 };
      defaultTests = {
        lachman: 'negative',
        anterior_drawer: 'negative',
        posterior_drawer: 'negative',
        pivot_shift: 'negative',
        mcmurray: 'negative',
        appley: 'negative',
        patella_ballottement: 'negative'
      };
    } else if (category === 'elbow') {
      defaultRom = { flexion_active: 145, flexion_passive: 150, extension_deficit: 0, rotation_ext: 85, rotation_int: 85 };
      defaultTests = {
        cozen: 'negative',
        mill: 'negative',
        golfer: 'negative',
        tinel_cubital: 'negative',
        valgus_stress_elbow: 'negative',
        varus_stress_elbow: 'negative'
      };
    } else if (category === 'shoulder') {
      defaultRom = { flexion_active: 170, flexion_passive: 170, extension_deficit: 0, rotation_ext: 60, rotation_int: 60 };
      defaultTests = {
        neer: 'negative',
        hawkins: 'negative',
        empty_can_jobe: 'negative',
        drop_arm: 'negative',
        apprehension: 'negative'
      };
    } else if (category === 'hip') {
      defaultRom = { flexion_active: 120, flexion_passive: 125, extension_deficit: 0, rotation_ext: 45, rotation_int: 40 };
      defaultTests = {
        faber: 'negative',
        fadir: 'negative',
        thomas: 'negative',
        trendelenburg: 'negative'
      };
    } else if (category === 'wrist') {
      defaultRom = { flexion_active: 75, flexion_passive: 80, extension_deficit: 0 };
      defaultTests = {
        phalen: 'negative',
        tinel_wrist: 'negative',
        finkelstein: 'negative',
        piano_key: 'negative'
      };
    } else if (category === 'ankle') {
      defaultRom = { flexion_active: 45, flexion_passive: 45, extension_deficit: 0 };
      defaultTests = {
        anterior_drawer_ankle: 'negative',
        talar_tilt: 'negative',
        thompson: 'negative',
        windlass: 'negative'
      };
    } else if (category === 'spine') {
      defaultRom = { flexion_active: 90, flexion_passive: 90, extension_deficit: 0 };
      defaultTests = {
        lasegue: 'negative',
        wassermann: 'negative',
        adams: 'negative',
        radicular: 'negative'
      };
    }

    onChange({
      ...state,
      axis: 'norm',
      effusion: 0,
      rom: defaultRom,
      tests: defaultTests,
      isNormPreset: true
    });
  };

  // Test Catalog State & Methodology Dialog
  const [testCatalog, setTestCatalog] = useState<Record<string, any>>({});
  const [selectedTestDetail, setSelectedTestDetail] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/ortho/tests/catalog`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.tests)) {
          const map: Record<string, any> = {};
          d.tests.forEach((t: any) => {
            map[t.code] = t;
          });
          setTestCatalog(map);
        }
      })
      .catch((err) => console.error('Failed to load test catalog in JointExamCard:', err));
  }, []);

  const jointCatalogTests = useMemo(() => {
    return Object.values(testCatalog).filter((t: any) => t.target_joint === category);
  }, [testCatalog, category]);

  const handleTestToggle = (testKey: string) => {
    const currentVal = state.tests[testKey] || 'negative';
    const nextVal = currentVal === 'negative' ? 'positive' : 'negative';
    onChange({
      ...state,
      tests: { ...state.tests, [testKey]: nextVal }
    });
  };

  const renderTestItem = (testKey: string, defaultLabel: string) => {
    const catItem = testCatalog[testKey];
    const isPositive = state.tests[testKey] === 'positive' || state.tests[testKey] === 'positive_medial' || state.tests[testKey] === 'positive_lateral';
    const displayName = catItem ? catItem.name : defaultLabel;

    return (
      <Grid size={{ xs: 12, sm: 6 }} key={testKey}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: isPositive ? '#FCA5A5' : '#E2E8F0',
            bgcolor: isPositive ? '#FEF2F2' : '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
        >
          <FormControlLabel
            sx={{ mr: 0.5, flex: 1, m: 0 }}
            control={
              <Switch
                size="small"
                checked={isPositive}
                onChange={() => handleTestToggle(testKey)}
                color="error"
              />
            }
            label={
              <Box sx={{ ml: 0.5 }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: isPositive ? '#991B1B' : '#1E293B', lineHeight: 1.25 }}>
                  {displayName}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: isPositive ? '#DC2626' : '#64748B', fontWeight: isPositive ? 700 : 500 }}>
                  {isPositive ? 'Положительный (+)' : 'Отрицательный (-)'}
                </Typography>
              </Box>
            }
          />
          {catItem && (
            <Tooltip title="Методика теста, анатомический субстрат, чувствительность и специфичность">
              <IconButton
                size="small"
                onClick={() => setSelectedTestDetail(catItem)}
                sx={{ color: '#0284C7', p: 0.5, '&:hover': { bgcolor: '#E0F2FE' } }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Grid>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        bgcolor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 2
      }}
    >
      {/* Header with Quick Norm Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '1.05rem' }}>
            Локальный статус: {getCategoryTitle(category, jointArea)}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Осмотр, пальпация, гониометрия и клинические тесты
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          onClick={handleSetNorm}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.82rem',
            px: 2,
            py: 0.6,
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)'
          }}
        >
          Всё в пределах нормы (F2)
        </Button>
      </Box>

      {/* Previous Visit Delta Badge if present */}
      {previousVisitDelta && (
        <Box sx={{ mb: 2, p: 1, bgcolor: '#F0FDF4', borderRadius: 1.5, border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip label="Динамика к прошлому приему" size="small" color="success" sx={{ fontSize: '0.7rem' }} />
          <Typography sx={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
            {previousVisitDelta.date}: ROM {previousVisitDelta.romDelta} | ВАШ {previousVisitDelta.vasDelta}
          </Typography>
        </Box>
      )}

      {/* Section 1: Axis & Effusion */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.75 }}>
            Ось сустава / деформация:
          </Typography>
          <ToggleButtonGroup
            value={state.axis}
            exclusive
            onChange={(_, val) => val && onChange({ ...state, axis: val })}
            size="small"
            fullWidth
          >
            <ToggleButton value="norm">Прямая (норма)</ToggleButton>
            <ToggleButton value="valgus">Вальгус</ToggleButton>
            <ToggleButton value="varus">Варус</ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.75 }}>
            Выпот / синовит сустава:
          </Typography>
          <ToggleButtonGroup
            value={state.effusion}
            exclusive
            onChange={(_, val) => val !== null && onChange({ ...state, effusion: Number(val) })}
            size="small"
            fullWidth
          >
            <ToggleButton value={0}>0 (нет)</ToggleButton>
            <ToggleButton value={1}>I (малый)</ToggleButton>
            <ToggleButton value={2}>II (умеренный)</ToggleButton>
            <ToggleButton value={3}>III (выраженный)</ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>

      {/* Section 2: ROM Goniometer */}
      <Box sx={{ mb: 2.5 }}>
        <GoniometerInput
          values={state.rom}
          onChange={(newRom) => onChange({ ...state, rom: newRom })}
          jointType={category}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Section 3: Specialized Clinical Tests (Dynamic from Knowledge Base 2.0 Catalog) */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
            Специальные ортопедические тесты (Клинические пробы):
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Нажмите <b>(i)</b> для просмотра методики и чувствительности
          </Typography>
        </Box>

        <Grid container spacing={1.5}>
          {jointCatalogTests.length > 0 ? (
            jointCatalogTests.map((t: any) => renderTestItem(t.code, t.name))
          ) : (
            // Fallback hardcoded list if catalog is loading
            <>
              {category === 'knee' && (
                <>
                  {renderTestItem('lachman', 'Тест Лахмана (Lachman test)')}
                  {renderTestItem('anterior_drawer', 'Передний «выдвижной ящик»')}
                  {renderTestItem('posterior_drawer', 'Задний «выдвижной ящик»')}
                  {renderTestItem('pivot_shift', 'Pivot-shift тест')}
                  {renderTestItem('mcmurray', 'Тест Мак-Мюррея (мениски)')}
                  {renderTestItem('appley', 'Тест Эпли (компрессионный)')}
                  {renderTestItem('patella_ballottement', 'Баллотирование надколенника')}
                  {renderTestItem('clarke_patellar_grind', 'Тест Кларка (пателлофеморальный)')}
                </>
              )}
              {category === 'elbow' && (
                <>
                  {renderTestItem('cozen', 'Тест Козена (латеральный эпикондилит)')}
                  {renderTestItem('mill', 'Тест Милля (растяжение разгибателей)')}
                  {renderTestItem('golfer', 'Тест «локтя гольфиста» (медиальный эпикондилит)')}
                  {renderTestItem('tinel_cubital', 'Симптом Тиннеля (кубитальный канал)')}
                  {renderTestItem('valgus_stress_elbow', 'Вальгус-стресс тест локтя (MCL)')}
                  {renderTestItem('varus_stress_elbow', 'Варус-стресс тест локтя (LCL)')}
                </>
              )}
              {category === 'shoulder' && (
                <>
                  {renderTestItem('neer', 'Импиджмент-тест Нира (Neer)')}
                  {renderTestItem('hawkins', 'Тест Хокинса-Кеннеди')}
                  {renderTestItem('empty_can_jobe', 'Тест Джобса (надостная м.)')}
                  {renderTestItem('speed_biceps', 'Тест Спида (длинная головка бицепса)')}
                  {renderTestItem('yergason', 'Тест Яргасона (супинация предплечья)')}
                  {renderTestItem('apprehension_relocation', 'Тест предчувствия вывиха')}
                  {renderTestItem('lift_off_gerber', 'Тест Гербера (подлопаточная м.)')}
                  {renderTestItem('drop_arm', 'Тест падающей руки (массивный разрыв)')}
                </>
              )}
              {category === 'hip' && (
                <>
                  {renderTestItem('faber', 'Тест FABER / Патрика (ТБС / КПС)')}
                  {renderTestItem('fadir', 'Тест FADIR (импинджмент / вертлужная губа)')}
                  {renderTestItem('thomas', 'Тест Томаса (сгибательная контрактура)')}
                  {renderTestItem('trendelenburg', 'Симптом Тренделенбурга')}
                  {renderTestItem('scour', 'Тест Scour (квадрант-тест ТБС)')}
                </>
              )}
              {category === 'wrist' && (
                <>
                  {renderTestItem('phalen', 'Тест Фалена (карпальный канал)')}
                  {renderTestItem('tinel_wrist', 'Симптом Тиннеля на запястье')}
                  {renderTestItem('finkelstein', 'Тест Финкельштейна (болезнь де Кервена)')}
                  {renderTestItem('piano_key', 'Симптом «клавиши пианино» (DRUJ)')}
                </>
              )}
              {category === 'spine' && (
                <>
                  {renderTestItem('lasegue', 'Симптом Ласега (Lasegue test)')}
                  {renderTestItem('bragard', 'Тест Брагарда (дифференциация радикулопатии)')}
                  {renderTestItem('slump', 'Slump-тест (нейродинамическое натяжение)')}
                  {renderTestItem('adams', 'Проба Адамса (структурный сколиоз)')}
                  {renderTestItem('schober', 'Тест Шобера (подвижность поясничного отдела)')}
                </>
              )}
              {category === 'ankle' && (
                <>
                  {renderTestItem('anterior_drawer_ankle', 'Передний выдвижной ящик голеностопа')}
                  {renderTestItem('talar_tilt', 'Тест наклона таранной кости')}
                  {renderTestItem('thompson', 'Тест Томпсона (разрыв ахиллова сухожилия)')}
                  {renderTestItem('windlass', 'Тест Уиндласса (плантарный фасциит)')}
                  {renderTestItem('kleiger', 'Тест Клейгера (синдесмоз голеностопа)')}
                </>
              )}
            </>
          )}
        </Grid>
      </Box>

      {/* ON-SCREEN CLINICAL TEST GUIDANCE MODAL */}
      <OrthoTestGuidanceModal
        open={Boolean(selectedTestDetail)}
        onClose={() => setSelectedTestDetail(null)}
        test={selectedTestDetail}
        currentResult={selectedTestDetail ? (state.tests[selectedTestDetail.code] || 'negative') : 'negative'}
        onSetResult={(newResult) => {
          if (selectedTestDetail) {
            onChange({
              ...state,
              tests: { ...state.tests, [selectedTestDetail.code]: newResult }
            });
          }
        }}
      />
    </Paper>
  );
}
