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
  jointType?: 'knee' | 'shoulder' | 'hip' | 'ankle' | 'spine' | 'elbow' | 'wrist';
}

export default function GoniometerInput({
  values,
  onChange,
  maxFlexion,
  jointType = 'knee'
}: GoniometerInputProps) {
  const effectiveMaxFlexion = maxFlexion ?? (
    jointType === 'shoulder' ? 180 :
    jointType === 'elbow' ? 150 :
    jointType === 'hip' ? 125 :
    jointType === 'ankle' ? 50 :
    jointType === 'wrist' ? 80 :
    jointType === 'spine' ? 90 :
    140
  );

  const handlePreset = (type: 'norm' | 'mild' | 'severe') => {
    if (type === 'norm') {
      onChange({
        flexion_active: effectiveMaxFlexion,
        flexion_passive: effectiveMaxFlexion,
        extension_deficit: 0,
        rotation_ext: jointType === 'elbow' ? 85 : 45,
        rotation_int: jointType === 'elbow' ? 85 : 45
      });
    } else if (type === 'mild') {
      onChange({
        flexion_active: Math.max(30, effectiveMaxFlexion - 25),
        flexion_passive: Math.max(35, effectiveMaxFlexion - 15),
        extension_deficit: -5,
        rotation_ext: jointType === 'elbow' ? 70 : 35,
        rotation_int: jointType === 'elbow' ? 70 : 35
      });
    } else if (type === 'severe') {
      onChange({
        flexion_active: Math.round(effectiveMaxFlexion * 0.6),
        flexion_passive: Math.round(effectiveMaxFlexion * 0.7),
        extension_deficit: -15,
        rotation_ext: jointType === 'elbow' ? 45 : 20,
        rotation_int: jointType === 'elbow' ? 45 : 20
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
            <Typography variant="caption" sx={{ fontWeight: 700, color: values.flexion_active < effectiveMaxFlexion - 20 ? '#EF4444' : '#0F3C64' }}>
              {values.flexion_active}°
            </Typography>
          </Box>
          <Slider
            value={values.flexion_active || 0}
            min={jointType === 'ankle' ? 10 : 30}
            max={effectiveMaxFlexion}
            step={5}
            onChange={(_, val) => onChange({ ...values, flexion_active: Number(val) })}
            valueLabelDisplay="auto"
            sx={{
              color: values.flexion_active < effectiveMaxFlexion - 20 ? '#EF4444' : '#0284C7',
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
            min={jointType === 'ankle' ? 10 : 30}
            max={effectiveMaxFlexion + 10}
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
        {(jointType === 'shoulder' || jointType === 'hip' || jointType === 'elbow') && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                  {jointType === 'elbow' ? 'Супинация предплечья' : 'Наружная ротация'}
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
            {jointType === 'elbow' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                    Пронация предплечья
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                    {values.rotation_int || 0}°
                  </Typography>
                </Box>
                <Slider
                  value={values.rotation_int || 0}
                  min={0}
                  max={90}
                  step={5}
                  onChange={(_, val) => onChange({ ...values, rotation_int: Number(val) })}
                  valueLabelDisplay="auto"
                  sx={{ color: '#0284C7', height: 6 }}
                />
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Paper>
  );
}
