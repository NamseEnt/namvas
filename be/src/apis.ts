import { ApiSpec } from "shared";
import { isLoggedIn } from "./session/isLoggedIn";
import { ApiRequest } from "./types";

export const apis: Apis = {
  getMe: async ({}, req) => {
    throw new Error("not implemented");
  },
  loginWithGoogle: async ({}, req) => {
    throw new Error("not implemented");
  },
  loginWithTwitter: async ({}, req) => {
    throw new Error("not implemented");
  },
  getTextureUploadUrl: async ({}, req) => {
    throw new Error("not implemented");
  },
  createOrder: async ({}, req) => {
    throw new Error("not implemented");
  },
  getOrders: async ({}, req) => {
    throw new Error("not implemented");
  },
  cancelOrder: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminLogin: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminGetMe: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminGetDashboard: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminGetOrders: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminGetOrderDetail: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminUpdateOrderStatus: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminGetUsers: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminGetUserDetail: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminGetSiteSettings: async ({}, req) => {
    throw new Error("not implemented");
  },
  adminUpdateSiteSettings: async ({}, req) => {
    throw new Error("not implemented");
  },
};

type Apis = {
  [K in keyof ApiSpec]: (
    params: ApiSpec[K]["req"],
    req: ApiRequest
  ) => Promise<ApiSpec[K]["res"]>;
};
