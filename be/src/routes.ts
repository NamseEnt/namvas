import { getMe } from "./handlers/getMe";
import { loginWithGoogle } from "./handlers/loginWithGoogle";

export const routes = {
  getMe,
  loginWithGoogle,
} as const;