import { useMemo, memo } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  Skeleton
} from '@mui/material';
import { useAppContext } from '../context/AppContext';

// Memoized TableRow component to prevent re-rendering when other rows change
const MemoizedOrderRow = memo(({ order }) => {
  return (
    <TableRow>
      <TableCell component="th" scope="row" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {order._id}
      </TableCell>
      <TableCell>{order.productId?.name || 'Unknown Product'}</TableCell>
      <TableCell align="right">{order.quantity}</TableCell>
      <TableCell align="right">
        ${order.productId?.price?.toFixed(2) || 'N/A'}
      </TableCell>
      <TableCell align="right">${order.totalPrice.toFixed(2)}</TableCell>
      <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
    </TableRow>
  );
});

// Loading row for when orders are being fetched
const LoadingRow = memo(() => (
  <TableRow>
    <TableCell colSpan={6}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography variant="body2">Updating orders...</Typography>
      </Box>
    </TableCell>
  </TableRow>
));

// Memoized table header to prevent re-rendering
const TableHeader = memo(() => (
  <TableHead>
    <TableRow>
      <TableCell>Order ID</TableCell>
      <TableCell>Product</TableCell>
      <TableCell align="right">Quantity</TableCell>
      <TableCell align="right">Price</TableCell>
      <TableCell align="right">Total</TableCell>
      <TableCell>Date</TableCell>
    </TableRow>
  </TableHead>
));

// Memoized user info component with balance that can update independently
const UserInfo = memo(({ user, loading }) => (
  <>
    <Typography variant="h6" gutterBottom>
      {user.name}'s Orders
    </Typography>
    
    <Box sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
      {loading ? (
        <>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Current Balance:
          </Typography>
          <Skeleton width={80} height={24} />
        </>
      ) : (
        <Typography variant="body2">
          Current Balance: ${user.balance.toFixed(2)}
        </Typography>
      )}
    </Box>
  </>
));

// Empty state component
const EmptyState = memo(({ user, loading }) => (
  <Paper elevation={3} sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>
      No orders found for {user.name}
    </Typography>
    
    <Box sx={{ mt: 2, mb: 2 }}>
      {loading ? (
        <Skeleton width={180} height={24} />
      ) : (
        <Typography variant="body2">
          Current Balance: ${user.balance.toFixed(2)}
        </Typography>
      )}
    </Box>
  </Paper>
));

const OrdersTable = () => {
  const { 
    orders, 
    currentUser, 
    initialLoading,
    ordersLoading,
    userChangeLoading
  } = useAppContext();

  // Memoize the orders array to prevent unnecessary re-renders
  const memoizedOrders = useMemo(() => orders, [orders]);
  
  // Determine if we're loading anything
  const isLoading = ordersLoading || userChangeLoading;

  if (!currentUser) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Please select a user to view orders
        </Typography>
      </Paper>
    );
  }

  if (initialLoading) {
    return (
      <Paper elevation={3} sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (memoizedOrders.length === 0) {
    return <EmptyState user={currentUser} loading={isLoading} />;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <UserInfo user={currentUser} loading={isLoading} />
      
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHeader />
          <TableBody>
            {isLoading ? (
              <LoadingRow />
            ) : (
              memoizedOrders.map((order) => (
                <MemoizedOrderRow key={order._id} order={order} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default memo(OrdersTable);
