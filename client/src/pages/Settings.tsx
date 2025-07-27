import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { 
  Settings as SettingsIcon, 
  Notifications, 
  Security, 
  Print,
  ExpandMore,
  Visibility,
  Store,
  Payment,
  Receipt,
  Backup,
  Update,
  AdminPanelSettings,
  Group,
  Assessment,
  ColorLens,
  Language,
  Schedule,
  LocalShipping,
  AccountBalance,
  Loyalty
} from '@mui/icons-material';

const Settings: React.FC = () => {
  const [showFullSettings, setShowFullSettings] = useState(false);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          System Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Visibility />}
          onClick={() => setShowFullSettings(true)}
          size="large"
        >
          View All Settings
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Settings are configured by system administrators and managers.
          </Alert>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                POS Settings
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Auto-print receipts"
                    secondary="Automatically print receipts after each transaction"
                  />
                  <Switch defaultChecked />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText
                    primary="Low stock alerts"
                    secondary="Show notifications when items are low in stock"
                  />
                  <Switch defaultChecked />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary="Age verification prompts"
                    secondary="Prompt for ID verification on restricted items"
                  />
                  <Switch defaultChecked />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hardware Settings
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Print />
                  </ListItemIcon>
                  <ListItemText
                    primary="Receipt printer"
                    secondary="Status: Connected"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Scale integration"
                    secondary="Status: Connected"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Barcode scanner"
                    secondary="Status: Active"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Full Settings Dialog */}
      <Dialog 
        open={showFullSettings} 
        onClose={() => setShowFullSettings(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SettingsIcon />
            Complete System Settings
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            
            {/* Store Information */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Store />
                  <Typography variant="h6">Store Information</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Store Name" defaultValue="Grocery Store POS" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Store ID" defaultValue="STORE001" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Phone Number" defaultValue="(555) 123-4567" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email" defaultValue="store@grocery.com" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Address" defaultValue="123 Main Street, City, State 12345" multiline rows={2} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* POS Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <SettingsIcon />
                  <Typography variant="h6">POS Configuration</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem>
                    <ListItemIcon><Print /></ListItemIcon>
                    <ListItemText primary="Auto-print receipts" secondary="Automatically print receipts after each transaction" />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Notifications /></ListItemIcon>
                    <ListItemText primary="Low stock alerts" secondary="Show notifications when items are low in stock" />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Security /></ListItemIcon>
                    <ListItemText primary="Age verification prompts" secondary="Prompt for ID verification on restricted items" />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Schedule /></ListItemIcon>
                    <ListItemText primary="Auto-logout timer" secondary="Automatically log out inactive users" />
                    <Switch />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Payment Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Payment />
                  <Typography variant="h6">Payment Configuration</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Default Payment Method</InputLabel>
                      <Select defaultValue="cash" label="Default Payment Method">
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="card">Credit/Debit Card</MenuItem>
                        <MenuItem value="mobile">Mobile Payment</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Cash Drawer Alert Amount" defaultValue="500.00" type="number" />
                  </Grid>
                  <Grid item xs={12}>
                    <List>
                      <ListItem>
                        <ListItemText primary="Accept Cash Payments" />
                        <Switch defaultChecked />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Accept Credit Cards" />
                        <Switch defaultChecked />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Accept EBT/SNAP" />
                        <Switch defaultChecked />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Accept Mobile Payments" />
                        <Switch />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Tax Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <AccountBalance />
                  <Typography variant="h6">Tax Configuration</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Sales Tax Rate (%)" defaultValue="8.25" type="number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Tax ID Number" defaultValue="TX123456789" />
                  </Grid>
                  <Grid item xs={12}>
                    <List>
                      <ListItem>
                        <ListItemText primary="Tax-inclusive pricing" secondary="Display prices with tax included" />
                        <Switch />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Apply tax to all items" secondary="Automatically apply tax to taxable items" />
                        <Switch defaultChecked />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Loyalty Program */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Loyalty />
                  <Typography variant="h6">Loyalty Program</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Points per $1 spent" defaultValue="1" type="number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth 
                      label="Point redemption value ($)" 
                      defaultValue="0.01" 
                      type="number" 
                      inputProps={{ step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Tier Requirements (Total Spending)</Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={3}>
                        <TextField fullWidth label="Bronze" defaultValue="0" type="number" size="small" />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField fullWidth label="Silver" defaultValue="1000" type="number" size="small" />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField fullWidth label="Gold" defaultValue="2500" type="number" size="small" />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField fullWidth label="Platinum" defaultValue="5000" type="number" size="small" />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Receipt Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Receipt />
                  <Typography variant="h6">Receipt Configuration</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Receipt Footer Message" defaultValue="Thank you for shopping with us!" multiline rows={3} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Receipt Size</InputLabel>
                      <Select defaultValue="80mm" label="Receipt Size">
                        <MenuItem value="58mm">58mm</MenuItem>
                        <MenuItem value="80mm">80mm</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Copies to Print" defaultValue="1" type="number" />
                  </Grid>
                  <Grid item xs={12}>
                    <List>
                      <ListItem>
                        <ListItemText primary="Print store logo" />
                        <Switch defaultChecked />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Print barcode on receipt" />
                        <Switch />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Print loyalty points on receipt" />
                        <Switch defaultChecked />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* User Management */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Group />
                  <Typography variant="h6">User Management</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem>
                    <ListItemText primary="Require password changes every 90 days" />
                    <Switch />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Enable two-factor authentication" />
                    <Switch />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Auto-lock after failed login attempts" />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Log user activities" />
                    <Switch defaultChecked />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            {/* System Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <AdminPanelSettings />
                  <Typography variant="h6">System Configuration</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select defaultValue="en" label="Language">
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select defaultValue="light" label="Theme">
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="auto">Auto</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <List>
                      <ListItem>
                        <ListItemIcon><Backup /></ListItemIcon>
                        <ListItemText primary="Auto-backup enabled" secondary="Backup system data daily at 2 AM" />
                        <Switch defaultChecked />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Update /></ListItemIcon>
                        <ListItemText primary="Automatic updates" secondary="Install security updates automatically" />
                        <Switch />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Hardware Status */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Assessment />
                  <Typography variant="h6">Hardware Status</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem>
                    <ListItemIcon><Print /></ListItemIcon>
                    <ListItemText primary="Receipt Printer" secondary="Model: Epson TM-T88VI" />
                    <Chip label="Connected" color="success" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText primary="Scale Integration" secondary="Model: Toledo Scale" />
                    <Chip label="Connected" color="success" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText primary="Barcode Scanner" secondary="Model: Honeywell Voyager" />
                    <Chip label="Active" color="success" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Payment /></ListItemIcon>
                    <ListItemText primary="Card Reader" secondary="Model: Ingenico iCT250" />
                    <Chip label="Ready" color="success" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText primary="Cash Drawer" secondary="Model: APG Series 4000" />
                    <Chip label="Closed" color="default" size="small" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFullSettings(false)}>Close</Button>
          <Button variant="contained" onClick={() => setShowFullSettings(false)}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;