import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  ShoppingCart,
  Inventory,
  People,
  Assessment,
  Settings,
  Schedule,
  ExitToApp,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, clockIn, clockOut } = useAuthStore();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const menuItems = [
    { text: 'POS Terminal', icon: <ShoppingCart />, path: '/pos' },
    { text: 'Inventory', icon: <Inventory />, path: '/inventory', permission: 'canManageInventory' },
    { text: 'Customers', icon: <People />, path: '/customers' },
    { text: 'Reports', icon: <Assessment />, path: '/reports', permission: 'canViewReports' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const handleClockToggle = () => {
    if (user?.shift.clockedIn) {
      clockOut();
    } else {
      clockIn();
    }
    handleMenuClose();
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.permission) return true;
    return user?.permissions[item.permission as keyof typeof user.permissions];
  });

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Grocery POS System
          </Typography>
          
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={<Schedule />}
                label={user.shift.clockedIn ? 'Clocked In' : 'Clocked Out'}
                color={user.shift.clockedIn ? 'success' : 'default'}
                size="small"
              />
              
              <Chip
                label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                color="primary"
                size="small"
              />
              
              <IconButton
                size="large"
                edge="end"
                aria-label="account menu"
                onClick={handleMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user.firstName[0]}{user.lastName[0]}
                </Avatar>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled>
                  <Typography variant="subtitle2">
                    {user.firstName} {user.lastName}
                  </Typography>
                </MenuItem>
                <MenuItem disabled>
                  <Typography variant="caption" color="textSecondary">
                    ID: {user.employeeId}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleClockToggle}>
                  <ListItemIcon>
                    <Schedule fontSize="small" />
                  </ListItemIcon>
                  {user.shift.clockedIn ? 'Clock Out' : 'Clock In'}
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToApp fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {filteredMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;