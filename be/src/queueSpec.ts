// 큐 메시지 스펙 정의 (ApiSpec 구조 차용)
export type QueueSpec = {
  processPayment: {
    req: {
      orderId: string;
      naverPaymentId: string;
    };
  };
  sendEmail: {
    req: {
      to: string;
      subject: string;
      body: string;
    };
  };
  processRefund: {
    req: {
      orderId: string;
      amount: number;
      reason: string;
    };
  };
  sendNotification: {
    req: {
      userId: string;
      title: string;
      message: string;
      type: "info" | "warning" | "error";
    };
  };
};

// 큐 메시지 메타데이터
export type QueueMessageMetadata = {
  messageId: string;
  timestamp: string;
  retryCount: number;
  priority: "high" | "medium" | "low";
  source?: string;
};

// 큐 메시지 기본 구조
export type QueueMessage<T extends keyof QueueSpec> = {
  type: T;
  data: QueueSpec[T]["req"];
  metadata: QueueMessageMetadata;
};

// 타입 안전한 메시지 생성 헬퍼
export function createQueueMessage<T extends keyof QueueSpec>(
  type: T,
  data: QueueSpec[T]["req"],
  options: Partial<Pick<QueueMessageMetadata, "priority" | "source">> = {}
): QueueMessage<T> {
  return {
    type,
    data,
    metadata: {
      messageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      priority: options.priority || "medium",
      source: options.source || "api",
    },
  };
}