export type OrderStatus =
  | "payment_completed"
  | "in_production"
  | "shipping"
  | "delivered"
  | "production_hold";

export type Order = {
  id: string;
  orderDate: string;
  status: OrderStatus;
  artwork: Artwork;
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
};

export type Artwork = {
  originalImageS3Key: string;
  mmPerPixel: number;
  imageCenterXy: { x: number; y: number };
  sideProcessing: SideProcessing;
};

export type SideProcessing =
  | {
      type: "clip" | "flip" | "none";
    }
  | {
      type: "color";
      color: string;
    };

export enum IdentityProvider {
  GOOGLE = "google",
  TWITTER = "twitter",
}
