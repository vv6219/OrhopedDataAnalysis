import { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Tooltip,
  TextField,
  InputAdornment,
  IconButton,
  Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigationGroups, type NavItem } from '../config/navigationConfig';

const drawerWidth = 265;

interface NavTooltipContentProps {
  title: string;
  description: string;
  isExternal?: boolean;
  category?: string;
  isGroup?: boolean;
}

function NavTooltipContent({ title, description, isExternal, category, isGroup }: NavTooltipContentProps) {
  return (
    <Box sx={{ p: 0.75, maxWidth: 300 }}>
      {category && (
        <Typography
          sx={{
            fontSize: '0.67rem',
            fontWeight: 800,
            color: '#38BDF8',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            mb: 0.25
          }}
        >
          {category}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 0.5,
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          pb: 0.5
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#FFFFFF', lineHeight: 1.25 }}>
          {title}
        </Typography>
        {isExternal && (
          <Box
            sx={{
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: 'rgba(56, 189, 248, 0.2)',
              color: '#38BDF8',
              px: 0.6,
              py: 0.15,
              borderRadius: 1,
              whiteSpace: 'nowrap'
            }}
          >
            Внешняя ссылка
          </Box>
        )}
      </Box>
      <Typography sx={{ fontSize: '0.74rem', color: '#E2E8F0', lineHeight: 1.4, mb: 0.6 }}>
        {description}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 0.3, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
        <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8', fontStyle: 'italic' }}>
          {isGroup
            ? '➔ Клик для сворачивания / разворачивания'
            : isExternal
            ? '↗ Клик для перехода в новой вкладке'
            : '➔ Клик для перехода в раздел'}
        </Typography>
      </Box>
    </Box>
  );
}

const tooltipSlotProps = {
  tooltip: {
    sx: {
      bgcolor: '#0F172A',
      color: '#F8FAFC',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(148, 163, 184, 0.25)',
      borderRadius: '8px',
      p: 0.5
    }
  },
  arrow: {
    sx: {
      color: '#0F172A'
    }
  }
};

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

  // Track collapse/expand state for nested sub-sub menus (e.g. ТЕСТЫ)
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationGroups.forEach((g) => {
      g.items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          initial[item.text] = !!item.defaultOpen;
        }
      });
    });
    return initial;
  });

  // Automatically expand group and sub-menu containing active route
  useEffect(() => {
    navigationGroups.forEach((group) => {
      const currentFull = `${location.pathname}${location.search}`;
      const hasActiveChild = group.items.some((item) => {
        if (item.path === location.pathname || item.path === currentFull) return true;
        if (item.children) {
          return item.children.some(
            (child) =>
              child.path === location.pathname ||
              child.path === currentFull ||
              child.path.split('?')[0] === location.pathname
          );
        }
        return false;
      });

      if (hasActiveChild) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }

      group.items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          const hasActiveSub = item.children.some(
            (child) =>
              child.path === location.pathname ||
              child.path === currentFull ||
              child.path.split('?')[0] === location.pathname
          );
          if (hasActiveSub) {
            setOpenSubMenus((prev) => ({ ...prev, [item.text]: true }));
          }
        }
      });
    });
  }, [location.pathname, location.search]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const toggleSubMenu = (itemText: string) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [itemText]: !prev[itemText]
    }));
  };

  const handleExpandAll = () => {
    const allOpen: Record<string, boolean> = {};
    const allSubOpen: Record<string, boolean> = {};
    navigationGroups.forEach((g) => {
      allOpen[g.id] = true;
      g.items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          allSubOpen[item.text] = true;
        }
      });
    });
    setOpenGroups(allOpen);
    setOpenSubMenus(allSubOpen);
  };

  const handleCollapseAll = () => {
    const allClosed: Record<string, boolean> = {};
    const allSubClosed: Record<string, boolean> = {};
    navigationGroups.forEach((g) => {
      allClosed[g.id] = false;
      g.items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          allSubClosed[item.text] = false;
        }
      });
    });
    setOpenGroups(allClosed);
    setOpenSubMenus(allSubClosed);
  };

  const handleItemClick = (item: { path: string; isExternal?: boolean }) => {
    if (item.isExternal || item.path.startsWith('http')) {
      window.open(item.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(item.path);
    }
  };

  // Filter groups and items based on search term
  const filteredGroups = navigationGroups
    .map((group) => {
      const groupMatches = group.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchingItems: NavItem[] = [];

      group.items.forEach((item) => {
        const itemMatches =
          groupMatches ||
          item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tooltip.toLowerCase().includes(searchTerm.toLowerCase());

        if (item.children && item.children.length > 0) {
          const matchingChildren = item.children.filter(
            (child) =>
              itemMatches ||
              child.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
              child.tooltip.toLowerCase().includes(searchTerm.toLowerCase())
          );
          if (itemMatches || matchingChildren.length > 0) {
            matchingItems.push({
              ...item,
              children: itemMatches ? item.children : matchingChildren
            });
          }
        } else if (itemMatches) {
          matchingItems.push(item);
        }
      });

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
                <Tooltip
                  title={
                    <NavTooltipContent
                      title={group.title}
                      description={group.tooltip || `Раздел «${group.title}»: нажмите чтобы развернуть или свернуть подпункты`}
                      category="Раздел меню"
                      isGroup
                    />
                  }
                  placement="right"
                  arrow
                  slotProps={tooltipSlotProps}
                >
                  <ListItemButton
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
                      primary={
                        <Typography
                          sx={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: '#0F3C64',
                            letterSpacing: '0.4px'
                          }}
                        >
                          {group.title}
                        </Typography>
                      }
                    />
                    {isGroupOpen ? (
                      <ExpandLess sx={{ fontSize: 18, color: '#718096' }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: 18, color: '#718096' }} />
                    )}
                  </ListItemButton>
                </Tooltip>

                {/* Group Child Items */}
                <Collapse in={isGroupOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ mt: 0.25 }}>
                    {group.items.map((item) => {
                      if (item.children && item.children.length > 0) {
                        const isSubOpen = searchTerm ? true : !!openSubMenus[item.text];
                        const hasActiveChild = item.children.some(
                          (c) =>
                            c.path === location.pathname ||
                            c.path === `${location.pathname}${location.search}` ||
                            c.path.split('?')[0] === location.pathname
                        );

                        return (
                          <Box key={item.text} sx={{ mb: 0.4 }}>
                            {/* Sub-sub Menu Header Node (e.g. ТЕСТЫ) */}
                            <Tooltip
                              title={
                                <NavTooltipContent
                                  title={item.text}
                                  description={item.tooltip}
                                  category={group.title}
                                  isGroup
                                />
                              }
                              placement="right"
                              arrow
                              slotProps={tooltipSlotProps}
                            >
                              <ListItemButton
                                onClick={() => toggleSubMenu(item.text)}
                                sx={{
                                  cursor: 'pointer',
                                  borderRadius: '8px',
                                  mb: 0.3,
                                  pl: 3.5,
                                  pr: 1.5,
                                  py: 0.6,
                                  bgcolor: hasActiveChild
                                    ? 'rgba(217, 119, 6, 0.10)'
                                    : isSubOpen
                                    ? 'rgba(217, 119, 6, 0.05)'
                                    : 'transparent',
                                  color: hasActiveChild ? '#B45309' : isSubOpen ? '#92400E' : 'text.primary',
                                  borderLeft: hasActiveChild
                                    ? '4px solid #D97706'
                                    : isSubOpen
                                    ? '4px solid #F59E0B'
                                    : '4px solid transparent',
                                  '&:hover': {
                                    bgcolor: 'rgba(217, 119, 6, 0.08)',
                                    transform: 'translateX(2px)'
                                  },
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <ListItemIcon
                                  sx={{
                                    minWidth: 30,
                                    color: hasActiveChild || isSubOpen ? '#D97706' : '#718096'
                                  }}
                                >
                                  {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Typography
                                      sx={{
                                        fontSize: '0.80rem',
                                        fontWeight: 800,
                                        letterSpacing: '0.3px',
                                        textTransform: 'uppercase',
                                        color: hasActiveChild ? '#B45309' : isSubOpen ? '#92400E' : 'inherit'
                                      }}
                                    >
                                      {item.text}
                                    </Typography>
                                  }
                                />
                                {isSubOpen ? (
                                  <ExpandLess sx={{ fontSize: 17, color: hasActiveChild ? '#D97706' : '#718096' }} />
                                ) : (
                                  <ExpandMore sx={{ fontSize: 17, color: hasActiveChild ? '#D97706' : '#718096' }} />
                                )}
                              </ListItemButton>
                            </Tooltip>

                            {/* Sub-sub Items List */}
                            <Collapse in={isSubOpen} timeout="auto" unmountOnExit>
                              <List component="div" disablePadding sx={{ mt: 0.2 }}>
                                {item.children.map((child) => {
                                  const isChildActive =
                                    location.pathname === child.path ||
                                    `${location.pathname}${location.search}` === child.path;

                                  return (
                                    <Tooltip
                                      title={
                                        <NavTooltipContent
                                          title={child.text}
                                          description={child.tooltip}
                                          isExternal={child.isExternal}
                                          category={`${group.title} / ${item.text}`}
                                        />
                                      }
                                      placement="right"
                                      key={child.text}
                                      arrow
                                      slotProps={tooltipSlotProps}
                                    >
                                      <ListItemButton
                                        onClick={() => handleItemClick(child)}
                                        sx={{
                                          cursor: 'pointer',
                                          borderRadius: '8px',
                                          mb: 0.3,
                                          pl: 5.2, // Nested sub-sub item indentation
                                          pr: 1.5,
                                          py: 0.55,
                                          bgcolor: isChildActive ? 'rgba(15, 60, 100, 0.08)' : 'transparent',
                                          color: isChildActive ? '#0F3C64' : 'text.primary',
                                          borderLeft: isChildActive ? '4px solid #0F3C64' : '4px solid transparent',
                                          '&:hover': {
                                            bgcolor: 'rgba(15, 60, 100, 0.05)',
                                            transform: 'translateX(2px)'
                                          },
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <ListItemIcon
                                          sx={{
                                            minWidth: 26,
                                            color: isChildActive ? '#0F3C64' : '#718096'
                                          }}
                                        >
                                          {child.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                          primary={
                                            <Typography
                                              sx={{
                                                fontSize: '0.79rem',
                                                fontWeight: isChildActive ? 700 : 500,
                                                color: isChildActive ? '#0F3C64' : 'inherit'
                                              }}
                                            >
                                              {child.text}
                                            </Typography>
                                          }
                                        />
                                        {child.isExternal && (
                                          <OpenInNewIcon sx={{ fontSize: 13, color: '#A0AEC0', ml: 'auto' }} />
                                        )}
                                      </ListItemButton>
                                    </Tooltip>
                                  );
                                })}
                              </List>
                            </Collapse>
                          </Box>
                        );
                      }

                      const isActive = location.pathname === item.path;

                      return (
                        <Tooltip
                          title={
                            <NavTooltipContent
                              title={item.text}
                              description={item.tooltip}
                              isExternal={item.isExternal}
                              category={group.title}
                            />
                          }
                          placement="right"
                          key={item.text}
                          arrow
                          slotProps={tooltipSlotProps}
                        >
                          <ListItemButton
                            onClick={() => handleItemClick(item)}
                            sx={{
                              cursor: 'pointer',
                              borderRadius: '8px',
                              mb: 0.4,
                              pl: 3.5, // Indented sub-items
                              pr: 1.5,
                              py: 0.6,
                              bgcolor: isActive ? 'rgba(15, 60, 100, 0.08)' : 'transparent',
                              color: isActive ? '#0F3C64' : 'text.primary',
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
                              primary={
                                <Typography
                                  sx={{
                                    fontSize: '0.82rem',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? '#0F3C64' : 'inherit'
                                  }}
                                >
                                  {item.text}
                                </Typography>
                              }
                            />
                            {item.isExternal && (
                              <OpenInNewIcon sx={{ fontSize: 13, color: '#A0AEC0', ml: 'auto' }} />
                            )}
                          </ListItemButton>
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
              Ничего не найдено
            </Typography>
          )}
        </List>
      </Box>

      {/* Compact System & Database Status Footer */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: '1px solid #E2E8F0',
          bgcolor: '#FAFCFE',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#38A169',
              boxShadow: '0 0 0 2px rgba(56, 161, 105, 0.25)'
            }}
          />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#4A5568', fontSize: '0.72rem' }}>
            SQLite + Firebird
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: '#A0AEC0', fontSize: '0.68rem', fontWeight: 600 }}>
          v1.4.1
        </Typography>
      </Box>
    </Drawer>
  );
}
