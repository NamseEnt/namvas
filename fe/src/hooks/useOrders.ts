import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Order } from "../../../shared/types";

type CreateOrderData = {
  orderItems: Array<{
    artworkId: string;
    quantity: number;
    price: number;
  }>;
  plasticStandCount: number;
  plasticStandPrice: number;
  totalPrice: number;
  naverPaymentId: string;
  recipient: {
    name: string;
    phone: string;
    postalCode: string;
    address: string;
    addressDetail: string;
    memo: string;
  };
};

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  // 주문 생성 기능
  const createOrderMutation = useMutation({
    mutationFn: async (data: CreateOrderData) => {
      const {
        orderItems,
        plasticStandCount,
        plasticStandPrice,
        naverPaymentId,
        recipient,
      } = data;

      return await api.createOrder({
        rows: [
          ...orderItems.map((item) => ({
            item: {
              type: "artwork" as const,
              title: item.artworkId, // buildOrder에서는 artworkId를 title로 사용
              originalImageId: item.artworkId, // 임시로 artworkId 사용
              dpi: 300, // 기본값
              imageCenterXy: { x: 0, y: 0 }, // 기본값
              sideProcessing: { type: "clip" as const }, // 기본값
            },
            count: item.quantity,
            price: item.price,
          })),
          ...(plasticStandCount > 0
            ? [
                {
                  item: { type: "plasticStand" as const },
                  count: plasticStandCount,
                  price: plasticStandPrice,
                },
              ]
            : []),
        ],
        naverPaymentId,
        recipient,
      });
    },
    onSuccess: (response) => {
      // 성공 시 주문 목록에 새 주문 추가 (선택적)
      console.log("Order created successfully:", response.orderId);
    },
    onError: (error) => {
      console.error("Error creating order:", error);
      setError(error as Error);
    },
  });

  const loadOrders = useCallback(async (pageToken?: string) => {
    try {
      setIsLoading(true);
      setError(undefined);
      const response = await api.listMyOrders({
        pageSize: 20,
        nextToken: pageToken,
      });

      if (pageToken) {
        setOrders((prev) => [...prev, ...response.orders]);
      } else {
        setOrders(response.orders);
      }

      setNextToken(response.nextToken);
      setHasMore(!!response.nextToken);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (orderId: string) => {
    try {
      await api.cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: "payment_canceled" as const }
            : order
        )
      );
    } catch (err) {
      console.error("Failed to cancel order:", err);
      throw err;
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) {
      return;
    }
    await loadOrders(nextToken);
  }, [hasMore, isLoading, nextToken, loadOrders]);

  return {
    orders,
    isLoading,
    error,
    hasMore,
    loadOrders,
    loadMore,
    cancelOrder,

    // 새로운 주문 생성 기능
    createOrder: createOrderMutation.mutateAsync,
    isCreatingOrder: createOrderMutation.isPending,
    createOrderError: createOrderMutation.error,
  };
}
