type Pk<T> = T;

export type Session = {
  id: Pk<string>;
  userId: string;
};

export type User = {
  id: Pk<string>;
  createdAt: string;
  tosAgreed: boolean;
};

export type Identity = {
  provider: Pk<string>;
  providerId: Pk<string>;
  userId: string;
};

export type Order = {
  id: Pk<string>;
  userId: string;
  orderDate: string;
  status: "payment_completed" | "in_production" | "shipping" | "delivered" | "production_hold";
  artwork: {
    originalImageS3Key: string;
    mmPerPixel: number;
    imageCenterXy: { x: number; y: number };
    sideProcessing: 
      | { type: "clip" | "flip" | "none" }
      | { type: "color"; color: string };
  };
  plasticStand: boolean;
  quantity: number;
  recipient: {
    name: string;
    phone: string;
    postalCode: string;
    address: string;
    addressDetail: string;
  };
  deliveryMemo: string;
  adminMemo?: string;
};
