import type { ApiSpec } from "@shared/apiSpec";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

type ApiEndpoint = keyof ApiSpec;
type ApiRequest<T extends ApiEndpoint> = ApiSpec[T]["req"];
type ApiResponse<T extends ApiEndpoint> = ApiSpec[T]["res"];
type ApiSuccessResponse<T extends ApiEndpoint> = ApiResponse<T>;
type Api = {
  [K in ApiEndpoint]: (params: ApiRequest<K>) => Promise<ApiSuccessResponse<K>>;
};

async function apiRequest<T extends ApiEndpoint>(
  endpoint: T,
  data: ApiRequest<T>
): Promise<ApiSuccessResponse<T>> {
  const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as ApiSuccessResponse<T>;
}

export const api: Api = new Proxy({} as Api, {
  get: (_target, key) => (params: ApiRequest<ApiEndpoint>) =>
    apiRequest(key as ApiEndpoint, params),
});
