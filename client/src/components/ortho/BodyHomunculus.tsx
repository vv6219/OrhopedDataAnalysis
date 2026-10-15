import { useState } from 'react';
import { Box, Typography, Button, Tooltip, Chip } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

export type JointAreaId =
  | 'knee_r'
  | 'knee_l'
  | 'shoulder_r'
  | 'shoulder_l'
  | 'hip_r'
  | 'hip_l'
  | 'spine_c'
  | 'spine_th'
  | 'spine_l'
  | 'foot_r'
  | 'foot_l'
  | 'elbow_r'
  | 'elbow_l'
  | 'wrist_r'
  | 'wrist_l';

export type JointStatus = 'normal' | 'warning' | 'severe' | 'unexamined';

export interface JointExamSummary {
  status: JointStatus;
  mediaCount?: number;
  detailsLabel?: string;
}

export const JOINT_TO_CLUSTER: Record<JointAreaId, { clusterId: string; clusterName: string; side: 'left' | 'right' | 'axial' }> = {
  knee_r: { clusterId: 'cluster_knee', clusterName: 'Коленный сустав', side: 'right' },
  knee_l: { clusterId: 'cluster_knee', clusterName: 'Коленный сустав', side: 'left' },
  shoulder_r: { clusterId: 'cluster_shoulder', clusterName: 'Плечевой пояс', side: 'right' },
  shoulder_l: { clusterId: 'cluster_shoulder', clusterName: 'Плечевой пояс', side: 'left' },
  hip_r: { clusterId: 'cluster_hip_pelvis', clusterName: 'Таз и ТБС', side: 'right' },
  hip_l: { clusterId: 'cluster_hip_pelvis', clusterName: 'Таз и ТБС', side: 'left' },
  spine_c: { clusterId: 'cluster_spine', clusterName: 'Позвоночник и торакс', side: 'axial' },
  spine_th: { clusterId: 'cluster_spine', clusterName: 'Позвоночник и торакс', side: 'axial' },
  spine_l: { clusterId: 'cluster_spine', clusterName: 'Позвоночник и торакс', side: 'axial' },
  foot_r: { clusterId: 'cluster_foot_ankle', clusterName: 'Стопа и голеностоп', side: 'right' },
  foot_l: { clusterId: 'cluster_foot_ankle', clusterName: 'Стопа и голеностоп', side: 'left' },
  elbow_r: { clusterId: 'cluster_elbow', clusterName: 'Локтевой сустав', side: 'right' },
  elbow_l: { clusterId: 'cluster_elbow', clusterName: 'Локтевой сустав', side: 'left' },
  wrist_r: { clusterId: 'cluster_wrist_hand', clusterName: 'Кисть и запястье', side: 'right' },
  wrist_l: { clusterId: 'cluster_wrist_hand', clusterName: 'Кисть и запястье', side: 'left' }
};

export const NON_JOINT_CLUSTERS = [
  { id: 'cluster_pediatric', name: 'Детская ортопедия', code: 'ДЕТ', color: '#D97706' },
  { id: 'cluster_systemic', name: 'Системные / Ревма', code: 'СИСТ', color: '#4F46E5' },
  { id: 'cluster_postop', name: 'Постоперационные', code: 'ПОСТ', color: '#059669' }
];

interface BodyHomunculusProps {
  selectedJoint: JointAreaId | null;
  onSelectJoint: (joint: JointAreaId) => void;
  examData?: Partial<Record<JointAreaId, JointExamSummary>>;
  onQuickNormAll?: () => void;
  selectedClusterId?: string | null;
  onSelectCluster?: (clusterId: string, side?: 'left' | 'right' | 'axial') => void;
  showClusterQuickFilters?: boolean;
}

