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
    | "payment_verifing"
    | "payment_failed"
    | "waiting_start_production"
    | "in_production"
    | "shipping"
    | "delivered"
    | "payment_cancelling"
    | "payment_canceled"
    | "payment_cancel_rejected";
  logs: Array<{
    type:
      | "order_arrived"
      | "payment_verification_failed"
      | "payment_verification_completed"
      | "production_started"
      | "production_completed"
      | "shipment_registered"
      | "package_picked_up"
      | "package_delivered"
      | "order_cancel_requested"
      | "payment_canceled"
      | "payment_cancel_rejected";
    timestamp: string;
    message: string;
  }>;
};

export type Artwork = {
  id: string;
  title: string;
  imageOffset: { x: number; y: number };
  sideMode: SideMode;
};

export enum SideMode {
  CLIP = "clip",
  PRESERVE = "preserve",
  FLIP = "flip",
}

export type SavedArtwork = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  artwork: Artwork & {
    canvasBackgroundColor: string;
  };
};

export enum IdentityProvider {
  GOOGLE = "google",
  TWITTER = "twitter",
}
