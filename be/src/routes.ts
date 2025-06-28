import { getMe } from "./apis/getMe";
import { loginWithGoogle } from "./apis/loginWithGoogle";
import { loginWithTwitter } from "./apis/loginWithTwitter";
import { createOrder } from "./apis/createOrder";

export const routes = {
  getMe,
  loginWithGoogle,
  loginWithTwitter,
  createOrder,
} as const;