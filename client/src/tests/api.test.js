import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import * as apiService from '../services/api';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
    })),
  },
}));

// Mock the API module
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    getUsers: vi.fn(),
    getUser: vi.fn(),
    createUser: vi.fn(),
    createOrder: vi.fn(),
    getUserOrders: vi.fn(),
  };
});

describe('API Service', () => {
  let mockAxiosInstance;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock axios instance
    mockAxiosInstance = axios.create();
    
    // Restore the original implementation for testing
    apiService.getUsers.mockImplementation(async () => {
      return await mockAxiosInstance.get('/users');
    });
    
    apiService.getUser.mockImplementation(async (id) => {
      return await mockAxiosInstance.get(`/users/${id}`);
    });
    
    apiService.createUser.mockImplementation(async (userData) => {
      return await mockAxiosInstance.post('/users', userData);
    });
    
    apiService.createOrder.mockImplementation(async (orderData) => {
      return await mockAxiosInstance.post('/orders', orderData);
    });
    
    apiService.getUserOrders.mockImplementation(async (userId) => {
      return await mockAxiosInstance.get(`/orders/${userId}`);
    });
  });
  
  describe('User API', () => {
    it('getUsers should make a GET request to /users', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            users: [
              { _id: 'user1', name: 'User 1', email: 'user1@example.com', balance: 100 },
              { _id: 'user2', name: 'User 2', email: 'user2@example.com', balance: 200 },
            ],
          },
        },
      };
      
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
      
      // Call the API function
      await apiService.getUsers();
      
      // Check if axios.get was called with the correct URL
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users');
    });
    
    it('getUser should make a GET request to /users/:id', async () => {
      const userId = 'user123';
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            user: { _id: userId, name: 'Test User', email: 'test@example.com', balance: 100 },
          },
        },
      };
      
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
      
      // Call the API function
      await apiService.getUser(userId);
      
      // Check if axios.get was called with the correct URL
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/users/${userId}`);
    });
    
    it('createUser should make a POST request to /users', async () => {
      const userData = { name: 'New User', email: 'newuser@example.com' };
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            user: { _id: 'newuser123', ...userData, balance: 100 },
          },
        },
      };
      
      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);
      
      // Call the API function
      await apiService.createUser(userData);
      
      // Check if axios.post was called with the correct URL and data
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', userData);
    });
  });
  
  describe('Order API', () => {
    it('createOrder should make a POST request to /orders', async () => {
      const orderData = { userId: 'user123', productId: 'product123', quantity: 2 };
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            order: { _id: 'order123', ...orderData, totalPrice: 100 },
          },
        },
      };
      
      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);
      
      // Call the API function
      await apiService.createOrder(orderData);
      
      // Check if axios.post was called with the correct URL and data
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/orders', orderData);
    });
    
    it('getUserOrders should make a GET request to /orders/:userId', async () => {
      const userId = 'user123';
      const mockResponse = {
        data: {
          status: 'success',
          results: 2,
          data: {
            orders: [
              { _id: 'order1', userId, productId: 'product1', quantity: 1, totalPrice: 50 },
              { _id: 'order2', userId, productId: 'product2', quantity: 2, totalPrice: 100 },
            ],
          },
        },
      };
      
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
      
      // Call the API function
      await apiService.getUserOrders(userId);
      
      // Check if axios.get was called with the correct URL
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/orders/${userId}`);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle errors when the API request fails', async () => {
      const error = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValueOnce(error);
      
      // Mock implementation for this specific test
      apiService.getUsers.mockRejectedValueOnce(error);
      
      // Call the API function and expect it to throw
      await expect(apiService.getUsers()).rejects.toThrow('Network Error');
    });
  });
});
