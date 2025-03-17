import { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { getUsers, getProducts, getUserOrders } from '../services/api';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  
  // Split loading states for different operations
  const [initialLoading, setInitialLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [userChangeLoading, setUserChangeLoading] = useState(false);
  
  const [error, setError] = useState(null);

  // Fetch users and products on initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      try {
        const [usersData, productsData] = await Promise.all([
          getUsers(),
          getProducts()
        ]);
        
        setUsers(usersData.data.users);
        setProducts(productsData.data.products);
        
        // Set the first user as current user by default if available
        if (usersData.data.users.length > 0) {
          setCurrentUser(usersData.data.users[0]);
          // We'll fetch orders separately to avoid showing loader for everything
          const ordersResponse = await getUserOrders(usersData.data.users[0]._id);
          setOrders(ordersResponse.data.orders);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch initial data');
        console.error('Error fetching initial data:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Update a user's balance without re-fetching all orders
  const updateUserBalance = useCallback(async (userId) => {
    try {
      const updatedUserData = await getUsers();
      const updatedUser = updatedUserData.data.users.find(u => u._id === userId);
      
      if (updatedUser) {
        // Update the user in the users array
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, balance: updatedUser.balance } : user
          )
        );
        
        // Update current user if it's the same user
        if (currentUser && currentUser._id === userId) {
          setCurrentUser(prevUser => ({
            ...prevUser,
            balance: updatedUser.balance
          }));
        }
      }
    } catch (err) {
      console.error('Error updating user balance:', err);
    }
  }, [currentUser]);

  // Fetch orders for a specific user - memoized to prevent unnecessary re-renders
  const fetchUserOrders = useCallback(async (userId) => {
    if (!userId) return;
    
    // Only set loading for orders, not the entire app
    setOrdersLoading(true);
    try {
      const response = await getUserOrders(userId);
      
      // Update orders without triggering unnecessary re-renders
      setOrders(prevOrders => {
        // If the data is the same, don't update state
        if (JSON.stringify(prevOrders) === JSON.stringify(response.data.orders)) {
          return prevOrders;
        }
        return response.data.orders;
      });
      
      // Update the user's balance
      await updateUserBalance(userId);
    } catch (err) {
      setError(err.message || 'Failed to fetch user orders');
      console.error('Error fetching user orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [updateUserBalance]);

  // Change current user - memoized to prevent unnecessary re-renders
  const changeUser = useCallback((userId) => {
    const user = users.find(u => u._id === userId);
    if (user) {
      // Only update if it's actually a different user
      if (!currentUser || currentUser._id !== userId) {
        setUserChangeLoading(true);
        setCurrentUser(user);
        
        // Fetch orders for the new user
        fetchUserOrders(userId).finally(() => {
          setUserChangeLoading(false);
        });
      }
    }
  }, [users, currentUser, fetchUserOrders]);

  // Clear error - memoized to prevent unnecessary re-renders
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    users,
    products,
    currentUser,
    orders,
    initialLoading,
    ordersLoading,
    userChangeLoading,
    error,
    changeUser,
    fetchUserOrders,
    clearError,
    updateUserBalance
  }), [
    users,
    products,
    currentUser,
    orders,
    initialLoading,
    ordersLoading,
    userChangeLoading,
    error,
    changeUser,
    fetchUserOrders,
    clearError,
    updateUserBalance
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
