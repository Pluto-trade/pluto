import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiMarket, Order, Position } from '@/types/trading';
import { useTradingStore } from '@/store/tradingStore';
import { getUserOrders, getUserOpenOrders, getUserProfile } from '@/lib/api/users';
import { getUserBalances } from '@/lib/api/balances';
import {
  cancelOrder,
  placeOrder,
  type PlaceOrderPayload,
  type PlaceOrderResponse,
} from '@/lib/api/orders';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ============ QUERIES ============

export const useOpenOrders = () => {
  const userId = useTradingStore((state) => state.userId);

  return useQuery({
    queryKey: ['open-orders', userId],
    queryFn: () => (userId ? getUserOpenOrders(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 2 * 1000,
  });
};

export const useUserOrders = (limit = 100) => {
  const userId = useTradingStore((state) => state.userId);

  return useQuery({
    queryKey: ['user-orders', userId, limit],
    queryFn: () => (userId ? getUserOrders(userId, limit) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 5 * 1000,
  });
};

export const useUserProfile = () => {
  const userId = useTradingStore((state) => state.userId);

  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => (userId ? getUserProfile(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 5 * 1000,
  });
};

export const useMarkets = () => {
  return useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/markets`);
      return res.json() as Promise<ApiMarket[]>;
    },
    staleTime: 5 * 1000, // 5 seconds
  });
};

export const useBalances = () => {
  const userId = useTradingStore((state) => state.userId);

  return useQuery({
    queryKey: ['balances', userId],
    queryFn: () => (userId ? getUserBalances(userId) : Promise.resolve([])),
    enabled: !!userId,
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
    mutationFn: (orderData: PlaceOrderPayload): Promise<PlaceOrderResponse> =>
      placeOrder(orderData),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['open-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: string | { orderId: string; baseMint?: string; quoteMint?: string; userPubkey?: string }) =>
      typeof input === 'string' ? cancelOrder(input) : cancelOrder(input.orderId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['open-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
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
