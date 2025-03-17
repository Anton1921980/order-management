import { Container, Typography, Box, CircularProgress } from '@mui/material';
import OrderForm from '../components/OrderForm';
import OrdersTable from '../components/OrdersTable';
import { useAppContext } from '../context/AppContext';

const HomePage = () => {
  const { loading } = useAppContext();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading data...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <OrderForm />
      </Box>
      <OrdersTable />
    </Container>
  );
};

export default HomePage;
