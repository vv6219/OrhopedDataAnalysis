import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Tooltip,
  TextField,
  InputAdornment,
  Paper,
  IconButton,
  Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CircleIcon from '@mui/icons-material/Circle';
import CodeIcon from '@mui/icons-material/Code';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigationGroups } from '../config/navigationConfig';

const drawerWidth = 265;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Track collapse/expand state for each multi-level group
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationGroups.forEach((g) => {
      initial[g.id] = g.defaultOpen;
    });
    return initial;
  });

  // Automatically expand group containing active route
  useEffect(() => {
    navigationGroups.forEach((group) => {
      const hasActiveChild = group.items.some((item) => item.path === location.pathname);
      if (hasActiveChild) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [location.pathname]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleExpandAll = () => {
    const allOpen: Record<string, boolean> = {};
    navigationGroups.forEach((g) => {
      allOpen[g.id] = true;
    });
    setOpenGroups(allOpen);
  };

  const handleCollapseAll = () => {
    const allClosed: Record<string, boolean> = {};
    navigationGroups.forEach((g) => {
      allClosed[g.id] = false;
    });
    setOpenGroups(allClosed);
  };

  const isDbActive = location.pathname === '/sqlite-studio' || location.pathname === '/db-studio';

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  // Filter groups and items based on search term
  const filteredGroups = navigationGroups
    .map((group) => {
      const groupMatches = group.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchingItems = group.items.filter(
        (item) =>
          groupMatches ||
          item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tooltip.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return {
        ...group,
        items: matchingItems,
        hasMatches: matchingItems.length > 0
      };
    })
    .filter((group) => group.hasMatches);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }
      }}
    >
      {/* Top Header / Clinic Brand (Click opens official website in new tab) */}
      <Toolbar sx={{ height: 90, display: 'flex', alignItems: 'center', p: 1.5, flexShrink: 0 }}>
        <Tooltip title="Открыть официальный сайт: orthoped-sochi.ru (в новой вкладке)" placement="right" arrow>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              width: '100%',
              borderRadius: 2,
              p: 0.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(15, 60, 100, 0.05)',
                transform: 'translateY(-1px)'
              }
            }}
            onClick={() => window.open('https://orthoped-sochi.ru', '_blank', 'noopener,noreferrer')}
          >
            <img
              src="/MainLogoTransparent.png"
              alt="Логотип Центра Ортопедии и Травматологии"
              style={{ width: 46, height: 46, marginRight: 12, objectFit: 'contain' }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2, fontSize: '0.82rem' }}>
                Центр Ортопедии
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2, fontSize: '0.82rem' }}>
                и Травматологии
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#156C9C', lineHeight: 1.2, mt: 0.3 }}>
                Добрушкина
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 500, color: '#718096', lineHeight: 1.2 }}>
                в Сочи
              </Typography>
            </Box>
          </Box>
        </Tooltip>
      </Toolbar>

      {/* Sticky Top Header: Search Field + Expand/Collapse All Controls */}
      <Box sx={{ p: 1.5, pb: 1.2, flexShrink: 0, bgcolor: 'background.paper', borderBottom: '1px solid rgba(226, 232, 240, 1)' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Поиск по меню и разделам..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                </InputAdornment>
              ),
              sx: { borderRadius: '8px', fontSize: '0.82rem', height: 36 }
            }
          }}
        />

        {/* Freezed Navigation Toolbar: Expand All / Collapse All with Iconography */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, px: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: '#718096',
              fontSize: '0.67rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Дерево разделов
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Tooltip title="Развернуть все разделы (Expand all)" placement="bottom" arrow>
              <IconButton
                size="small"
                onClick={handleExpandAll}
                sx={{
                  p: 0.5,
                  border: '1px solid #D6E4F0',
                  borderRadius: 1.5,
                  bgcolor: '#F0F6FA',
                  color: '#0F3C64',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: '#E2EEF8',
                    borderColor: '#0F3C64',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <KeyboardDoubleArrowDownIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Свернуть все разделы (Collapse all)" placement="bottom" arrow>
              <IconButton
                size="small"
                onClick={handleCollapseAll}
                sx={{
                  p: 0.5,
                  border: '1px solid #E2E8F0',
                  borderRadius: 1.5,
                  bgcolor: '#FFFFFF',
                  color: '#718096',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: '#F7FAFC',
                    borderColor: '#718096',
                    color: '#0F3C64',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <KeyboardDoubleArrowUpIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Multi-Level Hierarchical Navigation Tree */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        <List disablePadding>
          {filteredGroups.map((group) => {
            const isGroupOpen = searchTerm ? true : !!openGroups[group.id];

            return (
              <Box key={group.id} sx={{ mb: 1 }}>
                {/* Group Header / Collapsible Node */}
                <ListItem
                  button
                  onClick={() => toggleGroup(group.id)}
                  sx={{
                    borderRadius: '8px',
                    py: 0.75,
                    px: 1.25,
                    cursor: 'pointer',
                    bgcolor: isGroupOpen ? 'rgba(15, 60, 100, 0.03)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(15, 60, 100, 0.06)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 30, color: '#0F3C64' }}>
                    {group.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={group.title}
                    primaryTypographyProps={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: '#0F3C64',
                      letterSpacing: '0.4px'
                    }}
                  />
                  {isGroupOpen ? (
                    <ExpandLess sx={{ fontSize: 18, color: '#718096' }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: 18, color: '#718096' }} />
                  )}
                </ListItem>

                {/* Group Child Items */}
                <Collapse in={isGroupOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ mt: 0.25 }}>
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path;

                      return (
                        <Tooltip title={item.tooltip} placement="right" key={item.text} arrow>
                          <ListItem
                            button
                            onClick={() => handleItemClick(item.path)}
                            sx={{
                              cursor: 'pointer',
                              borderRadius: '8px',
                              mb: 0.4,
                              pl: 3.5, // Indented sub-items
                              pr: 1.5,
                              py: 0.6,
                              bgcolor: isActive ? 'rgba(15, 60, 100, 0.08)' : 'transparent',
                              color: isActive ? '#0F3C64' : 'text.primary',
                              fontWeight: isActive ? 700 : 500,
                              borderLeft: isActive ? '4px solid #0F3C64' : '4px solid transparent',
                              '&:hover': {
                                bgcolor: 'rgba(15, 60, 100, 0.05)',
                                transform: 'translateX(2px)'
                              },
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 30, color: isActive ? '#0F3C64' : '#718096' }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                fontSize: '0.82rem',
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? '#0F3C64' : 'inherit'
                              }}
                            />
                          </ListItem>
                        </Tooltip>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          })}

          {filteredGroups.length === 0 && (
            <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: '0.82rem' }}>
              Разделы не найдены
            </Typography>
          )}
        </List>
      </Box>

      {/* FREEZED DOWN SIDEBAR MENU: Docked Tools (SQLite Studio & OpenAPI Swagger) */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            px: 0.5,
            fontWeight: 700,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            color: '#718096',
            fontSize: '0.66rem'
          }}
        >
          Системные Инструменты
        </Typography>

        {/* 1. SQLite Studio Docked Item (Opens in new tab) */}
        <Tooltip title="Открыть менеджер базы данных SQLite Studio в новой вкладке" placement="right" arrow>
          <Paper
            elevation={isDbActive ? 2 : 0}
            onClick={() => window.open('/sqlite-studio', '_blank', 'noopener,noreferrer')}
            sx={{
              p: 1.2,
              borderRadius: 2,
              cursor: 'pointer',
              border: isDbActive ? '1.5px solid #0F3C64' : '1px solid #E2E8F0',
              bgcolor: isDbActive ? '#F0F6FA' : '#FAFCFE',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              '&:hover': {
                bgcolor: '#F0F6FA',
                borderColor: '#156C9C',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(15, 60, 100, 0.08)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: '#0F3C64',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <StorageIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F3C64', fontSize: '0.82rem', lineHeight: 1.2 }}>
                  SQLite Studio
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                  <CircleIcon sx={{ fontSize: 7, color: '#38A169' }} />
                  <Typography variant="caption" sx={{ color: '#4A5568', fontSize: '0.68rem', fontWeight: 500 }}>
                    Менеджер БД (15 табл.)
                  </Typography>
                </Box>
              </Box>
            </Box>
            <IconButton
              size="small"
              sx={{ color: '#718096', p: 0.5, '&:hover': { color: '#0F3C64' } }}
            >
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Paper>
        </Tooltip>

        {/* 2. OpenAPI / Swagger Docked Item (Opens in new tab) */}
        <Tooltip title="Открыть интерактивную документацию Swagger UI (REST API) в новой вкладке" placement="right" arrow>
          <Paper
            elevation={0}
            onClick={() => window.open('http://localhost:5000/api-docs', '_blank', 'noopener,noreferrer')}
            sx={{
              p: 1.2,
              borderRadius: 2,
              cursor: 'pointer',
              border: '1px solid #E2E8F0',
              bgcolor: '#FAFCFE',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              '&:hover': {
                bgcolor: '#EBF8FF',
                borderColor: '#3182CE',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(49, 130, 206, 0.15)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: '#2B6CB0',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CodeIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#2B6CB0', fontSize: '0.82rem', lineHeight: 1.2 }}>
                  OpenAPI (Swagger)
                </Typography>
                <Typography variant="caption" sx={{ color: '#4A5568', fontSize: '0.68rem', fontWeight: 500 }}>
                  REST API документация
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              sx={{ color: '#718096', p: 0.5, '&:hover': { color: '#2B6CB0' } }}
            >
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Paper>
        </Tooltip>
      </Box>
    </Drawer>
  );
}
