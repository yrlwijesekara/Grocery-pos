import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Schedule,
  People,
  TrendingUp,
  Assessment,
  AccessTime,
  Edit,
  Refresh,
  Download,
  CalendarToday,
  Timer,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { timeTrackingAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`timetracking-tabpanel-${index}`}
      aria-labelledby={`timetracking-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const TimeTracking: React.FC = () => {
  const { user } = useAuthStore();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [employeeStatus, setEmployeeStatus] = useState<any>(null);
  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    date: new Date().toISOString().split('T')[0],
    clockIn: '09:00',
    clockOut: '17:00',
    reason: ''
  });

  useEffect(() => {
    // Remove permission check temporarily for testing
    loadData();
  }, [user]);

  useEffect(() => {
    // Remove permission check temporarily for testing
    loadAnalytics();
  }, [selectedPeriod, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusResponse, historyResponse] = await Promise.all([
        timeTrackingAPI.getEmployeeStatus(),
        timeTrackingAPI.getWorkHistory({})
      ]);
      setEmployeeStatus(statusResponse.data);
      setWorkHistory(historyResponse.data.workHistory);
    } catch (error) {
      console.error('Error loading time tracking data:', error);
      toast.error('Failed to load time tracking data');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await timeTrackingAPI.getAnalytics(selectedPeriod);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    }
  };

  const handleTimeAdjustment = async () => {
    if (!selectedEmployee || !adjustmentData.reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await timeTrackingAPI.adjustTime({
        employeeId: selectedEmployee.employeeId,
        date: adjustmentData.date,
        clockIn: `${adjustmentData.date}T${adjustmentData.clockIn}:00`,
        clockOut: `${adjustmentData.date}T${adjustmentData.clockOut}:00`,
        reason: adjustmentData.reason
      });
      
      toast.success('Time adjustment saved successfully');
      setShowAdjustDialog(false);
      setAdjustmentData({
        date: new Date().toISOString().split('T')[0],
        clockIn: '09:00',
        clockOut: '17:00',
        reason: ''
      });
      loadData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to adjust time';
      toast.error(message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clocked-in': return 'success';
      case 'clocked-out': return 'default';
      default: return 'default';
    }
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '-';
    }
  };

  // Temporarily remove permission check for testing
  // if (!user?.permissions.canManageUsers) {
  //   return (
  //     <Box>
  //       <Typography variant="h4" gutterBottom>
  //         Work Time Tracking
  //       </Typography>
  //       <Alert severity="warning">
  //         You don't have permission to access work time tracking features.
  //       </Alert>
  //     </Box>
  //   );
  // }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Work Time Tracking
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadData}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="Current Status" />
          <Tab label="Work History" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        {/* Employee Status Overview */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Total Employees
                </Typography>
                <Typography variant="h4" color="primary">
                  {employeeStatus?.summary?.totalEmployees || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Currently Working
                </Typography>
                <Typography variant="h4" color="success.main">
                  {employeeStatus?.summary?.currentlyWorking || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>


          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Cancel sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Clocked Out
                </Typography>
                <Typography variant="h4" color="error.main">
                  {employeeStatus?.summary?.clockedOut || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Employee Status
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Clock In Time</TableCell>
                        <TableCell>Hours Today</TableCell>
                        <TableCell>Performance</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employeeStatus?.employees?.map((employee: any) => (
                        <TableRow key={employee._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {employee.firstName} {employee.lastName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                ID: {employee.employeeId}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={employee.shift.clockedIn ? 'Clocked In' : 'Clocked Out'}
                              color={getStatusColor(employee.shift.clockedIn ? 'clocked-in' : 'clocked-out') as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {formatTime(employee.shift.clockInTime)}
                          </TableCell>
                          <TableCell>
                            {employee.shift.clockedIn && employee.shift.clockInTime ? 
                              formatHours((new Date().getTime() - new Date(employee.shift.clockInTime).getTime()) / (1000 * 60 * 60)) : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="caption" display="block">
                                Sales: {formatCurrency(employee.performance?.totalSales || 0)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Transactions: {employee.performance?.totalTransactions || 0}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Adjust Time">
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setShowAdjustDialog(true);
                                }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* Work History */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Employee Work History
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Total Hours (30d)</TableCell>
                        <TableCell>Total Days</TableCell>
                        <TableCell>Average Hours</TableCell>
                        <TableCell>This Week</TableCell>
                        <TableCell>Last Activity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {workHistory.map((record: any) => (
                        <TableRow key={record.employee._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {record.employee.firstName} {record.employee.lastName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                ID: {record.employee.employeeId}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={record.employee.currentStatus === 'clocked-in' ? 'Working' : 'Off Duty'}
                              color={getStatusColor(record.employee.currentStatus) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {formatHours(record.stats.totalHours)}
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min(100, (record.stats.totalHours / 160) * 100)} 
                                sx={{ mt: 0.5, height: 4 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>{record.stats.totalDays}</TableCell>
                          <TableCell>{formatHours(record.stats.averageHours)}</TableCell>
                          <TableCell>{formatHours(record.stats.currentWeekHours)}</TableCell>
                          <TableCell>
                            {record.employee.currentStatus === 'clocked-in' ? 
                              `In: ${formatTime(record.stats.lastClockIn)}` :
                              record.stats.lastClockOut ? `Out: ${formatTime(record.stats.lastClockOut)}` : '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Analytics */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Period</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                label="Period"
              >
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="quarter">This Quarter</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {analytics && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AccessTime sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Total Hours
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {formatHours(analytics.summary.totalHours)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CalendarToday sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Avg Hours/Day
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {formatHours(analytics.summary.averageHoursPerDay)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <People sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Active Staff
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {analytics.summary.uniqueEmployees}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Employee Performance ({selectedPeriod})
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Employee</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Total Hours</TableCell>
                            <TableCell>Total Days</TableCell>
                            <TableCell>Average Hours</TableCell>
                            <TableCell>Performance</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.values(analytics.byEmployee).map((emp: any) => (
                            <TableRow key={emp.employee.employeeId}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {emp.employee.firstName} {emp.employee.lastName}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  ID: {emp.employee.employeeId}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={emp.employee.role.charAt(0).toUpperCase() + emp.employee.role.slice(1)}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>{formatHours(emp.totalHours)}</TableCell>
                              <TableCell>{emp.totalDays}</TableCell>
                              <TableCell>{formatHours(emp.averageHours)}</TableCell>
                              <TableCell>
                                <Box>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(100, (emp.averageHours / 8) * 100)}
                                    color={emp.averageHours >= 8 ? 'success' : emp.averageHours >= 6 ? 'warning' : 'error'}
                                    sx={{ height: 8, borderRadius: 4 }}
                                  />
                                  <Typography variant="caption" color="textSecondary">
                                    {Math.round((emp.averageHours / 8) * 100)}% of target
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </TabPanel>

      {/* Time Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onClose={() => setShowAdjustDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Work Time</DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Employee: {selectedEmployee.firstName} {selectedEmployee.lastName}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Employee ID: {selectedEmployee.employeeId}
              </Typography>

              <TextField
                fullWidth
                label="Date"
                type="date"
                value={adjustmentData.date}
                onChange={(e) => setAdjustmentData({ ...adjustmentData, date: e.target.value })}
                sx={{ mt: 2, mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Clock In Time"
                    type="time"
                    value={adjustmentData.clockIn}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, clockIn: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Clock Out Time"
                    type="time"
                    value={adjustmentData.clockOut}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, clockOut: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Reason for Adjustment"
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                multiline
                rows={3}
                sx={{ mt: 2 }}
                placeholder="e.g., Forgot to clock out, System error, Manager approval"
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdjustDialog(false)}>Cancel</Button>
          <Button
            onClick={handleTimeAdjustment}
            variant="contained"
            disabled={!adjustmentData.reason.trim()}
          >
            Apply Adjustment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeTracking;