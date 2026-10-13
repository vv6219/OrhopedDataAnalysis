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
  Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GoniometerInput from './GoniometerInput';
import type { RomValues } from './GoniometerInput';
import type { JointAreaId } from './BodyHomunculus';

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
  const getJointCategory = (id: JointAreaId): 'knee' | 'shoulder' | 'hip' | 'ankle' | 'spine' => {
    if (id.startsWith('knee')) return 'knee';
    if (id.startsWith('shoulder')) return 'shoulder';
    if (id.startsWith('hip')) return 'hip';
    if (id.startsWith('foot')) return 'ankle';
    if (id.startsWith('spine')) return 'spine';
    return 'knee';
  };

  const category = getJointCategory(jointArea);

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
    } else if (category === 'shoulder') {
      defaultRom = { flexion_active: 170, flexion_passive: 170, extension_deficit: 0, rotation_ext: 60, rotation_int: 60 };
      defaultTests = {
        neer: 'negative',
        hawkins: 'negative',
        empty_can_jobe: 'negative',
        drop_arm: 'negative',
        apprehension: 'negative'
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

  const handleTestToggle = (testKey: string) => {
    const currentVal = state.tests[testKey] || 'negative';
    const nextVal = currentVal === 'negative' ? 'positive' : 'negative';
    onChange({
      ...state,
      tests: { ...state.tests, [testKey]: nextVal }
    });
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
            Локальный статус: {category === 'knee' ? 'Коленный сустав' : category === 'shoulder' ? 'Плечевой сустав' : category === 'spine' ? 'Позвоночник' : 'Сустав стопы / голеностоп'}
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

      {/* Section 3: Specialized Clinical Tests */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64', mb: 1.5 }}>
          Специальные ортопедические тесты (Клинические пробы):
        </Typography>

        <Grid container spacing={1.5}>
          {category === 'knee' && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.tests.lachman === 'positive'}
                      onChange={() => handleTestToggle('lachman')}
                      color="error"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Тест Лахмана (Lachman test): {state.tests.lachman === 'positive' ? 'Положительный (+)' : 'Отрицательный (-)'}
                    </Typography>
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.tests.anterior_drawer === 'positive'}
                      onChange={() => handleTestToggle('anterior_drawer')}
                      color="error"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Передний «выдвижной ящик»: {state.tests.anterior_drawer === 'positive' ? 'Положительный (+)' : 'Отрицательный (-)'}
                    </Typography>
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.tests.mcmurray === 'positive'}
                      onChange={() => handleTestToggle('mcmurray')}
                      color="error"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Тест Мак-Мюррея (мениски): {state.tests.mcmurray === 'positive' ? 'Положительный (+)' : 'Отрицательный (-)'}
                    </Typography>
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.tests.patella_ballottement === 'positive'}
                      onChange={() => handleTestToggle('patella_ballottement')}
                      color="error"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Баллотирование надколенника: {state.tests.patella_ballottement === 'positive' ? 'Положительное (+)' : 'Отрицательное (-)'}
                    </Typography>
                  }
                />
              </Grid>
            </>
          )}

          {category === 'shoulder' && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.tests.neer === 'positive'}
                      onChange={() => handleTestToggle('neer')}
                      color="error"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Импиджмент-тест Нира (Neer): {state.tests.neer === 'positive' ? 'Положительный (+)' : 'Отрицательный (-)'}
                    </Typography>
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.tests.hawkins === 'positive'}
                      onChange={() => handleTestToggle('hawkins')}
                      color="error"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Тест Хокинса-Кеннеди: {state.tests.hawkins === 'positive' ? 'Положительный (+)' : 'Отрицательный (-)'}
                    </Typography>
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.tests.empty_can_jobe === 'positive'}
                      onChange={() => handleTestToggle('empty_can_jobe')}
                      color="error"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Тест Джобса (надостная м.): {state.tests.empty_can_jobe === 'positive' ? 'Положительный (+)' : 'Отрицательный (-)'}
                    </Typography>
                  }
                />
              </Grid>
            </>
          )}

          {category === 'spine' && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.tests.lasegue === 'positive'}
                      onChange={() => handleTestToggle('lasegue')}
                      color="error"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Симптом Ласега (Lasegue): {state.tests.lasegue === 'positive' ? 'Положительный (+)' : 'Отрицательный (-)'}
                    </Typography>
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.tests.adams === 'positive'}
                      onChange={() => handleTestToggle('adams')}
                      color="error"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Проба Адамса (сколиоз): {state.tests.adams === 'positive' ? 'Положительная (+)' : 'Отрицательная (-)'}
                    </Typography>
                  }
                />
              </Grid>
            </>
          )}

          {category === 'ankle' && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.tests.windlass === 'positive'}
                      onChange={() => handleTestToggle('windlass')}
                      color="error"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Тест Уиндласса (фасциит): {state.tests.windlass === 'positive' ? 'Положительный (+)' : 'Отрицательный (-)'}
                    </Typography>
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.tests.thompson === 'positive'}
                      onChange={() => handleTestToggle('thompson')}
                      color="error"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Тест Томпсона (ахилл): {state.tests.thompson === 'positive' ? 'Разрыв (+)' : 'Интактен (-)'}
                    </Typography>
                  }
                />
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </Paper>
  );
}
