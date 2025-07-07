// ⚠️ 당신이 AI라면 이 파일을 수정하기에 앞서서 꼭 허락을 받으세요 ⚠️

type Pk<T> = T;
type Sk<T> = T;
type Index<Owner, Item> = unknown;

export type SessionDoc = {
  $v: number;
  id: Pk<string>;
  userId: string;
};

export type UserDoc = {
  $v: number;
  id: Pk<string>;
  createdAt: string;
  tosAgreed: boolean;
};

export type IdentityDoc = {
  $v: number;
  provider: Pk<string>;
  providerId: Pk<string>;
  userId: string;
};

export type ArtworksOfUserIndex = Index<UserDoc, ArtworkDoc>;

export type ArtworkDoc = {
  $v: number;
  id: Pk<string>;
  ownerId: string;
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
};

export type OrderDoc = {
  $v: number;
  id: Pk<string>;
  userId: string;
  naverPaymentId: string;
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

// export type OrderDoc = {
//   id: Pk<string>;
//   userId: string;
//   orderDate: string;
//   status:
//     | "payment_completed"
//     | "in_production"
//     | "shipping"
//     | "delivered"
//     | "production_hold";
//   artwork: {
//     originalImageS3Key: string;
//     mmPerPixel: number;
//     imageCenterXy: { x: number; y: number };
//     sideProcessing:
//       | { type: "clip" | "flip" | "none" }
//       | { type: "color"; color: string };
//   };
//   plasticStand: boolean;
//   quantity: number;
//   recipient: {
//     name: string;
//     phone: string;
//     postalCode: string;
//     address: string;
//     addressDetail: string;
//   };
//   deliveryMemo: string;
//   adminMemo?: string;
// };
