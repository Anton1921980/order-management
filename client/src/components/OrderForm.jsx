import { useState, useMemo, memo } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress,
  Alert,
  Collapse,
  Skeleton
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useAppContext } from '../context/AppContext';
import { createOrder } from '../services/api';

// Memoized product selection component
const ProductSelect = memo(({ field, products, errors, submitting }) => (
  <FormControl fullWidth margin="normal" error={!!errors.productId}>
    <InputLabel id="product-select-label">Product</InputLabel>
    <Select
      {...field}
      labelId="product-select-label"
      id="product-select"
      label="Product"
      disabled={submitting}
    >
      {products.map((product) => (
        <MenuItem key={product._id} value={product._id}>
          {product.name} - ${product.price} (Stock: {product.stock})
        </MenuItem>
      ))}
    </Select>
    {errors.productId && (
      <Typography variant="caption" color="error">
        {errors.productId.message}
      </Typography>
    )}
  </FormControl>
));

// Memoized quantity input component
const QuantityInput = memo(({ field, errors, submitting }) => (
  <TextField
    {...field}
    margin="normal"
    fullWidth
    id="quantity"
    label="Quantity"
    type="number"
    InputProps={{ inputProps: { min: 1 } }}
    error={!!errors.quantity}
    helperText={errors.quantity?.message}
    disabled={submitting}
  />
));

// Memoized balance display component that can show loading state
const BalanceDisplay = memo(({ balance, loading }) => (
  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
    <Typography variant="body2" sx={{ mr: 1 }}>
      Current Balance:
    </Typography>
    {loading ? (
      <Skeleton width={80} height={24} />
    ) : (
      <Typography variant="body2" fontWeight="medium">
        ${balance.toFixed(2)}
      </Typography>
    )}
  </Box>
));

// Memoized cost display component
const CostDisplay = memo(({ totalCost, userBalance, hasStock, loading }) => {
  const insufficientBalance = totalCost > 0 && userBalance < totalCost;
  
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="body1" fontWeight="bold">
        Total Cost: ${totalCost.toFixed(2)}
      </Typography>
      
      {insufficientBalance && !loading && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          Warning: Your balance (${userBalance.toFixed(2)}) is insufficient for this order.
        </Typography>
      )}
      
      {!hasStock && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          Warning: Not enough stock available for this quantity.
        </Typography>
      )}
    </Box>
  );
});

const OrderForm = () => {
  const { 
    currentUser, 
    products, 
    fetchUserOrders, 
    ordersLoading,
    userChangeLoading,
    updateUserBalance
  } = useAppContext();
  
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      productId: '',
      quantity: 1
    }
  });

  // Watch for changes in form values
  const watchProductId = watch('productId');
  const watchQuantity = watch('quantity');

  // Memoize products to prevent unnecessary re-renders
  const memoizedProducts = useMemo(() => products, [products]);

  // Calculate total cost of the order
  const calculateTotalCost = () => {
    if (!watchProductId || !watchQuantity) return 0;
    
    const selectedProduct = memoizedProducts.find(p => p._id === watchProductId);
    if (!selectedProduct) return 0;
    
    return selectedProduct.price * Number(watchQuantity);
  };

  // Memoize the total cost calculation
  const totalCost = useMemo(() => calculateTotalCost(), [watchProductId, watchQuantity, memoizedProducts]);

  // Check if product has enough stock
  const hasEnoughStock = useMemo(() => {
    if (!watchProductId || !watchQuantity) return true;
    
    const selectedProduct = memoizedProducts.find(p => p._id === watchProductId);
    if (!selectedProduct) return true;
    
    return selectedProduct.stock >= Number(watchQuantity);
  }, [watchProductId, watchQuantity, memoizedProducts]);

  // Determine if we're in a loading state
  const isLoading = ordersLoading || userChangeLoading;

  const onSubmit = async (data) => {
    if (!currentUser) return;
    
    // Clear previous error messages
    setErrorMessage('');
    setSubmitting(true);
    setOrderSuccess(false);
    
    // Check if user has enough balance
    const selectedProduct = memoizedProducts.find(p => p._id === data.productId);
    const orderTotalCost = selectedProduct.price * Number(data.quantity);
    
    if (currentUser.balance < orderTotalCost) {
      setErrorMessage(`Insufficient balance. Order total is $${orderTotalCost.toFixed(2)} but your balance is only $${currentUser.balance.toFixed(2)}`);
      setSubmitting(false);
      return;
    }
    
    // Check if product has enough stock
    if (selectedProduct.stock < Number(data.quantity)) {
      setErrorMessage(`Not enough stock. Only ${selectedProduct.stock} units available.`);
      setSubmitting(false);
      return;
    }
    
    try {
      const orderData = {
        userId: currentUser._id,
        productId: data.productId,
        quantity: Number(data.quantity)
      };
      
      await createOrder(orderData);
      
      // Update the user's balance without re-fetching all orders
      await updateUserBalance(currentUser._id);
      
      // Refresh orders list
      fetchUserOrders(currentUser._id);
      
      // Reset form
      reset();
      
      // Show success message
      setOrderSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setOrderSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error creating order:', error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message || 'Failed to create order');
      } else {
        setErrorMessage('Failed to create order. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Please select a user to place an order
        </Typography>
      </Paper>
    );
  }

  // Calculate if balance is insufficient
  const insufficientBalance = totalCost > 0 && currentUser.balance < totalCost;

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Create New Order
      </Typography>
      
      <BalanceDisplay balance={currentUser.balance} loading={isLoading} />
      
      <Collapse in={!!errorMessage}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setErrorMessage('')}
        >
          {errorMessage}
        </Alert>
      </Collapse>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Controller
          name="productId"
          control={control}
          rules={{ required: 'Product is required' }}
          render={({ field }) => (
            <ProductSelect 
              field={field} 
              products={memoizedProducts} 
              errors={errors} 
              submitting={submitting || isLoading} 
            />
          )}
        />
        
        <Controller
          name="quantity"
          control={control}
          rules={{ 
            required: 'Quantity is required',
            min: { value: 1, message: 'Quantity must be at least 1' },
            pattern: { value: /^[0-9]+$/, message: 'Quantity must be a number' }
          }}
          render={({ field }) => (
            <QuantityInput 
              field={field} 
              errors={errors} 
              submitting={submitting || isLoading} 
            />
          )}
        />
        
        {totalCost > 0 && (
          <CostDisplay 
            totalCost={totalCost} 
            userBalance={currentUser.balance} 
            hasStock={hasEnoughStock}
            loading={isLoading}
          />
        )}
        
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting || insufficientBalance || !hasEnoughStock || isLoading}
            sx={{ mr: 2 }}
          >
            {submitting ? <CircularProgress size={24} /> : 'Place Order'}
          </Button>
          
          {orderSuccess && (
            <Typography variant="body2" color="success.main">
              Order placed successfully!
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default memo(OrderForm);
