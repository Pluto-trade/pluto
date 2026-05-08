import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Market, Order, UserBalance, Position } from '@/types/trading';
import { useTradingStore } from '@/store/tradingStore';
import { getUserOrders, getUserOpenOrders } from '@/lib/api/users';

const API_BASE = 'http://localhost:3001';

// ============ QUERIES ============

export const useOpenOrders = () => {
  const { userId } = useTradingStore();

  return useQuery({
    queryKey: ['open-orders', userId],
    queryFn: () => (userId ? getUserOpenOrders(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 2 * 1000,
  });
};

export const useUserOrders = (limit = 100) => {
  const { userId } = useTradingStore();

  return useQuery({
    queryKey: ['user-orders', userId, limit],
    queryFn: () => (userId ? getUserOrders(userId, limit) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 5 * 1000,
  });
};

export const useMarkets = () => {
  return useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/markets`);
      return res.json() as Promise<Market[]>;
    },
    staleTime: 5 * 1000, // 5 seconds
  });
};

export const useBalances = () => {
  return useQuery({
    queryKey: ['balances'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/balances`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return res.json() as Promise<UserBalance[]>;
    },
    staleTime: 3 * 1000, // 3 seconds
  });
};

export const useOrders = (symbol?: string) => {
  return useQuery({
    queryKey: ['orders', symbol],
    queryFn: async () => {
      const url = new URL(`${API_BASE}/orders`);
      if (symbol) url.searchParams.set('symbol', symbol);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return res.json() as Promise<Order[]>;
    },
    staleTime: 2 * 1000, // 2 seconds
  });
};

export const usePositions = () => {
  return useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/positions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return res.json() as Promise<Position[]>;
    },
    staleTime: 2 * 1000,
  });
};

// ============ MUTATIONS ============

export const usePlaceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: {
      symbol: string;
      side: 'BUY' | 'SELL';
      type: 'LIMIT' | 'MARKET';
      price?: number;
      size: number;
    }) => {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      return res.json() as Promise<Order>;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!res.ok) throw new Error('Failed to cancel order');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useClosePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (positionId: string) => {
      const res = await fetch(`${API_BASE}/positions/${positionId}/close`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!res.ok) throw new Error('Failed to close position');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};
