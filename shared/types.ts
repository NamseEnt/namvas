export type OrderStatus =
  | "payment_pending"
  | "payment_completed"
  | "payment_failed"
  | "in_production"
  | "shipping"
  | "delivered"
  | "production_hold";

export type Order = {
  id: string;
  rows: Array<{
    item:
      | {
          type: "artwork";
          title: string;
          originalImageId: string;
          dpi: number;
          imageCenterXy: { x: number; y: number };
          sideProcessing:
            | {
                type: "clip" | "flip" | "none";
              }
            | {
                type: "color";
                color: string;
              };
        }
      | {
          type: "plasticStand";
        };
    count: number;
    price: number;
  }>;
  recipient: {
    name: string;
    phone: string;
    postalCode: string;
    address: string;
    addressDetail: string;
    memo: string;
  };
  status:
    | "payment_pending"
    | "payment_completed"
    | "payment_failed"
    | "in_production"
    | "shipping"
    | "delivered";
  logs: Array<{
    type:
      | "payment_pending"
      | "payment_completed"
      | "payment_failed"
      | "production_started"
      | "production_completed"
      | "shipment_registered"
      | "package_picked_up"
      | "package_delivered";
    timestamp: string;
    message: string;
  }>;
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
