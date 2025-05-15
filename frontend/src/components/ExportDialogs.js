import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import WarningIcon from '@mui/icons-material/Warning';

/**
 * Format selection dialog component for choosing between HTML and JSON export formats
 */
export const FormatSelectionDialog = ({ 
  open, 
  onClose, 
  exportFormat, 
  setExportFormat, 
  colors 
}) => {
  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      aria-labelledby="format-selection-dialog-title"
    >
      <DialogTitle id="format-selection-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
        <FileDownloadIcon sx={{ color: colors.highlightColor, mr: 1 }} />
        Export Format
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please select the export format for your chat:
        </DialogContentText>
        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <RadioGroup
            aria-label="export-format"
            name="export-format"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <FormControlLabel value="html" control={<Radio />} label="HTML" />
            <FormControlLabel value="json" control={<Radio />} label="JSON" />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} color="highlight">
          Cancel
        </Button>
        <Button onClick={() => onClose(true)} color="highlight" variant="contained">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Warning dialog component that appears before exporting
 */
export const ExportWarningDialog = ({ 
  open, 
  onClose, 
  dontShowWarning, 
  setDontShowWarning 
}) => {
  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      aria-labelledby="export-warning-dialog-title"
    >
      <DialogTitle id="export-warning-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
        <WarningIcon sx={{ color: 'warning.main', mr: 1 }} />
        Export Warning
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please make sure your exported chat doesn't include sensitive data such as API keys and customer information.
        </DialogContentText>
        <FormControlLabel
          control={
            <Checkbox
              checked={dontShowWarning}
              onChange={(e) => setDontShowWarning(e.target.checked)}
            />
          }
          label="Don't show this warning again"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => onClose(false)} 
          color="primary"
          sx={{ color: 'white' }}
        >
          Cancel
        </Button>
        <Button onClick={() => onClose(true)} color="highlight" variant="contained">
          Continue Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 