const JOINT_NAMES: Record<JointAreaId, string> = {
  knee_r: 'Правый коленный сустав',
  knee_l: 'Левый коленный сустав',
  shoulder_r: 'Правый плечевой сустав',
  shoulder_l: 'Левый плечевой сустав',
  hip_r: 'Правый тазобедренный сустав',
  hip_l: 'Левый тазобедренный сустав',
  spine_c: 'Шейный отдел позвоночника',
  spine_th: 'Грудной отдел позвоночника',
  spine_l: 'Пояснично-крестцовый отдел',
  foot_r: 'Правая стопа и голеностоп',
  foot_l: 'Левая стопа и голеностоп',
  elbow_r: 'Правый локтевой сустав',
  elbow_l: 'Левый локтевой сустав',
  wrist_r: 'Правый лучезапястный сустав',
  wrist_l: 'Левый лучезапястный сустав'
};

export default function BodyHomunculus({
  selectedJoint,
  onSelectJoint,
  examData = {},
  onQuickNormAll,
  selectedClusterId,
  onSelectCluster,
  showClusterQuickFilters = true
}: BodyHomunculusProps) {
  const [viewSide, setViewSide] = useState<'front' | 'back'>('front');

  const handleJointClick = (id: JointAreaId) => {
    onSelectJoint(id);
    if (onSelectCluster) {
      const clusterInfo = JOINT_TO_CLUSTER[id];
      if (clusterInfo) {
        onSelectCluster(clusterInfo.clusterId, clusterInfo.side);
      }
    }
  };

  const getJointColor = (id: JointAreaId) => {
    const status = examData[id]?.status || 'unexamined';
    const isClusterMatch = selectedClusterId && JOINT_TO_CLUSTER[id]?.clusterId === selectedClusterId;
    
    if (id === selectedJoint) return '#0284C7'; // Selected active blue
    if (isClusterMatch) return '#0EA5E9'; // Sky blue for cluster match
    switch (status) {
      case 'normal':
        return '#22C55E'; // Green
      case 'warning':
        return '#F59E0B'; // Amber
      case 'severe':
        return '#EF4444'; // Red
      default:
        return '#94A3B8'; // Slate grey
    }
  };

  const getJointRadius = (id: JointAreaId) => {
    if (id === selectedJoint) return 14;
    const isClusterMatch = selectedClusterId && JOINT_TO_CLUSTER[id]?.clusterId === selectedClusterId;
    return isClusterMatch ? 13 : 11;
  };

  const renderJointPoint = (
    id: JointAreaId,
    cx: number,
    cy: number,
    label: string
  ) => {
    const isSelected = selectedJoint === id;
    const isClusterMatch = selectedClusterId && JOINT_TO_CLUSTER[id]?.clusterId === selectedClusterId;
    const color = getJointColor(id);
    const r = getJointRadius(id);
    const info = examData[id];
    const status = info?.status || 'unexamined';
    const mediaCount = info?.mediaCount || 0;
    const clusterInfo = JOINT_TO_CLUSTER[id];

    return (
      <Tooltip
        key={id}
        title={
          <Box sx={{ p: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {JOINT_NAMES[id]}
            </Typography>
            {clusterInfo && (
              <Typography variant="caption" sx={{ display: 'block', color: '#0284C7', fontWeight: 600 }}>
                Кластер: {clusterInfo.clusterName} ({clusterInfo.side === 'left' ? 'Слева' : clusterInfo.side === 'right' ? 'Справа' : 'Осевой'})
              </Typography>
            )}
            <Typography variant="caption" sx={{ display: 'block', color: '#94A3B8' }}>
              Статус:{' '}
              {status === 'normal'
                ? 'В норме'
                : status === 'warning'
                ? 'Умеренная патология'
                : status === 'severe'
                ? 'Выраженная патология'
                : 'Не осматривался'}
            </Typography>
            {mediaCount > 0 && (
              <Typography variant="caption" sx={{ color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <PhotoCameraIcon sx={{ fontSize: 13 }} /> {mediaCount} снимков
              </Typography>
            )}
          </Box>
        }
        arrow
      >
        <g
          onClick={() => handleJointClick(id)}
          style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
        >
          <title>{label}</title>
          {(isSelected || isClusterMatch) && (
            <circle
              cx={cx}
              cy={cy}
              r={r + 6}
              fill="none"
              stroke={isSelected ? '#0284C7' : '#38BDF8'}
              strokeWidth={isSelected ? '2.5' : '1.8'}
              strokeDasharray={isSelected ? '4 3' : '3 3'}
              opacity="0.9"
            />
          )}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={color}
            stroke="#FFFFFF"
            strokeWidth="2"
            filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.25))"
          />
          {mediaCount > 0 && (
            <circle
              cx={cx + 8}
              cy={cy - 8}
              r={5}
              fill="#0284C7"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          )}
        </g>
      </Tooltip>
    );
  };

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: '#FFFFFF',
        borderRadius: 2,
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}
    >
      {/* Top Controls */}
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F3C64' }}>
          Анатомическая карта тела
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {onQuickNormAll && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={onQuickNormAll}
              sx={{ px: 1, py: 0.25, fontSize: '0.72rem', textTransform: 'none' }}
            >
              Всё в норме
            </Button>
          )}
          <Button
            size="small"
            variant={viewSide === 'front' ? 'contained' : 'outlined'}
            onClick={() => setViewSide('front')}
            sx={{ px: 1.5, py: 0.25, fontSize: '0.75rem', minWidth: 0 }}
          >
            Спереди
          </Button>
          <Button
            size="small"
            variant={viewSide === 'back' ? 'contained' : 'outlined'}
            onClick={() => setViewSide('back')}
            sx={{ px: 1.5, py: 0.25, fontSize: '0.75rem', minWidth: 0 }}
          >
            Сзади
          </Button>
        </Box>
      </Box>

      {/* Non-joint and general cluster chips ribbon */}
      {showClusterQuickFilters && (
        <Box sx={{ width: '100%', display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1, justifyContent: 'center' }}>
          {NON_JOINT_CLUSTERS.map((cl) => {
            const isClActive = selectedClusterId === cl.id;
            return (
              <Chip
                key={cl.id}
                label={cl.name}
                size="small"
                onClick={() => onSelectCluster && onSelectCluster(cl.id)}
                sx={{
                  fontSize: '0.7rem',
                  height: 22,
                  fontWeight: 700,
                  bgcolor: isClActive ? cl.color : '#F1F5F9',
                  color: isClActive ? '#FFFFFF' : '#475569',
                  border: `1px solid ${isClActive ? cl.color : '#CBD5E1'}`,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: isClActive ? cl.color : '#E2E8F0' }
                }}
              />
            );
          })}
        </Box>
      )}

      {/* SVG Homunculus Human Silhouette */}
      <Box sx={{ position: 'relative', width: 220, height: 350 }}>
        <svg viewBox="0 0 200 320" width="100%" height="100%">
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>

          {/* Stylized Human Body Silhouette */}
          <path
            d="
              M 100 20 
              C 108 20, 114 26, 114 34 
              C 114 42, 108 48, 100 48 
              C 92 48, 86 42, 86 34 
              C 86 26, 92 20, 100 20 Z
              M 97 49 L 103 49 L 105 56 L 95 56 Z
              M 95 56 
              C 80 58, 60 68, 55 80 
              C 52 87, 46 115, 42 140 
              C 40 148, 37 155, 34 165
              C 32 170, 36 174, 40 171
              C 45 167, 50 145, 54 135
              C 58 125, 62 105, 66 90
              L 68 150 
              C 68 165, 75 180, 75 195
              L 73 245
              C 71 265, 70 280, 68 300
              C 67 305, 78 307, 82 301
              C 86 295, 87 270, 88 245
              L 90 195 L 100 195 L 110 195
              L 112 245
              C 113 270, 114 295, 118 301
              C 122 307, 133 305, 132 300
              C 130 280, 129 265, 127 245
              L 125 195
              C 125 180, 132 165, 132 150
              L 134 90
              C 138 105, 142 125, 146 135
              C 150 145, 155 167, 160 171
              C 164 174, 168 170, 166 165
              C 163 155, 160 148, 158 140
              C 154 115, 148 87, 145 80
              C 140 68, 120 58, 105 56 Z
            "
            fill="url(#bodyGrad)"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Interactive Joint Circles */}
          {viewSide === 'front' ? (
            <>
              {/* Shoulders */}
              {renderJointPoint('shoulder_r', 65, 78, 'Плечо (R)')}
              {renderJointPoint('shoulder_l', 135, 78, 'Плечо (L)')}

              {/* Elbows */}
              {renderJointPoint('elbow_r', 48, 125, 'Локоть (R)')}
              {renderJointPoint('elbow_l', 152, 125, 'Локоть (L)')}

              {/* Wrists */}
              {renderJointPoint('wrist_r', 36, 165, 'Кисть (R)')}
              {renderJointPoint('wrist_l', 164, 165, 'Кисть (L)')}

              {/* Hips */}
              {renderJointPoint('hip_r', 82, 175, 'ТБС (R)')}
              {renderJointPoint('hip_l', 118, 175, 'ТБС (L)')}

              {/* Knees */}
              {renderJointPoint('knee_r', 75, 235, 'Колено (R)')}
              {renderJointPoint('knee_l', 125, 235, 'Колено (L)')}

              {/* Feet / Ankles */}
              {renderJointPoint('foot_r', 73, 298, 'Стопа (R)')}
              {renderJointPoint('foot_l', 127, 298, 'Стопа (L)')}
            </>
          ) : (
            <>
              {/* Spine Cervical */}
              {renderJointPoint('spine_c', 100, 60, 'Шейный отдел')}

              {/* Spine Thoracic */}
              {renderJointPoint('spine_th', 100, 100, 'Грудной отдел')}

              {/* Spine Lumbar */}
              {renderJointPoint('spine_l', 100, 150, 'Поясничный отдел')}

              {/* Shoulders Back */}
              {renderJointPoint('shoulder_l', 65, 78, 'Плечо (L)')}
              {renderJointPoint('shoulder_r', 135, 78, 'Плечо (R)')}

              {/* Knees Back */}
              {renderJointPoint('knee_l', 75, 235, 'Подколен. ямка (L)')}
              {renderJointPoint('knee_r', 125, 235, 'Подколен. ямка (R)')}

              {/* Achilles / Feet */}
              {renderJointPoint('foot_l', 73, 298, 'Ахилл / Пятка (L)')}
              {renderJointPoint('foot_r', 127, 298, 'Ахилл / Пятка (R)')}
            </>
          )}
        </svg>
      </Box>

      {/* Selected Joint & Active Cluster Banner */}
      <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
        {selectedJoint ? (
          <Chip
            label={JOINT_NAMES[selectedJoint]}
            color="primary"
            variant="filled"
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.78rem', py: 0.5 }}
          />
        ) : (
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Нажмите на сустав на схеме для осмотра
          </Typography>
        )}
        {selectedJoint && JOINT_TO_CLUSTER[selectedJoint] && (
          <Chip
            label={`Кластер: ${JOINT_TO_CLUSTER[selectedJoint].clusterName}`}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 600, fontSize: '0.74rem', borderColor: '#0284C7', color: '#0369A1' }}
          />
        )}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E' }} />
          <Typography sx={{ fontSize: '0.65rem', color: '#64748B' }}>Норма</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
          <Typography sx={{ fontSize: '0.65rem', color: '#64748B' }}>Умеренно</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
          <Typography sx={{ fontSize: '0.65rem', color: '#64748B' }}>Патология</Typography>
        </Box>
      </Box>
    </Box>
  );
}
