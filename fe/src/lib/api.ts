import type { ApiSpec } from '../../../shared/apiSpec';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

type ApiEndpoint = keyof ApiSpec;
type ApiRequest<T extends ApiEndpoint> = ApiSpec[T]['req'];
type ApiResponse<T extends ApiEndpoint> = ApiSpec[T]['res'];
type ApiSuccessResponse<T extends ApiEndpoint> = Extract<ApiResponse<T>, { ok: true }>;

async function apiRequest<T extends ApiEndpoint>(
  endpoint: T,
  data: ApiRequest<T>
): Promise<ApiSuccessResponse<T>> {
  const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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
  getMe: (): Promise<ApiSuccessResponse<'getMe'>> => apiRequest('getMe', {}),
  logout: (): Promise<ApiSuccessResponse<'logOut'>> => apiRequest('logOut', {}),
  loginWithGoogle: (authorizationCode: string): Promise<ApiSuccessResponse<'loginWithGoogle'>> => 
    apiRequest('loginWithGoogle', { authorizationCode }),
  loginWithTwitter: (authorizationCode: string, codeVerifier: string): Promise<ApiSuccessResponse<'loginWithTwitter'>> => 
    apiRequest('loginWithTwitter', { authorizationCode, codeVerifier }),
};

// User APIs
export const userApi = {
  getOriginalImageUploadUrl: (contentLength: number): Promise<ApiSuccessResponse<'getOriginalImageUploadUrl'>> => 
    apiRequest('getOriginalImageUploadUrl', { contentLength }),
  createOrder: (order: ApiRequest<'createOrder'>['order']): Promise<ApiSuccessResponse<'createOrder'>> => 
    apiRequest('createOrder', { order }),
  getMyOrders: (): Promise<ApiSuccessResponse<'getMyOrders'>> => 
    apiRequest('getMyOrders', {}),
  cancelOrder: (orderId: string): Promise<ApiSuccessResponse<'cancelOrder'>> => 
    apiRequest('cancelOrder', { orderId }),
  newArtwork: (params: ApiRequest<'newArtwork'>): Promise<ApiSuccessResponse<'newArtwork'>> => 
    apiRequest('newArtwork', params),
  queryArtworksOfUser: (params: ApiRequest<'queryArtworksOfUser'>): Promise<ApiSuccessResponse<'queryArtworksOfUser'>> => 
    apiRequest('queryArtworksOfUser', params),
  updateArtwork: (params: ApiRequest<'updateArtwork'>): Promise<ApiSuccessResponse<'updateArtwork'>> => 
    apiRequest('updateArtwork', params),
  deleteArtwork: (artworkId: string): Promise<ApiSuccessResponse<'deleteArtwork'>> => 
    apiRequest('deleteArtwork', { artworkId }),
  duplicateArtwork: (artworkId: string, title: string): Promise<ApiSuccessResponse<'duplicateArtwork'>> => 
    apiRequest('duplicateArtwork', { artworkId, title }),
};

// Admin APIs
export const adminApi = {
  getDashboard: (): Promise<ApiSuccessResponse<'adminGetDashboard'>> => 
    apiRequest('adminGetDashboard', {}),
  getOrders: (params: ApiRequest<'adminGetOrders'>): Promise<ApiSuccessResponse<'adminGetOrders'>> => 
    apiRequest('adminGetOrders', params),
  getOrder: (orderId: string): Promise<ApiSuccessResponse<'adminGetOrder'>> => 
    apiRequest('adminGetOrder', { orderId }),
  updateOrderStatus: (orderId: string, status: ApiRequest<'adminUpdateOrderStatus'>['status'], adminMemo: string): Promise<ApiSuccessResponse<'adminUpdateOrderStatus'>> => 
    apiRequest('adminUpdateOrderStatus', { orderId, status, adminMemo }),
  getUsers: (params: ApiRequest<'adminGetUsers'>): Promise<ApiSuccessResponse<'adminGetUsers'>> => 
    apiRequest('adminGetUsers', params),
};

// Legacy compatibility aliases
export const dashboardApi = {
  getDashboard: adminApi.getDashboard,
};

export const orderApi = {
  getOrders: adminApi.getOrders,
  getOrderDetail: adminApi.getOrder,
  updateOrderStatus: (data: { orderId: string; status?: ApiRequest<'adminUpdateOrderStatus'>['status']; adminMemo?: string }) =>
    adminApi.updateOrderStatus(data.orderId, data.status!, data.adminMemo || ''),
};

export const settingsApi = {
  getSiteSettings: async () => {
    // This endpoint is not in the API spec, so keeping the old implementation
    const response = await fetch(`${API_BASE_URL}/api/adminGetSiteSettings`, {
      credentials: 'include',
    });
    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || 'Failed to get site settings');
    }
    return result.data;
  },

  updateSiteSettings: async (settings: any) => {
    // This endpoint is not in the API spec, so keeping the old implementation
    const response = await fetch(`${API_BASE_URL}/api/adminUpdateSiteSettings`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || 'Failed to update site settings');
    }
    return result.data;
  },
};

export const oauthApi = {
  loginWithTwitter: authApi.loginWithTwitter,
  loginWithGoogle: authApi.loginWithGoogle,
};