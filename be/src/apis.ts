// IMPORTANT: Any API implementation must be implemented in a separate file in the api/ directory
// NOTE: Use dynamic imports for all API modules to improve performance and reduce bundle size
import { ApiSpec } from "shared";
import { ApiRequest } from "./types";

export const apis: Apis = {
  getMe: async (params, req) =>
    (await import("./api/getMe")).getMe(params, req),
  logOut: async (params, req) =>
    (await import("./api/logOut")).logOut(params, req),
  // Use dynamic imports for better performance and code splitting
  loginWithGoogle: async (params, req) =>
    (await import("./api/loginWithGoogle")).loginWithGoogle(params, req),
  loginWithTwitter: async (params, req) =>
    (await import("./api/loginWithTwitter")).loginWithTwitter(params, req),
  getOriginalImageUploadUrl: async (params, req) =>
    (await import("./api/getOriginalImageUploadUrl")).getOriginalImageUploadUrl(
      params,
      req
    ),
  createOrder: async (params, req) =>
    (await import("./api/createOrder")).createOrder(params, req),
  listMyOrders: async (params, req) =>
    (await import("./api/listMyOrders")).listMyOrders(params, req),
  cancelOrder: async (params, req) =>
    (await import("./api/cancelOrder")).cancelOrder(params, req),
  newArtwork: async (params, req) =>
    (await import("./api/newArtwork")).newArtwork(params, req),
  listMyArtworks: async (params, req) =>
    (await import("./api/listMyArtworks")).listMyArtworks(params, req),
  updateArtwork: async (params, req) =>
    (await import("./api/updateArtwork")).updateArtwork(params, req),
  deleteArtwork: async (params, req) =>
    (await import("./api/deleteArtwork")).deleteArtwork(params, req),
  duplicateArtwork: async (params, req) =>
    (await import("./api/duplicateArtwork")).duplicateArtwork(params, req),
  loginDev: async (params, req) =>
    (await import("./api/loginDev")).loginDev(params, req),
};

export type Apis = {
  [K in keyof ApiSpec]: (
    params: ApiSpec[K]["req"],
    req: ApiRequest
  ) => Promise<ApiSpec[K]["res"]>;
};
