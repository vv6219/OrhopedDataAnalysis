import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography, Box, Tooltip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventIcon from '@mui/icons-material/Event';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 260;

const menuItems = [
  { text: 'BI Дашборд', icon: <DashboardIcon />, path: '/', tooltip: 'Открыть аналитическую панель' },
  { text: 'Оформление пациента', icon: <LocalHospitalIcon />, path: '/checkout', tooltip: 'Оформить новый визит' },
  { text: 'Пациенты (ЭМК)', icon: <PeopleIcon />, path: '/patients', tooltip: 'Просмотр электронных карт' },
  { text: 'Расписание', icon: <EventIcon />, path: '/scheduling', tooltip: 'Календарь и расписание' },
  { text: 'Каталог операций', icon: <LocalHospitalIcon />, path: '/operations', tooltip: 'Справочник процедур' },
  { text: 'Склад материалов', icon: <InventoryIcon />, path: '/inventory', tooltip: 'Управление запасами' },
  { text: 'Отчеты', icon: <AssessmentIcon />, path: '/reports', tooltip: 'Генерация PDF отчетов' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar sx={{ height: 100, display: 'flex', alignItems: 'center', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }} onClick={() => navigate('/')}>
          <Tooltip title="На главную">
            <img src="/MainLogoTransparent.png" alt="Логотип" style={{ width: 50, height: 50, marginRight: 12 }} />
          </Tooltip>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2, fontSize: '0.85rem' }}>
              Центр Ортопедии
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2, fontSize: '0.85rem' }}>
              и Травматологии
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#156C9C', lineHeight: 1.2, mt: 0.5 }}>
              Добрушкина
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 500, color: '#4A5568', lineHeight: 1.2 }}>
              в Сочи
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <Tooltip title={item.tooltip} placement="right" key={item.text} arrow>
              <ListItem button onClick={() => navigate(item.path)} sx={{ cursor: 'pointer' }}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
