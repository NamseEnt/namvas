// IMPORTANT: Any API implementation exceeding 20 lines must be moved to a separate file in the api/ directory
import { ApiSpec } from "shared";
import { getSession } from "./session";
import { ApiRequest } from "./types";
import { ddb } from "./__generated/db";
import { loginWithGoogle } from "./api/loginWithGoogle";
import { loginWithTwitter } from "./api/loginWithTwitter";
import { getOriginalImageUploadUrl } from "./api/getOriginalImageUploadUrl";
import { createOrder } from "./api/createOrder";
import { getMyOrders } from "./api/getMyOrders";
import { cancelOrder } from "./api/cancelOrder";
import { adminGetDashboard } from "./api/adminGetDashboard";
import { adminGetOrder } from "./api/adminGetOrder";
import { adminGetOrders } from "./api/adminGetOrders";
import { adminUpdateOrderStatus } from "./api/adminUpdateOrderStatus";
import { adminGetUsers } from "./api/adminGetUsers";

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
  loginWithTwitter,
  getOriginalImageUploadUrl,
  createOrder,
  getMyOrders,
  cancelOrder,
  adminGetDashboard,
  adminGetOrder,
  adminGetOrders,
  adminUpdateOrderStatus,
  adminGetUsers,
};

export type Apis = {
  [K in keyof ApiSpec]: (
    params: ApiSpec[K]["req"],
    req: ApiRequest
  ) => Promise<ApiSpec[K]["res"]>;
};
