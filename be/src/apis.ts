// IMPORTANT: Any API implementation must be implemented in a separate file in the api/ directory
// NOTE: Use dynamic imports for all API modules to improve performance and reduce bundle size
import { ApiSpec } from "shared";
import { ApiRequest } from "./types";

export const apis: Apis = new Proxy({} as Apis, {
  get: async (_target, prop) => {
    const module = await import(`./api/${prop as string}.ts`);
    return module[prop];
  },
});

export type Apis = {
  [K in keyof ApiSpec]: (
    params: ApiSpec[K]["req"],
    req: ApiRequest
  ) => Promise<ApiSpec[K]["res"]>;
};
