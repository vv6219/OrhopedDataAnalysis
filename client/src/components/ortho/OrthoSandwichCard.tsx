import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Checkbox,
  Tooltip,
  Collapse,
  Chip,
  Paper,
  alpha,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrintDisabledIcon from '@mui/icons-material/PrintDisabled';
import PrintIcon from '@mui/icons-material/Print';

export interface OrthoSandwichCardProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  expanded: boolean;
  onToggleExpand: () => void;
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  hasContent?: boolean;
  previewSnippet?: string;
  badge?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  cardSx?: object;
  accentColor?: string;
}

export const OrthoSandwichCard: React.FC<OrthoSandwichCardProps> = ({
  id,
  title,
  subtitle,
  icon,
  expanded,
  onToggleExpand,
  isActive,
  onToggleActive,
  hasContent = false,
  previewSnippet,
  badge,
  headerActions,
  children,
  cardSx = {},
  accentColor = '#0284c7'
}) => {
  const theme = useTheme();

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const willPrint = isActive && hasContent;

  return (
    <Paper
      elevation={expanded ? 2 : 1}
      sx={{
        borderRadius: 2.5,
        mb: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: !isActive
          ? alpha(theme.palette.text.disabled, 0.2)
          : expanded
          ? alpha(accentColor, 0.4)
          : alpha(theme.palette.divider, 0.8),
        borderLeft: `5px solid ${!isActive ? '#94a3b8' : willPrint ? accentColor : '#cbd5e1'}`,
        backgroundColor: !isActive
          ? alpha(theme.palette.background.paper, 0.6)
          : theme.palette.background.paper,
        opacity: !isActive ? 0.78 : 1,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: theme.shadows[expanded ? 4 : 2],
          borderColor: !isActive ? alpha(theme.palette.text.disabled, 0.35) : alpha(accentColor, 0.5)
        },
        ...cardSx
      }}
    >
      {/* Header / Accordion Bar */}
      <Box
        onClick={onToggleExpand}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 1.5, sm: 2 },
          py: 1.25,
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: !isActive
            ? alpha('#94a3b8', 0.08)
            : expanded
            ? alpha(accentColor, 0.06)
            : alpha(theme.palette.action.hover, 0.03),
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: alpha(theme.palette.divider, 0.6),
          transition: 'background-color 0.2s ease'
        }}
      >
        {/* Left: Active Checkbox + Icon + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
          <Tooltip title={isActive ? 'Раздел активен (пойдет в протокол/печать)' : 'Раздел выключен (не пойдет в печать)'}>
            <Box onClick={handleCheckboxClick} sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <Checkbox
                checked={isActive}
                onChange={(e) => onToggleActive(e.target.checked)}
                size="small"
                sx={{
                  p: 0.5,
                  color: !isActive ? 'text.disabled' : accentColor,
                  '&.Mui-checked': { color: accentColor }
                }}
              />
            </Box>
          </Tooltip>

          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: !isActive ? 'text.disabled' : accentColor,
                fontSize: '1.25rem'
              }}
            >
              {icon}
            </Box>
          )}

          <Box sx={{ minWidth: 0, flexShrink: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '0.92rem', sm: '1rem' },
                  color: !isActive ? 'text.secondary' : 'text.primary',
                  textDecoration: !isActive ? 'line-through' : 'none',
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap'
                }}
              >
                {title}
              </Typography>

              {badge}

              {/* Status Indicator Chips */}
              {!isActive ? (
                <Chip
                  key="chip-inactive"
                  size="small"
                  icon={<PrintDisabledIcon style={{ fontSize: '0.85rem' }} />}
                  label="Не печатать"
                  color="default"
                  variant="outlined"
                  sx={{
                    height: 22,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    borderColor: 'divider',
                    color: 'text.secondary'
                  }}
                />
              ) : willPrint ? (
                <Chip
                  key="chip-will-print"
                  size="small"
                  icon={<PrintIcon style={{ fontSize: '0.85rem' }} />}
                  label="В печать"
                  sx={{
                    height: 22,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: alpha(accentColor, 0.12),
                    color: accentColor,
                    borderColor: alpha(accentColor, 0.3)
                  }}
                />
              ) : (
                <Chip
                  key="chip-empty"
                  size="small"
                  label="Пусто (не печатается)"
                  variant="outlined"
                  sx={{
                    height: 22,
                    fontSize: '0.72rem',
                    color: 'text.disabled',
                    borderColor: alpha(theme.palette.divider, 0.5)
                  }}
                />
              )}
            </Box>

            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: 'block',
                  mt: -0.2,
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Center/Right: Collapsed Preview Snippet & Header Actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            ml: 2,
            flexShrink: 0
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {!expanded && previewSnippet && isActive && (
            <Typography
              key="preview-snippet"
              variant="caption"
              sx={{
                maxWidth: { xs: 120, sm: 260, md: 380 },
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontStyle: 'italic',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {previewSnippet}
            </Typography>
          )}

          {headerActions}

          <IconButton
            size="small"
            onClick={onToggleExpand}
            sx={{
              p: 0.5,
              color: 'text.secondary',
              transition: 'transform 0.2s',
              transform: expanded ? 'rotate(180deg)' : 'none'
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Accordion Body */}
      <Collapse in={expanded} timeout="auto" unmountOnExit={false}>
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            position: 'relative',
            backgroundColor: !isActive ? alpha('#94a3b8', 0.04) : 'transparent'
          }}
        >
          {!isActive && (
            <Box
              key="inactive-banner"
              sx={{
                mb: 1.5,
                p: 1.2,
                borderRadius: 1.5,
                backgroundColor: alpha('#94a3b8', 0.12),
                border: '1px dashed #94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                Раздел <strong>отключен</strong>. Текст сохранен как черновик, но не пойдет в итоговый медицинский протокол и лист печати.
              </Typography>
              <Chip
                label="Активировать"
                size="small"
                color="primary"
                onClick={() => onToggleActive(true)}
                sx={{ cursor: 'pointer', fontWeight: 600, height: 24 }}
              />
            </Box>
          )}

          <Box key="card-body-content">
            {children}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};
