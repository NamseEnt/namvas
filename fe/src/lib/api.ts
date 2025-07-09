import type { ApiSpec } from "../../../shared/apiSpec";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

type ApiEndpoint = keyof ApiSpec;
type ApiRequest<T extends ApiEndpoint> = ApiSpec[T]["req"];
type ApiResponse<T extends ApiEndpoint> = ApiSpec[T]["res"];
type ApiSuccessResponse<T extends ApiEndpoint> = Extract<
  ApiResponse<T>,
  { ok: true }
>;

async function apiRequest<T extends ApiEndpoint>(
  endpoint: T,
  data: ApiRequest<T>
): Promise<ApiSuccessResponse<T>> {
  console.log("VITE_API_URL", import.meta.env);
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

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.reason);
  }

  return result as ApiSuccessResponse<T>;
}

// Auth APIs
export const authApi = {
  getMe: (): Promise<ApiSuccessResponse<"getMe">> => apiRequest("getMe", {}),
  logout: (): Promise<ApiSuccessResponse<"logOut">> => apiRequest("logOut", {}),
  loginWithGoogle: (
    authorizationCode: string
  ): Promise<ApiSuccessResponse<"loginWithGoogle">> =>
    apiRequest("loginWithGoogle", { authorizationCode }),
  loginWithTwitter: (
    authorizationCode: string,
    codeVerifier: string
  ): Promise<ApiSuccessResponse<"loginWithTwitter">> =>
    apiRequest("loginWithTwitter", { authorizationCode, codeVerifier }),
  loginDev: (identifier: string): Promise<ApiSuccessResponse<"loginDev">> =>
    apiRequest("loginDev", { identifier }),
};

// User APIs
export const userApi = {
  getOriginalImageUploadUrl: (
    contentLength: number
  ): Promise<ApiSuccessResponse<"getOriginalImageUploadUrl">> =>
    apiRequest("getOriginalImageUploadUrl", { contentLength }),
  createOrder: (
    params: ApiRequest<"createOrder">
  ): Promise<ApiSuccessResponse<"createOrder">> =>
    apiRequest("createOrder", params),
  listMyOrders: (
    params: ApiRequest<"listMyOrders">
  ): Promise<ApiSuccessResponse<"listMyOrders">> =>
    apiRequest("listMyOrders", params),
  cancelOrder: (orderId: string): Promise<ApiSuccessResponse<"cancelOrder">> =>
    apiRequest("cancelOrder", { orderId }),
  newArtwork: (
    params: ApiRequest<"newArtwork">
  ): Promise<ApiSuccessResponse<"newArtwork">> =>
    apiRequest("newArtwork", params),
  listMyArtworks: (
    params: ApiRequest<"listMyArtworks">
  ): Promise<ApiSuccessResponse<"listMyArtworks">> =>
    apiRequest("listMyArtworks", params),
  updateArtwork: (
    params: ApiRequest<"updateArtwork">
  ): Promise<ApiSuccessResponse<"updateArtwork">> =>
    apiRequest("updateArtwork", params),
  deleteArtwork: (
    artworkId: string
  ): Promise<ApiSuccessResponse<"deleteArtwork">> =>
    apiRequest("deleteArtwork", { artworkId }),
  duplicateArtwork: (
    artworkId: string,
    title: string
  ): Promise<ApiSuccessResponse<"duplicateArtwork">> =>
    apiRequest("duplicateArtwork", { artworkId, title }),
};

export const oauthApi = {
  loginWithTwitter: authApi.loginWithTwitter,
  loginWithGoogle: authApi.loginWithGoogle,
};
