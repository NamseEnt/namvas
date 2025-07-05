import { Artwork } from "shared/types";

type Pk<T> = T;
type Sk<T> = T;
type Index<Owner, Item> = unknown;

export type SessionDoc = {
  id: Pk<string>;
  userId: string;
  $v: number;
};

export type UserDoc = {
  id: Pk<string>;
  createdAt: string;
  tosAgreed: boolean;
  $v: number;
};

export type IdentityDoc = {
  provider: Pk<string>;
  providerId: Pk<string>;
  userId: string;
  $v: number;
};

export type ArtworksOfUserIndex = Index<UserDoc, ArtworkDoc>;

export type ArtworkDoc = {
  id: Pk<string>;
  userId: string;
  artwork: Artwork;
  $v: number;
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
