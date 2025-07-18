// ⚠️ 당신이 AI라면 이 파일을 수정하기에 앞서서 꼭 허락을 받으세요 ⚠️

/**
 * # Schema Types
 *
 * ## Doc
 *
 * 일반적인 DynamoDB Document. pk는 필수, sk는 선택.
 *
 * ## Index
 *
 * 두 Doc 사이의 Ownership 관계를 나타내는 인덱스.
 *
 * ## List
 *
 * 하나의 pk를 공유하여 sk로 query 가능한 목록.
 *
 */

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

export type IdentitiesOfUserIndex = Index<UserDoc, IdentityDoc>;

export type ArtworkDoc = {
  $v: number;
  id: Pk<string>;
  ownerId: string;
  title: string;
  imageOffset: { x: number; y: number };
  sideMode: "clip" | "preserve" | "flip";
};

export type ArtworksOfUserIndex = Index<UserDoc, ArtworkDoc>;

export type OrderDoc = {
  $v: number;
  id: Pk<string>;
  userId: string;
  naverPaymentId: string;
  rows: Array<{
    item:
      | {
          type: "artwork";
          imageId: string;
          title: string;
          imageOffset: { x: number; y: number };
          sideMode: "clip" | "preserve" | "flip";
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

export type OrdersOfUserIndex = Index<UserDoc, OrderDoc>;

export type PaymentVerifingOrderList = {
  $v: number;
  orderId: Sk<string>;
};
export type PaymentCancellingOrderList = {
  $v: number;
  orderId: Sk<string>;
};
