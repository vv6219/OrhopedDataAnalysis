import { Box, Typography, Slider, Button, Grid, Paper } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';

export interface RomValues {
  flexion_active: number;
  flexion_passive: number;
  extension_deficit: number;
  rotation_ext?: number;
  rotation_int?: number;
  internal_rotation?: number;
  external_rotation?: number;
  abduction?: number;
}

interface GoniometerInputProps {
  values: RomValues;
  onChange: (newValues: RomValues) => void;
  maxFlexion?: number;
  jointType?: 'knee' | 'shoulder' | 'hip' | 'ankle' | 'spine';
}

export default function GoniometerInput({
  values,
  onChange,
  maxFlexion = 140,
  jointType = 'knee'
}: GoniometerInputProps) {
  const handlePreset = (type: 'norm' | 'mild' | 'severe') => {
    if (type === 'norm') {
      onChange({
        flexion_active: maxFlexion,
        flexion_passive: maxFlexion,
        extension_deficit: 0,
        rotation_ext: 45,
        rotation_int: 45
      });
    } else if (type === 'mild') {
      onChange({
        flexion_active: maxFlexion - 25,
        flexion_passive: maxFlexion - 15,
        extension_deficit: -5,
        rotation_ext: 35,
        rotation_int: 35
      });
    } else if (type === 'severe') {
      onChange({
        flexion_active: Math.round(maxFlexion * 0.6),
        flexion_passive: Math.round(maxFlexion * 0.7),
        extension_deficit: -15,
        rotation_ext: 20,
        rotation_int: 20
      });
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SpeedIcon sx={{ color: '#0F3C64', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
            Гониометрия (ROM — метод «нейтраль-ноль»)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            color="success"
            onClick={() => handlePreset('norm')}
            sx={{ py: 0.2, px: 1, fontSize: '0.72rem', textTransform: 'none' }}
          >
            Норма
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={() => handlePreset('mild')}
            sx={{ py: 0.2, px: 1, fontSize: '0.72rem', textTransform: 'none' }}
          >
            Умеренно
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handlePreset('severe')}
            sx={{ py: 0.2, px: 1, fontSize: '0.72rem', textTransform: 'none' }}
          >
            Контрактура
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Active Flexion */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
              Активное сгибание
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: values.flexion_active < maxFlexion - 20 ? '#EF4444' : '#0F3C64' }}>
              {values.flexion_active}°
            </Typography>
          </Box>
          <Slider
            value={values.flexion_active || 0}
            min={30}
            max={maxFlexion}
            step={5}
            onChange={(_, val) => onChange({ ...values, flexion_active: Number(val) })}
            valueLabelDisplay="auto"
            sx={{
              color: values.flexion_active < maxFlexion - 20 ? '#EF4444' : '#0284C7',
              height: 6
            }}
          />
        </Grid>

        {/* Passive Flexion */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
              Пассивное сгибание
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64' }}>
              {values.flexion_passive}°
            </Typography>
          </Box>
          <Slider
            value={values.flexion_passive || 0}
            min={30}
            max={maxFlexion + 10}
            step={5}
            onChange={(_, val) => onChange({ ...values, flexion_passive: Number(val) })}
            valueLabelDisplay="auto"
            sx={{ color: '#0284C7', height: 6 }}
          />
        </Grid>

        {/* Extension Deficit */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
              Дефицит разгибания (контрактура)
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: values.extension_deficit < 0 ? '#EF4444' : '#22C55E' }}
            >
              {values.extension_deficit === 0 ? '0° (норма)' : `${values.extension_deficit}°`}
            </Typography>
          </Box>
          <Slider
            value={values.extension_deficit || 0}
            min={-30}
            max={0}
            step={5}
            onChange={(_, val) => onChange({ ...values, extension_deficit: Number(val) })}
            valueLabelDisplay="auto"
            sx={{
              color: values.extension_deficit < 0 ? '#EF4444' : '#22C55E',
              height: 6
            }}
          />
        </Grid>

        {/* Rotation if applicable */}
        {(jointType === 'shoulder' || jointType === 'hip') && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                Наружная ротация
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                {values.rotation_ext || 0}°
              </Typography>
            </Box>
            <Slider
              value={values.rotation_ext || 0}
              min={0}
              max={90}
              step={5}
              onChange={(_, val) => onChange({ ...values, rotation_ext: Number(val) })}
              valueLabelDisplay="auto"
              sx={{ color: '#0284C7', height: 6 }}
            />
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
