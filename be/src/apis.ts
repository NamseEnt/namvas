import { isLoggedIn } from "./session/isLoggedIn";
import { ApiRequest } from "./types";

export const apis: Apis = {
  me: async ({}, req) => {
    if (await isLoggedIn(req)) {
      return {
        ok: true,
      };
    }

    return {
      ok: false,
      error: "NOT_LOGGED_IN",
    };
  },
};

type ApiSpec = {
  me: {
    req: {};
    res:
      | { ok: true }
      | {
          ok: false;
          error: "NOT_LOGGED_IN";
        };
  };
};
type Apis = {
  [K in keyof ApiSpec]: (
    params: ApiSpec[K]["req"],
    req: ApiRequest
  ) => Promise<ApiSpec[K]["res"]>;
};
