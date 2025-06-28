import { getMe } from "./apis/getMe";
import { loginWithGoogle } from "./apis/loginWithGoogle";
import { loginWithTwitter } from "./apis/loginWithTwitter";

export const routes = {
  getMe,
  loginWithGoogle,
  loginWithTwitter,
} as const;