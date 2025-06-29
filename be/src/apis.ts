// IMPORTANT: Any API implementation exceeding 20 lines must be moved to a separate file in the api/ directory
import { ApiSpec } from "shared";
import { getSession, isLoggedIn } from "./session";
import { ApiRequest } from "./types";
import { ddb } from "./__generated/db";
import { loginWithGoogle } from "./api/loginWithGoogle";

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
  loginWithGoogle,
  loginWithTwitter: async ({}, req) => {
    throw new Error("not implemented");
  },
  createOrder: async ({}, req) => {
    throw new Error("not implemented");
  },
  getMyOrders: async ({}, req) => {
    throw new Error("not implemented");
  },
  cancelOrder: async ({}, req) => {
    throw new Error("not implemented");
  },
  getOriginalImageUploadUrl: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminGetDashboard: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminGetOrder: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminGetOrders: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminUpdateOrderStatus: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminGetUsers: async ({}, req) => {
    throw new Error("not implemented");
  },
};

export type Apis = {
  [K in keyof ApiSpec]: (
    params: ApiSpec[K]["req"],
    req: ApiRequest
  ) => Promise<ApiSpec[K]["res"]>;
};
