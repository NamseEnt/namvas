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
  id: string;
  title: string;
  originalImageId: string;
  dpi: number;
  imageCenterXy: { x: number; y: number };
  sideProcessing: SideProcessing;
  thumbnailId: string;
  createdAt: string;
  canvasBackgroundColor: string;
};

export type SideProcessing =
  | {
      type: "clip" | "flip" | "none";
    }
  | {
      type: "color";
      color: string;
    };

export type SavedArtwork = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  artwork: Artwork & {
    canvasBackgroundColor: string;
  };
  thumbnailS3Key: string;
};

export enum IdentityProvider {
  GOOGLE = "google",
  TWITTER = "twitter",
}
