import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Slider,
  Tooltip,
  CircularProgress
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import InvertColorsIcon from '@mui/icons-material/InvertColors';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import Brightness6Icon from '@mui/icons-material/Brightness6';
import { API_BASE_URL } from '../../config/apiConfig';
import type { JointAreaId } from './BodyHomunculus';

export interface MediaItem {
  id: number;
  patient_id: number;
  protocol_id?: number | null;
  media_category: string;
  joint_area?: string | null;
  title: string;
  file_name: string;
  file_path: string;
  thumbnail_path?: string | null;
  file_size_bytes: number;
  mime_type: string;
  description?: string | null;
  study_date?: string | null;
}

interface PatientMediaHubProps {
  patientId: number;
  protocolId?: number | null;
  selectedJoint?: JointAreaId | null;
  mediaList: MediaItem[];
  onRefreshMedia: () => void;
}

export default function PatientMediaHub({
  patientId,
  protocolId,
  selectedJoint,
  mediaList,
  onRefreshMedia
}: PatientMediaHubProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaCategory, setMediaCategory] = useState<string>('xray');
  const [mediaTitle, setMediaTitle] = useState<string>('');
  const [mediaDesc, setMediaDesc] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Lightbox Viewer state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isInverted, setIsInverted] = useState(false);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);

  // Side-by-Side Comparison state
  const [compareMedia, setCompareMedia] = useState<MediaItem | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setMediaTitle(file.name.replace(/\.[^/.]+$/, ''));
      setUploadModalOpen(true);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('mediaFile', selectedFile);
    formData.append('patientId', String(patientId));
    if (protocolId) formData.append('protocolId', String(protocolId));
    formData.append('mediaCategory', mediaCategory);
    if (selectedJoint) formData.append('jointArea', selectedJoint);
    formData.append('title', mediaTitle);
    formData.append('description', mediaDesc);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ortho/media/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadModalOpen(false);
        setSelectedFile(null);
        onRefreshMedia();
      } else {
        alert(data.error || 'Ошибка загрузки файла');
      }
    } catch (err: any) {
      alert('Сетевая ошибка: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    if (!window.confirm('Удалить данный медиафайл?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/ortho/media/${mediaId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        onRefreshMedia();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openLightbox = (item: MediaItem) => {
    setActiveMedia(item);
    setZoomLevel(100);
    setIsInverted(false);
    setBrightness(100);
    setContrast(100);
    setIsCompareMode(false);
    setLightboxOpen(true);
  };

  const getMediaUrl = (item: MediaItem) => {
    if (item.file_path.startsWith('http')) return item.file_path;
    return `${API_BASE_URL}/${item.file_path}`;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoCameraIcon sx={{ color: '#0F3C64', fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F3C64' }}>
            Клинический медиа-хаб пациента
          </Typography>
          <Chip label={`${mediaList.length} файлов`} size="small" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
        </Box>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*,application/pdf,video/*,.dcm"
          onChange={handleFileChange}
        />

        <Button
          variant="contained"
          size="small"
          startIcon={<CloudUploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
        >
          Загрузить снимок / фото
        </Button>
      </Box>

      {/* Media Thumbnails Grid */}
      {mediaList.length === 0 ? (
        <Box
          sx={{
            py: 3,
            px: 2,
            textAlign: 'center',
            bgcolor: '#F8FAFC',
            borderRadius: 2,
            border: '1px dashed #CBD5E1',
            cursor: 'pointer'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudUploadIcon sx={{ fontSize: 32, color: '#94A3B8', mb: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
            Нет прикрепленных снимков или фото
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            Перетащите сюда рентгенограммы, МРТ, УЗИ или фото вальгуса/рубцов
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={1.5}>
          {mediaList.map((item) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  border: '1px solid #E2E8F0',
                  borderRadius: 1.5,
                  position: 'relative',
                  '&:hover': { borderColor: '#0284C7', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
                  transition: 'all 0.15s'
                }}
              >
                {/* Thumbnail Image or PDF icon */}
                <Box
                  sx={{
                    width: '100%',
                    height: 100,
                    bgcolor: '#0F172A',
                    borderRadius: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => openLightbox(item)}
                >
                  {item.mime_type.startsWith('image') ? (
                    <img
                      src={getMediaUrl(item)}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : item.mime_type.includes('pdf') ? (
                    <Typography sx={{ color: '#EF4444', fontWeight: 700, fontSize: '0.85rem' }}>
                      📄 PDF
                    </Typography>
                  ) : (
                    <Typography sx={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.85rem' }}>
                      🎥 ВИДЕО
                    </Typography>
                  )}
                </Box>

                {/* Details */}
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ fontWeight: 700, display: 'block', mt: 0.75, color: '#0F3C64' }}
                >
                  {item.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.25 }}>
                  <Chip
                    label={item.media_category.toUpperCase()}
                    size="small"
                    sx={{ fontSize: '0.62rem', height: 18 }}
                  />
                  <IconButton size="small" onClick={() => handleDeleteMedia(item.id)} sx={{ p: 0.25, color: '#94A3B8' }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Details Modal */}
      <Dialog open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F3C64' }}>
          Загрузка медиафайла пациента
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Название файла"
              fullWidth
              size="small"
              value={mediaTitle}
              onChange={(e) => setMediaTitle(e.target.value)}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Категория исследования</InputLabel>
              <Select
                value={mediaCategory}
                label="Категория исследования"
                onChange={(e) => setMediaCategory(e.target.value)}
              >
                <MenuItem value="xray">Рентгенография (X-ray)</MenuItem>
                <MenuItem value="mri">МРТ сустава (MRI)</MenuItem>
                <MenuItem value="ct">Компьютерная томография (КТ)</MenuItem>
                <MenuItem value="ultrasound">УЗИ суставов / мягких тканей</MenuItem>
                <MenuItem value="clinical_photo">Клиническое фото (деформация, шов)</MenuItem>
                <MenuItem value="plantography">Плантография (стопы)</MenuItem>
                <MenuItem value="gait_video">Видео походки / биомеханики</MenuItem>
                <MenuItem value="external_pdf">Внешняя выписка / заключение (PDF)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Клинический комментарий врача"
              multiline
              rows={2}
              fullWidth
              size="small"
              value={mediaDesc}
              onChange={(e) => setMediaDesc(e.target.value)}
              placeholder="Например: Прямая проекция, выраженное сужение медиальной щели"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUploadModalOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={handleUploadSubmit}
            disabled={isUploading}
            startIcon={isUploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
          >
            Сохранить в медиа-хаб
          </Button>
        </DialogActions>
      </Dialog>

      {/* Medical Lightbox Modal */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { bgcolor: '#090D16', color: '#F8FAFC' } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1rem' }}>
              {activeMedia?.title}
            </Typography>
            <Chip label={activeMedia?.media_category.toUpperCase()} size="small" color="primary" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Zoom Controls */}
            <Tooltip title="Увеличить (Zoom In)">
              <IconButton size="small" onClick={() => setZoomLevel((z) => Math.min(300, z + 25))} sx={{ color: '#E2E8F0' }}>
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Уменьшить (Zoom Out)">
              <IconButton size="small" onClick={() => setZoomLevel((z) => Math.max(50, z - 25))} sx={{ color: '#E2E8F0' }}>
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Инверсия цветов (Негатив)">
              <IconButton
                size="small"
                onClick={() => setIsInverted(!isInverted)}
                sx={{ color: isInverted ? '#38BDF8' : '#E2E8F0' }}
              >
                <InvertColorsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Режим сравнения До/После">
              <IconButton
                size="small"
                onClick={() => setIsCompareMode(!isCompareMode)}
                sx={{ color: isCompareMode ? '#38BDF8' : '#E2E8F0' }}
              >
                <CompareArrowsIcon />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => setLightboxOpen(false)} sx={{ color: '#E2E8F0', ml: 1 }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
          {/* Controls Bar for Brightness and Contrast */}
          <Box sx={{ width: '100%', maxWidth: 600, display: 'flex', gap: 4, mb: 1.5 }}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Brightness6Icon sx={{ fontSize: 16, color: '#94A3B8' }} />
              <Typography variant="caption" sx={{ color: '#94A3B8', minWidth: 60 }}>
                Яркость:
              </Typography>
              <Slider
                size="small"
                value={brightness}
                min={50}
                max={200}
                onChange={(_, v) => setBrightness(Number(v))}
                sx={{ color: '#38BDF8' }}
              />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', minWidth: 70 }}>
                Контраст:
              </Typography>
              <Slider
                size="small"
                value={contrast}
                min={50}
                max={200}
                onChange={(_, v) => setContrast(Number(v))}
                sx={{ color: '#38BDF8' }}
              />
            </Box>
          </Box>

          {/* Image Display */}
          {activeMedia && (
            <Box
              sx={{
                width: '100%',
                maxHeight: '70vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'auto',
                p: 1
              }}
            >
              {isCompareMode ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 700, display: 'block', mb: 1 }}>
                      ТЕКУЩЕЕ ИССЛЕДОВАНИЕ
                    </Typography>
                    <img
                      src={getMediaUrl(activeMedia)}
                      alt="Active"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '60vh',
                        objectFit: 'contain',
                        filter: `${isInverted ? 'invert(100%) ' : ''}brightness(${brightness}%) contrast(${contrast}%)`
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#22C55E', fontWeight: 700, display: 'block', mb: 1 }}>
                      СРАВНИТЬ СО СНИМКОМ ИЗ СПИСКА
                    </Typography>
                    {compareMedia ? (
                      <img
                        src={getMediaUrl(compareMedia)}
                        alt="Compare"
                        style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                      />
                    ) : (
                      <Box sx={{ p: 4, border: '1px dashed #334155', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1 }}>
                          Выберите снимок для сопоставления:
                        </Typography>
                        {mediaList
                          .filter((m) => m.id !== activeMedia.id)
                          .map((m) => (
                            <Button
                              key={m.id}
                              size="small"
                              variant="outlined"
                              onClick={() => setCompareMedia(m)}
                              sx={{ m: 0.5, fontSize: '0.72rem' }}
                            >
                              {m.title}
                            </Button>
                          ))}
                      </Box>
                    )}
                  </Grid>
                </Grid>
              ) : (
                <img
                  src={getMediaUrl(activeMedia)}
                  alt={activeMedia.title}
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transition: 'transform 0.1s ease',
                    maxWidth: '100%',
                    maxHeight: '65vh',
                    objectFit: 'contain',
                    filter: `${isInverted ? 'invert(100%) ' : ''}brightness(${brightness}%) contrast(${contrast}%)`
                  }}
                />
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
}
