import { Alert, Snackbar } from '@mui/material';
import { useAppContext } from '../context/AppContext';

const ErrorAlert = () => {
  const { error, clearError } = useAppContext();

  const handleClose = () => {
    clearError();
  };

  return (
    <Snackbar
      open={!!error}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
        {error}
      </Alert>
    </Snackbar>
  );
};

export default ErrorAlert;
