import type { ApiSpec } from "shared";

export type ApiHandler<T extends keyof ApiSpec> = (
  req: ApiSpec[T]["req"]
) => Promise<ApiSpec[T]["res"]>;

export type Environment = "development" | "production";

export interface ApiContext {
  environment: Environment;
  isProduction: boolean;
}