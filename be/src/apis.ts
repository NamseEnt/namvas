// IMPORTANT: Any API implementation exceeding 20 lines must be moved to a separate file in the api/ directory
// NOTE: Use dynamic imports for all API modules to improve performance and reduce bundle size
import { ApiSpec } from "shared";
import { getSession } from "./session";
import { ApiRequest } from "./types";
import { ddb } from "./__generated/db";

export const apis: Apis = {
  getMe: async ({}, req) => {
    const session = await getSession(req);
    if (!session) {
      return { ok: false, reason: "NOT_LOGGED_IN" };
    }
    const user = await ddb.getUser({ id: session.userId });
    if (!user) {
      return { ok: false, reason: "NOT_LOGGED_IN" };
    }
    return { ok: true, tosAgreed: user.tosAgreed };
  },
  logOut: async ({}, req) => {
    const session = await getSession(req);
    if (!session) {
      return { ok: true };
    }
    await ddb.deleteSession({ id: session.id });
    delete req.cookies.sessionId;
    return { ok: true };
  },
  // Use dynamic imports for better performance and code splitting
  loginWithGoogle: async (params, req) => (await import("./api/loginWithGoogle")).loginWithGoogle(params, req),
  loginWithTwitter: async (params, req) => (await import("./api/loginWithTwitter")).loginWithTwitter(params, req),
  getOriginalImageUploadUrl: async (params, req) => (await import("./api/getOriginalImageUploadUrl")).getOriginalImageUploadUrl(params, req),
  createOrder: async (params, req) => (await import("./api/createOrder")).createOrder(params, req),
  getMyOrders: async (params, req) => (await import("./api/getMyOrders")).getMyOrders(params, req),
  cancelOrder: async (params, req) => (await import("./api/cancelOrder")).cancelOrder(params, req),
  adminGetDashboard: async (params, req) => (await import("./api/adminGetDashboard")).adminGetDashboard(params, req),
  adminGetOrder: async (params, req) => (await import("./api/adminGetOrder")).adminGetOrder(params, req),
  adminGetOrders: async (params, req) => (await import("./api/adminGetOrders")).adminGetOrders(params, req),
  adminUpdateOrderStatus: async (params, req) => (await import("./api/adminUpdateOrderStatus")).adminUpdateOrderStatus(params, req),
  adminGetUsers: async (params, req) => (await import("./api/adminGetUsers")).adminGetUsers(params, req),
  saveArtwork: async (params, req) => (await import("./api/saveArtwork")).saveArtwork(params, req),
  getMyArtworks: async (params, req) => (await import("./api/getMyArtworks")).getMyArtworks(params, req),
  updateArtwork: async (params, req) => (await import("./api/updateArtwork")).updateArtwork(params, req),
  deleteArtwork: async (params, req) => (await import("./api/deleteArtwork")).deleteArtwork(params, req),
  duplicateArtwork: async (params, req) => (await import("./api/duplicateArtwork")).duplicateArtwork(params, req),
};

export type Apis = {
  [K in keyof ApiSpec]: (
    params: ApiSpec[K]["req"],
    req: ApiRequest
  ) => Promise<ApiSpec[K]["res"]>;
};
