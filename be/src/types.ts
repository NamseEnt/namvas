import type { ApiSpec } from "shared";

export type ApiHandler<T extends keyof ApiSpec> = (
  body: ApiSpec[T]["req"],
  req: { cookies: Map<string, string> }
) => Promise<ApiSpec[T]["res"]>;

export type Environment = "development" | "production";

export interface ApiContext {
  environment: Environment;
  isProduction: boolean;
}